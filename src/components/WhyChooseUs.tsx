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
    desc: "On-time delivery with stable production capacity.",
  },
  {
    icon: Boxes,
    title: "Flexible MOQ",
    desc: "Low minimum order quantity to support your business.",
  },
  {
    icon: Package,
    title: "Custom Packaging",
    desc: "Wide range of packaging options tailored to your market.",
  },
  {
    icon: Globe2,
    title: "Export Support",
    desc: "Complete documentation and export assistance provided.",
  },
  {
    icon: Award,
    title: "Quality Focused",
    desc: "Strict quality control ensuring 100% pure Himalayan salt.",
  },
  {
    icon: Users,
    title: "Global Reach",
    desc: "Serving clients in 50+ countries across the world.",
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