"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { cmsImageRegistry, cmsPageLabels, type CmsImageSlotSeed } from "@/lib/cms-registry";
import { Grid2X2, Image as ImageIcon, List, RefreshCw, Search, Trash2, Upload } from "lucide-react";

type Slot = CmsImageSlotSeed & { id?: string };

export default function ImagesManagerPage() {
  const [slots, setSlots] = useState<Slot[]>(cmsImageRegistry);
  const [activePage, setActivePage] = useState("home");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data } = await supabase.from("cms_image_slots").select("*").order("display_order");
    const db = (data as Slot[]) || [];
    const merged = cmsImageRegistry.map((seed) => {
      const found = db.find((row) => row.page_slug === seed.page_slug && row.section_slug === seed.section_slug && row.slot_key === seed.slot_key);
      return found ? { ...seed, ...found, current_url: found.current_url || seed.current_url } : seed;
    });
    const extras = db.filter((row) => !merged.some((item) => item.page_slug === row.page_slug && item.section_slug === row.section_slug && item.slot_key === row.slot_key));
    setSlots([...merged, ...extras]);
  }

  async function syncCurrentWebsite() {
    setSyncing(true);
    const payload = cmsImageRegistry.map((item) => ({ ...item, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("cms_image_slots").upsert(payload, { onConflict: "page_slug,section_slug,slot_key" });
    setSyncing(false);
    if (error) return alert(`${error.message}\n\nMake sure you are logged in and have run CMS-REDESIGN-V3.sql.`);
    await load();
    alert("Current website images synced to CMS.");
  }

  async function replace(slot: Slot, file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Maximum image size is 5MB.");
    const key = `${slot.page_slug}:${slot.section_slug}:${slot.slot_key}`;
    setUploading(key);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${slot.page_slug}/${slot.section_slug}/${Date.now()}-${safe}`;
    const { error: uploadError } = await supabase.storage.from("site-media").upload(path, file, { upsert: true });
    if (uploadError) {
      setUploading(null);
      return alert(`${uploadError.message}\n\nRun CMS-REDESIGN-V3.sql and confirm the site-media bucket exists.`);
    }
    const url = supabase.storage.from("site-media").getPublicUrl(path).data.publicUrl;
    const payload = { ...slot, current_url: url, updated_at: new Date().toISOString() };
    delete (payload as Partial<Slot>).id;
    const { error } = await supabase.from("cms_image_slots").upsert(payload, { onConflict: "page_slug,section_slug,slot_key" });
    setUploading(null);
    if (error) return alert(error.message);
    setSlots((items) => items.map((item) => item.page_slug === slot.page_slug && item.section_slug === slot.section_slug && item.slot_key === slot.slot_key ? { ...item, current_url: url } : item));
    window.dispatchEvent(new Event("salt-cms-updated"));
  }

  async function reset(slot: Slot) {
    const payload = { ...slot, current_url: slot.default_url, updated_at: new Date().toISOString() };
    delete (payload as Partial<Slot>).id;
    const { error } = await supabase.from("cms_image_slots").upsert(payload, { onConflict: "page_slug,section_slug,slot_key" });
    if (error) return alert(error.message);
    setSlots((items) => items.map((item) => item.page_slug === slot.page_slug && item.section_slug === slot.section_slug && item.slot_key === slot.slot_key ? { ...item, current_url: slot.default_url } : item));
  }

  const pages = useMemo(() => Array.from(new Set(slots.map((slot) => slot.page_slug))), [slots]);
  const counts = useMemo(() => Object.fromEntries(pages.map((page) => [page, slots.filter((slot) => slot.page_slug === page).length])), [pages, slots]);
  const visible = useMemo(() => slots.filter((slot) => {
    const q = search.toLowerCase();
    return slot.page_slug === activePage && (!q || `${slot.title} ${slot.section_slug} ${slot.slot_key}`.toLowerCase().includes(q));
  }), [slots, activePage, search]);

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div><p className="text-blue-400 uppercase tracking-[4px] text-xs font-black">Visual Content</p><h1 className="text-4xl font-black mt-2">Images Manager</h1><p className="text-slate-400 mt-2">All current website images are visible here. Replace any image without opening code.</p></div>
          <div className="flex flex-wrap gap-2">
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search images..." className="w-72 max-w-[70vw] rounded-xl border pl-11 pr-4 py-3"/></div>
            <button onClick={syncCurrentWebsite} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 px-4 py-3 font-black text-sm"><RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}/>{syncing ? "Syncing..." : "Sync Current Website"}</button>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#0b1728] overflow-hidden shadow-2xl">
          <div className="grid lg:grid-cols-[220px_1fr] min-h-[680px]">
            <aside className="border-r border-white/10 p-4 bg-[#081321]">
              <p className="text-xs uppercase tracking-[3px] text-slate-500 font-black px-2 mb-3">Website Pages</p>
              <div className="space-y-1">
                {pages.map((page) => <button key={page} onClick={()=>setActivePage(page)} className={`w-full flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold ${activePage===page?"bg-blue-600 text-white":"text-slate-300 hover:bg-white/5"}`}><span>{cmsPageLabels[page] || page}</span><span className="rounded-md bg-black/20 px-2 py-0.5 text-xs">{counts[page]}</span></button>)}
              </div>
              <div className="mt-7 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-4 text-xs text-slate-400 leading-6"><p className="font-black text-blue-300 mb-2">Image upload</p>JPG, PNG or WebP<br/>Maximum 5MB<br/>Recommended size appears on every card.</div>
            </aside>

            <section className="p-4 lg:p-6">
              <div className="flex items-center justify-between mb-5">
                <div><h2 className="text-xl font-black">{cmsPageLabels[activePage] || activePage} Images</h2><p className="text-sm text-slate-500">{visible.length} editable image slots</p></div>
                <div className="flex rounded-xl border border-white/10 overflow-hidden"><button onClick={()=>setView("grid")} className={`p-3 ${view==="grid"?"bg-blue-600":"bg-[#101e31]"}`}><Grid2X2 className="w-4 h-4"/></button><button onClick={()=>setView("list")} className={`p-3 ${view==="list"?"bg-blue-600":"bg-[#101e31]"}`}><List className="w-4 h-4"/></button></div>
              </div>

              <div className={view === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-4"}>
                {visible.map((slot) => {
                  const key = `${slot.page_slug}:${slot.section_slug}:${slot.slot_key}`;
                  const preview = slot.current_url || slot.default_url;
                  return <article key={key} className={`rounded-2xl border border-white/10 bg-[#101e31] p-3 ${view === "list" ? "grid md:grid-cols-[220px_1fr_auto] gap-5 items-center" : ""}`}>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#07111f] flex items-center justify-center">{preview ? <img src={preview} alt={slot.alt_text || slot.title} className="w-full h-full object-contain"/> : <ImageIcon className="w-10 h-10 text-slate-600"/>}</div>
                    <div className={view === "grid" ? "pt-3" : ""}><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-sm">{slot.title}</h3><p className="text-[11px] text-slate-500 mt-1">{slot.section_slug.replaceAll("_", " ")}</p></div><span className="text-[10px] rounded-full bg-blue-500/10 text-blue-300 px-2 py-1">{cmsPageLabels[slot.page_slug] || slot.page_slug}</span></div><p className="text-[11px] text-amber-400 mt-2">Recommended: {slot.recommended_width} × {slot.recommended_height}px</p></div>
                    <div className={`flex gap-2 ${view === "grid" ? "mt-3" : ""}`}><label className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-xs font-black cursor-pointer"><Upload className="w-4 h-4"/>{uploading===key?"Uploading...":"Replace Image"}<input type="file" accept="image/*" className="hidden" onChange={(e)=>replace(slot,e.target.files?.[0])}/></label><button onClick={()=>reset(slot)} title="Reset to original" className="rounded-xl border border-white/10 px-3 text-slate-300"><RefreshCw className="w-4 h-4"/></button></div>
                  </article>;
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
