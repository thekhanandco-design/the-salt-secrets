"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { MessageCircle, Music2, Save, Share2 } from "lucide-react";

const platforms = [
  ["whatsapp", "WhatsApp", MessageCircle], ["instagram", "Instagram", Share2], ["facebook", "Facebook", Share2],
  ["tiktok", "TikTok", Music2], ["youtube", "YouTube", Share2], ["linkedin", "LinkedIn", Share2],
  ["x", "X / Twitter", Share2], ["pinterest", "Pinterest", Share2],
] as const;

type LinkRow = { id?: string; platform: string; label: string; url: string; enabled: boolean; display_order: number; icon_key?: string };

export default function SocialMediaPage() {
  const [rows, setRows] = useState<LinkRow[]>(platforms.map((p, i) => ({ platform:p[0], label:p[1], url:"", enabled:p[0]==="whatsapp", display_order:i+1, icon_key:p[0] })));
  const [saving, setSaving] = useState(false);
  useEffect(() => { void load(); }, []);
  async function load() { const { data } = await supabase.from("social_links").select("*").order("display_order"); if (data?.length) setRows(data as LinkRow[]); }
  function update(index:number, patch:Partial<LinkRow>) { setRows((current)=>current.map((row,i)=>i===index?{...row,...patch}:row)); }
  async function save() {
    setSaving(true);
    const payload = rows.map((r,i)=>({ platform:r.platform,label:r.label,url:r.url||"",enabled:r.enabled,display_order:i+1,icon_key:r.icon_key||r.platform,updated_at:new Date().toISOString() }));
    const { error } = await supabase.from("social_links").upsert(payload,{onConflict:"platform"});
    setSaving(false); if(error) return alert(error.message); window.dispatchEvent(new Event("salt-cms-updated")); alert("Social links saved.");
  }
  return <AdminShell><div className="space-y-6"><div><p className="uppercase tracking-[4px] text-blue-400 font-black text-xs">Global Settings</p><h1 className="text-4xl font-black mt-2">Social Media Manager</h1><p className="text-slate-400 mt-2">Connect every website social icon from one place.</p></div><div className="grid xl:grid-cols-2 gap-4">{rows.map((row,index)=>{const Icon=platforms.find(p=>p[0]===row.platform)?.[2]||MessageCircle;return <div key={row.platform} className="cms-panel rounded-2xl border border-white/10 bg-[#0b1728] p-5"><div className="flex items-center gap-3 mb-4"><div className="h-11 w-11 rounded-xl bg-blue-600/15 flex items-center justify-center"><Icon className="h-5 w-5 text-blue-400"/></div><div><p className="font-black">{row.label}</p><p className="text-xs text-slate-500">{row.platform}</p></div><label className="ml-auto flex items-center gap-2 text-xs"><input type="checkbox" checked={row.enabled} onChange={e=>update(index,{enabled:e.target.checked})}/> Enabled</label></div><input value={row.url||""} onChange={e=>update(index,{url:e.target.value})} placeholder={`Paste ${row.label} URL`} className="w-full border rounded-xl p-4"/></div>})}</div><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-black text-white"><Save className="h-4 w-4"/>{saving?"Saving...":"Save Social Links"}</button></div></AdminShell>;
}
