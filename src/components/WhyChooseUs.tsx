export default function WhyChooseUs() {
  const features = [
    "Direct Manufacturer",
    "Private Label Solutions",
    "Export Documentation",
    "Bulk Production Capacity",
    "Quality Control",
    "Worldwide Shipping",
  ];

  return (
    <section className="bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
            Why Choose Us
          </span>

          <h2 className="text-5xl font-bold mt-4">
            Trusted Export Partner
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((item) => (
            <div
              key={item}
              className="bg-white p-8 rounded-[24px] shadow-sm border"
            >
              <h3 className="font-bold text-xl">{item}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}