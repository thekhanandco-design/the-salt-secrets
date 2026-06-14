import Link from "next/link";
import {
  Target,
  Eye,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-[#FFF8F5]">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* HERO */}
        <div className="max-w-4xl mx-auto text-center">
          <span className="uppercase tracking-[8px] text-[#C23B4A] font-black text-base">
            ABOUT US
          </span>

          <h1
            className="mt-4 text-[#07142B] font-black leading-[1.05]"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(2.8rem,4vw,4.5rem)",
            }}
          >
            Purity From The Himalayas,
            <br />
            Trust From The World.
          </h1>

          <p className="text-lg text-slate-600 mt-8 leading-relaxed">
            The Salt Origin specializes in supplying premium Himalayan
            Pink Salt products to importers, distributors, wholesalers,
            supermarkets and private label brands across international
            markets.
          </p>

          <p className="text-lg text-slate-600 mt-6 leading-relaxed">
            We focus on quality, reliability and long-term partnerships,
            helping buyers source export-ready Himalayan Pink Salt with
            confidence.
          </p>
        </div>

        {/* OUR STORY */}
        <div className="mt-24">
          <div className="bg-white border border-[#EFE3E5] rounded-[32px] p-10 lg:p-14">
            <div className="max-w-4xl mx-auto text-center">
              <span className="uppercase tracking-[8px] text-[#C23B4A] font-black text-sm">
                Our Story
              </span>

              <h2
                className="mt-4 text-[#07142B] font-black"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(2rem,3vw,3.5rem)",
                }}
              >
                Built On Trust, Quality
                <br />
                And Long-Term Relationships
              </h2>

              <p className="text-slate-600 text-lg leading-relaxed mt-8">
                The Salt Origin was established with a vision to connect
                international buyers with premium Himalayan Pink Salt
                products sourced with consistency, quality and care.
              </p>

              <p className="text-slate-600 text-lg leading-relaxed mt-6">
                Over the years, we have focused on building reliable
                sourcing networks, maintaining quality standards and
                helping importers, wholesalers and private label brands
                confidently grow their businesses.
              </p>

              <p className="text-slate-600 text-lg leading-relaxed mt-6">
                Today, our mission remains simple — provide premium
                products, dependable service and long-term value for
                customers around the world.
              </p>
            </div>
          </div>
        </div>

        {/* MISSION & VISION */}
        <div className="grid lg:grid-cols-2 gap-8 mt-24">
          <div className="bg-white border border-[#EFE3E5] rounded-[32px] p-10">
            <Target className="w-10 h-10 text-[#C23B4A] mb-6" />

            <h3 className="text-3xl font-black text-[#07142B] mb-4">
              Our Mission
            </h3>

            <p className="text-slate-600 leading-relaxed">
              To provide premium Himalayan Pink Salt products with
              dependable service, export expertise and long-term value
              for customers around the world.
            </p>
          </div>

          <div className="bg-white border border-[#EFE3E5] rounded-[32px] p-10">
            <Eye className="w-10 h-10 text-[#C23B4A] mb-6" />

            <h3 className="text-3xl font-black text-[#07142B] mb-4">
              Our Vision
            </h3>

            <p className="text-slate-600 leading-relaxed">
              To become a trusted international supplier of Himalayan
              Pink Salt and private label solutions for retailers,
              distributors and brands globally.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24">
          <div className="bg-[#C23B4A] rounded-[32px] p-10 lg:p-14 text-center text-white">
            <h2
              className="font-black"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2rem,3vw,3.5rem)",
              }}
            >
              Ready To Work With Us?
            </h2>

            <p className="mt-4 text-white/90 text-lg max-w-2xl mx-auto">
              Let's discuss your sourcing and private label requirements.
              Our team is ready to assist you.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/contact"
                className="bg-white text-[#C23B4A] px-8 py-4 rounded-xl font-bold hover:opacity-90 transition"
              >
                Get Quote
              </Link>

              <Link
                href="https://wa.me/923462771693"
                target="_blank"
                className="border border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-[#C23B4A] transition"
              >
                WhatsApp Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}