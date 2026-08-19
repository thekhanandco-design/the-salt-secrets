import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const checks = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const pass = (name, ok, detail = "") => {
  checks.push({ name, ok, detail });
  if (!ok) failures.push(name);
};

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

const pkg = JSON.parse(read("package.json"));
const lock = read("package-lock.json");
pass("Next.js patched target", pkg.dependencies?.next === "16.2.12", `found ${pkg.dependencies?.next || "missing"}`);
pass("eslint-config-next aligned", pkg.devDependencies?.["eslint-config-next"] === "16.2.12", `found ${pkg.devDependencies?.["eslint-config-next"] || "missing"}`);
pass("PostCSS security override pinned", pkg.overrides?.postcss === "8.5.25", `found ${pkg.overrides?.postcss || "missing"}`);
pass("Sharp security override pinned", pkg.overrides?.sharp === "0.35.3", `found ${pkg.overrides?.sharp || "missing"}`);
pass("Lockfile contains Next.js 16.2.12", /node_modules\/next[\s\S]{0,180}"version": "16\.2\.12"/.test(lock));
pass("Old Next.js 16.2.7 absent from lockfile", !/16\.2\.7/.test(lock));
pass("Environment files ignored", /(^|\n)\.env\*/.test(read(".gitignore")));
pass("Service role not NEXT_PUBLIC", !/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/.test(read(".env.example") + read(".env.local.example")));

const migrationPath = "supabase/migrations/20260817_security_hardening.sql";
const migration = exists(migrationPath) ? read(migrationPath) : "";
pass("Security migration exists", Boolean(migration));
const migrationFiles = fs.readdirSync(path.join(root, "supabase/migrations")).filter((file) => file.endsWith(".sql")).sort();
pass("MFA recovery migration is latest", migrationFiles.at(-1) === "20260818_mfa_access_recovery.sql", migrationFiles.at(-1) || "none");
const recoveryMigration = exists("supabase/migrations/20260818_mfa_access_recovery.sql") ? read("supabase/migrations/20260818_mfa_access_recovery.sql") : "";
pass("MFA recovery migration keeps active-CMS RLS", /public\.is_active_cms_user\(\)/.test(recoveryMigration));
pass("Super Admin helper still requires AAL2", /select public\.has_aal2\(\) and exists/.test(migration));
pass("Legacy SQL security notice exists", exists("supabase/SECURITY-NOTICE.md"));
pass("New CMS users default pending", /'pending',\s*false/.test(migration));
const newUserFunction = migration.match(/create or replace function public\.handle_new_cms_user\(\)[\s\S]*?\$\$;/i)?.[0] || "";
pass("New-user trigger does not grant super_admin", Boolean(newUserFunction) && !/super_admin/i.test(newUserFunction));
pass("AAL2 RLS helper exists", /create or replace function public\.has_aal2\(\)/.test(migration));
pass("Sensitive storage buckets made private", /where id in \('certificates', 'documents', 'cms-private'\)/.test(migration));

pass("MFA admin page exists", exists("src/app/admin/mfa/page.tsx"));
const localResetPath = "src/app/api/admin/mfa/local-reset/route.ts";
const localReset = exists(localResetPath) ? read(localResetPath) : "";
pass("Local MFA reset is localhost-development only", /isLocalDevelopmentRequest\(request\)/.test(localReset) && /requireSuperAdmin\(request\)/.test(localReset));
pass("Local MFA reset is absent from production by helper", /process\.env\.NODE_ENV === "production"/.test(read("src/lib/local-development.ts")));
const localAccessRecoveryPath = "src/app/api/admin/local-access-recovery/route.ts";
const localAccessRecovery = exists(localAccessRecoveryPath) ? read(localAccessRecoveryPath) : "";
pass("Local owner access recovery is localhost-development only", /isLocalDevelopmentRequest\(request\)/.test(localAccessRecovery) && /auth\.getUser\(token\)/.test(localAccessRecovery));
pass("Local owner access recovery cannot run in production", /if \(!isLocalDevelopmentRequest\(request\)\)/.test(localAccessRecovery));

const adminAuth = read("src/lib/admin-auth.ts");
pass("Admin auth verifies Supabase user server-side", /auth\.getUser\(token\)/.test(adminAuth));
pass("Admin auth checks approved CMS profile", /cms_profiles/.test(adminAuth) && /profile\.enabled !== true/.test(adminAuth));
pass("Super Admin auth requires AAL2 outside localhost", /session\.identity\.aal !== "aal2" && !isLocalDevelopmentRequest\(request\)/.test(adminAuth));
pass("Super-admin helper exists", /export async function requireSuperAdmin/.test(adminAuth));

const cronSource = read("src/lib/security/cron.ts");
pass("Cron fails closed", /if \(!secret \|\| !authorization\.startsWith\("Bearer "\)\)/.test(cronSource));
pass("Cron secret compared timing-safely", /timingSafeEqual/.test(cronSource));

const turnstile = read("src/lib/security/turnstile.ts");
pass("Turnstile verifies action", /allowedActions/.test(turnstile));
pass("Turnstile verifies hostname", /hostname mismatch/.test(turnstile));
pass("Turnstile production host allowlist is stable-config based", /Production therefore fails[\s\S]*closed/.test(turnstile));

const upload = read("src/lib/security/upload.ts");
pass("Upload signature validation", /detectUploadType/.test(upload));
pass("Dangerous upload types rejected", /svg|html|javascript|xml/i.test(upload));
pass("Randomized upload filenames", /randomUUID/.test(upload));

const nextConfig = read("next.config.ts");
pass("poweredByHeader disabled", /poweredByHeader:\s*false/.test(nextConfig));
pass("CSP configured", /Content-Security-Policy/.test(nextConfig) && /object-src 'none'/.test(nextConfig));
pass("HSTS configured for production", /Strict-Transport-Security/.test(nextConfig));
pass("Preview/staging noindex protection", /X-Robots-Tag/.test(nextConfig));

const adminRoot = path.join(root, "src/app/api/admin");
const adminRoutes = walk(adminRoot).filter((file) => file.endsWith("route.ts"));
const allowedSpecial = new Set([
  path.join(adminRoot, "meta/oauth/callback/route.ts"),
  path.join(adminRoot, "youtube/oauth/callback/route.ts"),
  path.join(adminRoot, "password-reset-request/route.ts"),
  path.join(adminRoot, "local-access-recovery/route.ts"),
]);
const unprotectedAdminRoutes = [];
for (const file of adminRoutes) {
  const source = fs.readFileSync(file, "utf8");
  const guarded = /requireAdminUser\(|requireSuperAdmin\(|requireActiveSuperAdminId\(/.test(source) || allowedSpecial.has(file);
  if (!guarded) unprotectedAdminRoutes.push(path.relative(root, file));
}
pass("All admin API routes guarded", unprotectedAdminRoutes.length === 0, unprotectedAdminRoutes.join(", "));

const superAdminRoutes = [
  "src/app/api/admin/roles/route.ts",
  "src/app/api/admin/users/route.ts",
  "src/app/api/admin/users/invite/route.ts",
  "src/app/api/admin/users/remove/route.ts",
  "src/app/api/admin/users/role/route.ts",
  "src/app/api/admin/users/mfa-reset/route.ts",
];
const missingSuperAdmin = superAdminRoutes.filter((file) => !exists(file) || !/requireSuperAdmin\(/.test(read(file)));
pass("Sensitive user/role APIs require super-admin", missingSuperAdmin.length === 0, missingSuperAdmin.join(", "));

const sourceFiles = walk(path.join(root, "src")).filter((file) => /\.(ts|tsx)$/.test(file));
let serviceRoleClientLeak = false;
const unguardedServiceRoleRoutes = [];
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file).replaceAll("\\", "/");
  if (/SUPABASE_SERVICE_ROLE_KEY/.test(source)) {
    if (!rel.startsWith("src/app/api/") && !rel.startsWith("src/lib/")) serviceRoleClientLeak = true;
    if (rel.startsWith("src/app/api/")) {
      const protectedRoute = /requireAdminUser\(|requireSuperAdmin\(|requireActiveSuperAdminId\(|requireCron\(|verifyTurnstile\(/.test(source);
      if (!protectedRoute) unguardedServiceRoleRoutes.push(rel);
    }
  }
}
pass("No service-role reference in client components", !serviceRoleClientLeak);
pass("Service-role API routes have an auth/cron/bot gate", unguardedServiceRoleRoutes.length === 0, unguardedServiceRoleRoutes.join(", "));

const rawMutationJson = [];
for (const file of sourceFiles.filter((file) => file.includes(`${path.sep}src${path.sep}app${path.sep}api${path.sep}`) && file.endsWith("route.ts"))) {
  const source = fs.readFileSync(file, "utf8");
  if (/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)/.test(source) && /request\.json\(/.test(source)) {
    rawMutationJson.push(path.relative(root, file));
  }
}
pass("Mutation routes avoid unbounded request.json()", rawMutationJson.length === 0, rawMutationJson.join(", "));

const clientSupabase = read("src/lib/supabase-client.ts");
pass("CMS session avoids localStorage", /sessionStorage/.test(clientSupabase) && !/window\.localStorage/.test(clientSupabase));

for (const item of checks) console.log(`${item.ok ? "PASS" : "FAIL"}  ${item.name}${item.detail ? ` (${item.detail})` : ""}`);
if (failures.length) process.exit(1);
