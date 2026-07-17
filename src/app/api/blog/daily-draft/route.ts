import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const topics = [
  "How private label salt brands can choose the right retail packaging",
  "What importers should check before sourcing Himalayan pink salt",
  "PET jars, grinder bottles or stand-up pouches: choosing a salt format",
  "Bulk Himalayan pink salt packaging for food manufacturers",
  "How supermarkets can build a premium salt category",
  "Common quality questions buyers ask Himalayan pink salt exporters",
  "How custom labels and packaging improve private label shelf presence",
  "Fine grain versus coarse grain Himalayan pink salt for commercial buyers",
];

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function outputText(payload: any) {
  return payload.output_text || payload.output?.flatMap((item: any) => item.content || []).map((item: any) => item.text || "").join("") || "";
}

export async function GET(request: Request) {
  try {
    const auth = request.headers.get("authorization");
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!process.env.OPENAI_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "Missing environment configuration" }, { status: 500 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: settings } = await supabase.from("blog_automation_settings").select("*").limit(1).maybeSingle();
    if (settings && !settings.enabled) return NextResponse.json({ skipped: true, reason: "Blog automation is disabled in database." });

    const day = Math.floor(Date.now() / 86400000);
    const topic = topics[day % topics.length];
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_BLOG_MODEL || "gpt-5-mini",
        tools: [{ type: "web_search", search_context_size: "medium" }],
        input: `Research recent online discussions and trusted sources about Himalayan pink salt sourcing, packaging and B2B retail. Write a review-ready article for The Salt Origin on: ${topic}. Return JSON only with title, excerpt, content, seo_title, seo_description. 900-1200 words. Avoid medical claims and unsupported company claims. The draft must require human approval before publishing.`,
      }),
    });
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.error?.message || "AI request failed" }, { status: 500 });
    const result = JSON.parse(outputText(payload).replace(/^```json\s*/i, "").replace(/```$/i, "").trim());
    let slug = slugify(result.title || topic);
    const { data: duplicate } = await supabase.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (duplicate) slug = `${slug}-${new Date().toISOString().slice(0, 10)}`;
    const { data, error } = await supabase.from("blog_posts").insert({
      title: result.title || topic,
      slug,
      excerpt: result.excerpt || "",
      content: result.content || "",
      status: "draft",
      seo_title: result.seo_title || result.title || topic,
      seo_description: result.seo_description || result.excerpt || "",
    }).select("id,title,slug").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, draft: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Daily draft failed" }, { status: 500 });
  }
}
