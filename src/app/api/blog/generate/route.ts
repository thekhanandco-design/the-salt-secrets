import { NextResponse } from "next/server";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const { topic, language = "English" } = await request.json();
    if (!topic?.trim()) return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    const { text, model } = await runOpenAI({
      model: process.env.OPENAI_BLOG_MODEL,
      tools: [{ type: "web_search", search_context_size: "medium" }],
      input: `Write an original ${language} B2B article about: ${topic}. Return only valid JSON with keys title, excerpt, content, seo_title, seo_description, image_prompt. Content: 900-1200 words, H2/H3 headings, buyer guidance, FAQs and a soft quotation CTA. Avoid medical claims and unsupported claims.`,
    });
    return NextResponse.json({ ...parseJsonResponse(text), model });
  } catch (error) {
    return NextResponse.json({ error: publicApiError(error, "Generation failed.") }, { status: 500 });
  }
}
