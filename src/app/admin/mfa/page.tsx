"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { adminFetch } from "@/lib/admin-client";
import { isLocalBrowserDevelopment } from "@/lib/local-development";
import { CheckCircle2, KeyRound, LockKeyhole, LogOut, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";

type Factor = { id: string; friendly_name?: string; status?: string; factor_type?: string };

export default function AdminMfaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [localRecovery, setLocalRecovery] = useState(false);
  const [returnTo, setReturnTo] = useState("/admin");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [factors, setFactors] = useState<Factor[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { void initialize(); }, []);

  async function initialize() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams(window.location.search);
    const manage = params.get("manage") === "1";
    const requestedReturn = params.get("return") || "/admin";
    setManageMode(manage);
    setReturnTo(requestedReturn.startsWith("/admin") ? requestedReturn : "/admin");
    setLocalRecovery(isLocalBrowserDevelopment());

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) { router.replace("/admin/login"); return; }

    const [{ data: aal, error: aalError }, { data: factorData, error: factorsError }] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);
    if (aalError || factorsError) {
      setError("Unable to load the authenticator status for this session.");
      setLoading(false);
      return;
    }

    const verified = (factorData?.totp || []).filter((item) => item.status === "verified") as Factor[];
    setFactors(verified);
    setFactorId((current) => verified.some((factor) => factor.id === current) ? current : (verified[0]?.id || ""));
    if (aal.currentLevel === "aal2" && !manage) { router.replace(requestedReturn.startsWith("/admin") ? requestedReturn : "/admin"); return; }
    setLoading(false);
  }

  async function enroll() {
    setWorking(true); setError(""); setMessage("");
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "The Salt Origin CMS" });
      if (enrollError || !data?.id || !data.totp) throw enrollError || new Error("Unable to start MFA enrollment.");
      setFactorId(data.id);
      setQr(data.totp.qr_code || "");
      setSecret(data.totp.secret || "");
      setMessage("Scan this new QR code in Google Authenticator, then enter the current six-digit code.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start MFA enrollment.");
    } finally { setWorking(false); }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code.trim())) { setError("Enter the six-digit code from your authenticator app."); return; }
    setWorking(true); setError(""); setMessage("");
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (verifyError) throw verifyError;
      setMessage("Authenticator verified. Opening the CMS securely...");
      window.setTimeout(() => { router.replace(returnTo); router.refresh(); }, 350);
    } catch {
      setError("That code was not accepted. Make sure your phone time is automatic and that you are using the selected The Salt Origin factor. On localhost you can safely reset and re-enroll below.");
    } finally { setWorking(false); }
  }

  async function localReset() {
    if (!localRecovery) return;
    if (!confirm("Reset your localhost authenticator enrollment? This only works in local development and does not create a production MFA bypass.")) return;
    setWorking(true); setError(""); setMessage("");
    try {
      const response = await adminFetch("/api/admin/mfa/local-reset", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Local authenticator reset failed.");
      await supabase.auth.signOut();
      router.replace("/admin/login");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Local authenticator reset failed.");
      setWorking(false);
    }
  }

  async function disableFactor(id: string) {
    if (!confirm("Disable this authenticator factor? You will need to enroll a new one before privileged production actions.")) return;
    setWorking(true); setError(""); setMessage("");
    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (unenrollError) throw unenrollError;
      setMessage("Authenticator disabled.");
      setCode(""); setQr(""); setSecret("");
      await initialize();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to disable MFA.");
      setWorking(false);
    }
  }

  async function signOut() { await supabase.auth.signOut(); router.replace("/admin/login"); }

  return <main className="premium-login-page final-login-page">
    <section className="premium-login-card" style={{ maxWidth: 560 }}>
      <div className="premium-login-logo-wrap"><Image src="/salt-origin-logo.png" alt="The Salt Origin" width={180} height={150} priority /></div>
      <div className="login-security"><ShieldCheck />CMS MULTI-FACTOR SECURITY</div>
      <h1>{manageMode ? <>MANAGE YOUR<br />MFA SECURITY</> : <>VERIFY YOUR<br />ADMIN ACCESS</>}</h1>
      {loading ? <p className="login-explainer">Checking your MFA status...</p> : <>
        {manageMode && factors.length > 0 && <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          <p className="login-explainer">Verified authenticators on this account.</p>
          {factors.map((factor) => <button key={factor.id} type="button" className="premium-login-button" onClick={() => void disableFactor(factor.id)} disabled={working}><Trash2 />Disable {factor.friendly_name || "authenticator"}</button>)}
        </div>}

        {!factorId && <><p className="login-explainer">No verified authenticator is enrolled. Set up Google Authenticator (or another TOTP app) below.</p><button className="premium-login-button" onClick={enroll} disabled={working}><KeyRound />{working ? "Starting..." : "Set up authenticator"}</button></>}

        {!manageMode && factors.length > 1 && !qr && <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          <p className="login-explainer">Choose the authenticator whose code you are entering.</p>
          {factors.map((factor, index) => <button key={factor.id} type="button" className={factor.id === factorId ? "premium-login-button" : "login-link-button"} onClick={() => { setFactorId(factor.id); setCode(""); setError(""); }} disabled={working}>Authenticator {index + 1}{factor.friendly_name ? ` · ${factor.friendly_name}` : ""}</button>)}
        </div>}

        {!manageMode && factorId && !qr && factors.length > 0 && <p className="login-explainer">Open the authenticator app linked to this CMS and enter its current six-digit code.</p>}
        {qr && <div style={{ display: "grid", placeItems: "center", gap: 10, marginBottom: 18 }}>
          <img src={qr} alt="Authenticator QR code" style={{ width: 220, height: 220, background: "white", padding: 10, borderRadius: 16 }} />
          {secret && <details><summary>Cannot scan? Show setup key</summary><code style={{ wordBreak: "break-all" }}>{secret}</code></details>}
        </div>}
        {!manageMode && factorId && <form className="premium-login-form" onSubmit={verify}><label><span>Authenticator code</span><div className="premium-login-input"><LockKeyhole /><input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" required /></div></label><button className="premium-login-button" disabled={working}><CheckCircle2 />{working ? "Verifying..." : "Verify & Continue"}</button></form>}

        {localRecovery && factors.length > 0 && <button type="button" className="login-link-button" onClick={() => void localReset()} disabled={working}><RotateCcw />Reset localhost authenticator</button>}
        {manageMode && <button type="button" className="login-link-button" onClick={() => router.replace("/admin/settings")}><ShieldCheck />Return to settings</button>}
        {error && <p className="premium-login-error">{error}</p>}{message && <p className="premium-login-success"><CheckCircle2 />{message}</p>}
      </>}
      <button type="button" className="login-link-button" onClick={signOut}><LogOut />Sign out</button>
      <p className="premium-login-footer">Normal CMS access remains available after a valid admin login. Production Super Admin actions require AAL2. The localhost reset control is disabled in production.</p>
    </section>
  </main>;
}
