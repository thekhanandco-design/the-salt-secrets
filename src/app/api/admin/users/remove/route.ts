import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase service environment variables are missing.");
    const { id } = await request.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{ persistSession:false } });
    await supabase.from("cms_profiles").delete().eq("id", id);
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success:true });
  } catch (error) { return NextResponse.json({ error:error instanceof Error ? error.message : "User removal failed." }, { status:500 }); }
}
