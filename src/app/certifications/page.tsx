"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { FACILITY_CERTIFICATIONS, certificationMatches } from "@/lib/certification-catalog";

type Cert = {
  id: string;
  document_name: string;
  category: string;
  file_url?: string | null;
  status?: string | null;
  visibility?: string | null;
};

export default function CertificationsPage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void supabase
      .from("certifications")
      .select("id,document_name,category,file_url,status,visibility")
      .order("created_at")
      .then(({ data }) => setCerts((data || []) as Cert[]));
  }, []);

  const items = useMemo(
    () => FACILITY_CERTIFICATIONS.map((item) => ({
      ...item,
      record: certs.find((cert) => certificationMatches(cert, item)),
    })).filter((item) => String(item.record?.visibility || "Public").toLowerCase() !== "hidden"),
    [certs],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      company: form.get("company"),
      designation: form.get("designation"),
      whatsapp: form.get("whatsapp"),
      country: form.get("country"),
      message: form.get("message"),
      certificates: selected,
      website: form.get("website"),
    };
    const response = await fetch("/api/certification-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSending(false);
    if (response.ok) {
      setMessage("Your document request has been submitted for review.");
      event.currentTarget.reset();
      setSelected([]);
    } else {
      setMessage(data.error || "Unable to submit request.");
    }
  }

  return (
    <main className="tso-route-page tso-certifications-page">
      <section className="tso-page-hero" data-cms-section="hero">
        <div className="tso-public-container tso-page-hero-grid">
          <div>
            <div className="tso-crumbs">HOME / CERTIFICATIONS</div>
            <h1>Quality you can <em>verify.</em></h1>
            <p>Our Himalayan pink salt products are manufactured and packed through certified facilities, with supporting documents available for qualified buyer review.</p>
          </div>
        </div>
      </section>

      <section className="tso-route-section" data-cms-section="documents">
        <div className="tso-public-container">
          <div className="tso-section-head tso-certification-public-head">
            <div>
              <div className="tso-eyebrow">Certified Manufacturing & Packing Facility</div>
              <h2>Facility documentation, <em>organized.</em></h2>
              <p>The Salt Origin works with certified manufacturing and packing facilities. The documents below relate to the facility and supporting production/compliance systems, not a claim that every certification is issued directly to The Salt Origin.</p>
            </div>
          </div>

          <div className="tso-cert-grid-public tso-cert-grid-public--logos">
            {items.map((item) => (
              <article key={item.key} className="tso-cert-public-card">
                <div className="tso-cert-logo-wrap">
                  <Image src={item.image} alt={`${item.name} certification logo`} width={160} height={110} unoptimized />
                </div>
                <h3>{item.record?.document_name || item.name}</h3>
                <p>{item.description}</p>
                <span className="tso-cert-access-note">Available through approved document access</span>
              </article>
            ))}
          </div>

          <div className="tso-compliance-note">Certificate copies, registration details, issue/expiry dates and supporting files are shared only after internal verification and buyer-access approval.</div>
          <div className="tso-document-request-strip">
            <div><h3>Need facility documents for your import review?</h3><p>Request the exact certificates and supporting files required by your company.</p></div>
            <button className="tso-button primary" onClick={() => setOpen(true)}>Request Documents</button>
          </div>
        </div>
      </section>

      {open ? (
        <div className="tso-public-modal-backdrop">
          <div className="tso-public-modal">
            <button className="tso-public-modal-close" onClick={() => setOpen(false)}><X /></button>
            <div className="tso-eyebrow">Document Access Request</div>
            <h2>Request Facility Documents</h2>
            <p>Tell us who you are and select the documents required for your review.</p>
            <form onSubmit={submit} className="tso-request-form">
              <input name="website" tabIndex={-1} autoComplete="off" className="tso-honeypot" />
              <div><label>Name *</label><input name="name" required /></div>
              <div><label>Business Email *</label><input name="email" type="email" required /></div>
              <div><label>Company *</label><input name="company" required /></div>
              <div><label>Designation</label><input name="designation" /></div>
              <div><label>WhatsApp *</label><input name="whatsapp" required /></div>
              <div><label>Country</label><input name="country" /></div>
              <fieldset>
                <legend>Documents Required *</legend>
                {items.map((item) => (
                  <label key={item.key}>
                    <input type="checkbox" checked={selected.includes(item.name)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.name] : current.filter((value) => value !== item.name))} />
                    {item.name}
                  </label>
                ))}
              </fieldset>
              <div className="full"><label>Notes</label><textarea name="message" rows={4} /></div>
              {message ? <p className="full tso-form-message"><CheckCircle2 />{message}</p> : null}
              <button className="tso-button primary full" disabled={sending || !selected.length}>{sending ? "Submitting…" : "Submit Document Request"}</button>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
