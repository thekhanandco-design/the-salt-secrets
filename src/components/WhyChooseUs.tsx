import {
  Factory,
  Globe2,
  Tags,
  ShieldCheck,
  Truck,
  Package,
} from "lucide-react";

const features = [
  {
    icon: Factory,
    title: "Direct From Source",
    desc: "Reliable sourcing and competitive pricing from the origin.",
  },
  {
    icon: Globe2,
    title: "Global Export Network",
    desc: "Serving importers, distributors and wholesalers worldwide.",
  },
  {
    icon: Tags,
    title: "Private Label Solutions",
    desc: "Custom packaging and branding tailored to your business.",
  },
  {
    icon: ShieldCheck,
    title: "Food Grade Quality",
    desc: "Strict quality standards for premium Himalayan Pink Salt.",
  },
  {
    icon: Truck,
    title: "Consistent Supply Chain",
    desc: "Stable production and dependable delivery schedules.",
  },
  {
    icon: Package,
    title: "Bulk Supply Capacity",
    desc: "Scalable volumes for distributors and retail partners.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-14 lg:py-16 bg-[#FFF8F5]">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

        {/* HEADER */}
        <div className="text-center mb-10">

          <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
            Why Choose Us
          </span>

          <h2 className="text-3xl lg:text-4xl font-black mt-3 text-[#07142B]">
            Your Trusted Export Partner
          </h2>

          <p className="max-w-3xl mx-auto text-slate-600 mt-3 text-base">
            Delivering premium Himalayan Pink Salt products with dependable
            sourcing, private label expertise and global export support.
          </p>

        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

          {features.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group bg-white border border-[#EFE3E5] rounded-[20px] p-5 hover:shadow-[0_10px_25px_rgba(194,59,74,0.06)] transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FFF4F5] flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-[#C23B4A]" />
                </div>

                <h3 className="text-lg font-bold text-[#07142B]">
                  {item.title}
                </h3>

                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}