import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";

async function run(request: Request) {
  try {
    if (request.method === "GET" && process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "Supabase server configuration is missing." }, { status: 500 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: competitors } = await supabase.from("competitor_profiles").select("id,domain,company_name,country,market_focus").eq("status", "Active").limit(20);
    if (!competitors?.length) return NextResponse.json({ skipped: true, reason: "Add active competitor domains before running research." });
    let updated = 0;
    for (const competitor of competitors) {
      const { text } = await runOpenAI({ model: process.env.OPENAI_BLOG_MODEL, tools: [{ type: "web_search", search_context_size: "medium" }], input: `Review the public website ${competitor.domain}. Focus only on verifiable B2B positioning, certifications shown, export markets, newly visible pages or blogs, keyword themes, content gaps and backlink opportunities for comparison with The Salt Origin. Do not invent traffic, sales, private analytics or exact rankings. Return JSON only with {"market_focus":"","top_keywords":[],"content_gaps":[],"backlink_gaps":[],"notes":"brief evidence-aware summary"}.` });
      const result = parseJsonResponse(text);
      const { error } = await supabase.from("competitor_profiles").update({ market_focus: result.market_focus || competitor.market_focus || "", top_keywords: result.top_keywords || [], content_gaps: result.content_gaps || [], backlink_gaps: result.backlink_gaps || [], notes: result.notes || "", last_checked_at: new Date().toISOString() }).eq("id", competitor.id);
      if (!error) updated += 1;
    }
    return NextResponse.json({ success: true, updated });
  } catch (error) { return NextResponse.json({ error: publicApiError(error, "Competitor research failed.") }, { status: 500 }); }
}
export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
