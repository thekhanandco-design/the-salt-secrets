import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function canManage(role: string) {
  const normalized = role.toLowerCase().replaceAll("_", " ");
  return normalized.includes("super admin") || normalized === "admin" || normalized === "authenticated admin";
}

export async function GET(request: Request) {
  try {
    const { client } = await requireAdminUser(request);
    const [{ data: authData, error: authError }, { data: profiles, error: profileError }] = await Promise.all([
      client.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      client.from("cms_profiles").select("id,full_name,role_name,enabled,created_at,updated_at"),
    ]);
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
    const profileMap = new Map((profiles || []).map(profile => [profile.id, profile]));
    const users = (authData.users || []).map(user => {
      const profile = profileMap.get(user.id);
      return {
        id: user.id,
        email: user.email || "",
        fullName: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Admin",
        role: profile?.role_name || user.app_metadata?.role || "authenticated_admin",
        enabled: profile?.enabled !== false,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at || null,
        emailConfirmedAt: user.email_confirmed_at || null,
      };
    });
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load admin users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    if (!canManage(identity.role)) return NextResponse.json({ error: "Only a Super Admin can invite CMS users." }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.fullName || "").trim();
    const role = String(body.role || "viewer").trim().toLowerCase().replaceAll(" ", "_");
    if (!email || !email.includes("@")) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/admin/login`;
    const { data, error: inviteError } = await client.auth.admin.inviteUserByEmail(email, { redirectTo, data: { full_name: fullName, role } });
    if (inviteError || !data.user) return NextResponse.json({ error: inviteError?.message || "Invitation failed." }, { status: 400 });
    await client.from("cms_profiles").upsert({ id: data.user.id, full_name: fullName || email.split("@")[0], role_name: role, enabled: true, updated_at: new Date().toISOString() });
    await client.from("b2b_activities").insert({ activity_type: "admin_invited", module: "Settings", record_id: data.user.id, title: `CMS user invited: ${email}`, description: `Role: ${role}`, actor_id: identity.id, actor_email: identity.email });
    return NextResponse.json({ success: true, message: `Invitation sent to ${email}.` });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to invite admin user." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    if (!canManage(identity.role)) return NextResponse.json({ error: "Only a Super Admin can manage CMS users." }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "User id is required." }, { status: 400 });
    if (id === identity.id && body.enabled === false) return NextResponse.json({ error: "You cannot disable your own active admin account." }, { status: 400 });
    const role = body.role ? String(body.role).trim().toLowerCase().replaceAll(" ", "_") : undefined;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.fullName === "string") patch.full_name = body.fullName.trim();
    if (role) patch.role_name = role;
    if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
    const { error } = await client.from("cms_profiles").upsert({ id, ...patch }, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await client.auth.admin.updateUserById(id, { app_metadata: role ? { role } : undefined, ban_duration: body.enabled === false ? "876000h" : "none" }).catch(() => undefined);
    await client.from("b2b_activities").insert({ activity_type: "admin_updated", module: "Settings", record_id: id, title: "CMS user updated", description: role ? `Role updated to ${role}` : "Account status updated", actor_id: identity.id, actor_email: identity.email });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update admin user." }, { status: 500 });
  }
}
