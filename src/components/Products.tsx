import Image from "next/image";
import Link from "next/link";

export default function Products() {
  return (
    <section
      id="products"
      className="max-w-7xl mx-auto px-6 py-24"
    >
      <div className="text-center mb-16">
        <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
          Featured Products
        </span>

        <h2 className="text-5xl font-bold mt-4">
          Himalayan Pink Salt Collection
        </h2>

        <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
          Premium export-quality Himalayan Pink Salt products for distributors,
          wholesalers, retailers and private label brands worldwide.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white hover:shadow-2xl transition">
          <Image
            src="/product-1.jpg"
            alt="Coarse Grain Salt"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="font-bold text-2xl">
              Coarse Grain Salt
            </h3>

            <p className="text-slate-500 mt-2">
              Premium food-grade coarse Himalayan Pink Salt for retail,
              wholesale and food service industries.
            </p>

            <Link
              href="/products/coarse-grain-salt"
              className="inline-block mt-5 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>

        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white hover:shadow-2xl transition">
          <Image
            src="/product-2.png"
            alt="Fine Salt"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="font-bold text-2xl">
              Fine Salt
            </h3>

            <p className="text-slate-500 mt-2">
              Finely ground Himalayan Pink Salt ideal for cooking,
              seasoning and retail packaging.
            </p>

            <Link
              href="/products/fine-salt"
              className="inline-block mt-5 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>

        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white hover:shadow-2xl transition">
          <Image
            src="/product-3.png"
            alt="Salt Grinder"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="font-bold text-2xl">
              Salt Grinder
            </h3>

            <p className="text-slate-500 mt-2">
              Premium grinder packaging designed for supermarkets,
              retailers and private label brands.
            </p>

            <Link
              href="/products/salt-grinder"
              className="inline-block mt-5 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>

        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white hover:shadow-2xl transition">
          <Image
            src="/product-4.png"
            alt="Salt Shaker"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="font-bold text-2xl">
              Salt Shaker
            </h3>

            <p className="text-slate-500 mt-2">
              Convenient shaker packaging for supermarkets,
              retailers and global distribution.
            </p>

            <Link
              href="/products/salt-shaker"
              className="inline-block mt-5 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>

        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white hover:shadow-2xl transition">
          <Image
            src="/product-5.png"
            alt="Private Label Solutions"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="font-bold text-2xl">
              Private Label Solutions
            </h3>

            <p className="text-slate-500 mt-2">
              Custom branding, packaging and export-ready private
              label solutions for global brands.
            </p>

            <Link
              href="/products/private-label"
              className="inline-block mt-5 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>

        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white hover:shadow-2xl transition">
          <Image
            src="/product-1.jpg"
            alt="Bulk Salt"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="font-bold text-2xl">
              Bulk Salt
            </h3>

            <p className="text-slate-500 mt-2">
              Bulk Himalayan Pink Salt for wholesale, food processing
              and industrial buyers worldwide.
            </p>

            <Link
              href="/products/bulk-salt"
              className="inline-block mt-5 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center mt-14">
        <Link
          href="/products"
          className="inline-block bg-[#C98A92] text-white px-8 py-4 rounded-full font-semibold hover:opacity-90"
        >
          View Complete Product Range
        </Link>
      </div>
    </section>
  );
}