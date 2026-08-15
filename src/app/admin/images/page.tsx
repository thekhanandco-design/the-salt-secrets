"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { adminFetch } from "@/lib/admin-client";
import { cmsImageRegistry, cmsPageLabels, type CmsImageSlotSeed } from "@/lib/cms-registry";
import { Eye, EyeOff, ExternalLink, Grid2X2, Image as ImageIcon, List, RefreshCw, Search, Sparkles, Upload } from "lucide-react";

type Slot = CmsImageSlotSeed & { id?: string };

type SlotPatch = Partial<Pick<Slot, "current_url" | "alt_text" | "is_active">>;
type ProductImageRow = { id: number; title: string; slug: string; image?: string | null; gallery?: string[] | null; status?: string | null };

function productImageSlots(rows: ProductImageRow[]): Slot[] {
  const slots: Slot[] = [];
  rows.forEach((product, productIndex) => {
    const section = `product-${product.id}`;
    const main = String(product.image || "/product-2.png");
    slots.push({ page_slug:"products", section_slug:section, slot_key:"main_image", title:`${product.title} — Main Product Image`, current_url:main, default_url:main, alt_text:product.title, recommended_width:1200, recommended_height:1200, display_order:5000 + productIndex * 10, is_active:true });
    (Array.isArray(product.gallery) ? product.gallery : []).filter(Boolean).slice(0,6).forEach((url, index) => slots.push({ page_slug:"products", section_slug:section, slot_key:`gallery_${index + 1}`, title:`${product.title} — Gallery ${index + 1}`, current_url:String(url), default_url:String(url), alt_text:`${product.title} gallery ${index + 1}`, recommended_width:1200, recommended_height:1200, display_order:5001 + productIndex * 10 + index, is_active:true }));
  });
  return slots;
}

function productIdFromSlot(slot: Slot) { const match = /^product-(\d+)$/.exec(slot.section_slug); return match ? Number(match[1]) : null; }


function slotKey(slot: Slot) {
  return `${slot.page_slug}:${slot.section_slug}:${slot.slot_key}`;
}

function routeFor(page: string) {
  if (page === "global" || page === "home") return "/";
  if (page === "privacy-policy") return "/privacy-policy";
  if (page === "terms-and-conditions") return "/terms-and-conditions";
  return `/${page}`;
}

export default function ImagesManagerPage() {
  const [slots, setSlots] = useState<Slot[]>(cmsImageRegistry);
  const [activePage, setActivePage] = useState("home");
  const [activeSection, setActiveSection] = useState("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => { void load(); }, []);

  async function load() {
    const [slotResult, productResult] = await Promise.all([
      supabase.from("cms_image_slots").select("*").order("display_order"),
      supabase.from("products").select("id,title,slug,image,gallery,status").order("display_order"),
    ]);
    const databaseSlots = (slotResult.data as Slot[]) || [];
    const dynamicProductSlots = productImageSlots((productResult.data || []) as ProductImageRow[]);
    const registry = [...cmsImageRegistry, ...dynamicProductSlots];
    const merged = registry.map((seed) => {
      const found = databaseSlots.find((row) => row.page_slug === seed.page_slug && row.section_slug === seed.section_slug && row.slot_key === seed.slot_key);
      return found ? { ...seed, ...found, current_url: found.current_url || seed.current_url } : seed;
    });
    const extras = databaseSlots.filter((row) => !merged.some((item) => item.page_slug === row.page_slug && item.section_slug === row.section_slug && item.slot_key === row.slot_key));
    setSlots([...merged, ...extras]);
  }

  async function persistSlot(slot: Slot, patch: SlotPatch) {
    const next = { ...slot, ...patch, updated_at: new Date().toISOString() } as Slot & { updated_at: string };
    delete (next as Partial<Slot>).id;
    const { error } = await supabase.from("cms_image_slots").upsert(next, { onConflict: "page_slug,section_slug,slot_key" });
    if (error) throw new Error(error.message);
    const productId = productIdFromSlot(slot);
    if (productId && patch.current_url) {
      if (slot.slot_key === "main_image") {
        const productUpdate = await supabase.from("products").update({ image:patch.current_url, updated_at:new Date().toISOString() }).eq("id", productId);
        if (productUpdate.error) throw new Error(productUpdate.error.message);
      } else if (slot.slot_key.startsWith("gallery_")) {
        const index = Math.max(0, Number(slot.slot_key.replace("gallery_", "")) - 1);
        const row = await supabase.from("products").select("gallery").eq("id", productId).maybeSingle();
        if (row.error) throw new Error(row.error.message);
        const gallery = Array.isArray(row.data?.gallery) ? [...row.data.gallery] : [];
        gallery[index] = patch.current_url;
        const productUpdate = await supabase.from("products").update({ gallery:gallery.filter(Boolean), updated_at:new Date().toISOString() }).eq("id", productId);
        if (productUpdate.error) throw new Error(productUpdate.error.message);
      }
    }
    setSlots((items) => items.map((item) => slotKey(item) === slotKey(slot) ? { ...item, ...patch } : item));
    window.dispatchEvent(new Event("salt-cms-updated"));
  }

  async function syncCurrentWebsite() {
    setSyncing(true);
    try {
      const [slotRows, productRows] = await Promise.all([
        supabase.from("cms_image_slots").select("page_slug,section_slug,slot_key,current_url,alt_text,is_active"),
        supabase.from("products").select("id,title,slug,image,gallery,status").order("display_order"),
      ]);
      if (slotRows.error || productRows.error) throw new Error(slotRows.error?.message || productRows.error?.message || "Image sync failed.");
      const currentMap = new Map((((slotRows.data as Slot[]) || [])).map((row) => [slotKey(row), row]));
      const registry = [...cmsImageRegistry, ...productImageSlots((productRows.data || []) as ProductImageRow[])];
      const payload = registry.map((item) => {
        const current = currentMap.get(slotKey(item));
        return {
          ...item,
          current_url: current?.current_url || item.current_url,
          alt_text: current?.alt_text || item.alt_text,
          is_active: current?.is_active !== false,
          updated_at: new Date().toISOString(),
        };
      });
      const { error } = await supabase.from("cms_image_slots").upsert(payload, { onConflict: "page_slug,section_slug,slot_key" });
      if (error) throw new Error(error.message);
      await load();
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert(`Website image map synchronized. ${payload.length} live/static image slots are now mapped, including product detail images.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Image synchronization failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function replace(slot: Slot, file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Maximum image size is 5MB.");
    const key = slotKey(slot);
    setUploading(key);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${slot.page_slug}/${slot.section_slug}/${Date.now()}-${safe}`;
      const upload = await supabase.storage.from("site-media").upload(path, file, { upsert: true });
      if (upload.error) throw new Error(upload.error.message);
      const url = supabase.storage.from("site-media").getPublicUrl(path).data.publicUrl;
      await persistSlot(slot, { current_url: url, is_active: true });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function saveGeneratedImage(slot: Slot, image: string) {
    let url = image;
    if (image.startsWith("data:")) {
      const blob = await fetch(image).then((response) => response.blob());
      const path = `${slot.page_slug}/${slot.section_slug}/${Date.now()}-${slot.slot_key}-ai.png`;
      const upload = await supabase.storage.from("site-media").upload(path, blob, { contentType: "image/png", upsert: true });
      if (upload.error) throw new Error(upload.error.message);
      url = supabase.storage.from("site-media").getPublicUrl(path).data.publicUrl;
    }
    await persistSlot(slot, { current_url: url, is_active: true });
  }

  async function generateWithAi(slot: Slot) {
    const key = slotKey(slot);
    setGenerating(key);
    try {
      const prompt = `Create a premium editorial product or brand image for The Salt Origin, an international Himalayan pink salt B2B brand. Website page: ${cmsPageLabels[slot.page_slug] || slot.page_slug}. Section: ${slot.section_slug}. Image purpose: ${slot.title}. Alt text/context: ${slot.alt_text || "premium Himalayan pink salt"}. Match the approved New Theme: refined white and warm blush space, deep wine and charcoal details, elegant Himalayan cues, international luxury export presentation, photorealistic commercial photography, clean negative space, no visible text, no fake certifications, no watermarks, no unrelated logos.`;
      const response = await adminFetch("/api/ai/image", { method: "POST", body: JSON.stringify({ prompt, size: "1536x1024" }) });
      const data = await response.json();
      if (!response.ok || !data.image) throw new Error(data.error || "AI image generation failed.");
      await saveGeneratedImage(slot, String(data.image));
      alert("AI image created and saved to this live website slot.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "AI image generation failed.");
    } finally {
      setGenerating(null);
    }
  }

  async function reset(slot: Slot) {
    try { await persistSlot(slot, { current_url: slot.default_url, is_active: true }); }
    catch (error) { alert(error instanceof Error ? error.message : "Could not reset image."); }
  }

  async function toggleVisibility(slot: Slot) {
    try { await persistSlot(slot, { is_active: slot.is_active === false }); }
    catch (error) { alert(error instanceof Error ? error.message : "Could not update image visibility."); }
  }

  const pages = useMemo(() => {
    const values = Array.from(new Set(slots.map((slot) => slot.page_slug)));
    return values.sort((a, b) => a === "home" ? -1 : b === "home" ? 1 : a === "global" ? -1 : b === "global" ? 1 : a.localeCompare(b));
  }, [slots]);

  const counts = useMemo(() => Object.fromEntries(pages.map((page) => [page, slots.filter((slot) => slot.page_slug === page).length])), [pages, slots]);
  const sections = useMemo(() => ["all", ...Array.from(new Set(slots.filter((slot) => slot.page_slug === activePage).map((slot) => slot.section_slug)))], [slots, activePage]);

  useEffect(() => { setActiveSection("all"); }, [activePage]);

  const visible = useMemo(() => slots.filter((slot) => {
    const query = search.toLowerCase();
    return slot.page_slug === activePage &&
      (activeSection === "all" || slot.section_slug === activeSection) &&
      (!query || `${slot.title} ${slot.section_slug} ${slot.slot_key} ${slot.alt_text || ""}`.toLowerCase().includes(query));
  }), [slots, activePage, activeSection, search]);

  return (
    <AdminShell>
      <div className="os-page legacy-unified-page images-manager-page space-y-5">
        <header className="os-page-header">
          <div><div className="os-page-eyebrow">Website Visual Assets</div><h1 className="os-page-title">Images Manager</h1><p className="os-page-subtitle">Select a website page and section, confirm the image that is live, then replace, upload, create with AI, hide or restore it.</p></div>
          <div className="os-page-actions"><button onClick={syncCurrentWebsite} disabled={syncing} className="os-btn soft"><RefreshCw className={syncing ? "animate-spin" : ""}/>{syncing ? "Syncing…" : "Sync Website Images"}</button><a className="os-btn primary" href={routeFor(activePage)} target="_blank" rel="noreferrer"><ExternalLink/>Open Live Page</a></div>
        </header>

        <div className="image-manager-shell rounded-[24px] border overflow-hidden">
          <div className="grid lg:grid-cols-[230px_1fr] min-h-[720px]">
            <aside className="image-manager-sidebar border-r p-4">
              <p className="image-manager-label">Website Pages</p>
              <div className="space-y-1">{pages.map((page) => <button key={page} onClick={() => setActivePage(page)} className={`image-page-button w-full flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold ${activePage === page ? "active" : ""}`}><span>{cmsPageLabels[page] || page}</span><span className="image-count-chip">{counts[page]}</span></button>)}</div>
              <div className="image-upload-note mt-7 rounded-2xl border p-4 text-xs leading-6"><strong>Easy image replacement</strong><span>1. Select page<br/>2. Select section<br/>3. Check current live preview<br/>4. Upload / Replace or Create with AI<br/>5. Open Live Page to verify</span></div>
            </aside>

            <section className="p-4 lg:p-6 min-w-0">
              <div className="image-manager-toolbar">
                <div><div className="os-page-eyebrow">{cmsPageLabels[activePage] || activePage}</div><h2>{activeSection === "all" ? "All Image Sections" : activeSection.replaceAll("_", " ")}</h2><p>{visible.length} mapped image slot{visible.length === 1 ? "" : "s"}</p></div>
                <div className="image-manager-tools"><label className="os-search-field"><Search/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search image slots…"/></label><select className="os-field" value={activeSection} onChange={(event) => setActiveSection(event.target.value)}>{sections.map((section) => <option value={section} key={section}>{section === "all" ? "All sections" : section.replaceAll("_", " ")}</option>)}</select><div className="os-segmented"><button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2/></button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view"><List/></button></div></div>
              </div>

              <div className={view === "grid" ? "image-slot-grid-live" : "space-y-4"}>
                {visible.map((slot) => {
                  const key = slotKey(slot);
                  const preview = slot.current_url || slot.default_url;
                  const live = slot.is_active !== false;
                  return <article key={key} className={`image-slot-card-live ${view === "list" ? "is-list" : ""} ${live ? "" : "is-hidden"}`}>
                    <div className="image-live-preview">{preview ? <img src={preview} alt={slot.alt_text || slot.title}/> : <ImageIcon/>}<span className={`image-live-status ${live ? "live" : "hidden"}`}>{live ? <><Eye/>LIVE ON WEBSITE</> : <><EyeOff/>HIDDEN</>}</span></div>
                    <div className="image-slot-content"><div className="image-slot-heading"><div><small>{slot.section_slug.replaceAll("_", " ")} · {slot.slot_key.replaceAll("_", " ")}</small><h3>{slot.title}</h3></div><span>{slot.recommended_width} × {slot.recommended_height}px</span></div><label className="os-label"><span>Alt Text</span><input value={slot.alt_text || ""} onChange={(event) => setSlots((items) => items.map((item) => slotKey(item) === key ? { ...item, alt_text: event.target.value } : item))} onBlur={() => void persistSlot(slot, { alt_text: slots.find((item) => slotKey(item) === key)?.alt_text || "" })}/></label><div className="image-slot-actions-live"><label className="os-btn primary"><Upload/>{uploading === key ? "Uploading…" : "Upload / Replace"}<input type="file" accept="image/*" hidden disabled={generating === key} onChange={(event) => void replace(slot, event.target.files?.[0])}/></label><button className="os-btn soft" type="button" onClick={() => void generateWithAi(slot)} disabled={Boolean(generating) || uploading === key}><Sparkles className={generating === key ? "animate-pulse" : ""}/>{generating === key ? "Creating…" : "Create with AI"}</button><button className="os-btn soft" type="button" onClick={() => void toggleVisibility(slot)}>{live ? <EyeOff/> : <Eye/>}{live ? "Hide" : "Show"}</button><button className="os-btn soft" type="button" onClick={() => void reset(slot)} title="Reset to original"><RefreshCw/>Reset</button></div></div>
                  </article>;
                })}
              </div>
              {!visible.length && <div className="os-empty"><div className="os-empty-icon"><ImageIcon/></div><h3>No mapped images found</h3><p>Try another page, section or search term.</p></div>}
            </section>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
