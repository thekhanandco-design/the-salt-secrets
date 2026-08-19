"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { adminFetch } from "@/lib/admin-client";
import { type CmsTextSeed } from "@/lib/cms-registry";
import { defaultSectionsForPage } from "@/lib/cms-section-registry";
import { PRODUCT_PAGE_SECTION_LABELS } from "@/lib/product-page-layout";
import { APPROVED_PRODUCT_CATEGORIES } from "@/lib/product-catalog";
import {
  cmsScopeForElement,
  cmsTextNodeFieldKey,
  cmsVariantNamespace,
  collectCmsTextNodes,
  parseCmsFullKey,
} from "@/lib/cms-dom-registry";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  ExternalLink,
  Globe2,
  Languages,
  LoaderCircle,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Type,
} from "lucide-react";
import {
  SITE_BODY_FONT,
  SITE_HEADING_FONT,
  styleToReact,
  type CmsTextStyle,
} from "@/lib/text-style";

type Language = {
  code: string;
  name: string;
  native_name: string;
  direction: "ltr" | "rtl";
  enabled: boolean;
};

type Translation = { language_code: string; value: string | null };

type DatabaseEntry = CmsTextSeed & {
  id?: string;
  cms_text_translations?: Translation[];
  style_json?: CmsTextStyle | null;
};

type ProductOption = {
  id: number;
  title: string;
  slug: string;
  status?: string | null;
  display_order?: number | null;
};

type DescriptorKind = "global" | "page" | "product-overview" | "product-family" | "product-detail";

type PageDescriptor = {
  id: string;
  storagePageSlug: string;
  route: string;
  label: string;
  group: "Website" | "Product Categories" | "Product Detail Pages";
  kind: DescriptorKind;
  variant?: string;
};

type LiveSection = {
  slug: string;
  label: string;
  order: number;
};

type LiveSnapshot = {
  pageSlug: string;
  seeds: CmsTextSeed[];
  mappedValues: Record<string, string>;
  sections: LiveSection[];
};

type EditorEntry = DatabaseEntry & {
  source: "mapped" | "discovered" | "manual";
};

type ScanStatus = "idle" | "scanning" | "ready" | "error";

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

const staticPages: Array<{ slug: string; route: string; label: string }> = [
  { slug: "home", route: "/", label: "Homepage" },
  { slug: "private-label", route: "/private-label", label: "Private Label" },
  { slug: "certifications", route: "/certifications", label: "Certifications" },
  { slug: "blog", route: "/blog", label: "Salt Journal / Blog" },
  { slug: "about", route: "/about", label: "About Us" },
  { slug: "our-story", route: "/our-story", label: "Our Story" },
  { slug: "faqs", route: "/faqs", label: "FAQ" },
  { slug: "contact", route: "/contact", label: "Contact" },
  { slug: "privacy-policy", route: "/privacy-policy", label: "Privacy Policy" },
  { slug: "terms-and-conditions", route: "/terms-and-conditions", label: "Terms & Conditions" },
];

const fontOptions = [
  { label: "Theme", value: "inherit" },
  { label: "Heading", value: SITE_HEADING_FONT },
  { label: "Body", value: SITE_BODY_FONT },
  { label: "Georgia", value: "Georgia, Times New Roman, serif" },
  { label: "Garamond", value: "Garamond, Baskerville, Georgia, serif" },
  { label: "Baskerville", value: "Baskerville, Georgia, serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica Neue, Helvetica, Arial, sans-serif" },
  { label: "Inter", value: "Inter, ui-sans-serif, system-ui, sans-serif" },
] as const;

const globalSectionLabels: Record<string, string> = {
  announcement: "Announcement Bar",
  branding: "Branding / Logo Area",
  navbar: "Navigation",
  footer: "Footer",
};

function entryKey(entry: Pick<CmsTextSeed, "page_slug" | "section_slug" | "field_key">) {
  return `${entry.page_slug}.${entry.section_slug}.${entry.field_key}`;
}

function localValueKey(entry: Pick<CmsTextSeed, "page_slug" | "section_slug" | "field_key">, language: string) {
  return `${entryKey(entry)}::${language}`;
}

function cleanText(value: string | null | undefined) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return value
    .replace(/^live_text_[a-z0-9]+$/i, "Text")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function humanFieldLabel(fieldKey: string, tagName: string, position: number) {
  const key = fieldKey.toLowerCase();
  if (/(^|_)eyebrow$|badge$|kicker$/.test(key)) return "Eyebrow / Badge";
  if (/title_main$|main_title$|main_heading$|(^|_)title$/.test(key)) return "Main Heading";
  if (/title_accent$|accent_title$|accent_heading$/.test(key)) return "Accent Heading";
  if (/intro_heading$/.test(key)) return "Intro Heading";
  if (/subtitle$|subheading$/.test(key)) return "Subheading";
  if (/description$|body$|paragraph$|intro$|copy$/.test(key)) return "Body Text";
  if (/primary.*(cta|label)|request.*quote|button.*primary/.test(key)) return "Primary Button";
  if (/secondary.*(cta|label)|button.*secondary/.test(key)) return "Secondary Button";
  if (/cta|button|label/.test(key)) return "Button / Label";
  if (/copyright/.test(key)) return "Copyright Text";
  if (/email/.test(key)) return "Email Text";
  if (/phone|whatsapp/.test(key)) return "Phone / WhatsApp Text";
  if (/address|location/.test(key)) return "Address / Location Text";

  const semantic: Record<string, string> = {
    h1: "Main Heading",
    h2: "Heading",
    h3: "Subheading",
    h4: "Subheading",
    h5: "Small Heading",
    h6: "Small Heading",
    p: "Body Text",
    a: "Link Text",
    button: "Button Text",
    label: "Label",
    summary: "Question",
    small: "Small Text",
    strong: "Strong Text",
    b: "Strong Text",
    em: "Italic / Accent Text",
    li: "List Text",
    span: "Text",
  };
  return `${semantic[tagName] || titleCase(fieldKey)} ${position}`;
}

function isPublicProduct(product: ProductOption) {
  const status = String(product.status || "").toLowerCase().trim();
  return !status || !["draft", "hidden", "archived", "inactive", "deleted"].includes(status);
}

function productPageSlug(product: Pick<ProductOption, "id" | "slug">) {
  return `product::${product.id}::${product.slug}`;
}

function getSectionLabel(pageSlug: string, sectionSlug: string, root?: HTMLElement | null) {
  if (pageSlug === "global") return globalSectionLabels[sectionSlug] || titleCase(sectionSlug);
  if (pageSlug.startsWith("product::")) {
    return PRODUCT_PAGE_SECTION_LABELS[sectionSlug as keyof typeof PRODUCT_PAGE_SECTION_LABELS] || titleCase(sectionSlug);
  }
  const known = defaultSectionsForPage(pageSlug).find((section) => section.slug === sectionSlug)?.label;
  if (known) return known;
  const liveHeading = cleanText(root?.querySelector("h1,h2,h3,h4")?.textContent);
  if (liveHeading && liveHeading.length <= 90) return liveHeading;
  if (sectionSlug.startsWith("auto-")) return `Page Section ${Number(sectionSlug.replace("auto-", "")) || ""}`.trim();
  if (sectionSlug === "content") return "Page Content";
  return titleCase(sectionSlug);
}

function emptyStyle(): CmsTextStyle {
  return {
    fontFamily: "inherit",
    fontSize: "",
    fontWeight: "",
    color: "",
    backgroundColor: "",
    textTransform: undefined,
    fontStyle: undefined,
    textDecoration: undefined,
    textAlign: undefined,
    letterSpacing: "",
    lineHeight: "",
    hidden: false,
    translateX: "",
    translateY: "",
    maxWidth: "",
  };
}

function normalizeStyle(style?: CmsTextStyle | null): CmsTextStyle {
  return { ...emptyStyle(), ...(style || {}) };
}

function scanSectionOrder(documentNode: Document, pageSlug: string) {
  const map = new Map<string, LiveSection>();
  let order = 0;
  for (const node of collectCmsTextNodes(documentNode.body)) {
    const parent = node.parentElement;
    if (!parent) continue;
    const scope = cmsScopeForElement(parent, pageSlug);
    if (!scope || scope.pageSlug !== pageSlug || map.has(scope.sectionSlug)) continue;
    map.set(scope.sectionSlug, {
      slug: scope.sectionSlug,
      label: getSectionLabel(pageSlug, scope.sectionSlug, scope.root),
      order: order++,
    });
  }
  return map;
}

function extractSnapshot(descriptor: PageDescriptor, documentNode: Document): LiveSnapshot {
  const pageSlug = descriptor.storagePageSlug;
  const seeds = new Map<string, CmsTextSeed>();
  const mappedValues: Record<string, string> = {};
  const sectionMap = scanSectionOrder(documentNode, pageSlug);
  const variantNamespace = cmsVariantNamespace(documentNode, pageSlug);
  const positions = new Map<string, number>();
  let displayOrder = 100;

  const ensureSection = (sectionSlug: string, root?: HTMLElement | null) => {
    if (sectionMap.has(sectionSlug)) return;
    sectionMap.set(sectionSlug, {
      slug: sectionSlug,
      label: getSectionLabel(pageSlug, sectionSlug, root),
      order: sectionMap.size,
    });
  };

  const addSeed = (seed: CmsTextSeed, value: string, sourceTag: string) => {
    const key = entryKey(seed);
    if (seeds.has(key)) return;
    const sectionRoot = documentNode.querySelector<HTMLElement>(`[data-cms-section="${CSS.escape(seed.section_slug)}"]`);
    ensureSection(seed.section_slug, sectionRoot);
    seeds.set(key, { ...seed, default_value: value, display_order: seed.display_order || displayOrder++ });
    mappedValues[key] = value;
    const positionKey = `${seed.section_slug}:${sourceTag}`;
    positions.set(positionKey, (positions.get(positionKey) || 0) + 1);
  };

  documentNode.querySelectorAll<HTMLElement>("[data-cms-key],[data-cms-runtime-key]").forEach((element) => {
    const fullKey = element.dataset.cmsKey || element.dataset.cmsRuntimeKey || "";
    const parsed = parseCmsFullKey(fullKey);
    const value = cleanText(element.textContent);
    if (!parsed || parsed.pageSlug !== pageSlug || !value) return;
    const tag = (element.closest("h1,h2,h3,h4,h5,h6,p,a,button,label,summary,small,strong,b,em,li,span") || element).tagName.toLowerCase();
    const counterKey = `${parsed.sectionSlug}:${tag}`;
    const position = (positions.get(counterKey) || 0) + 1;
    positions.set(counterKey, position);
    addSeed({
      page_slug: parsed.pageSlug,
      section_slug: parsed.sectionSlug,
      field_key: parsed.fieldKey,
      field_label: humanFieldLabel(parsed.fieldKey, tag, position),
      field_type: value.length > 110 ? "textarea" : "text",
      default_value: value,
      display_order: displayOrder++,
    }, value, tag);
  });

  for (const node of collectCmsTextNodes(documentNode.body)) {
    const parent = node.parentElement;
    if (!parent || parent.closest("[data-cms-key],[data-cms-runtime-key]")) continue;
    const scope = cmsScopeForElement(parent, pageSlug);
    if (!scope || scope.pageSlug !== pageSlug) continue;
    const value = cleanText(node.nodeValue);
    if (!value || value.length > 5000) continue;
    const fieldKey = cmsTextNodeFieldKey(scope.root, node, variantNamespace);
    if (!fieldKey) continue;
    const semantic = parent.closest<HTMLElement>("h1,h2,h3,h4,h5,h6,p,a,button,label,summary,small,strong,b,em,li,span,td,th") || parent;
    const tag = semantic.tagName.toLowerCase();
    const counterKey = `${scope.sectionSlug}:${tag}`;
    const position = (positions.get(counterKey) || 0) + 1;
    positions.set(counterKey, position);
    addSeed({
      page_slug: scope.pageSlug,
      section_slug: scope.sectionSlug,
      field_key: fieldKey,
      field_label: humanFieldLabel(fieldKey, tag, position),
      field_type: value.length > 110 ? "textarea" : "text",
      default_value: value,
      display_order: displayOrder++,
    }, value, tag);
  }

  const sections = Array.from(sectionMap.values()).sort((a, b) => a.order - b.order);
  return { pageSlug, seeds: Array.from(seeds.values()), mappedValues, sections };
}

async function captureRenderedPage(descriptor: PageDescriptor): Promise<LiveSnapshot> {
  const documentCopy = await new Promise<Document>((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.style.position = "fixed";
    iframe.style.width = "1440px";
    iframe.style.height = "900px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.left = "-20000px";
    iframe.style.top = "0";
    iframe.style.border = "0";

    let quietTimer = 0;
    let maxTimer = 0;
    let observer: MutationObserver | null = null;
    let settled = false;

    const cleanup = () => {
      if (quietTimer) window.clearTimeout(quietTimer);
      if (maxTimer) window.clearTimeout(maxTimer);
      observer?.disconnect();
      iframe.remove();
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      try {
        const liveDocument = iframe.contentDocument;
        if (!liveDocument?.documentElement) throw new Error(`Could not inspect ${descriptor.route}`);
        const copy = new DOMParser().parseFromString(liveDocument.documentElement.outerHTML, "text/html");
        cleanup();
        resolve(copy);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    const scheduleQuietFinish = () => {
      if (quietTimer) window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(finish, 950);
    };

    const separator = descriptor.route.includes("?") ? "&" : "?";
    iframe.src = `${descriptor.route}${separator}cms_text_manager=${Date.now()}`;
    iframe.onload = () => {
      try {
        const liveDocument = iframe.contentDocument;
        if (!liveDocument?.body) throw new Error(`Could not open ${descriptor.route}`);
        observer = new MutationObserver(scheduleQuietFinish);
        observer.observe(liveDocument.body, { subtree: true, childList: true, characterData: true, attributes: true });
        window.setTimeout(scheduleQuietFinish, 900);
        maxTimer = window.setTimeout(finish, 10000);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    iframe.onerror = () => {
      cleanup();
      reject(new Error(`Could not open ${descriptor.route}`));
    };
    document.body.appendChild(iframe);
  });

  return extractSnapshot(descriptor, documentCopy);
}

export default function TextManagerPage() {
  const [languages, setLanguages] = useState<Language[]>(fallbackLanguages);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedId, setSelectedId] = useState("page:home");
  const [entries, setEntries] = useState<EditorEntry[]>([]);
  const [sections, setSections] = useState<LiveSection[]>([]);
  const [language, setLanguage] = useState("en");
  const [query, setQuery] = useState("");
  const [pageQuery, setPageQuery] = useState("");
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanError, setScanError] = useState("");
  const [lastScannedAt, setLastScannedAt] = useState<Date | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [styles, setStyles] = useState<Record<string, CmsTextStyle>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState("");
  const [activeSection, setActiveSection] = useState<string>("all");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [advancedRows, setAdvancedRows] = useState<Set<string>>(new Set());
  const [productPagesOpen, setProductPagesOpen] = useState(false);
  const [categoryPagesOpen, setCategoryPagesOpen] = useState(true);
  const [translating, setTranslating] = useState(false);
  const scanRequestRef = useRef(0);

  const descriptors = useMemo<PageDescriptor[]>(() => {
    const website: PageDescriptor[] = [
      { id: "global", storagePageSlug: "global", route: "/", label: "Branding / Footer", group: "Website", kind: "global" },
      ...staticPages.slice(0, 1).map((item) => ({
        id: `page:${item.slug}`,
        storagePageSlug: item.slug,
        route: item.route,
        label: item.label,
        group: "Website" as const,
        kind: "page" as const,
      })),
      { id: "page:products", storagePageSlug: "products", route: "/products", label: "Products Page", group: "Website", kind: "product-overview" },
      ...staticPages.slice(1).map((item) => ({
        id: `page:${item.slug}`,
        storagePageSlug: item.slug,
        route: item.route,
        label: item.label,
        group: "Website" as const,
        kind: "page" as const,
      })),
    ];

    const families: PageDescriptor[] = APPROVED_PRODUCT_CATEGORIES.map((family) => ({
      id: `family:${family.slug}`,
      storagePageSlug: "products",
      route: `/products?family=${encodeURIComponent(family.slug)}`,
      label: family.name,
      group: "Product Categories",
      kind: "product-family",
      variant: family.slug,
    }));

    const details: PageDescriptor[] = products.filter(isPublicProduct).map((product) => ({
      id: `product:${product.id}`,
      storagePageSlug: productPageSlug(product),
      route: `/products/${product.slug}`,
      label: product.title,
      group: "Product Detail Pages",
      kind: "product-detail",
    }));

    return [...website, ...families, ...details];
  }, [products]);

  const selected = useMemo(
    () => descriptors.find((descriptor) => descriptor.id === selectedId) || descriptors.find((descriptor) => descriptor.id === "page:home") || descriptors[0],
    [descriptors, selectedId],
  );

  const activeLanguage = languages.find((item) => item.code === language) || fallbackLanguages[0];

  const loadFoundation = useCallback(async () => {
    const [{ data: languageRows }, { data: productRows }] = await Promise.all([
      supabase.from("cms_languages").select("code,name,native_name,direction,enabled,display_order").eq("enabled", true).order("display_order"),
      supabase.from("products").select("id,title,slug,status,display_order").order("display_order"),
    ]);
    if (languageRows?.length) setLanguages(languageRows as Language[]);
    setProducts(((productRows || []) as ProductOption[]).filter((product) => Boolean(product.slug)));
  }, []);

  useEffect(() => {
    void loadFoundation();
  }, [loadFoundation]);

  function buildEditorState(liveSnapshot: LiveSnapshot, databaseRows: DatabaseEntry[]) {
    const databaseMap = new Map(databaseRows.map((row) => [entryKey(row), row]));
    const liveKeys = new Set(liveSnapshot.seeds.map(entryKey));
    const merged: EditorEntry[] = liveSnapshot.seeds.map((seed) => {
      const database = databaseMap.get(entryKey(seed));
      return {
        ...seed,
        id: database?.id,
        cms_text_translations: database?.cms_text_translations || [],
        style_json: normalizeStyle(database?.style_json),
        source: seed.field_key.startsWith("live_text_") ? "discovered" : "mapped",
      };
    });

    // User-created fields are deliberately preserved, but old coded/prototype
    // rows are never shown if they are absent from the current rendered page.
    for (const row of databaseRows) {
      const manual = row.field_key.startsWith("manual_") || row.section_slug.startsWith("custom-");
      if (!manual || liveKeys.has(entryKey(row))) continue;
      merged.push({ ...row, style_json: normalizeStyle(row.style_json), source: "manual" });
    }

    const nextValues: Record<string, string> = {};
    const nextStyles: Record<string, CmsTextStyle> = {};
    for (const entry of merged) {
      const key = entryKey(entry);
      nextStyles[key] = normalizeStyle(entry.style_json);
      const englishTranslation = entry.cms_text_translations?.find((item) => item.language_code === "en")?.value;
      nextValues[`${key}::en`] = englishTranslation ?? liveSnapshot.mappedValues[key] ?? entry.default_value ?? "";
      for (const translation of entry.cms_text_translations || []) {
        nextValues[`${key}::${translation.language_code}`] = translation.value || "";
      }
    }

    setEntries(merged.sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)));
    setSections(liveSnapshot.sections);
    setValues(nextValues);
    setStyles(nextStyles);
    setDirtyKeys(new Set());
    setLastScannedAt(new Date());
  }

  const scanDescriptor = useCallback(async (descriptor: PageDescriptor) => {
    const snapshot = await captureRenderedPage(descriptor);
    const { data, error } = await supabase
      .from("cms_text_entries")
      .select("id,page_slug,section_slug,field_key,field_label,field_type,default_value,display_order,style_json,cms_text_translations(language_code,value)")
      .eq("page_slug", descriptor.storagePageSlug)
      .order("display_order");
    if (error) throw error;
    return { snapshot, databaseRows: (data || []) as DatabaseEntry[] };
  }, []);

  const refreshSelectedPage = useCallback(async (showError = true) => {
    if (!selected) return;
    const requestId = ++scanRequestRef.current;
    setScanStatus("scanning");
    setScanError("");
    try {
      const result = await scanDescriptor(selected);
      if (requestId !== scanRequestRef.current) return;
      buildEditorState(result.snapshot, result.databaseRows);
      setScanStatus("ready");
    } catch (error) {
      if (requestId !== scanRequestRef.current) return;
      const message = error instanceof Error ? error.message : "Could not read the current live page.";
      setEntries([]);
      setSections([]);
      setScanError(message);
      setScanStatus("error");
      if (showError) console.error("Text Manager live scan failed", error);
    }
  }, [scanDescriptor, selected]);

  useEffect(() => {
    if (!selected) return;
    const timer = window.setTimeout(() => void refreshSelectedPage(false), 80);
    return () => window.clearTimeout(timer);
  }, [selected, refreshSelectedPage]);

  function getValue(entry: EditorEntry, targetLanguage = language) {
    const direct = values[localValueKey(entry, targetLanguage)];
    if (direct !== undefined && direct !== "") return direct;
    const english = values[localValueKey(entry, "en")];
    return english !== undefined ? english : entry.default_value || "";
  }

  function getStyle(entry: EditorEntry) {
    return styles[entryKey(entry)] || emptyStyle();
  }

  function markDirty(entry: EditorEntry) {
    setDirtyKeys((current) => new Set(current).add(entryKey(entry)));
  }

  function updateValue(entry: EditorEntry, value: string) {
    setValues((current) => ({ ...current, [localValueKey(entry, language)]: value }));
    markDirty(entry);
  }

  function updateStyle(entry: EditorEntry, patch: Partial<CmsTextStyle>) {
    setStyles((current) => ({ ...current, [entryKey(entry)]: { ...getStyle(entry), ...patch } }));
    markDirty(entry);
  }

  async function ensureEntry(entry: EditorEntry) {
    const payload = {
      page_slug: entry.page_slug,
      section_slug: entry.section_slug,
      field_key: entry.field_key,
      field_label: entry.field_label,
      field_type: entry.field_type,
      default_value: entry.default_value,
      display_order: entry.display_order,
      style_json: getStyle(entry),
    };
    const { data, error } = await supabase
      .from("cms_text_entries")
      .upsert(payload, { onConflict: "page_slug,section_slug,field_key" })
      .select("id")
      .single();
    if (error) throw error;
    return String(data.id);
  }

  async function saveEntry(entry: EditorEntry, silent = false) {
    const key = entryKey(entry);
    setSavingKey(key);
    try {
      const id = await ensureEntry(entry);
      const value = getValue(entry);
      const { error } = await supabase.from("cms_text_translations").upsert({
        entry_id: id,
        language_code: language,
        value,
        updated_at: new Date().toISOString(),
      }, { onConflict: "entry_id,language_code" });
      if (error) throw error;

      setEntries((current) => current.map((item) => entryKey(item) === key ? { ...item, id, style_json: getStyle(item) } : item));
      setDirtyKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      window.dispatchEvent(new Event("salt-cms-updated"));
      if (!silent) alert("Text saved live.");
    } finally {
      setSavingKey(null);
    }
  }

  async function saveAll() {
    const dirty = entries.filter((entry) => dirtyKeys.has(entryKey(entry)));
    if (!dirty.length) return;
    setSavingAll(true);
    try {
      for (const entry of dirty) await saveEntry(entry, true);
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert(`${dirty.length} text changes saved live.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save all text changes.");
    } finally {
      setSavingAll(false);
    }
  }

  async function translateCurrentPage() {
    if (language === "en") {
      alert("Choose the target language first, then translate this page from English.");
      return;
    }
    const englishItems = entries.map((entry) => ({ key: entryKey(entry), value: getValue(entry, "en") })).filter((item) => item.value.trim());
    if (!englishItems.length) return;
    setTranslating(true);
    try {
      const response = await adminFetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, items: englishItems }),
      });
      const result = await response.json() as { error?: string; translations?: Record<string, string> };
      if (!response.ok) throw new Error(result.error || "Translation failed");
      const translated = result.translations || {};
      setValues((current) => {
        const next = { ...current };
        for (const entry of entries) next[localValueKey(entry, language)] = translated[entryKey(entry)] || getValue(entry, "en");
        return next;
      });
      setDirtyKeys(new Set(entries.map(entryKey)));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Translation failed.");
    } finally {
      setTranslating(false);
    }
  }

  async function persistSnapshot(snapshot: LiveSnapshot, cleanup: boolean) {
    const { data: existingRows, error: existingError } = await supabase
      .from("cms_text_entries")
      .select("id,page_slug,section_slug,field_key,style_json")
      .eq("page_slug", snapshot.pageSlug);
    if (existingError) throw existingError;

    const liveKeys = new Set(snapshot.seeds.map(entryKey));
    if (cleanup) {
      const staleIds = (existingRows || [])
        .filter((row: { id: string; page_slug: string; section_slug: string; field_key: string }) => {
          if (row.field_key.startsWith("manual_") || row.section_slug.startsWith("custom-")) return false;
          return !liveKeys.has(`${row.page_slug}.${row.section_slug}.${row.field_key}`);
        })
        .map((row: { id: string }) => row.id);
      if (staleIds.length) {
        const { error } = await supabase.from("cms_text_entries").delete().in("id", staleIds);
        if (error) throw error;
      }
    }

    if (!snapshot.seeds.length) return 0;
    const payload = snapshot.seeds.map((seed) => ({
      page_slug: seed.page_slug,
      section_slug: seed.section_slug,
      field_key: seed.field_key,
      field_label: seed.field_label,
      field_type: seed.field_type,
      default_value: seed.default_value,
      display_order: seed.display_order,
    }));
    const { data: savedRows, error: saveError } = await supabase
      .from("cms_text_entries")
      .upsert(payload, { onConflict: "page_slug,section_slug,field_key" })
      .select("id,page_slug,section_slug,field_key,default_value");
    if (saveError) throw saveError;

    const translations = (savedRows || []).map((row: { id: string; page_slug: string; section_slug: string; field_key: string; default_value: string | null }) => ({
      entry_id: row.id,
      language_code: "en",
      value: snapshot.mappedValues[`${row.page_slug}.${row.section_slug}.${row.field_key}`] || row.default_value || "",
      updated_at: new Date().toISOString(),
    }));
    if (translations.length) {
      const { error } = await supabase.from("cms_text_translations").upsert(translations, { onConflict: "entry_id,language_code" });
      if (error) throw error;
    }
    return snapshot.seeds.length;
  }

  async function syncSelectedPage() {
    if (!selected) return;
    setScanStatus("scanning");
    setScanError("");
    try {
      const snapshot = await captureRenderedPage(selected);
      // Products has seven live variants sharing one storage page. A single
      // family scan must never delete the other families, so cleanup happens
      // only during the complete website sync.
      const cleanup = selected.storagePageSlug !== "products";
      await persistSnapshot(snapshot, cleanup);
      await refreshSelectedPage(false);
      window.dispatchEvent(new Event("salt-cms-updated"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Page synchronization failed.";
      setScanStatus("error");
      setScanError(message);
      alert(message);
    }
  }

  async function syncEntireWebsite() {
    if (!confirm("Read the complete current website and rebuild the Text Manager manifest? Old text that is no longer rendered will be removed; manual/custom fields are preserved.")) return;
    setSyncingAll(true);
    setSyncProgress("Preparing live website scan…");
    try {
      const grouped = new Map<string, LiveSnapshot>();
      const failedStorage = new Set<string>();
      const failures: string[] = [];

      for (let index = 0; index < descriptors.length; index += 2) {
        const batch = descriptors.slice(index, index + 2);
        setSyncProgress(`Reading ${Math.min(index + 1, descriptors.length)}–${Math.min(index + batch.length, descriptors.length)} of ${descriptors.length} pages…`);
        const results = await Promise.allSettled(batch.map(captureRenderedPage));
        results.forEach((result, batchIndex) => {
          const descriptor = batch[batchIndex];
          if (result.status === "rejected") {
            failedStorage.add(descriptor.storagePageSlug);
            failures.push(descriptor.label);
            return;
          }
          const snapshot = result.value;
          const existing = grouped.get(snapshot.pageSlug) || { pageSlug: snapshot.pageSlug, seeds: [], mappedValues: {}, sections: [] };
          const seedMap = new Map(existing.seeds.map((seed) => [entryKey(seed), seed]));
          snapshot.seeds.forEach((seed) => seedMap.set(entryKey(seed), seed));
          const sectionMap = new Map(existing.sections.map((section) => [section.slug, section]));
          snapshot.sections.forEach((section) => { if (!sectionMap.has(section.slug)) sectionMap.set(section.slug, section); });
          grouped.set(snapshot.pageSlug, {
            pageSlug: snapshot.pageSlug,
            seeds: Array.from(seedMap.values()),
            mappedValues: { ...existing.mappedValues, ...snapshot.mappedValues },
            sections: Array.from(sectionMap.values()),
          });
        });
      }

      let mapped = 0;
      let completed = 0;
      for (const [storagePageSlug, snapshot] of grouped) {
        completed += 1;
        setSyncProgress(`Saving ${completed} of ${grouped.size} page manifests…`);
        mapped += await persistSnapshot(snapshot, !failedStorage.has(storagePageSlug));
      }

      await refreshSelectedPage(false);
      window.dispatchEvent(new Event("salt-cms-updated"));
      const failureText = failures.length ? ` ${failures.length} page(s) could not be read and were left untouched: ${failures.join(", ")}.` : "";
      alert(`Enterprise Text Manager rebuilt from the current website. ${mapped} live text fields mapped.${failureText}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Complete website synchronization failed.");
    } finally {
      setSyncingAll(false);
      setSyncProgress("");
    }
  }

  const sectionLabelMap = useMemo(() => new Map(sections.map((section) => [section.slug, section.label])), [sections]);

  const visibleEntries = useMemo(() => {
    const term = query.toLowerCase().trim();
    return entries.filter((entry) => {
      if (activeSection !== "all" && entry.section_slug !== activeSection) return false;
      if (!term) return true;
      return `${entry.field_label} ${entry.field_key} ${entry.section_slug} ${getValue(entry)}`.toLowerCase().includes(term);
    });
  }, [entries, activeSection, query, values, language]);

  const groupedEntries = useMemo(() => {
    const result = new Map<string, EditorEntry[]>();
    for (const entry of visibleEntries) {
      const current = result.get(entry.section_slug) || [];
      current.push(entry);
      result.set(entry.section_slug, current);
    }
    return Array.from(result.entries()).sort(([a], [b]) => {
      const ai = sections.findIndex((section) => section.slug === a);
      const bi = sections.findIndex((section) => section.slug === b);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  }, [visibleEntries, sections]);

  const pageGroups = useMemo(() => {
    const filter = (descriptor: PageDescriptor) => !pageQuery.trim() || descriptor.label.toLowerCase().includes(pageQuery.toLowerCase().trim());
    return {
      website: descriptors.filter((descriptor) => descriptor.group === "Website" && filter(descriptor)),
      families: descriptors.filter((descriptor) => descriptor.group === "Product Categories" && filter(descriptor)),
      products: descriptors.filter((descriptor) => descriptor.group === "Product Detail Pages" && filter(descriptor)),
    };
  }, [descriptors, pageQuery]);

  function selectPage(id: string) {
    setActiveSection("all");
    setSelectedId(id);
  }

  function toggleSection(section: string) {
    setCollapsedSections((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section); else next.add(section);
      return next;
    });
  }

  function toggleAdvanced(key: string) {
    setAdvancedRows((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function resetStyle(entry: EditorEntry) {
    setStyles((current) => ({ ...current, [entryKey(entry)]: emptyStyle() }));
    markDirty(entry);
  }

  const scanBadge = scanStatus === "ready"
    ? { text: "LIVE MAPPED", className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : scanStatus === "scanning"
      ? { text: "READING LIVE PAGE", className: "bg-amber-50 text-amber-700 border-amber-200" }
      : scanStatus === "error"
        ? { text: "SYNC NEEDED", className: "bg-rose-50 text-rose-700 border-rose-200" }
        : { text: "NOT SCANNED", className: "bg-slate-50 text-slate-600 border-slate-200" };

  return (
    <AdminShell>
      <div className="os-page legacy-unified-page enterprise-text-manager space-y-4">
        <div className="flex flex-col 2xl:flex-row 2xl:items-end 2xl:justify-between gap-4">
          <div className="min-w-0">
            <p className="uppercase tracking-[4px] text-rose-500 font-black text-[10px]">Website Management · Enterprise Live Text System</p>
            <h1 className="cms-page-title">Website Text Manager</h1>
            <p className="os-page-subtitle max-w-4xl">Current website only. Every page is read from the rendered site, section-by-section. Old theme/prototype text is never shown unless it still exists on the current page.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/website-editor" className="inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-black"><ExternalLink className="w-4 h-4"/>Visual Editor</Link>
            <button type="button" onClick={() => void syncSelectedPage()} disabled={scanStatus === "scanning" || syncingAll} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-black"><RefreshCw className={`w-4 h-4 ${scanStatus === "scanning" ? "animate-spin" : ""}`}/>Refresh This Page</button>
            <button type="button" onClick={() => void syncEntireWebsite()} disabled={syncingAll} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-black text-rose-700"><Globe2 className={`w-4 h-4 ${syncingAll ? "animate-pulse" : ""}`}/>{syncingAll ? "Syncing Website…" : "Sync Entire Website"}</button>
            <button type="button" onClick={() => void saveAll()} disabled={!dirtyKeys.size || savingAll} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-700 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-rose-900/10 disabled:opacity-50"><Save className="w-4 h-4"/>{savingAll ? "Saving…" : `Save Text Changes${dirtyKeys.size ? ` (${dirtyKeys.size})` : ""}`}</button>
          </div>
        </div>

        {syncProgress ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 flex items-center gap-2"><LoaderCircle className="w-4 h-4 animate-spin"/>{syncProgress}</div> : null}

        <div className="grid xl:grid-cols-[235px_minmax(0,1fr)] gap-4 items-start">
          <aside className="cms-panel !p-3 xl:sticky xl:top-[82px] xl:max-h-[calc(100vh-105px)] overflow-auto">
            <div className="relative mb-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-45"/><input value={pageQuery} onChange={(event) => setPageQuery(event.target.value)} placeholder="Find a page…" className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-xs"/></div>
            <p className="px-2 pb-2 text-[9px] font-black uppercase tracking-[2.4px] opacity-50">Website Pages</p>
            <div className="space-y-1">
              {pageGroups.website.map((descriptor) => <button key={descriptor.id} type="button" onClick={() => selectPage(descriptor.id)} className={`w-full rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold transition ${selected?.id === descriptor.id ? "bg-rose-500 text-white shadow-sm" : "hover:bg-rose-500/5"}`}>{descriptor.label}</button>)}
            </div>

            <div className="mt-3 border-t pt-3">
              <button type="button" onClick={() => setCategoryPagesOpen((current) => !current)} className="flex w-full items-center justify-between px-2 py-2 text-[10px] font-black uppercase tracking-[1.7px] opacity-70"><span>Product Categories</span>{categoryPagesOpen ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}</button>
              {categoryPagesOpen ? <div className="space-y-1">{pageGroups.families.map((descriptor) => <button key={descriptor.id} type="button" onClick={() => selectPage(descriptor.id)} className={`w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold ${selected?.id === descriptor.id ? "bg-rose-500 text-white" : "hover:bg-rose-500/5"}`}>{descriptor.label}</button>)}</div> : null}
            </div>

            <div className="mt-2 border-t pt-2">
              <button type="button" onClick={() => setProductPagesOpen((current) => !current)} className="flex w-full items-center justify-between px-2 py-2 text-[10px] font-black uppercase tracking-[1.7px] opacity-70"><span>Product Detail Pages <small className="ml-1 opacity-60">({pageGroups.products.length})</small></span>{productPagesOpen ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}</button>
              {productPagesOpen ? <div className="max-h-[320px] overflow-auto space-y-1 pr-1">{pageGroups.products.map((descriptor) => <button key={descriptor.id} type="button" onClick={() => selectPage(descriptor.id)} className={`w-full rounded-lg px-3 py-2 text-left text-[11px] font-semibold ${selected?.id === descriptor.id ? "bg-rose-500 text-white" : "hover:bg-rose-500/5"}`}>{descriptor.label}</button>)}</div> : null}
            </div>
          </aside>

          <main className="min-w-0 space-y-3">
            <section className="cms-panel !p-4 xl:sticky xl:top-[78px] z-10">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-[var(--site-font-heading)] text-[27px] leading-none">{selected?.label || "Website Page"}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black tracking-[1.2px] ${scanBadge.className}`}>{scanBadge.text}</span>
                    {entries.length ? <span className="rounded-full border px-2 py-1 text-[9px] font-bold opacity-60">{entries.length} live fields</span> : null}
                  </div>
                  <p className="mt-1 text-[11px] opacity-55 truncate">{selected?.route} {lastScannedAt ? `· read ${lastScannedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this page…" className="w-[210px] rounded-lg border py-2 pl-9 pr-3 text-[11px]"/></div>
                  <select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-lg border px-2.5 py-2 text-[11px] font-bold" aria-label="Editing language">{languages.map((item) => <option key={item.code} value={item.code}>{item.native_name}</option>)}</select>
                  <button type="button" onClick={() => void translateCurrentPage()} disabled={translating || language === "en"} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-black disabled:opacity-40"><Languages className="w-3.5 h-3.5"/>{translating ? "Translating…" : "Translate Page"}</button>
                  {selected ? <a href={selected.route} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-black"><ExternalLink className="w-3.5 h-3.5"/>Open Live</a> : null}
                </div>
              </div>

              {sections.length ? <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                <button type="button" onClick={() => setActiveSection("all")} className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black ${activeSection === "all" ? "bg-rose-500 text-white border-rose-500" : ""}`}>All Sections</button>
                {sections.map((section) => <button key={section.slug} type="button" onClick={() => setActiveSection(section.slug)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black ${activeSection === section.slug ? "bg-rose-500 text-white border-rose-500" : ""}`}>{section.label}</button>)}
              </div> : null}
            </section>

            {scanStatus === "scanning" ? <div className="cms-panel min-h-[320px] grid place-items-center"><div className="text-center"><LoaderCircle className="mx-auto w-7 h-7 animate-spin text-rose-500"/><h3 className="mt-3 font-bold">Reading the current rendered page…</h3><p className="mt-1 text-xs opacity-55">Waiting for CMS data and dynamic sections to finish loading.</p></div></div> : null}

            {scanStatus === "error" ? <div className="cms-panel min-h-[260px] grid place-items-center"><div className="max-w-lg text-center"><CircleAlert className="mx-auto w-8 h-8 text-rose-500"/><h3 className="mt-3 text-lg font-bold">Current page could not be read</h3><p className="mt-2 text-xs opacity-60">{scanError}</p><button type="button" onClick={() => void refreshSelectedPage()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-black text-white"><RefreshCw className="w-4 h-4"/>Retry Live Scan</button></div></div> : null}

            {scanStatus === "ready" && !groupedEntries.length ? <div className="cms-panel min-h-[240px] grid place-items-center"><div className="text-center"><Check className="mx-auto w-7 h-7 text-emerald-500"/><h3 className="mt-3 font-bold">No matching text fields</h3><p className="mt-1 text-xs opacity-55">Clear the search/filter or refresh this page.</p></div></div> : null}

            {scanStatus === "ready" ? groupedEntries.map(([sectionSlug, sectionEntries]) => {
              const collapsed = collapsedSections.has(sectionSlug);
              const sectionLabel = sectionLabelMap.get(sectionSlug) || getSectionLabel(selected?.storagePageSlug || "home", sectionSlug);
              return (
                <section key={sectionSlug} className="cms-panel !p-0 overflow-hidden">
                  <button type="button" onClick={() => toggleSection(sectionSlug)} className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b text-left">
                    <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="font-[var(--site-font-heading)] text-[21px] leading-none">{sectionLabel}</h3><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black tracking-[1px] text-emerald-700">MAPPED</span></div><p className="mt-1 text-[10px] opacity-45">{sectionEntries.length} current live text field{sectionEntries.length === 1 ? "" : "s"}</p></div>
                    {collapsed ? <ChevronRight className="w-4 h-4 opacity-50"/> : <ChevronDown className="w-4 h-4 opacity-50"/>}
                  </button>

                  {!collapsed ? <div className="divide-y">
                    {sectionEntries.map((entry) => {
                      const key = entryKey(entry);
                      const style = getStyle(entry);
                      const isDirty = dirtyKeys.has(key);
                      const advanced = advancedRows.has(key);
                      const fontSize = parseInt(style.fontSize || "", 10) || "";
                      const previewCss = styleToReact(style);
                      return (
                        <div key={key} className={`px-4 py-3 ${isDirty ? "bg-amber-50/40" : ""}`}>
                          <div className="grid 2xl:grid-cols-[145px_minmax(260px,1fr)_390px] xl:grid-cols-[130px_minmax(240px,1fr)_350px] gap-2.5 items-center">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5"><p className="truncate text-[11px] font-black" title={entry.field_label}>{entry.field_label}</p>{entry.source === "mapped" ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" title="Explicitly mapped"/> : entry.source === "discovered" ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" title="Automatically discovered"/> : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" title="Manual field"/>}</div>
                              <p className="mt-0.5 truncate font-mono text-[8px] opacity-35" title={entry.field_key}>{entry.field_key}</p>
                            </div>

                            <div className="min-w-0">
                              {entry.field_type === "textarea" || getValue(entry).length > 85 ? (
                                <textarea dir={activeLanguage.direction} value={getValue(entry)} onChange={(event) => updateValue(entry, event.target.value)} className="w-full min-h-[54px] max-h-[120px] resize-y rounded-lg border px-3 py-2 text-[12px] leading-[1.35]" style={{ ...previewCss, fontSize: previewCss.fontSize || undefined }}/>
                              ) : (
                                <input dir={activeLanguage.direction} value={getValue(entry)} onChange={(event) => updateValue(entry, event.target.value)} className="w-full h-[40px] rounded-lg border px-3 text-[12px]" style={{ ...previewCss, fontSize: previewCss.fontSize || undefined }}/>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-1.5 min-w-0">
                              <select value={style.fontFamily || "inherit"} onChange={(event) => updateStyle(entry, { fontFamily: event.target.value })} className="w-[86px] rounded-lg border px-2 py-2 text-[9px] font-bold" title="Font"><option value="inherit">Theme</option>{fontOptions.slice(1).map((font) => <option key={font.label} value={font.value}>{font.label}</option>)}</select>
                              <div className="flex items-center rounded-lg border overflow-hidden" title="Font size"><input type="number" min={8} max={180} value={fontSize} placeholder="Auto" onChange={(event) => updateStyle(entry, { fontSize: event.target.value ? `${Math.max(8, Math.min(180, Number(event.target.value)))}px` : "" })} className="w-[52px] border-0 !bg-transparent px-1.5 py-2 text-center text-[9px]"/><span className="pr-1.5 text-[8px] opacity-40">px</span></div>
                              <select value={style.textAlign || ""} onChange={(event) => updateStyle(entry, { textAlign: (event.target.value || undefined) as CmsTextStyle["textAlign"] })} className="w-[68px] rounded-lg border px-1.5 py-2 text-[9px] font-bold" title="Alignment"><option value="">Align</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>
                              <button type="button" onClick={() => updateStyle(entry, { hidden: !style.hidden })} className={`h-[34px] w-[34px] grid place-items-center rounded-lg border ${style.hidden ? "bg-amber-50 text-amber-700" : ""}`} title={style.hidden ? "Show text" : "Hide text"}>{style.hidden ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}</button>
                              <button type="button" onClick={() => toggleAdvanced(key)} className={`h-[34px] w-[34px] grid place-items-center rounded-lg border ${advanced ? "bg-slate-900 text-white" : ""}`} title="Advanced styling"><Settings2 className="w-3.5 h-3.5"/></button>
                              <button type="button" onClick={() => void saveEntry(entry)} disabled={!isDirty || savingKey === key} className={`h-[34px] w-[34px] grid place-items-center rounded-lg ${isDirty ? "bg-rose-500 text-white" : "border opacity-35"}`} title="Save this field">{savingKey === key ? <LoaderCircle className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5"/>}</button>
                            </div>
                          </div>

                          {advanced ? <div className="mt-2 ml-0 2xl:ml-[155px] xl:ml-[140px] rounded-xl border bg-slate-500/[0.025] p-2.5 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[9px] font-black opacity-55"><Type className="w-3.5 h-3.5"/>Advanced</span>
                            <select value={style.fontWeight || ""} onChange={(event) => updateStyle(entry, { fontWeight: event.target.value })} className="rounded-lg border px-2 py-2 text-[9px]"><option value="">Theme weight</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 Semi</option><option value="700">700 Bold</option></select>
                            <button type="button" onClick={() => updateStyle(entry, { fontStyle: style.fontStyle === "italic" ? undefined : "italic" })} className={`rounded-lg border px-2.5 py-2 text-[9px] font-black ${style.fontStyle === "italic" ? "bg-rose-50 text-rose-700" : ""}`}>Italic</button>
                            <label className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[9px] font-bold">Color <input type="color" value={style.color || "#17171a"} onChange={(event) => updateStyle(entry, { color: event.target.value })} className="h-5 w-6 border-0 p-0 bg-transparent"/></label>
                            <label className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[9px]">Spacing <input type="number" step="0.1" value={parseFloat(style.letterSpacing || "") || ""} onChange={(event) => updateStyle(entry, { letterSpacing: event.target.value ? `${event.target.value}px` : "" })} className="w-12 border-0 !bg-transparent p-0 text-[9px]"/></label>
                            <label className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[9px]">Line <input type="number" min="0.7" max="3" step="0.05" value={parseFloat(style.lineHeight || "") || ""} onChange={(event) => updateStyle(entry, { lineHeight: event.target.value })} className="w-12 border-0 !bg-transparent p-0 text-[9px]"/></label>
                            <div className="inline-flex overflow-hidden rounded-lg border"><button type="button" onClick={() => updateStyle(entry, { textAlign: "left" })} className={`p-2 ${style.textAlign === "left" ? "bg-rose-50 text-rose-700" : ""}`} title="Align left"><AlignLeft className="w-3.5 h-3.5"/></button><button type="button" onClick={() => updateStyle(entry, { textAlign: "center" })} className={`p-2 ${style.textAlign === "center" ? "bg-rose-50 text-rose-700" : ""}`} title="Align center"><AlignCenter className="w-3.5 h-3.5"/></button><button type="button" onClick={() => updateStyle(entry, { textAlign: "right" })} className={`p-2 ${style.textAlign === "right" ? "bg-rose-50 text-rose-700" : ""}`} title="Align right"><AlignRight className="w-3.5 h-3.5"/></button></div>
                            <button type="button" onClick={() => resetStyle(entry)} className="rounded-lg border px-2.5 py-2 text-[9px] font-black">Website Default</button>
                          </div> : null}
                        </div>
                      );
                    })}
                  </div> : null}
                </section>
              );
            }) : null}
          </main>
        </div>
      </div>
    </AdminShell>
  );
}
