import Image from "next/image";
import Link from "next/link";

export default function PrivateLabel() {
  return (
    <section className="py-32 bg-[#faf7f3]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="uppercase tracking-[6px] text-[#C98A92] font-semibold">
              Private Label Solutions
            </span>

            <h2 className="text-5xl lg:text-6xl font-bold mt-5 leading-tight">
              Launch Your Own
              <br />
              Salt Brand
            </h2>

            <p className="text-lg text-slate-600 mt-8 leading-relaxed">
              From custom packaging and label design to export
              documentation and logistics, we provide complete
              private-label Himalayan Pink Salt solutions for
              distributors, retailers and importers worldwide.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-10">
              <div className="bg-white rounded-2xl p-5 border">
                Custom Labels
              </div>

              <div className="bg-white rounded-2xl p-5 border">
                Retail Packaging
              </div>

              <div className="bg-white rounded-2xl p-5 border">
                Bulk Export
              </div>

              <div className="bg-white rounded-2xl p-5 border">
                OEM Manufacturing
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-block mt-10 bg-[#C98A92] text-white px-8 py-4 rounded-full font-semibold"
            >
              Request Private Label Quote
            </Link>
          </div>

          <div>
            <Image
              src="/product-5.png"
              alt="Private Label Solutions"
              width={900}
              height={900}
              className="rounded-[40px] shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}