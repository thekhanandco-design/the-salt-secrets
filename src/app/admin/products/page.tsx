"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { adminUpload } from "@/lib/admin-client";
import { APPROVED_PRODUCT_CATEGORIES, APPROVED_PRODUCT_SHEET } from "@/lib/product-catalog";
import { Edit3, Eye, EyeOff, ImagePlus, Layers3, Save, Search, Trash2, X } from "lucide-react";

type Product = {
  id: number;
  title: string;
  slug: string;
  category: string;
  description?: string;
  image?: string;
  status?: string;
  grain_type?: string;
  sizes?: string;
  packaging?: string;
  packaging_type?: string;
  display_order?: number;
};

type Category = { id?: number; name: string; slug: string; status?: string | null; display_order?: number | null };

type ProductForm = {
  title: string;
  category: string;
  grain_type: string;
  packaging_type: string;
  sizes: string;
  description: string;
  image: string;
  status: string;
  display_order: string;
};

const empty: ProductForm = { title: "", category: "", grain_type: "", packaging_type: "", sizes: "", description: "", image: "", status: "active", display_order: "0" };
const approvedSlugs = new Set(APPROVED_PRODUCT_CATEGORIES.map((item) => item.slug));

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function isVisible(status?: string | null) { return status === "active" || status === "published"; }

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>(empty);
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [productResult, categoryResult] = await Promise.all([
      supabase.from("products").select("id,title,slug,category,description,image,status,grain_type,sizes,packaging,packaging_type,display_order").order("display_order").order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name,slug,status,display_order").order("display_order"),
    ]);
    if (productResult.error) alert(productResult.error.message);
    if (categoryResult.error) alert(categoryResult.error.message);
    setProducts(((productResult.data || []) as Product[]).filter((item) => approvedSlugs.has(item.category)));
    setCategories((categoryResult.data || []) as Category[]);

    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get("category");
    if (requestedCategory && approvedSlugs.has(requestedCategory)) {
      setCategoryFilter(requestedCategory);
      setForm((current) => ({ ...current, category: requestedCategory }));
    }
    setLoading(false);
  }

  const categoryOptions = useMemo(() => APPROVED_PRODUCT_CATEGORIES.map((base) => ({
    name: categories.find((row) => row.slug === base.slug)?.name || base.name,
    slug: base.slug,
    status: categories.find((row) => row.slug === base.slug)?.status || "active",
    display_order: base.display_order,
  })), [categories]);

  const shown = useMemo(() => products.filter((product) => {
    const categoryMatch = categoryFilter === "all" || product.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const searchMatch = !q || `${product.title} ${product.grain_type || ""} ${product.packaging_type || ""} ${product.sizes || ""}`.toLowerCase().includes(q);
    return categoryMatch && searchMatch;
  }), [products, categoryFilter, search]);

  function reset() {
    setEditing(null);
    setForm({ ...empty, category: categoryFilter === "all" ? "" : categoryFilter });
  }

  function edit(product: Product) {
    setEditing(product.id);
    setForm({
      title: product.title || "",
      category: product.category || "",
      grain_type: product.grain_type || "",
      packaging_type: product.packaging_type || product.packaging || "",
      sizes: product.sizes || "",
      description: product.description || "",
      image: product.image || "",
      status: product.status || "active",
      display_order: String(product.display_order || 0),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await adminUpload(file, "product-image", { folder: "products", filename: file.name });
      setForm((current) => ({ ...current, image: result.value }));
    } catch (reason) { alert(reason instanceof Error ? reason.message : "Image upload failed."); }
    setUploading(false);
    event.target.value = "";
  }

  async function save() {
    if (!form.title.trim()) return alert("Product name required");
    if (!form.category) return alert("Select a category");
    setSaving(true);
    const slugBase = `${form.category}-${form.title}-${form.grain_type}-${form.sizes}`;
    const payload = {
      title: form.title.trim(),
      slug: editing ? products.find((item) => item.id === editing)?.slug || slugify(slugBase) : slugify(slugBase),
      subtitle: form.packaging_type,
      category: form.category,
      description: form.description,
      short_description: `${form.grain_type} · ${form.packaging_type} · ${form.sizes}`,
      image: form.image,
      moq: "On request",
      packaging: form.packaging_type,
      status: form.status,
      grain_type: form.grain_type,
      sizes: form.sizes,
      packaging_type: form.packaging_type,
      display_order: Number(form.display_order) || 0,
      updated_at: new Date().toISOString(),
    };
    const result = editing
      ? await supabase.from("products").update(payload).eq("id", editing)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (result.error) return alert(result.error.message);
    reset();
    await load();
    window.dispatchEvent(new Event("salt-cms-updated"));
  }

  async function toggle(product: Product) {
    const result = await supabase.from("products").update({ status: isVisible(product.status) ? "draft" : "active", updated_at: new Date().toISOString() }).eq("id", product.id);
    if (result.error) return alert(result.error.message);
    await load();
    window.dispatchEvent(new Event("salt-cms-updated"));
  }

  async function remove(id: number) {
    if (!confirm("Delete this product?")) return;
    const result = await supabase.from("products").delete().eq("id", id);
    if (result.error) return alert(result.error.message);
    await load();
  }

  async function syncApprovedCatalog() {
    setSyncing(true);
    try {
      const categoryRows = APPROVED_PRODUCT_CATEGORIES.map((category) => ({ ...category, status: "active", updated_at: new Date().toISOString() }));
      const categoryResult = await supabase.from("categories").upsert(categoryRows, { onConflict: "slug", ignoreDuplicates: true });
      if (categoryResult.error) throw categoryResult.error;
      const productRows = APPROVED_PRODUCT_SHEET.map((product) => ({ ...product, updated_at: new Date().toISOString() }));
      const productResult = await supabase.from("products").upsert(productRows, { onConflict: "slug", ignoreDuplicates: true });
      if (productResult.error) throw productResult.error;
      await load();
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert("Missing approved products added. Existing edited products were not overwritten.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Product sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AdminShell>
      <div className="os-page legacy-unified-page product-manager-simple">
        <header className="enterprise-page-header">
          <div><p className="enterprise-kicker">Product Catalog</p><h1 className="cms-module-title">Products</h1><p className="module-subcopy">Category select karein, product add/edit karein aur visibility control karein. Full public detail page alag Product Pages module mein edit hota hai.</p></div>
          <div className="os-row-actions">
            <button className="secondary-enterprise-button" onClick={() => void syncApprovedCatalog()} disabled={syncing}><Layers3 />{syncing ? "Syncing…" : "Sync Approved Sheet"}</button>
            <Link href="/admin/categories" className="secondary-enterprise-button">Categories</Link>
            <Link href="/admin/product-pages" className="cms-gradient-button">Product Pages</Link>
          </div>
        </header>

        <section className="executive-card compact-product-form">
          <div className="compact-product-form__head"><div><h2>{editing ? "Edit Product" : "Add Product"}</h2><p>Sirf storefront card ke zaroori fields. Detailed page baad mein Product Pages se banayein.</p></div>{editing ? <button className="secondary-enterprise-button" onClick={reset}><X />Cancel</button> : null}</div>
          <div className="compact-product-fields">
            <label><span>Product Name</span><input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} placeholder="e.g. PET Shaker" /></label>
            <label><span>Category</span><select value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}><option value="">Select category</option>{categoryOptions.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
            <label><span>Form / Grain</span><input value={form.grain_type} onChange={(e) => setForm((c) => ({ ...c, grain_type: e.target.value }))} placeholder="Extra Fine Powder / Coarse" /></label>
            <label><span>Packaging</span><input value={form.packaging_type} onChange={(e) => setForm((c) => ({ ...c, packaging_type: e.target.value }))} placeholder="PET Shaker / PP Bag" /></label>
            <label><span>Pack Size(s)</span><input value={form.sizes} onChange={(e) => setForm((c) => ({ ...c, sizes: e.target.value }))} placeholder="250g, 500g" /></label>
            <label><span>Visibility</span><select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}><option value="active">Visible</option><option value="draft">Hidden</option></select></label>
            <label><span>Display Order</span><input type="number" value={form.display_order} onChange={(e) => setForm((c) => ({ ...c, display_order: e.target.value }))} /></label>
            <label className="wide"><span>Short Description</span><input value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="Short buyer-facing description" /></label>
            <label className="wide"><span>Product Image</span><div className="compact-image-row"><input value={form.image} onChange={(e) => setForm((c) => ({ ...c, image: e.target.value }))} placeholder="Image URL" /><label className="secondary-enterprise-button upload-compact"><ImagePlus />{uploading ? "Uploading…" : "Upload"}<input hidden type="file" accept="image/*" onChange={(e) => void upload(e)} /></label></div></label>
          </div>
          <div className="compact-product-actions"><button className="cms-gradient-button" onClick={() => void save()} disabled={saving || uploading}><Save />{saving ? "Saving…" : editing ? "Update Product" : "Add Product"}</button></div>
        </section>

        <section className="executive-card product-library-card">
          <div className="product-library-head">
            <div><h2>Products by Category</h2><p>{shown.length} products visible in this view</p></div>
            <div className="product-search"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" /></div>
          </div>
          <div className="product-category-tabs">
            <button className={categoryFilter === "all" ? "active" : ""} onClick={() => { setCategoryFilter("all"); if (!editing) setForm((c) => ({ ...c, category: "" })); }}>All Current Products</button>
            {categoryOptions.map((category) => <button key={category.slug} className={categoryFilter === category.slug ? "active" : ""} onClick={() => { setCategoryFilter(category.slug); if (!editing) setForm((c) => ({ ...c, category: category.slug })); }}>{category.name}</button>)}
          </div>

          {loading ? <div className="product-library-empty">Loading products…</div> : shown.length ? (
            <div className="admin-product-grid">
              {shown.map((product) => (
                <article className="admin-product-card" key={product.id}>
                  <div className="admin-product-card__image">{product.image ? <img src={product.image} alt="" /> : <span>No image</span>}</div>
                  <div className="admin-product-card__body">
                    <div className="admin-product-card__meta"><span>{categoryOptions.find((item) => item.slug === product.category)?.name || product.category}</span><b>{isVisible(product.status) ? "VISIBLE" : "HIDDEN"}</b></div>
                    <h3>{product.title}</h3>
                    <p><strong>{product.grain_type || "—"}</strong> · {product.packaging_type || product.packaging || "—"}</p>
                    <small>{product.sizes || "Size on request"}</small>
                  </div>
                  <div className="admin-product-card__actions">
                    <button onClick={() => edit(product)}><Edit3 />Edit</button>
                    <Link href={`/admin/products/${product.id}`}><Layers3 />Page</Link>
                    <button onClick={() => void toggle(product)}>{isVisible(product.status) ? <Eye /> : <EyeOff />}{isVisible(product.status) ? "Hide" : "Show"}</button>
                    <button className="danger" onClick={() => void remove(product.id)}><Trash2 /></button>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="product-library-empty"><h3>No products in this category yet.</h3><p>Add a product above, ya Sync Approved Sheet press karein.</p></div>}
        </section>

        <style jsx>{`
          .compact-product-form{margin-top:18px;padding:20px}.compact-product-form__head,.product-library-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.compact-product-form h2,.product-library-head h2{margin:0;font-size:26px}.compact-product-form p,.product-library-head p{margin:4px 0 0;color:var(--muted);font-size:12px}.compact-product-fields{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-top:16px}.compact-product-fields label{display:grid;gap:6px}.compact-product-fields label>span{font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}.compact-product-fields input,.compact-product-fields select{width:100%;border:1px solid var(--line);border-radius:11px;background:var(--surface);color:var(--text);padding:11px 12px}.compact-product-fields .wide{grid-column:span 2}.compact-image-row{display:grid;grid-template-columns:1fr auto;gap:8px}.upload-compact{cursor:pointer}.compact-product-actions{margin-top:14px;display:flex;justify-content:flex-end}
          .product-library-card{margin-top:18px;padding:0;overflow:hidden}.product-library-head{padding:20px;border-bottom:1px solid var(--line)}.product-search{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:11px;padding:0 11px;background:var(--surface)}.product-search :global(svg){width:15px}.product-search input{border:0;background:transparent;padding:11px;outline:0;color:var(--text)}.product-category-tabs{display:flex;gap:7px;flex-wrap:wrap;padding:14px 20px;border-bottom:1px solid var(--line)}.product-category-tabs button{border:1px solid var(--line);border-radius:999px;padding:8px 12px;background:var(--surface);font-size:10px;font-weight:800;color:var(--text)}.product-category-tabs button.active{background:#a7193f;border-color:#a7193f;color:#fff}
          .admin-product-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:18px}.admin-product-card{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--surface);display:grid;grid-template-rows:150px auto auto}.admin-product-card__image{background:var(--surface-2);display:grid;place-items:center;color:var(--muted);font-size:11px}.admin-product-card__image img{width:100%;height:100%;object-fit:contain;padding:10px}.admin-product-card__body{padding:14px}.admin-product-card__meta{display:flex;justify-content:space-between;gap:8px;font-size:8px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}.admin-product-card__meta b{color:#a7193f}.admin-product-card h3{margin:8px 0 7px;font-size:20px;color:#a7193f}.admin-product-card p{margin:0;color:var(--text);font-size:11px}.admin-product-card small{display:block;margin-top:5px;color:var(--muted)}.admin-product-card__actions{display:flex;gap:5px;padding:10px 14px 14px;border-top:1px solid var(--line)}.admin-product-card__actions button,.admin-product-card__actions :global(a){display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--text);padding:7px 9px;font-size:9px;font-weight:800;text-decoration:none}.admin-product-card__actions :global(svg){width:13px;height:13px}.admin-product-card__actions .danger{margin-left:auto;color:#b4233d}.product-library-empty{padding:48px;text-align:center;color:var(--muted)}.product-library-empty h3{color:var(--text);margin:0 0 5px}
          @media(max-width:1100px){.compact-product-fields{grid-template-columns:repeat(2,1fr)}.admin-product-grid{grid-template-columns:repeat(2,1fr)}}
          @media(max-width:680px){.compact-product-fields,.admin-product-grid{grid-template-columns:1fr}.compact-product-fields .wide{grid-column:auto}.compact-product-form__head,.product-library-head{flex-direction:column}.product-search{width:100%}.product-search input{width:100%}}
        `}</style>
      </div>
    </AdminShell>
  );
}
