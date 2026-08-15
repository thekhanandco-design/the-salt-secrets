export type ApprovedProductCategory = {
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  image: string;
  display_order: number;
};

export type ApprovedProductSeed = {
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
  grain_type: string;
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

export const APPROVED_PRODUCT_CATEGORIES: ApprovedProductCategory[] = [
  {
    name: "Edible Salt",
    slug: "edible-salt",
    subtitle: "For Food & Beverages",
    description: "Extra fine powder and coarse Himalayan pink salt in retail-ready packaging formats.",
    image: "/hero-banner.png",
    display_order: 1,
  },
  {
    name: "Salt Lamps",
    slug: "salt-lamps",
    subtitle: "For Decor & Wellness",
    description: "Natural Himalayan salt lamps in multiple shapes for retail, decor and wellness programs.",
    image: "/product-5.png",
    display_order: 2,
  },
  {
    name: "Salt Tiles / Bricks",
    slug: "salt-tiles-bricks",
    subtitle: "For Walls & Decor",
    description: "Himalayan salt tiles and bricks in multiple sizes for decorative and architectural applications.",
    image: "/product-2.png",
    display_order: 3,
  },
  {
    name: "Cooking Plates / Slabs",
    slug: "cooking-plates-slabs",
    subtitle: "For Culinary & Serving",
    description: "Himalayan salt cooking plates and serving slabs in multiple sizes.",
    image: "/product-1.jpg",
    display_order: 4,
  },
  {
    name: "Animal Lick Salt",
    slug: "animal-lick-salt",
    subtitle: "For Livestock",
    description: "Natural and compressed Himalayan salt lick blocks prepared for livestock programs.",
    image: "/product-4.png",
    display_order: 5,
  },
  {
    name: "Bulk & Raw Salt",
    slug: "bulk-raw-salt",
    subtitle: "For Bulk Supply",
    description: "Fine powder, coarse crystals and natural raw salt lumps for commercial and export supply.",
    image: "/white-sack.png",
    display_order: 6,
  },
];

const edibleBase = {
  category: "edible-salt",
  moq: "On request",
  status: "active" as const,
  best_for: "Retail, private label, foodservice and distribution",
  applications: ["Retail", "Private Label", "Foodservice"],
  featured: false,
};

function edibleProduct(args: {
  title: string;
  slug: string;
  subtitle: string;
  packaging: string;
  grain: "Extra Fine Powder" | "Coarse";
  sizes: string;
  image: string;
  order: number;
}) : ApprovedProductSeed {
  const grainDetail = args.grain === "Coarse" ? "Coarse · 2–4 mm" : "Extra Fine Powder";
  return {
    ...edibleBase,
    title: args.title,
    slug: args.slug,
    subtitle: args.subtitle,
    description: `${grainDetail} Himalayan pink salt in ${args.packaging.toLowerCase()} packaging.`,
    short_description: `${grainDetail} · ${args.packaging} · ${args.sizes}`,
    image: args.image,
    packaging: args.packaging,
    grain_type: args.grain,
    sizes: args.sizes,
    packaging_type: args.packaging,
    features: [grainDetail, args.packaging, "Private-label compatible"],
    specifications: {
      "Form / Grain": grainDetail,
      Packaging: args.packaging,
      "Pack Sizes": args.sizes,
    },
    display_order: args.order,
    seo_title: `${grainDetail} Himalayan Pink Salt ${args.packaging}`,
    seo_description: `${grainDetail} Himalayan pink salt supplied in ${args.packaging.toLowerCase()} formats for B2B and private-label buyers.`,
  };
}

function generalProduct(args: {
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  description: string;
  image: string;
  grain: string;
  sizes: string;
  packaging: string;
  bestFor: string;
  order: number;
  applications: string[];
}) : ApprovedProductSeed {
  return {
    title: args.title,
    slug: args.slug,
    subtitle: args.subtitle,
    category: args.category,
    description: args.description,
    short_description: `${args.grain} · ${args.packaging} · ${args.sizes}`,
    image: args.image,
    moq: "On request",
    packaging: args.packaging,
    status: "active",
    grain_type: args.grain,
    sizes: args.sizes,
    packaging_type: args.packaging,
    best_for: args.bestFor,
    features: [args.grain, args.packaging, args.sizes],
    applications: args.applications,
    specifications: {
      "Form / Grain": args.grain,
      Packaging: args.packaging,
      "Pack Size": args.sizes,
    },
    featured: false,
    display_order: args.order,
    seo_title: args.title,
    seo_description: args.description,
  };
}

export const APPROVED_PRODUCT_SHEET: ApprovedProductSeed[] = [
  edibleProduct({ title: "Stand-Up Pouch", slug: "extra-fine-powder-stand-up-pouch", subtitle: "Salt Pouches", packaging: "Stand-Up Pouch", grain: "Extra Fine Powder", sizes: "500g, 800g, 1000g", image: "/standup-pouch.png", order: 101 }),
  edibleProduct({ title: "Gusseted Pouch", slug: "extra-fine-powder-gusseted-pouch", subtitle: "Salt Pouches", packaging: "Gusseted Pouch", grain: "Extra Fine Powder", sizes: "500g, 800g, 1000g", image: "/pouches.png", order: 102 }),
  edibleProduct({ title: "Round Jar with Spoon", slug: "extra-fine-powder-round-jar-spoon", subtitle: "Salt Jars", packaging: "Round Jar with Spoon", grain: "Extra Fine Powder", sizes: "500g, 750g, 1000g", image: "/pet-jars.png", order: 103 }),
  edibleProduct({ title: "Square Jar with Spoon", slug: "extra-fine-powder-square-jar-spoon", subtitle: "Salt Jars", packaging: "Square Jar with Spoon", grain: "Extra Fine Powder", sizes: "500g, 750g, 1000g", image: "/pet-jars.png", order: 104 }),
  edibleProduct({ title: "Cone Shaker", slug: "extra-fine-powder-cone-shaker", subtitle: "Salt Bottle", packaging: "Cone Shaker", grain: "Extra Fine Powder", sizes: "750g", image: "/shaker-bottles.png", order: 105 }),
  edibleProduct({ title: "PET Shaker", slug: "extra-fine-powder-pet-shaker", subtitle: "Salt Bottle", packaging: "PET Shaker", grain: "Extra Fine Powder", sizes: "250g, 300g, 500g", image: "/shaker-bottles.png", order: 106 }),
  edibleProduct({ title: "Craft Salt Box Shaker", slug: "extra-fine-powder-box-shaker", subtitle: "Salt Box", packaging: "Craft Salt Box Shaker", grain: "Extra Fine Powder", sizes: "250g, 500g, 1000g", image: "/product-2.png", order: 107 }),

  edibleProduct({ title: "Stand-Up Pouch", slug: "coarse-salt-stand-up-pouch", subtitle: "Salt Pouches", packaging: "Stand-Up Pouch", grain: "Coarse", sizes: "500g, 800g, 1000g", image: "/standup-pouch.png", order: 201 }),
  edibleProduct({ title: "Gusseted Pouch", slug: "coarse-salt-gusseted-pouch", subtitle: "Salt Pouches", packaging: "Gusseted Pouch", grain: "Coarse", sizes: "500g, 800g, 1000g", image: "/pouches.png", order: 202 }),
  edibleProduct({ title: "Plastic Grinder", slug: "coarse-salt-plastic-grinder", subtitle: "Salt Grinders", packaging: "Plastic Grinder", grain: "Coarse", sizes: "100g, 200g, 300g, 500g", image: "/grinder-bottles.png", order: 203 }),
  edibleProduct({ title: "Ceramic Grinder", slug: "coarse-salt-ceramic-grinder", subtitle: "Salt Grinders", packaging: "Ceramic Grinder", grain: "Coarse", sizes: "100g, 200g, 300g, 500g", image: "/ceramic-grinders.png", order: 204 }),
  edibleProduct({ title: "Glass Grinder", slug: "coarse-salt-glass-grinder", subtitle: "Salt Grinders", packaging: "Glass Grinder", grain: "Coarse", sizes: "100g, 200g, 300g, 500g", image: "/grinder-bottles1.png", order: 205 }),

  generalProduct({ title: "Rough Shape Lamp", slug: "rough-shape-salt-lamp", subtitle: "Irregular Shape", category: "salt-lamps", description: "Natural Himalayan salt lamp in a rough irregular shape.", image: "/product-5.png", grain: "Irregular Shape", sizes: "Custom", packaging: "Lamp", bestFor: "Retail, decor and wellness", order: 301, applications: ["Decor", "Retail", "Wellness"] }),
  generalProduct({ title: "Cylinder Shape Lamp", slug: "cylinder-shape-salt-lamp", subtitle: "Cylinder Shape", category: "salt-lamps", description: "Natural Himalayan salt lamp in a cylinder shape.", image: "/product-5.png", grain: "Cylinder Shape", sizes: "Custom", packaging: "Lamp", bestFor: "Retail, decor and wellness", order: 302, applications: ["Decor", "Retail", "Wellness"] }),
  generalProduct({ title: "Square Shape Lamp", slug: "square-shape-salt-lamp", subtitle: "Square Shape", category: "salt-lamps", description: "Natural Himalayan salt lamp in a square shape.", image: "/product-5.png", grain: "Square Shape", sizes: "Custom", packaging: "Lamp", bestFor: "Retail, decor and wellness", order: 303, applications: ["Decor", "Retail", "Wellness"] }),
  generalProduct({ title: "Round Shape Lamp", slug: "round-shape-salt-lamp", subtitle: "Round Shape", category: "salt-lamps", description: "Natural Himalayan salt lamp in a round shape.", image: "/product-5.png", grain: "Round Shape", sizes: "Custom", packaging: "Lamp", bestFor: "Retail, decor and wellness", order: 304, applications: ["Decor", "Retail", "Wellness"] }),
  generalProduct({ title: "Basket Lamp", slug: "basket-salt-lamp", subtitle: "Basket", category: "salt-lamps", description: "Himalayan salt basket lamp for decorative retail programs.", image: "/product-5.png", grain: "Basket", sizes: "Custom", packaging: "Lamp", bestFor: "Retail, decor and wellness", order: 305, applications: ["Decor", "Retail", "Wellness"] }),
  generalProduct({ title: "Custom Shape Lamp", slug: "custom-shape-salt-lamp", subtitle: "As Per Client Demand", category: "salt-lamps", description: "Custom-shape Himalayan salt lamp manufactured to buyer requirements.", image: "/product-5.png", grain: "Custom Shape", sizes: "As per client demand", packaging: "Lamp", bestFor: "Private label and custom programs", order: 306, applications: ["Custom Programs", "Retail", "Decor"] }),

  ...["1×4×8", "1.5×4×8", "2×4×8"].map((size, index) => generalProduct({ title: `Salt Tile / Brick — ${size}`, slug: `salt-tile-brick-${size.replace(/[^0-9a-z]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`, subtitle: "Salt Tiles / Bricks", category: "salt-tiles-bricks", description: `Himalayan salt tile / brick in ${size} size.`, image: "/product-2.png", grain: "Tile / Brick", sizes: size, packaging: "Tile / Brick", bestFor: "Walls, decor and architectural applications", order: 401 + index, applications: ["Walls", "Decor", "Architecture"] })),

  ...["1.5×8×8", "2×8×8", "1.5×8×12", "2×8×12"].map((size, index) => generalProduct({ title: `Cooking Plate / Slab — ${size}`, slug: `cooking-plate-slab-${size.replace(/[^0-9a-z]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`, subtitle: "Cooking Plate / Slab", category: "cooking-plates-slabs", description: `Himalayan salt cooking plate / slab in ${size} size.`, image: "/product-1.jpg", grain: "Cooking Plate / Slab", sizes: size, packaging: "Cooking Plate / Slab", bestFor: "Cooking, serving and culinary presentation", order: 501 + index, applications: ["Cooking", "Serving", "Culinary"] })),

  generalProduct({ title: "Irregular Lick Block", slug: "animal-lick-irregular-block", subtitle: "Irregular Shape", category: "animal-lick-salt", description: "Natural Himalayan salt lick block in irregular shape.", image: "/product-4.png", grain: "Irregular Shape", sizes: "2–3kg", packaging: "Block", bestFor: "Livestock", order: 601, applications: ["Livestock"] }),
  generalProduct({ title: "Compressed Lick Block", slug: "animal-lick-compressed-block", subtitle: "Square Shape", category: "animal-lick-salt", description: "Compressed Himalayan salt lick block in square shape.", image: "/product-4.png", grain: "Square Shape", sizes: "2–3kg", packaging: "Compressed Block", bestFor: "Livestock", order: 602, applications: ["Livestock"] }),

  ...["25kg", "50kg", "1 Ton"].map((size, index) => generalProduct({ title: `Fine Powder PP Bag — ${size}`, slug: `bulk-fine-powder-pp-bag-${size.toLowerCase().replace(/[^0-9a-z]+/g, "-")}`, subtitle: "Bulk Salt", category: "bulk-raw-salt", description: `Fine powder Himalayan pink salt in ${size} woven / PP bag.`, image: "/white-sack.png", grain: "Fine Powder", sizes: size, packaging: "PP Bag", bestFor: "Bulk food and industrial supply", order: 701 + index, applications: ["Bulk Supply", "Food Processing", "Export"] })),
  ...["25kg", "50kg", "1 Ton"].map((size, index) => generalProduct({ title: `Coarse PP Bag — ${size}`, slug: `bulk-coarse-pp-bag-${size.toLowerCase().replace(/[^0-9a-z]+/g, "-")}`, subtitle: "Bulk Salt", category: "bulk-raw-salt", description: `Coarse 2–4 mm Himalayan pink salt in ${size} woven / PP bag.`, image: "/white-sack.png", grain: "Coarse", sizes: size, packaging: "PP Bag", bestFor: "Bulk food and industrial supply", order: 711 + index, applications: ["Bulk Supply", "Food Processing", "Export"] })),
  generalProduct({ title: "Raw Salt Lumps", slug: "raw-himalayan-salt-lumps", subtitle: "Raw Salt", category: "bulk-raw-salt", description: "Natural Himalayan pink salt lumps for commercial and industrial supply.", image: "/hero-products.png", grain: "Raw / Undefined Shape", sizes: "5–15kg", packaging: "Lumps", bestFor: "Raw material and industrial supply", order: 721, applications: ["Raw Material", "Industrial", "Export"] }),
];

export const LEGACY_PRODUCT_SLUGS = [
  "himalayan-salt-tiles-bricks",
  "himalayan-salt-cooking-plates-slabs",
  "bulk-fine-powder-pp-bag",
];
