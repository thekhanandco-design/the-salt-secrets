"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

type LayoutItem = {
  slug: string;
  visible?: boolean;
  minHeight?: number;
  paddingTop?: number;
  paddingBottom?: number;
};

function pageSlugFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0] || "home";
  if (first === "products" && parts.length > 1) return "";
  return first;
}

function applySizing(node: HTMLElement, item?: LayoutItem) {
  if (!item) return;
  node.style.minHeight = item.minHeight && item.minHeight > 0 ? `${item.minHeight}px` : "";
  node.style.paddingTop = item.paddingTop !== undefined && item.paddingTop >= 0 ? `${item.paddingTop}px` : "";
  node.style.paddingBottom = item.paddingBottom !== undefined && item.paddingBottom >= 0 ? `${item.paddingBottom}px` : "";
}

export default function PublicSectionLayoutController() {
  const pathname = usePathname();

  const applyLayout = useCallback(async () => {
    const pageSlug = pageSlugFromPath(pathname);
    if (!pageSlug) return;
    const { data } = await supabase.from("public_site_settings").select("config_json").limit(1).maybeSingle();
    const config = (data?.config_json && typeof data.config_json === "object" ? data.config_json : {}) as Record<string, unknown>;
    const pages = (config.page_sections && typeof config.page_sections === "object" ? config.page_sections : {}) as Record<string, unknown>;
    const layout = Array.isArray(pages[pageSlug]) ? pages[pageSlug] as LayoutItem[] : [];
    if (!layout.length) return;

    const position = new Map(layout.map((item, index) => [item.slug, index]));
    const bySlug = new Map(layout.map((item) => [item.slug, item]));
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-cms-section]"));
    for (const node of nodes) {
      const slug = node.dataset.cmsSection || "";
      const item = bySlug.get(slug);
      if (!item) continue;
      node.hidden = item.visible === false;
      applySizing(node, item);
    }

    const groups = new Map<HTMLElement, HTMLElement[]>();
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent) continue;
      const list = groups.get(parent) || [];
      list.push(node);
      groups.set(parent, list);
    }
    for (const [parent, siblings] of groups) {
      siblings
        .slice()
        .sort((a, b) => (position.get(a.dataset.cmsSection || "") ?? 999) - (position.get(b.dataset.cmsSection || "") ?? 999))
        .forEach((node) => parent.appendChild(node));
    }
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => void applyLayout(), 0);
    const refresh = () => void applyLayout();
    window.addEventListener("salt-cms-updated", refresh);
    window.addEventListener("salt-custom-sections-rendered", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("salt-cms-updated", refresh);
      window.removeEventListener("salt-custom-sections-rendered", refresh);
    };
  }, [applyLayout]);

  return null;
}
