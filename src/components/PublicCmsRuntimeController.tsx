"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { CmsTextStyle } from "@/lib/text-style";
import { cmsTextRegistry } from "@/lib/cms-registry";
import {
  cmsImageSlotKey,
  cmsRootForSection,
  cmsTextNodeFieldKey,
  cmsVariantNamespace,
  collectCmsTextNodes,
  normalizeCmsText,
  replaceVisibleElementText,
} from "@/lib/cms-dom-registry";

type TextRow = {
  page_slug: string;
  section_slug: string;
  field_key: string;
  default_value: string | null;
  style_json?: CmsTextStyle | null;
  cms_text_translations?: Array<{ language_code: string; value: string | null }>;
  display_order?: number | null;
};

type ImageRow = {
  page_slug: string;
  section_slug: string;
  slot_key: string;
  current_url?: string | null;
  default_url?: string | null;
  alt_text?: string | null;
  is_active?: boolean | null;
  display_order?: number | null;
};

const managedTextKeys = new Set(
  cmsTextRegistry.map((item) => `${item.page_slug}.${item.section_slug}.${item.field_key}`),
);

function pageSlugFromPath(pathname: string) {
  return pathname.split("/").filter(Boolean)[0] || "home";
}

function productCmsPageSlugFromDom() {
  const element = document.querySelector<HTMLElement>('[data-cms-key^="product::"]');
  const value = element?.dataset.cmsKey || "";
  return value.match(/^(product::-?\d+::[^.]+)\./)?.[1] || "";
}

function pathOnly(value: string) {
  try {
    if (/^https?:\/\//i.test(value)) return new URL(value).pathname;
  } catch {}
  return value.split("?")[0].split("#")[0];
}

function applyTextStyle(element: HTMLElement, style?: CmsTextStyle | null) {
  if (!style) return;
  if (typeof style.hidden === "boolean") element.hidden = style.hidden;
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
  if (style.translateX || style.translateY) {
    element.style.position = "relative";
    element.style.transform = `translate(${style.translateX || "0px"}, ${style.translateY || "0px"})`;
  } else {
    element.style.removeProperty("transform");
  }
  if (style.maxWidth) element.style.maxWidth = style.maxWidth;
}

function pagePriority(pageSlug: string, basePage: string, productPage: string) {
  if (pageSlug === "global") return 0;
  if (pageSlug === basePage) return 1;
  if (productPage && pageSlug === productPage) return 2;
  return 3;
}

export default function PublicCmsRuntimeController() {
  const pathname = usePathname();

  const applyCms = useCallback(async () => {
    const manifestMode = new URLSearchParams(window.location.search).has("cms_image_manifest");
    const basePageSlug = pageSlugFromPath(pathname);
    const productPageSlug = productCmsPageSlugFromDom();
    const pageSlugs = Array.from(new Set(["global", basePageSlug, productPageSlug].filter(Boolean)));
    const language = window.localStorage.getItem("salt-language") || "en";
    const variantNamespace = cmsVariantNamespace(document, basePageSlug);

    const [textResult, imageResult] = await Promise.all([
      supabase
        .from("cms_text_entries")
        .select("page_slug,section_slug,field_key,default_value,style_json,display_order,cms_text_translations(language_code,value)")
        .in("page_slug", pageSlugs)
        .order("display_order", { ascending: true }),
      supabase
        .from("cms_image_slots")
        .select("page_slug,section_slug,slot_key,current_url,default_url,alt_text,is_active,display_order")
        .in("page_slug", pageSlugs)
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
    ]);

    if (!textResult.error) {
      const rows = ([...(textResult.data || [])] as TextRow[]).sort((a, b) =>
        pagePriority(a.page_slug, basePageSlug, productPageSlug) - pagePriority(b.page_slug, basePageSlug, productPageSlug) ||
        Number(a.display_order || 0) - Number(b.display_order || 0),
      );

      for (const row of rows) {
        const key = `${row.page_slug}.${row.section_slug}.${row.field_key}`;
        const exactMapped = Array.from(document.querySelectorAll<HTMLElement>(`[data-cms-key="${CSS.escape(key)}"]`));
        const isManaged = managedTextKeys.has(key) || exactMapped.length > 0 || row.field_key.startsWith("live_") || row.field_key.startsWith("manual_") || (row.page_slug !== "global" && row.section_slug.startsWith("custom-"));
        if (!isManaged) continue;

        const translations = row.cms_text_translations || [];
        const replacement =
          translations.find((item) => item.language_code === language)?.value ||
          translations.find((item) => item.language_code === "en")?.value ||
          row.default_value ||
          "";
        const original = normalizeCmsText(row.default_value);
        const sectionRoot = cmsRootForSection(document, row.page_slug, row.section_slug);
        if (!sectionRoot) continue;

        if (exactMapped.length) {
          exactMapped.forEach((element) => {
            replaceVisibleElementText(element, replacement);
            applyTextStyle(element, row.style_json);
          });
          continue;
        }

        if (row.field_key.startsWith("live_text_")) {
          const nodes = collectCmsTextNodes(sectionRoot).filter((node) => !node.parentElement?.closest("[data-cms-key]"));
          const target = nodes.find((node) =>
            cmsTextNodeFieldKey(sectionRoot, node, variantNamespace) === row.field_key ||
            cmsTextNodeFieldKey(sectionRoot, node) === row.field_key,
          );
          if (target) {
            target.nodeValue = replacement;
            if (target.parentElement) {
              target.parentElement.dataset.cmsRuntimeKey = key;
              applyTextStyle(target.parentElement, row.style_json);
            }
          }
          continue;
        }

        if (!original) continue;
        const nodes = collectCmsTextNodes(sectionRoot);
        for (const node of nodes) {
          if (normalizeCmsText(node.nodeValue) !== original) continue;
          node.nodeValue = replacement;
          if (node.parentElement) {
            node.parentElement.dataset.cmsRuntimeKey = key;
            applyTextStyle(node.parentElement, row.style_json);
          }
        }
      }
    }

    // Homepage images are rendered from the global SSR CMS image manifest.
    // Do not mutate them again after hydration, otherwise an old/default image can flash
    // before the current CMS image is applied. Other pages keep legacy runtime support.
    if (!imageResult.error && basePageSlug !== "home") {
      const rows = ([...(imageResult.data || [])] as ImageRow[]).sort((a, b) =>
        pagePriority(a.page_slug, basePageSlug, productPageSlug) - pagePriority(b.page_slug, basePageSlug, productPageSlug) ||
        Number(a.display_order || 0) - Number(b.display_order || 0),
      );

      for (const row of rows) {
        if (row.is_active === false || row.section_slug === "favicons") continue;
        const key = `${row.page_slug}.${row.section_slug}.${row.slot_key}`;
        const current = row.current_url || row.default_url || "";
        const sectionRoot = cmsRootForSection(document, row.page_slug, row.section_slug);
        if (!sectionRoot) continue;

        const exact = Array.from(document.querySelectorAll<HTMLElement>(`[data-cms-image-key="${CSS.escape(key)}"]`));
        if (exact.length) {
          exact.forEach((element) => {
            if (element instanceof HTMLImageElement) {
              if (current) element.src = current;
              if (row.alt_text) element.alt = row.alt_text;
              return;
            }
            if (current) element.style.backgroundImage = `url("${current.replaceAll('"', '%22')}")`;
            if (row.alt_text && !element.getAttribute("aria-label")) element.setAttribute("aria-label", row.alt_text);
          });
          continue;
        }

        // Image-manifest scans intentionally apply only exact current CMS keys.
        // Legacy rows that no longer exist in the rendered page are not allowed
        // to mutate a new image merely because an old default URL happens to match.
        if (manifestMode) continue;

        if (row.slot_key.startsWith("live_img_")) {
          const target = Array.from(sectionRoot.querySelectorAll<HTMLImageElement>("img")).find(
            (image) => cmsImageSlotKey(sectionRoot, image) === row.slot_key,
          );
          if (target) {
            target.dataset.cmsImageKey = key;
            if (current) target.src = current;
            if (row.alt_text) target.alt = row.alt_text;
          }
          continue;
        }

        if (productPageSlug && row.page_slug === productPageSlug && row.slot_key === "main_image") {
          const target = sectionRoot.querySelector<HTMLImageElement>("img");
          if (target) {
            target.dataset.cmsImageKey = key;
            if (current) target.src = current;
            if (row.alt_text) target.alt = row.alt_text;
          }
          continue;
        }
        if (productPageSlug && row.page_slug === productPageSlug && row.slot_key.startsWith("gallery_")) {
          // Product Gallery renders the main product image first, then product.gallery entries.
          // gallery_1 therefore maps to DOM image index 1, gallery_2 to index 2, etc.
          const index = Math.max(1, Number(row.slot_key.replace("gallery_", "")));
          const target = Array.from(sectionRoot.querySelectorAll<HTMLImageElement>("img"))[index];
          if (target) {
            target.dataset.cmsImageKey = key;
            if (current) target.src = current;
            if (row.alt_text) target.alt = row.alt_text;
          }
          continue;
        }

        const fallback = pathOnly(row.default_url || "");
        if (!fallback) continue;
        for (const image of Array.from(sectionRoot.querySelectorAll<HTMLImageElement>("img"))) {
          const source = pathOnly(image.getAttribute("src") || "");
          if (!(source === fallback || source.endsWith(fallback))) continue;
          image.dataset.cmsImageKey = key;
          if (current) image.src = current;
          if (row.alt_text) image.alt = row.alt_text;
          break;
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
