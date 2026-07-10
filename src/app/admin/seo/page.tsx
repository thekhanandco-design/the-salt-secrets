"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";

type SeoItem = { id: number; page_slug: string; meta_title: string; meta_description: string; og_image?: string };

const defaultPages = ["home", "about", "products", "private-label", "certifications", "contact"];

export default function SeoPage() {
  const [items, setItems] = useState<SeoItem[]>([]);
  const [selected, setSelected] = useState(defaultPages[0]);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogImage, setOgImage] = useState("");

  useEffect(() => { loadSeo(); }, []);

  async function loadSeo() {
    const { data } = await supabase.from("seo_settings").select("*").order("page_slug", { ascending: true });
    const rows = (data as SeoItem[]) || [];
    setItems(rows);
    const first = rows.find((item) => item.page_slug === selected);
    if (first) fillForm(first);
  }

  function fillForm(item: SeoItem) {
    setSelected(item.page_slug);
    setMetaTitle(item.meta_title || "");
    setMetaDescription(item.meta_description || "");
    setOgImage(item.og_image || "");
  }

  async function saveSeo() {
    const existing = items.find((item) => item.page_slug === selected);
    const payload = { page_slug: selected, meta_title: metaTitle, meta_description: metaDescription, og_image: ogImage };
    const { error } = existing
      ? await supabase.from("seo_settings").update(payload).eq("id", existing.id)
      : await supabase.from("seo_settings").insert([payload]);
    if (error) return alert("Run supabase/cms-schema.sql first. " + error.message);
    await loadSeo();
    alert("SEO saved");
  }

  return (
    <AdminShell>
      <div className="space-y-8">
        <div>
          <p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">SEO</p>
          <h1 className="text-4xl lg:text-5xl font-black mt-2">SEO Manager</h1>
          <p className="text-slate-600 mt-3">Prepare page titles, descriptions and OG images for future SEO integration.</p>
        </div>
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <div className="rounded-[28px] bg-white border border-[#EFE3E5] p-5">
            <h2 className="font-black mb-4">Pages</h2>
            <div className="space-y-2">
              {[...new Set([...defaultPages, ...items.map((item) => item.page_slug)])].map((page) => (
                <button key={page} onClick={() => { const item = items.find((row) => row.page_slug === page); item ? fillForm(item) : (setSelected(page), setMetaTitle(""), setMetaDescription(""), setOgImage("")); }} className={`w-full text-left rounded-xl px-4 py-3 font-bold ${selected === page ? "bg-[#C23B4A] text-white" : "bg-[#FFF8F5]"}`}>{page}</button>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] bg-white border border-[#EFE3E5] p-6">
            <div className="space-y-5">
              <div><label className="font-black block mb-2">Page Slug</label><input value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full border rounded-xl p-4" /></div>
              <div><label className="font-black block mb-2">Meta Title</label><input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full border rounded-xl p-4" /></div>
              <div><label className="font-black block mb-2">Meta Description</label><textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="w-full border rounded-xl p-4 h-36" /></div>
              <div><label className="font-black block mb-2">OG Image URL</label><input value={ogImage} onChange={(e) => setOgImage(e.target.value)} className="w-full border rounded-xl p-4" /></div>
              <button onClick={saveSeo} className="bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-black">Save SEO</button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
