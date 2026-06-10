import {
  ShieldCheck,
  BadgeCheck,
  Factory,
  FileCheck,
  Globe2,
  PackageCheck,
} from "lucide-react";

export default function Certifications() {
  const standards = [
    {
      icon: ShieldCheck,
      title: "HACCP Facility",
    },
    {
      icon: BadgeCheck,
      title: "HALAL Production",
    },
    {
      icon: Factory,
      title: "Food Grade Manufacturing",
    },
    {
      icon: Globe2,
      title: "Export Quality Standards",
    },
  ];

  const commitments = [
    "Food Grade Himalayan Pink Salt",
    "Export Documentation Support",
    "Global Supply Capability",
    "Private Label Manufacturing",
    "Quality Checked Before Dispatch",
    "Reliable Production Partners",
  ];

  return (
    <section className="bg-white py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT */}
          <div>
            <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
              Manufacturing Standards
            </span>

            <h2 className="text-4xl lg:text-5xl font-black mt-4 text-[#07142B] leading-tight">
              Produced Through Trusted
              <br />
              Manufacturing Partners
            </h2>

            <p className="text-slate-600 mt-6 text-lg leading-relaxed">
              Our Himalayan Pink Salt products are sourced and packed
              through manufacturing facilities operating under recognized
              food safety and quality management systems to support
              international export requirements.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-10">
              {standards.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-5"
                  >
                    <Icon className="w-6 h-6 text-[#C23B4A] mb-3" />

                    <h3 className="font-bold text-[#07142B]">
                      {item.title}
                    </h3>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[36px] p-10">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6">
              <PackageCheck className="w-8 h-8 text-[#C23B4A]" />
            </div>

            <h3 className="text-3xl font-black text-[#07142B]">
              Quality Commitment
            </h3>

            <p className="text-slate-600 mt-4">
              Every shipment is prepared with focus on quality,
              consistency and export readiness.
            </p>

            <div className="mt-8 space-y-4">
              {commitments.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 bg-white border border-[#EFE3E5] rounded-xl px-4 py-4"
                >
                  <FileCheck className="w-5 h-5 text-[#C23B4A] shrink-0" />

                  <span className="text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}