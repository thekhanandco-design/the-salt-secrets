import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";
import { SOCIAL_PLATFORM_META, clampPlatformText, type SocialPlatformKey } from "@/lib/social-platforms";
import { cleanText, distributedRateLimit, readJson } from "@/lib/security/http";

const allowedPlatforms: SocialPlatformKey[] = ["linkedin", "instagram", "facebook", "pinterest", "threads", "x", "tiktok", "youtube", "reddit", "whatsapp", "telegram", "discord", "snapchat", "mastodon", "bluesky"];

export async function POST(request: Request) {
  try {
    const { identity } = await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: `social-content:${identity.id}`, limit: 20, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const body = await readJson(request, 32_000);
    const topic = cleanText(body.topic, 500);
    const requestedPlatforms: unknown[] = Array.isArray(body.platforms) ? body.platforms : [];
    const platforms: SocialPlatformKey[] = requestedPlatforms
      .map((item) => String(item).toLowerCase())
      .filter((item): item is SocialPlatformKey => allowedPlatforms.includes(item as SocialPlatformKey));
    if (!topic) return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    if (!platforms.length) return NextResponse.json({ error: "Select at least one platform." }, { status: 400 });

    const { text, model } = await runOpenAI({
      model: process.env.OPENAI_SOCIAL_MODEL || process.env.OPENAI_MODEL,
      timeoutMs: 24_000,
      totalTimeoutMs: 48_000,
      maxAttempts: 2,
      input: `Create platform-specific B2B social media drafts for The Salt Origin. Do not invent certifications, quantities, countries served, client names, statistics, prices or product claims. Use only the brief supplied below. Every output remains a draft for human review.\n\nTopic: ${topic}\nTarget countries: ${cleanText(body.targetCountry || "Not specified", 120)}\nTarget audience: ${cleanText(body.targetAudience || "Not specified", 200)}\nObjective: ${cleanText(body.objective || "Not specified", 200)}\nProduct: ${cleanText(body.product || "Not specified", 200)}\nTone: ${cleanText(body.tone || "Professional B2B", 100)}\nCTA: ${cleanText(body.cta || "Not specified", 300)}\nPrimary keyword: ${cleanText(body.primaryKeyword || "Not specified", 250)}\nSource blog excerpt: ${cleanText(body.sourceExcerpt || "Not supplied", 5_000)}\nDestination link: ${cleanText(body.link || "", 1_000)}\nPlatforms: ${platforms.join(", ")}
Platform limits: ${platforms.map((platform) => `${SOCIAL_PLATFORM_META[platform].label} max ${SOCIAL_PLATFORM_META[platform].maxChars}, target ${SOCIAL_PLATFORM_META[platform].recommendedChars}`).join("; ")}\n\nReturn valid JSON only in this shape: {"platforms":{"linkedin":{"title":"","text":"","hashtags":"","image_prompt":""},"instagram":{"title":"","text":"","hashtags":"","image_prompt":""}}}. Include only requested platforms. LinkedIn must be professional B2B copy. Instagram should be concise with relevant hashtags. Facebook should be conversational business copy. Pinterest must include a pin title and searchable description. Threads must be short and conversational. X must remain within 280 characters including hashtags. TikTok must include a short caption plus a video concept in title. YouTube must include a title, description and thumbnail prompt. Reddit must be useful and community-first. WhatsApp and Telegram must be concise broadcast copy. Discord must include a community discussion prompt. Snapchat must include a vertical story concept. Mastodon and Bluesky must be concise professional posts.`,
    });
    const parsed = parseJsonResponse(text);
    const raw = parsed?.platforms && typeof parsed.platforms === "object" ? parsed.platforms : {};
    const clean: Record<string, { title: string; text: string; hashtags: string; image_prompt: string }> = {};
    for (const platform of platforms) {
      const item = raw[platform] || {};
      const hashtags = Array.isArray(item.hashtags) ? item.hashtags.join(" ") : String(item.hashtags || "");
      const combined = [String(item.text || "").trim(), hashtags.trim()].filter(Boolean).join(hashtags ? "\n\n" : "");
      const clamped = clampPlatformText(platform, combined);
      clean[platform] = {
        title: String(item.title || ""),
        text: clamped,
        hashtags: hashtags && clamped.includes(hashtags.trim()) ? hashtags : "",
        image_prompt: String(item.image_prompt || ""),
      };
    }
    return NextResponse.json({ platforms: clean, model });
  } catch (error) {
    if (error instanceof Response) return error;
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 500;
    return NextResponse.json({ error: status === 413 ? "Request is too large." : publicApiError(error, "Social content generation failed.") }, { status });
  }
}
