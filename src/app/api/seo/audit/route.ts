import { NextResponse } from "next/server";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";
import { requireAdminUser } from "@/lib/admin-auth";

export async function POST(request:Request){
  try{
    await requireAdminUser(request);
    const {page="home",title="",description="",keywords="",content=""}=await request.json();
    const {text,model}=await runOpenAI({model:process.env.OPENAI_MODEL,input:`Act as a senior technical and content SEO consultant for a B2B Himalayan pink salt exporter. Audit the ${page} page using the supplied information.\nTitle: ${title}\nMeta description: ${description}\nTarget keywords: ${keywords}\nPage content summary: ${String(content).slice(0,5000)}\nReturn only valid JSON with: score (0-100), primary_keyword, title_suggestion, description_suggestion, keyword_suggestions (array), quick_wins (array), technical_checks (array of {label,status,detail}), content_brief, og_title_suggestion, og_description_suggestion, image_prompt, image_alt_text. Do not invent certifications, market claims, statistics or prices.`});
    return NextResponse.json({...parseJsonResponse(text),model});
  }catch(error){if(error instanceof Response)return error;return NextResponse.json({error:publicApiError(error,"SEO audit failed.")},{status:500})}
}
