import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-b from-[#fffdfc] to-[#f8f8f8]"
    >
      <div className="max-w-7xl mx-auto px-6 pt-8 lg:pt-12 pb-20 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* IMAGE FIRST ON MOBILE */}
          <div className="relative order-1 lg:order-2">
            <div className="bg-white rounded-[30px] lg:rounded-[40px] p-4 lg:p-5 shadow-[0_30px_100px_rgba(0,0,0,0.08)]">
              <Image
                src="/product-1.jpg"
                alt="Premium Himalayan Pink Salt"
                width={1000}
                height={1000}
                priority
                className="rounded-[24px] lg:rounded-[30px]"
              />
            </div>

            <div className="hidden lg:flex absolute top-10 right-[-20px] bg-white px-5 py-4 rounded-2xl shadow-xl border">
              <div>
                <p className="text-[#C98A92] font-bold text-xl">
                  100%
                </p>

                <p className="text-sm text-slate-500">
                  Natural & Pure
                </p>
              </div>
            </div>

            <div className="hidden lg:flex absolute bottom-10 left-[-20px] bg-white px-5 py-4 rounded-2xl shadow-xl border">
              <div>
                <p className="text-[#C98A92] font-bold text-xl">
                  50+
                </p>

                <p className="text-sm text-slate-500">
                  Export Markets
                </p>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="order-2 lg:order-1">
            <span className="uppercase tracking-[6px] lg:tracking-[7px] text-[#C98A92] font-semibold text-xs lg:text-sm">
              Premium Himalayan Pink Salt Exporter
            </span>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mt-5 lg:mt-6 text-slate-900">
              Pure.
              <br />
              Natural.
              <br />
              Globally
              <br />
              Trusted.
            </h1>

            <p className="mt-6 lg:mt-8 text-base lg:text-xl text-slate-600 leading-relaxed max-w-xl">
              We supply premium Himalayan Pink Salt products for
              importers, distributors, wholesalers, supermarkets and
              private label brands worldwide.
            </p>

            <div className="flex flex-wrap gap-4 mt-8 lg:mt-10">
              <Link
                href="/contact"
                className="bg-[#C98A92] text-white px-8 py-4 rounded-full font-semibold hover:opacity-90 transition"
              >
                Request Quotation
              </Link>

              <Link
                href="/products"
                className="border border-slate-300 px-8 py-4 rounded-full font-semibold hover:bg-white transition"
              >
                Explore Products
              </Link>
            </div>

            {/* TRUST BADGES */}
            <div className="flex flex-wrap gap-3 mt-8 lg:mt-10">
              <span className="px-4 py-2 bg-white border rounded-full text-sm font-medium">
                Packed In Certified Facility
              </span>

              <span className="px-4 py-2 bg-white border rounded-full text-sm font-medium">
                HACCP Compliant Facility
              </span>

              <span className="px-4 py-2 bg-white border rounded-full text-sm font-medium">
                HALAL Production Facility
              </span>

              <span className="px-4 py-2 bg-white border rounded-full text-sm font-medium">
                Worldwide Export
              </span>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-12 lg:mt-20">
          <div className="bg-white border rounded-3xl p-4 lg:p-6 text-center">
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">
              10+
            </h3>

            <p className="text-slate-500 mt-2 text-sm lg:text-base">
              Years Experience
            </p>
          </div>

          <div className="bg-white border rounded-3xl p-4 lg:p-6 text-center">
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">
              50+
            </h3>

            <p className="text-slate-500 mt-2 text-sm lg:text-base">
              Countries Exported
            </p>
          </div>

          <div className="bg-white border rounded-3xl p-4 lg:p-6 text-center">
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">
              500+
            </h3>

            <p className="text-slate-500 mt-2 text-sm lg:text-base">
              Global Buyers
            </p>
          </div>

          <div className="bg-white border rounded-3xl p-4 lg:p-6 text-center">
            <h3 className="text-3xl lg:text-4xl font-bold text-slate-900">
              100%
            </h3>

            <p className="text-slate-500 mt-2 text-sm lg:text-base">
              Export Quality
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}