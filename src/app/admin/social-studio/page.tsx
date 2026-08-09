"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { SocialPlatformIcon } from "@/components/SocialPlatformIcon";
import { adminFetch } from "@/lib/admin-client";
import { supabase } from "@/lib/supabase-client";
import { CalendarDays, Check, CheckCircle2, Clock3, Edit3, Eye, Image as ImageIcon, RefreshCw, Save, Send, Share2, Sparkles, UploadCloud, X, XCircle } from "lucide-react";

const platformKeys = ["linkedin", "instagram", "facebook", "pinterest", "threads", "x", "tiktok", "youtube", "reddit", "whatsapp", "telegram", "discord", "snapchat", "mastodon", "bluesky"] as const;
type PlatformKey = typeof platformKeys[number];
type Draft = { title: string; text: string; hashtags: string; imagePrompt: string; image: string; status: string };
type SocialRow = Record<string, any>;

const platformMeta: Record<PlatformKey, { label: string; dimensions: string; aspect: string; aiSize: string }> = {
  linkedin: { label: "LinkedIn", dimensions: "1200 × 627", aspect: "1.91/1", aiSize: "1536x1024" },
  instagram: { label: "Instagram", dimensions: "1080 × 1350", aspect: "4/5", aiSize: "1024x1536" },
  facebook: { label: "Facebook", dimensions: "1200 × 630", aspect: "1.91/1", aiSize: "1536x1024" },
  pinterest: { label: "Pinterest", dimensions: "1000 × 1500", aspect: "2/3", aiSize: "1024x1536" },
  threads: { label: "Threads", dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024" },
  x: { label: "X / Twitter", dimensions: "1600 × 900", aspect: "16/9", aiSize: "1536x1024" },
  tiktok: { label: "TikTok", dimensions: "1080 × 1920", aspect: "9/16", aiSize: "1024x1536" },
  youtube: { label: "YouTube", dimensions: "1280 × 720", aspect: "16/9", aiSize: "1536x1024" },
  reddit: { label: "Reddit", dimensions: "1200 × 630", aspect: "1.91/1", aiSize: "1536x1024" },
  whatsapp: { label: "WhatsApp", dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024" },
  telegram: { label: "Telegram", dimensions: "1080 × 1080", aspect: "1/1", aiSize: "1024x1024" },
  discord: { label: "Discord", dimensions: "1200 × 630", aspect: "1.91/1", aiSize: "1536x1024" },
  snapchat: { label: "Snapchat", dimensions: "1080 × 1920", aspect: "9/16", aiSize: "1024x1536" },
  mastodon: { label: "Mastodon", dimensions: "1200 × 630", aspect: "1.91/1", aiSize: "1536x1024" },
  bluesky: { label: "Bluesky", dimensions: "1200 × 630", aspect: "1.91/1", aiSize: "1536x1024" },
};

function PlatformLogo({ platform, size = 18 }: { platform: PlatformKey | string; size?: number }) {
  return <span className={`platform-logo ${String(platform)}`} style={{ width: size, height: size }} title={platformMeta[String(platform) as PlatformKey]?.label || title(platform)}><SocialPlatformIcon platform={String(platform)} /></span>;
}

const statuses = ["Draft", "Needs Review", "Approved", "Scheduled", "Published", "Rejected", "Failed"];
const tabs = ["Content Calendar", "Create Post", "Drafts", "In Review", "Approved", "Scheduled", "Published", "Failed", "Platform Analytics"];
const emptyDraft = (): Draft => ({ title: "", text: "", hashtags: "", imagePrompt: "", image: "", status: "Draft" });
const blankDrafts = () => Object.fromEntries(platformKeys.map(key => [key, emptyDraft()])) as Record<PlatformKey, Draft>;
function normal(value: unknown) { return String(value || "").trim().toLowerCase().replaceAll("_", " "); }
function title(value: unknown) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()); }
function tabStatus(tab: string) { if(tab === "In Review") return "Needs Review"; if(tab === "Scheduled") return "scheduled"; if(tab === "Published") return "published"; return tab; }
function toLocalDateTime(value?: string) {
  const date = value ? new Date(value) : new Date(Date.now() + 86400000);
  if (Number.isNaN(date.getTime())) return "";
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

export default function SocialStudio() {
  const [activeTab, setActiveTab] = useState("Create Post");
  const [activePlatform, setActivePlatform] = useState<PlatformKey>("linkedin");
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>([...platformKeys]);
  const [drafts, setDrafts] = useState<Record<PlatformKey, Draft>>(blankDrafts);
  const [brief, setBrief] = useState({ topic: "", targetCountry: "", targetAudience: "", objective: "", product: "", tone: "Professional B2B", cta: "", link: "", campaignId: "" });
  const [scheduledAt, setScheduledAt] = useState(toLocalDateTime());
  const [rows, setRows] = useState<SocialRow[]>([]);
  const [campaigns, setCampaigns] = useState<SocialRow[]>([]);
  const [libraryAssets, setLibraryAssets] = useState<SocialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const automaticDraftAttempted = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [posts, campaignRows, mediaRows] = await Promise.all([
      supabase.from("social_scheduled_posts").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("marketing_campaigns").select("id,name,status").order("created_at", { ascending: false }).limit(200),
      supabase.from("media_library").select("id,file_name,file_url,alt_text,folder").eq("folder", "social-library").order("created_at", { ascending: false }).limit(500),
    ]);
    if (posts.error) setError(posts.error.message);
    setRows(posts.data || []); setCampaigns(campaignRows.data || []); setLibraryAssets(mediaRows.error ? [] : mediaRows.data || []); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (loading || automaticDraftAttempted.current) return;
    const today = new Date().toISOString().slice(0, 10);
    const todayRow = rows.find(row => String(row.created_at || row.updated_at || "").slice(0, 10) === today && Boolean(row.brief?.autoGenerated));
    if (todayRow) { editRow(todayRow); setToast("Today’s researched campaign is ready for review."); return; }
    automaticDraftAttempted.current = true;
    void generateAutomaticDailyDraft();
  }, [loading, rows]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2800); return () => clearTimeout(timer); }, [toast]);

  const counts = useMemo(() => Object.fromEntries(statuses.map(status => [status, rows.filter(row => { const approval=normal(row.approval_status); const publishing=normal(row.status); const wanted=normal(status); if(wanted==="scheduled") return approval==="scheduled"||publishing==="scheduled"||publishing==="schedule"; if(wanted==="published") return approval==="published"||publishing==="published"||publishing==="publish"; if(wanted==="failed") return approval==="failed"||publishing==="failed"; return approval===wanted; }).length])), [rows]);
  const visibleRows = useMemo(() => {
    if (["Content Calendar", "Create Post", "Platform Analytics"].includes(activeTab)) return rows;
    const wanted = normal(tabStatus(activeTab));
    return rows.filter(row => { const approval=normal(row.approval_status); const publishing=normal(row.status); if(wanted==="scheduled") return approval==="scheduled"||publishing==="scheduled"||publishing==="schedule"; if(wanted==="published") return approval==="published"||publishing==="published"||publishing==="publish"; if(wanted==="failed") return approval==="failed"||publishing==="failed"; return approval===wanted; });
  }, [activeTab, rows]);
  const active = drafts[activePlatform];
  const meta = platformMeta[activePlatform];
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCampaign = rows.find(row => String(row.created_at || row.updated_at || "").slice(0, 10) === todayKey && Boolean(row.brief?.autoGenerated));

  function patchBrief(key: keyof typeof brief, value: string) { setBrief(previous => ({ ...previous, [key]: value })); }
  function patchDraft(patch: Partial<Draft>, platform = activePlatform) { setDrafts(previous => ({ ...previous, [platform]: { ...previous[platform], ...patch } })); }
  function togglePlatform(platform: PlatformKey) { setSelectedPlatforms(previous => previous.includes(platform) ? previous.filter(item => item !== platform) : [...previous, platform]); }
  function resetEditor() { setEditingId(null); setDrafts(blankDrafts()); setBrief({ topic: "", targetCountry: "", targetAudience: "", objective: "", product: "", tone: "Professional B2B", cta: "", link: "", campaignId: "" }); setSelectedPlatforms([...platformKeys]); setActivePlatform("linkedin"); setScheduledAt(toLocalDateTime()); setError(""); }

  async function generateAutomaticDailyDraft() {
    setWorking("automatic-daily"); setError("");
    try {
      const response = await adminFetch("/api/social/daily-draft", { method: "POST", body: JSON.stringify({}) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Daily social research failed.");
      setToast(payload.skipped ? payload.reason || "Today's campaign is already in Drafts" : "Today's same-topic platform campaign is ready in Drafts");
      await load(); setActiveTab("Drafts");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Daily social research failed."); }
    finally { setWorking(""); }
  }

  async function generateDailyReviewPack() {
    if (!brief.topic.trim()) { setError("Enter today's topic before generating the review pack."); return; }
    if (!selectedPlatforms.length) { setError("Select at least one platform."); return; }
    setWorking("daily-pack"); setError("");
    try {
      const contentResponse = await adminFetch("/api/admin/social-content", { method: "POST", body: JSON.stringify({ ...brief, platforms: selectedPlatforms }) });
      const contentPayload = await contentResponse.json();
      if (!contentResponse.ok) throw new Error(contentPayload.error || "Social content generation requires a connected AI provider.");
      const imagePrompt = String(contentPayload.platforms?.linkedin?.image_prompt || contentPayload.platforms?.instagram?.image_prompt || brief.topic);
      const imageResponse = await adminFetch("/api/ai/image", { method: "POST", body: JSON.stringify({ prompt: `${imagePrompt}. Premium export brand photography for The Salt Origin. No false certifications, statistics, text labels or third-party logos.`, size: "1536x1024" }) });
      const imagePayload = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imagePayload.error || "Image generation requires a connected image provider.");
      const imageUrl = await uploadGeneratedImage("linkedin", String(imagePayload.image || ""));
      setDrafts(previous => {
        const next = { ...previous };
        selectedPlatforms.forEach(platform => {
          const item = contentPayload.platforms?.[platform] || {};
          next[platform] = {
            title: String(item.title || ""),
            text: String(item.text || ""),
            hashtags: String(item.hashtags || ""),
            imagePrompt: String(item.image_prompt || imagePrompt),
            image: imageUrl,
            status: "Draft",
          };
        });
        return next;
      });
      setToast("Full platform review pack generated. Review each platform before approval.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Daily review pack generation failed.");
    } finally { setWorking(""); }
  }

  async function generateContent() {
    if (!brief.topic.trim()) { setError("Enter a topic before generating content."); return; }
    if (!selectedPlatforms.length) { setError("Select at least one platform."); return; }
    setWorking("content"); setError("");
    try {
      const response = await adminFetch("/api/admin/social-content", { method: "POST", body: JSON.stringify({ ...brief, platforms: selectedPlatforms }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Content generation failed.");
      setDrafts(previous => {
        const next = { ...previous };
        selectedPlatforms.forEach(platform => {
          const item = payload.platforms?.[platform] || {};
          next[platform] = { ...next[platform], title: item.title || "", text: item.text || "", hashtags: item.hashtags || "", imagePrompt: item.image_prompt || "", status: "Draft" };
        });
        return next;
      });
      setToast("Platform-specific drafts generated for human review.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Content generation failed."); }
    finally { setWorking(""); }
  }

  async function uploadGeneratedImage(platform: PlatformKey, source: string) {
    if (!source.startsWith("data:")) return source;
    const blob = await fetch(source).then(response => response.blob());
    const path = `social/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.png`;
    const result = await supabase.storage.from("cms-media").upload(path, blob, { contentType: blob.type || "image/png", upsert: false });
    if (result.error) throw new Error(`Image generated but storage upload failed: ${result.error.message}`);
    return supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl;
  }


  function useRelatedLibraryImage() {
    if (!libraryAssets.length) { setError("No images are available in Media Library > social-library."); return; }
    const terms = `${brief.topic} ${brief.product} ${brief.targetCountry}`.toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 2);
    const ranked = libraryAssets.map(asset => {
      const haystack = `${asset.file_name || ""} ${asset.alt_text || ""}`.toLowerCase();
      return { asset, score: terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0) };
    }).sort((a, b) => b.score - a.score);
    if (!ranked[0] || (terms.length && ranked[0].score === 0)) { setError("No topic-related image was found in social-library. Add descriptive filenames or alt text, then try again."); return; }
    const url = String(ranked[0].asset.file_url || "");
    setDrafts(previous => { const next = { ...previous }; selectedPlatforms.forEach(item => { next[item] = { ...next[item], image: url }; }); return next; });
    setToast(`Related social-library image applied to ${selectedPlatforms.length} selected platform${selectedPlatforms.length === 1 ? "" : "s"}.`);
  }

  async function generateImage(platform = activePlatform) {
    const draft = drafts[platform];
    const prompt = draft.imagePrompt.trim() || brief.topic.trim();
    if (!prompt) { setError("Generate content or enter an image prompt first."); return; }
    setWorking(`image-${platform}`); setError("");
    try {
      const response = await adminFetch("/api/ai/image", { method: "POST", body: JSON.stringify({ prompt: `${prompt}. Premium export brand photography for The Salt Origin. Do not add false certificates, statistics, text labels or logos.`, size: platformMeta[platform].aiSize }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Image generation failed.");
      const url = await uploadGeneratedImage(platform, String(payload.image || ""));
      setDrafts(previous => { const next={...previous}; selectedPlatforms.forEach(item => { next[item]={...next[item],image:url}; }); return next; });
      setToast(`Shared campaign image generated and applied to ${selectedPlatforms.length} selected platform${selectedPlatforms.length===1?"":"s"}.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Image generation failed."); }
    finally { setWorking(""); }
  }

  async function onImageFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setWorking("upload"); setError("");
    const path = `social/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const result = await supabase.storage.from("cms-media").upload(path, file, { contentType: file.type, upsert: false });
    if (result.error) setError(result.error.message); else { const url=supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl; setDrafts(previous=>{const next={...previous};selectedPlatforms.forEach(item=>{next[item]={...next[item],image:url};});return next}); setToast("Image uploaded and applied to all selected platforms."); }
    setWorking(""); event.target.value = "";
  }

  async function savePost(targetStatus = "Draft") {
    if (!brief.topic.trim()) { setError("Topic is required."); return; }
    if (!selectedPlatforms.length) { setError("Select at least one platform."); return; }
    setWorking("save"); setError("");
    const statusValue = normal(targetStatus).replaceAll(" ", "_");
    const primary = drafts[selectedPlatforms[0]];
    const payload = {
      title: brief.topic.trim(), campaign_id: brief.campaignId || null, caption: primary.text || "", hashtags: primary.hashtags || "", keywords: "", image_url: primary.image || "",
      platforms: selectedPlatforms, scheduled_at: new Date(scheduledAt).toISOString(), status: statusValue, approval_status: targetStatus,
      platform_content: Object.fromEntries(selectedPlatforms.map(platform => [platform, { title: drafts[platform].title, text: drafts[platform].text, hashtags: drafts[platform].hashtags, image_prompt: drafts[platform].imagePrompt }])),
      platform_images: Object.fromEntries(selectedPlatforms.map(platform => [platform, primary.image || drafts[platform].image]).filter(([, image]) => Boolean(image))),
      platform_results: editingId ? (rows.find(row => row.id === editingId)?.platform_results || {}) : {}, last_error: null, updated_at: new Date().toISOString(), brief,
    };
    const result = editingId ? await supabase.from("social_scheduled_posts").update(payload).eq("id", editingId).select().single() : await supabase.from("social_scheduled_posts").insert(payload).select().single();
    if (result.error) setError(result.error.message); else { setToast(`Social post saved as ${targetStatus}.`); await load(); if (!editingId) resetEditor(); }
    setWorking("");
  }

  function editRow(row: SocialRow) {
    const platforms = (Array.isArray(row.platforms) ? row.platforms : []) as PlatformKey[];
    const content = row.platform_content || {}; const images = row.platform_images || {};
    const next = blankDrafts();
    platforms.forEach(platform => { const item = content[platform] || {}; next[platform] = { title: String(item.title || ""), text: String(item.text || ""), hashtags: String(item.hashtags || ""), imagePrompt: String(item.image_prompt || ""), image: String(images[platform] || (platform === platforms[0] ? row.image_url || "" : "")), status: title(row.approval_status || row.status || "Draft") }; });
    setEditingId(row.id); setDrafts(next); setSelectedPlatforms(platforms.length ? platforms : ["linkedin"]); setActivePlatform(platforms[0] || "linkedin"); setScheduledAt(toLocalDateTime(row.scheduled_at));
    setBrief({ topic: String(row.title || ""), targetCountry: String(row.brief?.targetCountry || ""), targetAudience: String(row.brief?.targetAudience || ""), objective: String(row.brief?.objective || ""), product: String(row.brief?.product || ""), tone: String(row.brief?.tone || "Professional B2B"), cta: String(row.brief?.cta || ""), link: String(row.brief?.link || ""), campaignId: String(row.campaign_id || "") });
    setActiveTab("Create Post");
  }

  async function updateStatus(row: SocialRow, nextStatus: string) {
    const result = await supabase.from("social_scheduled_posts").update({ approval_status: nextStatus, status: normal(nextStatus).replaceAll(" ", "_"), approved_at: nextStatus === "Approved" ? new Date().toISOString() : row.approved_at, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (result.error) setError(result.error.message); else { setToast(`Post moved to ${nextStatus}.`); await load(); }
  }

  async function schedulePost(row: SocialRow) {
    setWorking(`schedule-${row.id}`); setError("");
    const result = await supabase.from("social_scheduled_posts").update({
      approval_status: "Scheduled",
      status: "scheduled",
      approved_at: row.approved_at || new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", row.id);
    if (result.error) setError(result.error.message);
    else { setToast("Approved post scheduled for its saved publishing time."); await load(); }
    setWorking("");
  }

  async function publishNow(row: SocialRow) {
    setWorking(`publish-${row.id}`); setError("");
    try {
      const response = await adminFetch("/api/admin/social/publish", { method: "POST", body: JSON.stringify({ postId: row.id }) });
      const payload = await response.json();
      if (!response.ok || payload.success === false) throw new Error(payload.error || payload.summary?.message || "Meta publishing failed.");
      setToast(payload.summary?.message || "Meta publishing completed.");
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Meta publishing failed."); }
    finally { setWorking(""); }
  }

  async function remove(row: SocialRow) {
    if (!confirm("Delete this social post?")) return;
    const result = await supabase.from("social_scheduled_posts").delete().eq("id", row.id);
    if (result.error) setError(result.error.message); else { setToast("Post deleted."); await load(); }
  }

  const platformCounts = useMemo(() => platformKeys.map(platform => [platformMeta[platform].label, rows.filter(row => Array.isArray(row.platforms) && row.platforms.includes(platform)).length] as const), [rows]);

  return <AdminShell><div className="os-page">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Human-approved B2B publishing</div><h1 className="os-page-title">Social Media Studio</h1><p className="os-page-subtitle">A daily same-topic campaign is researched automatically, with one shared image and platform-tailored captions. Nothing publishes before your approval.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={resetEditor}><RefreshCw/>New Draft</button><button className="os-btn soft" onClick={() => void savePost("Draft")} disabled={working === "save"}><Save/>Save Draft</button><button className="os-btn primary" onClick={() => void generateAutomaticDailyDraft()} disabled={Boolean(working)}><Sparkles/>{working === "automatic-daily" ? "Researching…" : "Refresh Today’s Draft"}</button><button className="os-btn primary" onClick={() => void savePost("Needs Review")} disabled={working === "save"}><Send/>Send for Review</button></div></header>
    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body"><strong>Action could not be completed</strong><p className="os-page-subtitle">{error}</p></div></section>}
    <section className="os-card social-daily-desk"><div className="os-card-header"><div><h2>Today’s Automated Social Pack</h2><p>One researched topic, one shared campaign image and platform-native drafts for every enabled channel. The pack is created by Vercel Cron and waits for your review.</p></div><span className="os-badge green">06:30 UTC Daily</span></div><div className="os-card-body">{todayCampaign ? <div className="social-daily-pack">{todayCampaign.image_url ? <img src={todayCampaign.image_url} alt="Today’s campaign"/> : <div className="social-daily-placeholder"><ImageIcon/><span>Image generation requires a connected provider</span></div>}<div><span className="os-page-eyebrow">{String(todayCampaign.brief?.campaignType || todayCampaign.brief?.strategy || "Daily Campaign")}</span><h3>{todayCampaign.title || "Today’s campaign"}</h3><p>{String(todayCampaign.caption || "").slice(0, 220)}</p><div className="social-platform-chip-row">{(Array.isArray(todayCampaign.platforms) ? todayCampaign.platforms : platformKeys).map((platform:string)=><span key={platform}><PlatformLogo platform={platform}/>{platformMeta[platform as PlatformKey]?.label || title(platform)}</span>)}</div><div className="os-row-actions"><button className="os-btn primary" onClick={()=>editRow(todayCampaign)}><Eye/>Review Today’s Pack</button><button className="os-btn soft" onClick={()=>void generateAutomaticDailyDraft()} disabled={Boolean(working)}><RefreshCw/>Refresh Research</button></div></div></div> : <div className="blog-automation-empty">{working === "automatic-daily" ? <><RefreshCw className="animate-spin"/><strong>Researching today’s topic, captions and image…</strong></> : <><Sparkles/><strong>No automated campaign exists for today.</strong><button className="os-btn primary" onClick={()=>void generateAutomaticDailyDraft()}>Generate Today’s Campaign</button></>}</div>}</div></section>
    <section className="os-grid four">{["Draft", "Needs Review", "Approved", "Scheduled"].map((status, index) => <article className="os-metric" key={status}><div className="os-metric-top"><span className="os-metric-label">{status}</span><span className="os-metric-icon">{index === 0 ? <Edit3/> : index === 1 ? <Eye/> : index === 2 ? <CheckCircle2/> : <CalendarDays/>}</span></div><div className="os-metric-value">{counts[status] || 0}</div><div className="os-metric-foot"><b>Live database records</b><span className="os-source-badge">DB</span></div></article>)}</section>
    <div className="os-tabs">{tabs.map(tab => <button className={`os-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}</div>

    {activeTab === "Create Post" ? <div className="os-three-panel">
      <aside className="os-card os-panel-sticky"><div className="os-card-header"><div><h2>Campaign Brief</h2><p>Only supplied facts are sent to AI</p></div><Sparkles size={16}/></div><div className="os-card-body"><div className="os-form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <label className="os-label"><span>Topic *</span><textarea value={brief.topic} onChange={event => patchBrief("topic", event.target.value)}/></label>
        <label className="os-label"><span>Target Country</span><input value={brief.targetCountry} onChange={event => patchBrief("targetCountry", event.target.value)}/></label>
        <label className="os-label"><span>Target Audience</span><select value={brief.targetAudience} onChange={event => patchBrief("targetAudience", event.target.value)}><option value="">Select…</option>{["Importer", "Distributor", "Wholesaler", "Private Label Brand", "Food Manufacturer", "Retail Chain", "Hospitality Buyer"].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="os-label"><span>Objective</span><input value={brief.objective} onChange={event => patchBrief("objective", event.target.value)}/></label>
        <label className="os-label"><span>Product</span><input value={brief.product} onChange={event => patchBrief("product", event.target.value)}/></label>
        <label className="os-label"><span>Campaign</span><select value={brief.campaignId} onChange={event => patchBrief("campaignId", event.target.value)}><option value="">No campaign</option>{campaigns.map(campaign => <option value={campaign.id} key={campaign.id}>{campaign.name}</option>)}</select></label>
        <label className="os-label"><span>Tone</span><input value={brief.tone} onChange={event => patchBrief("tone", event.target.value)}/></label>
        <label className="os-label"><span>CTA</span><input value={brief.cta} onChange={event => patchBrief("cta", event.target.value)}/></label>
        <label className="os-label"><span>Destination Link</span><input value={brief.link} onChange={event => patchBrief("link", event.target.value)}/></label>
      </div><div className="os-page-eyebrow" style={{ margin: "16px 0 8px" }}>Platforms</div><div className="os-grid two">{platformKeys.map(platform => <button type="button" key={platform} className={`os-tool-button ${selectedPlatforms.includes(platform) ? "active" : ""}`} onClick={() => togglePlatform(platform)}><PlatformLogo platform={platform}/>{platformMeta[platform].label}</button>)}</div><button className="os-btn primary" style={{ width: "100%", marginTop: 14 }} onClick={() => void generateDailyReviewPack()} disabled={Boolean(working)}>{working === "daily-pack" ? <><RefreshCw className="animate-spin"/>Preparing Review Pack…</> : <><Sparkles/>Generate Daily Review Pack</>}</button><button className="os-btn soft" style={{ width: "100%", marginTop: 8 }} onClick={() => void generateContent()} disabled={Boolean(working)}>{working === "content" ? <><RefreshCw className="animate-spin"/>Generating…</> : <><Edit3/>Generate Text Only</>}</button><p className="os-page-subtitle" style={{ marginTop: 10 }}>The full pack creates platform-specific copy, hashtags and image prompts, plus one topic-related campaign image. Every platform remains a draft until you approve it.</p></div></aside>

      <main className="os-card"><div className="os-card-header"><div><h2>Platform Content Editor</h2><p>Each platform has separate editable content</p></div><span className={`os-badge ${active.status === "Approved" ? "green" : active.status === "Needs Review" ? "amber" : "blue"}`}>{active.status}</span></div><div className="os-card-body"><div className="os-tabs" style={{ marginBottom: 14 }}>{platformKeys.map(platform => <button key={platform} className={`os-tab ${activePlatform === platform ? "active" : ""}`} onClick={() => setActivePlatform(platform)}><PlatformLogo platform={platform}/>{platformMeta[platform].label}</button>)}</div>
        {(activePlatform === "pinterest" || activePlatform === "youtube" || activePlatform === "tiktok") && <label className="os-label"><span>{activePlatform === "pinterest" ? "Pin Title" : activePlatform === "youtube" ? "Video Title" : "Video Concept"}</span><input value={active.title} onChange={event => patchDraft({ title: event.target.value })}/></label>}
        <label className="os-label" style={{ marginTop: 12 }}><span>{activePlatform === "instagram" ? "Caption" : activePlatform === "youtube" ? "Description" : "Post Copy"}</span><textarea style={{ minHeight: 210 }} value={active.text} onChange={event => patchDraft({ text: event.target.value })}/><small style={{ textAlign: "right" }}>{active.text.length} characters</small></label>
        <label className="os-label" style={{ marginTop: 12 }}><span>{activePlatform === "pinterest" || activePlatform === "youtube" ? "Keywords" : "Hashtags"}</span><textarea value={active.hashtags} onChange={event => patchDraft({ hashtags: event.target.value })}/></label>
        <label className="os-label" style={{ marginTop: 12 }}><span>Image Prompt</span><textarea value={active.imagePrompt} onChange={event => patchDraft({ imagePrompt: event.target.value })}/></label>
        <div className="os-image-card" style={{ marginTop: 14 }}>{active.image ? <img src={active.image} alt={`${meta.label} asset`} style={{ aspectRatio: meta.aspect, objectFit: "cover" }}/> : <div className="os-empty" style={{ minHeight: 230 }}><div className="os-empty-icon"><ImageIcon/></div><h3>No image yet</h3><p>Generate or upload the real asset for this platform.</p></div>}<div className="os-image-card-body"><strong>{meta.label} Image</strong><span>{meta.dimensions}</span><div className="os-image-actions"><button onClick={() => void generateImage()} disabled={working === `image-${activePlatform}`}><Sparkles/>{working === `image-${activePlatform}` ? "Generating…" : "Generate"}</button><button onClick={useRelatedLibraryImage}><ImageIcon/>Use Related Library Image</button><button onClick={() => fileInput.current?.click()} disabled={working === "upload"}><UploadCloud/>Replace</button><button onClick={() => patchDraft({ status: "Approved" })}><Check/>Approve Image</button></div></div></div>
        <input ref={fileInput} hidden type="file" accept="image/*" onChange={onImageFile}/>
        <div className="os-grid two" style={{ marginTop: 14 }}><label className="os-label"><span>Schedule Date & Time</span><input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)}/></label><label className="os-label"><span>Platform Status</span><select value={active.status} onChange={event => patchDraft({ status: event.target.value })}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label></div>
      </div></main>

      <aside className="os-card os-panel-sticky"><div className="os-card-header"><div><h2>Platform Preview</h2><p>{meta.label} · {meta.dimensions}</p></div><Eye size={16}/></div><div className="os-card-body"><div className="social-live-preview"><div className="social-preview-profile"><img src="/salt-origin-logo.png" alt="The Salt Origin"/><div><strong>The Salt Origin</strong><span>Enterprise B2B Export</span></div></div>{active.image ? <img className="social-preview-media" src={active.image} alt="Preview" style={{ aspectRatio: meta.aspect }}/> : <div className="social-preview-empty"><ImageIcon/><span>Image preview</span></div>}<div className="social-preview-copy">{active.title && <strong>{active.title}</strong>}<p>{active.text || "No content generated yet."}</p>{active.hashtags && <em>{active.hashtags}</em>}<div><span>Like</span><span>Comment</span><span>Share</span></div></div></div><button className="os-btn soft" style={{ width: "100%", marginTop: 12 }} onClick={() => setPreviewOpen(true)}><Eye/>Open Full Preview</button><div className="os-list" style={{ marginTop: 12 }}><div className="os-list-row"><span className="os-list-icon"><Clock3/></span><div className="os-list-main"><strong>Schedule</strong><span>{scheduledAt ? new Date(scheduledAt).toLocaleString() : "Not scheduled"}</span></div></div><div className="os-list-row"><span className="os-list-icon"><CheckCircle2/></span><div className="os-list-main"><strong>Approval</strong><span>Manual approval required before publishing</span></div></div></div></div></aside>
    </div> : activeTab === "Content Calendar" ? <section className="os-card"><div className="os-card-header"><div><h2>Content Calendar</h2><p>Actual saved and scheduled social records</p></div><button className="os-btn primary" onClick={() => { resetEditor(); setActiveTab("Create Post"); }}><Share2/>Create Post</button></div><div className="os-card-body">{rows.length ? <div className="social-calendar-grid">{rows.map(row => <button key={row.id} className="social-calendar-item" onClick={() => editRow(row)}><span>{row.scheduled_at ? new Date(row.scheduled_at).toLocaleDateString() : "No date"}</span><strong>{row.title || "Untitled post"}</strong><small>{Array.isArray(row.platforms) ? <span className="platform-inline-list">{row.platforms.map((platform:string)=><span key={platform}><PlatformLogo platform={platform}/>{platformMeta[platform as PlatformKey]?.label || title(platform)}</span>)}</span> : "No platform"}</small><em>{title(row.approval_status || row.status)}</em></button>)}</div> : <Empty text="No social posts are stored yet."/>}</div></section> : activeTab === "Platform Analytics" ? <section className="os-card"><div className="os-card-header"><div><h2>Platform Record Summary</h2><p>Counts from saved CMS records; platform APIs are required for reach and engagement.</p></div></div><div className="os-card-body"><div className="os-grid four">{platformCounts.map(([label, value]) => <article className="os-metric" key={label}><div className="os-metric-top"><span className="os-metric-label">{label}</span><PlatformLogo platform={platformKeys.find(key => platformMeta[key].label === label) || "linkedin"}/></div><div className="os-metric-value">{value}</div><div className="os-metric-foot"><b>Saved records</b></div></article>)}</div><div className="os-empty" style={{ marginTop: 16 }}><div className="os-empty-icon"><Share2/></div><h3>Live platform analytics require connection</h3><p>Connect each social platform in Integrations to fetch impressions, engagement and publishing results.</p></div></div></section> : <section className="os-card"><div className="os-card-header"><div><h2>{activeTab}</h2><p>{visibleRows.length} matching live records</p></div><button className="os-btn primary" onClick={() => { resetEditor(); setActiveTab("Create Post"); }}><Share2/>Create Post</button></div><div className="os-table-wrap"><table className="os-table"><thead><tr><th>Title</th><th>Platforms</th><th>Scheduled</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{visibleRows.map(row => <tr key={row.id}><td><strong>{row.title || "Untitled post"}</strong></td><td>{Array.isArray(row.platforms) ? <span className="platform-inline-list">{row.platforms.map((platform:string)=><span key={platform}><PlatformLogo platform={platform}/>{platformMeta[platform as PlatformKey]?.label || title(platform)}</span>)}</span> : "—"}</td><td>{row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : "—"}</td><td><span className={`os-badge ${normal(row.approval_status || row.status) === "approved" ? "green" : normal(row.approval_status || row.status).includes("review") ? "amber" : "blue"}`}>{title(row.approval_status || row.status)}</span></td><td>{row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}</td><td><div className="os-table-actions"><button onClick={() => editRow(row)} aria-label="Edit" title="Edit"><Edit3/></button>{normal(row.approval_status || row.status) === "needs review" && <button onClick={() => void updateStatus(row, "Approved")} aria-label="Approve" title="Approve"><Check/></button>}{normal(row.approval_status || row.status) === "approved" && <button onClick={() => void schedulePost(row)} aria-label="Schedule approved post" title="Schedule" disabled={working === `schedule-${row.id}`}><CalendarDays/></button>}{["approved","scheduled","failed"].includes(normal(row.approval_status || row.status)) && Array.isArray(row.platforms) && row.platforms.some((platform:string) => ["facebook","instagram"].includes(platform)) && <button onClick={() => void publishNow(row)} aria-label="Publish to Meta now" title="Publish to Facebook / Instagram now" disabled={working === `publish-${row.id}`}><Send/></button>}<button onClick={() => void updateStatus(row, "Rejected")} aria-label="Reject" title="Reject"><XCircle/></button><button onClick={() => void remove(row)} aria-label="Delete" title="Delete"><X/></button></div></td></tr>)}</tbody></table></div>{!loading && !visibleRows.length && <Empty text={`No ${activeTab.toLowerCase()} posts are stored.`}/>}</section>}

    {previewOpen && <div className="os-modal-backdrop" onMouseDown={() => setPreviewOpen(false)}><section className="os-modal" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><h2>{meta.label} Preview</h2><button className="os-icon-button" onClick={() => setPreviewOpen(false)}><X/></button></div><div className="os-modal-body">{active.image && <img src={active.image} alt="Full preview" style={{ width: "100%", maxHeight: 520, objectFit: "contain", borderRadius: 14, background: "var(--os-surface-2)" }}/>}<h3>{active.title}</h3><p className="os-page-subtitle" style={{ whiteSpace: "pre-wrap" }}>{active.text || "No content generated yet."}</p><p style={{ color: "var(--os-pink)", whiteSpace: "pre-wrap" }}>{active.hashtags}</p></div></section></div>}
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>The live CMS record has been updated.</span></div></div></div>}
  </div></AdminShell>;
}

function Empty({ text }: { text: string }) { return <div className="os-empty"><div className="os-empty-icon"><Share2/></div><h3>No records</h3><p>{text}</p></div>; }
