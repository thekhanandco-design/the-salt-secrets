import { supabase } from "@/lib/supabase-client";
import type { CmsTextStyle } from "@/lib/text-style";

export type CmsLanguage = {
  code: string;
  name: string;
  native_name: string;
  direction: "ltr" | "rtl";
  enabled: boolean;
  is_default: boolean;
  display_order: number;
};

export type CmsTextPayload = {
  value: string;
  style: CmsTextStyle;
};

export async function loadCmsText(pageSlug: string, language = "en") {
  const { data, error } = await supabase
    .from("cms_text_entries")
    .select("id,page_slug,section_slug,field_key,default_value,style_json,cms_text_translations(language_code,value)")
    .or(`page_slug.eq.${pageSlug},page_slug.eq.global`)
    .order("display_order", { ascending: true });

  if (error) return {} as Record<string, string>;
  const output: Record<string, string> = {};
  for (const row of data || []) {
    const translations = (row.cms_text_translations || []) as Array<{ language_code: string; value: string | null }>;
    const translated = translations.find((item) => item.language_code === language)?.value;
    const english = translations.find((item) => item.language_code === "en")?.value;
    output[`${row.page_slug}.${row.section_slug}.${row.field_key}`] = translated || english || row.default_value || "";
  }
  return output;
}

export async function loadCmsTextWithStyles(pageSlug: string, language = "en") {
  const { data, error } = await supabase
    .from("cms_text_entries")
    .select("id,page_slug,section_slug,field_key,default_value,style_json,cms_text_translations(language_code,value)")
    .or(`page_slug.eq.${pageSlug},page_slug.eq.global`)
    .order("display_order", { ascending: true });
  if (error) return {} as Record<string, CmsTextPayload>;
  const output: Record<string, CmsTextPayload> = {};
  for (const row of data || []) {
    const translations = (row.cms_text_translations || []) as Array<{ language_code: string; value: string | null }>;
    const translated = translations.find((item) => item.language_code === language)?.value;
    const english = translations.find((item) => item.language_code === "en")?.value;
    output[`${row.page_slug}.${row.section_slug}.${row.field_key}`] = {
      value: translated || english || row.default_value || "",
      style: (row.style_json || {}) as CmsTextStyle,
    };
  }
  return output;
}

export async function loadCmsImages(pageSlug: string) {
  const { data, error } = await supabase
    .from("cms_image_slots")
    .select("page_slug,section_slug,slot_key,current_url,default_url,alt_text")
    .or(`page_slug.eq.${pageSlug},page_slug.eq.global`)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) return {} as Record<string, { url: string; alt: string }>;
  const output: Record<string, { url: string; alt: string }> = {};
  for (const row of data || []) {
    output[`${row.page_slug}.${row.section_slug}.${row.slot_key}`] = {
      url: row.current_url || row.default_url || "",
      alt: row.alt_text || "",
    };
  }
  return output;
}

export async function loadSocialLinks() {
  const { data } = await supabase.from("social_links").select("*").eq("enabled", true).order("display_order");
  return (data || []) as Array<{ platform: string; label: string; url: string; icon_key: string }>;
}
