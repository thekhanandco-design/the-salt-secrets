import { NextResponse } from "next/server";

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
        input: `Create a factual B2B blog draft for The Salt Origin about: ${topic}. Return valid JSON only with keys title, excerpt, content, seo_title, seo_description. Content should be 900-1200 words, professional, helpful, non-medical, and relevant to importers, food brands, wholesalers, supermarkets, private label buyers, or Himalayan pink salt sourcing.`,
      }),
    });

    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.error?.message || "OpenAI request failed." }, { status: 500 });
    const text = payload.output_text || payload.output?.flatMap((item: { content?: { text?: string }[] }) => item.content || []).map((item: { text?: string }) => item.text || "").join("") || "";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    return NextResponse.json(JSON.parse(cleaned));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed." }, { status: 500 });
  }
}
