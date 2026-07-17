import type { Metadata } from "next";
import Script from "next/script";

import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { SiteThemeProvider } from "@/components/SiteThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.thesaltorigin.com"),

  title: "The Salt Origin | Premium Himalayan Pink Salt Exporter",

  description:
    "Premium Himalayan Pink Salt exporter by Khan & Co. Supplying global markets with private label solutions.",

  openGraph: {
    title: "The Salt Origin",
    description:
      "Premium Himalayan Pink Salt exporter by Khan & Co.",
    url: "https://www.thesaltorigin.com",
    siteName: "The Salt Origin",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Salt Origin",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "The Salt Origin",
    description:
      "Premium Himalayan Pink Salt exporter by Khan & Co.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-D9ZSFZBT1E"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-D9ZSFZBT1E');
          `}
        </Script>
      </head>

      <body className="bg-[#F8F8F8] text-slate-900">
        <SiteThemeProvider>
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "The Salt Origin",
              alternateName: "Khan & Co.",
              url: "https://www.thesaltorigin.com",
              logo: "https://www.thesaltorigin.com/logo.png",
              email: "thekhanandco@gmail.com",
              sameAs: [],
            }),
          }}
        />

        <Navbar />
        {children}
        <Footer />
        <WhatsAppButton />
        </SiteThemeProvider>
      </body>
    </html>
  );
}