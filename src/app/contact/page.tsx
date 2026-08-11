"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  Clock3,
  FileCheck2,
  FileText,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Send,
  ShieldCheck,
  Tags,
} from "lucide-react";
import ContactForm from "@/components/ContactForm";
import {
  loadCmsTextWithStyles,
  type CmsTextPayload,
} from "@/lib/cms";
import { supabase } from "@/lib/supabase-client";
import { styleToReact } from "@/lib/text-style";

type Settings = {
  contact_email?: string;
  whatsapp_number?: string;
  address?: string;
};

const helpItems = [
  { key: "private_label", icon: Tags, title: "Private Label Development", text: "Branding, labels and market-ready packaging support." },
  { key: "bulk_orders", icon: Box, title: "Bulk Orders", text: "Commercial supply planning for distributors and wholesalers." },
  { key: "specifications", icon: FileText, title: "Product Specifications", text: "Grades, grain sizes, packaging and technical product details." },
  { key: "documents", icon: Globe2, title: "Export Documentation", text: "Commercial and shipment documentation support for international trade." },
  { key: "samples", icon: Package, title: "Sample Requests", text: "Product and packaging samples for qualified buyer projects." },
  { key: "quality", icon: ShieldCheck, title: "Quality & Compliance", text: "Certification, COA and compliance information where available." },
] as const;

export default function ContactPage() {
  const [settings, setSettings] = useState<Settings>({
    contact_email: "thekhanandco@gmail.com",
    whatsapp_number: "92331281289",
    address: "Pakistan",
  });
  const [richText, setRichText] = useState<Record<string, CmsTextPayload>>({});

  useEffect(() => {
    void load();

    const languageHandler = (event: Event) =>
      void load((event as CustomEvent<string>).detail);
    const refresh = () =>
      void load(localStorage.getItem("salt-language") || "en");

    window.addEventListener("salt-language-change", languageHandler);
    window.addEventListener("salt-cms-updated", refresh);

    return () => {
      window.removeEventListener("salt-language-change", languageHandler);
      window.removeEventListener("salt-cms-updated", refresh);
    };
  }, []);

  async function load(
    language = localStorage.getItem("salt-language") || "en",
  ) {
    const [{ data }, texts] = await Promise.all([
      supabase.from("site_settings").select("*").limit(1).maybeSingle(),
      loadCmsTextWithStyles("contact", language),
    ]);

    if (data) setSettings(data);
    setRichText(texts);
  }

  const text = (section: string, key: string, fallback: string) =>
    richText[`contact.${section}.${key}`]?.value || fallback;

  const textStyle = (section: string, key: string) =>
    styleToReact(richText[`contact.${section}.${key}`]?.style);

  const whatsappNumber = (settings.whatsapp_number || "92331281289").replace(
    /\D/g,
    "",
  );

  return (
    <main className="contact-premium-page text-[#081325]">
      <section data-cms-section="hero" className="contact-premium-hero">
        <div className="contact-premium-hero__mountains" aria-hidden="true" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_.72fr] lg:items-center">
            <div>
              <p className="brand-eyebrow text-left" style={textStyle("hero", "eyebrow")}>
                {text("hero", "eyebrow", "CONTACT")}
              </p>
              <h1
                className="site-heading-font mt-5 max-w-4xl text-[clamp(3rem,6vw,5.8rem)] font-black leading-[.98] tracking-[-.05em] text-[#07142B]"
                style={textStyle("hero", "title")}
              >
                {text("hero", "title", "Let’s Discuss Your Requirements")}
              </h1>
              <div className="brand-heading-line mt-6" />
              <p
                className="mt-7 max-w-3xl text-lg leading-8 text-slate-600"
                style={textStyle("hero", "description")}
              >
                {text(
                  "hero",
                  "description",
                  "Tell us what you need, where you sell and how you want the product packed. Our export team will respond with the right product, packaging and quotation path.",
                )}
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="#contact-form" className="brand-gradient-button">
                  <Send className="h-5 w-5" />
                  {text("hero", "quote_button", "Request Quote")}
                </Link>
                <Link
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  className="brand-outline-button"
                >
                  <MessageCircle className="h-5 w-5" />
                  {text("hero", "whatsapp_button", "WhatsApp Us")}
                </Link>
              </div>
            </div>

            <aside className="contact-hero-card">
              <p className="brand-eyebrow text-left" style={textStyle("snapshot", "eyebrow")}>
                {text("snapshot", "eyebrow", "DIRECT CONTACT")}
              </p>
              <h2
                className="site-heading-font mt-3 text-3xl font-black text-[#07142B]"
                style={textStyle("snapshot", "title")}
              >
                {text("snapshot", "title", "Speak With Our Export Team")}
              </h2>
              <p
                className="mt-4 leading-7 text-slate-600"
                style={textStyle("snapshot", "description")}
              >
                {text(
                  "snapshot",
                  "description",
                  "Use the channel that is easiest for you. Commercial inquiries are reviewed by our B2B team.",
                )}
              </p>

              <div className="mt-7 space-y-4">
                <ContactLine icon={<Mail />} label={text("snapshot", "email_label", "Email")} value={settings.contact_email || "thekhanandco@gmail.com"} href={`mailto:${settings.contact_email || "thekhanandco@gmail.com"}`} />
                <ContactLine icon={<Phone />} label={text("snapshot", "phone_label", "Phone / WhatsApp")} value={`+${whatsappNumber}`} href={`https://wa.me/${whatsappNumber}`} />
                <ContactLine icon={<MapPin />} label={text("snapshot", "location_label", "Location")} value={settings.address || "Pakistan"} />
                <ContactLine icon={<Clock3 />} label={text("snapshot", "hours_label", "Business Hours")} value={text("snapshot", "hours_value", "Mon–Sat · 09:00 AM–06:00 PM")} />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section data-cms-section="form" id="contact-form" className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <div className="contact-form-intro">
            <p className="brand-eyebrow text-left" style={textStyle("form", "eyebrow")}>
              {text("form", "eyebrow", "START YOUR INQUIRY")}
            </p>
            <h2
              className="site-heading-font mt-3 text-[clamp(2.3rem,4vw,4rem)] font-black leading-tight text-[#07142B]"
              style={textStyle("form", "title")}
            >
              {text("form", "title", "Build the Right Salt Program for Your Market")}
            </h2>
            <div className="brand-heading-line" />
            <p
              className="mt-6 text-[16px] leading-8 text-slate-600"
              style={textStyle("form", "description")}
            >
              {text(
                "form",
                "description",
                "Share your target market, preferred packaging, estimated quantity and timeline. The more detail you provide, the more relevant our response can be.",
              )}
            </p>

            <div className="mt-8 space-y-4">
              <MiniBenefit icon={<FileCheck2 />} title={text("form", "benefit_one_title", "Commercially Relevant Reply")} text={text("form", "benefit_one_text", "Product and packaging guidance matched to your inquiry.")} />
              <MiniBenefit icon={<Globe2 />} title={text("form", "benefit_two_title", "Export-Focused Support")} text={text("form", "benefit_two_text", "Documentation and shipment considerations for international buyers.")} />
              <MiniBenefit icon={<Package />} title={text("form", "benefit_three_title", "Private Label Ready")} text={text("form", "benefit_three_text", "Custom branding and retail packaging options for qualified projects.")} />
            </div>
          </div>

          <div className="contact-form-card">
            <ContactForm />
          </div>
        </div>
      </section>

      <section data-cms-section="help" className="contact-help-section">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
          <div className="text-center">
            <p className="brand-eyebrow" style={textStyle("help", "eyebrow")}>
              {text("help", "eyebrow", "HOW WE CAN HELP")}
            </p>
            <h2
              className="site-heading-font mt-3 text-[clamp(2.2rem,4vw,3.8rem)] font-black text-[#07142B]"
              style={textStyle("help", "title")}
            >
              {text("help", "title", "Support Across the Buyer Journey")}
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {helpItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.key} className="contact-help-card">
                  <span><Icon className="h-6 w-6" /></span>
                  <div>
                    <h3
                      className="font-black text-[#07142B]"
                      style={textStyle("help", `${item.key}_title`)}
                    >
                      {text("help", `${item.key}_title`, item.title)}
                    </h3>
                    <p
                      className="mt-2 text-sm leading-7 text-slate-600"
                      style={textStyle("help", `${item.key}_text`)}
                    >
                      {text("help", `${item.key}_text`, item.text)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactLine({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="contact-line-icon">{icon}</span>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </>
  );

  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="contact-line">
      {content}
    </a>
  ) : (
    <div className="contact-line">{content}</div>
  );
}

function MiniBenefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="contact-mini-benefit">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}
