import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.thesaltorigin.com";
  const now = new Date();
  return [
    ["", "weekly", 1],
    ["/about", "monthly", 0.8],
    ["/products", "weekly", 0.9],
    ["/private-label", "monthly", 0.8],
    ["/certifications", "monthly", 0.8],
    ["/blog", "weekly", 0.8],
    ["/faqs", "weekly", 0.75],
    ["/contact", "monthly", 0.7],
    ["/privacy-policy", "yearly", 0.3],
    ["/terms-and-conditions", "yearly", 0.3],
  ].map(([path, changeFrequency, priority]) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: Number(priority),
  }));
}
