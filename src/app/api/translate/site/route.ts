import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const names:Record<string,string>={ar:"Arabic",fr:"French",es:"Spanish",de:"German",pt:"Portuguese",tr:"Turkish",ur:"Urdu"};
function outputText(payload:any){return payload.output_text||payload.output?.flatMap((i:any)=>i.content||[]).map((p:any)=>p.text||"").join("")||""}
export async function POST(request:Request){
 try{
  const{language}=await request.json();const target=names[language];if(!target)return NextResponse.json({success:true,skipped:true});
  if(!process.env.OPENAI_API_KEY||!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)return NextResponse.json({error:"Translation environment variables are missing."},{status:500});
  const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data:entries,error}=await supabase.from("cms_text_entries").select("id,default_value,cms_text_translations(language_code,value)").limit(500);
  if(error)return NextResponse.json({error:error.message},{status:500});
  const missing=(entries||[]).filter((e:any)=>!e.cms_text_translations?.some((t:any)=>t.language_code===language&&t.value?.trim()));
  if(!missing.length)return NextResponse.json({success:true,translated:0});
  for(let offset=0;offset<missing.length;offset+=40){
   const batch=missing.slice(offset,offset+40);const input=Object.fromEntries(batch.map((e:any)=>[e.id,e.cms_text_translations?.find((t:any)=>t.language_code==="en")?.value||e.default_value||""]));
   const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_TRANSLATION_MODEL||"gpt-5-mini",input:`Translate the following website text values into ${target}. Preserve JSON keys, product names, numbers, units, URLs and brand name The Salt Origin. Return only one valid JSON object without markdown.\n${JSON.stringify(input)}`})});
   const payload=await response.json();if(!response.ok)return NextResponse.json({error:payload?.error?.message||"Translation failed"},{status:response.status});
   const raw=outputText(payload).replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```$/i,"").trim();const translated=JSON.parse(raw);
   const rows=batch.map((e:any)=>({entry_id:e.id,language_code:language,value:translated[e.id]||input[e.id]}));
   const{error:saveError}=await supabase.from("cms_text_translations").upsert(rows,{onConflict:"entry_id,language_code"});if(saveError)return NextResponse.json({error:saveError.message},{status:500});
  }
  return NextResponse.json({success:true,translated:missing.length});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Translation failed"},{status:500})}
}
