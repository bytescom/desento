import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/db';

export async function GET(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findOne({ email: session.user.email })
            .select('name email image settings documents resumes coverLetters refreshToken')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Expose connection state only — never the token itself
        const { refreshToken, ...safeUser } = user;
        return NextResponse.json({ data: { ...safeUser, gmailConnected: !!refreshToken } });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, settings, headline, portfolioLink, experienceSummary, skills } = body;

        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        // Profile enrichment fields (defined in the User settings schema) — accepted
        // nested under `settings` (ProfileTab's payload) or at the top level.
        const profileSrc = settings || {};
        if (profileSrc.headline !== undefined || headline !== undefined) updateFields['settings.headline'] = profileSrc.headline ?? headline;
        if (profileSrc.portfolioLink !== undefined || portfolioLink !== undefined) updateFields['settings.portfolioLink'] = profileSrc.portfolioLink ?? portfolioLink;
        if (profileSrc.experienceSummary !== undefined || experienceSummary !== undefined) updateFields['settings.experienceSummary'] = profileSrc.experienceSummary ?? experienceSummary;
        if (profileSrc.skills !== undefined || skills !== undefined) updateFields['settings.skills'] = profileSrc.skills ?? skills;
        if (settings !== undefined) {
            // Merge settings fields individually, don't overwrite entire settings object
            if (settings.emailDelay !== undefined) updateFields['settings.emailDelay'] = settings.emailDelay;
            if (settings.autoAttachResume !== undefined) updateFields['settings.autoAttachResume'] = settings.autoAttachResume;
            if (settings.theme !== undefined) updateFields['settings.theme'] = settings.theme;
        }
        updateFields.updatedAt = new Date();

        const updatedUser = await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: updateFields },
            { new: true }
        ).select('name email image settings').lean();

        return NextResponse.json({ success: true, data: updatedUser });
    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
