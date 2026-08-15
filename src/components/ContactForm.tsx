"use client";

import { useCallback, useState } from "react";
import Turnstile from "@/components/security/Turnstile";

const VOLUME_OPTIONS = [
  "Sample / Trial Order",
  "Up to 500 kg",
  "500 kg – 1 ton",
  "1 – 5 tons",
  "5 – 10 tons",
  "10 – 25 tons",
  "25+ tons",
  "Other",
] as const;

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [volumeOption, setVolumeOption] = useState("");
  const onTurnstile = useCallback((token: string) => setTurnstileToken(token), []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const quantity = volumeOption === "Other"
      ? String(formData.get("quantity_other") || "").trim()
      : String(formData.get("quantity_option") || "").trim();

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        company: formData.get("company"),
        whatsapp: formData.get("whatsapp"),
        country: formData.get("country"),
        product: formData.get("inquiry_type"),
        quantity,
        message: formData.get("message"),
        website: formData.get("website"),
        turnstileToken,
      }),
    });
    setLoading(false);
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setSuccess(true);
      setTurnstileToken("");
      setVolumeOption("");
      form.reset();
    } else {
      setError(result.error || "Inquiry could not be sent.");
    }
  }

  return (
    <>
      <div className="tso-contact-form-title"><div className="tso-eyebrow">B2B Inquiry Form</div><h2>Send a message</h2></div>
      {success ? <div className="tso-contact-alert success">Inquiry sent successfully. Our team will contact you soon.</div> : null}
      {error ? <div className="tso-contact-alert error">{error}</div> : null}
      <form onSubmit={handleSubmit} className="tso-contact-form-grid">
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="tso-honeypot" />
        <label><span>Full Name</span><input name="name" required placeholder="Your name" /></label>
        <label><span>Business Email</span><input name="email" type="email" required placeholder="you@company.com" /></label>
        <label><span>Company</span><input name="company" placeholder="Company name" /></label>
        <label><span>WhatsApp / Phone</span><input name="whatsapp" required placeholder="+00 000 0000000" /></label>
        <label><span>Country</span><input name="country" placeholder="Destination market" /></label>
        <label><span>Inquiry Type</span><select name="inquiry_type" defaultValue="Product Inquiry"><option>Product Inquiry</option><option>Private Label</option><option>Bulk Supply</option><option>Samples</option><option>Documents</option></select></label>
        <label className={volumeOption === "Other" ? "full" : ""}>
          <span>Estimated Volume</span>
          <select name="quantity_option" required value={volumeOption} onChange={(event) => setVolumeOption(event.target.value)}>
            <option value="" disabled>Select estimated volume</option>
            {VOLUME_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        {volumeOption === "Other" ? (
          <label className="full tso-contact-other-volume"><span>Enter Your Volume / Quantity</span><input name="quantity_other" required placeholder="e.g. 18 tons / 24,000 units" /></label>
        ) : null}
        <label className="full"><span>Message</span><textarea name="message" required rows={5} placeholder="Product, grain size, packaging, destination and target timing…" /></label>
        <div className="full tso-contact-turnstile"><Turnstile action="contact_form" onToken={onTurnstile} /></div>
        <button className="full tso-contact-submit" disabled={loading} type="submit"><span>{loading ? "Sending…" : "Send Inquiry"}</span></button>
      </form>
    </>
  );
}
