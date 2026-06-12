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

```
return () => clearInterval(interval);
```

}, []);

return ( <section className="py-16 lg:py-20 bg-white"> <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

```
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

      {/* LEFT IMAGE SLIDER */}
      <div>

        <div className="bg-white border border-[#EFE3E5] rounded-[32px] p-6 shadow-sm">

          <div className="relative h-[350px] lg:h-[430px]">
            <Image
              src={images[active]}
              alt="Private Label Products"
              fill
              className="object-contain transition-all duration-500"
            />
          </div>

          {/* THUMBNAILS */}
          <div className="flex justify-center gap-3 mt-5">

            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setActive(index)}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                  active === index
                    ? "border-[#C54B5B] shadow-md"
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

        <h2 className="text-4xl lg:text-6xl font-black mt-4 text-[#07142B] leading-tight">
          Build Your Own
          <br />
          Himalayan Pink Salt Brand
        </h2>

        <p className="text-slate-600 text-lg mt-5 leading-relaxed max-w-[720px]">
          We help distributors, wholesalers and retail brands create their
          own Himalayan Pink Salt product line through private label
          packaging, custom branding and global export support.
        </p>

        {/* FEATURES */}
        <div className="grid sm:grid-cols-2 gap-4 mt-8">

          <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-5">
            <Tags className="w-6 h-6 text-[#C54B5B] mb-3" />

            <h3 className="font-bold text-lg text-[#07142B]">
              Private Label Packaging
            </h3>

            <p className="text-slate-500 mt-2">
              Custom packaging tailored to your brand.
            </p>
          </div>

          <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-5">
            <Package className="w-6 h-6 text-[#C54B5B] mb-3" />

            <h3 className="font-bold text-lg text-[#07142B]">
              Custom Brand Identity
            </h3>

            <p className="text-slate-500 mt-2">
              Shelf-ready products with professional branding.
            </p>
          </div>

          <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-5">
            <Palette className="w-6 h-6 text-[#C54B5B] mb-3" />

            <h3 className="font-bold text-lg text-[#07142B]">
              Flexible MOQ Options
            </h3>

            <p className="text-slate-500 mt-2">
              Flexible order quantities for growing brands.
            </p>
          </div>

          <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-2xl p-5">
            <Globe2 className="w-6 h-6 text-[#C54B5B] mb-3" />

            <h3 className="font-bold text-lg text-[#07142B]">
              Global Export Support
            </h3>

            <p className="text-slate-500 mt-2">
              Worldwide shipping and export assistance.
            </p>
          </div>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-6 mt-8">

          <div className="text-center">
            <h3 className="text-4xl font-black text-[#07142B]">
              100%
            </h3>

            <p className="text-slate-500 text-sm mt-2">
              Custom Branding
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-4xl font-black text-[#07142B]">
              Flexible
            </h3>

            <p className="text-slate-500 text-sm mt-2">
              MOQ
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-4xl font-black text-[#07142B]">
              50+
            </h3>

            <p className="text-slate-500 text-sm mt-2">
              Countries
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
```

);
}
