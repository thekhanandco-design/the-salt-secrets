"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Moon, Search, Sun, X } from "lucide-react";
import {
  loadCmsImages,
  loadCmsTextWithStyles,
  type CmsLanguage,
  type CmsTextPayload,
} from "@/lib/cms";
import { supabase } from "@/lib/supabase-client";
import { useSiteTheme } from "@/components/SiteThemeProvider";
import { styleToReact } from "@/lib/text-style";

const defaults = {
  home: "Home",
  products: "Products",
  private_label: "Private Label",
  certifications: "Certifications",
  blog: "Blog",
  about: "About Us",
  our_story: "Our Story",
  faq: "FAQ",
  contact: "Contact",
  quote: "Get Quote",
};

type LabelKey = keyof typeof defaults;

export default function Navbar() {
  const pathname = usePathname();
  const { dark, toggle } = useSiteTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("en");
  const [languages, setLanguages] = useState<CmsLanguage[]>([]);
  const [labels, setLabels] = useState(defaults);
  const [richText, setRichText] = useState<Record<string, CmsTextPayload>>({});
  const [logo, setLogo] = useState("/salt-origin-logo.png");
  const [logoAlt, setLogoAlt] = useState("The Salt Origin");

  useEffect(() => {
    const saved = localStorage.getItem("salt-language") || "en";
    setLanguage(saved);
    void load(saved);
    const refresh = () => void load(localStorage.getItem("salt-language") || "en");
    window.addEventListener("salt-cms-updated", refresh);
    return () => window.removeEventListener("salt-cms-updated", refresh);
  }, []);

  async function load(lang: string) {
    const [{ data: langs }, texts, images] = await Promise.all([
      supabase.from("cms_languages").select("*").eq("enabled", true).order("display_order"),
      loadCmsTextWithStyles("global", lang),
      loadCmsImages("global"),
    ]);
    setLanguages((langs as CmsLanguage[]) || []);
    setRichText(texts);
    const text = (key: string, fallback: string) => texts[`global.navbar.${key}`]?.value || fallback;
    setLabels({
      home: text("home", defaults.home),
      products: text("products", defaults.products),
      private_label: text("private_label", defaults.private_label),
      certifications: text("certifications", defaults.certifications),
      blog: text("blog", defaults.blog),
      about: text("about", defaults.about),
      our_story: text("our_story", defaults.our_story),
      faq: text("faq", defaults.faq),
      contact: text("contact", defaults.contact),
      quote: text("quote", defaults.quote),
    });
    setLogo(images["global.branding.header_logo"]?.url || images["global.branding.logo"]?.url || "/salt-origin-logo.png");
    setLogoAlt(texts["global.branding.logo_alt"]?.value || "The Salt Origin");
  }

  async function changeLanguage(code: string) {
    setLanguage(code);
    localStorage.setItem("salt-language", code);
    const selected = languages.find((item) => item.code === code);
    document.documentElement.dir = selected?.direction || (["ar", "ur"].includes(code) ? "rtl" : "ltr");
    document.documentElement.lang = code;
    await load(code);
    window.dispatchEvent(new CustomEvent("salt-language-change", { detail: code }));
    window.setTimeout(() => window.location.reload(), 120);
  }

  const navStyle = (key: LabelKey) => styleToReact(richText[`global.navbar.${key}`]?.style);
  const brandName = richText["global.branding.header_brand_name"]?.value || "The Salt Origin";
  const brandSubtitle = richText["global.branding.header_brand_subtitle"]?.value || "PINK SALT · PAKISTAN";
  const links: Array<[string, string, LabelKey]> = [
    ["/", labels.home, "home"],
    ["/products", labels.products, "products"],
    ["/private-label", labels.private_label, "private_label"],
    ["/certifications", labels.certifications, "certifications"],
    ["/blog", labels.blog, "blog"],
    ["/about", labels.about, "about"],
    ["/our-story", labels.our_story, "our_story"],
    ["/faqs", labels.faq, "faq"],
    ["/contact", labels.contact, "contact"],
  ];

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? links.filter(([, label]) => label.toLowerCase().includes(needle)) : links;
  }, [query, labels]);

  return (
    <>
      <div className="tso-top-strip">
        <div className="tso-header-container">
          <span data-cms-key="global.announcement.message">{richText["global.announcement.message"]?.value || "THE SALT ORIGIN · PREMIUM HIMALAYAN PINK SALT"}</span>
          <div><span>●</span><Link href="/private-label" data-cms-key="global.announcement.private_label">{richText["global.announcement.private_label"]?.value || "PRIVATE LABEL"}</Link><Link href="/contact" data-cms-key="global.announcement.b2b_export">{richText["global.announcement.b2b_export"]?.value || "B2B EXPORT"}</Link><Link href="/products" data-cms-key="global.announcement.global_supply">{richText["global.announcement.global_supply"]?.value || "GLOBAL SUPPLY"}</Link></div>
        </div>
      </div>
      <header className="tso-main-header">
        <div className="tso-header-container tso-main-header__row">
          <Link href="/" className="tso-brand-lockup" aria-label="The Salt Origin homepage">
            <img data-cms-image-key="global.branding.header_logo" src={logo} alt={logoAlt} />
            <span><strong data-cms-key="global.branding.header_brand_name">{brandName}</strong><small data-cms-key="global.branding.header_brand_subtitle">{brandSubtitle}</small></span>
          </Link>

          <nav className="tso-desktop-nav">
            {links.map(([href, label, key]) => (
              <Link key={href} href={href} data-cms-key={`global.navbar.${key}`} style={navStyle(key)} className={pathname === href ? "active" : ""}>{label}</Link>
            ))}
          </nav>

          <div className="tso-header-actions">
            <button className="tso-search-circle" onClick={() => setSearchOpen(true)} aria-label="Search website"><Search /></button>
            <Link href="/contact" data-cms-key="global.navbar.quote" style={navStyle("quote")} className="tso-get-quote">{labels.quote}</Link>
            <button className="tso-mobile-menu-button" onClick={() => setIsOpen(true)} aria-label="Open menu"><Menu /></button>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="tso-search-overlay" role="dialog" aria-modal="true">
          <button className="tso-search-backdrop" onClick={() => setSearchOpen(false)} aria-label="Close search" />
          <div className="tso-search-panel">
            <div className="tso-search-panel__top"><Search /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, private label, certifications…"/><button onClick={() => setSearchOpen(false)}><X /></button></div>
            <div className="tso-search-results">{results.map(([href, label]) => <Link key={href} href={href} onClick={() => setSearchOpen(false)}>{label}<span>→</span></Link>)}</div>
          </div>
        </div>
      )}

      {isOpen && (
        <>
          <button className="tso-mobile-backdrop" onClick={() => setIsOpen(false)} aria-label="Close menu overlay" />
          <aside className="tso-mobile-drawer">
            <div className="tso-mobile-drawer__head"><div className="tso-brand-lockup"><img src={logo} alt={logoAlt}/><span><strong>{brandName}</strong><small>{brandSubtitle}</small></span></div><button onClick={() => setIsOpen(false)}><X /></button></div>
            <nav>{links.map(([href, label]) => <Link key={href} href={href} onClick={() => setIsOpen(false)}>{label}</Link>)}</nav>
            <div className="tso-mobile-tools">
              <button onClick={toggle}>{dark ? <Sun/> : <Moon/>}<span>{dark ? "Light Mode" : "Dark Mode"}</span></button>
              <label><span>Language</span><select value={language} onChange={(event) => changeLanguage(event.target.value)}>{languages.length ? languages.map((item) => <option key={item.code} value={item.code}>{item.native_name}</option>) : <option value="en">English</option>}</select><ChevronDown/></label>
            </div>
            <Link href="/contact" className="tso-get-quote full" onClick={() => setIsOpen(false)}>{labels.quote}</Link>
          </aside>
        </>
      )}
    </>
  );
}
