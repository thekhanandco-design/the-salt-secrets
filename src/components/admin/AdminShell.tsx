"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import {
  Activity, BarChart3, Bell, Bot, Boxes, Building2, Cable, CalendarDays, ChartNoAxesCombined,
  ChevronDown, ChevronRight, CircleGauge, ClipboardCheck, Command, ContactRound, ExternalLink,
  FileArchive, FileCheck2, FileSearch, FileSpreadsheet, FileText, FolderOpen, GalleryVerticalEnd,
  Globe2, Handshake, Image as ImageIcon, Inbox, LayoutDashboard, LifeBuoy, Link2, LogOut, Mail,
  Megaphone, Menu, MessageSquareText, MonitorSmartphone, Moon, Newspaper, PackageCheck, ListTodo,
  PanelLeftClose, PanelLeftOpen, Plus, Search, Send, Settings, Share2, Sparkles, Sun, Tags, Target,
  Truck, UploadCloud, UserRoundCheck, UsersRound, WandSparkles, Workflow, X,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };
type SearchRecord = { id: string; title: string; subtitle: string; href: string; group: string };
type Notice = { id: string; title: string; message: string; href: string; createdAt?: string; type?: string; unread?: boolean };
type Identity = { id: string; email: string; fullName: string; role: string };

const navGroups: NavGroup[] = [
  { label: "Overview", items: [
    { href: "/admin", label: "Executive Dashboard", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/tasks", label: "Team Tasks", icon: ListTodo },
  ] },
  { label: "AI & Content", items: [
    { href: "/admin/content-studio", label: "AI Content Studio", icon: WandSparkles },
    { href: "/admin/blog-center", label: "Blog Center", icon: Newspaper },
    { href: "/admin/faq-intelligence", label: "FAQ Intelligence", icon: MessageSquareText },
    { href: "/admin/keywords", label: "Keyword Research", icon: Search },
    { href: "/admin/outreach", label: "Outreach & Backlinks", icon: Link2 },
  ] },
  { label: "Website", items: [
    { href: "/admin/website-editor", label: "Website Visual Editor", icon: MonitorSmartphone },
    { href: "/admin/text", label: "Website Text Manager", icon: FileText },
    { href: "/admin/pages", label: "Pages", icon: GalleryVerticalEnd },
    { href: "/admin/products", label: "Products", icon: Boxes },
    { href: "/admin/private-label-catalog", label: "Private Label Catalog", icon: PackageCheck },
    { href: "/admin/product-pages", label: "Product Pages", icon: GalleryVerticalEnd },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/images", label: "Images Manager", icon: ImageIcon },
    { href: "/admin/media", label: "Media Library", icon: FolderOpen },
    { href: "/admin/files", label: "File Manager", icon: FileArchive },
    { href: "/admin/certifications", label: "Certifications", icon: FileCheck2 },
  ] },
  { label: "Leads & Clients", items: [
    { href: "/admin/leads", label: "Leads", icon: Inbox },
    { href: "/admin/companies", label: "Companies", icon: Building2 },
    { href: "/admin/contacts", label: "Contacts", icon: ContactRound },
    { href: "/admin/quotations", label: "Quotations & Export Docs", icon: FileSpreadsheet },
    { href: "/admin/email-assistant", label: "Email Reply Assistant", icon: Mail },
    { href: "/admin/commercial-sheet", label: "Product Commercial Sheet", icon: FileSpreadsheet },
    { href: "/admin/clients", label: "Clients", icon: Handshake },
  ] },
  { label: "Export Operations", items: [
    { href: "/admin/production-shipments", label: "Production & Shipments", icon: Truck },
  ] },
  { label: "Marketing", items: [
    { href: "/admin/marketing-overview", label: "Marketing Overview", icon: Megaphone },
    { href: "/admin/email-marketing", label: "Email Marketing", icon: Mail },
    { href: "/admin/social-studio", label: "Social Media Studio", icon: Share2 },
    { href: "/admin/social-links", label: "Social Profile Links", icon: Link2 },
    { href: "/admin/campaigns", label: "Campaigns", icon: Target },
    { href: "/admin/automation", label: "Automation", icon: Workflow },
    { href: "/admin/newsletter", label: "Newsletter", icon: Send },
  ] },
  { label: "Search Visibility", items: [
    { href: "/admin/seo", label: "SEO Manager", icon: Globe2 },
    { href: "/admin/geo-manager", label: "GEO Manager", icon: Sparkles },
    { href: "/admin/competitors", label: "Competitor Intelligence", icon: ChartNoAxesCombined },
  ] },
  { label: "System", items: [
    { href: "/admin/reports", label: "Reports", icon: CircleGauge },
    { href: "/admin/activity-logs", label: "Activity Logs", icon: Activity },
    { href: "/admin/ai-agents", label: "AI Agents", icon: Bot },
    { href: "/admin/integrations", label: "Integrations", icon: Cable },
    { href: "/admin/access-roles", label: "Access & Roles", icon: UsersRound },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/help", label: "Help & Guide", icon: LifeBuoy },
  ] },
];

const quickActions = [
  { label: "Create Lead", href: "/admin/leads?action=create", icon: Inbox, description: "Add a B2B inquiry to the live CRM" },
  { label: "Create Quotation", href: "/admin/quotations?action=create", icon: FileSpreadsheet, description: "Build and save an export document" },
  { label: "Generate Content Package", href: "/admin/content-studio", icon: WandSparkles, description: "Add a topic and generate a blog + social pack on demand" },
  { label: "Create Social Post", href: "/admin/social-studio?action=create", icon: Share2, description: "Prepare platform-specific drafts" },
  { label: "Manage Social Links", href: "/admin/social-links", icon: Link2, description: "Add website footer profile links" },
  { label: "Manage Products", href: "/admin/products", icon: Boxes, description: "Add, edit and organize storefront products" },
  { label: "Edit Product Page", href: "/admin/product-pages", icon: GalleryVerticalEnd, description: "Create or edit a product detail page" },
  { label: "Replace Website Image", href: "/admin/images?action=replace", icon: ImageIcon, description: "Update a website asset" },
  { label: "Edit Website Hero", href: "/admin/website-editor?section=hero", icon: MonitorSmartphone, description: "Open the live visual editor" },
  { label: "Research FAQs", href: "/admin/faq-intelligence?action=research", icon: MessageSquareText, description: "Research buyer questions for review" },
  { label: "Track Shipment", href: "/admin/production-shipments?action=create", icon: Truck, description: "Add an export operation record" },
  { label: "Create Team Task", href: "/admin/tasks?action=create", icon: ListTodo, description: "Assign a task with owner and due date" },
];

const labelForPath = (pathname: string) => {
  const exact = navGroups.flatMap(group => group.items).find(item => item.href === pathname);
  if (exact) return exact.label;
  const closest = navGroups.flatMap(group => group.items).find(item => item.href !== "/admin" && pathname.startsWith(item.href));
  return closest?.label || "Enterprise Workspace";
};

function initials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "AD";
  return (words[0][0] + (words[1]?.[0] || words[0][1] || "")).toUpperCase();
}
function relativeTime(value?: string) {
  if (!value) return "";
  const date = new Date(value); if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60); if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
async function safeRows(table: string, select: string, limit = 20) {
  const result = await supabase.from(table).select(select).order("created_at", { ascending: false }).limit(limit);
  return result.error ? [] : result.data || [];
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [configError, setConfigError] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"search" | "command">("search");
  const [query, setQuery] = useState("");
  const [navQuery, setNavQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(navGroups.map(group => [group.label, true])));

  useEffect(() => {
    setDark(localStorage.getItem("salt-origin-admin-theme") === "dark");
    setCollapsed(localStorage.getItem("salt-origin-admin-collapsed") === "true");
    void checkSession();
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchMode("command"); setCommandOpen(true); }
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement)?.tagName || "")) { event.preventDefault(); setSearchMode("search"); setCommandOpen(true); }
      if (event.key === "Escape") { setCommandOpen(false); setNotificationsOpen(false); setCreateOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  async function checkSession() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (!url || !key || url.includes("placeholder") || key.includes("placeholder")) {
      setConfigError("Supabase is not configured. Copy your real variables into .env.local before opening the CMS.");
      setChecking(false);
      return;
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) { router.replace("/admin/login"); return; }
      const user = data.session.user;
      const { data: profile } = await supabase.from("cms_profiles").select("full_name,role_name,enabled").eq("id", user.id).maybeSingle();
      if (profile?.enabled === false) { await supabase.auth.signOut(); router.replace("/admin/login?disabled=1"); return; }
      const fullName = String(profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Admin");
      const role = String(profile?.role_name || user.app_metadata?.role || "Authenticated Admin").replaceAll("_", " ");
      setIdentity({ id: user.id, email: user.email || "", fullName, role });
      await loadWorkspaceData();
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : "Unable to load the admin session.");
    } finally {
      setChecking(false);
    }
  }

  async function loadWorkspaceData() {
    const [leads, companies, contacts, documents, products, blogs, faqs, shipments, media, notificationRows, followups] = await Promise.all([
      safeRows("inquiries", "id,name,email,company,country,product,status,created_at", 25),
      safeRows("b2b_companies", "id,name,country,relationship_status,created_at", 20),
      safeRows("b2b_contacts", "id,name,email,country,lifecycle,created_at", 20),
      safeRows("business_documents", "id,document_number,document_type,buyer_company,buyer_country,status,created_at", 25),
      safeRows("products", "id,name,slug,status,created_at", 20),
      safeRows("blog_posts", "id,title,slug,status,created_at", 20),
      safeRows("cms_faqs", "id,question,status,created_at", 20),
      safeRows("customer_shipments", "id,reference_number,current_status,created_at", 20),
      safeRows("media_library", "id,title,url,created_at", 20),
      safeRows("cms_notifications", "id,type,title,message,link,is_read,created_at", 30),
      safeRows("b2b_followups", "id,title,due_at,status,created_at", 30),
    ]);

    const nextRecords: SearchRecord[] = [
      ...leads.map((row: any) => ({ id: `lead-${row.id}`, title: row.company || row.name || row.email, subtitle: `Lead · ${row.country || "Country not set"} · ${row.status || "New"}`, href: `/admin/leads?id=${row.id}`, group: "Leads" })),
      ...companies.map((row: any) => ({ id: `company-${row.id}`, title: row.name, subtitle: `Company · ${row.country || "Country not set"} · ${row.relationship_status || "Prospect"}`, href: `/admin/companies?id=${row.id}`, group: "Companies" })),
      ...contacts.map((row: any) => ({ id: `contact-${row.id}`, title: row.name || row.email, subtitle: `Contact · ${row.country || "Country not set"} · ${row.lifecycle || "New"}`, href: `/admin/contacts?id=${row.id}`, group: "Contacts" })),
      ...documents.map((row: any) => ({ id: `document-${row.id}`, title: row.document_number || "Business document", subtitle: `${String(row.document_type || "Document").replaceAll("_", " ")} · ${row.buyer_company || "No company"} · ${row.status || "Draft"}`, href: `/admin/quotations?id=${row.id}`, group: "Quotations" })),
      ...products.map((row: any) => ({ id: `product-${row.id}`, title: row.name || row.slug, subtitle: `Product · ${row.status || "Active"}`, href: `/admin/products?id=${row.id}`, group: "Products" })),
      ...blogs.map((row: any) => ({ id: `blog-${row.id}`, title: row.title, subtitle: `Blog · ${row.status || "Draft"}`, href: `/admin/blog-center?id=${row.id}`, group: "Content" })),
      ...faqs.map((row: any) => ({ id: `faq-${row.id}`, title: row.question, subtitle: `FAQ · ${row.status || "Draft"}`, href: `/admin/faq-intelligence?id=${row.id}`, group: "FAQs" })),
      ...shipments.map((row: any) => ({ id: `shipment-${row.id}`, title: row.reference_number || "Shipment", subtitle: `Shipment · ${row.current_status || "Booked"}`, href: `/admin/production-shipments?id=${row.id}`, group: "Shipments" })),
      ...media.map((row: any) => ({ id: `media-${row.id}`, title: row.title || row.url || "Media asset", subtitle: "Media Library", href: `/admin/media?id=${row.id}`, group: "Media" })),
    ];
    setRecords(nextRecords);

    const generatedNotices: Notice[] = notificationRows.map((row: any) => ({ id: `notice-${row.id}`, title: row.title, message: row.message || "", href: row.link || "/admin", createdAt: row.created_at, type: row.type, unread: !row.is_read }));
    followups.filter((row: any) => !["completed", "cancelled"].includes(String(row.status || "").toLowerCase())).forEach((row: any) => generatedNotices.push({ id: `followup-${row.id}`, title: row.title, message: row.due_at ? `Due ${new Date(row.due_at).toLocaleString()}` : "Follow-up due", href: "/admin/leads", createdAt: row.created_at, type: "followup", unread: true }));
    setNotices(generatedNotices.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 40));

    const newLeads = leads.filter((row: any) => ["new", "new inquiry", "new_inquiry", ""].includes(String(row.status || "").toLowerCase())).length;
    const pendingDocs = documents.filter((row: any) => String(row.document_type || "").toLowerCase() === "quotation" && !["accepted", "signed", "rejected", "expired", "cancelled"].includes(String(row.status || "").toLowerCase())).length;
    const activeShipments = shipments.filter((row: any) => !["delivered", "completed", "closed", "cancelled"].includes(String(row.current_status || "").toLowerCase())).length;
    setBadges({ "/admin/leads": newLeads, "/admin/quotations": pendingDocs, "/admin/production-shipments": activeShipments, "/admin/faq-intelligence": faqs.filter((row: any) => !["published", "approved"].includes(String(row.status || "").toLowerCase())).length });
  }

  async function logout() { try { await supabase.auth.signOut(); } finally { router.replace("/admin/login"); } }
  function toggleTheme() { const next = !dark; setDark(next); localStorage.setItem("salt-origin-admin-theme", next ? "dark" : "light"); }
  function toggleCollapsed() { const next = !collapsed; setCollapsed(next); localStorage.setItem("salt-origin-admin-collapsed", String(next)); }
  function toggleNavigation() {
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileOpen(previous => !previous);
      return;
    }
    toggleCollapsed();
  }
  function openPalette(mode: "search" | "command") { setSearchMode(mode); setQuery(""); setCommandOpen(true); }

  const searchResults = useMemo(() => {
    const needle = query.toLowerCase().trim();
    const modules = navGroups.flatMap(group => group.items.map(item => ({ title: item.label, subtitle: `${group.label} module`, href: item.href, icon: item.icon, group: group.label }))).filter(item => !needle || `${item.title} ${item.subtitle}`.toLowerCase().includes(needle)).slice(0, 10);
    const actualRecords = records.filter(item => !needle || `${item.title} ${item.subtitle} ${item.group}`.toLowerCase().includes(needle)).slice(0, 15);
    const actions = quickActions.filter(item => !needle || `${item.label} ${item.description}`.toLowerCase().includes(needle)).slice(0, 10);
    return { modules, records: actualRecords, actions };
  }, [query, records]);

  if (checking) return <main className="admin-os" data-theme={dark ? "dark" : "light"}><div className="os-empty" style={{ minHeight: "100vh" }}><div className="os-empty-icon"><Sparkles /></div><h3>Loading your secure CMS</h3><p>Checking the real Supabase session and workspace records…</p><div className="os-skeleton" style={{ width: 240, height: 10 }} /></div></main>;
  if (configError) return <main className="admin-os" data-theme={dark ? "dark" : "light"}><div className="os-empty" style={{ minHeight: "100vh", maxWidth: 620, margin: "auto" }}><div className="os-empty-icon"><Cable /></div><h3>CMS connection required</h3><p>{configError}</p><Link className="os-btn primary" href="/admin/login">Open Login</Link></div></main>;
  if (!identity) return null;

  const currentLabel = labelForPath(pathname);
  const unreadCount = notices.filter(notice => notice.unread).length;
  const filteredNavGroups = navQuery.trim()
    ? navGroups.map((group) => ({ ...group, items: group.items.filter((item) => `${group.label} ${item.label}`.toLowerCase().includes(navQuery.toLowerCase())) })).filter((group) => group.items.length)
    : navGroups;

  return <main className="admin-os" data-theme={dark ? "dark" : "light"}>
    <div className={`os-layout ${collapsed ? "collapsed" : ""}`}>
      <aside className={`os-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="os-brand"><Link href="/admin" aria-label="The Salt Origin dashboard"><img src="/salt-origin-logo.png" alt="The Salt Origin" /></Link><div className="os-brand-copy"><strong>The Salt Origin</strong><span>Enterprise B2B Export OS</span></div><button onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button></div>
        {!collapsed && <div className="os-side-search"><Search/><input value={navQuery} onChange={(event) => setNavQuery(event.target.value)} placeholder="Search modules…" aria-label="Search CMS modules"/></div>}
        <div className="os-nav-scroll">{filteredNavGroups.map(group => <div className="os-nav-group" key={group.label}><button className="os-nav-group-title" onClick={() => setOpenGroups(previous => ({ ...previous, [group.label]: !previous[group.label] }))} aria-expanded={openGroups[group.label]}><span>{group.label}</span><ChevronDown style={{ transform: openGroups[group.label] ? "rotate(0deg)" : "rotate(-90deg)" }} /></button>{openGroups[group.label] && <div className="os-nav-items">{group.items.map(item => { const Icon = item.icon; const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)); const badge = badges[item.href] || 0; return <Link key={item.href} href={item.href} className={`os-nav-link ${active ? "active" : ""}`} title={item.label} onClick={() => setMobileOpen(false)}><Icon /><span>{item.label}</span>{badge > 0 && <b className="os-nav-badge">{badge > 99 ? "99+" : badge}</b>}</Link>; })}</div>}</div>)}</div>
        <div className="os-sidebar-foot"><Link className="os-site-button" href="/" target="_blank"><ExternalLink /><span>Open Website</span></Link><button className="os-create-button" onClick={() => setCreateOpen(true)}><Plus /><span>Create</span></button></div>
      </aside>
      {mobileOpen && <button className="os-mobile-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <section className="os-main">
        <header className="os-topbar"><div className="os-topbar-left"><button className="os-icon-button os-mobile-menu" onClick={toggleNavigation} aria-label={mobileOpen ? "Close navigation" : collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen /> : <Menu />}</button><div className="os-breadcrumbs"><span>The Salt Origin</span><ChevronRight size={12} /><strong>{currentLabel}</strong></div></div><div className="os-topbar-actions"><button className="os-global-search" onClick={() => openPalette("search")}><Search /><span>Search live leads, quotes, pages and files…</span><kbd>/</kbd></button><button className="os-quick-actions-trigger" onClick={() => setCreateOpen(true)} aria-label="Open quick actions"><WandSparkles /><span>Quick Actions</span></button><button className="os-icon-button" onClick={() => openPalette("command")} aria-label="Open command palette"><Command /></button><span className="os-status"><i />Authenticated</span><button className="os-icon-button" onClick={() => setNotificationsOpen(true)} aria-label="Notifications"><Bell />{unreadCount > 0 && <span className="dot" />}</button><button className="os-icon-button" onClick={toggleTheme} aria-label="Toggle theme">{dark ? <Sun /> : <Moon />}</button><div className="os-user"><span className="os-avatar">{initials(identity.fullName)}</span><div className="os-user-copy"><strong>{identity.fullName}</strong><span>{identity.role}</span></div><button className="os-icon-button" style={{ width: 29, height: 29, border: 0 }} onClick={logout} aria-label="Sign out"><LogOut /></button></div></div></header>
        <div className="os-content">{children}</div>
      </section>
    </div>

    {commandOpen && <div className="os-command-backdrop" onMouseDown={() => setCommandOpen(false)}><section className="os-command" onMouseDown={event => event.stopPropagation()}><div className="os-command-input">{searchMode === "command" ? <Command /> : <Search />}<input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder={searchMode === "command" ? "Type a command or open a module…" : "Search actual CMS records…"} /><button className="os-icon-button" style={{ width: 30, height: 30 }} onClick={() => setCommandOpen(false)}><X /></button></div><div className="os-command-results">{searchMode === "command" && <><div className="os-command-section">Quick actions</div>{searchResults.actions.map(item => { const Icon = item.icon; return <button className="os-command-item" key={item.label} onClick={() => { router.push(item.href); setCommandOpen(false); }}><Icon /><div><strong>{item.label}</strong><span>{item.description}</span></div><ChevronRight /></button>; })}</>}<div className="os-command-section">Modules</div>{searchResults.modules.map(item => { const Icon = item.icon; return <button className="os-command-item" key={item.href} onClick={() => { router.push(item.href); setCommandOpen(false); }}><Icon /><div><strong>{item.title}</strong><span>{item.subtitle}</span></div><ChevronRight /></button>; })}{searchMode === "search" && <><div className="os-command-section">Live records</div>{searchResults.records.map(item => <button className="os-command-item" key={item.id} onClick={() => { router.push(item.href); setCommandOpen(false); }}><FileSearch /><div><strong>{item.title}</strong><span>{item.subtitle}</span></div><ChevronRight /></button>)}{!searchResults.records.length && <div className="os-empty" style={{ minHeight: 120, padding: 16 }}><p>No matching live records.</p></div>}</>}</div></section></div>}

    {notificationsOpen && <div className="os-drawer-backdrop" onMouseDown={() => setNotificationsOpen(false)}><aside className="os-drawer" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><h2>Notifications</h2><p className="os-page-subtitle" style={{ marginTop: 3 }}>Actual CMS notifications and follow-ups</p></div><button className="os-icon-button" onClick={() => setNotificationsOpen(false)}><X /></button></div><div className="os-card-body">{notices.length ? <div className="os-list">{notices.map(notice => <Link href={notice.href} className="os-list-row" key={notice.id} onClick={() => setNotificationsOpen(false)}><span className="os-list-icon">{notice.type === "followup" ? <CalendarDays /> : <Bell />}</span><div className="os-list-main"><strong>{notice.title}</strong><span>{notice.message}</span></div><span className={`os-badge ${notice.unread ? "pink" : ""}`}>{relativeTime(notice.createdAt)}</span></Link>)}</div> : <div className="os-empty"><div className="os-empty-icon"><Bell /></div><h3>No notifications</h3><p>No real notification or follow-up record is currently available.</p></div>}</div></aside></div>}

    {createOpen && <div className="os-modal-backdrop" onMouseDown={() => setCreateOpen(false)}><section className="os-modal" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><h2>Create New</h2><p className="os-page-subtitle" style={{ marginTop: 3 }}>Start a live B2B workflow</p></div><button className="os-icon-button" onClick={() => setCreateOpen(false)}><X /></button></div><div className="os-modal-body"><div className="os-grid two">{quickActions.map(item => { const Icon = item.icon; return <button key={item.label} className="os-command-item" style={{ border: "1px solid var(--os-line)", background: "var(--os-surface-2)" }} onClick={() => { router.push(item.href); setCreateOpen(false); }}><Icon /><div><strong>{item.label}</strong><span>{item.description}</span></div><ChevronRight /></button>; })}</div></div></section></div>}
  </main>;
}
