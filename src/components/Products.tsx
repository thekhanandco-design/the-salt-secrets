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
    <section className="py-20 bg-white">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16">
        {/* HEADER */}
        <div className="text-center mb-12">
          <span className="uppercase tracking-[7px] text-[#C23B4A] font-black text-base lg:text-lg">
            Our Products
          </span>

          {/* SMLHDNG */}
          <h2 className="text-3xl lg:text-5xl font-black mt-4 text-[#07142B]">
            Premium Himalayan Pink Salt Range
          </h2>

          <p className="max-w-3xl mx-auto text-slate-600 mt-4 text-base lg:text-lg">
            Premium retail packaging, bulk supply and private label
            manufacturing solutions for distributors, wholesalers and
            global brands.
          </p>
        </div>

        {/* PRODUCTS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.title}
              href={product.link}
              className="group bg-white rounded-[28px] border border-[#EFE3E5] overflow-hidden hover:shadow-[0_20px_50px_rgba(194,59,74,0.10)] transition-all duration-300"
            >
              {/* BADGES */}
              <div className="flex justify-between items-center px-5 py-4">
                <span className="text-[11px] font-semibold uppercase tracking-[2px] text-[#C23B4A]">
                  Export Quality
                </span>

                <span className="text-[11px] bg-[#FFF4F5] text-[#C23B4A] px-3 py-1 rounded-full font-semibold">
                  MOQ Available
                </span>
              </div>

              {/* SQUARE IMAGE AREA */}
              <div className="relative aspect-square w-full bg-[#FAFAFA] border-y border-[#F2E5E7] overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              {/* CONTENT */}
              <div className="p-5">
                <h3 className="font-bold text-xl text-[#07142B]">
                  {product.title}
                </h3>

                <p className="text-slate-500 text-sm mt-1.5">
                  {product.size}
                </p>

                <div className="mt-4 flex items-center justify-between">
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
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}