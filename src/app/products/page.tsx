import Image from "next/image";
import Link from "next/link";

const products = [
  {
    title: "Coarse Grain Salt",
    image: "/product-1.jpg",
    link: "/products/coarse-grain-salt",
    size: "Food Service & Bulk Supply",
  },
  {
    title: "Fine Salt",
    image: "/product-2.png",
    link: "/products/fine-salt",
    size: "Retail & Consumer Packaging",
  },
  {
    title: "Salt Grinder",
    image: "/product-3.png",
    link: "/products/salt-grinder",
    size: "Premium Retail Packaging",
  },
  {
    title: "Salt Shaker",
    image: "/product-4.png",
    link: "/products/salt-shaker",
    size: "Supermarket Ready",
  },
  {
    title: "Private Label Solutions",
    image: "/product-5.png",
    link: "/products/private-label",
    size: "OEM & Custom Branding",
  },
  {
    title: "Bulk Salt Supply",
    image: "/product-1.jpg",
    link: "/products/bulk-salt",
    size: "Wholesale & Industrial",
  },
];

export default function ProductsPage() {
  return (
    <div className="bg-[#FFF8F5]">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* HERO */}
        <div className="text-center max-w-4xl mx-auto">
          <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
            Product Collection
          </span>

          <h1 className="text-5xl lg:text-7xl font-black mt-4 text-[#07142B] leading-tight">
            Himalayan Pink
            <br />
            Salt Collection
          </h1>

          <p className="text-lg text-slate-600 mt-6">
            Premium export-quality Himalayan Pink Salt products for
            distributors, wholesalers, supermarkets, retailers and
            private label brands worldwide.
          </p>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8 text-center">
            <h3 className="text-5xl font-black text-[#07142B]">
              100%
            </h3>

            <p className="text-slate-500 mt-2">
              Natural Products
            </p>
          </div>

          <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8 text-center">
            <h3 className="text-5xl font-black text-[#07142B]">
              OEM
            </h3>

            <p className="text-slate-500 mt-2">
              Private Label Support
            </p>
          </div>

          <div className="bg-white border border-[#EFE3E5] rounded-[28px] p-8 text-center">
            <h3 className="text-5xl font-black text-[#07142B]">
              Bulk
            </h3>

            <p className="text-slate-500 mt-2">
              Export Supply
            </p>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
          {products.map((product) => (
            <Link
              key={product.title}
              href={product.link}
              className="group bg-white rounded-[32px] border border-[#EFE3E5] overflow-hidden hover:shadow-[0_25px_60px_rgba(194,59,74,0.12)] transition-all duration-300"
            >
              <div className="flex justify-between items-center px-5 pt-5">
                <span className="text-[11px] font-semibold uppercase tracking-[2px] text-[#C23B4A]">
                  Export Quality
                </span>

                <span className="text-[11px] bg-[#FFF4F5] text-[#C23B4A] px-3 py-1 rounded-full font-semibold">
                  MOQ Available
                </span>
              </div>

              <div className="h-[320px] flex items-center justify-center px-6">
                <Image
                  src={product.image}
                  alt={product.title}
                  width={500}
                  height={500}
                  className="max-h-[260px] w-auto object-contain transition duration-500 group-hover:scale-110"
                />
              </div>

              <div className="border-t border-[#EFE3E5] p-6">
                <h3 className="font-bold text-2xl text-[#07142B]">
                  {product.title}
                </h3>

                <p className="text-slate-500 mt-2">
                  {product.size}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-semibold text-[#C23B4A]">
                    View Product
                  </span>

                  <span className="w-10 h-10 rounded-full bg-[#FFF4F5] flex items-center justify-center text-[#C23B4A] font-bold group-hover:bg-[#C23B4A] group-hover:text-white transition">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-white border border-[#EFE3E5] rounded-[40px] p-12 text-center mt-24">
          <h2 className="text-4xl font-black text-[#07142B]">
            Need Bulk Supply Or Private Label Solutions?
          </h2>

          <p className="text-slate-600 text-lg mt-4 max-w-3xl mx-auto">
            Contact our team for product specifications, quotations,
            packaging options and export support.
          </p>

          <Link
            href="/contact"
            className="inline-flex items-center mt-8 bg-[#C23B4A] text-white px-10 py-4 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Request Quotation
          </Link>
        </div>
      </div>
    </div>
  );
}