"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Boxes,
  ClipboardCheck,
  Container,
  Factory,
  FileCheck2,
  FlaskConical,
  Globe2,
  Handshake,
  Landmark,
  MapPin,
  PackageCheck,
  PackageOpen,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Users,
  Utensils,
  Warehouse,
} from "lucide-react";
import { loadCmsImages, loadCmsTextWithStyles, type CmsTextPayload } from "@/lib/cms";
import { useCmsImageAltResolver, useCmsImageResolver } from "@/components/CmsImageManifestProvider";

const page = "about";

type CmsImage = { url: string; alt: string };

type Card = {
  key: string;
  icon: React.ReactNode;
  title: string;
  text: string;
};

export default function AboutPage() {
  const cmsImage = useCmsImageResolver();
  const cmsImageAlt = useCmsImageAltResolver();
  const [richText, setRichText] = useState<Record<string, CmsTextPayload>>({});
  const [images, setImages] = useState<Record<string, CmsImage>>({});

  useEffect(() => {
    void load();
    const refresh = () => void load(localStorage.getItem("salt-language") || "en");
    window.addEventListener("salt-cms-updated", refresh);
    window.addEventListener("salt-language-change", refresh);
    return () => {
      window.removeEventListener("salt-cms-updated", refresh);
      window.removeEventListener("salt-language-change", refresh);
    };
  }, []);

  async function load(language = localStorage.getItem("salt-language") || "en") {
    const [texts, pageImages] = await Promise.all([
      loadCmsTextWithStyles(page, language),
      loadCmsImages(page),
    ]);
    setRichText(texts);
    setImages(pageImages);
  }

  const text = (section: string, key: string, fallback: string) =>
    richText[`${page}.${section}.${key}`]?.value || fallback;

  const image = (section: string, key: string, fallback: string) => {
    const fullKey = `${page}.${section}.${key}`;
    return cmsImage(fullKey, images[fullKey]?.url || fallback);
  };

  const whoCards: Card[] = [
    {
      key: "pakistan",
      icon: <MapPin />,
      title: text("who_we_are", "pakistan_title", "Pakistan Based"),
      text: text("who_we_are", "pakistan_text", "Proudly based in Pakistan, close to the source and connected to the world."),
    },
    {
      key: "specialist",
      icon: <Landmark />,
      title: text("who_we_are", "specialist_title", "Himalayan Salt Specialist"),
      text: text("who_we_are", "specialist_text", "Focused on Himalayan pink salt and related salt products."),
    },
    {
      key: "b2b",
      icon: <Users />,
      title: text("who_we_are", "b2b_title", "B2B Focused"),
      text: text("who_we_are", "b2b_text", "Serving importers, distributors, wholesalers, foodservice and private label brands."),
    },
    {
      key: "export",
      icon: <Globe2 />,
      title: text("who_we_are", "export_title", "Export Ready"),
      text: text("who_we_are", "export_text", "Packaging, documentation and shipment solutions for international buyers."),
    },
  ];

  const originSteps: Card[] = [
    { key: "mine", icon: <MapPin />, title: text("origin", "mine_title", "Khewra Mines Pakistan"), text: "" },
    { key: "natural", icon: <BadgeCheck />, title: text("origin", "natural_title", "Pure & Natural Origin"), text: "" },
    { key: "processed", icon: <Factory />, title: text("origin", "processed_title", "Carefully Processed"), text: "" },
    { key: "delivered", icon: <Globe2 />, title: text("origin", "delivered_title", "Delivered to Global Markets"), text: "" },
  ];

  const serviceCards = [
    {
      key: "bulk",
      image: image("what_we_do", "bulk_image", "/white-sack.png"),
      fallbackAlt: "Bulk Himalayan pink salt supply",
      icon: <Warehouse />,
      title: text("what_we_do", "bulk_title", "Bulk Supply"),
      text: text("what_we_do", "bulk_text", "Bulk Himalayan pink salt for importers, wholesalers and food manufacturers."),
    },
    {
      key: "private_label",
      image: image("what_we_do", "private_label_image", "/custom-packaging.png"),
      fallbackAlt: "Private label Himalayan pink salt packaging",
      icon: <Tag />,
      title: text("what_we_do", "private_label_title", "Private Label"),
      text: text("what_we_do", "private_label_text", "Custom packaging and branding solutions tailored to your market needs."),
    },
    {
      key: "retail",
      image: image("what_we_do", "retail_image", "/pet-jars.png"),
      fallbackAlt: "Retail Himalayan pink salt products",
      icon: <ShoppingCart />,
      title: text("what_we_do", "retail_title", "Retail Products"),
      text: text("what_we_do", "retail_text", "Wide range of retail formats including jars, grinders, pouches and specialty products."),
    },
    {
      key: "export",
      image: image("what_we_do", "export_image", "/hero-banner.png"),
      fallbackAlt: "Himalayan pink salt export solutions",
      icon: <Container />,
      title: text("what_we_do", "export_title", "Export Solutions"),
      text: text("what_we_do", "export_text", "Export documentation, logistics support and packaging solutions for international shipments."),
    },
  ];

  const serveCards: Card[] = [
    { key: "importers", icon: <Handshake />, title: text("who_we_serve", "importers_title", "Importers"), text: text("who_we_serve", "importers_text", "Reliable supply for international import companies.") },
    { key: "distributors", icon: <Users />, title: text("who_we_serve", "distributors_title", "Distributors"), text: text("who_we_serve", "distributors_text", "Long-term partnerships with global distributors.") },
    { key: "wholesalers", icon: <Warehouse />, title: text("who_we_serve", "wholesalers_title", "Wholesalers"), text: text("who_we_serve", "wholesalers_text", "Bulk supply solutions for wholesalers and trading companies.") },
    { key: "private_label", icon: <Tag />, title: text("who_we_serve", "private_label_title", "Private Label Brands"), text: text("who_we_serve", "private_label_text", "Custom manufacturing and private label programs.") },
    { key: "foodservice", icon: <Utensils />, title: text("who_we_serve", "foodservice_title", "Foodservice"), text: text("who_we_serve", "foodservice_text", "Quality salt solutions for foodservice and hospitality businesses.") },
    { key: "retail", icon: <Store />, title: text("who_we_serve", "retail_title", "Retail Brands"), text: text("who_we_serve", "retail_text", "Consistent quality products for retailers and e-commerce businesses.") },
  ];

  const qualityCards: Card[] = [
    { key: "specs", icon: <FileCheck2 />, title: text("quality", "specs_title", "Product Specifications"), text: text("quality", "specs_text", "Detailed product specs available for every product and size.") },
    { key: "coa", icon: <ClipboardCheck />, title: text("quality", "coa_title", "COA"), text: text("quality", "coa_text", "Certificate of Analysis available for each shipment.") },
    { key: "lab", icon: <FlaskConical />, title: text("quality", "lab_title", "Lab Testing"), text: text("quality", "lab_text", "Regular laboratory testing for purity and safety.") },
    { key: "food", icon: <BadgeCheck />, title: text("quality", "food_title", "Food Safety"), text: text("quality", "food_text", "Processed and packed under food safety standards.") },
    { key: "docs", icon: <FileCheck2 />, title: text("quality", "docs_title", "Export Documentation"), text: text("quality", "docs_text", "All necessary export documents for smooth international trade.") },
    { key: "packaging", icon: <PackageCheck />, title: text("quality", "packaging_title", "Packaging Standards"), text: text("quality", "packaging_text", "Export-ready packaging to ensure product quality on arrival.") },
  ];

  const processCards: Card[] = [
    { key: "source", icon: <Landmark />, title: text("process", "source_title", "Source"), text: text("process", "source_text", "Himalayan salt sourced from internationally recognized salt deposits in Pakistan.") },
    { key: "process", icon: <Factory />, title: text("process", "process_title", "Process"), text: text("process", "process_text", "Carefully sorted, washed and processed to meet international standards.") },
    { key: "quality", icon: <BadgeCheck />, title: text("process", "quality_title", "Quality Check"), text: text("process", "quality_text", "Tested for purity, size and quality to ensure consistency.") },
    { key: "package", icon: <PackageOpen />, title: text("process", "package_title", "Package"), text: text("process", "package_text", "Packed in bulk, retail or private label formats as per requirement.") },
    { key: "export", icon: <Globe2 />, title: text("process", "export_title", "Export"), text: text("process", "export_text", "Delivered to your port with complete export documentation.") },
  ];

  return (
    <main className="tso-route-page tso-about-v78">
      <section className="tso-page-hero tso-page-hero--clean" data-cms-section="hero">
        <div className="tso-public-container">
          <div className="tso-crumbs" data-cms-key="about.hero.crumbs">
            {text("hero", "crumbs", "HOME / ABOUT US")}
          </div>
          <h1>
            <span data-cms-key="about.hero.title_main">{text("hero", "title_main", "About ")}</span>
            <em data-cms-key="about.hero.title_accent">{text("hero", "title_accent", "Us")}</em>
          </h1>
          <p data-cms-key="about.hero.description">
            {text(
              "hero",
              "description",
              "Pakistan-based Himalayan pink salt expertise built around authentic origin, dependable quality, private label solutions and global B2B supply.",
            )}
          </p>
        </div>
      </section>

      <section className="tso-about-v78-section tso-about-v78-intro" data-cms-section="who_we_are">
        <div className="tso-public-container">
          <SectionHeading
            cmsSection="who_we_are"
            eyebrow={text("who_we_are", "eyebrow", "WHO WE ARE")}
            titleMain={text("who_we_are", "title_main", "Rooted in Pakistan. ")}
            titleAccent={text("who_we_are", "title_accent", "Built for Global Markets.")}
            description={text("who_we_are", "description", "The Salt Origin is a Pakistan-based B2B supplier and exporter specializing in Himalayan pink salt. We connect Pakistan’s natural resources with international businesses through quality, reliability and trust.")}
          />
          <div className="tso-about-v78-grid four">
            {whoCards.map((card) => <IconCard key={card.key} section="who_we_are" card={card} />)}
          </div>
        </div>
      </section>

      <section className="tso-about-v78-origin" data-cms-section="origin">
        <div className="tso-public-container tso-about-v78-origin-grid">
          <div className="tso-about-v78-origin-image">
            <img
              data-cms-image-key="about.origin.mine_image"
              src={image("origin", "mine_image", "/authentic-origin-khewra.png")}
              alt={images["about.origin.mine_image"]?.alt || "Khewra Salt Mine and Himalayan pink salt"}
            />
          </div>
          <div className="tso-about-v78-origin-copy">
            <div className="tso-about-v78-eyebrow" data-cms-key="about.origin.eyebrow">{text("origin", "eyebrow", "OUR ORIGIN")}</div>
            <h2><span data-cms-key="about.origin.title_main">{text("origin", "title_main", "From ")}</span><em data-cms-key="about.origin.title_accent">{text("origin", "title_accent", "Khewra, Pakistan.")}</em></h2>
            <p data-cms-key="about.origin.body_one">{text("origin", "body_one", "Our Himalayan pink salt originates from the Himalayan salt range of Pakistan, with the historic Khewra Salt Mines being one of the world’s oldest and most recognized sources of natural rock salt.")}</p>
            <p data-cms-key="about.origin.body_two">{text("origin", "body_two", "We combine this remarkable natural resource with modern processing, quality control and international standards to meet the needs of global markets.")}</p>
            <div className="tso-about-v78-origin-steps">
              {originSteps.map((card, index) => (
                <div key={card.key}>
                  <span>{card.icon}</span>
                  <strong data-cms-key={`about.origin.${card.key}_title`}>{card.title}</strong>
                  {index < originSteps.length - 1 ? <i>›</i> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="tso-about-v78-section" data-cms-section="what_we_do">
        <div className="tso-public-container">
          <SectionHeading cmsSection="what_we_do" eyebrow={text("what_we_do", "eyebrow", "WHAT WE DO")} />
          <div className="tso-about-v78-service-grid">
            {serviceCards.map((card) => (
              <article key={card.key}>
                <div className="tso-about-v78-service-image">
                  <img data-cms-image-key={`about.what_we_do.${card.key}_image`} src={card.image} alt={cmsImageAlt(`about.what_we_do.${card.key}_image`, images[`about.what_we_do.${card.key}_image`]?.alt || card.fallbackAlt)} />
                </div>
                <div className="tso-about-v78-service-copy">
                  <span>{card.icon}</span>
                  <h3 data-cms-key={`about.what_we_do.${card.key}_title`}>{card.title}</h3>
                  <p data-cms-key={`about.what_we_do.${card.key}_text`}>{card.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tso-about-v78-section compact" data-cms-section="who_we_serve">
        <div className="tso-public-container">
          <SectionHeading cmsSection="who_we_serve" eyebrow={text("who_we_serve", "eyebrow", "WHO WE SERVE")} />
          <div className="tso-about-v78-grid six">
            {serveCards.map((card) => <IconCard key={card.key} section="who_we_serve" card={card} />)}
          </div>
        </div>
      </section>

      <section className="tso-about-v78-section compact tso-about-v78-quality" data-cms-section="quality">
        <div className="tso-public-container">
          <SectionHeading cmsSection="quality" eyebrow={text("quality", "eyebrow", "QUALITY & DOCUMENTATION")} titleMain={text("quality", "title_main", "Quality ")} titleAccent={text("quality", "title_accent", "You Can Verify.")} />
          <div className="tso-about-v78-grid six quality">
            {qualityCards.map((card) => <IconCard key={card.key} section="quality" card={card} />)}
          </div>
        </div>
      </section>

      <section className="tso-about-v78-section compact tso-about-v78-process" data-cms-section="process">
        <div className="tso-public-container">
          <SectionHeading cmsSection="process" eyebrow={text("process", "eyebrow", "FROM MINE TO MARKET")} titleMain={text("process", "title_main", "Our Process. ")} titleAccent={text("process", "title_accent", "Your Confidence.")} />
          <div className="tso-about-v78-process-row">
            {processCards.map((card, index) => (
              <article key={card.key}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{card.icon}</span>
                <h3 data-cms-key={`about.process.${card.key}_title`}>{card.title}</h3>
                <p data-cms-key={`about.process.${card.key}_text`}>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tso-about-v78-purpose" data-cms-section="purpose">
        <div className="tso-public-container tso-about-v78-purpose-grid">
          <div className="tso-about-v78-purpose-image">
            <img data-cms-image-key="about.purpose.salt_image" src={image("purpose", "salt_image", "/hero-banner.png")} alt={cmsImageAlt("about.purpose.salt_image", images["about.purpose.salt_image"]?.alt || "Himalayan pink salt")} />
          </div>
          <div className="tso-about-v78-purpose-copy">
            <div className="tso-about-v78-eyebrow" data-cms-key="about.purpose.eyebrow">{text("purpose", "eyebrow", "WHY WE EXIST")}</div>
            <h2><span data-cms-key="about.purpose.title_main">{text("purpose", "title_main", "Our Purpose. ")}</span><em data-cms-key="about.purpose.title_accent">{text("purpose", "title_accent", "Your Advantage.")}</em></h2>
            <p data-cms-key="about.purpose.body_one">{text("purpose", "body_one", "We believe sourcing a natural product should be simple, transparent and dependable.")}</p>
            <p data-cms-key="about.purpose.body_two">{text("purpose", "body_two", "Our goal is to make it easier for international businesses to source Himalayan pink salt from Pakistan with clear specifications, reliable communication and flexible supply solutions.")}</p>
            <p data-cms-key="about.purpose.body_three">{text("purpose", "body_three", "We exist to build long-term partnerships based on trust, quality and mutual growth.")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({ cmsSection, eyebrow, titleMain, titleAccent, description }: { cmsSection: string; eyebrow: string; titleMain?: string; titleAccent?: string; description?: string }) {
  return (
    <div className="tso-about-v78-heading">
      <div className="tso-about-v78-eyebrow" data-cms-key={`about.${cmsSection}.eyebrow`}>{eyebrow}</div>
      {titleMain || titleAccent ? <h2><span data-cms-key={`about.${cmsSection}.title_main`}>{titleMain || ""}</span>{titleAccent ? <em data-cms-key={`about.${cmsSection}.title_accent`}>{titleAccent}</em> : null}</h2> : null}
      {description ? <p data-cms-key={`about.${cmsSection}.description`}>{description}</p> : null}
    </div>
  );
}

function IconCard({ section, card }: { section: string; card: Card }) {
  return (
    <article>
      <span>{card.icon}</span>
      <h3 data-cms-key={`about.${section}.${card.key}_title`}>{card.title}</h3>
      <p data-cms-key={`about.${section}.${card.key}_text`}>{card.text}</p>
    </article>
  );
}
