"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-client";
import { supabase } from "@/lib/supabase-client";
import { calculateGeoScore, calculateSeoScore, normalizeKeywordList } from "@/lib/content-quality";
import { SOCIAL_PLATFORM_KEYS, SOCIAL_PLATFORM_META, clampPlatformText, type SocialPlatformKey } from "@/lib/social-platforms";
import {
  CalendarDays, CheckCircle2, CircleDollarSign, Clock3, FileText, Image as ImageIcon,
  Lightbulb, Plus, RefreshCw, Save, Search, Send, Sparkles, Trash2, UploadCloud,
} from "lucide-react";

type TopicRow = {
  id: string;
  topic: string;
  primary_keyword: string | null;
  secondary_keywords: string[] | null;
  target_market: string;
  buyer_type: string;
  notes: string | null;
  cta: string;
  status: string;
  draft_package: ContentPackage | null;
  campaign_id: string | null;
  blog_post_id: number | null;
  social_post_id: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
};

type BlogDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seo_title: string;
  seo_description: string;
  primary_keyword: string;
  secondary_keywords: string[];
  image_prompt: string;
  seo_score?: number;
  geo_score?: number;
};

type SocialDraft = { title: string; text: string; hashtags: string; image_prompt: string };
type ContentPackage = {
  blog: BlogDraft;
  social: Partial<Record<SocialPlatformKey, SocialDraft>>;
  model?: string;
  research_mode?: string;
  image_url?: string;
};

type SaveMode = "draft" | "review" | "scheduled";
type ActiveTab = "blog" | SocialPlatformKey;

const DEFAULT_SOCIAL_PLATFORMS: SocialPlatformKey[] = ["facebook", "linkedin", "instagram", "threads", "x", "youtube", "pinterest", "tiktok"];

const blankBlog: BlogDraft = {
  title: "", slug: "", excerpt: "", content: "", seo_title: "", seo_description: "",
  primary_keyword: "", secondary_keywords: [], image_prompt: "",
};

function toLocalDateTime(value?: string | null) {
  const date = value ? new Date(value) : new Date(Date.now() + 86400000);
  if (Number.isNaN(date.getTime())) return "";
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function statusLabel(value: unknown) {
  return String(value || "idea").replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
}

function tone(value: unknown) {
  const normal = String(value || "").toLowerCase();
  if (normal.includes("publish") || normal.includes("scheduled")) return "green";
  if (normal.includes("review")) return "amber";
  if (normal.includes("generated")) return "blue";
  return "pink";
}

export default function ContentStudioPage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [packageData, setPackageData] = useState<ContentPackage>({ blog: blankBlog, social: {} });
  const [bulkTopics, setBulkTopics] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [targetMarket, setTargetMarket] = useState("Global");
  const [buyerType, setBuyerType] = useState("Importers, distributors and private-label buyers");
  const [notes, setNotes] = useState("");
  const [cta, setCta] = useState("Request a quotation");
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatformKey[]>([...DEFAULT_SOCIAL_PLATFORMS]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("blog");
  const [scheduleAt, setScheduleAt] = useState(toLocalDateTime());
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");
  const fileInput = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => topics.find(row => row.id === selectedId) || null, [topics, selectedId]);
  const blog = packageData.blog || blankBlog;
  const imageUrl = String(packageData.image_url || "");

  const scores = useMemo(() => {
    const keywords = normalizeKeywordList(blog.primary_keyword || selected?.primary_keyword || "", blog.secondary_keywords, blog.title || selected?.topic || "");
    const primary = blog.primary_keyword || selected?.primary_keyword || keywords[0] || "";
    return {
      keywords,
      seo: calculateSeoScore({
        title: blog.title || "", slug: blog.slug || "", excerpt: blog.excerpt || "", content: blog.content || "",
        seoTitle: blog.seo_title || blog.title || "", seoDescription: blog.seo_description || blog.excerpt || "",
        primaryKeyword: primary, secondaryKeywords: keywords, featuredImage: imageUrl,
      }),
      geo: calculateGeoScore({
        title: blog.title || "", excerpt: blog.excerpt || "", content: blog.content || "", primaryKeyword: primary,
        targetCountry: selected?.target_market || targetMarket,
      }),
    };
  }, [blog, imageUrl, selected, targetMarket]);

  const filteredTopics = useMemo(() => filter === "all" ? topics : topics.filter(row => row.status === filter), [topics, filter]);
  const qualityReady = scores.seo >= 70 && scores.geo >= 70 && Boolean(blog.title && blog.content);

  const loadTopics = useCallback(async () => {
    setError("");
    const result = await supabase.from("content_topic_queue").select("*").order("created_at", { ascending: false }).limit(250);
    if (result.error) {
      setError(result.error.message.includes("content_topic_queue")
        ? "Content Topic Inbox needs the V7.5.8 Supabase migration. Run npx supabase db push once."
        : result.error.message);
      return;
    }
    const rows = (result.data || []) as TopicRow[];
    setTopics(rows);
    if (!selectedId && rows.length) setSelectedId(rows[0].id);
  }, [selectedId]);

  useEffect(() => { void loadTopics(); }, [loadTopics]);
  useEffect(() => {
    if (!selected) return;
    const draft = selected.draft_package && typeof selected.draft_package === "object" ? selected.draft_package : null;
    setPackageData(draft?.blog ? draft : { blog: blankBlog, social: {} });
    setPrimaryKeyword(selected.primary_keyword || "");
    setTargetMarket(selected.target_market || "Global");
    setBuyerType(selected.buyer_type || "Importers, distributors and private-label buyers");
    setNotes(selected.notes || "");
    setCta(selected.cta || "Request a quotation");
    setScheduleAt(toLocalDateTime(selected.scheduled_at));
  }, [selected]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 3000); return () => window.clearTimeout(timer); }, [toast]);

  async function addTopics() {
    const lines = bulkTopics.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (!lines.length) { setError("Enter at least one topic. You can paste 10 topics, one per line."); return; }
    setWorking("add"); setError("");
    const { data: auth } = await supabase.auth.getSession();
    const rows = lines.map((topic, index) => ({
      topic,
      primary_keyword: lines.length === 1 ? primaryKeyword.trim() || null : null,
      secondary_keywords: [],
      target_market: targetMarket.trim() || "Global",
      buyer_type: buyerType.trim() || "Importers, distributors and private-label buyers",
      notes: notes.trim() || null,
      cta: cta.trim() || "Request a quotation",
      status: "idea",
      created_by: auth.session?.user.id || null,
      updated_at: new Date().toISOString(),
      display_order: index,
    }));
    // display_order is intentionally removed for databases that do not have it.
    const payload = rows.map(({ display_order: _displayOrder, ...row }) => row);
    const result = await supabase.from("content_topic_queue").insert(payload).select("*");
    setWorking("");
    if (result.error) { setError(result.error.message); return; }
    setBulkTopics("");
    setToast(`${result.data?.length || lines.length} topic${lines.length === 1 ? "" : "s"} added to the inbox.`);
    await loadTopics();
    const first = result.data?.[0] as TopicRow | undefined;
    if (first) setSelectedId(first.id);
  }

  async function aiTopicSuggestions() {
    if (!window.confirm("This optional action uses OpenAI API credit for web research. Continue?")) return;
    setWorking("research"); setError("");
    try {
      const focus = primaryKeyword || bulkTopics.split(/\r?\n/)[0] || "Himalayan pink salt Pakistan Punjab Salt Range sourcing, packaging and B2B buyer questions";
      const response = await adminFetch("/api/blog/topics", { method: "POST", body: JSON.stringify({ focus }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Topic research failed.");
      const suggestions = Array.isArray(payload.topics) ? payload.topics.map(String).filter(Boolean) : [];
      setBulkTopics(current => [current.trim(), ...suggestions].filter(Boolean).join("\n"));
      setToast("AI topic suggestions added to the input box. Review them before saving.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Topic research failed."); }
    finally { setWorking(""); }
  }

  async function updateSelectedContext() {
    if (!selected) return;
    const patch = {
      primary_keyword: primaryKeyword.trim() || null,
      target_market: targetMarket.trim() || "Global",
      buyer_type: buyerType.trim() || "Importers, distributors and private-label buyers",
      notes: notes.trim() || null,
      cta: cta.trim() || "Request a quotation",
      updated_at: new Date().toISOString(),
    };
    const result = await supabase.from("content_topic_queue").update(patch).eq("id", selected.id);
    if (result.error) throw result.error;
    setTopics(current => current.map(row => row.id === selected.id ? { ...row, ...patch } as TopicRow : row));
  }

  async function generatePackage(researchWithAI: boolean) {
    if (!selected) { setError("Select a topic first."); return; }
    if (researchWithAI && !window.confirm("AI Web Research uses extra API credit. Continue?")) return;
    setWorking(researchWithAI ? "generate-research" : "generate"); setError("");
    try {
      await updateSelectedContext();
      const response = await adminFetch("/api/content/generate-package", {
        method: "POST",
        timeoutMs: 110_000,
        body: JSON.stringify({
          topic: selected.topic,
          primaryKeyword,
          targetMarket,
          buyerType,
          notes,
          cta,
          researchWithAI,
          platforms: selectedPlatforms,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Content generation failed.");
      const next: ContentPackage = {
        blog: payload.blog || blankBlog,
        social: payload.social || {},
        model: payload.model,
        research_mode: payload.research_mode,
        image_url: imageUrl,
      };
      setPackageData(next);
      const result = await supabase.from("content_topic_queue").update({ draft_package: next, status: "generated", updated_at: new Date().toISOString() }).eq("id", selected.id).select("*").single();
      if (result.error) throw result.error;
      setTopics(current => current.map(row => row.id === selected.id ? result.data as TopicRow : row));
      setToast(`One content package generated with ${payload.model || "the configured AI model"}. No daily automation was used.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Content generation failed."); }
    finally { setWorking(""); }
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !selected) return;
    setWorking("upload"); setError("");
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `content-studio/${selected.id}/${crypto.randomUUID()}-${safeName}`;
      const upload = await supabase.storage.from("cms-media").upload(path, file, { contentType: file.type, upsert: false });
      if (upload.error) throw upload.error;
      const url = supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl;
      const next = { ...packageData, image_url: url };
      setPackageData(next);
      const result = await supabase.from("content_topic_queue").update({ draft_package: next, updated_at: new Date().toISOString() }).eq("id", selected.id);
      if (result.error) throw result.error;
      setToast("Shared campaign image uploaded. Blog and social drafts can reuse it.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Image upload failed."); }
    finally { setWorking(""); event.target.value = ""; }
  }

  function patchBlog(patch: Partial<BlogDraft>) {
    setPackageData(current => ({ ...current, blog: { ...(current.blog || blankBlog), ...patch } }));
  }

  function patchSocial(platform: SocialPlatformKey, patch: Partial<SocialDraft>) {
    setPackageData(current => ({
      ...current,
      social: {
        ...(current.social || {}),
        [platform]: { title: "", text: "", hashtags: "", image_prompt: current.blog?.image_prompt || "", ...(current.social?.[platform] || {}), ...patch },
      },
    }));
  }

  function togglePlatform(platform: SocialPlatformKey) {
    setSelectedPlatforms(current => current.includes(platform) ? current.filter(item => item !== platform) : [...current, platform]);
  }

  async function persistPackage(mode: SaveMode) {
    if (!selected || !blog.title.trim() || !blog.content.trim()) { setError("Generate or complete the blog first."); return; }
    if (mode === "scheduled" && !scheduleAt) { setError("Choose a schedule date and time."); return; }
    if (mode === "scheduled" && !qualityReady) { setError(`Quality gate not passed. SEO ${scores.seo}% / GEO ${scores.geo}%. Both must reach at least 70 before scheduling.`); return; }
    setWorking(`save-${mode}`); setError("");
    try {
      await updateSelectedContext();
      const scheduleIso = mode === "scheduled" ? new Date(scheduleAt).toISOString() : null;
      const campaignStatus = mode === "scheduled" ? "scheduled" : mode === "review" ? "review" : "draft";
      const campaignPayload = {
        name: selected.topic,
        campaign_type: "Seasonal Content Campaign",
        subject: blog.primary_keyword || primaryKeyword || selected.topic,
        content: blog.excerpt || "",
        audience_filter: { target_market: targetMarket, buyer_type: buyerType, source: "AI Content Studio" },
        status: campaignStatus,
        scheduled_at: scheduleIso,
        updated_at: new Date().toISOString(),
      };
      let campaignId = selected.campaign_id;
      if (campaignId) {
        const campaignUpdate = await supabase.from("marketing_campaigns").update(campaignPayload).eq("id", campaignId);
        if (campaignUpdate.error) throw campaignUpdate.error;
      } else {
        const campaignInsert = await supabase.from("marketing_campaigns").insert(campaignPayload).select("id").single();
        if (campaignInsert.error) throw campaignInsert.error;
        campaignId = String(campaignInsert.data.id);
      }

      const keywords = normalizeKeywordList(blog.primary_keyword || primaryKeyword, blog.secondary_keywords, blog.title);
      const blogStatus = mode === "scheduled" ? "scheduled" : mode === "review" ? "review" : "draft";
      const approval = mode === "scheduled" ? "Scheduled" : mode === "review" ? "Needs Review" : "Draft";
      const blogPayload = {
        campaign_id: campaignId,
        source_topic_id: selected.id,
        title: blog.title.trim(), slug: blog.slug.trim(), excerpt: blog.excerpt, content: blog.content,
        featured_image: imageUrl || null,
        status: blogStatus, approval_status: approval, content_type: "blog",
        seo_title: blog.seo_title || blog.title, seo_description: blog.seo_description || blog.excerpt,
        keywords, primary_keyword: blog.primary_keyword || primaryKeyword || keywords[0] || null,
        target_country: targetMarket, image_prompt: blog.image_prompt, seo_score: scores.seo, geo_score: scores.geo,
        scheduled_at: scheduleIso, published_at: null, updated_at: new Date().toISOString(),
      };
      let blogPostId = selected.blog_post_id;
      if (blogPostId) {
        const blogUpdate = await supabase.from("blog_posts").update(blogPayload).eq("id", blogPostId);
        if (blogUpdate.error) throw blogUpdate.error;
      } else {
        const blogInsert = await supabase.from("blog_posts").insert(blogPayload).select("id").single();
        if (blogInsert.error) throw blogInsert.error;
        blogPostId = Number(blogInsert.data.id);
      }

      const chosen = selectedPlatforms.filter(platform => packageData.social?.[platform]);
      let socialPostId = selected.social_post_id;
      if (chosen.length) {
        const primaryPlatform = chosen[0];
        const primarySocial = packageData.social?.[primaryPlatform] || { title: "", text: "", hashtags: "", image_prompt: "" };
        const platformContent = Object.fromEntries(chosen.map(platform => {
          const draft = packageData.social?.[platform] || { title: "", text: "", hashtags: "", image_prompt: blog.image_prompt };
          return [platform, { ...draft, text: clampPlatformText(platform, draft.text), status: approval }];
        }));
        const socialPayload = {
          campaign_id: campaignId,
          source_topic_id: selected.id,
          title: selected.topic,
          caption: primarySocial.text,
          hashtags: primarySocial.hashtags,
          keywords: keywords.join(", "),
          image_url: imageUrl,
          platforms: chosen,
          scheduled_at: scheduleIso,
          status: blogStatus,
          approval_status: approval,
          platform_content: platformContent,
          platform_images: Object.fromEntries(chosen.map(platform => [platform, imageUrl]).filter(([, url]) => Boolean(url))),
          platform_results: {},
          brief: { topic: selected.topic, targetCountry: targetMarket, targetAudience: buyerType, cta, source: "AI Content Studio", campaignId },
          last_error: null,
          updated_at: new Date().toISOString(),
        };
        if (socialPostId) {
          const socialUpdate = await supabase.from("social_scheduled_posts").update(socialPayload).eq("id", socialPostId);
          if (socialUpdate.error) throw socialUpdate.error;
        } else {
          const socialInsert = await supabase.from("social_scheduled_posts").insert(socialPayload).select("id").single();
          if (socialInsert.error) throw socialInsert.error;
          socialPostId = String(socialInsert.data.id);
        }
      }

      const nextPackage = { ...packageData, blog: { ...blog, seo_score: scores.seo, geo_score: scores.geo } };
      const topicUpdate = await supabase.from("content_topic_queue").update({
        status: mode === "scheduled" ? "scheduled" : mode === "review" ? "review" : "generated",
        draft_package: nextPackage,
        campaign_id: campaignId,
        blog_post_id: blogPostId,
        social_post_id: socialPostId,
        scheduled_at: scheduleIso,
        updated_at: new Date().toISOString(),
      }).eq("id", selected.id).select("*").single();
      if (topicUpdate.error) throw topicUpdate.error;
      setTopics(current => current.map(row => row.id === selected.id ? topicUpdate.data as TopicRow : row));
      setToast(mode === "scheduled" ? "Approved package scheduled. Blog Center and Social Media Studio now share the same campaign." : mode === "review" ? "Package sent to review queues." : "Package saved as draft without another AI call.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save the content package."); }
    finally { setWorking(""); }
  }

  async function deleteTopic(row: TopicRow) {
    if (!window.confirm(`Delete topic "${row.topic}" from the inbox? Linked blog/social records will not be deleted.`)) return;
    const result = await supabase.from("content_topic_queue").delete().eq("id", row.id);
    if (result.error) { setError(result.error.message); return; }
    setTopics(current => current.filter(item => item.id !== row.id));
    if (selectedId === row.id) setSelectedId(null);
  }

  const activeSocial = activeTab === "blog" ? null : packageData.social?.[activeTab] || { title: "", text: "", hashtags: "", image_prompt: blog.image_prompt || "" };
  const activeMeta = activeTab === "blog" ? null : SOCIAL_PLATFORM_META[activeTab];

  return <AdminShell><div className="os-page content-ops-studio">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Cost-Controlled Content Operations</div><h1 className="os-page-title">AI Content Studio</h1><p className="os-page-subtitle">Add your own topics in bulk, generate only when you choose, review SEO/GEO quality, then schedule one linked blog + social campaign.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={() => void loadTopics()}><RefreshCw/>Refresh</button><a className="os-btn soft" href="/admin/blog-center"><FileText/>Blog Center</a><a className="os-btn soft" href="/admin/social-studio"><Send/>Social Studio</a></div></header>

    <section className="os-card" style={{ marginBottom: 16 }}><div className="os-card-body"><div className="os-list-row"><span className="os-list-icon"><CircleDollarSign/></span><div className="os-list-main"><strong>Cost Control is ON</strong><span>No AI call runs on page load and no daily AI content cron is required. API credit is used only when you press Generate or optional AI Research.</span></div><span className="os-badge green">MANUAL AI</span></div></div></section>

    {error && <section className="os-card content-alert" style={{ marginBottom: 16 }}><strong>Action could not be completed</strong><p>{error}</p></section>}

    <div className="content-ops-layout">
      <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <section className="os-card"><div className="os-card-header"><div><h2>Topic Inbox</h2><p>Paste one topic per line. Add 10 today and schedule them across the next 10 days.</p></div><Lightbulb/></div><div className="os-card-body">
          <label className="os-label"><span>Topics — one per line</span><textarea rows={7} value={bulkTopics} onChange={event => setBulkTopics(event.target.value)} placeholder={"How to verify Himalayan pink salt origin\nPrivate-label pouch packaging for importers\nCoarse vs extra fine pink salt for foodservice"}/></label>
          <div className="os-grid two" style={{ marginTop: 12 }}><label className="os-label"><span>Primary Keyword (single topic)</span><input value={primaryKeyword} onChange={event => setPrimaryKeyword(event.target.value)} placeholder="Himalayan pink salt supplier"/></label><label className="os-label"><span>Target Market</span><input value={targetMarket} onChange={event => setTargetMarket(event.target.value)}/></label></div>
          <label className="os-label" style={{ marginTop: 12 }}><span>Buyer Type</span><input value={buyerType} onChange={event => setBuyerType(event.target.value)}/></label>
          <label className="os-label" style={{ marginTop: 12 }}><span>Your Input / Verified Facts</span><textarea rows={4} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Add product facts, Pakistan/Punjab/Salt Range context, packaging facts, wording to preserve, or anything AI must not invent."/></label>
          <label className="os-label" style={{ marginTop: 12 }}><span>CTA</span><input value={cta} onChange={event => setCta(event.target.value)}/></label>
          <div className="os-row-actions" style={{ marginTop: 14 }}><button className="os-btn primary" onClick={() => void addTopics()} disabled={Boolean(working)}><Plus/>{working === "add" ? "Adding…" : "Add to Topic Inbox"}</button><button className="os-btn soft" onClick={() => void aiTopicSuggestions()} disabled={Boolean(working)}><Search/>{working === "research" ? "Researching…" : "AI Topic Research (Optional)"}</button></div>
        </div></section>

        <section className="os-card"><div className="os-card-header"><div><h2>Saved Topics</h2><p>{topics.length} total topic records</p></div></div><div className="os-card-body">
          <div className="os-tabs" style={{ marginBottom: 10 }}>{["all", "idea", "generated", "review", "scheduled"].map(value => <button key={value} className={`os-tab ${filter === value ? "active" : ""}`} onClick={() => setFilter(value)}>{statusLabel(value)}</button>)}</div>
          <div className="os-list" style={{ maxHeight: 520, overflowY: "auto" }}>{filteredTopics.map(row => <button key={row.id} className="os-list-row" style={{ textAlign: "left", border: selectedId === row.id ? "1px solid var(--os-pink)" : undefined }} onClick={() => setSelectedId(row.id)}><span className="os-list-icon"><FileText/></span><div className="os-list-main"><strong>{row.topic}</strong><span>{row.target_market} · {row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : "Not scheduled"}</span></div><span className={`os-badge ${tone(row.status)}`}>{statusLabel(row.status)}</span><span onClick={event => { event.stopPropagation(); void deleteTopic(row); }} title="Delete topic"><Trash2 size={15}/></span></button>)}</div>
          {!filteredTopics.length && <div className="os-empty"><Lightbulb/><h3>No topics in this view</h3><p>Add your first topic above.</p></div>}
        </div></section>
      </aside>

      <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!selected ? <section className="os-card"><div className="os-empty" style={{ minHeight: 520 }}><Lightbulb/><h3>Select a topic</h3><p>Choose a topic from the inbox to generate, edit, review and schedule it.</p></div></section> : <>
          <section className="os-card"><div className="os-card-header"><div><span className="os-page-eyebrow">Selected Topic</span><h2>{selected.topic}</h2><p>Generation is on-demand. Manual mode does not use web research; optional research mode does.</p></div><span className={`os-badge ${tone(selected.status)}`}>{statusLabel(selected.status)}</span></div><div className="os-card-body">
            <div className="os-grid three"><label className="os-label"><span>Primary Keyword</span><input value={primaryKeyword} onChange={event => setPrimaryKeyword(event.target.value)}/></label><label className="os-label"><span>Target Market</span><input value={targetMarket} onChange={event => setTargetMarket(event.target.value)}/></label><label className="os-label"><span>Lead CTA</span><input value={cta} onChange={event => setCta(event.target.value)}/></label></div>
            <label className="os-label" style={{ marginTop: 12 }}><span>Your Input / Facts to Preserve</span><textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)}/></label>
            <div className="os-row-actions" style={{ marginTop: 14 }}><button className="os-btn primary" onClick={() => void generatePackage(false)} disabled={Boolean(working)}><Sparkles/>{working === "generate" ? "Generating One Package…" : "Generate from My Topic"}</button><button className="os-btn soft" onClick={() => void generatePackage(true)} disabled={Boolean(working)}><Search/>{working === "generate-research" ? "Researching + Generating…" : "Research + Generate (Optional Cost)"}</button></div>
          </div></section>

          <section className="os-card"><div className="os-card-header"><div><h2>SEO / GEO Quality Gate</h2><p>Scheduling is blocked until both internal quality scores reach 70.</p></div><span className={`os-badge ${qualityReady ? "green" : "amber"}`}>{qualityReady ? "READY TO SCHEDULE" : "NEEDS WORK"}</span></div><div className="os-card-body"><div className="os-grid four"><article className="os-metric"><span className="os-metric-label">SEO Score</span><div className="os-metric-value">{scores.seo}%</div></article><article className="os-metric"><span className="os-metric-label">GEO Score</span><div className="os-metric-value">{scores.geo}%</div></article><article className="os-metric"><span className="os-metric-label">Keywords</span><div className="os-metric-value">{scores.keywords.length}</div></article><article className="os-metric"><span className="os-metric-label">AI Calls on Load</span><div className="os-metric-value">0</div></article></div><div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>{scores.keywords.map(keyword => <span className="os-badge" key={keyword}>{keyword}</span>)}</div></div></section>

          <section className="os-card"><div className="os-card-header"><div><h2>Shared Campaign Creative</h2><p>Upload one approved image and reuse it across the blog and selected social channels.</p></div><ImageIcon/></div><div className="os-card-body">{imageUrl ? <img src={imageUrl} alt="Campaign" style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 16, background: "var(--os-surface-2)" }}/> : <div className="os-empty" style={{ minHeight: 180 }}><ImageIcon/><h3>No image uploaded</h3><p>Upload your manually prepared image when the copy is ready.</p></div>}<button className="os-btn soft" style={{ marginTop: 12 }} onClick={() => fileInput.current?.click()} disabled={working === "upload"}><UploadCloud/>{working === "upload" ? "Uploading…" : "Upload / Replace Image"}</button><input ref={fileInput} hidden type="file" accept="image/*" onChange={uploadImage}/></div></section>

          <section className="os-card"><div className="os-card-header"><div><h2>Blog + Social Package</h2><p>The same campaign appears in Blog Center and Social Media Studio after you save or schedule it. You can also paste and edit your own blog here without making another AI call.</p></div><span className="os-badge blue">{packageData.model || "NO AI PACKAGE YET"}</span></div><div className="os-card-body">
            <div className="os-tabs" style={{ overflowX: "auto" }}><button className={`os-tab ${activeTab === "blog" ? "active" : ""}`} onClick={() => setActiveTab("blog")}>Blog</button>{SOCIAL_PLATFORM_KEYS.map(platform => <button key={platform} className={`os-tab ${activeTab === platform ? "active" : ""}`} onClick={() => setActiveTab(platform)}>{SOCIAL_PLATFORM_META[platform].label}</button>)}</div>
            {activeTab === "blog" ? <div style={{ marginTop: 14 }}><div className="os-grid two"><label className="os-label"><span>Blog Title</span><input value={blog.title} onChange={event => patchBlog({ title: event.target.value })}/></label><label className="os-label"><span>Slug</span><input value={blog.slug} onChange={event => patchBlog({ slug: event.target.value })}/></label></div><label className="os-label" style={{ marginTop: 12 }}><span>Excerpt</span><textarea rows={3} value={blog.excerpt} onChange={event => patchBlog({ excerpt: event.target.value })}/></label><label className="os-label" style={{ marginTop: 12 }}><span>Blog Content — clean HTML, no # headings or raw links</span><textarea rows={18} value={blog.content} onChange={event => patchBlog({ content: event.target.value })}/></label><div className="os-grid two" style={{ marginTop: 12 }}><label className="os-label"><span>SEO Title</span><input value={blog.seo_title} onChange={event => patchBlog({ seo_title: event.target.value })}/></label><label className="os-label"><span>SEO Description</span><textarea rows={3} value={blog.seo_description} onChange={event => patchBlog({ seo_description: event.target.value })}/></label></div></div> : activeSocial && activeMeta ? <div style={{ marginTop: 14 }}><div className="os-list-row"><span className="os-list-icon"><Send/></span><div className="os-list-main"><strong>{activeMeta.label}</strong><span>Target ~{activeMeta.recommendedChars} · hard max {activeMeta.maxChars} characters</span></div><span className={`os-badge ${activeSocial.text.length <= activeMeta.maxChars ? "green" : "red"}`}>{activeSocial.text.length}/{activeMeta.maxChars}</span></div><label className="os-label" style={{ marginTop: 12 }}><span>{activeMeta.titleLabel || "Title / Hook"}</span><input value={activeSocial.title} onChange={event => patchSocial(activeTab, { title: event.target.value })}/></label><label className="os-label" style={{ marginTop: 12 }}><span>{activeMeta.copyLabel}</span><textarea rows={10} value={activeSocial.text} onChange={event => patchSocial(activeTab, { text: event.target.value })}/></label><label className="os-label" style={{ marginTop: 12 }}><span>Hashtags / Search Terms</span><textarea rows={3} value={activeSocial.hashtags} onChange={event => patchSocial(activeTab, { hashtags: event.target.value })}/></label></div> : <div className="os-empty"><Sparkles/><h3>Generate the package first</h3><p>Your blog and platform versions will appear here.</p></div>}
          </div></section>

          <section className="os-card"><div className="os-card-header"><div><h2>Approval & Content Calendar</h2><p>Choose the channels, set one schedule time, then save the linked campaign.</p></div><CalendarDays/></div><div className="os-card-body"><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>{SOCIAL_PLATFORM_KEYS.map(platform => <label key={platform} className="content-destination"><input type="checkbox" checked={selectedPlatforms.includes(platform)} onChange={() => togglePlatform(platform)}/><span>{SOCIAL_PLATFORM_META[platform].label}</span></label>)}</div><div className="os-grid two"><label className="os-label"><span>Schedule Date & Time</span><input type="datetime-local" value={scheduleAt} onChange={event => setScheduleAt(event.target.value)}/></label><div className="os-list-row"><span className="os-list-icon"><Clock3/></span><div className="os-list-main"><strong>Daily Publishing Queue</strong><span>Website blogs publish automatically when due. Social records move to the platform publishing queue when due.</span></div></div></div><div className="os-row-actions" style={{ marginTop: 14 }}><button className="os-btn soft" onClick={() => void persistPackage("draft")} disabled={Boolean(working)}><Save/>Save Draft</button><button className="os-btn soft" onClick={() => void persistPackage("review")} disabled={Boolean(working)}><CheckCircle2/>Send for Review</button><button className="os-btn primary" onClick={() => void persistPackage("scheduled")} disabled={Boolean(working) || !qualityReady}><CalendarDays/>{qualityReady ? "Approve & Schedule" : "SEO/GEO 70 Required"}</button></div></div></section>
        </>}
      </main>
    </div>

    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>Supabase content records are synchronized.</span></div></div></div>}
    <style jsx>{`
      .content-ops-layout { display:grid; grid-template-columns:minmax(300px,.75fr) minmax(0,1.75fr); gap:16px; align-items:start; }
      .content-destination { display:inline-flex; align-items:center; gap:7px; padding:8px 11px; border:1px solid var(--os-border); border-radius:999px; background:var(--os-surface); cursor:pointer; font-size:12px; }
      .content-destination input { accent-color:var(--os-pink); }
      @media (max-width:1050px) { .content-ops-layout { grid-template-columns:1fr; } }
      @media (max-width:640px) { .content-ops-layout { gap:12px; } .content-destination { flex:1 1 calc(50% - 8px); justify-content:center; } }
    `}</style>
  </div></AdminShell>;
}
