import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Campaign from "@/models/Campaign";
import HrEmail from "@/models/HrEmail";
import Application from "@/models/Application";
import EmailLog from "@/models/EmailLog";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { getValidAccessToken, personalise, sendGmailMessage } from "@/lib/gmail";

const DELAY_MS = 1500; // 1.5 s between emails — keeps under Gmail rate limits
// Max emails attempted per HTTP request. The client re-POSTs while status is
// "Running", so large campaigns send in batches without hitting serverless
// execution timeouts (which would leave the campaign stuck in "Running").
const MAX_BATCH_PER_REQUEST = 25;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Statuses a new send may downgrade to "follow-up-sent". Outcomes such as
// replied/interview/rejected/closed are never overwritten by later campaigns.
const ACTIVE_APP_STATUSES = ["sent", "follow-up-sent"];

/**
 * Persist a successful send:
 *  1. EmailLog row — audit trail; powers "total emails sent" dashboard stats.
 *  2. Application  — powers the Tracking page. The first email to an HR
 *     creates the record; later emails to the same HR count as follow-ups.
 */
async function recordSentEmail({ user, campaign, lead, subject, body, gmailResult }) {
    const now = new Date();

    const emailLog = await EmailLog.create({
        userId: user._id,
        templateId: campaign.templateId,
        campaignId: campaign._id,
        hrEmailId: lead._id,
        recipient: lead.email,
        subject,
        body,
        status: "sent",
        gmailMessageId: gmailResult?.id,
        gmailThreadId: gmailResult?.threadId,
        sentAt: now,
    });

    const existingApp = await Application.findOne(
        { userId: user._id, hrEmail: lead.email },
        { _id: 1, status: 1 }
    ).lean();

    if (!existingApp) {
        await Application.create({
            userId: user._id,
            companyName: lead.company || "",
            role: lead.jobRole || "",
            hrName: lead.hrName || "",
            hrEmail: lead.email,
            emailLogId: emailLog._id,
            hrEmailId: lead._id,
            gmailThreadId: gmailResult?.threadId,
            lastEmailId: gmailResult?.id,
            status: "sent",
            lastActionDate: now,
        });
        return;
    }

    await Application.updateOne(
        { _id: existingApp._id },
        {
            $set: {
                emailLogId: emailLog._id,
                lastActionDate: now,
                ...(gmailResult?.threadId && { gmailThreadId: gmailResult.threadId }),
                ...(gmailResult?.id && { lastEmailId: gmailResult.id }),
                // Only downgrade still-active applications; never overwrite
                // replies/interviews/rejections with "follow-up-sent".
                ...(ACTIVE_APP_STATUSES.includes(existingApp.status) && { status: "follow-up-sent" }),
            },
            $inc: { followUpCount: 1 },
        }
    );
}

// POST /api/outreach/campaigns/[id]/send
// Sends the campaign emails via Gmail API and updates progress in DB.
export async function POST(request, { params }) {
    try {
        const { id } = await params; // Next.js 15: dynamic params are a Promise
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();

        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (!user.refreshToken) {
            return NextResponse.json(
                { error: "Gmail not connected. Please sign out and sign in again to grant Gmail access." },
                { status: 403 }
            );
        }

        // Load campaign (must belong to this user)
        const campaign = await Campaign.findOne({ _id: id, userId: user._id });
        if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

        if (!campaign.templateSnapshot?.subject || !campaign.templateSnapshot?.body) {
            return NextResponse.json({ error: "Campaign has no email template set." }, { status: 400 });
        }

        if (!campaign.audienceIds?.length) {
            return NextResponse.json({ error: "Campaign has no audience selected." }, { status: 400 });
        }

        // Mark as Running immediately (resume keeps existing progress)
        const firstRun = campaign.status !== "Running";
        campaign.status = "Running";
        if (firstRun) {
            campaign.launchedAt = campaign.launchedAt || new Date();
            campaign.sentCount = 0;
            campaign.sentLeadIds = [];
        }
        await campaign.save();

        // Fetch audience leads not yet attempted (sentLeadIds survives restarts)
        const attempted = campaign.sentLeadIds || [];
        const allLeads = await HrEmail.find({
            _id: { $in: campaign.audienceIds, $nin: attempted },
            userId: user._id,
        }).lean();

        // Cap work per request so we finish well inside serverless execution
        // limits; the client re-POSTs while status is "Running" to send the
        // next batch.
        const batch = allLeads.slice(0, MAX_BATCH_PER_REQUEST);

        if (!batch.length) {
            // Nothing left to attempt — finalise
            const finalStatus = campaign.sentCount > 0 || attempted.length > 0 ? "Completed" : "Failed";
            campaign.status = finalStatus;
            campaign.totalRecipients = attempted.length;
            campaign.completedAt = new Date();
            await campaign.save();
            return NextResponse.json({
                success: finalStatus === "Completed",
                sent: campaign.sentCount,
                total: attempted.length,
                failed: Math.max(0, attempted.length - campaign.sentCount),
                status: finalStatus,
            });
        }

        const fromAddress = `${user.name} <${user.email}>`;
        let sentCount = campaign.sentCount || 0;
        const failedEmails = [];
        const processedIds = [];

        // Get a fresh access token once (will refresh if needed)
        let accessToken = await getValidAccessToken(user._id);

        try {
            for (const lead of batch) {
                let delivered = false;
                try {
                    const subject = personalise(campaign.templateSnapshot.subject, lead);
                    const body = personalise(campaign.templateSnapshot.body, lead);

                    const gmailResult = await sendGmailMessage({
                        accessToken,
                        to: lead.email,
                        from: fromAddress,
                        subject,
                        body,
                        attachments: (campaign.attachments || []).map(a => ({ name: a.name, contentType: a.contentType, data: a.data })),
                    });

                    delivered = true;

                    // Persist the send so Tracking/Dashboard reflect it. A tracking
                    // write failure must not mark the email itself as failed.
                    try {
                        await recordSentEmail({ user, campaign, lead, subject, body, gmailResult });
                    } catch (trackErr) {
                        console.error(`Sent to ${lead.email} but failed to record it:`, trackErr.message);
                    }

                    // Throttle between sends
                    await sleep(DELAY_MS);
                } catch (sendErr) {
                    console.error(`Failed to send to ${lead.email}:`, sendErr.message);
                    failedEmails.push({ email: lead.email, error: sendErr.message });

                    // If Gmail returns 401 (token expired mid-send), refresh and retry once
                    if (sendErr.message?.includes("401")) {
                        try {
                            accessToken = await getValidAccessToken(user._id);
                            const subject = personalise(campaign.templateSnapshot.subject, lead);
                            const body = personalise(campaign.templateSnapshot.body, lead);
                            const retryResult = await sendGmailMessage({ accessToken, to: lead.email, from: fromAddress, subject, body, attachments: (campaign.attachments || []).map(a => ({ name: a.name, contentType: a.contentType, data: a.data })) });
                            delivered = true;
                            try {
                                await recordSentEmail({ user, campaign, lead, subject, body, gmailResult: retryResult });
                            } catch (trackErr) {
                                console.error(`Sent to ${lead.email} but failed to record it:`, trackErr.message);
                            }
                            await sleep(DELAY_MS);
                        } catch (retryErr) {
                            console.error(`Retry failed for ${lead.email}:`, retryErr.message);
                            failedEmails.push({ email: lead.email, error: retryErr.message });
                        }
                    }
                } finally {
                    // Mark lead contacted on success; record the attempt either way
                    // so a permanently failing lead can't loop forever.
                    if (delivered) {
                        sentCount++;
                        await HrEmail.findByIdAndUpdate(lead._id, {
                            status: "contacted",
                            lastContacted: new Date(),
                        }).catch(() => {});
                    }
                    processedIds.push(lead._id);
                }
            }
        } finally {
            // Persist progress no matter what — a crashed batch must never leave
            // progress unrecorded or retry already-sent leads.
            campaign.sentCount = sentCount;
            campaign.sentLeadIds = [...(campaign.sentLeadIds || []), ...processedIds];
            campaign.totalRecipients = (campaign.sentLeadIds || []).length;

            const remaining = campaign.audienceIds.filter(
                (aid) => !(campaign.sentLeadIds || []).some((sid) => sid.equals?.(aid) || String(sid) === String(aid))
            ).length;

            if (remaining > 0) {
                campaign.status = "Running"; // client continues with the next batch
            } else {
                campaign.status = campaign.sentCount > 0 ? "Completed" : "Failed";
                campaign.completedAt = new Date();
                // Notify the user their campaign finished (real Notification record)
                try {
                    await Notification.create({
                        userId: user._id,
                        userEmail: user.email,
                        title: campaign.status === "Completed" ? `Campaign "${campaign.name}" completed` : `Campaign "${campaign.name}" failed`,
                        message: campaign.status === "Completed"
                            ? `${sentCount} of ${campaign.totalRecipients} emails were sent successfully.`
                            : `No emails could be sent. Check your Gmail connection and try again.`,
                        type: "campaign",
                        icon: "Send",
                        link: "/dashboard/outreach",
                    });
                } catch (notifErr) {
                    console.error("Failed to create campaign notification:", notifErr.message);
                }
            }
            await campaign.save();
        }

        const finalStatus = campaign.status;
        const remaining = campaign.audienceIds.length - campaign.sentLeadIds.length;

        return NextResponse.json({
            success: true,
            sent: sentCount,
            total: campaign.totalRecipients,
            failed: failedEmails.length,
            status: finalStatus,
            ...(remaining > 0 && { remaining, nextBatch: true }),
            ...(failedEmails.length > 0 && { failedEmails }),
        });
    } catch (error) {
        console.error("POST /api/outreach/campaigns/[id]/send error:", error);
        // Never leave the campaign stuck in "Running" after an unexpected error
        try {
            const campaign = await Campaign.findById(id);
            if (campaign && campaign.status === "Running") {
                campaign.status = "Failed";
                campaign.completedAt = new Date();
                await campaign.save();
            }
        } catch {}
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
