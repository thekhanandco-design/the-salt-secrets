import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";

const fallbackTopics = [
  "How private-label salt brands can choose the right retail packaging",
  "What importers should verify before sourcing Himalayan pink salt",
  "PET jars, grinder bottles or stand-up pouches: choosing a salt format",
  "Bulk Himalayan pink salt packaging for food manufacturers",
  "How supermarkets can build a premium salt category",
  "Common quality questions buyers ask Himalayan pink salt exporters",
  "How custom labels and packaging improve private-label shelf presence",
  "Fine grain versus coarse grain Himalayan pink salt for commercial buyers",
];

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function createDailyDraft(request: Request) {
  const auth = request.headers.get("authorization");
  const isCron = request.method === "GET";
  if (isCron && process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase server environment variables are missing." }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: settings } = await supabase.from("blog_automation_settings").select("*").limit(1).maybeSingle();
  if (settings && !settings.enabled && isCron) {
    return NextResponse.json({ skipped: true, reason: "Blog automation is disabled." });
  }

  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)).toISOString();
  const { data: existing } = await supabase
    .from("blog_posts")
    .select("id,title,slug")
    .gte("created_at", start)
    .lt("created_at", end)
    .eq("status", "draft")
    .limit(1)
    .maybeSingle();

  if (existing) return NextResponse.json({ skipped: true, reason: "Today's AI draft already exists.", draft: existing });

  const day = Math.floor(Date.now() / 86400000);
  const fallbackTopic = fallbackTopics[day % fallbackTopics.length];
  const focus = settings?.topic_focus || "Himalayan pink salt sourcing, private-label packaging, retail trends, food-industry applications and export guidance";
  const language = settings?.default_language || "English";

  const { text, model } = await runOpenAI({
    model: process.env.OPENAI_BLOG_MODEL,
    tools: [{ type: "web_search", search_context_size: "medium" }],
    input: `Act as the senior B2B editor for The Salt Origin.
Research current importer, retailer, food-manufacturer and private-label buyer interests related to: ${focus}.
Choose one strong, non-duplicate topic. A useful fallback topic is: ${fallbackTopic}.
Write one original ${language} article that is ready for human editorial review.

Return only valid JSON with:
title, excerpt, content, seo_title, seo_description, image_prompt, keywords, internal_link_suggestions.

Requirements:
- 900 to 1200 words
- clear H2 and H3 headings
- practical buyer guidance
- FAQs
- soft quotation call-to-action
- no medical claims
- no invented certifications or unsupported company claims
- professional export-industry tone
- article must remain a draft until a human approves it`,
  });

  const result = parseJsonResponse(text);
  const title = String(result.title || fallbackTopic);
  let slug = slugify(title);
  const { data: duplicateSlug } = await supabase.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
  if (duplicateSlug) slug = `${slug}-${today.toISOString().slice(0, 10)}`;

  const { data, error } = await supabase.from("blog_posts").insert({
    title,
    slug,
    excerpt: String(result.excerpt || ""),
    content: String(result.content || ""),
    status: "draft",
    seo_title: String(result.seo_title || title),
    seo_description: String(result.seo_description || result.excerpt || ""),
    featured_image: "",
    published_at: null,
  }).select("id,title,slug,status,created_at").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    success: true,
    draft: data,
    model,
    editorial: {
      image_prompt: result.image_prompt || "",
      keywords: result.keywords || [],
      internal_link_suggestions: result.internal_link_suggestions || [],
    },
  });
}

export async function GET(request: Request) {
  try { return await createDailyDraft(request); }
  catch (error) { return NextResponse.json({ error: publicApiError(error, "Daily draft failed.") }, { status: 500 }); }
}

export async function POST(request: Request) {
  try { return await createDailyDraft(request); }
  catch (error) { return NextResponse.json({ error: publicApiError(error, "Daily draft failed.") }, { status: 500 }); }
}
