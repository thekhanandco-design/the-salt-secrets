"use client";

import { useEffect, useState } from "react";
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

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <main className="min-h-screen bg-[#FFF8F5] p-6 lg:p-10">

      <div className="max-w-[1600px] mx-auto">

        <div className="flex items-center justify-between mb-8">

          <h1 className="text-4xl font-black text-[#081325]">
            Inquiries
          </h1>

          <button
            onClick={logout}
            className="bg-[#C23B4A] text-white px-6 py-3 rounded-xl font-bold"
          >
            Logout
          </button>

        </div>

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
                    <th className="text-left p-4">Phone</th>
                    <th className="text-left p-4">Country</th>
                    <th className="text-left p-4">Product</th>
                    <th className="text-left p-4">Quantity</th>

                  </tr>
                </thead>

                <tbody>

                  {inquiries.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-[#EFE3E5]"
                    >
                      <td className="p-4">{item.name}</td>
                      <td className="p-4">{item.email}</td>
                      <td className="p-4">{item.whatsapp}</td>
                      <td className="p-4">{item.country}</td>
                      <td className="p-4">{item.product}</td>
                      <td className="p-4">{item.quantity}</td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

    </main>
  );
}