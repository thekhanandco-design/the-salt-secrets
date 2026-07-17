"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import {
  Activity, Boxes, FileText, FolderTree, Home, Image as ImageIcon, Images,
  Inbox, Languages, LayoutDashboard, LogOut, Menu, Moon, Search, Settings,
  Sparkles, Sun, Type, UserCircle2, X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/images", label: "Images Manager", icon: Images },
  { href: "/admin/text", label: "Text Manager", icon: Type },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/blogs", label: "Blog Posts", icon: FileText },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon },
  { href: "/admin/inquiries", label: "Inquiries CRM", icon: Inbox },
  { href: "/admin/seo", label: "SEO Manager", icon: Search },
  { href: "/admin/languages", label: "Languages", icon: Languages },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("Admin");

  useEffect(() => {
    const saved = localStorage.getItem("salt-cms-theme");
    setDark(saved ? saved === "dark" : true);
    void checkSession();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace("/admin/login");
      return;
    }
    setEmail(data.session.user.email || "Admin");
    setChecking(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("salt-cms-theme", next ? "dark" : "light");
  }

  if (checking) {
    return <main className="min-h-screen bg-[#07111f] text-white flex items-center justify-center">Checking admin session...</main>;
  }

  const shell = dark ? "bg-[#07111f] text-slate-100" : "bg-[#f7f8fb] text-[#0c1728]";
  const panel = dark ? "bg-[#0b1728] border-white/10" : "bg-white border-slate-200";

  return (
    <main className={`min-h-screen ${shell}`} data-cms-theme={dark ? "dark" : "light"}>
      <div className="grid min-h-screen lg:grid-cols-[250px_1fr]">
        <aside className={`${mobileOpen ? "fixed inset-y-0 left-0 z-50 block w-[250px]" : "hidden"} lg:block border-r ${dark ? "bg-[#07111f] border-white/10" : "bg-white border-slate-200"} lg:sticky lg:top-0 lg:h-screen`}>
          <div className={`h-[76px] px-5 flex items-center justify-between border-b ${dark ? "border-white/10" : "border-slate-200"}`}>
            <Link href="/admin" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center"><Sparkles className="h-5 w-5 text-blue-400" /></div>
              <div><p className="font-black leading-tight">The Salt Origin</p><p className="text-[11px] text-slate-500">CMS Admin</p></div>
            </Link>
            <button className="lg:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5"/></button>
          </div>

          <div className="p-4 h-[calc(100vh-76px)] overflow-y-auto">
            <p className="px-3 mb-2 text-[10px] uppercase tracking-[3px] text-slate-500 font-black">Content</p>
            <nav className="space-y-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <div key={item.href}>
                    {index === 8 && <p className="px-3 mt-6 mb-2 text-[10px] uppercase tracking-[3px] text-slate-500 font-black">CRM & Settings</p>}
                    <Link href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : dark ? "text-slate-300 hover:bg-white/5 hover:text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"}`}>
                      <Icon className="h-4 w-4" />{item.label}
                    </Link>
                  </div>
                );
              })}
            </nav>

            <div className={`mt-8 rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50"}`}>
              <p className="text-xs font-black">Live Website</p>
              <p className="text-[11px] text-slate-500 mt-1">Preview changes on the public website.</p>
              <Link href="/" target="_blank" className="mt-3 inline-flex rounded-lg bg-blue-600 text-white px-3 py-2 text-xs font-black">View Website</Link>
            </div>
          </div>
        </aside>

        {mobileOpen && <button className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />}

        <section className="min-w-0">
          <header className={`h-[76px] sticky top-0 z-30 border-b backdrop-blur px-4 lg:px-7 flex items-center justify-between ${dark ? "bg-[#07111f]/95 border-white/10" : "bg-white/95 border-slate-200"}`}>
            <div className="flex items-center gap-3">
              <button className="lg:hidden rounded-lg border border-white/10 p-2" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5"/></button>
              <div><p className="font-black">CMS Control Center</p><p className="text-[11px] text-slate-500">Supabase connected content management</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/" target="_blank" className={`hidden md:inline-flex px-4 py-2.5 rounded-xl text-xs font-black border ${dark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}>View Site</Link>
              <button onClick={toggleTheme} className={`w-10 h-10 rounded-xl border inline-flex items-center justify-center ${dark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}>{dark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button>
              <div className={`hidden sm:flex items-center gap-2 rounded-xl border px-3 py-2 ${dark ? "border-white/10" : "border-slate-200"}`}><UserCircle2 className="h-7 w-7 text-slate-400"/><div className="max-w-[150px]"><p className="text-xs font-black truncate">{email}</p><p className="text-[10px] text-slate-500">Super Admin</p></div></div>
              <button onClick={logout} title="Logout" className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 inline-flex items-center justify-center"><LogOut className="h-4 w-4"/></button>
            </div>
          </header>
          <div className="p-4 lg:p-7">{children}</div>
        </section>
      </div>

      <style jsx global>{`
        [data-cms-theme="dark"] input,[data-cms-theme="dark"] textarea,[data-cms-theme="dark"] select{background:#0d1b2d!important;border-color:rgba(255,255,255,.12)!important;color:#e7eef8!important}
        [data-cms-theme="dark"] input::placeholder,[data-cms-theme="dark"] textarea::placeholder{color:#64748b!important}
      `}</style>
    </main>
  );
}
