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
    <section className="py-16 lg:py-20 bg-[#FFF8F5]">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

        {/* HEADER */}
        <div className="text-center mb-12">

          <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
            Why Choose Us
          </span>

          <h2 className="text-3xl lg:text-5xl font-black mt-4 text-[#07142B]">
            Your Trusted Export Partner
          </h2>

          <p className="max-w-3xl mx-auto text-slate-600 mt-4 text-base lg:text-lg">
            Delivering premium Himalayan Pink Salt products with dependable
            sourcing, private label expertise and global export support.
          </p>

        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

          {features.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group bg-white border border-[#EFE3E5] rounded-[24px] p-6 hover:shadow-[0_15px_40px_rgba(194,59,74,0.08)] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FFF4F5] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#C23B4A]" />
                </div>

                <h3 className="text-xl font-bold text-[#07142B]">
                  {item.title}
                </h3>

                <p className="text-slate-600 mt-3 text-[15px] leading-relaxed">
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