"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { AlertTriangle, Bot, CheckCircle2, FileSearch, Globe2, Link2, RefreshCw, Search, Sparkles } from "lucide-react";

type Row = Record<string, any>;
type PageSource = { key: string; path: string; title: string; source: string; text: string; updatedAt?: string };
const tabs = ["Overview", "AI Search Visibility", "Entity Profile", "Answer Readiness", "Citations", "LLM-Friendly Pages", "llms.txt"];
function flatten(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(flatten).join(" ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(flatten).join(" ");
  return "";
}
function slugTitle(value: string) { return (value || "home").replace(/^\/+|\/+$/g, "").replaceAll("-", " ").replace(/\b\w/g, c => c.toUpperCase()) || "Home"; }
function scorePage(page: PageSource) {
  const text = page.text.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const hasBrand = lower.includes("the salt origin");
  const hasSupplierTerms = /(manufacturer|exporter|supplier|private label|bulk|wholesale|distributor)/.test(lower);
  const hasProductFacts = /(himalayan|pink salt|food grade|granulation|mesh|packaging|moq|lead time|incoterm|hs code)/.test(lower);
  const hasContact = /(@|whatsapp|contact|request|quotation|rfq)/.test(lower);
  const hasFaq = /(frequently asked|faq|what is|how long|minimum order|which grade)/.test(lower);
  const hasEvidence = /(certificate|certification|coa|msds|lab report|iso|haccp|halal|sedex)/.test(lower);
  const hasStructuredAnswer = /(^|[.!?]\s)(we |our |the salt origin |yes,|no,)/i.test(text);
  const numericClaims = (text.match(/\b\d+(?:[.,]\d+)?(?:\s?(?:kg|mt|tons?|countries|years?|%))?\b/gi) || []).length;
  const visibility = Math.min(100, (hasBrand ? 20 : 0) + (hasSupplierTerms ? 22 : 0) + (hasProductFacts ? 22 : 0) + (wordCount >= 250 ? 18 : Math.round(wordCount / 14)) + (hasContact ? 18 : 0));
  const readiness = Math.min(100, (hasFaq ? 25 : 0) + (hasStructuredAnswer ? 20 : 0) + (wordCount >= 350 ? 25 : Math.round(wordCount / 14)) + (hasProductFacts ? 15 : 0) + (hasContact ? 15 : 0));
  const entity = Math.min(100, (hasBrand ? 35 : 0) + (hasSupplierTerms ? 20 : 0) + (hasProductFacts ? 20 : 0) + (hasEvidence ? 15 : 0) + (hasContact ? 10 : 0));
  const citations = Math.max(0, numericClaims + (hasEvidence ? 1 : 0));
  const recommendations: string[] = [];
  if (!hasBrand) recommendations.push("Add a concise company entity statement naming The Salt Origin.");
  if (!hasSupplierTerms) recommendations.push("State clearly whether the business is a manufacturer, exporter, supplier or private-label partner.");
  if (!hasProductFacts) recommendations.push("Add factual product, packaging, MOQ, lead-time and export details.");
  if (!hasFaq) recommendations.push("Add short buyer questions with direct, structured answers.");
  if (!hasEvidence) recommendations.push("Link verifiable certifications, COA, MSDS or laboratory documents where relevant.");
  if (!hasContact) recommendations.push("Add a direct RFQ or contact action for international buyers.");
  if (numericClaims) recommendations.push("Add source notes for measurable claims and export statistics.");
  return { visibility, readiness, entity, citations, wordCount, recommendations };
}

export default function GeoManager() {
  const [tab, setTab] = useState("Overview");
  const [pages, setPages] = useState<PageSource[]>([]);
  const [audits, setAudits] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [pageResult, blogResult, productResult, auditResult] = await Promise.all([
      supabase.from("page_content").select("id,page_slug,content,updated_at").order("page_slug"),
      supabase.from("blog_posts").select("id,title,slug,excerpt,content,status,updated_at").order("updated_at", { ascending: false }),
      supabase.from("products").select("id,title,slug,description,short_description,features,applications,specifications,status,updated_at").order("updated_at", { ascending: false }),
      supabase.from("geo_audits").select("*").order("updated_at", { ascending: false }),
    ]);
    const errors = [pageResult.error, blogResult.error, productResult.error, auditResult.error].filter(Boolean);
    if (errors.length) setError(errors.map(value => value?.message).join(" · "));
    const sources: PageSource[] = [
      ...(pageResult.data || []).map(row => ({ key: `page-${row.id}`, path: row.page_slug === "home" ? "/" : `/${row.page_slug}`, title: slugTitle(row.page_slug), source: "Website Page", text: flatten(row.content), updatedAt: row.updated_at })),
      ...(blogResult.data || []).filter(row => row.status !== "archived").map(row => ({ key: `blog-${row.id}`, path: `/blog/${row.slug}`, title: row.title, source: "Blog", text: `${row.title} ${row.excerpt || ""} ${row.content || ""}`, updatedAt: row.updated_at })),
      ...(productResult.data || []).filter(row => row.status !== "archived").map(row => ({ key: `product-${row.id}`, path: `/products/${row.slug}`, title: row.title, source: "Product", text: flatten(row), updatedAt: row.updated_at })),
    ];
    setPages(sources); setAudits(auditResult.data || []); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(""), 2600); return () => window.clearTimeout(id); }, [toast]);

  const auditMap = useMemo(() => new Map(audits.map(row => [row.page_path, row])), [audits]);
  const visible = useMemo(() => pages.filter(page => !query || `${page.title} ${page.path} ${page.source}`.toLowerCase().includes(query.toLowerCase())), [pages, query]);
  const summary = useMemo(() => {
    if (!audits.length) return { visibility: 0, readiness: 0, entity: 0, citations: 0 };
    const avg = (key: string) => Math.round(audits.reduce((sum, row) => sum + Number(row[key] || 0), 0) / audits.length);
    return { visibility: avg("ai_visibility_score"), readiness: avg("answer_readiness_score"), entity: avg("entity_consistency_score"), citations: audits.reduce((sum, row) => sum + Number(row.citation_opportunities || 0), 0) };
  }, [audits]);

  async function audit(page: PageSource) {
    setWorking(page.key); setError("");
    const result = scorePage(page);
    const payload = { page_path: page.path, page_title: page.title, ai_visibility_score: result.visibility, answer_readiness_score: result.readiness, entity_consistency_score: result.entity, citation_opportunities: result.citations, recommendations: result.recommendations, llms_txt_excerpt: `- [${page.title}](${page.path}): ${page.text.replace(/\s+/g, " ").trim().slice(0, 280)}`, last_audited_at: new Date().toISOString(), status: result.recommendations.length ? "Needs Review" : "Optimized", updated_at: new Date().toISOString() };
    const existing = auditMap.get(page.path);
    const response = existing?.id ? await supabase.from("geo_audits").update(payload).eq("id", existing.id) : await supabase.from("geo_audits").insert(payload);
    if (response.error) setError(response.error.message); else { setToast(`GEO audit completed for ${page.title}`); await load(); }
    setWorking("");
  }
  async function auditAll() {
    if (!pages.length) return;
    setWorking("all"); setError("");
    for (const page of pages) {
      const result = scorePage(page); const existing = auditMap.get(page.path);
      const payload = { page_path: page.path, page_title: page.title, ai_visibility_score: result.visibility, answer_readiness_score: result.readiness, entity_consistency_score: result.entity, citation_opportunities: result.citations, recommendations: result.recommendations, llms_txt_excerpt: `- [${page.title}](${page.path}): ${page.text.replace(/\s+/g, " ").trim().slice(0, 280)}`, last_audited_at: new Date().toISOString(), status: result.recommendations.length ? "Needs Review" : "Optimized", updated_at: new Date().toISOString() };
      const response = existing?.id ? await supabase.from("geo_audits").update(payload).eq("id", existing.id) : await supabase.from("geo_audits").insert(payload);
      if (response.error) { setError(response.error.message); break; }
    }
    setToast("GEO audit completed using the current website, product and blog content."); await load(); setWorking("");
  }

  const llms = audits.map(row => row.llms_txt_excerpt).filter(Boolean).join("\n");
  return <AdminShell><div className="os-page geo-command-center">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Generative Engine Optimization</div><h1 className="os-page-title">GEO Manager</h1><p className="os-page-subtitle">Audit the actual website, product and blog content for AI answer visibility, entity consistency, direct buyer answers and citation readiness.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/>Refresh</button><button className="os-btn primary" onClick={() => void auditAll()} disabled={working === "all" || !pages.length}><Sparkles className={working === "all" ? "animate-spin" : ""}/>{working === "all" ? "Auditing…" : "Audit All Live Pages"}</button></div></header>
    {error && <section className="os-card geo-alert"><div className="os-card-body"><AlertTriangle/><div><strong>GEO audit could not be completed</strong><p>{error}</p></div></div></section>}
    <section className="os-grid four seo-summary-grid">{[
      { label: "AI Visibility", value: summary.visibility, icon: Globe2, percentage: true },
      { label: "Answer Readiness", value: summary.readiness, icon: Bot, percentage: true },
      { label: "Entity Consistency", value: summary.entity, icon: CheckCircle2, percentage: true },
      { label: "Citation Opportunities", value: summary.citations, icon: Link2, percentage: false },
    ].map(item => { const Component = item.icon; return <article className="os-metric" key={item.label}><div className="os-metric-top"><span className="os-metric-label">{item.label}</span><span className="os-metric-icon"><Component/></span></div><div className="os-metric-value">{item.percentage ? `${item.value}%` : item.value}</div><div className="os-metric-foot"><b>{audits.length ? `${audits.length} live audits` : "No audit yet"}</b><span className="os-source-badge">GEO</span></div></article>; })}</section>
    <div className="os-tabs">{tabs.map(value => <button className={`os-tab ${tab === value ? "active" : ""}`} onClick={() => setTab(value)} key={value}>{value}</button>)}</div>
    {tab === "llms.txt" ? <section className="os-card"><div className="os-card-header"><div><h2>llms.txt Preview</h2><p>Generated only from pages that have been audited.</p></div></div><div className="os-card-body"><textarea className="geo-llms-preview" readOnly value={llms || "No audited pages yet."}/></div></section> : <section className="os-card"><div className="os-card-header"><div><h2>{tab === "Overview" ? "Page-Level GEO Audit" : tab}</h2><p>{visible.length} current website records</p></div><label className="os-search-field"><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search website pages, products or blogs…"/></label></div><div className="os-table-wrap"><table className="os-table"><thead><tr><th>Page</th><th>Source</th><th>Words</th><th>AI Visibility</th><th>Answer Readiness</th><th>Entity</th><th>Citations</th><th>Recommendations</th><th>Action</th></tr></thead><tbody>{visible.map(page => { const saved = auditMap.get(page.path); const live = scorePage(page); const recommendations: string[] = saved?.recommendations || live.recommendations; return <tr key={page.key}><td><strong>{page.title}</strong><span>{page.path}</span></td><td><span className="os-badge blue">{page.source}</span></td><td>{live.wordCount}</td><td>{saved ? `${saved.ai_visibility_score || 0}%` : "Not audited"}</td><td>{saved ? `${saved.answer_readiness_score || 0}%` : "Not audited"}</td><td>{saved ? `${saved.entity_consistency_score || 0}%` : "Not audited"}</td><td>{saved ? saved.citation_opportunities || 0 : "—"}</td><td><span className="geo-recommendation">{saved ? (recommendations[0] || "No open recommendation") : "Run audit to create recommendations"}</span></td><td><button className="os-btn soft" onClick={() => void audit(page)} disabled={working === page.key}><FileSearch/>{working === page.key ? "Auditing…" : saved ? "Re-audit" : "Run Audit"}</button></td></tr>; })}</tbody></table></div>{!loading && !visible.length && <div className="os-empty"><div className="os-empty-icon"><Globe2/></div><h3>No website content found</h3><p>Create or publish website pages, products or blogs before running GEO audits.</p></div>}</section>}
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>Scores were calculated from the current connected CMS content.</span></div></div></div>}
  </div></AdminShell>;
}
