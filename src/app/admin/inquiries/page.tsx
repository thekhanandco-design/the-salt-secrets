"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { AdminCard } from "@/components/admin/AdminCard";
import { supabase } from "@/lib/supabase-client";
import { CheckCircle2, Clock3, FileCheck2, Trophy, XCircle } from "lucide-react";

type Inquiry = {
  id: number; created_at: string; name: string; email: string; company: string; whatsapp: string;
  country: string; product: string; quantity: string; message: string; status?: string; notes?: string;
};

const statuses = ["new", "contacted", "quotation_sent", "won", "lost"];
const statusMeta: Record<string, { label: string; cls: string; Icon: typeof Clock3 }> = {
  new: { label: "New", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20", Icon: Clock3 },
  contacted: { label: "Contacted", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20", Icon: CheckCircle2 },
  quotation_sent: { label: "Quotation Sent", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", Icon: FileCheck2 },
  won: { label: "Won", cls: "bg-green-500/10 text-green-500 border-green-500/20", Icon: Trophy },
  lost: { label: "Lost", cls: "bg-red-500/10 text-red-500 border-red-500/20", Icon: XCircle },
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => { void loadInquiries(); }, []);

  async function loadInquiries() {
    setLoading(true);
    const { data } = await supabase.from("inquiries").select("*").order("created_at", { ascending: false });
    setInquiries((data as Inquiry[]) || []);
    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (error) return alert(error.message);
    setInquiries((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
    if (selectedInquiry?.id === id) setSelectedInquiry({ ...selectedInquiry, status });
  }

  async function deleteInquiry(id: number) {
    if (!confirm("Delete this inquiry?")) return;
    await supabase.from("inquiries").delete().eq("id", id);
    setInquiries((prev) => prev.filter((item) => item.id !== id));
  }

  function exportCsv() {
    const rows = [["Date","Name","Email","Company","WhatsApp","Country","Product","Quantity","Status","Message"], ...inquiries.map((item) => [item.created_at,item.name,item.email,item.company,item.whatsapp,item.country,item.product,item.quantity,item.status || "new",item.message])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "the-salt-origin-inquiries.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const filteredInquiries = useMemo(() => {
    const q = search.toLowerCase();
    const now = new Date();
    return inquiries.filter((item) => {
      const haystack = [item.name,item.email,item.company,item.country,item.product].join(" ").toLowerCase();
      const statusOk = statusFilter === "all" || (item.status || "new") === statusFilter;
      const created = new Date(item.created_at);
      const days = (now.getTime() - created.getTime()) / 86400000;
      const dateOk = dateFilter === "all" || (dateFilter === "today" && created.toDateString() === now.toDateString()) || (dateFilter === "week" && days <= 7) || (dateFilter === "month" && days <= 31);
      return haystack.includes(q) && statusOk && dateOk;
    });
  }, [search, inquiries, statusFilter, dateFilter]);

  const todayCount = inquiries.filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString()).length;
  const newCount = inquiries.filter((item) => !item.status || item.status === "new").length;

  return <AdminShell><div className="space-y-8">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4"><div><p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">CRM</p><h1 className="text-4xl lg:text-5xl font-black mt-2">Inquiries Dashboard</h1><p className="text-slate-500 mt-3">Track every website lead from new inquiry to quotation and sale.</p></div><button onClick={exportCsv} className="bg-[#C23B4A] text-white px-6 py-4 rounded-xl font-black w-fit">Export CSV</button></div>
    <div className="grid md:grid-cols-3 gap-5"><AdminCard title="Total Inquiries" value={inquiries.length}/><AdminCard title="Today's Inquiries" value={todayCount}/><AdminCard title="New Leads" value={newCount}/></div>
    <div className="cms-panel rounded-[24px] border p-5 grid lg:grid-cols-[1fr_220px_220px] gap-3"><input placeholder="Search by name, email, country, product..." value={search} onChange={(e)=>setSearch(e.target.value)} className="h-14 border rounded-xl px-4"/><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="h-14 border rounded-xl px-4"><option value="all">All Statuses</option>{statuses.map(s=><option key={s} value={s}>{statusMeta[s].label}</option>)}</select><select value={dateFilter} onChange={(e)=>setDateFilter(e.target.value)} className="h-14 border rounded-xl px-4"><option value="all">All Dates</option><option value="today">Today</option><option value="week">Last 7 Days</option><option value="month">Last 31 Days</option></select></div>
    <div className="cms-panel border rounded-[24px] overflow-hidden">{loading?<div className="p-10 text-center">Loading...</div>:<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="cms-table-head"><th className="text-left p-4">Name</th><th className="text-left p-4">Email</th><th className="text-left p-4">Country</th><th className="text-left p-4">Product</th><th className="text-left p-4">Status</th><th className="text-left p-4">Date</th><th className="text-left p-4">Actions</th></tr></thead><tbody>{filteredInquiries.map(item=>{const key=item.status||"new";const meta=statusMeta[key]||statusMeta.new;const Icon=meta.Icon;return <tr key={item.id} className="border-t cms-row"><td className="p-4 font-semibold">{item.name}</td><td className="p-4">{item.email}</td><td className="p-4">{item.country}</td><td className="p-4">{item.product||"General"}</td><td className="p-4"><div className="flex min-w-[260px] items-center gap-2"><div className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 ${meta.cls}`}><Icon className="w-4 h-4"/><b>{meta.label}</b></div><select value={key} onChange={(e)=>updateStatus(item.id,e.target.value)} className="min-w-0 flex-1 border rounded-xl px-3 py-2">{statuses.map(s=><option key={s} value={s}>{statusMeta[s].label}</option>)}</select></div></td><td className="p-4">{new Date(item.created_at).toLocaleDateString()}</td><td className="p-4"><div className="flex flex-wrap gap-2"><button onClick={()=>setSelectedInquiry(item)} className="bg-[#C23B4A] text-white px-4 py-2 rounded-lg">View</button><Link href={`/admin/documents?inquiry=${item.id}&type=quotation`} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Quote</Link><button onClick={()=>deleteInquiry(item.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button></div></td></tr>})}{!filteredInquiries.length&&<tr><td colSpan={7} className="p-10 text-center text-slate-500">No inquiries found.</td></tr>}</tbody></table></div>}</div>
    {selectedInquiry&&<div className="fixed inset-0 bg-black/70 z-[2000] p-3 sm:p-6 flex items-center justify-center" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelectedInquiry(null)}}><div className="cms-panel w-full max-w-4xl max-h-[92vh] rounded-[28px] border shadow-2xl overflow-hidden flex flex-col"><div className="shrink-0 flex items-center justify-between px-5 sm:px-8 py-5 border-b"><div><p className="text-[11px] uppercase tracking-[3px] text-[#C23B4A] font-black">Lead Details</p><h2 className="text-3xl font-black mt-1">Inquiry Details</h2></div><button onClick={()=>setSelectedInquiry(null)} className="w-11 h-11 rounded-xl cms-muted text-xl font-black">×</button></div><div className="cms-scrollbar min-h-0 flex-1 overflow-y-auto px-5 sm:px-8 py-6"><div className="grid md:grid-cols-2 gap-4 text-sm"><Info label="Name" value={selectedInquiry.name}/><Info label="Email" value={selectedInquiry.email}/><Info label="Company" value={selectedInquiry.company}/><Info label="WhatsApp" value={selectedInquiry.whatsapp}/><Info label="Country" value={selectedInquiry.country}/><Info label="Product" value={selectedInquiry.product}/><Info label="Quantity" value={selectedInquiry.quantity}/><Info label="Status" value={statusMeta[selectedInquiry.status||"new"]?.label}/></div><div className="mt-6 cms-muted border rounded-2xl p-5"><p className="font-black mb-3">Message</p><div className="cms-scrollbar max-h-[48vh] overflow-y-auto pr-3"><p className="whitespace-pre-wrap break-words leading-7">{selectedInquiry.message||"No message provided"}</p></div></div></div><div className="shrink-0 border-t px-5 sm:px-8 py-4 flex flex-wrap justify-end gap-3"><button onClick={()=>setSelectedInquiry(null)} className="border px-5 py-3 rounded-xl font-black">Close</button><Link href={`/admin/documents?inquiry=${selectedInquiry.id}&type=quotation`} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-black">Create Quotation</Link>{selectedInquiry.email&&<a href={`mailto:${selectedInquiry.email}`} className="bg-[#C23B4A] text-white px-5 py-3 rounded-xl font-black">Email</a>}{selectedInquiry.whatsapp&&<a target="_blank" rel="noreferrer" href={`https://wa.me/${selectedInquiry.whatsapp.replace(/[^0-9]/g,"")}`} className="bg-green-600 text-white px-5 py-3 rounded-xl font-black">WhatsApp</a>}</div></div></div>}
  </div></AdminShell>;
}

function Info({label,value}:{label:string;value?:string}){return <div className="border rounded-2xl p-4"><p className="text-slate-500 text-xs uppercase tracking-[2px]">{label}</p><p className="font-bold mt-1 break-words">{value||"-"}</p></div>}
