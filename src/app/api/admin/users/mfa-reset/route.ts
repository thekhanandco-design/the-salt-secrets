import { requireSuperAdmin } from "@/lib/admin-auth";
import { logAdminSecurityEvent } from "@/lib/security/audit";
import { distributedRateLimit, readJson, secureJson, validUuid } from "@/lib/security/http";

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireSuperAdmin(request);
    const limited = await distributedRateLimit(request, { key: "admin-mfa-reset", limit: 8, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request, 4_000);
    const userId = String(body.userId || "");
    if (!validUuid(userId)) return secureJson({ error: "A valid CMS user is required." }, { status: 400 });
    if (userId === identity.id) return secureJson({ error: "Use the MFA management page to change your own factor." }, { status: 400 });

    const { data: profile, error: profileError } = await client.from("cms_profiles").select("id,email,role_name,enabled").eq("id", userId).maybeSingle();
    if (profileError || !profile) return secureJson({ error: "CMS user not found." }, { status: 404 });

    const { data, error } = await client.auth.admin.mfa.listFactors({ userId });
    if (error) return secureJson({ error: "Unable to inspect the user's MFA factors." }, { status: 500 });
    const verified = (data?.factors || []).filter((factor) => factor.status === "verified");
    if (!verified.length) return secureJson({ success: true, removed: 0 });

    for (const factor of verified) {
      const deletion = await client.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
      if (deletion.error) return secureJson({ error: "Unable to reset the user's MFA factor." }, { status: 500 });
    }

    await logAdminSecurityEvent(client, identity, "cms_user_mfa_reset", { user_id: userId, removed: verified.length });
    return secureJson({ success: true, removed: verified.length });
  } catch (error) {
    if (error instanceof Response) return error;
    return secureJson({ error: "Unable to reset MFA." }, { status: 500 });
  }
}
