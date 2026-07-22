import { NextResponse } from "next/server";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";
export async function POST(request:Request){try{const{keywords,platforms}=await request.json();const{text}=await runOpenAI({model:process.env.OPENAI_BLOG_MODEL,input:`Create a premium B2B social caption for The Salt Origin using these keywords: ${keywords||"Himalayan pink salt, private label, wholesale export"}. Target platforms: ${(platforms||[]).join(", ")}. Avoid medical claims. Return valid JSON only: {"caption":"...","hashtags":["#tag"]}.`});return NextResponse.json(parseJsonResponse(text))}catch(error){return NextResponse.json({error:publicApiError(error,"Caption generation failed.")},{status:500})}}
