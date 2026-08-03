"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { cmsImageRegistry, cmsPageLabels, cmsTextRegistry } from "@/lib/cms-registry";
import { supabase } from "@/lib/supabase-client";
import { CheckCircle2, ChevronDown, Copy, Eye, Image as ImageIcon, Laptop, Monitor, Redo2, RefreshCw, Save, Smartphone, Tablet, Trash2, Undo2, UploadCloud, X } from "lucide-react";

type TextEntry = { id?: string; page_slug: string; section_slug: string; field_key: string; field_label: string; field_type: string; default_value: string; value: string; display_order?: number };
type ImageSlot = { id?: string; page_slug: string; section_slug: string; slot_key: string; title: string; current_url: string; default_url: string; alt_text: string; recommended_width?: number; recommended_height?: number; display_order?: number; is_active?: boolean };
type Snapshot = { texts: TextEntry[]; images: ImageSlot[] };
type ProductOption = { id: number; title: string; slug: string; status?: string };
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

  const load = useCallback(async () => {
    setLoading(true); setError("");
    if (pageSlug.startsWith("product::")) {
      setTexts([]); setImages([]); setInitialized(true); setSectionSlug(""); setHistory([]); setFuture([]); setLoading(false); return;
    }
    const [textResult, imageResult] = await Promise.all([
      supabase.from("cms_text_entries").select("id,page_slug,section_slug,field_key,field_label,field_type,default_value,display_order,cms_text_translations(language_code,value)").in("page_slug", [pageSlug, "global"]).order("display_order"),
      supabase.from("cms_image_slots").select("*").in("page_slug", [pageSlug, "global"]).order("display_order"),
    ]);
    if (textResult.error || imageResult.error) { setError(textResult.error?.message || imageResult.error?.message || "Website content tables are unavailable."); setLoading(false); return; }
    const liveTexts = (textResult.data || []).map((row: any) => ({ ...row, value: String((row.cms_text_translations || []).find((translation: any) => translation.language_code === "en")?.value || row.default_value || "") })) as TextEntry[];
    const liveImages = (imageResult.data || []) as ImageSlot[];
    setTexts(liveTexts); setImages(liveImages); setInitialized(Boolean(liveTexts.length || liveImages.length));
    const availableSections = Array.from(new Set([...liveTexts.filter(item => item.page_slug === pageSlug).map(item => item.section_slug), ...liveImages.filter(item => item.page_slug === pageSlug).map(item => item.section_slug)]));
    if (availableSections.length && !availableSections.includes(sectionSlug)) setSectionSlug(availableSections[0]);
    setHistory([]); setFuture([]); setLoading(false);
  }, [pageSlug, sectionSlug]);
  useEffect(() => { void load(); }, [pageSlug]);
  useEffect(() => { void (async () => { const result = await supabase.from("products").select("id,title,slug,status").order("title"); if (!result.error) setProductOptions((result.data || []).filter((item:any) => item.slug)); })(); }, []);
  const selectedProduct = useMemo(() => { if (!pageSlug.startsWith("product::")) return null; const [, id, slug] = pageSlug.split("::"); return productOptions.find(item => String(item.id) === id) || (id && slug ? { id: Number(id), title: slug.replaceAll("-", " "), slug } : null); }, [pageSlug, productOptions]);
  const previewPath = useMemo(() => selectedProduct ? `/products/${selectedProduct.slug}` : pageSlug === "home" ? "/" : `/${pageSlug}`, [pageSlug, selectedProduct]);
  const pageTitle = selectedProduct?.title || cmsPageLabels[pageSlug] || pretty(pageSlug);
  useEffect(() => { setPreviewLoading(true); }, [pageSlug, previewKey]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);

  const sections = useMemo(() => Array.from(new Set([...texts.filter(item => item.page_slug === pageSlug).map(item => item.section_slug), ...images.filter(item => item.page_slug === pageSlug).map(item => item.section_slug)])), [texts, images, pageSlug]);
  const selectedTexts = texts.filter(item => item.page_slug === pageSlug && item.section_slug === sectionSlug);
  const selectedImages = images.filter(item => item.page_slug === pageSlug && item.section_slug === sectionSlug);
  const pageGlobalTexts = texts.filter(item => item.page_slug === "global");

  function applyDraftToPreview() {
    const frame = previewFrame.current;
    const documentNode = frame?.contentDocument;
    if (!documentNode?.body) return;

    const pageTexts = texts.filter((item) => item.page_slug === pageSlug);
    const walker = documentNode.createTreeWalker(documentNode.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let current = walker.nextNode();
    while (current) { nodes.push(current as Text); current = walker.nextNode(); }
    for (const entry of pageTexts) {
      const original = String(entry.default_value || "").trim();
      const replacement = String(entry.value || "");
      if (!original || !replacement || original === replacement) continue;
      for (const node of nodes) {
        const value = node.nodeValue || "";
        if (value.trim() === original) node.nodeValue = value.replace(original, replacement);
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

  useEffect(() => {
    const timer = window.setTimeout(applyDraftToPreview, 80);
    return () => window.clearTimeout(timer);
  }, [texts, images, pageSlug, previewKey]);

  function snapshot() { return { texts: texts.map(item => ({ ...item })), images: images.map(item => ({ ...item })) }; }
  function commit(next: Snapshot) { setHistory(previous => [...previous.slice(-24), snapshot()]); setFuture([]); setTexts(next.texts); setImages(next.images); }
  function updateText(id: string | undefined, value: string) { commit({ texts: texts.map(item => item.id === id ? { ...item, value } : item), images }); }
  function updateImage(id: string | undefined, patch: Partial<ImageSlot>) { commit({ texts, images: images.map(item => item.id === id ? { ...item, ...patch } : item) }); }
  function undo() { const previous = history[history.length - 1]; if (!previous) return; setFuture(items => [snapshot(), ...items]); setHistory(items => items.slice(0, -1)); setTexts(previous.texts); setImages(previous.images); }
  function redo() { const next = future[0]; if (!next) return; setHistory(items => [...items, snapshot()]); setFuture(items => items.slice(1)); setTexts(next.texts); setImages(next.images); }

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

  async function saveDraft() {
    setSaving(true); setError("");
    const result = await supabase.from("website_editor_drafts").upsert({ page_slug: pageSlug, payload: { texts: texts.filter(item => item.page_slug === pageSlug), images: images.filter(item => item.page_slug === pageSlug) }, status: "Draft", updated_at: new Date().toISOString() }, { onConflict: "page_slug" });
    if (result.error) setError(result.error.message); else setToast("Website changes saved as a draft.");
    setSaving(false);
  }

  async function publish() {
    if (!confirm("Publish these website text and image changes now?")) return;
    setSaving(true); setError("");
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
    <header className="os-page-header"><div><div className="os-page-eyebrow">Live no-code website management</div><h1 className="os-page-title">Website Visual Editor</h1><p className="os-page-subtitle">Edit the actual CMS text and image slots used by the existing website. Drafts remain separate until you publish.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={undo} disabled={!history.length}><Undo2/>Undo</button><button className="os-btn soft" onClick={redo} disabled={!future.length}><Redo2/>Redo</button><a className="os-btn soft" href={previewPath} target="_blank"><Eye/>Open Website</a><button className="os-btn soft" onClick={() => void saveDraft()} disabled={saving || Boolean(selectedProduct)}><Save/>Save Draft</button><button className="os-btn primary" onClick={() => void publish()} disabled={saving || Boolean(selectedProduct)}><CheckCircle2/>Publish</button></div></header>
    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body"><strong>Website editor action failed</strong><p className="os-page-subtitle">{error}</p></div></section>}
    <section className="os-card product-detail-editor-callout"><div className="os-card-body"><div><strong>{selectedProduct ? `Editing Preview: ${selectedProduct.title}` : "Product Detail Pages"}</strong><p className="os-page-subtitle">Product pages use a dedicated editor for text, images, specifications, documents, CTAs and SEO. Select a product below to preview it, then open its complete editor.</p></div><div className="os-row-actions"><select className="os-field" value={selectedProduct ? pageSlug : ""} onChange={event => event.target.value && setPageSlug(event.target.value)}><option value="">Select product page…</option>{productOptions.map(product => <option key={product.id} value={`product::${product.id}::${product.slug}`}>{product.title}</option>)}</select><a className="os-btn soft" href={selectedProduct ? `/admin/products/${selectedProduct.id}` : "/admin/products"}>{selectedProduct ? "Open Complete Product Editor" : "Manage Product Pages"}</a></div></div></section>
    {!initialized && !loading && <section className="os-card"><div className="os-card-body"><div className="os-empty"><div className="os-empty-icon"><RefreshCw/></div><h3>Website content registry is empty</h3><p>Register the current website’s real text and image slots before editing. This imports the values already present in the website code.</p><button className="os-btn primary" onClick={() => void initializeFromWebsite()} disabled={saving}>Initialize from Current Website</button></div></div></section>}
    <div className="os-website-editor">
      <aside className="os-card os-panel-sticky"><div className="os-card-header"><div><h2>Page & Sections</h2><p>Actual registered website structure</p></div><ChevronDown/></div><div className="os-card-body"><label className="os-label"><span>Website Page</span><select value={pageSlug} onChange={event => { setPageSlug(event.target.value); setSectionSlug(""); }}><optgroup label="Website Pages">{pageOptions.map(([slug, label]) => <option value={slug} key={slug}>{label}</option>)}</optgroup>{productOptions.length > 0 && <optgroup label="Product Detail Pages">{productOptions.map(product => <option key={product.id} value={`product::${product.id}::${product.slug}`}>{product.title}</option>)}</optgroup>}</select></label><div style={{ display: "grid", gap: 6, marginTop: 14 }}>{sections.map(section => <button key={section} className={`os-tool-button ${sectionSlug === section ? "active" : ""}`} onClick={() => setSectionSlug(section)}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--os-green)" }}/>{pretty(section)}</button>)}{!sections.length && <p className="os-page-subtitle">No sections registered for this page.</p>}</div>{pageGlobalTexts.length > 0 && <div style={{ marginTop: 18 }}><div className="os-page-eyebrow">Global content</div><p className="os-page-subtitle">Header and footer content is managed in Website Text Manager.</p></div>}</div></aside>

      <main className="os-card visual-editor-canvas"><div className="os-card-header"><div><h2>Full Website Page Preview</h2><p>Scroll the complete live page; use the right panel to edit the selected section</p></div><div className="os-preview-device"><button className={device === "desktop" ? "active" : ""} onClick={() => setDevice("desktop")}><Laptop/></button><button className={device === "tablet" ? "active" : ""} onClick={() => setDevice("tablet")}><Tablet/></button><button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}><Smartphone/></button></div></div><div className="os-card-body visual-editor-preview-body"><div className={`visual-full-page-frame ${device}`}><iframe key={`${pageSlug}-${previewKey}`} ref={previewFrame} onLoad={() => { setPreviewLoading(false); window.setTimeout(applyDraftToPreview, 250); }} title={`${pageTitle} website preview`} src={`${previewPath}${previewPath.includes("?") ? "&" : "?"}cms_editor_preview=1&v=${previewKey}`}/>{previewLoading && <div className="visual-preview-loading visual-preview-overlay"><RefreshCw className="animate-spin"/><strong>Loading full website preview…</strong></div>}</div><section className="visual-draft-strip"><div><span>Live draft preview</span><strong>{sectionSlug ? pretty(sectionSlug) : "No section selected"}</strong></div><p>Text and image edits are applied inside the full-page preview immediately. Save Draft keeps changes private; Publish writes them to the live website.</p><div className="visual-draft-content">{selectedImages.map(slot => slot.current_url ? <img key={slot.id || slot.slot_key} src={slot.current_url} alt={slot.alt_text || slot.title}/> : null)}<div>{selectedTexts.map(entry => entry.field_type === "textarea" ? <p key={entry.id || entry.field_key}>{entry.value || <em>{entry.field_label} is empty</em>}</p> : <h3 key={entry.id || entry.field_key}>{entry.value || <em>{entry.field_label} is empty</em>}</h3>)}</div></div></section></div></main>

      <aside className="os-card os-panel-sticky"><div className="os-card-header"><div><h2>{sectionSlug ? pretty(sectionSlug) : "Section Settings"}</h2><p>Changes remain local until saved or published</p></div><ImageIcon/></div><div className="os-card-body"><div className="os-form-grid" style={{ gridTemplateColumns: "1fr" }}>{selectedTexts.map(entry => <label className="os-label" key={entry.id || entry.field_key}><span>{entry.field_label}</span>{entry.field_type === "textarea" ? <textarea value={entry.value} onChange={event => updateText(entry.id, event.target.value)}/> : <input value={entry.value} onChange={event => updateText(entry.id, event.target.value)}/>}<small>{entry.value.length} characters</small></label>)}{selectedImages.map(slot => <div className="os-card" style={{ boxShadow: "none" }} key={slot.id || slot.slot_key}><div className="os-card-body"><strong>{slot.title}</strong>{slot.current_url ? <img src={slot.current_url} alt={slot.alt_text} style={{ width: "100%", height: 150, objectFit: "contain", borderRadius: 12, background: "var(--os-surface-2)", marginTop: 10 }}/> : <div className="os-empty" style={{ minHeight: 120 }}><p>No image selected.</p></div>}<label className="os-label" style={{ marginTop: 10 }}><span>Image URL</span><input value={slot.current_url || ""} onChange={event => updateImage(slot.id, { current_url: event.target.value })}/></label><label className="os-label" style={{ marginTop: 10 }}><span>Alt Text</span><input value={slot.alt_text || ""} onChange={event => updateImage(slot.id, { alt_text: event.target.value })}/></label><button className="os-btn soft" style={{ width: "100%", marginTop: 10 }} onClick={() => { setImageTarget(slot.id || ""); imageInput.current?.click(); }}><UploadCloud/>Replace Image</button></div></div>)}{!selectedTexts.length && !selectedImages.length && <div className="os-empty"><h3>{selectedProduct ? "Use the Product Detail Editor" : "No editable fields"}</h3><p>{selectedProduct ? "The full live product page is visible in the center. Open the dedicated product editor to change its text, images, specifications, CTA and SEO." : "This section currently has no registered text or image slots."}</p>{selectedProduct && <a className="os-btn primary" href={`/admin/products/${selectedProduct.id}`}>Edit Product Page</a>}</div>}<div className="os-grid two"><button className="os-btn soft" onClick={duplicateSection}><Copy/>Duplicate</button><button className="os-btn danger" onClick={() => setError("Fixed website sections cannot be deleted from the visual editor. Use visibility controls in the section registry when available.")}><Trash2/>Delete</button></div></div></div></aside>
    </div>
    <input ref={imageInput} type="file" accept="image/*" hidden onChange={uploadImage}/>
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>The website editor state has been updated.</span></div></div></div>}
  </div></AdminShell>;
}
