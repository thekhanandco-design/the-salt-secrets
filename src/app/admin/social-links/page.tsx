"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { SocialPlatformIcon, socialPlatformOptions } from "@/components/SocialPlatformIcon";
import { supabase } from "@/lib/supabase-client";
import { CheckCircle2, Eye, EyeOff, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";

type SocialLink = {
  id?: string;
  platform: string;
  label: string;
  url: string;
  icon_key: string;
  enabled: boolean;
  display_order: number;
  updated_at?: string;
};

type PlatformDraft = { url: string; label: string };

const emptyCustom = (): SocialLink => ({
  platform: "facebook",
  label: "Facebook",
  url: "",
  icon_key: "facebook",
  enabled: true,
  display_order: 0,
});

export default function SocialLinksPage() {
  const [rows, setRows] = useState<SocialLink[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PlatformDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState<SocialLink>(emptyCustom());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await supabase.from("social_links").select("*").order("display_order").order("created_at");
    if (result.error) {
      setError(result.error.message);
    } else {
      const nextRows = (result.data || []) as SocialLink[];
      setRows(nextRows);
      const nextDrafts: Record<string, PlatformDraft> = {};
      socialPlatformOptions.forEach(([platform, label]) => {
        const row = nextRows.find((item) => item.platform === platform);
        nextDrafts[platform] = { url: row?.url || "", label: row?.label || label };
      });
      nextRows.forEach((row) => {
        if (!nextDrafts[row.platform]) nextDrafts[row.platform] = { url: row.url || "", label: row.label };
      });
      setDrafts(nextDrafts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const active = useMemo(() => rows.filter((row) => row.enabled && row.url).length, [rows]);
  const allPlatforms = useMemo(() => {
    const preset = socialPlatformOptions.map(([platform, label]) => ({ platform, label }));
    const extras = rows
      .filter((row) => !preset.some((item) => item.platform === row.platform))
      .map((row) => ({ platform: row.platform, label: row.label }));
    return [...preset, ...extras];
  }, [rows]);

  function rowFor(platform: string) {
    return rows.find((row) => row.platform === platform);
  }

  function patchDraft(platform: string, patch: Partial<PlatformDraft>) {
    setDrafts((current) => ({
      ...current,
      [platform]: { ...(current[platform] || { url: "", label: platform }), ...patch },
    }));
  }

  async function savePlatform(platform: string, defaultLabel: string, override?: PlatformDraft) {
    const draft = override || drafts[platform] || { url: "", label: defaultLabel };
    if (!draft.url.trim()) {
      setError(`Enter the ${draft.label || defaultLabel} public profile URL first.`);
      return;
    }
    try { new URL(draft.url.trim()); } catch {
      setError("Enter a complete public link beginning with https://");
      return;
    }

    setSaving(platform);
    setError("");
    const existing = rowFor(platform);
    const payload = {
      platform,
      label: draft.label.trim() || defaultLabel,
      url: draft.url.trim(),
      icon_key: platform,
      enabled: existing?.enabled ?? true,
      display_order: existing?.display_order ?? allPlatforms.findIndex((item) => item.platform === platform),
      updated_at: new Date().toISOString(),
    };
    const result = existing?.id
      ? await supabase.from("social_links").update(payload).eq("id", existing.id)
      : await supabase.from("social_links").insert(payload);
    setSaving(null);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    window.dispatchEvent(new Event("salt-cms-updated"));
    setToast(`${payload.label} saved and linked to the public website.`);
    await load();
  }

  async function togglePlatform(platform: string, defaultLabel: string) {
    const existing = rowFor(platform);
    if (!existing?.id) {
      if (!drafts[platform]?.url) {
        setError(`Save the ${defaultLabel} link before changing visibility.`);
        return;
      }
      await savePlatform(platform, defaultLabel);
      return;
    }
    setSaving(`toggle:${platform}`);
    const result = await supabase
      .from("social_links")
      .update({ enabled: !existing.enabled, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    setSaving(null);
    if (result.error) setError(result.error.message);
    else {
      window.dispatchEvent(new Event("salt-cms-updated"));
      setToast(`${existing.label} is now ${existing.enabled ? "hidden" : "visible"}.`);
      await load();
    }
  }

  async function removePlatform(platform: string) {
    const existing = rowFor(platform);
    if (!existing?.id) return;
    if (!window.confirm(`Remove ${existing.label} from the website?`)) return;
    setSaving(`delete:${platform}`);
    const result = await supabase.from("social_links").delete().eq("id", existing.id);
    setSaving(null);
    if (result.error) setError(result.error.message);
    else {
      window.dispatchEvent(new Event("salt-cms-updated"));
      setToast(`${existing.label} removed.`);
      await load();
    }
  }

  function chooseCustomPlatform(value: string) {
    const label = socialPlatformOptions.find(([platform]) => platform === value)?.[1] || value;
    setCustom((current) => ({ ...current, platform: value, icon_key: value, label }));
  }

  async function saveCustom() {
    const next = { url: custom.url, label: custom.label };
    patchDraft(custom.platform, next);
    setCustomOpen(false);
    await savePlatform(custom.platform, custom.label, next);
  }

  return (
    <AdminShell>
      <div className="os-page social-profile-links-page">
        <header className="os-page-header">
          <div>
            <div className="os-page-eyebrow">Marketing connections</div>
            <h1 className="os-page-title">Social Profile Links</h1>
            <p className="os-page-subtitle">Save each public profile once, choose whether it is visible, and the website footer and social icons update from the same records.</p>
          </div>
          <div className="os-page-actions">
            <button className="os-btn soft" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/>Refresh</button>
            <button className="os-btn primary" onClick={() => { setCustom(emptyCustom()); setCustomOpen(true); }}><Plus/>Add Platform</button>
          </div>
        </header>

        {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body"><strong>Social profile action failed</strong><p className="os-page-subtitle">{error}</p></div></section>}

        <section className="social-links-overview">
          <article><span>Saved Profiles</span><strong>{rows.length}</strong><small>Connected website records</small></article>
          <article><span>Visible on Website</span><strong>{active}</strong><small>Enabled public links</small></article>
        </section>

        <section className="social-profile-card-grid">
          {allPlatforms.map(({ platform, label }) => {
            const row = rowFor(platform);
            const draft = drafts[platform] || { url: row?.url || "", label: row?.label || label };
            const isSaving = saving === platform || saving === `toggle:${platform}` || saving === `delete:${platform}`;
            return (
              <article className="social-profile-card" key={platform}>
                <div className="social-profile-card-head">
                  <span className="social-profile-card-icon"><SocialPlatformIcon platform={platform}/></span>
                  <div><strong>{draft.label || label}</strong><small>{row?.enabled ? "Visible on website" : row ? "Hidden from website" : "Not linked yet"}</small></div>
                  <span className={`os-badge ${row?.enabled ? "green" : ""}`}>{row?.enabled ? "Visible" : "Hidden"}</span>
                </div>
                <label className="os-label"><span>Public profile URL</span><input value={draft.url} onChange={(event) => patchDraft(platform, { url: event.target.value })} placeholder={`https://${platform}.com/…`}/></label>
                <div className="social-profile-card-actions">
                  <button className="os-btn primary" onClick={() => void savePlatform(platform, label)} disabled={isSaving}><Save/>{saving === platform ? "Saving…" : "Save Link"}</button>
                  <button className="os-btn soft" onClick={() => void togglePlatform(platform, label)} disabled={isSaving}>{row?.enabled ? <EyeOff/> : <Eye/>}{row?.enabled ? "Hide" : "Show"}</button>
                  {row?.id && <button className="os-icon-button" onClick={() => void removePlatform(platform)} disabled={isSaving} aria-label={`Delete ${label}`}><Trash2/></button>}
                </div>
              </article>
            );
          })}
        </section>

        {customOpen && (
          <div className="os-modal-backdrop" onMouseDown={() => setCustomOpen(false)}>
            <section className="os-modal" onMouseDown={(event) => event.stopPropagation()}>
              <div className="os-modal-header"><div><h2>Add Social Platform</h2><p className="os-page-subtitle">Create or update a website social link.</p></div><button className="os-icon-button" onClick={() => setCustomOpen(false)}><X/></button></div>
              <div className="os-modal-body"><div className="os-form-grid">
                <label className="os-label"><span>Platform</span><select value={custom.platform} onChange={(event) => chooseCustomPlatform(event.target.value)}>{socialPlatformOptions.map(([value, optionLabel]) => <option key={value} value={value}>{optionLabel}</option>)}</select></label>
                <label className="os-label"><span>Display Name</span><input value={custom.label} onChange={(event) => setCustom((current) => ({ ...current, label: event.target.value }))}/></label>
                <label className="os-label full"><span>Public Profile URL</span><input value={custom.url} onChange={(event) => setCustom((current) => ({ ...current, url: event.target.value }))} placeholder="https://…"/></label>
              </div></div>
              <div className="os-modal-footer"><button className="os-btn soft" onClick={() => setCustomOpen(false)}>Cancel</button><button className="os-btn primary" onClick={() => void saveCustom()}><Save/>Save Platform</button></div>
            </section>
          </div>
        )}

        {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>Public social icons read these records automatically.</span></div></div></div>}
      </div>
    </AdminShell>
  );
}
