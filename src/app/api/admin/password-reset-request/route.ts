import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { cleanText, rateLimit, readJson, sameOrigin, validEmail } from "@/lib/security/http";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ success: false }, { status: 403 });
    const limited = rateLimit(request, { key: "admin-password-reset", limit: 3, windowMs: 30 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request);
    const email = cleanText(body.email, 254).toLowerCase();
    if (!validEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "Password recovery is not configured." }, { status: 503 });
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: users } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = users?.users?.find(item => String(item.email || "").toLowerCase() === email);
    if (user) {
      const existing = await client.from("b2b_activities").select("id").eq("module", "Authentication").eq("activity_type", "password_reset_request").contains("metadata", { email, status: "pending" }).limit(1).maybeSingle();
      if (!existing.data) {
        await client.from("b2b_activities").insert({ activity_type: "password_reset_request", module: "Authentication", record_id: user.id, title: `Password reset requested: ${email}`, description: "Awaiting administrator approval", metadata: { email, status: "pending", requested_at: new Date().toISOString() } });
      }
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const to = process.env.LEAD_NOTIFICATION_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL;
        if (to) await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev", to, subject: "CMS password reset approval requested", html: `<p>A password reset was requested for <strong>${email.replace(/[<>&]/g, "")}</strong>.</p><p>Open CMS → Access & Roles to approve the request.</p>` }).catch(() => undefined);
      }
    }
    return NextResponse.json({ success: true, message: "If this email belongs to an active CMS account, the administrator will receive the reset request." });
  } catch {
    return NextResponse.json({ error: "Unable to submit password reset request." }, { status: 500 });
  }
}
