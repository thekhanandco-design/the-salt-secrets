import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Himalayan Pink Salt Blog | The Salt Origin",
  description: "Latest insights on Himalayan Pink Salt, private label packaging, sourcing, retail and bulk export.",
};

type BlogPost = { id: number; title: string; slug: string; excerpt: string; featured_image: string; published_at: string; created_at: string };

export default async function BlogPage() {
  const { data } = await supabase.from("blog_posts").select("id,title,slug,excerpt,featured_image,published_at,created_at").eq("status", "published").order("published_at", { ascending: false });
  const posts = (data as BlogPost[]) || [];
  const [latest, ...older] = posts;

  return (
    <main className="bg-[#FFF8F5] min-h-screen">
      <section className="max-w-[1450px] mx-auto px-6 lg:px-12 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <p className="uppercase tracking-[7px] text-[#C23B4A] font-black text-sm">Knowledge Center</p>
          <h1 className="mt-4 text-[#081325] font-black" style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2.8rem,5vw,5rem)" }}>The Salt Origin Blog</h1>
          <p className="mt-5 text-lg text-slate-600">Industry insights, sourcing guidance and private label ideas for global salt buyers.</p>
        </div>

        {latest ? (
          <article className="mt-14 grid lg:grid-cols-2 gap-8 bg-white border border-[#EFE3E5] rounded-[32px] overflow-hidden">
            <div className="min-h-[360px] bg-[#FFF2F4] flex items-center justify-center">
              {latest.featured_image ? <img src={latest.featured_image} alt={latest.title} className="w-full h-full object-cover" /> : <Image src="/hero-products.png" alt={latest.title} width={900} height={600} className="w-full h-full object-contain p-10" />}
            </div>
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <p className="text-[#C23B4A] font-black uppercase tracking-[3px] text-xs">Latest Article</p>
              <h2 className="text-4xl font-black text-[#081325] mt-4">{latest.title}</h2>
              <p className="text-slate-600 mt-5 leading-relaxed">{latest.excerpt}</p>
              <p className="text-sm text-slate-400 mt-5">{new Date(latest.published_at || latest.created_at).toLocaleDateString()}</p>
              <Link href={`/blog/${latest.slug}`} className="mt-7 inline-flex w-fit rounded-xl bg-[#C23B4A] text-white px-6 py-3 font-black">Read Article</Link>
            </div>
          </article>
        ) : <div className="mt-14 rounded-[28px] bg-white p-10 text-center border border-[#EFE3E5]">No published blogs yet.</div>}

        {older.length > 0 && <>
          <div className="flex items-center gap-4 mt-16"><span className="h-px flex-1 bg-[#E8C8CD]" /><h2 className="text-2xl font-black text-[#081325]">Older Articles</h2><span className="h-px flex-1 bg-[#E8C8CD]" /></div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-7 mt-8">
            {older.map((post) => <article key={post.id} className="bg-white rounded-[24px] border border-[#EFE3E5] overflow-hidden"><div className="h-56 bg-[#FFF2F4]">{post.featured_image && <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />}</div><div className="p-6"><p className="text-xs text-slate-400">{new Date(post.published_at || post.created_at).toLocaleDateString()}</p><h3 className="text-2xl font-black text-[#081325] mt-3">{post.title}</h3><p className="text-slate-600 mt-3 line-clamp-3">{post.excerpt}</p><Link href={`/blog/${post.slug}`} className="inline-flex mt-5 text-[#C23B4A] font-black">Read More →</Link></div></article>)}
          </div>
        </>}
      </section>
    </main>
  );
}
