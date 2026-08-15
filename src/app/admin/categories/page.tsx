"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { APPROVED_PRODUCT_CATEGORIES, APPROVED_PRODUCT_SHEET } from "@/lib/product-catalog";
import { Boxes, Edit3, Eye, EyeOff, ImagePlus, PackagePlus, Save, X } from "lucide-react";

type CategoryRow = {
  id?: number;
  name: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  status?: string | null;
  display_order?: number | null;
};

type CategoryForm = {
  name: string;
  subtitle: string;
  description: string;
  image: string;
  status: string;
};

function isVisible(status?: string | null) {
  return !status || status === "active" || status === "published";
}

export default function CategoriesPage() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<CategoryForm>({ name: "", subtitle: "", description: "", image: "", status: "active" });

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,slug,subtitle,description,image,status,display_order")
      .order("display_order");
    if (error) alert(error.message);
    setRows((data as CategoryRow[]) || []);
    setLoading(false);
  }

  const families = useMemo(() => APPROVED_PRODUCT_CATEGORIES.map((family) => ({
    ...family,
    ...(rows.find((row) => row.slug === family.slug) || {}),
  })), [rows]);

  async function ensureCategory(family: (typeof families)[number], status?: string) {
    const payload = {
      name: family.name,
      slug: family.slug,
      subtitle: family.subtitle || "",
      description: family.description || "",
      image: family.image || "",
      display_order: family.display_order,
      status: status || family.status || "active",
      updated_at: new Date().toISOString(),
    };
    const result = family.id
      ? await supabase.from("categories").update(payload).eq("id", family.id)
      : await supabase.from("categories").upsert(payload, { onConflict: "slug" });
    if (result.error) throw result.error;
  }

  async function manageProducts(family: (typeof families)[number]) {
    setWorking(`manage:${family.slug}`);
    try {
      await ensureCategory(family);
      const missingRows = APPROVED_PRODUCT_SHEET.filter((product) => product.category === family.slug).map((product) => ({ ...product, updated_at: new Date().toISOString() }));
      if (missingRows.length) {
        const result = await supabase.from("products").upsert(missingRows, { onConflict: "slug", ignoreDuplicates: true });
        if (result.error) throw result.error;
      }
      window.location.href = `/admin/products?category=${family.slug}`;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not open category products");
      setWorking(null);
    }
  }

  async function toggle(family: (typeof families)[number]) {
    setWorking(family.slug);
    try {
      await ensureCategory(family, isVisible(family.status) ? "hidden" : "active");
      await load();
      window.dispatchEvent(new Event("salt-cms-updated"));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not update category");
    } finally {
      setWorking(null);
    }
  }

  async function initializeAll() {
    setWorking("all");
    try {
      for (const family of families) await ensureCategory(family);
      await load();
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert("Product categories synchronized.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not synchronize categories");
    } finally {
      setWorking(null);
    }
  }

  function beginEdit(family: (typeof families)[number]) {
    setEditingSlug(family.slug);
    setForm({
      name: family.name,
      subtitle: family.subtitle || "",
      description: family.description || "",
      image: family.image || "",
      status: isVisible(family.status) ? "active" : "hidden",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadBanner(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editingSlug) return;
    setUploading(true);
    const path = `categories/${editingSlug}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const result = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (result.error) alert(result.error.message);
    else setForm((current) => ({ ...current, image: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl }));
    setUploading(false);
    event.target.value = "";
  }

  async function saveEdit() {
    const family = families.find((item) => item.slug === editingSlug);
    if (!family) return;
    setWorking(family.slug);
    const payload = {
      name: form.name.trim() || family.name,
      slug: family.slug,
      subtitle: form.subtitle.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      display_order: family.display_order,
      status: form.status,
      updated_at: new Date().toISOString(),
    };
    const result = family.id
      ? await supabase.from("categories").update(payload).eq("id", family.id)
      : await supabase.from("categories").upsert(payload, { onConflict: "slug" });
    setWorking(null);
    if (result.error) return alert(result.error.message);
    setEditingSlug(null);
    await load();
    window.dispatchEvent(new Event("salt-cms-updated"));
  }

  return (
    <AdminShell>
      <div className="os-page legacy-unified-page enterprise-page">
        <header className="enterprise-page-header">
          <div>
            <p className="enterprise-kicker">Products</p>
            <h1 className="cms-module-title">Product Categories</h1>
            <p className="module-subcopy">Yahan se six storefront families ka naam, short text, hero banner aur visibility manage karein. Manage Products se seedha us category ke products khulenge.</p>
          </div>
          <div className="os-row-actions">
            <button className="secondary-enterprise-button" onClick={() => void initializeAll()} disabled={Boolean(working)}><Boxes />Sync Categories</button>
            <Link href="/admin/products" className="cms-gradient-button"><Boxes />Products</Link>
            <Link href="/admin/product-pages" className="secondary-enterprise-button"><Edit3 />Product Pages</Link>
          </div>
        </header>

        {editingSlug ? (
          <section className="executive-card category-edit-panel">
            <div className="category-edit-heading">
              <div><span className="enterprise-kicker">Edit Category</span><h2>{form.name}</h2><p>Ye content category select hote hi Product page ke hero mein use hoga.</p></div>
              <button className="secondary-enterprise-button" onClick={() => setEditingSlug(null)}><X />Close</button>
            </div>
            <div className="category-edit-grid">
              <label><span>Category Name</span><input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} /></label>
              <label><span>Short Subtitle</span><input value={form.subtitle} onChange={(e) => setForm((c) => ({ ...c, subtitle: e.target.value }))} /></label>
              <label className="wide"><span>Hero / Category Description</span><textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} /></label>
              <label><span>Hero Banner URL</span><input value={form.image} onChange={(e) => setForm((c) => ({ ...c, image: e.target.value }))} /></label>
              <label><span>Visibility</span><select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}><option value="active">Visible</option><option value="hidden">Hidden</option></select></label>
            </div>
            <div className="category-edit-media">
              {form.image ? <img src={form.image} alt="Category banner preview" /> : <div>No banner selected</div>}
              <div className="os-row-actions">
                <label className="secondary-enterprise-button upload-button"><ImagePlus />{uploading ? "Uploading…" : "Upload / Replace Banner"}<input hidden type="file" accept="image/*" onChange={(e) => void uploadBanner(e)} /></label>
                <button className="cms-gradient-button" onClick={() => void saveEdit()} disabled={Boolean(working) || uploading}><Save />{working ? "Saving…" : "Save Category"}</button>
              </div>
            </div>
          </section>
        ) : null}

        {loading ? <section className="executive-card category-loading">Loading categories…</section> : (
          <section className="fixed-category-grid">
            {families.map((family) => {
              const visible = isVisible(family.status);
              return (
                <article key={family.slug} className={`executive-card fixed-category-card ${visible ? "is-visible" : "is-hidden"}`}>
                  <div className="fixed-category-visual"><img src={family.image || "/hero-products.png"} alt={`${family.name} category`} /><span className="fixed-category-index">0{family.display_order}</span></div>
                  <div className="fixed-category-copy">
                    <div className="fixed-category-meta"><span>{family.slug}</span><b>{visible ? "VISIBLE" : "HIDDEN"}</b></div>
                    <h2>{family.name}</h2><strong>{family.subtitle}</strong><p>{family.description}</p>
                  </div>
                  <div className="fixed-category-actions category-actions-three">
                    <button onClick={() => beginEdit(family)} className="secondary-enterprise-button"><Edit3 />Edit</button>
                    <button onClick={() => void manageProducts(family)} disabled={working === `manage:${family.slug}`} className="cms-gradient-button"><PackagePlus />{working === `manage:${family.slug}` ? "Opening…" : "Products"}</button>
                    <button onClick={() => void toggle(family)} disabled={working === family.slug} className="secondary-enterprise-button">{visible ? <Eye /> : <EyeOff />}{working === family.slug ? "Saving…" : visible ? "Visible" : "Hidden"}</button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <style jsx>{`
          .category-loading{margin-top:20px;padding:42px;text-align:center;color:var(--muted)}
          .fixed-category-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:20px}
          .fixed-category-card{padding:0;overflow:hidden;transition:transform .2s ease,opacity .2s ease}.fixed-category-card:hover{transform:translateY(-3px)}.fixed-category-card.is-hidden{opacity:.55}
          .fixed-category-visual{height:170px;position:relative;display:grid;place-items:center;background:linear-gradient(145deg,#fff8f8,#f8e9ec);overflow:hidden}.fixed-category-visual>img{width:100%;height:100%;object-fit:contain;padding:14px}.fixed-category-index{position:absolute;left:16px;bottom:14px;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#a7193f;font-weight:900;box-shadow:0 8px 24px rgba(85,25,45,.14)}
          .fixed-category-copy{padding:20px 20px 12px}.fixed-category-meta{display:flex;align-items:center;justify-content:space-between;font-size:9px;letter-spacing:.08em;color:var(--muted)}.fixed-category-meta b{font-size:9px;color:#a7193f}.fixed-category-copy h2{margin:10px 0 3px;font-size:25px}.fixed-category-copy strong{font-size:11px;color:#bd3e63}.fixed-category-copy p{min-height:54px;margin:10px 0 0;color:var(--muted);font-size:12px;line-height:1.55}
          .fixed-category-actions{display:flex;gap:8px;padding:14px 20px 20px;border-top:1px solid var(--line)}.fixed-category-actions :global(a),.fixed-category-actions button{flex:1;justify-content:center}.fixed-category-actions :global(svg){width:14px;height:14px}
          .category-edit-panel{margin-top:20px;padding:22px}.category-edit-heading{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.category-edit-heading h2{margin:5px 0 4px;font-size:27px}.category-edit-heading p{margin:0;color:var(--muted);font-size:12px}.category-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.category-edit-grid label{display:grid;gap:6px}.category-edit-grid label span{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.category-edit-grid input,.category-edit-grid textarea,.category-edit-grid select{width:100%;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--text);padding:12px}.category-edit-grid textarea{min-height:82px;resize:vertical}.category-edit-grid .wide{grid-column:1/-1}.category-edit-media{display:grid;grid-template-columns:minmax(220px,420px) 1fr;gap:16px;align-items:end;margin-top:16px}.category-edit-media>img,.category-edit-media>div:first-child{width:100%;height:160px;object-fit:cover;border-radius:16px;background:var(--surface-2);display:grid;place-items:center}.upload-button{cursor:pointer}
          @media(max-width:1050px){.fixed-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
          @media(max-width:720px){.fixed-category-grid{grid-template-columns:1fr}.category-edit-grid,.category-edit-media{grid-template-columns:1fr}.category-edit-heading{flex-direction:column}.category-actions-three{flex-direction:column}}
        `}</style>
      </div>
    </AdminShell>
  );
}
