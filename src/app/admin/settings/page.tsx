"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";

type Setting = { id: number; site_name?: string; contact_email?: string; whatsapp_number?: string; address?: string; footer_text?: string };

export default function SettingsPage() {
  const [settingsId, setSettingsId] = useState<number | null>(null);
  const [siteName, setSiteName] = useState("The Salt Origin");
  const [contactEmail, setContactEmail] = useState("thekhanandco@gmail.com");
  const [whatsappNumber, setWhatsappNumber] = useState("92331281289");
  const [address, setAddress] = useState("Pakistan");
  const [footerText, setFooterText] = useState("Premium Himalayan Pink Salt supplier offering retail packaging, bulk supply and private label solutions.");

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from("site_settings").select("*").limit(1).single();
    const row = data as Setting | null;
    if (row) {
      setSettingsId(row.id);
      setSiteName(row.site_name || siteName);
      setContactEmail(row.contact_email || contactEmail);
      setWhatsappNumber(row.whatsapp_number || whatsappNumber);
      setAddress(row.address || address);
      setFooterText(row.footer_text || footerText);
    }
  }

  async function saveSettings() {
    const payload = { site_name: siteName, contact_email: contactEmail, whatsapp_number: whatsappNumber, address, footer_text: footerText };
    const { data, error } = settingsId
      ? await supabase.from("site_settings").update(payload).eq("id", settingsId).select().single()
      : await supabase.from("site_settings").insert([payload]).select().single();
    if (error) return alert("Run supabase/cms-schema.sql first. " + error.message);
    if (data) setSettingsId((data as Setting).id);
    alert("Settings saved");
  }

  return (
    <AdminShell>
      <div className="space-y-8">
        <div>
          <p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">Settings</p>
          <h1 className="text-4xl lg:text-5xl font-black mt-2">Website Settings</h1>
          <p className="text-slate-600 mt-3">Central contact details for future website-wide use.</p>
        </div>
        <div className="rounded-[28px] bg-white border border-[#EFE3E5] p-6 space-y-5">
          <div><label className="font-black block mb-2">Site Name</label><input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full border rounded-xl p-4" /></div>
          <div><label className="font-black block mb-2">Lead Email</label><input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full border rounded-xl p-4" /></div>
          <div><label className="font-black block mb-2">WhatsApp Number</label><input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="w-full border rounded-xl p-4" /></div>
          <div><label className="font-black block mb-2">Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded-xl p-4" /></div>
          <div><label className="font-black block mb-2">Footer Text</label><textarea value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full border rounded-xl p-4 h-36" /></div>
          <button onClick={saveSettings} className="bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-black">Save Settings</button>
        </div>
      </div>
    </AdminShell>
  );
}
