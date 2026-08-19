"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { adminUpload } from "@/lib/admin-client";
import {
  DEFAULT_PRODUCT_PAGE_SETTINGS,
  PRODUCT_PAGE_DEFAULT_ORDER,
  PRODUCT_PAGE_SECTION_LABELS,
  normalizeProductPageSettings,
  type ProductPageSectionKey,
  type ProductPageSettings,
} from "@/lib/product-page-layout";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";

type Product = Record<string, any> & { id: number; title: string; slug: string; status: string };

function lines(value: unknown) { return Array.isArray(value) ? value.join("\n") : String(value || ""); }
function parseLines(value: string) { return value.split("\n").map((item) => item.trim()).filter(Boolean); }
function specText(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  return Object.entries(value as Record<string, string>).map(([key, item]) => `${key}: ${item}`).join("\n");
}
function parseSpecs(value: string) {
  const output: Record<string, string> = {};
  parseLines(value).forEach((row) => {
    const [key, ...rest] = row.split(":");
    if (key && rest.length) output[key.trim()] = rest.join(":").trim();
  });
  return output;
}

export default function ProductDetailEditor() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [settings, setSettings] = useState<ProductPageSettings>(DEFAULT_PRODUCT_PAGE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [uploading, setUploading] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    const [productResult, pageResult] = await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("page_content").select("content").eq("page_slug", `product:${id}`).maybeSingle(),
    ]);
    if (productResult.error || !productResult.data) {
      setError(productResult.error?.message || "Product not found.");
      setLoading(false);
      return;
    }
    const row = productResult.data as Product;
    setProduct(row);
    setForm({
      ...row,
      features: lines(row.features),
      applications: lines(row.applications),
      gallery: lines(row.gallery),
      specifications: specText(row.specifications),
      incoterms: lines(row.incoterms),
      available_markets: lines(row.available_markets),
    });
    setSettings(normalizeProductPageSettings(pageResult.data?.content));
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const publicUrl = useMemo(() => product ? `/products/${form.slug || product.slug}` : "/products", [product, form.slug]);
  const removedSections = PRODUCT_PAGE_DEFAULT_ORDER.filter((key) => !settings.sectionOrder.includes(key));

  function patch(key: string, value: any) { setForm((previous) => ({ ...previous, [key]: value })); }
  function getAdditionalSpec(label: string) {
    return parseSpecs(String(form.specifications || ""))[label] || "";
  }
  function patchAdditionalSpec(label: string, value: string) {
    const specs = parseSpecs(String(form.specifications || ""));
    if (value.trim()) specs[label] = value.trim();
    else delete specs[label];
    patch("specifications", Object.entries(specs).map(([key, item]) => `${key}: ${item}`).join("\n"));
  }
  function patchSetting<K extends keyof ProductPageSettings>(key: K, value: ProductPageSettings[K]) { setSettings((previous) => ({ ...previous, [key]: value })); }

  function patchBenefit(index: number, key: "title" | "text", value: string) {
    setSettings((previous) => ({ ...previous, benefitItems: previous.benefitItems.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  }
  function patchProcess(index: number, key: "number" | "title" | "text", value: string) {
    setSettings((previous) => ({ ...previous, processItems: previous.processItems.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  }
  function patchWhy(index: number, key: "title" | "text", value: string) {
    setSettings((previous) => ({ ...previous, whyItems: previous.whyItems.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  }
  function moveSection(index: number, direction: -1 | 1) {
    setSettings((previous) => {
      const next = [...previous.sectionOrder];
      const target = index + direction;
      if (target < 0 || target >= next.length) return previous;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...previous, sectionOrder: next };
    });
  }
  function toggleSection(section: ProductPageSectionKey) {
    setSettings((previous) => ({ ...previous, sectionVisibility: { ...previous.sectionVisibility, [section]: !previous.sectionVisibility[section] } }));
  }
  function removeSection(section: ProductPageSectionKey) {
    if (section === "hero" && !confirm("Remove the product hero from this page? You can restore it later.")) return;
    setSettings((previous) => ({
      ...previous,
      sectionOrder: previous.sectionOrder.filter((item) => item !== section),
      sectionVisibility: { ...previous.sectionVisibility, [section]: false },
    }));
  }
  function restoreSection(section: ProductPageSectionKey) {
    setSettings((previous) => ({ ...previous, sectionOrder: [...previous.sectionOrder, section], sectionVisibility: { ...previous.sectionVisibility, [section]: true } }));
  }

  async function upload(event: ChangeEvent<HTMLInputElement>, target: "image" | "gallery") {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(target);
    setError("");
    try {
      const result = await adminUpload(file, "product-image", { folder: `products/${id}`, filename: file.name });
      const url = result.value;
      if (target === "image") patch("image", url);
      else patch("gallery", `${String(form.gallery || "").trim()}${form.gallery ? "\n" : ""}${url}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Image upload failed."); }
    setUploading("");
    event.target.value = "";
  }

  async function save() {
    if (!form.title?.trim()) { setError("Product title is required."); return; }
    setSaving(true);
    setError("");
    const productPayload = {
      title: String(form.title).trim(), slug: String(form.slug || "").trim(), subtitle: String(form.subtitle || ""), category: String(form.category || ""),
      description: String(form.description || ""), short_description: String(form.short_description || ""), image: String(form.image || ""), gallery: parseLines(String(form.gallery || "")),
      status: String(form.status || "draft"), moq: String(form.moq || ""), packaging: String(form.packaging || ""), grain_type: String(form.grain_type || ""), sizes: String(form.sizes || ""),
      packaging_type: String(form.packaging_type || ""), best_for: String(form.best_for || ""), features: parseLines(String(form.features || "")), applications: parseLines(String(form.applications || "")),
      specifications: parseSpecs(String(form.specifications || "")), brochure_url: String(form.brochure_url || ""), origin: String(form.origin || ""), grade: String(form.grade || ""),
      granulation: String(form.granulation || ""), mesh_size: String(form.mesh_size || ""), purity: String(form.purity || ""), moisture: String(form.moisture || ""),
      available_pack_sizes: String(form.available_pack_sizes || ""), bulk_packaging: String(form.bulk_packaging || ""), private_label_available: Boolean(form.private_label_available),
      production_capacity: String(form.production_capacity || ""), lead_time: String(form.lead_time || ""), hs_code: String(form.hs_code || ""), incoterms: parseLines(String(form.incoterms || "")),
      port_of_loading: String(form.port_of_loading || ""), coa_url: String(form.coa_url || ""), msds_url: String(form.msds_url || ""), specification_sheet_url: String(form.specification_sheet_url || ""),
      seo_title: String(form.seo_title || ""), seo_description: String(form.seo_description || ""), updated_at: new Date().toISOString(),
    };
    const [productResult, pageResult] = await Promise.all([
      supabase.from("products").update(productPayload).eq("id", id),
      supabase.from("page_content").upsert({ page_slug: `product:${id}`, content: settings, updated_at: new Date().toISOString() }, { onConflict: "page_slug" }),
    ]);
    setSaving(false);
    if (productResult.error || pageResult.error) { setError(productResult.error?.message || pageResult.error?.message || "Unable to save product page."); return; }
    setToast("Product detail page saved");
    await load();
  }

  if (loading) return <AdminShell><div className="os-empty" style={{ minHeight: "70vh" }}><RefreshCw className="animate-spin"/><h3>Loading product page editor…</h3></div></AdminShell>;
  if (!product) return <AdminShell><div className="os-page"><div className="os-empty"><h3>Product unavailable</h3><p>{error}</p><Link className="os-btn primary" href="/admin/products">Back to Products</Link></div></div></AdminShell>;

  return <AdminShell><div className="os-page product-detail-editor-v2">
    <header className="os-page-header"><div><Link href="/admin/product-pages" className="os-page-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><ArrowLeft/>Product Pages</Link><h1 className="os-page-title">Product Detail Page Editor</h1><p className="os-page-subtitle">Product data aur page layout alag controls hain. Sections ko show/hide, reorder, remove ya restore karein.</p></div><div className="os-page-actions"><Link href={publicUrl} target="_blank" className="os-btn soft"><Eye/>Open Live Page</Link><button className="os-btn primary" onClick={() => void save()} disabled={saving}><Save/>{saving ? "Saving…" : "Save Product Page"}</button></div></header>
    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body"><strong>Product page action failed</strong><p className="os-page-subtitle">{error}</p></div></section>}

    <section className="os-card product-section-manager">
      <div className="os-card-header"><div><h2>Page Sections</h2><p>Yahan se public product detail page ke sections control karein.</p></div><span className="os-badge success">{settings.sectionOrder.length} ACTIVE SLOTS</span></div>
      <div className="os-card-body">
        <div className="product-section-list">
          {settings.sectionOrder.map((section, index) => <div className="product-section-row" key={section}>
            <div><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{PRODUCT_PAGE_SECTION_LABELS[section]}</strong><small>{settings.sectionVisibility[section] ? "Visible on public page" : "Hidden on public page"}</small></span></div>
            <div className="product-section-actions">
              <button className="os-btn soft" onClick={() => moveSection(index, -1)} disabled={index === 0}><ArrowUp/></button>
              <button className="os-btn soft" onClick={() => moveSection(index, 1)} disabled={index === settings.sectionOrder.length - 1}><ArrowDown/></button>
              <button className="os-btn soft" onClick={() => toggleSection(section)}>{settings.sectionVisibility[section] ? <EyeOff/> : <Eye/>}{settings.sectionVisibility[section] ? "Hide" : "Show"}</button>
              <button className="os-btn danger" onClick={() => removeSection(section)}><Trash2/>Remove</button>
            </div>
          </div>)}
        </div>
        {removedSections.length ? <div className="product-restore-box"><strong>Removed Sections</strong><div>{removedSections.map((section) => <button className="os-btn soft" key={section} onClick={() => restoreSection(section)}><RotateCcw/>{PRODUCT_PAGE_SECTION_LABELS[section]}</button>)}</div></div> : null}
      </div>
    </section>

    <div className="product-page-editor-layout">
      <div className="product-page-editor-fields">
        <EditorSection title="Core Product Content" description="Main product title, URL and buyer-facing copy."><div className="os-form-grid"><Field label="Product Title" value={form.title} onChange={(value) => patch("title", value)}/><Field label="URL Slug" value={form.slug} onChange={(value) => patch("slug", value)}/><Field label="Subtitle" value={form.subtitle} onChange={(value) => patch("subtitle", value)}/><Field label="Category" value={form.category} onChange={(value) => patch("category", value)}/><TextArea label="Short Description" value={form.short_description} onChange={(value) => patch("short_description", value)} full/><TextArea label="Full Product Description" value={form.description} onChange={(value) => patch("description", value)} full/></div></EditorSection>

        <EditorSection title="Product Images" description="Main image and optional gallery used on the public page."><div className="os-form-grid"><label className="os-label full"><span>Main Image URL</span><input value={form.image || ""} onChange={(event) => patch("image", event.target.value)}/><label className="os-btn soft" style={{ width: "fit-content", cursor: "pointer" }}><ImagePlus/>{uploading === "image" ? "Uploading…" : "Upload Main Image"}<input hidden type="file" accept="image/*" onChange={(event) => void upload(event, "image")}/></label></label>{form.image && <img src={form.image} alt="Product preview" className="product-editor-image-preview"/>}<TextArea label="Gallery Image URLs — one per line" value={form.gallery} onChange={(value) => patch("gallery", value)} full/><label className="os-btn soft" style={{ width: "fit-content", cursor: "pointer" }}><UploadCloud/>{uploading === "gallery" ? "Uploading…" : "Add Gallery Image"}<input hidden type="file" accept="image/*" onChange={(event) => void upload(event, "gallery")}/></label></div></EditorSection>

        <EditorSection title="Specifications & Applications" description="Values used in the product hero and technical sections."><div className="os-form-grid"><Field label="Origin" value={form.origin} onChange={(value) => patch("origin", value)}/><Field label="Grade" value={form.grade} onChange={(value) => patch("grade", value)}/><Field label="Grain Type" value={form.grain_type} onChange={(value) => patch("grain_type", value)}/><Field label="Granulation" value={form.granulation} onChange={(value) => patch("granulation", value)}/><Field label="Mesh Size" value={form.mesh_size} onChange={(value) => patch("mesh_size", value)}/><Field label="Purity" value={form.purity} onChange={(value) => patch("purity", value)}/><Field label="Moisture Content" value={form.moisture} onChange={(value) => patch("moisture", value)}/><Field label="Heavy Metals" value={getAdditionalSpec("Heavy Metals")} onChange={(value) => patchAdditionalSpec("Heavy Metals", value)}/><Field label="Shelf Life" value={getAdditionalSpec("Shelf Life")} onChange={(value) => patchAdditionalSpec("Shelf Life", value)}/><Field label="Product Packaging Material" value={getAdditionalSpec("Product Packaging Material")} onChange={(value) => patchAdditionalSpec("Product Packaging Material", value)}/><Field label="Available Sizes" value={form.available_pack_sizes || form.sizes} onChange={(value) => patch("available_pack_sizes", value)}/><Field label="Packaging" value={form.packaging} onChange={(value) => patch("packaging", value)}/><Field label="Bulk Packaging" value={form.bulk_packaging} onChange={(value) => patch("bulk_packaging", value)}/><Field label="MOQ" value={form.moq} onChange={(value) => patch("moq", value)}/><Field label="Lead Time" value={form.lead_time} onChange={(value) => patch("lead_time", value)}/><Field label="Production Capacity" value={form.production_capacity} onChange={(value) => patch("production_capacity", value)}/><Field label="HS Code" value={form.hs_code} onChange={(value) => patch("hs_code", value)}/><Field label="Port of Loading" value={form.port_of_loading} onChange={(value) => patch("port_of_loading", value)}/><Field label="Best For" value={form.best_for} onChange={(value) => patch("best_for", value)}/><TextArea label="Features — one per line" value={form.features} onChange={(value) => patch("features", value)} full/><TextArea label="Applications — one per line" value={form.applications} onChange={(value) => patch("applications", value)} full/><TextArea label="Additional Specifications — Label: Value" value={form.specifications} onChange={(value) => patch("specifications", value)} full/></div></EditorSection>

        <EditorSection title="Page Labels & CTAs" description="Change product detail page labels without opening source code."><div className="os-form-grid"><Field label="Eyebrow" value={settings.eyebrow} onChange={(value) => patchSetting("eyebrow", value)}/><Field label="Specifications Heading" value={settings.specificationsTitle} onChange={(value) => patchSetting("specificationsTitle", value)}/><Field label="Features Heading" value={settings.featuresTitle} onChange={(value) => patchSetting("featuresTitle", value)}/><Field label="Applications Heading" value={settings.applicationsTitle} onChange={(value) => patchSetting("applicationsTitle", value)}/><Field label="Quotation Button" value={settings.requestQuoteLabel} onChange={(value) => patchSetting("requestQuoteLabel", value)}/><Field label="WhatsApp Button" value={settings.whatsappLabel} onChange={(value) => patchSetting("whatsappLabel", value)}/><Field label="WhatsApp Number" value={settings.whatsappNumber} onChange={(value) => patchSetting("whatsappNumber", value)}/><Field label="Why Buy Heading" value={settings.whyTitle} onChange={(value) => patchSetting("whyTitle", value)}/></div></EditorSection>

        <EditorSection title="Buyer Benefits" description="Five cards below the product hero."><div className="os-grid two">{settings.benefitItems.map((item, index) => <article className="os-card" style={{ boxShadow: "none" }} key={`${item.title}-${index}`}><div className="os-card-body"><Field label="Title" value={item.title} onChange={(value) => patchBenefit(index, "title", value)}/><TextArea label="Text" value={item.text} onChange={(value) => patchBenefit(index, "text", value)}/></div></article>)}</div></EditorSection>

        <EditorSection title="Marketplaces" description="Marketplace row shown below the benefits section."><div className="os-form-grid"><Field label="Heading" value={settings.marketplacesTitle} onChange={(value) => patchSetting("marketplacesTitle", value)} full/><TextArea label="Subheading" value={settings.marketplacesSubtitle} onChange={(value) => patchSetting("marketplacesSubtitle", value)} full/><TextArea label="Marketplace Names — one per line" value={settings.marketplaces.join("\n")} onChange={(value) => patchSetting("marketplaces", parseLines(value))} full/></div></EditorSection>

        <EditorSection title="How It Works" description="Four buyer journey steps."><div className="os-form-grid"><Field label="Heading" value={settings.processTitle} onChange={(value) => patchSetting("processTitle", value)} full/><TextArea label="Subheading" value={settings.processSubtitle} onChange={(value) => patchSetting("processSubtitle", value)} full/></div><div className="os-grid two" style={{ marginTop: 16 }}>{settings.processItems.map((item, index) => <article className="os-card" style={{ boxShadow: "none" }} key={`${item.number}-${index}`}><div className="os-card-body"><Field label="Number" value={item.number} onChange={(value) => patchProcess(index, "number", value)}/><Field label="Title" value={item.title} onChange={(value) => patchProcess(index, "title", value)}/><TextArea label="Text" value={item.text} onChange={(value) => patchProcess(index, "text", value)}/></div></article>)}</div></EditorSection>

        <EditorSection title="Partnership Cards" description="Optional Why Buy section. Restore/show it in Page Sections when needed."><div className="os-grid two">{settings.whyItems.map((item, index) => <article className="os-card" style={{ boxShadow: "none" }} key={`${item.title}-${index}`}><div className="os-card-body"><Field label="Card Title" value={item.title} onChange={(value) => patchWhy(index, "title", value)}/><TextArea label="Card Text" value={item.text} onChange={(value) => patchWhy(index, "text", value)}/><button className="os-btn danger" onClick={() => patchSetting("whyItems", settings.whyItems.filter((_, itemIndex) => itemIndex !== index))}><Trash2/>Remove</button></div></article>)}</div><button className="os-btn soft" style={{ marginTop: 14 }} onClick={() => patchSetting("whyItems", [...settings.whyItems, { icon: "globe", title: "", text: "" }])}><Plus/>Add Partnership Card</button></EditorSection>

        <EditorSection title="Documents & SEO" description="Document links, page visibility and search metadata."><div className="os-form-grid"><Field label="Specification Sheet URL" value={form.specification_sheet_url} onChange={(value) => patch("specification_sheet_url", value)}/><Field label="COA URL" value={form.coa_url} onChange={(value) => patch("coa_url", value)}/><Field label="MSDS URL" value={form.msds_url} onChange={(value) => patch("msds_url", value)}/><Field label="Brochure URL" value={form.brochure_url} onChange={(value) => patch("brochure_url", value)}/><Field label="SEO Title" value={form.seo_title} onChange={(value) => patch("seo_title", value)} full/><TextArea label="SEO Description" value={form.seo_description} onChange={(value) => patch("seo_description", value)} full/><label className="os-label"><span>Website Status</span><select value={form.status || "draft"} onChange={(event) => patch("status", event.target.value)}><option value="active">Active — visible</option><option value="draft">Draft — hidden</option><option value="archived">Archived</option></select></label><label className="os-label"><span>Private Label Available</span><input type="checkbox" checked={Boolean(form.private_label_available)} onChange={(event) => patch("private_label_available", event.target.checked)} style={{ width: 22, height: 22 }}/></label></div></EditorSection>
      </div>

      <aside className="os-card product-page-preview-panel"><div className="os-card-header"><div><h2>Live Product Page</h2><p>Saved changes appear on the real product URL.</p></div><Eye/></div><div className="os-card-body"><div className="product-page-mini-preview">{form.image ? <img src={form.image} alt=""/> : <div/>}<span>{settings.eyebrow}</span><h3>{form.title}</h3><p>{form.description || form.short_description}</p><div><b>{form.origin || "Origin"}</b><b>{form.moq || "MOQ"}</b></div></div><Link className="os-btn primary" style={{ width: "100%", marginTop: 14 }} href={publicUrl} target="_blank"><Eye/>Open Full Preview</Link></div></aside>
    </div>

    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>The live product and page settings were updated.</span></div></div></div>}

    <style jsx>{`
      .product-section-manager{margin:18px 0}.product-section-list{display:grid;gap:9px}.product-section-row{display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid var(--line);border-radius:14px;padding:11px 12px;background:var(--surface-2)}.product-section-row>div:first-child{display:flex;align-items:center;gap:12px}.product-section-row>div:first-child>b{width:34px;height:34px;border-radius:10px;background:rgba(167,25,63,.09);color:#a7193f;display:grid;place-items:center;font-size:10px}.product-section-row span{display:grid;gap:3px}.product-section-row strong{font-size:12px}.product-section-row small{font-size:9px;color:var(--muted)}.product-section-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.product-section-actions :global(button){font-size:9px;padding:7px 9px}.product-section-actions :global(svg){width:13px;height:13px}.product-restore-box{margin-top:14px;padding:13px;border:1px dashed var(--line);border-radius:14px}.product-restore-box>strong{font-size:10px}.product-restore-box>div{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.product-restore-box :global(button){font-size:9px}@media(max-width:820px){.product-section-row{align-items:flex-start;flex-direction:column}.product-section-actions{width:100%}}
    `}</style>
  </div></AdminShell>;
}

function EditorSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="os-card"><div className="os-card-header"><div><h2>{title}</h2><p>{description}</p></div></div><div className="os-card-body">{children}</div></section>;
}
function Field({ label, value, onChange, full = false }: { label: string; value: any; onChange: (value: string) => void; full?: boolean }) {
  return <label className={`os-label ${full ? "full" : ""}`}><span>{label}</span><input value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}/></label>;
}
function TextArea({ label, value, onChange, full = false }: { label: string; value: any; onChange: (value: string) => void; full?: boolean }) {
  return <label className={`os-label ${full ? "full" : ""}`}><span>{label}</span><textarea value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}/></label>;
}
