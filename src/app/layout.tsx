import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "The Salt Secrets | Premium Himalayan Pink Salt Exporter",
  description:
    "Premium Himalayan Pink Salt exporter by Khan & Co. Supplying global markets with private label solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
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
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}