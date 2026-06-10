import Image from "next/image";
import Link from "next/link";
import {
  Leaf,
  FlaskConical,
  Truck,
  PackageCheck,
  Factory,
  FileText,
  ShieldCheck,
  Globe,
  Tags,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-[#fff8f5]">
      <div className="max-w-7xl mx-auto px-5 lg:px-6 pt-12 pb-0">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* LEFT */}
          <div>
            <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
              Premium Himalayan Pink Salt
            </span>

            <h1 className="mt-5 text-5xl md:text-6xl lg:text-7xl leading-[0.95] font-black text-[#07142B]">
              Pure. Natural.
              <br />
              <span className="text-[#C23B4A]">
                Globally Trusted.
              </span>
            </h1>

            <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-xl">
              Leading manufacturer and exporter of 100% natural Himalayan
              Pink Salt products for retail, wholesale, supermarkets and
              private label brands worldwide.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                href="/products"
                className="bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Explore Products →
              </Link>

              <Link
                href="/contact"
                className="bg-white border border-[#E8D2D6] text-slate-900 px-8 py-4 rounded-xl font-semibold hover:bg-[#fff4f6] transition"
              >
                Get Quote →
              </Link>
            </div>
          </div>

          {/* RIGHT BANNER */}
          <div>
            <Image
              src="/hero-banner.png"
              alt="Premium Himalayan Pink Salt"
              width={1400}
              height={900}
              priority
              className="w-full h-[520px] object-contain"
            />
          </div>
        </div>

        {/* TRUST STRIP */}
        <div className="bg-white border border-[#EEDDE1] rounded-t-[24px] mt-10 overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            <div className="px-6 py-3 text-center border-r border-b lg:border-b-0 border-[#EEDDE1]">
              <Leaf className="w-6 h-6 mx-auto mb-2 text-[#C23B4A]" />

              <h3 className="font-semibold text-base">
                100% Natural
              </h3>

              <p className="text-sm text-slate-500">
                No Additives
              </p>
            </div>

            <div className="px-6 py-3 text-center border-r border-b lg:border-b-0 border-[#EEDDE1]">
              <FlaskConical className="w-6 h-6 mx-auto mb-2 text-[#C23B4A]" />

              <h3 className="font-semibold text-base">
                Lab Tested
              </h3>

              <p className="text-sm text-slate-500">
                Premium Quality
              </p>
            </div>

            <div className="px-6 py-3 text-center border-r border-[#EEDDE1]">
              <Truck className="w-6 h-6 mx-auto mb-2 text-[#C23B4A]" />

              <h3 className="font-semibold text-base">
                On-Time Delivery
              </h3>

              <p className="text-sm text-slate-500">
                Worldwide
              </p>
            </div>

            <div className="px-6 py-3 text-center">
              <PackageCheck className="w-6 h-6 mx-auto mb-2 text-[#C23B4A]" />

              <h3 className="font-semibold text-base">
                Private Label
              </h3>

              <p className="text-sm text-slate-500">
                Custom Packaging
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DARK STRIP */}
      <div className="bg-[#081528]">
        <div className="max-w-7xl mx-auto px-5 lg:px-6">
          <div className="grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-700">
            <div className="p-5 text-center text-white">
              <Factory className="w-7 h-7 mx-auto mb-2 text-[#C23B4A]" />

              <h3 className="font-bold uppercase text-sm">
                Manufacturer
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Direct Factory Pricing
              </p>
            </div>

            <div className="p-5 text-center text-white">
              <FileText className="w-7 h-7 mx-auto mb-2 text-[#C23B4A]" />

              <h3 className="font-bold uppercase text-sm">
                Export Expertise
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Documentation Support
              </p>
            </div>

            <div className="p-5 text-center text-white">
              <ShieldCheck className="w-7 h-7 mx-auto mb-2 text-[#C23B4A]" />

              <h3 className="font-bold uppercase text-sm">
                Quality Control
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Strict Quality Checks
              </p>
            </div>

            <div className="p-5 text-center text-white">
              <Globe className="w-7 h-7 mx-auto mb-2 text-[#C23B4A]" />

              <h3 className="font-bold uppercase text-sm">
                Global Shipping
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Fast & Reliable Delivery
              </p>
            </div>

            <div className="p-5 text-center text-white">
              <Tags className="w-7 h-7 mx-auto mb-2 text-[#C23B4A]" />

              <h3 className="font-bold uppercase text-sm">
                Private Label
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Custom Packaging
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}