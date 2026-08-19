import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { distributedRateLimit, readJson, validEmail, validUuid } from "@/lib/security/http";
import { logAdminSecurityEvent } from "@/lib/security/audit";

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);
    const limited = await distributedRateLimit(request, { key: `password-reset-approve:${identity.id}`, limit: 10, windowMs: 30 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request, 4_000);
    const activityId = String(body.activityId || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    if (!validUuid(activityId) || !validEmail(email)) return NextResponse.json({ error: "A valid reset request and email are required." }, { status: 400 });

    const { data: activity } = await client
      .from("b2b_activities")
      .select("id,activity_type,module,metadata")
      .eq("id", activityId)
      .eq("module", "Authentication")
      .eq("activity_type", "password_reset_request")
      .maybeSingle();
    if (!activity || String(activity.metadata?.email || "").toLowerCase() !== email || String(activity.metadata?.status || "") !== "pending") {
      return NextResponse.json({ error: "Password reset request was not found or is no longer pending." }, { status: 404 });
    }

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/admin/login?recovery=1`;
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return NextResponse.json({ error: "Password recovery email could not be requested." }, { status: 400 });

    await client.from("b2b_activities").update({
      description: `Approved by ${identity.email}; recovery email requested.`,
      metadata: { ...activity.metadata, email, status: "approved", approved_at: new Date().toISOString(), approved_by: identity.email },
    }).eq("id", activityId);
    await client.from("b2b_activities").insert({
      activity_type: "password_reset_approved",
      module: "Authentication",
      record_id: activityId,
      title: `Password reset approved: ${email}`,
      actor_id: identity.id,
      actor_email: identity.email,
    });
    await logAdminSecurityEvent(client, identity, "password_reset_approved", { activity_id: activityId });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 500;
    return NextResponse.json({ error: status === 413 ? "Request is too large." : "Unable to approve password reset." }, { status });
  }
}
