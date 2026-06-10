import {
  Factory,
  ShieldCheck,
  Package,
  FileCheck,
  Globe2,
  Tags,
} from "lucide-react";

const features = [
  {
    icon: Factory,
    title: "Direct Manufacturer",
    desc: "Competitive factory pricing, consistent production capacity and reliable supply chain support.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assurance",
    desc: "Strict quality control procedures to ensure premium export-grade Himalayan Pink Salt.",
  },
  {
    icon: Package,
    title: "Bulk Supply",
    desc: "Scalable production capabilities for wholesalers, distributors and large retail chains.",
  },
  {
    icon: FileCheck,
    title: "Export Documentation",
    desc: "Complete export paperwork, compliance support and international shipping documentation.",
  },
  {
    icon: Globe2,
    title: "Worldwide Shipping",
    desc: "Efficient logistics solutions serving importers and buyers across global markets.",
  },
  {
    icon: Tags,
    title: "Private Label Solutions",
    desc: "Custom packaging, branding and labeling services tailored to your business requirements.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-28 bg-[#FFF8F5]">
      <div className="max-w-7xl mx-auto px-6">
        {/* HEADER */}
        <div className="text-center mb-16">
          <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
            Why Choose Us
          </span>

          <h2 className="text-4xl lg:text-5xl font-black mt-4 text-[#07142B]">
            Your Trusted Export Partner
          </h2>

          <p className="max-w-3xl mx-auto text-slate-600 mt-5 text-lg">
            Delivering premium Himalayan Pink Salt products with
            dependable manufacturing, export expertise and global
            distribution support.
          </p>
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group bg-white border border-[#EFE3E5] rounded-[30px] p-8 hover:shadow-[0_25px_60px_rgba(194,59,74,0.12)] transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FFF4F5] flex items-center justify-center mb-6 group-hover:bg-[#C23B4A] transition">
                  <Icon className="w-7 h-7 text-[#C23B4A] group-hover:text-white transition" />
                </div>

                <h3 className="text-xl font-bold text-[#07142B]">
                  {item.title}
                </h3>

                <p className="text-slate-600 mt-4 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* BOTTOM STATS */}
        <div className="grid md:grid-cols-3 gap-6 mt-14">
          <div className="bg-white rounded-[24px] border border-[#EFE3E5] p-8 text-center">
            <h3 className="text-4xl font-black text-[#07142B]">
              50+
            </h3>

            <p className="text-slate-500 mt-2">
              Export Destinations
            </p>
          </div>

          <div className="bg-white rounded-[24px] border border-[#EFE3E5] p-8 text-center">
            <h3 className="text-4xl font-black text-[#07142B]">
              100%
            </h3>

            <p className="text-slate-500 mt-2">
              Natural Products
            </p>
          </div>

          <div className="bg-white rounded-[24px] border border-[#EFE3E5] p-8 text-center">
            <h3 className="text-4xl font-black text-[#07142B]">
              OEM
            </h3>

            <p className="text-slate-500 mt-2">
              Private Label Support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}