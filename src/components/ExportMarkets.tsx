import Image from "next/image";
import { MapPin } from "lucide-react";

export default function ExportMarkets() {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

        {/* HEADER */}
        <div className="text-center mb-10">

          <span className="uppercase tracking-[7px] text-[#C23B4A] font-black text-lg">
            Global Export Network
          </span>

          {/* SMLHDNG */}
          <h2 className="text-3xl lg:text-5xl font-black mt-3 text-[#07142B]">
            Trusted By Buyers In 50+ Countries
          </h2>

          <p className="max-w-3xl mx-auto text-slate-600 mt-4 text-base lg:text-lg">
            Supplying premium Himalayan Pink Salt products to importers,
            distributors and private label brands across international markets.
          </p>

        </div>

        {/* MAIN BOX */}
        <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[32px] p-6 lg:p-8">

          <div className="grid lg:grid-cols-[1.8fr_380px] gap-8 items-center">

            {/* MAP */}
            <div>

              <h3 className="text-center font-black tracking-[4px] text-[#07142B] text-lg mb-6 uppercase">
                Trusted By Buyers In 50+ Countries
              </h3>

              <div className="relative">

                <Image
                  src="/world-map.png"
                  alt="World Map"
                  width={1200}
                  height={600}
                  className="w-full h-auto opacity-35"
                />

                {/* PINS */}

                <MapPin className="absolute left-[16%] top-[36%] w-6 h-6 text-[#C23B4A] fill-[#C23B4A]" />
                <MapPin className="absolute left-[23%] top-[58%] w-6 h-6 text-[#C23B4A] fill-[#C23B4A]" />
                <MapPin className="absolute left-[47%] top-[35%] w-6 h-6 text-[#C23B4A] fill-[#C23B4A]" />
                <MapPin className="absolute left-[58%] top-[39%] w-6 h-6 text-[#C23B4A] fill-[#C23B4A]" />
                <MapPin className="absolute left-[76%] top-[42%] w-6 h-6 text-[#C23B4A] fill-[#C23B4A]" />
                <MapPin className="absolute left-[84%] top-[68%] w-6 h-6 text-[#C23B4A] fill-[#C23B4A]" />

              </div>

            </div>

            {/* STATS BOX */}
            <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-8">

              <div className="space-y-5">

                <div className="flex items-center justify-between border-b border-[#F2E5E7] pb-4">
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    50+
                  </h3>

                  <span className="text-slate-600">
                    Export Destinations
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#F2E5E7] pb-4">
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    500+
                  </h3>

                  <span className="text-slate-600">
                    International Clients
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#F2E5E7] pb-4">
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    Bulk
                  </h3>

                  <span className="text-slate-600">
                    Supply Capability
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    100%
                  </h3>

                  <span className="text-slate-600">
                    Export Quality
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}