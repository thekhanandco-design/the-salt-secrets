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

const productGroups = [
  {
    title: "Retail Packaging",
    id: "retail-packaging",
    image: "/products/retail-packaging.png",
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
    id: "grinder-bottles",
    image: "/products/grinder-bottles.png",
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
    id: "bulk-salt",
    image: "/products/bulk-salt.png",
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
    id: "stand-up-pouches",
    image: "/products/pouches.png",
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
          {productGroups.map((group, groupIndex) => {
            const Icon = group.icon;

            return (
              <section
                id={group.id}
                key={group.title}
                className="scroll-mt-28 bg-white border border-[#EFE3E5] rounded-[36px] overflow-hidden shadow-[0_18px_50px_rgba(194,59,74,0.06)]"
              >
                <div
                  className={`grid lg:grid-cols-[0.9fr_1.1fr] items-stretch ${
                    groupIndex % 2 === 1
                      ? "lg:[&>*:first-child]:order-2"
                      : ""
                  }`}
                >
                  {/* IMAGE PANEL */}
                  <div className="bg-[#FFF4F5] p-8 lg:p-10 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#EFE3E5]">
                    <div className="w-full bg-white rounded-[30px] border border-[#EFE3E5] p-6 lg:p-8 min-h-[360px] flex items-center justify-center">
                      <Image
                        src={group.image}
                        alt={group.title}
                        width={700}
                        height={700}
                        className="max-h-[330px] w-auto object-contain"
                        priority={groupIndex === 0}
                      />
                    </div>
                  </div>

                  {/* CONTENT PANEL */}
                  <div className="p-7 lg:p-10">
                    <div className="flex items-center gap-4 mb-5">
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

                    <p className="text-slate-600 leading-relaxed max-w-3xl">
                      {group.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 bg-[#FFF8F5] border border-[#EFE3E5] rounded-full px-4 py-2 text-sm font-semibold text-[#07142B]">
                        <BadgeCheck className="w-4 h-4 text-[#C23B4A]" />
                        Export Quality
                      </span>

                      <span className="inline-flex items-center gap-2 bg-[#FFF8F5] border border-[#EFE3E5] rounded-full px-4 py-2 text-sm font-semibold text-[#07142B]">
                        <Tags className="w-4 h-4 text-[#C23B4A]" />
                        Private Label Available
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 mt-8">
                      {group.items.map((item) => (
                        <div
                          key={item.name}
                          className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[24px] p-6"
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

                          <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 mt-6 text-[#C23B4A] font-bold hover:underline"
                          >
                            Request Quote
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
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
                  src="/products/private-label.png"
                  alt="Private Label Solutions"
                  width={700}
                  height={700}
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

              <div className="grid sm:grid-cols-2 gap-3 mt-7">
                {[
                  "Custom Labels",
                  "Custom Packaging",
                  "MOQ Support",
                  "Export Documentation",
                ].map((item) => (
                  <div
                    key={item}
                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-semibold"
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>

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

        {/* FINAL CTA */}
        <section className="mt-10 bg-white border border-[#EFE3E5] rounded-[36px] p-8 lg:p-12 text-center">
          <h2 className="text-3xl lg:text-5xl font-black text-[#07142B]">
            Ready To Source Himalayan Pink Salt?
          </h2>

          <p className="text-slate-600 mt-4 max-w-3xl mx-auto leading-relaxed">
            Contact our team for product specifications, packaging options,
            quotations and export support.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              href="/contact"
              className="bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition"
            >
              Get Quote
            </Link>

            <Link
              href="https://wa.me/923462771693"
              target="_blank"
              className="border border-[#C23B4A] text-[#C23B4A] px-8 py-4 rounded-xl font-bold hover:bg-[#C23B4A] hover:text-white transition"
            >
              WhatsApp Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}