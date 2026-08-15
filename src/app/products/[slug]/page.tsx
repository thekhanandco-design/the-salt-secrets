import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Box,
  Check,
  Download,
  Globe2,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingCart,
  Tag,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  normalizeProductPageSettings,
  type ProductPageBenefit,
  type ProductPageSectionKey,
  type ProductPageSettings,
  type ProductPageWhyItem,
} from "@/lib/product-page-layout";

export const dynamic = "force-dynamic";

type Product = {
  id: number;
  created_at: string;
  title: string;
  slug: string;
  category: string | null;
  description: string | null;
  image: string | null;
  moq: string | null;
  packaging: string | null;
  status: string | null;
  subtitle?: string | null;
  short_description?: string | null;
  grain_type?: string | null;
  sizes?: string | null;
  packaging_type?: string | null;
  best_for?: string | null;
  features?: string[] | null;
  applications?: string[] | null;
  specifications?: Record<string, string> | null;
  gallery?: string[] | null;
  brochure_url?: string | null;
  origin?: string | null;
  grade?: string | null;
  granulation?: string | null;
  mesh_size?: string | null;
  purity?: string | null;
  moisture?: string | null;
  available_pack_sizes?: string | null;
  bulk_packaging?: string | null;
  private_label_available?: boolean | null;
  production_capacity?: string | null;
  lead_time?: string | null;
  hs_code?: string | null;
  incoterms?: string[] | null;
  port_of_loading?: string | null;
  coa_url?: string | null;
  msds_url?: string | null;
  specification_sheet_url?: string | null;
};

async function getProduct(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) return null;
  return data as Product;
}

async function getPageSettings(productId: number): Promise<ProductPageSettings> {
  const { data } = await supabase
    .from("page_content")
    .select("content")
    .eq("page_slug", `product:${productId}`)
    .maybeSingle();
  return normalizeProductPageSettings(data?.content);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return { title: "Product Not Found | The Salt Origin", description: "Premium Himalayan Pink Salt exporter supplying global markets." };
  }
  const description = product.description || product.short_description || "Premium Himalayan Pink Salt products for private label, retail packaging, bulk supply and global export markets.";
  return {
    title: `${product.title} | The Salt Origin`,
    description,
    openGraph: { title: `${product.title} | The Salt Origin`, description, images: product.image ? [product.image] : [] },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const activeProduct: Product = product;

  const settings = await getPageSettings(activeProduct.id);
  const productImage = activeProduct.image || "/product-2.png";
  const description = activeProduct.description || activeProduct.short_description || "Premium Himalayan Pink Salt product available for retail, private-label and global B2B programs.";
  const gallery = [productImage, ...(activeProduct.gallery || []).filter(Boolean)].filter((value, index, array) => array.indexOf(value) === index);
  const features = (activeProduct.features || []).filter(Boolean);
  const applications = (activeProduct.applications || []).filter(Boolean);
  const documentLinks: Array<[string, string]> = [];
  if (activeProduct.specification_sheet_url) documentLinks.push(["Specification Sheet", activeProduct.specification_sheet_url]);
  if (activeProduct.coa_url) documentLinks.push(["COA", activeProduct.coa_url]);
  if (activeProduct.msds_url) documentLinks.push(["MSDS", activeProduct.msds_url]);
  if (activeProduct.brochure_url) documentLinks.push(["Product Brochure", activeProduct.brochure_url]);

  const heroSpecs = [
    ["Origin", activeProduct.origin || "Pakistan"],
    ["Available Sizes", activeProduct.available_pack_sizes || activeProduct.sizes || "On request"],
    ["Grain Type", activeProduct.grain_type || activeProduct.granulation || activeProduct.grade || "On request"],
    ["Packaging Type", activeProduct.packaging_type || activeProduct.packaging || "On request"],
    ["MOQ", activeProduct.moq || "On request"],
    ["HS Code", activeProduct.hs_code || "On request"],
  ];

  const rawSpecifications: Array<[string, string]> = [
    ["Origin", activeProduct.origin || "Pakistan"],
    ["Grade", activeProduct.grade || ""],
    ["Grain / Granulation", activeProduct.grain_type || activeProduct.granulation || ""],
    ["Mesh Size", activeProduct.mesh_size || ""],
    ["Purity", activeProduct.purity || ""],
    ["Moisture", activeProduct.moisture || ""],
    ["Available Sizes", activeProduct.available_pack_sizes || activeProduct.sizes || ""],
    ["Packaging", activeProduct.bulk_packaging || activeProduct.packaging_type || activeProduct.packaging || ""],
    ["MOQ", activeProduct.moq || ""],
    ["Lead Time", activeProduct.lead_time || ""],
    ["Production Capacity", activeProduct.production_capacity || ""],
    ["HS Code", activeProduct.hs_code || ""],
    ["Port of Loading", activeProduct.port_of_loading || ""],
    ...Object.entries(activeProduct.specifications || {}).map(([label, value]): [string, string] => [label, String(value)]),
  ];
  const specifications = rawSpecifications.filter(([, value]) => Boolean(value.trim()));

  const whatsappNumber = String(settings.whatsappNumber || "923462771693").replace(/\D/g, "");
  const whatsappText = encodeURIComponent(`Hello, I would like to inquire about ${activeProduct.title}.`);
  const categoryLabel = String(activeProduct.category || "Himalayan Pink Salt").replaceAll("-", " ");

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: activeProduct.title,
    description,
    image: productImage,
    brand: { "@type": "Brand", name: "The Salt Origin" },
    manufacturer: { "@type": "Organization", name: "Khan & Co." },
    category: activeProduct.category || "Himalayan Pink Salt",
    countryOfOrigin: activeProduct.origin || "Pakistan",
    url: `https://www.thesaltorigin.com/products/${slug}`,
  };

  const sectionVisible = (key: ProductPageSectionKey) => settings.sectionVisibility[key] !== false;
  const editorPageKey = `product::${activeProduct.id}::${activeProduct.slug}`;
  const cmsKey = (section: string, field: string) => `${editorPageKey}.${section}.${field}`;
  const marketplaceLogo = (name: string) => {
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const known: Record<string, string> = { amazon: "/marketplaces/amazon.svg", walmart: "/marketplaces/walmart.svg", ebay: "/marketplaces/ebay.svg", etsy: "/marketplaces/etsy.svg", shopify: "/marketplaces/shopify.svg", flipkart: "/marketplaces/flipkart.svg" };
    return known[key] || "";
  };

  function renderSection(key: ProductPageSectionKey) {
    if (!sectionVisible(key)) return null;

    if (key === "hero") {
      return (
        <section className="tso-pdp-hero" data-cms-section="hero" key={key}>
          <div className="tso-pdp-media-card">
            <div className="tso-pdp-media">
              {productImage.startsWith("http") ? <img src={productImage} alt={activeProduct.title} /> : <Image src={productImage} alt={activeProduct.title} width={900} height={900} priority />}
            </div>
          </div>
          <div className="tso-pdp-copy">
            <div className="tso-pdp-breadcrumb">Home / Products / {categoryLabel} / {activeProduct.title}</div>
            <span className="tso-pdp-eyebrow" data-cms-key={cmsKey("hero", "eyebrow")}>{settings.eyebrow || categoryLabel}</span>
            <h1 data-cms-key={cmsKey("hero", "title")}>{activeProduct.title}</h1>
            {activeProduct.subtitle ? <p className="tso-pdp-subtitle" data-cms-key={cmsKey("hero", "subtitle")}>{activeProduct.subtitle}</p> : null}
            <p className="tso-pdp-description" data-cms-key={cmsKey("hero", "description")}>{description}</p>
            <div className="tso-pdp-spec-list">
              {heroSpecs.map(([label, value]) => <div className="tso-pdp-spec-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}
            </div>
            <div className="tso-pdp-actions">
              <Link href={`/contact?product=${encodeURIComponent(activeProduct.title)}`} className="tso-pdp-primary" data-cms-key={cmsKey("hero", "requestQuoteLabel")}>{settings.requestQuoteLabel}<ArrowRight /></Link>
              <Link href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="tso-pdp-whatsapp" data-cms-key={cmsKey("hero", "whatsappLabel")}><MessageCircle />{settings.whatsappLabel}</Link>
            </div>
          </div>
        </section>
      );
    }

    if (key === "benefits") {
      return <section className="tso-pdp-benefit-strip" data-cms-section="benefits" key={key}>{settings.benefitItems.map((item, index) => <BenefitCard item={item} key={`${item.title}-${index}`} />)}</section>;
    }

    if (key === "marketplaces") {
      return (
        <section className="tso-pdp-marketplaces" data-cms-section="marketplaces" key={key}>
          <div className="tso-pdp-section-heading centered"><span>Marketplace Ready</span><h2 data-cms-key={cmsKey("marketplaces", "title")}>{settings.marketplacesTitle}</h2><p data-cms-key={cmsKey("marketplaces", "subtitle")}>{settings.marketplacesSubtitle}</p></div>
          <div className="tso-pdp-marketplace-grid">{settings.marketplaces.map((item) => { const logo = marketplaceLogo(item); return <div key={item} className="tso-pdp-marketplace-logo">{logo ? <img src={logo} alt={`${item} logo`} /> : <span>{item}</span>}</div>; })}</div>
        </section>
      );
    }

    if (key === "process") {
      return (
        <section className="tso-pdp-process" data-cms-section="process" key={key}>
          <div className="tso-pdp-section-heading centered"><span>Simple B2B Process</span><h2 data-cms-key={cmsKey("process", "title")}>{settings.processTitle}</h2><p data-cms-key={cmsKey("process", "subtitle")}>{settings.processSubtitle}</p></div>
          <div className="tso-pdp-process-grid">{settings.processItems.map((item) => <article key={`${item.number}-${item.title}`}><b>{item.number}</b><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
        </section>
      );
    }

    if (key === "specifications") {
      return (
        <section className="tso-pdp-panel" data-cms-section="specifications" key={key}>
          <div className="tso-pdp-section-heading"><span>Technical Information</span><h2 data-cms-key={cmsKey("specifications", "title")}>{settings.specificationsTitle}</h2></div>
          {specifications.length ? <div className="tso-pdp-technical-grid">{specifications.map(([label, value]) => <div key={`${label}-${value}`}><span>{label}</span><strong>{value}</strong></div>)}</div> : <p className="tso-pdp-empty">Detailed specifications are available on request.</p>}
        </section>
      );
    }

    if (key === "features") return null;

    if (key === "documents") {
      return (
        <section className="tso-pdp-panel" data-cms-section="documents" key={key}>
          <div className="tso-pdp-section-heading"><span>Buyer Documents</span><h2>Downloads &amp; Supporting Files</h2></div>
          {documentLinks.length ? <div className="tso-pdp-documents">{documentLinks.map(([label, url]) => <Link href={url} target="_blank" rel="noopener noreferrer" key={label}><Download />{label}</Link>)}</div> : <p className="tso-pdp-empty">No public documents are attached to this product yet.</p>}
        </section>
      );
    }

    if (key === "gallery") {
      return gallery.length > 1 ? (
        <section className="tso-pdp-panel" data-cms-section="gallery" key={key}>
          <div className="tso-pdp-section-heading"><span>Product Media</span><h2>Product Gallery</h2></div>
          <div className="tso-pdp-gallery">{gallery.map((image, index) => <div key={`${image}-${index}`}><img src={image} alt={`${activeProduct.title} ${index + 1}`} /></div>)}</div>
        </section>
      ) : null;
    }

    if (key === "why") {
      return (
        <section className="tso-pdp-panel" data-cms-section="why" key={key}>
          <div className="tso-pdp-section-heading"><span>Export Partnership</span><h2>{settings.whyTitle}</h2></div>
          <div className="tso-pdp-why-grid">{settings.whyItems.map((item, index) => <WhyCard item={item} key={`${item.title}-${index}`} />)}</div>
        </section>
      );
    }

    if (key === "cta") {
      return (
        <section className="tso-pdp-final-cta" data-cms-section="cta" key={key}>
          <div><span>Discuss your requirements</span><h2>Request specifications, packaging options and a formal quotation.</h2></div>
          <Link href={`/contact?product=${encodeURIComponent(activeProduct.title)}`} className="tso-pdp-primary">Request Quotation<ArrowRight /></Link>
        </section>
      );
    }

    return null;
  }

  return (
    <>
      <Script id="product-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <main className="tso-pdp-page">
        <div className="tso-pdp-shell">{settings.sectionOrder.map((section) => renderSection(section))}</div>
      </main>
    </>
  );
}

function BenefitCard({ item }: { item: ProductPageBenefit }) {
  return <article><span>{benefitIcon(item.icon)}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>;
}

function benefitIcon(icon?: ProductPageBenefit["icon"]): ReactNode {
  if (icon === "box") return <Box />;
  if (icon === "cart") return <ShoppingCart />;
  if (icon === "chart") return <BarChart3 />;
  if (icon === "globe") return <Globe2 />;
  if (icon === "shield") return <ShieldCheck />;
  if (icon === "tag") return <Tag />;
  return <Package />;
}

function WhyCard({ item }: { item: ProductPageWhyItem }) {
  return <article><span>{whyIcon(item.icon)}</span><h3>{item.title}</h3><p>{item.text}</p></article>;
}

function whyIcon(icon?: ProductPageWhyItem["icon"]): ReactNode {
  if (icon === "package") return <Package />;
  if (icon === "shield") return <ShieldCheck />;
  if (icon === "tag") return <Tag />;
  return <Globe2 />;
}
