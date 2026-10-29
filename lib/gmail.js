import { connectDB } from "@/lib/db";
import User from "@/models/User.js";

/**
 * Returns a valid access token for the given userId,
 * refreshing it from Google if it has expired.
 */
export async function getValidAccessToken(userId) {
  await connectDB();
  const user = await User.findById(userId);

  if (!user || !user.refreshToken) {
    throw new Error("Gmail not connected or refresh token missing.");
  }

  if (new Date() < new Date(user.tokenExpiry)) {
    return user.accessToken; // still valid
  }

  // expired — use refreshToken to get a new one from Google
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: user.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Failed to refresh access token. User must re-login.");
  }

  user.accessToken = data.access_token;
  user.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
  await user.save();

  return user.accessToken;
}

/**
 * Personalise a template string by replacing {{variable}} tokens with lead data.
 */
export function personalise(template, lead) {
  if (!template) return "";
  return template
    .replace(/\{\{name\}\}/gi, lead.hrName || "there")
    .replace(/\{\{company\}\}/gi, lead.company || "")
    .replace(/\{\{job_role\}\}/gi, lead.jobRole || "")
    .replace(/\{\{location\}\}/gi, lead.location || "")
    .replace(/\{\{industry\}\}/gi, lead.industry || "");
}

/**
 * Validate an email address (also guards against header injection —
 * CR/LF and angle brackets would let a crafted "email" add extra headers).
 */
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  if (/[\r\n<>]/.test(email)) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email.trim()) && email.trim().length <= 254;
}

/**
 * Validate a To/From header value. Accepts a plain address or the RFC 2822
 * display-name form `Name <addr>`, rejects CR/LF and malformed addresses.
 * Returns the sanitized header value.
 */
function validateAddressHeader(value, field) {
  const str = String(value || "");
  if (/[\r\n]/.test(str)) {
    throw new Error(`Invalid ${field} header (control characters)`);
  }
  const match = str.match(/^(.*?)<([^>]+)>\s*$/);
  if (match) {
    const displayName = match[1].trim().replace(/["\\]/g, "");
    const addr = match[2].trim();
    if (!isValidEmail(addr)) {
      throw new Error(`Invalid email address in ${field}: ${JSON.stringify(str)}`);
    }
    return displayName ? `${displayName} <${addr}>` : addr;
  }
  if (!isValidEmail(str)) {
    throw new Error(`Invalid email address in ${field}: ${JSON.stringify(str)}`);
  }
  return str.trim();
}

/**
 * Encode an email into RFC 2822 base64url format for the Gmail API.
 * `to`/`from` are validated — plain addresses or `Name <addr>` form.
 * `attachments` (optional): [{ name, contentType, data }] where data is base64.
 */
export function makeRawEmail({ to, from, subject, body, attachments = [] }) {
  const toHeader = validateAddressHeader(to, "To");
  const fromHeader = validateAddressHeader(from, "From");

  const safeBody = Buffer.from(body).toString("base64");
  let message;

  if (attachments.length) {
    const boundary = "desento-campaign-boundary-42";
    const parts = [
      `From: ${fromHeader}`,
      `To: ${toHeader}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      safeBody,
    ];
    for (const att of attachments) {
      const filename = String(att.name || "attachment").replace(/[\r\n"\\]/g, "");
      parts.push(
        `--${boundary}`,
        `Content-Type: ${att.contentType || "application/octet-stream"}; name="${filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${filename}"`,
        "",
        String(att.data || "").replace(/\s+/g, "")
      );
    }
    parts.push(`--${boundary}--`);
    message = parts.join("\r\n");
  } else {
    message = [
      `From: ${fromHeader}`,
      `To: ${toHeader}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      safeBody,
    ].join("\r\n");
  }

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send one email via the Gmail REST API using a valid access token.
 * @returns {{ id: string, threadId: string }} Gmail message data
 */
export async function sendGmailMessage({ accessToken, to, from, subject, body }) {
  const raw = makeRawEmail({ to, from, subject, body });

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Gmail API error ${res.status}: ${err?.error?.message || res.statusText}`
    );
  }

  return res.json();
}