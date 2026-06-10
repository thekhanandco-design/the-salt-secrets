import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  const trustItems = [
    ["100% Natural", "No Additives"],
    ["Lab Tested", "Premium Quality"],
    ["On-Time Delivery", "Worldwide"],
    ["Private Label", "Custom Branding"],
  ];

  const darkFeatures = [
    ["Manufacturer", "Direct factory pricing"],
    ["Export Expertise", "Documentation support"],
    ["Quality Control", "Strict quality checks"],
    ["Global Shipping", "Fast & reliable delivery"],
    ["Private Label", "Custom packaging"],
  ];

  return (
    <section className="bg-[#fff8f5]">
      <div className="max-w-7xl mx-auto px-5 lg:px-6 pt-10 pb-0">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="pb-10">
            <span className="uppercase tracking-[5px] text-[#C98A92] font-bold text-xs">
              Premium Himalayan Pink Salt
            </span>

            <h1 className="mt-5 text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.02] text-slate-950">
              Reliable Supply.
              <br />
              <span className="text-[#C23B4A]">
                Premium Quality.
              </span>
            </h1>

            <p className="mt-6 text-slate-600 text-base lg:text-lg leading-relaxed max-w-xl">
              Leading manufacturer and exporter of Himalayan Pink Salt for
              distributors, wholesalers, retailers and private label brands
              worldwide.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/products"
                className="bg-[#C23B4A] text-white px-7 py-4 rounded-xl font-semibold text-center shadow-lg hover:opacity-90 transition"
              >
                Explore Products
              </Link>

              <Link
                href="/contact"
                className="bg-white text-slate-900 border border-[#E9CCD1] px-7 py-4 rounded-xl font-semibold text-center hover:bg-[#fff1f3] transition"
              >
                Get Quote
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-white/40 rounded-[40px]" />

            <div className="relative flex items-end justify-center gap-4">
              <Image
                src="/product-3.png"
                alt="Salt Grinder"
                width={280}
                height={420}
                priority
                className="w-[32%] max-h-[420px] object-contain"
              />

              <Image
                src="/product-2.png"
                alt="Pink Salt Packaging"
                width={420}
                height={500}
                priority
                className="w-[42%] max-h-[460px] object-contain"
              />

              <Image
                src="/product-5.png"
                alt="Pink Salt Blocks"
                width={260}
                height={260}
                priority
                className="w-[26%] max-h-[240px] object-contain"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 bg-white border border-[#F0DDE1] rounded-t-[28px] overflow-hidden">
          {trustItems.map(([title, desc]) => (
            <div
              key={title}
              className="p-5 text-center border-b lg:border-b-0 lg:border-r last:border-r-0 border-[#F0DDE1]"
            >
              <div className="text-[#C98A92] text-2xl mb-2">
                ✦
              </div>

              <h3 className="font-bold text-slate-950">
                {title}
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-5 lg:px-6">
          <div className="grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-700">
            {darkFeatures.map(([title, desc]) => (
              <div
                key={title}
                className="p-6 text-center text-white"
              >
                <div className="text-[#C98A92] text-2xl mb-3">
                  ✧
                </div>

                <h3 className="font-bold uppercase text-sm">
                  {title}
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}