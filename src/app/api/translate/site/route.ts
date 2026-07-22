import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";

const names: Record<string,string> = { ar:"Arabic",fr:"French",es:"Spanish",de:"German",pt:"Portuguese",tr:"Turkish",ur:"Urdu" };

export async function POST(request: Request) {
  try {
    const { language } = await request.json();
    const target = names[language];
    if (!target) return NextResponse.json({ success:true, translated:0 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error:"Supabase service environment variables are missing." }, { status:500 });
    }
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth:{ persistSession:false, autoRefreshToken:false } });
    const { data: entries, error } = await supabase.from("cms_text_entries").select("id,default_value,cms_text_translations(language_code,value)").limit(1000);
    if (error) throw new Error(error.message);
    const missing = (entries || []).filter((entry:any) => !entry.cms_text_translations?.some((item:any) => item.language_code === language && item.value?.trim()));
    let translatedCount = 0;
    for (let offset=0; offset<missing.length; offset+=30) {
      const batch = missing.slice(offset, offset+30);
      const input = Object.fromEntries(batch.map((entry:any) => [entry.id, entry.default_value || ""]));
      const result = await runOpenAI({
        model: process.env.OPENAI_TRANSLATION_MODEL,
        input:`Translate all JSON values into ${target}. Preserve keys, numbers, URLs, HTML and brand name The Salt Origin. Return only valid JSON.\n${JSON.stringify(input)}`,
      });
      const translated = parseJsonResponse(result.text);
      const rows = batch.map((entry:any) => ({ entry_id:entry.id, language_code:language, value:translated[entry.id] || input[entry.id] }));
      const { error: saveError } = await supabase.from("cms_text_translations").upsert(rows, { onConflict:"entry_id,language_code" });
      if (saveError) throw new Error(saveError.message);
      translatedCount += rows.length;
    }
    return NextResponse.json({ success:true, translated:translatedCount });
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : "Translation failed." }, { status:500 });
  }
}
