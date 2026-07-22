import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(){
 return NextResponse.json({health:{
  openai:Boolean(process.env.OPENAI_API_KEY),
  supabase:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  whatsapp:Boolean(process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID),
  resend:Boolean(process.env.RESEND_API_KEY),
 },checked_at:new Date().toISOString()});
}
