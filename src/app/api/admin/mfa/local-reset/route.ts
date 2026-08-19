import { requireSuperAdmin } from "@/lib/admin-auth";
import { isLocalDevelopmentRequest } from "@/lib/local-development";
import { logAdminSecurityEvent } from "@/lib/security/audit";
import { secureJson } from "@/lib/security/http";

export async function POST(request: Request) {
  if (!isLocalDevelopmentRequest(request)) {
    return secureJson({ error: "Not found." }, { status: 404 });
  }

  try {
    const { client, identity } = await requireSuperAdmin(request);
    const { data, error } = await client.auth.admin.mfa.listFactors({ userId: identity.id });
    if (error) return secureJson({ error: "Unable to inspect local authenticator factors." }, { status: 500 });

    const factors = (data?.factors || []).filter((factor) => factor.factor_type === "totp");
    for (const factor of factors) {
      const deletion = await client.auth.admin.mfa.deleteFactor({ id: factor.id, userId: identity.id });
      if (deletion.error) return secureJson({ error: "Unable to reset the local authenticator factor." }, { status: 500 });
    }

    await logAdminSecurityEvent(client, identity, "localhost_mfa_recovery", { removed: factors.length });
    return secureJson({ success: true, removed: factors.length });
  } catch (error) {
    if (error instanceof Response) return error;
    return secureJson({ error: "Unable to reset the local authenticator factor." }, { status: 500 });
  }
}
