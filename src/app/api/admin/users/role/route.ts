import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logAdminSecurityEvent } from "@/lib/security/audit";
import { cleanText, readJson, validUuid } from "@/lib/security/http";

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);
    const body = await readJson(request, 6_000);
    const id = String(body.id || "");
    const roleName = cleanText(body.role_name || body.role, 80).toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
    const enabled = typeof body.enabled === "boolean" ? body.enabled : true;
    if (!validUuid(id) || !roleName || roleName === "pending") return NextResponse.json({ error: "Valid user, role and status are required." }, { status: 400 });
    const { data: role } = await client.from("cms_roles").select("name").eq("name", roleName).maybeSingle();
    if (!role) return NextResponse.json({ error: "Select a valid CMS role." }, { status: 400 });
    const { data: current } = await client.from("cms_profiles").select("role_name,enabled").eq("id", id).maybeSingle();
    if (!current) return NextResponse.json({ error: "CMS user was not found." }, { status: 404 });
    if (id === identity.id && (!enabled || roleName !== "super_admin")) return NextResponse.json({ error: "You cannot disable or demote your own Super Admin account." }, { status: 400 });
    if (current.role_name === "super_admin" && current.enabled === true && (!enabled || roleName !== "super_admin")) {
      const { data: other } = await client.from("cms_profiles").select("id").eq("role_name", "super_admin").eq("enabled", true).neq("id", id).limit(1);
      if (!other?.length) return NextResponse.json({ error: "At least one other active Super Admin is required." }, { status: 400 });
    }
    const { error } = await client.from("cms_profiles").update({ role_name: roleName, enabled, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ error: "User access update failed." }, { status: 400 });
    await logAdminSecurityEvent(client, identity, "cms_user_access_updated", { target_user_id: id, role: roleName, enabled });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
