"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";

type Category = { id: number; name: string; slug: string; description?: string; status?: string };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    const { data } = await supabase.from("categories").select("*").order("name", { ascending: true });
    setCategories((data as Category[]) || []);
  }

  function slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async function saveCategory() {
    if (!name.trim()) return alert("Category name required");
    const payload = { name: name.trim(), slug: slugify(name), description, status: "active" };
    const { error } = editingId
      ? await supabase.from("categories").update(payload).eq("id", editingId)
      : await supabase.from("categories").insert([payload]);
    if (error) return alert("Run supabase/cms-schema.sql first. " + error.message);
    setName(""); setDescription(""); setEditingId(null); loadCategories();
  }

  async function deleteCategory(id: number) {
    if (!confirm("Delete category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadCategories();
  }

  return (
    <AdminShell>
      <div className="space-y-8">
        <div>
          <p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">Categories</p>
          <h1 className="text-4xl lg:text-5xl font-black mt-2">Product Categories</h1>
        </div>
        <div className="rounded-[28px] bg-white border border-[#EFE3E5] p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category Name" className="border rounded-xl p-4" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="border rounded-xl p-4" />
          </div>
          <button onClick={saveCategory} className="mt-5 bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-black">{editingId ? "Update Category" : "Add Category"}</button>
        </div>
        <div className="rounded-[28px] bg-white border border-[#EFE3E5] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FFF4F5]"><tr><th className="p-4 text-left">Name</th><th className="p-4 text-left">Slug</th><th className="p-4 text-left">Actions</th></tr></thead>
            <tbody>
              {categories.map((item) => <tr key={item.id} className="border-t border-[#EFE3E5]"><td className="p-4 font-black">{item.name}</td><td className="p-4">{item.slug}</td><td className="p-4"><button onClick={() => { setEditingId(item.id); setName(item.name); setDescription(item.description || ""); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg mr-2">Edit</button><button onClick={() => deleteCategory(item.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button></td></tr>)}
              {categories.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-slate-500">No categories yet. Run schema SQL if save fails.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
