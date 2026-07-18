import { NextResponse } from "next/server";

function outputText(payload: any) {
  return payload.output_text || payload.output?.flatMap((item: any) => item.content || []).map((part: any) => part.text || "").join("") || "";
}

function extractTopics(raw: string): string[] {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === "string");
    if (Array.isArray(parsed.topics)) return parsed.topics.filter((item: unknown) => typeof item === "string");
  } catch {}
  return cleaned
    .split("\n")
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((line) => line.length > 12)
    .slice(0, 10);
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing." }, { status: 400 });
    }
    const { focus } = await request.json();
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_BLOG_MODEL || "gpt-5-mini",
        tools: [{ type: "web_search", search_context_size: "medium" }],
        input: `Research current international B2B interest around ${focus || "Himalayan pink salt"}. Return exactly 10 concise, factual, non-medical blog titles suitable for importers, retailers, food manufacturers and private-label brands. Return a JSON object with one key named topics whose value is an array of strings. Do not include markdown fences or commentary.`,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: payload?.error?.message || "Topic research failed" }, { status: response.status });
    }
    const topics = extractTopics(outputText(payload));
    if (!topics.length) return NextResponse.json({ error: "No valid topics were returned. Try again." }, { status: 502 });
    return NextResponse.json({ topics });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Topic research failed" }, { status: 500 });
  }
}
