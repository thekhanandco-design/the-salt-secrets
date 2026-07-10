import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#FFF2F4] via-[#FFF7F8] to-white">
      {/* Mountains Background */}
      <div
        className="absolute inset-y-0 right-0 w-full lg:w-[65%] opacity-25 bg-right bg-no-repeat bg-contain"
        style={{
          backgroundImage: "url('/mountains-bg.png')",
        }}
      />

      <div className="relative z-10 max-w-[1700px] mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 items-center min-h-[720px] gap-10">
          {/* LEFT CONTENT */}
          <div className="max-w-[700px]">
            <div className="flex items-center gap-4 mb-5">
              <span className="uppercase tracking-[5px] text-[#C23B4A] font-black text-sm">
                PREMIUM QUALITY
              </span>

              <span className="w-14 h-[2px] bg-[#D9A0A8]" />
            </div>

            <h1
              className="text-[#081325] font-black leading-[0.95]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(3rem,5vw,5.4rem)",
              }}
            >
              Himalayan Pink
              <br />
              Salt Solutions For
              <br />
              Global Markets
            </h1>

            <p className="mt-7 text-slate-700 text-lg leading-relaxed max-w-[620px]">
              We provide premium quality Himalayan Pink Salt in multiple forms
              and packaging, trusted by importers, distributors and brands
              worldwide.
            </p>

            <div className="flex flex-wrap gap-4 mt-9">
              <Link
                href="/products"
                className="inline-flex items-center gap-3 bg-[#C23B4A] text-white px-8 py-4 rounded-md font-black hover:opacity-90 transition"
              >
                Explore Products
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-3 border border-[#C23B4A] text-[#C23B4A] px-8 py-4 rounded-md font-black hover:bg-[#FFF4F5] transition"
              >
                Request Quote
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* RIGHT PRODUCTS */}
          <div className="relative flex justify-center lg:justify-end">
            <Image
              src="/hero-products.png"
              alt="Himalayan Pink Salt Products"
              width={850}
              height={850}
              priority
              className="w-full max-w-[850px] h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}