import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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

  const product =
    products[slug as keyof typeof products];

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

  const product =
    products[slug as keyof typeof products];

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24">
        <h1 className="text-5xl font-bold">
          Product Not Found
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <Image
            src={product.image}
            alt={product.title}
            width={800}
            height={800}
            className="rounded-[30px]"
          />
        </div>

        <div>
          <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
            Product Details
          </span>

          <h1 className="text-6xl font-bold mt-4">
            {product.title}
          </h1>

          <p className="text-xl text-slate-600 mt-8 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-10">
            <Link
              href="/contact"
              className="inline-block bg-[#C98A92] text-white px-8 py-4 rounded-full font-semibold"
            >
              Request Quotation
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-20 bg-white rounded-[30px] p-10 shadow-lg">
        <h2 className="text-4xl font-bold mb-8">
          Product Specifications
        </h2>

        <div className="grid md:grid-cols-2 gap-6 text-lg text-slate-600">
          <p><strong>Origin:</strong> Pakistan</p>
          <p><strong>Color:</strong> Natural Pink</p>
          <p><strong>Purity:</strong> Food Grade</p>
          <p><strong>Private Label:</strong> Available</p>
          <p><strong>Packaging:</strong> Retail & Bulk</p>
          <p><strong>Export:</strong> Worldwide</p>
        </div>
      </div>

      <div className="mt-12 bg-white rounded-[30px] p-10 shadow-lg">
        <h2 className="text-4xl font-bold mb-8">
          Available Packaging
        </h2>

        <div className="grid md:grid-cols-2 gap-6 text-lg text-slate-600">
          <div>
            ✓ 200g Retail Jar
            <br />
            ✓ 500g Retail Jar
            <br />
            ✓ Grinder Bottles
          </div>

          <div>
            ✓ Shaker Bottles
            <br />
            ✓ Stand-Up Pouches
            <br />
            ✓ 25kg Bulk Bags
          </div>
        </div>
      </div>

      {/* PRODUCT INQUIRY FORM */}
      <div className="mt-20">
        <ProductInquiryForm product={product.title} />
      </div>

      <div className="text-center mt-20">
        <h2 className="text-4xl font-bold">
          Need Bulk Pricing?
        </h2>

        <p className="text-slate-600 text-lg mt-4">
          Contact our export team for quotations and private label solutions.
        </p>

        <Link
          href="/contact"
          className="inline-block mt-8 bg-[#C98A92] text-white px-10 py-4 rounded-full font-semibold text-lg hover:opacity-90"
        >
          Get A Quote
        </Link>
      </div>
    </div>
  );
}