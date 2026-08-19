import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminUser } from "@/lib/admin-auth";
import { cleanText, distributedRateLimit, readJson, validEmail, validUuid } from "@/lib/security/http";
import { logAdminSecurityEvent } from "@/lib/security/audit";

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: `email-reply-send:${identity.id}`, limit: 30, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request, 40_000);
    const to = cleanText(body.to, 254).toLowerCase();
    const subject = cleanText(body.subject, 300);
    const reply = cleanText(body.reply, 20_000);
    const draftId = cleanText(body.draftId, 80);
    const inquiryId = cleanText(body.inquiryId, 80);
    if (!validEmail(to) || !subject || !reply) return NextResponse.json({ error: "Recipient, subject and reply are required." }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM;
    if (!apiKey || !from) return NextResponse.json({ error: "Email service is unavailable." }, { status: 503 });

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#222;max-width:720px;margin:auto">${reply.split("\n").map((line) => `<p>${esc(line) || "&nbsp;"}</p>`).join("")}</div>`,
    });
    if (result.error) return NextResponse.json({ error: "Email could not be sent." }, { status: 502 });

    if (draftId && validUuid(draftId)) await client.from("email_reply_drafts").update({ status: "sent", updated_at: new Date().toISOString() }).eq("id", draftId);
    await client.from("b2b_activities").insert({
      activity_type: "email_reply_sent",
      module: "Email Reply Assistant",
      record_id: inquiryId || draftId || "",
      title: `Buyer reply sent to ${to}`,
      description: subject,
      actor_id: identity.id,
      actor_email: identity.email,
    });
    await logAdminSecurityEvent(client, identity, "email_reply_sent", { draft_id: validUuid(draftId) ? draftId : null, inquiry_id: inquiryId || null });
    return NextResponse.json({ success: true, id: result.data?.id || null });
  } catch (error) {
    if (error instanceof Response) return error;
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 500;
    return NextResponse.json({ error: status === 413 ? "Request is too large." : "Email could not be sent." }, { status });
  }
}
