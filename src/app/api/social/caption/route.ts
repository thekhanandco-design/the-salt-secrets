import { NextResponse } from "next/server";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const { topic, keywords, platforms, research } = await request.json();
    const { text } = await runOpenAI({
      model: process.env.OPENAI_BLOG_MODEL,
      tools: research ? [{ type: "web_search", search_context_size: "low" }] : undefined,
      input: `Create a premium B2B social media campaign for The Salt Origin. Topic: ${topic || "Himalayan pink salt private-label export"}. Starting keywords: ${keywords || "none supplied; research suitable buyer-intent phrases"}. Platforms: ${(platforms || []).join(", ")}. Write concise, professional copy for importers, distributors, retailers and food manufacturers. Avoid medical claims and fake statistics. Return valid JSON only with keys topic, caption, hashtags (array), keywords (array).`,
    });
    return NextResponse.json(parseJsonResponse(text));
  } catch (error) {
    return NextResponse.json({ error: publicApiError(error, "Caption generation failed.") }, { status: 500 });
  }
}
