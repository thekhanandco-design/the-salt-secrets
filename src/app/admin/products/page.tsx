"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

type Product = {
  id: number;
  title: string;
  slug: string;
  category: string;
  description: string;
  image: string;
  moq: string;
  packaging: string;
  status: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [moq, setMoq] = useState("");
  const [packaging, setPackaging] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    setProducts((data as Product[]) || []);
    setLoading(false);
  }

  async function uploadImage(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    try {
      setUploading(true);

      const file = e.target.files?.[0];

      if (!file) return;

      const fileName = `${Date.now()}-${file.name}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (error) {
        alert(error.message);
        return;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setImage(data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setCategory("");
    setDescription("");
    setImage("");
    setMoq("");
    setPackaging("");
  }

  async function addProduct() {
    const { error } = await supabase
      .from("products")
      .insert([
        {
          title,
          slug,
          category,
          description,
          image,
          moq,
          packaging,
          status: "active",
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    resetForm();
    loadProducts();
    alert("Product Added");
  }

  async function updateProduct() {
    if (!editingId) return;

    const { error } = await supabase
      .from("products")
      .update({
        title,
        slug,
        category,
        description,
        image,
        moq,
        packaging,
      })
      .eq("id", editingId);

    if (error) {
      alert(error.message);
      return;
    }

    resetForm();
    loadProducts();
    alert("Product Updated");
  }

  function editProduct(item: Product) {
    setEditingId(item.id);

    setTitle(item.title || "");
    setSlug(item.slug || "");
    setCategory(item.category || "");
    setDescription(item.description || "");
    setImage(item.image || "");
    setMoq(item.moq || "");
    setPackaging(item.packaging || "");
  }

  async function deleteProduct(id: number) {
    const ok = confirm(
      "Delete Product?"
    );

    if (!ok) return;

    await supabase
      .from("products")
      .delete()
      .eq("id", id);

    loadProducts();
  }

  return (
    <main className="min-h-screen bg-[#FFF8F5] p-6 lg:p-10">
      <div className="max-w-[1600px] mx-auto">

        <h1 className="text-4xl font-black text-[#081325] mb-8">
          Products CMS
        </h1>

        <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-6 mb-8">

          <div className="grid md:grid-cols-2 gap-4">

            <input
              placeholder="Product Title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className="border rounded-xl p-4"
            />

            <input
              placeholder="Slug"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value)
              }
              className="border rounded-xl p-4"
            />

            <input
              placeholder="Category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="border rounded-xl p-4"
            />

            <input
              placeholder="MOQ"
              value={moq}
              onChange={(e) =>
                setMoq(e.target.value)
              }
              className="border rounded-xl p-4"
            />
            <input
              placeholder="Packaging"
              value={packaging}
              onChange={(e) =>
                setPackaging(e.target.value)
              }
              className="border rounded-xl p-4"
            />

            <input
              type="file"
              onChange={uploadImage}
              className="border rounded-xl p-4"
            />

          </div>

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            className="border rounded-xl p-4 mt-4 w-full h-32"
          />

          {image && (
            <img
              src={image}
              alt=""
              className="w-32 h-32 object-cover rounded-xl mt-4"
            />
          )}

          <div className="flex gap-3 mt-6">

            <button
              onClick={
                editingId
                  ? updateProduct
                  : addProduct
              }
              disabled={uploading}
              className="bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-bold"
            >
              {editingId
                ? "Update Product"
                : uploading
                ? "Uploading..."
                : "Add Product"}
            </button>

            {editingId && (
              <button
                onClick={resetForm}
                className="bg-slate-500 text-white px-8 py-4 rounded-xl font-bold"
              >
                Cancel
              </button>
            )}

          </div>

        </div>

        {/* PRODUCTS TABLE */}

        <div className="bg-white border border-[#EFE3E5] rounded-[24px] overflow-hidden">

          {loading ? (
            <div className="p-10 text-center">
              Loading...
            </div>
          ) : (
            <table className="w-full">

              <thead>
                <tr className="bg-[#FFF4F5]">
                  <th className="p-4 text-left">
                    Image
                  </th>

                  <th className="p-4 text-left">
                    Title
                  </th>

                  <th className="p-4 text-left">
                    Category
                  </th>

                  <th className="p-4 text-left">
                    MOQ
                  </th>

                  <th className="p-4 text-left">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {products.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t"
                  >
                    <td className="p-4">

                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}

                    </td>

                    <td className="p-4">
                      {item.title}
                    </td>

                    <td className="p-4">
                      {item.category}
                    </td>

                    <td className="p-4">
                      {item.moq}
                    </td>

                    <td className="p-4">

                      <button
                        onClick={() =>
                          editProduct(item)
                        }
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg mr-2"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteProduct(item.id)
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                      >
                        Delete
                      </button>

                    </td>
                  </tr>
                ))}

              </tbody>

            </table>
          )}

        </div>

      </div>
    </main>
  );
}