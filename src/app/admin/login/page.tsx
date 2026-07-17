"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin");
    });
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) return setError(loginError.message);
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white grid lg:grid-cols-2">
      <section className="hidden lg:flex relative overflow-hidden p-14 flex-col justify-between bg-gradient-to-br from-[#07111f] via-[#0b1d33] to-[#102a4a]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#2563eb_0,transparent_35%),radial-gradient(circle_at_80%_70%,#C23B4A_0,transparent_35%)]" />
        <div className="relative"><p className="text-2xl font-black">The Salt Origin</p><p className="text-slate-400">Enterprise CMS</p></div>
        <div className="relative max-w-xl"><ShieldCheck className="w-14 h-14 text-blue-400"/><h1 className="text-5xl font-black leading-tight mt-6">Control every image, text, product, blog and lead from one secure dashboard.</h1><p className="text-slate-400 text-lg mt-5">Supabase authentication protects your content management system.</p></div>
        <p className="relative text-xs text-slate-500">The Salt Origin CMS · Secure Admin Access</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8"><p className="text-blue-400 uppercase tracking-[5px] text-xs font-black">Admin Login</p><h2 className="text-4xl font-black mt-2">Welcome back</h2><p className="text-slate-400 mt-2">Use the admin user created in Supabase Authentication.</p></div>
          <form onSubmit={handleLogin} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 space-y-5 shadow-2xl">
            <label className="block"><span className="text-sm font-bold">Email address</span><div className="relative mt-2"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="admin@thesaltorigin.com" className="w-full rounded-xl border border-white/10 bg-[#0d1b2d] py-4 pl-11 pr-4 text-white"/></div></label>
            <label className="block"><span className="text-sm font-bold">Password</span><div className="relative mt-2"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required placeholder="••••••••" className="w-full rounded-xl border border-white/10 bg-[#0d1b2d] py-4 pl-11 pr-4 text-white"/></div></label>
            {error && <p className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">{error}</p>}
            <button disabled={loading} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-4 font-black transition">{loading ? "Signing in..." : "Sign In to CMS"}</button>
          </form>
          <p className="text-xs text-slate-500 mt-5 leading-6">First create your admin user in Supabase → Authentication → Users → Add user.</p>
        </div>
      </section>
    </main>
  );
}
