import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logAdminSecurityEvent } from "@/lib/security/audit";
import { readJson, validUuid } from "@/lib/security/http";

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);
    const body = await readJson(request, 4_000);
    const id = String(body.id || "");
    if (!validUuid(id)) return NextResponse.json({ error: "A valid user id is required." }, { status: 400 });
    if (id === identity.id) return NextResponse.json({ error: "You cannot remove your own account." }, { status: 400 });
    const { data: target } = await client.from("cms_profiles").select("role_name,enabled").eq("id", id).maybeSingle();
    if (target?.role_name === "super_admin" && target?.enabled === true) {
      const { data: other } = await client.from("cms_profiles").select("id").eq("role_name", "super_admin").eq("enabled", true).neq("id", id).limit(1);
      if (!other?.length) return NextResponse.json({ error: "The last active Super Admin cannot be removed." }, { status: 400 });
    }
    const { error } = await client.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: "User removal failed." }, { status: 400 });
    await client.from("cms_profiles").delete().eq("id", id);
    await logAdminSecurityEvent(client, identity, "cms_user_removed", { target_user_id: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "User removal failed." }, { status: 500 });
  }
}
