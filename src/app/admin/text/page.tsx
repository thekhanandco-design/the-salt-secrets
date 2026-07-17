"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { cmsPageLabels, cmsTextRegistry, type CmsTextSeed } from "@/lib/cms-registry";
import { Languages, RefreshCw, Save, Search } from "lucide-react";

type Language = { code: string; name: string; native_name: string; direction: "ltr" | "rtl"; enabled: boolean };
type Translation = { language_code: string; value: string | null };
type Entry = CmsTextSeed & { id?: string; cms_text_translations?: Translation[] };

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

export default function TextManagerPage() {
  const [languages,setLanguages]=useState<Language[]>(fallbackLanguages);
  const [entries,setEntries]=useState<Entry[]>(cmsTextRegistry);
  const [language,setLanguage]=useState("en");
  const [page,setPage]=useState("home");
  const [query,setQuery]=useState("");
  const [values,setValues]=useState<Record<string,string>>({});
  const [saving,setSaving]=useState<string|null>(null);
  const [syncing,setSyncing]=useState(false);

  useEffect(()=>{ void load(); },[]);

  async function load(){
    const [{data:langs},{data:rows}] = await Promise.all([
      supabase.from("cms_languages").select("*").eq("enabled",true).order("display_order"),
      supabase.from("cms_text_entries").select("*,cms_text_translations(language_code,value)").order("display_order")
    ]);
    if (langs?.length) setLanguages(langs as Language[]);
    const db = (rows as Entry[]) || [];
    const merged: Entry[] = cmsTextRegistry.map((seed): Entry => {
      const found = db.find((row) => row.page_slug === seed.page_slug && row.section_slug === seed.section_slug && row.field_key === seed.field_key);
      return found ? { ...seed, ...found } : seed;
    });
    const extras = db.filter((row) => !merged.some((item) => item.page_slug === row.page_slug && item.section_slug === row.section_slug && item.field_key === row.field_key));
    const all: Entry[] = [...merged, ...extras];
    setEntries(all);
    const next:Record<string,string>={};
    all.forEach((row)=>{
      if (row.id) (row.cms_text_translations||[]).forEach((t: Translation)=>{ next[`${row.page_slug}:${row.section_slug}:${row.field_key}:${t.language_code}`]=t.value||""; });
    });
    setValues(next);
  }

  async function syncCurrentWebsite(){
    setSyncing(true);
    const { error } = await supabase.from("cms_text_entries").upsert(cmsTextRegistry, { onConflict: "page_slug,section_slug,field_key" });
    if (error) { setSyncing(false); return alert(`${error.message}\n\nRun CMS-REDESIGN-V3.sql and confirm you are logged in.`); }
    const { data: synced } = await supabase.from("cms_text_entries").select("id,page_slug,section_slug,field_key,default_value");
    const english = (synced || []).map((row) => ({ entry_id: row.id, language_code: "en", value: row.default_value }));
    const { error: transError } = await supabase.from("cms_text_translations").upsert(english, { onConflict: "entry_id,language_code" });
    setSyncing(false);
    if (transError) return alert(transError.message);
    await load();
    alert("Current website text synced to CMS.");
  }

  const pages=useMemo(()=>Array.from(new Set(entries.map(e=>e.page_slug))),[entries]);
  const visible=useMemo(()=>entries.filter(e=>e.page_slug===page && (!query || `${e.field_label} ${e.section_slug} ${e.field_key}`.toLowerCase().includes(query.toLowerCase()))),[entries,page,query]);
  const grouped=useMemo(()=>visible.reduce<Record<string,Entry[]>>((a,e)=>{(a[e.section_slug] ||= []).push(e); return a;},{}),[visible]);

  function localKey(entry:Entry, lang=language){ return `${entry.page_slug}:${entry.section_slug}:${entry.field_key}:${lang}`; }
  function getValue(entry:Entry){
    const direct = values[localKey(entry)];
    if (direct !== undefined) return direct;
    const english = values[localKey(entry,"en")];
    return english !== undefined ? english : entry.default_value;
  }

  async function ensureEntry(entry:Entry){
    if (entry.id) return entry.id;
    const { data, error } = await supabase.from("cms_text_entries").upsert(entry, { onConflict: "page_slug,section_slug,field_key" }).select("id").single();
    if (error) throw error;
    return data.id as string;
  }

  async function save(entry:Entry){
    const key=localKey(entry);
    setSaving(key);
    try {
      const id = await ensureEntry(entry);
      const value=getValue(entry);
      const {error}=await supabase.from("cms_text_translations").upsert({entry_id:id,language_code:language,value,updated_at:new Date().toISOString()},{onConflict:"entry_id,language_code"});
      if(error) throw error;
      setEntries((items)=>items.map((item)=>item.page_slug===entry.page_slug&&item.section_slug===entry.section_slug&&item.field_key===entry.field_key?{...item,id}:item));
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert("Text saved successfully.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save text");
    } finally { setSaving(null); }
  }

  const activeLang=languages.find(l=>l.code===language) || fallbackLanguages[0];

  return <AdminShell><div className="space-y-5">
    <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4"><div><p className="uppercase tracking-[4px] text-blue-400 font-black text-xs">Content Manager</p><h1 className="text-4xl font-black mt-2">Text Manager</h1><p className="text-slate-400 mt-2">Current website headings, paragraphs, buttons and labels appear here for direct editing.</p></div><div className="flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search text fields..." className="w-72 max-w-[70vw] rounded-xl border pl-11 pr-4 py-3"/></div><button onClick={syncCurrentWebsite} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 px-4 py-3 font-black text-sm"><RefreshCw className={`w-4 h-4 ${syncing?"animate-spin":""}`}/>{syncing?"Syncing...":"Sync Current Website"}</button></div></div>

    <div className="grid lg:grid-cols-[220px_1fr] rounded-[24px] border border-white/10 bg-[#0b1728] overflow-hidden min-h-[700px]">
      <aside className="bg-[#081321] border-r border-white/10 p-4"><p className="text-[10px] uppercase tracking-[3px] text-slate-500 font-black px-2 mb-3">Website Pages</p><div className="space-y-1">{pages.map(p=><button key={p} onClick={()=>setPage(p)} className={`w-full text-left px-3 py-3 rounded-xl font-bold text-sm ${page===p?"bg-blue-600 text-white":"text-slate-300 hover:bg-white/5"}`}>{cmsPageLabels[p]||p}</button>)}</div></aside>
      <section className="p-4 lg:p-6 space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[#101e31] p-4"><div className="flex items-center gap-3 mb-3"><Languages className="text-blue-400"/><h2 className="font-black">Editing language</h2></div><div className="flex flex-wrap gap-2">{languages.map(l=><button key={l.code} onClick={()=>setLanguage(l.code)} className={`px-3 py-2 rounded-lg font-bold text-xs ${language===l.code?"bg-blue-600 text-white":"bg-[#0b1728] text-slate-300 border border-white/10"}`}>{l.native_name}</button>)}</div><p className="text-[11px] text-slate-500 mt-3">Missing translations automatically use English. {activeLang.direction === "rtl" ? "This language is right-to-left." : ""}</p></div>

        {Object.entries(grouped).map(([section,rows])=><section key={section} className="rounded-2xl border border-white/10 bg-[#101e31] p-5"><div className="mb-5"><p className="text-[10px] uppercase tracking-[4px] text-blue-400 font-black">{cmsPageLabels[page] || page}</p><h2 className="text-xl font-black mt-1 capitalize">{section.replaceAll("_"," ")} Section</h2></div><div className="space-y-5">{rows.map(entry=>{
          const k=localKey(entry);
          return <div key={`${entry.page_slug}-${entry.section_slug}-${entry.field_key}`} className="border-b border-white/10 pb-5 last:border-0 last:pb-0"><div className="flex items-center justify-between gap-3 mb-2"><div><label className="font-black text-sm">{entry.field_label}</label><p className="text-[11px] text-slate-500">{entry.field_key}</p></div><button onClick={()=>save(entry)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black"><Save className="w-4 h-4"/>{saving===k?"Saving...":"Save"}</button></div>{entry.field_type==="textarea"?<textarea dir={activeLang.direction} value={getValue(entry)} onChange={e=>setValues(v=>({...v,[k]:e.target.value}))} className="w-full min-h-28 border rounded-xl p-4"/>:<input dir={activeLang.direction} value={getValue(entry)} onChange={e=>setValues(v=>({...v,[k]:e.target.value}))} className="w-full border rounded-xl p-4"/>}</div>})}</div></section>)}
      </section>
    </div>
  </div></AdminShell>;
}
