"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { adminFetch } from "@/lib/admin-client";
import {
  BarChart3,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";

type SeoRow = {
  id?: number;
  page_slug: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
};

type Audit = {
  score: number;
  primary_keyword: string;
  title_suggestion: string;
  description_suggestion: string;
  keyword_suggestions: string[];
  quick_wins: string[];
  technical_checks: { label: string; status: string; detail: string }[];
  content_brief: string;
  og_title_suggestion?: string;
  og_description_suggestion?: string;
  image_prompt?: string;
  image_alt_text?: string;
};

type CanonicalPage = { slug: string; label: string };

const CANONICAL_PAGES: CanonicalPage[] = [
  { slug: "home", label: "Home" },
  { slug: "products", label: "Products" },
  { slug: "private-label", label: "Private Label" },
  { slug: "certifications", label: "Certifications" },
  { slug: "blog", label: "Blog" },
  { slug: "about", label: "About Us" },
  { slug: "faqs", label: "FAQ" },
  { slug: "contact", label: "Contact" },
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-and-conditions", label: "Terms & Conditions" },
  { slug: "articles", label: "Articles" },
  { slug: "product-detail-template", label: "Product Detail Template" },
  { slug: "blog-detail-template", label: "Blog Detail Template" },
];

const blankRow = (pageSlug: string): SeoRow => ({
  page_slug: pageSlug,
  meta_title: "",
  meta_description: "",
  keywords: "",
  og_title: "",
  og_description: "",
  og_image: "",
});

const niceLabel = (slug: string) =>
  CANONICAL_PAGES.find((page) => page.slug === slug)?.label ||
  slug.replaceAll("-", " ").replaceAll("_", " ");

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9/_-]/g, "-")
    .replace(/-+/g, "-") || "home";

export default function SeoManager() {
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [form, setForm] = useState<SeoRow>(blankRow("home"));
  const [audit, setAudit] = useState<Audit | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const orderedRows = useMemo(() => {
    const bySlug = new Map(rows.map((row) => [row.page_slug, row]));
    const canonical = CANONICAL_PAGES.map((page) => bySlug.get(page.slug) || blankRow(page.slug));
    const extras = rows.filter((row) => !CANONICAL_PAGES.some((page) => page.slug === row.page_slug));
    return [...canonical, ...extras];
  }, [rows]);

  async function load(selectSlug?: string) {
    const { data, error } = await supabase.from("seo_settings").select("*").order("page_slug");
    if (error) {
      alert(error.message);
      return;
    }
    const list = (data as SeoRow[]) || [];
    setRows(list);
    const targetSlug = selectSlug || form.page_slug || "home";
    const selected = list.find((row) => row.page_slug === targetSlug) || blankRow(targetSlug);
    setForm(selected);
  }

  async function syncWebsitePages() {
    setSyncing(true);
    const { data, error } = await supabase.from("seo_settings").select("page_slug");
    if (error) {
      setSyncing(false);
      alert(error.message);
      return;
    }
    const existing = new Set((data || []).map((row: { page_slug: string }) => row.page_slug));
    const missing = CANONICAL_PAGES.filter((page) => !existing.has(page.slug)).map((page) => blankRow(page.slug));
    if (missing.length) {
      const result = await supabase.from("seo_settings").insert(missing);
      if (result.error) {
        setSyncing(false);
        alert(result.error.message);
        return;
      }
    }
    await load(form.page_slug);
    setSyncing(false);
    alert(missing.length ? `${missing.length} website pages added to SEO Manager.` : "All website pages are already synced.");
  }

  async function addPage() {
    const raw = window.prompt("Enter the website page slug, for example: distributors or resources/buyer-guide");
    if (!raw) return;
    const pageSlug = normalizeSlug(raw);
    if (orderedRows.some((row) => row.page_slug === pageSlug)) {
      const existing = orderedRows.find((row) => row.page_slug === pageSlug) || blankRow(pageSlug);
      setForm(existing);
      setAudit(null);
      return;
    }
    const newRow = blankRow(pageSlug);
    const { data, error } = await supabase.from("seo_settings").insert(newRow).select("*").single();
    if (error) {
      alert(error.message);
      return;
    }
    const inserted = data as SeoRow;
    setRows((current) => [...current, inserted]);
    setForm(inserted);
    setAudit(null);
  }

  async function save() {
    setSaving(true);
    const payload = { ...form, page_slug: normalizeSlug(form.page_slug), updated_at: new Date().toISOString() };
    let error: { message: string } | null = null;
    if (form.id) {
      const result = await supabase.from("seo_settings").update(payload).eq("id", form.id);
      error = result.error;
    } else {
      const existing = rows.find((row) => row.page_slug === payload.page_slug && row.id);
      if (existing?.id) {
        const result = await supabase.from("seo_settings").update(payload).eq("id", existing.id);
        error = result.error;
      } else {
        const result = await supabase.from("seo_settings").insert(payload);
        error = result.error;
      }
    }
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    await load(payload.page_slug);
    alert("SEO settings saved.");
  }

  async function runAudit() {
    setBusy(true);
    const response = await adminFetch("/api/seo/audit", {
      method: "POST",
      body: JSON.stringify({
        page: form.page_slug,
        title: form.meta_title,
        description: form.meta_description,
        keywords: form.keywords,
      }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      alert(result.error || "SEO audit failed");
      return;
    }
    setAudit(result);
  }

  function apply() {
    if (!audit) return;
    setForm({
      ...form,
      meta_title: audit.title_suggestion || form.meta_title,
      meta_description: audit.description_suggestion || form.meta_description,
      keywords: (audit.keyword_suggestions || []).join(", ") || form.keywords,
      og_title: audit.og_title_suggestion || audit.title_suggestion || form.og_title,
      og_description: audit.og_description_suggestion || audit.description_suggestion || form.og_description,
    });
  }

  return (
    <AdminShell>
      <div className="os-page legacy-unified-page seo-studio-v102">
        <header>
          <div>
            <span>Organic Growth</span>
            <h1>SEO Command Center</h1>
            <p>AI-guided metadata, keyword research and practical optimization for every public website page.</p>
          </div>
          <div className="seo-top-actions-v756">
            <button className="seo-sync-button-v756" onClick={() => void syncWebsitePages()} disabled={syncing}>
              <RefreshCw className={syncing ? "animate-spin" : ""}/>{syncing ? "Syncing…" : "Sync Website Pages"}
            </button>
            <button className="cms-gradient-button" onClick={runAudit} disabled={busy}>
              <Sparkles/>{busy ? "Auditing…" : "Run AI SEO Audit"}
            </button>
          </div>
        </header>

        <div className="seo-layout-v102">
          <aside className="seo-pages-v102">
            <small>Website pages</small>
            {orderedRows.map((row) => (
              <button
                className={form.page_slug === row.page_slug ? "active" : ""}
                key={row.page_slug}
                onClick={() => { setForm(row); setAudit(null); }}
              >
                {niceLabel(row.page_slug)}
              </button>
            ))}
            <button className="seo-add-page-v756" onClick={() => void addPage()}><Plus/>Add Page</button>
          </aside>

          <main className="seo-main-v102">
            <section className="seo-card-v102">
              <div className="section-head"><div><span>Page metadata</span><h2>{niceLabel(form.page_slug)}</h2></div><Search/></div>
              <label>Page slug<input value={form.page_slug} onChange={(event) => setForm({ ...form, page_slug: event.target.value })}/></label>
              <label>Meta title<input value={form.meta_title || ""} onChange={(event) => setForm({ ...form, meta_title: event.target.value })}/><small>{(form.meta_title || "").length}/60</small></label>
              <label>Meta description<textarea value={form.meta_description || ""} onChange={(event) => setForm({ ...form, meta_description: event.target.value })}/><small>{(form.meta_description || "").length}/160</small></label>
              <label>Target keywords<input value={form.keywords || ""} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="Generated from buyer-intent research"/></label>
              <label>Open Graph title<input value={form.og_title || ""} onChange={(event) => setForm({ ...form, og_title: event.target.value })}/></label>
              <label>Open Graph description<textarea value={form.og_description || ""} onChange={(event) => setForm({ ...form, og_description: event.target.value })}/></label>
              <label>Social / SEO image URL<input value={form.og_image || ""} onChange={(event) => setForm({ ...form, og_image: event.target.value })} placeholder="Save an approved image from Images Manager"/></label>
              <button className="cms-gradient-button save" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save SEO Settings"}</button>
            </section>

            <section className="seo-card-v102 audit">
              <div className="section-head"><div><span>AI recommendations</span><h2>Optimization report</h2></div><BarChart3/></div>
              {audit ? <>
                <div className="score-v102"><strong>{audit.score || 0}</strong><span>SEO score</span></div>
                <div className="audit-block"><b>Primary keyword</b><p>{audit.primary_keyword}</p></div>
                <div className="audit-block"><b>Quick wins</b>{audit.quick_wins?.map((item) => <p key={item}><CheckCircle2/>{item}</p>)}</div>
                <div className="audit-block"><b>Keyword opportunities</b><div className="chips-v102">{audit.keyword_suggestions?.map((item) => <span key={item}>{item}</span>)}</div></div>
                <div className="audit-block"><b>Content brief</b><p>{audit.content_brief}</p></div>
                <div className="audit-block"><b>SEO image prompt</b><p>{audit.image_prompt || "No image prompt returned."}</p>{audit.image_alt_text && <p><CheckCircle2/>{audit.image_alt_text}</p>}</div>
                <button className="apply-v102" onClick={apply}><WandSparkles/>Apply AI suggestions</button>
              </> : <div className="empty-v102"><Sparkles/><b>Run an AI audit</b><p>The studio will suggest stronger metadata, target keywords, quick wins and a content brief.</p></div>}
            </section>
          </main>
        </div>
      </div>

      <style jsx>{`
        .seo-studio-v102{display:flex;flex-direction:column;gap:18px}.seo-studio-v102>header{display:flex;justify-content:space-between;align-items:flex-end;gap:18px}.seo-studio-v102 header span,.section-head span{font-size:9px;text-transform:uppercase;letter-spacing:.28em;color:var(--accent);font-weight:900}.seo-studio-v102 h1{font-size:clamp(42px,5vw,70px);line-height:.9;letter-spacing:-.055em;margin:10px 0}.seo-studio-v102 header p{font-size:12px;color:var(--muted)}.seo-top-actions-v756{display:flex;gap:9px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.seo-studio-v102 header button{display:flex;gap:8px;align-items:center;border-radius:13px;padding:13px 17px;font-size:11px;font-weight:900}.seo-studio-v102 header .cms-gradient-button{color:white}.seo-sync-button-v756{border:1px solid var(--line);background:var(--surface);color:var(--text)}.seo-studio-v102 svg{width:17px}.seo-layout-v102{display:grid;grid-template-columns:220px 1fr;gap:14px}.seo-pages-v102,.seo-card-v102{background:var(--surface);border:1px solid var(--line);border-radius:22px}.seo-pages-v102{padding:14px;height:fit-content;display:flex;flex-direction:column;gap:5px}.seo-pages-v102 small{padding:8px;font-size:9px;text-transform:uppercase;letter-spacing:.18em;color:var(--muted);font-weight:900}.seo-pages-v102 button{text-align:left;padding:12px;border-radius:11px;font-size:11px;font-weight:800;text-transform:capitalize;color:var(--muted);display:flex;align-items:center;gap:7px}.seo-pages-v102 button.active{background:linear-gradient(135deg,#ef6f8d,#a52c50);color:white}.seo-pages-v102 .seo-add-page-v756{margin-top:7px;border:1px dashed var(--line);color:var(--accent);justify-content:center}.seo-main-v102{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.seo-card-v102{padding:22px}.section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.section-head h2{font-size:21px;text-transform:capitalize;margin-top:4px}.seo-card-v102 label{display:flex;flex-direction:column;gap:7px;font-size:10px;font-weight:850;color:var(--muted);margin-top:13px}.seo-card-v102 input,.seo-card-v102 textarea{border:1px solid var(--line);background:var(--surface-2);border-radius:12px;padding:12px;color:var(--text)}.seo-card-v102 textarea{min-height:105px}.seo-card-v102 label small{text-align:right}.save{margin-top:16px;color:white;border-radius:12px;padding:12px 16px;font-size:11px;font-weight:900}.score-v102{width:110px;height:110px;border-radius:50%;border:10px solid color-mix(in srgb,var(--accent) 18%,var(--line));display:flex;flex-direction:column;align-items:center;justify-content:center;margin:5px auto 20px}.score-v102 strong{font-size:30px}.score-v102 span{font-size:8px;color:var(--muted)}.audit-block{border-top:1px solid var(--line);padding:14px 0}.audit-block>b{font-size:10px;text-transform:uppercase;letter-spacing:.1em}.audit-block p{font-size:10px;color:var(--muted);line-height:1.55;margin-top:7px;display:flex;gap:7px}.audit-block p svg{width:13px;color:#16a36a;flex:0 0 auto}.chips-v102{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.chips-v102 span{font-size:9px;padding:7px 9px;border-radius:999px;background:var(--surface-2);border:1px solid var(--line)}.apply-v102{display:flex;gap:7px;align-items:center;color:var(--accent);font-size:10px;font-weight:900}.empty-v102{min-height:330px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--muted)}.empty-v102 svg{width:30px;color:var(--accent)}.empty-v102 b{color:var(--text);margin-top:12px}.empty-v102 p{font-size:10px;max-width:280px;margin-top:7px}@media(max-width:1000px){.seo-main-v102{grid-template-columns:1fr}}@media(max-width:720px){.seo-layout-v102{grid-template-columns:1fr}.seo-studio-v102>header{align-items:flex-start;flex-direction:column}.seo-top-actions-v756{justify-content:flex-start}}
      `}</style>
    </AdminShell>
  );
}
