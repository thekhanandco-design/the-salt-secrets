import Image from "next/image";
import Link from "next/link";
import {
  Tags,
  Package,
  Factory,
  Globe2,
} from "lucide-react";

export default function PrivateLabel() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* IMAGE */}
          <div className="order-2 lg:order-1">
            <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[36px] p-8">
              <Image
                src="/product-5.png"
                alt="Private Label Himalayan Pink Salt"
                width={900}
                height={900}
                className="w-full h-[500px] object-contain"
              />
            </div>
          </div>

          {/* CONTENT */}
          <div className="order-1 lg:order-2">
            <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
              Private Label Solutions
            </span>

            <h2 className="text-4xl lg:text-5xl font-black mt-4 text-[#07142B] leading-tight">
              Launch Your Own
              <br />
              Himalayan Salt Brand
            </h2>

            <p className="text-slate-600 text-lg mt-6 leading-relaxed">
              We help importers, distributors and retailers create their own
              Himalayan Pink Salt brand with custom packaging, labeling,
              manufacturing and export support.
            </p>

            {/* FEATURES */}
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-5">
                <Tags className="w-6 h-6 text-[#C23B4A] mb-3" />
                <h3 className="font-bold text-[#07142B]">
                  Custom Labels
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Personalized branding solutions.
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-5">
                <Package className="w-6 h-6 text-[#C23B4A] mb-3" />
                <h3 className="font-bold text-[#07142B]">
                  Retail Packaging
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Premium shelf-ready packaging.
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-5">
                <Factory className="w-6 h-6 text-[#C23B4A] mb-3" />
                <h3 className="font-bold text-[#07142B]">
                  OEM Manufacturing
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Reliable production capacity.
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-5">
                <Globe2 className="w-6 h-6 text-[#C23B4A] mb-3" />
                <h3 className="font-bold text-[#07142B]">
                  Global Export
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Worldwide logistics support.
                </p>
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <h3 className="text-3xl font-black text-[#07142B]">
                  OEM
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manufacturing
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-3xl font-black text-[#07142B]">
                  MOQ
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Available
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-3xl font-black text-[#07142B]">
                  50+
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Markets
                </p>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center mt-10 bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Request Private Label Quote
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}