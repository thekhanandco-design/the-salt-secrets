"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { currentCmsImageRegistry, cmsPageLabels, cmsTextRegistry } from "@/lib/cms-registry";
import { cmsSectionTemplates, defaultSectionsForPage, isCanonicalCmsSection, slugifySectionLabel, type CmsSectionLayout, type CmsSectionTemplateKey } from "@/lib/cms-section-registry";
import { supabase } from "@/lib/supabase-client";
import { adminUpload } from "@/lib/admin-client";
import { normalizeProductPageSettings, PRODUCT_PAGE_SECTION_LABELS, type ProductPageSettings, type ProductPageSectionKey } from "@/lib/product-page-layout";
import { cmsImageSlotKey, cmsScopeForElement, cmsTextNodeFieldKey, cmsVariantNamespace, collectCmsTextNodes, normalizeCmsImageUrl, normalizeCmsText, parseCmsFullKey, replaceVisibleElementText } from "@/lib/cms-dom-registry";
import { defaultCmsTextStyle, type CmsTextStyle } from "@/lib/text-style";
import { ArrowDown, ArrowUp, CheckCircle2, ChevronDown, Eye, EyeOff, Image as ImageIcon, Laptop, Layers3, MousePointer2, Move, Palette, Plus, Redo2, RefreshCw, RotateCcw, Save, Search, Smartphone, Tablet, Trash2, Type, Undo2, UploadCloud, X } from "lucide-react";

type TextEntry = { id?: string; page_slug: string; section_slug: string; field_key: string; field_label: string; field_type: string; default_value: string; value: string; display_order?: number; style_json?: CmsTextStyle | null };
type ImageSlot = { id?: string; page_slug: string; section_slug: string; slot_key: string; title: string; current_url: string; default_url: string; alt_text: string; recommended_width?: number; recommended_height?: number; display_order?: number; is_active?: boolean };
type Snapshot = { texts: TextEntry[]; images: ImageSlot[] };
type ProductOption = { id: number; title: string; slug: string; status?: string; subtitle?: string | null; description?: string | null; image?: string | null };
type SectionLayout = CmsSectionLayout;
const pageOptions = Object.entries(cmsPageLabels).filter(([slug]) => slug !== "global");
function pretty(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()); }

const visualSectionAliases: Record<string, Record<string, string>> = {
  home: { private_program: "private_label", product_families: "collections" },
};

const productFamilySlugByHeroImageSlot: Record<string, string> = {
  edible_image: "edible-salt",
  lamps_image: "salt-lamps",
  tiles_image: "salt-tiles-bricks",
  slabs_image: "cooking-plates-slabs",
  lick_image: "animal-lick-salt",
  bulk_image: "bulk-raw-salt",
};
function visualSectionFor(pageSlug: string, sectionSlug: string) { return visualSectionAliases[pageSlug]?.[sectionSlug] || sectionSlug; }
function normalizePreviewText(value: string | null | undefined) { return String(value || "").replace(/\s+/g, " ").trim(); }
function textEntryKey(entry: Pick<TextEntry, "page_slug" | "section_slug" | "field_key">) { return `${entry.page_slug}.${entry.section_slug}.${entry.field_key}`; }
function imageEntryKey(entry: Pick<ImageSlot, "page_slug" | "section_slug" | "slot_key">) { return `${entry.page_slug}.${entry.section_slug}.${entry.slot_key}`; }
function isCurrentVisualTextSeed(item: (typeof cmsTextRegistry)[number]) {
  if (/\blegacy\b/i.test(item.field_label)) return false;
  if (item.page_slug === "home" && ["private_label", "collections"].includes(item.section_slug)) return false;
  if (item.page_slug === "home" && ["private_program", "product_families"].includes(item.section_slug)) return true;
  return isCanonicalCmsSection(item.page_slug, item.section_slug);
}
function editorFieldLabel(section: string, tag: string, position: number) {
  const name = section.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
  const kind = ({ h1:"Main Heading", h2:"Heading", h3:"Subheading", h4:"Subheading", p:"Paragraph", a:"Link", button:"Button", label:"Label", summary:"FAQ Question", small:"Small Text", strong:"Strong Text", b:"Strong Text", em:"Accent / Italic", span:"Text" } as Record<string,string>)[tag] || "Text";
  return `${name} — ${kind} ${position}`;
}

export default function WebsiteEditor() {
  const [pageSlug, setPageSlug] = useState("home");
  const [sectionSlug, setSectionSlug] = useState("hero");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [texts, setTexts] = useState<TextEntry[]>([]);
  const [images, setImages] = useState<ImageSlot[]>([]);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [initialized, setInitialized] = useState(true);
  const imageInput = useRef<HTMLInputElement>(null);
  const previewFrame = useRef<HTMLIFrameElement>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [imageTarget, setImageTarget] = useState<string>("");
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [productFamilyPreview, setProductFamilyPreview] = useState("edible-salt");
  const [sectionLayout, setSectionLayout] = useState<SectionLayout[]>(defaultSectionsForPage("home"));
  const [siteSettingsId, setSiteSettingsId] = useState<number | null>(null);
  const [siteConfig, setSiteConfig] = useState<Record<string, unknown>>({});
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addSectionTemplate, setAddSectionTemplate] = useState<CmsSectionTemplateKey>("editorial");
  const [addSectionLabel, setAddSectionLabel] = useState("New Section");
  const [productPageSettings, setProductPageSettings] = useState<ProductPageSettings | null>(null);
  const [selectedInlineKey, setSelectedInlineKey] = useState<string | null>(null);
  const [selectedInlineImageKey, setSelectedInlineImageKey] = useState<string | null>(null);
  const [dirtyTextKeys, setDirtyTextKeys] = useState<Set<string>>(new Set());
  const [dirtyImageKeys, setDirtyImageKeys] = useState<Set<string>>(new Set());
  const editorRescanTimer = useRef<number | null>(null);
  const previewMutationObserver = useRef<MutationObserver | null>(null);
  const [inspectorQuery, setInspectorQuery] = useState("");
  const [inspectorTab, setInspectorTab] = useState<"content" | "design" | "section">("content");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    if (pageSlug.startsWith("product::")) {
      const [, idText] = pageSlug.split("::");
      const productId = Number(idText);
      const [productResult, pageResult, cmsTextResult, cmsImageResult] = await Promise.all([
        supabase.from("products").select("id,title,slug,status,subtitle,description,short_description,image").eq("id", productId).maybeSingle(),
        supabase.from("page_content").select("content").eq("page_slug", `product:${productId}`).maybeSingle(),
        supabase.from("cms_text_entries").select("id,page_slug,section_slug,field_key,field_label,field_type,default_value,style_json,display_order,cms_text_translations(language_code,value)").in("page_slug", [pageSlug, "global"]).order("display_order"),
        supabase.from("cms_image_slots").select("*").in("page_slug", [pageSlug, "global"]).eq("is_active", true).order("display_order"),
      ]);
      if (productResult.error || !productResult.data) { setError(productResult.error?.message || "Product page not found."); setLoading(false); return; }
      if (cmsTextResult.error || cmsImageResult.error) { setError(cmsTextResult.error?.message || cmsImageResult.error?.message || "Product CMS fields could not be loaded."); setLoading(false); return; }
      const row: any = productResult.data;
      const settings = normalizeProductPageSettings(pageResult.data?.content);
      setProductPageSettings(settings);
      const productTexts: TextEntry[] = [
        ["hero","eyebrow","Eyebrow",settings.eyebrow],
        ["hero","title","Product Heading",String(row.title || "")],
        ["hero","subtitle","Subtitle",String(row.subtitle || "")],
        ["hero","description","Description",String(row.description || row.short_description || "")],
        ["hero","requestQuoteLabel","Quotation Button",settings.requestQuoteLabel],
        ["hero","whatsappLabel","WhatsApp Button",settings.whatsappLabel],
        ["marketplaces","title","Marketplace Heading",settings.marketplacesTitle],
        ["marketplaces","subtitle","Marketplace Subheading",settings.marketplacesSubtitle],
        ["process","title","Process Heading",settings.processTitle],
        ["process","subtitle","Process Subheading",settings.processSubtitle],
        ["specifications","title","Specifications Heading",settings.specificationsTitle],
      ].map((item, index) => ({ id:`product-text-${item[0]}-${item[1]}`, page_slug:pageSlug, section_slug:String(item[0]), field_key:String(item[1]), field_label:String(item[2]), field_type:["description","subtitle"].includes(String(item[1])) ? "textarea" : "text", default_value:String(item[3] || ""), value:String(item[3] || ""), display_order:index }));

      const cmsRows = (cmsTextResult.data || []).map((cmsRow: any) => ({
        ...cmsRow,
        value: String((cmsRow.cms_text_translations || []).find((translation: any) => translation.language_code === "en")?.value || cmsRow.default_value || ""),
      })) as TextEntry[];
      const cmsMap = new Map(cmsRows.map((item) => [textEntryKey(item), item]));
      const mergedProductTexts = productTexts.map((item) => {
        const saved = cmsMap.get(textEntryKey(item));
        return saved ? { ...item, ...saved, value: saved.value || item.value } : item;
      });
      const knownKeys = new Set(mergedProductTexts.map(textEntryKey));
      const allTexts = [...mergedProductTexts, ...cmsRows.filter((item) => !knownKeys.has(textEntryKey(item)))];

      const directImage: ImageSlot = { id:"product-image-main", page_slug:pageSlug, section_slug:"hero", slot_key:"main_image", title:"Main Product Image", current_url:String(row.image || "/product-2.png"), default_url:String(row.image || "/product-2.png"), alt_text:String(row.title || "Product image"), recommended_width:1200, recommended_height:1200, display_order:1, is_active:true };
      const cmsImages = (cmsImageResult.data || []) as ImageSlot[];
      const savedMain = cmsImages.find((item) => item.page_slug === pageSlug && item.section_slug === "hero" && item.slot_key === "main_image");
      const allImages = [savedMain ? { ...directImage, ...savedMain } : directImage, ...cmsImages.filter((item) => imageEntryKey(item) !== imageEntryKey(directImage))];

      const layout: SectionLayout[] = settings.sectionOrder.map((key) => ({ slug:key, label:PRODUCT_PAGE_SECTION_LABELS[key], visible:settings.sectionVisibility[key] !== false }));
      setTexts(allTexts); setImages(allImages); setSectionLayout(layout); setInitialized(true); setSelectedInlineKey(null); setSelectedInlineImageKey(null); setDirtyTextKeys(new Set()); setDirtyImageKeys(new Set()); setSectionSlug((current) => layout.some((item) => item.slug === current) ? current : (layout[0]?.slug || "hero")); setHistory([]); setFuture([]); setLoading(false); return;
    }
    setProductPageSettings(null);
    const pageTextSeeds = cmsTextRegistry.filter((item) => (item.page_slug === pageSlug || item.page_slug === "global") && isCurrentVisualTextSeed(item));

    // Product family hero banners are owned by the categories table. Build the
    // six CMS image seeds from those real current values so opening Visual
    // Editor can never replace a live category banner with an old fallback.
    let categoryHeroImages = new Map<string, string>();
    if (pageSlug === "products") {
      const categoryResult = await supabase.from("categories").select("slug,image");
      if (categoryResult.error) { setError(categoryResult.error.message); setLoading(false); return; }
      categoryHeroImages = new Map((categoryResult.data || []).map((row: any) => [String(row.slug || ""), String(row.image || "")]));
    }

    const pageImageSeeds = currentCmsImageRegistry
      .filter((item) => (item.page_slug === pageSlug || item.page_slug === "global"))
      .map((item) => {
        if (item.page_slug !== "products" || item.section_slug !== "hero") return item;
        const categorySlug = productFamilySlugByHeroImageSlot[item.slot_key];
        const current = categorySlug ? categoryHeroImages.get(categorySlug) : "";
        return current ? { ...item, current_url: current } : item;
      });
    const productHeroImageSeeds = pageImageSeeds.filter((item) => item.page_slug === "products" && item.section_slug === "hero" && productFamilySlugByHeroImageSlot[item.slot_key]);
    const otherImageSeeds = pageImageSeeds.filter((item) => !productHeroImageSeeds.includes(item));

    await Promise.all([
      pageTextSeeds.length ? supabase.from("cms_text_entries").upsert(pageTextSeeds, { onConflict: "page_slug,section_slug,field_key" }) : Promise.resolve({ error: null }),
      otherImageSeeds.length ? supabase.from("cms_image_slots").upsert(otherImageSeeds, { onConflict: "page_slug,section_slug,slot_key", ignoreDuplicates: true }) : Promise.resolve({ error: null }),
      productHeroImageSeeds.length ? supabase.from("cms_image_slots").upsert(productHeroImageSeeds, { onConflict: "page_slug,section_slug,slot_key" }) : Promise.resolve({ error: null }),
    ]);
    const [textResult, imageResult, settingsResult] = await Promise.all([
      supabase.from("cms_text_entries").select("id,page_slug,section_slug,field_key,field_label,field_type,default_value,style_json,display_order,cms_text_translations(language_code,value)").in("page_slug", [pageSlug, "global"]).order("display_order"),
      supabase.from("cms_image_slots").select("*").in("page_slug", [pageSlug, "global"]).order("display_order"),
      supabase.from("site_settings").select("id,config_json").limit(1).maybeSingle(),
    ]);
    if (textResult.error || imageResult.error || settingsResult.error) { setError(textResult.error?.message || imageResult.error?.message || settingsResult.error?.message || "Website content tables are unavailable."); setLoading(false); return; }
    const staticTextKeys = new Set(pageTextSeeds.map((item) => `${item.page_slug}:${item.section_slug}:${item.field_key}`));
    const pageHasCanonicalSections = defaultSectionsForPage(pageSlug).length > 0;
    const liveTexts = (textResult.data || [])
      .filter((row: any) => {
        if (row.page_slug === "global") return true;
        const key = `${row.page_slug}:${row.section_slug}:${row.field_key}`;
        if (staticTextKeys.has(key)) return true;
        if (!pageHasCanonicalSections) return true;
        if (isCanonicalCmsSection(row.page_slug, String(row.section_slug || ""))) return true;
        return String(row.section_slug || "").startsWith("custom-") || String(row.field_key || "").startsWith("live_");
      })
      .map((row: any) => ({ ...row, value: String((row.cms_text_translations || []).find((translation: any) => translation.language_code === "en")?.value || row.default_value || "") })) as TextEntry[];
    const staticImageKeys = new Set(pageImageSeeds.map(imageEntryKey));
    const liveImages = ((imageResult.data || []) as ImageSlot[]).filter((row) => staticImageKeys.has(imageEntryKey(row)) || String(row.slot_key || "").startsWith("live_") || String(row.section_slug || "").startsWith("custom-"));
    setTexts(liveTexts); setImages(liveImages); setSelectedInlineKey(null); setSelectedInlineImageKey(null); setDirtyTextKeys(new Set()); setDirtyImageKeys(new Set()); setInitialized(Boolean(liveTexts.length || liveImages.length));
    const availableSections = Array.from(new Set([...liveTexts.filter(item => item.page_slug === pageSlug).map(item => visualSectionFor(item.page_slug, item.section_slug)), ...liveImages.filter(item => item.page_slug === pageSlug).map(item => item.section_slug)]));
    const nextConfig = (settingsResult.data?.config_json && typeof settingsResult.data.config_json === "object" ? settingsResult.data.config_json : {}) as Record<string, unknown>;
    const pageSections = (nextConfig.page_sections && typeof nextConfig.page_sections === "object" ? nextConfig.page_sections : {}) as Record<string, unknown>;
    const customPages = (nextConfig.custom_sections && typeof nextConfig.custom_sections === "object" ? nextConfig.custom_sections : {}) as Record<string, unknown>;
    const customForPage = Array.isArray(customPages[pageSlug]) ? customPages[pageSlug] as Array<Partial<SectionLayout>> : [];
    const saved = Array.isArray(pageSections[pageSlug]) ? pageSections[pageSlug] as Array<Partial<SectionLayout>> : [];
    const canonical = defaultSectionsForPage(pageSlug);
    const known = new Set([...canonical.map((item) => item.slug), ...customForPage.map((item) => String(item.slug || ""))]);
    const discovered = canonical.length
      ? []
      : availableSections
          .filter((slug) => !known.has(slug))
          .map((slug) => ({ slug, label: pretty(slug), visible: true } as SectionLayout));
    const base: SectionLayout[] = [
      ...canonical,
      ...customForPage.filter((item) => item.slug).map((item) => ({ slug: String(item.slug), label: String(item.label || pretty(String(item.slug))), visible: item.visible !== false, custom: true, template: item.template as CmsSectionTemplateKey | undefined })),
      ...discovered,
    ];
    const bySlug = new Map(base.map((item) => [item.slug, item]));
    const savedHasNewHomeLayout = pageSlug !== "home" || (saved.some((item) => item.slug === "about") && saved.some((item) => item.slug === "authentic_origin"));
    const normalized = savedHasNewHomeLayout
      ? saved.map((item) => { const fallback = item.slug ? bySlug.get(item.slug) : undefined; return fallback ? { ...fallback, label: String(item.label || fallback.label), visible: item.visible !== false, minHeight: typeof item.minHeight === "number" ? item.minHeight : undefined, paddingTop: typeof item.paddingTop === "number" ? item.paddingTop : undefined, paddingBottom: typeof item.paddingBottom === "number" ? item.paddingBottom : undefined } : null; }).filter(Boolean) as SectionLayout[]
      : canonical.map((item) => {
          const previous = saved.find((savedItem) => savedItem.slug === item.slug) || (item.slug === "about" ? saved.find((savedItem) => savedItem.slug === "story") : undefined);
          return previous ? { ...item, visible: previous.visible !== false, minHeight: typeof previous.minHeight === "number" ? previous.minHeight : undefined, paddingTop: typeof previous.paddingTop === "number" ? previous.paddingTop : undefined, paddingBottom: typeof previous.paddingBottom === "number" ? previous.paddingBottom : undefined } : item;
        });
    const seen = new Set(normalized.map((item) => item.slug));
    const merged = [...normalized, ...base.filter((item) => !seen.has(item.slug))];
    setSectionLayout(merged); setSiteSettingsId(settingsResult.data?.id ?? null); setSiteConfig(nextConfig);
    setSectionSlug((current) => merged.some((item) => item.slug === current) ? current : (merged[0]?.slug || availableSections[0] || ""));
    setHistory([]); setFuture([]); setLoading(false);
  }, [pageSlug]);
  useEffect(() => { void load(); }, [pageSlug]);
  useEffect(() => { void (async () => { const result = await supabase.from("products").select("id,title,slug,status,subtitle,description,image").order("title"); if (!result.error) setProductOptions((result.data || []).filter((item:any) => item.slug)); })(); }, []);
  const selectedProduct = useMemo(() => { if (!pageSlug.startsWith("product::")) return null; const [, id, slug] = pageSlug.split("::"); return productOptions.find(item => String(item.id) === id) || (id && slug ? { id: Number(id), title: slug.replaceAll("-", " "), slug } : null); }, [pageSlug, productOptions]);
  const previewPath = useMemo(() => selectedProduct ? `/products/${selectedProduct.slug}` : pageSlug === "home" ? "/" : pageSlug === "products" ? `/products?family=${encodeURIComponent(productFamilyPreview)}` : `/${pageSlug}`, [pageSlug, productFamilyPreview, selectedProduct]);
  const pageTitle = selectedProduct?.title || cmsPageLabels[pageSlug] || pretty(pageSlug);
  useEffect(() => { setPreviewLoading(true); }, [pageSlug, previewKey]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);

  const sections = useMemo(() => sectionLayout.map((item) => item.slug), [sectionLayout]);
  const inlineSelected = selectedInlineKey ? texts.find((item) => textEntryKey(item) === selectedInlineKey) : undefined;
  const inlineSelectedImage = selectedInlineImageKey ? images.find((item) => imageEntryKey(item) === selectedInlineImageKey) : undefined;
  const selectedTexts = inlineSelected ? [inlineSelected] : texts.filter(item => item.page_slug === pageSlug && visualSectionFor(item.page_slug, item.section_slug) === sectionSlug);
  const selectedImages = inlineSelectedImage ? [inlineSelectedImage] : images.filter(item => item.page_slug === pageSlug && item.section_slug === sectionSlug);
  const pageGlobalTexts = texts.filter(item => item.page_slug === "global");
  const sectionTexts = useMemo(() => texts.filter((item) => item.page_slug === pageSlug && visualSectionFor(item.page_slug, item.section_slug) === sectionSlug), [pageSlug, sectionSlug, texts]);
  const sectionImages = useMemo(() => images.filter((item) => item.page_slug === pageSlug && item.section_slug === sectionSlug), [images, pageSlug, sectionSlug]);
  const filteredSectionTexts = useMemo(() => {
    const term = inspectorQuery.trim().toLowerCase();
    if (!term) return sectionTexts;
    return sectionTexts.filter((item) => `${item.field_label} ${item.field_key} ${item.value}`.toLowerCase().includes(term));
  }, [inspectorQuery, sectionTexts]);
  const editableCount = useMemo(() => texts.filter((item) => item.page_slug === pageSlug || item.page_slug === "global").length + images.filter((item) => item.page_slug === pageSlug || item.page_slug === "global").length, [images, pageSlug, texts]);

  function applyPreviewTextStyle(element: HTMLElement, style?: CmsTextStyle | null) {
    if (!style) return;
    element.hidden = style.hidden === true;
    if (style.fontFamily && !["inherit", "auto"].includes(style.fontFamily)) element.style.fontFamily = style.fontFamily;
    else element.style.removeProperty("font-family");
    if (style.fontSize) element.style.fontSize = style.fontSize; else element.style.removeProperty("font-size");
    if (style.fontWeight) element.style.fontWeight = style.fontWeight; else element.style.removeProperty("font-weight");
    if (style.color) element.style.color = style.color; else element.style.removeProperty("color");
    if (style.backgroundColor) element.style.backgroundColor = style.backgroundColor; else element.style.removeProperty("background-color");
    if (style.textTransform) element.style.textTransform = style.textTransform;
    if (style.fontStyle) element.style.fontStyle = style.fontStyle;
    if (style.textDecoration) element.style.textDecoration = style.textDecoration;
    if (style.textAlign) element.style.textAlign = style.textAlign;
    if (style.letterSpacing) element.style.letterSpacing = style.letterSpacing; else element.style.removeProperty("letter-spacing");
    if (style.lineHeight) element.style.lineHeight = style.lineHeight; else element.style.removeProperty("line-height");
    if (style.translateX || style.translateY) {
      element.style.position = "relative";
      element.style.transform = `translate(${style.translateX || "0px"}, ${style.translateY || "0px"})`;
    } else {
      element.style.removeProperty("transform");
    }
    if (style.maxWidth) element.style.maxWidth = style.maxWidth; else element.style.removeProperty("max-width");
  }

  function applyDraftToPreview() {
    const frame = previewFrame.current;
    const documentNode = frame?.contentDocument;
    if (!documentNode?.body) return;

    const pageTexts = texts.filter((item) => item.page_slug === pageSlug || item.page_slug === "global");
    for (const entry of pageTexts) {
      const original = String(entry.default_value || "").trim();
      const replacement = String(entry.value || "");
      if (!replacement) continue;

      const fullKey = `${entry.page_slug}.${entry.section_slug}.${entry.field_key}`;
      const mapped = documentNode.querySelectorAll<HTMLElement>(`[data-cms-key="${CSS.escape(fullKey)}"],[data-cms-runtime-key="${CSS.escape(fullKey)}"]`);
      if (mapped.length) {
        mapped.forEach((element) => { replaceVisibleElementText(element, replacement); applyPreviewTextStyle(element, entry.style_json); });
        continue;
      }
      if (!original) continue;
      const visualSection = visualSectionFor(entry.page_slug, entry.section_slug);
      const sectionRoot = entry.page_slug === "global" ? documentNode.body : documentNode.querySelector<HTMLElement>(`[data-cms-section="${CSS.escape(visualSection)}"]`);
      if (!sectionRoot) continue;
      const walker = documentNode.createTreeWalker(sectionRoot, NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();
      while (current) {
        const node = current as Text;
        const value = node.nodeValue || "";
        if (value.trim() === original || normalizePreviewText(value) === normalizePreviewText(entry.value)) {
          if (original !== replacement && value.trim() === original) node.nodeValue = value.replace(original, replacement);
          if (node.parentElement) applyPreviewTextStyle(node.parentElement, entry.style_json);
        }
        current = walker.nextNode();
      }
    }

    const pageImages = images.filter((item) => (item.page_slug === pageSlug || item.page_slug === "global") && item.current_url);
    for (const slot of pageImages) {
      const fullKey = imageEntryKey(slot);
      const exact = Array.from(documentNode.querySelectorAll<HTMLImageElement>(`img[data-cms-image-key="${CSS.escape(fullKey)}"]`));
      if (exact.length) {
        exact.forEach((image) => { image.src = slot.current_url; image.alt = slot.alt_text || image.alt; });
        continue;
      }
      const original = normalizeCmsImageUrl(slot.default_url || "");
      for (const image of Array.from(documentNode.images)) {
        const source = normalizeCmsImageUrl(image.currentSrc || image.getAttribute("src") || "");
        if (original && source === original) {
          image.src = slot.current_url;
          image.alt = slot.alt_text || image.alt;
          image.dataset.cmsImageKey = fullKey;
        }
      }
    }
  }

  function enableInlineEditing() {
    const documentNode = previewFrame.current?.contentDocument;
    if (!documentNode?.body) return;
    const variantNamespace = cmsVariantNamespace(documentNode, pageSlug);
    let editorStyle = documentNode.getElementById("tso-visual-editor-affordances") as HTMLStyleElement | null;
    if (!editorStyle) {
      editorStyle = documentNode.createElement("style");
      editorStyle.id = "tso-visual-editor-affordances";
      documentNode.head.appendChild(editorStyle);
    }
    editorStyle.textContent = `
      [data-visual-editor-wrapper="1"]{transition:outline-color .16s ease,box-shadow .16s ease,background .16s ease;border-radius:3px}
      [data-visual-editor-wrapper="1"]:hover{outline:1px dashed rgba(200,79,108,.62);outline-offset:3px;background:rgba(200,79,108,.035)}
      img[data-cms-image-key]{transition:outline-color .16s ease,box-shadow .16s ease}
      img[data-cms-image-key]:hover{outline:2px solid rgba(200,79,108,.65);outline-offset:4px;box-shadow:0 0 0 7px rgba(200,79,108,.08)}
    `;

    const localTexts = [...texts];
    const localImages = [...images];
    const discoveredTexts: TextEntry[] = [];
    const discoveredImages: ImageSlot[] = [];
    const counters = new Map<string, number>();

    const activateText = (entry: TextEntry) => {
      const key = textEntryKey(entry);
      setSelectedInlineImageKey(null);
      setSelectedInlineKey(key);
      if (entry.page_slug === pageSlug) setSectionSlug(visualSectionFor(entry.page_slug, entry.section_slug));
    };

    const bindTextNode = (node: Text, entry: TextEntry) => {
      const parent = node.parentElement;
      if (!parent || parent.closest("[data-visual-editor-wrapper='1']")) return;
      const key = textEntryKey(entry);
      const raw = node.nodeValue || "";
      const visible = normalizeCmsText(raw);
      if (!visible) return;
      const leading = raw.match(/^\s*/)?.[0] || "";
      const trailing = raw.match(/\s*$/)?.[0] || "";
      const wrapper = documentNode.createElement("span");
      wrapper.dataset.visualEditorWrapper = "1";
      wrapper.dataset.cmsRuntimeKey = key;
      wrapper.contentEditable = "true";
      wrapper.spellcheck = true;
      wrapper.textContent = entry.value || visible;
      wrapper.style.cursor = "text";
      wrapper.style.outlineOffset = "4px";
      wrapper.style.borderRadius = "3px";
      wrapper.title = "Edit text — type here, then press Save Live";
      applyPreviewTextStyle(wrapper, entry.style_json);

      const container = node.parentNode;
      if (!container) return;
      if (leading) container.insertBefore(documentNode.createTextNode(leading), node);
      container.insertBefore(wrapper, node);
      if (trailing) container.insertBefore(documentNode.createTextNode(trailing), node);
      container.removeChild(node);

      wrapper.onclick = (event) => { event.preventDefault(); event.stopPropagation(); activateText(entry); };
      wrapper.onfocus = () => {
        wrapper.style.outline = "2px solid rgba(200,79,108,.88)";
        wrapper.style.boxShadow = "0 0 0 5px rgba(200,79,108,.10)";
        activateText(entry);
      };
      wrapper.onblur = () => { wrapper.style.outline = ""; wrapper.style.boxShadow = ""; };
      wrapper.oninput = () => {
        const nextValue = wrapper.textContent || "";
        setTexts((items) => items.map((item) => textEntryKey(item) === key ? { ...item, value: nextValue } : item));
        setDirtyTextKeys((current) => new Set(current).add(key));
      };
    };

    documentNode.querySelectorAll<HTMLElement>("[data-cms-key],[data-cms-runtime-key]").forEach((element) => {
      if (element.closest("[data-visual-editor-wrapper='1']")) return;
      const fullKey = element.dataset.cmsKey || element.dataset.cmsRuntimeKey || "";
      const node = collectCmsTextNodes(element).find((candidate) => !candidate.parentElement?.closest("svg"));
      if (!node) return;
      let entry = [...localTexts, ...discoveredTexts].find((item) => textEntryKey(item) === fullKey);

      if (!entry) {
        const visible = normalizeCmsText(node.nodeValue);
        if (!visible) return;
        const parsed = parseCmsFullKey(fullKey);
        const scope = cmsScopeForElement(element, pageSlug);
        const explicitPage = parsed?.pageSlug || scope?.pageSlug || pageSlug;
        const explicitSection = parsed?.sectionSlug || scope?.sectionSlug || "content";
        const explicitField = parsed?.fieldKey || cmsTextNodeFieldKey(scope?.root || documentNode.body, node, variantNamespace);
        if (!explicitField) return;
        if (explicitPage !== "global" && explicitPage !== pageSlug) return;
        const semantic = element.closest<HTMLElement>("h1,h2,h3,h4,h5,h6,p,a,button,label,summary,small,strong,b,em,span,li,td,th") || element;
        const tag = semantic.tagName.toLowerCase();
        const counterKey = `${explicitPage}:${explicitSection}`;
        const position = (counters.get(counterKey) || 0) + 1;
        counters.set(counterKey, position);
        entry = {
          page_slug: explicitPage,
          section_slug: explicitSection,
          field_key: explicitField,
          field_label: editorFieldLabel(explicitSection, tag, position),
          field_type: visible.length > 120 ? "textarea" : "text",
          default_value: visible,
          value: visible,
          display_order: 7000 + position,
          style_json: { ...defaultCmsTextStyle },
        };
        discoveredTexts.push(entry);
      }
      bindTextNode(node, entry);
    });

    for (const node of collectCmsTextNodes(documentNode.body)) {
      const parent = node.parentElement;
      if (!parent || parent.closest("[data-visual-editor-wrapper='1'],[data-cms-key],[data-cms-runtime-key]")) continue;
      const scope = cmsScopeForElement(parent, pageSlug);
      if (!scope) continue;
      if (scope.pageSlug !== "global" && scope.pageSlug !== pageSlug) continue;
      const visible = normalizeCmsText(node.nodeValue);
      if (!visible || visible.length > 5000) continue;
      const fieldKey = cmsTextNodeFieldKey(scope.root, node, variantNamespace);
      if (!fieldKey) continue;
      const counterKey = `${scope.pageSlug}:${scope.sectionSlug}`;
      const position = (counters.get(counterKey) || 0) + 1;
      counters.set(counterKey, position);
      const semantic = parent.closest<HTMLElement>("h1,h2,h3,h4,h5,h6,p,a,button,label,summary,small,strong,b,em,span,li,td,th") || parent;
      const tag = semantic.tagName.toLowerCase();
      const key = `${scope.pageSlug}.${scope.sectionSlug}.${fieldKey}`;
      const existing = [...localTexts, ...discoveredTexts].find((item) => textEntryKey(item) === key);
      const entry = existing || {
        page_slug: scope.pageSlug,
        section_slug: scope.sectionSlug,
        field_key: fieldKey,
        field_label: editorFieldLabel(scope.sectionSlug, tag, position),
        field_type: visible.length > 120 ? "textarea" : "text",
        default_value: visible,
        value: visible,
        display_order: 8000 + position,
        style_json: { ...defaultCmsTextStyle },
      } satisfies TextEntry;
      if (!existing) discoveredTexts.push(entry);
      bindTextNode(node, entry);
    }

    // Images are first-class Visual Editor fields. Every live image inside a
    // CMS section/header/footer can be clicked and replaced from the same panel.
    documentNode.querySelectorAll<HTMLImageElement>("img").forEach((image, index) => {
      if (image.closest("[data-cms-runtime-ignore]")) return;
      const scope = cmsScopeForElement(image, pageSlug);
      if (!scope || (scope.pageSlug !== "global" && scope.pageSlug !== pageSlug)) return;
      const explicit = image.dataset.cmsImageKey || "";
      const parsed = explicit ? parseCmsFullKey(explicit) : null;
      const slotKey = parsed?.fieldKey || cmsImageSlotKey(scope.root, image);
      const imagePage = parsed?.pageSlug || scope.pageSlug;
      const imageSection = parsed?.sectionSlug || scope.sectionSlug;
      const key = `${imagePage}.${imageSection}.${slotKey}`;
      let slot = [...localImages, ...discoveredImages].find((item) => imageEntryKey(item) === key);
      const currentUrl = normalizeCmsImageUrl(image.currentSrc || image.getAttribute("src") || "");
      if (!slot) {
        slot = {
          page_slug: imagePage,
          section_slug: imageSection,
          slot_key: slotKey,
          title: `${pretty(imageSection)} — Image ${index + 1}`,
          current_url: currentUrl,
          default_url: currentUrl,
          alt_text: image.alt || `${pretty(imageSection)} image`,
          display_order: 9000 + index,
          is_active: true,
        };
        discoveredImages.push(slot);
      }
      image.dataset.cmsImageKey = key;
      image.style.cursor = "pointer";
      image.style.outlineOffset = "5px";
      image.title = "Click to replace or edit this image";
      image.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setSelectedInlineKey(null);
        setSelectedInlineImageKey(key);
        if (imagePage === pageSlug) setSectionSlug(imageSection);
        image.style.outline = "2px solid rgba(200,79,108,.88)";
        window.setTimeout(() => { image.style.outline = ""; }, 1200);
      };
    });

    if (discoveredTexts.length) setTexts((items) => {
      const existingKeys = new Set(items.map(textEntryKey));
      return [...items, ...discoveredTexts.filter((entry) => !existingKeys.has(textEntryKey(entry)))];
    });
    if (discoveredImages.length) setImages((items) => {
      const existingKeys = new Set(items.map(imageEntryKey));
      return [...items, ...discoveredImages.filter((entry) => !existingKeys.has(imageEntryKey(entry)))];
    });
  }

  function scheduleEditorRescan(delay = 120) {
    if (editorRescanTimer.current) window.clearTimeout(editorRescanTimer.current);
    editorRescanTimer.current = window.setTimeout(() => {
      applyDraftToPreview();
      enableInlineEditing();
    }, delay);
  }

  useEffect(() => {
    const timers = [80, 350, 900, 1800].map((delay) => window.setTimeout(() => {
      applyDraftToPreview();
      enableInlineEditing();
    }, delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [texts, images, pageSlug, previewKey]);

  function handlePreviewLoaded() {
    setPreviewLoading(false);
    previewMutationObserver.current?.disconnect();
    [80, 300, 800, 1600, 3000].forEach((delay) => window.setTimeout(() => { applyDraftToPreview(); enableInlineEditing(); }, delay));
    const documentNode = previewFrame.current?.contentDocument;
    if (!documentNode?.body) return;
    const observer = new MutationObserver(() => scheduleEditorRescan(120));
    observer.observe(documentNode.body, { childList: true, subtree: true });
    previewMutationObserver.current = observer;
    window.setTimeout(() => { if (previewMutationObserver.current === observer) observer.disconnect(); }, 8000);
  }

  useEffect(() => () => {
    previewMutationObserver.current?.disconnect();
    if (editorRescanTimer.current) window.clearTimeout(editorRescanTimer.current);
  }, []);

  function snapshot() { return { texts: texts.map(item => ({ ...item })), images: images.map(item => ({ ...item })) }; }
  function commit(next: Snapshot) { setHistory(previous => [...previous.slice(-24), snapshot()]); setFuture([]); setTexts(next.texts); setImages(next.images); }
  function updateText(entry: TextEntry, value: string) {
    const key = textEntryKey(entry);
    setDirtyTextKeys((current) => new Set(current).add(key));
    commit({ texts: texts.map(item => textEntryKey(item) === key ? { ...item, value } : item), images });
  }
  function updateImage(idOrKey: string | undefined, patch: Partial<ImageSlot>) {
    if (!idOrKey) return;
    const target = images.find((item) => item.id === idOrKey || imageEntryKey(item) === idOrKey);
    if (target) setDirtyImageKeys((current) => new Set(current).add(imageEntryKey(target)));
    commit({ texts, images: images.map(item => item.id === idOrKey || imageEntryKey(item) === idOrKey ? { ...item, ...patch } : item) });
  }
  function updateTextStyle(entry: TextEntry, patch: Partial<CmsTextStyle>) {
    const key = textEntryKey(entry);
    setDirtyTextKeys((current) => new Set(current).add(key));
    commit({ texts: texts.map((item) => textEntryKey(item) === key ? { ...item, style_json: { ...defaultCmsTextStyle, ...(item.style_json || {}), ...patch } } : item), images });
    window.setTimeout(() => { applyDraftToPreview(); enableInlineEditing(); }, 20);
  }
  function undo() { const previous = history[history.length - 1]; if (!previous) return; setFuture(items => [snapshot(), ...items]); setHistory(items => items.slice(0, -1)); setTexts(previous.texts); setImages(previous.images); }
  function redo() { const next = future[0]; if (!next) return; setHistory(items => [...items, snapshot()]); setFuture(items => items.slice(1)); setTexts(next.texts); setImages(next.images); }

  async function persistSectionLayout(nextLayout: SectionLayout[], message: string) {
    setSaving(true); setError("");
    if (selectedProduct && productPageSettings) {
      const sectionOrder = nextLayout.map((item) => item.slug).filter((slug): slug is ProductPageSectionKey => slug in PRODUCT_PAGE_SECTION_LABELS);
      const sectionVisibility = { ...productPageSettings.sectionVisibility };
      nextLayout.forEach((item) => { if (item.slug in PRODUCT_PAGE_SECTION_LABELS) sectionVisibility[item.slug as ProductPageSectionKey] = item.visible !== false; });
      const nextSettings = { ...productPageSettings, sectionOrder, sectionVisibility };
      const result = await supabase.from("page_content").upsert({ page_slug:`product:${selectedProduct.id}`, content:nextSettings, updated_at:new Date().toISOString() }, { onConflict:"page_slug" });
      if (result.error) setError(result.error.message);
      else { setProductPageSettings(nextSettings); setSectionLayout(nextLayout); setPreviewKey((value) => value + 1); setToast(message); }
      setSaving(false); return;
    }
    const currentPageSections = (siteConfig.page_sections && typeof siteConfig.page_sections === "object" ? siteConfig.page_sections : {}) as Record<string, unknown>;
    const nextConfig = { ...siteConfig, page_sections: { ...currentPageSections, [pageSlug]: nextLayout } };
    const payload = { config_json: nextConfig, updated_at: new Date().toISOString() };
    const result = siteSettingsId
      ? await supabase.from("site_settings").update(payload).eq("id", siteSettingsId).select("id,config_json").single()
      : await supabase.from("site_settings").insert({ site_name: "The Salt Origin", ...payload }).select("id,config_json").single();
    if (result.error) setError(result.error.message);
    else {
      setSiteSettingsId(result.data.id); setSiteConfig((result.data.config_json || nextConfig) as Record<string, unknown>); setSectionLayout(nextLayout);
      window.dispatchEvent(new Event("salt-cms-updated")); setPreviewKey((value) => value + 1); setToast(message);
    }
    setSaving(false);
  }

  function moveSection(slug: string, direction: -1 | 1) {
    const index = sectionLayout.findIndex((item) => item.slug === slug);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sectionLayout.length) return;
    const next = [...sectionLayout];
    [next[index], next[target]] = [next[target], next[index]];
    void persistSectionLayout(next, `${pretty(slug)} moved ${direction < 0 ? "up" : "down"}.`);
  }

  function toggleSection(slug: string) {
    const next = sectionLayout.map((item) => item.slug === slug ? { ...item, visible: !item.visible } : item);
    const item = next.find((entry) => entry.slug === slug);
    void persistSectionLayout(next, `${pretty(slug)} is now ${item?.visible ? "visible" : "hidden"}.`);
  }

  function updateSectionSizing(
    slug: string,
    patch: Partial<Pick<SectionLayout, "minHeight" | "paddingTop" | "paddingBottom">>,
    message: string,
  ) {
    const next = sectionLayout.map((item) => item.slug === slug ? { ...item, ...patch } : item);
    void persistSectionLayout(next, message);
  }

  function enableOptionalSection() {
    setAddSectionLabel("New Section");
    setAddSectionTemplate("editorial");
    setAddSectionOpen(true);
  }

  async function addCustomSection() {
    const label = addSectionLabel.trim() || "New Section";
    const slug = `custom-${slugifySectionLabel(label)}-${Date.now().toString(36)}`;
    setSaving(true); setError("");
    const textSeeds = [
      ["eyebrow", "Eyebrow", "text", "CUSTOM SECTION"],
      ["title_main", "Heading Main", "text", `${label} `],
      ["title_accent", "Heading Accent / Italic", "text", "built for buyers."],
      ["body", "Body Text", "textarea", "Share clear buyer-focused information about this section."],
      ["primary_label", "Primary Button Label", "text", "Learn More"],
      ["primary_href", "Primary Button Link", "text", "/contact"],
    ].map((row, index) => ({
      page_slug: pageSlug,
      section_slug: slug,
      field_key: row[0],
      field_label: row[1],
      field_type: row[2],
      default_value: row[3],
      display_order: 9000 + index,
    }));
    const textResult = await supabase.from("cms_text_entries").upsert(textSeeds, { onConflict: "page_slug,section_slug,field_key" });
    if (textResult.error) { setError(textResult.error.message); setSaving(false); return; }
    if (addSectionTemplate === "image_text") {
      const imageResult = await supabase.from("cms_image_slots").upsert({
        page_slug: pageSlug, section_slug: slug, slot_key: "image", title: `${label} — Image`,
        current_url: "/hero-banner.png", default_url: "/hero-banner.png", alt_text: label,
        recommended_width: 1200, recommended_height: 900, display_order: 9000, is_active: true,
      }, { onConflict: "page_slug,section_slug,slot_key" });
      if (imageResult.error) { setError(imageResult.error.message); setSaving(false); return; }
    }
    const customPages = (siteConfig.custom_sections && typeof siteConfig.custom_sections === "object" ? siteConfig.custom_sections : {}) as Record<string, unknown>;
    const existingCustom = Array.isArray(customPages[pageSlug]) ? customPages[pageSlug] as Array<Record<string, unknown>> : [];
    const nextCustom = [...existingCustom, { slug, label, visible: true, custom: true, template: addSectionTemplate }];
    const nextLayout: SectionLayout[] = [...sectionLayout, { slug, label, visible: true, custom: true, template: addSectionTemplate }];
    const currentPageSections = (siteConfig.page_sections && typeof siteConfig.page_sections === "object" ? siteConfig.page_sections : {}) as Record<string, unknown>;
    const nextConfig = { ...siteConfig, custom_sections: { ...customPages, [pageSlug]: nextCustom }, page_sections: { ...currentPageSections, [pageSlug]: nextLayout } };
    const payload = { config_json: nextConfig, updated_at: new Date().toISOString() };
    const result = siteSettingsId
      ? await supabase.from("site_settings").update(payload).eq("id", siteSettingsId).select("id,config_json").single()
      : await supabase.from("site_settings").insert({ site_name: "The Salt Origin", ...payload }).select("id,config_json").single();
    if (result.error) setError(result.error.message);
    else {
      setSiteSettingsId(result.data.id); setSiteConfig((result.data.config_json || nextConfig) as Record<string, unknown>);
      setSectionLayout(nextLayout); setSectionSlug(slug); setAddSectionOpen(false); setPreviewKey((value) => value + 1);
      window.dispatchEvent(new Event("salt-cms-updated")); setToast(`${label} section added.`); await load(); setSectionSlug(slug);
    }
    setSaving(false);
  }

  async function deleteCustomSection(slug: string) {
    const current = sectionLayout.find((item) => item.slug === slug);
    if (!current?.custom) { toggleSection(slug); return; }
    if (!confirm(`Delete ${current.label}? This removes the custom section and its CMS fields.`)) return;
    setSaving(true); setError("");
    const [textDelete, imageDelete] = await Promise.all([
      supabase.from("cms_text_entries").delete().eq("page_slug", pageSlug).eq("section_slug", slug),
      supabase.from("cms_image_slots").delete().eq("page_slug", pageSlug).eq("section_slug", slug),
    ]);
    if (textDelete.error || imageDelete.error) { setError(textDelete.error?.message || imageDelete.error?.message || "Unable to delete section."); setSaving(false); return; }
    const customPages = (siteConfig.custom_sections && typeof siteConfig.custom_sections === "object" ? siteConfig.custom_sections : {}) as Record<string, unknown>;
    const existingCustom = Array.isArray(customPages[pageSlug]) ? customPages[pageSlug] as Array<Record<string, unknown>> : [];
    const nextCustom = existingCustom.filter((item) => String(item.slug || "") !== slug);
    const nextLayout = sectionLayout.filter((item) => item.slug !== slug);
    const currentPageSections = (siteConfig.page_sections && typeof siteConfig.page_sections === "object" ? siteConfig.page_sections : {}) as Record<string, unknown>;
    const nextConfig = { ...siteConfig, custom_sections: { ...customPages, [pageSlug]: nextCustom }, page_sections: { ...currentPageSections, [pageSlug]: nextLayout } };
    const payload = { config_json: nextConfig, updated_at: new Date().toISOString() };
    const result = siteSettingsId
      ? await supabase.from("site_settings").update(payload).eq("id", siteSettingsId).select("id,config_json").single()
      : await supabase.from("site_settings").insert({ site_name: "The Salt Origin", ...payload }).select("id,config_json").single();
    if (result.error) setError(result.error.message);
    else { setSiteConfig((result.data.config_json || nextConfig) as Record<string, unknown>); setSectionLayout(nextLayout); setSectionSlug(nextLayout[0]?.slug || ""); setPreviewKey((value) => value + 1); window.dispatchEvent(new Event("salt-cms-updated")); setToast("Custom section deleted."); }
    setSaving(false);
  }

  async function initializeFromWebsite() {
    // Never seed old/static registry content. The iframe itself is the source
    // of truth: reload it, discover the currently rendered text/images and let
    // Save Live persist only what exists on the current website.
    setSaving(true); setError("");
    setPreviewLoading(true);
    setPreviewKey((value) => value + 1);
    window.setTimeout(() => { setInitialized(true); setSaving(false); setToast("Current live page scanned. Click text or images in the preview, then Save Live."); }, 1800);
  }

  async function saveProductVisualChanges(publishNow: boolean) {
    if (!selectedProduct || !productPageSettings) return false;
    const value = (section: string, field: string) => texts.find((item) => item.section_slug === section && item.field_key === field)?.value || "";
    const nextSettings: ProductPageSettings = {
      ...productPageSettings,
      eyebrow:value("hero","eyebrow") || productPageSettings.eyebrow,
      requestQuoteLabel:value("hero","requestQuoteLabel") || productPageSettings.requestQuoteLabel,
      whatsappLabel:value("hero","whatsappLabel") || productPageSettings.whatsappLabel,
      marketplacesTitle:value("marketplaces","title") || productPageSettings.marketplacesTitle,
      marketplacesSubtitle:value("marketplaces","subtitle") || productPageSettings.marketplacesSubtitle,
      processTitle:value("process","title") || productPageSettings.processTitle,
      processSubtitle:value("process","subtitle") || productPageSettings.processSubtitle,
      specificationsTitle:value("specifications","title") || productPageSettings.specificationsTitle,
      sectionOrder:sectionLayout.map((item) => item.slug).filter((slug): slug is ProductPageSectionKey => slug in PRODUCT_PAGE_SECTION_LABELS),
      sectionVisibility:{ ...productPageSettings.sectionVisibility, ...Object.fromEntries(sectionLayout.filter((item) => item.slug in PRODUCT_PAGE_SECTION_LABELS).map((item) => [item.slug, item.visible !== false])) } as ProductPageSettings["sectionVisibility"],
    };
    const image = images.find((item) => item.slot_key === "main_image")?.current_url || "";
    const [productResult, pageResult] = await Promise.all([
      supabase.from("products").update({ title:value("hero","title") || selectedProduct.title, subtitle:value("hero","subtitle"), description:value("hero","description"), ...(image ? { image } : {}), updated_at:new Date().toISOString() }).eq("id", selectedProduct.id),
      supabase.from("page_content").upsert({ page_slug:`product:${selectedProduct.id}`, content:nextSettings, updated_at:new Date().toISOString() }, { onConflict:"page_slug" }),
    ]);
    if (productResult.error || pageResult.error) { setError(productResult.error?.message || pageResult.error?.message || "Product page could not be saved."); return false; }

    const cmsTexts = texts.filter((item) => item.page_slug === pageSlug || (item.page_slug === "global" && dirtyTextKeys.has(textEntryKey(item))));
    for (const entry of cmsTexts) {
      const payload = {
        page_slug: entry.page_slug, section_slug: entry.section_slug, field_key: entry.field_key,
        field_label: entry.field_label, field_type: entry.field_type, default_value: entry.default_value || entry.value,
        style_json: entry.style_json || {}, display_order: entry.display_order || 8000, updated_at: new Date().toISOString(),
      };
      const row = await supabase.from("cms_text_entries").upsert(payload, { onConflict:"page_slug,section_slug,field_key" }).select("id").single();
      if (row.error) { setError(row.error.message); return false; }
      const translation = await supabase.from("cms_text_translations").upsert({ entry_id:row.data.id, language_code:"en", value:entry.value, updated_at:new Date().toISOString() }, { onConflict:"entry_id,language_code" });
      if (translation.error) { setError(translation.error.message); return false; }
    }
    for (const slot of images.filter((item) => item.page_slug === pageSlug || (item.page_slug === "global" && dirtyImageKeys.has(imageEntryKey(item))))) {
      const imagePayload: any = { ...slot, updated_at:new Date().toISOString() };
      delete imagePayload.id;
      const result = await supabase.from("cms_image_slots").upsert(imagePayload, { onConflict:"page_slug,section_slug,slot_key" });
      if (result.error) { setError(result.error.message); return false; }
    }

    setProductPageSettings(nextSettings);
    await supabase.from("website_editor_drafts").upsert({ page_slug:pageSlug, payload:{ texts, images, sectionLayout }, status:publishNow ? "Published" : "Draft", ...(publishNow ? { published_at:new Date().toISOString() } : {}), updated_at:new Date().toISOString() }, { onConflict:"page_slug" });
    setPreviewKey((value) => value + 1); window.dispatchEvent(new Event("salt-cms-updated")); setDirtyTextKeys(new Set()); setDirtyImageKeys(new Set());
    return true;
  }

  async function saveDraft() {
    setSaving(true); setError("");
    if (selectedProduct) { const ok = await saveProductVisualChanges(false); if (ok) setToast("Product page changes saved as a draft."); setSaving(false); return; }
    const draftTexts = texts.filter((item) => item.page_slug === pageSlug || (item.page_slug === "global" && dirtyTextKeys.has(textEntryKey(item))));
    const result = await supabase.from("website_editor_drafts").upsert({ page_slug: pageSlug, payload: { texts: draftTexts, images: images.filter(item => item.page_slug === pageSlug || (item.page_slug === "global" && dirtyImageKeys.has(imageEntryKey(item)))) }, status: "Draft", updated_at: new Date().toISOString() }, { onConflict: "page_slug" });
    if (result.error) setError(result.error.message); else setToast("Website changes saved as a draft.");
    setSaving(false);
  }

  async function publish(confirmBefore = true) {
    if (confirmBefore && !confirm("Save these website text and image changes live now?")) return;
    setSaving(true); setError("");
    if (selectedProduct) { const ok = await saveProductVisualChanges(true); if (ok) setToast("Product page changes saved live."); setSaving(false); return; }
    const session = await supabase.auth.getSession();
    const publishTexts = texts.filter((item) => item.page_slug === pageSlug || (item.page_slug === "global" && dirtyTextKeys.has(textEntryKey(item))));
    for (const entry of publishTexts) {
      // Keep default_value as the original/source locator. Only the English
      // translation changes; otherwise unkeyed live fields could no longer be
      // found after their wording was edited.
      const entryPayload = {
        page_slug: entry.page_slug, section_slug: entry.section_slug, field_key: entry.field_key,
        field_label: entry.field_label, field_type: entry.field_type, default_value: entry.default_value,
        style_json: entry.style_json || {}, display_order: entry.display_order || 8000, updated_at: new Date().toISOString(),
      };
      const entryResult = await supabase.from("cms_text_entries").upsert(entryPayload, { onConflict: "page_slug,section_slug,field_key" }).select("id").single();
      if (entryResult.error) { setError(entryResult.error.message); setSaving(false); return; }
      const translationResult = await supabase.from("cms_text_translations").upsert({ entry_id: entryResult.data.id, language_code: "en", value: entry.value, updated_at: new Date().toISOString() }, { onConflict: "entry_id,language_code" });
      if (translationResult.error) { setError(translationResult.error.message); setSaving(false); return; }
    }
    for (const slot of images.filter(item => item.page_slug === pageSlug || (item.page_slug === "global" && dirtyImageKeys.has(imageEntryKey(item))))) {
      const imagePayload = { ...slot, id: undefined, updated_at: new Date().toISOString() } as any;
      delete imagePayload.id;
      const imageResult = await supabase.from("cms_image_slots").upsert(imagePayload, { onConflict: "page_slug,section_slug,slot_key" });
      if (imageResult.error) { setError(imageResult.error.message); setSaving(false); return; }

      if (slot.page_slug === "products" && slot.section_slug === "hero" && slot.current_url) {
        const categorySlug = productFamilySlugByHeroImageSlot[slot.slot_key];
        if (categorySlug) {
          const categoryResult = await supabase.from("categories").update({ image: slot.current_url }).eq("slug", categorySlug);
          if (categoryResult.error) { setError(categoryResult.error.message); setSaving(false); return; }
        }
      }
    }
    await supabase.from("website_editor_drafts").upsert({ page_slug: pageSlug, payload: { texts: publishTexts, images: images.filter(item => item.page_slug === pageSlug || (item.page_slug === "global" && dirtyImageKeys.has(imageEntryKey(item)))) }, status: "Published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "page_slug" });
    await supabase.from("b2b_activities").insert({ activity_type: "published", module: "Website", record_id: pageSlug, title: `${pageTitle} updated`, description: "Website Visual Editor changes published", actor_id: session.data.session?.user.id || null, actor_email: session.data.session?.user.email || null });
    window.dispatchEvent(new Event("salt-cms-updated")); setPreviewKey(value => value + 1); setToast("Website changes saved live."); setSaving(false); setHistory([]); setFuture([]); setDirtyTextKeys(new Set()); setDirtyImageKeys(new Set());
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !imageTarget) return;
    setSaving(true); setError("");
    try {
      const result = await adminUpload(file, "website-image", { folder: `${pageSlug}/${sectionSlug}`, filename: file.name });
      updateImage(imageTarget, { current_url: result.value });
      setSelectedInlineImageKey(imageTarget);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    }
    setSaving(false); event.target.value = "";
  }

  function duplicateSection() {
    const textCopies = selectedTexts.map(item => ({ ...item, id: undefined, section_slug: `${sectionSlug}-copy-${Date.now()}`, field_label: `${item.field_label} Copy` }));
    const imageCopies = selectedImages.map(item => ({ ...item, id: undefined, section_slug: `${sectionSlug}-copy-${Date.now()}`, title: `${item.title} Copy` }));
    setError("Duplicated sections must be saved through the dedicated section builder before publishing. The current live website uses fixed code sections.");
    void textCopies; void imageCopies;
  }

  return (
    <AdminShell>
      <div className="os-page visual-editor-v10">
        <header className="visual-editor-v10__header">
          <div>
            <div className="os-page-eyebrow">Website Management · Live Visual CMS</div>
            <h1 className="os-page-title">Website Visual Editor</h1>
            <p className="os-page-subtitle">Shopify-style editing for the current website. Click text, buttons, cards or images in the preview, adjust them in the inspector, then save live.</p>
          </div>
          <div className="visual-editor-v10__actions">
            <button className="os-btn soft" type="button" onClick={undo} disabled={!history.length}><Undo2/>Undo</button>
            <button className="os-btn soft" type="button" onClick={redo} disabled={!future.length}><Redo2/>Redo</button>
            <a className="os-btn soft" href={previewPath} target="_blank" rel="noreferrer"><Eye/>Open Website</a>
            <button className="os-btn soft" type="button" onClick={() => { setPreviewLoading(true); setPreviewKey((value) => value + 1); }}><RefreshCw/>Refresh Preview</button>
            <button className="os-btn primary" type="button" onClick={() => void publish(false)} disabled={saving}><Save/>{saving ? "Saving…" : "Save Live"}</button>
          </div>
        </header>

        {error ? <section className="visual-editor-v10__alert"><strong>Editor action failed</strong><span>{error}</span></section> : null}

        <div className="visual-editor-v10__statusbar">
          <span><i/> Live CMS connected</span>
          <span><MousePointer2/> Click any visible text or image</span>
          <span><Layers3/> {sectionLayout.length} sections</span>
          <span><Type/> {editableCount} editable items mapped</span>
          {dirtyTextKeys.size + dirtyImageKeys.size > 0 ? <strong>{dirtyTextKeys.size + dirtyImageKeys.size} unsaved change{dirtyTextKeys.size + dirtyImageKeys.size === 1 ? "" : "s"}</strong> : <strong className="is-clean">All changes saved</strong>}
        </div>

        <div className="visual-editor-v10__workspace">
          <aside className="visual-editor-v10__navigator">
            <div className="visual-editor-v10__panel-head">
              <div><span>Page Structure</span><strong>{pageTitle}</strong></div>
              <Layers3/>
            </div>
            <div className="visual-editor-v10__panel-body">
              <label className="visual-editor-v10__label">
                <span>Website Page</span>
                <select value={pageSlug} onChange={(event) => { setPageSlug(event.target.value); setSectionSlug(""); setSelectedInlineKey(null); setSelectedInlineImageKey(null); setInspectorQuery(""); }}>
                  <optgroup label="Website Pages">{pageOptions.map(([slug, label]) => <option value={slug} key={slug}>{label}</option>)}</optgroup>
                  {productOptions.length ? <optgroup label="Product Detail Pages">{productOptions.map((product) => <option key={product.id} value={`product::${product.id}::${product.slug}`}>{product.title}</option>)}</optgroup> : null}
                </select>
              </label>

              {pageSlug === "products" ? <label className="visual-editor-v10__label">
                <span>Product Category Preview</span>
                <select value={productFamilyPreview} onChange={(event) => { setProductFamilyPreview(event.target.value); setSelectedInlineKey(null); setSelectedInlineImageKey(null); setPreviewLoading(true); setPreviewKey((value) => value + 1); }}>
                  <option value="edible-salt">Edible Salt</option>
                  <option value="salt-lamps">Salt Lamps</option>
                  <option value="salt-tiles-bricks">Salt Tiles / Bricks</option>
                  <option value="cooking-plates-slabs">Cooking Plates / Slabs</option>
                  <option value="animal-lick-salt">Animal Lick Salt</option>
                  <option value="bulk-raw-salt">Bulk & Raw Salt</option>
                </select>
              </label> : null}

              <div className="visual-editor-v10__section-heading"><span>Sections</span><small>Drag-free safe order controls</small></div>
              <div className="visual-editor-v10__sections">
                {sectionLayout.map((section, index) => {
                  const textCount = texts.filter((item) => item.page_slug === pageSlug && visualSectionFor(item.page_slug, item.section_slug) === section.slug).length;
                  const imageCount = images.filter((item) => item.page_slug === pageSlug && item.section_slug === section.slug).length;
                  return <div key={section.slug} className={`visual-editor-v10__section ${sectionSlug === section.slug ? "active" : ""} ${section.visible === false ? "hidden-section" : ""}`}>
                    <button type="button" className="visual-editor-v10__section-main" onClick={() => { setSectionSlug(section.slug); setSelectedInlineKey(null); setSelectedInlineImageKey(null); setInspectorTab("content"); }}>
                      <span className="visual-editor-v10__section-dot"/>
                      <span><strong>{section.label || pretty(section.slug)}</strong><small>{textCount} text · {imageCount} image</small></span>
                    </button>
                    <div className="visual-editor-v10__section-tools">
                      <button type="button" title={section.visible === false ? "Show section" : "Hide section"} onClick={() => toggleSection(section.slug)}>{section.visible === false ? <EyeOff/> : <Eye/>}</button>
                      <button type="button" title="Move section up" onClick={() => moveSection(section.slug, -1)} disabled={index === 0 || saving}><ArrowUp/></button>
                      <button type="button" title="Move section down" onClick={() => moveSection(section.slug, 1)} disabled={index === sectionLayout.length - 1 || saving}><ArrowDown/></button>
                    </div>
                  </div>;
                })}
              </div>

              <button className="os-btn soft visual-editor-v10__add" type="button" onClick={enableOptionalSection} disabled={saving || Boolean(selectedProduct)}><Plus/>Add Section</button>
              {selectedProduct ? <a className="visual-editor-v10__product-link" href={`/admin/products/${selectedProduct.id}`}>Open full product editor →</a> : null}
            </div>
          </aside>

          <main className="visual-editor-v10__canvas">
            <div className="visual-editor-v10__canvas-toolbar">
              <div>
                <span>Live Page Preview</span>
                <strong>{pageTitle}</strong>
                <small>{previewPath}</small>
              </div>
              <div className="visual-editor-v10__devices" aria-label="Preview device">
                <button type="button" className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")} title="Desktop"><Laptop/></button>
                <button type="button" className={device === "tablet" ? "active" : ""} onClick={() => setDevice("tablet")} title="Tablet"><Tablet/></button>
                <button type="button" className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")} title="Mobile"><Smartphone/></button>
              </div>
            </div>
            <div className="visual-editor-v10__preview-wrap">
              <div className={`visual-editor-v10__frame ${device}`}>
                <iframe key={`${pageSlug}-${productFamilyPreview}-${previewKey}`} ref={previewFrame} onLoad={handlePreviewLoaded} title={`${pageTitle} website preview`} src={`${previewPath}${previewPath.includes("?") ? "&" : "?"}cms_editor_preview=1&v=${previewKey}`}/>
                {previewLoading ? <div className="visual-editor-v10__loading"><RefreshCw className="animate-spin"/><strong>Loading current website…</strong><span>Waiting for dynamic CMS content and images.</span></div> : null}
              </div>
            </div>
            <div className="visual-editor-v10__hint"><MousePointer2/><div><strong>Edit directly on the page</strong><span>Hover a text or image, click it, make the change, then use Save Live. Cards, buttons, labels, headings, paragraphs, Navbar and Footer text are discovered from the rendered page.</span></div></div>
          </main>

          <aside className="visual-editor-v10__inspector">
            <div className="visual-editor-v10__panel-head">
              <div><span>Inspector</span><strong>{inlineSelected ? inlineSelected.field_label : inlineSelectedImage ? inlineSelectedImage.title : sectionSlug ? sectionLayout.find((item) => item.slug === sectionSlug)?.label || pretty(sectionSlug) : "Select an element"}</strong></div>
              {inlineSelectedImage ? <ImageIcon/> : inlineSelected ? <Type/> : <Palette/>}
            </div>
            <div className="visual-editor-v10__tabs">
              <button type="button" className={inspectorTab === "content" ? "active" : ""} onClick={() => setInspectorTab("content")}>Content</button>
              <button type="button" className={inspectorTab === "design" ? "active" : ""} onClick={() => setInspectorTab("design")}>Design</button>
              <button type="button" className={inspectorTab === "section" ? "active" : ""} onClick={() => setInspectorTab("section")}>Section</button>
            </div>
            <div className="visual-editor-v10__inspector-body">
              {inspectorTab === "content" ? <>
                {inlineSelected ? <div className="visual-editor-v10__selected-card">
                  <div className="visual-editor-v10__selected-meta"><span>Selected text</span><code>{textEntryKey(inlineSelected)}</code></div>
                  <label className="visual-editor-v10__label"><span>Text</span>{inlineSelected.field_type === "textarea" || inlineSelected.value.length > 90 ? <textarea value={inlineSelected.value} onChange={(event) => updateText(inlineSelected, event.target.value)}/> : <input value={inlineSelected.value} onChange={(event) => updateText(inlineSelected, event.target.value)}/>}<small>{inlineSelected.value.length} characters</small></label>
                  <div className="visual-editor-v10__quick-row"><button type="button" className={inlineSelected.style_json?.hidden ? "active" : ""} onClick={() => updateTextStyle(inlineSelected, { hidden: !inlineSelected.style_json?.hidden })}>{inlineSelected.style_json?.hidden ? <EyeOff/> : <Eye/>}{inlineSelected.style_json?.hidden ? "Show" : "Hide"}</button><button type="button" onClick={() => updateTextStyle(inlineSelected, { ...defaultCmsTextStyle })}><RotateCcw/>Reset style</button></div>
                </div> : inlineSelectedImage ? <div className="visual-editor-v10__selected-card">
                  <div className="visual-editor-v10__selected-meta"><span>Selected image</span><code>{imageEntryKey(inlineSelectedImage)}</code></div>
                  {inlineSelectedImage.current_url ? <img className="visual-editor-v10__image-preview" src={inlineSelectedImage.current_url} alt={inlineSelectedImage.alt_text}/> : null}
                  <label className="visual-editor-v10__label"><span>Image URL</span><input value={inlineSelectedImage.current_url || ""} onChange={(event) => updateImage(inlineSelectedImage.id || imageEntryKey(inlineSelectedImage), { current_url: event.target.value })}/></label>
                  <label className="visual-editor-v10__label"><span>Alt Text / SEO</span><input value={inlineSelectedImage.alt_text || ""} onChange={(event) => updateImage(inlineSelectedImage.id || imageEntryKey(inlineSelectedImage), { alt_text: event.target.value })}/></label>
                  <button className="os-btn primary visual-editor-v10__replace" type="button" onClick={() => { const key = inlineSelectedImage.id || imageEntryKey(inlineSelectedImage); setImageTarget(key); setSelectedInlineImageKey(imageEntryKey(inlineSelectedImage)); imageInput.current?.click(); }}><UploadCloud/>Upload / Replace Image</button>
                </div> : <div className="visual-editor-v10__section-content">
                  <div className="visual-editor-v10__search"><Search/><input value={inspectorQuery} onChange={(event) => setInspectorQuery(event.target.value)} placeholder="Find text in this section…"/></div>
                  {filteredSectionTexts.length ? <div className="visual-editor-v10__field-list">{filteredSectionTexts.map((entry) => <button key={textEntryKey(entry)} type="button" onClick={() => { setSelectedInlineImageKey(null); setSelectedInlineKey(textEntryKey(entry)); setInspectorTab("content"); }}><span><strong>{entry.field_label}</strong><small>{entry.value || "Empty text"}</small></span><Type/></button>)}</div> : <div className="visual-editor-v10__empty"><MousePointer2/><strong>Click text in the preview</strong><span>Every visible text node is discovered automatically, including card copy and buttons.</span></div>}
                  {sectionImages.length ? <><div className="visual-editor-v10__subhead">Images in this section</div><div className="visual-editor-v10__image-list">{sectionImages.map((slot) => <button key={imageEntryKey(slot)} type="button" onClick={() => { setSelectedInlineKey(null); setSelectedInlineImageKey(imageEntryKey(slot)); }}><img src={slot.current_url || slot.default_url} alt={slot.alt_text}/><span>{slot.title}</span></button>)}</div></> : null}
                </div>}
              </> : null}

              {inspectorTab === "design" ? inlineSelected ? <div className="visual-editor-v10__design-grid">
                <label><span>Font</span><select value={inlineSelected.style_json?.fontFamily || "inherit"} onChange={(event) => updateTextStyle(inlineSelected, { fontFamily: event.target.value })}><option value="inherit">Theme default</option><option value="var(--site-font-heading)">Heading font</option><option value="var(--site-font-body)">Body font</option><option value="Georgia, serif">Georgia</option><option value="Inter, sans-serif">Inter</option></select></label>
                <label><span>Size</span><input type="number" min={8} max={180} value={parseInt(inlineSelected.style_json?.fontSize || "", 10) || ""} placeholder="Theme" onChange={(event) => updateTextStyle(inlineSelected, { fontSize: event.target.value ? `${Math.max(8, Math.min(180, Number(event.target.value)))}px` : "" })}/></label>
                <label><span>Weight</span><select value={inlineSelected.style_json?.fontWeight || ""} onChange={(event) => updateTextStyle(inlineSelected, { fontWeight: event.target.value })}><option value="">Theme</option><option value="400">400 Regular</option><option value="500">500 Medium</option><option value="600">600 Semi</option><option value="700">700 Bold</option></select></label>
                <label><span>Color</span><input type="color" value={inlineSelected.style_json?.color || "#17181c"} onChange={(event) => updateTextStyle(inlineSelected, { color: event.target.value })}/></label>
                <label><span>Alignment</span><select value={inlineSelected.style_json?.textAlign || ""} onChange={(event) => updateTextStyle(inlineSelected, { textAlign: (event.target.value || undefined) as CmsTextStyle["textAlign"] })}><option value="">Theme</option><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
                <label><span>Line Height</span><input type="number" min="0.7" max="3" step="0.05" value={parseFloat(inlineSelected.style_json?.lineHeight || "") || ""} onChange={(event) => updateTextStyle(inlineSelected, { lineHeight: event.target.value })}/></label>
                <label><span>Letter Spacing</span><input type="number" step="0.1" value={parseFloat(inlineSelected.style_json?.letterSpacing || "") || ""} onChange={(event) => updateTextStyle(inlineSelected, { letterSpacing: event.target.value ? `${event.target.value}px` : "" })}/></label>
                <div className="visual-editor-v10__toggle-row"><button type="button" className={inlineSelected.style_json?.fontStyle === "italic" ? "active" : ""} onClick={() => updateTextStyle(inlineSelected, { fontStyle: inlineSelected.style_json?.fontStyle === "italic" ? "normal" : "italic" })}>Italic</button><button type="button" className={inlineSelected.style_json?.textTransform === "uppercase" ? "active" : ""} onClick={() => updateTextStyle(inlineSelected, { textTransform: inlineSelected.style_json?.textTransform === "uppercase" ? "none" : "uppercase" })}>Uppercase</button></div>
                <div className="visual-editor-v10__position"><div><Move/><strong>Safe Position</strong></div><label><span>Move X</span><input type="number" min={-240} max={240} value={parseInt(inlineSelected.style_json?.translateX || "0", 10)} onChange={(event) => updateTextStyle(inlineSelected, { translateX: `${Math.max(-240, Math.min(240, Number(event.target.value) || 0))}px` })}/></label><label><span>Move Y</span><input type="number" min={-240} max={240} value={parseInt(inlineSelected.style_json?.translateY || "0", 10)} onChange={(event) => updateTextStyle(inlineSelected, { translateY: `${Math.max(-240, Math.min(240, Number(event.target.value) || 0))}px` })}/></label></div>
              </div> : <div className="visual-editor-v10__empty"><Palette/><strong>Select text to style it</strong><span>Click any heading, paragraph, button or card text in the page preview.</span></div> : null}

              {inspectorTab === "section" ? (() => {
                const current = sectionLayout.find((item) => item.slug === sectionSlug);
                if (!current) return <div className="visual-editor-v10__empty"><Layers3/><strong>Select a section</strong><span>Choose a section from the left navigator.</span></div>;
                return <div className="visual-editor-v10__section-settings">
                  <div className="visual-editor-v10__section-state"><span>Visibility</span><button type="button" className={current.visible === false ? "is-hidden" : "is-visible"} onClick={() => toggleSection(current.slug)}>{current.visible === false ? <><EyeOff/>Hidden</> : <><Eye/>Visible</>}</button></div>
                  <label className="visual-editor-v10__label"><span>Minimum Height</span><select value={current.minHeight || 0} onChange={(event) => updateSectionSizing(current.slug, { minHeight: Number(event.target.value) || undefined }, `${pretty(current.slug)} height updated.`)}><option value={0}>Theme default</option><option value={320}>Compact · 320px</option><option value={480}>Standard · 480px</option><option value={620}>Tall · 620px</option><option value={760}>Feature · 760px</option><option value={900}>Full Feature · 900px</option></select></label>
                  <label className="visual-editor-v10__label"><span>Top Spacing</span><input type="number" min={0} max={240} value={current.paddingTop ?? ""} placeholder="Theme" onBlur={(event) => updateSectionSizing(current.slug, { paddingTop: event.currentTarget.value === "" ? undefined : Math.max(0, Math.min(240, Number(event.currentTarget.value))) }, `${pretty(current.slug)} top spacing updated.`)} onChange={(event) => setSectionLayout((items) => items.map((item) => item.slug === current.slug ? { ...item, paddingTop: event.target.value === "" ? undefined : Number(event.target.value) } : item))}/></label>
                  <label className="visual-editor-v10__label"><span>Bottom Spacing</span><input type="number" min={0} max={240} value={current.paddingBottom ?? ""} placeholder="Theme" onBlur={(event) => updateSectionSizing(current.slug, { paddingBottom: event.currentTarget.value === "" ? undefined : Math.max(0, Math.min(240, Number(event.currentTarget.value))) }, `${pretty(current.slug)} bottom spacing updated.`)} onChange={(event) => setSectionLayout((items) => items.map((item) => item.slug === current.slug ? { ...item, paddingBottom: event.target.value === "" ? undefined : Number(event.target.value) } : item))}/></label>
                  <div className="visual-editor-v10__order-row"><button type="button" onClick={() => moveSection(current.slug, -1)}><ArrowUp/>Move Up</button><button type="button" onClick={() => moveSection(current.slug, 1)}><ArrowDown/>Move Down</button></div>
                  <button className="os-btn danger visual-editor-v10__hide-section" type="button" onClick={() => current.custom ? void deleteCustomSection(current.slug) : toggleSection(current.slug)} disabled={saving}><Trash2/>{current.custom ? "Delete Custom Section" : current.visible === false ? "Restore Section" : "Hide Section"}</button>
                </div>;
              })() : null}
            </div>
            <div className="visual-editor-v10__inspector-save"><button className="os-btn primary" type="button" onClick={() => void publish(false)} disabled={saving}><Save/>{saving ? "Saving…" : "Save Live Changes"}</button><small>Saves current page text, image and design changes to the live CMS.</small></div>
          </aside>
        </div>

        {addSectionOpen ? <div className="os-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAddSectionOpen(false); }}><section className="os-modal visual-add-section-modal" onMouseDown={(event) => event.stopPropagation()}><div className="os-modal-header"><div><div className="os-page-eyebrow">Section Builder</div><h2>Add Website Section</h2><p>Choose a reusable section type. It will appear in the page structure and CMS managers.</p></div><button className="os-icon-button" onClick={() => setAddSectionOpen(false)}><X/></button></div><div className="os-modal-body"><label className="os-label"><span>Section Name</span><input value={addSectionLabel} onChange={(event) => setAddSectionLabel(event.target.value)} placeholder="e.g. Export Program"/></label><div className="visual-section-template-grid">{cmsSectionTemplates.map((template) => <button key={template.key} type="button" className={`visual-section-template ${addSectionTemplate === template.key ? "active" : ""}`} onClick={() => setAddSectionTemplate(template.key)}><strong>{template.label}</strong><span>{template.description}</span></button>)}</div></div><div className="os-modal-footer"><button className="os-btn soft" onClick={() => setAddSectionOpen(false)}>Cancel</button><button className="os-btn primary" onClick={() => void addCustomSection()} disabled={saving || !addSectionLabel.trim()}><Plus/>{saving ? "Adding…" : "Add Section"}</button></div></section></div> : null}

        <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={uploadImage}/>
        {toast ? <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>Website Visual Editor updated successfully.</span></div></div></div> : null}
      </div>
    </AdminShell>
  );
}
