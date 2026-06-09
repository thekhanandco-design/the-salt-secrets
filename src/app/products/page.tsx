import Image from "next/image";
import Link from "next/link";

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
          Our Products
        </span>

        <h1 className="text-6xl font-bold mt-4">
          Himalayan Pink Salt Collection
        </h1>

        <p className="text-xl text-slate-600 mt-6 max-w-3xl mx-auto">
          Premium export-quality Himalayan Pink Salt products for wholesalers,
          distributors, retailers and private label brands worldwide.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Product 1 */}
        <div className="bg-white rounded-[30px] overflow-hidden shadow-lg">
          <Image
            src="/product-1.jpg"
            alt="Coarse Grain Salt"
            width={600}
            height={600}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="text-2xl font-bold">Coarse Grain Salt</h3>

            <p className="text-slate-600 mt-3">
              Premium coarse Himalayan Pink Salt for retail and food service.
            </p>

            <Link
              href="/products/coarse-grain-salt"
              className="inline-block mt-4 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>

        {/* Product 2 */}
        <div className="bg-white rounded-[30px] overflow-hidden shadow-lg">
          <Image
            src="/product-2.png"
            alt="Fine Salt"
            width={600}
            height={600}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="text-2xl font-bold">Fine Salt</h3>

            <p className="text-slate-600 mt-3">
              Finely ground Himalayan Pink Salt ideal for daily cooking.
            </p>

            <Link
              href="/products/fine-salt"
              className="inline-block mt-4 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>

        {/* Product 3 */}
        <div className="bg-white rounded-[30px] overflow-hidden shadow-lg">
          <Image
            src="/product-3.png"
            alt="Salt Grinder"
            width={600}
            height={600}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="text-2xl font-bold">Salt Grinder</h3>

            <p className="text-slate-600 mt-3">
              Elegant grinder packaging for retail shelves worldwide.
            </p>

            <Link
              href="/products/salt-grinder"
              className="inline-block mt-4 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>

        {/* Product 4 */}
        <div className="bg-white rounded-[30px] overflow-hidden shadow-lg">
          <Image
            src="/product-4.png"
            alt="Salt Shaker"
            width={600}
            height={600}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="text-2xl font-bold">Salt Shaker</h3>

            <p className="text-slate-600 mt-3">
              Convenient shaker packaging for supermarkets and retailers.
            </p>

            <Link
              href="/products/salt-shaker"
              className="inline-block mt-4 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>

        {/* Product 5 */}
        <div className="bg-white rounded-[30px] overflow-hidden shadow-lg">
          <Image
            src="/product-5.png"
            alt="Private Label"
            width={600}
            height={600}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="text-2xl font-bold">Private Label Solutions</h3>

            <p className="text-slate-600 mt-3">
              Custom branding, packaging and export-ready private label
              solutions.
            </p>

            <Link
              href="/products/private-label"
              className="inline-block mt-4 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>

        {/* Product 6 */}
        <div className="bg-white rounded-[30px] overflow-hidden shadow-lg">
          <Image
            src="/product-1.jpg"
            alt="Bulk Salt"
            width={600}
            height={600}
            className="w-full h-[320px] object-cover"
          />

          <div className="p-6">
            <h3 className="text-2xl font-bold">Bulk Salt</h3>

            <p className="text-slate-600 mt-3">
              Bulk Himalayan Pink Salt for wholesale, food processing and
              industrial buyers.
            </p>

            <Link
              href="/products/bulk-salt"
              className="inline-block mt-4 text-[#C98A92] font-semibold"
            >
              View Details →
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center mt-16">
        <Link
          href="/contact"
          className="inline-block bg-[#C98A92] text-white px-8 py-4 rounded-full font-semibold hover:opacity-90"
        >
          Request Quotation
        </Link>
      </div>
    </div>
  );
}