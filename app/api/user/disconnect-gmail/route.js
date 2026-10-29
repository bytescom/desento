import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

// POST — revoke the Gmail tokens with Google and clear them locally.
// This disconnects Gmail sending WITHOUT ending the app session.
export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Best-effort revocation at Google — the local clear below is what
        // actually gates sending, so a revoke failure shouldn't block it.
        if (user.refreshToken) {
            try {
                await fetch('https://oauth2.googleapis.com/revoke', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ token: user.refreshToken }),
                });
            } catch (e) {
                console.error('Gmail token revoke failed (continuing):', e.message);
            }
        }

        user.accessToken = undefined;
        user.refreshToken = undefined;
        user.tokenExpiry = undefined;
        await user.save();

        return NextResponse.json({ success: true, gmailConnected: false });
    } catch (error) {
        console.error('POST /api/user/disconnect-gmail error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
