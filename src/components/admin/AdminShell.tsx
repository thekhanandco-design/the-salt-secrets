"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import {
  Bell, Boxes, ChevronLeft, ChevronRight, Command, FileSpreadsheet, FileText, FolderTree,
  History, Image as ImageIcon, Images, Inbox, Languages, LayoutDashboard, LogOut, Menu,
  MessageCircle, Moon, Search, Settings, Share2, ShieldCheck, Sparkles, Sun, Type,
  UserCircle2, X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/images", label: "Images Manager", icon: Images },
  { href: "/admin/text", label: "Text Manager", icon: Type },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/blogs", label: "Blog Posts", icon: Sparkles },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/documents", label: "Business Documents", icon: FileSpreadsheet },
  { href: "/admin/inquiries", label: "Inquiries CRM", icon: Inbox },
  { href: "/admin/seo", label: "SEO Manager", icon: Search },
  { href: "/admin/languages", label: "Languages", icon: Languages },
  { href: "/admin/social", label: "Social Media", icon: Share2 },
  { href: "/admin/whatsapp", label: "WhatsApp Center", icon: MessageCircle },
  { href: "/admin/workflow", label: "Workflow & Roles", icon: ShieldCheck },
  { href: "/admin/backups", label: "Backups & History", icon: History },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("Admin");
  const [unread, setUnread] = useState(0);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  useEffect(() => {
    setDark(localStorage.getItem("salt-cms-theme") === "dark");
    setCollapsed(localStorage.getItem("salt-cms-collapsed") === "true");
    void checkSession();
    const timer = window.setInterval(() => void refreshNotifications(), 30000);
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => { window.clearInterval(timer); window.removeEventListener("keydown", onKey); };
  }, []);

  async function checkSession() {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace("/admin/login"); return; }
      setEmail(data.session.user.email || "Admin");
      await refreshNotifications();
    } finally { setChecking(false); }
  }

  async function refreshNotifications() {
    const { count } = await supabase.from("cms_notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
    setUnread(count || 0);
  }

  async function logout() { await supabase.auth.signOut(); router.replace("/admin/login"); }
  function toggleTheme() { const next = !dark; setDark(next); localStorage.setItem("salt-cms-theme", next ? "dark" : "light"); }
  function toggleCollapsed() { const next = !collapsed; setCollapsed(next); localStorage.setItem("salt-cms-collapsed", String(next)); }

  const matches = useMemo(() => navItems.filter((item) => item.label.toLowerCase().includes(commandQuery.toLowerCase())), [commandQuery]);
  if (checking) return <main className="cms-boot"><div className="cms-boot-mark"><Sparkles/></div><b>Loading enterprise workspace…</b></main>;

  return (
    <main className="cms-root" data-cms-theme={dark ? "dark" : "light"}>
      <div className={`cms-layout ${collapsed ? "is-collapsed" : ""}`}>
        <aside className={`cms-sidebar ${mobileOpen ? "is-mobile-open" : ""}`}>
          <div className="cms-brandbar">
            <Link href="/admin" className="cms-brand">
              <span className="cms-brand-mark"><Sparkles/></span>
              {!collapsed && <span><strong>The Salt Origin</strong><small>Enterprise CMS</small></span>}
            </Link>
            <button className="cms-icon-button lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X/></button>
          </div>

          <div className="cms-nav-scroll">
            {!collapsed && <div className="cms-nav-label">Content</div>}
            <nav className="cms-nav">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return <div key={item.href}>
                  {index === 9 && !collapsed && <div className="cms-nav-label section-gap">CRM & Settings</div>}
                  <Link href={item.href} title={item.label} onClick={() => setMobileOpen(false)} className={`cms-nav-item ${active ? "is-active" : ""}`}>
                    <Icon/><span>{item.label}</span>{active && <i/>}
                  </Link>
                </div>;
              })}
            </nav>
            {!collapsed && <div className="cms-sidebar-card">
              <div className="cms-live-dot"/><strong>Live website</strong>
              <p>Open the public website in a new tab and verify published changes.</p>
              <Link href="/" target="_blank">Preview website <ChevronRight/></Link>
            </div>}
          </div>
          <button className="cms-collapse" onClick={toggleCollapsed} aria-label="Collapse navigation">{collapsed ? <ChevronRight/> : <ChevronLeft/>}</button>
        </aside>

        {mobileOpen && <button className="cms-mobile-backdrop" onClick={() => setMobileOpen(false)} />}

        <section className="cms-main">
          <header className="cms-topbar">
            <div className="cms-topbar-left">
              <button className="cms-icon-button lg:hidden" onClick={() => setMobileOpen(true)}><Menu/></button>
              <div><strong>Control Center</strong><span>Content, commerce and growth operations</span></div>
            </div>
            <div className="cms-topbar-actions">
              <button className="cms-command-trigger" onClick={() => setCommandOpen(true)}><Search/><span>Search workspace</span><kbd>Ctrl K</kbd></button>
              <Link href="/admin/inquiries" className="cms-icon-button has-badge" aria-label="Notifications"><Bell/>{unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}</Link>
              <button className="cms-icon-button" onClick={toggleTheme}>{dark ? <Sun/> : <Moon/>}</button>
              <div className="cms-user"><UserCircle2/><span><strong>{email}</strong><small>Super Admin</small></span></div>
              <button className="cms-icon-button danger" onClick={logout}><LogOut/></button>
            </div>
          </header>
          <div className="cms-content">{children}</div>
        </section>
      </div>

      {commandOpen && <div className="cms-command-overlay" onMouseDown={() => setCommandOpen(false)}>
        <div className="cms-command" onMouseDown={(event) => event.stopPropagation()}>
          <div className="cms-command-input"><Command/><input autoFocus value={commandQuery} onChange={(e) => setCommandQuery(e.target.value)} placeholder="Go to any CMS module…"/><kbd>ESC</kbd></div>
          <div className="cms-command-results">{matches.map((item) => { const Icon = item.icon; return <button key={item.href} onClick={() => { router.push(item.href); setCommandOpen(false); }}><span><Icon/>{item.label}</span><ChevronRight/></button>; })}</div>
        </div>
      </div>}
    </main>
  );
}
