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
    <section className="bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
            Export Markets
          </span>

          <h2 className="text-5xl font-bold mt-4">
            Serving Global Buyers
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {countries.map((country) => (
            <div
              key={country}
              className="bg-white border rounded-2xl p-6 text-center font-semibold"
            >
              {country}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}