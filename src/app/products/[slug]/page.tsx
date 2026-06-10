import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

import ProductInquiryForm from "@/components/ProductInquiryForm";

const products = {
  "coarse-grain-salt": {
    title: "Coarse Grain Salt",
    image: "/product-1.jpg",
    description:
      "Premium food-grade coarse Himalayan Pink Salt suitable for retail, food service and wholesale distribution.",
  },
  "fine-salt": {
    title: "Fine Salt",
    image: "/product-2.png",
    description:
      "Finely ground Himalayan Pink Salt ideal for cooking, seasoning and retail packaging.",
  },
  "salt-grinder": {
    title: "Salt Grinder",
    image: "/product-3.png",
    description:
      "Premium grinder packaging designed for supermarkets, retailers and private label brands.",
  },
  "salt-shaker": {
    title: "Salt Shaker",
    image: "/product-4.png",
    description:
      "Convenient shaker packaging for household and retail markets.",
  },
  "bulk-salt": {
    title: "Bulk Salt",
    image: "/product-1.jpg",
    description:
      "Bulk Himalayan Pink Salt for food processing, wholesale distribution and industrial buyers.",
  },
  "private-label": {
    title: "Private Label Solutions",
    image: "/product-5.png",
    description:
      "Custom branding, packaging and export-ready private label salt solutions.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = products[slug as keyof typeof products];

  return {
    title: product
      ? `${product.title} | The Salt Secrets`
      : "Product | The Salt Secrets",
    description:
      product?.description ||
      "Premium Himalayan Pink Salt exporter supplying global markets.",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products[slug as keyof typeof products];

  if (!product) {
    return (
      <div className="bg-[#FFF8F5]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h1 className="text-5xl font-black text-[#07142B]">
            Product Not Found
          </h1>
        </div>
      </div>
    );
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: `https://thesaltsecrets.com${product.image}`,
    brand: {
      "@type": "Brand",
      name: "The Salt Secrets",
    },
    manufacturer: {
      "@type": "Organization",
      name: "Khan & Co.",
    },
    category: "Himalayan Pink Salt",
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

      <div className="bg-[#FFF8F5]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          {/* HERO */}
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="bg-white border border-[#EFE3E5] rounded-[36px] p-8">
              <Image
                src={product.image}
                alt={product.title}
                width={900}
                height={900}
                priority
                className="w-full h-[520px] object-contain"
              />
            </div>

            <div>
              <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
                Product Details
              </span>

              <h1 className="text-5xl lg:text-7xl font-black mt-4 text-[#07142B] leading-tight">
                {product.title}
              </h1>

              <p className="text-lg text-slate-600 mt-6 leading-relaxed">
                {product.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white border border-[#EFE3E5] rounded-2xl p-5">
                  <p className="text-sm text-slate-500">
                    Origin
                  </p>
                  <h3 className="font-bold text-[#07142B] mt-1">
                    Pakistan
                  </h3>
                </div>

                <div className="bg-white border border-[#EFE3E5] rounded-2xl p-5">
                  <p className="text-sm text-slate-500">
                    Quality
                  </p>
                  <h3 className="font-bold text-[#07142B] mt-1">
                    Food Grade
                  </h3>
                </div>

                <div className="bg-white border border-[#EFE3E5] rounded-2xl p-5">
                  <p className="text-sm text-slate-500">
                    Packaging
                  </p>
                  <h3 className="font-bold text-[#07142B] mt-1">
                    Retail & Bulk
                  </h3>
                </div>

                <div className="bg-white border border-[#EFE3E5] rounded-2xl p-5">
                  <p className="text-sm text-slate-500">
                    Private Label
                  </p>
                  <h3 className="font-bold text-[#07142B] mt-1">
                    Available
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-10">
                <Link
                  href="/contact"
                  className="bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Request Quotation
                </Link>

                <Link
                  href="https://wa.me/923462771693"
                  target="_blank"
                  className="bg-white border border-[#EFE3E5] text-[#07142B] px-8 py-4 rounded-xl font-semibold hover:bg-[#FFF4F5] transition"
                >
                  WhatsApp Inquiry
                </Link>
              </div>
            </div>
          </div>

          {/* SPECIFICATIONS */}
          <div className="grid lg:grid-cols-2 gap-8 mt-20">
            <div className="bg-white border border-[#EFE3E5] rounded-[32px] p-10">
              <h2 className="text-3xl font-black text-[#07142B] mb-8">
                Product Specifications
              </h2>

              <div className="grid sm:grid-cols-2 gap-5 text-slate-600">
                <p><strong>Origin:</strong> Pakistan</p>
                <p><strong>Color:</strong> Natural Pink</p>
                <p><strong>Purity:</strong> Food Grade</p>
                <p><strong>MOQ:</strong> Available</p>
                <p><strong>Private Label:</strong> Available</p>
                <p><strong>Export:</strong> Worldwide</p>
              </div>
            </div>

            <div className="bg-white border border-[#EFE3E5] rounded-[32px] p-10">
              <h2 className="text-3xl font-black text-[#07142B] mb-8">
                Packaging Options
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 text-slate-600">
                <p>✓ 200g Retail Jar</p>
                <p>✓ 500g Retail Jar</p>
                <p>✓ Grinder Bottles</p>
                <p>✓ Shaker Bottles</p>
                <p>✓ Stand-Up Pouches</p>
                <p>✓ 25kg Bulk Bags</p>
              </div>
            </div>
          </div>

          {/* TRUST */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8 text-center">
              <h3 className="text-4xl font-black text-[#07142B]">
                OEM
              </h3>
              <p className="text-slate-500 mt-2">
                Private Label Support
              </p>
            </div>

            <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8 text-center">
              <h3 className="text-4xl font-black text-[#07142B]">
                Bulk
              </h3>
              <p className="text-slate-500 mt-2">
                Export Supply
              </p>
            </div>

            <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8 text-center">
              <h3 className="text-4xl font-black text-[#07142B]">
                100%
              </h3>
              <p className="text-slate-500 mt-2">
                Natural Salt
              </p>
            </div>
          </div>

          {/* INQUIRY FORM */}
          <div className="mt-20 bg-white border border-[#EFE3E5] rounded-[36px] p-8">
            <ProductInquiryForm product={product.title} />
          </div>
        </div>
      </div>
    </>
  );
}