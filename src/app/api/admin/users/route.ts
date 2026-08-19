import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logAdminSecurityEvent } from "@/lib/security/audit";
import { cleanText, readJson, validEmail, validUuid } from "@/lib/security/http";

export const dynamic = "force-dynamic";

function normalizeRole(value: unknown) {
  return cleanText(value, 80).toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
}

async function validRole(client: Awaited<ReturnType<typeof requireSuperAdmin>>["client"], role: string) {
  if (role === "pending") return false;
  const { data, error } = await client.from("cms_roles").select("name").eq("name", role).maybeSingle();
  return !error && Boolean(data?.name);
}

async function ensureAnotherSuperAdmin(client: Awaited<ReturnType<typeof requireSuperAdmin>>["client"], targetId: string) {
  const { data } = await client.from("cms_profiles").select("id").eq("role_name", "super_admin").eq("enabled", true).neq("id", targetId).limit(1);
  return Boolean(data?.length);
}

export async function GET(request: Request) {
  try {
    const { client } = await requireSuperAdmin(request);
    const [{ data: authData, error: authError }, { data: profiles, error: profileError }] = await Promise.all([
      client.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      client.from("cms_profiles").select("id,full_name,role_name,enabled,created_at,updated_at"),
    ]);
    if (authError || profileError) return NextResponse.json({ error: "Unable to load CMS users." }, { status: 500 });
    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const users = (authData.users || []).map((user) => {
      const profile = profileMap.get(user.id);
      return {
        id: user.id,
        email: user.email || "",
        fullName: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "CMS User",
        role: profile?.role_name || "pending",
        enabled: profile?.enabled === true,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at || null,
        emailConfirmedAt: user.email_confirmed_at || null,
      };
    });
    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Unable to load CMS users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);
    const body = await readJson(request, 8_000);
    const email = cleanText(body.email, 254).toLowerCase();
    const fullName = cleanText(body.fullName || body.full_name, 160);
    const role = normalizeRole(body.role || body.role_name || "viewer");
    if (!validEmail(email)) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    if (!(await validRole(client, role))) return NextResponse.json({ error: "Select a valid CMS role." }, { status: 400 });

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/admin/login`;
    const { data, error: inviteError } = await client.auth.admin.inviteUserByEmail(email, { redirectTo, data: { full_name: fullName } });
    if (inviteError || !data.user) return NextResponse.json({ error: "Invitation could not be sent." }, { status: 400 });

    const { error: profileError } = await client.from("cms_profiles").upsert({
      id: data.user.id,
      full_name: fullName || email.split("@")[0],
      role_name: role,
      enabled: false,
      updated_at: new Date().toISOString(),
    });
    if (profileError) return NextResponse.json({ error: "The invited account could not be placed into pending status." }, { status: 500 });

    await logAdminSecurityEvent(client, identity, "cms_user_invited_pending", { target_user_id: data.user.id, role });
    return NextResponse.json({ success: true, message: `Invitation sent to ${email}. Access remains disabled until a Super Admin approves it.` });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Unable to invite CMS user." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);
    const body = await readJson(request, 8_000);
    const id = String(body.id || "").trim();
    if (!validUuid(id)) return NextResponse.json({ error: "A valid user id is required." }, { status: 400 });

    const { data: current, error: currentError } = await client.from("cms_profiles").select("id,role_name,enabled,full_name").eq("id", id).maybeSingle();
    if (currentError || !current) return NextResponse.json({ error: "CMS user was not found." }, { status: 404 });

    const role = body.role || body.role_name ? normalizeRole(body.role || body.role_name) : undefined;
    if (role && !(await validRole(client, role))) return NextResponse.json({ error: "Select a valid CMS role." }, { status: 400 });
    const nextEnabled = typeof body.enabled === "boolean" ? body.enabled : current.enabled === true;
    const nextRole = role || String(current.role_name || "pending");

    if (id === identity.id && (!nextEnabled || nextRole !== "super_admin")) {
      return NextResponse.json({ error: "You cannot disable or demote your own active Super Admin account." }, { status: 400 });
    }
    if (String(current.role_name) === "super_admin" && current.enabled === true && (!nextEnabled || nextRole !== "super_admin")) {
      if (!(await ensureAnotherSuperAdmin(client, id))) return NextResponse.json({ error: "At least one other active Super Admin is required before changing this account." }, { status: 400 });
    }

    const patch: Record<string, unknown> = { role_name: nextRole, enabled: nextEnabled, updated_at: new Date().toISOString() };
    if (typeof body.fullName === "string" || typeof body.full_name === "string") patch.full_name = cleanText(body.fullName || body.full_name, 160);
    const { error } = await client.from("cms_profiles").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: "CMS user access could not be updated." }, { status: 400 });

    await client.auth.admin.updateUserById(id, {
      app_metadata: { role: nextRole },
      ban_duration: nextEnabled ? "none" : "876000h",
    }).catch(() => undefined);
    await logAdminSecurityEvent(client, identity, "cms_user_access_updated", { target_user_id: id, role: nextRole, enabled: nextEnabled });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Unable to update CMS user." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);
    const body = await readJson(request, 4_000);
    const id = String(body.id || "").trim();
    if (!validUuid(id)) return NextResponse.json({ error: "A valid user id is required." }, { status: 400 });
    if (id === identity.id) return NextResponse.json({ error: "You cannot remove your own account." }, { status: 400 });
    const { data: current } = await client.from("cms_profiles").select("role_name,enabled").eq("id", id).maybeSingle();
    if (current?.role_name === "super_admin" && current?.enabled === true && !(await ensureAnotherSuperAdmin(client, id))) {
      return NextResponse.json({ error: "The last active Super Admin cannot be removed." }, { status: 400 });
    }
    const { error: authError } = await client.auth.admin.deleteUser(id);
    if (authError) return NextResponse.json({ error: "CMS user could not be removed." }, { status: 400 });
    await client.from("cms_profiles").delete().eq("id", id);
    await logAdminSecurityEvent(client, identity, "cms_user_removed", { target_user_id: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Unable to remove CMS user." }, { status: 500 });
  }
}
