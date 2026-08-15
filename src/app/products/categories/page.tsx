import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Product Categories | The Salt Origin",
  description: "Himalayan pink salt product categories for retail, bulk, foodservice and private-label buyers.",
  robots: { index: false, follow: true },
};

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

export default async function ProductCategoriesPage() {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("status", "active")
    .order("display_order");

  const categories = (data || []) as Category[];

  return (
    <main className="tso-route-page tso-products-page">
      <section className="tso-page-hero tso-page-hero--clean">
        <div className="tso-public-container">
          <div className="tso-crumbs">HOME / PRODUCTS / CATEGORIES</div>
          <h1>Product <em>Categories.</em></h1>
          <p>Browse the product families used to organize retail, foodservice, bulk and private-label salt formats.</p>
        </div>
      </section>

      <section className="tso-route-section">
        <div className="tso-public-container">
          <div className="tso-category-public-grid">
            {categories.map((category) => {
              const image = category.featured_image || category.image || "/product-1.jpg";
              return (
                <Link key={String(category.id)} href={`/products/categories/${category.slug}`} className="tso-category-public-card">
                  <div className="tso-category-public-media"><img src={image} alt={category.name} /></div>
                  <div className="tso-category-public-body">
                    {category.subtitle ? <small>{category.subtitle}</small> : null}
                    <h2>{category.name}</h2>
                    {category.description ? <p>{category.description}</p> : null}
                    <span>View products →</span>
                  </div>
                </Link>
              );
            })}
            {!categories.length ? <div className="tso-public-empty">Product categories will appear here when they are enabled.</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
