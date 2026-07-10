"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  FileText,
  FolderTree,
  Home,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/blogs", label: "Blogs", icon: FileText },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/inquiries", label: "Inquiries CRM", icon: Inbox },
  { href: "/admin/seo", label: "SEO Manager", icon: Search },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("salt-cms-theme");
    setDark(saved === "dark");
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("salt-cms-theme", next ? "dark" : "light");
  }

  const palette = dark
    ? "bg-[#101418] text-slate-100"
    : "bg-[#FFF8F5] text-[#081325]";

  return (
    <main className={`min-h-screen ${palette}`}>
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className={`${mobileOpen ? "fixed inset-y-0 left-0 z-50 block w-[290px]" : "hidden"} lg:block border-r border-[#C23B4A]/15 ${dark ? "bg-[#161C22]" : "bg-white/95"} p-6 lg:sticky lg:top-0 lg:h-screen`}>
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#FFF2F4] flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-[#C23B4A]" />
              </div>
              <div>
                <p className="font-black leading-tight">The Salt Origin</p>
                <p className="text-xs text-slate-500">CMS Control Center</p>
              </div>
            </Link>
            <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-sm transition ${active ? "bg-[#C23B4A] text-white" : dark ? "hover:bg-white/10" : "hover:bg-[#FFF2F4] hover:text-[#C23B4A]"}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={`mt-8 rounded-3xl p-5 border ${dark ? "bg-white/5 border-white/10" : "bg-[#FFF2F4] border-[#EFE3E5]"}`}>
            <p className="text-sm font-black">Website Control</p>
            <p className="text-xs text-slate-500 mt-2">Edit content, products, media, SEO and leads without touching code.</p>
            <Link href="/" className="mt-4 inline-flex rounded-xl bg-[#C23B4A] text-white px-4 py-2 text-xs font-black">
              View Website
            </Link>
          </div>
        </aside>

        {mobileOpen && <button className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close overlay" />}

        <section className="min-w-0">
          <header className={`sticky top-0 z-30 backdrop-blur border-b border-[#C23B4A]/15 px-5 lg:px-10 py-4 flex items-center justify-between ${dark ? "bg-[#161C22]/95" : "bg-white/90"}`}>
            <div className="flex items-center gap-3">
              <button className="lg:hidden rounded-xl border p-2" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[4px] text-[#C23B4A] font-black">CMS</p>
                <h1 className="text-xl font-black">Admin Control Panel</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className={`rounded-xl border px-4 py-3 font-black text-sm ${dark ? "border-white/15" : "border-[#EFE3E5]"}`}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link href="/admin/inquiries" className="rounded-xl bg-[#C23B4A] text-white px-5 py-3 text-sm font-black">
                View Leads
              </Link>
            </div>
          </header>
          <div className="p-5 lg:p-10">{children}</div>
        </section>
      </div>
    </main>
  );
}
