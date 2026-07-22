import { NextResponse } from "next/server";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const { focus } = await request.json();
    const { text, model } = await runOpenAI({
      model: process.env.OPENAI_BLOG_MODEL,
      tools: [{ type: "web_search", search_context_size: "medium" }],
      input: `Research current international B2B demand around ${focus || "Himalayan pink salt"}. Return only valid JSON: {"topics":[10 concise factual non-medical blog titles]}. Audience: importers, retailers, food manufacturers and private-label brands.`,
    });
    const parsed = parseJsonResponse(text);
    const topics = Array.isArray(parsed) ? parsed : parsed.topics;
    if (!Array.isArray(topics) || !topics.length) throw new Error("No valid topics were returned.");
    return NextResponse.json({ topics: topics.slice(0, 10), model });
  } catch (error) {
    return NextResponse.json({ error: publicApiError(error, "Topic research failed.") }, { status: 500 });
  }
}
