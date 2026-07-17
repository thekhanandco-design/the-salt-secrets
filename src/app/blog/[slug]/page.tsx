import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type BlogPost = { title: string; excerpt: string; content: string; featured_image: string; published_at: string; created_at: string; seo_title?: string; seo_description?: string };

async function getPost(slug: string) {
  const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").single();
  return data as BlogPost | null;
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
  return <main className="bg-[#FFF8F5] min-h-screen"><article className="max-w-4xl mx-auto px-6 py-20"><p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">The Salt Origin Blog</p><h1 className="text-5xl lg:text-7xl font-black text-[#081325] mt-4 leading-tight" style={{ fontFamily: "Georgia, serif" }}>{post.title}</h1><p className="text-slate-500 mt-5">{new Date(post.published_at || post.created_at).toLocaleDateString()}</p>{post.featured_image && <img src={post.featured_image} alt={post.title} className="w-full max-h-[560px] object-cover rounded-[28px] mt-10" />}<div className="mt-10 bg-white border border-[#EFE3E5] rounded-[28px] p-7 lg:p-12"><p className="text-xl text-slate-600 leading-relaxed font-semibold">{post.excerpt}</p><div className="mt-8 prose prose-lg max-w-none text-slate-700 whitespace-pre-wrap leading-8" dangerouslySetInnerHTML={{ __html: post.content }} /></div></article></main>;
}
