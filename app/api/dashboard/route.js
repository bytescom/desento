import { NextResponse } from 'next/server';
import { authOptions, auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Application from '@/models/Application';
import EmailLog from '@/models/EmailLog';
import HrEmail from '@/models/HrEmail';
import FollowUp from '@/models/FollowUp';

export async function GET(request) {
    try {
        await connectDB();
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email }).lean();
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userId = user._id;

        // Pagination params
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
        const skip = (page - 1) * limit;

        // 7-day window
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // ── Aggregate app status counts (all-time, for stats + overview) ──
        const appStats = await Application.aggregate([
            { $match: { userId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusMap = { sent: 0, 'follow-up-sent': 0, replied: 0, interview: 0, rejected: 0, closed: 0 };
        appStats.forEach(s => {
            if (statusMap[s._id] !== undefined) statusMap[s._id] = s.count;
        });

        // ── Four top stats ───────────────────────────────────────────────
        const totalLeads     = await HrEmail.countDocuments({ userId });
        const totalSent      = statusMap['sent'] + statusMap['follow-up-sent'];
        const followUpsSent  = await FollowUp.countDocuments({ userId, status: 'sent' });
        const goodReplies    = await Application.countDocuments({
            userId,
            replyType: { $in: ['positive', 'interview'] },
        });

        // ── Total emails sent (all-time) for overview chart ──────────────
        const totalEmailsSent = await EmailLog.countDocuments({ userId, status: 'sent' });

        // ── Activity log: last-7-days applications with pagination ───────
        const activityFilter = {
            userId,
            lastActionDate: { $gte: sevenDaysAgo },
        };

        const [totalActivity, recentApplications] = await Promise.all([
            Application.countDocuments(activityFilter),
            Application.find(activityFilter)
                .sort({ lastActionDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        const totalPages = Math.ceil(totalActivity / limit);

        const activityLog = recentApplications.map(app => ({
            id: app._id.toString(),
            company: app.companyName || 'Unknown Company',
            role: app.role || 'Role not specified',
            logo: (app.companyName || 'U').charAt(0).toUpperCase(),
            hrEmail: app.hrEmail,
            hrName: app.hrName || '',
            status: app.status,
            replyType: app.replyType,
            replyConfidence: app.replyConfidence ?? null,
            lastReplyPreview: app.lastReplyPreview || null,
            notes: app.notes || '',
            followUpCount: app.followUpCount || 0,
            followUpDate: app.followUpDate ? app.followUpDate.toISOString() : null,
            lastActionDate: app.lastActionDate ? app.lastActionDate.toISOString() : null,
            sentDate: new Date(app.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            }),
            createdAt: app.createdAt ? app.createdAt.toISOString() : null,
        }));

        // ── Activity overview bar chart ───────────────────────────────────
        const sentCount      = statusMap['sent'] + statusMap['follow-up-sent'];
        const repliedCount   = statusMap['replied'];
        const interviewCount = statusMap['interview'];
        const total          = sentCount + repliedCount + interviewCount || 1;

        const overview = {
            sent:         sentCount,
            replied:      repliedCount,
            interviews:   interviewCount,
            sentPct:      Math.round((sentCount / total) * 100),
            repliedPct:   Math.round((repliedCount / total) * 100),
            interviewPct: Math.round((interviewCount / total) * 100),
            // Same source as the chart above (Application statuses) — counting
            // EmailLogs here desyncs the "total" line from the Sent/Replied bars
            // for data created before send-logging existed.
            total:        sentCount,
        };

        const stats = { totalLeads, totalSent, followUpsSent, goodReplies };

        return NextResponse.json({
            stats,
            activityLog,
            pagination: { page, limit, totalActivity, totalPages },
            overview,
            user: { name: user.name, email: user.email, image: user.image },
        });
    } catch (error) {
        console.error('GET /api/dashboard error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
