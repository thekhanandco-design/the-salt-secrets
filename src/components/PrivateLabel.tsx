"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Tags,
  Package,
  Palette,
  Globe2,
} from "lucide-react";

const images = [
  "/product-2.png",
  "/product-3.png",
  "/product-4.png",
  "/product-5.png",
];

export default function PrivateLabel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1500px] mx-auto px-6 lg:px-12">

        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* LEFT IMAGE SLIDER */}
          <div>

            <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[36px] p-8">

              <div className="relative h-[520px]">
                <Image
                  src={images[active]}
                  alt="Private Label Products"
                  fill
                  className="object-contain transition-all duration-500"
                />
              </div>

              {/* THUMBNAILS */}
              <div className="flex justify-center gap-4 mt-6">

                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActive(index)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                      active === index
                        ? "border-[#C54B5B]"
                        : "border-[#E9D7DA]"
                    }`}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-contain bg-white"
                    />
                  </button>
                ))}

              </div>

            </div>

          </div>

          {/* RIGHT CONTENT */}
          <div>

            <span className="uppercase tracking-[6px] text-[#C54B5B] font-bold text-xs">
              Private Label Solutions
            </span>

            <h2 className="text-5xl lg:text-6xl font-black mt-4 text-[#07142B] leading-tight">
              Launch Your Own
              <br />
              Himalayan Salt Brand
            </h2>

            <p className="text-slate-600 text-lg mt-6 leading-relaxed max-w-[700px]">
              We help importers, distributors and retailers build their own
              Himalayan Pink Salt brands through custom packaging, private
              labeling and global export support.
            </p>

            {/* FEATURES */}
            <div className="grid sm:grid-cols-2 gap-5 mt-10">

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-6">
                <Tags className="w-6 h-6 text-[#C54B5B] mb-3" />

                <h3 className="font-bold text-lg text-[#07142B]">
                  Custom Labels
                </h3>

                <p className="text-slate-500 mt-2">
                  Personalized branding solutions.
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-6">
                <Package className="w-6 h-6 text-[#C54B5B] mb-3" />

                <h3 className="font-bold text-lg text-[#07142B]">
                  Retail Packaging
                </h3>

                <p className="text-slate-500 mt-2">
                  Shelf-ready premium packaging.
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-6">
                <Palette className="w-6 h-6 text-[#C54B5B] mb-3" />

                <h3 className="font-bold text-lg text-[#07142B]">
                  Custom Branding
                </h3>

                <p className="text-slate-500 mt-2">
                  Brand-focused packaging support.
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-6">
                <Globe2 className="w-6 h-6 text-[#C54B5B] mb-3" />

                <h3 className="font-bold text-lg text-[#07142B]">
                  Global Export
                </h3>

                <p className="text-slate-500 mt-2">
                  Worldwide logistics assistance.
                </p>
              </div>

            </div>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-6 mt-10">

              <div className="text-center">
                <h3 className="text-4xl font-black text-[#07142B]">
                  PL
                </h3>

                <p className="text-slate-500 text-sm mt-2">
                  Private Label
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-4xl font-black text-[#07142B]">
                  MOQ
                </h3>

                <p className="text-slate-500 text-sm mt-2">
                  Flexible
                </p>
              </div>

              <div className="text-center">
                <h3 className="text-4xl font-black text-[#07142B]">
                  50+
                </h3>

                <p className="text-slate-500 text-sm mt-2">
                  Markets
                </p>
              </div>

            </div>

            <Link
              href="/contact"
              className="inline-flex items-center mt-10 bg-[#C54B5B] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Request Private Label Quote
            </Link>

          </div>

        </div>

      </div>
    </section>
  );
}