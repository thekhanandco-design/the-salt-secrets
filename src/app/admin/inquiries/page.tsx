"use client";

import { useEffect, useMemo, useState } from "react";
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
};

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    loadInquiries();
  }, []);

  async function loadInquiries() {
    const { data } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    setInquiries((data as Inquiry[]) || []);
    setLoading(false);
  }

  async function deleteInquiry(id: number) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this inquiry?"
    );

    if (!confirmDelete) return;

    await supabase.from("inquiries").delete().eq("id", id);

    setInquiries((prev) => prev.filter((item) => item.id !== id));
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      const q = search.toLowerCase();

      return (
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.company?.toLowerCase().includes(q)
      );
    });
  }, [search, inquiries]);

  const todayCount = inquiries.filter((item) => {
    const today = new Date().toDateString();
    return new Date(item.created_at).toDateString() === today;
  }).length;

  return (
    <main className="min-h-screen bg-[#FFF8F5] p-6 lg:p-10">
      <div className="max-w-[1700px] mx-auto">

        {/* TOP BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

          <h1 className="text-4xl font-black text-[#081325]">
            Inquiries Dashboard
          </h1>

          <button
            onClick={logout}
            className="bg-[#C23B4A] text-white px-6 py-3 rounded-xl font-bold"
          >
            Logout
          </button>

        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">

          <div className="bg-white rounded-[24px] border border-[#EFE3E5] p-6">
            <p className="text-slate-500 text-sm">
              Total Inquiries
            </p>

            <h2 className="text-5xl font-black text-[#081325] mt-2">
              {inquiries.length}
            </h2>
          </div>

          <div className="bg-white rounded-[24px] border border-[#EFE3E5] p-6">
            <p className="text-slate-500 text-sm">
              Today's Inquiries
            </p>

            <h2 className="text-5xl font-black text-[#C23B4A] mt-2">
              {todayCount}
            </h2>
          </div>

        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-[24px] border border-[#EFE3E5] p-5 mb-8">

          <input
            type="text"
            placeholder="Search by name, email or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 border border-[#EFE3E5] rounded-xl px-4"
          />

        </div>

        {/* TABLE */}
        <div className="bg-white border border-[#EFE3E5] rounded-[24px] overflow-hidden">

          {loading ? (
            <div className="p-10 text-center">
              Loading...
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="bg-[#FFF4F5]">

                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Country</th>
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Actions</th>

                  </tr>
                </thead>

                <tbody>

                  {filteredInquiries.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-[#EFE3E5]"
                    >
                      <td className="p-4 font-semibold">
                        {item.name}
                      </td>

                      <td className="p-4">
                        {item.email}
                      </td>

                      <td className="p-4">
                        {item.country}
                      </td>

                      <td className="p-4">
                        {item.product}
                      </td>

                      <td className="p-4">
                        {new Date(
                          item.created_at
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              setSelectedInquiry(item)
                            }
                            className="bg-[#C23B4A] text-white px-4 py-2 rounded-lg text-sm"
                          >
                            View
                          </button>

                          <button
                            onClick={() =>
                              deleteInquiry(item.id)
                            }
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                          >
                            Delete
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* MESSAGE MODAL */}
        {selectedInquiry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">

            <div className="bg-white rounded-[24px] max-w-2xl w-full p-8">

              <div className="flex justify-between items-center mb-6">

                <h2 className="text-2xl font-black">
                  Inquiry Details
                </h2>

                <button
                  onClick={() =>
                    setSelectedInquiry(null)
                  }
                  className="text-3xl"
                >
                  ×
                </button>

              </div>

              <div className="space-y-3">

                <p><strong>Name:</strong> {selectedInquiry.name}</p>
                <p><strong>Email:</strong> {selectedInquiry.email}</p>
                <p><strong>Company:</strong> {selectedInquiry.company}</p>
                <p><strong>Phone:</strong> {selectedInquiry.whatsapp}</p>
                <p><strong>Country:</strong> {selectedInquiry.country}</p>
                <p><strong>Product:</strong> {selectedInquiry.product}</p>
                <p><strong>Quantity:</strong> {selectedInquiry.quantity}</p>

                <div className="mt-6 border rounded-xl p-4 bg-[#FAFAFA]">
                  {selectedInquiry.message}
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}