"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { cmsPageLabels } from "@/lib/cms-registry";
import { supabase } from "@/lib/supabase-client";
import { CheckCircle2, Copy, Edit3, Eye, FileClock, Grid2X2, List, Plus, Search, Trash2, X } from "lucide-react";

type Row = { id?: number; product_id?: number; page_slug: string; title: string; page_type: string; language: string; status: string; heading: string; introduction: string; body: string; seo_title: string; seo_description: string; canonical_url: string; geo_summary: string; updated_at?: string; updated_by?: string; isCodeRoute?: boolean };
type DbRow = Record<string, any>;
const knownRouteSlugs = Object.keys(cmsPageLabels).filter(slug => slug !== "global");
const tabs = ["Content", "Images", "SEO", "GEO", "Social Preview", "Settings", "Version History"];
const blank = (): Row => ({ page_slug: "", title: "", page_type: "Landing Page", language: "English", status: "Draft", heading: "", introduction: "", body: "", seo_title: "", seo_description: "", canonical_url: "", geo_summary: "", updated_by: "" });
function routeFor(slug: string) { return slug === "home" ? "/" : `/${slug}`; }
function displayTitle(slug: string) { return cmsPageLabels[slug] || slug.split("-").map(value => value.charAt(0).toUpperCase() + value.slice(1)).join(" "); }
function completeness(row: Row) { const values = [row.heading, row.introduction, row.seo_title, row.seo_description, row.canonical_url]; return Math.round(values.filter(value => value.trim()).length / values.length * 100); }
function geoCompleteness(row: Row) { const values = [row.geo_summary, row.heading, row.introduction, row.seo_description]; return Math.round(values.filter(value => value.trim()).length / values.length * 100); }
function pageRecommendation(row: Row) {
  const notes: string[] = [];
  if (!row.heading.trim()) notes.push("Add a clear H1");
  if (!row.seo_title.trim()) notes.push("Generate meta title");
  if (!row.seo_description.trim()) notes.push("Generate meta description");
  if (!row.geo_summary.trim()) notes.push("Add concise AI answer block");
  if (!row.canonical_url.trim()) notes.push("Set canonical URL");
  return notes.length ? notes.slice(0, 2).join(" · ") : "SEO and GEO fields are complete";
}
function statusTone(status: string) { return status === "Published" ? "green" : status === "Review" || status === "Scheduled" ? "amber" : status === "Hidden" ? "red" : "blue"; }

export default function PagesManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [versions, setVersions] = useState<DbRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [view, setView] = useState<"table" | "grid">("table");
  const [editing, setEditing] = useState<Row | null>(null);
  const [activeTab, setActiveTab] = useState("Content");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [pageResult, seoResult, profileResult, productsResult] = await Promise.all([
      supabase.from("page_content").select("*").order("page_slug"),
      supabase.from("seo_settings").select("*").order("page_slug"),
      supabase.from("cms_profiles").select("full_name"),
      supabase.from("products").select("id,title,slug,description,short_description,seo_title,seo_description,status,updated_at").order("title"),
    ]);
    if (pageResult.error) { setError(pageResult.error.message); setLoading(false); return; }
    const pages = (pageResult.data || []) as DbRow[]; const seoRows = (seoResult.data || []) as DbRow[];
    const validEditors = new Set((profileResult.data || []).map((profile: any) => String(profile.full_name || "").trim()).filter(Boolean));
    const slugs = Array.from(new Set([...knownRouteSlugs, ...pages.map(page => String(page.page_slug)).filter(Boolean)]));
    const merged = slugs.map(pageSlug => {
      const page = pages.find(item => item.page_slug === pageSlug); const seo = seoRows.find(item => item.page_slug === pageSlug); const content = page?.content || {};
      return {
        id: page?.id, page_slug: pageSlug, title: String(content.title || displayTitle(pageSlug)), page_type: String(content.page_type || (knownRouteSlugs.includes(pageSlug) ? "Website Page" : "Dynamic Page")), language: String(content.language || "English"), status: String(content.status || (knownRouteSlugs.includes(pageSlug) ? "Published" : "Draft")),
        heading: String(content.heading || content.hero_title || ""), introduction: String(content.introduction || content.hero_description || ""), body: String(content.body || ""), seo_title: String(seo?.meta_title || content.seo_title || ""), seo_description: String(seo?.meta_description || content.seo_description || ""), canonical_url: String(seo?.canonical_url || content.canonical_url || ""), geo_summary: String(content.geo_summary || ""), updated_at: page?.updated_at, updated_by: validEditors.has(String(content.updated_by || "").trim()) ? String(content.updated_by) : "", isCodeRoute: knownRouteSlugs.includes(pageSlug),
      } as Row;
    });
    const productPages = (productsResult.data || []).filter((product: any) => product.slug).map((product: any) => ({
      product_id: Number(product.id), page_slug: `products/${product.slug}`, title: String(product.title || product.slug), page_type: "Product Detail", language: "English", status: String(product.status || "draft").toLowerCase() === "active" ? "Published" : "Draft", heading: String(product.title || ""), introduction: String(product.short_description || ""), body: String(product.description || ""), seo_title: String(product.seo_title || ""), seo_description: String(product.seo_description || ""), canonical_url: `/products/${product.slug}`, geo_summary: String(product.short_description || ""), updated_at: product.updated_at, updated_by: "", isCodeRoute: true,
    } as Row));
    setRows([...merged, ...productPages]); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);

  async function loadVersions(pageSlug: string) {
    const result = await supabase.from("page_versions").select("*").eq("page_slug", pageSlug).order("created_at", { ascending: false }).limit(50);
    setVersions(result.error ? [] : result.data || []);
  }
  function openEditor(row: Row, tab = "Content") { setEditing({ ...row }); setActiveTab(tab); if (tab === "Version History") void loadVersions(row.page_slug); }
  function create() { setEditing(blank()); setActiveTab("Content"); setVersions([]); }
  function patch(key: keyof Row, value: string) { setEditing(previous => previous ? { ...previous, [key]: value } : previous); }

  async function save(nextStatus?: string) {
    if (!editing) return;
    if (editing.product_id) { window.location.href = `/admin/products?edit=${editing.product_id}`; setSaving(false); return; }
    const slug = editing.page_slug.trim().replace(/^\/+|\/+$/g, "").toLowerCase().replace(/[^a-z0-9\/-]/g, "-") || "home";
    if (!editing.title.trim()) { setError("Page title is required."); return; }
    setSaving(true); setError("");
    const session = await supabase.auth.getSession();
    const updatedBy = String(session.data.session?.user.user_metadata?.full_name || session.data.session?.user.email || "");
    const content = { title: editing.title.trim(), page_type: editing.page_type, language: editing.language, status: nextStatus || editing.status, heading: editing.heading, introduction: editing.introduction, body: editing.body, geo_summary: editing.geo_summary, canonical_url: editing.canonical_url, updated_by: updatedBy };
    const pageResult = await supabase.from("page_content").upsert({ page_slug: slug, content, updated_at: new Date().toISOString() }, { onConflict: "page_slug" }).select().single();
    if (pageResult.error) { setError(pageResult.error.message); setSaving(false); return; }
    const seoResult = await supabase.from("seo_settings").upsert({ page_slug: slug, meta_title: editing.seo_title, meta_description: editing.seo_description, canonical_url: editing.canonical_url, updated_at: new Date().toISOString() }, { onConflict: "page_slug" });
    if (seoResult.error) { setError(seoResult.error.message); setSaving(false); return; }
    await supabase.from("page_versions").insert({ page_slug: slug, content, seo: { meta_title: editing.seo_title, meta_description: editing.seo_description, canonical_url: editing.canonical_url }, created_by: session.data.session?.user.id || null, created_by_name: updatedBy });
    setToast(nextStatus === "Published" ? "Page published." : "Page saved."); setEditing(null); await load(); setSaving(false);
  }

  async function duplicate(row: Row) {
    const copySlug = `${row.page_slug}-copy-${Date.now()}`;
    const result = await supabase.from("page_content").insert({ page_slug: copySlug, content: { title: `${row.title} Copy`, page_type: row.page_type, language: row.language, status: "Draft", heading: row.heading, introduction: row.introduction, body: row.body, geo_summary: row.geo_summary }, updated_at: new Date().toISOString() });
    if (result.error) setError(result.error.message); else { await supabase.from("seo_settings").insert({ page_slug: copySlug, meta_title: row.seo_title, meta_description: row.seo_description, canonical_url: "" }); setToast("Page duplicated as a draft."); await load(); }
  }
  async function remove(row: Row) {
    if (row.isCodeRoute) { setError("Code-based website pages cannot be deleted from the CMS. Set the page to Hidden instead."); return; }
    if (!confirm(`Delete ${row.title}?`)) return;
    const result = await supabase.from("page_content").delete().eq("page_slug", row.page_slug);
    if (result.error) setError(result.error.message); else { await supabase.from("seo_settings").delete().eq("page_slug", row.page_slug); setToast("Dynamic page deleted."); await load(); }
  }
  async function restore(version: DbRow) {
    if (!editing) return;
    const content = version.content || {}; const seo = version.seo || {};
    setEditing({ ...editing, title: content.title || editing.title, page_type: content.page_type || editing.page_type, language: content.language || editing.language, status: content.status || editing.status, heading: content.heading || "", introduction: content.introduction || "", body: content.body || "", geo_summary: content.geo_summary || "", seo_title: seo.meta_title || "", seo_description: seo.meta_description || "", canonical_url: seo.canonical_url || "" });
    setActiveTab("Content"); setToast("Version loaded into the editor. Save to apply it.");
  }

  const filtered = useMemo(() => rows.filter(row => (status === "All" || row.status === status) && `${row.title} ${row.page_type} ${routeFor(row.page_slug)}`.toLowerCase().includes(query.toLowerCase())), [rows, query, status]);

  return <AdminShell><div className="os-page">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Website management</div><h1 className="os-page-title">Pages</h1><p className="os-page-subtitle">Manage actual website page records, metadata, publication state and version history using connected CMS records.</p></div><div className="os-page-actions"><Link className="os-btn soft" href="/" target="_blank"><Eye/>Preview Website</Link><button className="os-btn primary" onClick={create}><Plus/>Create Page</button></div></header>
    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body"><strong>Live page action failed</strong><p className="os-page-subtitle">{error}</p></div></section>}
    <section className="os-card"><div className="os-card-body"><div className="os-toolbar"><label className="os-search"><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search pages, slug or type…"/></label><select className="os-field" value={status} onChange={event => setStatus(event.target.value)}><option>All</option>{["Draft", "Review", "Scheduled", "Published", "Hidden"].map(value => <option key={value}>{value}</option>)}</select><div className="os-segmented"><button className={view === "table" ? "active" : ""} onClick={() => setView("table")}><List/></button><button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}><Grid2X2/></button></div></div></div></section>

    {view === "table" ? <section className="os-card"><div className="os-table-wrap"><table className="os-table"><thead><tr><th>Page Title</th><th>Page Type</th><th>URL / Slug</th><th>Language</th><th>Status</th><th>SEO Completeness</th><th>GEO Completeness</th><th>Recommended Improvement</th><th>Last Updated</th><th>Updated By</th><th>Actions</th></tr></thead><tbody>{filtered.map(row => <tr key={row.page_slug}><td><strong>{row.title}</strong></td><td>{row.page_type}</td><td><code>{routeFor(row.page_slug)}</code></td><td>{row.language}</td><td><span className={`os-badge ${statusTone(row.status)}`}>{row.status}</span></td><td><div className="page-completeness-cell"><strong>{completeness(row)}%</strong><div><i style={{ width: `${completeness(row)}%` }}/></div><span>Metadata and page content</span></div></td><td><div className="page-completeness-cell"><strong>{geoCompleteness(row)}%</strong><div><i style={{ width: `${geoCompleteness(row)}%` }}/></div><span>AI answer readiness</span></div></td><td><div className="page-recommendation">{pageRecommendation(row)}</div></td><td>{row.updated_at ? new Date(row.updated_at).toLocaleString() : "Not recorded"}</td><td>{row.updated_by || "Not recorded"}</td><td><div className="os-table-actions"><button onClick={() => row.product_id ? window.location.href = `/admin/products?edit=${row.product_id}` : openEditor(row)}><Edit3/></button>{!row.product_id && <button onClick={() => void duplicate(row)}><Copy/></button>}{!row.product_id && <button onClick={() => void remove(row)}><Trash2/></button>}</div></td></tr>)}</tbody></table></div>{!loading && !filtered.length && <Empty/>}</section> : <div className="os-grid three">{filtered.map(row => <article className="os-card" key={row.page_slug}><div className="os-card-body"><div style={{ height: 120, borderRadius: 12, background: "var(--os-surface-2)", display: "grid", placeItems: "center" }}><Eye/></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginTop: 14 }}><div><h3 style={{ margin: 0, fontSize: 15 }}>{row.title}</h3><p className="os-page-subtitle">{routeFor(row.page_slug)}</p></div><span className={`os-badge ${statusTone(row.status)}`}>{row.status}</span></div><div className="os-grid two"><button className="os-btn soft" onClick={() => openEditor(row)}><Edit3/>Edit</button><a className="os-btn soft" href={routeFor(row.page_slug)} target="_blank"><Eye/>Preview</a></div></div></article>)}</div>}

    {editing && <div className="os-modal-backdrop" onMouseDown={() => setEditing(null)}><section className="os-modal wide" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><div className="os-page-eyebrow">Page editor</div><h2>{editing.title || "New Page"}</h2></div><button className="os-icon-button" onClick={() => setEditing(null)}><X/></button></div><div className="os-tabs" style={{ padding: "0 22px" }}>{tabs.map(value => <button className={`os-tab ${activeTab === value ? "active" : ""}`} onClick={() => { setActiveTab(value); if (value === "Version History" && editing.page_slug) void loadVersions(editing.page_slug); }} key={value}>{value}</button>)}</div><div className="os-modal-body">
      {activeTab === "Content" && <div className="os-form-grid"><Field label="Page Title *" value={editing.title} onChange={value => patch("title", value)}/><Field label="Page Type" value={editing.page_type} onChange={value => patch("page_type", value)}/><Field label="Page Slug" value={editing.page_slug} onChange={value => patch("page_slug", value)} disabled={Boolean(editing.id || editing.isCodeRoute)}/><label className="os-label"><span>Status</span><select value={editing.status} onChange={event => patch("status", event.target.value)}>{["Draft", "Review", "Scheduled", "Published", "Hidden"].map(value => <option key={value}>{value}</option>)}</select></label><label className="os-label full"><span>Page Heading</span><input value={editing.heading} onChange={event => patch("heading", event.target.value)}/></label><label className="os-label full"><span>Page Introduction</span><textarea value={editing.introduction} onChange={event => patch("introduction", event.target.value)}/></label><label className="os-label full"><span>Page Body</span><textarea style={{ minHeight: 220 }} value={editing.body} onChange={event => patch("body", event.target.value)}/></label></div>}
      {activeTab === "Images" && <div className="os-empty"><div className="os-empty-icon"><Grid2X2/></div><h3>Page Images</h3><p>Open the Images Manager filtered to this page and replace actual website assets.</p><Link className="os-btn primary" href={`/admin/images?page=${encodeURIComponent(editing.page_slug)}`}>Open Images Manager</Link></div>}
      {activeTab === "SEO" && <div className="os-form-grid"><Field label="SEO Title" value={editing.seo_title} onChange={value => patch("seo_title", value)}/><Field label="Canonical URL" value={editing.canonical_url} onChange={value => patch("canonical_url", value)}/><label className="os-label full"><span>Meta Description</span><textarea value={editing.seo_description} onChange={event => patch("seo_description", event.target.value)}/></label><div className="os-card full" style={{ boxShadow: "none" }}><div className="os-card-body"><strong>Metadata completeness: {completeness(editing)}%</strong><p className="os-page-subtitle">Calculated only from fields currently saved in this editor.</p></div></div></div>}
      {activeTab === "GEO" && <div className="os-form-grid"><label className="os-label full"><span>Concise AI-Search Summary</span><textarea style={{ minHeight: 180 }} value={editing.geo_summary} onChange={event => patch("geo_summary", event.target.value)}/></label><Link className="os-btn soft" href="/admin/geo-manager">Open GEO Manager</Link></div>}
      {activeTab === "Social Preview" && <div className="os-card" style={{ boxShadow: "none" }}><div className="os-card-body"><div style={{ aspectRatio: "1.91/1", borderRadius: 14, background: "var(--os-surface-2)", display: "grid", placeItems: "center" }}><img src="/salt-origin-logo.png" alt="The Salt Origin" style={{ width: 160, height: 110, objectFit: "contain" }}/></div><h3>{editing.seo_title || editing.title}</h3><p className="os-page-subtitle">{editing.seo_description || "No social description has been entered."}</p></div></div>}
      {activeTab === "Settings" && <div className="os-form-grid"><label className="os-label"><span>Language</span><input value={editing.language} onChange={event => patch("language", event.target.value)}/></label><label className="os-label"><span>Publication Status</span><select value={editing.status} onChange={event => patch("status", event.target.value)}>{["Draft", "Review", "Scheduled", "Published", "Hidden"].map(value => <option key={value}>{value}</option>)}</select></label><div className="os-card full" style={{ boxShadow: "none" }}><div className="os-card-body"><strong>{editing.isCodeRoute ? "Code-based website route" : "Dynamic CMS route"}</strong><p className="os-page-subtitle">{editing.isCodeRoute ? "This route remains part of the existing website code and can be hidden but not deleted here." : "This page is stored in the CMS and rendered by the dynamic website route."}</p></div></div></div>}
      {activeTab === "Version History" && <div className="os-list">{versions.map(version => <div className="os-list-row" key={version.id}><span className="os-list-icon"><FileClock/></span><div className="os-list-main"><strong>{version.created_at ? new Date(version.created_at).toLocaleString() : "Saved version"}</strong><span>{version.created_by_name || "Authenticated CMS user"}</span></div><button className="os-btn soft" onClick={() => restore(version)}>Load Version</button></div>)}{!versions.length && <div className="os-empty"><h3>No saved versions</h3><p>A version record is created each time this page is saved.</p></div>}</div>}
    </div><div className="os-modal-footer"><button className="os-btn soft" onClick={() => setEditing(null)}>Cancel</button><button className="os-btn soft" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save Draft"}</button><button className="os-btn primary" onClick={() => void save("Published")} disabled={saving}><CheckCircle2/>Publish</button></div></section></div>}
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>The live page record has been updated.</span></div></div></div>}
  </div></AdminShell>;
}
function Field({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) { return <label className="os-label"><span>{label}</span><input value={value} onChange={event => onChange(event.target.value)} disabled={disabled}/></label>; }
function Empty() { return <div className="os-empty"><div className="os-empty-icon"><Search/></div><h3>No matching pages</h3><p>No live page record matches the current filters.</p></div>; }
