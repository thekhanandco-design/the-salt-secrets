"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

type LayoutItem = { slug: string; visible?: boolean };

function pageSlugFromPath(pathname: string) {
  const first = pathname.split("/").filter(Boolean)[0] || "home";
  if (first === "products" && pathname.split("/").filter(Boolean).length > 1) return "";
  return first;
}

export default function PublicSectionLayoutController() {
  const pathname = usePathname();

  const applyLayout = useCallback(async () => {
    const pageSlug = pageSlugFromPath(pathname);
    if (!pageSlug) return;
    const { data } = await supabase.from("site_settings").select("config_json").limit(1).maybeSingle();
    const config = (data?.config_json && typeof data.config_json === "object" ? data.config_json : {}) as Record<string, unknown>;
    const pages = (config.page_sections && typeof config.page_sections === "object" ? config.page_sections : {}) as Record<string, unknown>;
    const layout = Array.isArray(pages[pageSlug]) ? pages[pageSlug] as LayoutItem[] : [];
    if (!layout.length) return;

    const position = new Map(layout.map((item, index) => [item.slug, index]));
    const visibility = new Map(layout.map((item) => [item.slug, item.visible !== false]));
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-cms-section]"));
    for (const node of nodes) {
      const slug = node.dataset.cmsSection || "";
      if (visibility.has(slug)) node.hidden = !visibility.get(slug);
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
    return () => { window.clearTimeout(timer); window.removeEventListener("salt-cms-updated", refresh); };
  }, [applyLayout]);

  return null;
}
