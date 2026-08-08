"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Mountain,
  Quote,
  ShieldCheck,
  Target,
} from "lucide-react";
import {
  loadCmsImages,
  loadCmsTextWithStyles,
  type CmsTextPayload,
} from "@/lib/cms";
import { styleToReact } from "@/lib/text-style";

type CmsImage = {
  url: string;
  alt: string;
};

export default function AboutPage() {
  const [richText, setRichText] = useState<Record<string, CmsTextPayload>>({});
  const [images, setImages] = useState<Record<string, CmsImage>>({});

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
    const [texts, pageImages] = await Promise.all([
      loadCmsTextWithStyles("about", language),
      loadCmsImages("about"),
    ]);

    setRichText(texts);
    setImages(pageImages);
  }

  const text = (section: string, key: string, fallback: string) =>
    richText[`about.${section}.${key}`]?.value || fallback;

  const textStyle = (section: string, key: string) =>
    styleToReact(richText[`about.${section}.${key}`]?.style);

  const heroBackground =
    images["about.hero.mountains"]?.url ||
    images["about.hero.banner"]?.url ||
    "/mountains-bg.png";

  return (
    <main className="about-premium-page">
      <section className="about-premium-hero">
        <div
          className="about-premium-hero__art"
          style={{ backgroundImage: `url('${heroBackground}')` }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-20 text-center">
          <p
            className="brand-eyebrow"
            style={textStyle("hero", "eyebrow")}
          >
            {text("hero", "eyebrow", "ABOUT US")}
          </p>

          <h1
            className="site-heading-font mt-5 text-[clamp(3rem,6vw,5.7rem)] font-black leading-[.98] tracking-[-.045em] text-[#07142B]"
            style={textStyle("hero", "title")}
          >
            {text("hero", "title", "The Origin of Purity")}
          </h1>

          <div className="about-premium-mark" aria-hidden="true">
            <span />
            <Mountain className="h-8 w-8" />
            <span />
          </div>

          <p
            className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600"
            style={textStyle("hero", "description")}
          >
            {text(
              "hero",
              "description",
              "Your sourcing partner for authentic Himalayan Pink Salt from Pakistan.",
            )}
          </p>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-20 lg:pb-24">
        <article className="about-story-card">
          <div className="about-story-icon" aria-hidden="true">
            <Mountain className="h-16 w-16" />
          </div>

          <div className="about-story-copy">
            <p
              className="brand-eyebrow text-left"
              style={textStyle("story", "eyebrow")}
            >
              {text("story", "eyebrow", "WHO WE ARE")}
            </p>
            <h2
              className="site-heading-font mt-3 text-[clamp(2rem,4vw,3.3rem)] font-black leading-tight text-[#07142B]"
              style={textStyle("story", "title")}
            >
              {text("story", "title", "Who We Are")}
            </h2>
            <div className="brand-heading-line" />
            <p
              className="mt-5 text-[16px] leading-8 text-slate-600"
              style={textStyle("story", "body_one")}
            >
              {text(
                "story",
                "body_one",
                "The Salt Origin connects international buyers with authentic Himalayan Pink Salt sourced from Pakistan and prepared for global retail, foodservice and private-label markets.",
              )}
            </p>
            <p
              className="mt-4 text-[16px] leading-8 text-slate-600"
              style={textStyle("story", "body_two")}
            >
              {text(
                "story",
                "body_two",
                "As an export-focused B2B supplier, we support distributors, wholesalers and brands with dependable supply, defined product specifications, market-ready packaging and responsive commercial service.",
              )}
            </p>
          </div>
        </article>

        <div className="mt-7 grid gap-7 lg:grid-cols-2">
          <AboutValueCard
            icon={<Target className="h-10 w-10" />}
            eyebrow={text("mission", "eyebrow", "OUR PURPOSE")}
            title={text("mission", "title", "Our Mission")}
            text={text(
              "mission",
              "text",
              "To deliver dependable Himalayan Pink Salt solutions with clear specifications, consistent service and long-term value for international buyers.",
            )}
            eyebrowStyle={textStyle("mission", "eyebrow")}
            titleStyle={textStyle("mission", "title")}
            textStyle={textStyle("mission", "text")}
          />

          <AboutValueCard
            icon={<Eye className="h-10 w-10" />}
            eyebrow={text("vision", "eyebrow", "OUR DIRECTION")}
            title={text("vision", "title", "Our Vision")}
            text={text(
              "vision",
              "text",
              "To become a trusted international partner for Himalayan Pink Salt, private-label development and export-ready product programs.",
            )}
            eyebrowStyle={textStyle("vision", "eyebrow")}
            titleStyle={textStyle("vision", "title")}
            textStyle={textStyle("vision", "text")}
          />
        </div>

        <article className="about-founder-card mt-7">
          <div className="about-founder-quote" aria-hidden="true">
            <Quote className="h-12 w-12" />
          </div>

          <div>
            <p
              className="brand-eyebrow text-left"
              style={textStyle("founder", "eyebrow")}
            >
              {text("founder", "eyebrow", "FOUNDER'S MESSAGE")}
            </p>
            <h2
              className="site-heading-font mt-3 text-[clamp(2rem,4vw,3.35rem)] font-black leading-tight text-[#07142B]"
              style={textStyle("founder", "title")}
            >
              {text("founder", "title", "Meet the Vision Behind The Salt Origin")}
            </h2>
            <div className="brand-heading-line" />
            <p
              className="mt-6 text-[16px] leading-8 text-slate-600"
              style={textStyle("founder", "message")}
            >
              {text(
                "founder",
                "message",
                "We started The Salt Origin with a simple purpose: to close the gap between the source of Himalayan Pink Salt and serious international buyers. Our focus is not only to supply a product, but to build trust through clear communication, dependable quality and responsible export support.",
              )}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[#F0DCE1] pt-6">
              <ShieldCheck className="h-6 w-6 text-[var(--brand-pink)]" />
              <div>
                <p
                  className="font-black text-[#07142B]"
                  style={textStyle("founder", "name")}
                >
                  {text("founder", "name", "Muhammad Hamza Khan")}
                </p>
                <p
                  className="mt-1 text-sm text-slate-500"
                  style={textStyle("founder", "role")}
                >
                  {text(
                    "founder",
                    "role",
                    "CEO & Founder, The Salt Origin & Khan & Co.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

function AboutValueCard({
  icon,
  eyebrow,
  title,
  text,
  eyebrowStyle,
  titleStyle,
  textStyle,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  text: string;
  eyebrowStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  textStyle?: React.CSSProperties;
}) {
  return (
    <article className="about-value-card">
      <div className="about-value-icon" aria-hidden="true">
        {icon}
      </div>
      <p className="brand-eyebrow text-left" style={eyebrowStyle}>
        {eyebrow}
      </p>
      <h3
        className="site-heading-font mt-3 text-3xl font-black text-[#07142B]"
        style={titleStyle}
      >
        {title}
      </h3>
      <div className="brand-heading-line" />
      <p className="mt-5 leading-8 text-slate-600" style={textStyle}>
        {text}
      </p>
    </article>
  );
}
