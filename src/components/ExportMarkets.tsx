import Image from "next/image";

export default function ExportMarkets() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

        <div className="text-center mb-10">
          <h2
            className="font-black text-[#07142B]"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(2rem,3vw,3.3rem)",
            }}
          >
            TRUSTED BY BUYERS IN 50+ COUNTRIES
          </h2>

          <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-center">

          {/* WORLD MAP */}
          <div className="relative h-[450px] lg:h-[520px] rounded-[28px] border border-[#F1D9DD] overflow-hidden bg-[#FFF8F5]">
            <Image
              src="/world-map.png"
              alt="Global Export Network"
              fill
              priority
              className="object-contain p-8"
            />
          </div>

          {/* STATS CARD */}
          <div className="bg-[#FFF4F5] border border-[#F1D9DD] rounded-[28px] p-8">

            <div className="space-y-6">

              <div className="border-b border-[#EFD6DA] pb-5">
                <div className="text-5xl font-black text-[#C23B4A]">
                  50+
                </div>
                <p className="text-slate-600 mt-2">
                  Export Destinations
                </p>
              </div>

              <div className="border-b border-[#EFD6DA] pb-5">
                <div className="text-5xl font-black text-[#C23B4A]">
                  500+
                </div>
                <p className="text-slate-600 mt-2">
                  International Buyers
                </p>
              </div>

              <div className="border-b border-[#EFD6DA] pb-5">
                <div className="text-5xl font-black text-[#C23B4A]">
                  Bulk
                </div>
                <p className="text-slate-600 mt-2">
                  Supply Capability
                </p>
              </div>

              <div>
                <div className="text-5xl font-black text-[#C23B4A]">
                  100%
                </div>
                <p className="text-slate-600 mt-2">
                  Export Quality Focused
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}