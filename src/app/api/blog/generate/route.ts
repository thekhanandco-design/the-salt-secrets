import { NextResponse } from "next/server";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";
import { calculateGeoScore, calculateSeoScore, normalizeKeywordList, stripResearchLinks } from "@/lib/content-quality";

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = body.topic || body.keyword || body.title;
    const language = body.language || "English";
    const market = body.market || "Global";
    const audience = body.audience || "importers, distributors, food manufacturers and private-label buyers";
    if (!topic?.trim()) return NextResponse.json({ error: "Topic or primary keyword is required." }, { status: 400 });
    const { text, model } = await runOpenAI({
      model: process.env.OPENAI_BLOG_MODEL,
      timeoutMs: 55_000,
      tools: [{ type: "web_search", search_context_size: "medium" }],
      input: `Research current buyer search intent and content gaps, then write an original ${language} B2B article about: ${topic}. Market: ${market}. Audience: ${audience}.
Return only valid JSON with keys title, excerpt, content, seo_title, seo_description, slug, primary_keyword, secondary_keywords (array), keywords (array), image_prompt, source_topics (array), internal_link_suggestions (array), faq (array).
The article must naturally include the primary keyword and useful secondary/long-tail keywords in the title, introduction, section headings, body and FAQ without keyword stuffing. Content length 550-850 words. Keep it concise, readable and useful as a blog rather than a long article.
The content field must contain clean semantic HTML using only h2, h3, p, ul, ol, li and strong tags. Do not use #, ## or ### markdown headings. Do not include citations, external links, source URLs, markdown links or footnotes. Research is for topic selection and factual framing only. Include practical buyer guidance and a soft quotation CTA. Do not copy competitors, do not make medical claims, and do not invent statistics, prices, certifications, clients or backlinks.`,
    });
    const parsed = parseJsonResponse(text);
    const title = stripResearchLinks(parsed.title || topic);
    const slug = slugify(String(parsed.slug || title));
    const excerpt = stripResearchLinks(parsed.excerpt || "");
    const content = stripResearchLinks(parsed.content || "");
    const primaryKeyword = String(parsed.primary_keyword || topic).trim();
    const keywords = normalizeKeywordList(primaryKeyword, parsed.secondary_keywords || parsed.keywords, title);
    const seoTitle = stripResearchLinks(parsed.seo_title || title);
    const seoDescription = stripResearchLinks(parsed.seo_description || excerpt);
    const seoScore = calculateSeoScore({ title, slug, excerpt, content, seoTitle, seoDescription, primaryKeyword, secondaryKeywords: keywords });
    const geoScore = calculateGeoScore({ title, excerpt, content, primaryKeyword, targetCountry: String(market) });
    return NextResponse.json({ ...parsed, title, slug, excerpt, content, seo_title: seoTitle, seo_description: seoDescription, primary_keyword: primaryKeyword, secondary_keywords: keywords, keywords, seo_score: seoScore, geo_score: geoScore, model });
  } catch (error) {
    return NextResponse.json({ error: publicApiError(error, "Generation failed.") }, { status: 500 });
  }
}
