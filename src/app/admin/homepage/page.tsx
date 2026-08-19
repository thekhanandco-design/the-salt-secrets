"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { Check, CheckCircle2, ExternalLink, MonitorSmartphone, Newspaper, RefreshCw, Save, Sparkles } from "lucide-react";

type BlogPost = {
  id: string | number;
  title: string;
  slug: string;
  excerpt?: string | null;
  featured_image?: string | null;
  category?: string | null;
  published_at?: string | null;
};

type SiteConfig = Record<string, unknown>;

export default function HomepageContentManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [settingsId, setSettingsId] = useState<string | number | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [settingsResult, blogResult] = await Promise.all([
      supabase.from("site_settings").select("id,config_json").limit(1).maybeSingle(),
      supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,featured_image,category,published_at,status,content_type")
        .eq("status", "published")
        .eq("content_type", "blog")
        .order("published_at", { ascending: false })
        .limit(100),
    ]);

    if (settingsResult.error || blogResult.error) {
      setError(settingsResult.error?.message || blogResult.error?.message || "Unable to load homepage content settings.");
      setLoading(false);
      return;
    }

    const config = (settingsResult.data?.config_json && typeof settingsResult.data.config_json === "object"
      ? settingsResult.data.config_json
      : {}) as SiteConfig;
    const selected = Array.isArray(config.home_resource_blog_ids)
      ? config.home_resource_blog_ids.map((value) => String(value)).filter(Boolean).slice(0, 4)
      : [];

    setSettingsId(settingsResult.data?.id ?? null);
    setSiteConfig(config);
    setSelectedResourceIds(selected);
    setPosts((blogResult.data || []) as BlogPost[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedPosts = useMemo(
    () => selectedResourceIds.map((id) => posts.find((post) => String(post.id) === id)).filter(Boolean) as BlogPost[],
    [posts, selectedResourceIds],
  );

  function toggleResource(post: BlogPost) {
    const id = String(post.id);
    setError("");
    setSelectedResourceIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= 4) {
        setError("Homepage par maximum 4 buyer resources select kiye ja sakte hain.");
        return current;
      }
      return [...current, id];
    });
  }

  async function saveResources() {
    setSaving(true);
    setError("");
    const nextConfig: SiteConfig = {
      ...siteConfig,
      home_resource_blog_ids: selectedResourceIds,
    };
    const payload = { config_json: nextConfig, updated_at: new Date().toISOString() };
    const result = settingsId
      ? await supabase.from("site_settings").update(payload).eq("id", settingsId).select("id,config_json").single()
      : await supabase.from("site_settings").insert({ site_name: "The Salt Origin", ...payload }).select("id,config_json").single();

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    setSettingsId(result.data.id);
    setSiteConfig((result.data.config_json || nextConfig) as SiteConfig);
    window.dispatchEvent(new Event("salt-cms-updated"));
    setToast(selectedResourceIds.length ? "Homepage buyer resources updated." : "Homepage resources set to automatic latest mode.");
    setSaving(false);
  }

  return (
    <AdminShell>
      <div className="os-page homepage-content-manager">
        <header className="os-page-header">
          <div>
            <div className="os-page-eyebrow">WEBSITE · HOMEPAGE</div>
            <h1>Homepage Content</h1>
            <p className="os-page-subtitle">Homepage structure is live-CMS linked. Pick buyer resources here; edit page copy and images with the dedicated website managers.</p>
          </div>
          <div className="os-page-actions">
            <button className="os-btn soft" type="button" onClick={() => void load()} disabled={loading || saving}><RefreshCw />Refresh</button>
            <Link className="os-btn soft" href="/" target="_blank"><ExternalLink />Open Live Home</Link>
            <button className="os-btn primary" type="button" onClick={() => void saveResources()} disabled={loading || saving}><Save />{saving ? "Saving..." : "Save Homepage"}</button>
          </div>
        </header>

        {error && <section className="os-card"><div className="os-card-body"><strong>Homepage setting needs attention</strong><p className="os-page-subtitle">{error}</p></div></section>}

        <section className="os-grid three homepage-manager-links">
          <Link href="/admin/website-editor" className="os-card"><div className="os-card-body"><MonitorSmartphone /><strong>Visual Editor</strong><span>Edit any visible homepage text and section content on the live preview.</span></div></Link>
          <Link href="/admin/text?page=home" className="os-card"><div className="os-card-body"><Sparkles /><strong>Text Manager</strong><span>Manage homepage copy, typography and translations from one place.</span></div></Link>
          <Link href="/admin/images?page=home" className="os-card"><div className="os-card-body"><Newspaper /><strong>Images Manager</strong><span>Replace homepage images section-by-section without mixing old assets.</span></div></Link>
        </section>

        <section className="os-card">
          <div className="os-card-header">
            <div>
              <div className="os-page-eyebrow">HELPFUL RESOURCES FOR BUYERS</div>
              <h2>Choose homepage blog resources</h2>
              <p className="os-page-subtitle">Select up to 4 published articles. With no manual selection, the homepage automatically shows the latest published articles, up to four.</p>
            </div>
            <span className={`os-badge ${selectedResourceIds.length ? "blue" : "green"}`}>{selectedResourceIds.length ? `${selectedResourceIds.length}/4 selected` : "Automatic latest"}</span>
          </div>
          <div className="os-card-body">
            <div className="homepage-resource-toolbar">
              <div>
                <strong>{selectedResourceIds.length ? "Manual homepage selection" : "Automatic latest mode"}</strong>
                <span>{selectedResourceIds.length ? "Only the selected published resources will appear, in this order." : "As new blog posts are published, the latest ones can appear automatically."}</span>
              </div>
              {selectedResourceIds.length > 0 && <button className="os-btn soft" type="button" onClick={() => { setSelectedResourceIds([]); setError(""); }}>Use Latest Automatically</button>}
            </div>

            {selectedPosts.length > 0 && (
              <div className="homepage-resource-selected">
                {selectedPosts.map((post, index) => <span key={post.id}><b>{index + 1}</b>{post.title}</span>)}
              </div>
            )}

            {loading ? (
              <div className="os-empty"><h3>Loading published resources...</h3></div>
            ) : posts.length ? (
              <div className="homepage-resource-grid">
                {posts.map((post) => {
                  const id = String(post.id);
                  const selectedIndex = selectedResourceIds.indexOf(id);
                  const selected = selectedIndex >= 0;
                  return (
                    <button type="button" className={`homepage-resource-card ${selected ? "selected" : ""}`} onClick={() => toggleResource(post)} key={post.id}>
                      <div className="homepage-resource-thumb">
                        {post.featured_image ? <img src={post.featured_image} alt="" /> : <span><Newspaper /></span>}
                        <i>{selected ? <><Check />#{selectedIndex + 1}</> : "Select"}</i>
                      </div>
                      <div className="homepage-resource-card-copy">
                        <small>{post.category || "Buyer Resource"}</small>
                        <strong>{post.title}</strong>
                        <p>{post.excerpt || "Published buyer resource"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="os-empty"><div className="os-empty-icon"><Newspaper /></div><h3>No published blog resources yet</h3><p>Publish an article in Blog Center and it will become available here automatically.</p><Link className="os-btn primary" href="/admin/blog-center">Open Blog Center</Link></div>
            )}
          </div>
        </section>

        {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2 /></span><div><strong>{toast}</strong><span>The homepage resource selection is now stored in the CMS.</span></div></div></div>}
      </div>
    </AdminShell>
  );
}
