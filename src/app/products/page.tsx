import Link from "next/link";
import {
  Package,
  BottleWine,
  Boxes,
  Tags,
  Layers3,
  BadgeCheck,
} from "lucide-react";

const productGroups = [
  {
    title: "Retail Packaging",
    description:
      "Shelf-ready Himalayan Pink Salt packaging for supermarkets, retailers and consumer brands.",
    icon: Package,
    items: [
      {
        name: "PET Bottle",
        details: "Fine Grain / Powder Form",
        sizes: "100g, 200g, 250g, 500g, 750g",
        packaging: "PET Bottle Shaker / Pourer",
      },
      {
        name: "PET Jar",
        details: "Fine Grain / Powder Form",
        sizes: "1kg, 1.5kg, 2kg",
        packaging: "PET Jar",
      },
    ],
  },
  {
    title: "Grinder Bottles",
    description:
      "Premium grinder bottles for retail shelves, gourmet salt brands and private label packaging.",
    icon: BottleWine,
    items: [
      {
        name: "Plastic Grinder",
        details: "Coarse Grain",
        sizes: "100g, 200g, 225g, 360g, 500g",
        packaging: "Grinder Cap Bottle Plastic",
      },
      {
        name: "Ceramic Grinder",
        details: "Coarse Grain",
        sizes: "100g, 200g, 225g, 360g, 500g",
        packaging: "Grinder Cap Bottle Ceramic",
      },
    ],
  },
  {
    title: "Bulk Salt",
    description:
      "Bulk Himalayan Pink Salt supply for importers, wholesalers, food service and industrial buyers.",
    icon: Boxes,
    items: [
      {
        name: "Fine Grain",
        details: "Fine Grain / Powder Form",
        sizes: "5kg, 10kg, 20kg, 25kg, 30kg, 50kg",
        packaging: "PP Bag / PP Woven Bag / PE Liner",
      },
      {
        name: "Coarse Grain",
        details: "Coarse Grain",
        sizes: "5kg, 10kg, 20kg, 25kg, 30kg, 50kg",
        packaging: "PP Bag / PP Woven Bag / PE Liner",
      },
    ],
  },
  {
    title: "Stand-Up Pouches",
    description:
      "Modern zip-lock pouch packaging for retail, e-commerce and private label salt products.",
    icon: Layers3,
    items: [
      {
        name: "Fine Grain Pouch",
        details: "Fine Grain / Powder Form",
        sizes: "250g, 500g, 1kg",
        packaging: "Stand-Up Pouch Zip-Lock",
      },
      {
        name: "Coarse Grain Pouch",
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

          {/* SMLHDNG */}
          <h1 className="text-3xl lg:text-5xl font-black mt-4 text-[#07142B] leading-tight">
            Himalayan Pink Salt Product Range
          </h1>

          <p className="text-slate-600 mt-5 text-base lg:text-lg leading-relaxed">
            Export-ready Himalayan Pink Salt products available in retail
            packaging, grinder bottles, stand-up pouches, PET jars and bulk
            export bags with private label support.
          </p>
        </div>

        {/* MAIN PRODUCT GROUPS */}
        <div className="mt-14 space-y-8">
          {productGroups.map((group) => {
            const Icon = group.icon;

            return (
              <section
                key={group.title}
                className="bg-white border border-[#EFE3E5] rounded-[32px] p-6 lg:p-8 shadow-[0_15px_40px_rgba(194,59,74,0.05)]"
              >
                <div className="grid lg:grid-cols-[0.75fr_1.25fr] gap-8 items-start">
                  {/* CATEGORY INFO */}
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-[#FFF4F5] flex items-center justify-center mb-5">
                      <Icon className="w-7 h-7 text-[#C23B4A]" />
                    </div>

                    <h2 className="text-2xl lg:text-3xl font-black text-[#07142B]">
                      {group.title}
                    </h2>

                    <p className="text-slate-600 mt-3 leading-relaxed">
                      {group.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 bg-[#FFF8F5] border border-[#EFE3E5] rounded-full px-4 py-2 text-sm font-semibold text-[#07142B]">
                        <BadgeCheck className="w-4 h-4 text-[#C23B4A]" />
                        Export Quality
                      </span>

                      <span className="inline-flex items-center gap-2 bg-[#FFF8F5] border border-[#EFE3E5] rounded-full px-4 py-2 text-sm font-semibold text-[#07142B]">
                        <Tags className="w-4 h-4 text-[#C23B4A]" />
                        Private Label
                      </span>
                    </div>
                  </div>

                  {/* ITEMS */}
                  <div className="grid md:grid-cols-2 gap-5">
                    {group.items.map((item) => (
                      <div
                        key={item.name}
                        className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[24px] p-6 hover:shadow-[0_15px_40px_rgba(194,59,74,0.08)] transition"
                      >
                        <h3 className="text-xl font-black text-[#07142B]">
                          {item.name}
                        </h3>

                        <p className="text-[#C23B4A] font-semibold mt-2">
                          {item.details}
                        </p>

                        <div className="mt-5 space-y-4">
                          <div>
                            <p className="text-xs uppercase tracking-[2px] text-slate-400 font-bold">
                              Net Weight
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

                        <Link
                          href="/contact"
                          className="inline-flex items-center mt-6 text-[#C23B4A] font-bold hover:underline"
                        >
                          Request Quote →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* PRIVATE LABEL CTA */}
        <section className="mt-10 bg-[#C23B4A] rounded-[32px] p-8 lg:p-12 text-white">
          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <span className="uppercase tracking-[6px] text-white/80 font-black text-sm">
                Private Label Solutions
              </span>

              <h2 className="text-3xl lg:text-5xl font-black mt-3">
                Build Your Own Himalayan Pink Salt Brand
              </h2>

              <p className="text-white/90 mt-4 max-w-3xl leading-relaxed">
                We support importers, distributors and retail brands with
                custom packaging, labeling, product development and export-ready
                private label solutions.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
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
        </section>
      </div>
    </div>
  );
}