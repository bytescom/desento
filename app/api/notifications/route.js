import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

// GET — latest notifications for the logged-in user (+ unread count)
export async function GET() {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(30).lean(),
            Notification.countDocuments({ userId: user._id, isRead: false }),
        ]);

        return NextResponse.json({
            notifications: notifications.map(n => ({
                id: n._id.toString(),
                title: n.title,
                message: n.message,
                type: n.type,
                icon: n.icon,
                isRead: n.isRead,
                link: n.link || null,
                createdAt: n.createdAt,
            })),
            unreadCount,
        });
    } catch (error) {
        console.error('GET /api/notifications error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH — mark all (or one) notification as read
export async function PATCH(request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json().catch(() => ({}));
        const filter = { userId: user._id, ...(body?.id ? { _id: body.id } : {}) };

        await Notification.updateMany(filter, { isRead: true });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PATCH /api/notifications error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE — clear all (or one) notification
export async function DELETE(request) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json().catch(() => ({}));
        const filter = { userId: user._id, ...(body?.id ? { _id: body.id } : {}) };

        await Notification.deleteMany(filter);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/notifications error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
