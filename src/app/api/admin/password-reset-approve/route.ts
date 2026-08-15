import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    const body = await request.json().catch(() => ({}));
    const activityId = String(body.activityId || "");
    const email = String(body.email || "").trim().toLowerCase();
    if (!activityId || !email.includes("@")) return NextResponse.json({ error: "Reset request and email are required." }, { status: 400 });
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/admin/login?recovery=1`;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await client.from("b2b_activities").update({ description: `Approved by ${identity.email}; recovery email requested.`, metadata: { email, status: "approved", approved_at: new Date().toISOString(), approved_by: identity.email } }).eq("id", activityId);
    await client.from("b2b_activities").insert({ activity_type: "password_reset_approved", module: "Authentication", record_id: activityId, title: `Password reset approved: ${email}`, actor_id: identity.id, actor_email: identity.email });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to approve password reset." }, { status: 500 });
  }
}
