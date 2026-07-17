"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { loadCmsImages, loadCmsText } from "@/lib/cms";

type HomepageContent = {
  hero_title: string | null;
  hero_description: string | null;
  hero_image: string | null;
  private_label_title: string | null;
  private_label_description: string | null;
  export_countries: string | null;
  buyers_count: string | null;
};

const defaultContent: HomepageContent = {
  hero_title: "Himalayan Pink Salt Solutions For Global Markets",
  hero_description:
    "We provide premium quality Himalayan Pink Salt in multiple forms and packaging, trusted by importers, distributors and brands worldwide.",
  hero_image: "/hero-products.png",
  private_label_title: "PRIVATE LABEL SOLUTIONS",
  private_label_description:
    "We help brands create their identity with fully customized bottles and packaging.",
  export_countries: "50+",
  buyers_count: "500+",
};

export default function HomepageClone() {
  const [content, setContent] = useState<HomepageContent>(defaultContent);
  const [cmsText, setCmsText] = useState<Record<string, string>>({});
  const [cmsImages, setCmsImages] = useState<Record<string, { url: string; alt: string }>>({});

  useEffect(() => {
    const language = localStorage.getItem("salt-language") || "en";
    loadHomepageContent(language);
    const handler = (event: Event) => loadHomepageContent((event as CustomEvent<string>).detail);
    const refresh = () => loadHomepageContent(localStorage.getItem("salt-language") || "en");
    window.addEventListener("salt-language-change", handler);
    window.addEventListener("salt-cms-updated", refresh);
    return () => { window.removeEventListener("salt-language-change", handler); window.removeEventListener("salt-cms-updated", refresh); };
  }, []);

  async function loadHomepageContent(language = "en") {
    const [{ data }, texts, images] = await Promise.all([
      supabase.from("homepage").select("*").limit(1).maybeSingle(),
      loadCmsText("home", language),
      loadCmsImages("home"),
    ]);

    setCmsText(texts);
    setCmsImages(images);
    setContent({
      hero_title: texts["home.hero.title"] || data?.hero_title || defaultContent.hero_title,
      hero_description: texts["home.hero.description"] || data?.hero_description || defaultContent.hero_description,
      hero_image: images["home.hero.products"]?.url || data?.hero_image || defaultContent.hero_image,
      private_label_title: texts["home.private_label.title"] || data?.private_label_title || defaultContent.private_label_title,
      private_label_description: texts["home.private_label.description"] || data?.private_label_description || defaultContent.private_label_description,
      export_countries: data?.export_countries || defaultContent.export_countries,
      buyers_count: data?.buyers_count || defaultContent.buyers_count,
    });
  }

  const heroTitleParts =
    content.hero_title?.split(" ") || [];

  const heroImage =
    content.hero_image || "/hero-products.png";

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#FFF2F4] via-[#FFF7F8] to-white">
        <div
          className="absolute inset-y-0 right-0 w-full lg:w-[65%] opacity-25 bg-right bg-no-repeat bg-contain"
          style={{
            backgroundImage: `url('${cmsImages["home.hero.mountains"]?.url || "/mountains-bg.png"}')`,
          }}
        />

        <div className="relative z-10 max-w-[1700px] mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 items-center min-h-[640px] gap-10">
            <div>
              <div className="flex items-center gap-4 mb-5">
                <span className="uppercase tracking-[5px] text-[#C23B4A] font-black text-sm">
                  {cmsText["home.hero.badge"] || "PREMIUM QUALITY"}
                </span>

                <span className="w-14 h-[2px] bg-[#D9A0A8]" />
              </div>

              <h1
                className="text-[#081325] font-black leading-[0.95]"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize:
                    "clamp(3rem,5vw,5.2rem)",
                }}
              >
                {heroTitleParts.length > 0
                  ? content.hero_title
                  : defaultContent.hero_title}
              </h1>

              <p className="mt-7 text-slate-700 text-lg leading-relaxed max-w-[620px]">
                {content.hero_description}
              </p>

              <div className="flex flex-wrap gap-4 mt-9">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-3 bg-[#C23B4A] text-white px-8 py-4 rounded-md font-black"
                >
                  {cmsText["home.hero.primary_button"] || "Explore Products"}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 border border-[#C23B4A] text-[#C23B4A] px-8 py-4 rounded-md font-black"
                >
                  {cmsText["home.hero.secondary_button"] || "Request Quote"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              {heroImage.startsWith("http") ? (
                <img
                  src={heroImage}
                  alt="Himalayan Pink Salt Products"
                  className="w-full max-w-[900px] h-auto object-contain"
                />
              ) : (
                <Image
                  src={heroImage}
                  alt="Himalayan Pink Salt Products"
                  width={900}
                  height={900}
                  priority
                  className="w-full max-w-[900px] h-auto object-contain"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PRIVATE LABEL */}
      <section className="py-14 bg-white">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-[320px_1fr] gap-10 items-center">
            <div>
              <h2
                className="text-[#081325] font-black leading-tight"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize:
                    "clamp(2.2rem,3vw,3.2rem)",
                }}
              >
                {content.private_label_title}
              </h2>

              <div className="w-16 h-[3px] bg-[#C23B4A] mt-5" />

              <p className="text-slate-600 mt-6 leading-relaxed">
                {content.private_label_description}
              </p>

              <ul className="mt-6 space-y-3 text-[#081325] font-medium">
                <li>✓ Custom Bottles</li>
                <li>✓ Custom Packaging</li>
              </ul>

              <Link
                href="/private-label"
                className="inline-flex mt-7 bg-[#C23B4A] text-white px-8 py-4 rounded-md font-bold"
              >
                Learn More
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-6 h-6 text-[#C23B4A]" />
                  <h3 className="font-black text-lg">
                    Custom Bottles
                  </h3>
                </div>

                <p className="text-slate-600 text-sm mb-4">
                  Choose your bottle style, size and design to
                  match your brand identity.
                </p>

                <Image
                  src={cmsImages["home.private-label.custom_labels"]?.url || "/custom-labels.png"}
                  alt="Custom Labels"
                  width={600}
                  height={400}
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-6 h-6 text-[#C23B4A]" />
                  <h3 className="font-black text-lg">
                    Custom Packaging
                  </h3>
                </div>

                <p className="text-slate-600 text-sm mb-4">
                  Custom printed pouches and jars with your logo,
                  colors and design.
                </p>

                <Image
                  src={cmsImages["home.private-label.custom_packaging"]?.url || "/custom-packaging.png"}
                  alt="Custom Packaging"
                  width={600}
                  height={400}
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-10 bg-white">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-16">
          <div className="text-center mb-10">
            <h2
              className="font-black text-[#081325]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize:
                  "clamp(2.2rem,3vw,3.4rem)",
              }}
            >
              {cmsText["home.products.title"] || "OUR PRODUCT RANGE"}
            </h2>

            <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "PET Bottles",
                image: cmsImages["home.products.pet_bottles"]?.url || "/pet-bottles.png",
                desc: "Multiple sizes for everyday use and retail.",
              },
              {
                title: "PET Jars",
                image: cmsImages["home.products.pet_jars"]?.url || "/pet-jars.png",
                desc: "Fine grain salt in convenient PET jars.",
              },
              {
                title: "Grinder Collection",
                image: cmsImages["home.products.grinders"]?.url || "/grinder-bottles.png",
                desc: "Plastic and ceramic grinder bottles.",
              },
              {
                title: "Stand-Up Pouches",
                image: cmsImages["home.products.pouches"]?.url || "/standup-pouch.png",
                desc: "Premium zip-lock pouches for maximum freshness.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#FFF9FA] border border-[#EFE3E5] rounded-[22px] overflow-hidden"
              >
                <div className="p-6">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={350}
                    height={350}
                    className="w-full h-[220px] object-contain"
                  />

                  <h3 className="font-black text-[#081325] text-2xl mt-5">
                    {item.title}
                  </h3>

                  <p className="text-slate-600 mt-2 leading-relaxed">
                    {item.desc}
                  </p>

                  <Link
                    href="/products"
                    className="inline-flex mt-5 border border-[#C23B4A] text-[#C23B4A] px-5 py-2 rounded-md font-semibold"
                  >
                    View Products
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* WHY CHOOSE US */}
      <section className="py-14 bg-white">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-16">
          <div className="text-center mb-10">
            <h2
              className="font-black text-[#081325]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2.2rem,3vw,3.4rem)",
              }}
            >
              {cmsText["home.why_choose.title"] || "WHY CHOOSE US"}
            </h2>

            <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              "Reliable Supply",
              "Flexible MOQ",
              "Custom Packaging",
              "Export Support",
              "Quality Focused",
              "Global Reach",
            ].map((item) => (
              <div
                key={item}
                className="text-center border-r border-[#F0E3E6] last:border-r-0"
              >
                <div className="w-20 h-20 rounded-full bg-[#FFF2F4] flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-[#C23B4A]" />
                </div>

                <h3 className="font-black text-[#081325]">
                  {item}
                </h3>

                <p className="text-slate-600 text-sm mt-3 px-2">
                  Premium Himalayan Pink Salt solutions for
                  international buyers.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUALITY STANDARDS */}
      <section className="py-14 bg-[#FFF8F5]">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-16">
          <div className="text-center mb-10">
            <h2
              className="font-black text-[#081325]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2.2rem,3vw,3.4rem)",
              }}
            >
              {cmsText["home.quality.title"] || "OUR QUALITY STANDARDS"}
            </h2>

            <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />

            <p className="text-slate-600 mt-4">
              Certified quality you can trust.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {[
              cmsImages["home.quality.iso"]?.url || "/cert-iso.png",
              cmsImages["home.quality.haccp"]?.url || "/cert-haccp.png",
              cmsImages["home.quality.gmp"]?.url || "/cert-gmp.png",
              cmsImages["home.quality.halal"]?.url || "/cert-halal.png",
              cmsImages["home.quality.fda"]?.url || "/cert-fda.png",
              cmsImages["home.quality.food"]?.url || "/cert-food.png",
            ].map((cert, index) => (
              <div
                key={index}
                className="bg-white rounded-[22px] border border-[#EFE3E5] p-5 flex items-center justify-center"
              >
                <Image
                  src={cert}
                  alt="Certification"
                  width={120}
                  height={120}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPORT MARKETS */}
      <section className="py-16 bg-white">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-16">
          <div className="text-center mb-10">
            <h2
              className="font-black text-[#081325]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2.3rem,3vw,3.6rem)",
              }}
            >
              {cmsText["home.export.title"] || `TRUSTED BY BUYERS IN ${cmsText["home.export.countries"] || content.export_countries} COUNTRIES`}
            </h2>

            <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            <div className="border border-[#EFE3E5] rounded-[28px] p-6">
              <Image
                src={cmsImages["home.export.map"]?.url || "/world-map.png"}
                alt="World Map"
                width={1400}
                height={700}
                className="w-full h-auto object-contain"
              />
            </div>

            <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[28px] p-8">
              <div className="space-y-8">
                <div>
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    {cmsText["home.export.countries"] || content.export_countries}
                  </h3>

                  <p className="text-slate-600 mt-1">
                    Export Destinations
                  </p>
                </div>

                <div>
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    {cmsText["home.export.buyers"] || content.buyers_count}
                  </h3>

                  <p className="text-slate-600 mt-1">
                    International Buyers
                  </p>
                </div>

                <div>
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    Bulk
                  </h3>

                  <p className="text-slate-600 mt-1">
                    Supply Capability
                  </p>
                </div>

                <div>
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    100%
                  </h3>

                  <p className="text-slate-600 mt-1">
                    Export Quality Focused
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}