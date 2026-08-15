"use client";

import { useEffect, useState } from "react";
import { loadCmsTextWithStyles, type CmsTextPayload } from "@/lib/cms";
import { styleToReact } from "@/lib/text-style";
import { supabase } from "@/lib/supabase-client";
import ContactForm from "@/components/ContactForm";

 type Settings = { contact_email?: string; whatsapp_number?: string; address?: string };

export default function ContactPage() {
  const [settings, setSettings] = useState<Settings>({ contact_email: "sales@thesaltorigin.com", whatsapp_number: "92331281289", address: "Karachi, Pakistan" });
  const [richText, setRichText] = useState<Record<string, CmsTextPayload>>({});

  useEffect(() => {
    void load();
    const refresh = () => void load(localStorage.getItem("salt-language") || "en");
    window.addEventListener("salt-cms-updated", refresh);
    window.addEventListener("salt-language-change", refresh);
    return () => { window.removeEventListener("salt-cms-updated", refresh); window.removeEventListener("salt-language-change", refresh); };
  }, []);

  async function load(language = localStorage.getItem("salt-language") || "en") {
    const [{ data }, texts] = await Promise.all([
      supabase.from("site_settings").select("contact_email,whatsapp_number,address").limit(1).maybeSingle(),
      loadCmsTextWithStyles("contact", language),
    ]);
    if (data) setSettings(data);
    setRichText(texts);
  }

  const text = (section: string, key: string, fallback: string) => richText[`contact.${section}.${key}`]?.value || fallback;
  const textStyle = (section: string, key: string) => styleToReact(richText[`contact.${section}.${key}`]?.style);
  const whatsapp = String(settings.whatsapp_number || "92331281289").replace(/\D/g, "");
  const address = settings.address || "Karachi, Pakistan";
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <main className="tso-route-page tso-contact-page">
      <section className="tso-page-hero tso-page-hero--clean" data-cms-section="hero">
        <div className="tso-public-container">
          <div className="tso-crumbs">HOME / CONTACT</div>
          <h1><span style={textStyle("hero", "title_main")}>{text("hero", "title_main", "Start a ")}</span><em style={textStyle("hero", "title_accent")}>{text("hero", "title_accent", "commercial conversation.")}</em></h1>
          <p style={textStyle("hero", "description")}>{text("hero", "description", "A focused B2B contact page with sales routing, inquiry qualification and clear response expectations.")}</p>
        </div>
      </section>

      <section className="tso-route-section tso-contact-form-section" data-cms-section="form">
        <div className="tso-public-container">
          <div className="tso-contact-form-card tso-contact-form-card--centered"><ContactForm /></div>
        </div>
      </section>

      <section className="tso-contact-info-section" data-cms-section="contact-details">
        <div className="tso-public-container">
          <div className="tso-contact-info-banner">
            <div className="tso-contact-info-copy">
              <div className="tso-eyebrow light">{text("contact-details", "eyebrow", "Get in touch")}</div>
              <h2>{text("contact-details", "title", "Tell us what you need.")}</h2>
              <p>{text("contact-details", "description", "Connect with the appropriate commercial team for product, private-label, documentation and export inquiries.")}</p>
              <div className="tso-contact-info-grid">
                <div className="tso-contact-block"><strong>Sales inquiries</strong><a href={`mailto:${settings.contact_email || "sales@thesaltorigin.com"}`}>{settings.contact_email || "sales@thesaltorigin.com"}</a></div>
                <div className="tso-contact-block"><strong>WhatsApp</strong><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">+{whatsapp}</a></div>
                <div className="tso-contact-block"><strong>Private label</strong><span>Packaging, branding and retail program inquiries</span></div>
                <div className="tso-contact-block"><strong>Documentation</strong><span>Facility certificates, COA, lab reports and product specifications</span></div>
                <div className="tso-contact-block tso-contact-block--full"><strong>Location</strong><span>{address}</span></div>
              </div>
            </div>
            <div className="tso-contact-map-wrap">
              <iframe title="The Salt Origin location map" src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
