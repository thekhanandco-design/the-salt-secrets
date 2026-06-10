import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#FFF8F5]"
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-6 pt-10 pb-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="uppercase tracking-[5px] text-[#C98A92] font-bold text-xs">
              Premium Himalayan Pink Salt
            </span>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mt-5 text-slate-950">
              Premium
              <br />
              Himalayan Pink Salt
              <br />
              For Global Brands
            </h1>

            <p className="mt-6 text-base lg:text-lg text-slate-600 leading-relaxed max-w-xl">
              Supplying retail packaging, private label solutions and bulk
              Himalayan Pink Salt products to importers, distributors and
              wholesalers worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/contact"
                className="bg-[#C98A92] text-white px-7 py-4 rounded-full font-semibold text-center hover:opacity-90 transition"
              >
                Get Quote
              </Link>

              <Link
                href="/products"
                className="bg-white border border-[#E7CBD0] text-slate-900 px-7 py-4 rounded-full font-semibold text-center hover:bg-[#fff1f3] transition"
              >
                View Products
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10">
              {[
                ["100%", "Natural Salt"],
                ["Private", "Label Ready"],
                ["Bulk", "Supply"],
                ["Global", "Shipping"],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="bg-white border border-[#F0DDE1] rounded-2xl p-4"
                >
                  <h3 className="font-bold text-[#C98A92]">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-[#F4D5DA] blur-3xl opacity-40 rounded-full" />

            <div className="relative bg-white rounded-[34px] p-4 shadow-[0_30px_100px_rgba(201,138,146,0.22)]">
              <Image
                src="/product-1.jpg"
                alt="Premium Himalayan Pink Salt Packaging"
                width={900}
                height={900}
                priority
                className="rounded-[26px] w-full h-[420px] lg:h-[560px] object-cover object-center"
              />
            </div>

            <div className="absolute hidden lg:block top-8 right-[-18px] bg-white border border-[#F0DDE1] rounded-2xl px-5 py-4 shadow-xl">
              <p className="text-2xl font-bold text-[#C98A92]">
                50+
              </p>
              <p className="text-sm text-slate-500">
                Export Markets
              </p>
            </div>

            <div className="absolute hidden lg:block bottom-8 left-[-18px] bg-white border border-[#F0DDE1] rounded-2xl px-5 py-4 shadow-xl">
              <p className="text-2xl font-bold text-[#C98A92]">
                Packed
              </p>
              <p className="text-sm text-slate-500">
                In Certified Facility
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white border border-[#F0DDE1] rounded-[32px] shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
            {[
              ["10+", "Years of Experience"],
              ["50+", "Countries Exported"],
              ["500+", "Global Buyers"],
              ["100%", "Export Quality"],
            ].map(([number, label]) => (
              <div key={label} className="p-6 text-center">
                <h3 className="text-3xl lg:text-4xl font-bold text-slate-950">
                  {number}
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}