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

export default function ProductsPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [activeFamily, setActiveFamily] = useState("edible-salt");
  const [activeSegment, setActiveSegment] = useState<ProductSegment>("powder");

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

  const products = useMemo(() => {
    const approvedCategorySlugs = new Set(APPROVED_PRODUCT_CATEGORIES.map((item) => item.slug));
    const legacy = new Set(LEGACY_PRODUCT_SLUGS);
    const database = rows
      .filter((row) => isVisible(row.status))
      .filter((row) => approvedCategorySlugs.has(normalize(row.category)))
      .filter((row) => !legacy.has(row.slug))
      .map((row) => ({ ...row, category: normalize(row.category) }));
    const databaseSlugs = new Set(database.map((row) => row.slug));
    return [...database, ...fallbackProducts.filter((row) => !databaseSlugs.has(row.slug))]
      .filter((row) => !legacy.has(row.slug))
      .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
  }, [rows]);

  const currentFamily = families.find((family) => family.slug === activeFamily) || families[0] || APPROVED_PRODUCT_CATEGORIES[0];
  const heroParts = headingParts(currentFamily.name);
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
              <img src={product.image || "/hero-products.png"} alt={displayProductName(product)} />
            </div>
            <div className="tso-showcase-product-card__body">
              <h3>{displayProductName(product)}</h3>
              <div className="tso-showcase-product-specs">
                <span><b>Form / Grain:</b> {product.grain_type === "Coarse" ? "Coarse · 2–4 mm" : product.grain_type || "Custom"}</span>
                <span><b>Packaging:</b> {product.packaging_type || product.packaging || "Custom"}</span>
                <span><b>Pack Size:</b> {product.sizes || "On request"}</span>
              </div>
              {product.id ? <Link href={`/products/${product.slug}`}>View Details <span>→</span></Link> : null}
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <main className="tso-route-page tso-products-showcase-page">
      <section className="tso-products-showcase-hero" data-cms-section="hero">
        <div className="tso-public-container tso-products-showcase-hero__grid">
          <div className="tso-products-showcase-hero__copy">
            <div className="tso-crumbs">PRODUCTS / {currentFamily.name.toUpperCase()}</div>
            <h1><span>{heroParts.main}</span>{heroParts.accent ? <em>{heroParts.accent}</em> : null}</h1>
            <p>{currentFamily.description}</p>
          </div>
          <div className="tso-products-showcase-hero__visual">
            <img src={currentFamily.image || "/hero-banner.png"} alt={`${currentFamily.name} collection`} />
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
            <span>{currentFamily.name.toUpperCase()}</span>
            <h2>
              {activeFamily === "edible-salt" ? (
                activeSegment === "powder" ? <><span>Extra Fine </span><em>Powder</em></> : <><span>Coarse </span><em>Salt</em></>
              ) : <><span>{heroParts.main}</span><em>{heroParts.accent}</em></>}
            </h2>
            <p>{currentFamily.subtitle}</p>
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
