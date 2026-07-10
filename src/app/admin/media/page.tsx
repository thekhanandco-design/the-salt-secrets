"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";

type MediaFile = { name: string; id?: string; updated_at?: string; created_at?: string; metadata?: { size?: number } };

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    setLoading(true);
    const { data, error } = await supabase.storage.from("product-images").list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) console.error(error);
    setFiles((data as MediaFile[]) || []);
    setLoading(false);
  }

  function publicUrl(name: string) {
    return supabase.storage.from("product-images").getPublicUrl(name).data.publicUrl;
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;
      const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const fileName = `${Date.now()}-${cleanName}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, file);
      if (error) {
        alert(error.message);
        return;
      }
      await loadFiles();
    } finally {
      setUploading(false);
    }
  }

  async function copyUrl(name: string) {
    const url = publicUrl(name);
    await navigator.clipboard.writeText(url);
    setCopied(name);
    setTimeout(() => setCopied(""), 2000);
  }

  async function deleteFile(name: string) {
    if (!confirm("Delete this media file?")) return;
    const { error } = await supabase.storage.from("product-images").remove([name]);
    if (error) {
      alert(error.message);
      return;
    }
    loadFiles();
  }

  return (
    <AdminShell>
      <div className="space-y-8">
        <div>
          <p className="uppercase tracking-[5px] text-[#C23B4A] font-black text-xs">Media Library</p>
          <h1 className="text-4xl lg:text-5xl font-black mt-2">Upload Images</h1>
          <p className="text-slate-600 mt-3">Upload product, homepage and certification images. Copy URL and use in CMS fields.</p>
        </div>

        <div className="rounded-[28px] bg-white border border-[#EFE3E5] p-6">
          <label className="block font-black mb-3">Upload New Image</label>
          <input type="file" onChange={uploadFile} className="border rounded-xl p-4 w-full" />
          {uploading && <p className="mt-3 text-[#C23B4A] font-bold">Uploading...</p>}
        </div>

        <div className="rounded-[28px] bg-white border border-[#EFE3E5] p-6">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid md:grid-cols-3 xl:grid-cols-5 gap-5">
              {files.map((file) => (
                <div key={file.name} className="rounded-2xl border border-[#EFE3E5] bg-[#FFF8F5] p-4">
                  <img src={publicUrl(file.name)} alt="" className="h-36 w-full object-contain rounded-xl bg-white" />
                  <p className="mt-3 text-xs font-bold break-all">{file.name}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => copyUrl(file.name)} className="bg-[#C23B4A] text-white px-3 py-2 rounded-lg text-xs font-black">{copied === file.name ? "Copied" : "Copy URL"}</button>
                    <button onClick={() => deleteFile(file.name)} className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-black">Delete</button>
                  </div>
                </div>
              ))}
              {files.length === 0 && <p className="text-slate-500">No media uploaded yet.</p>}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
