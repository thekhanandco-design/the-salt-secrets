import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { logAdminSecurityEvent } from "@/lib/security/audit";
import { cleanText, readJson, validEmail } from "@/lib/security/http";

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);
    const body = await readJson(request, 8_000);
    const email = cleanText(body.email, 254).toLowerCase();
    const fullName = cleanText(body.full_name || body.fullName, 160);
    const role = cleanText(body.role_name || body.role || "viewer", 80).toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!validEmail(email) || !role || role === "pending") return NextResponse.json({ error: "Valid email and role are required." }, { status: 400 });
    const { data: roleRow } = await client.from("cms_roles").select("name").eq("name", role).maybeSingle();
    if (!roleRow) return NextResponse.json({ error: "Select a valid CMS role." }, { status: 400 });
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/admin/login`;
    const { data, error } = await client.auth.admin.inviteUserByEmail(email, { redirectTo, data: { full_name: fullName } });
    if (error || !data.user) return NextResponse.json({ error: "Invitation could not be sent." }, { status: 400 });
    await client.from("cms_profiles").upsert({ id: data.user.id, full_name: fullName || email.split("@")[0], role_name: role, enabled: false, updated_at: new Date().toISOString() });
    await logAdminSecurityEvent(client, identity, "cms_user_invited_pending", { target_user_id: data.user.id, role });
    return NextResponse.json({ success: true, user: { id: data.user.id, email }, message: "Invitation sent. Account remains disabled until approved." });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Invite failed." }, { status: 500 });
  }
}
