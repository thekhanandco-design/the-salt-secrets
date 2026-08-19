import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { distributedRateLimit, readJson, validUuid } from "@/lib/security/http";
import { logAdminSecurityEvent } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: `client-invite:${identity.id}`, limit: 10, windowMs: 30 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request, 8_000);
    const customerId = String(body.customerId || "").trim();
    if (!validUuid(customerId)) return NextResponse.json({ error: "A valid client account is required." }, { status: 400 });

    const { data: account, error: accountError } = await client
      .from("customer_accounts")
      .select("id,company_name,contact_name,email,auth_user_id,status")
      .eq("id", customerId)
      .single();
    if (accountError || !account) return NextResponse.json({ error: "Client account was not found." }, { status: 404 });
    if (!account.email) return NextResponse.json({ error: "This client account has no email address." }, { status: 400 });

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/client-portal`;
    const { data: invited, error: inviteError } = await client.auth.admin.inviteUserByEmail(account.email, {
      redirectTo,
      data: { full_name: account.contact_name || account.company_name, company_name: account.company_name, account_type: "client" },
    });
    if (inviteError) return NextResponse.json({ error: "Client invitation could not be sent." }, { status: 400 });

    if (invited.user?.id) {
      await client.from("customer_accounts").update({ auth_user_id: invited.user.id, status: "invited", updated_at: new Date().toISOString() }).eq("id", customerId);
    }
    await client.from("b2b_activities").insert({
      activity_type: "client_portal_invite",
      module: "Client Portal",
      record_id: customerId,
      title: `Client portal invitation sent to ${account.company_name}`,
      description: `Invitation email sent to ${account.email}`,
      actor_id: identity.id,
      actor_email: identity.email,
      company_name: account.company_name,
      metadata: { client_email: account.email, invited_user_id: invited.user?.id || null },
    });
    await logAdminSecurityEvent(client, identity, "client_portal_invite", { customer_id: customerId, invited_user_id: invited.user?.id || null });
    return NextResponse.json({ success: true, message: `Invitation sent to ${account.email}.` });
  } catch (error) {
    if (error instanceof Response) return error;
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 500;
    return NextResponse.json({ error: status === 413 ? "Request is too large." : "Unable to invite the client." }, { status });
  }
}
