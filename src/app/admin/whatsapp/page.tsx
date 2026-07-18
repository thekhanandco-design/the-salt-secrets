"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { MessageCircle, Send, Smartphone, Webhook } from "lucide-react";

export default function WhatsAppCenterPage() {
  const [phone, setPhone] = useState(process.env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER || "");
  const [message, setMessage] = useState("Test notification from The Salt Origin CMS");
  const [sending, setSending] = useState(false);

  async function sendTest() {
    setSending(true);
    try {
      const response = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "WhatsApp test failed");
      alert("WhatsApp test notification sent.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "WhatsApp test failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[5px] text-emerald-500">Messaging</p>
          <h1 className="mt-2 text-4xl font-black">WhatsApp Center</h1>
          <p className="mt-3 max-w-3xl text-slate-500">
            New inquiry alerts WhatsApp par receive karein aur buyer ko seedha reply karein.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {[
            [MessageCircle, "Inquiry Alerts", "Har new website inquiry ka instant WhatsApp notification."],
            [Smartphone, "Quick Reply", "CRM se buyer ka WhatsApp chat ek click mein open karein."],
            [Webhook, "Cloud API Ready", "Meta WhatsApp Cloud API token aur phone-number ID support."],
          ].map(([Icon, title, text]: any) => (
            <article key={title} className="cms-panel rounded-3xl border p-6">
              <Icon className="h-6 w-6 text-emerald-500" />
              <h2 className="mt-4 text-lg font-black">{title}</h2>
              <p className="mt-2 text-sm text-slate-500">{text}</p>
            </article>
          ))}
        </div>

        <section className="cms-panel rounded-3xl border p-6">
          <h2 className="text-xl font-black">Connection & Test</h2>
          <p className="mt-2 text-sm text-slate-500">
            Vercel mein WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID aur WHATSAPP_ADMIN_NUMBER add karein.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold">Admin WhatsApp Number
              <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="923212430365" className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3" />
            </label>
            <label className="text-sm font-bold">Test Message
              <input value={message} onChange={(e)=>setMessage(e.target.value)} className="mt-2 w-full rounded-xl border bg-transparent px-4 py-3" />
            </label>
          </div>
          <button onClick={sendTest} disabled={sending || !phone} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
            <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Test"}
          </button>
        </section>

        <section className="cms-panel rounded-3xl border p-6">
          <h2 className="text-xl font-black">Mobile CMS</h2>
          <p className="mt-2 text-sm text-slate-500">
            Website ko mobile browser mein open karke “Add to Home Screen” karein. Existing PWA registration ki wajah se CMS app ki tarah launch hoga.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
