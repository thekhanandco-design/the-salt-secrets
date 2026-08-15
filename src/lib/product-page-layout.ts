export type ProductPageSectionKey =
  | "hero"
  | "benefits"
  | "marketplaces"
  | "process"
  | "specifications"
  | "features"
  | "documents"
  | "gallery"
  | "why"
  | "cta";

export type ProductPageBenefit = {
  title: string;
  text: string;
  icon?: "package" | "box" | "cart" | "chart" | "globe" | "shield" | "tag";
};

export type ProductPageProcessItem = {
  number: string;
  title: string;
  text: string;
};

export type ProductPageWhyItem = {
  title: string;
  text: string;
  icon?: "globe" | "package" | "shield" | "tag";
};

export type ProductPageSettings = {
  eyebrow: string;
  specificationsTitle: string;
  featuresTitle: string;
  applicationsTitle: string;
  whyTitle: string;
  requestQuoteLabel: string;
  whatsappLabel: string;
  whatsappNumber: string;
  sectionOrder: ProductPageSectionKey[];
  sectionVisibility: Record<ProductPageSectionKey, boolean>;
  benefitItems: ProductPageBenefit[];
  marketplacesTitle: string;
  marketplacesSubtitle: string;
  marketplaces: string[];
  processTitle: string;
  processSubtitle: string;
  processItems: ProductPageProcessItem[];
  whyItems: ProductPageWhyItem[];
};

export const PRODUCT_PAGE_SECTION_LABELS: Record<ProductPageSectionKey, string> = {
  hero: "Product Hero",
  benefits: "Buyer Benefits",
  marketplaces: "Marketplaces",
  process: "How It Works",
  specifications: "Technical Specifications",
  features: "Features & Applications",
  documents: "Documents",
  gallery: "Product Gallery",
  why: "Why Buy From Us",
  cta: "Bottom CTA",
};

export const PRODUCT_PAGE_DEFAULT_ORDER: ProductPageSectionKey[] = [
  "hero",
  "benefits",
  "marketplaces",
  "process",
  "specifications",
  "documents",
  "gallery",
  "why",
  "cta",
];

export const DEFAULT_PRODUCT_PAGE_SETTINGS: ProductPageSettings = {
  eyebrow: "Product Details",
  specificationsTitle: "Product Specifications",
  featuresTitle: "Key Features",
  applicationsTitle: "Applications",
  whyTitle: "Why Buy From The Salt Origin?",
  requestQuoteLabel: "Request Quotation",
  whatsappLabel: "WhatsApp Inquiry",
  whatsappNumber: "923462771693",
  sectionOrder: [...PRODUCT_PAGE_DEFAULT_ORDER],
  sectionVisibility: {
    hero: true,
    benefits: true,
    marketplaces: true,
    process: true,
    specifications: true,
    features: true,
    documents: false,
    gallery: false,
    why: false,
    cta: false,
  },
  benefitItems: [
    { icon: "package", title: "Private Label Made Easy", text: "Production and packaging support built around your brand." },
    { icon: "box", title: "Retail Ready Packaging", text: "Shelf-ready formats available in multiple pack sizes." },
    { icon: "cart", title: "Marketplace Ready", text: "Formats suitable for retail and online marketplace programs." },
    { icon: "chart", title: "High Demand Product", text: "Pink salt formats designed for broad consumer demand." },
    { icon: "globe", title: "Global Supply Support", text: "Reliable B2B supply planning for international markets." },
  ],
  marketplacesTitle: "Launch Your Brand on Global Marketplaces",
  marketplacesSubtitle: "Private-label salt products can be prepared for online and offline retail programs.",
  marketplaces: ["Amazon", "Walmart", "eBay", "Etsy", "Shopify", "Flipkart", "& More"],
  processTitle: "How It Works",
  processSubtitle: "From your idea to a market-ready private-label product.",
  processItems: [
    { number: "01", title: "Share Your Idea", text: "Tell us your branding, packaging and product requirements." },
    { number: "02", title: "We Handle Production", text: "We manufacture with quality and packaging controls." },
    { number: "03", title: "We Deliver to You", text: "We prepare the order for agreed dispatch and delivery." },
    { number: "04", title: "You Launch & Sell", text: "List on marketplaces, retail stores or your own channels." },
  ],
  whyItems: [
    { icon: "globe", title: "Global Export Support", text: "Documentation and supply support for international B2B buyers." },
    { icon: "package", title: "Flexible Packaging", text: "Retail, bulk and private-label packaging options for different markets." },
    { icon: "shield", title: "Quality-Focused Supply", text: "Product specifications, quality documents and traceability support where available." },
    { icon: "tag", title: "Private Label Ready", text: "Custom branding and packaging support for qualified projects." },
  ],
};

const validSectionKeys = new Set<ProductPageSectionKey>(PRODUCT_PAGE_DEFAULT_ORDER);

export function normalizeProductPageSettings(value: unknown): ProductPageSettings {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<ProductPageSettings> & { showWhySection?: boolean; showGallery?: boolean })
    : {};

  const hasStoredOrder = Array.isArray(raw.sectionOrder) && raw.sectionOrder.length > 0;
  const storedOrder = hasStoredOrder
    ? raw.sectionOrder!.filter((item): item is ProductPageSectionKey => validSectionKeys.has(item as ProductPageSectionKey) && item !== "features")
    : [...PRODUCT_PAGE_DEFAULT_ORDER];

  const visibility: Record<ProductPageSectionKey, boolean> = {
    ...DEFAULT_PRODUCT_PAGE_SETTINGS.sectionVisibility,
    ...(raw.sectionVisibility || {}),
  };

  if (typeof raw.showWhySection === "boolean" && !raw.sectionVisibility) visibility.why = raw.showWhySection;
  if (typeof raw.showGallery === "boolean" && !raw.sectionVisibility) visibility.gallery = raw.showGallery;
  visibility.features = false;

  return {
    ...DEFAULT_PRODUCT_PAGE_SETTINGS,
    ...raw,
    sectionOrder: storedOrder,
    sectionVisibility: visibility,
    benefitItems: Array.isArray(raw.benefitItems) && raw.benefitItems.length ? raw.benefitItems : DEFAULT_PRODUCT_PAGE_SETTINGS.benefitItems,
    marketplaces: Array.isArray(raw.marketplaces) && raw.marketplaces.length ? raw.marketplaces : DEFAULT_PRODUCT_PAGE_SETTINGS.marketplaces,
    processItems: Array.isArray(raw.processItems) && raw.processItems.length ? raw.processItems : DEFAULT_PRODUCT_PAGE_SETTINGS.processItems,
    whyItems: Array.isArray(raw.whyItems) && raw.whyItems.length ? raw.whyItems : DEFAULT_PRODUCT_PAGE_SETTINGS.whyItems,
  };
}
