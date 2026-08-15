"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { PRIVATE_LABEL_CATEGORY, PRIVATE_LABEL_PRODUCTS } from "@/lib/private-label-catalog";
import { Eye, EyeOff, ImagePlus, RefreshCw, Save } from "lucide-react";

type Product = {
  id: number;
  title: string;
  slug: string;
  grain_type?: string | null;
  packaging_type?: string | null;
  sizes?: string | null;
  image?: string | null;
  status?: string | null;
  display_order?: number | null;
};

const visible = (status?: string | null) => status === "active" || status === "published";

export default function PrivateLabelCatalogAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const result = await supabase.from("products").select("id,title,slug,grain_type,packaging_type,sizes,image,status,display_order").eq("category", "private-label-packaging").order("display_order");
    if (result.error) alert(result.error.message);
    setProducts((result.data || []) as Product[]);
    setLoading(false);
  }

  async function syncCatalog() {
    if (!confirm("Sync will restore the approved Private Label catalog defaults. Existing matching catalog records will be reset. Continue?")) return;
    setSyncing(true);
    try {
      const now = new Date().toISOString();
      const categoryResult = await supabase.from("categories").upsert({ ...PRIVATE_LABEL_CATEGORY, updated_at: now }, { onConflict: "slug" });
      if (categoryResult.error) throw categoryResult.error;
      const result = await supabase.from("products").upsert(PRIVATE_LABEL_PRODUCTS.map((item) => ({ ...item, updated_at: now })), { onConflict: "slug" });
      if (result.error) throw result.error;
      await load();
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert("Private Label catalog synced successfully.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Private Label sync failed");
    } finally {
      setSyncing(false);
    }
  }

  function patch(id: number, changes: Partial<Product>) {
    setProducts((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  async function save(product: Product) {
    setSavingId(product.id);
    const result = await supabase.from("products").update({
      title: product.title,
      grain_type: product.grain_type || "",
      packaging_type: product.packaging_type || "",
      packaging: product.packaging_type || "",
      sizes: product.sizes || "",
      image: product.image || "",
      display_order: Number(product.display_order) || 0,
      updated_at: new Date().toISOString(),
    }).eq("id", product.id);
    setSavingId(null);
    if (result.error) return alert(result.error.message);
    window.dispatchEvent(new Event("salt-cms-updated"));
  }

  async function toggle(product: Product) {
    const result = await supabase.from("products").update({ status: visible(product.status) ? "draft" : "active", updated_at: new Date().toISOString() }).eq("id", product.id);
    if (result.error) return alert(result.error.message);
    patch(product.id, { status: visible(product.status) ? "draft" : "active" });
    window.dispatchEvent(new Event("salt-cms-updated"));
  }

  async function upload(product: Product, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingId(product.id);
    const path = `private-label/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const result = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (result.error) alert(result.error.message);
    else {
      const url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      patch(product.id, { image: url });
      await supabase.from("products").update({ image: url, updated_at: new Date().toISOString() }).eq("id", product.id);
      window.dispatchEvent(new Event("salt-cms-updated"));
    }
    setUploadingId(null);
    event.target.value = "";
  }

  const groups = useMemo(() => ["Extra Fine Powder", "Coarse (2–5mm)"].map((grain) => ({ grain, products: products.filter((item) => item.grain_type === grain) })), [products]);

  return <AdminShell>
    <div className="os-page legacy-unified-page">
      <header className="enterprise-page-header">
        <div><p className="enterprise-kicker">Private Label</p><h1 className="cms-module-title">Private Label Catalog</h1><p className="module-subcopy">Sync approved packaging formats, then edit text, sizes, image and visibility. These records feed the public Private Label page.</p></div>
        <button className="cms-gradient-button" onClick={() => void syncCatalog()} disabled={syncing}><RefreshCw/>{syncing ? "Syncing…" : "Sync / Reset Catalog"}</button>
      </header>

      {!products.length && !loading ? <section className="executive-card" style={{padding:28,textAlign:"center"}}><h2>No Private Label catalog synced yet</h2><p>Press Sync / Reset Catalog once to create the approved packaging records.</p></section> : null}

      {groups.map((group) => <section className="executive-card" key={group.grain} style={{marginTop:18,padding:0,overflow:"hidden"}}>
        <div style={{padding:"18px 20px",borderBottom:"1px solid var(--line)"}}><h2 style={{margin:0}}>{group.grain}</h2><p style={{margin:"4px 0 0",color:"var(--muted)"}}>{group.products.length} packaging formats</p></div>
        <div className="pl-admin-grid">
          {group.products.map((product) => <article className="pl-admin-card" key={product.id}>
            <div className="pl-admin-image">{product.image ? <img src={product.image} alt=""/> : <span>No image</span>}</div>
            <div className="pl-admin-fields">
              <label><span>Product Name</span><input value={product.title} onChange={(e)=>patch(product.id,{title:e.target.value})}/></label>
              <label><span>Packaging</span><input value={product.packaging_type || ""} onChange={(e)=>patch(product.id,{packaging_type:e.target.value})}/></label>
              <label><span>Pack Sizes</span><input value={product.sizes || ""} onChange={(e)=>patch(product.id,{sizes:e.target.value})}/></label>
              <label><span>Order</span><input type="number" value={product.display_order || 0} onChange={(e)=>patch(product.id,{display_order:Number(e.target.value)})}/></label>
            </div>
            <div className="pl-admin-actions">
              <label className="secondary-enterprise-button"><ImagePlus/>{uploadingId === product.id ? "Uploading…" : "Replace Image"}<input type="file" accept="image/*" hidden onChange={(e)=>void upload(product,e)}/></label>
              <button className="secondary-enterprise-button" onClick={()=>void toggle(product)}>{visible(product.status)?<Eye/>:<EyeOff/>}{visible(product.status)?"Visible":"Hidden"}</button>
              <button className="cms-gradient-button" onClick={()=>void save(product)} disabled={savingId===product.id}><Save/>{savingId===product.id?"Saving…":"Save"}</button>
            </div>
          </article>)}
        </div>
      </section>)}
      <style jsx>{`
        .pl-admin-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:16px}.pl-admin-card{border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--surface)}.pl-admin-image{height:170px;background:var(--surface-2);display:grid;place-items:center}.pl-admin-image img{width:100%;height:100%;object-fit:contain;padding:12px}.pl-admin-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px}.pl-admin-fields label span{display:block;margin-bottom:5px;font-size:9px;font-weight:800;text-transform:uppercase;color:var(--muted)}.pl-admin-fields input{width:100%;border:1px solid var(--line);border-radius:9px;background:var(--surface-2);color:var(--text);padding:9px}.pl-admin-actions{display:flex;gap:7px;flex-wrap:wrap;padding:12px 14px 14px;border-top:1px solid var(--line)}.pl-admin-actions :global(button),.pl-admin-actions :global(label){font-size:9px}.pl-admin-actions :global(svg){width:13px;height:13px}@media(max-width:1100px){.pl-admin-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.pl-admin-grid{grid-template-columns:1fr}.pl-admin-fields{grid-template-columns:1fr}}
      `}</style>
    </div>
  </AdminShell>;
}
