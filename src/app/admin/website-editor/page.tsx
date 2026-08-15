"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { cmsImageRegistry, cmsPageLabels, cmsTextRegistry } from "@/lib/cms-registry";
import { cmsSectionTemplates, defaultSectionsForPage, isCanonicalCmsSection, slugifySectionLabel, type CmsSectionLayout, type CmsSectionTemplateKey } from "@/lib/cms-section-registry";
import { supabase } from "@/lib/supabase-client";
import { normalizeProductPageSettings, PRODUCT_PAGE_SECTION_LABELS, type ProductPageSettings, type ProductPageSectionKey } from "@/lib/product-page-layout";
import { ArrowDown, ArrowUp, CheckCircle2, ChevronDown, Copy, Eye, EyeOff, Image as ImageIcon, Laptop, Plus, Redo2, RefreshCw, Save, Smartphone, Tablet, Trash2, Undo2, UploadCloud, X } from "lucide-react";

type TextEntry = { id?: string; page_slug: string; section_slug: string; field_key: string; field_label: string; field_type: string; default_value: string; value: string; display_order?: number };
type ImageSlot = { id?: string; page_slug: string; section_slug: string; slot_key: string; title: string; current_url: string; default_url: string; alt_text: string; recommended_width?: number; recommended_height?: number; display_order?: number; is_active?: boolean };
type Snapshot = { texts: TextEntry[]; images: ImageSlot[] };
type ProductOption = { id: number; title: string; slug: string; status?: string; subtitle?: string | null; description?: string | null; image?: string | null };
type SectionLayout = CmsSectionLayout;
const pageOptions = Object.entries(cmsPageLabels).filter(([slug]) => slug !== "global");
function pretty(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()); }

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
  const [sectionLayout, setSectionLayout] = useState<SectionLayout[]>(defaultSectionsForPage("home"));
  const [siteSettingsId, setSiteSettingsId] = useState<number | null>(null);
  const [siteConfig, setSiteConfig] = useState<Record<string, unknown>>({});
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addSectionTemplate, setAddSectionTemplate] = useState<CmsSectionTemplateKey>("editorial");
  const [addSectionLabel, setAddSectionLabel] = useState("New Section");
  const [productPageSettings, setProductPageSettings] = useState<ProductPageSettings | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    if (pageSlug.startsWith("product::")) {
      const [, idText, slug] = pageSlug.split("::");
      const productId = Number(idText);
      const [productResult, pageResult] = await Promise.all([
        supabase.from("products").select("id,title,slug,status,subtitle,description,short_description,image").eq("id", productId).maybeSingle(),
        supabase.from("page_content").select("content").eq("page_slug", `product:${productId}`).maybeSingle(),
      ]);
      if (productResult.error || !productResult.data) { setError(productResult.error?.message || "Product page not found."); setLoading(false); return; }
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
      const productImages: ImageSlot[] = [{ id:"product-image-main", page_slug:pageSlug, section_slug:"hero", slot_key:"main_image", title:"Main Product Image", current_url:String(row.image || "/product-2.png"), default_url:String(row.image || "/product-2.png"), alt_text:String(row.title || "Product image"), recommended_width:1200, recommended_height:1200, display_order:1, is_active:true }];
      const layout: SectionLayout[] = settings.sectionOrder.map((key) => ({ slug:key, label:PRODUCT_PAGE_SECTION_LABELS[key], visible:settings.sectionVisibility[key] !== false }));
      setTexts(productTexts); setImages(productImages); setSectionLayout(layout); setInitialized(true); setSectionSlug((current) => layout.some((item) => item.slug === current) ? current : (layout[0]?.slug || "hero")); setHistory([]); setFuture([]); setLoading(false); return;
    }
    setProductPageSettings(null);
    const pageTextSeeds = cmsTextRegistry.filter((item) => (item.page_slug === pageSlug || item.page_slug === "global") && isCanonicalCmsSection(item.page_slug, item.section_slug));
    const pageImageSeeds = cmsImageRegistry.filter((item) => (item.page_slug === pageSlug || item.page_slug === "global") && isCanonicalCmsSection(item.page_slug, item.section_slug));
    await Promise.all([
      pageTextSeeds.length ? supabase.from("cms_text_entries").upsert(pageTextSeeds, { onConflict: "page_slug,section_slug,field_key" }) : Promise.resolve({ error: null }),
      pageImageSeeds.length ? supabase.from("cms_image_slots").upsert(pageImageSeeds, { onConflict: "page_slug,section_slug,slot_key", ignoreDuplicates: true }) : Promise.resolve({ error: null }),
    ]);
    const [textResult, imageResult, settingsResult] = await Promise.all([
      supabase.from("cms_text_entries").select("id,page_slug,section_slug,field_key,field_label,field_type,default_value,display_order,cms_text_translations(language_code,value)").in("page_slug", [pageSlug, "global"]).order("display_order"),
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
        return String(row.section_slug || "").startsWith("custom-") || String(row.field_key || "").startsWith("live_");
      })
      .map((row: any) => ({ ...row, value: String((row.cms_text_translations || []).find((translation: any) => translation.language_code === "en")?.value || row.default_value || "") })) as TextEntry[];
    const liveImages = (imageResult.data || []) as ImageSlot[];
    setTexts(liveTexts); setImages(liveImages); setInitialized(Boolean(liveTexts.length || liveImages.length));
    const availableSections = Array.from(new Set([...liveTexts.filter(item => item.page_slug === pageSlug).map(item => item.section_slug), ...liveImages.filter(item => item.page_slug === pageSlug).map(item => item.section_slug)]));
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
    const normalized = saved.map((item) => { const fallback = item.slug ? bySlug.get(item.slug) : undefined; return fallback ? { ...fallback, label: String(item.label || fallback.label), visible: item.visible !== false, minHeight: typeof item.minHeight === "number" ? item.minHeight : undefined, paddingTop: typeof item.paddingTop === "number" ? item.paddingTop : undefined, paddingBottom: typeof item.paddingBottom === "number" ? item.paddingBottom : undefined } : null; }).filter(Boolean) as SectionLayout[];
    const seen = new Set(normalized.map((item) => item.slug));
    const merged = [...normalized, ...base.filter((item) => !seen.has(item.slug))];
    setSectionLayout(merged); setSiteSettingsId(settingsResult.data?.id ?? null); setSiteConfig(nextConfig);
    setSectionSlug((current) => merged.some((item) => item.slug === current) ? current : (merged[0]?.slug || availableSections[0] || ""));
    setHistory([]); setFuture([]); setLoading(false);
  }, [pageSlug]);
  useEffect(() => { void load(); }, [pageSlug]);
  useEffect(() => { void (async () => { const result = await supabase.from("products").select("id,title,slug,status,subtitle,description,image").order("title"); if (!result.error) setProductOptions((result.data || []).filter((item:any) => item.slug)); })(); }, []);
  const selectedProduct = useMemo(() => { if (!pageSlug.startsWith("product::")) return null; const [, id, slug] = pageSlug.split("::"); return productOptions.find(item => String(item.id) === id) || (id && slug ? { id: Number(id), title: slug.replaceAll("-", " "), slug } : null); }, [pageSlug, productOptions]);
  const previewPath = useMemo(() => selectedProduct ? `/products/${selectedProduct.slug}` : pageSlug === "home" ? "/" : `/${pageSlug}`, [pageSlug, selectedProduct]);
  const pageTitle = selectedProduct?.title || cmsPageLabels[pageSlug] || pretty(pageSlug);
  useEffect(() => { setPreviewLoading(true); }, [pageSlug, previewKey]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);

  const sections = useMemo(() => sectionLayout.map((item) => item.slug), [sectionLayout]);
  const selectedTexts = texts.filter(item => item.page_slug === pageSlug && item.section_slug === sectionSlug);
  const selectedImages = images.filter(item => item.page_slug === pageSlug && item.section_slug === sectionSlug);
  const pageGlobalTexts = texts.filter(item => item.page_slug === "global");

  function applyDraftToPreview() {
    const frame = previewFrame.current;
    const documentNode = frame?.contentDocument;
    if (!documentNode?.body) return;

    const pageTexts = texts.filter((item) => item.page_slug === pageSlug);
    for (const entry of pageTexts) {
      const original = String(entry.default_value || "").trim();
      const replacement = String(entry.value || "");
      if (!replacement || original === replacement) continue;

      const fullKey = `${entry.page_slug}.${entry.section_slug}.${entry.field_key}`;
      const mapped = documentNode.querySelectorAll<HTMLElement>(`[data-cms-key="${CSS.escape(fullKey)}"]`);
      if (mapped.length) {
        mapped.forEach((element) => { element.textContent = replacement; });
        continue;
      }
      if (!original) continue;
      const sectionRoot = documentNode.querySelector<HTMLElement>(`[data-cms-section="${CSS.escape(entry.section_slug)}"]`);
      if (!sectionRoot) continue;
      const walker = documentNode.createTreeWalker(sectionRoot, NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();
      while (current) {
        const node = current as Text;
        const value = node.nodeValue || "";
        if (value.trim() === original) node.nodeValue = value.replace(original, replacement);
        current = walker.nextNode();
      }
    }

    const pageImages = images.filter((item) => item.page_slug === pageSlug && item.current_url);
    for (const slot of pageImages) {
      const original = String(slot.default_url || "").split("?")[0];
      for (const image of Array.from(documentNode.images)) {
        const source = image.getAttribute("src") || "";
        if (original && (source === original || source.endsWith(original))) {
          image.src = slot.current_url;
          image.alt = slot.alt_text || image.alt;
        }
      }
    }
  }

  function enableInlineEditing() {
    const documentNode = previewFrame.current?.contentDocument;
    if (!documentNode?.body) return;
    documentNode.querySelectorAll<HTMLElement>("[data-cms-key]").forEach((element) => {
      const fullKey = element.dataset.cmsKey || "";
      const entry = texts.find((item) => `${item.page_slug}.${item.section_slug}.${item.field_key}` === fullKey);
      if (!entry) return;
      element.contentEditable = "true";
      element.spellcheck = true;
      element.style.cursor = "text";
      element.style.outlineOffset = "4px";
      element.onfocus = () => { element.style.outline = "2px solid rgba(200,79,108,.45)"; setSectionSlug(entry.section_slug); };
      element.onblur = () => { element.style.outline = ""; };
      element.oninput = () => { const nextValue = element.textContent || ""; setTexts((items) => items.map((item) => item.id === entry.id ? { ...item, value:nextValue } : item)); };
    });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { applyDraftToPreview(); enableInlineEditing(); }, 80);
    return () => window.clearTimeout(timer);
  }, [texts, images, pageSlug, previewKey]);

  function snapshot() { return { texts: texts.map(item => ({ ...item })), images: images.map(item => ({ ...item })) }; }
  function commit(next: Snapshot) { setHistory(previous => [...previous.slice(-24), snapshot()]); setFuture([]); setTexts(next.texts); setImages(next.images); }
  function updateText(id: string | undefined, value: string) { commit({ texts: texts.map(item => item.id === id ? { ...item, value } : item), images }); }
  function updateImage(id: string | undefined, patch: Partial<ImageSlot>) { commit({ texts, images: images.map(item => item.id === id ? { ...item, ...patch } : item) }); }
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
    setSaving(true); setError("");
    const textPayload = cmsTextRegistry.map(item => ({ ...item }));
    const imagePayload = cmsImageRegistry.map(item => ({ ...item }));
    const [textResult, imageResult] = await Promise.all([
      supabase.from("cms_text_entries").upsert(textPayload, { onConflict: "page_slug,section_slug,field_key", ignoreDuplicates: true }),
      supabase.from("cms_image_slots").upsert(imagePayload, { onConflict: "page_slug,section_slug,slot_key", ignoreDuplicates: true }),
    ]);
    if (textResult.error || imageResult.error) setError(textResult.error?.message || imageResult.error?.message || "Initialization failed."); else { setToast("Current website content has been registered in the CMS."); await load(); }
    setSaving(false);
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
    setProductPageSettings(nextSettings);
    await supabase.from("website_editor_drafts").upsert({ page_slug:pageSlug, payload:{ texts, images, sectionLayout }, status:publishNow ? "Published" : "Draft", ...(publishNow ? { published_at:new Date().toISOString() } : {}), updated_at:new Date().toISOString() }, { onConflict:"page_slug" });
    setPreviewKey((value) => value + 1); window.dispatchEvent(new Event("salt-cms-updated"));
    return true;
  }

  async function saveDraft() {
    setSaving(true); setError("");
    if (selectedProduct) { const ok = await saveProductVisualChanges(false); if (ok) setToast("Product page changes saved as a draft."); setSaving(false); return; }
    const result = await supabase.from("website_editor_drafts").upsert({ page_slug: pageSlug, payload: { texts: texts.filter(item => item.page_slug === pageSlug), images: images.filter(item => item.page_slug === pageSlug) }, status: "Draft", updated_at: new Date().toISOString() }, { onConflict: "page_slug" });
    if (result.error) setError(result.error.message); else setToast("Website changes saved as a draft.");
    setSaving(false);
  }

  async function publish() {
    if (!confirm("Publish these website text and image changes now?")) return;
    setSaving(true); setError("");
    if (selectedProduct) { const ok = await saveProductVisualChanges(true); if (ok) setToast("Product page changes published."); setSaving(false); return; }
    const session = await supabase.auth.getSession();
    for (const entry of texts.filter(item => item.page_slug === pageSlug)) {
      const entryResult = await supabase.from("cms_text_entries").update({ default_value: entry.value, updated_at: new Date().toISOString() }).eq("id", entry.id);
      if (entryResult.error) { setError(entryResult.error.message); setSaving(false); return; }
      const translationResult = await supabase.from("cms_text_translations").upsert({ entry_id: entry.id, language_code: "en", value: entry.value, updated_at: new Date().toISOString() }, { onConflict: "entry_id,language_code" });
      if (translationResult.error) { setError(translationResult.error.message); setSaving(false); return; }
    }
    for (const slot of images.filter(item => item.page_slug === pageSlug)) {
      const imageResult = await supabase.from("cms_image_slots").update({ current_url: slot.current_url, alt_text: slot.alt_text, is_active: slot.is_active !== false, updated_at: new Date().toISOString() }).eq("id", slot.id);
      if (imageResult.error) { setError(imageResult.error.message); setSaving(false); return; }
    }
    await supabase.from("website_editor_drafts").upsert({ page_slug: pageSlug, payload: { texts: texts.filter(item => item.page_slug === pageSlug), images: images.filter(item => item.page_slug === pageSlug) }, status: "Published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "page_slug" });
    await supabase.from("b2b_activities").insert({ activity_type: "published", module: "Website", record_id: pageSlug, title: `${pageTitle} updated`, description: "Website Visual Editor changes published", actor_id: session.data.session?.user.id || null, actor_email: session.data.session?.user.email || null });
    window.dispatchEvent(new Event("salt-cms-updated")); setPreviewKey(value => value + 1); setToast("Website changes published."); setSaving(false); setHistory([]); setFuture([]);
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !imageTarget) return;
    setSaving(true); setError("");
    const path = `website/${pageSlug}/${sectionSlug}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const result = await supabase.storage.from("cms-media").upload(path, file, { contentType: file.type, upsert: false });
    if (result.error) setError(result.error.message); else updateImage(imageTarget, { current_url: supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl });
    setSaving(false); event.target.value = "";
  }

  function duplicateSection() {
    const textCopies = selectedTexts.map(item => ({ ...item, id: undefined, section_slug: `${sectionSlug}-copy-${Date.now()}`, field_label: `${item.field_label} Copy` }));
    const imageCopies = selectedImages.map(item => ({ ...item, id: undefined, section_slug: `${sectionSlug}-copy-${Date.now()}`, title: `${item.title} Copy` }));
    setError("Duplicated sections must be saved through the dedicated section builder before publishing. The current live website uses fixed code sections.");
    void textCopies; void imageCopies;
  }

  return <AdminShell><div className="os-page">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Live no-code website management</div><h1 className="os-page-title">Website Visual Editor</h1><p className="os-page-subtitle">Edit the actual CMS text and image slots used by the existing website. Drafts remain separate until you publish.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={undo} disabled={!history.length}><Undo2/>Undo</button><button className="os-btn soft" onClick={redo} disabled={!future.length}><Redo2/>Redo</button><a className="os-btn soft" href={previewPath} target="_blank"><Eye/>Open Website</a><button className="os-btn soft" onClick={() => void saveDraft()} disabled={saving}><Save/>Save Draft</button><button className="os-btn primary" onClick={() => void publish()} disabled={saving}><CheckCircle2/>Publish</button></div></header>
    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body"><strong>Website editor action failed</strong><p className="os-page-subtitle">{error}</p></div></section>}
    <section className="os-card product-detail-editor-callout"><div className="os-card-body"><div><strong>{selectedProduct ? `Editing Preview: ${selectedProduct.title}` : "Product Detail Pages"}</strong><p className="os-page-subtitle">Select a product detail page, then click visible text directly in the preview or use the section controls to hide, show and reorder the page. The complete product editor remains available for specifications and SEO.</p></div><div className="os-row-actions"><select className="os-field" value={selectedProduct ? pageSlug : ""} onChange={event => event.target.value && setPageSlug(event.target.value)}><option value="">Select product page…</option>{productOptions.map(product => <option key={product.id} value={`product::${product.id}::${product.slug}`}>{product.title}</option>)}</select><a className="os-btn soft" href={selectedProduct ? `/admin/products/${selectedProduct.id}` : "/admin/products"}>{selectedProduct ? "Open Complete Product Editor" : "Manage Product Pages"}</a></div></div></section>
    {!initialized && !loading && <section className="os-card"><div className="os-card-body"><div className="os-empty"><div className="os-empty-icon"><RefreshCw/></div><h3>Website content registry is empty</h3><p>Register the current website’s real text and image slots before editing. This imports the values already present in the website code.</p><button className="os-btn primary" onClick={() => void initializeFromWebsite()} disabled={saving}>Initialize from Current Website</button></div></div></section>}
    <div className="os-website-editor">
      <aside className="os-card os-panel-sticky"><div className="os-card-header"><div><h2>Page & Sections</h2><p>Actual registered website structure</p></div><ChevronDown/></div><div className="os-card-body"><label className="os-label"><span>Website Page</span><select value={pageSlug} onChange={event => { setPageSlug(event.target.value); setSectionSlug(""); }}><optgroup label="Website Pages">{pageOptions.map(([slug, label]) => <option value={slug} key={slug}>{label}</option>)}</optgroup>{productOptions.length > 0 && <optgroup label="Product Detail Pages">{productOptions.map(product => <option key={product.id} value={`product::${product.id}::${product.slug}`}>{product.title}</option>)}</optgroup>}</select></label><div className="visual-section-stack">{sectionLayout.map((section, index) => <div key={section.slug} className={`visual-section-row ${sectionSlug === section.slug ? "active" : ""} ${section.visible ? "" : "is-hidden"}`}><button className="visual-section-select" onClick={() => setSectionSlug(section.slug)}><span className="visual-section-dot" /> <span>{section.label || pretty(section.slug)}</span></button><div className="visual-section-actions"><button type="button" title={section.visible ? "Hide section" : "Show section"} onClick={() => toggleSection(section.slug)} disabled={saving}>{section.visible ? <Eye /> : <EyeOff />}</button><button type="button" title="Move up" onClick={() => moveSection(section.slug, -1)} disabled={saving || index === 0}><ArrowUp /></button><button type="button" title="Move down" onClick={() => moveSection(section.slug, 1)} disabled={saving || index === sectionLayout.length - 1}><ArrowDown /></button></div></div>)}{!sections.length && <p className="os-page-subtitle">No sections registered for this page.</p>}</div><button className="os-btn soft visual-add-section" type="button" onClick={enableOptionalSection} disabled={saving || Boolean(selectedProduct)}><Plus/>Add Section</button>{pageGlobalTexts.length > 0 && <div style={{ marginTop: 18 }}><div className="os-page-eyebrow">Global content</div><p className="os-page-subtitle">Header and footer content is managed in Website Text Manager.</p></div>}</div></aside>

      <main className="os-card visual-editor-canvas"><div className="os-card-header"><div><h2>Full Website Page Preview</h2><p>Scroll the complete live page; use the right panel to edit the selected section</p></div><div className="os-preview-device"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}><Laptop/></button><button className={device === "tablet" ? "active" : ""} onClick={() => setDevice("tablet")}><Tablet/></button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}><Smartphone/></button></div></div><div className="os-card-body visual-editor-preview-body"><div className={`visual-full-page-frame ${device}`}><iframe key={`${pageSlug}-${previewKey}`} ref={previewFrame} onLoad={() => { setPreviewLoading(false); window.setTimeout(() => { applyDraftToPreview(); enableInlineEditing(); }, 250); }} title={`${pageTitle} website preview`} src={`${previewPath}${previewPath.includes("?") ? "&" : "?"}cms_editor_preview=1&v=${previewKey}`}/>{previewLoading && <div className="visual-preview-loading visual-preview-overlay"><RefreshCw className="animate-spin"/><strong>Loading full website preview…</strong></div>}</div><section className="visual-draft-strip"><div><span>Live draft preview</span><strong>{sectionSlug ? pretty(sectionSlug) : "No section selected"}</strong></div><p>Text and image edits are applied inside the full-page preview immediately. Save Draft keeps changes private; Publish writes them to the live website.</p><div className="visual-draft-content">{selectedImages.map(slot => slot.current_url ? <img key={slot.id || slot.slot_key} src={slot.current_url} alt={slot.alt_text || slot.title}/> : null)}<div>{selectedTexts.map(entry => entry.field_type === "textarea" ? <p key={entry.id || entry.field_key}>{entry.value || <em>{entry.field_label} is empty</em>}</p> : <h3 key={entry.id || entry.field_key}>{entry.value || <em>{entry.field_label} is empty</em>}</h3>)}</div></div></section></div></main>

      <aside className="os-card os-panel-sticky"><div className="os-card-header"><div><h2>{sectionSlug ? pretty(sectionSlug) : "Section Settings"}</h2><p>Text, images, visibility, spacing and height</p></div><ImageIcon/></div><div className="os-card-body">{sectionSlug && (() => { const current = sectionLayout.find((item) => item.slug === sectionSlug); return current ? <div className="visual-section-size-panel"><div className="os-page-eyebrow">Section Size & Spacing</div><div className="os-form-grid" style={{ gridTemplateColumns: "1fr" }}><label className="os-label"><span>Minimum Height</span><select value={current.minHeight || 0} onChange={(event) => updateSectionSizing(sectionSlug, { minHeight: Number(event.target.value) || undefined }, `${pretty(sectionSlug)} height updated.`)}><option value={0}>Automatic — theme default</option><option value={320}>Compact · 320px</option><option value={480}>Standard · 480px</option><option value={620}>Tall · 620px</option><option value={760}>Feature · 760px</option><option value={900}>Full Feature · 900px</option></select></label><label className="os-label"><span>Top Spacing (px)</span><input type="number" min={0} max={240} placeholder="Theme default" value={current.paddingTop ?? ""} onBlur={(event) => updateSectionSizing(sectionSlug, { paddingTop: event.currentTarget.value === "" ? undefined : Math.max(0, Math.min(240, Number(event.currentTarget.value))) }, `${pretty(sectionSlug)} top spacing updated.`)} onChange={(event) => setSectionLayout((items) => items.map((item) => item.slug === sectionSlug ? { ...item, paddingTop: event.target.value === "" ? undefined : Number(event.target.value) } : item))}/></label><label className="os-label"><span>Bottom Spacing (px)</span><input type="number" min={0} max={240} placeholder="Theme default" value={current.paddingBottom ?? ""} onBlur={(event) => updateSectionSizing(sectionSlug, { paddingBottom: event.currentTarget.value === "" ? undefined : Math.max(0, Math.min(240, Number(event.currentTarget.value))) }, `${pretty(sectionSlug)} bottom spacing updated.`)} onChange={(event) => setSectionLayout((items) => items.map((item) => item.slug === sectionSlug ? { ...item, paddingBottom: event.target.value === "" ? undefined : Number(event.target.value) } : item))}/></label></div><p className="os-page-subtitle">Use Automatic to keep the exact approved theme. Custom values apply only when you intentionally change them.</p></div> : null; })()}<div className="os-form-grid" style={{ gridTemplateColumns: "1fr" }}>{selectedTexts.map(entry => <label className="os-label" key={entry.id || entry.field_key}><span>{entry.field_label}</span>{entry.field_type === "textarea" ? <textarea value={entry.value} onChange={event => updateText(entry.id, event.target.value)}/> : <input value={entry.value} onChange={event => updateText(entry.id, event.target.value)}/>}<small>{entry.value.length} characters</small></label>)}{selectedImages.map(slot => <div className="os-card" style={{ boxShadow: "none" }} key={slot.id || slot.slot_key}><div className="os-card-body"><strong>{slot.title}</strong>{slot.current_url ? <img src={slot.current_url} alt={slot.alt_text} style={{ width: "100%", height: 150, objectFit: "contain", borderRadius: 12, background: "var(--os-surface-2)", marginTop: 10 }}/> : <div className="os-empty" style={{ minHeight: 120 }}><p>No image selected.</p></div>}<label className="os-label" style={{ marginTop: 10 }}><span>Image URL</span><input value={slot.current_url || ""} onChange={event => updateImage(slot.id, { current_url: event.target.value })}/></label><label className="os-label" style={{ marginTop: 10 }}><span>Alt Text</span><input value={slot.alt_text || ""} onChange={event => updateImage(slot.id, { alt_text: event.target.value })}/></label><button className="os-btn soft" style={{ width: "100%", marginTop: 10 }} onClick={() => { setImageTarget(slot.id || ""); imageInput.current?.click(); }}><UploadCloud/>Replace Image</button></div></div>)}{!selectedTexts.length && !selectedImages.length && <div className="os-empty"><h3>No inline fields in this section</h3><p>{selectedProduct ? "You can still hide, show or reorder this product section here. Use Complete Product Editor for specifications, cards and SEO." : "This section currently has no registered text or image slots."}</p>{selectedProduct && <a className="os-btn primary" href={`/admin/products/${selectedProduct.id}`}>Complete Product Editor</a>}</div>}<div className="os-grid two"><button className="os-btn soft" onClick={duplicateSection}><Copy/>Duplicate</button><button className="os-btn danger" onClick={() => sectionSlug && (sectionLayout.find((item) => item.slug === sectionSlug)?.custom ? void deleteCustomSection(sectionSlug) : toggleSection(sectionSlug))} disabled={!sectionSlug || saving}><Trash2/>{sectionLayout.find((item) => item.slug === sectionSlug)?.custom ? "Delete Section" : sectionLayout.find((item) => item.slug === sectionSlug)?.visible === false ? "Restore" : "Hide Section"}</button></div></div></div></aside>
    </div>
    {addSectionOpen && <div className="os-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAddSectionOpen(false); }}><section className="os-modal visual-add-section-modal" onMouseDown={(event) => event.stopPropagation()}><div className="os-modal-header"><div><div className="os-page-eyebrow">Shopify-style Section Builder</div><h2>Add Website Section</h2><p>Choose a reusable section type. It will appear on the live page, in Text Manager and in Images Manager where applicable.</p></div><button className="os-icon-button" onClick={() => setAddSectionOpen(false)}><X/></button></div><div className="os-modal-body"><label className="os-label"><span>Section Name</span><input value={addSectionLabel} onChange={(event) => setAddSectionLabel(event.target.value)} placeholder="e.g. Export Program"/></label><div className="visual-section-template-grid">{cmsSectionTemplates.map((template) => <button key={template.key} type="button" className={`visual-section-template ${addSectionTemplate === template.key ? "active" : ""}`} onClick={() => setAddSectionTemplate(template.key)}><strong>{template.label}</strong><span>{template.description}</span></button>)}</div></div><div className="os-modal-footer"><button className="os-btn soft" onClick={() => setAddSectionOpen(false)}>Cancel</button><button className="os-btn primary" onClick={() => void addCustomSection()} disabled={saving || !addSectionLabel.trim()}><Plus/>{saving ? "Adding…" : "Add Section"}</button></div></section></div>}
    <input ref={imageInput} type="file" accept="image/*" hidden onChange={uploadImage}/>
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>The website editor state has been updated.</span></div></div></div>}
  </div></AdminShell>;
}
