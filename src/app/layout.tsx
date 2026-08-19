import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import SiteChrome from "@/components/SiteChrome";
import { SiteThemeProvider } from "@/components/SiteThemeProvider";
import { supabase } from "@/lib/supabase";
import PwaRegister from "@/components/PwaRegister";

const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ||
  process.env.GA4_MEASUREMENT_ID?.trim() ||
  "G-D9ZSFZBT1E";

export async function generateMetadata(): Promise<Metadata> {
  let favicon = "/favicon.ico";
  let appIcon = "/web-app-manifest-192x192.png";

  try {
    const { data } = await supabase
      .from("public_site_settings")
      .select("favicon_url, app_icon_url")
      .limit(1)
      .maybeSingle();

    favicon = data?.favicon_url || favicon;
    appIcon = data?.app_icon_url || appIcon;
  } catch {
    // Default icons will be used if Supabase is unavailable.
  }

  return {
    metadataBase: new URL("https://www.thesaltorigin.com"),

    title: "The Salt Origin | Premium Himalayan Pink Salt Exporter",

    description:
      "Premium Himalayan Pink Salt exporter by Khan & Co. Supplying global markets with private label solutions.",

    verification: {
      other: {
        "msvalidate.01": "77F96F664290A7D3C87725A820346A1B",
      },
    },

    icons: {
      icon: [
        {
          url: favicon,
        },
      ],
      apple: [
        {
          url: appIcon,
        },
      ],
    },

    manifest: "/site.webmanifest",

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const clarityProjectId =
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Salt Origin",
    alternateName: "Khan & Co.",
    url: "https://www.thesaltorigin.com",
    logo: "https://www.thesaltorigin.com/logo.png",
    email: "thekhanandco@gmail.com",
    sameAs: [],
  };

  return (
    <html lang="en">
      <head>
        {gtmId ? (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){
                w[l]=w[l]||[];
                w[l].push({
                  "gtm.start": new Date().getTime(),
                  event: "gtm.js"
                });

                var f=d.getElementsByTagName(s)[0];
                var j=d.createElement(s);
                var dl=l!="dataLayer" ? "&l="+l : "";

                j.async=true;
                j.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;
                f.parentNode.insertBefore(j,f);
              })(window,document,"script","dataLayer","${gtmId}");
            `}
          </Script>
        ) : (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />

            <Script
              id="google-analytics"
              strategy="afterInteractive"
            >
              {`
                window.dataLayer = window.dataLayer || [];

                function gtag() {
                  window.dataLayer.push(arguments);
                }

                gtag("js", new Date());
                gtag("config", "${GA4_MEASUREMENT_ID}");
              `}
            </Script>
          </>
        )}

        {clarityProjectId && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
          >
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){
                  (c[a].q=c[a].q||[]).push(arguments);
                };

                t=l.createElement(r);
                t.async=1;
                t.src="https://www.clarity.ms/tag/"+i;

                y=l.getElementsByTagName(r)[0];
                y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityProjectId}");
            `}
          </Script>
        )}
      </head>

      <body className="bg-[#F8F8F8] text-slate-900">
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{
                display: "none",
                visibility: "hidden",
              }}
              title="Google Tag Manager"
            />
          </noscript>
        )}

        <SiteThemeProvider>
          <PwaRegister />

          <Script
            id="schema-org"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationSchema),
            }}
          />

          <SiteChrome>{children}</SiteChrome>
        </SiteThemeProvider>
      </body>
    </html>
  );
}