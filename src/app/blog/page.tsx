import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BlogNewsletterForm from "@/components/BlogNewsletterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Salt Journal | The Salt Origin",
  description: "Research-led Himalayan pink salt insights for buyers, private-label teams and international distributors.",
};

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  created_at: string;
  category?: string;
};

type TextRow = {
  section_slug: string;
  field_key: string;
  default_value: string | null;
  cms_text_translations?: Array<{ language_code: string; value: string | null }>;
};

function textValue(rows: TextRow[], key: string, fallback: string) {
  const row = rows.find((item) => `${item.section_slug}.${item.field_key}` === key);
  return String(row?.cms_text_translations?.find((item) => item.language_code === "en")?.value || row?.default_value || fallback);
}

export default async function BlogPage() {
  const [{ data }, { data: textRows }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,featured_image,published_at,created_at,category")
      .eq("status", "published")
      .eq("content_type", "blog")
      .order("published_at", { ascending: false })
      .limit(12),
    supabase
      .from("cms_text_entries")
      .select("section_slug,field_key,default_value,cms_text_translations(language_code,value)")
      .eq("page_slug", "blog")
      .order("display_order"),
  ]);

  const texts = (textRows || []) as TextRow[];
  const posts = ((data as BlogPost[] | null) || []).filter((post) => post.slug && post.title);

  return (
    <main className="tso-route-page tso-journal-page">
      <section className="tso-page-hero tso-page-hero--clean tso-journal-hero-v78" data-cms-section="hero">
        <div className="tso-public-container">
          <div className="tso-crumbs" data-cms-key="blog.hero.crumbs">{textValue(texts, "hero.crumbs", "HOME / BLOG")}</div>
          <h1>
            <span data-cms-key="blog.hero.title_main">{textValue(texts, "hero.title_main", "The Salt ")}</span>
            <em data-cms-key="blog.hero.title_accent">{textValue(texts, "hero.title_accent", "Journal.")}</em>
          </h1>
          <p data-cms-key="blog.hero.description">{textValue(texts, "hero.description", "Editorial content designed for SEO, commercial education and buyer confidence — without looking like generic filler.")}</p>
        </div>
      </section>

      <section className="tso-route-section tso-journal-listing-v78" data-cms-section="listing">
        <div className="tso-public-container">
          {posts.length ? (
            <div className="tso-journal-grid tso-journal-grid-v78">
              {posts.map((post) => (
                <article key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="tso-journal-card-image tso-journal-card-image--square" aria-label={post.title}>
                    <img data-cms-image-key={`blog.listing.post_${post.slug}`} src={post.featured_image || "/og-image.jpg"} alt={post.title} />
                  </Link>
                  <div className="tso-journal-card-body">
                    <small>{post.category || "Salt Journal"}</small>
                    <h2>{post.title}</h2>
                    <p>{post.excerpt}</p>
                    <Link href={`/blog/${post.slug}`} data-cms-key="blog.listing.open_article">{textValue(texts, "listing.open_article", "Open article →")}</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="tso-journal-empty">No published blog posts yet.</div>
          )}

          <div className="tso-journal-subscribe">
            <div>
              <h3 data-cms-key="blog.listing.newsletter_title">{textValue(texts, "listing.newsletter_title", "Subscribe to the Salt Journal")}</h3>
              <p data-cms-key="blog.listing.newsletter_text">{textValue(texts, "listing.newsletter_text", "Product guides, private-label notes and export updates.")}</p>
            </div>
            <BlogNewsletterForm />
          </div>
        </div>
      </section>

      <section className="tso-premium-cta tso-premium-cta--compact" data-cms-section="cta">
        <div className="tso-public-container">
          <div className="tso-premium-cta-box">
            <div>
              <h2 data-cms-key="blog.cta.title">{textValue(texts, "cta.title", "Planning your next salt program?")}</h2>
              <p data-cms-key="blog.cta.description">{textValue(texts, "cta.description", "Turn your product, packaging and destination requirements into a focused commercial conversation with our B2B team.")}</p>
            </div>
            <div>
              <Link href="/contact" className="tso-button light" data-cms-key="blog.cta.quote_button">{textValue(texts, "cta.quote_button", "Get a Quote")}</Link>
              <Link href="/products" className="tso-button dark" data-cms-key="blog.cta.products_button">{textValue(texts, "cta.products_button", "Browse Products")}</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
