import Link from "next/link";
import {
  MessageCircle,
  PackageCheck,
  Globe2,
  Tags,
} from "lucide-react";

export default function ContactCTA() {
  return (
    <section id="contact" className="py-16 lg:py-20 bg-white">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

        <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[32px] overflow-hidden">

          <div className="grid lg:grid-cols-2 items-center">

            {/* LEFT CONTENT */}
            <div className="p-8 lg:p-14">

              <span className="uppercase tracking-[7px] text-[#C23B4A] font-black text-base">
                Ready To Get Started?
              </span>

              {/* SMLHDNG */}
              <h2 className="text-3xl lg:text-5xl font-black mt-4 text-[#07142B] leading-tight">
                Ready To Source Premium
                <br />
                Himalayan Pink Salt?
              </h2>

              <p className="text-slate-600 mt-5 text-base lg:text-lg leading-relaxed max-w-[650px]">
                Partner with a reliable supplier for retail packaging,
                bulk supply and private label solutions. We support
                importers, distributors and wholesalers worldwide with
                consistent quality and export-ready products.
              </p>

              {/* TRUST POINTS */}
              <div className="grid sm:grid-cols-3 gap-4 mt-8">

                <div className="bg-white border border-[#EFE3E5] rounded-2xl p-4 text-center">
                  <PackageCheck className="w-6 h-6 mx-auto text-[#C23B4A] mb-2" />

                  <p className="font-semibold text-[#07142B] text-sm">
                    MOQ Available
                  </p>
                </div>

                <div className="bg-white border border-[#EFE3E5] rounded-2xl p-4 text-center">
                  <Globe2 className="w-6 h-6 mx-auto text-[#C23B4A] mb-2" />

                  <p className="font-semibold text-[#07142B] text-sm">
                    Global Export
                  </p>
                </div>

                <div className="bg-white border border-[#EFE3E5] rounded-2xl p-4 text-center">
                  <Tags className="w-6 h-6 mx-auto text-[#C23B4A] mb-2" />

                  <p className="font-semibold text-[#07142B] text-sm">
                    Private Label
                  </p>
                </div>

              </div>

              {/* BUTTONS */}
              <div className="flex flex-wrap gap-4 mt-8">

                <Link
                  href="/contact"
                  className="bg-[#C23B4A] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
                >
                  Get Quote
                </Link>

                <Link
                  href="https://wa.me/923462771693"
                  target="_blank"
                  className="bg-white border border-[#EFE3E5] text-[#07142B] px-8 py-4 rounded-xl font-semibold hover:bg-[#FFF4F5] transition flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Us
                </Link>

              </div>

            </div>

            {/* RIGHT SIDE */}
            <div className="relative h-[350px] lg:h-[520px] bg-[#FDF2F3] flex items-center justify-center">

              <img
                src="/product-collage.png"
                alt="Premium Himalayan Pink Salt"
                className="max-h-[90%] max-w-[90%] object-contain"
              />

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}