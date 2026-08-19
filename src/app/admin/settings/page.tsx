"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { adminFetch, adminUpload } from "@/lib/admin-client";
import { AlertTriangle, Bot, CheckCircle2, DatabaseBackup, Download, FileText, Globe2, KeyRound, Link2, Mail, MessageCircle, Palette, Plus, Save, ShieldCheck, UploadCloud, UsersRound } from "lucide-react";

type SiteSetting = {
  id?: number;
  site_name: string;
  contact_email: string;
  whatsapp_number: string;
  address: string;
  footer_text: string;
  favicon_url: string;
  app_icon_url: string;
  notification_email: string;
  pwa_enabled: boolean;
  brand_json: Record<string, unknown>;
  config_json: Record<string, unknown>;
};
type AdminUser = { id:string; email:string; fullName:string; role:string; enabled:boolean; createdAt:string; lastSignInAt?:string|null };
type Language = { id?: number; code: string; name: string; native_name?: string; direction?: string; is_default?: boolean; is_active?: boolean; display_order?: number };
type CmsRole = { id?: string; name: string; description?: string; permissions: Record<string, Record<string, boolean>> };
type LiveStatus = { id:string; configured:boolean; mode:"api"|"external"|"database"; missing:string[]; lastCheckedAt?:string|null };

const tabs = ["General","Brand","Users","Roles & Permissions","Website","Languages","Notifications","Email","WhatsApp","Documents","Quotations","Social Accounts","AI Settings","Integrations","Data & Backups","Security"];
const modules = ["Website","Content","Leads","Companies","Contacts","Quotations","Shipments","SEO & GEO","Social Media","Settings"];
const permissions = ["View","Create","Edit","Approve","Publish","Delete","Export"];
const defaults: SiteSetting = { site_name:"The Salt Origin", contact_email:"", whatsapp_number:"", address:"", footer_text:"", favicon_url:"/favicon.ico", app_icon_url:"/salt-origin-logo.png", notification_email:"", pwa_enabled:true, brand_json:{ primaryColor:"#e55d79", secondaryColor:"#292a2f", tagline:"Lead Generation, Export Operations, AI Content and Client Management", font:"System UI", brandVoice:"", letterheadName:"" }, config_json:{} };
const integrationLabels: Record<string,string> = { ga4:"Google Analytics 4",gsc:"Google Search Console",drive:"Google Drive",openai:"OpenAI / ChatGPT",gemini:"Google Gemini",claude:"Anthropic Claude",perplexity:"Perplexity AI",flexibles:"Flexibility AI",smtp:"Resend / SMTP",whatsapp:"WhatsApp Cloud API",facebook:"Facebook",instagram:"Instagram",linkedin:"LinkedIn",pinterest:"Pinterest",threads:"Threads",tiktok:"TikTok",youtube:"YouTube",x:"X / Twitter" };
const emailIds = ["smtp"];
const whatsappIds = ["whatsapp"];
const aiIds = ["openai","gemini","claude","perplexity","flexibles"];
const socialIds = ["facebook","instagram","linkedin","pinterest","threads","tiktok","youtube","x"];
const coreIds = ["ga4","gsc","drive","openai","smtp","whatsapp"];

function asRecord(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function textValue(value: unknown) { return typeof value === "string" ? value : ""; }
function boolValue(value: unknown, fallback=false) { return typeof value === "boolean" ? value : fallback; }

export default function SettingsPage() {
  const [active,setActive] = useState("General");
  const [row,setRow] = useState<SiteSetting>(defaults);
  const [saving,setSaving] = useState(false);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [toast,setToast] = useState("");
  const [statuses,setStatuses] = useState<Record<string,LiveStatus>>({});
  const [lastBackup,setLastBackup] = useState<string>("");
  const logoInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [settingsResult,statusResult] = await Promise.all([
      supabase.from("site_settings").select("*").limit(1).maybeSingle(),
      adminFetch("/api/admin/integrations/status").then(async response => ({ ok: response.ok, payload: await response.json() })).catch(() => ({ ok:false, payload:{} })),
    ]);
    if (settingsResult.error) setError(settingsResult.error.message);
    if (settingsResult.data) setRow({ ...defaults, ...settingsResult.data, brand_json: asRecord(settingsResult.data.brand_json), config_json: asRecord(settingsResult.data.config_json) });
    if (statusResult.ok) setStatuses(Object.fromEntries(((statusResult.payload.items || []) as LiveStatus[]).map(item => [item.id,item])));
    setLoading(false);
  },[]);
  useEffect(() => { void load(); },[load]);
  useEffect(() => { if (!toast) return; const timer=window.setTimeout(()=>setToast(""),2800); return()=>window.clearTimeout(timer); },[toast]);

  function update<K extends keyof SiteSetting>(key:K,value:SiteSetting[K]) { setRow(previous=>({ ...previous,[key]:value })); }
  function updateBrand(key:string,value:unknown) { setRow(previous=>({ ...previous,brand_json:{ ...previous.brand_json,[key]:value } })); }
  function updateConfig(key:string,value:unknown) { setRow(previous=>({ ...previous,config_json:{ ...previous.config_json,[key]:value } })); }

  async function save() {
    setSaving(true); setError("");
    const payload = { site_name:row.site_name.trim(), contact_email:row.contact_email.trim(), whatsapp_number:row.whatsapp_number.trim(), address:row.address.trim(), footer_text:row.footer_text, favicon_url:row.favicon_url, app_icon_url:row.app_icon_url, notification_email:row.notification_email.trim(), pwa_enabled:row.pwa_enabled, brand_json:row.brand_json, config_json:row.config_json, updated_at:new Date().toISOString() };
    const result = row.id ? await supabase.from("site_settings").update(payload).eq("id",row.id).select().single() : await supabase.from("site_settings").insert(payload).select().single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    setRow({ ...defaults, ...result.data, brand_json:asRecord(result.data.brand_json), config_json:asRecord(result.data.config_json) });
    window.dispatchEvent(new Event("salt-cms-updated")); setToast("Settings saved to Supabase.");
  }

  async function uploadLogo(file?: File) {
    if (!file) return;
    setSaving(true); setError("");
    try {
      const upload=await adminUpload(file,"cms-image",{folder:"brand",filename:file.name});
      update("app_icon_url",upload.value); setToast("Logo uploaded. Save Changes to apply it.");
    } catch(reason) { setError(reason instanceof Error?reason.message:"Logo upload failed."); }
    finally { setSaving(false); }
  }

  async function downloadBackup() {
    setSaving(true); setError("");
    try {
      const response=await adminFetch("/api/admin/backup");
      if (!response.ok) { const payload=await response.json(); throw new Error(payload.error||"Backup export failed."); }
      const blob=await response.blob(); const url=URL.createObjectURL(blob); const anchor=document.createElement("a");
      const stamp=new Date().toISOString().replace(/[:.]/g,"-"); anchor.href=url; anchor.download=`the-salt-origin-cms-backup-${stamp}.json`; anchor.click(); URL.revokeObjectURL(url);
      setLastBackup(new Date().toLocaleString()); setToast("Live CMS data export downloaded.");
    } catch (backupError) { setError(backupError instanceof Error ? backupError.message : "Backup export failed."); }
    finally { setSaving(false); }
  }

  const activeIcon=useMemo(()=>({General:Globe2,Brand:Palette,Users:UsersRound,"Roles & Permissions":ShieldCheck,Email:Mail,WhatsApp:MessageCircle,Documents:FileText,"AI Settings":Bot,Security:KeyRound,"Data & Backups":DatabaseBackup}[active]||Globe2),[active]);
  const ActiveIcon=activeIcon;
  const brand=row.brand_json; const config=row.config_json;

  return <AdminShell><div className="os-page">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Enterprise configuration</div><h1 className="os-page-title">Settings</h1><p className="os-page-subtitle">Real website, brand, access, document and integration settings. Secrets remain in environment variables.</p></div><div className="os-page-actions"><button className="os-btn primary" onClick={()=>void save()} disabled={saving||loading}><Save/>{saving?"Saving…":"Save Changes"}</button></div></header>
    {error&&<section className="os-card" style={{borderColor:"rgba(239,68,68,.35)"}}><div className="os-card-body" style={{display:"flex",gap:12}}><AlertTriangle/><div><strong>Settings action failed</strong><p className="os-page-subtitle">{error}</p></div></div></section>}
    <div className="os-settings-layout"><aside className="os-card os-panel-sticky"><div className="os-card-body" style={{padding:10}}>{tabs.map(tab=><button key={tab} className={`os-tool-button ${active===tab?"active":""}`} onClick={()=>setActive(tab)}>{tab}</button>)}</div></aside>
      <main className="os-card"><div className="os-card-header"><div><h2>{active}</h2><p>{loading?"Loading live configuration…":"Changes are stored in the connected Supabase project."}</p></div><span className="os-metric-icon"><ActiveIcon/></span></div><div className="os-card-body">
        {(active==="General"||active==="Website")&&<div className="os-form-grid"><Field label="Company / Site Name" value={row.site_name} onChange={value=>update("site_name",value)}/><Field label="Primary Contact Email" type="email" value={row.contact_email} onChange={value=>update("contact_email",value)}/><Field label="WhatsApp Number" value={row.whatsapp_number} onChange={value=>update("whatsapp_number",value)}/><Field label="Notification Email" type="email" value={row.notification_email} onChange={value=>update("notification_email",value)}/><Field label="Business Address" value={row.address} onChange={value=>update("address",value)} full/><label className="os-label full"><span>Footer Text</span><textarea value={row.footer_text} onChange={event=>update("footer_text",event.target.value)}/></label><Toggle label="Progressive Web App" note="Allow installation on supported devices." checked={row.pwa_enabled} onChange={()=>update("pwa_enabled",!row.pwa_enabled)}/></div>}
        {active==="Brand"&&<div className="os-form-grid"><Field label="Company Name" value={row.site_name} onChange={value=>update("site_name",value)}/><Field label="Tagline" value={textValue(brand.tagline)} onChange={value=>updateBrand("tagline",value)}/><ColorField label="Primary Brand Color" value={textValue(brand.primaryColor)||"#e55d79"} onChange={value=>updateBrand("primaryColor",value)}/><ColorField label="Secondary Color" value={textValue(brand.secondaryColor)||"#292a2f"} onChange={value=>updateBrand("secondaryColor",value)}/><Field label="Typography" value={textValue(brand.font)} onChange={value=>updateBrand("font",value)}/><Field label="Letterhead Name" value={textValue(brand.letterheadName)} onChange={value=>updateBrand("letterheadName",value)}/><label className="os-label full"><span>Brand Voice</span><textarea value={textValue(brand.brandVoice)} onChange={event=>updateBrand("brandVoice",event.target.value)}/></label><div className="os-card full" style={{boxShadow:"none"}}><div className="os-card-body" style={{display:"flex",gap:18,alignItems:"center",flexWrap:"wrap"}}><img src={row.app_icon_url||"/salt-origin-logo.png"} alt="The Salt Origin" style={{width:120,height:90,objectFit:"contain"}}/><div><strong style={{display:"block"}}>Current Brand Logo</strong><p className="os-page-subtitle">Used by the CMS and export document previews.</p><input ref={logoInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={event=>void uploadLogo(event.target.files?.[0])}/><button className="os-btn soft" onClick={()=>logoInput.current?.click()}><UploadCloud/>Replace Logo</button></div></div></div></div>}
        {active==="Users"&&<UsersPanel/>}
        {active==="Roles & Permissions"&&<RolesPanel/>}
        {active==="Languages"&&<LanguagesPanel/>}
        {active==="Notifications"&&<div className="os-list"><Toggle label="Lead follow-up reminders" note="Notify the assigned manager when a follow-up is due." checked={boolValue(config.leadReminders,true)} onChange={()=>updateConfig("leadReminders",!boolValue(config.leadReminders,true))}/><Toggle label="Certification expiry alerts" note="Notify before a compliance document expires." checked={boolValue(config.certExpiry,true)} onChange={()=>updateConfig("certExpiry",!boolValue(config.certExpiry,true))}/><Toggle label="Approval inbox notifications" note="Notify reviewers when content needs approval." checked={boolValue(config.approvalNotifications,true)} onChange={()=>updateConfig("approvalNotifications",!boolValue(config.approvalNotifications,true))}/></div>}
        {active==="Email"&&<IntegrationPanel ids={emailIds} statuses={statuses}/>} 
        {active==="WhatsApp"&&<IntegrationPanel ids={whatsappIds} statuses={statuses}/>} 
        {active==="Social Accounts"&&<IntegrationPanel ids={socialIds} statuses={statuses}/>} 
        {active==="AI Settings"&&<><IntegrationPanel ids={aiIds} statuses={statuses}/><div className="os-list" style={{marginTop:14}}><Toggle label="Human approval mandatory" note="AI content cannot publish without an approved record." checked={true} onChange={()=>setToast("Human approval cannot be disabled.")}/></div></>}
        {active==="Integrations"&&<IntegrationPanel ids={coreIds} statuses={statuses}/>} 
        {active==="Documents"&&<div className="os-form-grid"><Field label="Default Letterhead" value={textValue(config.defaultLetterhead)} onChange={value=>updateConfig("defaultLetterhead",value)}/><Field label="Authorized Signatory" value={textValue(config.authorizedSignatory)} onChange={value=>updateConfig("authorizedSignatory",value)}/><Field label="Signatory Title" value={textValue(config.authorizedTitle)} onChange={value=>updateConfig("authorizedTitle",value)}/><Field label="Default Footer" value={textValue(config.documentFooter)} onChange={value=>updateConfig("documentFooter",value)}/><label className="os-label full"><span>Bank Details Profile</span><textarea value={textValue(config.bankDetails)} onChange={event=>updateConfig("bankDetails",event.target.value)}/></label></div>}
        {active==="Quotations"&&<div className="os-form-grid"><Field label="Number Prefix" value={textValue(config.quotationPrefix)} onChange={value=>updateConfig("quotationPrefix",value)}/><Field label="Default Validity (Days)" type="number" value={textValue(config.quotationValidity)} onChange={value=>updateConfig("quotationValidity",value)}/><Field label="Default Currency" value={textValue(config.defaultCurrency)} onChange={value=>updateConfig("defaultCurrency",value)}/><Field label="Default Incoterm" value={textValue(config.defaultIncoterm)} onChange={value=>updateConfig("defaultIncoterm",value)}/><Field label="Payment Terms" value={textValue(config.paymentTerms)} onChange={value=>updateConfig("paymentTerms",value)} full/><Field label="Delivery Lead Time" value={textValue(config.deliveryLeadTime)} onChange={value=>updateConfig("deliveryLeadTime",value)} full/></div>}
        {active==="Data & Backups"&&<div className="os-list"><div className="os-list-row"><span className="os-list-icon"><DatabaseBackup/></span><div className="os-list-main"><strong>Live CMS data export</strong><span>{lastBackup?`Last downloaded in this session: ${lastBackup}`:"No backup has been downloaded in this session."}</span></div><button className="os-btn primary" onClick={()=>void downloadBackup()} disabled={saving}><Download/>Download JSON Backup</button></div><div className="os-list-row"><span className="os-list-icon"><ShieldCheck/></span><div className="os-list-main"><strong>Managed database backups</strong><span>Configure scheduled point-in-time backups in the connected Supabase project.</span></div><a className="os-btn soft" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer"><Link2/>Open Supabase</a></div></div>}
        {active==="Security"&&<SecurityPanel config={config} updateConfig={updateConfig}/>} 
      </div></main>
    </div>
    {toast&&<div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong></div></div></div>}
  </div></AdminShell>;
}

function Field({label,value,onChange,full=false,type="text"}:{label:string;value:string;onChange:(value:string)=>void;full?:boolean;type?:string}) { return <label className={`os-label ${full?"full":""}`}><span>{label}</span><input type={type} value={value} onChange={event=>onChange(event.target.value)}/></label>; }
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}) { return <label className="os-label"><span>{label}</span><div style={{display:"grid",gridTemplateColumns:"52px 1fr",gap:8}}><input type="color" value={value} onChange={event=>onChange(event.target.value)}/><input value={value} onChange={event=>onChange(event.target.value)}/></div></label>; }
function Toggle({label,note,checked,onChange}:{label:string;note:string;checked:boolean;onChange:()=>void}) { return <div className="os-list-row"><div className="os-list-main"><strong>{label}</strong><span>{note}</span></div><button type="button" aria-label={label} aria-pressed={checked} onClick={onChange} style={{width:44,height:24,border:0,borderRadius:99,padding:3,background:checked?"var(--os-pink)":"var(--os-line)",display:"flex",justifyContent:checked?"flex-end":"flex-start"}}><i style={{width:18,height:18,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px #0003"}}/></button></div>; }

function UsersPanel() {
  const [users,setUsers]=useState<AdminUser[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [inviteOpen,setInviteOpen]=useState(false); const [invite,setInvite]=useState({fullName:"",email:"",role:"viewer"}); const [saving,setSaving]=useState(false);
  const loadUsers=useCallback(async()=>{setLoading(true);setError("");try{const response=await adminFetch("/api/admin/users");const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Unable to load users.");setUsers(payload.users||[]);}catch(loadError){setError(loadError instanceof Error?loadError.message:"Unable to load users.");}finally{setLoading(false);}},[]);
  useEffect(()=>{void loadUsers();},[loadUsers]);
  async function sendInvite(){setSaving(true);setError("");try{const response=await adminFetch("/api/admin/users",{method:"POST",body:JSON.stringify(invite)});const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Invitation failed.");setInviteOpen(false);setInvite({fullName:"",email:"",role:"viewer"});await loadUsers();}catch(saveError){setError(saveError instanceof Error?saveError.message:"Invitation failed.");}finally{setSaving(false);}}
  async function updateUser(user:AdminUser,patch:{role?:string;enabled?:boolean}){setSaving(true);setError("");try{const response=await adminFetch("/api/admin/users",{method:"PATCH",body:JSON.stringify({id:user.id,...patch})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Update failed.");await loadUsers();}catch(saveError){setError(saveError instanceof Error?saveError.message:"Update failed.");}finally{setSaving(false);}}
  async function resetMfa(user:AdminUser){if(!confirm(`Reset MFA for ${user.email}? Their verified authenticator will be removed and they must enroll again.`))return;setSaving(true);setError("");try{const response=await adminFetch("/api/admin/users/mfa-reset",{method:"POST",body:JSON.stringify({userId:user.id})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||"MFA reset failed.");setError("");}catch(resetError){setError(resetError instanceof Error?resetError.message:"MFA reset failed.");}finally{setSaving(false);}}
  return <div>{error&&<p className="os-alert">{error}</p>}<div style={{display:"flex",justifyContent:"space-between",gap:12,marginBottom:14}}><div><strong>Authenticated CMS Users</strong><p className="os-page-subtitle">Loaded from Supabase Auth and cms_profiles.</p></div><button className="os-btn primary" onClick={()=>setInviteOpen(true)}><UsersRound/>Invite User</button></div><div className="os-table-wrap"><table className="os-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last Sign In</th><th>Created</th><th>Actions</th></tr></thead><tbody>{users.map(user=><tr key={user.id}><td><strong>{user.fullName||"Unnamed user"}</strong><small>{user.email}</small></td><td><input className="os-field" value={user.role} disabled={saving} onChange={event=>setUsers(previous=>previous.map(item=>item.id===user.id?{...item,role:event.target.value}:item))} onBlur={()=>void updateUser(user,{role:user.role})}/></td><td><span className={`os-badge ${user.enabled?"green":"red"}`}>{user.enabled?"Active":"Disabled"}</span></td><td>{user.lastSignInAt?new Date(user.lastSignInAt).toLocaleString():"Never"}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className={`os-btn ${user.enabled?"danger":"success"}`} disabled={saving} onClick={()=>void updateUser(user,{enabled:!user.enabled})}>{user.enabled?"Disable":"Enable"}</button><button className="os-btn soft" disabled={saving} onClick={()=>void resetMfa(user)}>Reset MFA</button></div></td></tr>)}{!loading&&!users.length&&<tr><td colSpan={6}><div className="os-empty"><h3>No authenticated CMS users found</h3><p>Sign in with the real Supabase admin account or invite the first user.</p></div></td></tr>}</tbody></table></div>{inviteOpen&&<div className="os-modal-backdrop" onMouseDown={()=>setInviteOpen(false)}><section className="os-modal" onMouseDown={event=>event.stopPropagation()}><div className="os-modal-header"><h2>Invite CMS User</h2></div><div className="os-modal-body"><div className="os-form-grid"><Field label="Full Name" value={invite.fullName} onChange={value=>setInvite(previous=>({...previous,fullName:value}))}/><Field label="Email" type="email" value={invite.email} onChange={value=>setInvite(previous=>({...previous,email:value}))}/><Field label="Role" value={invite.role} onChange={value=>setInvite(previous=>({...previous,role:value}))} full/></div></div><div className="os-modal-footer"><button className="os-btn soft" onClick={()=>setInviteOpen(false)}>Cancel</button><button className="os-btn primary" onClick={()=>void sendInvite()} disabled={saving||!invite.email}>Send Invitation</button></div></section></div>}</div>;
}

function RolesPanel() {
  const [rows,setRows]=useState<CmsRole[]>([]); const [selected,setSelected]=useState<CmsRole|null>(null); const [error,setError]=useState(""); const [saving,setSaving]=useState(false);
  const load=useCallback(async()=>{const result=await supabase.from("cms_roles").select("*").order("name");if(result.error)setError(result.error.message);else{const data=(result.data||[]).map(row=>({...row,permissions:asRecord(row.permissions) as Record<string,Record<string,boolean>>}));setRows(data);setSelected(previous=>previous?data.find(row=>row.id===previous.id)||null:data[0]||null);}},[]);
  useEffect(()=>{void load();},[load]);
  function createRole(){setSelected({name:"",description:"",permissions:{}});}
  function toggle(module:string,permission:string){if(!selected)return;setSelected({...selected,permissions:{...selected.permissions,[module]:{...(selected.permissions[module]||{}),[permission]:!selected.permissions[module]?.[permission]}}});}
  async function saveRole(){if(!selected?.name.trim())return setError("Role name is required.");setSaving(true);const payload={name:selected.name.trim(),description:selected.description||"",permissions:selected.permissions};const result=selected.id?await supabase.from("cms_roles").update(payload).eq("id",selected.id):await supabase.from("cms_roles").insert(payload);setSaving(false);if(result.error)setError(result.error.message);else{setError("");await load();}}
  return <div>{error&&<p className="os-alert">{error}</p>}<div className="os-toolbar"><select className="os-field" value={selected?.id||""} onChange={event=>setSelected(rows.find(row=>row.id===event.target.value)||null)}><option value="">Select role</option>{rows.map(role=><option key={role.id} value={role.id}>{role.name}</option>)}</select><button className="os-btn soft" onClick={createRole}><Plus/>Create Role</button></div>{selected?<><div className="os-form-grid" style={{margin:"14px 0"}}><Field label="Role Name" value={selected.name} onChange={value=>setSelected({...selected,name:value})}/><Field label="Description" value={selected.description||""} onChange={value=>setSelected({...selected,description:value})}/></div><div className="os-table-wrap"><table className="os-table"><thead><tr><th>Module</th>{permissions.map(permission=><th key={permission}>{permission}</th>)}</tr></thead><tbody>{modules.map(module=><tr key={module}><td><strong>{module}</strong></td>{permissions.map(permission=><td key={permission}><input type="checkbox" checked={Boolean(selected.permissions[module]?.[permission])} onChange={()=>toggle(module,permission)}/></td>)}</tr>)}</tbody></table></div><button className="os-btn primary" style={{marginTop:14}} disabled={saving} onClick={()=>void saveRole()}><Save/>Save Role</button></>:<div className="os-empty"><h3>No roles configured</h3><p>Create the first real role and assign only the permissions it needs.</p><button className="os-btn primary" onClick={createRole}><Plus/>Create Role</button></div>}</div>;
}

function LanguagesPanel() {
  const [rows,setRows]=useState<Language[]>([]); const [form,setForm]=useState<Language>({code:"",name:"",native_name:"",direction:"ltr",is_default:false,is_active:true,display_order:0}); const [error,setError]=useState("");
  const load=useCallback(async()=>{const result=await supabase.from("cms_languages").select("*").order("display_order");if(result.error)setError(result.error.message);else setRows(result.data||[]);},[]);
  useEffect(()=>{void load();},[load]);
  async function add(){if(!form.code.trim()||!form.name.trim())return setError("Language code and name are required.");const result=await supabase.from("cms_languages").insert({...form,code:form.code.trim().toLowerCase(),name:form.name.trim()});if(result.error)setError(result.error.message);else{setForm({code:"",name:"",native_name:"",direction:"ltr",is_default:false,is_active:true,display_order:rows.length});setError("");await load();}}
  async function toggle(row:Language){const result=await supabase.from("cms_languages").update({is_active:!row.is_active}).eq("id",row.id);if(result.error)setError(result.error.message);else await load();}
  return <div>{error&&<p className="os-alert">{error}</p>}<div className="os-form-grid"><Field label="Language Code" value={form.code} onChange={value=>setForm(previous=>({...previous,code:value}))}/><Field label="Language Name" value={form.name} onChange={value=>setForm(previous=>({...previous,name:value}))}/><Field label="Native Name" value={form.native_name||""} onChange={value=>setForm(previous=>({...previous,native_name:value}))}/><label className="os-label"><span>Direction</span><select value={form.direction} onChange={event=>setForm(previous=>({...previous,direction:event.target.value}))}><option value="ltr">Left to Right</option><option value="rtl">Right to Left</option></select></label><button className="os-btn primary" onClick={()=>void add()}><Plus/>Add Language</button></div><div className="os-grid two" style={{marginTop:18}}>{rows.map(row=><article className="os-card" style={{boxShadow:"none"}} key={row.id}><div className="os-card-body" style={{display:"flex",justifyContent:"space-between",gap:12}}><div><strong>{row.name}</strong><p className="os-page-subtitle">{row.code.toUpperCase()} · {row.direction?.toUpperCase()||"LTR"}{row.is_default?" · Default":""}</p></div><button className={`os-btn ${row.is_active?"success":"soft"}`} onClick={()=>void toggle(row)}>{row.is_active?"Active":"Disabled"}</button></div></article>)}{!rows.length&&<div className="os-empty"><h3>No languages configured</h3><p>Add only languages that will be used on the live website.</p></div>}</div></div>;
}

function IntegrationPanel({ids,statuses}:{ids:string[];statuses:Record<string,LiveStatus>}) { return <div className="os-grid two">{ids.map(id=>{const status=statuses[id];const external=status?.mode==="external";const configured=Boolean(status?.configured&&!external);return <article className="os-card" style={{boxShadow:"none"}} key={id}><div className="os-card-body" style={{display:"flex",alignItems:"center",gap:12}}><span className="os-list-icon"><Link2/></span><div className="os-list-main"><strong>{integrationLabels[id]||id}</strong><span>{configured?"Configured":external?"External Tool":`Connection Required${status?.missing?.length?`: ${status.missing.join(", ")}`:""}`}</span></div><Link className="os-btn soft" href="/admin/integrations">Configure</Link></div></article>;})}</div>; }

function SecurityPanel({config,updateConfig}:{config:Record<string,unknown>;updateConfig:(key:string,value:unknown)=>void}) {
  const [email,setEmail]=useState(""); const [lastSignIn,setLastSignIn]=useState("");
  useEffect(()=>{void supabase.auth.getUser().then(result=>{setEmail(result.data.user?.email||"");setLastSignIn(result.data.user?.last_sign_in_at||"");});},[]);
  return <div className="os-list"><div className="os-list-row"><span className="os-list-icon"><KeyRound/></span><div className="os-list-main"><strong>Authenticated account</strong><span>{email||"No authenticated account found"}{lastSignIn?` · Last sign in ${new Date(lastSignIn).toLocaleString()}`:""}</span></div></div><div className="os-list-row"><span className="os-list-icon"><ShieldCheck/></span><div className="os-list-main"><strong>Multi-factor authentication</strong><span>Production Super Admin actions require a verified TOTP factor (AAL2). Normal approved CMS access remains available at AAL1; manage your authenticator here.</span></div><Link className="os-btn soft" href="/admin/mfa?manage=1">Manage MFA</Link></div><div className="os-list-row"><div className="os-list-main"><strong>Session timeout preference</strong><span>Stored in CMS settings for application enforcement.</span></div><select className="os-field" value={textValue(config.sessionTimeout)||"8"} onChange={event=>updateConfig("sessionTimeout",event.target.value)}><option value="2">2 hours</option><option value="8">8 hours</option><option value="24">24 hours</option></select></div></div>;
}
