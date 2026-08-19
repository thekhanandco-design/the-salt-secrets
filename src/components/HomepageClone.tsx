"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  CheckCircle2,
  Factory,
  FileCheck2,
  Globe2,
  Handshake,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { loadCmsImages, loadCmsTextWithStyles, type CmsTextPayload } from "@/lib/cms";
import { styleToReact } from "@/lib/text-style";
import { APPROVED_PRODUCT_CATEGORIES } from "@/lib/product-catalog";
import { FACILITY_CERTIFICATIONS, certificationMatches } from "@/lib/certification-catalog";

type HomepageContent = {
  hero_title: string | null;
  hero_description: string | null;
};

type HomeSection = {
  slug: string;
  label: string;
  visible: boolean;
  minHeight?: number;
  paddingTop?: number;
  paddingBottom?: number;
};

type BlogRow = {
  id: string | number;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image?: string | null;
  category?: string | null;
  published_at?: string | null;
};

type CategoryRow = {
  id?: number;
  name: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  status?: string | null;
  display_order?: number | null;
};

type CertificationRow = {
  id?: string | number;
  document_name?: string | null;
  category?: string | null;
  visibility?: string | null;
  status?: string | null;
};

const defaultContent: HomepageContent = {
  hero_title: "Himalayan Pink Salt,",
  hero_description:
    "We supply premium quality Himalayan pink salt from Pakistan for importers, distributors, wholesalers, foodservice buyers and international brands.",
};

const defaultSections: HomeSection[] = [
  { slug: "hero", label: "Hero", visible: true },
  { slug: "value_cards", label: "Why The Salt Origin", visible: true },
  { slug: "who_we_supply", label: "Who We Supply", visible: true },
  { slug: "products", label: "Himalayan Pink Salt Products", visible: true },
  { slug: "private_label", label: "Private Label", visible: true },
  { slug: "origin", label: "Khewra Salt Mine Origin", visible: true },
  { slug: "quality", label: "Quality You Can Trust", visible: true },
  { slug: "resources", label: "Helpful Resources for Buyers", visible: true },
];

function normalizeSections(value: unknown): HomeSection[] {
  if (!Array.isArray(value)) return defaultSections;
  const saved = value.filter((item): item is Partial<HomeSection> => Boolean(item && typeof item === "object"));
  const hasCurrentLayout = saved.some((item) => item.slug === "value_cards")
    && saved.some((item) => item.slug === "who_we_supply")
    && saved.some((item) => item.slug === "resources");

  if (!hasCurrentLayout) {
    const previous = new Map(saved.map((item) => [String(item.slug || ""), item]));
    return defaultSections.map((section) => {
      const old = previous.get(section.slug);
      return old
        ? {
            ...section,
            visible: old.visible !== false,
            minHeight: typeof old.minHeight === "number" ? old.minHeight : undefined,
            paddingTop: typeof old.paddingTop === "number" ? old.paddingTop : undefined,
            paddingBottom: typeof old.paddingBottom === "number" ? old.paddingBottom : undefined,
          }
        : section;
    });
  }

  const canonical = new Map(defaultSections.map((item) => [item.slug, item]));
  const normalized = saved
    .map((item) => {
      const fallback = item.slug ? canonical.get(item.slug) : undefined;
      if (!fallback) return null;
      return {
        ...fallback,
        visible: item.visible !== false,
        minHeight: typeof item.minHeight === "number" ? item.minHeight : undefined,
        paddingTop: typeof item.paddingTop === "number" ? item.paddingTop : undefined,
        paddingBottom: typeof item.paddingBottom === "number" ? item.paddingBottom : undefined,
      } satisfies HomeSection;
    })
    .filter(Boolean) as HomeSection[];
  const seen = new Set(normalized.map((item) => item.slug));
  return [...normalized, ...defaultSections.filter((item) => !seen.has(item.slug))];
}

function categoryKey(slug: string) {
  return slug.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
}


function qualityImageKey(key: string) {
  const aliases: Record<string, string> = {
    "iso-22000": "iso",
    "fda-registration": "fda",
    "food-safety": "food",
  };
  return aliases[key] || key.replace(/[^a-z0-9]+/gi, "_");
}

function activeStatus(value?: string | null) {
  const status = String(value || "").toLowerCase();
  return !status || status === "active" || status === "published";
}

export default function HomepageClone() {
  const [content, setContent] = useState<HomepageContent>(defaultContent);
  const [cmsText, setCmsText] = useState<Record<string, string>>({});
  const [cmsRichText, setCmsRichText] = useState<Record<string, CmsTextPayload>>({});
  const [cmsImages, setCmsImages] = useState<Record<string, { url: string; alt: string }>>({});
  const [sections, setSections] = useState<HomeSection[]>(defaultSections);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [certifications, setCertifications] = useState<CertificationRow[]>([]);

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
    const [homepageResult, texts, images, settingsResult, blogResult, categoryResult, certificationResult] = await Promise.all([
      supabase.from("homepage").select("*").limit(1).maybeSingle(),
      loadCmsTextWithStyles("home", language),
      loadCmsImages("home"),
      supabase.from("public_site_settings").select("config_json").limit(1).maybeSingle(),
      supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,featured_image,category,published_at,content_type,status")
        .eq("status", "published")
        .eq("content_type", "blog")
        .order("published_at", { ascending: false })
        .limit(50),
      supabase.from("categories").select("id,name,slug,subtitle,description,image,status,display_order").order("display_order"),
      supabase.from("public_certifications").select("id,document_name,category,visibility,status").order("created_at"),
    ]);

    setCmsRichText(texts);
    const loadedText = Object.fromEntries(Object.entries(texts).map(([key, payload]) => [key, payload.value]));
    const legacyHeroTitles = new Set([
      "Premium Himalayan Pink Salt for Global Markets",
      "Himalayan Pink Salt Solutions For Global Markets",
      "Premium Himalayan Pink Salt Solutions for Global Markets",
    ]);
    const homepage = homepageResult.data;
    const rawHeroTitle = texts["home.hero.title"]?.value || homepage?.hero_title || defaultContent.hero_title;
    if (legacyHeroTitles.has(String(rawHeroTitle).trim())) loadedText["home.hero.title"] = "Himalayan Pink Salt,";
    if (!String(loadedText["home.hero.title_accent"] || "").trim()) loadedText["home.hero.title_accent"] = "refined for global commerce.";

    // One-time display migration for fields that existed in the previous homepage
    // with different semantics. Exact legacy values are replaced; genuine user edits
    // remain untouched.
    if (String(loadedText["home.hero.primary_button"] || "").trim() === "Explore Products") loadedText["home.hero.primary_button"] = "Request a Quote";
    if (["Request Quote", "Request a Quote"].includes(String(loadedText["home.hero.secondary_button"] || "").trim())) loadedText["home.hero.secondary_button"] = "Explore Products";
    if (String(loadedText["home.private_label.title_main"] || "").trim() === "Private Label.") loadedText["home.private_label.title_main"] = "Private Label";
    if (String(loadedText["home.private_label.title_accent"] || "").trim() === "Built Around Your Brand.") loadedText["home.private_label.title_accent"] = "Himalayan Pink Salt";
    if (String(loadedText["home.private_label.description"] || "").trim() === "We help brands create their identity with fully customized bottles and packaging.") loadedText["home.private_label.description"] = "Build your own salt brand with flexible packaging, custom presentation and a buyer-focused workflow from concept to export.";
    if (String(loadedText["home.quality.title_main"] || "").trim() === "Buyer Confidence Starts with") loadedText["home.quality.title_main"] = "Quality You Can";
    if (String(loadedText["home.quality.title_accent"] || "").trim() === "Organized Evidence.") loadedText["home.quality.title_accent"] = "Trust";
    if (!["Certification Center", "Certifications Center"].includes(String(loadedText["home.quality.button"] || "").trim())) {
      if (!String(loadedText["home.quality.button"] || "").trim() || String(loadedText["home.quality.button"] || "").trim() === "View Quality Documentation") loadedText["home.quality.button"] = "Certification Center";
    }
    setCmsText(loadedText);
    setCmsImages(images);
    setContent({
      hero_title: legacyHeroTitles.has(String(rawHeroTitle).trim()) ? "Himalayan Pink Salt," : rawHeroTitle,
      hero_description: texts["home.hero.description"]?.value || homepage?.hero_description || defaultContent.hero_description,
    });

    const config = (settingsResult.data?.config_json && typeof settingsResult.data.config_json === "object"
      ? settingsResult.data.config_json
      : {}) as Record<string, unknown>;
    const pageSections = (config.page_sections && typeof config.page_sections === "object" ? config.page_sections : {}) as Record<string, unknown>;
    const resourceIds = Array.isArray(config.home_resource_blog_ids)
      ? config.home_resource_blog_ids.map((value) => String(value)).filter(Boolean).slice(0, 4)
      : [];
    setSections(normalizeSections(pageSections.home));
    setSelectedResourceIds(resourceIds);
    setBlogs((blogResult.data || []) as BlogRow[]);
    setCategories((categoryResult.data || []) as CategoryRow[]);
    setCertifications((certificationResult.data || []) as CertificationRow[]);
  }

  const productFamilies = useMemo(() => {
    return APPROVED_PRODUCT_CATEGORIES.map((fallback) => {
      const saved = categories.find((item) => item.slug === fallback.slug);
      const key = categoryKey(fallback.slug);
      return {
        ...fallback,
        ...saved,
        name: cmsText[`home.products.category_${key}_title`] || saved?.name || fallback.name,
        description: cmsText[`home.products.category_${key}_description`] || saved?.description || fallback.description,
        // Homepage product-family cards intentionally use their own square CMS
        // images. Never fall back to categories.image because that field powers
        // the wide Products-page hero banners and must remain independent.
        image: cmsImages[`home.products.card_${key}`]?.url || fallback.image,
        alt: cmsImages[`home.products.card_${key}`]?.alt || `${saved?.name || fallback.name} Himalayan pink salt product family`,
      };
    }).filter((item) => activeStatus(item.status));
  }, [categories, cmsImages, cmsText]);

  const visibleCertifications = useMemo(() => {
    return FACILITY_CERTIFICATIONS.map((item) => ({
      ...item,
      record: certifications.find((record) => certificationMatches(record, item)),
    })).filter((item) => String(item.record?.visibility || "Public").toLowerCase() !== "hidden");
  }, [certifications]);

  const resourcePosts = useMemo(() => {
    if (!blogs.length) return [];
    if (!selectedResourceIds.length) return blogs.slice(0, 4);
    const lookup = new Map(blogs.map((post) => [String(post.id), post]));
    return selectedResourceIds.map((id) => lookup.get(id)).filter(Boolean).slice(0, 4) as BlogRow[];
  }, [blogs, selectedResourceIds]);

  const visibleSections = sections.filter((section) => section.visible);
  const sectionStyle = (slug: string): React.CSSProperties => {
    const section = sections.find((item) => item.slug === slug);
    return {
      minHeight: section?.minHeight ? `${section.minHeight}px` : undefined,
      paddingTop: section?.paddingTop !== undefined ? `${section.paddingTop}px` : undefined,
      paddingBottom: section?.paddingBottom !== undefined ? `${section.paddingBottom}px` : undefined,
    };
  };

  const valueCards = [
    {
      icon: MapPin,
      titleKey: "home.value_cards.card_1_title",
      textKey: "home.value_cards.card_1_text",
      title: "From Khewra Salt Mines",
      text: "Historic Himalayan salt origin in Punjab, Pakistan.",
    },
    {
      icon: ShieldCheck,
      titleKey: "home.value_cards.card_2_title",
      textKey: "home.value_cards.card_2_text",
      title: "High Quality Himalayan Salt",
      text: "Buyer-focused quality controls and clear product specifications.",
    },
    {
      icon: Boxes,
      titleKey: "home.value_cards.card_3_title",
      textKey: "home.value_cards.card_3_text",
      title: "Multiple Formats for Every Industry",
      text: "Fine, coarse, retail, bulk, culinary, décor and livestock formats.",
    },
    {
      icon: PackageCheck,
      titleKey: "home.value_cards.card_4_title",
      textKey: "home.value_cards.card_4_text",
      title: "Private Label Solutions",
      text: "Custom packaging and brand-ready programs for international buyers.",
    },
    {
      icon: Globe2,
      titleKey: "home.value_cards.card_5_title",
      textKey: "home.value_cards.card_5_text",
      title: "Global B2B Supply",
      text: "Commercial support for importers, distributors and wholesale buyers.",
    },
  ];

  const buyerCards = [
    { icon: Globe2, key: "importers", title: "Importer", legacyTitles: ["Importers"], text: "Bulk and container supply for international import programs." },
    { icon: Warehouse, key: "distributors", title: "Distributor", legacyTitles: ["Distributors"], text: "Consistent products and formats for distribution networks." },
    { icon: ShoppingBag, key: "private_label", title: "Private Label Brand", legacyTitles: ["Private Label Brands"], text: "Custom retail presentation for your own brand and market." },
    { icon: Building2, key: "wholesalers", title: "Wholesale", legacyTitles: ["Wholesalers", "Wholesaler"], text: "Commercial formats and competitive volume planning." },
    { icon: UtensilsCrossed, key: "foodservice", title: "Food Service", legacyTitles: ["Foodservice"], text: "Salt formats for restaurants, catering and hospitality buyers." },
    { icon: Store, key: "retail", title: "Retailer", legacyTitles: ["Retail Brands", "Retail Brand"], text: "Shelf-ready packaging for grocery, gourmet and specialty retail." },
  ];

  const renderSection = (slug: string) => {
    if (slug === "hero") {
      return (
        <section className="tso-home-hero home-seo-v77-hero" data-cms-section="hero" key={slug} style={sectionStyle(slug)}>
          <div className="tso-hero-glow" />
          <div className="tso-public-container tso-home-hero-grid home-seo-v77-hero-grid">
            <div className="tso-home-hero-copy">
              <div className="tso-eyebrow" data-cms-key="home.hero.badge" style={styleToReact(cmsRichText["home.hero.badge"]?.style)}>
                {cmsText["home.hero.badge"] || "PREMIUM QUALITY"}
              </div>
              <h1>
                <span data-cms-key="home.hero.title" style={styleToReact(cmsRichText["home.hero.title"]?.style)}>{content.hero_title}</span>{" "}
                <em className="tso-cms-accent-heading" data-cms-key="home.hero.title_accent" style={styleToReact(cmsRichText["home.hero.title_accent"]?.style)}>
                  {cmsText["home.hero.title_accent"] || "refined for global commerce."}
                </em>
              </h1>
              <p className="tso-hero-lead" data-cms-key="home.hero.description" style={styleToReact(cmsRichText["home.hero.description"]?.style)}>
                {content.hero_description}
              </p>

              <div className="home-seo-v77-hero-trust">
                {[
                  [BadgeCheck, "trust_pure", "100% Pure", "Natural & Unrefined"],
                  [MapPin, "trust_khewra", "Directly from Khewra", "Historic Salt Range"],
                  [ShieldCheck, "trust_quality", "Export Quality", "Specification Focused"],
                  [Globe2, "trust_shipping", "Global Shipping", "International B2B"],
                ].map(([Icon, field, title, note]) => {
                  const TrustIcon = Icon as typeof BadgeCheck;
                  const titleKey = `home.hero.${String(field)}`;
                  const noteKey = `home.hero.${String(field)}_note`;
                  return (
                    <div key={String(field)}><TrustIcon /><div><strong data-cms-key={titleKey}>{cmsText[titleKey] || String(title)}</strong><span data-cms-key={noteKey}>{cmsText[noteKey] || String(note)}</span></div></div>
                  );
                })}
              </div>

              <div className="tso-public-actions">
                <Link href="/contact" className="tso-button primary"><span data-cms-key="home.hero.primary_button">{cmsText["home.hero.primary_button"] || "Request a Quote"}</span><ArrowRight /></Link>
                <Link href="/products" className="tso-button secondary"><span data-cms-key="home.hero.secondary_button">{cmsText["home.hero.secondary_button"] || "Explore Products"}</span><ArrowRight /></Link>
              </div>
            </div>

            <div className="tso-hero-visual home-seo-v77-hero-visual">
              <img
                data-cms-image-key="home.hero.products"
                src={cmsImages["home.hero.products"]?.url || "/hero-products.png"}
                alt={cmsImages["home.hero.products"]?.alt || "The Salt Origin Himalayan pink salt products"}
              />
            </div>
          </div>
        </section>
      );
    }

    if (slug === "value_cards") {
      return (
        <section className="home-seo-v77-value-section" data-cms-section="value_cards" key={slug} style={sectionStyle(slug)}>
          <div className="tso-public-container home-seo-v77-value-grid">
            {valueCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.titleKey}>
                  <span><Icon /></span>
                  <div><h3 data-cms-key={item.titleKey}>{cmsText[item.titleKey] || item.title}</h3><p data-cms-key={item.textKey}>{cmsText[item.textKey] || item.text}</p></div>
                </article>
              );
            })}
          </div>
        </section>
      );
    }

    if (slug === "who_we_supply") {
      return (
        <section className="home-seo-v77-section home-seo-v77-buyers" data-cms-section="who_we_supply" key={slug} style={sectionStyle(slug)}>
          <div className="tso-public-container">
            <header className="home-seo-v77-centered-head">
              <h2 className="tso-split-heading"><span data-cms-key="home.who_we_supply.title_main">{cmsText["home.who_we_supply.title_main"] || "Who We"}</span> <em data-cms-key="home.who_we_supply.title_accent">{cmsText["home.who_we_supply.title_accent"] || "Supply"}</em></h2>
              <p data-cms-key="home.who_we_supply.description">{cmsText["home.who_we_supply.description"] || "Himalayan pink salt supply programs structured for professional buyers across international markets."}</p>
            </header>
            <div className="home-seo-v77-buyer-grid">
              {buyerCards.map((buyer) => {
                const Icon = buyer.icon;
                const titleKey = `home.who_we_supply.${buyer.key}_title`;
                const savedTitle = String(cmsText[titleKey] || "").trim();
                const displayTitle = !savedTitle || buyer.legacyTitles.includes(savedTitle) ? buyer.title : savedTitle;
                return <article key={buyer.key}><span><Icon /></span><h3 data-cms-key={titleKey}>{displayTitle}</h3><p data-cms-key={`home.who_we_supply.${buyer.key}_text`}>{cmsText[`home.who_we_supply.${buyer.key}_text`] || buyer.text}</p></article>;
              })}
            </div>
          </div>
        </section>
      );
    }

    if (slug === "products") {
      return (
        <section className="home-seo-v77-section home-seo-v77-products" data-cms-section="products" key={slug} style={sectionStyle(slug)}>
          <div className="tso-public-container">
            <header className="home-seo-v77-centered-head">
              <h2 className="tso-split-heading"><span data-cms-key="home.products.title_main">{cmsText["home.products.title_main"] || "Our Himalayan Pink Salt"}</span> <em data-cms-key="home.products.title_accent">{cmsText["home.products.title_accent"] || "Products"}</em></h2>
              <p data-cms-key="home.products.description">{cmsText["home.products.description"] || "Explore our six core Himalayan pink salt product families for food, retail, décor, culinary, livestock and bulk supply."}</p>
            </header>
            <div className="home-seo-v77-product-grid">
              {productFamilies.map((family) => {
                const key = categoryKey(family.slug);
                return (
                  <article key={family.slug}>
                    <Link href={`/products/categories/${family.slug}`} className="home-seo-v77-product-image">
                      <img data-cms-image-key={`home.products.card_${key}`} src={family.image} alt={family.alt} />
                    </Link>
                    <div className="home-seo-v77-product-copy">
                      <h3 data-cms-key={`home.products.category_${key}_title`}>{family.name}</h3>
                      <p data-cms-key={`home.products.category_${key}_description`}>{family.description}</p>
                      <Link href={`/products/categories/${family.slug}`}><span data-cms-key="home.products.view_details">{cmsText["home.products.view_details"] || "View Products"}</span><ArrowRight /></Link>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="home-seo-v77-section-action"><Link href="/products" className="tso-button primary"><span data-cms-key="home.products.view_all">{cmsText["home.products.view_all"] || "View All Products"}</span><ArrowRight /></Link></div>
          </div>
        </section>
      );
    }

    if (slug === "private_label") {
      const features = [
        [PackageCheck, "feature_1", "Custom Packaging"],
        [BadgeCheck, "feature_2", "Custom Labeling"],
        [Boxes, "feature_3", "Multiple Formats"],
        [Handshake, "feature_4", "Commercial MOQ Planning"],
        [Globe2, "feature_5", "Worldwide Delivery Support"],
      ] as const;
      return (
        <section className="home-seo-v77-section home-seo-v77-private" data-cms-section="private_label" key={slug} style={sectionStyle(slug)}>
          <div className="tso-public-container home-seo-v77-private-card">
            <div className="home-seo-v77-private-copy">
              <div className="tso-eyebrow" data-cms-key="home.private_label.eyebrow">{cmsText["home.private_label.eyebrow"] || "PRIVATE LABEL"}</div>
              <h2 className="tso-split-heading"><span data-cms-key="home.private_label.title_main">{cmsText["home.private_label.title_main"] || "Private Label"}</span> <em data-cms-key="home.private_label.title_accent">{cmsText["home.private_label.title_accent"] || "Himalayan Pink Salt"}</em></h2>
              <p data-cms-key="home.private_label.description">{cmsText["home.private_label.description"] || "Build your own salt brand with flexible packaging, custom presentation and a buyer-focused workflow from concept to export."}</p>
              <div className="home-seo-v77-private-features">
                {features.map(([Icon, key, fallback]) => <span key={key}><Icon /><b data-cms-key={`home.private_label.${key}`}>{cmsText[`home.private_label.${key}`] || fallback}</b></span>)}
              </div>
              <Link href="/private-label" className="tso-button primary"><span data-cms-key="home.private_label.button">{cmsText["home.private_label.button"] || "Explore Private Label"}</span><ArrowRight /></Link>
            </div>
            <div className="home-seo-v77-private-visual">
              <img data-cms-image-key="home.private_label.visual" src={cmsImages["home.private_label.visual"]?.url || "/custom-packaging.png"} alt={cmsImages["home.private_label.visual"]?.alt || "Private label Himalayan pink salt packaging"} />
            </div>
          </div>
        </section>
      );
    }

    if (slug === "origin") {
      const originPoints = [
        ["point_1", "Historic Himalayan salt origin in Punjab, Pakistan"],
        ["point_2", "Naturally occurring mineral profile and distinctive pink appearance"],
        ["point_3", "Commercial grading, packing and specification-focused supply"],
        ["point_4", "Export-ready support for international B2B buyers"],
      ] as const;
      return (
        <section className="home-seo-v77-section home-seo-v77-origin" data-cms-section="origin" key={slug} style={sectionStyle(slug)}>
          <div className="tso-public-container home-seo-v77-origin-grid">
            <div className="home-seo-v77-origin-visual">
              <img data-cms-image-key="home.origin.mine" src={cmsImages["home.origin.mine"]?.url || "/authentic-origin-khewra.png"} alt={cmsImages["home.origin.mine"]?.alt || "Khewra Salt Mine, Punjab, Pakistan"} />
              <div><MapPin /><span><b data-cms-key="home.origin.location">{cmsText["home.origin.location"] || "Khewra Salt Mines"}</b><small data-cms-key="home.origin.location_note">{cmsText["home.origin.location_note"] || "Punjab, Pakistan"}</small></span></div>
            </div>
            <div className="home-seo-v77-origin-copy">
              <div className="tso-eyebrow" data-cms-key="home.origin.eyebrow">{cmsText["home.origin.eyebrow"] || "AUTHENTIC ORIGIN"}</div>
              <h2 className="tso-split-heading"><span data-cms-key="home.origin.title_main">{cmsText["home.origin.title_main"] || "Sourced from"}</span> <em data-cms-key="home.origin.title_accent">{cmsText["home.origin.title_accent"] || "Khewra Salt Mines"}</em></h2>
              <p data-cms-key="home.origin.description">{cmsText["home.origin.description"] || "Our Himalayan pink salt begins at Pakistan’s historic Salt Range. We connect authentic origin with clear product specifications, dependable packing and professional export support."}</p>
              <div className="home-seo-v77-origin-points">
                {originPoints.map(([key, text]) => <span key={key}><CheckCircle2 /><b data-cms-key={`home.origin.${key}`}>{cmsText[`home.origin.${key}`] || text}</b></span>)}
              </div>
              <Link href="/about" className="tso-button secondary"><span data-cms-key="home.origin.button">{cmsText["home.origin.button"] || "Learn More About Our Origin"}</span><ArrowRight /></Link>
            </div>
          </div>
        </section>
      );
    }

    if (slug === "quality") {
      return (
        <section className="home-seo-v77-section home-seo-v77-quality" data-cms-section="quality" key={slug} style={sectionStyle(slug)}>
          <div className="tso-public-container">
            <header className="home-seo-v77-centered-head">
              <h2 className="tso-split-heading"><span data-cms-key="home.quality.title_main">{cmsText["home.quality.title_main"] || "Quality You Can"}</span> <em data-cms-key="home.quality.title_accent">{cmsText["home.quality.title_accent"] || "Trust"}</em></h2>
              <p data-cms-key="home.quality.description">{cmsText["home.quality.description"] || "Facility documentation and supporting quality records are organized for qualified buyer review where applicable."}</p>
            </header>
            <div className="home-seo-v77-quality-grid">
              {visibleCertifications.map((item) => {
                const imageKey = qualityImageKey(item.key);
                const image = cmsImages[`home.quality.${imageKey}`]?.url || item.image;
                return (
                  <article key={item.key}>
                    <img data-cms-image-key={`home.quality.${imageKey}`} src={image} alt={cmsImages[`home.quality.${imageKey}`]?.alt || `${item.name} facility documentation`} />
                    <h3 data-cms-key={`home.quality.${imageKey}_label`}>{cmsText[`home.quality.${imageKey}_label`] || item.name}</h3>
                    <p data-cms-key={`home.quality.${imageKey}_note`}>{cmsText[`home.quality.${imageKey}_note`] || "Supporting facility documentation"}</p>
                  </article>
                );
              })}
            </div>
            <div className="home-seo-v77-section-action"><Link href="/certifications" className="tso-button secondary"><span data-cms-key="home.quality.button">{cmsText["home.quality.button"] || "Certification Center"}</span><ArrowRight /></Link></div>
          </div>
        </section>
      );
    }

    if (slug === "resources") {
      return (
        <section className="home-seo-v77-section home-seo-v77-resources" data-cms-section="resources" key={slug} style={sectionStyle(slug)}>
          <div className="tso-public-container">
            <header className="home-seo-v77-centered-head">
              <div className="tso-eyebrow" data-cms-key="home.resources.eyebrow">{cmsText["home.resources.eyebrow"] || "BUYER RESOURCES"}</div>
              <h2 className="tso-split-heading"><span data-cms-key="home.resources.title_main">{cmsText["home.resources.title_main"] || "Helpful Resources for"}</span> <em data-cms-key="home.resources.title_accent">{cmsText["home.resources.title_accent"] || "Buyers"}</em></h2>
              <p data-cms-key="home.resources.description">{cmsText["home.resources.description"] || "Practical product, sourcing, private-label and export guidance for professional Himalayan pink salt buyers."}</p>
            </header>

            {resourcePosts.length ? (
              <div className={`home-seo-v77-resource-grid count-${resourcePosts.length}`}>
                {resourcePosts.map((post) => {
                  const postKey = `post_${String(post.id).replace(/[^a-z0-9]+/gi, "_")}`;
                  const title = cmsText[`home.resources.${postKey}_title`] || post.title;
                  const excerpt = cmsText[`home.resources.${postKey}_excerpt`] || post.excerpt || "Open this buyer resource for practical sourcing guidance.";
                  const image = cmsImages[`home.resources.${postKey}`]?.url || post.featured_image || "/og-image.jpg";
                  return (
                    <article key={post.id}>
                      <Link href={`/blog/${post.slug}`} className="home-seo-v77-resource-image"><img data-cms-image-key={`home.resources.${postKey}`} src={image} alt={cmsImages[`home.resources.${postKey}`]?.alt || title} /></Link>
                      <div><small data-cms-key={`home.resources.${postKey}_category`}>{cmsText[`home.resources.${postKey}_category`] || post.category || "Buyer Resource"}</small><h3 data-cms-key={`home.resources.${postKey}_title`}>{title}</h3><p data-cms-key={`home.resources.${postKey}_excerpt`}>{excerpt}</p><Link href={`/blog/${post.slug}`}><span data-cms-key="home.resources.read_button">{cmsText["home.resources.read_button"] || "Read Guide"}</span><ArrowRight /></Link></div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="home-seo-v77-resource-empty" data-cms-key="home.resources.empty_state">{cmsText["home.resources.empty_state"] || "Published buyer resources will appear here automatically."}</div>
            )}
            <div className="home-seo-v77-section-action"><Link href="/blog" className="tso-button secondary"><span data-cms-key="home.resources.view_all">{cmsText["home.resources.view_all"] || "View All Resources"}</span><ArrowRight /></Link></div>
          </div>
        </section>
      );
    }

    return null;
  };

  return <main className="tso-public-home home-seo-v77">{visibleSections.map((section) => renderSection(section.slug))}</main>;
}
