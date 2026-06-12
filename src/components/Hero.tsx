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
      <div className="relative w-full overflow-hidden h-[450px] lg:h-[560px]">

        <img
          src="/hero-banner.png"
          alt="Premium Himalayan Pink Salt"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* STRONGER WHITE OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/20" />

        {/* TEXT CONTENT */}
        <div className="absolute left-[5%] top-1/2 -translate-y-1/2 max-w-[650px] z-10">

          <span className="uppercase tracking-[6px] text-[#C54B5B] font-bold text-xs">
            Premium Himalayan Pink Salt
          </span>

          <h1 className="mt-5 text-5xl md:text-6xl lg:text-7xl font-black leading-[0.92] text-[#07142B]">
            Pure. Natural.
            <br />
            <span className="text-[#C54B5B]">
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
              className="bg-[#C54B5B] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Explore Products
            </Link>

            <Link
              href="/contact"
              className="bg-white border border-[#E6D3D6] text-[#07142B] px-8 py-4 rounded-xl font-semibold hover:bg-[#FFF4F5] transition"
            >
              Get Quote
            </Link>
          </div>

          {/* FEATURES INLINE LIKE REFERENCE */}
          <div className="hidden lg:flex items-center gap-10 mt-10">

            <div className="flex items-center gap-3">
              <Leaf className="w-6 h-6 text-[#C54B5B]" />
              <div>
                <h3 className="font-semibold text-[#07142B] text-sm">
                  100% Natural
                </h3>
                <p className="text-xs text-slate-500">
                  No Additives
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FlaskConical className="w-6 h-6 text-[#C54B5B]" />
              <div>
                <h3 className="font-semibold text-[#07142B] text-sm">
                  Premium Quality
                </h3>
                <p className="text-xs text-slate-500">
                  Lab Tested
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-[#C54B5B]" />
              <div>
                <h3 className="font-semibold text-[#07142B] text-sm">
                  Bulk Supply
                </h3>
                <p className="text-xs text-slate-500">
                  On-Time Delivery
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <PackageCheck className="w-6 h-6 text-[#C54B5B]" />
              <div>
                <h3 className="font-semibold text-[#07142B] text-sm">
                  Worldwide Shipping
                </h3>
                <p className="text-xs text-slate-500">
                  Global Reach
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MOBILE FEATURES */}
      <div className="lg:hidden bg-white border-t border-[#F0DDE1]">
        <div className="grid grid-cols-2">

          <div className="p-4 text-center border-r border-b border-[#F0DDE1]">
            <Leaf className="w-6 h-6 mx-auto mb-2 text-[#C54B5B]" />
            <h3 className="font-semibold text-sm">100% Natural</h3>
            <p className="text-xs text-slate-500">No Additives</p>
          </div>

          <div className="p-4 text-center border-b border-[#F0DDE1]">
            <FlaskConical className="w-6 h-6 mx-auto mb-2 text-[#C54B5B]" />
            <h3 className="font-semibold text-sm">Premium Quality</h3>
            <p className="text-xs text-slate-500">Lab Tested</p>
          </div>

          <div className="p-4 text-center border-r border-[#F0DDE1]">
            <Truck className="w-6 h-6 mx-auto mb-2 text-[#C54B5B]" />
            <h3 className="font-semibold text-sm">Bulk Supply</h3>
            <p className="text-xs text-slate-500">On-Time Delivery</p>
          </div>

          <div className="p-4 text-center">
            <PackageCheck className="w-6 h-6 mx-auto mb-2 text-[#C54B5B]" />
            <h3 className="font-semibold text-sm">Worldwide Shipping</h3>
            <p className="text-xs text-slate-500">Global Reach</p>
          </div>

        </div>
      </div>

    </section>
  );
}