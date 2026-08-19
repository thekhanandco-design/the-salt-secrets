import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdminUser } from "@/lib/admin-auth";
import { cleanText, distributedRateLimit, readJson, validEmail, validUuid } from "@/lib/security/http";
import { logAdminSecurityEvent } from "@/lib/security/audit";

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}
function htmlBody(message: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#251f22;max-width:720px;margin:auto"><div style="border-top:4px solid #a51f43;padding-top:24px"><h2 style="font-family:Georgia,serif;color:#17171a">The Salt Origin</h2>${message.split("\n").map((line) => `<p>${esc(line) || "&nbsp;"}</p>`).join("")}<p style="font-size:12px;color:#777;margin-top:30px">You are receiving this because you subscribed to The Salt Origin updates.</p></div></div>`;
}

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: `newsletter-send:${identity.id}`, limit: 4, windowMs: 60 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request, 40_000);
    const subject = cleanText(body.subject, 300);
    const message = cleanText(body.message, 20_000);
    const audience = cleanText(body.audience || "subscribed", 30);
    const campaignId = cleanText(body.campaignId, 80);
    if (!subject || !message) return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    if (!new Set(["subscribed", "confirmed", "all"]).has(audience)) return NextResponse.json({ error: "Invalid newsletter audience." }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM;
    if (!apiKey || !from) return NextResponse.json({ error: "Email service is unavailable." }, { status: 503 });

    let query = client.from("newsletter_subscribers").select("id,email,status,language,source");
    if (audience === "subscribed" || audience === "confirmed") query = query.eq("status", "subscribed");
    const subscribers = await query.limit(1000);
    if (subscribers.error) return NextResponse.json({ error: "Newsletter recipients could not be loaded." }, { status: 500 });
    const recipients = (subscribers.data || []).map((row) => String(row.email || "").trim().toLowerCase()).filter(validEmail);
    if (!recipients.length) return NextResponse.json({ error: "No eligible newsletter subscribers found." }, { status: 409 });

    const resend = new Resend(apiKey);
    let sent = 0;
    let failed = 0;
    for (let index = 0; index < recipients.length; index += 25) {
      const batch = recipients.slice(index, index + 25);
      const results = await Promise.all(batch.map((email) => resend.emails.send({ from, to: email, subject, html: htmlBody(message) })));
      for (const result of results) {
        if (result.error) failed += 1;
        else sent += 1;
      }
    }

    if (campaignId && validUuid(campaignId)) {
      await client.from("marketing_campaigns").update({ status: failed ? "partial" : "completed", updated_at: new Date().toISOString() }).eq("id", campaignId);
    }
    await client.from("b2b_activities").insert({
      activity_type: "newsletter_campaign_sent",
      module: "Newsletter",
      record_id: validUuid(campaignId) ? campaignId : "",
      title: `Newsletter sent to ${sent} subscriber${sent === 1 ? "" : "s"}`,
      description: subject,
      actor_id: identity.id,
      actor_email: identity.email,
      metadata: { sent, failed },
    });
    await logAdminSecurityEvent(client, identity, "newsletter_campaign_sent", { campaign_id: validUuid(campaignId) ? campaignId : null, sent, failed });
    return NextResponse.json({ success: sent > 0, sent, failed });
  } catch (error) {
    if (error instanceof Response) return error;
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 500;
    return NextResponse.json({ error: status === 413 ? "Request is too large." : "Newsletter could not be sent." }, { status });
  }
}
