import { NextResponse } from "next/server";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";

export async function POST(request: Request) {
  try {
    const { text, language, values } = await request.json();
    const payload = values || { value: text || "" };
    const result = await runOpenAI({
      model: process.env.OPENAI_TRANSLATION_MODEL,
      input: `Translate every JSON value into ${language}. Preserve keys, numbers, URLs, product names and the brand name The Salt Origin. Return only valid JSON.\n${JSON.stringify(payload)}`,
    });
    return NextResponse.json({ translations: parseJsonResponse(result.text), model: result.model });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Translation failed." }, { status: 500 });
  }
}
