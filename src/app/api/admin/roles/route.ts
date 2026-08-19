import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logAdminSecurityEvent } from "@/lib/security/audit";
import { cleanText, readJson, validUuid } from "@/lib/security/http";

const PROTECTED_ROLES = new Set(["super_admin", "admin", "executive", "sales", "marketing", "operations", "website_editor", "viewer", "pending"]);

function normalizeRole(value: unknown) {
  return cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);
    const body = await readJson(request, 24_000);
    const slug = normalizeRole(body.name);
    const description = cleanText(body.description || "Custom CMS role", 500);
    const permissions = body.permissions && typeof body.permissions === "object" && !Array.isArray(body.permissions) ? body.permissions : {};
    if (!slug || slug === "pending") return NextResponse.json({ error: "A valid role name is required." }, { status: 400 });
    const { data, error } = await client.from("cms_roles").insert({ name: slug, description, permissions }).select().single();
    if (error) return NextResponse.json({ error: "Role could not be created." }, { status: 400 });
    await logAdminSecurityEvent(client, identity, "cms_role_created", { role: slug });
    return NextResponse.json({ role: data });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Role creation failed." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);
    const body = await readJson(request, 4_000);
    const id = String(body.id || "");
    if (!validUuid(id)) return NextResponse.json({ error: "A valid role id is required." }, { status: 400 });
    const { data: role, error: readError } = await client.from("cms_roles").select("id,name").eq("id", id).maybeSingle();
    if (readError || !role) return NextResponse.json({ error: "Role was not found." }, { status: 404 });
    if (PROTECTED_ROLES.has(String(role.name || ""))) return NextResponse.json({ error: "Built-in security roles cannot be deleted." }, { status: 400 });
    const { error } = await client.from("cms_roles").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Role could not be deleted." }, { status: 400 });
    await logAdminSecurityEvent(client, identity, "cms_role_deleted", { role: role.name, role_id: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Role deletion failed." }, { status: 500 });
  }
}
