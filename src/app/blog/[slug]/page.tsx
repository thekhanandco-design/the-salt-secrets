import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { stripResearchLinks } from "@/lib/content-quality";

export const dynamic = "force-dynamic";

type BlogPost = {
  title: string;
  excerpt: string;
  content: string;
  featured_image: string;
  published_at: string;
  created_at: string;
  seo_title?: string;
  seo_description?: string;
  category?: string;
};

async function getPost(slug: string) {
  const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").single();
  return data as BlogPost | null;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function plainTextToHtml(value: string) {
  const cleaned = stripResearchLinks(value)
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1");
  const lines = cleaned.split(/\r?\n/).map((line) => line.trim());
  const blocks: string[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length) {
      blocks.push(`<ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };
  for (const line of lines) {
    if (!line) {
      flushList();
      continue;
    }
    if (/^[-*•]\s+/.test(line)) {
      list.push(line.replace(/^[-*•]\s+/, ""));
      continue;
    }
    flushList();
    if (/^(faq|frequently asked questions|conclusion|final thoughts|how to|what to|why |buyer checklist|key considerations|packaging|quality|documentation|shipping|private label|supplier|applications|commercial terms)/i.test(line) && line.length < 95) {
      blocks.push(`<h2>${escapeHtml(line)}</h2>`);
    } else if (line.endsWith("?") && line.length < 140) {
      blocks.push(`<h3>${escapeHtml(line)}</h3>`);
    } else {
      blocks.push(`<p>${escapeHtml(line)}</p>`);
    }
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
  return {
    title: post.seo_title || `${post.title} | The Salt Origin`,
    description: post.seo_description || post.excerpt,
    openGraph: { images: [post.featured_image || "/og-image.jpg"] },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const articleHtml = sanitizeArticleHtml(post.content || "");
  const coverImage = post.featured_image || "/og-image.jpg";
  const publishDate = new Date(post.published_at || post.created_at).toLocaleDateString();

  return (
    <main className="tso-blog-detail-v78">
      <article className="tso-blog-detail-v78__article">
        <div className="tso-blog-detail-v78__hero">
          <header className="tso-blog-detail-v78__intro">
            <p className="tso-blog-detail-v78__kicker">{post.category || "The Salt Origin Blog"}</p>
            <h1>{post.title}</h1>
            <p className="tso-blog-detail-v78__date">{publishDate}</p>
          </header>

          <div className="tso-blog-detail-v78__cover">
            <img src={coverImage} alt={post.title} />
          </div>
        </div>

        <div className="tso-blog-detail-v78__body">
          {post.excerpt ? <p className="tso-blog-detail-v78__excerpt">{post.excerpt}</p> : null}
          <div className="salt-article" dangerouslySetInnerHTML={{ __html: articleHtml }} />
        </div>
      </article>
    </main>
  );
}
