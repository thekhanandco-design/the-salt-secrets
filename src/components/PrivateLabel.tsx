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
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-14 lg:py-16 bg-white">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* LEFT SIDE */}
          <div>
            <div className="bg-white border border-[#EFE3E5] rounded-[30px] p-5 shadow-sm">

              <div className="relative h-[300px] lg:h-[380px]">
                <Image
                  src={images[active]}
                  alt="Private Label Products"
                  fill
                  className="object-contain transition-all duration-500"
                />
              </div>

              <div className="flex justify-center gap-3 mt-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActive(index)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
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

          {/* RIGHT SIDE */}
          <div>

            <span className="uppercase tracking-[6px] text-[#C54B5B] font-bold text-xs">
              Private Label Solutions
            </span>

            <h2 className="text-3xl lg:text-5xl font-black mt-3 text-[#07142B] leading-tight">
              Build Your Own
              <br />
              Himalayan Pink Salt Brand
            </h2>

            <p className="text-slate-600 text-base lg:text-lg mt-4 leading-relaxed max-w-[700px]">
              We help distributors, wholesalers and retail brands create
              their own Himalayan Pink Salt product line through private
              label packaging, custom branding and global export support.
            </p>

            {/* FEATURES */}
            <div className="grid grid-cols-2 gap-3 mt-6">

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-xl p-4">
                <Tags className="w-5 h-5 text-[#C54B5B] mb-2" />
                <h3 className="font-bold text-base text-[#07142B]">
                  Private Label Packaging
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Custom packaging tailored to your brand.
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-xl p-4">
                <Package className="w-5 h-5 text-[#C54B5B] mb-2" />
                <h3 className="font-bold text-base text-[#07142B]">
                  Custom Brand Identity
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Shelf-ready professional branding.
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-xl p-4">
                <Palette className="w-5 h-5 text-[#C54B5B] mb-2" />
                <h3 className="font-bold text-base text-[#07142B]">
                  Flexible MOQ
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Flexible order quantities.
                </p>
              </div>

              <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-xl p-4">
                <Globe2 className="w-5 h-5 text-[#C54B5B] mb-2" />
                <h3 className="font-bold text-base text-[#07142B]">
                  Global Export
                </h3>
                <p className="text-slate-500 text-sm mt-1">
                  Worldwide shipping support.
                </p>
              </div>

            </div>

            <Link
              href="/contact"
              className="inline-flex items-center mt-6 bg-[#C54B5B] text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Start Your Private Label Project
            </Link>

          </div>

        </div>

      </div>
    </section>
  );
}