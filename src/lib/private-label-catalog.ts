export type PrivateLabelProductSeed = {
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  description: string;
  short_description: string;
  image: string;
  moq: string;
  packaging: string;
  status: "active";
  grain_type: "Extra Fine Powder" | "Coarse (2–5mm)";
  sizes: string;
  packaging_type: string;
  best_for: string;
  features: string[];
  applications: string[];
  specifications: Record<string, string>;
  featured: boolean;
  display_order: number;
  seo_title: string;
  seo_description: string;
};

const category = "private-label-packaging";

function seed(
  title: string,
  slug: string,
  grain: "Extra Fine Powder" | "Coarse (2–5mm)",
  packaging: string,
  sizes: string,
  image: string,
  displayOrder: number,
): PrivateLabelProductSeed {
  return {
    title,
    slug,
    subtitle: packaging,
    category,
    description: `${grain} Himalayan pink salt prepared for private-label ${packaging.toLowerCase()} programs.`,
    short_description: `${grain} · ${packaging} · ${sizes}`,
    image,
    moq: "On request",
    packaging,
    status: "active",
    grain_type: grain,
    sizes,
    packaging_type: packaging,
    best_for: "Private label, retail, distribution and export programs",
    features: [grain, packaging, "Private-label ready"],
    applications: ["Private Label", "Retail", "Export"],
    specifications: {
      "Form / Grain": grain,
      Packaging: packaging,
      "Pack Sizes": sizes,
    },
    featured: false,
    display_order: displayOrder,
    seo_title: `${title} Private Label Himalayan Pink Salt`,
    seo_description: `${title} private-label Himalayan pink salt packaging in ${sizes}.`,
  };
}

export const PRIVATE_LABEL_CATEGORY = {
  name: "Private Label Packaging",
  slug: category,
  subtitle: "Packaging Studio",
  description: "Private-label pouch, jar, shaker and grinder formats.",
  image: "/custom-packaging.png",
  display_order: 90,
  status: "active",
};

export const PRIVATE_LABEL_PRODUCTS: PrivateLabelProductSeed[] = [
  seed("Stand-Up Pouch", "pl-fine-stand-up-pouch", "Extra Fine Powder", "Stand-Up Pouch", "500 g · 800 g · 1000 g", "/standup-pouch.png", 1),
  seed("Gusseted Pouch", "pl-fine-gusseted-pouch", "Extra Fine Powder", "Gusseted Pouch", "500 g · 800 g · 1000 g", "/pouches.png", 2),
  seed("Round Jar with Spoon", "pl-fine-round-jar-spoon", "Extra Fine Powder", "Round Jar with Spoon", "500 g · 750 g · 1000 g", "/pet-jars.png", 3),
  seed("Square Jar with Spoon", "pl-fine-square-jar-spoon", "Extra Fine Powder", "Square Jar with Spoon", "500 g · 750 g · 1000 g", "/product-5.png", 4),
  seed("Cone Shaker", "pl-fine-cone-shaker", "Extra Fine Powder", "Cone Shaker", "750 g", "/shaker-bottles.png", 5),
  seed("PET Shaker", "pl-fine-pet-shaker", "Extra Fine Powder", "PET Shaker", "250 g · 300 g · 500 g", "/pet-bottles.png", 6),
  seed("Box Shaker", "pl-fine-box-shaker", "Extra Fine Powder", "Box Shaker", "250 g · 500 g · 1000 g", "/product-2.png", 7),
  seed("Ice Blue Pouch", "pl-fine-ice-blue-pouch", "Extra Fine Powder", "Stand-Up Pouch", "250 g · 500 g · 1000 g", "/white-sack.png", 8),
  seed("Stand-Up Pouch", "pl-coarse-stand-up-pouch", "Coarse (2–5mm)", "Stand-Up Pouch", "500 g · 800 g · 1000 g", "/standup-pouch.png", 9),
  seed("Gusseted Pouch", "pl-coarse-gusseted-pouch", "Coarse (2–5mm)", "Gusseted Pouch", "500 g · 800 g · 1000 g", "/pouches.png", 10),
  seed("Plastic Grinder", "pl-coarse-plastic-grinder", "Coarse (2–5mm)", "Plastic Grinder", "100 g · 200 g · 300 g · 500 g", "/grinder-bottles1.png", 11),
  seed("Ceramic Grinder", "pl-coarse-ceramic-grinder", "Coarse (2–5mm)", "Ceramic Grinder", "100 g · 200 g · 300 g · 500 g", "/ceramic-grinders.png", 12),
  seed("Glass Grinder", "pl-coarse-glass-grinder", "Coarse (2–5mm)", "Glass Grinder", "100 g · 200 g · 300 g · 500 g", "/grinder-bottles.png", 13),
];
