"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-client";
import { supabase } from "@/lib/supabase-client";
import { AlertTriangle, CheckCircle2, Download, FileCheck2, FileSpreadsheet, Mail, MessageSquare, PackageCheck, RefreshCw, Send, ShieldCheck, Truck, UserRoundCheck } from "lucide-react";

type Row = Record<string, any>;
type Client = { id: string; company_name: string; contact_name?: string | null; email: string; phone?: string | null; country?: string | null; status?: string | null; segment?: string | null; tier?: string | null; auth_user_id?: string | null; assigned_manager?: string | null };
const tabs = ["Overview", "Quotations", "Approved Documents", "Samples", "Production Updates", "Shipment Tracking", "Certifications", "Messages", "Support Requests", "Account Contacts"];
const terminalDocumentStatuses = ["rejected", "expired", "cancelled"];
function normal(value: unknown) { return String(value || "").trim().toLowerCase().replaceAll("_", " "); }
function nice(value: unknown) { const text = String(value || "—").replaceAll("_", " "); return text.replace(/\b\w/g, character => character.toUpperCase()); }
function formatDate(value: unknown) { if (!value) return "—"; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString(); }
function fileDownload(url: string, name: string) { const link = document.createElement("a"); link.href = url; link.download = name; link.target = "_blank"; link.rel = "noreferrer"; link.click(); }

export default function ClientPortalPreview() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [tab, setTab] = useState("Overview");
  const [documents, setDocuments] = useState<Row[]>([]);
  const [shipments, setShipments] = useState<Row[]>([]);
  const [samples, setSamples] = useState<Row[]>([]);
  const [certifications, setCertifications] = useState<Row[]>([]);
  const [activities, setActivities] = useState<Row[]>([]);
  const [contacts, setContacts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportText, setSupportText] = useState("");

  const selectedClient = clients.find(client => client.id === clientId) || null;

  const loadClients = useCallback(async () => {
    const { data, error: loadError } = await supabase.from("customer_accounts").select("*").order("company_name");
    if (loadError) { setError(loadError.message); setLoading(false); return; }
    const next = (data || []) as Client[];
    setClients(next);
    setClientId(previous => previous && next.some(client => client.id === previous) ? previous : next[0]?.id || "");
  }, []);

  const loadClientData = useCallback(async (client: Client | null) => {
    if (!client) { setDocuments([]); setShipments([]); setSamples([]); setCertifications([]); setActivities([]); setContacts([]); setLoading(false); return; }
    setLoading(true); setError("");
    const [docsResult, shipmentResult, sampleResult, certificationResult, activityResult, contactResult] = await Promise.all([
      supabase.from("business_documents").select("*").or(`buyer_email.eq.${client.email},buyer_company.ilike.%${client.company_name.replaceAll(",", "")}%`).order("created_at", { ascending: false }),
      supabase.from("customer_shipments").select("*").eq("customer_id", client.id).order("created_at", { ascending: false }),
      supabase.from("sample_requests").select("*").ilike("company_name", `%${client.company_name}%`).order("created_at", { ascending: false }),
      supabase.from("certifications").select("*").in("visibility", ["Public", "Client", "public", "client"]).order("created_at", { ascending: false }),
      supabase.from("b2b_activities").select("*").ilike("company_name", `%${client.company_name}%`).order("created_at", { ascending: false }).limit(100),
      supabase.from("b2b_contacts").select("*").or(`email.eq.${client.email},country.eq.${client.country || "__none__"}`).order("created_at", { ascending: false }),
    ]);
    const firstError = [docsResult.error, shipmentResult.error, sampleResult.error, certificationResult.error, activityResult.error, contactResult.error].find(Boolean);
    if (firstError) setError(firstError.message);
    setDocuments(docsResult.data || []); setShipments(shipmentResult.data || []); setSamples(sampleResult.data || []);
    setCertifications(certificationResult.data || []); setActivities(activityResult.data || []); setContacts(contactResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { void loadClients(); }, [loadClients]);
  useEffect(() => { void loadClientData(selectedClient); }, [selectedClient?.id, loadClientData]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2600); return () => window.clearTimeout(timer); }, [toast]);

  const quotations = documents.filter(row => normal(row.document_type) === "quotation");
  const approvedDocuments = documents.filter(row => ["approved to send", "accepted", "signed", "sent", "delivered", "viewed"].includes(normal(row.status)));
  const activeShipments = shipments.filter(row => !["delivered", "completed", "cancelled", "closed"].includes(normal(row.status || row.current_status)));
  const productionProgress = activeShipments.length ? Math.round(activeShipments.reduce((sum, row) => sum + Number(row.completion || 0), 0) / activeShipments.length) : 0;
  const supportRequests = activities.filter(row => normal(row.activity_type).includes("support"));

  async function inviteClient() {
    if (!selectedClient) return;
    setInviting(true); setError("");
    try {
      const response = await adminFetch("/api/admin/client-invite", { method: "POST", body: JSON.stringify({ customerId: selectedClient.id }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Invitation failed.");
      setToast(payload.message || "Client invitation sent."); await loadClients();
    } catch (inviteError) { setError(inviteError instanceof Error ? inviteError.message : "Invitation failed."); }
    finally { setInviting(false); }
  }

  async function createSupportRequest() {
    if (!selectedClient || !supportText.trim()) return;
    const { data: auth } = await supabase.auth.getSession();
    const { error: insertError } = await supabase.from("b2b_activities").insert({
      activity_type: "client_support_request", module: "Client Portal", record_id: selectedClient.id,
      title: `Support request · ${selectedClient.company_name}`, description: supportText.trim(), company_name: selectedClient.company_name,
      country: selectedClient.country || null, actor_id: auth.session?.user.id || null, actor_email: auth.session?.user.email || null,
      metadata: { client_email: selectedClient.email, source: "admin_portal_preview" },
    });
    if (insertError) setError(insertError.message); else { setSupportText(""); setSupportOpen(false); setToast("Support request saved to client activity"); await loadClientData(selectedClient); }
  }

  const statusTone = (status: string) => ["accepted", "signed", "delivered", "completed", "valid"].includes(normal(status)) ? "green" : terminalDocumentStatuses.includes(normal(status)) ? "red" : "blue";

  const overview = <>
    <div className="os-grid four">{[
      ["Open Quotations", quotations.filter(row => !terminalDocumentStatuses.includes(normal(row.status)) && !["accepted", "signed"].includes(normal(row.status))).length, FileSpreadsheet],
      ["Active Samples", samples.filter(row => !["closed", "converted to quotation"].includes(normal(row.status))).length, PackageCheck],
      ["Production Progress", `${productionProgress}%`, Truck],
      ["Approved Documents", approvedDocuments.length, FileCheck2],
    ].map(([label, value, Icon]) => { const Component = Icon as typeof FileSpreadsheet; return <article className="os-metric" key={String(label)}><div className="os-metric-top"><span className="os-metric-label">{String(label)}</span><span className="os-metric-icon"><Component/></span></div><div className="os-metric-value">{String(value)}</div><div className="os-metric-foot"><b>Live client record</b></div></article>; })}</div>
    <div className="os-grid two"><section className="os-card"><div className="os-card-header"><div><h2>Latest Quotations</h2><p>Documents linked to this client email or company</p></div><FileSpreadsheet size={16}/></div><div className="os-card-body"><RecordList rows={quotations.slice(0, 5)} empty="No quotations are linked to this client yet." render={row => <><span className="os-list-icon"><FileSpreadsheet/></span><div className="os-list-main"><strong>{row.document_number || "Quotation"}</strong><span>{nice(row.document_type)} · {row.currency || ""} {Number(row.grand_total || 0).toLocaleString()}</span></div><span className={`os-badge ${statusTone(row.status)}`}>{nice(row.status)}</span></>}/></div></section>
      <section className="os-card"><div className="os-card-header"><div><h2>Production & Shipment</h2><p>Current export-operation milestones</p></div><Truck size={16}/></div><div className="os-card-body"><RecordList rows={activeShipments.slice(0, 5)} empty="No active production or shipment record exists." render={row => <><span className="os-list-icon"><Truck/></span><div className="os-list-main"><strong>{row.reference_number}</strong><span>{nice(row.current_stage || row.current_status)} · ETA {formatDate(row.eta)}</span><div className="os-progress" style={{ marginTop: 7 }}><span style={{ width: `${Math.max(0, Math.min(100, Number(row.completion || 0)))}%` }}/></div></div><span className="os-list-value">{Number(row.completion || 0)}%</span></>}/></div></section></div>
  </>;

  function contentForTab() {
    if (tab === "Overview") return overview;
    if (tab === "Quotations") return <DataSection title="Quotations" subtitle="Live quotation records for the selected client" icon={FileSpreadsheet} rows={quotations} empty="No quotations found." columns={["document_number", "issue_date", "valid_until", "incoterm", "status"]}/>;
    if (tab === "Approved Documents") return <DataSection title="Approved Documents" subtitle="Client-visible export and commercial documents" icon={FileCheck2} rows={approvedDocuments} empty="No approved documents found." columns={["document_type", "document_number", "issue_date", "status"]}/>;
    if (tab === "Samples") return <DataSection title="Sample Requests" subtitle="Product and packaging samples linked to this company" icon={PackageCheck} rows={samples} empty="No sample requests found." columns={["request_number", "product_samples", "courier", "tracking_number", "status"]}/>;
    if (tab === "Production Updates" || tab === "Shipment Tracking") return <DataSection title={tab} subtitle="Live milestones, carrier information, ETD and ETA" icon={Truck} rows={shipments} empty="No shipment records found." columns={["reference_number", "current_stage", "carrier_name", "tracking_number", "etd", "eta", "current_status"]}/>;
    if (tab === "Certifications") return <section className="os-card"><div className="os-card-header"><div><h2>Certifications</h2><p>Documents marked Public or Client visibility</p></div><ShieldCheck/></div><div className="os-card-body"><RecordList rows={certifications} empty="No client-visible certifications found." render={row => <><span className="os-list-icon"><ShieldCheck/></span><div className="os-list-main"><strong>{row.document_name}</strong><span>{row.category} · {nice(row.status)} · Expiry {formatDate(row.expiry_date)}</span></div>{row.file_url ? <button className="os-icon-button" onClick={() => fileDownload(row.file_url, row.document_name)} aria-label="Download"><Download/></button> : <span className="os-badge amber">No file</span>}</>}/></div></section>;
    if (tab === "Messages") return <section className="os-card"><div className="os-card-header"><div><h2>Client Activity & Messages</h2><p>Real activity records linked to this company</p></div><MessageSquare/></div><div className="os-card-body"><RecordList rows={activities.filter(row => !normal(row.activity_type).includes("support"))} empty="No messages or client activity found." render={row => <><span className="os-avatar">{String(row.actor_email || "SO").slice(0,2).toUpperCase()}</span><div className="os-list-main"><strong>{row.title}</strong><span>{row.description || row.module}</span><small>{formatDate(row.created_at)} · {row.actor_email || "System"}</small></div></>}/></div></section>;
    if (tab === "Support Requests") return <section className="os-card"><div className="os-card-header"><div><h2>Support Requests</h2><p>Requests saved as live client activity records</p></div><button className="os-btn primary" onClick={() => setSupportOpen(true)}><Mail/>New Request</button></div><div className="os-card-body"><RecordList rows={supportRequests} empty="No support requests found." render={row => <><span className="os-list-icon"><MessageSquare/></span><div className="os-list-main"><strong>{row.title}</strong><span>{row.description}</span><small>{formatDate(row.created_at)}</small></div></>}/></div></section>;
    return <section className="os-card"><div className="os-card-header"><div><h2>Account Contacts</h2><p>Client and B2B contact records matching this account</p></div><UserRoundCheck/></div><div className="os-card-body"><div className="os-list"><div className="os-list-row"><span className="os-avatar">{String(selectedClient?.contact_name || selectedClient?.company_name || "CL").slice(0,2).toUpperCase()}</span><div className="os-list-main"><strong>{selectedClient?.contact_name || selectedClient?.company_name}</strong><span>{selectedClient?.email} · {selectedClient?.phone || "No phone"}</span></div><span className="os-badge blue">Primary</span></div>{contacts.filter(row => row.email !== selectedClient?.email).map(row => <div className="os-list-row" key={row.id}><span className="os-avatar">{String(row.name || "CT").slice(0,2).toUpperCase()}</span><div className="os-list-main"><strong>{row.name}</strong><span>{row.job_title || "Contact"} · {row.email || row.phone_whatsapp || "No contact detail"}</span></div><span className="os-badge">{nice(row.lifecycle)}</span></div>)}</div></div></section>;
  }

  return <AdminShell><div className="os-page"><header className="os-page-header"><div><div className="os-page-eyebrow">Live buyer workspace</div><h1 className="os-page-title">Client Portal</h1><p className="os-page-subtitle">Preview the actual client-linked quotations, samples, shipments, certifications and communications stored in Supabase.</p></div><div className="os-page-actions"><select className="os-field" value={clientId} onChange={event => setClientId(event.target.value)}><option value="">Select a real client</option>{clients.map(client => <option value={client.id} key={client.id}>{client.company_name}</option>)}</select><button className="os-btn soft" onClick={() => void loadClientData(selectedClient)} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/>Refresh</button><button className="os-btn primary" onClick={() => void inviteClient()} disabled={!selectedClient || inviting}><Send/>{inviting ? "Sending…" : selectedClient?.auth_user_id ? "Resend Invite" : "Invite Client"}</button></div></header>
    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body" style={{ display: "flex", gap: 12 }}><AlertTriangle/><div><strong>Live portal data error</strong><p className="os-page-subtitle">{error}</p><p className="os-page-subtitle">No demo client records are displayed.</p></div></div></section>}
    {!selectedClient ? <div className="os-empty"><div className="os-empty-icon"><UserRoundCheck/></div><h3>No client accounts found</h3><p>Create or import a real client in the Clients module. The portal does not use fake companies.</p></div> : <>
      <section className="os-card" style={{ background: "linear-gradient(135deg,var(--os-pink),var(--os-pink-2))", color: "#fff" }}><div className="os-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}><div style={{ display: "flex", alignItems: "center", gap: 14 }}><img src="/salt-origin-logo.png" alt="The Salt Origin" style={{ width: 70, height: 70, objectFit: "contain", background: "#fff", borderRadius: 18, padding: 5 }}/><div><span style={{ fontSize: 9, letterSpacing: ".13em", textTransform: "uppercase", fontWeight: 900 }}>Welcome to The Salt Origin Client Portal</span><h2 style={{ fontSize: 24, margin: "5px 0" }}>{selectedClient.company_name}</h2><p style={{ margin: 0, fontSize: 10, opacity: .85 }}>{selectedClient.segment || "Client"} · {selectedClient.country || "Country not set"} · {selectedClient.email}</p></div></div><span className="os-badge" style={{ background: "rgba(255,255,255,.18)", color: "#fff", borderColor: "rgba(255,255,255,.25)" }}><CheckCircle2/>{selectedClient.auth_user_id ? "Portal User Linked" : nice(selectedClient.status || "Account Active")}</span></div></section>
      <div className="os-tabs">{tabs.map(value => <button key={value} className={`os-tab ${tab === value ? "active" : ""}`} onClick={() => setTab(value)}>{value}</button>)}</div>
      {loading ? <div className="os-skeleton-list">{[1,2,3].map(value => <div className="os-skeleton" key={value}/>)}</div> : contentForTab()}
    </>}
    {supportOpen && <div className="os-modal-backdrop" onMouseDown={() => setSupportOpen(false)}><section className="os-modal" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><h2>New Support Request</h2><p className="os-page-subtitle">This creates a real client activity record.</p></div></div><div className="os-modal-body"><label className="os-label"><span>Request details</span><textarea value={supportText} onChange={event => setSupportText(event.target.value)} placeholder="Describe the client request or support issue…"/></label></div><div className="os-modal-footer"><button className="os-btn soft" onClick={() => setSupportOpen(false)}>Cancel</button><button className="os-btn primary" onClick={() => void createSupportRequest()} disabled={!supportText.trim()}><MessageSquare/>Save Request</button></div></section></div>}
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>The action used the connected Supabase project.</span></div></div></div>}
  </div></AdminShell>;
}

function RecordList({ rows, empty, render }: { rows: Row[]; empty: string; render: (row: Row) => React.ReactNode }) {
  if (!rows.length) return <div className="os-empty" style={{ minHeight: 180 }}><div className="os-empty-icon"><FileCheck2/></div><h3>No records found</h3><p>{empty}</p></div>;
  return <div className="os-list">{rows.map((row, index) => <div className="os-list-row" key={row.id || index}>{render(row)}</div>)}</div>;
}
function DataSection({ title, subtitle, icon: Icon, rows, empty, columns }: { title: string; subtitle: string; icon: typeof Truck; rows: Row[]; empty: string; columns: string[] }) {
  return <section className="os-card"><div className="os-card-header"><div><h2>{title}</h2><p>{subtitle}</p></div><Icon/></div><div className="os-card-body">{rows.length ? <div className="os-table-wrap"><table className="os-table"><thead><tr>{columns.map(column => <th key={column}>{nice(column)}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || index}>{columns.map(column => <td key={column}>{column.includes("date") || ["etd", "eta"].includes(column) ? formatDate(row[column]) : nice(row[column])}</td>)}</tr>)}</tbody></table></div> : <div className="os-empty"><div className="os-empty-icon"><Icon/></div><h3>No records found</h3><p>{empty}</p></div>}</div></section>;
}
