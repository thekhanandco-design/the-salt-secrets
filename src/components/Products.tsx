import Image from "next/image";
import Link from "next/link";

const products = [
  {
    title: "Salt Grinder",
    image: "/product-3.png",
    link: "/products/salt-grinder",
  },
  {
    title: "Pink Salt Jar",
    image: "/product-2.png",
    link: "/products/fine-salt",
  },
  {
    title: "Salt Shaker",
    image: "/product-4.png",
    link: "/products/salt-shaker",
  },
  {
    title: "Rock Salt Chunks",
    image: "/product-5.png",
    link: "/products/bulk-salt",
  },
];

export default function Products() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold text-xs">
            Our Products
          </span>

          <h2 className="text-4xl lg:text-5xl font-bold mt-4 text-slate-950">
            Premium Himalayan Pink Salt Range
          </h2>

          <p className="max-w-2xl mx-auto text-slate-600 mt-5">
            Premium retail packaging, bulk supply and private label
            solutions for distributors, wholesalers and global brands.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.title}
              href={product.link}
              className="group bg-[#FFF8F5] rounded-[32px] p-6 border border-[#F1E2E5] hover:shadow-xl transition duration-300"
            >
              <div className="h-[250px] flex items-center justify-center">
                <Image
                  src={product.image}
                  alt={product.title}
                  width={350}
                  height={350}
                  className="max-h-[220px] w-auto object-contain transition duration-300 group-hover:scale-105"
                />
              </div>

              <div className="pt-4 border-t border-[#F1E2E5]">
                <h3 className="font-bold text-lg text-slate-950">
                  {product.title}
                </h3>

                <p className="text-[#C98A92] text-sm mt-2 font-medium">
                  View Product →
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center bg-[#C98A92] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
          >
            View Complete Collection
          </Link>
        </div>
      </div>
    </section>
  );
}