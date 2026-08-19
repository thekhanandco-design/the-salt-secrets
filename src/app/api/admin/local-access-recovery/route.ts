import { createAdminServiceClient } from "@/lib/admin-auth";
import { isLocalDevelopmentRequest } from "@/lib/local-development";
import { secureJson } from "@/lib/security/http";

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function normalizedRole(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export async function POST(request: Request) {
  if (!isLocalDevelopmentRequest(request)) {
    return secureJson({ error: "Not found." }, { status: 404 });
  }

  const token = bearerToken(request);
  if (!token) {
    return secureJson({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const client = createAdminServiceClient();
    const { data: userData, error: userError } = await client.auth.getUser(token);
    const user = userData.user;
    if (userError || !user?.id || !user.email) {
      return secureJson({ error: "Your local admin session is invalid." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await client
      .from("cms_profiles")
      .select("id,full_name,role_name,enabled")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return secureJson({ error: "Unable to inspect the CMS access profile." }, { status: 500 });
    }

    const currentRole = normalizedRole(profile?.role_name);
    if (profile?.enabled === true && currentRole && currentRole !== "pending") {
      return secureJson({ success: true, recovered: false, role: currentRole });
    }

    const [{ data: settings }, { data: enabledSuperAdmins, error: superAdminError }] = await Promise.all([
      client.from("site_settings").select("contact_email").limit(1).maybeSingle(),
      client.from("cms_profiles").select("id").eq("role_name", "super_admin").eq("enabled", true).limit(1),
    ]);

    if (superAdminError) {
      return secureJson({ error: "Unable to verify existing administrator access." }, { status: 500 });
    }

    const loginEmail = user.email.trim().toLowerCase();
    const ownerEmail = String(settings?.contact_email || "").trim().toLowerCase();
    const noEnabledSuperAdmin = !enabledSuperAdmins?.length;
    const matchesConfiguredOwner = Boolean(ownerEmail && ownerEmail === loginEmail);

    if (!matchesConfiguredOwner && !noEnabledSuperAdmin) {
      return secureJson(
        { error: "This account is disabled. An existing Super Admin must enable it." },
        { status: 403 },
      );
    }

    const fullName = String(
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email.split("@")[0] ||
      "CMS Administrator",
    ).trim();

    const { error: recoveryError } = await client.from("cms_profiles").upsert({
      id: user.id,
      full_name: fullName,
      role_name: "super_admin",
      enabled: true,
      updated_at: new Date().toISOString(),
    });

    if (recoveryError) {
      return secureJson({ error: "Unable to restore localhost CMS access." }, { status: 500 });
    }

    return secureJson({ success: true, recovered: true, role: "super_admin" });
  } catch {
    return secureJson({ error: "Unable to restore localhost CMS access." }, { status: 500 });
  }
}
