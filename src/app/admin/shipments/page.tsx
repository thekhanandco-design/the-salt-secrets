"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { AlertTriangle, Edit3, ExternalLink, PackageSearch, Plus, RefreshCw, Search, Ship, Trash2, Truck, X } from "lucide-react";

type Client = { id: string; company_name: string; country?: string | null };
type Shipment = Record<string, any> & { id?: string; customer_id: string; reference_number: string };
const stages = ["Contract Confirmed", "Artwork Approval", "Packaging Preparation", "Production", "Quality Inspection", "Packing", "Documentation", "Ready for Dispatch", "In Transit", "Customs", "Delivered"];
const blank: Shipment = { customer_id: "", reference_number: "", client_name: "", country: "", product: "", quantity: "", incoterm: "FOB", freight_mode: "Ocean", container_type: "", shipment_type: "container", carrier_type: "custom", carrier_name: "", tracking_number: "", bl_number: "", container_number: "", vessel_name: "", voyage_number: "", origin: "Pakistan", destination: "", etd: "", eta: "", current_stage: "Contract Confirmed", current_status: "booked", completion: 0, document_status: "Pending", status: "Active", tracking_url: "", recent_update: "", delay_reason: "", notes: "" };
const providers: Partial<Record<string, (value: string) => string>> = {
  dhl: value => `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(value)}`,
  fedex: value => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(value)}`,
  ups: value => `https://www.ups.com/track?tracknum=${encodeURIComponent(value)}`,
  aramex: value => `https://www.aramex.com/track/results?ShipmentNumber=${encodeURIComponent(value)}`,
  tcs: value => `https://www.tcsexpress.com/track/${encodeURIComponent(value)}`,
};
function trackingUrl(row: Shipment) { if (row.tracking_url) return row.tracking_url; const builder = providers[String(row.carrier_type || "").toLowerCase()]; return builder && row.tracking_number ? builder(row.tracking_number) : ""; }
function toLocalInput(value: unknown) { if (!value) return ""; const date = new Date(String(value)); if (Number.isNaN(date.getTime())) return ""; const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16); }
function normal(value: unknown) { return String(value || "").trim().toLowerCase().replaceAll("_", " "); }
function nice(value: unknown) { return String(value || "—").replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase()); }

export default function Shipments() {
  const [rows, setRows] = useState<Shipment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<Shipment>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [shipmentResult, clientResult] = await Promise.all([
      supabase.from("customer_shipments").select("*,customer_accounts(company_name,country)").order("created_at", { ascending: false }),
      supabase.from("customer_accounts").select("id,company_name,country").order("company_name"),
    ]);
    if (shipmentResult.error) setError(shipmentResult.error.message); else setRows((shipmentResult.data || []) as Shipment[]);
    if (clientResult.error) setError(previous => previous || clientResult.error.message); else setClients((clientResult.data || []) as Client[]);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2400); return () => window.clearTimeout(timer); }, [toast]);

  function startCreate() { setEditingId(null); setForm(blank); setOpen(true); }
  function startEdit(row: Shipment) { setEditingId(row.id || null); setForm({ ...blank, ...row, etd: toLocalInput(row.etd), eta: toLocalInput(row.eta) }); setOpen(true); }
  function selectClient(id: string) { const client = clients.find(value => value.id === id); setForm(previous => ({ ...previous, customer_id: id, client_name: client?.company_name || previous.client_name, country: client?.country || previous.country })); }

  async function save() {
    if (!form.customer_id || !form.reference_number.trim()) { setError("Client and reference number are required."); return; }
    setSaving(true); setError("");
    const payload = {
      ...form,
      id: undefined,
      customer_accounts: undefined,
      tracking_url: trackingUrl(form) || null,
      etd: form.etd ? new Date(form.etd).toISOString() : null,
      eta: form.eta ? new Date(form.eta).toISOString() : null,
      completion: Math.max(0, Math.min(100, Number(form.completion || 0))),
      updated_at: new Date().toISOString(),
    };
    const request = editingId ? supabase.from("customer_shipments").update(payload).eq("id", editingId) : supabase.from("customer_shipments").insert(payload);
    const { error: saveError } = await request;
    if (saveError) setError(saveError.message); else { setOpen(false); setEditingId(null); setForm(blank); setToast(editingId ? "Shipment updated" : "Shipment created"); await load(); }
    setSaving(false);
  }

  async function remove(row: Shipment) {
    if (!row.id || !window.confirm(`Delete shipment ${row.reference_number}?`)) return;
    const { error: deleteError } = await supabase.from("customer_shipments").delete().eq("id", row.id);
    if (deleteError) setError(deleteError.message); else { setToast("Shipment deleted"); await load(); }
  }

  const filtered = useMemo(() => rows.filter(row => {
    const haystack = `${row.reference_number} ${row.client_name || row.customer_accounts?.company_name || ""} ${row.country || ""} ${row.product || ""} ${row.tracking_number || ""} ${row.container_number || ""} ${row.bl_number || ""} ${row.carrier_name || ""}`.toLowerCase();
    const matchesStatus = statusFilter === "All" || normal(row.status || row.current_status) === normal(statusFilter);
    return matchesStatus && (!search || haystack.includes(search.toLowerCase()));
  }), [rows, search, statusFilter]);
  const active = rows.filter(row => !["delivered", "completed", "cancelled", "closed"].includes(normal(row.status || row.current_status)));

  return <AdminShell><div className="os-page"><header className="os-page-header"><div><div className="os-page-eyebrow">Live export operations</div><h1 className="os-page-title">Production & Shipments</h1><p className="os-page-subtitle">Create, edit and track real production stages, export documents, carriers, ETD, ETA and delivery progress.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/>Refresh</button><button className="os-btn primary" onClick={startCreate}><Plus/>Add Shipment</button></div></header>
    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body" style={{ display: "flex", gap: 12 }}><AlertTriangle/><div><strong>Live shipment data error</strong><p className="os-page-subtitle">{error}</p><p className="os-page-subtitle">Run <b>supabase/ENTERPRISE-B2B-LIVE-DATA.sql</b> if the new B2B fields are missing. No dummy shipments are shown.</p></div></div></section>}
    <div className="os-grid four">{[["All Shipments", rows.length, Ship], ["Active", active.length, Truck], ["Delivered", rows.filter(row => normal(row.current_stage || row.current_status) === "delivered").length, PackageSearch], ["Trackable", rows.filter(row => Boolean(trackingUrl(row))).length, ExternalLink]].map(([label, value, Icon]) => { const Component = Icon as typeof Ship; return <article className="os-metric" key={String(label)}><div className="os-metric-top"><span className="os-metric-label">{String(label)}</span><span className="os-metric-icon"><Component/></span></div><div className="os-metric-value">{String(value)}</div><div className="os-metric-foot"><b>Live records</b></div></article>; })}</div>
    <section className="os-card"><div className="os-card-header"><div><h2>Shipment Register</h2><p>{filtered.length} matching records</p></div><div className="os-page-actions"><label className="os-search-field"><Search/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Reference, client, product or tracking…"/></label><select className="os-field" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option>All</option><option>Active</option><option>Completed</option><option>Delayed</option><option>Cancelled</option></select></div></div><div className="os-card-body"><div className="os-table-wrap"><table className="os-table"><thead><tr><th>Reference</th><th>Client / Market</th><th>Product</th><th>Stage</th><th>Progress</th><th>Carrier / Tracking</th><th>ETD / ETA</th><th>Documents</th><th>Actions</th></tr></thead><tbody>{filtered.map(row => { const url = trackingUrl(row); return <tr key={row.id}><td><strong>{row.reference_number}</strong><small>{nice(row.freight_mode || row.shipment_type)}</small></td><td>{row.client_name || row.customer_accounts?.company_name || "—"}<small>{row.country || row.customer_accounts?.country || row.destination || "—"}</small></td><td>{row.product || "—"}<small>{row.quantity || "—"} · {row.incoterm || "—"}</small></td><td><span className="os-badge blue">{nice(row.current_stage || row.current_status)}</span><small>{row.recent_update || "No recent update"}</small></td><td><div className="os-progress"><span style={{ width: `${Math.max(0, Math.min(100, Number(row.completion || 0)))}%` }}/></div><small>{Number(row.completion || 0)}%</small></td><td>{row.carrier_name || nice(row.carrier_type)}<small>{row.tracking_number || row.container_number || row.bl_number || "—"}</small></td><td>{row.etd ? new Date(row.etd).toLocaleDateString() : "—"}<small>ETA {row.eta ? new Date(row.eta).toLocaleDateString() : "—"}</small></td><td><span className={`os-badge ${normal(row.document_status) === "complete" ? "green" : "amber"}`}>{nice(row.document_status)}</span></td><td><div style={{ display: "flex", gap: 6 }}>{url && <a className="os-icon-button" href={url} target="_blank" rel="noreferrer" aria-label="Open tracking"><ExternalLink/></a>}<button className="os-icon-button" onClick={() => startEdit(row)} aria-label="Edit"><Edit3/></button><button className="os-icon-button" onClick={() => void remove(row)} aria-label="Delete"><Trash2/></button></div></td></tr>; })}{!loading && !filtered.length && <tr><td colSpan={9}><div className="os-empty"><div className="os-empty-icon"><Truck/></div><h3>No shipment records found</h3><p>Create the first real shipment or adjust the filters.</p></div></td></tr>}</tbody></table></div></div></section>
    {open && <div className="os-modal-backdrop" onMouseDown={() => setOpen(false)}><section className="os-modal" style={{ width: "min(1050px,96vw)", maxHeight: "92vh", overflow: "auto" }} onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><h2>{editingId ? "Edit Shipment" : "Add Shipment"}</h2><p className="os-page-subtitle">Saved directly to customer_shipments.</p></div><button className="os-icon-button" onClick={() => setOpen(false)}><X/></button></div><div className="os-modal-body"><div className="os-form-grid">
      <label className="os-label"><span>Client *</span><select value={form.customer_id} onChange={event => selectClient(event.target.value)}><option value="">Select client</option>{clients.map(client => <option key={client.id} value={client.id}>{client.company_name}</option>)}</select></label>
      <Field label="Reference Number *" value={form.reference_number} onChange={value => setForm(previous => ({ ...previous, reference_number: value }))}/>
      <Field label="Client Name" value={form.client_name} onChange={value => setForm(previous => ({ ...previous, client_name: value }))}/>
      <Field label="Country / Market" value={form.country} onChange={value => setForm(previous => ({ ...previous, country: value }))}/>
      <Field label="Product" value={form.product} onChange={value => setForm(previous => ({ ...previous, product: value }))}/>
      <Field label="Quantity" value={form.quantity} onChange={value => setForm(previous => ({ ...previous, quantity: value }))}/>
      <Field label="Incoterm" value={form.incoterm} onChange={value => setForm(previous => ({ ...previous, incoterm: value }))}/>
      <Field label="Freight Mode" value={form.freight_mode} onChange={value => setForm(previous => ({ ...previous, freight_mode: value }))}/>
      <Field label="Container Type" value={form.container_type} onChange={value => setForm(previous => ({ ...previous, container_type: value }))}/>
      <label className="os-label"><span>Current Stage</span><select value={form.current_stage} onChange={event => setForm(previous => ({ ...previous, current_stage: event.target.value, completion: Math.round(stages.indexOf(event.target.value) / (stages.length - 1) * 100) }))}>{stages.map(stage => <option key={stage}>{stage}</option>)}</select></label>
      <label className="os-label"><span>Completion %</span><input type="number" min="0" max="100" value={form.completion} onChange={event => setForm(previous => ({ ...previous, completion: Number(event.target.value) }))}/></label>
      <label className="os-label"><span>Record Status</span><select value={form.status} onChange={event => setForm(previous => ({ ...previous, status: event.target.value }))}><option>Active</option><option>Completed</option><option>Delayed</option><option>Cancelled</option></select></label>
      <label className="os-label"><span>Document Status</span><select value={form.document_status} onChange={event => setForm(previous => ({ ...previous, document_status: event.target.value }))}><option>Pending</option><option>Incomplete</option><option>Under Review</option><option>Complete</option></select></label>
      <Field label="Carrier / Service" value={form.carrier_name} onChange={value => setForm(previous => ({ ...previous, carrier_name: value }))}/>
      <label className="os-label"><span>Carrier Type</span><select value={form.carrier_type} onChange={event => setForm(previous => ({ ...previous, carrier_type: event.target.value }))}>{["custom", "dhl", "fedex", "ups", "aramex", "tcs", "maersk", "msc", "cma_cgm"].map(value => <option key={value} value={value}>{nice(value)}</option>)}</select></label>
      <Field label="Tracking Number / AWB" value={form.tracking_number} onChange={value => setForm(previous => ({ ...previous, tracking_number: value }))}/>
      <Field label="Bill of Lading" value={form.bl_number} onChange={value => setForm(previous => ({ ...previous, bl_number: value }))}/>
      <Field label="Container Number" value={form.container_number} onChange={value => setForm(previous => ({ ...previous, container_number: value }))}/>
      <Field label="Vessel Name" value={form.vessel_name} onChange={value => setForm(previous => ({ ...previous, vessel_name: value }))}/>
      <Field label="Voyage Number" value={form.voyage_number} onChange={value => setForm(previous => ({ ...previous, voyage_number: value }))}/>
      <Field label="Origin" value={form.origin} onChange={value => setForm(previous => ({ ...previous, origin: value }))}/>
      <Field label="Destination" value={form.destination} onChange={value => setForm(previous => ({ ...previous, destination: value }))}/>
      <label className="os-label"><span>ETD</span><input type="datetime-local" value={form.etd} onChange={event => setForm(previous => ({ ...previous, etd: event.target.value }))}/></label>
      <label className="os-label"><span>ETA</span><input type="datetime-local" value={form.eta} onChange={event => setForm(previous => ({ ...previous, eta: event.target.value }))}/></label>
      <Field label="Custom Tracking URL" value={form.tracking_url} onChange={value => setForm(previous => ({ ...previous, tracking_url: value }))}/>
      <label className="os-label full"><span>Recent Update</span><textarea value={form.recent_update} onChange={event => setForm(previous => ({ ...previous, recent_update: event.target.value }))}/></label>
      <label className="os-label full"><span>Delay Reason</span><textarea value={form.delay_reason} onChange={event => setForm(previous => ({ ...previous, delay_reason: event.target.value }))}/></label>
      <label className="os-label full"><span>Notes</span><textarea value={form.notes} onChange={event => setForm(previous => ({ ...previous, notes: event.target.value }))}/></label>
    </div></div><div className="os-modal-footer"><button className="os-btn soft" onClick={() => setOpen(false)}>Cancel</button><button className="os-btn primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : editingId ? "Update Shipment" : "Create Shipment"}</button></div></section></div>}
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircleIcon/></span><div><strong>{toast}</strong><span>The live shipment register was updated.</span></div></div></div>}
  </div></AdminShell>;
}
function CheckCircleIcon() { return <span aria-hidden="true">✓</span>; }
function Field({ label, value, onChange }: { label: string; value: unknown; onChange: (value: string) => void }) { return <label className="os-label"><span>{label}</span><input value={String(value || "")} onChange={event => onChange(event.target.value)}/></label>; }
