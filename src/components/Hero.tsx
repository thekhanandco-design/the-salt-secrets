import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-b from-[#fffdfc] to-[#f8f8f8]"
    >
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT */}
          <div>
            <span className="uppercase tracking-[7px] text-[#C98A92] font-semibold text-sm">
              Premium Himalayan Pink Salt Exporter
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mt-6 text-slate-900">
              Pure.
              <br />
              Natural.
              <br />
              Globally
              <br />
              Trusted.
            </h1>

            <p className="mt-8 text-lg lg:text-xl text-slate-600 leading-relaxed max-w-xl">
              We supply premium Himalayan Pink Salt products for
              importers, distributors, wholesalers, supermarkets and
              private label brands worldwide.
            </p>

            <div className="flex flex-wrap gap-4 mt-10">
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
            <div className="flex flex-wrap gap-3 mt-10">
              <span className="px-4 py-2 bg-white border rounded-full text-sm font-medium">
                ISO 22000
              </span>

              <span className="px-4 py-2 bg-white border rounded-full text-sm font-medium">
                HACCP
              </span>

              <span className="px-4 py-2 bg-white border rounded-full text-sm font-medium">
                HALAL
              </span>

              <span className="px-4 py-2 bg-white border rounded-full text-sm font-medium">
                Private Label
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative">
            <div className="bg-white rounded-[40px] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.08)]">
              <Image
                src="/product-1.jpg"
                alt="Premium Himalayan Pink Salt"
                width={1000}
                height={1000}
                priority
                className="rounded-[30px]"
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
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <div className="bg-white border rounded-3xl p-6 text-center">
            <h3 className="text-4xl font-bold text-slate-900">
              10+
            </h3>
            <p className="text-slate-500 mt-2">
              Years Experience
            </p>
          </div>

          <div className="bg-white border rounded-3xl p-6 text-center">
            <h3 className="text-4xl font-bold text-slate-900">
              50+
            </h3>
            <p className="text-slate-500 mt-2">
              Countries Exported
            </p>
          </div>

          <div className="bg-white border rounded-3xl p-6 text-center">
            <h3 className="text-4xl font-bold text-slate-900">
              500+
            </h3>
            <p className="text-slate-500 mt-2">
              Happy Clients
            </p>
          </div>

          <div className="bg-white border rounded-3xl p-6 text-center">
            <h3 className="text-4xl font-bold text-slate-900">
              100%
            </h3>
            <p className="text-slate-500 mt-2">
              Quality Assurance
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}