import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Supabase service role environment variables are missing." }, { status: 500 });
    }
    const { email, full_name, role_name } = await request.json();
    if (!email || !role_name) return NextResponse.json({ error: "Email and role are required." }, { status: 400 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin}/admin/login`;
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo, data: { full_name, role_name } });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (data.user) {
      await supabase.from("cms_profiles").upsert({ id: data.user.id, full_name, role_name, enabled: true, updated_at: new Date().toISOString() });
    }
    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invite failed" }, { status: 500 });
  }
}
