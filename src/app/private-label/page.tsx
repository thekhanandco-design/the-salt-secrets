"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Box, Boxes, Globe2, Package, Palette, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { PRIVATE_LABEL_PRODUCTS, type PrivateLabelProductSeed } from "@/lib/private-label-catalog";
import styles from "./PrivateLabel.module.css";
import { useCmsImageAltResolver, useCmsImageResolver } from "@/components/CmsImageManifestProvider";

type Product = Omit<PrivateLabelProductSeed, "status"> & { id?: number; status?: string | null };
type Grain = "Extra Fine Powder" | "Coarse (2–5mm)";

const formatCards = [
  [ShoppingBag, "pouches", "Pouches", "Stand-up & gusseted pouches"],
  [Package, "jars", "Jars", "Round & square jars with spoon"],
  [Boxes, "bottles", "Bottles", "Shakers & PET bottles"],
  [Box, "grinders", "Grinders", "Plastic, ceramic & glass grinders"],
  [Package, "bulk", "Bulk", "Commercial & export formats"],
] as const;

const workflow = [
  ["01", "Brief", "Market, product, pack size, target volume and deadline."],
  ["02", "Specification", "Grain, packaging materials and quality requirements."],
  ["03", "Artwork", "Brand files, label panel structure and approvals."],
  ["04", "Production", "Final commercial approval, packing and dispatch."],
] as const;

const workspace = [
  ["artwork", "Artwork Upload", "Share logo, dieline and brand guidelines."],
  ["moq", "MOQ Planning", "Match packaging format with commercial volume."],
  ["sample", "Sample Request", "Request product or packaging samples before production."],
  ["quote", "Quote Portal", "Review quotations, revisions and approved documents."],
] as const;

function cmsKey(section: string, field: string) {
  return `private-label.${section}.${field}`;
}

export default function PrivateLabelPage() {
  const cmsImage = useCmsImageResolver();
  const cmsImageAlt = useCmsImageAltResolver();
  const [products, setProducts] = useState<Product[]>(PRIVATE_LABEL_PRODUCTS);

  useEffect(() => {
    let active = true;
    void supabase
      .from("products")
      .select("id,title,slug,subtitle,category,description,short_description,image,moq,packaging,status,grain_type,sizes,packaging_type,best_for,features,applications,specifications,featured,display_order,seo_title,seo_description")
      .eq("category", "private-label-packaging")
      .order("display_order")
      .then(({ data, error }) => {
        if (!active || error || !data?.length) return;
        setProducts((data as Product[]).filter((item) => item.status === "active" || item.status === "published"));
      });
    return () => { active = false; };
  }, []);

  const groups = useMemo(
    () => (["Extra Fine Powder", "Coarse (2–5mm)"] as Grain[]).map((grain) => ({
      grain,
      title: grain === "Extra Fine Powder" ? "Extra Fine Powder" : "Coarse",
      products: products.filter((item) => item.grain_type === grain),
    })),
    [products],
  );

  return (
    <main className={styles.page}>
      <section className={styles.hero} data-cms-section="hero">
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.crumbs} data-cms-key={cmsKey("hero", "crumbs")}>HOME / PRIVATE LABEL</div>
            <h1>
              <span data-cms-key={cmsKey("hero", "title_main")}>Your brand. Our </span>
              <em data-cms-key={cmsKey("hero", "title_accent")}>origin.</em>
            </h1>
            <p className={styles.lead} data-cms-key={cmsKey("hero", "description_current")}>Premium private-label Himalayan pink salt solutions crafted to reflect your brand and meet your market needs.</p>

            <div className={styles.benefits}>
              <div className={styles.benefit}>
                <div className={styles.benefitTitle}><Palette/><strong data-cms-key={cmsKey("hero", "feature_1_title")}>Custom Branding</strong></div>
                <span data-cms-key={cmsKey("hero", "feature_1_text")}>Your logo, identity and label direction.</span>
              </div>
              <div className={styles.benefit}>
                <div className={styles.benefitTitle}><Package/><strong data-cms-key={cmsKey("hero", "feature_2_title")}>Wide Packaging Range</strong></div>
                <span data-cms-key={cmsKey("hero", "feature_2_text")}>Pouches, jars, bottles and grinders.</span>
              </div>
              <div className={styles.benefit}>
                <div className={styles.benefitTitle}><BadgeCheck/><strong data-cms-key={cmsKey("hero", "feature_3_title")}>Market-Ready Quality</strong></div>
                <span data-cms-key={cmsKey("hero", "feature_3_text")}>Food-grade, consistent and reliable.</span>
              </div>
              <div className={styles.benefit}>
                <div className={styles.benefitTitle}><Globe2/><strong data-cms-key={cmsKey("hero", "feature_4_title")}>Global Supply</strong></div>
                <span data-cms-key={cmsKey("hero", "feature_4_text")}>Export planning for international markets.</span>
              </div>
            </div>

            <Link className={`${styles.button} ${styles.primary}`} href="/contact" data-cms-key={cmsKey("hero", "quote_button")}>Start Your Private Label Quote</Link>
          </div>

          <div className={styles.heroBannerWrap}>
            <Image data-cms-image-key="private-label.hero.salt_accent" className={styles.heroBanner} src={cmsImage("private-label.hero.salt_accent", "/hero-banner.png")} alt={cmsImageAlt("private-label.hero.salt_accent", "Himalayan pink salt private label banner")} width={1600} height={900} priority unoptimized />
          </div>
        </div>
      </section>

      <section className={styles.studio} data-cms-section="studio">
        <div className={`${styles.container} ${styles.studioGrid}`}>
          <div className={styles.studioVisual}>
            <span className={styles.visualBadge}>Interactive Packaging</span>
            <Image data-cms-image-key="private-label.studio.packaging_visual" src={cmsImage("private-label.studio.packaging_visual", "/custom-packaging.png")} alt={cmsImageAlt("private-label.studio.packaging_visual", "Private label packaging formats")} width={1100} height={900} unoptimized />
          </div>
          <div className={styles.studioCopy}>
            <div className={styles.eyebrow} data-cms-key={cmsKey("studio", "eyebrow")}>Packaging Studio</div>
            <h2><span data-cms-key={cmsKey("studio", "title_main")}>Choose the format your market </span><em data-cms-key={cmsKey("studio", "title_accent")}>expects.</em></h2>
            <p data-cms-key={cmsKey("studio", "description")}>Select from a focused range of private-label packaging formats designed for retail, distribution and export programs.</p>
            <div className={styles.formatGrid}>
              {formatCards.map(([Icon, key, title, copy]) => (
                <article className={styles.formatCard} key={key}>
                  <Icon/>
                  <b data-cms-key={cmsKey("studio", `${key}_title`)}>{title}</b>
                  <span data-cms-key={cmsKey("studio", `${key}_text`)}>{copy}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.range} data-cms-section="range">
        <div className={styles.container}>
          <div className={styles.rangeHead}>
            <div className={styles.eyebrow} data-cms-key={cmsKey("range", "eyebrow")}>Our Private Label Range</div>
            <h2><span data-cms-key={cmsKey("range", "title_main")}>Packaging options for </span><em data-cms-key={cmsKey("range", "title_accent")}>every market.</em></h2>
            <p data-cms-key={cmsKey("range", "description")}>Choose the salt form and packaging format that best fits your retail, distributor or private-label program.</p>
          </div>

          {groups.map((group) => (
            <div className={styles.productGroup} key={group.grain}>
              <div className={styles.productGroupHeading}>
                <span>{group.grain === "Extra Fine Powder" ? "Fine Grain Collection" : "Coarse Grain Collection"}</span>
                <h3>{group.title}</h3>
              </div>
              <div className={styles.productGrid}>
                {group.products.length ? group.products.map((product, index) => {
                  const sizes = String(product.sizes || "").split(/[·,]/).map((item) => item.trim()).filter(Boolean);
                  return (
                    <article className={styles.productCard} key={product.slug}>
                      <div className={styles.productImage}><Image data-cms-image-key={`private-label.range.product_${product.slug}_image`} src={cmsImage(`private-label.range.product_${product.slug}_image`, product.image || "/white-sack.png")} alt={cmsImageAlt(`private-label.range.product_${product.slug}_image`, product.title)} width={700} height={700}/></div>
                      <div className={styles.productBody}>
                        <span className={styles.productIndex}>{String(index + 1).padStart(2, "0")}</span>
                        <h3>{product.title}</h3>
                        <div className={styles.sizes}>{sizes.map((size) => <span key={size}>{size}</span>)}</div>
                        <div className={styles.productMeta}>{product.packaging_type || product.packaging}</div>
                        <Link className={styles.productLink} href={`/products/${product.slug}`}>View Details →</Link>
                      </div>
                    </article>
                  );
                }) : <div className={styles.empty}>No visible private-label formats in this group.</div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.workflow} data-cms-section="workflow">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <div className={styles.eyebrow} data-cms-key={cmsKey("workflow", "eyebrow")}>Private Label Workflow</div>
            <h2><span data-cms-key={cmsKey("workflow", "title_main")}>From concept to </span><em data-cms-key={cmsKey("workflow", "title_accent")}>production-ready.</em></h2>
            <p data-cms-key={cmsKey("workflow", "description")}>A clear commercial path keeps packaging, specification and approvals moving efficiently.</p>
          </div>
          <div className={styles.steps}>{workflow.map(([number, title, copy], index) => <article className={styles.step} key={number}><span>{number}</span><h3 data-cms-key={cmsKey("workflow", ["brief_title","spec_title","artwork_title","production_title"][index])}>{title}</h3><p data-cms-key={cmsKey("workflow", ["brief_text","spec_text","artwork_text","production_text"][index])}>{copy}</p></article>)}</div>
        </div>
      </section>

      <section className={styles.workspace} data-cms-section="workspace">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <div className={styles.eyebrow} data-cms-key={cmsKey("workspace", "eyebrow")}>Buyer Workspace</div>
            <h2><span data-cms-key={cmsKey("workspace", "title_main")}>Build a complete </span><em data-cms-key={cmsKey("workspace", "title_accent")}>private-label brief.</em></h2>
            <p data-cms-key={cmsKey("workspace", "description")}>Prepare the inputs your sales and production teams need before commercial approval.</p>
          </div>
          <div className={styles.workspaceGrid}>{workspace.map(([key, title, copy]) => <article className={styles.workspaceCard} key={key}><h3 data-cms-key={cmsKey("workspace", `${key}_title`)}>{title}</h3><p data-cms-key={cmsKey("workspace", `${key}_text`)}>{copy}</p><Link href="/contact" data-cms-key={cmsKey("workspace", "link_label")}>Start request →</Link></article>)}</div>
        </div>
      </section>

      <section className={styles.cta} data-cms-section="cta">
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <div><h2 data-cms-key={cmsKey("cta", "title_current")}>Ready to build your private-label salt range?</h2><p data-cms-key={cmsKey("cta", "description_current")}>Share your target market, packaging format and expected volume.</p></div>
            <Link href="/contact" className={`${styles.button} ${styles.secondary}`} data-cms-key={cmsKey("cta", "button")}>Start Private Label Quote</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
