import Image from "next/image";

export default function Hero() {
  return (
    <section
      id="home"
      className="max-w-7xl mx-auto px-6 min-h-[85vh] flex items-center"
    >
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="uppercase tracking-[6px] text-[#C98A92] font-semibold">
            Premium Himalayan Pink Salt Exporter
          </span>

          <h1 className="text-6xl lg:text-7xl font-bold leading-tight mt-6">
  Premium
  <br />
  Himalayan Pink Salt
  <br />
  For Retail &
  <br />
  Wholesale Brands
</h1>

          <p className="mt-8 text-xl text-slate-600 leading-relaxed max-w-xl">
            The Salt Secrets by Khan & Co. supplies premium Himalayan Pink Salt
            products to importers, distributors, wholesalers, supermarkets and
            private label brands worldwide.
          </p>

          <div className="flex flex-wrap gap-4 mt-10">
            <button className="bg-[#C98A92] text-white px-8 py-4 rounded-full font-semibold">
              Request Quotation
            </button>

            <button className="border border-slate-300 px-8 py-4 rounded-full font-semibold">
              Download Catalog
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="grid grid-cols-3 gap-6 mt-12">
  <div>
    <h3 className="text-3xl font-bold">25+</h3>
    <p className="text-slate-500">Export Markets</p>
  </div>

  <div>
    <h3 className="text-3xl font-bold">100%</h3>
    <p className="text-slate-500">Natural Salt</p>
  </div>

  <div>
    <h3 className="text-3xl font-bold">Private</h3>
    <p className="text-slate-500">Label Solutions</p>
  </div>
</div>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.08)]">
          <Image
            src="/product-1.jpg"
            alt="Premium Himalayan Pink Salt"
            width={900}
            height={900}
            className="rounded-[30px]"
            priority
          />
        </div>
      </div>
    </section>
  );
}
<div className="flex flex-wrap gap-3 mt-10">
  <span className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium">
    ISO 22000
  </span>

  <span className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium">
    HACCP
  </span>

  <span className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium">
    HALAL
  </span>

  <span className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium">
    KOSHER
  </span>
</div>