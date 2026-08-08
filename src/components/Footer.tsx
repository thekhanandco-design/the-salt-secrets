"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { SocialPlatformIcon } from "@/components/SocialPlatformIcon";
import {
  loadCmsImages,
  loadCmsTextWithStyles,
  loadSocialLinks,
  type CmsTextPayload,
} from "@/lib/cms";
import { supabase } from "@/lib/supabase-client";
import { styleToReact } from "@/lib/text-style";

type Settings = {
  site_name?: string;
  contact_email?: string;
  whatsapp_number?: string;
  address?: string;
  footer_text?: string;
};

type Social = {
  platform: string;
  label: string;
  url: string;
  icon_key: string;
};

type FooterSocial = {
  platform: string;
  label: string;
  url: string;
  iconKey: string;
  enabled: boolean;
};

const socialOrder = [
  { platform: "whatsapp", label: "WhatsApp" },
  { platform: "instagram", label: "Instagram" },
  { platform: "facebook", label: "Facebook" },
  { platform: "linkedin", label: "LinkedIn" },
  { platform: "tiktok", label: "TikTok" },
  { platform: "youtube", label: "YouTube" },
] as const;

export default function Footer() {
  const [settings, setSettings] = useState<Settings>({
    site_name: "The Salt Origin",
    contact_email: "thekhanandco@gmail.com",
    whatsapp_number: "92331281289",
    address: "Pakistan",
  });
  const [richText, setRichText] = useState<Record<string, CmsTextPayload>>({});
  const [logo, setLogo] = useState("/logo.png");
  const [logoAlt, setLogoAlt] = useState("The Salt Origin");
  const [socials, setSocials] = useState<Social[]>([]);

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
    const [{ data }, texts, images, links] = await Promise.all([
      supabase.from("site_settings").select("*").limit(1).maybeSingle(),
      loadCmsTextWithStyles("global", language),
      loadCmsImages("global"),
      loadSocialLinks(),
    ]);

    if (data) setSettings(data);
    setRichText(texts);
    setLogo(
      images["global.branding.footer_logo"]?.url ||
        images["global.branding.logo"]?.url ||
        "/logo.png",
    );
    setLogoAlt(
      texts["global.branding.logo_alt"]?.value || "The Salt Origin",
    );
    setSocials(links);
  }

  const text = (key: string, fallback: string) =>
    richText[`global.footer.${key}`]?.value || fallback;

  const textStyle = (key: string) =>
    styleToReact(richText[`global.footer.${key}`]?.style);

  const navbarText = (key: string, fallback: string) =>
    richText[`global.navbar.${key}`]?.value || fallback;

  const whatsappNumber = (settings.whatsapp_number || "92331281289").replace(
    /\D/g,
    "",
  );

  const footerSocials = useMemo<FooterSocial[]>(() => {
    const socialMap = new Map(
      socials.map((item) => [
        String(item.platform || item.icon_key).toLowerCase(),
        item,
      ]),
    );

    return socialOrder.map((item) => {
      const stored = socialMap.get(item.platform);
      const whatsappUrl = `https://wa.me/${whatsappNumber}`;
      const url = stored?.url?.trim() ||
        (item.platform === "whatsapp" ? whatsappUrl : "");

      return {
        platform: item.platform,
        label: stored?.label || item.label,
        url,
        iconKey: stored?.icon_key || item.platform,
        enabled: Boolean(url),
      };
    });
  }, [socials, whatsappNumber]);

  const siteName = settings.site_name || "The Salt Origin";
  const copyright = text(
    "copyright",
    "© {year} {site}. All Rights Reserved.",
  )
    .replaceAll("{year}", String(new Date().getFullYear()))
    .replaceAll("{site}", siteName);

  const websiteCredit = text("website_credit", "").trim();

  return (
    <footer className="premium-site-footer text-white">
      <div className="premium-site-footer__mountains" aria-hidden="true" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-16 pt-14 pb-9">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_.78fr_1fr_1fr]">
          <section>
            <div className="flex items-start gap-5">
              <img
                src={logo}
                alt={logoAlt}
                className="h-[112px] w-[112px] object-contain shrink-0"
              />
              <p
                className="max-w-[315px] pt-3 text-[15px] leading-8 text-white/72"
                style={textStyle("description")}
              >
                {text(
                  "description",
                  settings.footer_text ||
                    "Premium Himalayan Pink Salt supplier for global markets. Purity from the Himalayas, trusted worldwide.",
                )}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="h-[2px] w-20 bg-[var(--brand-pink)]" />
              <span className="h-px w-12 bg-white/12" />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {footerSocials.map((item) =>
                item.enabled ? (
                  <a
                    key={item.platform}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    title={item.label}
                    className="premium-footer-social"
                  >
                    <SocialPlatformIcon
                      platform={item.iconKey}
                      className="h-5 w-5"
                    />
                  </a>
                ) : (
                  <span
                    key={item.platform}
                    aria-label={`${item.label} link not configured`}
                    title={`${item.label} link can be added from Social Links Manager`}
                    className="premium-footer-social premium-footer-social--disabled"
                  >
                    <SocialPlatformIcon
                      platform={item.iconKey}
                      className="h-5 w-5"
                    />
                  </span>
                ),
              )}
            </div>
          </section>

          <section>
            <FooterHeading style={textStyle("quick_links_title")}>
              {text("quick_links_title", "Quick Links")}
            </FooterHeading>
            <ul className="premium-footer-links">
              <li><Link href="/">{navbarText("home", "Home")}</Link></li>
              <li><Link href="/about">{navbarText("about", "About Us")}</Link></li>
              <li><Link href="/products">{navbarText("products", "Products")}</Link></li>
              <li><Link href="/private-label">{navbarText("private_label", "Private Label")}</Link></li>
              <li><Link href="/certifications">{navbarText("certifications", "Certifications")}</Link></li>
              <li><Link href="/blog">{navbarText("blog", "Blog")}</Link></li>
              <li><Link href="/faqs">{navbarText("faq", "FAQ")}</Link></li>
              <li><Link href="/contact">{navbarText("contact", "Contact")}</Link></li>
            </ul>
          </section>

          <section>
            <FooterHeading style={textStyle("contact_title")}>
              {text("contact_title", "Contact Info")}
            </FooterHeading>

            <div className="space-y-5 text-[15px] text-white/72">
              <a
                href={`mailto:${settings.contact_email || "thekhanandco@gmail.com"}`}
                className="premium-footer-contact"
              >
                <Mail className="h-5 w-5" />
                <span>{settings.contact_email || "thekhanandco@gmail.com"}</span>
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="premium-footer-contact"
              >
                <Phone className="h-5 w-5" />
                <span>+{whatsappNumber}</span>
              </a>
              <div className="premium-footer-contact">
                <MapPin className="h-5 w-5" />
                <span>{settings.address || "Pakistan"}</span>
              </div>
            </div>

            <Link
              href="/contact"
              className="premium-footer-quote"
              style={textStyle("quote_button")}
            >
              {text("quote_button", "Get Quote")}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </section>

          <section>
            <FooterHeading style={textStyle("policies_title")}>
              {text("policies_title", "Policies")}
            </FooterHeading>
            <div className="premium-footer-links space-y-5">
              <Link href="/privacy-policy">
                {text("privacy_label", "Privacy Policy")}
              </Link>
              <Link href="/terms-and-conditions">
                {text("terms_label", "Terms & Conditions")}
              </Link>
              <p
                className="whitespace-pre-line text-white/72 leading-8"
                style={textStyle("bottom_note")}
              >
                {text(
                  "bottom_note",
                  "Premium Himalayan Pink Salt\nSupplier & Private Label Partner",
                )}
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16 py-6 flex flex-col gap-2 text-sm text-white/58 md:flex-row md:items-center md:justify-between">
          <p style={textStyle("copyright")}>{copyright}</p>
          {websiteCredit && (
            <p style={textStyle("website_credit")}>{websiteCredit}</p>
          )}
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-[19px] font-extrabold tracking-tight" style={style}>
        {children}
      </h3>
      <span className="mt-4 block h-[2px] w-12 bg-[var(--brand-pink)]" />
    </div>
  );
}
