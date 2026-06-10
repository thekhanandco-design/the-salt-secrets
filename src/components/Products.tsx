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
    <section
      id="products"
      className="py-24 bg-[#FFF8F5]"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[380px_1fr] gap-12 items-start">

          {/* LEFT CONTENT */}
          <div>
            <span className="uppercase tracking-[4px] text-[#C98A92] font-bold text-xs">
              Our Products
            </span>

            <h2 className="text-4xl lg:text-5xl font-bold mt-4 text-slate-950 leading-tight">
              Premium Himalayan
              <br />
              Pink Salt Range
            </h2>

            <p className="text-slate-600 mt-5 leading-relaxed">
              Wide range of premium Himalayan Pink Salt products
              available in retail packaging, bulk supply and
              private label solutions.
            </p>

            <Link
              href="/products"
              className="inline-flex items-center mt-8 bg-[#C98A92] text-white px-7 py-4 rounded-full font-semibold hover:opacity-90 transition"
            >
              View All Products
            </Link>
          </div>

          {/* PRODUCTS GRID */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.title}
                href={product.link}
                className="group bg-white rounded-[28px] border border-[#F0DDE1] p-5 hover:shadow-[0_20px_60px_rgba(201,138,146,0.18)] transition-all duration-300"
              >
                <div className="bg-[#FFF8F5] rounded-[22px] p-4 h-[240px] flex items-center justify-center overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={300}
                    height={300}
                    className="max-h-[190px] w-auto object-contain transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="mt-5">
                  <h3 className="font-bold text-xl text-slate-950">
                    {product.title}
                  </h3>

                  <p className="text-sm text-slate-500 mt-2">
                    {product.size}
                  </p>

                  <span className="inline-block mt-4 text-[#C98A92] font-semibold">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}