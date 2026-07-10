"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  status: string;
  published_at: string | null;
  created_at: string;
  seo_title?: string;
  seo_description?: string;
};

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image: "",
  status: "draft",
  seo_title: "",
  seo_description: "",
};

export default function BlogsAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  }

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function autoSlug(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function savePost() {
    if (!form.title || !form.slug) return alert("Title and slug are required.");
    setSaving(true);
    const payload = {
      ...form,
      published_at: form.status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const query = editingId
      ? supabase.from("blog_posts").update(payload).eq("id", editingId)
      : supabase.from("blog_posts").insert([payload]);
    const { error } = await query;
    setSaving(false);
    if (error) return alert(error.message);
    setForm(emptyForm);
    setEditingId(null);
    await loadPosts();
  }

  function editPost(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      featured_image: post.featured_image || "",
      status: post.status || "draft",
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deletePost(id: number) {
    if (!confirm("Delete this blog post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((item) => item.id !== id));
  }

  async function generateDraft() {
    if (!topic.trim()) return alert("Enter a blog topic first.");
    setGenerating(true);
    const response = await fetch("/api/blog/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    const result = await response.json();
    setGenerating(false);
    if (!response.ok) return alert(result.error || "AI draft generation failed.");
    setForm({
      ...emptyForm,
      title: result.title || topic,
      slug: autoSlug(result.title || topic),
      excerpt: result.excerpt || "",
      content: result.content || "",
      seo_title: result.seo_title || result.title || topic,
      seo_description: result.seo_description || result.excerpt || "",
    });
  }

  const filtered = useMemo(() => posts.filter((post) => post.title.toLowerCase().includes(search.toLowerCase())), [posts, search]);

  return (
    <AdminShell>
      <div className="space-y-8">
        <div>
          <p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">Content</p>
          <h1 className="text-4xl lg:text-5xl font-black mt-2">Blogs Manager</h1>
          <p className="text-slate-500 mt-3">Create, edit, schedule and publish SEO-ready articles.</p>
        </div>

        <section className="rounded-[28px] bg-white text-[#081325] border border-[#EFE3E5] p-6 lg:p-8">
          <h2 className="text-2xl font-black">AI Blog Draft</h2>
          <div className="mt-4 flex flex-col lg:flex-row gap-3">
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Example: Benefits of Himalayan Pink Salt for food brands" className="flex-1 border rounded-xl px-4 py-3" />
            <button onClick={generateDraft} disabled={generating} className="rounded-xl bg-[#081325] text-white px-6 py-3 font-black">
              {generating ? "Generating..." : "Generate Draft"}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Requires OPENAI_API_KEY in environment variables. Generated content is saved only after your review.</p>
        </section>

        <section className="rounded-[28px] bg-white text-[#081325] border border-[#EFE3E5] p-6 lg:p-8">
          <div className="grid lg:grid-cols-2 gap-4">
            <input value={form.title} onChange={(e) => { setField("title", e.target.value); if (!editingId) setField("slug", autoSlug(e.target.value)); }} placeholder="Blog title" className="border rounded-xl p-4" />
            <input value={form.slug} onChange={(e) => setField("slug", e.target.value)} placeholder="slug" className="border rounded-xl p-4" />
            <input value={form.featured_image} onChange={(e) => setField("featured_image", e.target.value)} placeholder="Featured image URL" className="border rounded-xl p-4 lg:col-span-2" />
            <textarea value={form.excerpt} onChange={(e) => setField("excerpt", e.target.value)} placeholder="Short excerpt" className="border rounded-xl p-4 h-28 lg:col-span-2" />
            <textarea value={form.content} onChange={(e) => setField("content", e.target.value)} placeholder="Full blog content (plain text or HTML)" className="border rounded-xl p-4 h-80 lg:col-span-2 font-mono text-sm" />
            <input value={form.seo_title} onChange={(e) => setField("seo_title", e.target.value)} placeholder="SEO title" className="border rounded-xl p-4" />
            <input value={form.seo_description} onChange={(e) => setField("seo_description", e.target.value)} placeholder="SEO description" className="border rounded-xl p-4" />
            <select value={form.status} onChange={(e) => setField("status", e.target.value)} className="border rounded-xl p-4 bg-white">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={savePost} disabled={saving} className="rounded-xl bg-[#C23B4A] text-white px-7 py-4 font-black">{saving ? "Saving..." : editingId ? "Update Blog" : "Save Blog"}</button>
            {editingId && <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-xl bg-slate-500 text-white px-7 py-4 font-black">Cancel</button>}
          </div>
        </section>

        <section className="rounded-[28px] bg-white text-[#081325] border border-[#EFE3E5] overflow-hidden">
          <div className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#EFE3E5]">
            <h2 className="text-2xl font-black">All Blogs</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search blogs..." className="border rounded-xl px-4 py-3 lg:w-80" />
          </div>
          {loading ? <div className="p-8">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FFF4F5]"><tr><th className="p-4 text-left">Title</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Date</th><th className="p-4 text-left">Actions</th></tr></thead>
                <tbody>
                  {filtered.map((post) => <tr key={post.id} className="border-t border-[#EFE3E5]"><td className="p-4 font-bold">{post.title}</td><td className="p-4"><span className="rounded-full bg-[#FFF2F4] px-3 py-1 text-xs font-black text-[#C23B4A]">{post.status}</span></td><td className="p-4">{new Date(post.published_at || post.created_at).toLocaleDateString()}</td><td className="p-4"><div className="flex gap-2"><button onClick={() => editPost(post)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Edit</button><button onClick={() => deletePost(post.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button></div></td></tr>)}
                  {filtered.length === 0 && <tr><td className="p-8 text-center text-slate-500" colSpan={4}>No blog posts yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
