import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";

const allowedPlatforms = ["linkedin", "instagram", "facebook", "pinterest", "threads", "x", "tiktok", "youtube", "reddit", "whatsapp", "telegram", "discord", "snapchat", "mastodon", "bluesky"];

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const body = await request.json();
    const topic = String(body.topic || "").trim();
    const platforms = Array.isArray(body.platforms) ? body.platforms.map(String).filter((item: string) => allowedPlatforms.includes(item)) : [];
    if (!topic) return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    if (!platforms.length) return NextResponse.json({ error: "Select at least one platform." }, { status: 400 });

    const { text, model } = await runOpenAI({
      model: process.env.OPENAI_MODEL,
      input: `Create platform-specific B2B social media drafts for The Salt Origin. Do not invent certifications, quantities, countries served, client names, statistics, prices or product claims. Use only the brief supplied below. Every output remains a draft for human review.\n\nTopic: ${topic}\nTarget countries: ${String(body.targetCountry || "Not specified")}\nTarget audience: ${String(body.targetAudience || "Not specified")}\nObjective: ${String(body.objective || "Not specified")}\nProduct: ${String(body.product || "Not specified")}\nTone: ${String(body.tone || "Professional B2B")}\nCTA: ${String(body.cta || "Not specified")}\nDestination link: ${String(body.link || "")}\nPlatforms: ${platforms.join(", ")}\n\nReturn valid JSON only in this shape: {"platforms":{"linkedin":{"title":"","text":"","hashtags":"","image_prompt":""},"instagram":{"title":"","text":"","hashtags":"","image_prompt":""}}}. Include only requested platforms. LinkedIn must be professional B2B copy. Instagram should be concise with relevant hashtags. Facebook should be conversational business copy. Pinterest must include a pin title and searchable description. Threads must be short and conversational. X must remain within 280 characters including hashtags. TikTok must include a short caption plus a video concept in title. YouTube must include a title, description and thumbnail prompt. Reddit must be useful and community-first. WhatsApp and Telegram must be concise broadcast copy. Discord must include a community discussion prompt. Snapchat must include a vertical story concept. Mastodon and Bluesky must be concise professional posts.`,
    });
    const parsed = parseJsonResponse(text);
    const raw = parsed?.platforms && typeof parsed.platforms === "object" ? parsed.platforms : {};
    const clean: Record<string, { title: string; text: string; hashtags: string; image_prompt: string }> = {};
    for (const platform of platforms) {
      const item = raw[platform] || {};
      clean[platform] = {
        title: String(item.title || ""),
        text: String(item.text || ""),
        hashtags: Array.isArray(item.hashtags) ? item.hashtags.join(" ") : String(item.hashtags || ""),
        image_prompt: String(item.image_prompt || ""),
      };
    }
    return NextResponse.json({ platforms: clean, model });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: publicApiError(error, "Social content generation failed.") }, { status: 500 });
  }
}
