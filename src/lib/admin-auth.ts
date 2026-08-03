import { createClient } from "@supabase/supabase-js";

export type AdminIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireAdminUser(request: Request): Promise<{ client: ReturnType<typeof serviceClient>; identity: AdminIdentity }> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) throw new Response(JSON.stringify({ error: "Authentication required." }), { status: 401, headers: { "Content-Type": "application/json" } });

  const client = serviceClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Response(JSON.stringify({ error: "Your admin session has expired." }), { status: 401, headers: { "Content-Type": "application/json" } });

  let fullName = String(data.user.user_metadata?.full_name || data.user.user_metadata?.name || "").trim();
  let role = String(data.user.app_metadata?.role || "Authenticated Admin");
  try {
    const { data: profile } = await client.from("cms_profiles").select("full_name,role_name,enabled").eq("id", data.user.id).maybeSingle();
    if (profile?.enabled === false) throw new Response(JSON.stringify({ error: "This admin account is disabled." }), { status: 403, headers: { "Content-Type": "application/json" } });
    if (profile?.full_name) fullName = String(profile.full_name);
    if (profile?.role_name) role = String(profile.role_name).replaceAll("_", " ");
  } catch (error) {
    if (error instanceof Response) throw error;
  }

  return {
    client,
    identity: {
      id: data.user.id,
      email: data.user.email || "",
      fullName: fullName || data.user.email?.split("@")[0] || "Admin",
      role,
    },
  };
}
