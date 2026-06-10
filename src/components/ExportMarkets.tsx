import {
  Globe2,
  Ship,
  Users,
  BadgeCheck,
} from "lucide-react";

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
    <section className="bg-[#FFF8F5] py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT */}
          <div>
            <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
              Global Export Network
            </span>

            <h2 className="text-4xl lg:text-5xl font-black mt-4 text-[#07142B] leading-tight">
              Delivering To 50+
              <br />
              Countries Worldwide
            </h2>

            <p className="text-slate-600 mt-6 text-lg leading-relaxed">
              We proudly export premium Himalayan Pink Salt products to
              importers, distributors, wholesalers and private label
              brands across major international markets.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              {countries.map((country) => (
                <span
                  key={country}
                  className="bg-white border border-[#EFE3E5] rounded-full px-5 py-3 text-sm font-medium text-[#07142B]"
                >
                  {country}
                </span>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-10">
              <div className="bg-white border border-[#EFE3E5] rounded-2xl p-5 text-center">
                <Ship className="w-6 h-6 mx-auto mb-3 text-[#C23B4A]" />
                <h3 className="font-bold text-[#07142B]">
                  Bulk Export
                </h3>
              </div>

              <div className="bg-white border border-[#EFE3E5] rounded-2xl p-5 text-center">
                <Users className="w-6 h-6 mx-auto mb-3 text-[#C23B4A]" />
                <h3 className="font-bold text-[#07142B]">
                  Global Buyers
                </h3>
              </div>

              <div className="bg-white border border-[#EFE3E5] rounded-2xl p-5 text-center">
                <BadgeCheck className="w-6 h-6 mx-auto mb-3 text-[#C23B4A]" />
                <h3 className="font-bold text-[#07142B]">
                  Export Quality
                </h3>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-white border border-[#EFE3E5] rounded-[36px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <h3 className="text-5xl font-black text-[#C23B4A]">
                  50+
                </h3>

                <p className="text-slate-500 mt-2">
                  Export Destinations
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-5xl font-black text-[#C23B4A]">
                  500+
                </h3>

                <p className="text-slate-500 mt-2">
                  Global Buyers
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-5xl font-black text-[#C23B4A]">
                  Bulk
                </h3>

                <p className="text-slate-500 mt-2">
                  Supply Capacity
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-5xl font-black text-[#C23B4A]">
                  100%
                </h3>

                <p className="text-slate-500 mt-2">
                  Export Quality
                </p>
              </div>
            </div>

            <div className="border-t border-[#EFE3E5] mt-10 pt-10 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-[#FFF4F5] flex items-center justify-center">
                <Globe2 className="w-12 h-12 text-[#C23B4A]" />
              </div>

              <h3 className="text-2xl font-bold text-[#07142B] mt-6">
                Worldwide Distribution
              </h3>

              <p className="text-slate-600 mt-4 leading-relaxed max-w-md mx-auto">
                Serving buyers across North America, Europe,
                Middle East, Asia and Australia with reliable
                supply and export support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}