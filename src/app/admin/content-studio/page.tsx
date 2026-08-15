"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-client";
import { supabase } from "@/lib/supabase-client";
import { calculateGeoScore, calculateSeoScore, normalizeKeywordList } from "@/lib/content-quality";
import { SOCIAL_PLATFORM_KEYS, SOCIAL_PLATFORM_META, type SocialPlatformKey, clampPlatformText } from "@/lib/social-platforms";
import {
  CheckCircle2, Clock3, Eye, FileText, Image as ImageIcon, RefreshCw, Save, Send,
  Sparkles, Square, RectangleVertical, RectangleHorizontal, UploadCloud, XCircle,
} from "lucide-react";

type SocialDraft = { title: string; text: string; hashtags: string; image_prompt: string; status?: string };
type BlogDraft = {
  title: string; slug: string; excerpt: string; content: string; seoTitle: string; seoDescription: string;
  primaryKeyword: string; secondaryKeywords: string[]; imagePrompt: string; status: string;
};
type ImageShape = "square" | "portrait" | "landscape";
type ContentTab = "blog" | SocialPlatformKey;
type TodayContentState = { hasBlog: boolean; hasSocial: boolean };

const blankBlog: BlogDraft = { title: "", slug: "", excerpt: "", content: "", seoTitle: "", seoDescription: "", primaryKeyword: "", secondaryKeywords: [], imagePrompt: "", status: "Draft" };
const blankSocial = () => Object.fromEntries(SOCIAL_PLATFORM_KEYS.map((platform) => [platform, { title: "", text: "", hashtags: "", image_prompt: "", status: "Draft" }])) as Record<SocialPlatformKey, SocialDraft>;

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function todayRange() { const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1); return [start.toISOString(), end.toISOString()] as const; }
async function withClientTimeout<T>(promise: PromiseLike<T>, timeoutMs = 8_000, label = "CMS request") {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timed out.`)), timeoutMs); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function cleanPlatformDraft(platform: SocialPlatformKey, item: any, fallbackPrompt: string): SocialDraft {
  return {
    title: String(item?.title || ""),
    text: clampPlatformText(platform, String(item?.text || item?.caption || "")),
    hashtags: String(item?.hashtags || ""),
    image_prompt: String(item?.image_prompt || item?.imagePrompt || fallbackPrompt || ""),
    status: String(item?.status || "Draft"),
  };
}

export default function ContentStudioPage() {
  const [topic, setTopic] = useState("");
  const [country, setCountry] = useState("Global");
  const [audience, setAudience] = useState("Importers, distributors and private-label buyers");
  const [keyword, setKeyword] = useState("");
  const [cta, setCta] = useState("Request a quotation");
  const [blog, setBlog] = useState<BlogDraft>(blankBlog);
  const [social, setSocial] = useState<Record<SocialPlatformKey, SocialDraft>>(blankSocial());
  const [activePlatform, setActivePlatform] = useState<ContentTab>("blog");
  const [sharedImage, setSharedImage] = useState("");
  const [blogId, setBlogId] = useState<string | number | null>(null);
  const [socialId, setSocialId] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatformKey[]>([...SOCIAL_PLATFORM_KEYS]);
  const [publishWebsite, setPublishWebsite] = useState(true);
  const [imageShape, setImageShape] = useState<ImageShape>("square");
  const [working, setWorking] = useState("");
  const [booting, setBooting] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const dailyBootRef = useRef(false);

  const scores = useMemo(() => {
    const keywords = normalizeKeywordList(blog.primaryKeyword || keyword, blog.secondaryKeywords, blog.title || topic);
    const primaryKeyword = blog.primaryKeyword || keyword || keywords[0] || "";
    return {
      seo: calculateSeoScore({ title: blog.title, slug: blog.slug, excerpt: blog.excerpt, content: blog.content, seoTitle: blog.seoTitle, seoDescription: blog.seoDescription, primaryKeyword, secondaryKeywords: keywords, featuredImage: sharedImage }),
      geo: calculateGeoScore({ title: blog.title, excerpt: blog.excerpt, content: blog.content, primaryKeyword, targetCountry: country }),
      keywords,
    };
  }, [blog, keyword, country, sharedImage, topic]);

  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };

  const loadToday = useCallback(async (): Promise<TodayContentState> => {
    setError("");
    const [start, end] = todayRange();
    const [blogResult, socialResult] = await Promise.all([
      withClientTimeout(
        supabase.from("blog_posts").select("*").gte("created_at", start).lt("created_at", end).eq("content_type", "blog").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        8_000,
        "Today’s blog queue",
      ),
      withClientTimeout(
        supabase.from("social_scheduled_posts").select("*").gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        8_000,
        "Today’s social queue",
      ),
    ]);

    if (blogResult.error) setError(blogResult.error.message);
    if (socialResult.error) setError((current) => current || socialResult.error!.message);

    const b: any = blogResult.data;
    if (b) {
      const secondary = Array.isArray(b.keywords) ? b.keywords.map(String).filter((value: string) => value !== String(b.primary_keyword || "")) : [];
      setBlog({
        title: String(b.title || ""), slug: String(b.slug || ""), excerpt: String(b.excerpt || ""), content: String(b.content || ""),
        seoTitle: String(b.seo_title || b.title || ""), seoDescription: String(b.seo_description || b.excerpt || ""),
        primaryKeyword: String(b.primary_keyword || ""), secondaryKeywords: secondary, imagePrompt: String(b.image_prompt || ""),
        status: String(b.approval_status || b.status || "Draft"),
      });
      setBlogId(b.id);
      setTopic(String(b.title || ""));
      setKeyword(String(b.primary_keyword || ""));
      setCountry(String(b.target_country || "Global"));
      if (b.featured_image) setSharedImage(String(b.featured_image));
    }

    const socialRow: any = socialResult.data;
    if (socialRow) {
      setSocialId(String(socialRow.id));
      const platformContent = socialRow.platform_content && typeof socialRow.platform_content === "object" ? socialRow.platform_content : {};
      const next = blankSocial();
      SOCIAL_PLATFORM_KEYS.forEach((platform) => {
        next[platform] = cleanPlatformDraft(platform, platformContent[platform], b?.image_prompt || "");
      });
      setSocial(next);
      const selected = Array.isArray(socialRow.platforms)
        ? socialRow.platforms.filter((platform: string) => SOCIAL_PLATFORM_KEYS.includes(platform as SocialPlatformKey)) as SocialPlatformKey[]
        : [];
      if (selected.length) setSelectedPlatforms(selected);
      if (!b && socialRow.title) setTopic(String(socialRow.title));
      if (socialRow.image_url) setSharedImage(String(socialRow.image_url));
    }

    return { hasBlog: Boolean(b), hasSocial: Boolean(socialRow) };
  }, []);

  async function runDailyAutomation(showSuccess = true) {
    if (working) return;
    setWorking("daily");
    setError("");
    try {
      let current = await loadToday();

      if (!current.hasBlog) {
        const response = await adminFetch("/api/blog/daily-draft", { method: "POST", timeoutMs: 75_000 });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok && !payload?.skipped) throw new Error(payload.error || "Daily blog research failed.");
        current = await loadToday();
      }

      if (!current.hasSocial) {
        const response = await adminFetch("/api/social/daily-draft", { method: "POST", timeoutMs: 75_000 });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok && !payload?.skipped) throw new Error(payload.error || "Daily social campaign generation failed.");
        current = await loadToday();
      }

      if (showSuccess) {
        flash(current.hasBlog && current.hasSocial
          ? "Today’s researched blog and platform drafts are ready for review."
          : "Today’s content queue was refreshed.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Daily content automation failed.");
    } finally {
      setWorking("");
    }
  }

  useEffect(() => {
    if (dailyBootRef.current) return;
    dailyBootRef.current = true;
    let cancelled = false;
    const bootGuard = window.setTimeout(() => {
      if (!cancelled) {
        setBooting(false);
        setError((current) => current || "The daily queue is taking longer than expected. The studio is available; use Generate Today's Draft to retry.");
      }
    }, 9_000);

    void (async () => {
      try {
        const current = await loadToday();
        if (cancelled) return;
        setBooting(false);
        if (!current.hasBlog) void runDailyAutomation(false);
      } catch (reason) {
        if (cancelled) return;
        setBooting(false);
        setError(reason instanceof Error ? reason.message : "Unable to load today’s content workspace.");
      } finally {
        window.clearTimeout(bootGuard);
      }
    })();

    return () => { cancelled = true; window.clearTimeout(bootGuard); };
  }, [loadToday]);

  async function uploadGeneratedImage(source: string) {
    if (!source) return "";
    if (!source.startsWith("data:")) return source;
    const blob = await fetch(source).then((response) => response.blob());
    const path = `content-studio/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.png`;
    const result = await supabase.storage.from("cms-media").upload(path, blob, { contentType: blob.type || "image/png", upsert: false });
    if (result.error) throw new Error(result.error.message);
    return supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl;
  }

  async function generatePackage() {
    if (!topic.trim()) { await runDailyAutomation(true); return; }
    setError("");
    setBlogId(null);
    setSocialId(null);

    let nextBlog: BlogDraft | null = null;
    try {
      setWorking("research");
      const blogResponse = await adminFetch("/api/admin/ai-content", {
        method: "POST",
        timeoutMs: 70_000,
        body: JSON.stringify({
          tool: "Blog Generator",
          topic,
          country,
          audience,
          buyerType: "International B2B buyer",
          searchIntent: "Commercial research",
          keyword,
          tone: "Premium, factual and professional",
          language: "English",
          length: "Concise blog",
          cta,
          brandVoice: "Premium, factual, clear and export-focused",
          research: true,
        }),
      });
      const blogPayload = await blogResponse.json().catch(() => ({}));
      if (!blogResponse.ok) throw new Error(blogPayload.error || "Blog research and generation failed.");

      const secondaryKeywords = Array.isArray(blogPayload.secondary_keywords)
        ? blogPayload.secondary_keywords.map(String)
        : [];
      nextBlog = {
        title: String(blogPayload.title || topic),
        slug: String(blogPayload.slug || slugify(blogPayload.title || topic)),
        excerpt: String(blogPayload.excerpt || ""),
        content: String(blogPayload.content || ""),
        seoTitle: String(blogPayload.meta_title || blogPayload.seo_title || blogPayload.title || topic),
        seoDescription: String(blogPayload.meta_description || blogPayload.seo_description || blogPayload.excerpt || ""),
        primaryKeyword: String(blogPayload.primary_keyword || keyword || ""),
        secondaryKeywords,
        imagePrompt: String(blogPayload.image_prompt || `${topic}, premium Himalayan pink salt B2B editorial photography`),
        status: "Draft",
      };
      setBlog(nextBlog);
      setTopic(nextBlog.title || topic);
      if (nextBlog.primaryKeyword) setKeyword(nextBlog.primaryKeyword);
      setReviewOpen(true);
      flash("Researched blog is ready. Preparing platform versions…");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Blog research failed.");
      setWorking("");
      return;
    }

    if (!nextBlog) { setWorking(""); return; }
    const researchedBlog = nextBlog;

    try {
      setWorking("social");
      const socialResponse = await adminFetch("/api/admin/social-content", {
        method: "POST",
        timeoutMs: 65_000,
        body: JSON.stringify({
          topic: researchedBlog.title || topic,
          targetCountry: country,
          targetAudience: audience,
          objective: "Adapt the researched website blog into platform-native buyer education",
          product: "Himalayan pink salt",
          tone: "Premium professional B2B",
          cta,
          platforms: SOCIAL_PLATFORM_KEYS,
          primaryKeyword: researchedBlog.primaryKeyword,
          sourceExcerpt: researchedBlog.excerpt,
        }),
      });
      const socialPayload = await socialResponse.json().catch(() => ({}));
      if (!socialResponse.ok) throw new Error(socialPayload.error || "Platform-specific social generation failed.");

      const nextSocial = blankSocial();
      SOCIAL_PLATFORM_KEYS.forEach((platform) => {
        nextSocial[platform] = cleanPlatformDraft(platform, socialPayload.platforms?.[platform] || {}, researchedBlog.imagePrompt);
      });
      setSocial(nextSocial);
      flash("Blog and platform-specific campaign are ready for review.");
    } catch (reason) {
      setError(`Blog is ready. Social versions need a retry: ${reason instanceof Error ? reason.message : "generation failed."}`);
    } finally {
      setWorking("");
    }
  }

  async function generateSharedImage() {
    const prompt = blog.imagePrompt || (activePlatform === "blog" ? "" : social[activePlatform].image_prompt) || topic;
    if (!prompt.trim()) { setError("Generate the content package or enter a topic first."); return; }
    setWorking("image"); setError("");
    const size = imageShape === "portrait" ? "1024x1536" : imageShape === "landscape" ? "1536x1024" : "1024x1024";
    try {
      const response = await adminFetch("/api/ai/image", { method: "POST", body: JSON.stringify({ prompt: `${prompt}. Premium commercial editorial image for The Salt Origin, Himalayan pink salt, refined pink and charcoal brand mood, no medical claims, no third-party logos, no readable text.`, size }) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "AI image generation failed.");
      const url = await uploadGeneratedImage(String(payload.image || "")); setSharedImage(url); flash("Campaign image generated and saved.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Image generation failed."); }
    finally { setWorking(""); }
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setWorking("upload"); setError("");
    const path = `content-studio/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const result = await supabase.storage.from("cms-media").upload(path, file, { contentType: file.type, upsert: false });
    if (result.error) setError(result.error.message); else { setSharedImage(supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl); flash("Image uploaded and attached."); }
    setWorking(""); event.target.value = "";
  }

  async function saveBlog(status: "draft" | "review" | "published" | "archived") {
    if (!blog.title.trim()) { setError("Generate or enter the blog before saving."); return; }
    setWorking(`blog-${status}`); setError("");
    const keywords = normalizeKeywordList(blog.primaryKeyword || keyword, blog.secondaryKeywords, blog.title);
    const payload = { title: blog.title.trim(), slug: blog.slug.trim() || slugify(blog.title), excerpt: blog.excerpt, content: blog.content, featured_image: sharedImage || null,
      status, approval_status: status === "published" ? "Published" : status === "review" ? "Needs Review" : status === "archived" ? "Rejected" : "Draft",
      seo_title: blog.seoTitle, seo_description: blog.seoDescription, content_type: "blog", keywords, primary_keyword: blog.primaryKeyword || keyword || keywords[0] || null,
      target_country: country, image_prompt: blog.imagePrompt, seo_score: scores.seo, geo_score: scores.geo, published_at: status === "published" ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
    const result = blogId ? await supabase.from("blog_posts").update(payload).eq("id", blogId).select().single() : await supabase.from("blog_posts").insert(payload).select().single();
    setWorking(""); if (result.error) { setError(result.error.message); return; }
    setBlogId(result.data.id); setBlog((current) => ({ ...current, status: payload.approval_status })); window.dispatchEvent(new Event("salt-cms-updated"));
    flash(status === "published" ? "Blog approved and published to the website." : status === "review" ? "Blog sent to review." : status === "archived" ? "Blog rejected." : "Blog saved as draft.");
  }

  async function saveSocial(status: "Draft" | "Needs Review" | "Approved" | "Rejected") {
    if (!topic.trim()) { setError("Topic is required."); return; }
    if (!selectedPlatforms.length) { setError("Select at least one social platform."); return; }
    setWorking(`social-${status}`); setError("");
    const primaryPlatform = selectedPlatforms[0]; const primary = social[primaryPlatform];
    const payload = { title: topic.trim(), caption: primary.text, hashtags: primary.hashtags, keywords: blog.primaryKeyword || keyword || "", image_url: sharedImage,
      platforms: selectedPlatforms, scheduled_at: new Date().toISOString(), status: status === "Approved" ? "scheduled" : status.toLowerCase().replaceAll(" ", "_"), approval_status: status,
      platform_content: Object.fromEntries(SOCIAL_PLATFORM_KEYS.map((platform) => [platform, { ...social[platform], text: clampPlatformText(platform, social[platform].text), status }])),
      platform_images: Object.fromEntries(selectedPlatforms.map((platform) => [platform, sharedImage]).filter(([, image]) => Boolean(image))), platform_results: {}, last_error: null,
      brief: { topic, targetCountry: country, targetAudience: audience, objective: "Commercial awareness and buyer education", cta, source: "AI Content Studio" }, updated_at: new Date().toISOString(), approved_at: status === "Approved" ? new Date().toISOString() : null };
    const result = socialId ? await supabase.from("social_scheduled_posts").update(payload).eq("id", socialId).select().single() : await supabase.from("social_scheduled_posts").insert(payload).select().single();
    setWorking(""); if (result.error) { setError(result.error.message); return; } setSocialId(result.data.id); flash(status === "Approved" ? "Selected social channels approved and queued for publishing." : `Selected social channels saved as ${status}.`);
  }

  async function approveSelected() {
    if (publishWebsite) await saveBlog("published");
    if (selectedPlatforms.length) await saveSocial("Approved");
    setReviewOpen(false);
  }

  const socialPlatform: SocialPlatformKey | null = activePlatform === "blog" ? null : activePlatform;
  const activeSocial = socialPlatform ? social[socialPlatform] : null;
  const platformMeta = socialPlatform ? SOCIAL_PLATFORM_META[socialPlatform] : null;
  const overLimit = Boolean(activeSocial && platformMeta && activeSocial.text.length > platformMeta.maxChars);

  return <AdminShell><div className="os-page content-ops-studio content-studio-v2">
    <header className="os-page-header"><div><div className="os-page-eyebrow">AI & Content Operations</div><h1 className="os-page-title">AI Content Studio</h1><p className="os-page-subtitle">Every morning the automation researches a buyer-intent topic and prepares a blog plus platform-native social drafts. Everything stays under human review before publishing.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={() => void runDailyAutomation(true)} disabled={Boolean(working)}><Clock3/>{working === "daily" ? "Generating Today’s Draft…" : "Generate / Refresh Today’s Draft"}</button><button className="os-btn primary" onClick={() => void generatePackage()} disabled={Boolean(working)}><Sparkles/>{working === "research" ? "Researching Blog…" : working === "social" ? "Preparing Social Versions…" : "Generate Content Package"}</button></div></header>

    <div className="content-stepper">{["Topic & buyer intent","Blog draft","Shared image","Platform versions","Human approval","Publish / queue"].map((label, index) => <span key={label}><b>{index + 1}</b>{label}</span>)}</div>
    {error && <section className="os-card content-alert"><strong>Content operation needs attention</strong><p>{error}</p></section>}
    {booting && <section className="os-card"><div className="os-empty"><RefreshCw className="animate-spin"/><h3>Preparing today’s content workspace</h3><p>Checking the daily blog and social draft queue.</p></div></section>}

    {!booting && <div className="content-studio-workspace">
      <aside className="os-card content-brief-card"><div className="os-card-header"><div><h2>Content Brief</h2><p>One topic powers the complete campaign.</p></div><span className="os-badge pink">AI RESEARCH</span></div><div className="os-card-body"><div className="os-form-grid"><label className="os-label full"><span>Topic / Product — optional override</span><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Leave blank — AI researches today’s buyer-intent topic automatically"/></label><label className="os-label"><span>Target Market</span><input value={country} onChange={(event) => setCountry(event.target.value)}/></label><label className="os-label"><span>Primary Keyword</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="AI can research this"/></label><label className="os-label full"><span>Buyer Type</span><input value={audience} onChange={(event) => setAudience(event.target.value)}/></label><label className="os-label full"><span>Lead CTA</span><input value={cta} onChange={(event) => setCta(event.target.value)}/></label></div><button className="os-btn primary content-main-generate" onClick={() => void generatePackage()} disabled={Boolean(working)}><Sparkles/>{working === "research" ? "Researching Blog…" : working === "social" ? "Preparing Social Versions…" : "Generate Blog + Social Versions"}</button><div className="content-active-campaign"><span>Today’s active topic</span><strong>{topic || (working === "daily" ? "AI is researching today’s buyer-intent topic…" : "Daily topic will be researched automatically")}</strong><small>{working === "daily" ? "Daily AI research is running…" : `${country} · SEO ${scores.seo}% · GEO ${scores.geo}%`}</small></div></div></aside>

      <main className="os-card content-package-card"><div className="os-card-header"><div><h2>Generated Content Package</h2><p>Edit, image, review and approve each output.</p></div><span className="os-badge green">SHARED CAMPAIGN</span></div><div className="os-card-body">
        <div className="content-shared-creative-stage" data-shape={imageShape}>{sharedImage ? <img src={sharedImage} alt="Shared campaign creative"/> : <div className="content-creative-placeholder"><span>THE SALT ORIGIN</span><strong>{blog.title || topic || "Campaign image preview"}</strong><small>Generate or upload the shared creative</small></div>}</div>
        <div className="content-image-toolbar"><div className="os-segmented"><button className={imageShape === "square" ? "active" : ""} onClick={() => setImageShape("square")} title="Square"><Square/></button><button className={imageShape === "portrait" ? "active" : ""} onClick={() => setImageShape("portrait")} title="Portrait"><RectangleVertical/></button><button className={imageShape === "landscape" ? "active" : ""} onClick={() => setImageShape("landscape")} title="Landscape"><RectangleHorizontal/></button></div><button className="os-btn soft" onClick={() => void generateSharedImage()} disabled={Boolean(working)}><Sparkles/>{working === "image" ? "Generating…" : "Create Image with AI"}</button><button className="os-btn soft" onClick={() => fileInput.current?.click()} disabled={Boolean(working)}><UploadCloud/>{working === "upload" ? "Uploading…" : "Upload Image"}</button><span>Image is shown uncropped so you can review the full creative.</span><input ref={fileInput} type="file" accept="image/*" hidden onChange={uploadImage}/></div>

        <div className="os-tabs content-platform-tabs"><button className={`os-tab ${activePlatform === "blog" ? "active" : ""}`} onClick={() => setActivePlatform("blog")}>Blog</button>{SOCIAL_PLATFORM_KEYS.map((platform) => <button key={platform} className={`os-tab ${activePlatform === platform ? "active" : ""}`} onClick={() => setActivePlatform(platform)}>{SOCIAL_PLATFORM_META[platform].label}</button>)}</div>

        {activePlatform === "blog" ? <div className="content-editor-panel"><div className="content-editor-heading"><div><span>Concise website blog</span><strong>Blog Draft</strong></div><span>SEO {scores.seo}% · GEO {scores.geo}%</span></div><label className="os-label"><span>Blog Title</span><input value={blog.title} onChange={(event) => setBlog((current) => ({ ...current, title: event.target.value }))}/></label><label className="os-label"><span>Excerpt</span><textarea rows={3} value={blog.excerpt} onChange={(event) => setBlog((current) => ({ ...current, excerpt: event.target.value }))}/></label><label className="os-label"><span>Blog Content</span><textarea className="content-social-copy content-studio-article" value={blog.content} onChange={(event) => setBlog((current) => ({ ...current, content: event.target.value }))}/></label></div> : activeSocial && platformMeta ? <div className="content-editor-panel"><div className="content-editor-heading"><div><span>{platformMeta.copyLabel}</span><strong>{platformMeta.label} Version</strong></div><span className={overLimit ? "limit-bad" : ""}>{activeSocial.text.length.toLocaleString()} / {platformMeta.maxChars.toLocaleString()} max · target ~{platformMeta.recommendedChars}</span></div><label className="os-label"><span>{platformMeta.titleLabel || "Title / Hook"}</span><input value={activeSocial.title} onChange={(event) => setSocial((current) => ({ ...current, [socialPlatform!]: { ...current[socialPlatform!], title: event.target.value } }))}/></label><label className="os-label"><span>{platformMeta.copyLabel}</span><textarea className="content-social-copy" value={activeSocial.text} onChange={(event) => setSocial((current) => ({ ...current, [socialPlatform!]: { ...current[socialPlatform!], text: event.target.value } }))}/></label><label className="os-label"><span>Hashtags / Search Terms</span><textarea rows={2} value={activeSocial.hashtags} onChange={(event) => setSocial((current) => ({ ...current, [socialPlatform!]: { ...current[socialPlatform!], hashtags: event.target.value } }))}/></label></div> : null}

        <div className="content-review-actions"><button className="os-btn soft" onClick={() => void saveBlog("draft")}><Save/>Draft</button><button className="os-btn soft" onClick={() => setReviewOpen(true)}><Eye/>Full Review</button><button className="os-btn primary" onClick={() => setReviewOpen(true)}><CheckCircle2/>Review & Approve</button></div>
      </div></main>
    </div>}

    {reviewOpen && <div className="os-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setReviewOpen(false); }}><section className="os-modal content-review-modal"><div className="os-modal-header"><div><div className="os-page-eyebrow">Human Approval</div><h2>Review Complete Content Package</h2><p>Confirm research direction, quality scores, keywords, blog copy, creative and publishing destinations.</p></div><button className="os-icon-button" onClick={() => setReviewOpen(false)}><XCircle/></button></div><div className="os-modal-body content-review-body"><div className="content-review-kpis"><div><span>SEO Score</span><strong>{scores.seo}%</strong></div><div><span>GEO Score</span><strong>{scores.geo}%</strong></div><div><span>Primary Keyword</span><strong>{blog.primaryKeyword || keyword || "—"}</strong></div><div><span>Creative</span><strong>{sharedImage ? "Attached" : "Missing"}</strong></div></div><section className="content-review-section"><h3>Topic & Keywords</h3><p>{topic}</p><div className="content-keyword-chips">{scores.keywords.map((item) => <span key={item}>{item}</span>)}</div></section><section className="content-review-section"><h3>Blog</h3><label className="os-label"><span>Title</span><input value={blog.title} onChange={(event) => setBlog((current) => ({ ...current, title: event.target.value }))}/></label><label className="os-label"><span>Excerpt</span><textarea rows={3} value={blog.excerpt} onChange={(event) => setBlog((current) => ({ ...current, excerpt: event.target.value }))}/></label><label className="os-label"><span>Blog Content</span><textarea className="content-studio-article" value={blog.content} onChange={(event) => setBlog((current) => ({ ...current, content: event.target.value }))}/></label></section><section className="content-review-section"><h3>Publishing Destinations</h3><label className="content-destination"><input type="checkbox" checked={publishWebsite} onChange={(event) => setPublishWebsite(event.target.checked)}/><span><FileText/>Website Blog</span></label><div className="content-destination-grid">{SOCIAL_PLATFORM_KEYS.map((platform) => <label className="content-destination" key={platform}><input type="checkbox" checked={selectedPlatforms.includes(platform)} onChange={(event) => setSelectedPlatforms((current) => event.target.checked ? [...new Set([...current, platform])] : current.filter((item) => item !== platform))}/><span>{SOCIAL_PLATFORM_META[platform].label}</span></label>)}</div></section></div><div className="os-modal-footer"><button className="os-btn danger" onClick={async () => { await saveBlog("archived"); await saveSocial("Rejected"); setReviewOpen(false); }}><XCircle/>Reject</button><button className="os-btn soft" onClick={async () => { await saveBlog("draft"); await saveSocial("Draft"); setReviewOpen(false); }}><Save/>Keep Draft</button><button className="os-btn primary" onClick={() => void approveSelected()} disabled={Boolean(working)}><Send/>Approve Selected</button></div></section></div>}

    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>Connected CMS records were updated.</span></div></div></div>}
  </div></AdminShell>;
}
