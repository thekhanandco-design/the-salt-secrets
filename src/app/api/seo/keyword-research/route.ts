import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function run(request: Request) {
  try {
    const isCron = request.method === "GET" && Boolean(process.env.CRON_SECRET) && request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
    if (!isCron) await requireAdminUser(request);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server configuration missing.");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const market = new URL(request.url).searchParams.get("market") || "global";
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase.from("keyword_research_runs").select("*").eq("research_date", today).eq("market", market).maybeSingle();
    if (existing) return NextResponse.json({ success: true, existing: true, research: existing });

    const { text, model } = await runOpenAI({
      tools: [{ type: "web_search", search_context_size: "medium" }],
      input: `Perform current B2B SEO keyword and competitor-topic research for The Salt Origin, a Himalayan pink salt exporter, private-label supplier and bulk salt manufacturer. Target market: ${market}. Return JSON only with primary_keywords (array of objects: keyword,intent,priority), secondary_keywords (array), questions (array), competitor_topics (array), content_opportunities (array of objects: title,primary_keyword,content_type), source_summary. Do not invent search volume, rank, CPC, backlinks, certifications, production capacity or company claims. Avoid medical claims. Focus on importers, distributors, wholesalers, private-label brands and food manufacturers.`,
    });
    const result = parseJsonResponse(text);
    const { data, error } = await supabase.from("keyword_research_runs").insert({
      research_date: today,
      market,
      provider: model,
      primary_keywords: result.primary_keywords || [],
      secondary_keywords: result.secondary_keywords || [],
      questions: result.questions || [],
      competitor_topics: result.competitor_topics || [],
      content_opportunities: result.content_opportunities || [],
      source_summary: String(result.source_summary || ""),
      status: "ready",
    }).select("*").single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, research: data, model });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: publicApiError(error, "Keyword research failed.") }, { status: 500 });
  }
}

export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
