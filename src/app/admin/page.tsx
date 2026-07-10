"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, Image as ImageIcon, Inbox, LayoutDashboard, Search, Settings } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { AdminCard } from "@/components/admin/AdminCard";
import { supabase } from "@/lib/supabase-client";

type Inquiry = { id: number; name?: string; email?: string; country?: string; product?: string; created_at?: string; status?: string };
type Product = { id: number; title?: string; category?: string; image?: string; status?: string; created_at?: string };

export default function AdminDashboard() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [{ data: inquiryData }, { data: productData }] = await Promise.all([
      supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(8),
      supabase.from("products").select("*").order("created_at", { ascending: false }).limit(8),
    ]);

    setInquiries((inquiryData as Inquiry[]) || []);
    setProducts((productData as Product[]) || []);
    setLoading(false);
  }

  const newLeads = useMemo(() => inquiries.filter((item) => !item.status || item.status === "new").length, [inquiries]);
  const activeProducts = useMemo(() => products.filter((item) => !item.status || item.status === "active").length, [products]);

  return (
    <AdminShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">Dashboard</p>
            <h1 className="text-4xl lg:text-5xl font-black mt-2">Website CMS Overview</h1>
            <p className="text-slate-600 mt-3">Manage products, leads, media, SEO and site settings from one place.</p>
          </div>
          <Link href="/admin/products" className="rounded-xl bg-[#C23B4A] text-white px-6 py-4 font-black w-fit">Add Product</Link>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          <AdminCard title="Recent Inquiries" value={inquiries.length} subtitle="Latest leads loaded from Supabase" />
          <AdminCard title="New Leads" value={newLeads} subtitle="Not yet contacted" />
          <AdminCard title="Recent Products" value={products.length} subtitle="Latest products loaded" />
          <AdminCard title="Active Products" value={activeProducts} subtitle="Visible on website" />
        </div>

        <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="rounded-[28px] bg-white border border-[#EFE3E5] overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-[#EFE3E5]">
              <h2 className="text-2xl font-black">Recent Inquiries</h2>
              <Link href="/admin/inquiries" className="text-[#C23B4A] font-black text-sm">View All</Link>
            </div>
            {loading ? (
              <div className="p-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#FFF4F5]">
                    <tr>
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Product</th>
                      <th className="p-4 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((item) => (
                      <tr key={item.id} className="border-t border-[#EFE3E5]">
                        <td className="p-4 font-bold">{item.name || "-"}</td>
                        <td className="p-4">{item.email || "-"}</td>
                        <td className="p-4">{item.product || "General"}</td>
                        <td className="p-4"><span className="rounded-full bg-[#FFF2F4] px-3 py-1 text-xs font-black text-[#C23B4A]">{item.status || "new"}</span></td>
                      </tr>
                    ))}
                    {inquiries.length === 0 && <tr><td className="p-8 text-center text-slate-500" colSpan={4}>No inquiries yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-[28px] bg-white border border-[#EFE3E5] p-6">
            <h2 className="text-2xl font-black mb-5">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { href: "/admin/products", label: "Products", icon: Boxes },
                { href: "/admin/media", label: "Media", icon: ImageIcon },
                { href: "/admin/inquiries", label: "Leads", icon: Inbox },
                { href: "/admin/seo", label: "SEO", icon: Search },
                { href: "/admin/settings", label: "Settings", icon: Settings },
                { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="rounded-2xl border border-[#EFE3E5] p-4 hover:bg-[#FFF2F4] transition">
                    <Icon className="h-6 w-6 text-[#C23B4A]" />
                    <p className="mt-3 font-black text-sm">{item.label}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white border border-[#EFE3E5] overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-[#EFE3E5]">
            <h2 className="text-2xl font-black">Recent Products</h2>
            <Link href="/admin/products" className="text-[#C23B4A] font-black text-sm">Manage</Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 p-6">
            {products.map((item) => (
              <div key={item.id} className="rounded-2xl bg-[#FFF8F5] border border-[#EFE3E5] p-4">
                {item.image && <img src={item.image} alt="" className="h-28 w-full rounded-xl object-contain bg-white" />}
                <p className="font-black mt-3">{item.title || "Untitled"}</p>
                <p className="text-sm text-slate-500">{item.category || "Uncategorized"}</p>
              </div>
            ))}
            {products.length === 0 && <p className="text-slate-500">No products found.</p>}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
