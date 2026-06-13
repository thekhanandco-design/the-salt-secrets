import Image from "next/image";
import Link from "next/link";
import {
  Package,
  BottleWine,
  Boxes,
  Layers3,
  Tag,
  Globe,
  ArrowRight,
} from "lucide-react";

const categories = [
  {
    title: "Retail Packaging",
    image: "/retail-packaging.png",
    icon: Package,
    description: "PET Bottles & PET Jars for retail shelves.",
    products: ["PET Bottle", "PET Jar"],
    sizes: "100g - 2kg",
  },
  {
    title: "Grinder Bottles",
    image: "/grinder-bottles.png",
    icon: BottleWine,
    description: "Plastic & Ceramic Grinder Bottles.",
    products: ["Plastic Grinder", "Ceramic Grinder"],
    sizes: "100g - 500g",
  },
  {
    title: "Bulk Salt",
    image: "/white-sack.png",
    icon: Boxes,
    description: "Industrial & Wholesale Bulk Supply.",
    products: ["Fine Grain", "Coarse Grain"],
    sizes: "5kg - 50kg",
  },
  {
    title: "Stand-Up Pouches",
    image: "/pouches.png",
    icon: Layers3,
    description: "Zip Lock Retail Packaging.",
    products: ["Fine Grain Pouch", "Coarse Grain Pouch"],
    sizes: "250g - 1kg",
  },
];

export default function ProductsPage() {
  return (
    <div className="bg-[#FFF8F5]">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* HERO */}
        <div className="text-center max-w-4xl mx-auto">
          <span className="uppercase tracking-[8px] text-[#C23B4A] font-black text-sm">
            Products
          </span>

          <h1 className="text-4xl lg:text-6xl font-black text-[#07142B] mt-4">
            Himalayan Pink Salt Product Collection
          </h1>

          <p className="text-slate-600 text-lg mt-6 leading-relaxed">
            Export-ready Himalayan Pink Salt products for distributors,
            wholesalers, supermarkets and private label brands worldwide.
          </p>
        </div>

        {/* PRODUCT CATEGORIES */}
        <div className="grid lg:grid-cols-2 gap-8 mt-16">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <div
                key={category.title}
                className="bg-white border border-[#EFE3E5] rounded-[32px] overflow-hidden hover:shadow-xl transition"
              >
                <div className="h-[220px] bg-[#FFF8F5] flex items-center justify-center p-6">
                  <Image
                    src={category.image}
                    alt={category.title}
                    width={500}
                    height={500}
                    className="max-h-[170px] w-auto object-contain"
                  />
                </div>

                <div className="p-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF4F5] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#C23B4A]" />
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-black text-[#07142B]">
                      {category.title}
                    </h2>
                  </div>

                  <p className="text-slate-600 mt-4">
                    {category.description}
                  </p>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[3px] text-slate-400 font-bold mb-2">
                      Available Products
                    </p>

                    <ul className="space-y-2 text-slate-700">
                      {category.products.map((product) => (
                        <li key={product}>• {product}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-[3px] text-slate-400 font-bold">
                      Available Sizes
                    </p>

                    <p className="text-slate-700 mt-2">
                      {category.sizes}
                    </p>
                  </div>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 mt-8 bg-[#C23B4A] text-white px-6 py-3 rounded-xl font-bold"
                  >
                    Request Quote
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* PRIVATE LABEL */}
        <section className="mt-16 bg-[#C23B4A] rounded-[36px] p-10 lg:p-14 text-white">
          <span className="uppercase tracking-[6px] text-white/80 font-black text-sm">
            Private Label Solutions
          </span>

          <h2 className="text-4xl lg:text-5xl font-black mt-4">
            Build Your Own Himalayan Pink Salt Brand
          </h2>

          <p className="text-white/90 mt-5 max-w-3xl text-lg">
            Custom packaging, branding and export-ready private label
            solutions for distributors, retailers and importers worldwide.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="bg-white/10 rounded-2xl p-6">
              <Tag className="w-10 h-10 mb-4" />
              <h3 className="font-black text-xl">Custom Labels</h3>
              <p className="text-white/80 mt-2">
                Personalized branding and label design.
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-6">
              <Package className="w-10 h-10 mb-4" />
              <h3 className="font-black text-xl">Custom Packaging</h3>
              <p className="text-white/80 mt-2">
                PET Bottles, Jars, Pouches and Bulk Packaging.
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-6">
              <Globe className="w-10 h-10 mb-4" />
              <h3 className="font-black text-xl">Global Export</h3>
              <p className="text-white/80 mt-2">
                Worldwide shipping and export documentation support.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Link
              href="/contact"
              className="bg-white text-[#C23B4A] px-8 py-4 rounded-xl font-bold inline-flex items-center gap-2"
            >
              Get Quote
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}