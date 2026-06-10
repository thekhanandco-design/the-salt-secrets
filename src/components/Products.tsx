import Image from "next/image";
import Link from "next/link";

const products = [
  {
    title: "Salt Grinder",
    image: "/product-3.png",
    link: "/products/salt-grinder",
    size: "200g / 400g",
  },
  {
    title: "Pink Salt Jar",
    image: "/product-2.png",
    link: "/products/fine-salt",
    size: "200g / 500g",
  },
  {
    title: "Salt Shaker",
    image: "/product-4.png",
    link: "/products/salt-shaker",
    size: "200g / 400g",
  },
  {
    title: "Rock Salt Chunks",
    image: "/product-5.png",
    link: "/products/bulk-salt",
    size: "1kg / 2kg / 5kg",
  },
];

export default function Products() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* HEADER */}
        <div className="text-center mb-16">
          <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
            Our Products
          </span>

          <h2 className="text-4xl lg:text-5xl font-black mt-4 text-[#07142B]">
            Premium Himalayan Pink Salt Range
          </h2>

          <p className="max-w-2xl mx-auto text-slate-600 mt-5 text-lg">
            Premium retail packaging, bulk supply and private label
            manufacturing solutions for distributors, wholesalers and
            global brands.
          </p>
        </div>

        {/* PRODUCTS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link
              key={product.title}
              href={product.link}
              className="group bg-white rounded-[32px] border border-[#EFE3E5] overflow-hidden hover:shadow-[0_25px_60px_rgba(194,59,74,0.12)] transition-all duration-300"
            >
              {/* BADGE */}
              <div className="flex justify-between items-center px-5 pt-5">
                <span className="text-[11px] font-semibold uppercase tracking-[2px] text-[#C23B4A]">
                  Export Quality
                </span>

                <span className="text-[11px] bg-[#FFF4F5] text-[#C23B4A] px-3 py-1 rounded-full font-semibold">
                  MOQ Available
                </span>
              </div>

              {/* IMAGE */}
              <div className="h-[300px] flex items-center justify-center px-5">
                <Image
                  src={product.image}
                  alt={product.title}
                  width={400}
                  height={400}
                  className="max-h-[260px] w-auto object-contain transition duration-500 group-hover:scale-110"
                />
              </div>

              {/* CONTENT */}
              <div className="border-t border-[#F2E5E7] p-6">
                <h3 className="font-bold text-xl text-[#07142B]">
                  {product.title}
                </h3>

                <p className="text-slate-500 text-sm mt-2">
                  {product.size}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-[#C23B4A] font-semibold">
                    View Product
                  </span>

                  <span className="w-9 h-9 rounded-full bg-[#FFF4F5] flex items-center justify-center text-[#C23B4A] font-bold group-hover:bg-[#C23B4A] group-hover:text-white transition">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link
            href="/products"
            className="inline-flex items-center bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
          >
            View Complete Collection
          </Link>
        </div>
      </div>
    </section>
  );
}