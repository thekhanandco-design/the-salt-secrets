import type { Metadata } from "next";
import HomepageClone from "@/components/HomepageClone";

export const metadata: Metadata = {
  title:
    "Himalayan Pink Salt Exporter & Private Label Supplier | The Salt Origin",
  description:
    "Source export-ready Himalayan Pink Salt from Pakistan in retail packs, grinders, pouches and bulk formats, with private-label packaging and B2B support.",
  keywords: [
    "Himalayan Pink Salt exporter",
    "Himalayan Pink Salt supplier Pakistan",
    "bulk pink salt wholesale",
    "private label Himalayan salt",
    "pink salt packaging supplier",
    "food grade Himalayan Pink Salt",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title:
      "Himalayan Pink Salt Exporter & Private Label Supplier | The Salt Origin",
    description:
      "Export-ready Himalayan Pink Salt for distributors, wholesalers and private-label brands, available in retail, grinder, pouch and bulk formats.",
    url: "/",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Salt Origin Himalayan Pink Salt export products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Himalayan Pink Salt Exporter & Private Label Supplier | The Salt Origin",
    description:
      "Export-ready Himalayan Pink Salt for distributors, wholesalers and private-label brands.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return <HomepageClone />;
}
