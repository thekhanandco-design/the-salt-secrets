import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Check,
  Download,
  Globe2,
  MessageCircle,
  Package,
  ShieldCheck,
  Tag,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

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

type WhyItem = {
  title: string;
  text: string;
  icon?: "globe" | "package" | "shield" | "tag";
};

type ProductPageSettings = {
  eyebrow?: string;
  specificationsTitle?: string;
  featuresTitle?: string;
  applicationsTitle?: string;
  whyTitle?: string;
  requestQuoteLabel?: string;
  whatsappLabel?: string;
  whatsappNumber?: string;
  showWhySection?: boolean;
  showGallery?: boolean;
  whyItems?: WhyItem[];
};

const defaultSettings: Required<
  Omit<ProductPageSettings, "whyItems">
> & {
  whyItems: WhyItem[];
} = {
  eyebrow: "Product Details",
  specificationsTitle: "Product Specifications",
  featuresTitle: "Key Features",
  applicationsTitle: "Applications",
  whyTitle: "Why Buy From The Salt Origin?",
  requestQuoteLabel: "Request Quotation",
  whatsappLabel: "WhatsApp Inquiry",
  whatsappNumber: "923462771693",
  showWhySection: true,
  showGallery: true,
  whyItems: [
    {
      icon: "globe",
      title: "Global Export Support",
      text: "Documentation and supply support for international B2B buyers.",
    },
    {
      icon: "package",
      title: "Flexible Packaging",
      text: "Retail, bulk and private-label packaging options for different markets.",
    },
    {
      icon: "shield",
      title: "Quality-Focused Supply",
      text: "Product specifications, quality documents and traceability support where available.",
    },
    {
      icon: "tag",
      title: "Private Label Ready",
      text: "Custom branding and packaging support for qualified projects.",
    },
  ],
};

async function getProduct(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) {
    return null;
  }

  return data as Product;
}

async function getPageSettings(
  productId: number,
): Promise<ProductPageSettings> {
  const { data } = await supabase
    .from("page_content")
    .select("content")
    .eq("page_slug", `product:${productId}`)
    .maybeSingle();

  const value = data?.content;

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ProductPageSettings)
    : {};
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found | The Salt Origin",
      description:
        "Premium Himalayan Pink Salt exporter supplying global markets.",
    };
  }

  const description =
    product.description ||
    product.short_description ||
    "Premium Himalayan Pink Salt products for private label, retail packaging, bulk supply and global export markets.";

  return {
    title: `${product.title} | The Salt Origin`,
    description,
    openGraph: {
      title: `${product.title} | The Salt Origin`,
      description,
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const storedSettings = await getPageSettings(product.id);

  const settings = {
    ...defaultSettings,
    ...storedSettings,
    whyItems: storedSettings.whyItems?.length
      ? storedSettings.whyItems
      : defaultSettings.whyItems,
  };

  const productImage = product.image || "/product-2.png";

  const productDescription =
    product.description ||
    product.short_description ||
    "Premium Himalayan Pink Salt product available for private label, retail packaging, bulk supply and global export markets.";

  const gallery = [
    productImage,
    ...((product.gallery || []).filter(Boolean)),
  ].filter(
    (value, index, array) => array.indexOf(value) === index,
  );

  const rawSpecifications: Array<[string, string]> = [
    ["Origin", product.origin || "Pakistan"],
    ["Grade", product.grade || ""],
    [
      "Grain / Granulation",
      product.grain_type || product.granulation || "",
    ],
    ["Mesh Size", product.mesh_size || ""],
    ["Purity", product.purity || ""],
    ["Moisture", product.moisture || ""],
    [
      "Available Sizes",
      product.available_pack_sizes || product.sizes || "",
    ],
    [
      "Packaging",
      product.bulk_packaging ||
        product.packaging_type ||
        product.packaging ||
        "",
    ],
    ["MOQ", product.moq || ""],
    ["Lead Time", product.lead_time || ""],
    ["Production Capacity", product.production_capacity || ""],
    ["HS Code", product.hs_code || ""],
    ["Port of Loading", product.port_of_loading || ""],
    ...Object.entries(product.specifications || {}).map(
      ([label, value]): [string, string] => [
        label,
        String(value),
      ],
    ),
  ];

  const specifications = rawSpecifications.filter(
    ([, value]) => Boolean(value.trim()),
  );

  const features = (product.features || []).filter(Boolean);
  const applications = (product.applications || []).filter(Boolean);

  const whatsappNumber = String(
    settings.whatsappNumber || defaultSettings.whatsappNumber,
  ).replace(/\D/g, "");

  const whatsappText = encodeURIComponent(
    `Hello, I would like to inquire about ${product.title}.`,
  );

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: productDescription,
    image: productImage,
    brand: {
      "@type": "Brand",
      name: "The Salt Origin",
    },
    manufacturer: {
      "@type": "Organization",
      name: "Khan & Co.",
    },
    category: product.category || "Himalayan Pink Salt",
    countryOfOrigin: product.origin || "Pakistan",
    url: `https://www.thesaltorigin.com/products/${slug}`,
  };

  return (
    <>
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />

      <main className="product-detail-page">
        <div className="product-detail-shell">
          <section className="product-detail-hero">
            <div className="product-detail-media-card">
              <div className="product-detail-media">
                {productImage.startsWith("http") ? (
                  <img
                    src={productImage}
                    alt={product.title}
                  />
                ) : (
                  <Image
                    src={productImage}
                    alt={product.title}
                    width={900}
                    height={900}
                    priority
                  />
                )}
              </div>
            </div>

            <div className="product-detail-copy">
              <span className="product-detail-eyebrow">
                {settings.eyebrow}
              </span>

              <h1>{product.title}</h1>

              {product.subtitle && (
                <p className="product-detail-subtitle">
                  {product.subtitle}
                </p>
              )}

              <p className="product-detail-description">
                {productDescription}
              </p>

              <div className="product-detail-snapshot">
                <InfoCard
                  label="Origin"
                  value={product.origin || "Pakistan"}
                />

                <InfoCard
                  label="Grain Type"
                  value={
                    product.grain_type ||
                    product.granulation ||
                    product.grade ||
                    "Available on request"
                  }
                />

                <InfoCard
                  label="MOQ"
                  value={product.moq || "Available on request"}
                />

                <InfoCard
                  label="Packaging"
                  value={
                    product.packaging_type ||
                    product.packaging ||
                    "Custom / Bulk"
                  }
                />
              </div>

              <div className="product-detail-actions">
                <Link
                  href={`/contact?product=${encodeURIComponent(
                    product.title,
                  )}`}
                  className="product-primary-button"
                >
                  {settings.requestQuoteLabel}
                  <ArrowRight />
                </Link>

                <Link
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-whatsapp-button"
                >
                  <MessageCircle />
                  {settings.whatsappLabel}
                  <ArrowRight />
                </Link>
              </div>
            </div>
          </section>

          {settings.showGallery && gallery.length > 1 && (
            <section className="product-gallery-section">
              <div className="product-section-heading">
                <span>Product Media</span>
                <h2>Product Gallery</h2>
              </div>

              <div className="product-gallery-grid">
                {gallery.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="product-gallery-item"
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="product-detail-information-grid">
            <article className="product-detail-panel">
              <div className="product-section-heading">
                <span>Technical Information</span>
                <h2>{settings.specificationsTitle}</h2>
              </div>

              {specifications.length ? (
                <div className="product-spec-grid">
                  {specifications.map(([label, value]) => (
                    <SpecItem
                      key={`${label}-${value}`}
                      label={label}
                      value={value}
                    />
                  ))}
                </div>
              ) : (
                <p className="product-empty-copy">
                  Detailed specifications are available on request.
                </p>
              )}

              <div className="product-document-links">
                {product.specification_sheet_url && (
                  <Link
                    href={product.specification_sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download />
                    Specification Sheet
                  </Link>
                )}

                {product.coa_url && (
                  <Link
                    href={product.coa_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download />
                    COA
                  </Link>
                )}

                {product.msds_url && (
                  <Link
                    href={product.msds_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download />
                    MSDS
                  </Link>
                )}

                {product.brochure_url && (
                  <Link
                    href={product.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download />
                    Product Brochure
                  </Link>
                )}
              </div>
            </article>

            <article className="product-detail-panel">
              <div className="product-section-heading">
                <span>Buyer Use Cases</span>
                <h2>
                  {settings.featuresTitle} &amp;{" "}
                  {settings.applicationsTitle}
                </h2>
              </div>

              <div className="product-feature-columns">
                <div>
                  <h3>{settings.featuresTitle}</h3>

                  {features.length ? (
                    <ul>
                      {features.map((item) => (
                        <li key={item}>
                          <Check />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="product-empty-copy">
                      Features are available on request.
                    </p>
                  )}
                </div>

                <div>
                  <h3>{settings.applicationsTitle}</h3>

                  {applications.length ? (
                    <ul>
                      {applications.map((item) => (
                        <li key={item}>
                          <Check />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="product-empty-copy">
                      Applications are available on request.
                    </p>
                  )}
                </div>
              </div>

              {product.best_for && (
                <div className="product-best-for">
                  <strong>Best For</strong>
                  <span>{product.best_for}</span>
                </div>
              )}
            </article>
          </section>

          {settings.showWhySection && (
            <section className="product-why-section">
              <div className="product-section-heading">
                <span>Export Partnership</span>
                <h2>{settings.whyTitle}</h2>
              </div>

              <div className="product-why-grid">
                {settings.whyItems.map((item, index) => (
                  <FeatureBox
                    key={`${item.title}-${index}`}
                    icon={whyIcon(item.icon)}
                    title={item.title}
                    text={item.text}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="product-final-cta">
            <div>
              <span>Discuss your requirements</span>
              <h2>
                Request specifications, packaging options and a formal
                quotation.
              </h2>
            </div>

            <Link
              href={`/contact?product=${encodeURIComponent(
                product.title,
              )}`}
              className="product-primary-button"
            >
              Request Quotation
              <ArrowRight />
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}

function whyIcon(icon?: WhyItem["icon"]) {
  const className = "w-7 h-7";

  if (icon === "package") {
    return <Package className={className} />;
  }

  if (icon === "shield") {
    return <ShieldCheck className={className} />;
  }

  if (icon === "tag") {
    return <Tag className={className} />;
  }

  return <Globe2 className={className} />;
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="product-info-card">
      <p>{label}</p>
      <h3>{value}</h3>
    </div>
  );
}

function SpecItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="product-spec-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FeatureBox({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="product-why-card">
      <span>{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}