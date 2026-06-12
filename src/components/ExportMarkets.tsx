import Image from "next/image";
import { MapPin } from "lucide-react";

export default function ExportMarkets() {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-[1900px] mx-auto px-4 lg:px-10">

        {/* HEADER REMOVED */}

        {/* MAIN BOX */}
        <div className="bg-white border border-[#EFE3E5] rounded-[32px] p-5 lg:p-6">

          <div className="grid lg:grid-cols-[2.2fr_360px] gap-5 items-center">

            {/* MAP */}
            <div>

              <h3 className="text-center font-black tracking-[5px] text-[#07142B] text-[22px] mb-5 uppercase">
                Trusted By Buyers In 50+ Countries
              </h3>

              <div className="relative bg-white rounded-[24px] overflow-hidden">

                <Image
                  src="/world-map.png"
                  alt="World Map"
                  width={1400}
                  height={700}
                  className="w-full h-auto opacity-70"
                />

                {/* PINS */}

                <MapPin className="absolute left-[16%] top-[36%] w-6 h-6 text-[#C23B4A] fill-[#C23B4A]" />

                <MapPin className="absolute left-[47%] top-[35%] w-6 h-6 text-[#C23B4A] fill-[#C23B4A]" />

                <MapPin className="absolute left-[76%] top-[42%] w-6 h-6 text-[#C23B4A] fill-[#C23B4A]" />

                <MapPin className="absolute left-[84%] top-[68%] w-6 h-6 text-[#C23B4A] fill-[#C23B4A]" />

              </div>

            </div>

            {/* STATS BOX */}
            <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[24px] p-8 h-full">

              <div className="space-y-5">

                <div className="flex items-center justify-between border-b border-[#F2E5E7] pb-4">
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    50+
                  </h3>

                  <span className="text-slate-600 text-lg">
                    Export Destinations
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#F2E5E7] pb-4">
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    500+
                  </h3>

                  <span className="text-slate-600 text-lg">
                    International Clients
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#F2E5E7] pb-4">
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    Bulk
                  </h3>

                  <span className="text-slate-600 text-lg">
                    Supply Capability
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    100%
                  </h3>

                  <span className="text-slate-600 text-lg">
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