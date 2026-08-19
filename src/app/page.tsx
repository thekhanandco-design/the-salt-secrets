import type { Metadata } from "next";
import HomepageClone from "@/components/HomepageClone";
import { APPROVED_PRODUCT_CATEGORIES } from "@/lib/product-catalog";

export const metadata: Metadata = {
  title: "Himalayan Pink Salt Exporter & Private Label Supplier | The Salt Origin",
  description: "Source export-ready Himalayan Pink Salt from Pakistan in retail packs, grinders, pouches and bulk formats, with private-label packaging and B2B support.",
  keywords: [
    "Himalayan Pink Salt exporter",
    "Himalayan Pink Salt supplier Pakistan",
    "bulk pink salt wholesale",
    "private label Himalayan salt",
    "pink salt packaging supplier",
    "food grade Himalayan Pink Salt",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Himalayan Pink Salt Exporter & Private Label Supplier | The Salt Origin",
    description: "Export-ready Himalayan Pink Salt for distributors, wholesalers and private-label brands, available in retail, grinder, pouch and bulk formats.",
    url: "/",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "The Salt Origin Himalayan Pink Salt export products" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Himalayan Pink Salt Exporter & Private Label Supplier | The Salt Origin",
    description: "Export-ready Himalayan Pink Salt for distributors, wholesalers and private-label brands.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true },
};

const homepageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://www.thesaltorigin.com/#homepage",
  url: "https://www.thesaltorigin.com/",
  name: "Himalayan Pink Salt Exporter & Private Label Supplier | The Salt Origin",
  description: "Export-ready Himalayan pink salt from Pakistan for importers, distributors, wholesalers, foodservice buyers and private-label brands.",
  mainEntity: {
    "@type": "ItemList",
    name: "Himalayan Pink Salt Product Families",
    numberOfItems: APPROVED_PRODUCT_CATEGORIES.length,
    itemListElement: APPROVED_PRODUCT_CATEGORIES.map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: category.name,
      url: `https://www.thesaltorigin.com/products/categories/${category.slug}`,
    })),
  },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }} />
      <HomepageClone />
    </>
  );
}
