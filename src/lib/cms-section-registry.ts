export type CmsSectionLayout = {
  slug: string;
  label: string;
  visible: boolean;
  minHeight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  custom?: boolean;
  template?: CmsSectionTemplateKey;
};

export type CmsSectionTemplateKey = "editorial" | "image_text" | "cta";

export type CmsSectionTemplate = {
  key: CmsSectionTemplateKey;
  label: string;
  description: string;
};

export const cmsSectionTemplates: CmsSectionTemplate[] = [
  {
    key: "editorial",
    label: "Editorial Content",
    description: "Eyebrow, premium heading, paragraph and optional button.",
  },
  {
    key: "image_text",
    label: "Image + Text",
    description: "Premium image beside eyebrow, heading, paragraph and CTA.",
  },
  {
    key: "cta",
    label: "CTA Banner",
    description: "Wide conversion banner with heading, text and primary action.",
  },
];

export const cmsPageSectionRegistry: Record<string, CmsSectionLayout[]> = {
  home: [
    { slug: "hero", label: "Hero", visible: true },
    { slug: "private_label", label: "Private Label", visible: true },
    { slug: "collections", label: "Signature Collections", visible: true },
    { slug: "process", label: "Source to Shelf", visible: true },
    { slug: "quality", label: "Quality & Compliance", visible: true },
    { slug: "export", label: "Export Program", visible: true },
    { slug: "story", label: "Brand Story", visible: true },
    { slug: "journal", label: "Salt Journal", visible: true },
    { slug: "faq", label: "FAQ", visible: true },
    { slug: "cta", label: "Final CTA", visible: true },
  ],
  products: [
    { slug: "hero", label: "Products Hero", visible: true },
    { slug: "categories", label: "Product Families", visible: true },
    { slug: "product_family", label: "Product Catalog", visible: true },
  ],
  "private-label": [
    { slug: "hero", label: "Private Label Hero", visible: true },
    { slug: "studio", label: "Packaging Studio", visible: true },
    { slug: "range", label: "Private Label Range", visible: true },
    { slug: "workflow", label: "Private Label Workflow", visible: true },
    { slug: "workspace", label: "Buyer Workspace", visible: true },
    { slug: "cta", label: "Private Label CTA", visible: true },
  ],
  certifications: [
    { slug: "hero", label: "Certifications Hero", visible: true },
    { slug: "documents", label: "Certification Documents", visible: true },
    { slug: "cta", label: "Certifications CTA", visible: true },
  ],
  about: [
    { slug: "hero", label: "About Hero", visible: true },
    { slug: "story", label: "Brand Story", visible: true },
    { slug: "founder", label: "Founder Message", visible: true },
    { slug: "quality", label: "Quality Commitment", visible: true },
  ],
  faqs: [
    { slug: "hero", label: "FAQ Hero", visible: true },
    { slug: "faq", label: "Questions & Answers", visible: true },
    { slug: "cta", label: "FAQ CTA", visible: true },
  ],
  contact: [
    { slug: "hero", label: "Contact Hero", visible: true },
    { slug: "form", label: "Inquiry Form", visible: true },
    { slug: "cta", label: "Contact CTA", visible: true },
  ],
  blog: [
    { slug: "hero", label: "Blog Hero", visible: true },
    { slug: "listing", label: "Blog Listing & Newsletter", visible: true },
    { slug: "cta", label: "Blog CTA", visible: true },
  ],
};

export function defaultSectionsForPage(pageSlug: string) {
  return (cmsPageSectionRegistry[pageSlug] || []).map((item) => ({ ...item }));
}

export function isCanonicalCmsSection(pageSlug: string, sectionSlug: string) {
  if (pageSlug === "global" || sectionSlug.startsWith("custom-")) return true;
  const sections = cmsPageSectionRegistry[pageSlug];
  if (!sections?.length) return true;
  return sections.some((item) => item.slug === sectionSlug);
}

export function slugifySectionLabel(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}
