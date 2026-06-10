import Link from "next/link";
import {
  Globe2,
  ShieldCheck,
  Package,
  Factory,
  Target,
  Eye,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-[#FFF8F5]">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* HERO */}
        <div className="max-w-4xl">
          <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
            About The Salt Secrets
          </span>

          <h1 className="text-5xl lg:text-7xl font-black mt-4 text-[#07142B] leading-tight">
            Premium Himalayan
            <br />
            Pink Salt Exporter
          </h1>

          <p className="text-lg text-slate-600 mt-8 leading-relaxed">
            The Salt Secrets specializes in supplying premium Himalayan
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

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <div className="bg-white border border-[#EFE3E5] rounded-[30px] p-8 text-center">
            <h3 className="text-5xl font-black text-[#07142B]">
              50+
            </h3>

            <p className="text-slate-500 mt-3">
              Export Destinations
            </p>
          </div>

          <div className="bg-white border border-[#EFE3E5] rounded-[30px] p-8 text-center">
            <h3 className="text-5xl font-black text-[#07142B]">
              100%
            </h3>

            <p className="text-slate-500 mt-3">
              Natural Products
            </p>
          </div>

          <div className="bg-white border border-[#EFE3E5] rounded-[30px] p-8 text-center">
            <h3 className="text-5xl font-black text-[#07142B]">
              OEM
            </h3>

            <p className="text-slate-500 mt-3">
              Private Label Support
            </p>
          </div>
        </div>

        {/* WHY US */}
        <div className="mt-24">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-black text-[#07142B]">
              Why Businesses Choose Us
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8">
              <Factory className="w-8 h-8 text-[#C23B4A] mb-5" />

              <h3 className="font-bold text-xl text-[#07142B]">
                Manufacturing Network
              </h3>

              <p className="text-slate-600 mt-3">
                Reliable production partners and scalable supply capacity.
              </p>
            </div>

            <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8">
              <ShieldCheck className="w-8 h-8 text-[#C23B4A] mb-5" />

              <h3 className="font-bold text-xl text-[#07142B]">
                Quality Focus
              </h3>

              <p className="text-slate-600 mt-3">
                Strict quality standards and export-ready products.
              </p>
            </div>

            <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8">
              <Package className="w-8 h-8 text-[#C23B4A] mb-5" />

              <h3 className="font-bold text-xl text-[#07142B]">
                Private Label
              </h3>

              <p className="text-slate-600 mt-3">
                Flexible packaging and custom branding solutions.
              </p>
            </div>

            <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8">
              <Globe2 className="w-8 h-8 text-[#C23B4A] mb-5" />

              <h3 className="font-bold text-xl text-[#07142B]">
                Global Reach
              </h3>

              <p className="text-slate-600 mt-3">
                Serving importers and distributors worldwide.
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
        <div className="text-center mt-24">
          <h2 className="text-4xl font-black text-[#07142B]">
            Ready To Work With Us?
          </h2>

          <p className="text-slate-600 text-lg mt-4">
            Let's discuss your sourcing and private label requirements.
          </p>

          <Link
            href="/contact"
            className="inline-flex items-center mt-8 bg-[#C23B4A] text-white px-10 py-4 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Contact Us Today
          </Link>
        </div>
      </div>
    </div>
  );
}