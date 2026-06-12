import Image from "next/image";

export default function ExportMarkets() {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-[1900px] mx-auto px-4 lg:px-10">

        <div className="bg-white border border-[#EFE3E5] rounded-[32px] p-5 lg:p-6">

          <h3 className="text-center font-black tracking-[5px] text-[#07142B] text-[22px] mb-5 uppercase">
            Trusted By Buyers In 50+ Countries
          </h3>

          <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-center">

            {/* MAP */}
            <div className="bg-white rounded-[24px] overflow-hidden">

              <Image
                src="/world-map.png"
                alt="World Map"
                width={1400}
                height={600}
                className="w-full h-auto opacity-70"
              />

            </div>

            {/* STATS */}
            <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[24px] p-6 h-fit">

              <div className="space-y-4">

                <div className="flex items-center justify-between border-b border-[#F2E5E7] pb-4">
                  <h3 className="text-4xl font-black text-[#C23B4A]">
                    50+
                  </h3>

                  <span className="text-slate-600">
                    Export Destinations
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#F2E5E7] pb-4">
                  <h3 className="text-4xl font-black text-[#C23B4A]">
                    500+
                  </h3>

                  <span className="text-slate-600">
                    International Clients
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-[#F2E5E7] pb-4">
                  <h3 className="text-4xl font-black text-[#C23B4A]">
                    Bulk
                  </h3>

                  <span className="text-slate-600">
                    Supply Capability
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-4xl font-black text-[#C23B4A]">
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