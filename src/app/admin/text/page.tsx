"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { cmsPageLabels, cmsTextRegistry, type CmsTextSeed } from "@/lib/cms-registry";
import { Languages, RefreshCw, Save, Search, Sparkles } from "lucide-react";

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
  const [languages, setLanguages] = useState<Language[]>(fallbackLanguages);
  const [entries, setEntries] = useState<Entry[]>(cmsTextRegistry);
  const [language, setLanguage] = useState("en");
  const [page, setPage] = useState("home");
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [translatingPage, setTranslatingPage] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    const [{ data: langs }, { data: rows }] = await Promise.all([
      supabase.from("cms_languages").select("*").eq("enabled", true).order("display_order"),
      supabase.from("cms_text_entries").select("*,cms_text_translations(language_code,value)").order("display_order"),
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
    const next: Record<string, string> = {};
    all.forEach((row) => {
      (row.cms_text_translations || []).forEach((translation) => {
        next[`${row.page_slug}:${row.section_slug}:${row.field_key}:${translation.language_code}`] = translation.value || "";
      });
    });
    setValues(next);
  }

  async function syncCurrentWebsite() {
    setSyncing(true);
    const { error } = await supabase.from("cms_text_entries").upsert(cmsTextRegistry, { onConflict: "page_slug,section_slug,field_key" });
    if (error) { setSyncing(false); return alert(`${error.message}\n\nRun CMS-REDESIGN-V3.sql and confirm you are logged in.`); }
    const { data: synced } = await supabase.from("cms_text_entries").select("id,page_slug,section_slug,field_key,default_value");
    const english = (synced || []).map((row) => ({ entry_id: row.id, language_code: "en", value: row.default_value }));
    const { error: transError } = await supabase.from("cms_text_translations").upsert(english, { onConflict: "entry_id,language_code" });
    setSyncing(false);
    if (transError) return alert(transError.message);
    await load();
    window.dispatchEvent(new Event("salt-cms-updated"));
    alert("All current website text is now visible in the CMS.");
  }

  const pages = useMemo(() => Array.from(new Set(entries.map((entry) => entry.page_slug))), [entries]);
  const visible = useMemo(() => entries.filter((entry) => entry.page_slug === page && (!query || `${entry.field_label} ${entry.section_slug} ${entry.field_key}`.toLowerCase().includes(query.toLowerCase()))), [entries, page, query]);
  const grouped = useMemo(() => visible.reduce<Record<string, Entry[]>>((groups, entry) => { (groups[entry.section_slug] ||= []).push(entry); return groups; }, {}), [visible]);

  function localKey(entry: Entry, lang = language) { return `${entry.page_slug}:${entry.section_slug}:${entry.field_key}:${lang}`; }
  function getValue(entry: Entry, lang = language) {
    const direct = values[localKey(entry, lang)];
    if (direct !== undefined && direct !== "") return direct;
    const english = values[localKey(entry, "en")];
    return english !== undefined && english !== "" ? english : entry.default_value;
  }

  async function ensureEntry(entry: Entry) {
    if (entry.id) return entry.id;
    const { data, error } = await supabase.from("cms_text_entries").upsert(entry, { onConflict: "page_slug,section_slug,field_key" }).select("id").single();
    if (error) throw error;
    return data.id as string;
  }

  async function upsertTranslation(entry: Entry, lang: string, value: string) {
    const id = await ensureEntry(entry);
    const { error } = await supabase.from("cms_text_translations").upsert({ entry_id: id, language_code: lang, value, updated_at: new Date().toISOString() }, { onConflict: "entry_id,language_code" });
    if (error) throw error;
    setEntries((items) => items.map((item) => item.page_slug === entry.page_slug && item.section_slug === entry.section_slug && item.field_key === entry.field_key ? { ...item, id } : item));
  }

  async function translateItems(items: Array<{ key: string; value: string }>, targetLanguage: string) {
    const response = await fetch("/api/admin/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: targetLanguage, items }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Translation failed");
    return result.translations as Record<string, string>;
  }

  async function save(entry: Entry, translateAll = false) {
    const key = localKey(entry);
    setSaving(key);
    try {
      const value = getValue(entry);
      await upsertTranslation(entry, language, value);
      setValues((current) => ({ ...current, [key]: value }));

      if (translateAll && language === "en") {
        const translationKey = `${entry.page_slug}.${entry.section_slug}.${entry.field_key}`;
        for (const target of languages.filter((item) => item.code !== "en")) {
          const translated = await translateItems([{ key: translationKey, value }], target.code);
          const translatedValue = translated[translationKey] || value;
          await upsertTranslation(entry, target.code, translatedValue);
          setValues((current) => ({ ...current, [localKey(entry, target.code)]: translatedValue }));
        }
      }

      window.dispatchEvent(new Event("salt-cms-updated"));
      alert(translateAll && language === "en" ? "Saved and translated into every enabled language." : "Text saved successfully.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save text");
    } finally { setSaving(null); }
  }

  async function translateWholePage() {
    if (!confirm(`Translate every English field on ${cmsPageLabels[page] || page} into all enabled languages?`)) return;
    setTranslatingPage(true);
    try {
      const pageEntries = entries.filter((entry) => entry.page_slug === page);
      for (const entry of pageEntries) await ensureEntry(entry);
      const items = pageEntries.map((entry) => ({ key: `${entry.page_slug}.${entry.section_slug}.${entry.field_key}`, value: getValue(entry, "en") }));

      for (const target of languages.filter((item) => item.code !== "en")) {
        const translated = await translateItems(items, target.code);
        for (const entry of pageEntries) {
          const key = `${entry.page_slug}.${entry.section_slug}.${entry.field_key}`;
          const value = translated[key] || getValue(entry, "en");
          await upsertTranslation(entry, target.code, value);
          setValues((current) => ({ ...current, [localKey(entry, target.code)]: value }));
        }
      }
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert("The complete page has been translated and saved.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Page translation failed");
    } finally { setTranslatingPage(false); }
  }

  const activeLang = languages.find((item) => item.code === language) || fallbackLanguages[0];

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <p className="uppercase tracking-[4px] text-blue-400 font-black text-xs">Content Manager</p>
            <h1 className="text-4xl font-black mt-2">Text Manager</h1>
            <p className="text-slate-400 mt-2">Every registered heading, card, paragraph, button and label can be edited here.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search text fields..." className="w-72 max-w-[70vw] rounded-xl border pl-11 pr-4 py-3"/></div>
            <button onClick={syncCurrentWebsite} disabled={syncing} className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 px-4 py-3 font-black text-sm"><RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}/>{syncing ? "Syncing..." : "Sync Current Website"}</button>
            <button onClick={translateWholePage} disabled={translatingPage} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-3 font-black text-sm"><Sparkles className={`w-4 h-4 ${translatingPage ? "animate-spin" : ""}`}/>{translatingPage ? "Translating..." : "Translate Whole Page"}</button>
          </div>
        </div>

        <div className="cms-panel grid lg:grid-cols-[220px_1fr] rounded-[24px] border border-white/10 bg-[#0b1728] overflow-hidden min-h-[700px]">
          <aside className="bg-[#081321] border-r border-white/10 p-4"><p className="text-[10px] uppercase tracking-[3px] text-slate-500 font-black px-2 mb-3">Website Pages</p><div className="space-y-1">{pages.map((pageSlug) => <button key={pageSlug} onClick={() => setPage(pageSlug)} className={`w-full text-left px-3 py-3 rounded-xl font-bold text-sm ${page === pageSlug ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}>{cmsPageLabels[pageSlug] || pageSlug}</button>)}</div></aside>
          <section className="p-4 lg:p-6 space-y-5 min-w-0">
            <div className="rounded-2xl border border-white/10 bg-[#101e31] p-4"><div className="flex items-center gap-3 mb-3"><Languages className="text-blue-400"/><h2 className="font-black">Editing language</h2></div><div className="flex flex-wrap gap-2">{languages.map((item) => <button key={item.code} onClick={() => setLanguage(item.code)} className={`px-3 py-2 rounded-lg font-bold text-xs ${language === item.code ? "bg-blue-600 text-white" : "bg-[#0b1728] text-slate-300 border border-white/10"}`}>{item.native_name}</button>)}</div><p className="text-[11px] text-slate-500 mt-3">English content can be automatically translated with the blue-violet translation controls. Missing translations fall back to English. {activeLang.direction === "rtl" ? "This language uses RTL." : ""}</p></div>

            {Object.entries(grouped).map(([section, rows]) => <section key={section} className="rounded-2xl border border-white/10 bg-[#101e31] p-5"><div className="mb-5"><p className="text-[10px] uppercase tracking-[4px] text-blue-400 font-black">{cmsPageLabels[page] || page}</p><h2 className="text-xl font-black mt-1 capitalize">{section.replaceAll("_", " ")} Section</h2></div><div className="space-y-5">{rows.map((entry) => {
              const key = localKey(entry);
              return <div key={`${entry.page_slug}-${entry.section_slug}-${entry.field_key}`} className="border-b border-white/10 pb-5 last:border-0 last:pb-0"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2"><div><label className="font-black text-sm">{entry.field_label}</label><p className="text-[11px] text-slate-500">{entry.field_key}</p></div><div className="flex gap-2"><button onClick={() => save(entry)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black"><Save className="w-4 h-4"/>{saving === key ? "Saving..." : "Save"}</button>{language === "en" && <button onClick={() => save(entry, true)} className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-xs font-black"><Sparkles className="w-4 h-4"/>Save + Translate All</button>}</div></div>{entry.field_type === "textarea" ? <textarea dir={activeLang.direction} value={getValue(entry)} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="w-full min-h-28 border rounded-xl p-4"/> : <input dir={activeLang.direction} value={getValue(entry)} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="w-full border rounded-xl p-4"/>}</div>;
            })}</div></section>)}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
