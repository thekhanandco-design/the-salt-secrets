import type { Metadata } from "next";
import Link from "next/link";
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

type FaqRow = {
  id: string | number;
  question: string;
  answer: string;
  category?: string | null;
};

function textValue(rows: TextRow[], key: string, fallback: string) {
  const row = rows.find((item) => `${item.section_slug}.${item.field_key}` === key);
  return String(
    row?.cms_text_translations?.find((item) => item.language_code === "en")?.value ||
      row?.default_value ||
      fallback,
  );
}

export default async function FaqPage() {
  const [{ data }, { data: textRows }] = await Promise.all([
    supabase
      .from("cms_faqs")
      .select("id,question,answer,category")
      .eq("status", "published")
      .order("display_order"),
    supabase
      .from("cms_text_entries")
      .select("section_slug,field_key,default_value,cms_text_translations(language_code,value)")
      .eq("page_slug", "faqs")
      .order("display_order"),
  ]);

  // FAQ is CMS-only. Never inject demo/fallback questions on the public site.
  const rows = ((data || []) as FaqRow[]).filter(
    (row) => String(row.question || "").trim() && String(row.answer || "").trim(),
  );
  const texts = (textRows || []) as TextRow[];
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: rows.map((row) => ({
      "@type": "Question",
      name: row.question,
      acceptedAnswer: { "@type": "Answer", text: row.answer },
    })),
  };

  return (
    <main className="tso-route-page tso-faq-page">
      {rows.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}

      <section className="tso-page-hero tso-page-hero--clean" data-cms-section="hero">
        <div className="tso-public-container">
          <div className="tso-crumbs" data-cms-key="faqs.hero.crumbs">
            {textValue(texts, "hero.crumbs", "HOME / FAQ")}
          </div>
          <h1>
            <span data-cms-key="faqs.hero.title_main">
              {textValue(texts, "hero.title_main", "Buyer questions, ")}
            </span>
            <em data-cms-key="faqs.hero.title_accent">
              {textValue(texts, "hero.title_accent", "answered.")}
            </em>
          </h1>
          <p data-cms-key="faqs.hero.description">
            {textValue(
              texts,
              "hero.description",
              "Built to reduce friction for importers, distributors, private-label buyers and retail teams.",
            )}
          </p>
        </div>
      </section>

      <section className="tso-route-section" data-cms-section="faq">
        <div className="tso-public-container tso-faq-stack">
          {rows.length > 0 ? (
            <div className="tso-faq-list tso-faq-list--centered">
              {rows.map((row) => (
                <details key={row.id}>
                  <summary>
                    <span>{row.question}</span>
                    <b>+</b>
                  </summary>
                  <div>
                    {row.category ? <small>{row.category}</small> : null}
                    <p>{row.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="tso-faq-empty">
              <p>No FAQ questions are published yet.</p>
            </div>
          )}

          <aside className="tso-faq-desk-card tso-faq-desk-card--wide">
            <div>
              <div className="tso-eyebrow light" data-cms-key="faqs.faq.eyebrow">
                {textValue(texts, "faq.eyebrow", "Need more detail?")}
              </div>
              <h2 data-cms-key="faqs.faq.title">
                {textValue(texts, "faq.title", "Talk to the B2B desk.")}
              </h2>
              <p data-cms-key="faqs.faq.description">
                {textValue(
                  texts,
                  "faq.description",
                  "If a question is product-specific, send the product, packaging, volume and destination so it reaches the right commercial person.",
                )}
              </p>
            </div>
            <Link href="/contact" className="tso-button light" data-cms-key="faqs.faq.button">
              {textValue(texts, "faq.button", "Ask Sales")}
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
