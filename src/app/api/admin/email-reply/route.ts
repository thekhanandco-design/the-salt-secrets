import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { parseJsonResponse, runOpenAI } from "@/lib/openai-server";
import { readCommercialRows } from "@/lib/commercial-sheet";

export async function POST(request: Request) {
  try {
    const { client } = await requireAdminUser(request);
    const body = await request.json();
    const incoming = String(body.incoming || "").trim();
    if (!incoming) return NextResponse.json({ error: "Buyer inquiry is required." }, { status: 400 });
    const productId = Number(body.productId || 0) || null;
    const [productResult, termsResult, settingsResult, pageResult] = await Promise.all([
      productId ? client.from("products").select("*").eq("id", productId).maybeSingle() : Promise.resolve({ data: null }),
      client.from("page_content").select("content").eq("page_slug", "internal-commercial-sheet").maybeSingle(),
      client.from("site_settings").select("*").limit(1).maybeSingle(),
      client.from("page_content").select("page_slug,content").in("page_slug", ["home","products","private-label","certifications","contact"]),
    ]);
    const product = (productResult as any).data || null;
    const allTerms = readCommercialRows((termsResult as any).data?.content).filter(row => row.status === "active");
    const terms = productId ? allTerms.filter(row => Number(row.product_id || 0) === productId) : allTerms;
    const settings = settingsResult.data || {};
    const pages = pageResult.data || [];
    const context = { product, commercial_terms: terms, company: settings, website_content: pages.map(row => ({ page: row.page_slug, content: row.content })) };
    const prompt = `You are the export sales email assistant for The Salt Origin / Khan & Co. Draft a professional B2B response to the buyer inquiry below.\n\nBuyer name: ${String(body.senderName || "")}\nBuyer company: ${String(body.senderCompany || "")}\nIncoming inquiry:\n${incoming}\n\nAdditional instruction:\n${String(body.extra || "")}\n\nVerified business context (JSON):\n${JSON.stringify(context)}\n\nRules:\n- Use only facts present in the verified context or explicitly stated by the buyer.\n- Never invent MOQ, price, lead time, certification, capacity, client, port, payment term or product specification.\n- If required data is absent, ask a concise clarification question.\n- Do not promise availability or approval.\n- Keep the tone professional, clear and warm for an international B2B buyer.\n- Include a precise next step.\n- Return valid JSON only: {"subject":"...","reply":"..."}.`;
    const { text, model } = await runOpenAI({ model: process.env.OPENAI_EMAIL_MODEL || process.env.OPENAI_BLOG_MODEL, input: prompt });
    const parsed = parseJsonResponse(text);
    return NextResponse.json({ subject: parsed.subject || "Re: Your Himalayan Pink Salt Inquiry", reply: parsed.reply || parsed.content || "", model });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Email reply generation failed." }, { status: 500 });
  }
}
