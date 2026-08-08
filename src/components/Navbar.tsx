"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react";
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
  about: "About Us",
  products: "Products",
  private_label: "Private Label",
  certifications: "Certifications",
  blog: "Blog",
  faq: "FAQ",
  contact: "Contact",
  quote: "Get Quote",
};

type LabelKey = keyof typeof defaults;

export default function Navbar() {
  const { dark, toggle } = useSiteTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState("en");
  const [languages, setLanguages] = useState<CmsLanguage[]>([]);
  const [labels, setLabels] = useState(defaults);
  const [richText, setRichText] = useState<Record<string, CmsTextPayload>>({});
  const [logo, setLogo] = useState("/logo.png");
  const [logoAlt, setLogoAlt] = useState("The Salt Origin");
  const [dynamicLinks, setDynamicLinks] = useState<Array<[string, string]>>([]);

  useEffect(() => {
    const saved = localStorage.getItem("salt-language") || "en";
    setLanguage(saved);
    document.documentElement.lang = saved;
    document.documentElement.dir = ["ar", "ur"].includes(saved) ? "rtl" : "ltr";
    document.documentElement.dataset.siteLanguage = saved;
    void load(saved);

    const refresh = () => {
      void load(localStorage.getItem("salt-language") || "en");
    };

    window.addEventListener("salt-cms-updated", refresh);
    return () => window.removeEventListener("salt-cms-updated", refresh);
  }, []);

  async function load(lang: string) {
    const [{ data: langs }, texts, images, { data: pages }] = await Promise.all([
      supabase
        .from("cms_languages")
        .select("*")
        .eq("enabled", true)
        .order("display_order"),
      loadCmsTextWithStyles("global", lang),
      loadCmsImages("global"),
      supabase
        .from("page_content")
        .select("page_slug,content")
        .order("updated_at", { ascending: false }),
    ]);

    setLanguages((langs as CmsLanguage[]) || []);
    setRichText(texts);

    const text = (key: string, fallback: string) =>
      texts[`global.navbar.${key}`]?.value || fallback;

    setLabels({
      home: text("home", defaults.home),
      about: text("about", defaults.about),
      products: text("products", defaults.products),
      private_label: text("private_label", defaults.private_label),
      certifications: text("certifications", defaults.certifications),
      blog: text("blog", defaults.blog),
      faq: text("faq", defaults.faq),
      contact: text("contact", defaults.contact),
      quote: text("quote", defaults.quote),
    });

    setLogo(
      images["global.branding.header_logo"]?.url ||
        images["global.branding.logo"]?.url ||
        "/logo.png",
    );
    setLogoAlt(
      texts["global.branding.logo_alt"]?.value || "The Salt Origin",
    );

    const reserved = new Set([
      "home",
      "about",
      "products",
      "private-label",
      "certifications",
      "blog",
      "contact",
      "faqs",
      "privacy-policy",
      "terms-and-conditions",
      "articles",
    ]);

    setDynamicLinks(
      (
        (pages as Array<{
          page_slug: string;
          content?: Record<string, unknown>;
        }> | null) || []
      )
        .filter(
          (item) =>
            !reserved.has(item.page_slug) &&
            String(item.content?.status || "").toLowerCase() === "published",
        )
        .map(
          (item) =>
            [
              `/${item.page_slug}`,
              String(item.content?.title || item.page_slug.replaceAll("-", " ")),
            ] as [string, string],
        ),
    );
  }

  async function changeLanguage(code: string) {
    setLanguage(code);
    localStorage.setItem("salt-language", code);
    const selected = languages.find((item) => item.code === code);
    document.documentElement.dir =
      selected?.direction || (["ar", "ur"].includes(code) ? "rtl" : "ltr");
    document.documentElement.lang = code;
    document.documentElement.dataset.siteLanguage = code;

    if (code !== "en") {
      try {
        await fetch("/api/translate/site", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: code }),
        });
      } catch {
        // The website still falls back to English when translation is unavailable.
      }
    }

    await load(code);
    window.dispatchEvent(
      new CustomEvent("salt-language-change", { detail: code }),
    );
    window.setTimeout(() => window.location.reload(), 120);
  }

  const navStyle = (key: LabelKey) =>
    styleToReact(richText[`global.navbar.${key}`]?.style);

  const links: Array<[string, string, LabelKey | null]> = [
    ["/", labels.home, "home"],
    ["/about", labels.about, "about"],
    ["/products", labels.products, "products"],
    ["/private-label", labels.private_label, "private_label"],
    ["/certifications", labels.certifications, "certifications"],
    ["/blog", labels.blog, "blog"],
    ["/faqs", labels.faq, "faq"],
    ...dynamicLinks.map(
      ([href, label]) => [href, label, null] as [string, string, LabelKey | null],
    ),
    ["/contact", labels.contact, "contact"],
  ];

  return (
    <>
      <header className="sticky top-0 z-[999] bg-white border-b border-[#F1E2E5] shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-16 h-[84px] flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Go to homepage">
            <img
              src={logo}
              alt={logoAlt}
              className="h-[55px] lg:h-[62px] w-auto object-contain"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-[15px] font-semibold text-[#111827]">
            {links.map(([href, label, key]) => (
              <Link
                key={href}
                href={href}
                style={key ? navStyle(key) : undefined}
                className="hover:text-[#C54B5B] transition"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle website theme"
              className="hidden md:inline-flex items-center justify-center w-11 h-11 rounded-xl border border-[#EFE3E5] bg-white text-[#081325] site-theme-button"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="hidden md:flex relative items-center">
              <select
                aria-label="Website language"
                value={language}
                onChange={(event) => changeLanguage(event.target.value)}
                className="appearance-none border border-[#EFE3E5] rounded-xl pl-4 pr-9 py-3 text-sm font-bold bg-white text-[#081325]"
              >
                {languages.length ? (
                  languages.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.native_name}
                    </option>
                  ))
                ) : (
                  <option value="en">English</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 w-4 h-4 pointer-events-none text-slate-500" />
            </div>

            <Link
              href="/contact"
              style={navStyle("quote")}
              className="site-gradient-button hidden md:flex items-center justify-center text-white px-7 py-3 rounded-xl font-bold transition"
            >
              {labels.quote}
            </Link>

            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-2"
              aria-label="Open menu"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>
        </div>
      </header>

      {isOpen && (
        <>
          <button
            className="fixed inset-0 bg-black/50 z-[990]"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu overlay"
          />
          <aside className="fixed top-0 right-0 h-screen w-[84%] max-w-[380px] bg-white z-[1000] shadow-2xl p-6">
            <div className="flex justify-between items-center">
              <img src={logo} alt={logoAlt} className="h-14 w-auto" />
              <button onClick={() => setIsOpen(false)} aria-label="Close menu">
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="mt-8">
              <select
                value={language}
                onChange={(event) => changeLanguage(event.target.value)}
                className="w-full border rounded-xl p-4 bg-white"
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.native_name}
                  </option>
                ))}
              </select>
            </div>

            <nav className="mt-5 flex flex-col gap-2">
              {links.map(([href, label, key]) => (
                <Link
                  key={href}
                  href={href}
                  style={key ? navStyle(key) : undefined}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-[#FFF4F5] font-bold"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/contact"
                style={navStyle("quote")}
                onClick={() => setIsOpen(false)}
                className="site-gradient-button mt-3 text-white text-center py-4 rounded-xl font-bold"
              >
                {labels.quote}
              </Link>
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
