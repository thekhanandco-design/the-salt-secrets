"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { loadCmsImages, loadCmsTextWithStyles, loadSocialLinks, type CmsTextPayload } from "@/lib/cms";
import { supabase } from "@/lib/supabase-client";
import { styleToReact } from "@/lib/text-style";
import { SocialPlatformIcon } from "@/components/SocialPlatformIcon";

type Settings = { site_name?: string; footer_text?: string; contact_email?: string; whatsapp_number?: string; address?: string };
type Social = { platform: string; label: string; url: string; icon_key: string };

const socialOrder = ["linkedin", "instagram", "facebook", "pinterest", "tiktok", "youtube"];

export default function Footer() {
  const [settings, setSettings] = useState<Settings>({ site_name: "The Salt Origin", contact_email: "sales@thesaltorigin.com", whatsapp_number: "92331281289", address: "Karachi, Pakistan" });
  const [richText, setRichText] = useState<Record<string, CmsTextPayload>>({});
  const [logo, setLogo] = useState("/salt-origin-logo.png");
  const [socials, setSocials] = useState<Social[]>([]);

  useEffect(() => {
    void load();
    const refresh = () => void load(localStorage.getItem("salt-language") || "en");
    window.addEventListener("salt-cms-updated", refresh);
    window.addEventListener("salt-language-change", refresh);
    return () => { window.removeEventListener("salt-cms-updated", refresh); window.removeEventListener("salt-language-change", refresh); };
  }, []);

  async function load(language = localStorage.getItem("salt-language") || "en") {
    const [{ data }, texts, images, links] = await Promise.all([
      supabase.from("site_settings").select("*").limit(1).maybeSingle(),
      loadCmsTextWithStyles("global", language),
      loadCmsImages("global"),
      loadSocialLinks(),
    ]);
    if (data) setSettings(data);
    setRichText(texts);
    setLogo(images["global.branding.footer_logo"]?.url || images["global.branding.logo"]?.url || "/salt-origin-logo.png");
    setSocials(links);
  }

  const text = (key: string, fallback: string) => richText[`global.footer.${key}`]?.value || fallback;
  const textStyle = (key: string) => styleToReact(richText[`global.footer.${key}`]?.style);
  const navText = (key: string, fallback: string) => richText[`global.navbar.${key}`]?.value || fallback;
  const orderedSocials = useMemo(() => socialOrder.map((name) => socials.find((item) => String(item.platform || item.icon_key).toLowerCase() === name)).filter(Boolean) as Social[], [socials]);
  const year = new Date().getFullYear();

  return (
    <footer className="tso-public-footer">
      <div className="tso-footer-mountains" aria-hidden="true" />
      <div className="tso-footer-container">
        <div className="tso-footer-grid">
          <section className="tso-footer-brand">
            <img src={logo} alt="The Salt Origin" />
            <p style={textStyle("description")}>{text("description", settings.footer_text || "Premium Himalayan pink salt for retail, foodservice, private label and global B2B supply. Clear specifications, responsive service and export-focused support for international buyers.")}</p>
            <div className="tso-footer-socials">{orderedSocials.map((social) => <a key={social.platform} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label}><SocialPlatformIcon platform={social.icon_key || social.platform}/></a>)}</div>
          </section>
          <section><h4>{text("explore_title", "EXPLORE")}</h4><Link href="/products">{navText("products", "Products")}</Link><Link href="/private-label">{navText("private_label", "Private Label")}</Link><Link href="/certifications">{navText("certifications", "Certifications")}</Link><Link href="/blog">Salt Journal</Link></section>
          <section><h4>{text("company_title", "COMPANY")}</h4><Link href="/about">{navText("about", "About Us")}</Link><Link href="/faqs">{navText("faq", "FAQ")}</Link><Link href="/contact">{navText("contact", "Contact")}</Link><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-and-conditions">Terms & Conditions</Link></section>
          <section><h4>{text("b2b_title", "B2B DESK")}</h4><a href={`mailto:${settings.contact_email || "sales@thesaltorigin.com"}`}><Mail />{settings.contact_email || "sales@thesaltorigin.com"}</a><span><MapPin />{settings.address || "Karachi, Pakistan"}</span><Link href="/contact">Request a Quote</Link><Link href="/certifications">Request Documents</Link></section>
        </div>
        <div className="tso-footer-bottom"><span>© {year} {settings.site_name || "The Salt Origin"} · All Rights Reserved.</span><span>Himalayan Pink Salt · Private Label · Global B2B</span></div>
      </div>
    </footer>
  );
}
