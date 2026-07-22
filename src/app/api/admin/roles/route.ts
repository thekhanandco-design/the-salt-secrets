import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function client() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase service environment variables are missing.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{ persistSession:false } });
}
export async function POST(request: Request) {
  try {
    const { name, description, permissions } = await request.json();
    const slug = String(name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
    if (!slug) return NextResponse.json({ error:"Role name is required." }, { status:400 });
    const { data, error } = await client().from("cms_roles").insert({ name:slug, description:description || "Custom CMS role", permissions:permissions || {} }).select().single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ role:data });
  } catch (error) { return NextResponse.json({ error:error instanceof Error ? error.message : "Role creation failed." }, { status:500 }); }
}
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const { error } = await client().from("cms_roles").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success:true });
  } catch (error) { return NextResponse.json({ error:error instanceof Error ? error.message : "Role deletion failed." }, { status:500 }); }
}
