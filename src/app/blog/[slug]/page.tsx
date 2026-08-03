import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { stripResearchLinks } from "@/lib/content-quality";

export const dynamic = "force-dynamic";

type BlogPost = { title: string; excerpt: string; content: string; featured_image: string; published_at: string; created_at: string; seo_title?: string; seo_description?: string };

async function getPost(slug: string) {
  const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").single();
  return data as BlogPost | null;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function plainTextToHtml(value: string) {
  const cleaned = stripResearchLinks(value)
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1");
  const lines = cleaned.split(/\r?\n/).map(line => line.trim());
  const blocks: string[] = [];
  let list: string[] = [];
  const flushList = () => { if (list.length) { blocks.push(`<ul>${list.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`); list = []; } };
  for (const line of lines) {
    if (!line) { flushList(); continue; }
    if (/^[-*•]\s+/.test(line)) { list.push(line.replace(/^[-*•]\s+/, "")); continue; }
    flushList();
    if (/^(faq|frequently asked questions|conclusion|final thoughts|how to|what to|why |buyer checklist|key considerations|packaging|quality|documentation|shipping|private label|supplier|applications|commercial terms)/i.test(line) && line.length < 95) blocks.push(`<h2>${escapeHtml(line)}</h2>`);
    else if (line.endsWith("?") && line.length < 140) blocks.push(`<h3>${escapeHtml(line)}</h3>`);
    else blocks.push(`<p>${escapeHtml(line)}</p>`);
  }
  flushList();
  return blocks.join("");
}

function sanitizeArticleHtml(value: string) {
  const withoutLinks = stripResearchLinks(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
  if (!/<(?:h2|h3|p|ul|ol|li|strong)\b/i.test(withoutLinks)) return plainTextToHtml(withoutLinks);
  return withoutLinks
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/<(?!\/?(?:h2|h3|p|ul|ol|li|strong)\b)[^>]+>/gi, "")
    .replace(/<(h2|h3|p|ul|ol|li|strong)\b[^>]*>/gi, "<$1>")
    .trim();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Blog Not Found | The Salt Origin" };
  return { title: post.seo_title || `${post.title} | The Salt Origin`, description: post.seo_description || post.excerpt, openGraph: { images: post.featured_image ? [post.featured_image] : [] } };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const articleHtml = sanitizeArticleHtml(post.content || "");
  return <main className="bg-[#FFF8F5] min-h-screen"><article className="max-w-4xl mx-auto px-6 py-16 lg:py-20"><p className="tracking-[3px] text-[#C23B4A] font-black text-xs">The Salt Origin Blog</p><h1 className="text-4xl lg:text-5xl font-black text-[#081325] mt-4 leading-[1.08]">{post.title}</h1><p className="text-slate-500 mt-5">{new Date(post.published_at || post.created_at).toLocaleDateString()}</p>{post.featured_image && <img src={post.featured_image} alt={post.title} className="w-full max-h-[560px] object-cover rounded-[28px] mt-10" />}<div className="mt-10 bg-white border border-[#EFE3E5] rounded-[28px] p-7 lg:p-12"><p className="text-xl text-slate-600 leading-relaxed font-semibold">{post.excerpt}</p><div className="salt-article mt-8 text-slate-700" dangerouslySetInnerHTML={{ __html: articleHtml }} /></div></article><style>{`.salt-article h2{font-size:1.65rem;line-height:1.2;font-weight:850;color:#081325;margin:2rem 0 .8rem}.salt-article h3{font-size:1.2rem;line-height:1.35;font-weight:800;color:#15223a;margin:1.5rem 0 .55rem}.salt-article p{font-size:1.02rem;line-height:1.85;margin:.8rem 0}.salt-article ul,.salt-article ol{padding-left:1.25rem;margin:.9rem 0}.salt-article li{font-size:1rem;line-height:1.75;margin:.4rem 0}.salt-article strong{font-weight:800;color:#101b31}`}</style></main>;
}
