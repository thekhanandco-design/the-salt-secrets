"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { adminUpload } from "@/lib/admin-client";
import { Check, Copy, Download, Eye, FileImage, FolderOpen, Grid2X2, Image as ImageIcon, List, Plus, RefreshCw, Search, Trash2, UploadCloud, X } from "lucide-react";

type MediaRow = {
  id: number | string;
  file_name: string;
  file_url: string;
  file_type?: string | null;
  alt_text?: string | null;
  folder?: string | null;
  file_size?: number | null;
  created_at?: string | null;
  storage_bucket?: string;
  storage_path?: string;
  source?: "library" | "website" | "product" | "category" | "blog";
  read_only?: boolean;
};

const folders = ["all", "social-library", "website", "blog", "products", "brand", "marketing", "certifications", "general"];
function readableSize(value?: number | null) {
  if (!value) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
function safeName(value: string) { return value.replace(/[^a-zA-Z0-9._-]+/g, "-"); }

export default function MediaLibraryPage() {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [folder, setFolder] = useState("all");
  const [uploadFolder, setUploadFolder] = useState("social-library");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<MediaRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [libraryResult, slotResult, productResult, categoryResult, blogResult] = await Promise.all([
      supabase.from("media_library").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("cms_image_slots").select("page_slug,section_slug,slot_key,current_url,default_url,alt_text,is_active").eq("is_active", true).limit(3000),
      supabase.from("products").select("id,title,slug,image,gallery,status").limit(2000),
      supabase.from("categories").select("id,name,slug,image,status").limit(500),
      supabase.from("blog_posts").select("id,title,slug,featured_image,status").limit(1000),
    ]);

    if (libraryResult.error) {
      setError(libraryResult.error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const manual = (libraryResult.data || []).map((row: Record<string, unknown>) => ({
      ...row,
      source: "library" as const,
      read_only: false,
      storage_bucket: String(row.storage_bucket || "cms-media"),
      storage_path: String(row.storage_path || `${row.folder || "general"}/${row.file_name || ""}`),
    })) as MediaRow[];

    const byUrl = new Map<string, MediaRow>();
    const normalizeUrl = (value: unknown) => String(value || "").trim().split("#")[0];
    manual.forEach((row) => { if (normalizeUrl(row.file_url)) byUrl.set(normalizeUrl(row.file_url), row); });
    const addLive = (row: MediaRow) => {
      const url = normalizeUrl(row.file_url);
      if (!url || url.startsWith("data:") || byUrl.has(url)) return;
      byUrl.set(url, row);
    };

    (slotResult.data || []).forEach((slot: Record<string, unknown>, index) => {
      const url = normalizeUrl(slot.current_url || slot.default_url);
      if (!url) return;
      addLive({ id: `website-${slot.page_slug}-${slot.section_slug}-${slot.slot_key}-${index}`, file_name: String(slot.slot_key || "website-image"), file_url: url, file_type: "Live website image", alt_text: String(slot.alt_text || ""), folder: String(slot.page_slug === "global" ? "brand" : "website"), source: "website", read_only: true });
    });

    (productResult.data || []).forEach((product: Record<string, unknown>, index) => {
      const title = String(product.title || product.slug || `Product ${index + 1}`);
      const main = normalizeUrl(product.image);
      if (main) addLive({ id: `product-${product.id}-main`, file_name: `${safeName(title)}-main`, file_url: main, file_type: "Product image", alt_text: title, folder: "products", source: "product", read_only: true });
      const gallery = Array.isArray(product.gallery) ? product.gallery : [];
      gallery.forEach((value, galleryIndex) => {
        const url = normalizeUrl(value);
        if (url) addLive({ id: `product-${product.id}-gallery-${galleryIndex}`, file_name: `${safeName(title)}-gallery-${galleryIndex + 1}`, file_url: url, file_type: "Product gallery", alt_text: `${title} gallery image ${galleryIndex + 1}`, folder: "products", source: "product", read_only: true });
      });
    });

    (categoryResult.data || []).forEach((category: Record<string, unknown>) => {
      const url = normalizeUrl(category.image);
      if (!url) return;
      const title = String(category.name || category.slug || "Product family");
      addLive({ id: `category-${category.id}`, file_name: `${safeName(title)}-category`, file_url: url, file_type: "Product family image", alt_text: title, folder: "products", source: "category", read_only: true });
    });

    (blogResult.data || []).forEach((post: Record<string, unknown>) => {
      const url = normalizeUrl(post.featured_image);
      if (!url) return;
      const title = String(post.title || post.slug || "Blog article");
      addLive({ id: `blog-${post.id}`, file_name: `${safeName(title)}-cover`, file_url: url, file_type: "Blog cover", alt_text: title, folder: "blog", source: "blog", read_only: true });
    });

    setRows(Array.from(byUrl.values()));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2500); return () => window.clearTimeout(timer); }, [toast]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true); setError("");
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image file.`);
        if (file.size > 12 * 1024 * 1024) throw new Error(`${file.name} exceeds the 12 MB upload limit.`);
        const storage = await adminUpload(file, "cms-image", { folder: uploadFolder, filename: file.name });
        const metadata = await supabase.from("media_library").insert({
          file_name: file.name,
          file_url: storage.value,
          file_type: storage.mime,
          alt_text: file.name.replace(/\.[^.]+$/, "").replaceAll("-", " ").replaceAll("_", " "),
          folder: uploadFolder,
          file_size: file.size,
          storage_bucket: storage.bucket,
          storage_path: storage.path,
        });
        if (metadata.error) {
          await supabase.storage.from(storage.bucket).remove([storage.path]);
          throw metadata.error;
        }
      }
      setFolder(uploadFolder); setToast(`${files.length} image${files.length === 1 ? "" : "s"} uploaded to ${uploadFolder}.`); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed."); }
    finally { setUploading(false); event.target.value = ""; }
  }

  async function copyUrl(row: MediaRow) {
    await navigator.clipboard.writeText(row.file_url); setToast("Image URL copied.");
  }
  async function remove(row: MediaRow) {
    if (row.read_only) { setError("This image is linked from the live website. Replace it from Visual Editor, Products, Blog Center or Images Manager instead of deleting it here."); return; }
    if (!window.confirm(`Delete ${row.file_name}?`)) return;
    setError("");
    const bucket = row.storage_bucket || "cms-media";
    const path = row.storage_path || `${row.folder || "general"}/${row.file_name}`;
    const storage = await supabase.storage.from(bucket).remove([path]);
    if (storage.error && !storage.error.message.toLowerCase().includes("not found")) { setError(storage.error.message); return; }
    const result = await supabase.from("media_library").delete().eq("id", row.id);
    if (result.error) setError(result.error.message); else { setSelected(null); setToast("Media file deleted."); await load(); }
  }
  async function updateAlt(row: MediaRow, altText: string) {
    if (row.read_only) { setError("This live-linked image is read-only here. Edit its alt text from the source page or Visual Editor."); return; }
    const result = await supabase.from("media_library").update({ alt_text: altText, updated_at: new Date().toISOString() }).eq("id", row.id);
    if (result.error) setError(result.error.message); else { setRows(previous => previous.map(item => item.id === row.id ? { ...item, alt_text: altText } : item)); setSelected(previous => previous?.id === row.id ? { ...previous, alt_text: altText } : previous); setToast("Alt text updated."); }
  }

  const visible = useMemo(() => rows.filter(row => (folder === "all" || (row.folder || "general") === folder) && `${row.file_name} ${row.alt_text || ""} ${row.folder || ""}`.toLowerCase().includes(query.toLowerCase())), [rows, folder, query]);
  const folderCounts = useMemo(() => Object.fromEntries(folders.map(value => [value, value === "all" ? rows.length : rows.filter(row => (row.folder || "general") === value).length])), [rows]);

  return <AdminShell><div className="os-page media-library-page">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Digital asset management</div><h1 className="os-page-title">Media Library</h1><p className="os-page-subtitle">One view of uploaded media plus images currently linked to the live website, product catalog and Journal. Live-linked assets stay read-only here so they cannot be deleted by accident.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/>Refresh</button><button className="os-btn primary" onClick={() => inputRef.current?.click()} disabled={uploading}><UploadCloud/>{uploading ? "Uploading…" : "Upload Images"}</button></div></header>

    {error && <section className="os-card media-error"><div className="os-card-body"><strong>Media action failed</strong><p>{error}</p></div></section>}

    <section className="os-card"><div className="os-card-body media-upload-strip"><div><strong>Upload destination</strong><span>Choose a folder before selecting one or multiple images.</span></div><select className="os-field" value={uploadFolder} onChange={event => setUploadFolder(event.target.value)}>{folders.filter(value => value !== "all").map(value => <option key={value}>{value}</option>)}</select><button className="os-btn primary" onClick={() => inputRef.current?.click()} disabled={uploading}><Plus/>Select Files</button><input ref={inputRef} hidden multiple type="file" accept="image/*" onChange={upload}/></div></section>

    <div className="media-library-shell">
      <aside className="os-card media-folders"><div className="os-card-header"><div><h2>Folders</h2><p>Live media records</p></div><FolderOpen/></div><div className="os-card-body">{folders.map(value => <button key={value} className={`media-folder ${folder === value ? "active" : ""}`} onClick={() => setFolder(value)}><span>{value === "all" ? "All Assets" : value.replaceAll("-", " ")}</span><b>{folderCounts[value] || 0}</b></button>)}</div></aside>
      <section className="os-card"><div className="os-card-header"><div><h2>{folder === "all" ? "All Assets" : folder.replaceAll("-", " ")}</h2><p>{visible.length} matching real files</p></div><div className="os-page-actions"><label className="os-search-field"><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search files or alt text…"/></label><div className="os-segmented"><button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2/></button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view"><List/></button></div></div></div>
        <div className="os-card-body">{loading ? <div className="os-empty"><div className="os-skeleton"/><div className="os-skeleton"/><div className="os-skeleton"/></div> : visible.length ? <div className={view === "grid" ? "media-asset-grid" : "media-asset-list"}>{visible.map(row => <article className="media-asset-card" key={row.id} onClick={() => setSelected(row)}><div className="media-asset-preview"><img src={row.file_url} alt={row.alt_text || row.file_name}/><span>{row.folder || "general"}</span></div><div className="media-asset-meta"><strong title={row.file_name}>{row.file_name}</strong><small>{row.file_type || "Image"} · {readableSize(row.file_size)}</small><p>{row.alt_text || "Alt text not set"}</p><div><button onClick={event => { event.stopPropagation(); void copyUrl(row); }}><Copy/>Copy URL</button><a onClick={event => event.stopPropagation()} href={row.file_url} download target="_blank" rel="noreferrer"><Download/>Open</a>{!row.read_only && <button className="danger" onClick={event => { event.stopPropagation(); void remove(row); }}><Trash2/>Delete</button>}</div></div></article>)}</div> : <div className="os-empty"><div className="os-empty-icon"><ImageIcon/></div><h3>No images in this folder</h3><p>Upload real files to begin building this media library.</p><button className="os-btn primary" onClick={() => inputRef.current?.click()}><UploadCloud/>Upload Images</button></div>}</div>
      </section>
    </div>

    {selected && <div className="os-drawer-backdrop" onMouseDown={() => setSelected(null)}><aside className="os-drawer media-detail-drawer" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><h2>Image Details</h2><p>{selected.folder || "general"}</p></div><button className="os-icon-button" onClick={() => setSelected(null)}><X/></button></div><div className="os-card-body"><img className="media-detail-image" src={selected.file_url} alt={selected.alt_text || selected.file_name}/><div className="os-list"><div className="os-list-row"><span className="os-list-icon"><FileImage/></span><div className="os-list-main"><strong>{selected.file_name}</strong><span>{selected.file_type || "Image"} · {readableSize(selected.file_size)}</span></div></div></div><label className="os-label"><span>Alt Text</span><textarea defaultValue={selected.alt_text || ""} id="media-alt-text"/></label>{selected.read_only ? <div className="media-live-source-note"><Check/><span>Live-linked asset. Replace/edit it from its source manager or Visual Editor.</span></div> : <button className="os-btn primary" onClick={() => void updateAlt(selected, (document.getElementById("media-alt-text") as HTMLTextAreaElement)?.value || "")}><Check/>Save Details</button>}<div className="os-grid two"><button className="os-btn soft" onClick={() => void copyUrl(selected)}><Copy/>Copy URL</button><a className="os-btn soft" href={selected.file_url} target="_blank" rel="noreferrer"><Eye/>Preview</a></div>{!selected.read_only && <button className="os-btn danger" onClick={() => void remove(selected)}><Trash2/>Delete File</button>}</div></aside></div>}
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><Check/></span><div><strong>{toast}</strong><span>The media library has been updated.</span></div></div></div>}
  </div></AdminShell>;
}
