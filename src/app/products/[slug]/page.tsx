import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import React from "react";
import { ArrowRight, CheckCircle2, Globe2, Package, ShieldCheck, Tag } from "lucide-react";

import ProductInquiryForm from "@/components/ProductInquiryForm";
import { supabase } from "@/lib/supabase";

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

  return {
    title: `${product.title} | The Salt Origin`,
    description:
      product.description ||
      "Premium Himalayan Pink Salt products for private label, retail packaging, bulk supply and global export markets.",
    openGraph: {
      title: `${product.title} | The Salt Origin`,
      description:
        product.description ||
        "Premium Himalayan Pink Salt products for global buyers.",
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

  const productImage = product.image || "/product-2.png";
  const productDescription =
    product.description ||
    "Premium Himalayan Pink Salt product available for private label, retail packaging, bulk supply and global export markets.";

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
    countryOfOrigin: "Pakistan",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "USD",
      url: `https://thesaltsecrets.com/products/${slug}`,
    },
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

      <main className="bg-[#FFF8F5]">
        <div className="max-w-[1500px] mx-auto px-5 lg:px-12 py-14 lg:py-20">
          {/* HERO */}
          <section className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="bg-white border border-[#EFE3E5] rounded-[30px] p-6 lg:p-8 shadow-[0_18px_45px_rgba(194,59,74,0.06)]">
              <div className="h-[360px] lg:h-[520px] flex items-center justify-center bg-[#FFF8F5] rounded-[24px] overflow-hidden">
                {productImage.startsWith("http") ? (
                  <img
                    src={productImage}
                    alt={product.title}
                    className="max-h-full w-auto object-contain"
                  />
                ) : (
                  <Image
                    src={productImage}
                    alt={product.title}
                    width={900}
                    height={900}
                    priority
                    className="max-h-full w-auto object-contain"
                  />
                )}
              </div>
            </div>

            <div>
              <span className="uppercase tracking-[6px] text-[#C23B4A] font-black text-xs">
                Product Details
              </span>

              <h1
                className="mt-4 text-[#07142B] font-black leading-tight"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(2.5rem,4.5vw,5.4rem)",
                }}
              >
                {product.title}
              </h1>

              <p className="text-lg text-slate-600 mt-6 leading-relaxed">
                {productDescription}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <InfoCard label="Origin" value="Pakistan" />
                <InfoCard label="Quality" value="Food Grade" />
                <InfoCard label="MOQ" value={product.moq || "Available"} />
                <InfoCard
                  label="Packaging"
                  value={product.packaging || "Custom / Retail"}
                />
              </div>

              <div className="flex flex-wrap gap-4 mt-9">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-black hover:opacity-90 transition"
                >
                  Request Quotation
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="https://wa.me/923462771693"
                  target="_blank"
                  className="inline-flex items-center gap-3 bg-white border border-[#EFE3E5] text-[#07142B] px-8 py-4 rounded-xl font-black hover:bg-[#FFF4F5] transition"
                >
                  WhatsApp Inquiry
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
         </section>

{/* TRUST */}
<section className="grid md:grid-cols-3 gap-6 mt-12">

  <TrustCard
    icon={<CheckCircle2 className="w-10 h-10 text-[#C23B4A]" />}
    title="OEM"
    subtitle="Private Label Support"
  />

  <TrustCard
    icon={<Package className="w-10 h-10 text-[#C23B4A]" />}
    title="Bulk"
    subtitle="Export Supply"
  />

  <TrustCard
    icon={<ShieldCheck className="w-10 h-10 text-[#C23B4A]" />}
    title="100%"
    subtitle="Natural Salt"
  />

</section>

          {/* WHY BUY FROM US */}
          <section className="mt-14 bg-white border border-[#EFE3E5] rounded-[30px] p-8 lg:p-10">
            <h2 className="text-3xl font-black text-[#07142B] mb-8">
              Why Buy From The Salt Origin?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

              <FeatureBox
                icon={<Globe2 className="w-8 h-8 text-[#C23B4A]" />}
                title="Global Export"
                text="Serving importers, wholesalers and distributors worldwide."
              />

              <FeatureBox
                icon={<Package className="w-8 h-8 text-[#C23B4A]" />}
                title="Flexible Packaging"
                text="Retail, bulk and custom packaging options available."
              />

              <FeatureBox
                icon={<ShieldCheck className="w-8 h-8 text-[#C23B4A]" />}
                title="Food Grade Quality"
                text="Strict quality control and export standards."
              />

              <FeatureBox
                icon={<Tag className="w-8 h-8 text-[#C23B4A]" />}
                title="Private Label"
                text="OEM and custom branding support available."
              />

            </div>
          </section>

          {/* PRODUCT INQUIRY */}
          <section className="mt-16">
            <div className="bg-white border border-[#EFE3E5] rounded-[30px] p-8">
              <ProductInquiryForm product={product.title} />
            </div>
          </section>

        </div>
      </main>
    </>
  );
}

/* ---------------- HELPERS ---------------- */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-[#EFE3E5] rounded-2xl p-5">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <h3 className="font-bold text-[#07142B] mt-1">
        {value}
      </h3>
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
    <p>
      <strong>{label}:</strong> {value}
    </p>
  );
}

function TrustCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8 text-center">
      <div className="flex justify-center mb-4">
        {icon}
      </div>

      <h3 className="text-4xl font-black text-[#07142B]">
        {title}
      </h3>

      <p className="text-slate-500 mt-2">
        {subtitle}
      </p>
    </div>
  );
}

function FeatureBox({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-[#EFE3E5] rounded-2xl p-6">
      <div className="mb-4">
        {icon}
      </div>

      <h3 className="font-black text-lg text-[#07142B]">
        {title}
      </h3>

      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
        {text}
      </p>
    </div>
  );
}