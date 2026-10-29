import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Campaign from "@/models/Campaign";
import User from "@/models/User";

const CAMPAIGN_STATUSES = ["Draft", "Running", "Scheduled", "Completed", "Failed"];

// Fields a client may update — everything else in the request body is ignored.
// Never spread the raw body here: it would allow overwriting userId, sentCount,
// or injecting Mongo operators.
const PATCHABLE_FIELDS = [
    "name",
    "senderEmail",
    "templateId",
    "templateSnapshot",
    "audienceIds",
    "attachments",
    "trackOpens",
    "trackReplies",
    "stopAfterReply",
    "status",
];

// GET — fetch single campaign
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { id } = await params;
        if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });

        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const campaign = await Campaign.findOne({ _id: id, userId: user._id }).lean();
        if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

        return NextResponse.json({ campaign });
    } catch (error) {
        console.error("GET /api/outreach/campaigns/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH — update a campaign (edit, launch, duplicate)
export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { id } = await params;
        if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });

        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await request.json();

        const update = { updatedAt: new Date() };
        for (const field of PATCHABLE_FIELDS) {
            if (body[field] !== undefined) update[field] = body[field];
        }
        if (update.attachments !== undefined) {
            update.attachments = (Array.isArray(update.attachments) ? update.attachments : [])
                .map(a => ({
                    name: String(a?.name || "").replace(/[\r\n"\\]/g, "").slice(0, 200),
                    size: String(a?.size || "").slice(0, 20),
                    contentType: String(a?.contentType || "application/octet-stream").slice(0, 100),
                    ...(typeof a?.data === "string" && a.data.length <= 6_000_000 ? { data: a.data } : {}),
                }))
                .filter(a => a.name);
        }

        if (update.status !== undefined && !CAMPAIGN_STATUSES.includes(update.status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }
        // launchedAt is server-controlled, set only when launching
        if (update.status === "Running") {
            update.launchedAt = new Date();
        } else {
            delete update.launchedAt;
        }

        const campaign = await Campaign.findOneAndUpdate(
            { _id: id, userId: user._id },
            update,
            { new: true }
        );

        if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

        return NextResponse.json({ campaign });
    } catch (error) {
        console.error("PATCH /api/outreach/campaigns/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE — delete a campaign
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await connectDB();
        const { id } = await params;
        if (!isValidObjectId(id)) return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });

        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const campaign = await Campaign.findOneAndDelete({ _id: id, userId: user._id });
        if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/outreach/campaigns/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
