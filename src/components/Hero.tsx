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
      <div className="relative w-full overflow-hidden min-h-[680px] lg:min-h-[650px]">

        {/* DESKTOP IMAGE */}
        <img
          src="/hero-banner.png"
          alt="Premium Himalayan Pink Salt"
          className="hidden lg:block absolute inset-0 w-full h-full object-cover scale-[1.05]"
        />

        {/* MOBILE IMAGE */}
        <img
          src="/hero-banner.png"
          alt="Premium Himalayan Pink Salt"
          className="lg:hidden absolute bottom-0 right-0 w-[50%] h-auto object-contain"
        />

        {/* DESKTOP OVERLAY */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/5" />

        {/* MOBILE OVERLAY */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-r from-white via-white/96 to-white/65" />

        {/* CONTENT */}
        <div className="relative z-10 px-6 lg:px-0">

          <div className="max-w-[650px] pt-12 lg:absolute lg:left-[5%] lg:top-1/2 lg:-translate-y-1/2">

            <span className="uppercase tracking-[6px] text-[#C54B5B] font-bold text-[11px] lg:text-xs">
              PREMIUM HIMALAYAN PINK SALT
            </span>

            <h1 className="mt-4 lg:mt-5 text-[48px] leading-[0.92] md:text-6xl lg:text-7xl font-black text-[#07142B]">
              Pure. Natural.
              <br />
              <span className="text-[#C54B5B]">
                Globally Trusted.
              </span>
            </h1>

            <p className="mt-5 lg:mt-6 text-slate-600 text-base lg:text-lg leading-relaxed max-w-[560px]">
              Premium Himalayan Pink Salt manufacturer and exporter supplying
              distributors, wholesalers, retailers and private label brands
              worldwide.
            </p>

            <div className="flex flex-wrap gap-3 lg:gap-4 mt-7 lg:mt-8">
              <Link
                href="/products"
                className="bg-[#C54B5B] text-white px-7 py-3.5 lg:px-8 lg:py-4 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Explore Products
              </Link>

              <Link
                href="/contact"
                className="bg-white border border-[#E6D3D6] text-[#07142B] px-7 py-3.5 lg:px-8 lg:py-4 rounded-xl font-semibold hover:bg-[#FFF4F5] transition"
              >
                Get Quote
              </Link>
            </div>

            {/* FEATURES */}
            <div className="grid grid-cols-2 lg:flex lg:items-center gap-5 lg:gap-10 mt-10 lg:mt-12">

              <div className="flex items-center gap-3">
                <Leaf className="w-5 h-5 lg:w-6 lg:h-6 text-[#C54B5B]" />
                <div>
                  <h3 className="font-semibold text-[#07142B] text-sm">
                    100% Natural
                  </h3>
                  <p className="text-xs text-slate-500">
                    No Additives
                  </p>
                </div>
              </div>

              <div className="hidden lg:block w-px h-10 bg-[#E9D7DA]" />

              <div className="flex items-center gap-3">
                <FlaskConical className="w-5 h-5 lg:w-6 lg:h-6 text-[#C54B5B]" />
                <div>
                  <h3 className="font-semibold text-[#07142B] text-sm">
                    Premium Quality
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lab Tested
                  </p>
                </div>
              </div>

              <div className="hidden lg:block w-px h-10 bg-[#E9D7DA]" />

              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 lg:w-6 lg:h-6 text-[#C54B5B]" />
                <div>
                  <h3 className="font-semibold text-[#07142B] text-sm">
                    Bulk Supply
                  </h3>
                  <p className="text-xs text-slate-500">
                    On-Time Delivery
                  </p>
                </div>
              </div>

              <div className="hidden lg:block w-px h-10 bg-[#E9D7DA]" />

              <div className="flex items-center gap-3">
                <PackageCheck className="w-5 h-5 lg:w-6 lg:h-6 text-[#C54B5B]" />
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
      </div>

    </section>
  );
}