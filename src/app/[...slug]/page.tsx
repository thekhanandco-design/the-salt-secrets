import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Params = Promise<{ slug: string[] }>;
type PageRecord = { page_slug: string; content: Record<string, unknown> | null };

function cleanSlug(parts: string[]) {
  return parts.map(part => decodeURIComponent(part).trim()).filter(Boolean).join("/");
}

async function readDynamicPage(slug: string) {
  const [{ data: page }, { data: seo }] = await Promise.all([
    supabase.from("page_content").select("page_slug,content").eq("page_slug", slug).maybeSingle(),
    supabase.from("seo_settings").select("meta_title,meta_description,canonical_url,og_title,og_description,og_image").eq("page_slug", slug).maybeSingle(),
  ]);
  return { page: page as PageRecord | null, seo };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug: parts } = await params;
  const slug = cleanSlug(parts);
  const { page, seo } = await readDynamicPage(slug);
  const content = page?.content || {};
  if (!page || String(content.status || "").toLowerCase() !== "published") return {};
  const title = String(seo?.meta_title || content.title || slug);
  const description = String(seo?.meta_description || content.introduction || "").slice(0, 200);
  return {
    title,
    description,
    alternates: seo?.canonical_url ? { canonical: String(seo.canonical_url) } : undefined,
    openGraph: {
      title: String(seo?.og_title || title),
      description: String(seo?.og_description || description),
      images: seo?.og_image ? [String(seo.og_image)] : undefined,
    },
  };
}

export default async function DynamicCmsPage({ params }: { params: Params }) {
  const { slug: parts } = await params;
  const slug = cleanSlug(parts);
  const { page } = await readDynamicPage(slug);
  const content = page?.content || {};
  if (!page || String(content.status || "").toLowerCase() !== "published") notFound();

  const title = String(content.heading || content.title || slug.replaceAll("-", " "));
  const introduction = String(content.introduction || "").trim();
  const body = String(content.body || "").trim();
  const paragraphs = body.split(/\n{2,}/).map(value => value.trim()).filter(Boolean);

  return (
    <main className="dynamic-cms-page">
      <section className="dynamic-cms-hero">
        <div className="dynamic-cms-inner">
          <span>THE SALT ORIGIN</span>
          <h1>{title}</h1>
          {introduction ? <p>{introduction}</p> : null}
        </div>
      </section>
      <section className="dynamic-cms-content">
        <div className="dynamic-cms-inner">
          {paragraphs.length ? paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 20)}`}>{paragraph}</p>) : <p>This published page has no body content yet.</p>}
        </div>
      </section>
      <style>{`
        .dynamic-cms-page{background:#fff;color:#17202a;min-height:65vh}
        .dynamic-cms-inner{width:min(1080px,calc(100% - 40px));margin:0 auto}
        .dynamic-cms-hero{padding:110px 0 70px;background:linear-gradient(145deg,#fff8fa 0%,#fff 58%,#f8f9fb 100%);border-bottom:1px solid #f1dce4}
        .dynamic-cms-hero span{display:block;color:#d94c75;font-size:12px;font-weight:800;letter-spacing:.22em;margin-bottom:18px}
        .dynamic-cms-hero h1{max-width:850px;font-size:clamp(38px,6vw,72px);line-height:1.02;letter-spacing:-.045em;margin:0}
        .dynamic-cms-hero p{max-width:760px;color:#667085;font-size:18px;line-height:1.75;margin:24px 0 0}
        .dynamic-cms-content{padding:64px 0 96px}
        .dynamic-cms-content .dynamic-cms-inner{max-width:850px}
        .dynamic-cms-content p{font-size:17px;line-height:1.86;color:#374151;margin:0 0 24px}
        @media(max-width:700px){.dynamic-cms-hero{padding:74px 0 50px}.dynamic-cms-content{padding:44px 0 72px}.dynamic-cms-inner{width:min(100% - 28px,1080px)}}
      `}</style>
    </main>
  );
}
