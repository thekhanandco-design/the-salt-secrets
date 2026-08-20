"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { loadCmsImages, loadCmsTextWithStyles, loadSocialLinks, type CmsTextPayload } from "@/lib/cms";
import { supabase } from "@/lib/supabase-client";
import { styleToReact } from "@/lib/text-style";
import { SocialPlatformIcon } from "@/components/SocialPlatformIcon";
import { useCmsImageAltResolver, useCmsImageResolver } from "@/components/CmsImageManifestProvider";

type Settings = { site_name?: string; footer_text?: string; contact_email?: string; whatsapp_number?: string; address?: string };
type Social = { platform: string; label: string; url: string; icon_key: string };

const socialOrder = ["linkedin", "instagram", "facebook", "pinterest", "tiktok", "youtube"];

export default function Footer() {
  const cmsImage = useCmsImageResolver();
  const cmsImageAlt = useCmsImageAltResolver();
  const [settings, setSettings] = useState<Settings>({ site_name: "The Salt Origin", contact_email: "sales@thesaltorigin.com", whatsapp_number: "92331281289", address: "Karachi, Pakistan" });
  const [richText, setRichText] = useState<Record<string, CmsTextPayload>>({});
  const [logo, setLogo] = useState("/salt-origin-logo.png");
  const [footerArtwork, setFooterArtwork] = useState("/mountains-bg.png");
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
      supabase.from("public_site_settings").select("*").limit(1).maybeSingle(),
      loadCmsTextWithStyles("global", language),
      loadCmsImages("global"),
      loadSocialLinks(),
    ]);
    if (data) setSettings(data);
    setRichText(texts);
    setLogo(images["global.branding.footer_logo"]?.url || images["global.branding.logo"]?.url || "/salt-origin-logo.png");
    setFooterArtwork(images["global.footer.mountain_artwork"]?.url || "/mountains-bg.png");
    setSocials(links);
  }

  const text = (key: string, fallback: string) => richText[`global.footer.${key}`]?.value || fallback;
  const textStyle = (key: string) => styleToReact(richText[`global.footer.${key}`]?.style);
  const navText = (key: string, fallback: string) => richText[`global.navbar.${key}`]?.value || fallback;
  const orderedSocials = useMemo(() => socialOrder.map((name) => socials.find((item) => String(item.platform || item.icon_key).toLowerCase() === name)).filter(Boolean) as Social[], [socials]);
  const renderedLogo = cmsImage("global.branding.footer_logo", cmsImage("global.branding.logo", logo));
  const renderedLogoAlt = cmsImageAlt("global.branding.footer_logo", "The Salt Origin");
  const renderedFooterArtwork = cmsImage("global.footer.mountain_artwork", footerArtwork);
  const year = new Date().getFullYear();

  return (
    <footer className="tso-public-footer">
      <div
        className="tso-footer-mountains"
        data-cms-image-key="global.footer.mountain_artwork"
        aria-label="Footer Himalayan mountain artwork"
        style={{ backgroundImage: `url("${renderedFooterArtwork}")` }}
        aria-hidden="true"
      />
      <div className="tso-footer-container">
        <div className="tso-footer-grid">
          <section className="tso-footer-brand">
            <img data-cms-image-key="global.branding.footer_logo" src={renderedLogo} alt={renderedLogoAlt} />
            <p data-cms-key="global.footer.description" style={textStyle("description")}>{text("description", settings.footer_text || "Premium Himalayan pink salt for retail, foodservice, private label and global B2B supply. Clear specifications, responsive service and export-focused support for international buyers.")}</p>
            <div className="tso-footer-socials">{orderedSocials.map((social) => <a key={social.platform} href={social.url} target="_blank" rel="noreferrer" aria-label={social.label}><SocialPlatformIcon platform={social.icon_key || social.platform}/></a>)}</div>
          </section>
          <section><h4 data-cms-key="global.footer.explore_title">{text("explore_title", "EXPLORE")}</h4><Link href="/products" data-cms-key="global.navbar.products">{navText("products", "Products")}</Link><Link href="/private-label" data-cms-key="global.navbar.private_label">{navText("private_label", "Private Label")}</Link><Link href="/certifications" data-cms-key="global.navbar.certifications">{navText("certifications", "Certifications")}</Link><Link href="/blog" data-cms-key="global.footer.journal_label">{text("journal_label", "Salt Journal")}</Link></section>
          <section><h4 data-cms-key="global.footer.company_title">{text("company_title", "COMPANY")}</h4><Link href="/about" data-cms-key="global.navbar.about">{navText("about", "About Us")}</Link><Link href="/faqs" data-cms-key="global.navbar.faq">{navText("faq", "FAQ")}</Link><Link href="/contact" data-cms-key="global.navbar.contact">{navText("contact", "Contact")}</Link><Link href="/privacy-policy" data-cms-key="global.footer.privacy_label">{text("privacy_label", "Privacy Policy")}</Link><Link href="/terms-and-conditions" data-cms-key="global.footer.terms_label">{text("terms_label", "Terms & Conditions")}</Link></section>
          <section className="tso-footer-contact"><h4 data-cms-key="global.footer.contact_title">{text("contact_title", "CONTACT US")}</h4><a href={`mailto:${settings.contact_email || "sales@thesaltorigin.com"}`}><Mail />{settings.contact_email || "sales@thesaltorigin.com"}</a><a href={`https://wa.me/${String(settings.whatsapp_number || "92331281289").replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><Phone />{settings.whatsapp_number || "+92 331 281289"}</a><span><MapPin />{settings.address || "Karachi, Pakistan"}</span><Link href="/contact" className="tso-footer-quote" data-cms-key="global.footer.request_quote">{text("request_quote", "Request a Quote")}<span>→</span></Link></section>
        </div>
        <div className="tso-footer-bottom"><span data-cms-key="global.footer.copyright">{text("copyright", "© {year} {site}. All Rights Reserved.").replace("{year}", String(year)).replace("{site}", settings.site_name || "The Salt Origin")}</span><span data-cms-key="global.footer.bottom_note">{text("bottom_note", "Himalayan Pink Salt · Private Label · Global B2B")}</span></div>
      </div>
    </footer>
  );
}
