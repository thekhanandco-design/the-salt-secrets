import { publicApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { cleanText, distributedRateLimit, readJson } from "@/lib/security/http";

export async function POST(request: Request) {
  try {
    const { identity } = await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: `ai-content:${identity.id}`, limit: 20, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request, 32_000);
    const topic = cleanText(body.topic, 500);
    if (!topic) return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    const tool = cleanText(body.tool || "Blog Generator", 80);
    const isSocial = ["Facebook Post", "Instagram Caption", "LinkedIn Post", "Pinterest Pin", "Threads Post", "X Post", "YouTube Description"].includes(tool);
    const schema = isSocial
      ? "title, caption, hashtags (array), cta, image_prompt, platform_notes, seo_title, seo_description, slug, excerpt, content, faq (array), internal_links (array)"
      : "title, slug, meta_title, meta_description, excerpt, content, heading_structure (array), faq (array of question and answer objects), internal_links (array), citation_placeholders (array), cta, primary_keyword, secondary_keywords (array), image_prompt";
    const prompt = `You are creating approved-draft B2B export content for The Salt Origin, an international Himalayan salt manufacturer and exporter.\nTool: ${tool}\nTopic: ${topic}\nTarget country: ${body.country || "Global"}\nTarget audience: ${body.audience || "International B2B buyers"}\nBuyer type: ${body.buyerType || "Importer"}\nProduct: ${body.product || ""}\nSearch intent: ${body.searchIntent || "Commercial research"}\nPrimary keyword: ${body.keyword || ""}\nSecondary keywords: ${body.secondaryKeywords || ""}\nTone: ${body.tone || "Professional"}\nLanguage: ${body.language || "English"}\nLength: ${body.length || "Standard"}\nCTA: ${body.cta || "Request a quotation"}\nInternal links: ${body.internalLinks || ""}\nReference notes: ${body.referenceNotes || ""}\nBrand voice: ${body.brandVoice || "Premium, factual, clear and export-focused"}\n\nReturn valid JSON only with keys: ${schema}. Do not invent certifications, statistics, clients, prices or business claims. Omit any factual claim that is not supported by the supplied reference notes or a reliable research source. Never insert verification placeholders into the draft. Do not publish; this is a draft for human review.`;
    const { text, model } = await runOpenAI({
      model: process.env.OPENAI_BLOG_MODEL,
      input: prompt,
      timeoutMs: body.research ? 22_000 : 28_000,
      totalTimeoutMs: body.research ? 52_000 : 42_000,
      maxAttempts: body.research ? 3 : 2,
      tools: body.research ? [{ type: "web_search", search_context_size: "medium" }] : undefined,
    });
    return NextResponse.json({ ...parseJsonResponse(text), model });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: publicApiError(error, "AI generation failed.") }, { status: 500 });
  }
}
