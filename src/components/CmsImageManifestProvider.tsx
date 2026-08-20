"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export type CmsImageManifestEntry = { url: string; alt: string };
export type CmsImageManifest = Record<string, CmsImageManifestEntry>;

const CmsImageManifestContext = createContext<CmsImageManifest>({});

function rowsToManifest(rows: Array<{ page_slug: string; section_slug: string; slot_key: string; current_url?: string | null; default_url?: string | null; alt_text?: string | null }>) {
  const output: CmsImageManifest = {};
  for (const row of rows) {
    const url = String(row.current_url || row.default_url || "").trim();
    if (!url) continue;
    output[`${row.page_slug}.${row.section_slug}.${row.slot_key}`] = {
      url,
      alt: String(row.alt_text || ""),
    };
  }
  return output;
}

export function CmsImageManifestProvider({
  initialManifest,
  children,
}: {
  initialManifest: CmsImageManifest;
  children: React.ReactNode;
}) {
  const [manifest, setManifest] = useState<CmsImageManifest>(initialManifest);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const { data, error } = await supabase
        .from("cms_image_slots")
        .select("page_slug,section_slug,slot_key,current_url,default_url,alt_text")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (!active || error) return;
      setManifest(rowsToManifest(data || []));
    };

    window.addEventListener("salt-cms-updated", refresh);
    window.addEventListener("salt-cms-images-updated", refresh);
    return () => {
      active = false;
      window.removeEventListener("salt-cms-updated", refresh);
      window.removeEventListener("salt-cms-images-updated", refresh);
    };
  }, []);

  const value = useMemo(() => manifest, [manifest]);
  return <CmsImageManifestContext.Provider value={value}>{children}</CmsImageManifestContext.Provider>;
}

export function useCmsImageManifest() {
  return useContext(CmsImageManifestContext);
}

export function useCmsImageResolver() {
  const manifest = useCmsImageManifest();
  return useCallback((key: string, fallback: string) => manifest[key]?.url || fallback, [manifest]);
}

export function useCmsImageAltResolver() {
  const manifest = useCmsImageManifest();
  return useCallback((key: string, fallback: string) => manifest[key]?.alt || fallback, [manifest]);
}
