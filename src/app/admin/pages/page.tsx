"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";

const pageOptions = ["home", "about", "products", "private-label", "certifications", "contact", "footer", "navbar"];

export default function PagesAdminPage() {
  const [pageSlug, setPageSlug] = useState("home");
  const [content, setContent] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { loadPage(pageSlug); }, [pageSlug]);

  async function loadPage(slug: string) {
    const { data } = await supabase.from("page_content").select("content").eq("page_slug", slug).maybeSingle();
    setContent(JSON.stringify(data?.content || {}, null, 2));
  }

  async function savePage() {
    setMessage("");
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(content); } catch { return setMessage("Invalid JSON. Please correct it before saving."); }
    setSaving(true);
    const { error } = await supabase.from("page_content").upsert({ page_slug: pageSlug, content: parsed, updated_at: new Date().toISOString() }, { onConflict: "page_slug" });
    setSaving(false);
    setMessage(error ? error.message : "Page content saved.");
  }

  return <AdminShell><div className="space-y-8"><div><p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">Website</p><h1 className="text-4xl lg:text-5xl font-black mt-2">Page Content Center</h1><p className="text-slate-500 mt-3">Central store for every page heading, paragraph, button, image URL and section setting.</p></div><section className="bg-white text-[#081325] border border-[#EFE3E5] rounded-[28px] p-6 lg:p-8"><label className="font-black">Select Page</label><select value={pageSlug} onChange={(e) => setPageSlug(e.target.value)} className="mt-2 w-full border rounded-xl p-4 bg-white">{pageOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select><div className="mt-6 rounded-2xl bg-[#FFF8F5] border border-[#EFE3E5] p-5"><p className="font-black">Content JSON</p><p className="text-xs text-slate-500 mt-2">Use named fields such as hero_title, hero_description, hero_image, section_title, button_text and button_link. This flexible content layer supports future page-builder fields without code changes.</p><textarea value={content} onChange={(e) => setContent(e.target.value)} className="mt-4 w-full min-h-[520px] border rounded-xl p-4 font-mono text-sm" /></div><div className="mt-5 flex items-center gap-4"><button onClick={savePage} disabled={saving} className="bg-[#C23B4A] text-white rounded-xl px-7 py-4 font-black">{saving ? "Saving..." : "Save Page Content"}</button>{message && <p className="text-sm font-bold">{message}</p>}</div></section></div></AdminShell>;
}
