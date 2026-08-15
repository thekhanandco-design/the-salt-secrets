"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-client";
import { supabase } from "@/lib/supabase-client";
import { CommercialSheetRow, readCommercialRows } from "@/lib/commercial-sheet";
import {
  Check, ChevronDown, Copy, Download, Eye, FileCheck2, FileDown, FilePlus2, Mail, MessageCircle,
  Pencil, Plus, Printer, RefreshCw, Save, Search, Send, ShieldCheck, Trash2, X,
} from "lucide-react";

type Row = Record<string, any>;
type CommercialTerm = CommercialSheetRow;
type LineItem = {
  product: string; export_reference: string; specification: string; packaging: string; moq: string;
  quantity: number; unit: string; unit_price: number; origin: string; hs_code: string;
  cartons: number; net_weight: number; gross_weight: number; dimensions: string; shipping_marks: string;
};
type DocumentForm = {
  id?: string; document_type: string; document_number: string; status: string; issue_date: string; valid_until: string;
  currency: string; incoterm: string; port_of_loading: string; port_of_discharge: string; payment_terms: string;
  delivery_terms: string; shipment_method: string; notes: string; certifications: string[];
  buyer_name: string; buyer_company: string; buyer_email: string; buyer_phone: string; buyer_address: string;
  shipping_address: string; buyer_country: string; company_name: string; company_email: string; company_phone: string;
  company_address: string; company_website: string; authorized_by: string; authorized_title: string; bank_details: string;
  freight: number; discount: number; insurance: number; tax_rate: number; items: LineItem[];
};

const documentTypes = [
  ["quotation", "Quotation"], ["proforma_invoice", "Proforma Invoice"], ["commercial_invoice", "Commercial Invoice"],
  ["packing_list", "Packing List"], ["sales_contract", "Sales Contract"], ["order_confirmation", "Order Confirmation"],
  ["sample_invoice", "Sample Invoice"], ["coa_cover", "COA Cover Document"], ["certificate_of_origin", "Certificate of Origin Cover"],
  ["specification_sheet", "Product Specification Sheet"], ["shipping_instruction", "Shipping Instruction"], ["delivery_note", "Delivery Note"],
  ["purchase_order_acknowledgement", "Purchase Order Acknowledgement"], ["inspection_request", "Inspection Request"], ["document_transmittal", "Document Transmittal"],
];
const statusOrder = ["Draft", "Internal Review", "Approved to Send", "Sent", "Viewed", "Revision Requested", "Accepted", "Signed", "Rejected", "Expired"];
const currencies = ["USD", "EUR", "GBP", "AED", "SAR", "CAD", "AUD", "PKR"];
const units = ["MT", "KG", "PCS", "BAGS", "CARTONS", "PALLETS", "CONTAINERS"];
const today = () => new Date().toISOString().slice(0, 10);
const blankItem = (): LineItem => ({ product: "", export_reference: "", specification: "", packaging: "", moq: "", quantity: 0, unit: "MT", unit_price: 0, origin: "Pakistan", hs_code: "", cartons: 0, net_weight: 0, gross_weight: 0, dimensions: "", shipping_marks: "" });
const blankForm = (): DocumentForm => ({
  document_type: "quotation", document_number: "", status: "Draft", issue_date: today(), valid_until: "", currency: "USD",
  incoterm: "", port_of_loading: "", port_of_discharge: "", payment_terms: "", delivery_terms: "", shipment_method: "",
  notes: "", certifications: [], buyer_name: "", buyer_company: "", buyer_email: "", buyer_phone: "", buyer_address: "",
  shipping_address: "", buyer_country: "", company_name: "Khan & Co.", company_email: "", company_phone: "",
  company_address: "", company_website: "", authorized_by: "", authorized_title: "", bank_details: "", freight: 0, discount: 0, insurance: 0,
  tax_rate: 0, items: [blankItem()],
});

function labelForType(type: string) { return documentTypes.find(item => item[0] === type)?.[1] || type.replaceAll("_", " "); }
function money(value: number, currency: string) { return `${currency} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function statusTone(status: string) { const value = status.toLowerCase(); if (["accepted", "signed"].includes(value)) return "green"; if (["rejected", "expired"].includes(value)) return "red"; if (["sent", "viewed"].includes(value)) return "blue"; if (value.includes("review") || value.includes("revision")) return "amber"; return "pink"; }
function documentHint(type: string) {
  if (type === "quotation") return "Offer validity, commercial terms and buyer approval are emphasized.";
  if (type === "proforma_invoice") return "Use for advance-payment or order-confirmation requirements before shipment.";
  if (type === "commercial_invoice") return "Use final invoice values, payment reference and shipment information.";
  if (type === "packing_list") return "Focus on carton count, net/gross weight, dimensions and shipment marks.";
  if (type === "sales_contract") return "Use for agreed products, commercial terms, delivery obligations and signature approval.";
  if (type === "sample_invoice") return "Use for sample shipments with declared value, courier details and product references.";
  if (type === "coa_cover") return "Use as the branded transmittal page for an approved Certificate of Analysis.";
  if (type === "certificate_of_origin") return "Use as the cover/transmittal page for origin documentation.";
  if (type === "specification_sheet") return "Use verified product specifications, packing, origin and technical references.";
  if (type === "shipping_instruction") return "Use shipment routing, carrier, consignee and document instructions.";
  if (type === "delivery_note") return "Use delivered quantities, receiver information and shipment references.";
  return "The form and live A4 letterhead preview adapt to the selected professional B2B document type.";
}

export default function QuotationsPage() {
  const [view, setView] = useState<"dashboard" | "create">("dashboard");
  const [form, setForm] = useState<DocumentForm>(blankForm());
  const [documents, setDocuments] = useState<Row[]>([]);
  const [products, setProducts] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<Row[]>([]);
  const [contacts, setContacts] = useState<Row[]>([]);
  const [commercialTerms, setCommercialTerms] = useState<CommercialTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [emailOpen, setEmailOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [attachPdf, setAttachPdf] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [docs, productsResult, companiesResult, contactsResult, letterheads, commercialResult] = await Promise.all([
      supabase.from("business_documents").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("products").select("*").order("title", { ascending: true }).limit(500),
      supabase.from("b2b_companies").select("*").order("name", { ascending: true }).limit(500),
      supabase.from("b2b_contacts").select("*").order("name", { ascending: true }).limit(500),
      supabase.from("document_letterheads").select("*").eq("is_default", true).limit(1).maybeSingle(),
      supabase.from("page_content").select("content").eq("page_slug", "internal-commercial-sheet").maybeSingle(),
    ]);
    if (docs.error) setError(docs.error.message);
    setDocuments(docs.data || []); setProducts(productsResult.data || []); setCompanies(companiesResult.data || []); setContacts(contactsResult.data || []); setCommercialTerms(readCommercialRows(commercialResult.data?.content).filter(row => row.status === "active"));
    if (letterheads.data) {
      const head = letterheads.data;
      setForm(current => ({ ...current, company_name: head.company_name || current.company_name, company_email: head.email || "", company_phone: head.phone || "", company_address: head.address || "", company_website: head.website || "", bank_details: head.bank_details || current.bank_details }));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "create") setView("create");
    const inquiryId = params.get("inquiry");
    if (inquiryId) void (async () => {
      const { data } = await supabase.from("inquiries").select("*").eq("id", inquiryId).maybeSingle();
      if (data) { setView("create"); setForm(current => ({ ...current, buyer_name: data.name || "", buyer_company: data.company || "", buyer_email: data.email || "", buyer_phone: data.whatsapp || "", buyer_country: data.country || "", items: [{ ...blankItem(), product: data.product || "", quantity: Number.parseFloat(data.quantity || "0") || 0 }] })); }
    })();
  }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2800); return () => window.clearTimeout(timer); }, [toast]);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
    const taxable = Math.max(0, subtotal + Number(form.freight || 0) + Number(form.insurance || 0) - Number(form.discount || 0));
    const tax = taxable * (Number(form.tax_rate || 0) / 100);
    return { subtotal, tax, grandTotal: taxable + tax, totalQuantity: form.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0) };
  }, [form]);

  const filtered = useMemo(() => documents.filter(row => {
    const text = `${row.document_number || ""} ${row.buyer_company || ""} ${row.buyer_name || ""} ${row.buyer_country || ""}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (statusFilter === "all" || String(row.status || "Draft") === statusFilter);
  }), [documents, search, statusFilter]);

  const counts = useMemo(() => Object.fromEntries(statusOrder.map(status => [status, documents.filter(row => String(row.status || "Draft") === status).length])), [documents]);

  function patch<K extends keyof DocumentForm>(key: K, value: DocumentForm[K]) { setForm(previous => ({ ...previous, [key]: value })); }
  function patchItem(index: number, key: keyof LineItem, value: any) { setForm(previous => ({ ...previous, items: previous.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) })); }
  function applyProduct(index: number, productId: string) {
    const product = products.find(row => String(row.id) === productId);
    if (!product) return;
    const terms = commercialTerms.filter(term => String(term.product_id || "") === productId || (!term.product_id && term.product_name === (product.title || product.name)));
    const selected = terms.find(term => String(term.currency || "USD") === form.currency) || terms[0];
    const incoterm = form.incoterm.toUpperCase();
    const suggestedPrice = incoterm.startsWith("EXW") ? selected?.ex_factory_price : selected?.fob_price || selected?.private_label_price || selected?.ex_factory_price;
    setForm(previous => ({ ...previous, items: previous.items.map((item, itemIndex) => itemIndex === index ? {
      ...item,
      product: product.title || product.name || "",
      export_reference: selected?.export_reference || product.product_code || product.export_reference || "",
      specification: [selected?.pack_size, product.grade, product.grain_type, product.mesh_size].filter(Boolean).join(" · "),
      packaging: selected?.packaging || product.packaging || product.packaging_options || "",
      moq: selected?.moq || product.moq || "",
      unit_price: Number(suggestedPrice || item.unit_price || 0),
      hs_code: product.hs_code || "",
    } : item) }));
  }
  function selectCompany(companyId: string) {
    const company = companies.find(row => String(row.id) === companyId); if (!company) return;
    const contact = contacts.find(row => String(row.company_id) === companyId);
    setForm(previous => ({ ...previous, buyer_company: company.name || "", buyer_country: company.country || "", buyer_name: contact?.name || company.primary_contact_name || "", buyer_email: contact?.email || company.primary_contact_email || "", buyer_phone: contact?.phone_whatsapp || "" }));
  }

  async function save(nextStatus?: string) {
    setSaving(true); setError("");
    const status = nextStatus || form.status || "Draft";
    const payload = {
      ...form, status, items: form.items, certifications: form.certifications, subtotal: totals.subtotal, tax_amount: totals.tax,
      grand_total: totals.grandTotal, total_quantity: totals.totalQuantity, buyer_address: form.buyer_address,
      shipping_address: form.shipping_address, updated_at: new Date().toISOString(),
    };
    const result = form.id
      ? await supabase.from("business_documents").update(payload).eq("id", form.id).select().single()
      : await supabase.from("business_documents").insert(payload).select().single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return null; }
    setForm(result.data as DocumentForm); setToast(nextStatus ? `Document moved to ${nextStatus}` : "Document saved"); await load(); return result.data as DocumentForm;
  }

  function newDocument() { setForm(blankForm()); setView("create"); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function editDocument(row: Row) { setForm({ ...blankForm(), ...row, certifications: Array.isArray(row.certifications) ? row.certifications : [], items: Array.isArray(row.items) && row.items.length ? row.items : [blankItem()] }); setView("create"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function deleteDocument(id: string) { if (!window.confirm("Permanently delete this document?")) return; const { error: deleteError } = await supabase.from("business_documents").delete().eq("id", id); if (deleteError) setError(deleteError.message); else { setToast("Document deleted"); await load(); } }
  async function duplicateDocument(row: Row) { const copy = { ...row }; delete copy.id; delete copy.created_at; copy.document_number = null; copy.status = "Draft"; copy.issue_date = today(); const { data, error: duplicateError } = await supabase.from("business_documents").insert(copy).select().single(); if (duplicateError) setError(duplicateError.message); else { setToast("Revision copy created"); await load(); if (data) editDocument(data); } }

  function apiPayload(document = form) { return { ...document, freight: Number(document.freight || 0), insurance: Number(document.insurance || 0), discount: Number(document.discount || 0), tax_rate: Number(document.tax_rate || 0), items: document.items.map(item => ({ ...item, quantity: Number(item.quantity || 0), unit_price: Number(item.unit_price || 0) })) }; }
  async function downloadPdf() {
    setSaving(true); setError("");
    try {
      const persisted = form.id ? form : await save(); if (!persisted) return;
      const response = await adminFetch("/api/admin/documents/pdf", { method: "POST", body: JSON.stringify(apiPayload(persisted)) });
      if (!response.ok) { const payload = await response.json(); throw new Error(payload.error || "PDF generation failed."); }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${persisted.document_number || "document"}.pdf`; anchor.click(); URL.revokeObjectURL(url); setToast("PDF generated and downloaded");
    } catch (downloadError) { setError(downloadError instanceof Error ? downloadError.message : "PDF generation failed."); }
    finally { setSaving(false); }
  }
  function printDocument() {
    const source = document.getElementById("quotation-print");
    if (!source) { setError("Document preview is not ready yet."); return; }
    const printWindow = window.open("", "salt-origin-document-print", "width=980,height=900");
    if (!printWindow) { setError("Allow pop-ups to print this document."); return; }
    const stylesheetLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(link => `<link rel="stylesheet" href="${link.href}">`).join("");
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${(form.document_number || labelForType(form.document_type)).replace(/[<>]/g, "")}</title>${stylesheetLinks}<style>
      html,body{margin:0!important;padding:0!important;background:#fff!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
      body{display:flex!important;justify-content:center!important;align-items:flex-start!important}
      .a4-document{visibility:visible!important;width:210mm!important;height:297mm!important;min-height:297mm!important;margin:0!important;padding:12mm 10mm!important;box-sizing:border-box!important;box-shadow:none!important;border:0!important;overflow:hidden!important;transform:none!important}
      .a4-document *{visibility:visible!important}
      @page{size:A4 portrait;margin:0}
      @media print{html,body{width:210mm;height:297mm}.a4-document{page-break-after:avoid!important}}
    </style></head><body>${source.outerHTML}</body></html>`);
    printWindow.document.close();
    const runPrint = async () => {
      try { await Promise.all(Array.from(printWindow.document.images).map(image => image.complete ? Promise.resolve() : new Promise<void>(resolve => { image.onload = () => resolve(); image.onerror = () => resolve(); }))); } catch {}
      printWindow.focus(); printWindow.print();
    };
    window.setTimeout(() => void runPrint(), 700);
  }
  async function sendEmail() {
    setSaving(true); setError(""); try {
      const persisted = form.id ? form : await save(); if (!persisted) return;
      const response = await adminFetch("/api/admin/documents/email", { method: "POST", body: JSON.stringify({ document: apiPayload(persisted), message, attachPdf }) }); const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Email send failed."); setEmailOpen(false); setToast("Document sent by email"); await load();
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "Email send failed."); } finally { setSaving(false); }
  }
  async function sendWhatsapp() {
    setSaving(true); setError(""); try {
      const persisted = form.id ? form : await save(); if (!persisted) return;
      const response = await adminFetch("/api/admin/documents/whatsapp", { method: "POST", body: JSON.stringify({ document: apiPayload(persisted), message }) }); const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "WhatsApp send failed."); setWhatsappOpen(false); setToast("PDF sent through WhatsApp Cloud API"); await load();
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "WhatsApp send failed."); } finally { setSaving(false); }
  }

  return <AdminShell><div className="os-page quotation-page">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Export document operations</div><h1 className="os-page-title">Quotations & Export Documents</h1><p className="os-page-subtitle">Create real B2B quotations, invoices and export documents with live calculations, A4 preview, PDF, email and WhatsApp workflows.</p></div><div className="os-page-actions"><button className={`os-btn ${view === "dashboard" ? "primary" : "soft"}`} onClick={() => setView("dashboard")}>Quotation Dashboard</button><button className={`os-btn ${view === "create" ? "primary" : "soft"}`} onClick={newDocument}><FilePlus2/>Create Document</button></div></header>

    {error && <section className="os-card quotation-error"><div className="os-card-body"><strong>Action could not be completed</strong><p className="os-page-subtitle">{error}</p></div></section>}

    {view === "dashboard" ? <>
      <section className="quotation-status-grid">{["Draft", "Sent", "Viewed", "Accepted", "Rejected", "Expired", "Revision Requested", "Internal Review"].map(status => <button key={status} className="quotation-status-card" onClick={() => setStatusFilter(status)}><span>{status}</span><strong>{counts[status] || 0}</strong><small>Live records</small></button>)}</section>
      <section className="os-card"><div className="os-card-header"><div><h2>Quotation Dashboard</h2><p>{filtered.length} business documents</p></div><button className="os-btn primary" onClick={newDocument}><Plus/>Create Document</button></div><div className="os-card-body"><div className="os-toolbar"><label className="os-search-field"><Search/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search document, company or country…"/></label><select className="os-field" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All Statuses</option>{statusOrder.map(status => <option key={status}>{status}</option>)}</select><button className="os-btn soft" onClick={() => void load()}><RefreshCw/>Refresh</button></div></div><div className="os-table-wrap"><table className="os-table"><thead><tr><th>Document</th><th>Client / Company</th><th>Country</th><th>Products</th><th>Issue</th><th>Expiry</th><th>Quantity</th><th>Incoterm</th><th>Status</th><th>Total</th><th>Actions</th></tr></thead><tbody>{filtered.map(row => <tr key={row.id}><td><div className="quotation-cell-stack"><strong>{row.document_number || "Draft"}</strong><span className="quotation-cell-kicker">{labelForType(row.document_type)}</span></div></td><td><div className="quotation-cell-stack"><strong>{row.buyer_name || "—"}</strong>{row.buyer_company ? <span>{row.buyer_company}</span> : null}{row.buyer_email ? <span>{row.buyer_email}</span> : null}</div></td><td>{row.buyer_country || "—"}</td><td>{Array.isArray(row.items) ? row.items.map((item: Row) => item.product).filter(Boolean).slice(0, 2).join(", ") || "—" : "—"}</td><td>{row.issue_date || "—"}</td><td>{row.valid_until || "—"}</td><td>{Number(row.total_quantity || 0).toLocaleString()}</td><td>{row.incoterm || "—"}</td><td><span className={`os-badge ${statusTone(row.status || "Draft")}`}>{row.status || "Draft"}</span></td><td>{money(Number(row.grand_total || 0), row.currency || "USD")}</td><td><div className="quotation-row-actions"><button className="os-icon-button" onClick={() => editDocument(row)} title="Edit"><Pencil/></button><button className="os-icon-button" onClick={() => duplicateDocument(row)} title="Create revision"><Copy/></button><button className="os-icon-button" onClick={() => deleteDocument(row.id)} title="Delete"><Trash2/></button></div></td></tr>)}</tbody></table></div>{!loading && !filtered.length && <div className="os-empty"><div className="os-empty-icon"><FileCheck2/></div><h3>No quotations or documents found</h3><p>Create your first export document to begin the commercial record.</p><button className="os-btn primary" onClick={newDocument}><Plus/>Create Document</button></div>}</section>
    </> : <>
      <section className="quotation-builder-top"><div className="quotation-type-tabs">{documentTypes.slice(0, 3).map(([value, label]) => <button key={value} className={form.document_type === value ? "active" : ""} onClick={() => patch("document_type", value)}>{label}</button>)}<select value={form.document_type} onChange={event => patch("document_type", event.target.value)}>{documentTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div><div className="quotation-progress">{["Draft", "Internal Review", "Approved to Send", "Sent"].map((step, index) => { const currentIndex = Math.max(0, ["Draft", "Internal Review", "Approved to Send", "Sent", "Viewed", "Revision Requested", "Accepted", "Signed"].indexOf(form.status)); return <div className={currentIndex >= index ? "done" : ""} key={step}><i>{currentIndex > index ? <Check/> : index + 1}</i><span>{step}</span></div>; })}</div><div className="quotation-top-actions"><button className="os-btn soft" onClick={() => void save()} disabled={saving}><Save/>Save Draft</button><button className="os-btn soft" onClick={printDocument}><Eye/>Preview PDF</button><button className="os-btn primary" onClick={() => void downloadPdf()} disabled={saving}><FileDown/>Generate PDF</button><button className="os-btn dark" onClick={() => { setMessage(""); setEmailOpen(true); }}><Send/>Send to Buyer<ChevronDown/></button></div></section>

      <section className="os-card" style={{boxShadow:"none"}}><div className="os-card-body" style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><div><strong>{labelForType(form.document_type)} workflow</strong><p className="os-page-subtitle" style={{marginTop:4}}>{documentHint(form.document_type)}</p></div><a className="os-btn soft" href="/admin/commercial-sheet">Open Product Commercial Sheet</a></div></section>

      <div className="quotation-builder-grid">
        <div className="quotation-form-column">
          <EditorSection number="1" title="Buyer Information">
            <div className="quotation-form-grid"><label><span>Existing Company</span><select defaultValue="" onChange={event => selectCompany(event.target.value)}><option value="">Select company…</option>{companies.map(company => <option value={company.id} key={company.id}>{company.name}{company.country ? ` · ${company.country}` : ""}</option>)}</select></label><Field label="Buyer Name *" value={form.buyer_name} onChange={value => patch("buyer_name", value)}/><Field label="Company *" value={form.buyer_company} onChange={value => patch("buyer_company", value)}/><Field label="Country" value={form.buyer_country} onChange={value => patch("buyer_country", value)}/><Field label="Email" type="email" value={form.buyer_email} onChange={value => patch("buyer_email", value)}/><Field label="Phone / WhatsApp" value={form.buyer_phone} onChange={value => patch("buyer_phone", value)}/><Field label="Billing Address" className="span-2" value={form.buyer_address} onChange={value => patch("buyer_address", value)}/><Field label="Shipping Address" className="span-2" value={form.shipping_address} onChange={value => patch("shipping_address", value)}/></div>
          </EditorSection>

          <EditorSection number="2" title="Document Details"><div className="quotation-form-grid"><Field label="Document Number" value={form.document_number} onChange={value => patch("document_number", value)} placeholder="Automatically assigned when saved"/><Field label="Issue Date *" type="date" value={form.issue_date} onChange={value => patch("issue_date", value)}/><Field label="Valid Until" type="date" value={form.valid_until} onChange={value => patch("valid_until", value)}/><label><span>Currency</span><select value={form.currency} onChange={event => patch("currency", event.target.value)}>{currencies.map(currency => <option key={currency}>{currency}</option>)}</select></label><Field label="Incoterm" value={form.incoterm} onChange={value => patch("incoterm", value)} placeholder="FOB, CFR, CIF, DDP…"/><Field label="Port of Loading" value={form.port_of_loading} onChange={value => patch("port_of_loading", value)}/><Field label="Port of Discharge" className="span-2" value={form.port_of_discharge} onChange={value => patch("port_of_discharge", value)}/>{form.document_type === "commercial_invoice" && <><Field label="Payment Reference" value={form.document_number} onChange={value => patch("document_number", value)}/><Field label="Final Shipment Method" value={form.shipment_method} onChange={value => patch("shipment_method", value)}/></>}{form.document_type === "proforma_invoice" && <><Field label="Advance Payment Terms" value={form.payment_terms} onChange={value => patch("payment_terms", value)}/><Field label="Order Confirmation Lead Time" value={form.delivery_terms} onChange={value => patch("delivery_terms", value)}/></>}</div></EditorSection>

          <EditorSection number="3" title="Line Items"><div className="quotation-line-scroll"><table className="quotation-line-table"><thead><tr><th>#</th><th>Product</th><th>Specification / Grain Size</th><th>MOQ</th><th>Quantity</th><th>Unit</th><th>Unit Price ({form.currency})</th><th>Packaging</th><th>Total</th><th/></tr></thead><tbody>{form.items.map((item, index) => <tr key={index}><td>{index + 1}</td><td><select value={products.find(row => (row.title || row.name) === item.product)?.id || ""} onChange={event => applyProduct(index, event.target.value)}><option value="">Select product…</option>{products.map(product => <option key={product.id} value={product.id}>{product.title || product.name}</option>)}</select><input value={item.product} onChange={event => patchItem(index, "product", event.target.value)} placeholder="Product name"/></td><td><textarea value={item.specification} onChange={event => patchItem(index, "specification", event.target.value)} rows={2}/></td><td><input value={item.moq} onChange={event => patchItem(index, "moq", event.target.value)}/></td><td><input type="number" min="0" step="any" value={item.quantity} onChange={event => patchItem(index, "quantity", Number(event.target.value))}/></td><td><select value={item.unit} onChange={event => patchItem(index, "unit", event.target.value)}>{units.map(unit => <option key={unit}>{unit}</option>)}</select></td><td><input type="number" min="0" step="any" value={item.unit_price} onChange={event => patchItem(index, "unit_price", Number(event.target.value))}/></td><td><textarea value={item.packaging} onChange={event => patchItem(index, "packaging", event.target.value)} rows={2}/></td><td><strong>{money(item.quantity * item.unit_price, form.currency)}</strong></td><td><button className="quotation-remove" onClick={() => setForm(previous => ({ ...previous, items: previous.items.filter((_, itemIndex) => itemIndex !== index) }))} disabled={form.items.length === 1}><Trash2/></button></td></tr>)}</tbody></table></div><button className="quotation-add-item" onClick={() => setForm(previous => ({ ...previous, items: [...previous.items, blankItem()] }))}><Plus/>Add Item</button></EditorSection>
          {form.document_type === "packing_list" && <EditorSection number="3A" title="Packing List Details"><div className="packing-detail-grid">{form.items.map((item,index)=><article key={index}><strong>{item.product || `Item ${index+1}`}</strong><div className="quotation-form-grid"><Field label="Cartons / Packages" type="number" value={String(item.cartons || 0)} onChange={value=>patchItem(index,"cartons",Number(value))}/><Field label="Net Weight (kg)" type="number" value={String(item.net_weight || 0)} onChange={value=>patchItem(index,"net_weight",Number(value))}/><Field label="Gross Weight (kg)" type="number" value={String(item.gross_weight || 0)} onChange={value=>patchItem(index,"gross_weight",Number(value))}/><Field label="Dimensions" value={item.dimensions || ""} onChange={value=>patchItem(index,"dimensions",value)} placeholder="L × W × H"/><Field label="Shipping Marks" className="span-2" value={item.shipping_marks || ""} onChange={value=>patchItem(index,"shipping_marks",value)}/></div></article>)}</div></EditorSection>}

          <EditorSection number="4" title="Commercial Terms"><div className="quotation-form-grid"><Field label="Payment Terms" value={form.payment_terms} onChange={value => patch("payment_terms", value)}/><Field label="Delivery Timeline" value={form.delivery_terms} onChange={value => patch("delivery_terms", value)}/><Field label="Shipment Method" value={form.shipment_method} onChange={value => patch("shipment_method", value)}/><Field label="Certifications / Attachments" value={form.certifications.join(", ")} onChange={value => patch("certifications", value.split(",").map(item => item.trim()).filter(Boolean))}/>{["proforma_invoice","commercial_invoice","quotation","sales_contract"].includes(form.document_type) && <label className="span-2"><span>Bank Details</span><textarea value={form.bank_details} onChange={event => patch("bank_details", event.target.value)} rows={4} placeholder="Account title, bank, account/IBAN, SWIFT and beneficiary address"/></label>}<label className="span-2"><span>Notes / Remarks</span><textarea value={form.notes} onChange={event => patch("notes", event.target.value)} rows={4}/></label></div></EditorSection>

          <section className="quotation-summary"><div><span>Subtotal</span><strong>{money(totals.subtotal, form.currency)}</strong><span>Freight / Logistics</span><input type="number" min="0" value={form.freight} onChange={event => patch("freight", Number(event.target.value))}/><span>Insurance</span><input type="number" min="0" value={form.insurance} onChange={event => patch("insurance", Number(event.target.value))}/><span>Discount</span><input type="number" min="0" value={form.discount} onChange={event => patch("discount", Number(event.target.value))}/><span>Tax %</span><input type="number" min="0" value={form.tax_rate} onChange={event => patch("tax_rate", Number(event.target.value))}/></div><div className="quotation-grand"><span>Grand Total</span><strong>{money(totals.grandTotal, form.currency)}</strong><small>{totals.totalQuantity.toLocaleString()} total units</small></div></section>
        </div>

        <div className="quotation-preview-column"><DocumentPreview form={form} totals={totals}/><div className="quotation-preview-actions"><button className="os-btn soft" onClick={printDocument}><Printer/>Print</button><button className="os-btn soft" onClick={() => void save("Internal Review")}><ShieldCheck/>Internal Approval</button><button className="os-btn soft" onClick={() => void downloadPdf()}><Download/>PDF</button><button className="os-btn" onClick={() => { setMessage(""); setEmailOpen(true); }}><Mail/>Email</button><button className="os-btn" onClick={() => { setMessage(""); setWhatsappOpen(true); }}><MessageCircle/>WhatsApp</button></div></div>
      </div>
    </>}

    {emailOpen && <SendModal title="Send by Email" icon={<Mail/>} onClose={() => setEmailOpen(false)}><div className="send-recipient"><strong>{form.buyer_name || "Client name required"}</strong><span>{form.buyer_email || "Client email required"}</span></div><label className="os-label"><span>Email Message</span><textarea rows={7} value={message} onChange={event => setMessage(event.target.value)} placeholder="Write a professional message or leave blank to use the formatted default email."/></label><label className="quotation-toggle"><input type="checkbox" checked={attachPdf} onChange={event => setAttachPdf(event.target.checked)}/><span>Attach generated PDF</span></label><div className="send-preview"><b>Preview</b><p>Dear {form.buyer_name || "Client"},</p><p>{message || `Please find our ${labelForType(form.document_type)} ${form.document_number || ""}. Kindly review and reply with any required revision.`}</p><p>Regards,<br/>{form.authorized_by || "Authorized representative"}<br/>{form.company_name}</p></div><button className="os-btn primary send-full" disabled={saving || !form.buyer_email} onClick={() => void sendEmail()}><Send/>{saving ? "Sending…" : "Send Email"}</button></SendModal>}
    {whatsappOpen && <SendModal title="Send PDF on WhatsApp" icon={<MessageCircle/>} onClose={() => setWhatsappOpen(false)}><div className="send-recipient"><strong>{form.buyer_name || "Client name required"}</strong><span>{form.buyer_phone || "WhatsApp number required"}</span></div><label className="os-label"><span>WhatsApp Message</span><textarea rows={6} value={message} onChange={event => setMessage(event.target.value)} placeholder="Message shown with the attached PDF."/></label><div className="send-file"><FileDown/><div><strong>{form.document_number || "Draft"}.pdf</strong><span>Generated from the current document</span></div></div><button className="os-btn primary send-full" disabled={saving || !form.buyer_phone} onClick={() => void sendWhatsapp()}><MessageCircle/>{saving ? "Sending…" : "Send PDF"}</button></SendModal>}

    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><Check/></span><div><strong>{toast}</strong><span>The action used the current live document data.</span></div></div></div>}
  </div></AdminShell>;
}

function Field({ label, value, onChange, type = "text", className = "", placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string; placeholder?: string }) { return <label className={className}><span>{label}</span><input type={type} value={value || ""} onChange={event => onChange(event.target.value)} placeholder={placeholder}/></label>; }
function EditorSection({ number, title, children }: { number: string; title: string; children: ReactNode }) { return <section className="quotation-editor-section"><header><i>{number}</i><strong>{title}</strong></header><div>{children}</div></section>; }
function SendModal({ title, icon, onClose, children }: { title: string; icon: ReactNode; onClose: () => void; children: ReactNode }) { return <div className="os-modal-backdrop" onMouseDown={onClose}><section className="os-modal send-modal" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div className="send-title">{icon}<div><h2>{title}</h2><p>Review recipient, message and attachment before sending.</p></div></div><button className="os-icon-button" onClick={onClose}><X/></button></div><div className="os-modal-body">{children}</div></section></div>; }

function DocumentPreview({ form, totals }: { form: DocumentForm; totals: { subtotal: number; tax: number; grandTotal: number } }) {
  const terms = [
    form.payment_terms ? `Payment: ${form.payment_terms}` : "",
    form.delivery_terms ? `Delivery: ${form.delivery_terms}` : "",
    form.shipment_method ? `Shipment: ${form.shipment_method}` : "",
    form.certifications.length ? `Certifications: ${form.certifications.join(", ")}` : "",
    form.notes || "",
  ].filter(Boolean);
  return <article id="quotation-print" className="a4-document a4-khan-document">
    <header className="a4-khan-header">
      <div className="a4-khan-brand"><img src="/khan-co-logo.png" alt="Khan & Co."/><div><strong>{form.company_name || "Khan & Co."}</strong><span>Himalayan Pink Salt Exporter & Private Label Partner</span></div></div>
      <h2>{labelForType(form.document_type)}</h2>
    </header>
    <div className="a4-khan-red-rule"/>
    <section className="a4-khan-contact-line">
      <span>{form.company_address || ""}</span><span>{form.company_email || ""}</span><span>{form.company_phone || ""}</span><span>{form.company_website || ""}</span>
    </section>
    <section className="a4-khan-parties">
      <div className="a4-khan-quote-to"><b>{form.document_type === "quotation" ? "QUOTE TO:" : "BILL TO:"}</b><strong>{form.buyer_company || form.buyer_name || ""}</strong>{form.buyer_name && form.buyer_company ? <span>{form.buyer_name}</span> : null}<span>{form.buyer_address}</span><span>{form.buyer_country}</span><span>{form.buyer_email}</span><span>{form.buyer_phone}</span></div>
      <div className="a4-khan-meta">{[["Document No.", form.document_number || "DRAFT"], ["Date", form.issue_date], ["Valid Until", form.valid_until], ["Incoterms", form.incoterm], ["Payment", form.payment_terms], ["Currency", form.currency], ["Origin", form.items.find(item => item.origin)?.origin || "Pakistan"]].map(([label, value]) => <p key={label}><b>{label}</b><span>{value || "—"}</span></p>)}</div>
    </section>
    <table className="a4-khan-table"><thead><tr><th>Sr#</th><th>Product Description</th><th>Specification</th><th>MOQ</th><th>Quantity</th><th>Unit</th><th>Packaging</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>{form.items.map((item, index) => <tr key={index}><td>{index + 1}</td><td><strong>{item.product || ""}</strong>{item.export_reference ? <small>{item.export_reference}</small> : null}</td><td>{item.specification || ""}</td><td>{item.moq || ""}</td><td>{Number(item.quantity || 0).toLocaleString()}</td><td>{item.unit}</td><td>{[item.packaging, form.document_type === "packing_list" && item.cartons ? `${item.cartons} pkgs` : "", form.document_type === "packing_list" && item.net_weight ? `NW ${item.net_weight} kg` : "", form.document_type === "packing_list" && item.gross_weight ? `GW ${item.gross_weight} kg` : "", form.document_type === "packing_list" ? item.dimensions : ""].filter(Boolean).join(" · ")}</td><td>{money(item.unit_price, form.currency)}</td><td>{money(item.quantity * item.unit_price, form.currency)}</td></tr>)}</tbody></table>
    <section className="a4-khan-financials"><div className="a4-khan-terms"><h3>{form.document_type === "commercial_invoice" ? "Payment & Shipment Terms" : form.document_type === "packing_list" ? "Packing & Shipment Notes" : "Terms & Conditions"}</h3>{terms.length ? <ul>{terms.map((term, index) => <li key={`${index}-${term}`}>{term}</li>)}</ul> : <p>No commercial terms entered.</p>}</div><div className="a4-khan-totals"><p><span>Subtotal</span><b>{money(totals.subtotal, form.currency)}</b></p>{form.freight ? <p><span>Freight / Logistics</span><b>{money(form.freight, form.currency)}</b></p> : null}{form.insurance ? <p><span>Insurance</span><b>{money(form.insurance, form.currency)}</b></p> : null}{form.discount ? <p><span>Discount</span><b>- {money(form.discount, form.currency)}</b></p> : null}{form.tax_rate ? <p><span>Tax</span><b>{money(totals.tax, form.currency)}</b></p> : null}<p className="a4-khan-grand"><span>Grand Total</span><b>{money(totals.grandTotal, form.currency)}</b></p></div></section>
    {form.bank_details && ["proforma_invoice","commercial_invoice","quotation","sales_contract"].includes(form.document_type) ? <section className="a4-khan-bank"><b>Bank Details</b><p>{form.bank_details}</p></section> : null}
    <section className="a4-khan-signature"><div><span>For & On Behalf of:</span><strong>{form.company_name || "Khan & Co."}</strong><img src="/khan-co-logo.png" alt="Khan & Co. authorized mark"/><small>Authorized Signature / Stamp</small></div><em>We look forward to doing business with you!</em></section>
    <footer className="a4-khan-footer"><span>{form.company_name || "Khan & Co."}</span><span>{form.document_number || "Draft Document"}</span></footer>
  </article>;
}
