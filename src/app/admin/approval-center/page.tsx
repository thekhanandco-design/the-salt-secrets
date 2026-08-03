"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { Check, CheckCircle2, Edit3, Eye, Filter, MessageSquare, RefreshCw, Search, X, XCircle, AlertTriangle } from "lucide-react";

type Comment = { text?: string; author?: string; created_at?: string };
type Approval = {
  id: string;
  content_type: string;
  record_id?: string | null;
  title: string;
  creator_name?: string | null;
  ai_agent?: string | null;
  created_at: string;
  status: string;
  change_summary?: string | null;
  preview_url?: string | null;
  comments?: Comment[] | null;
  reviewed_at?: string | null;
  scheduled_at?: string | null;
};

const tabs = ["All", "Blogs", "Images", "Social Posts", "FAQs", "Website Changes", "SEO Changes", "Quotations"];
const tabTypes: Record<string, string[]> = {
  Blogs: ["Blog", "Blog Post", "SEO Article"], Images: ["Image", "Generated Image"],
  "Social Posts": ["Social Post", "Facebook Post", "Instagram Post", "LinkedIn Post", "Pinterest Pin", "Threads Post", "TikTok Post", "YouTube Post", "X Post"],
  FAQs: ["FAQ", "FAQ Article"], "Website Changes": ["Website Change", "Website Text", "Website Image"],
  "SEO Changes": ["SEO Change", "GEO Change"], Quotations: ["Quotation", "Export Document"],
};

function tone(status: string) {
  const value = status.toLowerCase();
  if (["approved", "scheduled", "published"].includes(value)) return "green";
  if (value === "rejected") return "red";
  if (value === "changes requested") return "amber";
  if (value === "draft") return "blue";
  return "pink";
}
function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function ApprovalCenter() {
  const [items, setItems] = useState<Approval[]>([]);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Approval | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const { data, error: loadError } = await supabase.from("approval_items").select("*").order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setItems((data || []) as Approval[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2600); return () => window.clearTimeout(timer); }, [toast]);

  const filtered = useMemo(() => items.filter(item => {
    const matchesTab = tab === "All" || (tabTypes[tab] || []).some(type => type.toLowerCase() === item.content_type.toLowerCase());
    const haystack = `${item.title} ${item.creator_name || ""} ${item.ai_agent || ""} ${item.content_type} ${item.status}`.toLowerCase();
    return matchesTab && (!query || haystack.includes(query.toLowerCase()));
  }), [items, query, tab]);

  async function setStatus(item: Approval, status: string) {
    setSaving(true); setError("");
    const { data: auth } = await supabase.auth.getSession();
    const nextComments = reviewComment.trim()
      ? [...(Array.isArray(item.comments) ? item.comments : []), { text: reviewComment.trim(), author: auth.session?.user.email || "Admin", created_at: new Date().toISOString() }]
      : (Array.isArray(item.comments) ? item.comments : []);
    const patch: Record<string, unknown> = {
      status,
      comments: nextComments,
      reviewer_id: auth.session?.user.id || null,
      reviewed_at: ["Approved", "Rejected", "Changes Requested"].includes(status) ? new Date().toISOString() : item.reviewed_at || null,
    };
    if (status === "Scheduled") patch.scheduled_at = item.scheduled_at || new Date().toISOString();
    if (status === "Published") patch.published_at = new Date().toISOString();
    const { data, error: updateError } = await supabase.from("approval_items").update(patch).eq("id", item.id).select("*").single();
    if (updateError) setError(updateError.message);
    else {
      setItems(previous => previous.map(row => row.id === item.id ? data as Approval : row));
      setSelected(previous => previous?.id === item.id ? data as Approval : previous);
      setReviewComment(""); setToast(`Approval moved to ${status}`);
      await supabase.from("b2b_activities").insert({
        activity_type: "approval_status_changed", module: "Approval Center", record_id: item.id,
        title: `${item.title} moved to ${status}`, description: reviewComment.trim() || `Approval status updated to ${status}`,
        actor_id: auth.session?.user.id || null, actor_email: auth.session?.user.email || null,
        metadata: { content_type: item.content_type, previous_status: item.status, status },
      });
    }
    setSaving(false);
  }

  async function approveVisible() {
    const targets = filtered.filter(item => ["Draft", "Needs Review", "Changes Requested"].includes(item.status));
    if (!targets.length) { setToast("No visible records are waiting for approval"); return; }
    if (!window.confirm(`Approve ${targets.length} visible records?`)) return;
    setSaving(true); setError("");
    const ids = targets.map(item => item.id);
    const { error: updateError } = await supabase.from("approval_items").update({ status: "Approved", reviewed_at: new Date().toISOString() }).in("id", ids);
    if (updateError) setError(updateError.message); else { setToast(`${targets.length} records approved`); await load(); }
    setSaving(false);
  }

  return <AdminShell><div className="os-page">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Human governance · live database</div><h1 className="os-page-title">Approval Center</h1><p className="os-page-subtitle">Only real approval records from Supabase are displayed. AI and team content remains blocked until a human changes its status.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/>Refresh</button><button className="os-btn primary" onClick={() => void approveVisible()} disabled={saving}><CheckCircle2/>Approve Visible</button></div></header>

    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body" style={{ display: "flex", gap: 12 }}><AlertTriangle/><div><strong>Live approval table unavailable</strong><p className="os-page-subtitle">{error}</p><p className="os-page-subtitle">Run <b>supabase/ENTERPRISE-B2B-LIVE-DATA.sql</b> once. No dummy approval records are used.</p></div></div></section>}

    <div className="os-grid four">{[
      ["Needs Review", items.filter(i => i.status === "Needs Review").length],
      ["Changes Requested", items.filter(i => i.status === "Changes Requested").length],
      ["Approved", items.filter(i => i.status === "Approved").length],
      ["Scheduled", items.filter(i => i.status === "Scheduled").length],
    ].map(([label, value]) => <article className="os-metric" key={String(label)}><div className="os-metric-top"><span className="os-metric-label">{label}</span><span className="os-metric-icon"><CheckCircle2/></span></div><div className="os-metric-value">{value}</div><div className="os-metric-foot"><b>Live records</b></div></article>)}</div>

    <div className="os-tabs">{tabs.map(value => <button className={`os-tab ${tab === value ? "active" : ""}`} onClick={() => setTab(value)} key={value}>{value}</button>)}</div>
    <section className="os-card"><div className="os-card-header"><div><h2>{tab}</h2><p>{filtered.length} live approval records</p></div><span className="os-badge amber">Nothing auto-publishes</span></div><div className="os-card-body"><div className="os-toolbar"><div className="os-toolbar-left"><label className="os-search-field"><Search/><input placeholder="Search approvals…" value={query} onChange={event => setQuery(event.target.value)}/></label><button className="os-btn soft" onClick={() => setQuery("")}><Filter/>Clear Filter</button></div></div>
      {loading ? <div className="os-skeleton-list">{[1,2,3].map(value => <div className="os-skeleton" key={value}/>)}</div> : filtered.length ? <div style={{ display: "grid", gap: 10, marginTop: 14 }}>{filtered.map(item => <article className="os-approval-card" key={item.id}>
        {item.preview_url ? <img className="os-approval-thumb" src={item.preview_url} alt=""/> : <div className="os-approval-thumb" style={{ display: "grid", placeItems: "center" }}><Eye/></div>}
        <div className="os-approval-main"><div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}><span className="os-badge blue">{item.content_type}</span><span className={`os-badge ${tone(item.status)}`}>{item.status}</span></div><h3 style={{ marginTop: 8 }}>{item.title}</h3><p>{item.change_summary || "No change summary was supplied."}</p><div className="os-approval-meta"><span className="os-badge">{item.creator_name || "Admin"}</span><span className="os-badge">{item.ai_agent || "Manual"}</span><span className="os-badge">{formatDate(item.created_at)}</span><span className="os-badge"><MessageSquare size={10}/>{Array.isArray(item.comments) ? item.comments.length : 0}</span></div></div>
        <div className="os-approval-actions"><button className="os-btn soft" onClick={() => setSelected(item)}><Eye/>Preview</button><button className="os-btn soft" onClick={() => setSelected(item)}><Edit3/>Review</button><button className="os-btn success" onClick={() => void setStatus(item, "Approved")} disabled={saving}><Check/>Approve</button><button className="os-btn soft" onClick={() => void setStatus(item, "Changes Requested")} disabled={saving}><MessageSquare/>Request Changes</button><button className="os-btn danger" onClick={() => void setStatus(item, "Rejected")} disabled={saving}><XCircle/>Reject</button></div>
      </article>)}</div> : <div className="os-empty"><div className="os-empty-icon"><CheckCircle2/></div><h3>No approval records</h3><p>New blog, image, social, FAQ, website, SEO and quotation review requests will appear here from the live database.</p></div>}
    </div></section>

    {selected && <div className="os-drawer-backdrop" onMouseDown={() => setSelected(null)}><aside className="os-drawer" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><h2>{selected.title}</h2><p className="os-page-subtitle">{selected.content_type} · {selected.status}</p></div><button className="os-icon-button" onClick={() => setSelected(null)} aria-label="Close"><X/></button></div><div className="os-card-body">
      {selected.preview_url ? <img src={selected.preview_url} alt="Preview" style={{ width: "100%", maxHeight: 320, objectFit: "contain", borderRadius: 16, border: "1px solid var(--os-line)" }}/> : <div className="os-empty"><div className="os-empty-icon"><Eye/></div><h3>No preview file attached</h3><p>The record can still be reviewed through its change summary and linked module.</p></div>}
      <div style={{ display: "flex", gap: 7, marginTop: 14, flexWrap: "wrap" }}><span className={`os-badge ${tone(selected.status)}`}>{selected.status}</span><span className="os-badge">Created by {selected.creator_name || "Admin"}</span><span className="os-badge">{formatDate(selected.created_at)}</span></div>
      <h3 style={{ fontSize: 14, marginTop: 18 }}>Change Summary</h3><p className="os-page-subtitle">{selected.change_summary || "No summary supplied."}</p>
      {Array.isArray(selected.comments) && selected.comments.length > 0 && <><h3 style={{ fontSize: 14, marginTop: 18 }}>Review History</h3><div className="os-list">{selected.comments.map((comment, index) => <div className="os-list-row" key={`${comment.created_at}-${index}`}><span className="os-list-icon"><MessageSquare/></span><div className="os-list-main"><strong>{comment.author || "Reviewer"}</strong><span>{comment.text || ""}</span><small>{formatDate(comment.created_at)}</small></div></div>)}</div></>}
      <label className="os-label" style={{ marginTop: 18 }}><span>Reviewer comments</span><textarea value={reviewComment} onChange={event => setReviewComment(event.target.value)} placeholder="Add a clear approval note or requested change…"/></label>
      <div className="os-grid two" style={{ marginTop: 16 }}><button className="os-btn success" onClick={() => void setStatus(selected, "Approved")} disabled={saving}><Check/>Approve</button><button className="os-btn soft" onClick={() => void setStatus(selected, "Changes Requested")} disabled={saving}><MessageSquare/>Request Changes</button><button className="os-btn danger" onClick={() => void setStatus(selected, "Rejected")} disabled={saving}><XCircle/>Reject</button><button className="os-btn primary" onClick={() => void setStatus(selected, "Scheduled")} disabled={saving || selected.status !== "Approved"}><CheckCircle2/>Schedule Approved Item</button></div>
    </div></aside></div>}
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>The live approval record was updated.</span></div></div></div>}
  </div></AdminShell>;
}
