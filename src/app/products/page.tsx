import Image from "next/image";
import Link from "next/link";
import {
  Package,
  BottleWine,
  Boxes,
  Layers3,
  ArrowRight,
} from "lucide-react";

import retailPackaging from "./retail-packaging.png";
import grinderBottles from "./grinder-bottles.png";
import bulkSalt from "./bulk-salt.png";
import pouches from "./pouches.png";
import privateLabel from "./private-label.png";

const categories = [
  {
    title: "Retail Packaging",
    image: retailPackaging,
    icon: Package,
    description:
      "Shelf-ready packaging solutions for supermarkets, retailers and consumer brands.",
    products: ["PET Bottle", "PET Jar"],
    sizes: "100g - 2kg",
  },
  {
    title: "Grinder Bottles",
    image: grinderBottles,
    icon: BottleWine,
    description:
      "Premium grinder bottles for gourmet salt brands and retail shelves.",
    products: ["Plastic Grinder", "Ceramic Grinder"],
    sizes: "100g - 500g",
  },
  {
    title: "Bulk Salt",
    image: bulkSalt,
    icon: Boxes,
    description:
      "Bulk Himalayan Pink Salt supply for wholesalers, distributors and food service buyers.",
    products: ["Fine Grain", "Coarse Grain"],
    sizes: "5kg - 50kg",
  },
  {
    title: "Stand-Up Pouches",
    image: pouches,
    icon: Layers3,
    description:
      "Modern zip-lock pouch packaging for retail and e-commerce brands.",
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
            Explore our export-ready Himalayan Pink Salt products available in
            retail packaging, grinder bottles, stand-up pouches, bulk supply
            and private label solutions.
          </p>
        </div>

        {/* CATEGORY GRID */}
        <div className="grid lg:grid-cols-2 gap-8 mt-16">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <div
                key={category.title}
                className="bg-white border border-[#EFE3E5] rounded-[32px] overflow-hidden hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(194,59,74,0.10)] transition-all duration-300"
              >
                <div className="h-[300px] bg-[#FFF8F5] flex items-center justify-center p-8">
                  <Image
                    src={category.image}
                    alt={category.title}
                    width={500}
                    height={500}
                    className="max-h-[240px] w-auto object-contain"
                  />
                </div>

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF4F5] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#C23B4A]" />
                    </div>

                    <h2 className="text-3xl font-black text-[#07142B]">
                      {category.title}
                    </h2>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    {category.description}
                  </p>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[3px] text-slate-400 font-bold mb-3">
                      Available Products
                    </p>

                    <ul className="space-y-2 text-slate-700">
                      {category.products.map((product) => (
                        <li key={product}>• {product}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[3px] text-slate-400 font-bold">
                      Sizes
                    </p>

                    <p className="text-slate-700 mt-2">
                      {category.sizes}
                    </p>
                  </div>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 mt-8 bg-[#C23B4A] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
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
        <section className="mt-12 bg-[#C23B4A] rounded-[36px] overflow-hidden text-white">
          <div className="grid lg:grid-cols-2 items-center">
            <div className="p-10 flex justify-center">
              <Image
                src={privateLabel}
                alt="Private Label"
                width={600}
                height={600}
                className="max-h-[350px] w-auto object-contain"
              />
            </div>

            <div className="p-10 lg:p-14">
              <span className="uppercase tracking-[6px] text-white/80 font-black text-sm">
                Private Label Solutions
              </span>

              <h2 className="text-4xl lg:text-5xl font-black mt-4 leading-tight">
                Build Your Own Himalayan Pink Salt Brand
              </h2>

              <p className="text-white/90 mt-5 text-lg leading-relaxed">
                Custom packaging, labeling, branding and export-ready private
                label solutions for distributors, retailers and importers
                worldwide.
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  href="/private-label"
                  className="bg-white text-[#C23B4A] px-8 py-4 rounded-xl font-bold"
                >
                  View Private Label
                </Link>

                <Link
                  href="/contact"
                  className="border border-white px-8 py-4 rounded-xl font-bold"
                >
                  Get Quote
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}