import Image from "next/image";
import Link from "next/link";
import {
  Package,
  BottleWine,
  Boxes,
  Tags,
  Layers3,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

import retailPackaging from "./retail-packaging.png";
import grinderBottles from "./grinder-bottles.png";
import bulkSalt from "./bulk-salt.png";
import pouches from "./pouches.png";
import privateLabel from "./private-label.png";

const productGroups = [
  {
    title: "Retail Packaging",
    id: "retail-packaging",
    image: retailPackaging,
    description:
      "Shelf-ready Himalayan Pink Salt packaging for supermarkets, retailers and consumer brands.",
    icon: Package,
    items: [
      {
        name: "PET Bottle",
        image: retailPackaging,
        details: "Fine Grain / Powder Form",
        sizes: "100g, 200g, 250g, 500g, 750g",
        packaging: "PET Bottle Shaker / Pourer",
      },
      {
        name: "PET Jar",
        image: retailPackaging,
        details: "Fine Grain / Powder Form",
        sizes: "1kg, 1.5kg, 2kg",
        packaging: "PET Jar",
      },
    ],
  },
  {
    title: "Grinder Bottles",
    id: "grinder-bottles",
    image: grinderBottles,
    description:
      "Premium grinder bottles for retail shelves, gourmet salt brands and private label packaging.",
    icon: BottleWine,
    items: [
      {
        name: "Plastic Grinder",
        image: grinderBottles,
        details: "Coarse Grain",
        sizes: "100g, 200g, 225g, 360g, 500g",
        packaging: "Grinder Cap Bottle Plastic",
      },
      {
        name: "Ceramic Grinder",
        image: grinderBottles,
        details: "Coarse Grain",
        sizes: "100g, 200g, 225g, 360g, 500g",
        packaging: "Grinder Cap Bottle Ceramic",
      },
    ],
  },
  {
    title: "Bulk Salt",
    id: "bulk-salt",
    image: bulkSalt,
    description:
      "Bulk Himalayan Pink Salt supply for importers, wholesalers, food service and industrial buyers.",
    icon: Boxes,
    items: [
      {
        name: "Fine Grain",
        image: bulkSalt,
        details: "Fine Grain / Powder Form",
        sizes: "5kg, 10kg, 20kg, 25kg, 30kg, 50kg",
        packaging: "PP Bag / PP Woven Bag / PE Liner",
      },
      {
        name: "Coarse Grain",
        image: bulkSalt,
        details: "Coarse Grain",
        sizes: "5kg, 10kg, 20kg, 25kg, 30kg, 50kg",
        packaging: "PP Bag / PP Woven Bag / PE Liner",
      },
    ],
  },
  {
    title: "Stand-Up Pouches",
    id: "stand-up-pouches",
    image: pouches,
    description:
      "Modern zip-lock pouch packaging for retail, e-commerce and private label salt products.",
    icon: Layers3,
    items: [
      {
        name: "Fine Grain Pouch",
        image: pouches,
        details: "Fine Grain / Powder Form",
        sizes: "250g, 500g, 1kg",
        packaging: "Stand-Up Pouch Zip-Lock",
      },
      {
        name: "Coarse Grain Pouch",
        image: pouches,
        details: "Coarse Grain",
        sizes: "250g, 500g, 1kg",
        packaging: "Stand-Up Pouch Zip-Lock",
      },
    ],
  },
];
export default function ProductsPage() {
  return (
    <div className="bg-[#FFF8F5]">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16 py-16 lg:py-20">
        {/* HERO */}
        <div className="text-center max-w-4xl mx-auto">
          <span className="uppercase tracking-[8px] text-[#C23B4A] font-black text-lg">
            Products
          </span>
          <h1 className="text-3xl lg:text-5xl font-black mt-4 text-[#07142B] leading-tight">
            Himalayan Pink Salt Product Range
          </h1>
          <p className="text-slate-600 mt-5 text-base lg:text-lg leading-relaxed">
            Export-ready Himalayan Pink Salt products available in retail
            packaging, grinder bottles, stand-up pouches, PET jars and bulk
            export bags with private label support.
          </p>
        </div>
        {/* CATEGORY NAV */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {productGroups.map((group) => {
            const Icon = group.icon;
            return (
              <a
                key={group.title}
                href={`#${group.id}`}
                className="group bg-white border border-[#EFE3E5] rounded-[24px] p-5 hover:shadow-[0_18px_45px_rgba(194,59,74,0.10)] transition-all duration-300"
              >
                <div className="h-[170px] bg-[#FFF8F5] border border-[#EFE3E5] rounded-[20px] flex items-center justify-center mb-5 p-4">
                  <Image
                    src={group.image}
                    alt={group.title}
                    width={300}
                    height={300}
                    className="max-h-[140px] w-auto object-contain"
                  />
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[#FFF4F5] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#C23B4A]" />
                </div>

                <h3 className="text-lg font-black text-[#07142B]">
                  {group.title}
                </h3>

                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  View available sizes and packaging options.
                </p>
              </a>
            );
          })}
        </div>

        {/* PRODUCT SECTIONS */}
        <div className="mt-12 space-y-10">
          {productGroups.map((group) => {
            const Icon = group.icon;

            return (
              <section
                id={group.id}
                key={group.title}
                className="scroll-mt-28 bg-white border border-[#EFE3E5] rounded-[28px] p-5 lg:p-6 shadow-[0_10px_25px_rgba(194,59,74,0.05)]"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF4F5] flex items-center justify-center">
                    <Icon className="w-7 h-7 text-[#C23B4A]" />
                  </div>

                  <div>
                    <span className="uppercase tracking-[4px] text-[#C23B4A] font-black text-xs">
                      Product Category
                    </span>

                    <h2 className="text-2xl lg:text-4xl font-black text-[#07142B] mt-1">
                      {group.title}
                    </h2>
                  </div>
                </div>

                <p className="text-slate-600 leading-relaxed max-w-4xl mb-8">
                  {group.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {group.items.map((item) => (
                    <div
                      key={item.name}
                      className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[28px] overflow-hidden hover:shadow-[0_18px_45px_rgba(194,59,74,0.08)] transition"
                    >
                      <div className="h-[170px] bg-white flex items-center justify-center p-4 border-b border-[#EFE3E5]">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={300}
                          height={300}
                          className="max-h-[120px] w-auto object-contain"
                        />
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-black text-[#07142B]">
                          {item.name}
                        </h3>

                        <p className="text-[#C23B4A] font-semibold mt-2">
                          {item.details}
                        </p>

                        <div className="mt-5 space-y-4">
                          <div>
                            <p className="text-xs uppercase tracking-[2px] text-slate-400 font-bold">
                              Available Sizes
                            </p>

                            <p className="text-slate-700 mt-1 leading-relaxed">
                              {item.sizes}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-[2px] text-slate-400 font-bold">
                              Packaging Type
                            </p>

                            <p className="text-slate-700 mt-1 leading-relaxed">
                              {item.packaging}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <span className="inline-flex items-center gap-2 bg-white border border-[#EFE3E5] rounded-full px-4 py-2 text-sm font-semibold text-[#07142B]">
                            <BadgeCheck className="w-4 h-4 text-[#C23B4A]" />
                            Export Quality
                          </span>

                          <span className="inline-flex items-center gap-2 bg-white border border-[#EFE3E5] rounded-full px-4 py-2 text-sm font-semibold text-[#07142B]">
                            <Tags className="w-4 h-4 text-[#C23B4A]" />
                            Private Label
                          </span>
                        </div>

                        <Link
                          href="/contact"
                          className="inline-flex items-center gap-2 mt-6 bg-[#C23B4A] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
                        >
                          Request Quote
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* PRIVATE LABEL CTA */}
        <section className="mt-10 bg-[#C23B4A] rounded-[36px] overflow-hidden text-white">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] items-center">
            <div className="bg-[#B93645] p-8 lg:p-10 flex items-center justify-center">
              <div className="bg-white/10 rounded-[30px] p-6 lg:p-8 w-full flex items-center justify-center min-h-[320px]">
                <Image
                  src={privateLabel}
                  alt="Private Label Solutions"
                  width={500}
                  height={500}
                  className="max-h-[300px] w-auto object-contain"
                />
              </div>
            </div>

            <div className="p-8 lg:p-12">
              <span className="uppercase tracking-[6px] text-white/80 font-black text-sm">
                Private Label Solutions
              </span>

              <h2 className="text-3xl lg:text-5xl font-black mt-3 leading-tight">
                Build Your Own Himalayan Pink Salt Brand
              </h2>

              <p className="text-white/90 mt-4 max-w-3xl leading-relaxed">
                We support importers, distributors and retail brands with
                custom packaging, labeling, product development and export-ready
                private label solutions.
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <Link
                  href="/private-label"
                  className="bg-white text-[#C23B4A] px-8 py-4 rounded-xl font-bold hover:opacity-90 transition"
                >
                  View Private Label
                </Link>

                <Link
                  href="/contact"
                  className="border border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-[#C23B4A] transition"
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