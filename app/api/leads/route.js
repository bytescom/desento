import { NextResponse } from "next/server";
import { authOptions, auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isValidEmail } from "@/lib/gmail";
import HrEmail from "@/models/HrEmail";
import User from "@/models/User";

// GET — fetch all HR contacts for logged-in user
export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }



        const contacts = await HrEmail.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .lean();



        return NextResponse.json({ contacts });
    } catch (error) {
        console.error("GET /api/leads error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST — create a new HR contact
export async function POST(request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { email, company, jobRole, hrName, jobDescription, tags } = body;

        if (!email || !company || !jobRole) {
            return NextResponse.json(
                { error: "Email, company, and role are required" },
                { status: 400 }
            );
        }

        // Reject malformed / header-injecting addresses before they reach Gmail
        if (!isValidEmail(email)) {
            return NextResponse.json(
                { error: "Please enter a valid email address" },
                { status: 400 }
            );
        }

        const contact = await HrEmail.create({
            userId: user._id,
            email: email.trim(),
            company: company.trim(),
            jobRole: jobRole.trim(),
            hrName: hrName?.trim() || "",
            notes: jobDescription?.trim() || "",
            tags: tags || [],
        });

        return NextResponse.json({ contact }, { status: 201 });
    } catch (error) {
        // Handle duplicate email
        if (error.code === 11000) {
            return NextResponse.json(
                { error: "This HR email already exists in your contacts" },
                { status: 409 }
            );
        }
        console.error("POST /api/leads error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
