"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Factory,
  FileCheck2,
  Globe2,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { loadCmsImages, loadCmsTextWithStyles, type CmsTextPayload } from "@/lib/cms";
import { styleToReact } from "@/lib/text-style";

type HomepageContent = {
  hero_title: string | null;
  hero_description: string | null;
  private_label_title: string | null;
  private_label_description: string | null;
  export_countries: string | null;
  buyers_count: string | null;
};

type HomeSection = { slug: string; label: string; visible: boolean; minHeight?: number; paddingTop?: number; paddingBottom?: number };
type BlogRow = { id: string | number; title: string; slug: string; excerpt?: string | null; featured_image?: string | null; category?: string | null };
type FaqRow = { id: string | number; question: string; answer: string };

const defaultContent: HomepageContent = {
  hero_title: "Himalayan Pink Salt,",
  hero_description:
    "Premium retail, private-label and bulk salt programs for importers, distributors, wholesalers and international brands.",
  private_label_title: "Private Label, Built Around Your Market",
  private_label_description:
    "Develop a coordinated salt range with packaging, branding direction and commercial requirements aligned before production.",
  export_countries: null,
  buyers_count: null,
};

const defaultSections: HomeSection[] = [
  { slug: "hero", label: "Hero", visible: true },
  { slug: "private_label", label: "Private Label", visible: true },
  { slug: "collections", label: "Signature Collections", visible: true },
  { slug: "process", label: "B2B Process", visible: true },
  { slug: "quality", label: "Quality & Documentation", visible: true },
  { slug: "export", label: "Export Program", visible: true },
  { slug: "story", label: "Brand Story", visible: true },
  { slug: "journal", label: "Salt Journal", visible: true },
  { slug: "faq", label: "FAQ", visible: true },
  { slug: "cta", label: "Lead CTA", visible: true },
];

const collectionDefaults = [
  {
    key: "retail",
    number: "01",
    eyebrow: "Retail Collection",
    title: "Retail Packaging",
    text: "Shelf-ready formats designed for grocery, gourmet, specialty retail and private-label programs.",
    image: "/product-2.png",
    tags: ["Bottles", "Jars", "Pouches"],
  },
  {
    key: "bulk",
    number: "02",
    eyebrow: "Bulk Collection",
    title: "Bulk Supply",
    text: "Commercial formats for importers, foodservice buyers and ingredient-led supply programs.",
    image: "/white-sack.png",
    tags: ["Foodservice", "Ingredient", "Export"],
  },
  {
    key: "private_label",
    number: "03",
    eyebrow: "Private Label",
    title: "Custom Brand Programs",
    text: "Packaging and brand-development support for buyers building a premium salt range under their own identity.",
    image: "/custom-labels.png",
    tags: ["Branding", "Packaging", "MOQ"],
  },
  {
    key: "animal_lick",
    number: "04",
    eyebrow: "Livestock Range",
    title: "Animal Lick Salt",
    text: "A dedicated commercial category for livestock and agricultural buyers requiring trade-ready salt formats.",
    image: "/hero-banner.png",
    tags: ["Livestock", "Trade", "Bulk"],
  },
  {
    key: "foodservice",
    number: "05",
    eyebrow: "Hospitality Range",
    title: "Foodservice Packs",
    text: "Professional salt formats for chefs, restaurants, catering, hospitality and refill requirements.",
    image: "/product-5.png",
    tags: ["HORECA", "Chef", "Refill"],
  },
  {
    key: "gourmet",
    number: "06",
    eyebrow: "Gourmet Range",
    title: "Gourmet & Lifestyle",
    text: "Presentation-led formats for gifting, gourmet shelves and curated premium salt collections.",
    image: "/product-4.png",
    tags: ["Gourmet", "Gift", "Lifestyle"],
  },
];

function normalizeSections(value: unknown): HomeSection[] {
  if (!Array.isArray(value)) return defaultSections;
  const known = new Map(defaultSections.map((item) => [item.slug, item]));
  const incoming = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Partial<HomeSection>;
      const fallback = candidate.slug ? known.get(candidate.slug) : undefined;
      if (!fallback) return null;
      return {
        slug: fallback.slug,
        label: String(candidate.label || fallback.label),
        visible: candidate.visible !== false,
        minHeight: typeof candidate.minHeight === "number" ? candidate.minHeight : undefined,
        paddingTop: typeof candidate.paddingTop === "number" ? candidate.paddingTop : undefined,
        paddingBottom: typeof candidate.paddingBottom === "number" ? candidate.paddingBottom : undefined,
      } satisfies HomeSection;
    })
    .filter(Boolean) as HomeSection[];
  const seen = new Set(incoming.map((item) => item.slug));
  return [...incoming, ...defaultSections.filter((item) => !seen.has(item.slug))];
}

export default function HomepageClone() {
  const [content, setContent] = useState<HomepageContent>(defaultContent);
  const [cmsText, setCmsText] = useState<Record<string, string>>({});
  const [cmsRichText, setCmsRichText] = useState<Record<string, CmsTextPayload>>({});
  const [cmsImages, setCmsImages] = useState<Record<string, { url: string; alt: string }>>({});
  const [sections, setSections] = useState<HomeSection[]>(defaultSections);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);

  useEffect(() => {
    const language = localStorage.getItem("salt-language") || "en";
    void loadHomepageContent(language);
    const languageHandler = (event: Event) => void loadHomepageContent((event as CustomEvent<string>).detail);
    const refresh = () => void loadHomepageContent(localStorage.getItem("salt-language") || "en");
    window.addEventListener("salt-language-change", languageHandler);
    window.addEventListener("salt-cms-updated", refresh);
    return () => {
      window.removeEventListener("salt-language-change", languageHandler);
      window.removeEventListener("salt-cms-updated", refresh);
    };
  }, []);

  async function loadHomepageContent(language = "en") {
    const [{ data: homepage }, texts, images, { data: settings }, { data: blogRows }, { data: faqRows }] = await Promise.all([
      supabase.from("homepage").select("*").limit(1).maybeSingle(),
      loadCmsTextWithStyles("home", language),
      loadCmsImages("home"),
      supabase.from("site_settings").select("config_json").limit(1).maybeSingle(),
      supabase.from("blog_posts").select("id,title,slug,excerpt,featured_image,category").eq("status", "published").order("published_at", { ascending: false }).limit(3),
      supabase.from("cms_faqs").select("id,question,answer").eq("status", "published").order("display_order").limit(4),
    ]);

    setCmsRichText(texts);
    const loadedText = Object.fromEntries(Object.entries(texts).map(([key, payload]) => [key, payload.value]));
    const legacyHeroTitles = new Set([
      "Premium Himalayan Pink Salt for Global Markets",
      "Himalayan Pink Salt Solutions For Global Markets",
      "Premium Himalayan Pink Salt Solutions for Global Markets",
    ]);
    const rawHeroTitle = texts["home.hero.title"]?.value || homepage?.hero_title || defaultContent.hero_title;
    if (legacyHeroTitles.has(String(rawHeroTitle).trim())) loadedText["home.hero.title"] = "Himalayan Pink Salt,";
    if (!String(loadedText["home.hero.title_accent"] || "").trim()) loadedText["home.hero.title_accent"] = "refined for global commerce.";
    setCmsText(loadedText);
    setCmsImages(images);
    setContent({
      hero_title: legacyHeroTitles.has(String(rawHeroTitle).trim()) ? "Himalayan Pink Salt," : rawHeroTitle,
      hero_description: texts["home.hero.description"]?.value || homepage?.hero_description || defaultContent.hero_description,
      private_label_title: texts["home.private_label.title"]?.value || homepage?.private_label_title || defaultContent.private_label_title,
      private_label_description: texts["home.private_label.description"]?.value || homepage?.private_label_description || defaultContent.private_label_description,
      export_countries: homepage?.export_countries || null,
      buyers_count: homepage?.buyers_count || null,
    });
    const config = (settings?.config_json || {}) as Record<string, unknown>;
    const pageSections = (config.page_sections || {}) as Record<string, unknown>;
    setSections(normalizeSections(pageSections.home));
    setBlogs((blogRows as BlogRow[]) || []);
    setFaqs((faqRows as FaqRow[]) || []);
  }

  const collectionCards = useMemo(
    () =>
      collectionDefaults.map((item) => ({
        ...item,
        eyebrow: cmsText[`home.collections.${item.key}_eyebrow`] || item.eyebrow,
        title: cmsText[`home.collections.${item.key}_title`] || item.title,
        text: cmsText[`home.collections.${item.key}_text`] || item.text,
        image: cmsImages[`home.collections.${item.key}`]?.url || item.image,
        alt: cmsImages[`home.collections.${item.key}`]?.alt || item.title,
      })),
    [cmsText, cmsImages],
  );

  const visibleSections = sections.filter((section) => section.visible);
  const sectionStyle = (slug: string): React.CSSProperties => {
    const section = sections.find((item) => item.slug === slug);
    return {
      minHeight: section?.minHeight ? `${section.minHeight}px` : undefined,
      paddingTop: section?.paddingTop !== undefined ? `${section.paddingTop}px` : undefined,
      paddingBottom: section?.paddingBottom !== undefined ? `${section.paddingBottom}px` : undefined,
    };
  };

  const renderSection = (slug: string) => {
    if (slug === "hero") {
      return (
        <section className="tso-home-hero" data-cms-section="hero" key={slug} style={sectionStyle(slug)}>
          <div className="tso-hero-glow" />
          <div className="tso-public-container tso-home-hero-grid">
            <div className="tso-home-hero-copy">
              <div className="tso-eyebrow" style={styleToReact(cmsRichText["home.hero.badge"]?.style)}>
                {cmsText["home.hero.badge"] || "THE SALT ORIGIN · PREMIUM EXPORT COLLECTION"}
              </div>
              <h1 style={styleToReact(cmsRichText["home.hero.title"]?.style)} data-cms-key="home.hero.title"><span data-cms-segment="base">{content.hero_title}</span>{cmsText["home.hero.title_accent"] ? <> <em className="tso-cms-accent-heading" data-cms-key="home.hero.title_accent" style={styleToReact(cmsRichText["home.hero.title_accent"]?.style)}>{cmsText["home.hero.title_accent"]}</em></> : null}</h1>
              <p className="tso-hero-lead" style={styleToReact(cmsRichText["home.hero.description"]?.style)}>{content.hero_description}</p>
              <div className="tso-hero-signals">
                <div><span>Private Label</span><b>Custom retail presentation</b></div>
                <div><span>Bulk Supply</span><b>Foodservice & ingredient formats</b></div>
                <div><span>Export Program</span><b>Structured B2B inquiry journey</b></div>
              </div>
              <div className="tso-public-actions">
                <Link href="/products" className="tso-button primary">{cmsText["home.hero.primary_button"] || "Explore Collections"}<ArrowRight /></Link>
                <Link href="/contact" className="tso-button secondary">{cmsText["home.hero.secondary_button"] || "Request a Quote"}<ArrowRight /></Link>
              </div>
              <div className="tso-trust-row">
                <span><ShieldCheck /> Specification-led</span>
                <span><PackageCheck /> Private label ready</span>
                <span><Globe2 /> International B2B</span>
              </div>
            </div>
            <div className="tso-hero-visual">
              <div className="tso-hero-free-image">
                <img src={cmsImages["home.hero.products"]?.url || "/hero-products.png"} alt={cmsImages["home.hero.products"]?.alt || "The Salt Origin Himalayan pink salt collection"} />
              </div>
            </div>
          </div>
          <div className="tso-home-ticker"><div><span>Retail Packaging</span><span>Private Label</span><span>Foodservice</span><span>Bulk Supply</span><span>Custom Specifications</span><span>Export Documentation</span></div></div>
        </section>
      );
    }

    if (slug === "private_label") {
      const privateFormats = [
        {
          key: "pouch",
          label: cmsText["home.private_label.pouch_title"] || "POUCH",
          sublabel: cmsText["home.private_label.pouch_text"] || "Stand-up & Ziplock",
          image: cmsImages["home.private_label.pouch"]?.url || "/pouches.png",
          alt: cmsImages["home.private_label.pouch"]?.alt || "Private label Himalayan pink salt pouch",
        },
        {
          key: "jar",
          label: cmsText["home.private_label.jar_title"] || "JAR",
          sublabel: cmsText["home.private_label.jar_text"] || "Plastic / Glass",
          image: cmsImages["home.private_label.jar"]?.url || "/pet-jars.png",
          alt: cmsImages["home.private_label.jar"]?.alt || "Private label Himalayan pink salt jar",
        },
        {
          key: "grinder",
          label: cmsText["home.private_label.grinder_title"] || "GRINDER",
          sublabel: cmsText["home.private_label.grinder_text"] || "Plastic / Glass",
          image: cmsImages["home.private_label.grinder"]?.url || "/grinder-bottles.png",
          alt: cmsImages["home.private_label.grinder"]?.alt || "Private label Himalayan pink salt grinder",
        },
        {
          key: "bulk",
          label: cmsText["home.private_label.bulk_title"] || "BULK",
          sublabel: cmsText["home.private_label.bulk_text"] || "5kg to 25kg+",
          image: cmsImages["home.private_label.bulk"]?.url || "/white-sack.png",
          alt: cmsImages["home.private_label.bulk"]?.alt || "Private label Himalayan pink salt bulk bag",
        },
      ];

      const privateBenefits = [
        [PackageCheck, cmsText["home.private_label.feature_one_title"] || "MULTIPLE FORMATS", cmsText["home.private_label.feature_one_text"] || "Pouch, Jar, Grinder or Bulk — we’ve got you covered."],
        [Sparkles, cmsText["home.private_label.feature_two_title"] || "FULLY CUSTOMIZABLE", cmsText["home.private_label.feature_two_text"] || "Your logo, colors, labels & design — 100% yours."],
        [ShieldCheck, cmsText["home.private_label.feature_three_title"] || "PREMIUM QUALITY", cmsText["home.private_label.feature_three_text"] || "100% natural Himalayan pink salt, processed with care."],
        [Globe2, cmsText["home.private_label.feature_four_title"] || "GLOBAL SUPPLY", cmsText["home.private_label.feature_four_text"] || "Reliable export, on-time delivery, worldwide."],
      ] as const;

      return (
        <section className="tso-section tso-private-label tso-private-program" data-cms-section="private_label" key={slug} style={sectionStyle(slug)}>
          <div className="tso-public-container">
            <div className="tso-private-program-shell">
              <div className="tso-private-program-watermark" aria-hidden="true" />
              <div className="tso-private-program-main">
                <div className="tso-private-program-copy">
                  <div className="tso-private-program-eyebrow">
                    <span />
                    {cmsText["home.private_label.eyebrow"] || "PRIVATE LABEL PROGRAM"}
                  </div>
                  <h2 className="tso-private-program-title">
                    <span>{cmsText["home.private_label.title_main"] || "Private Label."}</span>
                    <em>{cmsText["home.private_label.title_accent"] || "Built Around Your Brand."}</em>
                  </h2>
                  <div className="tso-private-program-rule"><span /></div>
                  <p className="tso-private-program-description">
                    {cmsText["home.private_label.description_v2"] || "From concept to shelf, we create fully customized Himalayan pink salt packaging that reflects your identity and connects with your customers. You imagine it, we make it real."}
                  </p>

                  <div className="tso-private-program-benefits">
                    {privateBenefits.map(([Icon, title, text]) => (
                      <article key={title}>
                        <Icon aria-hidden="true" />
                        <strong>{title}</strong>
                        <p>{text}</p>
                      </article>
                    ))}
                  </div>

                  <div className="tso-public-actions tso-private-program-actions">
                    <Link href="/private-label" className="tso-button primary">
                      {cmsText["home.private_label.button"] || "Explore Solutions"}<ArrowRight />
                    </Link>
                    <Link href="/contact" className="tso-button light">
                      {cmsText["home.private_label.quote_button"] || "Request Private Label Quote"}<ArrowRight />
                    </Link>
                  </div>
                </div>

                <div className="tso-private-program-collection">
                  <div className="tso-private-program-collection-title">
                    <span />
                    <strong>{cmsText["home.private_label.collection_title"] || "TAILORED PACKAGING COLLECTION"}</strong>
                    <span />
                  </div>
                  <div className="tso-private-program-format-grid">
                    {privateFormats.map((format) => (
                      <article key={format.key}>
                        <div className="tso-private-program-format-icon"><PackageCheck aria-hidden="true" /></div>
                        <h3>{format.label}</h3>
                        <p>{format.sublabel}</p>
                        <div className="tso-private-program-product-image">
                          <img src={format.image} alt={format.alt} />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="tso-private-program-footer">
                <article>
                  <Headphones aria-hidden="true" />
                  <div><strong>{cmsText["home.private_label.support_title"] || "DEDICATED SUPPORT"}</strong><p>{cmsText["home.private_label.support_text"] || "Our team is with you at every step — from design approval to final delivery."}</p></div>
                </article>
                <article>
                  <ShieldCheck aria-hidden="true" />
                  <div><strong>{cmsText["home.private_label.compliance_title"] || "QUALITY & COMPLIANCE"}</strong><p>{cmsText["home.private_label.compliance_text"] || "Manufactured in certified facilities with strict quality control and international food safety standards."}</p></div>
                </article>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (slug === "collections") {
      return (
        <section className="tso-section" data-cms-section="collections" key={slug} style={sectionStyle(slug)}>
          <div className="tso-public-container">
            <div className="tso-section-head"><div><div className="tso-eyebrow">Signature Collections</div><h2>{cmsText["home.collections.title"] || "Product families for international buyers."}</h2><p>{cmsText["home.collections.description"] || "A refined collection architecture covering retail, private label, bulk, livestock, foodservice and premium market formats."}</p></div><Link href="/products" className="tso-button secondary">View Full Catalog<ArrowRight /></Link></div>
            <div className="tso-collection-grid">
              {collectionCards.map((item) => (
                <article className="tso-collection-card" key={item.key}>
                  <div className="tso-collection-media"><img src={item.image} alt={item.alt} /><span>{item.number}</span></div>
                  <div className="tso-collection-body"><div className="tso-collection-kicker">{item.eyebrow}</div><h3>{item.title}</h3><p>{item.text}</p><div className="tso-chip-row">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><Link href={item.key === "private_label" ? "/private-label" : "/products"}>Explore Collection<ArrowRight /></Link></div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (slug === "process") {
      const steps = [
        ["01", "Choose", "Select the product family, grain direction and pack format.", Boxes],
        ["02", "Specify", "Define market, quantity, packaging and commercial requirements.", FileCheck2],
        ["03", "Approve", "Review specifications, artwork and quotation before production.", CheckCircle2],
        ["04", "Ship", "Coordinate production, documentation and export movement.", Truck],
      ] as const;
      return <section className="tso-section tso-process-section" data-cms-section="process" key={slug} style={sectionStyle(slug)}><div className="tso-public-container"><div className="tso-section-head"><div><div className="tso-eyebrow">Source to Shelf</div><h2>A more disciplined B2B buying journey.</h2><p>Designed to reduce commercial friction from first inquiry through approved shipment.</p></div></div><div className="tso-process-grid">{steps.map(([number, title, text, Icon]) => <article key={number}><span>{number}</span><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
    }

    if (slug === "quality") {
      return <section className="tso-section tso-quality-section" data-cms-section="quality" key={slug} style={sectionStyle(slug)}><div className="tso-public-container"><div className="tso-section-head"><div><div className="tso-eyebrow">Quality & Documentation</div><h2>Buyer confidence starts with organized evidence.</h2><p>Keep product specifications, certificates, COA files and quality documents structured and accessible for qualified buyers.</p></div><Link href="/certifications" className="tso-button secondary">Certification Center<ArrowRight /></Link></div><div className="tso-quality-grid"><article><ShieldCheck/><b>Quality Records</b><span>Organized quality records for qualified buyer review.</span></article><article><FileCheck2/><b>COA & Specifications</b><span>Product-level files and supporting documentation.</span></article><article><Building2/><b>Buyer Requests</b><span>Controlled access for commercial document requests.</span></article><article><CheckCircle2/><b>Document Control</b><span>Controlled document release for qualified commercial requests.</span></article></div></div></section>;
    }

    if (slug === "export") {
      return <section className="tso-section tso-export-section" data-cms-section="export" key={slug} style={sectionStyle(slug)}><div className="tso-public-container tso-export-grid"><div><div className="tso-eyebrow light">Export Program</div><h2>Built for international trade conversations.</h2><p>From product selection to shipment documentation, our export program supports importers, distributors, private-label brands and foodservice buyers.</p><div className="tso-export-metrics"><div><strong>{content.export_countries || "Global"}</strong><span>Market focus</span></div><div><strong>{content.buyers_count || "B2B"}</strong><span>Buyer support</span></div><div><strong>B2B</strong><span>Commercial support</span></div></div><Link href="/contact" className="tso-button light">Start an Export Inquiry<ArrowRight /></Link></div><div className="tso-map-card"><img src={cmsImages["home.export.map"]?.url || "/world-map.png"} alt={cmsImages["home.export.map"]?.alt || "International export markets"}/><span><Globe2/>International B2B market planning</span></div></div></section>;
    }

    if (slug === "story") {
      return <section className="tso-section" data-cms-section="story" key={slug} style={sectionStyle(slug)}><div className="tso-public-container tso-story-grid"><div className="tso-story-art"><img src="/hero-banner.png" alt="Himalayan pink salt origin"/><div><Sparkles/><span>Origin-led positioning</span><strong>Premium presentation with commercial discipline.</strong></div></div><div><div className="tso-eyebrow">The Origin Behind the Product</div><h2>A brand built to feel established before the first sales call.</h2><p>The Salt Origin combines provenance, structured product information, private-label flexibility and buyer-focused service in one premium international presentation.</p><div className="tso-story-points"><span><CheckCircle2/>Clear product architecture</span><span><CheckCircle2/>Professional B2B communication</span><span><CheckCircle2/>Clear buyer documentation</span><span><CheckCircle2/>Responsive export support</span></div><Link href="/about" className="tso-button secondary">Read Our Story<ArrowRight /></Link></div></div></section>;
    }

    if (slug === "journal") {
      return <section className="tso-section tso-journal-section" data-cms-section="journal" key={slug} style={sectionStyle(slug)}><div className="tso-public-container"><div className="tso-section-head"><div><div className="tso-eyebrow">The Salt Journal</div><h2>Research-led content for serious buyers.</h2><p>Commercial guides, private-label insights, sourcing topics and export-oriented educational content.</p></div><Link href="/blog" className="tso-button secondary">Open Journal<ArrowRight /></Link></div><div className="tso-blog-grid">{blogs.length ? blogs.map((post) => <article key={post.id}><div className="tso-blog-media">{post.featured_image ? <img src={post.featured_image} alt={post.title}/> : <img src="/hero-banner.png" alt="Himalayan pink salt editorial"/>}</div><div><span>{post.category || "Buyer Intelligence"}</span><h3>{post.title}</h3><p>{post.excerpt || "Read the latest commercial insight from The Salt Origin."}</p><Link href={`/blog/${post.slug}`}>Read Blog<ArrowRight/></Link></div></article>) : ["Choosing the right salt format for your market", "Private-label planning before artwork approval", "What buyers should prepare before requesting a quotation"].map((title,index)=><article key={title}><div className="tso-blog-media"><img src={index===0?"/hero-banner.png":index===1?"/custom-labels.png":"/white-sack.png"} alt="Salt buyer guide"/></div><div><span>Buyer Guide</span><h3>{title}</h3><p>Practical sourcing, packaging and export guidance for professional salt buyers.</p><Link href="/blog">Open Journal<ArrowRight/></Link></div></article>)}</div></div></section>;
    }

    if (slug === "faq") {
      return <section className="tso-section" data-cms-section="faq" key={slug} style={sectionStyle(slug)}><div className="tso-public-container tso-faq-grid"><div><div className="tso-eyebrow">Buyer Questions</div><h2>Fewer emails. Faster commercial decisions.</h2><p>Clear answers to common sourcing, packaging, documentation and export questions.</p><Link href="/faqs" className="tso-button secondary">View All FAQ<ArrowRight/></Link></div><div className="tso-faq-list">{faqs.length ? faqs.map((faq,index)=><details key={faq.id} open={index===0}><summary>{faq.question}<span>+</span></summary><p>{faq.answer}</p></details>) : <><details open><summary>Can buyers request private-label packaging?<span>+</span></summary><p>Yes. Share your target market, pack format, quantity and branding requirements so our team can prepare the right quotation.</p></details><details><summary>Can product documents be requested online?<span>+</span></summary><p>Verified specifications and supporting files can be provided to qualified buyers upon request.</p></details></>}</div></div></section>;
    }

    return <section className="tso-home-cta" data-cms-section="cta" key={slug} style={sectionStyle(slug)}><div className="tso-public-container"><div><span>Commercial Desk</span><h2>Ready to build your salt program?</h2><p>Share the product, packaging, destination and approximate volume. Our export team will review your requirements and prepare the appropriate commercial response.</p></div><div><Link href="/contact" className="tso-button light">Request a Quote<ArrowRight/></Link><Link href="/products" className="tso-button glass">Explore Products<ArrowRight/></Link></div></div></section>;
  };

  return <main className="tso-public-home">{visibleSections.map((section) => renderSection(section.slug))}</main>;
}
