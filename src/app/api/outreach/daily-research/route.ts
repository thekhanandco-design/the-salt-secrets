import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";

async function run(request: Request) {
  try {
    if (request.method === "GET" && process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "Supabase server configuration is missing." }, { status: 500 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { text, model } = await runOpenAI({
      model: process.env.OPENAI_BLOG_MODEL,
      tools: [{ type: "web_search", search_context_size: "high" }],
      input: `Research real current public websites that may be relevant outreach or backlink opportunities for a B2B Himalayan pink salt exporter and private-label supplier. Focus on importer directories, distributor directories, food-industry publications, packaging publications, chambers of commerce, trade fairs, industry associations, guest-article opportunities and supplier listings. Return only URLs that were found through web search. Do not invent email addresses, contacts, authority scores or partnerships. Return JSON only: {"opportunities":[{"website":"https://...","country":"","type":"","notes":"why it is relevant and what must be verified manually"}]}. Return up to 8 records.`,
    });
    const parsed = parseJsonResponse(text); const opportunities = Array.isArray(parsed.opportunities) ? parsed.opportunities : [];
    const rows = opportunities.map((item: any) => ({ website: String(item.website || "").trim(), country: String(item.country || ""), opportunity_type: String(item.type || "Supplier Listing"), authority_score: null, relevance_score: null, contact_person: null, contact_email: null, status: "Identified", notes: String(item.notes || "Verify the website and contact details before outreach.") })).filter((row: any) => /^https?:\/\//i.test(row.website));
    if (!rows.length) throw new Error("No verifiable outreach URLs were returned.");
    const existing = await supabase.from("outreach_opportunities").select("website").in("website", rows.map((row: any) => row.website));
    const known = new Set((existing.data || []).map((row: any) => String(row.website).toLowerCase()));
    const fresh = rows.filter((row: any) => !known.has(row.website.toLowerCase()));
    if (fresh.length) { const { error } = await supabase.from("outreach_opportunities").insert(fresh); if (error) throw error; }
    return NextResponse.json({ success: true, created: fresh.length, model });
  } catch (error) { return NextResponse.json({ error: publicApiError(error, "Outreach research failed.") }, { status: 500 }); }
}
export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
