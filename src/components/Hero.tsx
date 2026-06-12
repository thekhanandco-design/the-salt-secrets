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
      <div className="relative w-full overflow-hidden min-h-[720px] lg:h-[650px]">

        {/* DESKTOP IMAGE */}
        <img
          src="/hero-banner.png"
          alt="Premium Himalayan Pink Salt"
          className="hidden lg:block absolute inset-0 w-full h-full object-cover"
        />

        {/* MOBILE IMAGE */}
        <img
          src="/hero-banner.png"
          alt="Premium Himalayan Pink Salt"
          className="lg:hidden absolute bottom-0 right-0 w-[48%] h-auto object-contain"
        />

        {/* DESKTOP OVERLAY */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/10" />

        {/* MOBILE OVERLAY */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-r from-white via-white/96 to-white/65" />

        {/* CONTENT */}
        <div className="relative z-10 w-full h-full">

          {/* DESKTOP */}
          <div className="hidden lg:block absolute left-[5%] top-[52%] -translate-y-1/2 max-w-[720px]">

            <span className="uppercase tracking-[6px] text-[#C54B5B] font-bold text-xs">
              PREMIUM HIMALAYAN PINK SALT
            </span>

            <h1 className="mt-5 text-7xl font-black leading-[0.92] text-[#07142B]">
              Pure. Natural.
              <br />
              <span className="text-[#C54B5B]">
                Globally Trusted.
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-[580px]">
              Premium Himalayan Pink Salt manufacturer and exporter supplying
              distributors, wholesalers, retailers and private label brands
              worldwide.
            </p>

            <div className="flex gap-4 mt-8">
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

            {/* FEATURES */}
            <div className="flex items-center gap-10 mt-12">

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

              <div className="w-px h-10 bg-[#E9D7DA]" />

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

              <div className="w-px h-10 bg-[#E9D7DA]" />

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

              <div className="w-px h-10 bg-[#E9D7DA]" />

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

          {/* MOBILE */}
          <div className="lg:hidden px-6 pt-10 max-w-[360px]">

            <span className="uppercase tracking-[4px] text-[#C54B5B] font-bold text-[11px]">
              PREMIUM HIMALAYAN PINK SALT
            </span>

            <h1 className="mt-4 text-[52px] font-black leading-[0.9] text-[#07142B]">
              Pure. Natural.
              <br />
              <span className="text-[#C54B5B]">
                Globally Trusted.
              </span>
            </h1>

            <p className="mt-5 text-slate-600 leading-relaxed">
              Premium Himalayan Pink Salt manufacturer and exporter supplying
              distributors, wholesalers, retailers and private label brands
              worldwide.
            </p>

            <div className="flex gap-3 mt-7">
              <Link
                href="/products"
                className="bg-[#C54B5B] text-white px-6 py-3 rounded-xl font-semibold"
              >
                Explore Products
              </Link>

              <Link
                href="/contact"
                className="bg-white border border-[#E6D3D6] text-[#07142B] px-6 py-3 rounded-xl font-semibold"
              >
                Get Quote
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <div>
                <h3 className="font-semibold text-sm">100% Natural</h3>
                <p className="text-xs text-slate-500">No Additives</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm">Premium Quality</h3>
                <p className="text-xs text-slate-500">Lab Tested</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm">Bulk Supply</h3>
                <p className="text-xs text-slate-500">On-Time Delivery</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm">Worldwide Shipping</h3>
                <p className="text-xs text-slate-500">Global Reach</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}