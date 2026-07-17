"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { Languages, Save, Search } from "lucide-react";

type Language = { code: string; name: string; native_name: string; direction: "ltr" | "rtl"; enabled: boolean };
type Translation = { language_code: string; value: string | null };
type Entry = { id: string; page_slug: string; section_slug: string; field_key: string; field_label: string; field_type: string; default_value: string | null; display_order: number; cms_text_translations: Translation[] };

const labels: Record<string,string> = { global:"Global Website", home:"Homepage", about:"About Page", products:"Products Page", "private-label":"Private Label Page", certifications:"Certifications Page", contact:"Contact Page" };

export default function TextManagerPage() {
  const [languages,setLanguages]=useState<Language[]>([]);
  const [entries,setEntries]=useState<Entry[]>([]);
  const [language,setLanguage]=useState("en");
  const [page,setPage]=useState("home");
  const [query,setQuery]=useState("");
  const [values,setValues]=useState<Record<string,string>>({});
  const [saving,setSaving]=useState<string|null>(null);

  useEffect(()=>{ load(); },[]);
  async function load(){
    const [{data:langs},{data:rows,error}] = await Promise.all([
      supabase.from("cms_languages").select("*").eq("enabled",true).order("display_order"),
      supabase.from("cms_text_entries").select("*,cms_text_translations(language_code,value)").order("page_slug").order("section_slug").order("display_order")
    ]);
    if(error) alert(error.message);
    setLanguages((langs as Language[])||[]);
    const e=(rows as Entry[])||[]; setEntries(e);
    const next:Record<string,string>={};
    e.forEach((row)=>{ (row.cms_text_translations||[]).forEach((t)=>{next[`${row.id}:${t.language_code}`]=t.value||"";}); });
    setValues(next);
  }
  const pages=useMemo(()=>Array.from(new Set(entries.map(e=>e.page_slug))),[entries]);
  const visible=useMemo(()=>entries.filter(e=>e.page_slug===page && (!query || `${e.field_label} ${e.section_slug} ${e.field_key}`.toLowerCase().includes(query.toLowerCase()))),[entries,page,query]);
  const grouped=useMemo(()=>visible.reduce<Record<string,Entry[]>>((a,e)=>{(a[e.section_slug] ||= []).push(e); return a;},{}),[visible]);
  function getValue(entry:Entry){ const key=`${entry.id}:${language}`; if(values[key]!==undefined) return values[key]; const en=values[`${entry.id}:en`]; return en!==undefined?en:(entry.default_value||""); }
  async function save(entry:Entry){
    setSaving(entry.id); const value=getValue(entry);
    const {error}=await supabase.from("cms_text_translations").upsert({entry_id:entry.id,language_code:language,value,updated_at:new Date().toISOString()},{onConflict:"entry_id,language_code"});
    setSaving(null); if(error) alert(error.message); else alert("Text saved");
  }
  const activeLang=languages.find(l=>l.code===language);
  return <AdminShell><div className="space-y-8">
    <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5"><div><p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">Content Manager</p><h1 className="text-4xl lg:text-5xl font-black mt-2">Website Text Control</h1><p className="text-slate-500 mt-3 max-w-3xl">Edit current headings, subheadings, paragraphs, button labels and navigation text for every page and language.</p></div><div className="relative min-w-[280px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search text fields..." className="w-full border border-[#EFE3E5] rounded-2xl pl-11 pr-4 py-4 bg-white text-[#081325]"/></div></div>
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      <aside className="bg-white text-[#081325] border border-[#EFE3E5] rounded-[26px] p-4 h-fit"><p className="font-black mb-3">Pages</p><div className="space-y-2">{pages.map(p=><button key={p} onClick={()=>setPage(p)} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm ${page===p?"bg-[#C23B4A] text-white":"hover:bg-[#FFF2F4]"}`}>{labels[p]||p}</button>)}</div></aside>
      <div className="space-y-6"><div className="bg-white text-[#081325] border border-[#EFE3E5] rounded-[26px] p-5"><div className="flex items-center gap-3 mb-4"><Languages className="text-[#C23B4A]"/><h2 className="font-black text-xl">Language</h2></div><div className="flex flex-wrap gap-2">{languages.map(l=><button key={l.code} onClick={()=>setLanguage(l.code)} className={`px-4 py-2 rounded-xl font-bold text-sm ${language===l.code?"bg-[#081325] text-white":"bg-[#FFF8F5] border border-[#EFE3E5]"}`}>{l.native_name}</button>)}</div><p className="text-xs text-slate-500 mt-3">Missing translations automatically fall back to English. {activeLang?.direction === "rtl" ? "This language uses right-to-left text." : ""}</p></div>
      {Object.entries(grouped).map(([section,rows])=><section key={section} className="bg-white text-[#081325] border border-[#EFE3E5] rounded-[26px] p-6"><div className="mb-5"><p className="text-xs uppercase tracking-[4px] text-[#C23B4A] font-black">Section</p><h2 className="text-2xl font-black mt-1 capitalize">{section.replaceAll("_"," ")}</h2></div><div className="space-y-5">{rows.map(entry=><div key={entry.id} className="border-b border-[#EFE3E5] pb-5 last:border-0 last:pb-0"><div className="flex items-center justify-between gap-4 mb-2"><div><label className="font-black">{entry.field_label}</label><p className="text-xs text-slate-400">{entry.field_key}</p></div><button onClick={()=>save(entry)} className="inline-flex items-center gap-2 bg-[#C23B4A] text-white px-4 py-2 rounded-xl text-xs font-black"><Save className="w-4 h-4"/>{saving===entry.id?"Saving...":"Save"}</button></div>{entry.field_type==="textarea"?<textarea dir={activeLang?.direction||"ltr"} value={getValue(entry)} onChange={e=>setValues(v=>({...v,[`${entry.id}:${language}`]:e.target.value}))} className="w-full min-h-28 border rounded-xl p-4"/>:<input dir={activeLang?.direction||"ltr"} value={getValue(entry)} onChange={e=>setValues(v=>({...v,[`${entry.id}:${language}`]:e.target.value}))} className="w-full border rounded-xl p-4"/>}</div>)}</div></section>)}
      </div>
    </div>
  </div></AdminShell>;
}
