import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { distributedRateLimit } from "@/lib/security/http";
import { isLocalDevelopmentRequest } from "@/lib/local-development";

export type AdminIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  roleSlug: string;
  aal: "aal1" | "aal2" | null;
};

type AdminSession = {
  client: SupabaseClient;
  identity: AdminIdentity;
  token: string;
};

function jsonAuthError(status: 401 | 403, error: string, code?: string) {
  return new Response(JSON.stringify({ error, ...(code ? { code } : {}) }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function createAdminServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin configuration is missing.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function roleSlug(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function displayRole(slug: string) {
  return slug
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function isAllowedAdminOrigin(request: Request) {
  const fetchSite = (request.headers.get("sec-fetch-site") || "").toLowerCase();
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true; // Non-browser/server-to-server callers still require a valid bearer token.

  try {
    const actual = new URL(origin).origin;
    const requestOrigin = new URL(request.url).origin;
    if (actual === requestOrigin) return true;
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    if (configured && actual === new URL(configured).origin) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Verifies the access token against Supabase Auth, then verifies the CMS profile
 * using the server-only service client. Profile lookup is deliberately fail-closed.
 * General CMS access requires a verified, enabled CMS profile.
 * AAL2 is enforced for privileged Super Admin actions in production.
 * Localhost development may use AAL1 so an authenticator problem cannot lock the owner out of local development.
 */
export async function requireAdminUser(request: Request): Promise<AdminSession> {
  if (!isAllowedAdminOrigin(request)) {
    throw jsonAuthError(403, "Cross-origin CMS requests are not allowed.", "ORIGIN_NOT_ALLOWED");
  }

  const limited = await distributedRateLimit(request, { key: "admin-api", limit: 240, windowMs: 5 * 60_000 });
  if (limited) throw limited;

  const token = bearerToken(request);
  if (!token) throw jsonAuthError(401, "Authentication required.", "AUTH_REQUIRED");

  const client = createAdminServiceClient();
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) {
    throw jsonAuthError(401, "Your admin session has expired.", "SESSION_EXPIRED");
  }

  const { data: profile, error: profileError } = await client
    .from("cms_profiles")
    .select("id,full_name,role_name,enabled")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw jsonAuthError(403, "This account is not an approved CMS user.", "CMS_ACCESS_NOT_APPROVED");
  }
  if (profile.enabled !== true) {
    throw jsonAuthError(403, "This CMS account is pending or disabled.", "CMS_ACCOUNT_DISABLED");
  }

  const normalizedRole = roleSlug(profile.role_name);
  if (!normalizedRole || normalizedRole === "pending") {
    throw jsonAuthError(403, "This account does not have an approved CMS role.", "CMS_ROLE_REQUIRED");
  }

  const { data: aalData, error: aalError } = await client.auth.mfa.getAuthenticatorAssuranceLevel(token);
  if (aalError) {
    throw jsonAuthError(401, "Unable to verify the security level of this session.", "MFA_CHECK_FAILED");
  }
  const aal = (aalData?.currentLevel || null) as "aal1" | "aal2" | null;

  const fullName = String(
    profile.full_name ||
      userData.user.user_metadata?.full_name ||
      userData.user.user_metadata?.name ||
      userData.user.email?.split("@")[0] ||
      "Admin",
  ).trim();

  return {
    client,
    token,
    identity: {
      id: userData.user.id,
      email: userData.user.email || "",
      fullName,
      role: displayRole(normalizedRole),
      roleSlug: normalizedRole,
      aal,
    },
  };
}

export async function requireSuperAdmin(request: Request): Promise<AdminSession> {
  const session = await requireAdminUser(request);
  if (session.identity.roleSlug !== "super_admin") {
    throw jsonAuthError(403, "Super administrator permission is required.", "SUPER_ADMIN_REQUIRED");
  }
  if (session.identity.aal !== "aal2" && !isLocalDevelopmentRequest(request)) {
    throw jsonAuthError(403, "Multi-factor authentication is required for this privileged action.", "MFA_REQUIRED");
  }
  return session;
}

/**
 * Used only by short-lived, cryptographically signed OAuth callbacks where the
 * original request already passed requireSuperAdmin(). It re-checks that the
 * same CMS profile still exists, is enabled and remains super_admin.
 */
export async function requireActiveSuperAdminId(adminId: string) {
  const client = createAdminServiceClient();
  const { data: profile, error } = await client
    .from("cms_profiles")
    .select("id,role_name,enabled")
    .eq("id", adminId)
    .maybeSingle();
  if (error || !profile || profile.enabled !== true || roleSlug(profile.role_name) !== "super_admin") {
    throw jsonAuthError(403, "The administrator who started this connection is no longer authorized.", "SUPER_ADMIN_REQUIRED");
  }
  return client;
}
