"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetch, adminUpload } from "@/lib/admin-client";
import { supabase } from "@/lib/supabase-client";
import { calculateGeoScore, calculateSeoScore, normalizeKeywordList } from "@/lib/content-quality";
import {
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Send,
  Sparkles,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";

type BlogRow = Record<string, any> & {
  id: string | number;
  title: string;
  slug: string;
  content: string;
  status: string;
};

type ManualBlogDraft = {
  title: string;
  content: string;
  featuredImage: string;
};

const emptyManualDraft: ManualBlogDraft = { title: "", content: "", featuredImage: "" };

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return [start.toISOString(), end.toISOString()] as const;
}

function statusLabel(row: BlogRow) {
  return String(row.approval_status || row.status || "Draft");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || `blog-${Date.now()}`;
}

function plainExcerpt(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

export default function BlogCenterPage() {
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [selected, setSelected] = useState<BlogRow | null>(null);
  const [manual, setManual] = useState<ManualBlogDraft>(emptyManualDraft);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const manualImageInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("content_type", "blog")
      .order("created_at", { ascending: false })
      .limit(100);
    if (loadError) setError(loadError.message);
    else setRows((data || []) as BlogRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const todayDraft = useMemo(() => {
    const [start, end] = todayRange();
    return rows.find((row) => {
      const created = new Date(row.created_at);
      return created >= new Date(start) && created < new Date(end) && !["published", "archived"].includes(String(row.status).toLowerCase());
    }) || null;
  }, [rows]);

  const stats = useMemo(() => ({
    review: rows.filter((row) => ["draft", "review"].includes(String(row.status).toLowerCase())).length,
    published: rows.filter((row) => String(row.status).toLowerCase() === "published").length,
    images: rows.filter((row) => Boolean(row.featured_image)).length,
  }), [rows]);

  async function generateDaily() {
    setWorking("daily");
    setError("");
    try {
      const response = await adminFetch("/api/blog/daily-draft", { method: "POST" });
      const payload = await response.json();
      if (!response.ok && !payload.skipped) throw new Error(payload.error || "Daily blog generation failed.");
      await load();
      setToast(payload.skipped ? "Today’s blog draft already exists." : "Today’s researched blog draft is ready for review.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Daily blog generation failed.");
    } finally {
      setWorking("");
    }
  }

  async function generateImage() {
    if (!selected) return;
    setWorking("image");
    setError("");
    try {
      const prompt = String(selected.image_prompt || selected.title);
      const response = await adminFetch("/api/ai/image", {
        method: "POST",
        body: JSON.stringify({
          prompt: `${prompt}. Premium square editorial image for The Salt Origin, Himalayan pink salt, international B2B buyer context, no readable text, no invented certification, no medical claim.`,
          size: "1024x1024",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Image generation failed.");
      let url = String(payload.image || "");
      if (url.startsWith("data:")) {
        const blob = await fetch(url).then((responseData) => responseData.blob());
        const upload = await adminUpload(blob, "blog-image", { folder: new Date().toISOString().slice(0, 10), filename: "generated.png" });
        url = upload.value;
      }
      setSelected({ ...selected, featured_image: url });
      setToast("AI image attached for review.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image generation failed.");
    } finally {
      setWorking("");
    }
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selected) return;
    setWorking("upload");
    try {
      const upload = await adminUpload(file, "blog-image", { folder: new Date().toISOString().slice(0, 10), filename: file.name });
      setSelected({ ...selected, featured_image: upload.value });
      setToast("Image uploaded.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    }
    setWorking("");
    event.target.value = "";
  }

  async function uploadManualImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setWorking("manual-image");
    setError("");
    try {
      const upload = await adminUpload(file, "blog-image", { folder: `manual/${new Date().toISOString().slice(0, 10)}`, filename: file.name });
      setManual((current) => ({ ...current, featuredImage: upload.value }));
      setToast("Manual blog image uploaded.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    } finally {
      setWorking("");
      event.target.value = "";
    }
  }

  async function publishManualBlog() {
    const title = manual.title.trim();
    const content = manual.content.trim();
    if (!title || !content || !manual.featuredImage) {
      setError("Topic name, full blog content and a cover image are required before publishing.");
      return;
    }

    setWorking("manual-publish");
    setError("");
    try {
      const baseSlug = slugify(title);
      const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", baseSlug).maybeSingle();
      const slug = existing ? `${baseSlug}-${Date.now().toString().slice(-6)}` : baseSlug;
      const excerpt = plainExcerpt(content);
      const now = new Date().toISOString();
      const seoScore = calculateSeoScore({
        title,
        slug,
        excerpt,
        content,
        seoTitle: title,
        seoDescription: excerpt,
        primaryKeyword: "",
        secondaryKeywords: [],
        featuredImage: manual.featuredImage,
      });
      const geoScore = calculateGeoScore({ title, excerpt, content, primaryKeyword: "", targetCountry: "Global" });

      const { error: insertError } = await supabase.from("blog_posts").insert({
        title,
        slug,
        excerpt,
        content,
        featured_image: manual.featuredImage,
        status: "published",
        approval_status: "Published",
        content_type: "blog",
        category: "Salt Journal",
        seo_title: title,
        seo_description: excerpt,
        seo_score: seoScore,
        geo_score: geoScore,
        keywords: [],
        published_at: now,
        updated_at: now,
      });
      if (insertError) throw insertError;

      setManual(emptyManualDraft);
      await load();
      window.dispatchEvent(new Event("salt-cms-updated"));
      setToast("Manual blog published to the live website.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Manual blog publishing failed.");
    } finally {
      setWorking("");
    }
  }

  async function save(status?: "draft" | "review" | "published" | "archived") {
    if (!selected) return;
    setWorking("save");
    setError("");
    const keywords = normalizeKeywordList(selected.primary_keyword, selected.keywords, selected.title);
    const nextStatus = status || String(selected.status || "draft").toLowerCase();
    const seo = calculateSeoScore({
      title: selected.title,
      slug: selected.slug,
      excerpt: selected.excerpt || "",
      content: selected.content || "",
      seoTitle: selected.seo_title || selected.title,
      seoDescription: selected.seo_description || selected.excerpt || "",
      primaryKeyword: selected.primary_keyword || keywords[0] || "",
      secondaryKeywords: keywords,
      featuredImage: selected.featured_image || "",
    });
    const geo = calculateGeoScore({
      title: selected.title,
      excerpt: selected.excerpt || "",
      content: selected.content || "",
      primaryKeyword: selected.primary_keyword || keywords[0] || "",
      targetCountry: selected.target_country || "Global",
    });
    const patch = {
      ...selected,
      status: nextStatus,
      approval_status: nextStatus === "published" ? "Published" : nextStatus === "review" ? "Needs Review" : nextStatus === "archived" ? "Rejected" : "Draft",
      seo_score: seo,
      geo_score: geo,
      keywords,
      published_at: nextStatus === "published" ? new Date().toISOString() : selected.published_at || null,
      updated_at: new Date().toISOString(),
    };
    delete (patch as any).id;
    const { data, error: saveError } = await supabase.from("blog_posts").update(patch).eq("id", selected.id).select().single();
    setWorking("");
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setSelected(data as BlogRow);
    await load();
    window.dispatchEvent(new Event("salt-cms-updated"));
    setToast(nextStatus === "published" ? "Blog approved and published to the website." : nextStatus === "archived" ? "Blog rejected and archived." : "Blog draft updated.");
  }

  return (
    <AdminShell>
      <div className="os-page blog-center-v2">
        <header className="os-page-header">
          <div>
            <div className="os-page-eyebrow">Editorial Publishing</div>
            <h1 className="os-page-title">Blog Center</h1>
            <p className="os-page-subtitle">A daily AI-assisted queue for useful, readable buyer-focused blogs. Research and generation are automatic; publishing always requires human approval.</p>
          </div>
          <div className="os-page-actions">
            <button className="os-btn soft" onClick={() => void load()}><RefreshCw />Refresh</button>
            <button className="os-btn primary" onClick={() => void generateDaily()} disabled={Boolean(working)}><Sparkles />{working === "daily" ? "Researching…" : "Generate Today’s Blog"}</button>
          </div>
        </header>

        {error ? <section className="os-card content-alert"><strong>Blog Center needs attention</strong><p>{error}</p></section> : null}

        <section className="os-card blog-manual-publisher">
          <div className="os-card-header">
            <div>
              <h2>Manual Blog Publisher</h2>
              <p>Paste a finished blog, upload its square cover image, then publish it directly to the website.</p>
            </div>
            <span className="os-badge pink">MANUAL</span>
          </div>
          <div className="os-card-body blog-manual-publisher-grid">
            <div className="blog-manual-fields">
              <label className="os-label">
                <span>Topic / Blog Title</span>
                <input value={manual.title} onChange={(event) => setManual((current) => ({ ...current, title: event.target.value }))} placeholder="Enter the blog topic or final title" />
              </label>
              <label className="os-label">
                <span>Full Blog Content</span>
                <textarea value={manual.content} onChange={(event) => setManual((current) => ({ ...current, content: event.target.value }))} placeholder="Paste the complete blog here..." />
              </label>
            </div>
            <aside className="blog-manual-media">
              <div className="blog-manual-cover">
                {manual.featuredImage ? <img src={manual.featuredImage} alt="Manual blog cover preview" /> : <div><ImageIcon /><strong>Square Blog Image</strong><span>Recommended: 1200 × 1200</span></div>}
              </div>
              <button className="os-btn soft" type="button" onClick={() => manualImageInput.current?.click()} disabled={Boolean(working)}><UploadCloud />{working === "manual-image" ? "Uploading…" : "Upload Image"}</button>
              <input ref={manualImageInput} type="file" accept="image/*" hidden onChange={uploadManualImage} />
              <button className="os-btn primary" type="button" onClick={() => void publishManualBlog()} disabled={Boolean(working)}><Send />{working === "manual-publish" ? "Publishing…" : "Publish to Website"}</button>
            </aside>
          </div>
        </section>

        <div className="blog-center-stats">
          {[
            ["Needs Review", stats.review, "Editorial queue"],
            ["Published", stats.published, "Website"],
            ["Daily Auto Draft", "Enabled", "06:00 schedule"],
            ["Images Attached", stats.images, "Media"],
            ["SEO/GEO Review", "Required", "Quality"],
            ["Human Approval", "100%", "Governance"],
          ].map(([label, value, meta]) => <article className="os-metric" key={String(label)}><span className="os-metric-label">{label}</span><strong className="os-metric-value">{String(value)}</strong><small>{meta}</small></article>)}
        </div>

        <div className="blog-center-layout blog-center-layout--queue-lower">
          <section className="os-card">
            <div className="os-card-header">
              <div><h2>Daily Editorial Queue</h2><p>Today’s automatic blog appears here for review.</p></div>
              {todayDraft ? <span className="os-badge amber">TODAY</span> : null}
            </div>
            <div className="os-card-body blog-queue-list">
              {loading ? <div className="os-empty"><RefreshCw className="animate-spin" /><h3>Loading blogs</h3></div> : rows.slice(0, 25).map((row) => (
                <article key={row.id} className="blog-queue-row">
                  {row.featured_image ? <img src={row.featured_image} alt="" /> : <div className="blog-queue-image"><FileText /></div>}
                  <div className="blog-queue-copy">
                    <div className="blog-queue-title"><h3>{row.title}</h3><span className={`os-badge ${statusLabel(row).toLowerCase().includes("publish") ? "green" : "pink"}`}>{statusLabel(row)}</span></div>
                    <p>{row.excerpt || "Buyer-focused editorial draft ready for review."}</p>
                    <div className="blog-queue-meta"><span>SEO {row.seo_score ?? "—"}%</span><span>GEO {row.geo_score ?? "—"}%</span><span>{row.reading_time || "Concise blog"}</span><span>{new Date(row.created_at).toLocaleString()}</span></div>
                  </div>
                  <div className="blog-queue-actions"><button className="os-btn soft" onClick={() => setSelected(row)}><Eye />Review</button><button className="os-btn primary" onClick={() => setSelected(row)}><Edit3 />Edit + Image</button></div>
                </article>
              ))}
              {!rows.length && !loading ? <div className="os-empty"><FileText /><h3>No blog drafts yet</h3><p>Use Manual Blog Publisher above or run today’s research.</p><button className="os-btn primary" onClick={() => void generateDaily()}><Sparkles />Generate Today’s Blog</button></div> : null}
            </div>
          </section>

          <aside className="os-card">
            <div className="os-card-header"><div><h2>Publishing Governance</h2><p>Every blog passes the same controlled review.</p></div><span className="os-badge green">HUMAN-IN-THE-LOOP</span></div>
            <div className="os-card-body governance-list">
              {[
                ["Research & keyword direction", "AI research chooses buyer-intent questions and commercial search gaps."],
                ["Cover image", "Upload manually or create a topic-matched square AI image."],
                ["Website publishing", "Approve writes the blog to the live website publication state."],
                ["Campaign reuse", "The same topic and creative can feed Social Media Studio after review."],
              ].map(([title, copy], index) => <div key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><p>{copy}</p></div></div>)}
            </div>
          </aside>
        </div>

        {selected ? (
          <div className="os-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
            <section className="os-modal blog-review-modal">
              <div className="os-modal-header"><div><div className="os-page-eyebrow">Blog Review</div><h2>{selected.title}</h2><p>Review copy, quality signals and image before publishing.</p></div><button className="os-icon-button" onClick={() => setSelected(null)}><X /></button></div>
              <div className="os-modal-body blog-review-grid">
                <div>
                  <label className="os-label"><span>Blog Title</span><input value={selected.title || ""} onChange={(event) => setSelected({ ...selected, title: event.target.value })} /></label>
                  <label className="os-label"><span>Excerpt</span><textarea rows={3} value={selected.excerpt || ""} onChange={(event) => setSelected({ ...selected, excerpt: event.target.value })} /></label>
                  <label className="os-label"><span>Blog Content</span><textarea className="blog-review-content" value={selected.content || ""} onChange={(event) => setSelected({ ...selected, content: event.target.value })} /></label>
                  <div className="os-form-grid"><label className="os-label"><span>SEO Title</span><input value={selected.seo_title || ""} onChange={(event) => setSelected({ ...selected, seo_title: event.target.value })} /></label><label className="os-label"><span>Primary Keyword</span><input value={selected.primary_keyword || ""} onChange={(event) => setSelected({ ...selected, primary_keyword: event.target.value })} /></label></div>
                </div>
                <aside>
                  <div className="blog-review-image">{selected.featured_image ? <img src={selected.featured_image} alt="Blog cover" /> : <div><ImageIcon /><strong>Square cover image</strong><span>Generate or upload before publishing.</span></div>}</div>
                  <div className="blog-image-actions"><button className="os-btn primary" onClick={() => void generateImage()} disabled={Boolean(working)}><Sparkles />AI Generate</button><button className="os-btn soft" onClick={() => fileInput.current?.click()}><UploadCloud />Upload</button><input ref={fileInput} type="file" accept="image/*" hidden onChange={uploadImage} /></div>
                  <div className="blog-review-score"><div><span>SEO</span><strong>{selected.seo_score ?? "—"}%</strong></div><div><span>GEO</span><strong>{selected.geo_score ?? "—"}%</strong></div></div>
                  <div className="content-keyword-chips">{(Array.isArray(selected.keywords) ? selected.keywords : []).map((keyword: any) => <span key={String(keyword)}>{String(keyword)}</span>)}</div>
                </aside>
              </div>
              <div className="os-modal-footer"><button className="os-btn danger" onClick={() => void save("archived")}><XCircle />Reject</button><button className="os-btn soft" onClick={() => void save("draft")}><Edit3 />Save Draft</button><button className="os-btn soft" onClick={() => void save("review")}><Eye />Needs Review</button><button className="os-btn primary" onClick={() => void save("published")}><CheckCircle2 />Approve & Publish</button></div>
            </section>
          </div>
        ) : null}

        {toast ? <div className="os-toast-stack"><div className="os-toast"><CheckCircle2 /><div><strong>{toast}</strong><span>Blog records are live CMS data.</span></div></div></div> : null}
      </div>
    </AdminShell>
  );
}
