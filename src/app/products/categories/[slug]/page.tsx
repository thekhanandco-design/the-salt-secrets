import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Category = {
  id: number | string;
  name: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  featured_image?: string | null;
  status?: string | null;
};

type Product = {
  id: number | string;
  title: string;
  slug: string;
  category?: string | null;
  short_description?: string | null;
  description?: string | null;
  image?: string | null;
  grain_type?: string | null;
  packaging_type?: string | null;
  status?: string | null;
};

function normalized(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function loadCategory(slug: string) {
  const { data } = await supabase.from("categories").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
  return (data || null) as Category | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await loadCategory(slug);
  if (!category) return { title: "Product Category | The Salt Origin", robots: { index: false, follow: true } };
  return {
    title: `${category.name} | The Salt Origin`,
    description: category.description || category.subtitle || `Explore ${category.name} from The Salt Origin.`,
    robots: { index: false, follow: true },
  };
}

export default async function ProductCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await loadCategory(slug);
  if (!category) notFound();

  const { data: productRows } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("display_order")
    .order("created_at", { ascending: false });

  const categoryKeys = new Set([normalized(category.slug), normalized(category.name)]);
  const products = ((productRows || []) as Product[]).filter((product) => categoryKeys.has(normalized(product.category)));

  return (
    <main className="tso-route-page tso-products-page">
      <section className="tso-page-hero tso-page-hero--clean">
        <div className="tso-public-container">
          <div className="tso-crumbs">HOME / PRODUCTS / {category.name.toUpperCase()}</div>
          <h1>{category.name}</h1>
          <p>{category.description || category.subtitle || "Explore available product formats in this category."}</p>
        </div>
      </section>

      <section className="tso-route-section">
        <div className="tso-public-container">
          <div className="tso-product-grid">
            {products.map((product) => (
              <article className="tso-product-card" key={String(product.id)}>
                <div className="tso-product-image"><img src={product.image || category.featured_image || category.image || "/product-1.jpg"} alt={product.title} /></div>
                <div className="tso-product-body">
                  <div className="tso-product-meta"><span>{product.grain_type || "Premium"}</span><span>{product.packaging_type || category.name}</span></div>
                  <h3>{product.title}</h3>
                  <p>{product.short_description || product.description || "Commercial product details are available for qualified B2B enquiries."}</p>
                  <div className="tso-product-footer"><Link href={`/products/${product.slug}`}>View details →</Link><Link href="/contact">Quote</Link></div>
                </div>
              </article>
            ))}
          </div>
          {!products.length ? <div className="tso-public-empty">Products in this category are currently being prepared.</div> : null}
        </div>
      </section>
    </main>
  );
}
