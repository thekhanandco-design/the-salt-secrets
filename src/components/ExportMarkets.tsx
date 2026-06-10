export default function ExportMarkets() {
  const countries = [
    "USA",
    "Canada",
    "United Kingdom",
    "Germany",
    "UAE",
    "Saudi Arabia",
    "Australia",
    "Europe",
  ];

  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="uppercase tracking-[6px] text-[#C98A92] font-semibold">
            Export Markets
          </span>

          <h2 className="text-5xl lg:text-6xl font-bold mt-5">
            Trusted By Buyers Worldwide
          </h2>

          <p className="text-slate-600 mt-6 max-w-2xl mx-auto">
            We export premium Himalayan Pink Salt products to
            distributors, retailers and private label brands
            across major international markets.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {countries.map((country) => (
            <div
              key={country}
              className="bg-white border rounded-3xl p-8 text-center shadow-sm hover:shadow-xl transition"
            >
              <div className="text-3xl mb-3">🌍</div>

              <h3 className="font-bold text-lg">
                {country}
              </h3>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-[#faf7f3] rounded-3xl p-8 text-center">
            <h3 className="text-5xl font-bold">50+</h3>
            <p className="text-slate-600 mt-3">
              Export Destinations
            </p>
          </div>

          <div className="bg-[#faf7f3] rounded-3xl p-8 text-center">
            <h3 className="text-5xl font-bold">500+</h3>
            <p className="text-slate-600 mt-3">
              International Clients
            </p>
          </div>

          <div className="bg-[#faf7f3] rounded-3xl p-8 text-center">
            <h3 className="text-5xl font-bold">100%</h3>
            <p className="text-slate-600 mt-3">
              Export Quality
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}