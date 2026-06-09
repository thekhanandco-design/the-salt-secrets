import Image from "next/image";

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

      <div className="grid md:grid-cols-3 gap-8">
        {/* Product 1 */}
        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white">
          <Image
            src="/product-1.jpg"
            alt="Coarse Grain Salt"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />
          <div className="p-6">
            <h3 className="font-bold text-2xl">Coarse Grain Salt</h3>
            <p className="text-slate-500 mt-2">
              Premium food-grade coarse Himalayan salt.
            </p>
          </div>
        </div>

        {/* Product 2 */}
        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white">
          <Image
            src="/product-2.png"
            alt="Retail Packaging"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />
          <div className="p-6">
            <h3 className="font-bold text-2xl">Retail Packaging</h3>
            <p className="text-slate-500 mt-2">
              Custom branded retail-ready packaging.
            </p>
          </div>
        </div>

        {/* Product 3 */}
        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white">
          <Image
            src="/product-5.png"
            alt="Salt Grinder"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />
          <div className="p-6">
            <h3 className="font-bold text-2xl">Salt Grinder</h3>
            <p className="text-slate-500 mt-2">
              Premium grinder packaging for global markets.
            </p>
          </div>
        </div>

        {/* Product 4 */}
        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white">
          <Image
            src="/product-3.png"
            alt="Fine Salt"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />
          <div className="p-6">
            <h3 className="font-bold text-2xl">Fine Salt</h3>
            <p className="text-slate-500 mt-2">
              Finely ground Himalayan Pink Salt for everyday cooking.
            </p>
          </div>
        </div>

        {/* Product 5 */}
        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white">
          <Image
            src="/product-4.png"
            alt="Salt Shaker"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />
          <div className="p-6">
            <h3 className="font-bold text-2xl">Salt Shaker</h3>
            <p className="text-slate-500 mt-2">
              Convenient shaker packaging for supermarkets and retailers.
            </p>
          </div>
        </div>

        {/* Product 6 */}
        <div className="rounded-[30px] overflow-hidden shadow-lg border bg-white">
          <Image
            src="/product-1.jpg"
            alt="Bulk Salt"
            width={600}
            height={700}
            className="w-full h-[320px] object-cover"
          />
          <div className="p-6">
            <h3 className="font-bold text-2xl">Bulk Salt</h3>
            <p className="text-slate-500 mt-2">
              Bulk Himalayan Pink Salt for wholesale, food processing and industrial buyers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}