import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | The Salt Origin",
  description: "Answers about Himalayan pink salt, private label packaging, export orders, MOQs and shipping.",
};
export const revalidate = 60;

type TextRow = {
  section_slug: string;
  field_key: string;
  default_value: string | null;
  cms_text_translations?: Array<{ language_code: string; value: string | null }>;
};
function textValue(rows: TextRow[], key: string, fallback: string) {
  const row = rows.find((item) => `${item.section_slug}.${item.field_key}` === key);
  const translated = row?.cms_text_translations?.find((item) => item.language_code === "en")?.value;
  return String(translated || row?.default_value || fallback);
}

export default async function FaqPage() {
  const [{ data }, { data: textRows }] = await Promise.all([
    supabase.from("cms_faqs").select("id,question,answer,category").eq("status", "published").order("display_order"),
    supabase.from("cms_text_entries").select("section_slug,field_key,default_value,cms_text_translations(language_code,value)").eq("page_slug", "faqs").order("display_order"),
  ]);
  const rows = data || [];
  const texts = (textRows || []) as TextRow[];
  const eyebrow = textValue(texts, "hero.eyebrow", "BUYER SUPPORT");
  const title = textValue(texts, "hero.title", "Frequently Asked Questions");
  const description = textValue(texts, "hero.description", "Clear answers for importers, distributors, wholesalers and private-label buyers.");
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: rows.map((row: any) => ({ "@type": "Question", name: row.question, acceptedAnswer: { "@type": "Answer", text: row.answer } })),
  };

  return (
    <main className="public-faq">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section data-cms-section="hero" className="faq-hero">
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <span>{description}</span>
      </section>
      <section data-cms-section="faq" className="faq-public-list">
        {rows.map((row: any) => (
          <details key={row.id}>
            <summary>{row.question}<i>+</i></summary>
            <div>{row.category ? <small>{row.category}</small> : null}<p>{row.answer}</p></div>
          </details>
        ))}
        {!rows.length ? (
          <div className="faq-empty"><strong>No published FAQs yet</strong><p>Approved FAQs will appear here automatically after publication from FAQ Intelligence.</p></div>
        ) : null}
      </section>
    </main>
  );
}
