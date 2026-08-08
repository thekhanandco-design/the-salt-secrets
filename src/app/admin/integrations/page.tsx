"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-client";
import { AlertTriangle, Cable, CheckCircle2, Clock3, ExternalLink, RefreshCw, Search, Settings2, TestTube2, X } from "lucide-react";
import type { IconType } from "react-icons";
import { FaLinkedin, FaMicrosoft } from "react-icons/fa6";
import { SiAnthropic, SiCloudflare, SiDropbox, SiFacebook, SiGoogle, SiGoogleanalytics, SiGooglecalendar, SiGoogledrive, SiGooglegemini, SiGooglesearchconsole, SiGooglesheets, SiGoogletagmanager, SiInstagram, SiMake, SiOpenai, SiPerplexity, SiPinterest, SiResend, SiSlack, SiThreads, SiTiktok, SiWhatsapp, SiX, SiYoutube, SiZapier } from "react-icons/si";

type CatalogItem = { id: string; name: string; category: string; description: string; initials: string; externalUrl?: string };
type LiveStatus = { id: string; configured: boolean; mode: "api" | "external" | "database"; missing: string[]; storedStatus?: string | null; lastCheckedAt?: string | null };
const catalog: CatalogItem[] = [
  {id:"ga4",name:"Google Analytics 4",category:"Analytics & Search",description:"Real visitors, sessions, engagement, countries and events.",initials:"GA"},
  {id:"gsc",name:"Google Search Console",category:"Analytics & Search",description:"Real clicks, impressions, queries, pages and country performance.",initials:"SC"},
  {id:"gtm",name:"Google Tag Manager",category:"Analytics & Search",description:"Website tags and conversion events.",initials:"GT"},
  {id:"rich-results",name:"Google Rich Results Test",category:"Analytics & Search",description:"Open Google's structured-data validation tool.",initials:"RR",externalUrl:"https://search.google.com/test/rich-results"},
  {id:"trends",name:"Google Trends",category:"Analytics & Search",description:"Open live buyer and market search-trend research.",initials:"TR",externalUrl:"https://trends.google.com/trends/"},
  {id:"bing",name:"Bing Webmaster Tools",category:"Analytics & Search",description:"Bing indexing, search performance and URL inspection.",initials:"BW",externalUrl:"https://www.bing.com/webmasters/"},
  {id:"clarity",name:"Microsoft Clarity",category:"Analytics & Search",description:"Heatmaps, recordings and visitor behaviour.",initials:"MC"},
  {id:"drive",name:"Google Drive",category:"Cloud & Files",description:"Import assets, sync folders and save generated content.",initials:"GD"},
  {id:"dropbox",name:"Dropbox",category:"Cloud & Files",description:"Import and share catalogues, files and business documents.",initials:"DB"},
  {id:"onedrive",name:"OneDrive",category:"Cloud & Files",description:"Microsoft cloud file storage.",initials:"OD"},
  {id:"openai",name:"OpenAI / ChatGPT",category:"AI",description:"AI content, SEO, FAQ, research and automation.",initials:"AI"},
  {id:"gemini",name:"Google Gemini",category:"AI",description:"AI research, content and multimodal workflows.",initials:"GM"},
  {id:"claude",name:"Anthropic Claude",category:"AI",description:"Long-form analysis and structured content.",initials:"CL"},
  {id:"perplexity",name:"Perplexity AI",category:"AI",description:"Research and citation discovery.",initials:"PX"},
  {id:"flexibles",name:"Flexibility AI",category:"AI",description:"Optional AI provider adapter.",initials:"FA"},
  {id:"smtp",name:"Resend / SMTP",category:"Communication",description:"Quotations, follow-ups, campaigns and alerts.",initials:"EM"},
  {id:"outlook",name:"Microsoft Outlook",category:"Communication",description:"Microsoft email and calendar.",initials:"OL"},
  {id:"whatsapp",name:"WhatsApp Cloud API",category:"Communication",description:"Approved quotation PDFs and client messages.",initials:"WA"},
  {id:"slack",name:"Slack",category:"Communication",description:"Team approval and operations notifications.",initials:"SL"},
  {id:"teams",name:"Microsoft Teams",category:"Communication",description:"Team collaboration notifications.",initials:"MT"},
  {id:"facebook",name:"Facebook",category:"Social Media",description:"Approved page publishing and analytics.",initials:"FB"},
  {id:"instagram",name:"Instagram",category:"Social Media",description:"Approved captions, images and reels.",initials:"IG"},
  {id:"linkedin",name:"LinkedIn",category:"Social Media",description:"B2B company-page publishing.",initials:"IN"},
  {id:"pinterest",name:"Pinterest",category:"Social Media",description:"Pin publishing and analytics.",initials:"PI"},
  {id:"threads",name:"Threads",category:"Social Media",description:"Approved short-form publishing.",initials:"TH"},
  {id:"tiktok",name:"TikTok",category:"Social Media",description:"Approved video publishing workflow.",initials:"TT"},
  {id:"youtube",name:"YouTube",category:"Social Media",description:"Videos, descriptions and thumbnails.",initials:"YT"},
  {id:"x",name:"X / Twitter",category:"Social Media",description:"Approved short-form publishing.",initials:"X"},
  {id:"cloudflare",name:"Cloudflare",category:"Website & Infrastructure",description:"DNS, cache, security and performance.",initials:"CF"},
  {id:"webhooks",name:"Webhooks",category:"Website & Infrastructure",description:"Outbound workflow events.",initials:"WH"},
  {id:"rest",name:"REST API",category:"Website & Infrastructure",description:"Future external enterprise API access.",initials:"AP"},
  {id:"sheets",name:"Google Sheets",category:"Productivity",description:"Lead, contact and report imports/exports.",initials:"GS"},
  {id:"calendar",name:"Google Calendar",category:"Productivity",description:"Follow-ups and meetings.",initials:"GC"},
  {id:"zapier",name:"Zapier",category:"Productivity",description:"External workflow connections.",initials:"ZP"},
  {id:"make",name:"Make",category:"Productivity",description:"Visual automation and routing.",initials:"MK"},
];

const integrationIcons: Record<string, IconType> = {
  ga4: SiGoogleanalytics, gsc: SiGooglesearchconsole, gtm: SiGoogletagmanager, "rich-results": SiGoogle, trends: SiGoogle, bing: FaMicrosoft, clarity: FaMicrosoft,
  drive: SiGoogledrive, dropbox: SiDropbox, onedrive: FaMicrosoft, openai: SiOpenai, gemini: SiGooglegemini, claude: SiAnthropic, perplexity: SiPerplexity,
  flexibles: SiOpenai, smtp: SiResend, outlook: FaMicrosoft, whatsapp: SiWhatsapp, slack: SiSlack, teams: FaMicrosoft,
  facebook: SiFacebook, instagram: SiInstagram, linkedin: FaLinkedin, pinterest: SiPinterest, threads: SiThreads, tiktok: SiTiktok, youtube: SiYoutube, x: SiX,
  cloudflare: SiCloudflare, sheets: SiGooglesheets, calendar: SiGooglecalendar, zapier: SiZapier, make: SiMake,
};
const integrationColors: Record<string,string> = { ga4:"#e37400",gsc:"#4285f4",gtm:"#246fdb","rich-results":"#4285f4",trends:"#4285f4",bing:"#008373",clarity:"#7c3aed",drive:"#0f9d58",dropbox:"#0061ff",onedrive:"#0078d4",openai:"#111827",gemini:"#6f5cff",claude:"#d97757",perplexity:"#20808d",smtp:"#111827",outlook:"#0078d4",whatsapp:"#25d366",slack:"#4a154b",teams:"#6264a7",facebook:"#1877f2",instagram:"#e4405f",linkedin:"#0a66c2",pinterest:"#bd081c",threads:"#111827",tiktok:"#111827",youtube:"#ff0000",x:"#111827",cloudflare:"#f38020",sheets:"#0f9d58",calendar:"#4285f4",zapier:"#ff4f00",make:"#6d00cc" };
function IntegrationLogo({item}:{item:CatalogItem}){const Icon=integrationIcons[item.id];return <span className="integration-logo" style={{color:integrationColors[item.id]||"var(--os-pink)"}}>{Icon?<Icon/>:<b>{item.initials}</b>}</span>}

const categories = ["All", ...Array.from(new Set(catalog.map(item => item.category)))];
function formatDate(value?: string | null) { if (!value) return "Never checked"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Never checked" : date.toLocaleString(); }

export default function Integrations() {
  const [statuses, setStatuses] = useState<Record<string, LiveStatus>>({});
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await adminFetch("/api/admin/integrations/status");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load integration status.");
      setStatuses(Object.fromEntries((payload.items as LiveStatus[]).map(item => [item.id, item])));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load integration status."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2600); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const youtubeStatus = searchParams.get("youtube");
    const metaStatus = searchParams.get("meta");
    const message = searchParams.get("message");

    if (youtubeStatus === "connected") {
      setToast("YouTube channel connected successfully.");
      void load();
    } else if (youtubeStatus === "error") {
      setError(message || "YouTube connection failed.");
    }

    if (metaStatus === "connected") {
      setToast(message || "Meta connection completed successfully.");
      void load();
    } else if (metaStatus === "error") {
      setError(message || "Meta connection failed.");
    }

    if (youtubeStatus || metaStatus) {
      searchParams.delete("youtube");
      searchParams.delete("meta");
      searchParams.delete("message");
      const nextQuery = searchParams.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`,
      );
    }
  }, [load]);

  const filtered = useMemo(() => catalog.filter(item => (category === "All" || item.category === category) && (!query || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase()))), [category, query]);
  const configured = catalog.filter(item => statuses[item.id]?.configured && statuses[item.id]?.mode !== "external").length;
  const external = catalog.filter(item => statuses[item.id]?.mode === "external").length;
  const required = catalog.filter(item => statuses[item.id] && !statuses[item.id]?.configured && statuses[item.id]?.mode !== "external").length;

  async function test(item: CatalogItem) {
    const status = statuses[item.id];
    if (status?.mode === "external" && item.externalUrl) { window.open(item.externalUrl, "_blank", "noopener,noreferrer"); return; }
    setTesting(item.id); setError("");
    try {
      if (item.id === "ga4") {
        const response = await adminFetch("/api/admin/analytics?days=7"); const payload = await response.json();
        if (!response.ok || !payload.connected) throw new Error(payload.reason || payload.error || "GA4 test failed.");
        setToast(`GA4 connected: ${Number(payload.summary?.sessions || 0).toLocaleString()} sessions returned`);
      } else if (item.id === "gsc") {
        const response = await adminFetch("/api/admin/search-console?days=7"); const payload = await response.json();
        if (!response.ok || !payload.connected) throw new Error(payload.reason || payload.error || "Search Console test failed.");
        setToast(`Search Console connected: ${Number(payload.summary?.clicks || 0).toLocaleString()} clicks returned`);
      } else if (item.id === "bing") {
        const response = await adminFetch("/api/admin/bing-webmaster");
        const payload = await response.json();
        if (!response.ok || !payload.connected) throw new Error(payload.reason || payload.error || "Bing Webmaster test failed.");
        const verifiedSite = payload.site?.url || payload.sites?.find((site: { isVerified?: boolean }) => site.isVerified)?.url || "verified site";
        setToast(`Bing Webmaster connected: ${verifiedSite}`);
        await load();
      } else if (item.id === "facebook" || item.id === "instagram") {
        const response = await adminFetch("/api/admin/meta/oauth/start");
        const payload = await response.json();
        if (!response.ok || !payload.authorizationUrl) throw new Error(payload.error || "Unable to start Meta authorization.");
        window.location.assign(payload.authorizationUrl);
        return;
      } else if (item.id === "youtube") {
        const response = await adminFetch("/api/admin/youtube/oauth/start");
        const payload = await response.json();
        if (!response.ok || !payload.authorizationUrl) throw new Error(payload.error || "Unable to start YouTube authorization.");
        window.location.assign(payload.authorizationUrl);
        return;
      } else if (!status?.configured) {
        throw new Error(`Missing environment variables: ${(status?.missing || []).join(", ") || "integration credentials"}`);
      } else setToast(`${item.name} configuration is present. A provider-specific live test can now be added.`);
    } catch (testError) { setError(testError instanceof Error ? testError.message : "Connection test failed."); }
    finally { setTesting(null); }
  }

  return <AdminShell><div className="os-page"><header className="os-page-header"><div><div className="os-page-eyebrow">Credential-aware connection registry</div><h1 className="os-page-title">Integrations</h1><p className="os-page-subtitle">Statuses are read from server environment variables and the live integration registry. Nothing is marked connected through local demo storage.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/>Refresh Status</button></div></header>
    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body" style={{ display: "flex", gap: 12 }}><AlertTriangle/><div><strong>Integration status</strong><p className="os-page-subtitle">{error}</p></div></div></section>}
    <div className="os-grid four">{[["Configured", configured, CheckCircle2], ["Connection Required", required, Settings2], ["External Tools", external, ExternalLink], ["Total Integrations", catalog.length, Cable]].map(([label, value, Icon]) => { const Component = Icon as typeof Cable; return <article className="os-metric" key={String(label)}><div className="os-metric-top"><span className="os-metric-label">{String(label)}</span><span className="os-metric-icon"><Component/></span></div><div className="os-metric-value">{String(value)}</div><div className="os-metric-foot"><b>Actual configuration state</b></div></article>; })}</div>
    <div className="os-tabs">{categories.map(value => <button className={`os-tab ${category === value ? "active" : ""}`} onClick={() => setCategory(value)} key={value}>{value}</button>)}</div>
    <section className="os-card"><div className="os-card-header"><div><h2>{category}</h2><p>{filtered.length} available services</p></div><label className="os-search-field"><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search integrations…"/></label></div><div className="os-card-body"><div className="os-grid three">{filtered.map(item => { const status = statuses[item.id]; const isExternal = status?.mode === "external"; const isConfigured = Boolean(status?.configured && !isExternal); return <article className="os-card" key={item.id}><div className="os-card-body"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}><IntegrationLogo item={item}/><span className={`os-badge ${isConfigured ? "green" : isExternal ? "blue" : "amber"}`}>{isConfigured ? "Configured" : isExternal ? "External Tool" : "Connection Required"}</span></div><h3 style={{ marginTop: 14 }}>{item.name}</h3><p className="os-page-subtitle">{item.description}</p><div className="os-list" style={{ marginTop: 12 }}><div className="os-list-row"><span className="os-list-icon"><Clock3/></span><div className="os-list-main"><strong>Last Checked</strong><span>{formatDate(status?.lastCheckedAt)}</span></div></div>{!isConfigured && !isExternal && <div className="os-list-row"><span className="os-list-icon"><Settings2/></span><div className="os-list-main"><strong>Missing Configuration</strong><span>{status?.missing?.join(", ") || "Status loading…"}</span></div></div>}</div><div style={{ display: "flex", gap: 8, marginTop: 14 }}><button className="os-btn soft" onClick={() => setSelected(item)}><Settings2/>Details</button><button className="os-btn primary" onClick={() => void test(item)} disabled={testing === item.id}><TestTube2/>{testing === item.id ? "Testing…" : isExternal ? "Open Tool" : ["facebook", "instagram", "youtube"].includes(item.id) ? (isConfigured ? "Reconnect" : "Connect") : "Test"}</button></div></div></article>; })}</div></div></section>
    {selected && <div className="os-drawer-backdrop" onMouseDown={() => setSelected(null)}><aside className="os-drawer" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><h2>{selected.name}</h2><p className="os-page-subtitle">{selected.category}</p></div><button className="os-icon-button" onClick={() => setSelected(null)}><X/></button></div><div className="os-card-body"><p>{selected.description}</p><h3 style={{ marginTop: 18 }}>Required environment variables</h3>{statuses[selected.id]?.mode === "external" ? <p className="os-page-subtitle">This opens an official external tool and does not require a CMS API key.</p> : <div className="os-list">{(statuses[selected.id]?.missing || []).length ? statuses[selected.id].missing.map(name => <div className="os-list-row" key={name}><span className="os-list-icon"><Settings2/></span><div className="os-list-main"><strong>{name}</strong><span>Add this in .env.local and Vercel Environment Variables.</span></div></div>) : <div className="os-list-row"><span className="os-list-icon"><CheckCircle2/></span><div className="os-list-main"><strong>Configuration present</strong><span>No secret values are exposed in this screen.</span></div></div>}</div>}<button className="os-btn primary" style={{ width: "100%", marginTop: 18 }} onClick={() => void test(selected)}><TestTube2/>{["facebook", "instagram", "youtube"].includes(selected.id) ? (statuses[selected.id]?.configured ? "Reconnect" : "Connect") : "Test or Open"}</button></div></aside></div>}
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>Connection status was checked without exposing credentials.</span></div></div></div>}
  </div></AdminShell>;
}