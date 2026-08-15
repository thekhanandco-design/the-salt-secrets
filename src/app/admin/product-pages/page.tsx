"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { APPROVED_PRODUCT_CATEGORIES } from "@/lib/product-catalog";
import { Edit3, Eye, FilePlus2, Layers3 } from "lucide-react";

type Product = { id: number; title: string; slug: string; category: string; image?: string; status?: string; grain_type?: string; sizes?: string };
type PageRow = { page_slug: string };

function visible(status?: string) { return status === "active" || status === "published"; }

export default function ProductPagesAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pageRows, setPageRows] = useState<PageRow[]>([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [productsResult, pagesResult] = await Promise.all([
      supabase.from("products").select("id,title,slug,category,image,status,grain_type,sizes").order("display_order"),
      supabase.from("page_content").select("page_slug").like("page_slug", "product:%"),
    ]);
    if (productsResult.error) alert(productsResult.error.message);
    setProducts((productsResult.data || []) as Product[]);
    setPageRows((pagesResult.data || []) as PageRow[]);
    setLoading(false);
  }

  const currentCategories = new Set(APPROVED_PRODUCT_CATEGORIES.map((item) => item.slug));
  const pageSet = useMemo(() => new Set(pageRows.map((row) => row.page_slug)), [pageRows]);
  const shown = products.filter((product) => currentCategories.has(product.category) && (category === "all" || product.category === category));

  return (
    <AdminShell>
      <div className="os-page legacy-unified-page product-pages-admin">
        <header className="enterprise-page-header">
          <div><p className="enterprise-kicker">Website</p><h1 className="cms-module-title">Product Pages</h1><p className="module-subcopy">Product record aur full public detail page alag hain. Product select karein, phir uska detail page create/edit karein.</p></div>
          <div className="os-row-actions"><Link href="/admin/products" className="secondary-enterprise-button"><Layers3 />Products</Link><Link href="/admin/categories" className="secondary-enterprise-button">Categories</Link></div>
        </header>

        <section className="executive-card product-pages-card">
          <div className="product-pages-tabs">
            <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>All Products</button>
            {APPROVED_PRODUCT_CATEGORIES.map((item) => <button key={item.slug} className={category === item.slug ? "active" : ""} onClick={() => setCategory(item.slug)}>{item.name}</button>)}
          </div>
          {loading ? <div className="product-pages-empty">Loading…</div> : shown.length ? (
            <div className="product-pages-grid">
              {shown.map((product) => {
                const customPageReady = pageSet.has(`product:${product.id}`);
                return (
                  <article className="product-page-card" key={product.id}>
                    <div className="product-page-card__image">{product.image ? <img src={product.image} alt="" /> : <span>No image</span>}</div>
                    <div className="product-page-card__body">
                      <span>{APPROVED_PRODUCT_CATEGORIES.find((item) => item.slug === product.category)?.name || product.category}</span>
                      <h2>{product.title}</h2>
                      <p>{product.grain_type || "Product"} · {product.sizes || "Size on request"}</p>
                      <div className="product-page-status"><b className={customPageReady ? "ready" : "default"}>{customPageReady ? "CUSTOM PAGE READY" : "DEFAULT PAGE"}</b><small>{visible(product.status) ? "Product visible" : "Product hidden"}</small></div>
                    </div>
                    <div className="product-page-card__actions">
                      <Link className="cms-gradient-button" href={`/admin/products/${product.id}`}>{customPageReady ? <Edit3 /> : <FilePlus2 />}{customPageReady ? "Edit Page" : "Create Page"}</Link>
                      <Link className="secondary-enterprise-button" href={`/products/${product.slug}`} target="_blank"><Eye />Preview</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <div className="product-pages-empty">Is category mein abhi koi product nahi hai.</div>}
        </section>

        <style jsx>{`
          .product-pages-card{margin-top:18px;padding:0;overflow:hidden}.product-pages-tabs{display:flex;gap:7px;flex-wrap:wrap;padding:17px;border-bottom:1px solid var(--line)}.product-pages-tabs button{border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:999px;padding:8px 12px;font-size:10px;font-weight:800}.product-pages-tabs button.active{background:#a7193f;border-color:#a7193f;color:#fff}.product-pages-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:18px}.product-page-card{border:1px solid var(--line);border-radius:17px;background:var(--surface);overflow:hidden}.product-page-card__image{height:155px;background:var(--surface-2);display:grid;place-items:center;color:var(--muted)}.product-page-card__image img{width:100%;height:100%;object-fit:contain;padding:12px}.product-page-card__body{padding:15px}.product-page-card__body>span{font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#a7193f;font-weight:900}.product-page-card h2{margin:7px 0 5px;font-size:21px}.product-page-card p{margin:0;color:var(--muted);font-size:11px}.product-page-status{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:13px}.product-page-status b{font-size:8px;padding:5px 7px;border-radius:999px}.product-page-status b.ready{background:#e7f7ef;color:#158556}.product-page-status b.default{background:#fff0d8;color:#a6680a}.product-page-status small{font-size:9px;color:var(--muted)}.product-page-card__actions{display:flex;gap:8px;padding:12px 15px 15px;border-top:1px solid var(--line)}.product-page-card__actions :global(a){flex:1;justify-content:center}.product-page-card__actions :global(svg){width:14px}.product-pages-empty{padding:50px;text-align:center;color:var(--muted)}@media(max-width:1050px){.product-pages-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.product-pages-grid{grid-template-columns:1fr}}
        `}</style>
      </div>
    </AdminShell>
  );
}
