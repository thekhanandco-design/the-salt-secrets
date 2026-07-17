import { NextResponse } from "next/server";

const languageNames: Record<string, string> = {
  ar: "Arabic", fr: "French", es: "Spanish", de: "German",
  pt: "Portuguese", tr: "Turkish", ur: "Urdu",
};

type TranslationItem = { key: string; value: string };

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing in .env.local / Vercel." }, { status: 400 });
    }

    const body = await request.json() as { language: string; items: TranslationItem[] };
    const target = languageNames[body.language];
    if (!target || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Invalid translation request." }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TRANSLATION_MODEL || "gpt-5-mini",
        input: [
          {
            role: "system",
            content: `Translate website UI and marketing copy from English to ${target}. Preserve brand names, numbers, punctuation, product weights, URLs, HTML-free plain text and the exact JSON keys. Return only a valid JSON object mapping each key to its translated string.`,
          },
          {
            role: "user",
            content: JSON.stringify(Object.fromEntries(body.items.map((item) => [item.key, item.value]))),
          },
        ],
        text: { format: { type: "json_object" } },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "Translation service failed." }, { status: response.status });
    }

    const output = data.output_text || data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || []).map((part: { text?: string }) => part.text || "").join("") || "{}";
    const translations = JSON.parse(output);
    return NextResponse.json({ translations });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Translation failed." }, { status: 500 });
  }
}
