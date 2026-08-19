import type { MetadataRoute } from "next";

function isIndexableProduction() {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.NODE_ENV === "production" && process.env.APP_ENV !== "staging" && process.env.APP_ENV !== "preview";
}

export default function robots(): MetadataRoute.Robots {
  if (!isIndexableProduction()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://www.thesaltorigin.com/sitemap.xml",
  };
}
