import { NextResponse } from "next/server";
import { authOptions, auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Campaign from "@/models/Campaign";
import User from "@/models/User";
import mongoose from "mongoose";

const CAMPAIGN_STATUSES = ["Draft", "Running", "Scheduled", "Completed", "Failed"];

// Keep only safe, size-capped attachment fields (base64 data is capped to
// ~4.5 MB per file so a single request can't blow past Mongo's 16 MB doc limit)
function sanitizeAttachments(attachments) {
    return (Array.isArray(attachments) ? attachments : [])
        .map(a => ({
            name: String(a?.name || "").replace(/[\r\n"\\]/g, "").slice(0, 200),
            size: String(a?.size || "").slice(0, 20),
            contentType: String(a?.contentType || "application/octet-stream").slice(0, 100),
            ...(typeof a?.data === "string" && a.data.length <= 6_000_000 ? { data: a.data } : {}),
        }))
        .filter(a => a.name);
}

// GET — fetch all campaigns for logged-in user
export async function GET() {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const campaigns = await Campaign.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ campaigns });
    } catch (error) {
        console.error("GET /api/outreach/campaigns error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST — create a new campaign
export async function POST(request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await request.json();
        const { name, senderEmail, templateId, templateSnapshot, audienceIds, attachments, trackOpens, trackReplies, stopAfterReply, status } = body;

        if (!name) {
            return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
        }

        const validTemplateId = mongoose.Types.ObjectId.isValid(templateId) ? templateId : null;
        const validAudienceIds = (audienceIds || []).filter(id => mongoose.Types.ObjectId.isValid(id));
        const validStatus = CAMPAIGN_STATUSES.includes(status) ? status : "Draft";

        const campaign = await Campaign.create({
            userId: user._id,
            name: name.trim(),
            senderEmail: senderEmail || '',
            templateId: validTemplateId,
            templateSnapshot: templateSnapshot || {},
            audienceIds: validAudienceIds,
            attachments: sanitizeAttachments(attachments),
            totalRecipients: validAudienceIds.length,
            trackOpens: trackOpens ?? true,
            trackReplies: trackReplies ?? true,
            stopAfterReply: stopAfterReply ?? true,
            status: validStatus,
        });

        return NextResponse.json({ campaign }, { status: 201 });
    } catch (error) {
        console.error("POST /api/outreach/campaigns error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
