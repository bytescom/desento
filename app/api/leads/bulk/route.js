import { NextResponse } from "next/server";
import { authOptions, auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isValidEmail } from "@/lib/gmail";
import HrEmail from "@/models/HrEmail";
import User from "@/models/User";

const MAX_BULK = 500;

// POST — bulk-import leads from a parsed CSV payload.
// Duplicates (same user + email) are skipped, invalid rows reported.
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
        const rows = Array.isArray(body?.leads) ? body.leads : [];
        if (!rows.length) {
            return NextResponse.json({ error: "No leads provided" }, { status: 400 });
        }
        if (rows.length > MAX_BULK) {
            return NextResponse.json({ error: `Import is limited to ${MAX_BULK} rows per file` }, { status: 400 });
        }

        // Validate + normalize
        const valid = [];
        const invalid = [];
        const seen = new Set();
        for (const row of rows) {
            const email = String(row.email || "").trim().toLowerCase();
            const company = String(row.company || "").trim();
            const jobRole = String(row.jobRole || row.role || "").trim();
            if (!isValidEmail(email) || !company || !jobRole) {
                invalid.push({ email: email || "(missing)", reason: !isValidEmail(email) ? "Invalid email" : "Company and role are required" });
                continue;
            }
            if (seen.has(email)) {
                invalid.push({ email, reason: "Duplicate row in file" });
                continue;
            }
            seen.add(email);
            valid.push({
                userId: user._id,
                email,
                company,
                jobRole,
                hrName: String(row.hrName || "").trim(),
                notes: String(row.notes || row.jobDescription || "").trim(),
                tags: Array.isArray(row.tags) ? row.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean) : [],
            });
        }

        if (!valid.length) {
            return NextResponse.json({ imported: 0, duplicates: 0, invalid, total: rows.length });
        }

        // ordered: false — rows that hit the unique {userId, email} index are
        // skipped while everything else still inserts
        let imported = 0;
        let duplicates = 0;
        try {
            const res = await HrEmail.insertMany(valid, { ordered: false });
            imported = res.length;
        } catch (err) {
            if (err.writeErrors) {
                imported = err.result?.insertedCount ?? (valid.length - err.writeErrors.length);
                duplicates = err.writeErrors.filter(e => e.code === 11000).length;
                const other = err.writeErrors.filter(e => e.code !== 11000);
                if (other.length) console.error("Bulk import write errors:", other.length);
            } else {
                throw err;
            }
        }

        return NextResponse.json({ imported, duplicates, invalid, total: rows.length });
    } catch (error) {
        console.error("POST /api/leads/bulk error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
