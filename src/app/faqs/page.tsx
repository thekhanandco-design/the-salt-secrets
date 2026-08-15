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
function textValue(rows: TextRow[], key: string, fallback: string) {
  const row = rows.find((item) => `${item.section_slug}.${item.field_key}` === key);
  return String(row?.cms_text_translations?.find((item) => item.language_code === "en")?.value || row?.default_value || fallback);
}

const fallbackFaqs = [
  ["Which pink salt formats can be offered?", "The catalog can support fine, medium, coarse, chunks, retail jars, grinders, pouches, bulk and lifestyle formats. Final commercial availability is confirmed against the current product database."],
  ["Can I request a custom grain size?", "Yes. Share the target application or grain range and our commercial team can confirm the most suitable specification."],
  ["Do you support private-label packaging?", "Yes. Private-label programs can cover pouches, jars, grinders and bulk formats with pack size, artwork and volume requirements built into the commercial brief."],
  ["Can I download certificates and lab reports?", "Verified facility certificates and supporting documents can be shared through the document request workflow for approved buyers."],
  ["Can the website show shipping destinations and lead times?", "Shipping scope and lead times are confirmed according to product, packaging, order volume and destination."],
  ["Can buyers request samples online?", "Yes. Qualified buyers can request product or packaging samples with company and delivery details."],
  ["Can the quote form support multiple products?", "Yes. Product, packaging, volume and destination requirements can be included in one commercial inquiry."],
  ["Is the website mobile-friendly?", "Yes. The buyer experience is designed for desktop, tablet and mobile screens."],
];

export default async function FaqPage() {
  const [{ data }, { data: textRows }] = await Promise.all([
    supabase.from("cms_faqs").select("id,question,answer,category").eq("status", "published").order("display_order"),
    supabase.from("cms_text_entries").select("section_slug,field_key,default_value,cms_text_translations(language_code,value)").eq("page_slug", "faqs").order("display_order"),
  ]);
  const rows = data?.length ? data : fallbackFaqs.map(([question, answer], index) => ({ id: `fallback-${index}`, question, answer, category: "" }));
  const texts = (textRows || []) as TextRow[];
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: rows.map((row: any) => ({ "@type": "Question", name: row.question, acceptedAnswer: { "@type": "Answer", text: row.answer } })) };

  return (
    <main className="tso-route-page tso-faq-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="tso-page-hero tso-page-hero--clean" data-cms-section="hero">
        <div className="tso-public-container">
          <div className="tso-crumbs">HOME / FAQ</div>
          <h1>{textValue(texts, "hero.title_main", "Buyer questions, ")}<em>{textValue(texts, "hero.title_accent", "answered.")}</em></h1>
          <p>{textValue(texts, "hero.description", "Built to reduce friction for importers, distributors, private-label buyers and retail teams.")}</p>
        </div>
      </section>

      <section className="tso-route-section" data-cms-section="faq">
        <div className="tso-public-container tso-faq-stack">
          <div className="tso-faq-list tso-faq-list--centered">
            {rows.map((row: any, index: number) => (
              <details key={row.id} open={index === 0}>
                <summary><span>{row.question}</span><b>+</b></summary>
                <div>{row.category ? <small>{row.category}</small> : null}<p>{row.answer}</p></div>
              </details>
            ))}
          </div>

          <aside className="tso-faq-desk-card tso-faq-desk-card--wide">
            <div>
              <div className="tso-eyebrow light">{textValue(texts, "faq.eyebrow", "Need more detail?")}</div>
              <h2>{textValue(texts, "faq.title", "Talk to the B2B desk.")}</h2>
              <p>{textValue(texts, "faq.description", "If a question is product-specific, send the product, packaging, volume and destination so it reaches the right commercial person.")}</p>
            </div>
            <Link href="/contact" className="tso-button light">{textValue(texts, "faq.button", "Ask Sales")}</Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
