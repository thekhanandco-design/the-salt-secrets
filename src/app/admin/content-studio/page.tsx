"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-client";
import { supabase } from "@/lib/supabase-client";
import { calculateGeoScore, calculateSeoScore, normalizeKeywordList } from "@/lib/content-quality";
import {
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  UploadCloud,
  XCircle,
} from "lucide-react";

type PlatformKey = "facebook" | "linkedin" | "instagram" | "threads" | "x" | "youtube" | "pinterest" | "tiktok";
type SocialDraft = { title: string; text: string; hashtags: string; image_prompt: string };
type BlogDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  imagePrompt: string;
  status: string;
};

const platformKeys: PlatformKey[] = ["facebook", "linkedin", "instagram", "threads", "x", "youtube", "pinterest", "tiktok"];
const labels: Record<PlatformKey, string> = { facebook: "Facebook", linkedin: "LinkedIn", instagram: "Instagram", threads: "Threads", x: "X", youtube: "YouTube", pinterest: "Pinterest", tiktok: "TikTok" };
const blankBlog: BlogDraft = { title: "", slug: "", excerpt: "", content: "", seoTitle: "", seoDescription: "", primaryKeyword: "", secondaryKeywords: [], imagePrompt: "", status: "Draft" };
const blankSocial = () => Object.fromEntries(platformKeys.map((platform) => [platform, { title: "", text: "", hashtags: "", image_prompt: "" }])) as Record<PlatformKey, SocialDraft>;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function ContentStudioPage() {
  const [topic, setTopic] = useState("");
  const [country, setCountry] = useState("Global");
  const [audience, setAudience] = useState("Importers, distributors and private-label buyers");
  const [keyword, setKeyword] = useState("");
  const [cta, setCta] = useState("Request a quotation");
  const [blog, setBlog] = useState<BlogDraft>(blankBlog);
  const [social, setSocial] = useState<Record<PlatformKey, SocialDraft>>(blankSocial());
  const [activePlatform, setActivePlatform] = useState<PlatformKey>("facebook");
  const [sharedImage, setSharedImage] = useState("");
  const [blogId, setBlogId] = useState<string | number | null>(null);
  const [socialId, setSocialId] = useState<string | null>(null);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const scores = useMemo(() => {
    const keywords = normalizeKeywordList(blog.primaryKeyword || keyword, blog.secondaryKeywords, blog.title || topic);
    const primaryKeyword = blog.primaryKeyword || keyword || keywords[0] || "";
    return {
      seo: calculateSeoScore({ title: blog.title, slug: blog.slug, excerpt: blog.excerpt, content: blog.content, seoTitle: blog.seoTitle, seoDescription: blog.seoDescription, primaryKeyword, secondaryKeywords: keywords, featuredImage: sharedImage }),
      geo: calculateGeoScore({ title: blog.title, excerpt: blog.excerpt, content: blog.content, primaryKeyword, targetCountry: country }),
    };
  }, [blog, keyword, country, sharedImage, topic]);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }

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
    if (!topic.trim()) { setError("Enter a topic first."); return; }
    setWorking("package"); setError(""); setBlogId(null); setSocialId(null);
    try {
      const [blogResponse, socialResponse] = await Promise.all([
        adminFetch("/api/admin/ai-content", { method: "POST", body: JSON.stringify({ tool: "Blog Generator", topic, country, audience, buyerType: "International B2B buyer", searchIntent: "Commercial research", keyword, tone: "Premium, factual and professional", language: "English", length: "Standard", cta, brandVoice: "Premium, factual, clear and export-focused", research: true }) }),
        adminFetch("/api/admin/social-content", { method: "POST", body: JSON.stringify({ topic, targetCountry: country, targetAudience: audience, objective: "Commercial awareness and buyer education", product: "Himalayan pink salt", tone: "Premium professional B2B", cta, platforms: platformKeys }) }),
      ]);
      const [blogPayload, socialPayload] = await Promise.all([blogResponse.json(), socialResponse.json()]);
      if (!blogResponse.ok) throw new Error(blogPayload.error || "Blog generation failed.");
      if (!socialResponse.ok) throw new Error(socialPayload.error || "Social content generation failed.");

      const secondaryKeywords = Array.isArray(blogPayload.secondary_keywords) ? blogPayload.secondary_keywords.map(String) : [];
      const nextBlog: BlogDraft = {
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
      const nextSocial = blankSocial();
      platformKeys.forEach((platform) => {
        const item = socialPayload.platforms?.[platform] || {};
        nextSocial[platform] = { title: String(item.title || ""), text: String(item.text || ""), hashtags: String(item.hashtags || ""), image_prompt: String(item.image_prompt || nextBlog.imagePrompt) };
      });
      setSocial(nextSocial);
      flash("Complete blog + social content package generated for review.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Content package generation failed.");
    } finally { setWorking(""); }
  }

  async function generateSharedImage() {
    const prompt = blog.imagePrompt || social[activePlatform].image_prompt || topic;
    if (!prompt.trim()) { setError("Generate the content package or enter a topic first."); return; }
    setWorking("image"); setError("");
    try {
      const response = await adminFetch("/api/ai/image", { method: "POST", body: JSON.stringify({ prompt: `${prompt}. Premium commercial editorial image for The Salt Origin, Himalayan pink salt, refined pink and charcoal brand mood, no medical claims, no third-party logos, no readable text.`, size: "1536x1024" }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "AI image generation failed.");
      const url = await uploadGeneratedImage(String(payload.image || ""));
      setSharedImage(url); flash("Shared campaign image generated and saved to CMS media.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Image generation failed."); }
    finally { setWorking(""); }
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setWorking("upload"); setError("");
    const path = `content-studio/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const result = await supabase.storage.from("cms-media").upload(path, file, { contentType: file.type, upsert: false });
    if (result.error) setError(result.error.message); else { setSharedImage(supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl); flash("Image uploaded and attached to the complete campaign."); }
    setWorking(""); event.target.value = "";
  }

  async function saveBlog(status: "draft" | "review" | "published" | "archived") {
    if (!blog.title.trim()) { setError("Generate or enter the blog before saving."); return; }
    setWorking(`blog-${status}`); setError("");
    const keywords = normalizeKeywordList(blog.primaryKeyword || keyword, blog.secondaryKeywords, blog.title);
    const payload = {
      title: blog.title.trim(), slug: blog.slug.trim() || slugify(blog.title), excerpt: blog.excerpt, content: blog.content, featured_image: sharedImage || null,
      status, approval_status: status === "published" ? "Published" : status === "review" ? "Needs Review" : status === "archived" ? "Rejected" : "Draft",
      seo_title: blog.seoTitle, seo_description: blog.seoDescription, content_type: "blog", keywords, primary_keyword: blog.primaryKeyword || keyword || keywords[0] || null,
      target_country: country, image_prompt: blog.imagePrompt, seo_score: scores.seo, geo_score: scores.geo, published_at: status === "published" ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
    };
    const result = blogId ? await supabase.from("blog_posts").update(payload).eq("id", blogId).select().single() : await supabase.from("blog_posts").insert(payload).select().single();
    setWorking("");
    if (result.error) { setError(result.error.message); return; }
    setBlogId(result.data.id); setBlog((current) => ({ ...current, status: payload.approval_status }));
    window.dispatchEvent(new Event("salt-cms-updated"));
    flash(status === "published" ? "Blog approved and published to the website." : status === "review" ? "Blog sent to the review queue." : status === "archived" ? "Blog rejected and archived." : "Blog draft saved.");
  }

  async function saveSocial(status: "Draft" | "Needs Review" | "Approved" | "Rejected") {
    if (!topic.trim()) { setError("Topic is required."); return; }
    setWorking(`social-${status}`); setError("");
    const primary = social[platformKeys[0]];
    const payload = {
      title: topic.trim(), caption: primary.text, hashtags: primary.hashtags, keywords: blog.primaryKeyword || keyword || "", image_url: sharedImage,
      platforms: platformKeys, scheduled_at: new Date().toISOString(), status: status.toLowerCase().replaceAll(" ", "_"), approval_status: status,
      platform_content: Object.fromEntries(platformKeys.map((platform) => [platform, social[platform]])),
      platform_images: Object.fromEntries(platformKeys.map((platform) => [platform, sharedImage]).filter(([, image]) => Boolean(image))),
      platform_results: {}, last_error: null, brief: { topic, targetCountry: country, targetAudience: audience, objective: "Commercial awareness and buyer education", cta, source: "AI Content Studio" }, updated_at: new Date().toISOString(), approved_at: status === "Approved" ? new Date().toISOString() : null,
    };
    const result = socialId ? await supabase.from("social_scheduled_posts").update(payload).eq("id", socialId).select().single() : await supabase.from("social_scheduled_posts").insert(payload).select().single();
    setWorking("");
    if (result.error) { setError(result.error.message); return; }
    setSocialId(result.data.id); flash(`Social campaign saved as ${status}.`);
  }

  const active = social[activePlatform];

  return <AdminShell><div className="os-page content-ops-studio">
    <header className="os-page-header"><div><div className="os-page-eyebrow">One topic · complete content system</div><h1 className="os-page-title">AI Content Studio</h1><p className="os-page-subtitle">Research one commercial topic, generate the full website blog and every platform-specific social draft, use one shared campaign image, then review and approve each publishing path.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={() => { setBlog(blankBlog); setSocial(blankSocial()); setSharedImage(""); setBlogId(null); setSocialId(null); setError(""); }}><RefreshCw/>New Package</button><button className="os-btn primary" disabled={Boolean(working)} onClick={() => void generatePackage()}><Sparkles/>{working === "package" ? "Researching & Writing…" : "Generate Complete Package"}</button></div></header>

    {error && <section className="os-card" style={{ borderColor: "rgba(214,69,69,.35)" }}><div className="os-card-body"><strong>Content operation needs attention</strong><p className="os-page-subtitle">{error}</p></div></section>}

    <section className="os-card content-brief-card"><div className="os-card-header"><div><h2>Campaign Brief</h2><p>The same commercial brief drives the blog and every social platform.</p></div><Sparkles/></div><div className="os-card-body"><div className="os-form-grid"><label className="os-label full"><span>Topic</span><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Example: Difference between pink salt and white salt"/></label><label className="os-label"><span>Target Market</span><input value={country} onChange={(event) => setCountry(event.target.value)}/></label><label className="os-label"><span>Primary Keyword</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Optional — AI can research the topic"/></label><label className="os-label full"><span>Target Audience</span><input value={audience} onChange={(event) => setAudience(event.target.value)}/></label><label className="os-label full"><span>Call to Action</span><input value={cta} onChange={(event) => setCta(event.target.value)}/></label></div></div></section>

    <div className="content-studio-grid">
      <section className="os-card"><div className="os-card-header"><div><h2>Blog Draft</h2><p>Full long-form website article with SEO/GEO review.</p></div><span className={`os-badge ${blog.status === "Published" ? "green" : blog.status === "Needs Review" ? "amber" : "pink"}`}>{blog.status}</span></div><div className="os-card-body"><div className="blog-quality-strip"><div><span>SEO</span><b>{scores.seo}%</b></div><div><span>GEO</span><b>{scores.geo}%</b></div><div><span>Image</span><b>{sharedImage ? "Ready" : "Pending"}</b></div></div><div className="os-form-grid" style={{ marginTop: 14 }}><label className="os-label full"><span>Blog Title</span><input value={blog.title} onChange={(event) => setBlog((current) => ({ ...current, title: event.target.value, slug: current.slug || slugify(event.target.value) }))}/></label><label className="os-label full"><span>Excerpt</span><textarea value={blog.excerpt} onChange={(event) => setBlog((current) => ({ ...current, excerpt: event.target.value }))}/></label><label className="os-label full"><span>Article Content</span><textarea className="content-studio-article" value={blog.content} onChange={(event) => setBlog((current) => ({ ...current, content: event.target.value }))}/></label><label className="os-label"><span>SEO Title</span><input value={blog.seoTitle} onChange={(event) => setBlog((current) => ({ ...current, seoTitle: event.target.value }))}/></label><label className="os-label"><span>Slug</span><input value={blog.slug} onChange={(event) => setBlog((current) => ({ ...current, slug: slugify(event.target.value) }))}/></label><label className="os-label full"><span>SEO Description</span><textarea value={blog.seoDescription} onChange={(event) => setBlog((current) => ({ ...current, seoDescription: event.target.value }))}/></label></div><div className="content-approval-row"><button className="os-btn soft" onClick={() => void saveBlog("draft")} disabled={Boolean(working)}><Save/>Save Draft</button><button className="os-btn soft" onClick={() => void saveBlog("review")} disabled={Boolean(working)}><Eye/>Send for Review</button><button className="os-btn success" onClick={() => void saveBlog("published")} disabled={Boolean(working)}><CheckCircle2/>Approve & Publish</button><button className="os-btn danger" onClick={() => void saveBlog("archived")} disabled={Boolean(working)}><XCircle/>Reject</button></div></div></section>

      <aside className="os-card os-panel-sticky"><div className="os-card-header"><div><h2>Shared Campaign Image</h2><p>One creative can be reused across the blog and social package.</p></div><ImageIcon/></div><div className="os-card-body"><div className="content-shared-image">{sharedImage ? <img src={sharedImage} alt="Campaign creative"/> : <div><ImageIcon/><strong>No campaign image yet</strong><span>Generate from the topic or upload your own image.</span></div>}</div><label className="os-label" style={{ marginTop: 13 }}><span>AI Image Prompt</span><textarea value={blog.imagePrompt} onChange={(event) => setBlog((current) => ({ ...current, imagePrompt: event.target.value }))} placeholder="Generated from the topic automatically"/></label><div className="content-image-actions"><button className="os-btn primary" onClick={() => void generateSharedImage()} disabled={Boolean(working)}><Sparkles/>{working === "image" ? "Generating…" : "Create Image with AI"}</button><button className="os-btn soft" onClick={() => fileInput.current?.click()} disabled={Boolean(working)}><UploadCloud/>{working === "upload" ? "Uploading…" : "Upload Image"}</button></div><input ref={fileInput} type="file" accept="image/*" hidden onChange={uploadImage}/><div className="content-image-note"><CheckCircle2/><span>Same image is attached to all selected social platforms. You can replace platform-specific creatives later in Social Media Studio.</span></div></div></aside>
    </div>

    <section className="os-card"><div className="os-card-header"><div><h2>Social Media Package</h2><p>Every platform receives the same topic with copy adapted to its format and audience.</p></div><span className="os-badge pink">{platformKeys.length} platforms</span></div><div className="os-card-body"><div className="os-tabs content-platform-tabs">{platformKeys.map((platform) => <button key={platform} className={`os-tab ${activePlatform === platform ? "active" : ""}`} onClick={() => setActivePlatform(platform)}>{labels[platform]}</button>)}</div><div className="content-social-grid"><div><div className="os-form-grid"><label className="os-label full"><span>{labels[activePlatform]} Title / Hook</span><input value={active.title} onChange={(event) => setSocial((current) => ({ ...current, [activePlatform]: { ...current[activePlatform], title: event.target.value } }))}/></label><label className="os-label full"><span>{labels[activePlatform]} Copy</span><textarea className="content-social-copy" value={active.text} onChange={(event) => setSocial((current) => ({ ...current, [activePlatform]: { ...current[activePlatform], text: event.target.value } }))}/><small>{active.text.length} characters · written for {labels[activePlatform]}</small></label><label className="os-label full"><span>Hashtags / Search Terms</span><textarea value={active.hashtags} onChange={(event) => setSocial((current) => ({ ...current, [activePlatform]: { ...current[activePlatform], hashtags: event.target.value } }))}/></label></div></div><div className="social-package-preview"><div className="social-package-profile"><img src="/salt-origin-logo.png" alt="The Salt Origin"/><div><strong>The Salt Origin</strong><span>{labels[activePlatform]} preview</span></div></div>{sharedImage ? <img src={sharedImage} alt="Campaign preview"/> : <div className="social-package-empty"><ImageIcon/><span>Shared image preview</span></div>}<div className="social-package-copy">{active.title && <strong>{active.title}</strong>}<p>{active.text || "Generate the content package to preview platform-specific copy."}</p><em>{active.hashtags}</em></div></div></div><div className="content-approval-row"><button className="os-btn soft" onClick={() => void saveSocial("Draft")} disabled={Boolean(working)}><Save/>Save Social Drafts</button><button className="os-btn soft" onClick={() => void saveSocial("Needs Review")} disabled={Boolean(working)}><Eye/>Send for Review</button><button className="os-btn success" onClick={() => void saveSocial("Approved")} disabled={Boolean(working)}><CheckCircle2/>Approve Campaign</button><button className="os-btn danger" onClick={() => void saveSocial("Rejected")} disabled={Boolean(working)}><XCircle/>Reject</button><a href="/admin/social-studio" className="os-btn primary"><Send/>Open Social Studio</a></div></div></section>

    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>Connected CMS records were updated.</span></div></div></div>}
  </div></AdminShell>;
}
