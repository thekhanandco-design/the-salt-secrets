import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { cleanText, distributedRateLimit, readJson } from "@/lib/security/http";

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: "admin-translate", limit: 30, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request, 80_000);
    const language = cleanText(body.language, 80);
    if (!language) return NextResponse.json({ error: "Language is required." }, { status: 400 });
    const payload = body.values && typeof body.values === "object" && !Array.isArray(body.values)
      ? body.values
      : { value: cleanText(body.text, 50_000) };
    const serialized = JSON.stringify(payload);
    if (Buffer.byteLength(serialized, "utf8") > 60_000) return NextResponse.json({ error: "Translation payload is too large." }, { status: 413 });
    const result = await runOpenAI({
      model: process.env.OPENAI_TRANSLATION_MODEL,
      input: `Translate every JSON value into ${language}. Preserve keys, numbers, URLs, product names and the brand name The Salt Origin. Return only valid JSON.\n${serialized}`,
    });
    return NextResponse.json({ translations: parseJsonResponse(result.text), model: result.model });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}
