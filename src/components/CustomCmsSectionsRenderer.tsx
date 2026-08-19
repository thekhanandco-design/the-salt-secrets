"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { CmsSectionTemplateKey } from "@/lib/cms-section-registry";

type CustomSection = {
  slug: string;
  label: string;
  template: CmsSectionTemplateKey;
  visible?: boolean;
};

type TextRow = {
  section_slug: string;
  field_key: string;
  default_value: string | null;
  cms_text_translations?: Array<{ language_code: string; value: string | null }>;
};

type ImageRow = {
  section_slug: string;
  slot_key: string;
  current_url?: string | null;
  default_url?: string | null;
  alt_text?: string | null;
  is_active?: boolean | null;
};

function pageSlugFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0] || "home";
  if (first === "products" && parts.length > 1) return "";
  return first;
}

function rowValue(row: TextRow | undefined, language: string, fallback = "") {
  if (!row) return fallback;
  const translations = row.cms_text_translations || [];
  return String(
    translations.find((item) => item.language_code === language)?.value ||
      translations.find((item) => item.language_code === "en")?.value ||
      row.default_value ||
      fallback,
  );
}

export default function CustomCmsSectionsRenderer() {
  const pathname = usePathname();
  const pageSlug = useMemo(() => pageSlugFromPath(pathname), [pathname]);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [texts, setTexts] = useState<TextRow[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (!pageSlug) return;
    let cancelled = false;
    const load = async () => {
      const main = document.querySelector<HTMLElement>("main");
      if (!main) return;
      setMountNode(main);
      const lang = window.localStorage.getItem("salt-language") || "en";
      setLanguage(lang);
      const [settingsResult, textResult, imageResult] = await Promise.all([
        supabase.from("public_site_settings").select("config_json").limit(1).maybeSingle(),
        supabase
          .from("cms_text_entries")
          .select("section_slug,field_key,default_value,cms_text_translations(language_code,value)")
          .eq("page_slug", pageSlug)
          .order("display_order"),
        supabase
          .from("cms_image_slots")
          .select("section_slug,slot_key,current_url,default_url,alt_text,is_active")
          .eq("page_slug", pageSlug)
          .order("display_order"),
      ]);
      if (cancelled) return;
      const config = settingsResult.data?.config_json && typeof settingsResult.data.config_json === "object"
        ? settingsResult.data.config_json as Record<string, unknown>
        : {};
      const customPages = config.custom_sections && typeof config.custom_sections === "object"
        ? config.custom_sections as Record<string, unknown>
        : {};
      const custom = Array.isArray(customPages[pageSlug]) ? customPages[pageSlug] as CustomSection[] : [];
      setSections(custom);
      setTexts((textResult.data || []) as TextRow[]);
      setImages((imageResult.data || []) as ImageRow[]);
      window.setTimeout(() => window.dispatchEvent(new Event("salt-custom-sections-rendered")), 0);
    };
    void load();
    const refresh = () => void load();
    window.addEventListener("salt-cms-updated", refresh);
    window.addEventListener("salt-language-change", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("salt-cms-updated", refresh);
      window.removeEventListener("salt-language-change", refresh);
    };
  }, [pageSlug]);

  if (!pageSlug || !mountNode || !sections.length) return null;

  const content = sections.map((section) => {
    const sectionRows = texts.filter((row) => row.section_slug === section.slug);
    const image = images.find((row) => row.section_slug === section.slug && row.slot_key === "image");
    const get = (field: string, fallback = "") => rowValue(sectionRows.find((row) => row.field_key === field), language, fallback);
    const key = (field: string) => `${pageSlug}.${section.slug}.${field}`;
    const imageUrl = image?.is_active === false ? "" : String(image?.current_url || image?.default_url || "");

    if (section.template === "cta") {
      return (
        <section key={section.slug} className="tso-custom-section tso-custom-section--cta" data-cms-section={section.slug}>
          <div className="tso-public-container">
            <div className="tso-custom-cta-panel">
              <div>
                <span data-cms-key={key("eyebrow")}>{get("eyebrow", "B2B PROGRAM")}</span>
                <h2><span data-cms-key={key("title_main")}>{get("title_main", "Build your next ")}</span><em data-cms-key={key("title_accent")}>{get("title_accent", "salt program.")}</em></h2>
                <p data-cms-key={key("body")}>{get("body", "Share your product, packaging and destination requirements with our commercial team.")}</p>
              </div>
              <a className="tso-button primary" href={get("primary_href", "/contact")} data-cms-key={key("primary_label")}>{get("primary_label", "Request a Quote")}</a>
            </div>
          </div>
        </section>
      );
    }

    if (section.template === "image_text") {
      return (
        <section key={section.slug} className="tso-custom-section tso-custom-section--image-text" data-cms-section={section.slug}>
          <div className="tso-public-container tso-custom-image-text-grid">
            <div className="tso-custom-image-text-copy">
              <span className="tso-eyebrow" data-cms-key={key("eyebrow")}>{get("eyebrow", "CUSTOM SECTION")}</span>
              <h2><span data-cms-key={key("title_main")}>{get("title_main", "Premium content ")}</span><em data-cms-key={key("title_accent")}>{get("title_accent", "built for buyers.")}</em></h2>
              <p data-cms-key={key("body")}>{get("body", "Present your product, service or buyer program with clear commercial information.")}</p>
              <a className="tso-text-link" href={get("primary_href", "/contact")} data-cms-key={key("primary_label")}>{get("primary_label", "Learn More")} →</a>
            </div>
            <div className="tso-custom-image-text-media">
              {imageUrl ? <img src={imageUrl} alt={image?.alt_text || section.label} /> : <div className="tso-custom-image-placeholder" aria-hidden="true" />}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section key={section.slug} className="tso-custom-section tso-custom-section--editorial" data-cms-section={section.slug}>
        <div className="tso-public-container tso-custom-editorial-card">
          <span className="tso-eyebrow" data-cms-key={key("eyebrow")}>{get("eyebrow", "CUSTOM SECTION")}</span>
          <h2><span data-cms-key={key("title_main")}>{get("title_main", "A focused ")}</span><em data-cms-key={key("title_accent")}>{get("title_accent", "buyer story.")}</em></h2>
          <p data-cms-key={key("body")}>{get("body", "Introduce the offer with concise, buyer-focused information and a clear next step.")}</p>
          <a className="tso-text-link" href={get("primary_href", "/contact")} data-cms-key={key("primary_label")}>{get("primary_label", "Learn More")} →</a>
        </div>
      </section>
    );
  });

  return createPortal(content, mountNode);
}
