import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { publicApiError } from "@/lib/api-errors";

async function run(request: Request) {
  try {
    if (request.method === "GET" && process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: "Supabase server configuration is missing." }, { status: 500 });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const start = new Date(); start.setUTCHours(0, 0, 0, 0); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1);
    const { count } = await supabase.from("faq_research_questions").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
    if ((count || 0) >= 5) return NextResponse.json({ skipped: true, reason: "Today's FAQ research is already available." });

    const { text, model } = await runOpenAI({
      model: process.env.OPENAI_BLOG_MODEL,
      tools: [{ type: "web_search", search_context_size: "medium" }],
      input: `Research current public buyer questions about Himalayan pink salt sourcing, private label packaging, bulk supply, food-grade specifications, certifications, MOQ, Incoterms and export documentation. Focus on international importers, distributors, wholesalers, food manufacturers and private-label brands. Use public web search evidence only; do not claim access to private ChatGPT, Gemini, Pinterest or Google user-query logs. Return only valid JSON with {"questions":[{"question":"","answer":"","source":"Public web research","target_country":"Global","related_keyword":"","category":"","schema":{"@type":"Question"},"internal_links":[],"reference_notes":"brief verifiable source context"}]}. Produce 6 distinct questions. Answers must be factual, concise, SEO-ready, non-medical, and must not invent The Salt Origin certifications or capabilities. All records are drafts for human review.`,
    });
    const parsed = parseJsonResponse(text);
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    if (!questions.length) throw new Error("The research provider returned no valid questions.");
    const rows = questions.slice(0, 8).map((item: any) => ({
      question: String(item.question || "").trim(), source: String(item.source || "Public web research"), source_mode: "Live",
      demand_score: null, target_country: String(item.target_country || "Global"),
      related_keyword: String(item.related_keyword || ""), recommended_category: String(item.category || "Buyer Questions"), ai_answer: String(item.answer || ""),
      schema_preview: item.schema || {}, internal_links: Array.isArray(item.internal_links) ? item.internal_links : [], reference_notes: String(item.reference_notes || ""), status: "New Suggestion",
    })).filter((item: any) => item.question && item.ai_answer);
    if (!rows.length) throw new Error("No complete FAQ drafts were returned.");
    const existing = await supabase.from("faq_research_questions").select("question").in("question", rows.map((row: any) => row.question));
    const known = new Set((existing.data || []).map((row: any) => String(row.question).toLowerCase()));
    const fresh = rows.filter((row: any) => !known.has(row.question.toLowerCase()));
    if (fresh.length) { const { error } = await supabase.from("faq_research_questions").insert(fresh); if (error) throw error; }
    return NextResponse.json({ success: true, created: fresh.length, model });
  } catch (error) { return NextResponse.json({ error: publicApiError(error, "FAQ research failed.") }, { status: 500 }); }
}
export async function GET(request: Request) { return run(request); }
export async function POST(request: Request) { return run(request); }
