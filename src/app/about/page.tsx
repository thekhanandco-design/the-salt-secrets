"use client";

import { useEffect, useState } from "react";
import { Award, Box, FlaskConical, ShieldCheck } from "lucide-react";
import { loadCmsImages, loadCmsTextWithStyles, type CmsTextPayload } from "@/lib/cms";
import { supabase } from "@/lib/supabase-client";
import { styleToReact } from "@/lib/text-style";

type CmsImage = { url: string; alt: string };
type FounderSlot = { current_url?: string | null; default_url?: string | null; alt_text?: string | null; is_active?: boolean | null };

export default function AboutPage() {
  const [richText, setRichText] = useState<Record<string, CmsTextPayload>>({});
  const [images, setImages] = useState<Record<string, CmsImage>>({});
  const [founderSlot, setFounderSlot] = useState<FounderSlot | null>(null);

  useEffect(() => {
    void load();
    const refresh = () => void load(localStorage.getItem("salt-language") || "en");
    window.addEventListener("salt-cms-updated", refresh);
    window.addEventListener("salt-language-change", refresh);
    return () => { window.removeEventListener("salt-cms-updated", refresh); window.removeEventListener("salt-language-change", refresh); };
  }, []);

  async function load(language = localStorage.getItem("salt-language") || "en") {
    const [texts, pageImages, { data: founder }] = await Promise.all([
      loadCmsTextWithStyles("about", language),
      loadCmsImages("about"),
      supabase.from("cms_image_slots").select("current_url,default_url,alt_text,is_active").eq("page_slug", "about").eq("section_slug", "founder").eq("slot_key", "portrait").maybeSingle(),
    ]);
    setRichText(texts);
    setImages(pageImages);
    setFounderSlot(founder || null);
  }

  const text = (section: string, key: string, fallback: string) => richText[`about.${section}.${key}`]?.value || fallback;
  const textStyle = (section: string, key: string) => styleToReact(richText[`about.${section}.${key}`]?.style);
  const heroImage = images["about.hero.reference"]?.url || images["about.hero.mountains"]?.url || "/about-hero-mountains-reference.png";
  const storyImage = images["about.story.visual"]?.url || images["about.story.collage"]?.url || "/about-story-reference.png";
  const founderImage = founderSlot ? (founderSlot.current_url || founderSlot.default_url || "/founder-portrait-reference.png") : "/founder-portrait-reference.png";
  const founderVisible = founderSlot?.is_active !== false;

  return (
    <main className="tso-route-page tso-about-page">
      <section className="tso-about-hero" data-cms-section="hero">
        <div className="tso-about-hero__mountains" style={{ backgroundImage: `url('${heroImage}')` }} aria-hidden="true" />
        <div className="tso-public-container tso-about-hero__inner">
          <div className="tso-crumbs">HOME / ABOUT US</div>
          <h1 style={textStyle("hero", "title")}><span>{text("hero", "title_main", "The Legacy of ")}</span><em>{text("hero", "title_accent", "the Mountains")}</em></h1>
          <p style={textStyle("hero", "description")}>{text("hero", "description", "A 250-million-year-old journey—from the pristine foothills of the Himalayas directly to your brand.")}</p>
        </div>
      </section>

      <section className="tso-about-story tso-route-section" data-cms-section="story">
        <div className="tso-public-container tso-about-story__grid">
          <div className="tso-about-story__visual"><img src={storyImage} alt={images["about.story.visual"]?.alt || "Himalayan mountain origin"}/></div>
          <div className="tso-about-copy">
            <div className="tso-eyebrow">Our Story & Mission</div>
            <h2><span>{text("story", "title_main", "Custodians of Earth’s ")}</span><em>{text("story", "title_accent", "Purest Treasure")}</em></h2>
            <p>{text("story", "body_one", "Long before modern civilization, ancient, unpolluted oceans crystallized deep beneath the majestic peaks of the Himalayas. Locked away from time and toxins for 250 million years, this naturally pink, mineral-rich treasure remained untouched.")}</p>
            <p>{text("story", "body_two", "At The Salt Origin, our story doesn’t start with a business plan, it starts with a profound respect for this legacy. We realized that this ancient gift deserved to be shared with the world in its most authentic form.")}</p>
            <p>{text("story", "body_three", "But we didn’t just want to be another company moving boxes across oceans. We wanted to build a bridge between the rugged, beautiful salt mines of Pakistan and the retail shelves of the world.")}</p>
            <p>{text("story", "body_four", "Today, we are proud to be the silent force behind global brands, empowering them to share a piece of the earth’s purest history with their customers.")}</p>
          </div>
        </div>
      </section>

      <section className="tso-about-founder" data-cms-section="founder">
        <div className={`tso-public-container tso-about-founder__grid ${founderVisible ? "has-image" : "no-image"}`}>
          <div className="tso-about-founder__message">
            <div className="tso-eyebrow">A Message from the Founder</div>
            <h2><span>{text("founder", "title_main", "Building a Partnership ")}</span><em>{text("founder", "title_accent", "Built on Peace of Mind")}</em></h2>
            <div className="tso-founder-quote-mark">“</div>
            <div className="tso-founder-message" style={textStyle("founder", "message")}>
              {text("founder", "message", "Every great brand is built on a foundation of absolute trust. When I founded The Salt Origin, I looked at the global export market and saw a missing piece: genuine, human connection.\n\nI saw international buyers struggling with inconsistent quality, broken promises, and the anxiety of managing supply chains from thousands of miles away. I wanted to change that.\n\nMy vision was to build more than just an export company; I wanted to build a bridge of absolute reliability. I wanted you to feel the passion we have for this extraordinary pink salt, and the deep respect we have for your business.\n\nWhen you choose to work with us, you aren’t just another order number—you become part of our story. We take on the heavy lifting so you can focus on what you do best: growing your brand, knowing your supply chain is in safe, caring hands.")}
            </div>
            <div className="tso-founder-signature">{text("founder", "name", "Hamza Khan")}</div>
            <p className="tso-founder-role">{text("founder", "role", "Founder, The Salt Origin & The Khan & Co.")}</p>
          </div>
          {founderVisible ? <div className="tso-about-founder__portrait"><img src={founderImage} alt={founderSlot?.alt_text || "Founder of The Salt Origin"}/></div> : null}
        </div>
      </section>

      <section className="tso-about-quality tso-route-section" data-cms-section="quality">
        <div className="tso-public-container tso-about-quality__grid">
          <div className="tso-about-quality__copy">
            <div className="tso-quality-title-row"><span><Award /></span><div><div className="tso-eyebrow">Our Commitment to Quality</div><h2><span>{text("quality", "title_main", "Protecting ")}</span><em>{text("quality", "title_accent", "the Purity")}</em></h2></div></div>
            <p>{text("quality", "body_one", "A natural gift that has remained pure for millions of years demands the highest level of respect. We refuse to compromise on how this treasure is handled.")}</p>
            <p>{text("quality", "body_two", "To honor the salt’s natural perfection and to protect your consumers, every single batch is meticulously processed, refined, and packaged within state-of-the-art, internationally certified facilities.")}</p>
            <p>{text("quality", "body_three", "We don’t just meet global food safety standards; we embrace them as our moral obligation to you. This is our promise: flawless execution from the ancient mines to your customer’s table.")}</p>
          </div>
          <div className="tso-quality-cards">
            <QualityCard icon={<ShieldCheck/>} title="Naturally Pure" text="250-million-year-old pristine Himalayan salt" />
            <QualityCard icon={<FlaskConical/>} title="Certified Facilities" text="Processed in internationally certified & audited plants" />
            <QualityCard icon={<Award/>} title="Global Standards" text="Exceeding food safety standards worldwide" />
            <QualityCard icon={<Box/>} title="Flawless Execution" text="From ancient mines to your customer’s table" />
          </div>
        </div>
      </section>
    </main>
  );
}

function QualityCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article><span>{icon}</span><div><strong>{title}</strong><p>{text}</p></div></article>;
}
