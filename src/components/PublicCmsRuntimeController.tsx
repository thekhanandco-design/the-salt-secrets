"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { CmsTextStyle } from "@/lib/text-style";
import { cmsTextRegistry } from "@/lib/cms-registry";

type TextRow = {
  page_slug: string;
  section_slug: string;
  field_key: string;
  default_value: string | null;
  style_json?: CmsTextStyle | null;
  cms_text_translations?: Array<{ language_code: string; value: string | null }>;
};

type ImageRow = {
  page_slug: string;
  section_slug: string;
  slot_key: string;
  current_url?: string | null;
  default_url?: string | null;
  alt_text?: string | null;
  is_active?: boolean | null;
};

const managedTextKeys = new Set(
  cmsTextRegistry.map((item) => `${item.page_slug}.${item.section_slug}.${item.field_key}`),
);

function pageSlugFromPath(pathname: string) {
  return pathname.split("/").filter(Boolean)[0] || "home";
}

function normalizeText(value: string | null | undefined) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function pathOnly(value: string) {
  try {
    if (/^https?:\/\//i.test(value)) return new URL(value).pathname;
  } catch {}
  return value.split("?")[0].split("#")[0];
}

function applyTextStyle(element: HTMLElement, style?: CmsTextStyle | null) {
  if (!style) return;
  if (style.fontFamily && !["inherit", "auto"].includes(style.fontFamily)) element.style.fontFamily = style.fontFamily;
  if (style.fontSize) element.style.fontSize = style.fontSize;
  if (style.fontWeight) element.style.fontWeight = style.fontWeight;
  if (style.color) element.style.color = style.color;
  if (style.backgroundColor) element.style.backgroundColor = style.backgroundColor;
  if (style.textTransform) element.style.textTransform = style.textTransform;
  if (style.fontStyle) element.style.fontStyle = style.fontStyle;
  if (style.textDecoration) element.style.textDecoration = style.textDecoration;
  if (style.textAlign) element.style.textAlign = style.textAlign;
  if (style.letterSpacing) element.style.letterSpacing = style.letterSpacing;
  if (style.lineHeight) element.style.lineHeight = style.lineHeight;
}

function textNodesUnder(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "OPTION"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-cms-runtime-ignore]")) return NodeFilter.FILTER_REJECT;
      return normalizeText(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

export default function PublicCmsRuntimeController() {
  const pathname = usePathname();

  const applyCms = useCallback(async () => {
    const pageSlug = pageSlugFromPath(pathname);
    const language = window.localStorage.getItem("salt-language") || "en";
    const [textResult, imageResult] = await Promise.all([
      supabase
        .from("cms_text_entries")
        .select("page_slug,section_slug,field_key,default_value,style_json,cms_text_translations(language_code,value)")
        .or(`page_slug.eq.${pageSlug},page_slug.eq.global`)
        .order("display_order", { ascending: true }),
      supabase
        .from("cms_image_slots")
        .select("page_slug,section_slug,slot_key,current_url,default_url,alt_text,is_active")
        .or(`page_slug.eq.${pageSlug},page_slug.eq.global`)
        .order("display_order", { ascending: true }),
    ]);

    if (!textResult.error) {
      for (const row of (textResult.data || []) as TextRow[]) {
        const key = `${row.page_slug}.${row.section_slug}.${row.field_key}`;
        const isManaged = managedTextKeys.has(key) || (row.page_slug !== "global" && (row.section_slug.startsWith("custom-") || row.field_key.startsWith("live_")));
        if (!isManaged) continue;
        const translations = row.cms_text_translations || [];
        const replacement =
          translations.find((item) => item.language_code === language)?.value ||
          translations.find((item) => item.language_code === "en")?.value ||
          row.default_value ||
          "";
        const original = normalizeText(row.default_value);
        const sectionRoot = row.page_slug === "global"
          ? document.body
          : document.querySelector<HTMLElement>(`[data-cms-section="${CSS.escape(row.section_slug)}"]`);

        // Ignore stale CMS rows that belong to sections no longer present on the live page.
        // This keeps Website, Text Manager and Visual Editor aligned to the same current section map.
        if (row.page_slug !== "global" && !sectionRoot) continue;

        const mapped = Array.from(document.querySelectorAll<HTMLElement>(`[data-cms-key="${CSS.escape(key)}"]`));
        if (mapped.length) {
          mapped.forEach((element) => {
            if (!element.querySelector("[data-cms-segment]")) element.textContent = replacement;
            applyTextStyle(element, row.style_json);
          });
          continue;
        }

        if (!original || !sectionRoot) continue;
        const nodes = textNodesUnder(sectionRoot);
        for (const node of nodes) {
          if (normalizeText(node.nodeValue) !== original) continue;
          node.nodeValue = replacement;
          if (node.parentElement) {
            node.parentElement.dataset.cmsRuntimeKey = key;
            applyTextStyle(node.parentElement, row.style_json);
          }
        }
      }
    }

    if (!imageResult.error) {
      const images = Array.from(document.images);
      for (const row of (imageResult.data || []) as ImageRow[]) {
        const fallback = pathOnly(row.default_url || "");
        const current = row.current_url || row.default_url || "";
        if (!fallback) continue;
        for (const image of images) {
          const source = pathOnly(image.getAttribute("src") || "");
          if (!(source === fallback || source.endsWith(fallback))) continue;
          image.dataset.cmsImageKey = `${row.page_slug}.${row.section_slug}.${row.slot_key}`;
          image.hidden = row.is_active === false;
          if (row.is_active !== false && current) image.src = current;
          if (row.alt_text) image.alt = row.alt_text;
        }
      }
    }
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => void applyCms(), 0);
    const refresh = () => void applyCms();
    window.addEventListener("salt-cms-updated", refresh);
    window.addEventListener("salt-language-change", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("salt-cms-updated", refresh);
      window.removeEventListener("salt-language-change", refresh);
    };
  }, [applyCms]);

  return null;
}
