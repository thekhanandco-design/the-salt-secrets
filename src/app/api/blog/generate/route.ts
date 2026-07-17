import { NextResponse } from "next/server";

function parseOutput(payload: any) {
  const text = payload.output_text || payload.output?.flatMap((item: any) => item.content || []).map((item: any) => item.text || "").join("") || "";
  return JSON.parse(text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim());
}

export async function POST(request: Request) {
  try {
    const { topic } = await request.json();
    if (!topic) return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_BLOG_MODEL || "gpt-5-mini",
        tools: [{ type: "web_search", search_context_size: "medium" }],
        input: `Research current high-interest B2B topics related to Himalayan pink salt, food brands, importers, private label packaging, supermarkets and bulk sourcing. Then create a factual draft about: ${topic}. Return valid JSON only with keys title, excerpt, content, seo_title, seo_description, image_prompt. Content should be 900-1200 words, professional, non-medical, original, and useful to international buyers. Do not invent certifications or company claims.`,
      }),
    });

    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.error?.message || "OpenAI request failed." }, { status: 500 });
    return NextResponse.json(parseOutput(payload));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed." }, { status: 500 });
  }
}
