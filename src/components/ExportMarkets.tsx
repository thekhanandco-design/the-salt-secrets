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
    <section className="bg-[#FFF8F5] py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT */}
          <div>
            <span className="uppercase tracking-[5px] text-[#C98A92] font-bold text-xs">
              We Export To
            </span>

            <h2 className="text-5xl font-bold mt-4 text-slate-950">
              Delivering To 50+
              <br />
              Countries Worldwide
            </h2>

            <p className="text-slate-600 mt-6 text-lg leading-relaxed">
              We supply premium Himalayan Pink Salt products to importers,
              distributors, wholesalers and private label brands across
              major international markets.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              {countries.map((country) => (
                <span
                  key={country}
                  className="bg-white border border-[#F0DDE1] rounded-full px-5 py-3 text-sm font-medium"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-white rounded-[32px] border border-[#F0DDE1] p-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <h3 className="text-5xl font-bold text-[#C98A92]">
                  50+
                </h3>
                <p className="text-slate-500 mt-2">
                  Export Destinations
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-5xl font-bold text-[#C98A92]">
                  500+
                </h3>
                <p className="text-slate-500 mt-2">
                  Global Buyers
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-5xl font-bold text-[#C98A92]">
                  Bulk
                </h3>
                <p className="text-slate-500 mt-2">
                  Supply Capability
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-5xl font-bold text-[#C98A92]">
                  100%
                </h3>
                <p className="text-slate-500 mt-2">
                  Export Quality
                </p>
              </div>
            </div>

            <div className="mt-10 border-t pt-8 text-center">
              <div className="text-7xl mb-4">🌎</div>

              <p className="text-slate-600">
                Serving international buyers across North America,
                Europe, Middle East, Asia and Australia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}