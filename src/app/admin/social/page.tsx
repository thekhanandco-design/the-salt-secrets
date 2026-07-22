"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import {
  Building2, CalendarClock, CheckCircle2, ExternalLink, Image as ImageIcon, Link2,
  MessagesSquare, Music2, Save, Send, Share2, Sparkles, Upload, Video,
} from "lucide-react";

type ScheduledPost = {
  id: string; caption: string; hashtags: string; keywords: string; image_url: string;
  platforms: string[]; scheduled_at: string; status: string; created_at: string;
};
type SocialLink = {
  id?: number; platform: string; label: string; url: string; enabled: boolean; display_order: number;
};

const platforms = [
  { id: "facebook", label: "Facebook", Icon: Building2 },
  { id: "instagram", label: "Instagram", Icon: Share2 },
  { id: "linkedin", label: "LinkedIn", Icon: MessagesSquare },
  { id: "tiktok", label: "TikTok", Icon: Music2 },
  { id: "youtube", label: "YouTube", Icon: Video },
  { id: "pinterest", label: "Pinterest", Icon: ImageIcon },
  { id: "x", label: "X / Twitter", Icon: MessagesSquare },
];

const defaultLinks: SocialLink[] = platforms.map((item, index) => ({
  platform: item.id, label: item.label, url: "", enabled: true, display_order: index + 1,
}));

export default function SocialMediaPage() {
  const [active, setActive] = useState<"profiles" | "publisher">("profiles");
  const [links, setLinks] = useState<SocialLink[]>(defaultLinks);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [keywords, setKeywords] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selected, setSelected] = useState<string[]>(["facebook", "instagram", "linkedin"]);
  const [queue, setQueue] = useState<ScheduledPost[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    const [{ data: queueRows }, { data: linkRows }] = await Promise.all([
      supabase.from("social_scheduled_posts").select("*").order("scheduled_at", { ascending: true }),
      supabase.from("social_links").select("*").order("display_order"),
    ]);
    setQueue((queueRows as ScheduledPost[]) || []);
    if (linkRows?.length) {
      const byPlatform = new Map((linkRows as SocialLink[]).map((item) => [item.platform, item]));
      setLinks(defaultLinks.map((fallback) => byPlatform.get(fallback.platform) || fallback));
    }
  }

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function updateLink(platform: string, patch: Partial<SocialLink>) {
    setLinks((current) => current.map((item) => item.platform === platform ? { ...item, ...patch } : item));
  }

  async function saveProfileLinks() {
    setSavingLinks(true);
    const rows = links.map(({ id, ...item }) => item);
    const { error } = await supabase.from("social_links").upsert(rows, { onConflict: "platform" });
    setSavingLinks(false);
    if (error) return alert(error.message);
    alert("Social profile links saved.");
    await load();
  }

  async function generateCaption() {
    setGenerating(true);
    const response = await fetch("/api/social/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords, platforms: selected }),
    });
    const data = await response.json();
    setGenerating(false);
    if (!response.ok) return alert(data.error || "Caption generation failed");
    setCaption(data.caption || "");
    setHashtags((data.hashtags || []).join(" "));
  }

  async function upload(file: File) {
    const extension = file.name.split(".").pop();
    const path = `social/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("cms-media").upload(path, file, { upsert: false });
    if (error) return alert(error.message);
    const { data } = supabase.storage.from("cms-media").getPublicUrl(path);
    setImageUrl(data.publicUrl);
  }

  async function schedule() {
    if (!caption.trim() || !scheduledAt || !selected.length) {
      return alert("Caption, schedule time and at least one platform are required.");
    }
    setSaving(true);
    const { error } = await supabase.from("social_scheduled_posts").insert({
      caption, hashtags, keywords, image_url: imageUrl, platforms: selected,
      scheduled_at: new Date(scheduledAt).toISOString(), status: "scheduled",
    });
    setSaving(false);
    if (error) return alert(error.message);
    setCaption(""); setHashtags(""); setKeywords(""); setImageUrl(""); setScheduledAt("");
    await load();
  }

  const upcoming = useMemo(() => queue.filter((item) => item.status === "scheduled"), [queue]);
  const connected = links.filter((item) => item.enabled && item.url.trim()).length;

  return (
    <AdminShell>
      <div className="social-studio-v10">
        <header className="page-hero-v10">
          <div>
            <span>Audience & distribution</span>
            <h1>Social Media Studio</h1>
            <p>Manage public profile links and prepare one campaign for every connected channel.</p>
          </div>
          <div className="hero-metrics-v10">
            <div><strong>{connected}</strong><small>Profiles connected</small></div>
            <div><strong>{upcoming.length}</strong><small>Scheduled posts</small></div>
          </div>
        </header>

        <nav className="workspace-tabs-v10">
          <button className={active === "profiles" ? "active" : ""} onClick={() => setActive("profiles")}>
            <Link2 /> Profile Links
          </button>
          <button className={active === "publisher" ? "active" : ""} onClick={() => setActive("publisher")}>
            <CalendarClock /> Publishing Studio
          </button>
        </nav>

        {active === "profiles" && (
          <section className="surface-v10">
            <div className="section-head-v10">
              <div><span>Website connections</span><h2>Social profile links</h2><p>These links can be used by the website footer, contact areas and campaign workspace.</p></div>
              <button className="primary-v10" onClick={saveProfileLinks} disabled={savingLinks}><Save />{savingLinks ? "Saving..." : "Save all links"}</button>
            </div>
            <div className="profile-grid-v10">
              {links.map((item) => {
                const meta = platforms.find((platform) => platform.id === item.platform);
                const Icon = meta?.Icon || Link2;
                return (
                  <article key={item.platform} className="profile-card-v10">
                    <div className="profile-icon-v10"><Icon /></div>
                    <div className="profile-copy-v10">
                      <strong>{item.label}</strong>
                      <small>{item.url ? "Public profile connected" : "Add your public profile URL"}</small>
                    </div>
                    <label className="switch-v10"><input type="checkbox" checked={item.enabled} onChange={(event) => updateLink(item.platform, { enabled: event.target.checked })}/><i /></label>
                    <input value={item.url} onChange={(event) => updateLink(item.platform, { url: event.target.value })} placeholder={`https://${item.platform}.com/your-profile`} />
                    {item.url && <a href={item.url} target="_blank" rel="noreferrer"><ExternalLink /> Open profile</a>}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {active === "publisher" && (
          <>
            <div className="publisher-layout-v10">
              <section className="surface-v10 composer-v10">
                <div className="section-head-v10"><div><span>Campaign builder</span><h2>Create and schedule</h2></div><Sparkles /></div>
                <div className="platform-grid-v10">
                  {platforms.slice(0, 5).map(({ id, label, Icon }) => (
                    <button key={id} onClick={() => toggle(id)} className={selected.includes(id) ? "selected" : ""}>
                      <Icon /><span>{label}</span>{selected.includes(id) && <CheckCircle2 />}
                    </button>
                  ))}
                </div>
                <label>Campaign keywords<input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="Himalayan pink salt, private label, wholesale, export"/></label>
                <div className="caption-head-v10"><label>Caption</label><button onClick={generateCaption} disabled={generating}><Sparkles />{generating ? "Writing..." : "Generate with AI"}</button></div>
                <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Write a caption or let AI create it..." />
                <label>Hashtags<input value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="#himalayanpinksalt #privatelabel #wholesale"/></label>
                <div className="media-grid-v10">
                  <label className="upload-v10"><input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])}/>{imageUrl ? <img src={imageUrl} alt="Campaign preview"/> : <><Upload/><strong>Upload campaign image</strong><small>PNG, JPG or WebP</small></>}</label>
                  <label>Publish date and time<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)}/><small>Due posts are processed by the Vercel scheduler.</small></label>
                </div>
                <button className="primary-v10 schedule-v10" onClick={schedule} disabled={saving}><CalendarClock />{saving ? "Scheduling..." : "Schedule campaign"}</button>
              </section>

              <aside className="surface-v10 preview-v10">
                <div className="section-head-v10"><div><span>Live preview</span><h2>Campaign card</h2></div><ImageIcon /></div>
                <div className="post-preview-v10">
                  {imageUrl ? <img src={imageUrl} alt="Preview"/> : <div className="preview-empty-v10"><ImageIcon/><span>Your campaign image appears here</span></div>}
                  <div><strong>The Salt Origin</strong><p>{caption || "Your campaign caption appears here."}</p><small>{hashtags || "#hashtags"}</small></div>
                </div>
                <div className="info-note-v10"><Send/><div><strong>Official platform credentials required</strong><p>The schedule is saved now. Automatic publishing needs each platform's supported API credentials.</p></div></div>
              </aside>
            </div>

            <section className="surface-v10">
              <div className="section-head-v10"><div><span>Publishing queue</span><h2>Scheduled campaigns</h2></div><CalendarClock /></div>
              <div className="queue-v10">
                {queue.map((item) => (
                  <article key={item.id}>
                    {item.image_url ? <img src={item.image_url} alt=""/> : <div className="queue-thumb-v10"><ImageIcon /></div>}
                    <div><strong>{item.caption.slice(0, 100) || "Untitled campaign"}</strong><small>{item.platforms.join(" · ")}</small></div>
                    <time>{new Date(item.scheduled_at).toLocaleString()}</time>
                    <span className={`queue-status-v10 ${item.status}`}>{item.status}</span>
                  </article>
                ))}
                {!queue.length && <div className="empty-v10">No social campaigns scheduled yet.</div>}
              </div>
            </section>
          </>
        )}
      </div>
      <style jsx>{`
        .social-studio-v10{display:flex;flex-direction:column;gap:18px}.page-hero-v10{display:flex;justify-content:space-between;align-items:flex-end}.page-hero-v10>div:first-child>span,.section-head-v10 span{font-size:9px;text-transform:uppercase;letter-spacing:.26em;font-weight:900;color:var(--accent)}.page-hero-v10 h1{font-size:clamp(38px,4vw,58px);line-height:1;margin:9px 0}.page-hero-v10 p,.section-head-v10 p{font-size:12px;color:var(--muted);max-width:720px}.hero-metrics-v10{display:flex;gap:10px}.hero-metrics-v10 div{min-width:130px;border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:13px}.hero-metrics-v10 strong{font-size:22px;display:block}.hero-metrics-v10 small{font-size:9px;color:var(--muted)}.workspace-tabs-v10{display:flex;gap:7px;border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:5px}.workspace-tabs-v10 button{display:flex;align-items:center;gap:8px;border-radius:11px;padding:12px 16px;font-size:11px;font-weight:850;color:var(--muted)}.workspace-tabs-v10 button.active{background:var(--text);color:var(--surface)}.workspace-tabs-v10 svg{width:16px}.surface-v10{background:var(--surface);border:1px solid var(--line);border-radius:22px;padding:22px}.section-head-v10{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.section-head-v10 h2{font-size:20px;margin:4px 0}.section-head-v10>svg{width:20px;color:var(--accent)}.primary-v10{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;background:linear-gradient(135deg,var(--accent),#a92e4e);color:#fff;padding:12px 16px;font-size:11px;font-weight:900;box-shadow:0 12px 25px rgba(194,59,90,.2)}.primary-v10 svg{width:16px}.profile-grid-v10{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.profile-card-v10{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:11px;align-items:center;border:1px solid var(--line);background:var(--surface-2);border-radius:17px;padding:14px}.profile-icon-v10{width:42px;height:42px;border-radius:13px;background:var(--surface);display:grid;place-items:center;color:var(--accent);border:1px solid var(--line)}.profile-icon-v10 svg{width:18px}.profile-copy-v10{display:flex;flex-direction:column}.profile-copy-v10 strong{font-size:12px}.profile-copy-v10 small{font-size:9px;color:var(--muted);margin-top:3px}.profile-card-v10 input:not([type=checkbox]){grid-column:1/-1;border:1px solid var(--line);background:var(--surface);border-radius:11px;padding:11px;font-size:11px;color:var(--text)}.profile-card-v10 a{grid-column:1/-1;display:inline-flex;align-items:center;gap:6px;color:var(--accent);font-size:10px;font-weight:800}.profile-card-v10 a svg{width:13px}.switch-v10 input{display:none}.switch-v10 i{display:block;width:38px;height:22px;border-radius:999px;background:var(--surface-3);position:relative}.switch-v10 i:after{content:"";position:absolute;width:16px;height:16px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 2px 7px rgba(0,0,0,.2);transition:.2s}.switch-v10 input:checked+i{background:var(--accent)}.switch-v10 input:checked+i:after{transform:translateX(16px)}.publisher-layout-v10{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:14px}.composer-v10 label{display:flex;flex-direction:column;gap:8px;font-size:10px;font-weight:800;color:var(--muted)}.composer-v10 input,.composer-v10 textarea{width:100%;border:1px solid var(--line);background:var(--surface-2);border-radius:12px;padding:12px;color:var(--text);font-size:11px}.composer-v10 textarea{min-height:150px;resize:vertical}.platform-grid-v10{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:15px}.platform-grid-v10 button{min-height:67px;border:1px solid var(--line);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font-size:9px;font-weight:800;color:var(--muted);position:relative}.platform-grid-v10 button.selected{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,var(--surface));color:var(--accent)}.platform-grid-v10 svg{width:17px}.platform-grid-v10 button svg:last-child{position:absolute;right:7px;top:7px;width:13px}.caption-head-v10{display:flex;justify-content:space-between;align-items:center;margin:15px 0 8px}.caption-head-v10 button{display:flex;align-items:center;gap:6px;color:var(--accent);font-size:10px;font-weight:850}.caption-head-v10 svg{width:14px}.media-grid-v10{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:15px}.upload-v10{min-height:154px;border:1px dashed color-mix(in srgb,var(--accent) 55%,var(--line));border-radius:15px;align-items:center;justify-content:center;text-align:center;overflow:hidden}.upload-v10 input{display:none}.upload-v10 img{width:100%;height:154px;object-fit:cover}.upload-v10 svg{width:22px;color:var(--accent)}.upload-v10 small{font-size:8px}.schedule-v10{margin-top:16px}.post-preview-v10{border:1px solid var(--line);border-radius:17px;overflow:hidden;background:var(--surface-2)}.post-preview-v10>img,.preview-empty-v10{width:100%;height:250px;object-fit:cover}.preview-empty-v10{display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--muted);gap:8px}.preview-empty-v10 svg{width:28px}.post-preview-v10>div:last-child{padding:15px}.post-preview-v10 strong{font-size:12px}.post-preview-v10 p{font-size:11px;line-height:1.6;margin:8px 0;color:var(--muted)}.post-preview-v10 small{font-size:9px;color:var(--accent)}.info-note-v10{margin-top:12px;padding:13px;border:1px solid var(--line);border-radius:14px;display:flex;gap:10px;background:var(--surface-2)}.info-note-v10 svg{width:18px;color:var(--accent);flex:0 0 auto}.info-note-v10 strong{font-size:10px}.info-note-v10 p{font-size:9px;color:var(--muted);margin-top:4px;line-height:1.5}.queue-v10{display:flex;flex-direction:column}.queue-v10 article{display:grid;grid-template-columns:48px minmax(0,1fr) 170px 90px;gap:12px;align-items:center;padding:11px 0;border-top:1px solid var(--line)}.queue-v10 article>img,.queue-thumb-v10{width:46px;height:46px;border-radius:11px;object-fit:cover;background:var(--surface-2);display:grid;place-items:center}.queue-thumb-v10 svg{width:16px}.queue-v10 article>div:nth-child(2){display:flex;flex-direction:column}.queue-v10 strong{font-size:10px}.queue-v10 small,.queue-v10 time{font-size:9px;color:var(--muted)}.queue-status-v10{text-transform:capitalize;font-size:9px;font-weight:850;border-radius:999px;padding:6px 9px;text-align:center;background:var(--surface-2)}.queue-status-v10.published{color:#16a36a}.queue-status-v10.failed{color:#ef4444}.empty-v10{text-align:center;padding:35px;color:var(--muted);font-size:11px}@media(max-width:1000px){.publisher-layout-v10,.profile-grid-v10{grid-template-columns:1fr}.platform-grid-v10{grid-template-columns:repeat(3,1fr)}}@media(max-width:700px){.page-hero-v10{align-items:flex-start;flex-direction:column;gap:15px}.hero-metrics-v10{width:100%}.hero-metrics-v10 div{flex:1}.media-grid-v10{grid-template-columns:1fr}.queue-v10 article{grid-template-columns:48px minmax(0,1fr)}.queue-v10 time,.queue-status-v10{grid-column:2}.workspace-tabs-v10{overflow:auto}}
      `}</style>
    </AdminShell>
  );
}
