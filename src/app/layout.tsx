import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import { SiteThemeProvider } from "@/components/SiteThemeProvider";
import { supabase } from "@/lib/supabase";
import PwaRegister from "@/components/PwaRegister";

export async function generateMetadata(): Promise<Metadata> {
  let favicon = "/favicon.ico";
  let appIcon = "/web-app-manifest-192x192.png";
  try {
    const { data } = await supabase.from("site_settings").select("favicon_url,app_icon_url").limit(1).maybeSingle();
    favicon = data?.favicon_url || favicon;
    appIcon = data?.app_icon_url || appIcon;
  } catch {}
  return {
    metadataBase: new URL("https://www.thesaltorigin.com"),
    title: "The Salt Origin | Premium Himalayan Pink Salt Exporter",
    description: "Premium Himalayan Pink Salt exporter by Khan & Co. Supplying global markets with private label solutions.",
    icons: { icon: [{ url: favicon }], apple: [{ url: appIcon }] },
    manifest: "/site.webmanifest",
    openGraph: { title:"The Salt Origin",description:"Premium Himalayan Pink Salt exporter by Khan & Co.",url:"https://www.thesaltorigin.com",siteName:"The Salt Origin",images:[{url:"/og-image.jpg",width:1200,height:630,alt:"The Salt Origin"}],locale:"en_US",type:"website" },
    twitter: { card:"summary_large_image",title:"The Salt Origin",description:"Premium Himalayan Pink Salt exporter by Khan & Co.",images:["/og-image.jpg"] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><Script src="https://www.googletagmanager.com/gtag/js?id=G-D9ZSFZBT1E" strategy="afterInteractive"/><Script id="google-analytics" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-D9ZSFZBT1E');`}</Script></head><body className="bg-[#F8F8F8] text-slate-900"><SiteThemeProvider><PwaRegister/><Script id="schema-org" type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"Organization",name:"The Salt Origin",alternateName:"Khan & Co.",url:"https://www.thesaltorigin.com",logo:"https://www.thesaltorigin.com/logo.png",email:"thekhanandco@gmail.com",sameAs:[]})}}/><SiteChrome>{children}</SiteChrome></SiteThemeProvider></body></html>;
}
