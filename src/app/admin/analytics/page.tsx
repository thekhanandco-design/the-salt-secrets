"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-client";
import { supabase } from "@/lib/supabase-client";
import {
  Activity, BarChart3, BookOpenCheck, Bot, Clock3, Eye, Gauge, Globe2, Link2,
  MousePointerClick, Radio, RefreshCw, Search, Sparkles, TrendingUp, UsersRound,
} from "lucide-react";

type Row = Record<string, any>;
type AnalyticsData = {
  connected?: boolean; reason?: string; generatedAt?: string;
  summary?: { activeUsers?: number; totalUsers?: number; newUsers?: number; sessions?: number; pageViews?: number; engagementRate?: number; averageSessionDuration?: number; keyEvents?: number };
  comparison?: Record<string, number>; trend?: Row[]; sources?: Row[]; countries?: Row[]; landingPages?: Row[]; devices?: Row[]; browsers?: Row[]; events?: Row[];
  realtime?: { activeUsers?: number; countries?: Row[]; pages?: Row[]; sources?: Row[] };
};
type SearchData = { connected?: boolean; reason?: string; summary?: { clicks?: number; impressions?: number; ctr?: number; position?: number }; previous?: { clicks?: number; impressions?: number; ctr?: number; position?: number }; daily?: Row[]; queries?: Row[]; pages?: Row[]; countries?: Row[]; devices?: Row[] };

const nf = new Intl.NumberFormat("en-US");
function percent(value = 0) { return `${(value * 100).toFixed(1)}%`; }
function duration(value = 0) { const minutes = Math.floor(value / 60); return `${minutes}m ${Math.round(value % 60)}s`; }
function change(current = 0, previous = 0) { if (!previous) return current ? 100 : 0; return (current - previous) / previous * 100; }
function comparison(value?: number) { if (value === undefined || !Number.isFinite(value)) return "No comparison"; return `${value >= 0 ? "+" : ""}${value.toFixed(1)}% vs previous`; }
function parseRecommendations(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap(item => Array.isArray(item) ? item.map(String) : [String(item)]).filter(Boolean);
  if (typeof value === "string") { try { return parseRecommendations(JSON.parse(value)); } catch { return value.split("\n").map(item => item.trim()).filter(Boolean); } }
  return [];
}
function MiniLine({ values }: { values: number[] }) {
  const data = values.length ? values : [0, 0, 0, 0];
  const max = Math.max(1, ...data); const min = Math.min(...data); const span = Math.max(1, max - min);
  const points = data.map((value, index) => `${(index / Math.max(1, data.length - 1)) * 100},${38 - ((value - min) / span) * 30}`).join(" ");
  return <svg viewBox="0 0 100 42" className="os-mini-spark"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function TrafficChart({ rows }: { rows: Row[] }) {
  const values = rows.map(row => Number(row.sessions || row.pageViews || row.activeUsers || 0));
  if (!values.length || values.every(value => value === 0)) return <Empty title="No traffic trend" text="GA4 returned no traffic rows for the selected period."/>;
  const width = 760, height = 220, max = Math.max(...values, 1), min = Math.min(...values), span = Math.max(1, max - min);
  const points = values.map((value, index) => `${18 + index * ((width - 36) / Math.max(1, values.length - 1))},${height - 20 - ((value - min) / span) * (height - 48)}`).join(" ");
  return <div className="analytics-traffic-chart"><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"><defs><linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9366f" stopOpacity=".22"/><stop offset="1" stopColor="#d9366f" stopOpacity="0"/></linearGradient></defs>{[40,80,120,160,200].map(y => <line key={y} x1="0" x2={width} y1={y} y2={y} className="os-chart-grid"/>)}<polygon points={`18,200 ${points} 742,200`} fill="url(#analyticsArea)"/><polyline points={points} className="os-chart-line"/>{values.map((value,index)=>{const [x,y]=points.split(" ")[index].split(","); return <circle key={index} cx={x} cy={y} r="3" fill="#d9366f"><title>{nf.format(value)}</title></circle>})}</svg></div>;
}
function Empty({ title, text }: { title: string; text: string }) { return <div className="os-empty compact"><div className="os-empty-icon"><BarChart3 /></div><h3>{title}</h3><p>{text}</p></div>; }
function Rows({ rows, labelKey, valueKey, suffix = "" }: { rows: Row[]; labelKey: string; valueKey: string; suffix?: string }) {
  const max = Math.max(1, ...rows.map(row => Number(row[valueKey] || 0)));
  return <div className="os-list analytics-ranked-list">{rows.slice(0, 7).map((row, index) => <div className="os-list-row" key={`${row[labelKey]}-${index}`}><div className="os-list-main"><strong>{String(row[labelKey] || "Unknown")}</strong><div className="os-progress" style={{ marginTop: 7 }}><span style={{ width: `${Number(row[valueKey] || 0) / max * 100}%` }} /></div></div><span className="os-list-value">{nf.format(Number(row[valueKey] || 0))}{suffix}</span></div>)}</div>;
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [search, setSearch] = useState<SearchData | null>(null);
  const [geo, setGeo] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  const load = useCallback(async () => {
    setLoading(true);
    const [gaResponse, searchResponse, geoResult] = await Promise.all([
      adminFetch(`/api/admin/analytics?days=${days}`),
      adminFetch(`/api/admin/search-console?days=${days}`),
      supabase.from("geo_audits").select("*").order("last_audited_at", { ascending: false }).limit(250),
    ]);
    setAnalytics(await gaResponse.json());
    setSearch(await searchResponse.json());
    setGeo(geoResult.error ? [] : geoResult.data || []);
    setLoading(false);
  }, [days]);
  useEffect(() => { void load(); }, [load]);

  const trend = analytics?.trend || [];
  const seoTrend = search?.daily || [];
  const geoSummary = useMemo(() => {
    const average = (key: string) => geo.length ? Math.round(geo.reduce((sum, row) => sum + Number(row[key] || 0), 0) / geo.length) : 0;
    const recommendations = geo.flatMap(row => parseRecommendations(row.recommendations));
    return { visibility: average("ai_visibility_score"), readiness: average("answer_readiness_score"), entity: average("entity_consistency_score"), citations: geo.reduce((sum, row) => sum + Number(row.citation_opportunities || 0), 0), recommendations };
  }, [geo]);

  const metrics = [
    { label: "Live Visitors", value: analytics?.connected ? nf.format(analytics.realtime?.activeUsers || 0) : "—", compare: analytics?.connected ? "Realtime GA4" : "Connection Required", source: "GA4", icon: Radio, values: [analytics?.realtime?.activeUsers || 0] },
    { label: `Visitors · ${days} Days`, value: analytics?.connected ? nf.format(analytics.summary?.activeUsers || 0) : "—", compare: analytics?.connected ? comparison(analytics?.comparison?.activeUsers) : "Connection Required", source: "GA4", icon: Eye, values: trend.map(row => Number(row.activeUsers || 0)) },
    { label: "Sessions", value: analytics?.connected ? nf.format(analytics.summary?.sessions || 0) : "—", compare: analytics?.connected ? comparison(analytics?.comparison?.sessions) : "Connection Required", source: "GA4", icon: Activity, values: trend.map(row => Number(row.sessions || 0)) },
    { label: "Users", value: analytics?.connected ? nf.format(analytics.summary?.totalUsers || 0) : "—", compare: analytics?.connected ? comparison(analytics?.comparison?.totalUsers) : "Connection Required", source: "GA4", icon: UsersRound, values: trend.map(row => Number(row.totalUsers || 0)) },
    { label: "Organic Clicks", value: search?.connected ? nf.format(search.summary?.clicks || 0) : "—", compare: search?.connected ? comparison(change(search.summary?.clicks, search.previous?.clicks)) : "Connection Required", source: "GSC", icon: MousePointerClick, values: seoTrend.map(row => Number(row.clicks || 0)) },
    { label: "Impressions", value: search?.connected ? nf.format(search.summary?.impressions || 0) : "—", compare: search?.connected ? comparison(change(search.summary?.impressions, search.previous?.impressions)) : "Connection Required", source: "GSC", icon: TrendingUp, values: seoTrend.map(row => Number(row.impressions || 0)) },
    { label: "AI Visibility", value: geo.length ? `${geoSummary.visibility}%` : "—", compare: geo.length ? `${geo.length} audited pages` : "Run GEO Audit", source: "GEO", icon: Sparkles, values: geo.map(row => Number(row.ai_visibility_score || 0)) },
    { label: "Answer Readiness", value: geo.length ? `${geoSummary.readiness}%` : "—", compare: geo.length ? `${geoSummary.citations} citation opportunities` : "Run GEO Audit", source: "GEO", icon: Gauge, values: geo.map(row => Number(row.answer_readiness_score || 0)) },
  ];

  return <AdminShell><div className="os-page analytics-command-center">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Website, SEO and GEO intelligence</div><h1 className="os-page-title">Analytics</h1><p className="os-page-subtitle">GA4, Search Console and page-level AI-search readiness in one compact workspace.</p></div><div className="os-page-actions"><select className="os-field" value={days} onChange={event => setDays(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select><button className="os-btn" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/>Refresh</button></div></header>

    <section className="os-metrics-eight">{metrics.map(({ label, value, compare, source, icon: Icon, values }) => <article className="os-metric" key={label}><div className="os-metric-top"><span className="os-metric-label">{label}</span><span className="os-metric-icon"><Icon /></span></div><div className="os-metric-value">{loading ? "…" : value}</div><MiniLine values={values}/><div className="os-metric-foot"><b>{compare}</b><span className="os-source-badge">{source}</span></div></article>)}</section>

    <div className="os-tabs analytics-tabs">{["Overview", "Realtime", "Audience", "Acquisition", "Landing Pages", "SEO Analytics", "GEO Analytics"].map(tab => <button key={tab} className={`os-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>

    {activeTab === "Overview" && <>
      <section className="analytics-overview-grid">
        <article className="os-card analytics-traffic-wide"><div className="os-card-header"><div><h2>Website Traffic Trend</h2><p>Sessions from GA4 for the selected period</p></div><span className={`os-badge ${analytics?.connected ? "green" : "amber"}`}>{analytics?.connected ? "GA4" : "Connection Required"}</span></div><div className="os-card-body">{analytics?.connected ? <TrafficChart rows={trend}/> : <Empty title="GA4 connection required" text={analytics?.reason || "Connect GA4 to display the live trend."}/>}</div></article>
        <article className="os-card"><div className="os-card-header"><div><h2>Traffic Sources</h2><p>Acquisition channels</p></div></div><div className="os-card-body">{analytics?.sources?.length ? <Rows rows={analytics.sources} labelKey="channel" valueKey="sessions"/> : <Empty title="No source data" text="No GA4 source rows are available."/>}</div></article>
        <article className="os-card"><div className="os-card-header"><div><h2>Visitors by Country</h2><p>Active users by market</p></div><Globe2 size={16}/></div><div className="os-card-body">{analytics?.countries?.length ? <Rows rows={analytics.countries} labelKey="country" valueKey="activeUsers"/> : <Empty title="No country data" text="No GA4 country rows are available."/>}</div></article>
      </section>
      <section className="os-grid three analytics-compact-row">
        <article className="os-card"><div className="os-card-header"><div><h2>Top Landing Pages</h2><p>Sessions entering each page</p></div></div><div className="os-card-body">{analytics?.landingPages?.length ? <Rows rows={analytics.landingPages} labelKey="landingPage" valueKey="sessions"/> : <Empty title="No landing pages" text="No GA4 landing-page rows are available."/>}</div></article>
        <article className="os-card"><div className="os-card-header"><div><h2>Engagement</h2><p>Live period performance</p></div></div><div className="os-card-body"><div className="os-list"><div className="os-list-row"><span className="os-list-icon"><Activity/></span><div className="os-list-main"><strong>Engagement Rate</strong><span>GA4 engaged sessions</span></div><b>{analytics?.connected ? percent(analytics.summary?.engagementRate || 0) : "—"}</b></div><div className="os-list-row"><span className="os-list-icon"><Clock3/></span><div className="os-list-main"><strong>Average Engagement</strong><span>Per active session</span></div><b>{analytics?.connected ? duration(analytics.summary?.averageSessionDuration || 0) : "—"}</b></div><div className="os-list-row"><span className="os-list-icon"><MousePointerClick/></span><div className="os-list-main"><strong>Key Events</strong><span>Configured GA4 events</span></div><b>{analytics?.connected ? nf.format(analytics.summary?.keyEvents || 0) : "—"}</b></div></div></div></article>
        <article className="os-card"><div className="os-card-header"><div><h2>SEO & GEO Snapshot</h2><p>Search visibility and answer readiness</p></div><Bot size={16}/></div><div className="os-card-body"><div className="os-list"><div className="os-list-row"><span className="os-list-icon"><Search/></span><div className="os-list-main"><strong>Organic Clicks</strong><span>Google Search Console</span></div><b>{search?.connected ? nf.format(search.summary?.clicks || 0) : "—"}</b></div><div className="os-list-row"><span className="os-list-icon"><Sparkles/></span><div className="os-list-main"><strong>AI Visibility</strong><span>{geo.length} audited pages</span></div><b>{geo.length ? `${geoSummary.visibility}%` : "—"}</b></div><div className="os-list-row"><span className="os-list-icon"><BookOpenCheck/></span><div className="os-list-main"><strong>Answer Readiness</strong><span>Concise buyer-answer coverage</span></div><b>{geo.length ? `${geoSummary.readiness}%` : "—"}</b></div></div></div></article>
      </section>
    </>}

    {activeTab === "Realtime" && <section className="os-grid three"><article className="os-card"><div className="os-card-header"><div><h2>Active Now</h2><p>GA4 realtime users</p></div></div><div className="os-card-body"><div className="analytics-big-number">{analytics?.connected ? nf.format(analytics.realtime?.activeUsers || 0) : "—"}</div></div></article><article className="os-card"><div className="os-card-header"><div><h2>Active Countries</h2><p>Realtime markets</p></div></div><div className="os-card-body">{analytics?.realtime?.countries?.length ? <Rows rows={analytics.realtime.countries} labelKey="country" valueKey="activeUsers"/> : <Empty title="No active countries" text="No realtime country rows were returned."/>}</div></article><article className="os-card"><div className="os-card-header"><div><h2>Active Pages</h2><p>Pages currently being viewed</p></div></div><div className="os-card-body">{analytics?.realtime?.pages?.length ? <Rows rows={analytics.realtime.pages} labelKey="pageTitle" valueKey="activeUsers"/> : <Empty title="No active pages" text="No realtime page rows were returned."/>}</div></article></section>}
    {activeTab === "Audience" && <section className="os-grid three"><article className="os-card"><div className="os-card-header"><div><h2>Devices</h2><p>Users by device category</p></div></div><div className="os-card-body">{analytics?.devices?.length ? <Rows rows={analytics.devices} labelKey="deviceCategory" valueKey="activeUsers"/> : <Empty title="No device data" text="No device rows are available."/>}</div></article><article className="os-card"><div className="os-card-header"><div><h2>Browsers</h2><p>Browser performance</p></div></div><div className="os-card-body">{analytics?.browsers?.length ? <Rows rows={analytics.browsers} labelKey="browser" valueKey="activeUsers"/> : <Empty title="No browser data" text="No browser rows are available."/>}</div></article><article className="os-card"><div className="os-card-header"><div><h2>Countries</h2><p>Visitor markets</p></div></div><div className="os-card-body">{analytics?.countries?.length ? <Rows rows={analytics.countries} labelKey="country" valueKey="sessions"/> : <Empty title="No audience data" text="No audience country rows are available."/>}</div></article></section>}
    {activeTab === "Acquisition" && <section className="os-grid two"><article className="os-card"><div className="os-card-header"><div><h2>Traffic Channels</h2><p>Sessions and users</p></div></div><div className="os-card-body">{analytics?.sources?.length ? <Rows rows={analytics.sources} labelKey="channel" valueKey="sessions"/> : <Empty title="No acquisition data" text="No GA4 source rows are available."/>}</div></article><article className="os-card"><div className="os-card-header"><div><h2>Conversion Events</h2><p>Configured GA4 events</p></div></div><div className="os-card-body">{analytics?.events?.length ? <Rows rows={analytics.events} labelKey="eventName" valueKey="eventCount"/> : <Empty title="No event data" text="No event rows are available."/>}</div></article></section>}
    {activeTab === "Landing Pages" && <section className="os-card"><div className="os-card-header"><div><h2>Landing Page Performance</h2><p>Sessions and key events by entry page</p></div></div><div className="os-card-body">{analytics?.landingPages?.length ? <Rows rows={analytics.landingPages} labelKey="landingPage" valueKey="sessions"/> : <Empty title="No landing pages" text="No landing-page rows are available."/>}</div></section>}
    {activeTab === "SEO Analytics" && <SeoSection data={search}/>} 
    {activeTab === "GEO Analytics" && <GeoSection rows={geo} summary={geoSummary}/>} 
  </div></AdminShell>;
}

function SeoSection({ data }: { data: SearchData | null }) {
  if (!data?.connected) return <section className="os-card"><Empty title="Search Console connection required" text={data?.reason || "Connect Google Search Console to display real SEO analytics."}/></section>;
  const cards = [["Organic Clicks", nf.format(data.summary?.clicks || 0)], ["Impressions", nf.format(data.summary?.impressions || 0)], ["CTR", percent(data.summary?.ctr || 0)], ["Average Position", (data.summary?.position || 0).toFixed(1)]];
  return <><section className="os-grid four seo-summary-grid">{cards.map(([label, value]) => <article className="os-metric compact" key={label}><div className="os-metric-label">{label}</div><div className="os-metric-value">{value}</div><div className="os-metric-foot"><b>Live Search Console</b><span className="os-source-badge">GSC</span></div></article>)}</section><section className="os-grid two"><article className="os-card"><div className="os-card-header"><div><h2>Top Search Queries</h2><p>Queries creating visibility and clicks</p></div><Search size={16}/></div><div className="os-card-body">{data.queries?.length ? <Rows rows={data.queries} labelKey="query" valueKey="clicks"/> : <Empty title="No query rows" text="Search Console returned no query rows for this period."/>}</div></article><article className="os-card"><div className="os-card-header"><div><h2>Top Organic Pages</h2><p>Pages receiving search impressions</p></div></div><div className="os-card-body">{data.pages?.length ? <Rows rows={data.pages} labelKey="page" valueKey="impressions"/> : <Empty title="No page rows" text="Search Console returned no page rows for this period."/>}</div></article></section></>;
}
function GeoSection({ rows, summary }: { rows: Row[]; summary: { visibility: number; readiness: number; entity: number; citations: number; recommendations: string[] } }) {
  if (!rows.length) return <section className="os-card"><Empty title="No GEO audits yet" text="Run a page audit from GEO Manager. No sample scores are displayed."/></section>;
  const conciseBlocks = rows.filter(row => Number(row.answer_readiness_score || 0) >= 70).length;
  const optimized = rows.filter(row => String(row.status || "").toLowerCase().includes("optimized")).length;
  const recommendations = Array.from(new Set(summary.recommendations)).slice(0, 10);
  return <>
    <section className="os-grid four seo-summary-grid">{[["AI Visibility", `${summary.visibility}%`], ["Answer Readiness", `${summary.readiness}%`], ["Entity Consistency", `${summary.entity}%`], ["Citation Opportunities", nf.format(summary.citations)]].map(([label, value]) => <article className="os-metric compact" key={label}><div className="os-metric-label">{label}</div><div className="os-metric-value">{value}</div><div className="os-metric-foot"><b>Saved page audits</b><span className="os-source-badge">GEO</span></div></article>)}</section>
    <section className="os-grid three analytics-compact-row"><article className="os-card"><div className="os-card-header"><div><h2>Answer Coverage</h2><p>Pages ready for concise AI answers</p></div><BookOpenCheck size={16}/></div><div className="os-card-body"><div className="analytics-big-number">{conciseBlocks}/{rows.length}</div><div className="os-progress"><span style={{width:`${rows.length ? conciseBlocks/rows.length*100 : 0}%`}}/></div></div></article><article className="os-card"><div className="os-card-header"><div><h2>Optimized Pages</h2><p>Audits marked ready to monitor</p></div><Sparkles size={16}/></div><div className="os-card-body"><div className="analytics-big-number">{optimized}/{rows.length}</div><div className="os-progress"><span style={{width:`${rows.length ? optimized/rows.length*100 : 0}%`}}/></div></div></article><article className="os-card"><div className="os-card-header"><div><h2>Priority Work</h2><p>Lowest answer-readiness pages</p></div><Gauge size={16}/></div><div className="os-card-body"><Rows rows={[...rows].sort((a,b)=>Number(a.answer_readiness_score||0)-Number(b.answer_readiness_score||0)).slice(0,5)} labelKey="page_path" valueKey="answer_readiness_score" suffix="%"/></div></article></section>
    <section className="os-grid two"><article className="os-card"><div className="os-card-header"><div><h2>Page-Level GEO Audit</h2><p>Improve the lowest answer-readiness pages first</p></div><Link className="os-btn soft" href="/admin/geo-manager">Open GEO Manager</Link></div><div className="os-table-wrap"><table className="os-table"><thead><tr><th>Page</th><th>AI Visibility</th><th>Answer Readiness</th><th>Entity</th><th>Citations</th><th>Status</th></tr></thead><tbody>{[...rows].sort((a,b)=>Number(a.answer_readiness_score||0)-Number(b.answer_readiness_score||0)).map(row => <tr key={row.id}><td><strong>{row.page_title || row.page_path}</strong><span>{row.page_path}</span></td><td>{Number(row.ai_visibility_score || 0)}%</td><td>{Number(row.answer_readiness_score || 0)}%</td><td>{Number(row.entity_consistency_score || 0)}%</td><td>{Number(row.citation_opportunities || 0)}</td><td><span className="os-badge amber">{row.status || "Needs Review"}</span></td></tr>)}</tbody></table></div></article><article className="os-card"><div className="os-card-header"><div><h2>GEO Action Queue</h2><p>Recommendations saved by page audits</p></div><Link2 size={16}/></div><div className="os-card-body">{recommendations.length ? <div className="os-list">{recommendations.map((item,index)=><div className="os-list-row" key={`${item}-${index}`}><span className="os-list-icon"><Sparkles/></span><div className="os-list-main"><strong>{item}</strong><span>Review, implement and rerun the affected page audit.</span></div></div>)}</div> : <Empty title="No recommendations saved" text="Run detailed GEO audits to create a verified action queue."/>}</div></article></section>
  </>;
}
