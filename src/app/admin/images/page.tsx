"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { Grid2X2, Image as ImageIcon, List, Search, Trash2, Upload } from "lucide-react";

type Slot = {
  id: string;
  page_slug: string;
  section_slug: string;
  slot_key: string;
  title: string;
  current_url: string | null;
  default_url: string | null;
  alt_text: string | null;
  recommended_width: number | null;
  recommended_height: number | null;
  display_order: number;
  is_active: boolean;
};

const labels: Record<string, string> = {
  global: "Footer / Others",
  home: "Homepage",
  about: "About Page",
  products: "Products Page",
  "private-label": "Private Label",
  certifications: "Certifications",
  contact: "Contact Page",
  blog: "Blog Page",
};

export default function ImagesManagerPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activePage, setActivePage] = useState("home");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data, error } = await supabase
      .from("cms_image_slots")
      .select("*")
      .order("page_slug")
      .order("section_slug")
      .order("display_order");
    if (error) alert(error.message);
    const next = (data as Slot[]) || [];
    setSlots(next);
    if (!next.some((slot) => slot.page_slug === activePage) && next[0]) setActivePage(next[0].page_slug);
  }

  async function replace(slot: Slot, file?: File) {
    if (!file) return;
    setUploading(slot.id);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${slot.page_slug}/${slot.section_slug}/${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("site-media").upload(path, file, { upsert: true });
    if (error) { setUploading(null); return alert(error.message); }
    const url = supabase.storage.from("site-media").getPublicUrl(path).data.publicUrl;
    const { error: updateError } = await supabase
      .from("cms_image_slots")
      .update({ current_url: url, updated_at: new Date().toISOString() })
      .eq("id", slot.id);
    setUploading(null);
    if (updateError) return alert(updateError.message);
    setSlots((items) => items.map((item) => item.id === slot.id ? { ...item, current_url: url } : item));
  }

  async function remove(slot: Slot) {
    if (!confirm(`Remove ${slot.title}?`)) return;
    const { error } = await supabase.from("cms_image_slots").update({ current_url: "" }).eq("id", slot.id);
    if (error) return alert(error.message);
    setSlots((items) => items.map((item) => item.id === slot.id ? { ...item, current_url: "" } : item));
  }

  const pages = useMemo(() => Array.from(new Set(slots.map((slot) => slot.page_slug))), [slots]);
  const counts = useMemo(() => Object.fromEntries(pages.map((page) => [page, slots.filter((slot) => slot.page_slug === page).length])), [pages, slots]);
  const visible = useMemo(() => slots.filter((slot) => {
    const matchesPage = slot.page_slug === activePage;
    const q = search.toLowerCase();
    return matchesPage && (!q || `${slot.title} ${slot.section_slug} ${slot.slot_key}`.toLowerCase().includes(q));
  }), [slots, activePage, search]);

  return (
    <AdminShell>
      <div className="rounded-[28px] border border-white/10 bg-[#0d1828] text-slate-100 overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-black">Images Manager</h1>
            <p className="text-slate-400 mt-1">Manage every live website image directly from Supabase.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search images..." className="w-72 max-w-[60vw] rounded-xl border border-white/10 bg-[#101e31] pl-11 pr-4 py-3 text-white"/></div>
            <label className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-black cursor-pointer"><Upload className="w-4 h-4"/>Upload New<input type="file" accept="image/*" className="hidden"/></label>
          </div>
        </div>

        <div className="grid lg:grid-cols-[230px_1fr] min-h-[680px]">
          <aside className="border-r border-white/10 p-5 bg-[#091321]">
            <p className="text-sm font-black mb-4">Website Sections</p>
            <div className="space-y-2">
              {pages.map((page) => (
                <button key={page} onClick={()=>setActivePage(page)} className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold ${activePage===page?"bg-blue-600 text-white":"hover:bg-white/5 text-slate-300"}`}>
                  <span>{labels[page] || page}</span><span className="rounded-md bg-black/20 px-2 py-0.5 text-xs">{counts[page]}</span>
                </button>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-blue-400/20 bg-blue-500/5 p-4 text-xs text-slate-400 leading-6">
              <p className="font-black text-blue-300 mb-2">Upload guide</p>
              JPG, PNG or WebP<br/>Maximum 5MB<br/>Use the recommended dimensions shown on each card.
            </div>
          </aside>

          <section className="p-5 lg:p-7">
            <div className="flex items-center justify-between mb-5">
              <div><h2 className="text-xl font-black">{labels[activePage] || activePage} Images</h2><p className="text-sm text-slate-500">{visible.length} image slots connected to the live website</p></div>
              <div className="flex rounded-xl border border-white/10 overflow-hidden"><button onClick={()=>setView("grid")} className={`p-3 ${view==="grid"?"bg-blue-600":"bg-[#101e31]"}`}><Grid2X2 className="w-4 h-4"/></button><button onClick={()=>setView("list")} className={`p-3 ${view==="list"?"bg-blue-600":"bg-[#101e31]"}`}><List className="w-4 h-4"/></button></div>
            </div>

            <div className={view === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-4"}>
              {visible.map((slot) => {
                const preview = slot.current_url || slot.default_url || "";
                return (
                  <article key={slot.id} className={`rounded-2xl border border-white/10 bg-[#111f32] p-4 ${view === "list" ? "grid md:grid-cols-[240px_1fr_auto] gap-5 items-center" : ""}`}>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#091321] flex items-center justify-center">
                      {preview ? <img src={preview} alt={slot.alt_text || slot.title} className="w-full h-full object-contain"/> : <ImageIcon className="w-10 h-10 text-slate-600"/>}
                    </div>
                    <div className={view === "grid" ? "mt-4" : ""}>
                      <h3 className="font-black">{slot.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{slot.section_slug} · {slot.slot_key}</p>
                      <p className="text-xs text-amber-400 mt-2">{slot.recommended_width || "—"} × {slot.recommended_height || "—"} px</p>
                    </div>
                    <div className={`flex gap-2 ${view === "grid" ? "mt-4" : ""}`}>
                      <label className="flex-1 inline-flex justify-center items-center gap-2 rounded-xl bg-slate-700 px-4 py-3 text-xs font-black cursor-pointer"><Upload className="w-4 h-4"/>{uploading===slot.id?"Uploading...":"Replace"}<input type="file" accept="image/*" className="hidden" onChange={(e)=>replace(slot,e.target.files?.[0])}/></label>
                      <button onClick={()=>remove(slot)} className="rounded-xl border border-red-500/30 px-4 text-red-400"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
