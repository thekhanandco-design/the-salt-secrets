import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const tables = [
  "site_settings","page_content","page_versions","seo_settings","cms_text_entries","cms_text_translations","cms_image_slots","website_assets","media_library","cms_files",
  "products","categories","blog_posts","content_drafts","cms_faqs","faq_research_questions","keyword_research_runs",
  "inquiries","b2b_companies","b2b_contacts","b2b_followups","b2b_activities","customer_accounts","sample_requests","customer_shipments",
  "business_documents","document_letterheads","certifications","website_forms","form_submissions","approval_items","social_scheduled_posts","marketing_campaigns",
  "automation_workflows","automation_runs","competitor_profiles","outreach_opportunities","geo_audits","ai_agents","integration_connections","saved_reports","activity_logs",
];

export async function GET(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    const data: Record<string, unknown[]> = {};
    const unavailable: Array<{ table:string; reason:string }> = [];
    for (const table of tables) {
      const result = await client.from(table).select("*").limit(10000);
      if (result.error) unavailable.push({ table, reason: result.error.message });
      else data[table] = result.data || [];
    }
    const payload = {
      product: "The Salt Origin Enterprise B2B Export CMS",
      exportedAt: new Date().toISOString(),
      exportedBy: { id: identity.id, email: identity.email, name: identity.fullName, role: identity.role },
      note: "This export contains live CMS records only. Authentication users and secret environment variables are intentionally excluded.",
      unavailable,
      data,
    };
    const stamp = new Date().toISOString().replace(/[:.]/g,"-");
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="the-salt-origin-cms-backup-${stamp}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Backup export failed." }, { status: 500 });
  }
}
