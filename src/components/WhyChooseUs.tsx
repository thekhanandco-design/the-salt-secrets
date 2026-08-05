import {
  ShieldCheck,
  Package,
  Globe2,
  Award,
  Users,
  Boxes,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Reliable Supply",
    desc: "Planned production and dependable export supply for wholesalers, distributors and private-label programs.",
  },
  {
    icon: Boxes,
    title: "Flexible MOQ",
    desc: "Order quantities suited to trial launches, growing brands and established importers.",
  },
  {
    icon: Package,
    title: "Custom Packaging",
    desc: "PET bottles, grinders, jars and stand-up pouches customized for your brand and target market.",
  },
  {
    icon: Globe2,
    title: "Export Support",
    desc: "Support for product specifications, commercial documents and international shipment coordination.",
  },
  {
    icon: Award,
    title: "Quality Focused",
    desc: "Specification-based packing and defined quality checks for food-grade Himalayan Pink Salt.",
  },
  {
    icon: Users,
    title: "Global Reach",
    desc: "Responsive B2B support for retail, foodservice and distribution buyers across international markets.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

        {/* HEADING */}
        <div className="text-center mb-12">
          <h2
            className="font-black text-[#07142B]"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(2rem,3vw,3.3rem)",
            }}
          >
            WHY CHOOSE US
          </h2>

          <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />
        </div>

        {/* FEATURES */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6">

          {features.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className={`text-center px-5 py-4 ${
                  index !== features.length - 1
                    ? "lg:border-r border-[#F1D9DD]"
                    : ""
                }`}
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-[#FFF4F5] flex items-center justify-center">
                  <Icon className="w-9 h-9 text-[#C23B4A]" />
                </div>

                <h3 className="font-black text-[#07142B] mt-5 text-lg">
                  {item.title}
                </h3>

                <p className="text-slate-600 text-sm mt-3 leading-relaxed">
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