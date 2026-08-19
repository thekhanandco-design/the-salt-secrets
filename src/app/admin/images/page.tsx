"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { adminFetch, adminUpload } from "@/lib/admin-client";
import { cmsPageLabels, type CmsImageSlotSeed } from "@/lib/cms-registry";
import { defaultSectionsForPage } from "@/lib/cms-section-registry";
import { PRODUCT_PAGE_SECTION_LABELS } from "@/lib/product-page-layout";
import { APPROVED_PRODUCT_CATEGORIES, APPROVED_PRODUCT_SHEET, LEGACY_PRODUCT_SLUGS } from "@/lib/product-catalog";
import {
  cmsImageSlotKey,
  cmsScopeForElement,
  normalizeCmsImageUrl,
  parseCmsFullKey,
} from "@/lib/cms-dom-registry";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Grid2X2,
  Image as ImageIcon,
  List,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";

type Slot = CmsImageSlotSeed & { id?: string | number };
type SlotPatch = Partial<Pick<Slot, "current_url" | "alt_text" | "is_active">>;
type ProductRow = {
  id: number;
  title: string;
  slug: string;
  category?: string | null;
  image?: string | null;
  gallery?: string[] | null;
  status?: string | null;
  display_order?: number | null;
  grain_type?: string | null;
  packaging?: string | null;
  packaging_type?: string | null;
  sizes?: string | null;
};
type ProductListingRow = Omit<ProductRow, "id" | "gallery"> & { id?: number };
type CategoryRow = {
  id?: number | null;
  name: string;
  slug: string;
  image?: string | null;
  status?: string | null;
  display_order?: number | null;
};
type PageDescriptor = {
  pageSlug: string;
  label: string;
  route: string;
  product?: ProductRow;
};

const staticPages: PageDescriptor[] = [
  { pageSlug: "global", label: "Branding / Footer", route: "/" },
  { pageSlug: "home", label: "Homepage", route: "/" },
  { pageSlug: "products", label: "Products Page", route: "/products" },
  { pageSlug: "private-label", label: "Private Label", route: "/private-label" },
  { pageSlug: "certifications", label: "Certifications", route: "/certifications" },
  { pageSlug: "blog", label: "Blog Page", route: "/blog" },
  { pageSlug: "about", label: "About Us", route: "/about" },
  { pageSlug: "our-story", label: "Our Story", route: "/our-story" },
  { pageSlug: "faqs", label: "FAQ Page", route: "/faqs" },
  { pageSlug: "contact", label: "Contact Page", route: "/contact" },
  { pageSlug: "privacy-policy", label: "Privacy Policy", route: "/privacy-policy" },
  { pageSlug: "terms-and-conditions", label: "Terms & Conditions", route: "/terms-and-conditions" },
];

const globalSectionLabels: Record<string, string> = {
  branding: "Branding / Logo",
  navbar: "Navbar",
  announcement: "Announcement Bar",
  footer: "Footer",
  favicons: "Favicon & App Icons",
};

const productFamilyHeroSlotBySlug: Record<string, string> = {
  "edible-salt": "edible_image",
  "salt-lamps": "lamps_image",
  "salt-tiles-bricks": "tiles_image",
  "cooking-plates-slabs": "slabs_image",
  "animal-lick-salt": "lick_image",
  "bulk-raw-salt": "bulk_image",
};

const productFamilySlugByHeroSlot = Object.fromEntries(
  Object.entries(productFamilyHeroSlotBySlug).map(([slug, slot]) => [slot, slug]),
) as Record<string, string>;

const homepageProductCardSlotBySlug: Record<string, string> = {
  "edible-salt": "card_edible_salt",
  "salt-lamps": "card_salt_lamps",
  "salt-tiles-bricks": "card_salt_tiles_bricks",
  "cooking-plates-slabs": "card_cooking_plates_slabs",
  "animal-lick-salt": "card_animal_lick_salt",
  "bulk-raw-salt": "card_bulk_raw_salt",
};

const homepageProductSlugByCardSlot = Object.fromEntries(
  Object.entries(homepageProductCardSlotBySlug).map(([slug, slot]) => [slot, slug]),
) as Record<string, string>;

function categoryIsVisible(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase();
  return !normalized || normalized === "active" || normalized === "published";
}

function productFamilyHeroSlots(categories: CategoryRow[]): Slot[] {
  return APPROVED_PRODUCT_CATEGORIES.map((fallback, index) => {
    const category = categories.find((item) => item.slug === fallback.slug);
    const source = normalizeCmsImageUrl(category?.image || fallback.image || "/hero-banner.png");
    const slot = productFamilyHeroSlotBySlug[fallback.slug];
    return {
      page_slug: "products",
      section_slug: "hero",
      slot_key: slot,
      title: `${fallback.name} — Hero Banner`,
      current_url: source,
      default_url: normalizeCmsImageUrl(fallback.image || "/hero-banner.png"),
      alt_text: `${fallback.name} collection`,
      recommended_width: 1600,
      recommended_height: 900,
      display_order: 1500 + index,
      is_active: categoryIsVisible(category?.status),
    };
  });
}

function homepageProductCardSlots(): Slot[] {
  return APPROVED_PRODUCT_CATEGORIES.map((fallback, index) => ({
    page_slug: "home",
    section_slug: "products",
    slot_key: homepageProductCardSlotBySlug[fallback.slug],
    title: `Homepage Products — ${fallback.name} Square Card Image`,
    current_url: normalizeCmsImageUrl(fallback.image || "/hero-banner.png"),
    default_url: normalizeCmsImageUrl(fallback.image || "/hero-banner.png"),
    alt_text: `${fallback.name} Himalayan pink salt product family`,
    recommended_width: 900,
    recommended_height: 900,
    display_order: 1400 + index,
    is_active: true,
  }));
}

function productPageSlug(product: Pick<ProductRow, "id" | "slug">) {
  return `product::${product.id}::${product.slug}`;
}

function productFromPageSlug(pageSlug: string) {
  const match = /^product::(-?\d+)::(.+)$/.exec(pageSlug);
  return match ? { id: Number(match[1]), slug: match[2] } : null;
}

function slotKey(slot: Pick<Slot, "page_slug" | "section_slug" | "slot_key">) {
  return `${slot.page_slug}:${slot.section_slug}:${slot.slot_key}`;
}

function isSiteIconSlot(slot: Pick<Slot, "page_slug" | "section_slug">) {
  return slot.page_slug === "global" && slot.section_slug === "favicons";
}

function canonicalProductDetailSlots(product: ProductRow): Slot[] {
  const pageSlug = productPageSlug(product);
  const rows: Slot[] = [];
  const mainImage = normalizeCmsImageUrl(product.image || "/product-2.png");

  rows.push({
    page_slug: pageSlug,
    section_slug: "hero",
    slot_key: "main_image",
    title: `${product.title} — Main Product Image`,
    current_url: mainImage,
    default_url: mainImage,
    alt_text: product.title,
    recommended_width: 900,
    recommended_height: 900,
    display_order: 10,
    is_active: true,
  });

  const gallery = Array.isArray(product.gallery)
    ? product.gallery.map((value) => normalizeCmsImageUrl(String(value || ""))).filter(Boolean)
    : [];
  const uniqueGallery = gallery.filter((value, index, values) => value !== mainImage && values.indexOf(value) === index);

  uniqueGallery.forEach((image, index) => {
    rows.push({
      page_slug: pageSlug,
      section_slug: "gallery",
      slot_key: `gallery_${index + 1}`,
      title: `${product.title} — Gallery Image ${index + 1}`,
      current_url: image,
      default_url: image,
      alt_text: `${product.title} gallery image ${index + 1}`,
      recommended_width: 900,
      recommended_height: 900,
      display_order: 100 + index,
      is_active: true,
    });
  });

  return rows;
}


function normalizeProductToken(value?: string | null) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const approvedProductCategorySlugs = new Set(APPROVED_PRODUCT_CATEGORIES.map((item) => item.slug));
const legacyProductSlugs = new Set(LEGACY_PRODUCT_SLUGS);

function isPublicProductDetail(product: ProductRow) {
  return categoryIsVisible(product.status)
    && approvedProductCategorySlugs.has(normalizeProductToken(product.category))
    && !legacyProductSlugs.has(product.slug);
}

function publicProductDetailRows(products: ProductRow[]) {
  // Product Detail navigation must represent the complete approved public catalog,
  // not only rows that currently happen to exist in Supabase. Real database rows
  // win; approved catalog seeds fill only genuinely missing products. This keeps
  // all six families (including Cooking Plates / Slabs) permanently available.
  const merged = new Map<string, ProductRow>();

  products
    .filter(isPublicProductDetail)
    .forEach((product) => {
      const normalized: ProductRow = { ...product, category: normalizeProductToken(product.category) };
      const key = listingSemanticKey(normalized);
      if (!merged.has(key)) merged.set(key, normalized);
    });

  APPROVED_PRODUCT_SHEET
    .filter((product) => !legacyProductSlugs.has(product.slug))
    .forEach((product) => {
      const fallback: ProductRow = {
        ...product,
        id: -(100000 + Number(product.display_order || 0)),
        category: normalizeProductToken(product.category),
        gallery: [],
      };
      const key = listingSemanticKey(fallback);
      if (!merged.has(key)) merged.set(key, fallback);
    });

  return Array.from(merged.values())
    .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0) || a.title.localeCompare(b.title));
}

const currentHomepageImageKeys = new Set([
  "home:hero:products",
  "home:private_label:visual",
  "home:origin:mine",
  "home:quality:iso",
  "home:quality:haccp",
  "home:quality:gmp",
  "home:quality:halal",
  "home:quality:fda",
  "home:quality:food",
]);

function isCurrentHomepageSlot(slot: Pick<Slot, "page_slug" | "section_slug" | "slot_key">) {
  if (slot.page_slug !== "home") return true;
  const key = slotKey(slot);
  if (currentHomepageImageKeys.has(key)) return true;
  if (slot.section_slug === "products" && slot.slot_key.startsWith("card_")) return true;
  if (slot.section_slug === "resources" && slot.slot_key.startsWith("post_")) return true;
  return false;
}

function isCurrentStaticPageSlot(slot: Pick<Slot, "page_slug" | "section_slug" | "slot_key">) {
  if (slot.page_slug === "global") {
    return (slot.section_slug === "branding" && ["header_logo", "footer_logo"].includes(slot.slot_key))
      || (slot.section_slug === "footer" && slot.slot_key === "mountain_artwork")
      || (slot.section_slug === "favicons" && ["browser_favicon", "app_icon"].includes(slot.slot_key));
  }
  if (slot.page_slug === "home") return isCurrentHomepageSlot(slot);
  if (slot.page_slug === "private-label") {
    if (slot.section_slug === "hero" && slot.slot_key === "salt_accent") return true;
    if (slot.section_slug === "studio" && slot.slot_key === "packaging_visual") return true;
    if (slot.section_slug === "range") {
      const match = /^product_(.+)_image$/.exec(slot.slot_key);
      return Boolean(match && /[a-z-]/i.test(match[1]));
    }
    return false;
  }
  if (slot.page_slug === "certifications") return slot.section_slug === "documents";
  if (slot.page_slug === "blog") return slot.section_slug === "listing" && slot.slot_key.startsWith("post_");
  if (slot.page_slug === "about") {
    return (slot.section_slug === "origin" && slot.slot_key === "mine_image")
      || (slot.section_slug === "what_we_do" && slot.slot_key.endsWith("_image"))
      || (slot.section_slug === "purpose" && slot.slot_key === "salt_image");
  }
  if (slot.page_slug === "our-story") {
    return (slot.section_slug === "hero" && slot.slot_key === "reference")
      || (slot.section_slug === "story" && slot.slot_key === "visual")
      || (slot.section_slug === "founder" && slot.slot_key === "portrait");
  }
  if (["faqs", "contact", "privacy-policy", "terms-and-conditions"].includes(slot.page_slug)) return false;
  return true;
}

function isCurrentProductsPageSlot(slot: Pick<Slot, "page_slug" | "section_slug" | "slot_key">) {
  if (slot.page_slug !== "products") return true;
  if (slot.section_slug === "hero") return Boolean(productFamilySlugByHeroSlot[slot.slot_key]);
  if (slot.section_slug === "product_family") return Boolean(parseProductListingSlot(slot.slot_key));
  return false;
}

function isCanonicalProductDetailImageSlot(slot: Pick<Slot, "page_slug" | "section_slug" | "slot_key">) {
  if (!productFromPageSlug(slot.page_slug)) return true;
  if (slot.section_slug === "hero" && slot.slot_key === "main_image") return true;
  if (slot.section_slug === "gallery" && /^gallery_\d+$/.test(slot.slot_key)) return true;
  return false;
}

function listingSegment(product: ProductListingRow) {
  const category = normalizeProductToken(product.category);
  const signature = normalizeProductToken(`${product.grain_type || ""} ${product.title || ""} ${product.packaging_type || product.packaging || ""}`);
  if (category === "edible-salt") return signature.includes("coarse") ? "coarse" : "extra-fine-powder";
  if (category === "bulk-raw-salt") {
    if (signature.includes("raw") || signature.includes("lump")) return "raw-salt";
    if (signature.includes("coarse")) return "coarse";
    return "fine-powder";
  }
  return "products";
}

function listingDisplayName(product: ProductListingRow) {
  const category = normalizeProductToken(product.category);
  if (category === "edible-salt") {
    return String(product.packaging_type || product.packaging || product.title.split("—").pop()?.trim() || product.title).trim();
  }
  return String(product.title || "Product").replace(/^Extra Fine Powder\s*[—-]\s*/i, "").replace(/^Coarse Salt\s*[—-]\s*/i, "").trim();
}

function listingNormalizedSize(product: ProductListingRow) {
  const direct = normalizeProductToken(product.sizes);
  if (direct) return direct;
  const match = String(product.title || "").toLowerCase().match(/(\d+(?:\.\d+)?\s*(?:kg|g|ton|mm|cm)|\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?(?:\s*[x×]\s*\d+(?:\.\d+)?)?)/i);
  return normalizeProductToken(match?.[1] || "");
}

function listingSemanticKey(product: ProductListingRow) {
  const category = normalizeProductToken(product.category);
  const title = normalizeProductToken(product.title);
  const grain = normalizeProductToken(product.grain_type);
  const packaging = normalizeProductToken(product.packaging_type || product.packaging);
  const size = listingNormalizedSize(product);
  const signature = `${title}-${grain}-${packaging}`;

  if (category === "edible-salt") return `${category}|${listingSegment(product)}|${packaging || normalizeProductToken(listingDisplayName(product))}`;
  if (category === "animal-lick-salt") {
    if (signature.includes("irregular")) return `${category}|irregular`;
    if (signature.includes("compressed") || signature.includes("square")) return `${category}|compressed-square`;
  }
  if (category === "bulk-raw-salt") {
    if (signature.includes("raw") || signature.includes("lump")) return `${category}|raw|${size || "lumps"}`;
    if (signature.includes("fine-powder") || signature.includes("fine")) return `${category}|fine-powder|${size}`;
    if (signature.includes("coarse")) return `${category}|coarse|${size}`;
  }
  if (category === "salt-tiles-bricks" || category === "cooking-plates-slabs") return `${category}|${size || title}`;
  if (category === "salt-lamps") {
    const shape = grain || title.replace(/(?:natural-)?himalayan-|salt-|lamp/g, "");
    return `${category}|${shape}`;
  }
  return `${category}|${normalizeProductToken(product.slug) || title}`;
}

function mergedProductListing(products: ProductRow[]): ProductListingRow[] {
  const approvedCategories = new Set(APPROVED_PRODUCT_CATEGORIES.map((item) => item.slug));
  const legacy = new Set(LEGACY_PRODUCT_SLUGS);
  const merged = new Map<string, ProductListingRow>();

  products
    .filter((product) => categoryIsVisible(product.status))
    .filter((product) => approvedCategories.has(normalizeProductToken(product.category)))
    .filter((product) => !legacy.has(product.slug))
    .forEach((product) => {
      const normalized = { ...product, category: normalizeProductToken(product.category) };
      const key = listingSemanticKey(normalized);
      if (!merged.has(key)) merged.set(key, normalized);
    });

  APPROVED_PRODUCT_SHEET
    .filter((product) => !legacy.has(product.slug))
    .forEach((product) => {
      const normalized: ProductListingRow = { ...product, category: normalizeProductToken(product.category) };
      const key = listingSemanticKey(normalized);
      if (!merged.has(key)) merged.set(key, normalized);
    });

  return Array.from(merged.values()).sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0));
}

function productListingSlotKey(product: ProductListingRow) {
  return `listing__${normalizeProductToken(product.category)}__${listingSegment(product)}__${product.slug}`;
}

function parseProductListingSlot(slotKeyValue: string) {
  const parts = slotKeyValue.split("__");
  if (parts.length !== 4 || parts[0] !== "listing") return null;
  return { familySlug: parts[1], subgroupSlug: parts[2], productSlug: parts[3] };
}

function productListingSlots(products: ProductRow[]): Slot[] {
  return mergedProductListing(products).map((product, index) => ({
    page_slug: "products",
    section_slug: "product_family",
    slot_key: productListingSlotKey(product),
    title: listingDisplayName(product),
    current_url: normalizeCmsImageUrl(product.image || "/hero-products.png"),
    default_url: normalizeCmsImageUrl(product.image || "/hero-products.png"),
    alt_text: listingDisplayName(product),
    recommended_width: 900,
    recommended_height: 900,
    display_order: 3000 + Number(product.display_order || index),
    is_active: true,
  }));
}

const productFamilyManagerOrder: Record<string, number> = {
  "edible-salt": 10,
  "salt-lamps": 20,
  "salt-tiles-bricks": 30,
  "cooking-plates-slabs": 40,
  "animal-lick-salt": 50,
  "bulk-raw-salt": 60,
};

function productFamilyManagerLabel(slug: string) {
  return APPROVED_PRODUCT_CATEGORIES.find((item) => item.slug === slug)?.name || humanize(slug);
}

function productSubgroupManagerLabel(familySlug: string, subgroupSlug: string) {
  if (familySlug === "edible-salt") return subgroupSlug === "coarse" ? "Coarse" : "Extra Fine Powder";
  if (familySlug === "bulk-raw-salt") {
    if (subgroupSlug === "coarse") return "Coarse";
    if (subgroupSlug === "raw-salt") return "Raw Salt";
    return "Fine Powder";
  }
  return "Products";
}

function managerGroupMeta(slot: Slot) {
  if (slot.page_slug === "products" && slot.section_slug === "hero") {
    return { key: "products-hero", label: "Products Hero", order: 0 };
  }
  if (slot.page_slug === "products" && slot.section_slug === "product_family") {
    const listing = parseProductListingSlot(slot.slot_key);
    if (listing) {
      const family = productFamilyManagerLabel(listing.familySlug);
      const subgroup = productSubgroupManagerLabel(listing.familySlug, listing.subgroupSlug);
      const hasSubgroup = listing.familySlug === "edible-salt" || listing.familySlug === "bulk-raw-salt";
      const subgroupOrder = listing.subgroupSlug === "extra-fine-powder" || listing.subgroupSlug === "fine-powder" ? 0 : listing.subgroupSlug === "coarse" ? 1 : 2;
      return {
        key: `family:${listing.familySlug}:${listing.subgroupSlug}`,
        label: hasSubgroup ? `${family} — ${subgroup}` : family,
        order: (productFamilyManagerOrder[listing.familySlug] || 90) + subgroupOrder / 10,
      };
    }
  }
  return { key: slot.section_slug, label: sectionLabel(slot.page_slug, slot.section_slug), order: 100 };
}

function managerSlotContext(slot: Slot) {
  if (slot.page_slug === "home" && slot.section_slug === "products") {
    const familySlug = homepageProductSlugByCardSlot[slot.slot_key];
    if (familySlug) return `Homepage · ${productFamilyManagerLabel(familySlug)} · Square Card Image`;
  }
  if (slot.page_slug === "products" && slot.section_slug === "hero") {
    const familySlug = productFamilySlugByHeroSlot[slot.slot_key];
    if (familySlug) return `${productFamilyManagerLabel(familySlug)} · Hero Banner`;
  }
  if (slot.page_slug === "products" && slot.section_slug === "product_family") {
    const listing = parseProductListingSlot(slot.slot_key);
    if (listing) {
      const family = productFamilyManagerLabel(listing.familySlug);
      const subgroup = productSubgroupManagerLabel(listing.familySlug, listing.subgroupSlug);
      return listing.familySlug === "edible-salt" || listing.familySlug === "bulk-raw-salt"
        ? `${family} · ${subgroup} · Product Image`
        : `${family} · Product Image`;
    }
  }
  return `${sectionLabel(slot.page_slug, slot.section_slug)} · ${humanize(slot.slot_key)}`;
}

function derivedProductImageSlots(products: ProductRow[]) {
  return [
    ...publicProductDetailRows(products).flatMap((product) => canonicalProductDetailSlots(product)),
    ...productListingSlots(products),
  ];
}

function siteIconSlots(faviconUrl?: string | null, appIconUrl?: string | null): Slot[] {
  const favicon = String(faviconUrl || "/favicon.ico");
  const appIcon = String(appIconUrl || "/web-app-manifest-192x192.png");
  return [
    {
      page_slug: "global",
      section_slug: "favicons",
      slot_key: "browser_favicon",
      title: "Browser Favicon",
      current_url: favicon,
      default_url: "/favicon.ico",
      alt_text: "The Salt Origin browser favicon",
      recommended_width: 512,
      recommended_height: 512,
      display_order: 10,
      is_active: true,
    },
    {
      page_slug: "global",
      section_slug: "favicons",
      slot_key: "app_icon",
      title: "App / Apple Touch Icon",
      current_url: appIcon,
      default_url: "/web-app-manifest-192x192.png",
      alt_text: "The Salt Origin app icon",
      recommended_width: 512,
      recommended_height: 512,
      display_order: 11,
      is_active: true,
    },
  ];
}

function footerArtworkSlot(currentUrl = "/mountains-bg.png"): Slot {
  const source = normalizeCmsImageUrl(currentUrl || "/mountains-bg.png");
  return {
    page_slug: "global",
    section_slug: "footer",
    slot_key: "mountain_artwork",
    title: "Footer — Himalayan Mountain Artwork",
    current_url: source,
    default_url: "/mountains-bg.png",
    alt_text: "Himalayan mountain artwork in footer",
    recommended_width: 1600,
    recommended_height: 700,
    display_order: 40,
    is_active: true,
  };
}


function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pageLabel(pageSlug: string, products: ProductRow[]) {
  const product = productFromPageSlug(pageSlug);
  if (product) {
    return products.find((item) => item.id === product.id)?.title
      || APPROVED_PRODUCT_SHEET.find((item) => item.slug === product.slug)?.title
      || humanize(product.slug);
  }
  return cmsPageLabels[pageSlug] || humanize(pageSlug);
}

function routeFor(pageSlug: string) {
  const product = productFromPageSlug(pageSlug);
  if (product) return `/products/${product.slug}`;
  return staticPages.find((item) => item.pageSlug === pageSlug)?.route || "/";
}

function sectionLabel(pageSlug: string, sectionSlug: string) {
  if (pageSlug === "global") return globalSectionLabels[sectionSlug] || humanize(sectionSlug);
  if (productFromPageSlug(pageSlug)) {
    return PRODUCT_PAGE_SECTION_LABELS[sectionSlug as keyof typeof PRODUCT_PAGE_SECTION_LABELS] || humanize(sectionSlug);
  }
  return defaultSectionsForPage(pageSlug).find((section) => section.slug === sectionSlug)?.label || humanize(sectionSlug);
}

function explicitImageKey(image: HTMLImageElement) {
  const fullKey = image.dataset.cmsImageKey || "";
  return fullKey ? parseCmsFullKey(fullKey) : null;
}

function imageTitle(section: string, image: HTMLImageElement, position: number) {
  const alt = String(image.alt || "").trim();
  return alt ? `${humanize(section)} — ${alt}` : `${humanize(section)} — Image ${position}`;
}

function backgroundImageUrl(element: HTMLElement) {
  const inline = element.style.backgroundImage || "";
  const computed = element.ownerDocument?.defaultView?.getComputedStyle(element).backgroundImage || "";
  const value = inline && inline !== "none" ? inline : computed;
  const match = value.match(/url\(["']?(.*?)["']?\)/i);
  return normalizeCmsImageUrl(match?.[1] || "");
}

function backgroundTitle(section: string, fieldKey: string, element: HTMLElement) {
  return String(element.getAttribute("aria-label") || element.getAttribute("title") || "").trim()
    || `${humanize(section)} — ${humanize(fieldKey)}`;
}

function extractPageImages(
  descriptor: PageDescriptor,
  documentNode: Document,
  includeGlobal: boolean,
) {
  const rows: Slot[] = [];
  const sectionPositions = new Map<string, number>();
  const globalSeen = new Set<string>();
  let displayOrder = descriptor.product ? 20000 : 1000;

  for (const image of Array.from(documentNode.querySelectorAll<HTMLImageElement>("img"))) {
    if (image.closest("[data-cms-runtime-ignore]")) continue;
    if (image.closest(".tso-mobile-drawer")) continue;

    const scope = cmsScopeForElement(image, descriptor.pageSlug);
    if (!scope) continue;
    if (scope.pageSlug === "global" && !includeGlobal) continue;

    const source = normalizeCmsImageUrl(image.currentSrc || image.getAttribute("src") || "");
    if (!source || source.startsWith("data:")) continue;

    const explicit = explicitImageKey(image);
    const pageSlug = explicit?.pageSlug || scope.pageSlug;
    const sectionSlug = explicit?.sectionSlug || scope.sectionSlug;
    if (pageSlug !== descriptor.pageSlug && pageSlug !== "global") continue;

    // Product-detail images use their own stable CMS manifest (hero main image + gallery).
    // Never create DOM-position copies of marketplace logos, repeated hero images or other
    // decorative assets from a product detail page. The canonical detail image slots are
    // seeded separately and remain independent from the Products listing card image.
    if (descriptor.product && pageSlug === descriptor.pageSlug) continue;
    // Products listing images are mapped canonically from the same approved product
    // inventory used by the public Products page. Skipping DOM-position discovery
    // prevents meaningless Product 9 / Product 44 style slots and mixed families.
    if (descriptor.pageSlug === "products" && pageSlug === "products" && sectionSlug === "product_family") continue;

    const sectionCounterKey = `${pageSlug}:${sectionSlug}`;
    const position = (sectionPositions.get(sectionCounterKey) || 0) + 1;
    sectionPositions.set(sectionCounterKey, position);

    const key = explicit?.fieldKey || cmsImageSlotKey(scope.root, image);
    const homepageFamilySlug = pageSlug === "home" && sectionSlug === "products"
      ? homepageProductSlugByCardSlot[key]
      : undefined;
    const resolvedTitle = homepageFamilySlug
      ? `Homepage Products — ${productFamilyManagerLabel(homepageFamilySlug)} Square Card Image`
      : imageTitle(sectionSlug, image, position);

    if (pageSlug === "global") {
      const globalSignature = `${sectionSlug}|${source}|${image.alt || ""}`;
      if (globalSeen.has(globalSignature)) continue;
      globalSeen.add(globalSignature);
    }

    rows.push({
      page_slug: pageSlug,
      section_slug: sectionSlug,
      slot_key: key,
      title: resolvedTitle,
      current_url: source,
      default_url: source,
      alt_text: image.alt || resolvedTitle,
      recommended_width: image.naturalWidth || Number(image.getAttribute("width")) || 1200,
      recommended_height: image.naturalHeight || Number(image.getAttribute("height")) || 900,
      display_order: displayOrder++,
      is_active: true,
    });
  }

  for (const element of Array.from(documentNode.querySelectorAll<HTMLElement>("[data-cms-image-key]"))) {
    if (element instanceof HTMLImageElement) continue;
    if (element.closest("[data-cms-runtime-ignore]")) continue;
    if (element.closest(".tso-mobile-drawer")) continue;
    const explicit = parseCmsFullKey(element.dataset.cmsImageKey || "");
    if (!explicit) continue;
    if (explicit.pageSlug !== descriptor.pageSlug && explicit.pageSlug !== "global") continue;
    if (explicit.pageSlug === "global" && !includeGlobal) continue;
    const source = backgroundImageUrl(element);
    if (!source || source.startsWith("data:")) continue;
    const key = `${explicit.pageSlug}:${explicit.sectionSlug}:${explicit.fieldKey}`;
    if (rows.some((row) => slotKey(row) === key)) continue;
    const rect = element.getBoundingClientRect();
    rows.push({
      page_slug: explicit.pageSlug,
      section_slug: explicit.sectionSlug,
      slot_key: explicit.fieldKey,
      title: backgroundTitle(explicit.sectionSlug, explicit.fieldKey, element),
      current_url: source,
      default_url: source,
      alt_text: String(element.getAttribute("aria-label") || element.getAttribute("title") || backgroundTitle(explicit.sectionSlug, explicit.fieldKey, element)),
      recommended_width: Math.max(1200, Math.round(rect.width || 0)),
      recommended_height: Math.max(700, Math.round(rect.height || 0)),
      display_order: displayOrder++,
      is_active: true,
    });
  }

  return rows;
}

async function inspectLivePage(descriptor: PageDescriptor, includeGlobal: boolean) {
  return new Promise<Slot[]>((resolve, reject) => {
    const iframe = document.createElement("iframe");
    const timeout = window.setTimeout(() => {
      iframe.remove();
      reject(new Error(`Timed out while reading ${descriptor.route}`));
    }, 15000);

    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.style.position = "fixed";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.left = "-10000px";
    const separator = descriptor.route.includes("?") ? "&" : "?";
    iframe.src = `${descriptor.route}${separator}cms_image_manifest=1&cms_image_sync=${Date.now()}`;

    iframe.onload = () => {
      const startedAt = Date.now();
      let lastSignature = "";
      let stableRounds = 0;

      const readWhenStable = () => {
        try {
          const liveDocument = iframe.contentDocument;
          if (!liveDocument?.documentElement) throw new Error(`Could not inspect ${descriptor.route}`);
          const imageSignature = Array.from(liveDocument.querySelectorAll<HTMLImageElement>("img"))
            .filter((image) => !image.closest("[data-cms-runtime-ignore]") && !image.closest(".tso-mobile-drawer"))
            .map((image) => `${image.dataset.cmsImageKey || ""}|${image.currentSrc || image.getAttribute("src") || ""}|${image.alt || ""}`);
          const backgroundSignature = Array.from(liveDocument.querySelectorAll<HTMLElement>("[data-cms-image-key]"))
            .filter((element) => !(element instanceof HTMLImageElement))
            .map((element) => `${element.dataset.cmsImageKey || ""}|${backgroundImageUrl(element)}`);
          const signature = [...imageSignature, ...backgroundSignature].join("||");

          if (signature && signature === lastSignature) stableRounds += 1;
          else stableRounds = 0;
          lastSignature = signature;

          const timedOut = Date.now() - startedAt >= 7000;
          if (stableRounds >= 3 || timedOut) {
            const result = extractPageImages(descriptor, liveDocument, includeGlobal);
            window.clearTimeout(timeout);
            iframe.remove();
            resolve(result);
            return;
          }
          window.setTimeout(readWhenStable, 350);
        } catch (error) {
          window.clearTimeout(timeout);
          iframe.remove();
          reject(error);
        }
      };

      window.setTimeout(readWhenStable, 700);
    };
    iframe.onerror = () => {
      window.clearTimeout(timeout);
      iframe.remove();
      reject(new Error(`Could not open ${descriptor.route}`));
    };
    document.body.appendChild(iframe);
  });
}

export default function ImagesManagerPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [siteSettingsId, setSiteSettingsId] = useState<number | null>(null);
  const [activePage, setActivePage] = useState("home");
  const [activeSection, setActiveSection] = useState("all");
  const [productDetailOpen, setProductDetailOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => { void load(); }, []);

  async function load() {
    const [slotResult, productResult, categoryResult, settingsResult] = await Promise.all([
      supabase.from("cms_image_slots").select("*").eq("is_active", true).order("display_order"),
      supabase.from("products").select("id,title,slug,category,image,gallery,status,display_order,grain_type,packaging,packaging_type,sizes").order("display_order"),
      supabase.from("categories").select("id,name,slug,image,status,display_order").order("display_order"),
      supabase.from("site_settings").select("id,favicon_url,app_icon_url").limit(1).maybeSingle(),
    ]);
    const productRows = ((productResult.data || []) as ProductRow[]).filter((row) => row.slug);
    const publicProducts = publicProductDetailRows(productRows);
    const publicProductPageSlugs = new Set(publicProducts.map((product) => productPageSlug(product)));
    const categoryRows = ((categoryResult.data || []) as CategoryRow[]).filter((row) => row.slug);
    const databaseSlots = ((slotResult.data as Slot[]) || [])
      .filter((row) => row.is_active !== false)
      .filter(isCurrentStaticPageSlot)
      // Live/current manifest only: legacy/prototype rows and old Products
      // DOM-position slots never reappear, even before the next cleanup sync.
      .filter(isCurrentHomepageSlot)
      .filter(isCurrentProductsPageSlot)
      .filter(isCanonicalProductDetailImageSlot)
      .filter((row) => !productFromPageSlug(row.page_slug) || publicProductPageSlugs.has(row.page_slug));
    const icons = siteIconSlots(settingsResult.data?.favicon_url, settingsResult.data?.app_icon_url);
    const map = new Map(databaseSlots.map((slot) => [slotKey(slot), slot]));
    const footerArtwork = footerArtworkSlot(map.get("global:footer:mountain_artwork")?.current_url || "/mountains-bg.png");
    const existingFooterArtwork = map.get(slotKey(footerArtwork));
    map.set(slotKey(footerArtwork), existingFooterArtwork
      ? { ...footerArtwork, ...existingFooterArtwork, current_url: existingFooterArtwork.current_url || footerArtwork.current_url, is_active: true }
      : footerArtwork);
    derivedProductImageSlots(productRows).forEach((derived) => {
      const existing = map.get(slotKey(derived));
      const listing = derived.page_slug === "products" && derived.section_slug === "product_family"
        ? parseProductListingSlot(derived.slot_key)
        : null;
      const detailImage = Boolean(productFromPageSlug(derived.page_slug));
      const backedByDatabase = Boolean(listing && productRows.some((product) => product.slug === listing.productSlug));
      map.set(slotKey(derived), existing
        ? {
            ...derived,
            ...existing,
            // Product-detail media is intentionally independent from the Products listing.
            // Once the admin replaces a detail hero/gallery image, reloading the manager or
            // syncing the website must never overwrite it with products.image again.
            current_url: detailImage
              ? (existing.current_url || derived.current_url)
              : listing && !backedByDatabase
                ? (existing.current_url || derived.current_url)
                : derived.current_url,
            default_url: existing.default_url || derived.default_url,
            title: derived.title,
            alt_text: existing.alt_text || derived.alt_text,
            is_active: true,
          }
        : derived);
    });
    productFamilyHeroSlots(categoryRows).forEach((derived) => {
      const existing = map.get(slotKey(derived));
      map.set(slotKey(derived), existing
        ? { ...derived, ...existing, current_url: derived.current_url, default_url: existing.default_url || derived.default_url, is_active: derived.is_active }
        : derived);
    });
    homepageProductCardSlots().forEach((derived) => {
      const existing = map.get(slotKey(derived));
      map.set(slotKey(derived), existing
        ? { ...derived, ...existing, current_url: existing.current_url || derived.current_url, default_url: existing.default_url || derived.default_url, title: derived.title, is_active: existing.is_active !== false }
        : derived);
    });
    icons.forEach((icon) => {
      const existing = map.get(slotKey(icon));
      map.set(slotKey(icon), existing ? { ...icon, ...existing, current_url: icon.current_url } : icon);
    });
    setProducts(productRows);
    setSiteSettingsId(settingsResult.data?.id ?? null);
    setSlots(Array.from(map.values()));
  }

  async function refreshPageManifestFromLive(descriptor: PageDescriptor) {
    try {
      const captured = await inspectLivePage(descriptor, descriptor.pageSlug === "home");
      const pageCaptured = captured.filter((slot) => slot.page_slug === descriptor.pageSlug);
      const globalCaptured = captured.filter((slot) => slot.page_slug === "global");
      if (!pageCaptured.length) return;

      // Show the actual rendered page immediately. Database persistence happens
      // afterwards, so a temporary RLS/network issue can never make the manager
      // fall back to obsolete prototype slots.
      setSlots((items) => {
        const keep = items.filter((item) => item.page_slug !== descriptor.pageSlug);
        const map = new Map(keep.map((item) => [slotKey(item), item]));
        [...pageCaptured, ...globalCaptured].forEach((item) => map.set(slotKey(item), item));
        return Array.from(map.values());
      });

      const existingResult = await supabase.from("cms_image_slots").select("*").eq("page_slug", descriptor.pageSlug);
      if (existingResult.error) return;
      const existingRows = ((existingResult.data || []) as Slot[]);
      const existingMap = new Map(existingRows.map((item) => [slotKey(item), item]));
      const payload = pageCaptured.map((item) => {
        const existing = existingMap.get(slotKey(item));
        return {
          ...item,
          default_url: existing?.default_url || item.default_url,
          alt_text: existing?.alt_text || item.alt_text || "",
          is_active: true,
          updated_at: new Date().toISOString(),
        };
      });
      const upsert = await supabase.from("cms_image_slots").upsert(payload, { onConflict: "page_slug,section_slug,slot_key" });
      if (upsert.error) return;

      const liveKeys = new Set(payload.map((item) => slotKey(item)));
      const staleIds = existingRows.filter((row) => row.id && !liveKeys.has(slotKey(row))).map((row) => row.id as string | number);
      if (staleIds.length) {
        await supabase.from("cms_image_slots").update({ is_active: false, updated_at: new Date().toISOString() }).in("id", staleIds);
      }
    } catch {
      // Auto-refresh is a convenience layer. Manual Sync Website Images remains
      // available and reports any hard failure to the admin.
    }
  }

  useEffect(() => {
    if (syncing || !products.length) return;
    const descriptor = staticPages.find((item) => item.pageSlug === activePage);
    if (!descriptor || descriptor.pageSlug === "products" || descriptor.pageSlug === "global") return;
    const timer = window.setTimeout(() => { void refreshPageManifestFromLive(descriptor); }, 180);
    return () => window.clearTimeout(timer);
  }, [activePage, products.length, syncing]);

  function selectPage(pageSlug: string) {
    setActiveSection("all");
    setSearch("");
    setActivePage(pageSlug);
  }

  async function persistSlot(slot: Slot, patch: SlotPatch) {
    const next = { ...slot, ...patch, updated_at: new Date().toISOString() } as Slot & { updated_at: string };
    delete (next as Partial<Slot>).id;
    const { error } = await supabase.from("cms_image_slots").upsert(next, { onConflict: "page_slug,section_slug,slot_key" });
    if (error) throw new Error(error.message);

    const productFamilySlug = slot.page_slug === "products" && slot.section_slug === "hero"
      ? productFamilySlugByHeroSlot[slot.slot_key]
      : undefined;
    if (productFamilySlug && patch.current_url) {
      const result = await supabase
        .from("categories")
        .update({ image: patch.current_url })
        .eq("slug", productFamilySlug);
      if (result.error) throw new Error(result.error.message);
    }

    if (isSiteIconSlot(slot) && patch.current_url) {
      const column = slot.slot_key === "browser_favicon" ? "favicon_url" : "app_icon_url";
      const payload = { [column]: patch.current_url, updated_at: new Date().toISOString() };
      const result = siteSettingsId
        ? await supabase.from("site_settings").update(payload).eq("id", siteSettingsId)
        : await supabase.from("site_settings").insert({ site_name: "The Salt Origin", ...payload }).select("id").single();
      if (result.error) throw new Error(result.error.message);
      if (!siteSettingsId && "data" in result && result.data?.id) setSiteSettingsId(Number(result.data.id));
    }

    // Product detail hero/gallery images belong to cms_image_slots, not products.image.
    // This keeps the listing/card image and the detail-page media fully independent.


    const productListingMatch = slot.page_slug === "products" && slot.section_slug === "product_family"
      ? parseProductListingSlot(slot.slot_key)
      : null;
    if (productListingMatch && patch.current_url) {
      const result = await supabase
        .from("products")
        .update({ image: patch.current_url, updated_at: new Date().toISOString() })
        .eq("slug", productListingMatch.productSlug);
      if (result.error) throw new Error(result.error.message);
    }

    const privateLabelProductMatch = slot.page_slug === "private-label" && slot.section_slug === "range"
      ? /^product_(.+)_image$/.exec(slot.slot_key)
      : null;
    if (privateLabelProductMatch && patch.current_url) {
      const productSlug = privateLabelProductMatch[1];
      const result = await supabase.from("products").update({ image: patch.current_url, updated_at: new Date().toISOString() }).eq("slug", productSlug);
      if (result.error) throw new Error(result.error.message);
    }

    const blogPostMatch = slot.page_slug === "blog" && slot.section_slug === "listing"
      ? /^post_(.+)$/.exec(slot.slot_key)
      : null;
    if (blogPostMatch && patch.current_url) {
      const result = await supabase.from("blog_posts").update({ featured_image: patch.current_url }).eq("slug", blogPostMatch[1]);
      if (result.error) throw new Error(result.error.message);
    }

    setSlots((items) => items.map((item) =>
      slotKey(item) === slotKey(slot) ? { ...item, ...patch } : item
    ));
    window.dispatchEvent(new Event("salt-cms-updated"));
  }

  async function syncCurrentWebsite() {
    setSyncing(true);
    try {
      const [slotRows, productRows, categoryRows, settingsRows] = await Promise.all([
        supabase.from("cms_image_slots").select("*"),
        supabase.from("products").select("id,title,slug,category,image,gallery,status,display_order,grain_type,packaging,packaging_type,sizes").order("display_order"),
        supabase.from("categories").select("id,name,slug,image,status,display_order").order("display_order"),
        supabase.from("site_settings").select("id,favicon_url,app_icon_url").limit(1).maybeSingle(),
      ]);
      if (slotRows.error || productRows.error || categoryRows.error || settingsRows.error) {
        throw new Error(slotRows.error?.message || productRows.error?.message || categoryRows.error?.message || settingsRows.error?.message || "Image sync failed.");
      }

      const productList = ((productRows.data || []) as ProductRow[]).filter((row) => row.slug);
      const publicProducts = publicProductDetailRows(productList);
      const categoryList = ((categoryRows.data || []) as CategoryRow[]).filter((row) => row.slug);
      const descriptors: PageDescriptor[] = [
        ...staticPages.filter((item) => item.pageSlug !== "global"),
        ...publicProducts.map((product) => ({ pageSlug: productPageSlug(product), label: product.title, route: `/products/${product.slug}`, product })),
      ];

      const captured: Slot[] = [];
      const successfullyScannedPages = new Set<string>();
      let scanFailures = 0;
      for (let index = 0; index < descriptors.length; index += 4) {
        const batch = descriptors.slice(index, index + 4);
        const results = await Promise.allSettled(batch.map((descriptor) => inspectLivePage(descriptor, descriptor.pageSlug === "home")));
        results.forEach((result, resultIndex) => {
          const descriptor = batch[resultIndex];
          if (result.status === "fulfilled") {
            captured.push(...result.value);
            successfullyScannedPages.add(descriptor.pageSlug);
            if (descriptor.pageSlug === "home") successfullyScannedPages.add("global");
          } else scanFailures += 1;
        });
      }
      // Always add canonical product-owned images directly from the products table.
      // This makes product detail/main/gallery and Private Label product-card images reliable
      // even when lazy loading, an iframe viewport, or a client-side data fetch hides them from DOM scanning.
      captured.push(...derivedProductImageSlots(productList));
      // Product-family hero banners are category-owned data, so map all six directly
      // instead of relying on the single currently-rendered /products family.
      captured.push(...productFamilyHeroSlots(categoryList));
      captured.push(...siteIconSlots(settingsRows.data?.favicon_url, settingsRows.data?.app_icon_url));
      const existingFooterArtwork = ((slotRows.data as Slot[]) || []).find((row) =>
        row.page_slug === "global" && row.section_slug === "footer" && row.slot_key === "mountain_artwork"
      );
      captured.push(footerArtworkSlot(existingFooterArtwork?.current_url || "/mountains-bg.png"));

      const existingRows = (slotRows.data as Slot[]) || [];
      const existingMap = new Map(existingRows.map((row) => [slotKey(row), row]));
      const liveMap = new Map<string, Slot>();
      captured.forEach((item) => {
        const key = slotKey(item);
        const current = existingMap.get(key);
        const listing = item.page_slug === "products" && item.section_slug === "product_family"
          ? parseProductListingSlot(item.slot_key)
          : null;
        const detailImage = Boolean(productFromPageSlug(item.page_slug));
        const backedByDatabase = Boolean(listing && productList.some((product) => product.slug === listing.productSlug));
        liveMap.set(key, {
          ...item,
          default_url: current?.default_url || item.default_url,
          // Sync refreshes the manifest but never destroys an admin-selected detail-page image.
          current_url: detailImage
            ? (current?.current_url || item.current_url)
            : listing && !backedByDatabase
              ? (current?.current_url || item.current_url)
              : item.current_url,
          alt_text: current?.alt_text || item.alt_text || "",
          is_active: true,
        });
      });
      const payload = Array.from(liveMap.values()).map((item) => ({ ...item, updated_at: new Date().toISOString() }));
      if (payload.length) {
        const result = await supabase.from("cms_image_slots").upsert(payload, { onConflict: "page_slug,section_slug,slot_key" });
        if (result.error) throw new Error(result.error.message);
      }

      const liveKeys = new Set(liveMap.keys());
      // Products and public product-detail pages have canonical database-backed
      // manifests. Other pages are cleaned only when that page was actually
      // scanned successfully, so a temporary iframe/network failure can never
      // erase valid CMS image records.
      successfullyScannedPages.add("products");
      publicProducts.forEach((product) => successfullyScannedPages.add(productPageSlug(product)));
      const staleIds = existingRows
        .filter((row) => row.id && successfullyScannedPages.has(row.page_slug) && !liveKeys.has(slotKey(row)))
        .map((row) => row.id as string | number);
      if (staleIds.length) {
        const result = await supabase.from("cms_image_slots").update({ is_active: false, updated_at: new Date().toISOString() }).in("id", staleIds);
        if (result.error) throw new Error(result.error.message);
      }

      setProducts(productList);
      await load();
      window.dispatchEvent(new Event("salt-cms-updated"));
      alert(`Website image sync complete. ${liveMap.size} current image/icon slots were mapped section-by-section across ${descriptors.length} pages.${scanFailures ? ` ${scanFailures} page scan(s) could not be inspected, but product-owned images were still mapped directly from the products database.` : ""} Old unused slots are now inactive.`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Image synchronization failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function replace(slot: Slot, file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Maximum image size is 5MB.");
    const key = slotKey(slot);
    setUploading(key);
    try {
      const upload = await adminUpload(file, slot.slot_key.toLowerCase().includes("favicon") || slot.slot_key.toLowerCase().includes("icon") ? "favicon" : "website-image", { folder: `${slot.page_slug}/${slot.section_slug}`, filename: file.name });
      await persistSlot(slot, { current_url: upload.value, is_active: true });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(null);
    }
  }

  async function saveGeneratedImage(slot: Slot, image: string) {
    let url = image;
    if (image.startsWith("data:")) {
      const blob = await fetch(image).then((response) => response.blob());
      const upload = await adminUpload(blob, "website-image", { folder: `${slot.page_slug}/${slot.section_slug}`, filename: `${slot.slot_key}-ai.png` });
      url = upload.value;
    }
    await persistSlot(slot, { current_url: url, is_active: true });
  }

  async function generateWithAi(slot: Slot) {
    const key = slotKey(slot);
    setGenerating(key);
    try {
      const prompt = `Create a premium editorial product or brand image for The Salt Origin, an international Himalayan pink salt B2B brand. Website page: ${pageLabel(slot.page_slug, products)}. Section: ${sectionLabel(slot.page_slug, slot.section_slug)}. Image purpose: ${slot.title}. Alt text/context: ${slot.alt_text || "premium Himalayan pink salt"}. Match the approved New Theme: refined white and warm blush space, deep wine and charcoal details, elegant Himalayan cues, international luxury export presentation, photorealistic commercial photography, clean negative space, no visible text, no fake certifications, no watermarks, no unrelated logos.`;
      const response = await adminFetch("/api/ai/image", { method: "POST", body: JSON.stringify({ prompt, size: "1536x1024" }) });
      const data = await response.json();
      if (!response.ok || !data.image) throw new Error(data.error || "AI image generation failed.");
      await saveGeneratedImage(slot, String(data.image));
      alert("AI image created and saved to this live website slot.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "AI image generation failed.");
    } finally {
      setGenerating(null);
    }
  }

  async function reset(slot: Slot) {
    try { await persistSlot(slot, { current_url: slot.default_url, is_active: true }); }
    catch (error) { alert(error instanceof Error ? error.message : "Could not reset image."); }
  }

  async function toggleVisibility(slot: Slot) {
    if (isSiteIconSlot(slot)) {
      alert("Favicon and app icons are site identity assets. Replace or reset them instead of hiding them.");
      return;
    }
    try { await persistSlot(slot, { is_active: slot.is_active === false }); }
    catch (error) { alert(error instanceof Error ? error.message : "Could not update image visibility."); }
  }

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    slots.forEach((slot) => { result[slot.page_slug] = (result[slot.page_slug] || 0) + 1; });
    return result;
  }, [slots]);

  const publicProducts = useMemo(() => publicProductDetailRows(products), [products]);

  const productDetailCount = publicProducts.length;

  const productDetailGroups = useMemo(() => APPROVED_PRODUCT_CATEGORIES.map((family, familyIndex) => {
    const familyProducts = publicProducts.filter((product) => normalizeProductToken(product.category) === family.slug);
    const subgroupOrder = family.slug === "edible-salt"
      ? ["extra-fine-powder", "coarse"]
      : family.slug === "bulk-raw-salt"
        ? ["fine-powder", "coarse", "raw-salt"]
        : ["products"];
    const subgroups = subgroupOrder.map((subgroupSlug) => ({
      slug: subgroupSlug,
      label: productSubgroupManagerLabel(family.slug, subgroupSlug),
      products: familyProducts.filter((product) => listingSegment(product) === subgroupSlug),
    })).filter((group) => group.products.length);
    return { slug: family.slug, label: family.name, order: familyIndex, subgroups };
  }).filter((family) => family.subgroups.length), [publicProducts]);

  const activePageSlots = useMemo(() => slots.filter((slot) => slot.page_slug === activePage), [slots, activePage]);

  const groupOptions = useMemo(() => {
    const map = new Map<string, { key: string; label: string; order: number }>();
    activePageSlots.forEach((slot) => {
      const meta = managerGroupMeta(slot);
      if (!map.has(meta.key)) map.set(meta.key, meta);
    });
    return Array.from(map.values()).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  }, [activePageSlots]);

  const visible = useMemo(() => activePageSlots.filter((slot) => {
    const query = search.toLowerCase();
    const meta = managerGroupMeta(slot);
    return (activeSection === "all" || meta.key === activeSection) &&
      (!query || `${slot.title} ${meta.label} ${slot.slot_key} ${slot.alt_text || ""}`.toLowerCase().includes(query));
  }), [activePageSlots, activeSection, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, { key: string; label: string; order: number; rows: Slot[] }>();
    visible.forEach((slot) => {
      const meta = managerGroupMeta(slot);
      const group = map.get(meta.key) || { ...meta, rows: [] };
      group.rows.push(slot);
      map.set(meta.key, group);
    });
    return Array.from(map.values())
      .map((group) => ({ ...group, rows: group.rows.sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)) }))
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
  }, [visible]);

  return (
    <AdminShell>
      <div className="os-page legacy-unified-page images-manager-page space-y-5">
        <header className="os-page-header">
          <div>
            <div className="os-page-eyebrow">Website Visual Assets</div>
            <h1 className="os-page-title">Images Manager</h1>
            <p className="os-page-subtitle">Current rendered website is the source of truth. Every page is scanned section-by-section, stale legacy slots stay hidden, and product detail media remains independent from listing images.</p>
          </div>
          <div className="os-page-actions">
            <button onClick={syncCurrentWebsite} disabled={syncing} className="os-btn soft"><RefreshCw className={syncing ? "animate-spin" : ""}/>{syncing ? "Reading Live Website…" : "Sync Website Images"}</button>
            <a className="os-btn primary" href={routeFor(activePage)} target="_blank" rel="noreferrer"><ExternalLink/>Open Live Page</a>
          </div>
        </header>

        <div className="image-manager-shell rounded-[24px] border overflow-hidden">
          <div className="grid lg:grid-cols-[270px_1fr] min-h-[720px]">
            <aside className="image-manager-sidebar border-r p-4">
              <p className="image-manager-label">Website Pages</p>
              <div className="space-y-1">
                {staticPages.map((page) => (
                  <div key={page.pageSlug}>
                    <button onClick={() => selectPage(page.pageSlug)} className={`image-page-button w-full flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold ${activePage === page.pageSlug ? "active" : ""}`}>
                      <span>{page.label}</span><span className="image-count-chip">{counts[page.pageSlug] || 0}</span>
                    </button>
                    {page.pageSlug === "products" && (
                      <div className="image-product-detail-group">
                        <button type="button" className="image-product-detail-toggle" onClick={() => setProductDetailOpen((current) => !current)}>
                          <span>{productDetailOpen ? <ChevronDown/> : <ChevronRight/>}Product Detail Pages</span><b>{productDetailCount}</b>
                        </button>
                        {productDetailOpen && <div className="image-product-detail-list">
                          {productDetailGroups.map((family) => <div key={family.slug} className="image-product-family-group">
                            <div className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#a72d4b]">{family.label}</div>
                            {family.subgroups.map((subgroup) => <div key={`${family.slug}:${subgroup.slug}`}>
                              {(family.slug === "edible-salt" || family.slug === "bulk-raw-salt") && <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{subgroup.label}</div>}
                              <div className="image-product-subgroup-items">
                                {subgroup.products.map((product, productIndex) => {
                                  const slug = productPageSlug(product);
                                  const imageCount = counts[slug] || 0;
                                  return (
                                    <button
                                      type="button"
                                      key={`${family.slug}:${subgroup.slug}:${product.slug}:${product.id}`}
                                      onClick={() => selectPage(slug)}
                                      className={`image-product-detail-item ${activePage === slug ? "active" : ""}`}
                                    >
                                      <span className="image-product-detail-number">{String(productIndex + 1).padStart(2, "0")}</span>
                                      <span className="image-product-detail-name">{listingDisplayName(product)}</span>
                                      <small className="image-product-detail-count">{imageCount} img</small>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>)}
                          </div>)}
                        </div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="image-upload-note mt-7 rounded-2xl border p-4 text-xs leading-6"><strong>Section-wise workflow</strong><span>1. Select page<br/>2. Select its section<br/>3. Check the exact live image<br/>4. Upload / Replace<br/>5. Save is immediate<br/>6. Open Live Page to verify</span></div>
            </aside>

            <section className="p-4 lg:p-6 min-w-0">
              <div className="image-manager-toolbar">
                <div><div className="os-page-eyebrow">{productFromPageSlug(activePage) ? "Product Detail Page" : pageLabel(activePage, products)}</div><h2>{pageLabel(activePage, products)}</h2><p>{visible.length} current image slot{visible.length === 1 ? "" : "s"}</p></div>
                <div className="image-manager-tools">
                  <label className="os-search-field"><Search/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search image slots…"/></label>
                  <select className="os-field" value={activeSection} onChange={(event) => setActiveSection(event.target.value)}><option value="all">All sections</option>{groupOptions.map((group) => <option value={group.key} key={group.key}>{group.label}</option>)}</select>
                  <div className="os-segmented"><button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2/></button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view"><List/></button></div>
                </div>
              </div>

              <div className="image-manager-section-stack">
                {grouped.map((group) => (
                  <section className="image-manager-section-block" key={group.key}>
                    <div className="image-manager-section-heading"><div><span>{activePage === "products" && group.key.startsWith("family:") ? "Product Family" : "Page Section"}</span><h3>{group.label}</h3></div><b>{group.rows.length} image{group.rows.length === 1 ? "" : "s"}</b></div>
                    <div className={view === "grid" ? "image-slot-grid-live" : "space-y-4"}>
                      {group.rows.map((slot) => {
                        const key = slotKey(slot);
                        const preview = slot.current_url || slot.default_url;
                        const live = slot.is_active !== false;
                        return <article key={key} className={`image-slot-card-live ${view === "list" ? "is-list" : ""} ${live ? "" : "is-hidden"}`}>
                          <div className="image-live-preview">{preview ? <img src={preview} alt={slot.alt_text || slot.title}/> : <ImageIcon/>}<span className={`image-live-status ${live ? "live" : "hidden"}`}>{live ? <><Eye/>LIVE ON WEBSITE</> : <><EyeOff/>HIDDEN</>}</span></div>
                          <div className="image-slot-content"><div className="image-slot-heading"><div><small>{managerSlotContext(slot)}</small><h3>{slot.title}</h3></div><span>{slot.recommended_width} × {slot.recommended_height}px</span></div><label className="os-label"><span>Alt Text</span><input value={slot.alt_text || ""} onChange={(event) => setSlots((items) => items.map((item) => slotKey(item) === key ? { ...item, alt_text: event.target.value } : item))} onBlur={() => void persistSlot(slot, { alt_text: slots.find((item) => slotKey(item) === key)?.alt_text || "" })}/></label><div className="image-slot-actions-live"><label className="os-btn primary"><Upload/>{uploading === key ? "Uploading…" : "Upload / Replace"}<input type="file" accept="image/*,.ico" hidden disabled={generating === key} onChange={(event) => void replace(slot, event.target.files?.[0])}/></label><button className="os-btn soft" type="button" onClick={() => void generateWithAi(slot)} disabled={Boolean(generating) || uploading === key}><Sparkles className={generating === key ? "animate-pulse" : ""}/>{generating === key ? "Creating…" : "Create with AI"}</button><button className="os-btn soft" type="button" onClick={() => void toggleVisibility(slot)}>{live ? <EyeOff/> : <Eye/>}{live ? "Hide" : "Show"}</button><button className="os-btn soft" type="button" onClick={() => void reset(slot)} title="Reset to original"><RefreshCw/>Reset</button></div></div>
                        </article>;
                      })}
                    </div>
                  </section>
                ))}
              </div>
              {!visible.length && <div className="os-empty"><div className="os-empty-icon"><ImageIcon/></div><h3>No current images mapped for this page</h3><p>Run “Sync Website Images” once after installing this patch. It reads the actual live page and builds the section-wise map automatically.</p></div>}
            </section>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
