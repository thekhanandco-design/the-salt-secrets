"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, Grid3X3, LampDesk, Mountain, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { APPROVED_PRODUCT_CATEGORIES, APPROVED_PRODUCT_SHEET, LEGACY_PRODUCT_SLUGS } from "@/lib/product-catalog";

type ProductSegment = "powder" | "coarse";

type Product = {
  id?: number | string;
  title: string;
  slug: string;
  category?: string;
  description?: string;
  short_description?: string;
  image?: string;
  packaging?: string;
  status?: string;
  grain_type?: string;
  sizes?: string;
  packaging_type?: string;
  display_order?: number;
};

type CategoryRow = {
  id?: number;
  name: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  status?: string | null;
  display_order?: number | null;
};

const iconByFamily = {
  "edible-salt": UtensilsCrossed,
  "salt-lamps": LampDesk,
  "salt-tiles-bricks": Grid3X3,
  "cooking-plates-slabs": UtensilsCrossed,
  "animal-lick-salt": Mountain,
  "bulk-raw-salt": Boxes,
} as const;

const cmsFamilyKeyBySlug: Record<string, string> = {
  "edible-salt": "edible",
  "salt-lamps": "lamps",
  "salt-tiles-bricks": "tiles",
  "cooking-plates-slabs": "slabs",
  "animal-lick-salt": "lick",
  "bulk-raw-salt": "bulk",
};

const defaultFamilyIntroHeadings: Record<string, string> = {
  "edible-salt": "The Salt That Started This Company.",
  "salt-lamps": "Natural Himalayan Salt, Shaped for Light & Wellness.",
  "salt-tiles-bricks": "Natural Salt Architecture for Walls, Wellness & Design.",
  "cooking-plates-slabs": "Cook, Serve & Present on Natural Himalayan Salt.",
  "animal-lick-salt": "Natural Mineral Salt for Livestock Programs.",
  "bulk-raw-salt": "Commercial Himalayan Salt for Global Supply.",
};

function isVisible(status?: string | null) {
  return !status || status === "active" || status === "published";
}

function normalize(value?: string) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function segmentFor(product: Product): ProductSegment {
  const signature = normalize(`${product.grain_type || ""} ${product.title || ""}`);
  return signature.includes("extra-fine") || signature.includes("fine-powder") || signature.includes("powder") ? "powder" : "coarse";
}

function headingParts(value: string) {
  const words = value.trim().split(/\s+/);
  if (words.length < 2) return { main: value, accent: "" };
  const accent = words.pop() || "";
  return { main: `${words.join(" ")} `, accent };
}

function displayProductName(product: Product) {
  if (product.category === "edible-salt") return product.packaging_type || product.packaging || product.title.split("—").pop()?.trim() || product.title;
  return product.title.replace(/^Extra Fine Powder\s*[—-]\s*/i, "").replace(/^Coarse Salt\s*[—-]\s*/i, "");
}

const fallbackProducts: Product[] = APPROVED_PRODUCT_SHEET.map((product) => ({ ...product }));

function normalizedSize(product: Product) {
  const direct = normalize(product.sizes);
  if (direct) return direct;
  const text = String(product.title || "").toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?\s*(?:kg|g|ton|mm|cm)|\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?(?:\s*[x×]\s*\d+(?:\.\d+)?)?)/i);
  return normalize(match?.[1] || "");
}


function productListingImageSubgroup(product: Product) {
  const category = normalize(product.category);
  const signature = normalize(`${product.grain_type || ""} ${product.title || ""} ${product.packaging_type || product.packaging || ""}`);
  if (category === "edible-salt") return signature.includes("coarse") ? "coarse" : "extra-fine-powder";
  if (category === "bulk-raw-salt") {
    if (signature.includes("raw") || signature.includes("lump")) return "raw-salt";
    if (signature.includes("coarse")) return "coarse";
    return "fine-powder";
  }
  return "products";
}

function productListingCmsImageKey(product: Product) {
  return `products.product_family.listing__${normalize(product.category)}__${productListingImageSubgroup(product)}__${product.slug}`;
}

function semanticProductKey(product: Product) {
  const category = normalize(product.category);
  const title = normalize(product.title);
  const grain = normalize(product.grain_type);
  const packaging = normalize(product.packaging_type || product.packaging);
  const size = normalizedSize(product);
  const signature = `${title}-${grain}-${packaging}`;

  if (category === "edible-salt") {
    const segment = segmentFor(product);
    const format = packaging || normalize(displayProductName(product));
    return `${category}|${segment}|${format}`;
  }

  if (category === "animal-lick-salt") {
    if (signature.includes("irregular")) return `${category}|irregular`;
    if (signature.includes("compressed") || signature.includes("square")) return `${category}|compressed-square`;
  }

  if (category === "bulk-raw-salt") {
    if (signature.includes("raw") || signature.includes("lump")) return `${category}|raw|${size || "lumps"}`;
    if (signature.includes("fine-powder") || signature.includes("fine")) return `${category}|fine-powder|${size}`;
    if (signature.includes("coarse")) return `${category}|coarse|${size}`;
  }

  if (category === "salt-tiles-bricks" || category === "cooking-plates-slabs") {
    return `${category}|${size || title}`;
  }

  if (category === "salt-lamps") {
    const shape = grain || title.replace(/(?:natural-)?himalayan-|salt-|lamp/g, "");
    return `${category}|${shape}`;
  }

  return `${category}|${normalize(product.slug) || title}`;
}

export default function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [activeFamily, setActiveFamily] = useState("edible-salt");
  const [activeSegment, setActiveSegment] = useState<ProductSegment>("powder");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("family");
    if (requested && APPROVED_PRODUCT_CATEGORIES.some((item) => item.slug === requested)) setActiveFamily(requested);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const [productResult, categoryResult] = await Promise.all([
        supabase.from("products").select("*").order("display_order").order("created_at", { ascending: false }),
        supabase.from("categories").select("id,name,slug,subtitle,description,image,status,display_order").order("display_order"),
      ]);
      if (!mounted) return;
      setRows((productResult.data || []) as Product[]);
      setCategoryRows((categoryResult.data || []) as CategoryRow[]);
    }
    void load();
    const refresh = () => void load();
    window.addEventListener("salt-cms-updated", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("salt-cms-updated", refresh);
    };
  }, []);

  const families = useMemo(() => APPROVED_PRODUCT_CATEGORIES.map((base) => {
    const saved = categoryRows.find((row) => row.slug === base.slug);
    return {
      ...base,
      ...saved,
      name: saved?.name || base.name,
      subtitle: saved?.subtitle || base.subtitle,
      description: saved?.description || base.description,
      image: saved?.image || base.image,
      icon: iconByFamily[base.slug as keyof typeof iconByFamily] || Grid3X3,
    };
  }).filter((family) => isVisible(family.status)), [categoryRows]);

  useEffect(() => {
    if (!families.some((family) => family.slug === activeFamily) && families[0]) setActiveFamily(families[0].slug);
  }, [activeFamily, families]);

  useEffect(() => {
    // The product family changes without changing the URL. Re-apply the CMS
    // after React renders the selected family so each family's own editable
    // heading/style/visibility is restored immediately.
    const timer = window.setTimeout(() => window.dispatchEvent(new Event("salt-cms-updated")), 0);
    return () => window.clearTimeout(timer);
  }, [activeFamily]);

  const products = useMemo(() => {
    const approvedCategorySlugs = new Set(APPROVED_PRODUCT_CATEGORIES.map((item) => item.slug));
    const legacy = new Set(LEGACY_PRODUCT_SLUGS);

    const database = rows
      .filter((row) => isVisible(row.status))
      .filter((row) => approvedCategorySlugs.has(normalize(row.category)))
      .filter((row) => !legacy.has(row.slug))
      .map((row) => ({ ...row, category: normalize(row.category) }))
      .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));

    // Keep Supabase values whenever that real product exists, but restore only
    // the approved catalog products that are actually missing from Supabase.
    // Matching is semantic (family + grain/shape/packaging/size), not just slug,
    // because older live rows can have different slugs/titles for the same item.
    // This prevents Animal Lick duplicates while retaining fallback-only cards
    // such as Bulk & Raw Salt entries and any other approved products not seeded
    // in the current database yet.
    const merged = new Map<string, Product>();

    for (const row of database) {
      const key = semanticProductKey(row);
      if (!merged.has(key)) merged.set(key, row);
    }

    for (const fallback of fallbackProducts.filter((row) => !legacy.has(row.slug) && row.slug !== "extra-fine-powder-box-shaker")) {
      const normalizedFallback = { ...fallback, category: normalize(fallback.category) };
      const key = semanticProductKey(normalizedFallback);
      if (!merged.has(key)) merged.set(key, normalizedFallback);
    }

    return Array.from(merged.values()).sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
  }, [rows]);

  const currentFamily = families.find((family) => family.slug === activeFamily) || families[0] || APPROVED_PRODUCT_CATEGORIES[0];
  const heroParts = headingParts(currentFamily.name);
  const currentFamilyCmsKey = cmsFamilyKeyBySlug[currentFamily.slug] || "edible";
  const familyIntroHeading = defaultFamilyIntroHeadings[currentFamily.slug] || `Premium ${currentFamily.name} for Commercial Buyers.`;
  const familyProducts = products.filter((product) => normalize(product.category) === activeFamily);
  const edibleProducts = activeFamily === "edible-salt" ? familyProducts.filter((product) => segmentFor(product) === activeSegment) : familyProducts;

  const bulkGroups = activeFamily === "bulk-raw-salt" ? [
    { label: "Fine Powder", items: familyProducts.filter((product) => normalize(product.grain_type).includes("fine-powder")) },
    { label: "Coarse", items: familyProducts.filter((product) => normalize(product.grain_type) === "coarse") },
    { label: "Raw Salt", items: familyProducts.filter((product) => normalize(product.grain_type).includes("raw")) },
  ].filter((group) => group.items.length) : [];

  function productGrid(items: Product[]) {
    return (
      <div className="tso-showcase-product-grid">
        {items.map((product, index) => (
          <article className="tso-showcase-product-card" key={`${product.slug}-${index}`}>
            <div className="tso-showcase-product-card__image">
              <img data-cms-image-key={productListingCmsImageKey(product)} src={product.image || "/hero-products.png"} alt={displayProductName(product)} />
            </div>
            <div className="tso-showcase-product-card__body">
              <h3>{displayProductName(product)}</h3>
              <div className="tso-showcase-product-specs">
                <span><b>Form / Grain:</b> {product.grain_type === "Coarse" ? "Coarse · 2–4 mm" : product.grain_type || "Custom"}</span>
                <span><b>Packaging:</b> {product.packaging_type || product.packaging || "Custom"}</span>
                <span><b>Pack Size:</b> {product.sizes || "On request"}</span>
              </div>
              <Link href={`/products/${product.slug}`}>View Details <span>→</span></Link>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <main className="tso-route-page tso-products-showcase-page" data-cms-variant={activeFamily}>
      <section className="tso-products-showcase-hero" data-cms-section="hero">
        <div className="tso-public-container tso-products-showcase-hero__grid">
          <div className="tso-products-showcase-hero__copy">
            <div className="tso-crumbs">PRODUCTS / {currentFamily.name.toUpperCase()}</div>
            <h1><span data-cms-key={`products.hero.${currentFamilyCmsKey}_title_main`}>{heroParts.main}</span>{heroParts.accent ? <em data-cms-key={`products.hero.${currentFamilyCmsKey}_title_accent`}>{heroParts.accent}</em> : null}</h1>
            <h2
              className="tso-products-showcase-hero__intro-heading"
              data-cms-key={`products.hero.${currentFamilyCmsKey}_intro_heading`}
            >
              {familyIntroHeading}
            </h2>
            <p data-cms-key={`products.hero.${currentFamilyCmsKey}_description`}>{currentFamily.description}</p>
          </div>
          <div className="tso-products-showcase-hero__visual">
            <img data-cms-image-key={`products.hero.${currentFamilyCmsKey}_image`} src={currentFamily.image || "/hero-banner.png"} alt={`${currentFamily.name} collection`} />
          </div>
        </div>
      </section>

      <section className="tso-product-family-nav" data-cms-section="categories">
        <div className="tso-public-container">
          <div className="tso-product-family-nav__grid">
            {families.map((family) => {
              const Icon = family.icon;
              return (
                <button
                  key={family.slug}
                  type="button"
                  onClick={() => {
                    setActiveFamily(family.slug);
                    const url = new URL(window.location.href);
                    url.searchParams.set("family", family.slug);
                    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
                    if (family.slug === "edible-salt") setActiveSegment("powder");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={activeFamily === family.slug ? "active" : ""}
                >
                  <span><Icon /></span>
                  <div><strong>{family.name}</strong><small>{family.subtitle}</small></div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="tso-product-family-section" data-cms-section="product_family">
        <div className="tso-public-container">
          <header className="tso-product-family-heading">
            <span data-cms-key={`products.product_family.${currentFamilyCmsKey}_eyebrow`}>{currentFamily.name.toUpperCase()}</span>
            <h2 data-cms-key={`products.product_family.${currentFamilyCmsKey}_heading`}>
              {activeFamily === "edible-salt" ? (
                activeSegment === "powder" ? <><span>Extra Fine </span><em>Powder</em></> : <><span>Coarse </span><em>Salt</em></>
              ) : <><span>{heroParts.main}</span><em>{heroParts.accent}</em></>}
            </h2>
            <p data-cms-key={`products.product_family.${currentFamilyCmsKey}_subtitle`}>{currentFamily.subtitle}</p>
          </header>

          {activeFamily === "edible-salt" ? (
            <div className="tso-product-segment-tabs">
              <button type="button" onClick={() => setActiveSegment("powder")} className={activeSegment === "powder" ? "active" : ""}>Extra Fine Powder</button>
              <button type="button" onClick={() => setActiveSegment("coarse")} className={activeSegment === "coarse" ? "active" : ""}>Coarse</button>
            </div>
          ) : null}

          {activeFamily === "bulk-raw-salt" ? (
            <div className="tso-product-group-stack">
              {bulkGroups.map((group) => (
                <section key={group.label} className="tso-product-subgroup">
                  <h3>{group.label}</h3>
                  {productGrid(group.items)}
                </section>
              ))}
            </div>
          ) : productGrid(edibleProducts)}
        </div>
      </section>
    </main>
  );
}
