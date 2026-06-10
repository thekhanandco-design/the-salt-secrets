export default function WhyChooseUs() {
  const features = [
    {
      icon: "🏭",
      title: "Direct Manufacturer",
      desc: "Competitive factory pricing and reliable production.",
    },
    {
      icon: "🛡️",
      title: "Quality Control",
      desc: "Strict quality checks and export-grade standards.",
    },
    {
      icon: "📦",
      title: "Bulk Production",
      desc: "High-capacity manufacturing for global buyers.",
    },
    {
      icon: "📄",
      title: "Export Documentation",
      desc: "Complete export paperwork and compliance support.",
    },
    {
      icon: "🌎",
      title: "Worldwide Shipping",
      desc: "Fast and reliable worldwide logistics solutions.",
    },
    {
      icon: "🏷️",
      title: "Private Label",
      desc: "Custom branding and packaging solutions.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="uppercase tracking-[5px] text-[#C98A92] font-bold text-xs">
            Why Choose Us
          </span>

          <h2 className="text-5xl font-bold mt-4 text-slate-950">
            Your Trusted Export Partner
          </h2>

          <p className="max-w-3xl mx-auto text-slate-600 mt-5 text-lg">
            Delivering premium Himalayan Pink Salt products with
            quality assurance, global logistics and private label
            solutions for international buyers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item) => (
            <div
              key={item.title}
              className="bg-[#FFF8F5] border border-[#F0DDE1] rounded-[28px] p-8 hover:shadow-[0_20px_60px_rgba(201,138,146,0.15)] transition"
            >
              <div className="text-4xl mb-5">
                {item.icon}
              </div>

              <h3 className="text-2xl font-bold text-slate-950">
                {item.title}
              </h3>

              <p className="text-slate-600 mt-3 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}