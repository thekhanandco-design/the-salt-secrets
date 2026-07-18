import { NextResponse } from "next/server";

function outputText(payload: any) {
  return payload.output_text || payload.output?.flatMap((item: any) => item.content || []).map((part: any) => part.text || "").join("") || "";
}

function parseJson(raw: string) {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw new Error("AI returned an invalid draft format. Please try again.");
  }
}

export async function POST(request: Request) {
  try {
    const { topic, language = "English" } = await request.json();
    if (!topic?.trim()) return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_BLOG_MODEL || "gpt-5-mini",
        tools: [{ type: "web_search", search_context_size: "medium" }],
        input: `Research current, trustworthy B2B information and write an original ${language} article about: ${topic}. Audience: importers, retailers, food manufacturers and private-label brands. Avoid medical claims and unsupported certification/company claims. Return only a JSON object with keys title, excerpt, content, seo_title, seo_description, image_prompt. Content must be 900-1200 words with clear H2/H3 headings, practical buyer guidance, FAQs and a soft quotation CTA. Do not use markdown fences.`,
      }),
    });
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.error?.message || "OpenAI request failed." }, { status: response.status });
    return NextResponse.json(parseJson(outputText(payload)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed." }, { status: 500 });
  }
}
