import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function POST(request: Request){
 try{
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return NextResponse.json({error:"Supabase service role is missing."},{status:500});
  const{id,role_name,enabled}=await request.json();
  const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});
  const{error}=await supabase.from("cms_profiles").update({role_name,enabled,updated_at:new Date().toISOString()}).eq("id",id);
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({success:true});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Update failed"},{status:500})}
}
