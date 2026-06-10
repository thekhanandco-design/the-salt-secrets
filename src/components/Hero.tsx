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
      <div className="max-w-7xl mx-auto px-5 lg:px-6 pt-10 pb-0">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT */}
          <div>
            <span className="uppercase tracking-[5px] text-[#C98A92] font-bold text-xs">
              Premium Himalayan Pink Salt
            </span>

            <h1 className="mt-5 text-5xl md:text-6xl lg:text-7xl leading-[0.95] font-black text-slate-950">
              Reliable Supply.
              <br />
              <span className="text-[#C98A92]">
                Premium Quality.
              </span>
            </h1>

            <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-xl">
              Leading manufacturer and exporter of 100% Natural
              Himalayan Pink Salt for distributors, wholesalers,
              retailers and private label brands worldwide.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                href="/products"
                className="bg-[#C98A92] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
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

          {/* RIGHT */}
          <div className="relative">
            <div className="bg-[#fff4f5] rounded-[40px] p-8">
              <div className="grid grid-cols-3 gap-5 items-end">
                <div className="bg-white rounded-[30px] p-4 shadow-sm">
                  <Image
                    src="/product-3.png"
                    alt="Salt Grinder"
                    width={400}
                    height={500}
                    className="w-full h-[260px] object-contain"
                    priority
                  />
                </div>

                <div className="bg-white rounded-[30px] p-4 shadow-sm">
                  <Image
                    src="/product-2.png"
                    alt="Salt Packaging"
                    width={500}
                    height={700}
                    className="w-full h-[380px] object-contain"
                    priority
                  />
                </div>

                <div className="bg-white rounded-[30px] p-4 shadow-sm">
                  <Image
                    src="/product-3.png"
                    alt="Salt Grinder"
                    width={400}
                    height={500}
                    className="w-full h-[260px] object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TRUST STRIP */}
        <div className="bg-white border border-[#EEDDE1] rounded-t-[24px] mt-12 overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            <div className="px-6 py-4 text-center border-r border-b lg:border-b-0 border-[#EEDDE1]">
              <Leaf className="w-8 h-8 mx-auto mb-2 text-[#C98A92]" />
              <h3 className="font-semibold text-lg">
                100% Natural
              </h3>
              <p className="text-sm text-slate-500">
                No Additives
              </p>
            </div>

            <div className="px-6 py-4 text-center border-r border-b lg:border-b-0 border-[#EEDDE1]">
              <FlaskConical className="w-8 h-8 mx-auto mb-2 text-[#C98A92]" />
              <h3 className="font-semibold text-lg">
                Lab Tested
              </h3>
              <p className="text-sm text-slate-500">
                Premium Quality
              </p>
            </div>

            <div className="px-6 py-4 text-center border-r border-[#EEDDE1]">
              <Truck className="w-8 h-8 mx-auto mb-2 text-[#C98A92]" />
              <h3 className="font-semibold text-lg">
                On-Time Delivery
              </h3>
              <p className="text-sm text-slate-500">
                Worldwide
              </p>
            </div>

            <div className="px-6 py-4 text-center">
              <PackageCheck className="w-8 h-8 mx-auto mb-2 text-[#C98A92]" />
              <h3 className="font-semibold text-lg">
                Private Label
              </h3>
              <p className="text-sm text-slate-500">
                Custom Branding
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DARK STRIP */}
      <div className="bg-[#081528]">
        <div className="max-w-7xl mx-auto px-5 lg:px-6">
          <div className="grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-700">
            <div className="p-6 text-center text-white">
              <Factory className="w-8 h-8 mx-auto mb-3 text-[#C98A92]" />
              <h3 className="font-bold uppercase text-sm">
                Manufacturer
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Direct Factory Pricing
              </p>
            </div>

            <div className="p-6 text-center text-white">
              <FileText className="w-8 h-8 mx-auto mb-3 text-[#C98A92]" />
              <h3 className="font-bold uppercase text-sm">
                Export Expertise
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Documentation Support
              </p>
            </div>

            <div className="p-6 text-center text-white">
              <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-[#C98A92]" />
              <h3 className="font-bold uppercase text-sm">
                Quality Control
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Strict Quality Checks
              </p>
            </div>

            <div className="p-6 text-center text-white">
              <Globe className="w-8 h-8 mx-auto mb-3 text-[#C98A92]" />
              <h3 className="font-bold uppercase text-sm">
                Global Shipping
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Fast & Reliable Delivery
              </p>
            </div>

            <div className="p-6 text-center text-white">
              <Tags className="w-8 h-8 mx-auto mb-3 text-[#C98A92]" />
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