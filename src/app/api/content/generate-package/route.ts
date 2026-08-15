import { NextResponse } from "next/server";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";
import { calculateGeoScore, calculateSeoScore, normalizeGeneratedArticle, normalizeKeywordList, stripResearchLinks } from "@/lib/content-quality";
import { SOCIAL_PLATFORM_KEYS, SOCIAL_PLATFORM_META, clampPlatformText, type SocialPlatformKey } from "@/lib/social-platforms";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cleanSocial(platform: SocialPlatformKey, value: any, fallbackPrompt: string) {
  return {
    title: stripResearchLinks(value?.title || ""),
    text: clampPlatformText(platform, stripResearchLinks(value?.text || value?.caption || "")),
    hashtags: String(value?.hashtags || "").replace(/https?:\/\/\S+/gi, "").trim(),
    image_prompt: stripResearchLinks(value?.image_prompt || fallbackPrompt),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = String(body.topic || "").trim();
    const primaryKeyword = String(body.primaryKeyword || topic).trim();
    const targetMarket = String(body.targetMarket || "Global").trim();
    const buyerType = String(body.buyerType || "Importers, distributors and private-label buyers").trim();
    const notes = String(body.notes || "").trim();
    const cta = String(body.cta || "Request a quotation").trim();
    const researchWithAI = Boolean(body.researchWithAI);
    const requestedPlatforms = Array.isArray(body.platforms)
      ? body.platforms.filter((item: unknown): item is SocialPlatformKey => SOCIAL_PLATFORM_KEYS.includes(String(item) as SocialPlatformKey))
      : [...SOCIAL_PLATFORM_KEYS];

    if (!topic) return NextResponse.json({ error: "Topic is required." }, { status: 400 });

    const platformRules = requestedPlatforms.map(
  (platform: keyof typeof SOCIAL_PLATFORM_META) => {
      const meta = SOCIAL_PLATFORM_META[platform];
      return `${meta.label}: target about ${meta.recommendedChars} characters, hard max ${meta.maxChars}.`;
    }).join("\n");

    const tools = researchWithAI ? [{ type: "web_search", search_context_size: "medium" }] : undefined;
    const { text, model } = await runOpenAI({
      model: process.env.OPENAI_CONTENT_MODEL || process.env.OPENAI_BLOG_MODEL || "gpt-4o-mini",
      tools,
      maxAttempts: 5,
      input: `Create one cost-efficient content package for The Salt Origin, a B2B Himalayan pink salt exporter and private-label supplier.

Topic: ${topic}
Primary keyword: ${primaryKeyword}
Target market: ${targetMarket}
Buyer audience: ${buyerType}
CTA: ${cta}
User facts / direction: ${notes || "No extra notes supplied."}
Research mode: ${researchWithAI ? "Use current public web research for factual framing." : "Do not browse. Use the supplied topic and notes only, plus stable general knowledge."}

Important factual direction:
- When relevant, clearly distinguish Pakistan, Punjab, the Salt Range and Khewra; do not imply every Himalayan pink salt product comes from one mine unless verified.
- Explain provenance, sourcing, grain size, packaging, documentation and buyer-use context accurately.
- Never invent laboratory values, purity percentages, certifications, mine claims, prices, clients, production capacity or legal approvals.
- No medical or disease-treatment claims.

SEO/GEO rules:
- One concise buyer-focused blog, roughly 800-1200 words, not a long article.
- Natural primary and secondary keywords; no keyword stuffing.
- Answer-first introduction, useful H2/H3 sections, concise factual paragraphs, buyer FAQs and a soft commercial CTA.
- Content field must be CLEAN SEMANTIC HTML using only h2, h3, p, ul, ol, li and strong tags.
- NEVER output markdown heading characters (#, ##, ###), markdown links, source URLs, citation footnotes or raw external links inside public content.
- Provide metadata suitable for search and AI answer engines.

Social platform rules:
${platformRules}
Each platform must be adapted to its own audience/length, not copied identically.

Return ONLY valid JSON in this shape:
{
  "blog": {
    "title":"", "slug":"", "excerpt":"", "content":"", "seo_title":"", "seo_description":"",
    "primary_keyword":"", "secondary_keywords":[], "image_prompt":""
  },
  "social": {
    "facebook":{"title":"","text":"","hashtags":"","image_prompt":""},
    "linkedin":{"title":"","text":"","hashtags":"","image_prompt":""}
  }
}
Include every requested social platform key in social.`,
    });

    const parsed = parseJsonResponse(text);
    const rawBlog = parsed?.blog || {};
    const title = stripResearchLinks(rawBlog.title || topic);
    const slug = slugify(String(rawBlog.slug || title));
    const excerpt = stripResearchLinks(rawBlog.excerpt || "");
    const content = normalizeGeneratedArticle(rawBlog.content || "");
    const seoTitle = stripResearchLinks(rawBlog.seo_title || title);
    const seoDescription = stripResearchLinks(rawBlog.seo_description || excerpt);
    const cleanPrimary = String(rawBlog.primary_keyword || primaryKeyword || topic).trim();
    const keywords = normalizeKeywordList(cleanPrimary, rawBlog.secondary_keywords, title);
    const imagePrompt = stripResearchLinks(rawBlog.image_prompt || `${topic}, premium B2B Himalayan pink salt editorial photography`);
    const seoScore = calculateSeoScore({
      title, slug, excerpt, content, seoTitle, seoDescription, primaryKeyword: cleanPrimary,
      secondaryKeywords: keywords,
    });
    const geoScore = calculateGeoScore({ title, excerpt, content, primaryKeyword: cleanPrimary, targetCountry: targetMarket });

    const social: Record<string, ReturnType<typeof cleanSocial>> = {};
    for (const platform of requestedPlatforms) {
      social[platform] = cleanSocial(platform, parsed?.social?.[platform], imagePrompt);
    }

    return NextResponse.json({
      blog: {
        title, slug, excerpt, content, seo_title: seoTitle, seo_description: seoDescription,
        primary_keyword: cleanPrimary, secondary_keywords: keywords, image_prompt: imagePrompt,
        seo_score: seoScore, geo_score: geoScore,
      },
      social,
      model,
      research_mode: researchWithAI ? "web" : "manual-topic",
    });
  } catch (error) {
    return NextResponse.json({ error: publicApiError(error, "Content package generation failed.") }, { status: 500 });
  }
}
