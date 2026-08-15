"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { cmsPageLabels, cmsTextRegistry, type CmsTextSeed } from "@/lib/cms-registry";
import { defaultSectionsForPage, isCanonicalCmsSection } from "@/lib/cms-section-registry";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CaseLower,
  CaseUpper,
  Highlighter,
  Italic,
  Languages,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Type,
  Underline,
} from "lucide-react";
import { defaultCmsTextStyle, SITE_BODY_FONT, SITE_HEADING_FONT, styleToReact, type CmsTextStyle } from "@/lib/text-style";

type Language = { code: string; name: string; native_name: string; direction: "ltr" | "rtl"; enabled: boolean };
type Translation = { language_code: string; value: string | null };
type Entry = CmsTextSeed & { id?: string; cms_text_translations?: Translation[]; style_json?: CmsTextStyle };

const fallbackLanguages: Language[] = [
  { code: "en", name: "English", native_name: "English", direction: "ltr", enabled: true },
  { code: "ar", name: "Arabic", native_name: "العربية", direction: "rtl", enabled: true },
  { code: "fr", name: "French", native_name: "Français", direction: "ltr", enabled: true },
  { code: "es", name: "Spanish", native_name: "Español", direction: "ltr", enabled: true },
  { code: "de", name: "German", native_name: "Deutsch", direction: "ltr", enabled: true },
  { code: "pt", name: "Portuguese", native_name: "Português", direction: "ltr", enabled: true },
  { code: "tr", name: "Turkish", native_name: "Türkçe", direction: "ltr", enabled: true },
  { code: "ur", name: "Urdu", native_name: "اردو", direction: "rtl", enabled: true },
];
const fontOptions = [
  { label: "Automatic — match live website", value: "inherit" },
  { label: "Website Heading — Cormorant Garamond", value: SITE_HEADING_FONT },
  { label: "Website Body — Inter", value: SITE_BODY_FONT },
  { label: "Georgia", value: "Georgia, Times New Roman, serif" },
  { label: "Times New Roman", value: "Times New Roman, Times, serif" },
  { label: "Garamond", value: "Garamond, Baskerville, Georgia, serif" },
  { label: "Baskerville", value: "Baskerville, Georgia, serif" },
  { label: "Palatino", value: "Palatino Linotype, Book Antiqua, Palatino, serif" },
  { label: "Didot", value: "Didot, Bodoni MT, Georgia, serif" },
  { label: "Bodoni", value: "Bodoni 72, Bodoni MT, Didot, serif" },
  { label: "Cambria", value: "Cambria, Georgia, serif" },
  { label: "Bookman", value: "Bookman Old Style, Bookman, Georgia, serif" },
  { label: "Inter / System", value: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet", value: "Trebuchet MS, Arial, sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Segoe UI", value: "Segoe UI, Arial, sans-serif" },
  { label: "Calibri", value: "Calibri, Candara, Segoe UI, sans-serif" },
  { label: "Gill Sans", value: "Gill Sans, Gill Sans MT, Calibri, sans-serif" },
  { label: "Century Gothic", value: "Century Gothic, Futura, sans-serif" },
  { label: "Futura", value: "Futura, Century Gothic, Arial, sans-serif" },
  { label: "Franklin Gothic", value: "Franklin Gothic Medium, Arial Narrow, Arial, sans-serif" },
  { label: "Arial Narrow", value: "Arial Narrow, Arial, sans-serif" },
  { label: "Courier New", value: "Courier New, Courier, monospace" },
  { label: "Consolas", value: "Consolas, Monaco, monospace" },
  { label: "Copperplate", value: "Copperplate, Copperplate Gothic Light, serif" },
  { label: "Brush Script", value: "Brush Script MT, Segoe Script, cursive" },
  { label: "Lucida Handwriting", value: "Lucida Handwriting, Segoe Script, cursive" },
 ] as const;

const livePageRoutes: Record<string, string> = {
  home: "/",
  about: "/about",
  products: "/products",
  "private-label": "/private-label",
  certifications: "/certifications",
  contact: "/contact",
  blog: "/blog",
  faqs: "/faqs",
  "privacy-policy": "/privacy-policy",
  "terms-and-conditions": "/terms-and-conditions",
};

function cleanLiveText(value: string | null | undefined) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function fieldLabelFrom(section: string, tag: string, position: number) {
  const sectionLabel = section.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const tagLabel = ({ h1: "Main Heading", h2: "Heading", h3: "Subheading", h4: "Subheading", p: "Paragraph", a: "Link", button: "Button", label: "Label", summary: "FAQ Question", small: "Small Text", strong: "Strong Text", em: "Accent / Italic Text", span: "Text" } as Record<string, string>)[tag] || "Text";
  return `${sectionLabel} — ${tagLabel} ${position}`;
}


const textSectionAliases: Record<string, Record<string, string>> = {
  home: {
    private_program: "private_label",
    product_families: "collections",
  },
};

function displaySectionSlug(pageSlug: string, sectionSlug: string) {
  return textSectionAliases[pageSlug]?.[sectionSlug] || sectionSlug;
}

function isCurrentRegistrySeed(seed: CmsTextSeed) {
  // Homepage V7.5.6 keeps the visual section slugs `private_label` and `collections`,
  // while their current text lives in the newer `private_program` and
  // `product_families` registry groups. Hide the superseded copy so Text Manager
  // never shows both old and new website wording together.
  if (seed.page_slug === "home" && ["private_label", "collections"].includes(seed.section_slug)) return false;
  if (seed.page_slug === "home" && ["private_program", "product_families"].includes(seed.section_slug)) return true;
  if (/\blegacy\b/i.test(seed.field_label)) return false;
  return isCanonicalCmsSection(seed.page_slug, seed.section_slug);
}

function registryKey(entry: Pick<CmsTextSeed, "page_slug" | "section_slug" | "field_key">) {
  return `${entry.page_slug}:${entry.section_slug}:${entry.field_key}`;
}

function slugifyFieldKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "text";
}

function stableTextHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

const currentCmsTextRegistry = cmsTextRegistry.filter(isCurrentRegistrySeed);
const allRegistryKeys = new Set(cmsTextRegistry.map(registryKey));
const currentRegistryKeys = new Set(currentCmsTextRegistry.map(registryKey));

function baseStyleForEntry(entry: Pick<Entry, "field_key" | "field_label">): CmsTextStyle {
  if (entry.field_key.endsWith("title_accent") || /accent\s*\/\s*italic/i.test(entry.field_label)) {
    return { ...defaultCmsTextStyle, fontFamily: SITE_HEADING_FONT, fontStyle: "italic", fontWeight: "500", color: "#8f1834" };
  }
  return { ...defaultCmsTextStyle };
}

export default function TextManagerPage() {
  const [languages, setLanguages] = useState<Language[]>(fallbackLanguages);
  const [entries, setEntries] = useState<Entry[]>(cmsTextRegistry);
  const [language, setLanguage] = useState("en");
  const [page, setPage] = useState("global");
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("all");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [translatingPage, setTranslatingPage] = useState(false);
  const [styles, setStyles] = useState<Record<string, CmsTextStyle>>({});
  const [addTextOpen, setAddTextOpen] = useState(false);
  const [addTextSection, setAddTextSection] = useState("hero");
  const [addTextLabel, setAddTextLabel] = useState("New Text");
  const [addTextValue, setAddTextValue] = useState("");
  const [addTextType, setAddTextType] = useState<"text" | "textarea">("text");

  useEffect(() => { void load(); }, []);
  useEffect(() => { setActiveSection("all"); }, [page]);

  async function load() {
    // Register only the text that belongs to the CURRENT website. Superseded
    // registry rows are intentionally not re-created here.
    if (currentCmsTextRegistry.length) {
      await supabase.from("cms_text_entries").upsert(currentCmsTextRegistry, { onConflict: "page_slug,section_slug,field_key" });
    }
    const [{ data: langs }, { data: rows }] = await Promise.all([
      supabase.from("cms_languages").select("*").eq("enabled", true).order("display_order"),
      supabase.from("cms_text_entries").select("*,cms_text_translations(language_code,value)").order("display_order"),
    ]);
    if (langs?.length) setLanguages(langs as Language[]);
    const db = (rows as Entry[]) || [];
    const merged: Entry[] = currentCmsTextRegistry.map((seed): Entry => {
      const found = db.find((row) => row.page_slug === seed.page_slug && row.section_slug === seed.section_slug && row.field_key === seed.field_key);
      return found ? { ...seed, ...found } : seed;
    });
    const extras = db.filter((row) => {
      const key = registryKey(row);
      if (currentRegistryKeys.has(key)) return false;
      if (allRegistryKeys.has(key)) return false; // old coded website field
      if (row.page_slug === "global") return row.field_key.startsWith("manual_");
      const displaySection = displaySectionSlug(row.page_slug, row.section_slug);
      const canonicalSections = defaultSectionsForPage(row.page_slug);
      const sectionExists = !canonicalSections.length || canonicalSections.some((section) => section.slug === displaySection);
      if (!sectionExists && !row.section_slug.startsWith("custom-")) return false;
      return row.section_slug.startsWith("custom-") || row.field_key.startsWith("live_") || row.field_key.startsWith("manual_");
    });
    const all: Entry[] = [...merged, ...extras];
    setEntries(all);
    const nextStyles: Record<string, CmsTextStyle> = {};
    all.forEach((row) => { nextStyles[styleKeyFromRow(row)] = { ...baseStyleForEntry(row), ...(row.style_json || {}) }; });
    setStyles(nextStyles);
    const next: Record<string, string> = {};
    all.forEach((row) => {
      (row.cms_text_translations || []).forEach((translation) => {
        next[`${row.page_slug}:${row.section_slug}:${row.field_key}:${translation.language_code}`] = translation.value || "";
      });
    });
    setValues(next);
  }

  function styleKeyFromRow(entry: Pick<Entry, "page_slug" | "section_slug" | "field_key">) {
    return `${entry.page_slug}:${entry.section_slug}:${entry.field_key}`;
  }

  function extractLivePageSeeds(pageSlug: string, documentCopy: Document) {
    const sections = Array.from(documentCopy.querySelectorAll<HTMLElement>("[data-cms-section]"));
    const seeds: CmsTextSeed[] = [];
    const currentDefaults = new Set(
      currentCmsTextRegistry
        .filter((entry) => entry.page_slug === pageSlug)
        .map((entry) => cleanLiveText(entry.default_value))
        .filter(Boolean),
    );
    let order = 7000;

    for (const section of sections) {
      const visualSectionSlug = section.dataset.cmsSection || "content";
      const elements = Array.from(section.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,a,button,label,summary,small,strong,em"));
      const seen = new Set<string>();
      let position = 0;
      for (const element of elements) {
        if (element.closest("[data-cms-runtime-ignore]")) continue;
        const text = cleanLiveText(element.textContent);
        if (text.length < 2 || text.length > 650 || currentDefaults.has(text)) continue;
        const nestedSemantic = Array.from(element.children).some((child) => /^(H1|H2|H3|H4|P|A|BUTTON|LABEL|SUMMARY|SMALL|STRONG|EM)$/.test(child.tagName) && cleanLiveText(child.textContent));
        if (nestedSemantic) continue;
        const fingerprint = `${visualSectionSlug}:${element.tagName}:${text}`;
        if (seen.has(fingerprint)) continue;
        seen.add(fingerprint);
        position += 1;
        const explicitPath = element.dataset.cmsKey || "";
        const explicitParts = explicitPath.split(".");
        const explicitKey = explicitParts.length >= 3 ? explicitParts.at(-1) : "";
        const fieldKey = explicitKey || `live_${element.tagName.toLowerCase()}_${stableTextHash(text)}`;
        seeds.push({
          page_slug: pageSlug,
          section_slug: visualSectionSlug,
          field_key: fieldKey,
          field_label: fieldLabelFrom(visualSectionSlug, element.tagName.toLowerCase(), position),
          field_type: text.length > 120 ? "textarea" : "text",
          default_value: text,
          display_order: order++,
        });
      }
    }
    return seeds;
  }

  async function replaceLivePageSnapshot(pageSlug: string) {
    const route = livePageRoutes[pageSlug];
    if (!route) return 0;
    const response = await fetch(route, { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error(`Could not open ${route} (${response.status})`);
    const html = await response.text();
    const documentCopy = new DOMParser().parseFromString(html, "text/html");
    const seeds = extractLivePageSeeds(pageSlug, documentCopy);

    // Live-discovered fields are a snapshot, not an archive. Remove the old scan
    // first so deleted/renamed website copy can never remain in Text Manager.
    const { error: deleteError } = await supabase
      .from("cms_text_entries")
      .delete()
      .eq("page_slug", pageSlug)
      .like("field_key", "live_%");
    if (deleteError) throw deleteError;
    if (!seeds.length) return 0;

    const { data: inserted, error: insertError } = await supabase
      .from("cms_text_entries")
      .upsert(seeds, { onConflict: "page_slug,section_slug,field_key" })
      .select("id,default_value");
    if (insertError) throw insertError;
    const english = (inserted || []).map((row) => ({ entry_id: row.id, language_code: "en", value: row.default_value, updated_at: new Date().toISOString() }));
    if (english.length) {
      const { error: translationError } = await supabase.from("cms_text_translations").upsert(english, { onConflict: "entry_id,language_code" });
      if (translationError) throw translationError;
    }
    return seeds.length;
  }

  async function syncCurrentWebsite() {
    setSyncing(true);
    try {
      // 1) Remove superseded coded fields so old website copy cannot coexist
      // with the current registry. Custom/manual fields are preserved.
      const { data: existingRows, error: existingError } = await supabase
        .from("cms_text_entries")
        .select("id,page_slug,section_slug,field_key");
      if (existingError) throw existingError;
      const staleIds = (existingRows || [])
        .filter((row) => allRegistryKeys.has(`${row.page_slug}:${row.section_slug}:${row.field_key}`) && !currentRegistryKeys.has(`${row.page_slug}:${row.section_slug}:${row.field_key}`))
        .map((row) => row.id);
      if (staleIds.length) {
        const { error: staleError } = await supabase.from("cms_text_entries").delete().in("id", staleIds);
        if (staleError) throw staleError;
      }

      // 2) Upsert the current source-of-truth text and FORCE English to the
      // current coded value. This is what makes Sync behave like a real sync
      // instead of leaving a previous English translation on top.
      const { data: registered, error: registerError } = await supabase
        .from("cms_text_entries")
        .upsert(currentCmsTextRegistry, { onConflict: "page_slug,section_slug,field_key" })
        .select("id,page_slug,section_slug,field_key,default_value");
      if (registerError) throw registerError;
      const english = (registered || []).map((row) => ({ entry_id: row.id, language_code: "en", value: row.default_value, updated_at: new Date().toISOString() }));
      if (english.length) {
        const { error: transError } = await supabase.from("cms_text_translations").upsert(english, { onConflict: "entry_id,language_code" });
        if (transError) throw transError;
      }

      // 3) Refresh live-only text page-by-page. This removes stale scan rows and
      // adds only text that exists on the current rendered website.
      let discovered = 0;
      for (const pageSlug of Object.keys(livePageRoutes)) {
        discovered += await replaceLivePageSnapshot(pageSlug);
      }

      await load();
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert(`Website text synchronized. Old coded copy was removed and ${discovered} current live-only fields were refreshed.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Website text synchronization failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function discoverLivePageText() {
    if (!livePageRoutes[page]) {
      alert("This area is managed through the registered CMS fields.");
      return;
    }
    setDiscovering(true);
    try {
      const count = await replaceLivePageSnapshot(page);
      await load();
      alert(`${count} current live-only text fields refreshed for ${cmsPageLabels[page] || page}.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Live page scan failed");
    } finally {
      setDiscovering(false);
    }
  }

  async function addTextField() {
    const sectionSlug = addTextSection.trim() || (activeSection !== "all" ? activeSection : sectionOptions[0]?.slug || "content");
    const label = addTextLabel.trim() || "New Text";
    const value = addTextValue.trim();
    if (!value) {
      alert("Enter the text you want to add.");
      return;
    }
    const fieldKey = `manual_${slugifyFieldKey(label)}_${Date.now().toString(36)}`;
    const seed: CmsTextSeed = {
      page_slug: page,
      section_slug: sectionSlug,
      field_key: fieldKey,
      field_label: label,
      field_type: addTextType,
      default_value: value,
      display_order: 9500 + Date.now() % 400,
    };
    setSaving(fieldKey);
    try {
      const { data, error } = await supabase.from("cms_text_entries").insert(seed).select("id").single();
      if (error) throw error;
      const { error: translationError } = await supabase.from("cms_text_translations").upsert({ entry_id: data.id, language_code: "en", value, updated_at: new Date().toISOString() }, { onConflict: "entry_id,language_code" });
      if (translationError) throw translationError;
      setAddTextOpen(false);
      setAddTextValue("");
      setAddTextLabel("New Text");
      await load();
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert("Custom text field added. It is preserved during future website syncs.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not add text field.");
    } finally {
      setSaving(null);
    }
  }

  const pages = useMemo(() => Array.from(new Set(entries.map((entry) => entry.page_slug))), [entries]);
  const pageEntries = useMemo(() => entries.filter((entry) => entry.page_slug === page), [entries, page]);
  const sectionOptions = useMemo(() => {
    const canonical = defaultSectionsForPage(page).map((section) => ({ slug: section.slug, label: section.label }));
    const seen = new Set(canonical.map((section) => section.slug));
    for (const entry of pageEntries) {
      const displaySlug = displaySectionSlug(entry.page_slug, entry.section_slug);
      if (!seen.has(displaySlug)) {
        canonical.push({ slug: displaySlug, label: displaySlug.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) });
        seen.add(displaySlug);
      }
    }
    return canonical;
  }, [page, pageEntries]);
  const visible = useMemo(() => pageEntries.filter((entry) => {
    const displaySlug = displaySectionSlug(entry.page_slug, entry.section_slug);
    const matchesSection = activeSection === "all" || displaySlug === activeSection;
    const matchesQuery = !query || `${entry.field_label} ${displaySlug} ${entry.field_key}`.toLowerCase().includes(query.toLowerCase());
    return matchesSection && matchesQuery;
  }), [pageEntries, activeSection, query]);
  const grouped = useMemo(() => visible.reduce<Record<string, Entry[]>>((groups, entry) => {
    const displaySlug = displaySectionSlug(entry.page_slug, entry.section_slug);
    (groups[displaySlug] ||= []).push(entry);
    return groups;
  }, {}), [visible]);

  function localKey(entry: Entry, lang = language) { return `${entry.page_slug}:${entry.section_slug}:${entry.field_key}:${lang}`; }
  function styleKey(entry: Entry) { return `${entry.page_slug}:${entry.section_slug}:${entry.field_key}`; }
  function getStyle(entry: Entry) { return styles[styleKey(entry)] || baseStyleForEntry(entry); }
  function updateStyle(entry: Entry, patch: Partial<CmsTextStyle>) { setStyles((current) => ({ ...current, [styleKey(entry)]: { ...getStyle(entry), ...patch } })); }
  function getValue(entry: Entry, lang = language) {
    const direct = values[localKey(entry, lang)];
    if (direct !== undefined && direct !== "") return direct;
    const english = values[localKey(entry, "en")];
    return english !== undefined && english !== "" ? english : entry.default_value;
  }

  function inferredWebsiteFont(entry: Entry) {
    const signature = `${entry.section_slug}.${entry.field_key}.${entry.field_label}`.toLowerCase();
    return /(title|heading|eyebrow|brand|copyright|credit)/.test(signature)
      ? SITE_HEADING_FONT
      : SITE_BODY_FONT;
  }

  function previewStyle(entry: Entry): React.CSSProperties {
    const current = getStyle(entry);
    const explicitFont = current.fontFamily && current.fontFamily !== "inherit"
      ? current.fontFamily
      : inferredWebsiteFont(entry);
    return { ...styleToReact(current), fontFamily: explicitFont };
  }

  async function ensureEntry(entry: Entry) {
    if (entry.id) return entry.id;
    const { data, error } = await supabase.from("cms_text_entries").upsert(entry, { onConflict: "page_slug,section_slug,field_key" }).select("id").single();
    if (error) throw error;
    return data.id as string;
  }

  async function upsertTranslation(entry: Entry, lang: string, value: string) {
    const id = await ensureEntry(entry);
    const { error } = await supabase.from("cms_text_translations").upsert({ entry_id: id, language_code: lang, value, updated_at: new Date().toISOString() }, { onConflict: "entry_id,language_code" });
    if (error) throw error;
    setEntries((items) => items.map((item) => item.page_slug === entry.page_slug && item.section_slug === entry.section_slug && item.field_key === entry.field_key ? { ...item, id } : item));
  }

  async function translateItems(items: Array<{ key: string; value: string }>, targetLanguage: string) {
    const response = await fetch("/api/admin/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: targetLanguage, items }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Translation failed");
    return result.translations as Record<string, string>;
  }

  async function save(entry: Entry, translateAll = false) {
    const key = localKey(entry);
    setSaving(key);
    try {
      const value = getValue(entry);
      await upsertTranslation(entry, language, value);
      const entryId = await ensureEntry(entry);
      const { error: styleError } = await supabase.from("cms_text_entries").update({ style_json: getStyle(entry) }).eq("id", entryId);
      if (styleError) throw styleError;
      setValues((current) => ({ ...current, [key]: value }));

      if (translateAll && language === "en") {
        const translationKey = `${entry.page_slug}.${entry.section_slug}.${entry.field_key}`;
        for (const target of languages.filter((item) => item.code !== "en")) {
          const translated = await translateItems([{ key: translationKey, value }], target.code);
          const translatedValue = translated[translationKey] || value;
          await upsertTranslation(entry, target.code, translatedValue);
          setValues((current) => ({ ...current, [localKey(entry, target.code)]: translatedValue }));
        }
      }

      window.dispatchEvent(new Event("salt-cms-updated"));
      alert(translateAll && language === "en" ? "Saved and translated into every enabled language." : "Text saved successfully.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save text");
    } finally { setSaving(null); }
  }

  async function translateWholePage() {
    if (!confirm(`Translate every English field on ${cmsPageLabels[page] || page} into all enabled languages?`)) return;
    setTranslatingPage(true);
    try {
      const pageEntries = entries.filter((entry) => entry.page_slug === page);
      for (const entry of pageEntries) await ensureEntry(entry);
      const items = pageEntries.map((entry) => ({ key: `${entry.page_slug}.${entry.section_slug}.${entry.field_key}`, value: getValue(entry, "en") }));

      for (const target of languages.filter((item) => item.code !== "en")) {
        const translated = await translateItems(items, target.code);
        for (const entry of pageEntries) {
          const key = `${entry.page_slug}.${entry.section_slug}.${entry.field_key}`;
          const value = translated[key] || getValue(entry, "en");
          await upsertTranslation(entry, target.code, value);
          setValues((current) => ({ ...current, [localKey(entry, target.code)]: value }));
        }
      }
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert("The complete page has been translated and saved.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Page translation failed");
    } finally { setTranslatingPage(false); }
  }

  const activeLang = languages.find((item) => item.code === language) || fallbackLanguages[0];

  return (
    <AdminShell>
      <div className="os-page legacy-unified-page text-manager-page space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <p className="uppercase tracking-[4px] text-blue-400 font-black text-xs">Website Management</p>
            <h1 className="cms-page-title">Website Text Manager</h1>
            <p className="os-page-subtitle">Edit every live page section field-by-field, including mixed heading accents, font, size, color, alignment, spacing and language variants.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search text fields..." className="w-72 max-w-[70vw] rounded-xl border pl-11 pr-4 py-3"/></div>
            <button onClick={syncCurrentWebsite} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 px-4 py-3 font-black text-sm"><RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}/>{syncing ? "Syncing..." : "Sync Current Website"}</button><button onClick={discoverLivePageText} disabled={discovering || page === "global"} className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 px-4 py-3 font-black text-sm"><Search className={`w-4 h-4 ${discovering ? "animate-pulse" : ""}`}/>{discovering ? "Scanning..." : "Scan Live Page A–Z"}</button>
            <button onClick={() => { setAddTextSection(activeSection !== "all" ? activeSection : sectionOptions[0]?.slug || "content"); setAddTextOpen((current) => !current); }} className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 px-4 py-3 font-black text-sm"><Plus className="w-4 h-4"/>Add Text</button>
            <button onClick={translateWholePage} disabled={translatingPage} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-3 font-black text-sm"><Sparkles className={`w-4 h-4 ${translatingPage ? "animate-spin" : ""}`}/>{translatingPage ? "Translating..." : "Translate Whole Page"}</button>
          </div>
        </div>

        <div className="text-manager-shell cms-panel grid lg:grid-cols-[220px_1fr] rounded-[24px] border overflow-hidden min-h-[700px]">
          <aside className="text-manager-sidebar border-r p-4"><p className="text-[10px] uppercase tracking-[3px] text-slate-500 font-black px-2 mb-3">Website Pages</p><div className="space-y-1">{pages.map((pageSlug) => <button key={pageSlug} onClick={() => setPage(pageSlug)} className={`text-page-button w-full text-left px-3 py-3 rounded-xl font-bold text-sm ${page === pageSlug ? "active" : ""}`}>{cmsPageLabels[pageSlug] || pageSlug}</button>)}</div></aside>
          <section className="p-4 lg:p-6 space-y-5 min-w-0">
            <div className="text-manager-sections rounded-2xl border p-4">
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-[3px] font-black">Page Sections</p>
                <h2 className="mt-1 text-lg font-semibold">{cmsPageLabels[page] || page}</h2>
                <p className="mt-1 text-xs opacity-60">Section select karo, phir usi section ke text aur styling controls neeche edit karo.</p>
              </div>
              <div className="text-manager-section-tabs" role="tablist" aria-label="Page sections">
                <button type="button" onClick={() => setActiveSection("all")} className={`text-section-button ${activeSection === "all" ? "active" : ""}`}>All Sections</button>
                {sectionOptions.map((section) => (
                  <button key={section.slug} type="button" onClick={() => setActiveSection(section.slug)} className={`text-section-button ${activeSection === section.slug ? "active" : ""}`}>{section.label}</button>
                ))}
              </div>
            </div>
            {addTextOpen && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4"><div className="flex flex-col lg:flex-row gap-3 lg:items-end"><label className="flex-1 text-xs font-black"><span className="block mb-2">Section</span><select value={addTextSection} onChange={(event) => setAddTextSection(event.target.value)} className="w-full rounded-xl border px-3 py-3">{sectionOptions.map((section) => <option key={section.slug} value={section.slug}>{section.label}</option>)}</select></label><label className="flex-1 text-xs font-black"><span className="block mb-2">Field Name</span><input value={addTextLabel} onChange={(event) => setAddTextLabel(event.target.value)} className="w-full rounded-xl border px-3 py-3" placeholder="Example: Supporting Text"/></label><label className="text-xs font-black"><span className="block mb-2">Type</span><select value={addTextType} onChange={(event) => setAddTextType(event.target.value as "text" | "textarea")} className="rounded-xl border px-3 py-3"><option value="text">Single line</option><option value="textarea">Paragraph</option></select></label></div><label className="block mt-3 text-xs font-black"><span className="block mb-2">Text</span><textarea value={addTextValue} onChange={(event) => setAddTextValue(event.target.value)} className="w-full min-h-24 rounded-xl border p-3" placeholder="Enter the new text..."/></label><div className="mt-3 flex gap-2"><button onClick={addTextField} disabled={saving?.startsWith("manual_")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white text-xs font-black"><Plus className="w-4 h-4"/>Add Text Field</button><button onClick={() => setAddTextOpen(false)} className="rounded-xl border px-4 py-3 text-xs font-black">Cancel</button></div><p className="mt-2 text-[11px] text-slate-500">Manual fields are preserved when you sync the current website, so your own CMS text is never deleted.</p></div>}

            <div className="text-language-panel rounded-2xl border p-4"><div className="flex items-center gap-3 mb-3"><Languages className="text-blue-400"/><h2 className="font-black">Editing language</h2></div><div className="flex flex-wrap gap-2">{languages.map((item) => <button key={item.code} onClick={() => setLanguage(item.code)} className={`language-pill px-3 py-2 rounded-lg font-bold text-xs ${language === item.code ? "active" : ""}`}>{item.native_name}</button>)}</div><p className="text-[11px] text-slate-500 mt-3">English content can be automatically translated with the blue-violet translation controls. Missing translations fall back to English. {activeLang.direction === "rtl" ? "This language uses RTL." : ""}</p></div>

            {Object.entries(grouped).map(([section, rows]) => <section key={section} className="text-section-panel rounded-2xl border p-5"><div className="mb-5"><p className="text-[10px] uppercase tracking-[4px] text-blue-400 font-black">{cmsPageLabels[page] || page}</p><h2 className="text-xl font-black mt-1 capitalize">{section.replaceAll("_", " ")} Section</h2></div><div className="space-y-5">{rows.map((entry) => {
              const key = localKey(entry);
              return <div key={`${entry.page_slug}-${entry.section_slug}-${entry.field_key}`} className="text-manager-entry border-b border-white/10 pb-5 last:border-0 last:pb-0"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2"><div><label className="font-black text-sm">{entry.field_label}</label><p className="text-[11px] text-slate-500">{entry.field_key}</p></div><div className="flex gap-2"><button onClick={() => save(entry)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black"><Save className="w-4 h-4"/>{saving === key ? "Saving..." : "Save"}</button>{language === "en" && <button onClick={() => save(entry, true)} className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-xs font-black"><Sparkles className="w-4 h-4"/>Save + Translate All</button>}</div></div><div className="text-toolbar mb-3 flex flex-wrap items-center gap-2 rounded-xl border p-2">
                <span className="inline-flex items-center gap-2 px-2 text-[10px] font-black text-slate-500"><Type className="w-4 h-4"/>Website fonts</span>
                <select
                  value={getStyle(entry).fontFamily || "inherit"}
                  onChange={(event) => updateStyle(entry, { fontFamily: event.target.value })}
                  className="min-w-[230px] rounded-lg border px-3 py-2 text-xs"
                  aria-label="Font family"
                >
                  {fontOptions.map((font) => (
                    <option key={font.label} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[10px] font-black" title="Text color">
                  <Palette className="w-4 h-4" />
                  <input
                    type="color"
                    value={getStyle(entry).color || "#081325"}
                    onChange={(event) => updateStyle(entry, { color: event.target.value })}
                    className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label="Text color"
                  />
                  <input
                    value={getStyle(entry).color || ""}
                    onChange={(event) => updateStyle(entry, { color: event.target.value.trim() })}
                    placeholder="Text color"
                    className="w-24 rounded border px-2 py-1 text-[10px]"
                    aria-label="Text color value"
                  />
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[10px] font-black" title="Highlight color">
                  <Highlighter className="w-4 h-4" />
                  <input
                    type="color"
                    value={getStyle(entry).backgroundColor || "#fff0f2"}
                    onChange={(event) => updateStyle(entry, { backgroundColor: event.target.value })}
                    className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label="Highlight color"
                  />
                  <button
                    type="button"
                    onClick={() => updateStyle(entry, { backgroundColor: "" })}
                    className="rounded border px-2 py-1 text-[10px]"
                  >
                    Clear
                  </button>
                </label>
                <button type="button" title="Reset to the live website font and default styling" onClick={()=>setStyles((current)=>({...current,[styleKey(entry)]:baseStyleForEntry(entry)}))} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black"><RotateCcw className="w-4 h-4"/>Website Default</button>
                <div className="inline-flex items-center overflow-hidden rounded-lg border bg-white/5">
                  <button type="button" className="px-3 py-2 font-black" onClick={()=>{const n=parseInt(getStyle(entry).fontSize||"16")||16;updateStyle(entry,{fontSize:`${Math.max(8,n-1)}px`})}}>−</button>
                  <input type="number" min={8} max={300} value={parseInt(getStyle(entry).fontSize||"16")||16} onChange={e=>updateStyle(entry,{fontSize:`${Math.min(300,Math.max(8,Number(e.target.value)||16))}px`})} className="w-20 border-x bg-transparent px-2 py-2 text-center text-xs" aria-label="Font size"/>
                  <span className="px-2 text-[10px] font-black text-slate-500">PX</span>
                  <button type="button" className="px-3 py-2 font-black" onClick={()=>{const n=parseInt(getStyle(entry).fontSize||"16")||16;updateStyle(entry,{fontSize:`${Math.min(300,n+1)}px`})}}>+</button>
                </div>
                <select value={getStyle(entry).fontWeight || ""} onChange={(event)=>updateStyle(entry,{fontWeight:event.target.value})} className="text-style-compact-select rounded-lg border px-2 py-2 text-xs" aria-label="Font weight"><option value="">Theme weight</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 Semi Bold</option><option value="700">700 Bold</option><option value="800">800 Extra Bold</option><option value="900">900 Black</option></select>
                <label className="text-style-number"><span>Letter Spacing</span><input type="number" step="0.1" value={parseFloat(getStyle(entry).letterSpacing || "0") || 0} onChange={(event)=>updateStyle(entry,{letterSpacing:`${Number(event.target.value) || 0}px`})}/><small>px</small></label>
                <label className="text-style-number"><span>Line Height</span><input type="number" min="0.7" max="3" step="0.05" value={parseFloat(getStyle(entry).lineHeight || "1.2") || 1.2} onChange={(event)=>updateStyle(entry,{lineHeight:String(Math.max(.7,Math.min(3,Number(event.target.value)||1.2)))})}/></label>
                <button type="button" title="Bold" onClick={()=>updateStyle(entry,{fontWeight:getStyle(entry).fontWeight==="700"?"":"700"})} className={`p-2 rounded-lg ${getStyle(entry).fontWeight==="700"?"bg-blue-600":"bg-white/5"}`}><Bold className="w-4 h-4"/></button>
                <button type="button" title="Italic" onClick={()=>updateStyle(entry,{fontStyle:getStyle(entry).fontStyle==="italic"?"normal":"italic"})} className={`p-2 rounded-lg ${getStyle(entry).fontStyle==="italic"?"bg-blue-600":"bg-white/5"}`}><Italic className="w-4 h-4"/></button>
                <button type="button" title="Underline" onClick={()=>updateStyle(entry,{textDecoration:getStyle(entry).textDecoration==="underline"?"none":"underline"})} className={`p-2 rounded-lg ${getStyle(entry).textDecoration==="underline"?"bg-blue-600":"bg-white/5"}`}><Underline className="w-4 h-4"/></button>
                <button type="button" title="Uppercase" onClick={()=>updateStyle(entry,{textTransform:"uppercase"})} className={`p-2 rounded-lg ${getStyle(entry).textTransform==="uppercase"?"bg-blue-600":"bg-white/5"}`}><CaseUpper className="w-4 h-4"/></button>
                <button type="button" title="Lowercase" onClick={()=>updateStyle(entry,{textTransform:"lowercase"})} className={`p-2 rounded-lg ${getStyle(entry).textTransform==="lowercase"?"bg-blue-600":"bg-white/5"}`}><CaseLower className="w-4 h-4"/></button>
                <button type="button" onClick={()=>updateStyle(entry,{textAlign:"left"})} className={`p-2 rounded-lg ${getStyle(entry).textAlign==="left"?"bg-blue-600":"bg-white/5"}`}><AlignLeft className="w-4 h-4"/></button>
                <button type="button" onClick={()=>updateStyle(entry,{textAlign:"center"})} className={`p-2 rounded-lg ${getStyle(entry).textAlign==="center"?"bg-blue-600":"bg-white/5"}`}><AlignCenter className="w-4 h-4"/></button>
                <button type="button" onClick={()=>updateStyle(entry,{textAlign:"right"})} className={`p-2 rounded-lg ${getStyle(entry).textAlign==="right"?"bg-blue-600":"bg-white/5"}`}><AlignRight className="w-4 h-4"/></button>
              </div>
              {entry.field_type === "textarea" ? <textarea dir={activeLang.direction} value={getValue(entry)} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} style={previewStyle(entry)} className="w-full min-h-28 border rounded-xl p-4"/> : <input dir={activeLang.direction} value={getValue(entry)} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} style={previewStyle(entry)} className="w-full border rounded-xl p-4"/>}</div>;
            })}</div></section>)}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
