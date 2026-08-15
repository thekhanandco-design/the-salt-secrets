import { supabase } from "@/lib/supabase";

type LegalPolicyPageProps = {
  pageSlug: "privacy-policy" | "terms-and-conditions";
  fallbackTitle: string;
};

type TextRow = {
  section_slug: string;
  field_key: string;
  default_value: string | null;
  cms_text_translations?: Array<{ language_code: string; value: string | null }>;
};

function valueFor(rows: TextRow[], key: string) {
  const row = rows.find((item) => `${item.section_slug}.${item.field_key}` === key);
  const translation = row?.cms_text_translations?.find((item) => item.language_code === "en")?.value;
  return String(translation || row?.default_value || "").trim();
}

export default async function LegalPolicyPage({ pageSlug, fallbackTitle }: LegalPolicyPageProps) {
  const [{ data: page }, { data: textRows }] = await Promise.all([
    supabase.from("page_content").select("content,updated_at").eq("page_slug", pageSlug).maybeSingle(),
    supabase
      .from("cms_text_entries")
      .select("section_slug,field_key,default_value,cms_text_translations(language_code,value)")
      .eq("page_slug", pageSlug)
      .order("display_order"),
  ]);

  const rows = (textRows || []) as TextRow[];
  const content = (page?.content || {}) as Record<string, unknown>;
  const title = String(content.heading || content.title || valueFor(rows, "content.title") || fallbackTitle);
  const introduction = String(content.introduction || valueFor(rows, "content.introduction") || "").trim();
  const body = String(content.body || valueFor(rows, "content.body") || "").trim();
  const paragraphs = body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);

  return (
    <main className="legal-policy-page">
      <section className="legal-policy-hero">
        <div className="legal-policy-inner">
          <span>THE SALT ORIGIN</span>
          <h1>{title}</h1>
          {introduction ? <p>{introduction}</p> : null}
        </div>
      </section>
      <section className="legal-policy-content">
        <div className="legal-policy-inner legal-policy-card">
          {paragraphs.length ? (
            paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)
          ) : (
            <div className="legal-policy-empty">
              <strong>Policy information is being updated.</strong>
              <p>Please contact our team if you need assistance with this policy.</p>
            </div>
          )}
          {page?.updated_at ? <small>Last updated: {new Date(page.updated_at).toLocaleDateString()}</small> : null}
        </div>
      </section>
    </main>
  );
}
