"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/admin");
    });
  }, [router]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) return setError(loginError.message);
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="premium-login-page">
      <div className="premium-login-orb premium-login-orb-one" />
      <div className="premium-login-orb premium-login-orb-two" />
      <section className="premium-login-card">
        <div className="premium-login-logo-wrap">
          <Image src="/salt-origin-logo.png" alt="The Salt Origin" width={180} height={150} priority />
        </div>
        <p className="premium-login-eyebrow">SECURE ADMIN ACCESS</p>
        <h1>THE SALT ORIGIN<br />ENTERPRISE CMS</h1>
        <form onSubmit={handleLogin} className="premium-login-form">
          <label>
            <span>Email address</span>
            <div className="premium-login-input"><Mail /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@thesaltorigin.com" required /></div>
          </label>
          <label>
            <span>Password</span>
            <div className="premium-login-input"><LockKeyhole /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">{showPassword ? <EyeOff /> : <Eye />}</button></div>
          </label>
          {error && <p className="premium-login-error">{error}</p>}
          <button className="premium-login-button" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="premium-login-footer">PRIVATE BUSINESS OPERATIONS PLATFORM</p>
      </section>
    </main>
  );
}
