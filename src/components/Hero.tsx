import Link from "next/link";
import {
  Leaf,
  FlaskConical,
  Truck,
  PackageCheck,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-[#FFF8F5]">

      {/* HERO BANNER */}
      <div className="relative w-full overflow-hidden h-[420px] lg:h-[520px]">

        <img
          src="/hero-banner.png"
          alt="Premium Himalayan Pink Salt"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* WHITE OVERLAY FOR TEXT READABILITY */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent" />

        {/* TEXT */}
        <div className="absolute left-[5%] top-[46%] -translate-y-1/2 max-w-[620px] z-10">

          <span className="uppercase tracking-[6px] text-[#C47B86] font-bold text-xs">
            Premium Himalayan Pink Salt
          </span>

          <h1 className="mt-5 text-5xl md:text-6xl lg:text-7xl font-black leading-[0.92] text-[#07142B]">
            Pure. Natural.
            <br />
            <span className="text-[#C47B86]">
              Globally Trusted.
            </span>
          </h1>

          <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-[560px]">
            Premium Himalayan Pink Salt manufacturer and exporter supplying
            distributors, wholesalers, retailers and private label brands
            worldwide.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              href="/products"
              className="bg-[#C98A92] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Explore Products
            </Link>

            <Link
              href="/contact"
              className="bg-white border border-[#E8D2D6] text-[#07142B] px-8 py-4 rounded-xl font-semibold hover:bg-[#FFF4F5] transition"
            >
              Get Quote
            </Link>
          </div>
        </div>
      </div>

      {/* FEATURES STRIP */}
      <div className="bg-white border-y border-[#F0DDE1]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4">

            <div className="p-5 text-center border-r border-b lg:border-b-0 border-[#F0DDE1]">
              <Leaf className="w-7 h-7 mx-auto mb-2 text-[#C98A92]" />
              <h3 className="font-semibold">100% Natural</h3>
              <p className="text-xs text-slate-500">No Additives</p>
            </div>

            <div className="p-5 text-center border-r border-b lg:border-b-0 border-[#F0DDE1]">
              <FlaskConical className="w-7 h-7 mx-auto mb-2 text-[#C98A92]" />
              <h3 className="font-semibold">Lab Tested</h3>
              <p className="text-xs text-slate-500">Premium Quality</p>
            </div>

            <div className="p-5 text-center border-r border-[#F0DDE1]">
              <Truck className="w-7 h-7 mx-auto mb-2 text-[#C98A92]" />
              <h3 className="font-semibold">Worldwide Delivery</h3>
              <p className="text-xs text-slate-500">Export Ready</p>
            </div>

            <div className="p-5 text-center">
              <PackageCheck className="w-7 h-7 mx-auto mb-2 text-[#C98A92]" />
              <h3 className="font-semibold">Private Label</h3>
              <p className="text-xs text-slate-500">Custom Branding</p>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
}