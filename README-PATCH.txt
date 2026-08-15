THE SALT ORIGIN — V7.4 PRIVATE LABEL + PRODUCT DETAIL FINAL PATCH

BASE:
Apply this on top of your current V7.3 / V7.2.1 project.

HOW TO APPLY:
1. Close the dev server.
2. Extract this ZIP.
3. Copy the included src folder into your project root.
4. Choose Replace / Overwrite when Windows asks.
5. Do NOT replace or delete .env.local.
6. Run:
   npm run build

FILES REPLACED / ADDED:
- src/app/private-label/page.tsx
- src/app/private-label/PrivateLabel.module.css
- src/app/products/[slug]/page.tsx
- src/app/admin/products/[id]/page.tsx
- src/app/globals.css
- src/lib/cms-registry.ts
- src/lib/product-page-layout.ts (NEW)

PRIVATE LABEL CHANGES:
- Hero now uses one banner image only: /hero-banner.png.
- The previous stacked sacks / small salt accent are removed from the hero.
- Hero features use a wider icon + heading layout.
- Packaging Studio, product range, workflow and workspace use the same Cormorant Garamond + Inter typography system.
- Private Label catalog is displayed in two separate groups:
  1) Extra Fine Powder
  2) Coarse
- Each Private Label product now has View Details linking to its dynamic product detail page.
- Hero banner remains replaceable through Images Manager because the existing private-label hero image slot uses /hero-banner.png.

PRODUCT DETAIL PAGE CHANGES:
- Every active product uses the same screenshot-aligned product detail layout automatically.
- Main hero: image, product title, description, Origin, Available Sizes, Grain Type, Packaging Type, MOQ and HS Code.
- Default page sections: Hero, Buyer Benefits, Marketplaces, How It Works, Technical Specifications, Features & Applications.
- Documents, Gallery, Why Buy and Bottom CTA are available but hidden by default.
- CMS path:
  Product Pages -> choose product -> Edit Page
- Each product page now has Page Sections controls:
  Show / Hide
  Move Up
  Move Down
  Remove from page
  Restore removed section
- Product content, product image, specs, CTA labels, marketplace text, process steps and optional partnership cards are editable per product.
- Product status still controls whether the public detail URL is live.

NOTE:
If an older product already has page_content settings, the new layout safely normalizes the old settings and preserves existing labels where possible.
