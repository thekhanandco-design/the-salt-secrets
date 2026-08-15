"use client";

import Image from "next/image";
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetch } from "@/lib/admin-client";
import { supabase } from "@/lib/supabase-client";
import { FACILITY_CERTIFICATIONS, certificationMatches, type FacilityCertification } from "@/lib/certification-catalog";
import { CheckCircle2, ExternalLink, Eye, EyeOff, FileCheck2, Mail, RefreshCw, Send, UploadCloud, X } from "lucide-react";

type Cert = Record<string, any> & { id: string; document_name: string; category: string };
type RequestRow = Record<string, any> & { id: number; name?: string; email?: string; company?: string; whatsapp?: string; metadata?: any };

export default function CertificationsAdminPage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [uploadSlot, setUploadSlot] = useState<string>("");
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      supabase.from("certifications").select("*").order("created_at", { ascending: false }),
      supabase.from("inquiries").select("*").eq("form_name", "Certificate Request").order("created_at", { ascending: false }).limit(200),
    ]);
    if (a.error) setError(a.error.message); else setCerts((a.data || []) as Cert[]);
    if (b.error) setError((value) => value || b.error!.message); else setRequests((b.data || []) as RequestRow[]);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);

  const slots = useMemo(() => FACILITY_CERTIFICATIONS.map((slot) => ({
    ...slot,
    record: certs.find((cert) => certificationMatches(cert, slot)),
  })), [certs]);

  async function ensureRecord(slot: FacilityCertification, visibility = "Public") {
    const existing = certs.find((cert) => certificationMatches(cert, slot));
    if (existing) return existing;
    const { data, error: insertError } = await supabase.from("certifications").insert({
      document_name: slot.name,
      category: slot.name,
      file_url: null,
      visibility,
      status: "Active",
      updated_at: new Date().toISOString(),
    }).select("*").single();
    if (insertError) throw insertError;
    return data as Cert;
  }

  async function syncCatalog() {
    setWorking("sync"); setError("");
    try {
      for (const slot of FACILITY_CERTIFICATIONS) await ensureRecord(slot);
      setToast("Facility certification list synced.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sync certification list.");
    } finally { setWorking(""); }
  }

  async function toggleVisibility(slot: FacilityCertification) {
    setWorking(`visibility:${slot.key}`); setError("");
    try {
      const record = await ensureRecord(slot);
      const next = String(record.visibility || "Public").toLowerCase() === "hidden" ? "Public" : "Hidden";
      const result = await supabase.from("certifications").update({ visibility: next, updated_at: new Date().toISOString() }).eq("id", record.id);
      if (result.error) throw result.error;
      setToast(`${slot.name} is now ${next === "Hidden" ? "hidden" : "visible"}.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to change visibility.");
    } finally { setWorking(""); }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !uploadSlot) return;
    setWorking("upload"); setError("");
    try {
      const slot = FACILITY_CERTIFICATIONS.find((item) => item.name === uploadSlot);
      if (!slot) throw new Error("Unknown certification slot.");
      const path = `certifications/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const up = await supabase.storage.from("cms-media").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const url = supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl;
      const existing = await ensureRecord(slot);
      const result = await supabase.from("certifications").update({
        document_name: slot.name,
        category: slot.name,
        file_url: url,
        visibility: existing.visibility || "Public",
        status: "Active",
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
      if (result.error) throw result.error;
      setToast(`${slot.name} document saved.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload document.");
    } finally {
      setWorking(""); event.target.value = ""; setUploadSlot("");
    }
  }

  function beginSend(row: RequestRow) {
    setSelectedRequest(row);
    const requested = Array.isArray(row.metadata?.certificates) ? row.metadata.certificates : [];
    setSelectedCerts(certs.filter((cert) => requested.some((label: string) => String(cert.category || cert.document_name).toLowerCase().includes(String(label).toLowerCase().split(" ")[0]))).map((cert) => cert.id));
  }

  async function send() {
    if (!selectedRequest || !selectedCerts.length) return;
    setWorking("send"); setError("");
    try {
      const response = await adminFetch("/api/admin/certification-request-send", { method: "POST", body: JSON.stringify({ inquiryId: selectedRequest.id, certificationIds: selectedCerts, email: true, whatsapp: true }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to send documents.");
      if (payload.whatsappUrl && !payload.whatsappSent) window.open(payload.whatsappUrl, "_blank", "noopener,noreferrer");
      setToast(`Request approved. Email ${payload.emailSent ? "sent" : "not sent"}; WhatsApp ${payload.whatsappSent ? "sent" : "opened for manual send"}.`);
      setSelectedRequest(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send documents.");
    } finally { setWorking(""); }
  }

  return (
    <AdminShell>
      <div className="os-page certifications-admin-v2">
        <header className="os-page-header">
          <div><div className="os-page-eyebrow">Quality Documents</div><h1 className="os-page-title">Certifications</h1><p className="os-page-subtitle">Manage manufacturing/packing facility documents, public visibility and buyer access requests.</p></div>
          <div className="os-actions"><button className="os-btn soft" onClick={() => void syncCatalog()} disabled={working === "sync"}><RefreshCw />{working === "sync" ? "Syncing…" : "Sync Certification List"}</button><button className="os-btn soft" onClick={() => void load()}><RefreshCw />Refresh</button></div>
        </header>
        {error ? <section className="os-card content-alert"><strong>Certification action needs attention</strong><p>{error}</p></section> : null}

        <div className="cert-admin-grid">
          {slots.map((slot) => {
            const hidden = String(slot.record?.visibility || "Public").toLowerCase() === "hidden";
            return (
              <article className="os-card cert-admin-card" key={slot.key}>
                <div className="cert-admin-art cert-admin-art--logo"><Image src={slot.image} alt={slot.name} width={130} height={90} unoptimized /></div>
                <div className="os-card-body">
                  <small>FACILITY DOCUMENT</small><h3>{slot.name}</h3><p>{slot.description}</p>
                  <div className="cert-admin-card-footer">
                    <div>{slot.record?.file_url ? <a href={slot.record.file_url} target="_blank" rel="noreferrer"><ExternalLink />Open</a> : <span className="os-badge amber">FILE OPTIONAL</span>}</div>
                    <div className="cert-admin-card-actions">
                      <button onClick={() => void toggleVisibility(slot)} disabled={working === `visibility:${slot.key}`}>{hidden ? <Eye /> : <EyeOff />}{hidden ? "Show" : "Hide"}</button>
                      <button onClick={() => { setUploadSlot(slot.name); fileInput.current?.click(); }}><UploadCloud />{slot.record?.file_url ? "Replace" : "Upload"}</button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <input ref={fileInput} type="file" accept="application/pdf,image/*" hidden onChange={upload} />

        <section className="os-card cert-request-table"><div className="os-card-header"><div><h2>Certificate Access Requests</h2><p>Website requests include buyer identity, WhatsApp and the requested documents.</p></div><span className="os-badge pink">{requests.filter((row) => row.metadata?.request_status !== "approved").length} PENDING</span></div><div className="os-card-body"><div className="os-table-wrap"><table className="os-table"><thead><tr><th>Buyer</th><th>Company / Designation</th><th>Contact</th><th>Documents Requested</th><th>Status</th><th>Action</th></tr></thead><tbody>{requests.map((row) => <tr key={row.id}><td><strong>{row.name || "—"}</strong><small>{row.country || "—"}</small></td><td>{row.company || "—"}<small>{row.metadata?.designation || "—"}</small></td><td>{row.email || "—"}<small>{row.whatsapp || "—"}</small></td><td>{Array.isArray(row.metadata?.certificates) ? row.metadata.certificates.join(", ") : "—"}</td><td><span className={`os-badge ${row.metadata?.request_status === "approved" ? "green" : "amber"}`}>{row.metadata?.request_status || row.status || "pending"}</span></td><td><button className="os-btn primary" onClick={() => beginSend(row)}><Send />{row.metadata?.request_status === "approved" ? "Resend" : "Review & Approve"}</button></td></tr>)}{!requests.length ? <tr><td colSpan={6}>No certificate requests have been submitted yet.</td></tr> : null}</tbody></table></div></div></section>

        {selectedRequest ? <div className="os-modal-backdrop"><section className="os-modal cert-send-modal"><div className="os-modal-header"><div><h2>Approve Document Access</h2><p>{selectedRequest.company || selectedRequest.name} · {selectedRequest.email}</p></div><button className="os-icon-button" onClick={() => setSelectedRequest(null)}><X /></button></div><div className="os-modal-body"><div className="cert-send-request"><strong>Requested</strong><p>{Array.isArray(selectedRequest.metadata?.certificates) ? selectedRequest.metadata.certificates.join(", ") : "No list supplied"}</p></div><h3>Select files to send</h3><div className="cert-send-options">{certs.map((cert) => <label key={cert.id}><input type="checkbox" checked={selectedCerts.includes(cert.id)} onChange={(event) => setSelectedCerts((current) => event.target.checked ? [...current, cert.id] : current.filter((id) => id !== cert.id))} /><span><FileCheck2 /><strong>{cert.document_name}</strong><small>{cert.file_url ? "File attached" : "Missing file"}</small></span></label>)}</div></div><div className="os-modal-footer"><button className="os-btn soft" onClick={() => setSelectedRequest(null)}>Cancel</button><button className="os-btn primary" onClick={() => void send()} disabled={working === "send" || !selectedCerts.length}><Mail />{working === "send" ? "Sending…" : "Approve & Send"}</button></div></section></div> : null}
        {toast ? <div className="os-toast-stack"><div className="os-toast"><CheckCircle2 /><div><strong>{toast}</strong></div></div></div> : null}
      </div>
    </AdminShell>
  );
}
