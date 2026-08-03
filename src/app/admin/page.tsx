"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-client";
import { supabase } from "@/lib/supabase-client";
import {
  Activity, AlertTriangle, BarChart3, CalendarDays, CheckCircle2, ChevronRight,
  Download, Eye, FileSpreadsheet, Gauge, Globe2, Inbox, MapPinned, MousePointerClick, PackageCheck,
  Radio, RefreshCw, Search, Share2, Sparkles, TrendingUp, Truck, UploadCloud, UserRoundCheck,
  UsersRound, WandSparkles, ListTodo, Newspaper,
} from "lucide-react";

type NumberMap = Record<string, number>;
type AnyRow = Record<string, any>;
type AnalyticsData = {
  connected?: boolean;
  reason?: string;
  generatedAt?: string;
  summary?: { activeUsers?: number; totalUsers?: number; newUsers?: number; sessions?: number; pageViews?: number; bounceRate?: number; engagementRate?: number; averageSessionDuration?: number; keyEvents?: number; engagedSessions?: number };
  comparison?: NumberMap;
  trend?: AnyRow[];
  countries?: AnyRow[];
  sources?: AnyRow[];
  landingPages?: AnyRow[];
  topPages?: AnyRow[];
  events?: AnyRow[];
  realtime?: { activeUsers?: number; countries?: AnyRow[]; pages?: AnyRow[] };
};
type SearchConsoleData = {
  connected?: boolean;
  reason?: string;
  generatedAt?: string;
  summary?: { clicks?: number; impressions?: number; ctr?: number; position?: number };
  previous?: { clicks?: number; impressions?: number; ctr?: number; position?: number };
  daily?: AnyRow[];
  queries?: AnyRow[];
  pages?: AnyRow[];
};
type DashboardStore = {
  leads: AnyRow[];
  quotations: AnyRow[];
  shipments: AnyRow[];
  activities: AnyRow[];
  followups: AnyRow[];
  geoAudits: AnyRow[];
  blogPosts: AnyRow[];
  socialPosts: AnyRow[];
  teamTasks: AnyRow[];
  errors: string[];
};
type Metric = {
  label: string;
  value: string;
  compare: string;
  source: string;
  icon: ComponentType<{ className?: string }>;
  spark: number[];
  connected: boolean;
};

const nf = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const emptyStore: DashboardStore = { leads: [], quotations: [], shipments: [], activities: [], followups: [], geoAudits: [], blogPosts: [], socialPosts: [], teamTasks: [], errors: [] };

function normalize(value: unknown) { return String(value || "").trim().toLowerCase().replaceAll("_", " "); }
function isWon(row: AnyRow) { return Boolean(row.won_at) || ["won", "client", "converted to client"].includes(normalize(row.lifecycle_stage || row.status)); }
function isPendingQuote(row: AnyRow) { return !["accepted", "signed", "rejected", "expired", "cancelled"].includes(normalize(row.status)); }
function isActiveShipment(row: AnyRow) { return !["delivered", "completed", "closed", "cancelled"].includes(normalize(row.status || row.current_stage || row.current_status)); }
function pctChange(current: number, previous: number) { if (!previous) return current ? 100 : 0; return ((current - previous) / previous) * 100; }
function comparisonText(value: number | undefined, noun = "vs previous") {
  if (value === undefined || !Number.isFinite(value)) return "No comparison available";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}% ${noun}`;
}
function formatDuration(seconds = 0) { const minutes = Math.floor(seconds / 60); const rest = Math.round(seconds % 60); return `${minutes}m ${rest}s`; }
function dayKey(value: string | Date) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10); }
function seriesByDay(rows: AnyRow[], dateKey: string, days: number, predicate: (row: AnyRow) => boolean = () => true) {
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - Math.min(days - 1, 29));
  const counts = new Map<string, number>();
  for (let i = 0; i < Math.min(days, 30); i += 1) { const d = new Date(start); d.setDate(start.getDate() + i); counts.set(dayKey(d), 0); }
  rows.filter(predicate).forEach(row => { const key = dayKey(row[dateKey]); if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + 1); });
  return [...counts.values()];
}
function groupCount(rows: AnyRow[], key: string, fallback = "Not set") {
  const map = new Map<string, number>();
  rows.forEach(row => { const label = String(row[key] || fallback).trim() || fallback; map.set(label, (map.get(label) || 0) + 1); });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

async function tableRows(table: string, select: string, fallbackSelect?: string, limit = 500): Promise<{ rows: AnyRow[]; error?: string }> {
  const first = await supabase.from(table).select(select).order("created_at", { ascending: false }).limit(limit);
  if (!first.error) return { rows: first.data || [] };
  if (fallbackSelect) {
    const second = await supabase.from(table).select(fallbackSelect).order("created_at", { ascending: false }).limit(limit);
    if (!second.error) return { rows: second.data || [] };
    return { rows: [], error: `${table}: ${second.error.message}` };
  }
  return { rows: [], error: `${table}: ${first.error.message}` };
}

function Sparkline({ values }: { values: number[] }) {
  const safe = values.length ? values : [0, 0];
  const max = Math.max(...safe, 1), min = Math.min(...safe), range = Math.max(1, max - min);
  const points = safe.map((v, i) => `${4 + i * (52 / Math.max(1, safe.length - 1))},${20 - ((v - min) / range) * 16}`).join(" ");
  return <svg className="os-spark" viewBox="0 0 60 24" aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LineChart({ rows, valueKey, emptyLabel }: { rows: AnyRow[]; valueKey: string; emptyLabel: string }) {
  const values = rows.map(row => Number(row[valueKey] || 0));
  if (!values.length || values.every(value => value === 0)) return <EmptyInline text={emptyLabel} />;
  const width = 760, height = 240, max = Math.max(...values, 1);
  const points = values.map((value, index) => `${15 + index * ((width - 30) / Math.max(1, values.length - 1))},${height - 20 - (value / max) * (height - 45)}`).join(" ");
  return <div className="os-chart"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"><defs><linearGradient id="liveDashArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9366f" stopOpacity=".25" /><stop offset="1" stopColor="#d9366f" stopOpacity="0" /></linearGradient></defs>{[45, 85, 125, 165, 205].map(y => <line key={y} x1="0" x2={width} y1={y} y2={y} className="os-chart-grid" />)}<polygon points={`15,220 ${points} 745,220`} fill="url(#liveDashArea)" /><polyline points={points} className="os-chart-line" />{values.map((value, index) => { const [x, y] = points.split(" ")[index].split(","); return <circle key={index} cx={x} cy={y} r="3.5" fill="#d9366f"><title>{`${rows[index]?.date || rows[index]?.label || index + 1}: ${nf.format(value)}`}</title></circle>; })}</svg></div>;
}

function EmptyInline({ text }: { text: string }) { return <div className="os-empty" style={{ minHeight: 180, padding: 20 }}><div className="os-empty-icon"><BarChart3 /></div><h3>No live records yet</h3><p>{text}</p></div>; }

function RankedList({ items, emptyText, formatter }: { items: Array<[string, number, string?]>; emptyText: string; formatter?: (value: number) => string }) {
  if (!items.length) return <EmptyInline text={emptyText} />;
  const max = Math.max(...items.map(item => item[1]), 1);
  return <div className="os-list">{items.map(([label, value, sub], index) => <div className="os-list-row" key={`${label}-${sub || ""}-${index}`}><div className="os-list-main"><strong>{label}</strong>{sub && <span>{sub}</span>}<div className="os-progress" style={{ marginTop: 8 }}><span style={{ width: `${value / max * 100}%` }} /></div></div><span className="os-list-value">{formatter ? formatter(value) : nf.format(value)}</span></div>)}</div>;
}

function StatusList({ items, emptyText }: { items: Array<[string, number]>; emptyText: string }) {
  if (!items.length) return <EmptyInline text={emptyText} />;
  const total = items.reduce((sum, item) => sum + item[1], 0);
  return <div className="os-list">{items.map(([label, value]) => <div className="os-list-row" key={label}><div className="os-list-main"><strong>{label}</strong><span>{total ? `${(value / total * 100).toFixed(1)}% of records` : "0%"}</span><div className="os-progress" style={{ marginTop: 7 }}><span style={{ width: `${total ? value / total * 100 : 0}%` }} /></div></div><span className="os-list-value">{value}</span></div>)}</div>;
}

export default function ExecutiveDashboard() {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analytics30, setAnalytics30] = useState<AnalyticsData | null>(null);
  const [searchConsole, setSearchConsole] = useState<SearchConsoleData | null>(null);
  const [store, setStore] = useState<DashboardStore>(emptyStore);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const errors: string[] = [];
    try {
      const [gaResponse, ga30Response, gscResponse, leadsResult, quotesResult, shipmentsResult, activitiesResult, auditResult, followupsResult, geoResult, contactsResult, blogResult, socialResult, taskResult] = await Promise.all([
        adminFetch(`/api/admin/analytics?days=${days}`).then(response => response.json()).catch(error => ({ connected: false, reason: error.message })),
        adminFetch(`/api/admin/analytics?days=30`).then(response => response.json()).catch(error => ({ connected: false, reason: error.message })),
        adminFetch(`/api/admin/search-console?days=${days}`).then(response => response.json()).catch(error => ({ connected: false, reason: error.message })),
        tableRows("inquiries", "id,created_at,updated_at,name,email,company,whatsapp,country,product,quantity,status,notes,lifecycle_stage,lead_temperature,lead_source,next_follow_up_at,last_contact_at,won_at,lost_at,buyer_type,packaging_requirement,estimated_volume", "id,created_at,name,email,company,whatsapp,country,product,quantity,status,notes", 1000),
        tableRows("business_documents", "id,created_at,updated_at,document_type,document_number,status,buyer_name,buyer_company,buyer_country,issue_date,valid_until,total_quantity,quantity_unit,incoterm,viewed_at,sent_at,next_follow_up_at,grand_total,currency", undefined, 1000),
        tableRows("customer_shipments", "id,created_at,updated_at,reference_number,client_name,country,product,quantity,incoterm,freight_mode,container_type,etd,eta,current_stage,current_status,completion,document_status,status,recent_update,carrier_name,tracking_number", "id,created_at,updated_at,reference_number,etd,eta,current_status,carrier_name,tracking_number,origin,destination,milestones,documents,notes", 500),
        tableRows("b2b_activities", "id,activity_type,module,record_id,title,description,company_name,country,actor_email,metadata,created_at", undefined, 60),
        tableRows("audit_logs", "id,action,entity_type,entity_id,actor_email,after_data,created_at", undefined, 60),
        tableRows("b2b_followups", "id,title,due_at,priority,status,notes,created_at,inquiry_id,company_id,contact_id,document_id", undefined, 100),
        tableRows("geo_audits", "id,page_path,page_title,ai_visibility_score,answer_readiness_score,entity_consistency_score,citation_opportunities,recommendations,status,last_audited_at,created_at", undefined, 200),
        tableRows("b2b_contacts", "id,name,email,company_id,lifecycle,next_follow_up_at,created_at", undefined, 500),
        tableRows("blog_posts", "id,title,status,content_type,created_at,updated_at,published_at", undefined, 200),
        tableRows("social_scheduled_posts", "id,title,status,approval_status,platforms,created_at,updated_at,scheduled_at", undefined, 200),
        tableRows("team_tasks", "id,title,description,assigned_name,status,priority,due_at,module,created_at,updated_at", undefined, 300),
      ]);
      [leadsResult, quotesResult, shipmentsResult, activitiesResult, followupsResult, geoResult, contactsResult, blogResult, socialResult, taskResult].forEach(result => { if (result.error) errors.push(result.error); });
      const fallbackActivities = activitiesResult.rows.length ? activitiesResult.rows : auditResult.rows.map(row => ({
        id: row.id, module: row.entity_type || "System", title: row.action || "Activity", description: row.after_data ? "Record updated" : "System action", actor_email: row.actor_email, created_at: row.created_at,
      }));
      setAnalytics(gaResponse);
      setAnalytics30(ga30Response);
      setSearchConsole(gscResponse);
      const inferredFollowups: Record<string, any>[] = [
        ...leadsResult.rows.filter(row => row.next_follow_up_at).map(row => ({ id: `lead-${row.id}`, title: `Lead follow-up · ${row.name || row.company || row.email || "Inquiry"}`, due_at: row.next_follow_up_at, priority: normalize(row.lead_temperature) === "hot" ? "High" : "Normal", status: "Open", inquiry_id: row.id })),
        ...contactsResult.rows.filter(row => row.next_follow_up_at).map(row => ({ id: `contact-${row.id}`, title: `Contact follow-up · ${row.name || row.email || "Contact"}`, due_at: row.next_follow_up_at, priority: "Normal", status: "Open", contact_id: row.id })),
        ...quotesResult.rows.filter(row => row.next_follow_up_at).map(row => ({ id: `quote-${row.id}`, title: `Quotation follow-up · ${row.document_number || row.buyer_company || "Document"}`, due_at: row.next_follow_up_at, priority: "High", status: "Open", document_id: row.id })),
      ];
      const followupIds = new Set(followupsResult.rows.map(row => `${row.inquiry_id || ""}-${row.contact_id || ""}-${row.document_id || ""}-${row.due_at || ""}`));
      const mergedFollowups = [...followupsResult.rows, ...inferredFollowups.filter(row => !followupIds.has(`${row.inquiry_id || ""}-${row.contact_id || ""}-${row.document_id || ""}-${row.due_at || ""}`))];
      setStore({ leads: leadsResult.rows, quotations: quotesResult.rows, shipments: shipmentsResult.rows, activities: fallbackActivities, followups: mergedFollowups, geoAudits: geoResult.rows, blogPosts: blogResult.rows, socialPosts: socialResult.rows, teamTasks: taskResult.rows, errors });
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const timer = window.setInterval(() => void load(), 120000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2600); return () => window.clearTimeout(timer); }, [toast]);

  const periodStart = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - (days - 1)); d.setHours(0, 0, 0, 0); return d; }, [days]);
  const previousStart = useMemo(() => { const d = new Date(periodStart); d.setDate(d.getDate() - days); return d; }, [periodStart, days]);
  const currentLeads = store.leads.filter(row => new Date(row.created_at) >= periodStart);
  const previousLeads = store.leads.filter(row => { const d = new Date(row.created_at); return d >= previousStart && d < periodStart; });
  const wonCurrent = store.leads.filter(row => isWon(row) && new Date(row.won_at || row.updated_at || row.created_at) >= periodStart);
  const wonPrevious = store.leads.filter(row => { const d = new Date(row.won_at || row.updated_at || row.created_at); return isWon(row) && d >= previousStart && d < periodStart; });
  const pendingQuotes = store.quotations.filter(row => normalize(row.document_type) === "quotation" && isPendingQuote(row));
  const activeShipments = store.shipments.filter(isActiveShipment);
  const gaConnected = Boolean(analytics?.connected);
  const summary = analytics?.summary || {};
  const summary30 = analytics30?.summary || {};
  const gaTrend = analytics?.trend || [];
  const gaTrend30 = analytics30?.trend || [];

  const metrics: Metric[] = [
    { label: "Live Visitors", value: gaConnected ? nf.format(analytics?.realtime?.activeUsers || 0) : "—", compare: gaConnected ? `${analytics?.realtime?.pages?.length || 0} active pages` : analytics?.reason || "GA4 not connected", source: "GA4", icon: Radio, spark: (analytics?.realtime?.countries || []).map(row => Number(row.activeUsers || 0)), connected: gaConnected },
    { label: "Website Visitors · 30 Days", value: analytics30?.connected ? nf.format(summary30.totalUsers || summary30.activeUsers || 0) : "—", compare: analytics30?.connected ? comparisonText(analytics30?.comparison?.totalUsers ?? analytics30?.comparison?.activeUsers) : analytics30?.reason || "GA4 not connected", source: "GA4", icon: Globe2, spark: gaTrend30.map(row => Number(row.totalUsers || row.activeUsers || 0)), connected: Boolean(analytics30?.connected) },
    { label: "Sessions", value: gaConnected ? nf.format(summary.sessions || 0) : "—", compare: gaConnected ? comparisonText(analytics?.comparison?.sessions) : analytics?.reason || "GA4 not connected", source: "GA4", icon: Activity, spark: gaTrend.map(row => Number(row.sessions || 0)), connected: gaConnected },
    { label: "Users", value: gaConnected ? nf.format(summary.activeUsers || 0) : "—", compare: gaConnected ? comparisonText(analytics?.comparison?.activeUsers) : analytics?.reason || "GA4 not connected", source: "GA4", icon: UsersRound, spark: gaTrend.map(row => Number(row.activeUsers || 0)), connected: gaConnected },
    { label: "New Leads", value: nf.format(currentLeads.length), compare: comparisonText(pctChange(currentLeads.length, previousLeads.length)), source: "CRM", icon: Inbox, spark: seriesByDay(store.leads, "created_at", days), connected: !store.errors.some(error => error.startsWith("inquiries:")) },
    { label: "Won", value: nf.format(wonCurrent.length), compare: comparisonText(pctChange(wonCurrent.length, wonPrevious.length)), source: "CRM", icon: CheckCircle2, spark: seriesByDay(store.leads, "won_at", days, isWon), connected: !store.errors.some(error => error.startsWith("inquiries:")) },
    { label: "Pending Quotations", value: nf.format(pendingQuotes.length), compare: `${pendingQuotes.filter(row => normalize(row.status) === "viewed").length} viewed · ${pendingQuotes.filter(row => normalize(row.status).includes("revision")).length} revisions`, source: "Quotations", icon: FileSpreadsheet, spark: seriesByDay(store.quotations, "created_at", days, row => normalize(row.document_type) === "quotation"), connected: !store.errors.some(error => error.startsWith("business_documents:")) },
    { label: "Active Shipments", value: nf.format(activeShipments.length), compare: `${activeShipments.filter(row => row.eta && new Date(row.eta).getTime() - Date.now() <= 7 * 86400000 && new Date(row.eta) >= new Date()).length} arriving in 7 days`, source: "Export", icon: Truck, spark: seriesByDay(store.shipments, "created_at", days), connected: !store.errors.some(error => error.startsWith("customer_shipments:")) },
  ];

  const leadSources = groupCount(store.leads, "lead_source").map(([label, value]) => [label, value, `${store.leads.length ? (value / store.leads.length * 100).toFixed(1) : 0}% of leads`] as [string, number, string]);
  const leadStages = groupCount(store.leads, "lifecycle_stage").map(([label, value]) => [label, value] as [string, number]);
  const quoteStatuses = groupCount(store.quotations.filter(row => normalize(row.document_type) === "quotation"), "status").map(([label, value]) => [label, value] as [string, number]);
  const marketInterest = groupCount(store.leads, "country").filter(([country]) => country !== "Not set").map(([label, value]) => [label, value, `${value} inquiries`] as [string, number, string]);
  const trafficSources = (analytics?.sources || []).slice(0, 8).map(row => [String(row.channel || "Unassigned"), Number(row.sessions || 0), `${nf.format(Number(row.activeUsers || 0))} users`] as [string, number, string]);
  const countryTraffic = (analytics?.countries || []).slice(0, 8).map(row => [String(row.country || "Not set"), Number(row.activeUsers || 0), `${nf.format(Number(row.sessions || 0))} sessions`] as [string, number, string]);
  const landingPages = (analytics?.landingPages || []).slice(0, 8).map(row => [String(row.landingPage || "/"), Number(row.sessions || 0), `${nf.format(Number(row.keyEvents || 0))} key events`] as [string, number, string]);
  const searchQueries = (searchConsole?.queries || []).slice(0, 8).map(row => [String(row.query || "Unknown query"), Number(row.clicks || 0), `${nf.format(Number(row.impressions || 0))} impressions · position ${Number(row.position || 0).toFixed(1)}`] as [string, number, string]);
  const openFollowups = store.followups.filter(row => !["completed", "cancelled"].includes(normalize(row.status))).sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()).slice(0, 6);
  const geoAverage = (key: string) => store.geoAudits.length ? Math.round(store.geoAudits.reduce((sum, row) => sum + Number(row[key] || 0), 0) / store.geoAudits.length) : 0;
  const geoSummary = {
    visibility: geoAverage("ai_visibility_score"),
    readiness: geoAverage("answer_readiness_score"),
    entity: geoAverage("entity_consistency_score"),
    citations: store.geoAudits.reduce((sum, row) => sum + Number(row.citation_opportunities || 0), 0),
    pages: store.geoAudits.length,
  };

  const today = dayKey(new Date());
  const todaysBlogs = store.blogPosts.filter(row => dayKey(row.created_at || row.updated_at) === today);
  const todaysSocial = store.socialPosts.filter(row => dayKey(row.created_at || row.updated_at) === today);
  const pendingBlog = todaysBlogs.find(row => !["approved", "published"].includes(normalize(row.status)));
  const pendingSocial = todaysSocial.find(row => !["approved", "scheduled", "published"].includes(normalize(row.approval_status || row.status)));
  const newQueries = currentLeads.filter(row => ["new inquiry", "new", "pending"].includes(normalize(row.lifecycle_stage || row.status)));
  const dueTasks = store.teamTasks.filter(row => row.due_at && new Date(row.due_at) <= new Date(new Date().setHours(23,59,59,999)) && !["completed", "cancelled"].includes(normalize(row.status)));
  const pendingWork = [
    { label: "Today’s Blog", value: pendingBlog ? "Needs Review" : todaysBlogs.length ? "Approved / Published" : "Not Generated", href: "/admin/blog-center", icon: Newspaper, tone: pendingBlog ? "amber" : todaysBlogs.length ? "green" : "blue", detail: pendingBlog?.title || (todaysBlogs.length ? todaysBlogs[0]?.title : "Daily automation has not created today’s draft yet.") },
    { label: "Social Campaign", value: pendingSocial ? "Needs Review" : todaysSocial.length ? "Approved / Scheduled" : "Not Generated", href: "/admin/social-studio", icon: Share2, tone: pendingSocial ? "amber" : todaysSocial.length ? "green" : "blue", detail: pendingSocial?.title || (todaysSocial.length ? todaysSocial[0]?.title : "Today’s multi-platform campaign is not ready yet.") },
    { label: "New Queries", value: `${newQueries.length} Open`, href: "/admin/leads", icon: Inbox, tone: newQueries.length ? "pink" : "green", detail: newQueries.length ? "New enquiries are waiting for review or assignment." : "No new enquiry is waiting right now." },
    { label: "Team Tasks", value: `${dueTasks.length} Due`, href: "/admin/tasks", icon: ListTodo, tone: dueTasks.length ? "pink" : "green", detail: dueTasks.length ? "Due today or overdue team work requires attention." : "No team task is due today." },
  ];

  const tasksByOwner = [...store.teamTasks.filter(row => !["completed", "cancelled"].includes(normalize(row.status))).reduce((map, task) => { const owner = String(task.assigned_name || "Unassigned"); map.set(owner, [...(map.get(owner) || []), task]); return map; }, new Map<string, AnyRow[]>()).entries()].slice(0, 4);

  function exportReport() {
    const payload = { generatedAt: new Date().toISOString(), days, analytics, searchConsole, metrics: metrics.map(({ label, value, compare, source }) => ({ label, value, compare, source })), leads: store.leads.length, quotations: store.quotations.length, shipments: store.shipments.length };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `the-salt-origin-executive-report-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
    setToast("Live executive report exported");
  }

  return <AdminShell><div className="os-page">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Executive overview</div><h1 className="os-page-title">Executive Dashboard</h1></div><div className="os-page-actions"><select className="os-field" value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select><button className="os-btn soft" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />{loading ? "Refreshing…" : "Refresh"}</button><button className="os-btn primary" onClick={exportReport}><Download />Export Report</button></div></header>

    <section className="os-metrics-eight">{metrics.map(metric => { const Icon = metric.icon; return <article className={`os-metric ${metric.connected ? "" : "is-disconnected"}`} key={metric.label}><div className="os-metric-top"><span className="os-metric-label">{metric.label}</span><span className="os-metric-icon"><Icon /></span></div><div className="os-metric-value">{loading && !lastUpdated ? "…" : metric.value}</div><div className="os-metric-foot"><b title={metric.compare}>{metric.compare}</b><Sparkline values={metric.spark} /><span className={`os-source-badge ${metric.connected ? "" : "offline"}`}>{metric.connected ? metric.source : "Connection"}</span></div></article>; })}</section>

    <div className="dashboard-compact-grid">
      <section className="os-card dashboard-traffic-card"><div className="os-card-header"><div><h2>Website Traffic Trend</h2><p>Real GA4 sessions for the selected period</p></div><span className={`os-badge ${gaConnected ? "green" : "amber"}`}>{gaConnected ? "GA4" : "Connection"}</span></div><div className="os-card-body"><LineChart rows={gaTrend} valueKey="sessions" emptyLabel={analytics?.reason || "No GA4 sessions were returned for this period."} /></div></section>
      <section className="os-card dashboard-compact-card"><div className="os-card-header"><div><h2>Traffic Sources</h2><p>GA4 acquisition channels</p></div></div><div className="os-card-body"><RankedList items={trafficSources.slice(0,5)} emptyText={analytics?.reason || "No traffic-source records are available."} /></div></section>
      <section className="os-card dashboard-compact-card"><div className="os-card-header"><div><h2>Visitors by Country</h2><p>Export-market interest</p></div><MapPinned size={17} /></div><div className="os-card-body"><RankedList items={countryTraffic.slice(0,5)} emptyText={analytics?.reason || "No country traffic is available."} /></div></section>
      <section className="os-card dashboard-compact-card"><div className="os-card-header"><div><h2>Lead Sources</h2><p>Actual inquiry sources</p></div><Inbox size={17} /></div><div className="os-card-body"><RankedList items={leadSources.slice(0,5)} emptyText="No lead-source records exist yet." /></div></section>
    </div>

    <section className="os-card pending-work-panel"><div className="os-card-header"><div><h2>Today’s Pending Work</h2><p>Content approvals, enquiries and team tasks requiring attention</p></div><Link href="/admin/tasks" className="os-btn soft">Open Team Tasks<ChevronRight /></Link></div><div className="os-card-body"><div className="pending-work-grid">{pendingWork.map(item => { const Icon = item.icon; return <Link href={item.href} className="pending-work-item" key={item.label}><span className={`pending-work-icon ${item.tone}`}><Icon /></span><div><span>{item.label}</span><strong>{item.value}</strong><p>{item.detail}</p></div><ChevronRight /></Link>; })}</div></div></section>

    <section className="os-card dashboard-team-board"><div className="os-card-header"><div><h2>Team Workboard</h2><p>ClickUp-style open work grouped by assigned person</p></div><Link href="/admin/tasks?action=create" className="os-btn primary"><ListTodo />Add Task</Link></div><div className="os-card-body">{tasksByOwner.length ? <div className="dashboard-owner-grid">{tasksByOwner.map(([owner, tasks]) => <article className="dashboard-owner-card" key={owner}><div><span className="os-avatar">{owner.split(/\s+/).map((part: string) => part[0]).join("").slice(0,2).toUpperCase()}</span><div><strong>{owner}</strong><small>{tasks.length} open tasks</small></div></div>{tasks.slice(0,4).map((task: AnyRow) => <Link href="/admin/tasks" key={task.id}><span>{task.title}</span><b className={task.due_at && new Date(task.due_at) < new Date() ? "overdue" : ""}>{task.due_at ? new Date(task.due_at).toLocaleDateString() : task.status}</b></Link>)}{tasks.length > 4 && <small>+{tasks.length - 4} more tasks</small>}</article>)}</div> : <div className="os-empty compact-empty"><div className="os-empty-icon"><ListTodo /></div><h3>No team tasks yet</h3><p>Add real tasks for Hamza, Ali or any team member. No dummy work is displayed.</p></div>}</div></section>

    <div className="os-grid three">
      <section className="os-card"><div className="os-card-header"><div><h2>Quotation Status</h2><p>Actual quotation workflow records</p></div><FileSpreadsheet size={17} /></div><div className="os-card-body"><StatusList items={quoteStatuses} emptyText="No quotations have been created yet." /></div></section>
      <section className="os-card"><div className="os-card-header"><div><h2>Top Landing Pages</h2><p>Real GA4 landing-page sessions</p></div><MousePointerClick size={17} /></div><div className="os-card-body"><RankedList items={landingPages} emptyText={analytics?.reason || "No landing-page data is available."} /></div></section>
      <section className="os-card"><div className="os-card-header"><div><h2>Top Search Keywords</h2><p>Actual Google Search Console queries</p></div><Search size={17} /></div><div className="os-card-body"><RankedList items={searchQueries} emptyText={searchConsole?.reason || "No Search Console query data is available."} /></div></section>
    </div>

    <div className="os-grid two">
      <section className="os-card"><div className="os-card-header"><div><h2>Export Market Interest</h2><p>Countries from real leads and RFQs</p></div><Globe2 size={17} /></div><div className="os-card-body"><RankedList items={marketInterest} emptyText="No lead countries have been recorded yet." /></div></section>
      <section className="os-card"><div className="os-card-header"><div><h2>Recent Client Activity</h2><p>Database activity generated by lead, quotation and shipment actions</p></div><Link href="/admin/activity-logs" className="os-btn soft">Open Logs<ChevronRight /></Link></div><div className="os-card-body">{store.activities.length ? <div className="os-timeline os-activity-timeline">{store.activities.slice(0, 8).map(activity => <div className="os-timeline-item" key={activity.id}><i /><div className="os-activity-copy"><strong>{activity.title || activity.action || "Activity"}</strong><span>{activity.description || activity.module || activity.entity_type || "CMS record"}</span><small><b>{activity.module || activity.entity_type || "CMS"}</b>{activity.created_at ? ` · ${dateFormatter.format(new Date(activity.created_at))}` : ""}{activity.actor_email ? ` · ${activity.actor_email}` : ""}</small></div></div>)}</div> : <EmptyInline text="No real client activity has been recorded yet." />}</div></section>
    </div>

    <div className="os-grid two">
      <section className="os-card"><div className="os-card-header"><div><h2>Active Shipment Timeline</h2><p>Current stages from live export-operation records</p></div><Link className="os-btn soft" href="/admin/production-shipments">Open Shipments<ChevronRight /></Link></div><div className="os-card-body">{activeShipments.length ? <div className="os-list">{activeShipments.slice(0, 8).map(shipment => { const completion = Math.max(0, Math.min(100, Number(shipment.completion || 0))); return <div className="os-list-row" key={shipment.id}><span className="os-list-icon"><Truck /></span><div className="os-list-main"><strong>{shipment.reference_number || "Shipment"}{shipment.client_name ? ` · ${shipment.client_name}` : ""}</strong><span>{shipment.current_stage || shipment.current_status || "Booked"}{shipment.eta ? ` · ETA ${new Date(shipment.eta).toLocaleDateString()}` : ""}</span><div className="os-progress" style={{ marginTop: 7 }}><span style={{ width: `${completion}%` }} /></div></div><span className="os-list-value">{completion}%</span></div>; })}</div> : <EmptyInline text="No active shipment records exist yet." />}</div></section>
      <section className="os-card"><div className="os-card-header"><div><h2>Inquiry Trend</h2><p>New lead records created during the selected period</p></div><span className="os-badge blue">CRM</span></div><div className="os-card-body"><LineChart rows={Array.from({ length: Math.min(days, 30) }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (Math.min(days, 30) - 1 - index)); const key = dayKey(date); return { date: key, inquiries: store.leads.filter(row => dayKey(row.created_at) === key).length }; })} valueKey="inquiries" emptyLabel="No inquiries were created during this period." /></div></section>
    </div>

    <div className="os-grid four dashboard-intelligence-grid">
      <section className="os-card"><div className="os-card-header"><div><h2>Search Console Performance</h2><p>Google organic visibility for the selected period</p></div><span className={`os-badge ${searchConsole?.connected ? "green" : "amber"}`}>{searchConsole?.connected ? "Connected" : "Connection Required"}</span></div><div className="os-card-body">{searchConsole?.connected ? <div className="os-grid two"><article className="os-mini-stat"><span>Clicks</span><strong>{nf.format(searchConsole.summary?.clicks || 0)}</strong></article><article className="os-mini-stat"><span>Impressions</span><strong>{nf.format(searchConsole.summary?.impressions || 0)}</strong></article><article className="os-mini-stat"><span>CTR</span><strong>{((searchConsole.summary?.ctr || 0) * 100).toFixed(1)}%</strong></article><article className="os-mini-stat"><span>Avg. Position</span><strong>{Number(searchConsole.summary?.position || 0).toFixed(1)}</strong></article></div> : <EmptyInline text={searchConsole?.reason || "Search Console is not connected."} />}</div></section>
      <section className="os-card"><div className="os-card-header"><div><h2>GA4 Performance</h2><p>Engagement and website usage from Google Analytics</p></div><Gauge size={17} /></div><div className="os-card-body">{gaConnected ? <div className="os-grid two"><article className="os-mini-stat"><span>Page Views</span><strong>{nf.format(summary.pageViews || 0)}</strong></article><article className="os-mini-stat"><span>Engaged Sessions</span><strong>{nf.format(summary.engagedSessions || 0)}</strong></article><article className="os-mini-stat"><span>Engagement Rate</span><strong>{((summary.engagementRate || 0) * 100).toFixed(1)}%</strong></article><article className="os-mini-stat"><span>Avg. Session</span><strong>{formatDuration(summary.averageSessionDuration || 0)}</strong></article></div> : <EmptyInline text={analytics?.reason || "GA4 is not connected."} />}</div></section>
      <section className="os-card"><div className="os-card-header"><div><h2>GEO Performance</h2><p>AI-search readiness from saved page audits</p></div><Link className="os-btn soft" href="/admin/geo-manager">Open GEO<ChevronRight /></Link></div><div className="os-card-body">{geoSummary.pages ? <div className="os-grid two"><article className="os-mini-stat"><span>AI Visibility</span><strong>{geoSummary.visibility}%</strong></article><article className="os-mini-stat"><span>Answer Readiness</span><strong>{geoSummary.readiness}%</strong></article><article className="os-mini-stat"><span>Entity Consistency</span><strong>{geoSummary.entity}%</strong></article><article className="os-mini-stat"><span>Citation Opportunities</span><strong>{geoSummary.citations}</strong></article></div> : <EmptyInline text="No GEO page audits exist yet. Run an audit from GEO Manager." />}</div></section>
      <section className="os-card"><div className="os-card-header"><div><h2>Upcoming Follow-Ups</h2><p>Open CRM and quotation reminders</p></div><Link className="os-btn soft" href="/admin/leads">Open Leads<ChevronRight /></Link></div><div className="os-card-body">{openFollowups.length ? <div className="os-list">{openFollowups.map(followup => <div className="os-list-row" key={followup.id}><span className="os-list-icon"><CalendarDays /></span><div className="os-list-main"><strong>{followup.title}</strong><span>{followup.due_at ? dateFormatter.format(new Date(followup.due_at)) : "No due date"} · {followup.priority || "Normal"}</span></div><span className={`os-badge ${new Date(followup.due_at) < new Date() ? "pink" : "blue"}`}>{new Date(followup.due_at) < new Date() ? "Overdue" : followup.status}</span></div>)}</div> : <EmptyInline text="No open follow-up reminders exist yet." />}</div></section>
    </div>

    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2 /></span><div><strong>{toast}</strong><span>The file contains data currently loaded from your connected sources.</span></div></div></div>}
  </div></AdminShell>;
}
