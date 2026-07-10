"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";

type Product = {
  id: number;
  created_at?: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  image: string;
  moq: string;
  packaging: string;
  status: string;
};

const emptyProduct = {
  title: "",
  slug: "",
  category: "",
  description: "",
  image: "",
  moq: "",
  packaging: "",
  status: "active",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
    }

    setProducts((data as Product[]) || []);
    setLoading(false);
  }

  function setField(field: keyof typeof emptyProduct, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const fileName = `${Date.now()}-${cleanName}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: false });

      if (error) {
        alert(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setField("image", data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyProduct);
  }

  async function saveProduct() {
    if (!form.title.trim()) {
      alert("Product title is required");
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || createSlug(form.title),
      category: form.category.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      moq: form.moq.trim(),
      packaging: form.packaging.trim(),
      status: form.status || "active",
    };

    setSaving(true);

    const { error } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert([payload]);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    resetForm();
    loadProducts();
    alert(editingId ? "Product updated" : "Product added");
  }

  function editProduct(item: Product) {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      slug: item.slug || "",
      category: item.category || "",
      description: item.description || "",
      image: item.image || "",
      moq: item.moq || "",
      packaging: item.packaging || "",
      status: item.status || "active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(id: number) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    loadProducts();
  }

  async function toggleStatus(item: Product) {
    const nextStatus = item.status === "active" ? "draft" : "active";
    const { error } = await supabase
      .from("products")
      .update({ status: nextStatus })
      .eq("id", item.id);

    if (error) {
      alert(error.message);
      return;
    }
    loadProducts();
  }

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((item) => {
      return (
        item.title?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.slug?.toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  return (
    <AdminShell>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">Products CMS</p>
            <h1 className="text-4xl lg:text-5xl font-black mt-2">Manage Products</h1>
            <p className="text-slate-600 mt-3">Add, edit, hide/show and upload product images without touching code.</p>
          </div>
          <Link href="/products" target="_blank" className="rounded-xl border border-[#C23B4A] text-[#C23B4A] px-6 py-4 font-black w-fit">View Products Page</Link>
        </div>

        <section className="rounded-[28px] bg-white border border-[#EFE3E5] p-6">
          <h2 className="text-2xl font-black mb-5">{editingId ? "Edit Product" : "Add New Product"}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input placeholder="Product Title" value={form.title} onChange={(e) => setField("title", e.target.value)} className="border rounded-xl p-4" />
            <input placeholder="Slug (auto if empty)" value={form.slug} onChange={(e) => setField("slug", e.target.value)} className="border rounded-xl p-4" />
            <input placeholder="Category e.g. Retail Packaging" value={form.category} onChange={(e) => setField("category", e.target.value)} className="border rounded-xl p-4" />
            <input placeholder="MOQ e.g. 1200 pcs" value={form.moq} onChange={(e) => setField("moq", e.target.value)} className="border rounded-xl p-4" />
            <input placeholder="Packaging e.g. PET Bottle / Pouch" value={form.packaging} onChange={(e) => setField("packaging", e.target.value)} className="border rounded-xl p-4" />
            <select value={form.status} onChange={(e) => setField("status", e.target.value)} className="border rounded-xl p-4 bg-white">
              <option value="active">Active - show on website</option>
              <option value="draft">Draft - hide from website</option>
            </select>
            <input type="file" onChange={uploadImage} className="border rounded-xl p-4" />
            <input placeholder="Image URL" value={form.image} onChange={(e) => setField("image", e.target.value)} className="border rounded-xl p-4" />
          </div>

          <textarea placeholder="Description" value={form.description} onChange={(e) => setField("description", e.target.value)} className="border rounded-xl p-4 mt-4 w-full h-32" />

          {form.image && <img src={form.image} alt="" className="w-40 h-40 object-contain rounded-xl mt-4 bg-[#FFF8F5] border border-[#EFE3E5]" />}

          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={saveProduct} disabled={uploading || saving} className="bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-bold">
              {saving ? "Saving..." : uploading ? "Uploading..." : editingId ? "Update Product" : "Add Product"}
            </button>
            {editingId && <button onClick={resetForm} className="bg-slate-600 text-white px-8 py-4 rounded-xl font-bold">Cancel</button>}
          </div>
        </section>

        <section className="rounded-[28px] bg-white border border-[#EFE3E5] overflow-hidden">
          <div className="p-5 border-b border-[#EFE3E5] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-2xl font-black">Product List</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="border rounded-xl px-4 py-3 lg:w-96" />
          </div>

          {loading ? (
            <div className="p-10 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FFF4F5]">
                  <tr>
                    <th className="p-4 text-left">Image</th>
                    <th className="p-4 text-left">Title</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-left">MOQ</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((item) => (
                    <tr key={item.id} className="border-t border-[#EFE3E5]">
                      <td className="p-4">{item.image && <img src={item.image} alt="" className="w-16 h-16 rounded-lg object-contain bg-[#FFF8F5]" />}</td>
                      <td className="p-4 font-black">{item.title}</td>
                      <td className="p-4">{item.category}</td>
                      <td className="p-4">{item.moq}</td>
                      <td className="p-4"><button onClick={() => toggleStatus(item)} className="rounded-full bg-[#FFF2F4] text-[#C23B4A] px-3 py-1 text-xs font-black">{item.status || "active"}</button></td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => editProduct(item)} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Edit</button>
                          <Link href={`/products/${item.slug}`} target="_blank" className="bg-slate-700 text-white px-4 py-2 rounded-lg">View</Link>
                          <button onClick={() => deleteProduct(item.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && <tr><td className="p-10 text-center text-slate-500" colSpan={6}>No products found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
