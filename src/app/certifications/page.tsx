"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FACILITY_CERTIFICATIONS, certificationMatches } from "@/lib/certification-catalog";
import { useCmsImageAltResolver, useCmsImageResolver } from "@/components/CmsImageManifestProvider";

type Cert = {
  id: string;
  document_name: string;
  category: string;
  file_url?: string | null;
  status?: string | null;
  visibility?: string | null;
};

export default function CertificationsPage() {
  const cmsImage = useCmsImageResolver();
  const cmsImageAlt = useCmsImageAltResolver();
  const [certs, setCerts] = useState<Cert[]>([]);

  useEffect(() => {
    void supabase
      .from("public_certifications")
      .select("id,document_name,category,status,visibility")
      .order("created_at")
      .then(({ data }) => setCerts((data || []) as Cert[]));
  }, []);

  const items = useMemo(
    () => FACILITY_CERTIFICATIONS.map((item) => ({
      ...item,
      record: certs.find((cert) => certificationMatches(cert, item)),
    })).filter((item) => String(item.record?.visibility || "Public").toLowerCase() !== "hidden"),
    [certs],
  );

  return (
    <main className="tso-route-page tso-certifications-page">
      <section className="tso-page-hero" data-cms-section="hero">
        <div className="tso-public-container tso-page-hero-grid">
          <div>
            <div className="tso-crumbs">HOME / CERTIFICATIONS</div>
            <h1>Quality you can <em>verify.</em></h1>
            <p>Our Himalayan pink salt products are manufactured and packed through certified facilities, with supporting documents available for qualified buyer review.</p>
          </div>
        </div>
      </section>

      <section className="tso-route-section" data-cms-section="documents">
        <div className="tso-public-container">
          <div className="tso-section-head tso-certification-public-head">
            <div>
              <div className="tso-eyebrow">Certified Manufacturing &amp; Packing Facility</div>
              <h2>Facility documentation, <em>organized.</em></h2>
              <p>The Salt Origin works with certified manufacturing and packing facilities. The documents below relate to the facility and supporting production/compliance systems, not a claim that every certification is issued directly to The Salt Origin.</p>
            </div>
          </div>

          <div className="tso-cert-grid-public tso-cert-grid-public--logos">
            {items.map((item) => (
              <article key={item.key} className="tso-cert-public-card">
                <div className="tso-cert-logo-wrap">
                  <Image data-cms-image-key={`certifications.documents.${item.key}`} src={cmsImage(`certifications.documents.${item.key}`, item.image)} alt={cmsImageAlt(`certifications.documents.${item.key}`, `${item.name} certification logo`)} width={160} height={110} unoptimized />
                </div>
                <h3>{item.record?.document_name || item.name}</h3>
                <p>{item.description}</p>
                <span className="tso-cert-access-note">Available through approved document access</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
