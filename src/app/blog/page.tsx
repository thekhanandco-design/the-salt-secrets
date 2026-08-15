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

type TextRow = { section_slug: string; field_key: string; default_value: string | null; cms_text_translations?: Array<{ language_code: string; value: string | null }> };
function textValue(rows: TextRow[], key: string, fallback: string) {
  const row = rows.find((item) => `${item.section_slug}.${item.field_key}` === key);
  return String(row?.cms_text_translations?.find((item) => item.language_code === "en")?.value || row?.default_value || fallback);
}

const fallbackPosts: BlogPost[] = [
  { id: -1, slug: "pink-salt-grain-size-guide", title: "Choosing the right pink salt grain size for retail and foodservice", excerpt: "A practical comparison of fine, medium, coarse and chunk formats with packaging and application notes.", featured_image: "/hero-banner.png", published_at: "", created_at: "", category: "Buyer Guide · Featured" },
  { id: -2, slug: "private-label-packaging-inputs", title: "Seven inputs to prepare before requesting custom packaging", excerpt: "Brand assets, pack format, product grade, market, barcode, volume and deadline.", featured_image: "/custom-packaging.png", published_at: "", created_at: "", category: "Private Label" },
  { id: -3, slug: "professional-salt-specification-sheet", title: "What belongs on a professional salt specification sheet?", excerpt: "Build buyer confidence with consistent technical and commercial documentation.", featured_image: "/product-3.png", published_at: "", created_at: "", category: "Specifications" },
  { id: -4, slug: "retail-packaging-format-guide", title: "Pouch, jar or grinder: choosing the right retail format", excerpt: "Packaging trade-offs for grocery, gourmet and specialty channels.", featured_image: "/pet-jars.png", published_at: "", created_at: "", category: "Retail" },
  { id: -5, slug: "pre-shipment-document-checklist", title: "A pre-shipment document checklist for B2B salt buyers", excerpt: "Organize the commercial conversation before the order moves forward.", featured_image: "/white-sack.png", published_at: "", created_at: "", category: "Importing" },
  { id: -6, slug: "provenance-premium-ingredient-branding", title: "Why provenance matters in premium ingredient branding", excerpt: "Turn origin and traceability into a stronger premium brand narrative.", featured_image: "/mountains-bg.png", published_at: "", created_at: "", category: "Brand Story" },
];

export default async function BlogPage() {
  const [{ data }, { data: textRows }] = await Promise.all([
    supabase.from("blog_posts").select("id,title,slug,excerpt,featured_image,published_at,created_at,category").eq("status", "published").eq("content_type", "blog").order("published_at", { ascending: false }).limit(12),
    supabase.from("cms_text_entries").select("section_slug,field_key,default_value,cms_text_translations(language_code,value)").eq("page_slug", "blog").order("display_order"),
  ]);
  const texts = (textRows || []) as TextRow[];
  const realPosts = (data as BlogPost[] | null) || [];
  const posts = (realPosts.length ? realPosts : fallbackPosts).slice(0, 6);

  return (
    <main className="tso-route-page tso-journal-page">
      <section className="tso-page-hero tso-page-hero--clean" data-cms-section="hero">
        <div className="tso-public-container">
          <div className="tso-crumbs">HOME / BLOG</div>
          <h1>{textValue(texts, "hero.title_main", "The Salt ")}<em>{textValue(texts, "hero.title_accent", "Journal.")}</em></h1>
          <p>{textValue(texts, "hero.description", "Editorial content designed for SEO, commercial education and buyer confidence — without looking like generic filler.")}</p>
        </div>
      </section>

      <section className="tso-route-section" data-cms-section="listing">
        <div className="tso-public-container">
          <div className="tso-journal-grid">
            {posts.map((post, index) => (
              <article key={post.id} className={index === 0 ? "featured" : ""}>
                <div className="tso-journal-card-image"><img src={post.featured_image || "/og-image.jpg"} alt={post.title} /></div>
                <div className="tso-journal-card-body">
                  <small>{post.category || (index === 0 ? "Buyer Guide · Featured" : "Salt Journal")}</small>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <Link href={post.id < 0 ? "/contact" : `/blog/${post.slug}`}>Open article →</Link>
                </div>
              </article>
            ))}
          </div>

          <div className="tso-journal-subscribe">
            <div><h3>Subscribe to the Salt Journal</h3><p>Product guides, private-label notes and export updates.</p></div>
            <BlogNewsletterForm />
          </div>
        </div>
      </section>

      <section className="tso-premium-cta tso-premium-cta--compact" data-cms-section="cta">
        <div className="tso-public-container"><div className="tso-premium-cta-box"><div><h2>Planning your next salt program?</h2><p>Turn your product, packaging and destination requirements into a focused commercial conversation with our B2B team.</p></div><div><Link href="/contact" className="tso-button light">Get a Quote</Link><Link href="/products" className="tso-button dark">Browse Products</Link></div></div></div>
      </section>
    </main>
  );
}
