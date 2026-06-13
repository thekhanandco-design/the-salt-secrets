import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BottleWine,
  Boxes,
  Check,
  Globe2,
  Package,
  ShoppingBag,
  Tag,
  Weight,
  Wheat,
} from "lucide-react";

const filters = [
  {
    label: "Packaging Type",
    icon: Package,
    options: [
      "All",
      "PET Bottles",
      "PET Jars",
      "Grinder Bottle (Plastic)",
      "Grinder Bottle (Ceramic)",
      "Stand-Up Pouch",
      "PP Woven Bags",
    ],
  },
  {
    label: "Grain Type",
    icon: Wheat,
    options: ["All", "Fine Grain (Powder Form)", "Coarse Grain"],
  },
  {
    label: "Weight / Size",
    icon: Weight,
    options: ["All", "100 g", "200 g", "250 g", "500 g", "750 g", "1 kg", "2 kg", "5 kg+", "25 kg+", "50 kg"],
  },
];

const retailProducts = [
  {
    title: "Salt Shaker",
    subtitle: "(PET Bottle)",
    grain: "Fine Grain",
    sizes: "100g / 200g / 250g",
    image: "/retail-packaging.png",
  },
  {
    title: "Salt Jar",
    subtitle: "(PET Jar)",
    grain: "Fine Grain",
    sizes: "500g / 750g / 1kg / 2kg",
    image: "/retail-packaging.png",
  },
  {
    title: "Stand-Up Pouch",
    subtitle: "(Zip-Lock)",
    grain: "Fine Grain",
    sizes: "250g / 500g / 1kg",
    image: "/pouches.png",
  },
];

const grinders = [
  {
    title: "Grinder Bottle",
    subtitle: "(Plastic)",
    image: "/grinder-bottles.png",
  },
  {
    title: "Grinder Bottle",
    subtitle: "(Ceramic)",
    image: "/grinder-bottles.png",
  },
];

const bulkSizes = ["5 kg", "10 kg", "20 kg", "25 kg", "30 kg", "50 kg"];

const comparisonRows = [
  ["Salt Shaker (PET Bottle)", "Fine Grain", "100g, 200g, 250g", "PET Bottle (Shaker)", "Daily Use, Retail"],
  ["Salt Jar (PET Jar)", "Fine Grain", "500g, 750g, 1kg, 2kg", "PET Jar", "Kitchen Use, Retail"],
  ["Grinder Bottle (Plastic)", "Coarse Grain", "100g, 200g, 225g, 360g, 500g", "Grinder Cap Bottle (Plastic)", "Premium Retail"],
  ["Grinder Bottle (Ceramic)", "Coarse Grain", "100g, 200g, 225g, 360g, 500g", "Grinder Cap Bottle (Ceramic)", "Premium Retail"],
  ["Stand-Up Pouch (Zip-Lock)", "Fine Grain", "250g, 500g, 1kg", "Stand-Up Pouch (Zip-Lock)", "Retail, E-commerce"],
  ["Bulk Bags (PP Woven)", "Fine / Coarse Grain", "5kg, 10kg, 20kg, 25kg, 30kg, 50kg", "PP Woven Bags", "Industrial, Food Processing"],
];

export default function ProductsPage() {
  return (
    <main className="bg-[#FFF8F5]">
      <div className="max-w-[1500px] mx-auto px-5 lg:px-12 py-14">
        {/* HERO */}
        <section className="text-center max-w-4xl mx-auto">
          <span className="uppercase tracking-[8px] text-[#C23B4A] font-black text-sm">
            Products
          </span>

          <h1 className="text-4xl lg:text-6xl font-black text-[#07142B] mt-4 leading-tight">
            Himalayan Pink Salt Product Collection
          </h1>

          <p className="text-slate-600 text-base lg:text-lg mt-5 leading-relaxed">
            Export-ready Himalayan Pink Salt products available in retail
            packaging, grinder bottles, stand-up pouches, bulk supply and
            private label solutions.
          </p>
        </section>

        {/* FILTERS */}
        <section className="bg-white border border-[#EFE3E5] rounded-[24px] p-5 mt-10 shadow-[0_12px_35px_rgba(194,59,74,0.06)]">
          <div className="space-y-4">
            {filters.map((filter) => {
              const Icon = filter.icon;

              return (
                <div
                  key={filter.label}
                  className="grid lg:grid-cols-[190px_1fr] gap-4 items-center border-b last:border-b-0 border-[#F1E2E5] pb-4 last:pb-0"
                >
                  <div className="flex items-center gap-3 text-[#07142B] font-black text-sm">
                    <Icon className="w-5 h-5 text-[#C23B4A]" />
                    {filter.label}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {filter.options.map((option, index) => (
                      <button
                        key={option}
                        className={`px-5 py-2 rounded-md border text-sm font-semibold transition ${
                          index === 0
                            ? "border-[#C23B4A] text-[#C23B4A] bg-[#FFF4F5]"
                            : "border-[#E7DDE0] text-slate-600 bg-white hover:border-[#C23B4A]"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RETAIL PACKAGING */}
        <section className="mt-10">
          <SectionHeading
            title="Retail Packaging"
            subtitle="Perfect for everyday use with premium quality and attractive packaging."
          />

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {retailProducts.map((product) => (
              <div
                key={product.title}
                className="bg-white border border-[#EFE3E5] rounded-[24px] p-6 shadow-[0_12px_30px_rgba(194,59,74,0.05)]"
              >
                <h3 className="text-xl font-black text-[#07142B]">
                  {product.title}
                </h3>
                <p className="text-sm font-bold text-[#07142B]">
                  {product.subtitle}
                </p>

                <p className="text-sm text-slate-600 mt-4">
                  {product.grain}
                </p>
                <p className="text-sm text-slate-600">
                  {product.sizes}
                </p>

                <div className="h-[190px] flex items-center justify-center mt-4">
                  <Image
                    src={product.image}
                    alt={product.title}
                    width={360}
                    height={260}
                    className="max-h-[180px] w-auto object-contain"
                  />
                </div>

                <Link
                  href="/contact"
                  className="mt-5 flex items-center justify-center gap-3 border border-[#C23B4A] text-[#C23B4A] rounded-lg py-3 font-black hover:bg-[#C23B4A] hover:text-white transition"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* GRINDER COLLECTION */}
        <section className="mt-10">
          <SectionHeading
            title="Grinder Collection"
            subtitle="Available in plastic and ceramic grinder bottles."
          />

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {grinders.map((item) => (
              <div
                key={item.subtitle}
                className="bg-white border border-[#EFE3E5] rounded-[24px] p-7 grid md:grid-cols-[180px_1fr] gap-5 items-center shadow-[0_12px_30px_rgba(194,59,74,0.05)]"
              >
                <div>
                  <h3 className="text-xl font-black text-[#07142B]">
                    {item.title}
                  </h3>
                  <p className="text-sm font-bold text-[#07142B]">
                    {item.subtitle}
                  </p>

                  <ul className="mt-5 space-y-2 text-sm text-slate-700">
                    {["100 g", "200 g", "225 g", "360 g", "500 g"].map(
                      (size) => (
                        <li key={size} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#C23B4A]" />
                          {size}
                        </li>
                      )
                    )}
                  </ul>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-3 mt-5 bg-[#C23B4A] text-white px-5 py-3 rounded-lg font-black text-sm"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="h-[210px] flex items-center justify-center">
                  <Image
                    src={item.image}
                    alt={`${item.title} ${item.subtitle}`}
                    width={430}
                    height={260}
                    className="max-h-[210px] w-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BULK SALT */}
        <section className="mt-10">
          <SectionHeading
            title="Bulk Salt Packaging"
            subtitle="Ideal for industrial use, food processing and large scale supply."
          />

          <div className="space-y-5 mt-6">
            <BulkRow title="Fine Grain" subtitle="(Powder Form)" />
            <BulkRow title="Coarse Grain" subtitle="" />
          </div>
        </section>

        {/* PRIVATE LABEL */}
        <section className="mt-10">
          <SectionHeading
            title="Private Label Solutions"
            subtitle="We help brands create their identity with custom packaging and branding."
          />

          <div className="grid md:grid-cols-3 gap-0 bg-white border border-[#EFE3E5] rounded-[24px] overflow-hidden shadow-[0_12px_30px_rgba(194,59,74,0.05)] mt-6">
            <FeatureCard
              icon={<Tag className="w-14 h-14 text-[#C23B4A]" />}
              title="Custom Labels"
              text="Custom label design to match your brand identity."
            />
            <FeatureCard
              icon={<Package className="w-14 h-14 text-[#C23B4A]" />}
              title="Custom Packaging"
              text="Flexible packaging options tailored to your requirements."
            />
            <FeatureCard
              icon={<Globe2 className="w-14 h-14 text-[#C23B4A]" />}
              title="Global Export"
              text="Reliable export support and timely worldwide delivery."
            />
          </div>
        </section>

        {/* COMPARISON */}
        <section className="mt-10">
          <SectionHeading
            title="Product Comparison"
            subtitle="Explore our product range at a glance."
          />

          <div className="overflow-hidden rounded-[16px] border border-[#EFE3E5] bg-white mt-6 shadow-[0_12px_30px_rgba(194,59,74,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-[#C23B4A] text-white">
                  <tr>
                    {[
                      "Product Type",
                      "Grain Type",
                      "Available Sizes",
                      "Packaging Type",
                      "Best For",
                    ].map((head) => (
                      <th key={head} className="px-5 py-4 text-left font-black">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row[0]} className="border-b border-[#EFE3E5] last:border-b-0">
                      {row.map((cell) => (
                        <td key={cell} className="px-5 py-4 text-slate-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-10 bg-[#C23B4A] rounded-[24px] p-8 lg:p-10 text-white grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-3xl lg:text-4xl font-black">
                Need Custom Packaging Or Bulk Supply?
              </h2>

              <p className="text-white/85 mt-3">
                Get in touch with us for the best quotes and long-term partnerships.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="bg-white text-[#C23B4A] px-8 py-4 rounded-xl font-black"
            >
              Get A Free Quote
            </Link>

            <Link
              href="https://wa.me/923462771693"
              target="_blank"
              className="border border-white px-8 py-4 rounded-xl font-black"
            >
              WhatsApp Us
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-4">
        <span className="w-12 h-[2px] bg-[#C23B4A]" />
        <h2 className="uppercase tracking-[4px] text-[#C23B4A] font-black text-xl">
          {title}
        </h2>
        <span className="w-12 h-[2px] bg-[#C23B4A]" />
      </div>

      <p className="text-slate-600 mt-2 text-sm">
        {subtitle}
      </p>
    </div>
  );
}

function BulkRow({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-5 grid lg:grid-cols-[210px_1fr_170px] gap-5 items-center shadow-[0_12px_30px_rgba(194,59,74,0.05)]">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#FFF4F5] flex items-center justify-center">
          <Boxes className="w-8 h-8 text-[#C23B4A]" />
        </div>

        <div>
          <h3 className="text-xl font-black text-[#07142B]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-[#07142B]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {bulkSizes.map((size) => (
          <div key={`${title}-${size}`} className="text-center">
            <Image
              src="/white-sack.png"
              alt={`${title} ${size}`}
              width={90}
              height={110}
              className="h-[72px] w-auto object-contain mx-auto"
            />
            <p className="text-xs font-black text-[#07142B] mt-2">
              {size}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 lg:justify-end">
        <div className="w-16 h-16 rounded-full bg-[#FFF4F5] flex items-center justify-center">
          <Package className="w-8 h-8 text-[#C23B4A]" />
        </div>

        <div>
          <p className="font-black text-[#07142B]">Packaging</p>
          <p className="text-sm text-slate-600">PP Woven Bags</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="p-8 border-b md:border-b-0 md:border-r last:border-r-0 border-[#EFE3E5]">
      <div>{icon}</div>

      <h3 className="font-black text-xl text-[#07142B] mt-5">
        {title}
      </h3>

      <p className="text-slate-600 text-sm mt-3 leading-relaxed">
        {text}
      </p>
    </div>
  );
}