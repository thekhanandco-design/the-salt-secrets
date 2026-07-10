"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { AdminCard } from "@/components/admin/AdminCard";
import { supabase } from "@/lib/supabase-client";

type Inquiry = {
  id: number;
  created_at: string;
  name: string;
  email: string;
  company: string;
  whatsapp: string;
  country: string;
  product: string;
  quantity: string;
  message: string;
  status?: string;
  notes?: string;
};

const statuses = ["new", "contacted", "quotation_sent", "won", "lost"];

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries() {
    setLoading(true);
    const { data } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    setInquiries((data as Inquiry[]) || []);
    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (error) {
      alert("Add status column using supabase/cms-schema.sql first. " + error.message);
      return;
    }
    setInquiries((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  async function deleteInquiry(id: number) {
    if (!confirm("Delete this inquiry?")) return;
    await supabase.from("inquiries").delete().eq("id", id);
    setInquiries((prev) => prev.filter((item) => item.id !== id));
  }

  function exportCsv() {
    const rows = [
      ["Date", "Name", "Email", "Company", "WhatsApp", "Country", "Product", "Quantity", "Status", "Message"],
      ...inquiries.map((item) => [
        item.created_at,
        item.name,
        item.email,
        item.company,
        item.whatsapp,
        item.country,
        item.product,
        item.quantity,
        item.status || "new",
        item.message,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "the-salt-origin-inquiries.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredInquiries = useMemo(() => {
    const q = search.toLowerCase();
    return inquiries.filter((item) => {
      return (
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q) ||
        item.country?.toLowerCase().includes(q) ||
        item.product?.toLowerCase().includes(q)
      );
    });
  }, [search, inquiries]);

  const todayCount = inquiries.filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString()).length;
  const newCount = inquiries.filter((item) => !item.status || item.status === "new").length;

  return (
    <AdminShell>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">CRM</p>
            <h1 className="text-4xl lg:text-5xl font-black mt-2">Inquiries Dashboard</h1>
            <p className="text-slate-600 mt-3">Track every website lead from new inquiry to quotation and sale.</p>
          </div>
          <button onClick={exportCsv} className="bg-[#C23B4A] text-white px-6 py-4 rounded-xl font-black w-fit">Export CSV</button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <AdminCard title="Total Inquiries" value={inquiries.length} />
          <AdminCard title="Today's Inquiries" value={todayCount} />
          <AdminCard title="New Leads" value={newCount} />
        </div>

        <div className="bg-white rounded-[24px] border border-[#EFE3E5] p-5">
          <input type="text" placeholder="Search by name, email, country, product..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-14 border border-[#EFE3E5] rounded-xl px-4" />
        </div>

        <div className="bg-white border border-[#EFE3E5] rounded-[24px] overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FFF4F5]">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Country</th>
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((item) => (
                    <tr key={item.id} className="border-t border-[#EFE3E5]">
                      <td className="p-4 font-semibold">{item.name}</td>
                      <td className="p-4">{item.email}</td>
                      <td className="p-4">{item.country}</td>
                      <td className="p-4">{item.product || "General"}</td>
                      <td className="p-4">
                        <select value={item.status || "new"} onChange={(e) => updateStatus(item.id, e.target.value)} className="border border-[#EFE3E5] rounded-xl px-3 py-2 bg-white">
                          {statuses.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                        </select>
                      </td>
                      <td className="p-4">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedInquiry(item)} className="bg-[#C23B4A] text-white px-4 py-2 rounded-lg text-sm">View</button>
                          <button onClick={() => deleteInquiry(item.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInquiries.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">No inquiries found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedInquiry && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-5">
            <div className="bg-white w-full max-w-3xl rounded-[28px] p-8 relative">
              <button onClick={() => setSelectedInquiry(null)} className="absolute top-5 right-5 bg-slate-100 px-4 py-2 rounded-xl font-bold">Close</button>
              <h2 className="text-3xl font-black text-[#081325] mb-6">Inquiry Details</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <Info label="Name" value={selectedInquiry.name} />
                <Info label="Email" value={selectedInquiry.email} />
                <Info label="Company" value={selectedInquiry.company} />
                <Info label="WhatsApp" value={selectedInquiry.whatsapp} />
                <Info label="Country" value={selectedInquiry.country} />
                <Info label="Product" value={selectedInquiry.product} />
                <Info label="Quantity" value={selectedInquiry.quantity} />
                <Info label="Status" value={selectedInquiry.status || "new"} />
              </div>
              <div className="mt-6 bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-5">
                <p className="font-black mb-2">Message</p>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedInquiry.message || "No message provided"}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {selectedInquiry.email && <a href={`mailto:${selectedInquiry.email}`} className="bg-[#C23B4A] text-white px-5 py-3 rounded-xl font-black">Email Customer</a>}
                {selectedInquiry.whatsapp && <a target="_blank" href={`https://wa.me/${selectedInquiry.whatsapp.replace(/[^0-9]/g, "")}`} className="bg-green-600 text-white px-5 py-3 rounded-xl font-black">WhatsApp</a>}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border border-[#EFE3E5] rounded-2xl p-4">
      <p className="text-slate-500 text-xs uppercase tracking-[2px]">{label}</p>
      <p className="font-bold mt-1 break-words">{value || "-"}</p>
    </div>
  );
}
