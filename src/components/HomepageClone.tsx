import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Package,
  Tags,
  Globe2,
  Palette,
} from "lucide-react";

const privateLabelFeatures = [
  {
    icon: Tags,
    title: "Private Label Packaging",
    text: "Custom packaging tailored to your brand.",
  },
  {
    icon: Package,
    title: "Custom Brand Identity",
    text: "Shelf-ready professional branding.",
  },
  {
    icon: Palette,
    title: "Flexible MOQ",
    text: "Flexible order quantities.",
  },
  {
    icon: Globe2,
    title: "Global Export",
    text: "Worldwide shipping support.",
  },
];

export default function HomepageClone() {
  return (
    <main className="bg-white">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#FFF2F4] via-[#FFF7F8] to-white">

        <div
          className="absolute inset-y-0 right-0 w-full lg:w-[65%] opacity-25 bg-right bg-no-repeat bg-contain"
          style={{
            backgroundImage: "url('/mountains-bg.png')",
          }}
        />

        <div className="relative z-10 max-w-[1700px] mx-auto px-6 lg:px-16">

          <div className="grid lg:grid-cols-2 items-center min-h-[640px] gap-10">

            {/* LEFT */}
            <div>

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
                  fontSize: "clamp(3rem,5vw,5.2rem)",
                }}
              >
                Himalayan Pink
                <br />
                Salt Solutions For
                <br />
                Global Markets
              </h1>

              <p className="mt-7 text-slate-700 text-lg leading-relaxed max-w-[620px]">
                We provide premium quality Himalayan Pink Salt in
                multiple forms and packaging, trusted by importers,
                distributors and brands worldwide.
              </p>

              <div className="flex flex-wrap gap-4 mt-9">

                <Link
                  href="/products"
                  className="inline-flex items-center gap-3 bg-[#C23B4A] text-white px-8 py-4 rounded-md font-black"
                >
                  Explore Products
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 border border-[#C23B4A] text-[#C23B4A] px-8 py-4 rounded-md font-black"
                >
                  Request Quote
                  <ArrowRight className="w-4 h-4" />
                </Link>

              </div>

            </div>

            {/* RIGHT */}
            <div className="flex justify-center lg:justify-end">

              <Image
                src="/hero-products.png"
                alt="Himalayan Pink Salt Products"
                width={900}
                height={900}
                priority
                className="w-full max-w-[900px] h-auto object-contain"
              />

            </div>

          </div>

        </div>
      </section>

      {/* PRIVATE LABEL */}
      <section className="py-14 bg-white">

        <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

          <div className="grid lg:grid-cols-[320px_1fr] gap-10 items-center">

            {/* LEFT TEXT */}
            <div>

              <h2
                className="text-[#081325] font-black leading-tight"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "clamp(2.2rem,3vw,3.2rem)",
                }}
              >
                PRIVATE LABEL
                <br />
                SOLUTIONS
              </h2>

              <div className="w-16 h-[3px] bg-[#C23B4A] mt-5" />

              <p className="text-slate-600 mt-6 leading-relaxed">
                We help brands create their identity with fully
                customized bottles and packaging.
              </p>

              <ul className="mt-6 space-y-3 text-[#081325] font-medium">
                <li>✓ Custom Bottles</li>
                <li>✓ Custom Packaging</li>
              </ul>

              <Link
                href="/private-label"
                className="inline-flex mt-7 bg-[#C23B4A] text-white px-8 py-4 rounded-md font-bold"
              >
                Learn More
              </Link>

            </div>

            {/* RIGHT CONTENT */}
            <div className="grid md:grid-cols-2 gap-5">

              <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-5">

                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-6 h-6 text-[#C23B4A]" />
                  <h3 className="font-black text-lg">
                    Custom Bottles
                  </h3>
                </div>

                <p className="text-slate-600 text-sm mb-4">
                  Choose your bottle style, size and design to
                  match your brand identity.
                </p>

                <Image
                  src="/custom-labels.png"
                  alt=""
                  width={600}
                  height={400}
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-5">

                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-6 h-6 text-[#C23B4A]" />
                  <h3 className="font-black text-lg">
                    Custom Packaging
                  </h3>
                </div>

                <p className="text-slate-600 text-sm mb-4">
                  Custom printed pouches and jars with your logo,
                  colors and design.
                </p>

                <Image
                  src="/custom-packaging.png"
                  alt=""
                  width={600}
                  height={400}
                  className="w-full h-auto object-contain"
                />
              </div>

            </div>

          </div>

        </div>
      </section>
      {/* PRODUCTS */}
      <section className="py-10 bg-white">

        <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

          <div className="text-center mb-10">

            <h2
              className="font-black text-[#081325]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2.2rem,3vw,3.4rem)",
              }}
            >
              OUR PRODUCT RANGE
            </h2>

            <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {[
              {
                title: "PET Bottles",
                image: "/pet-bottles.png",
                desc: "Multiple sizes for everyday use and retail.",
              },
              {
                title: "PET Jars",
                image: "/pet-jars.png",
                desc: "Fine grain salt in convenient PET jars.",
              },
              {
                title: "Grinder Collection",
                image: "/grinder-bottles.png",
                desc: "Plastic and ceramic grinder bottles.",
              },
              {
                title: "Stand-Up Pouches",
                image: "/standup-pouch.png",
                desc: "Premium zip-lock pouches for maximum freshness.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#FFF9FA] border border-[#EFE3E5] rounded-[22px] overflow-hidden"
              >
                <div className="p-6">

                  <Image
                    src={item.image}
                    alt={item.title}
                    width={350}
                    height={350}
                    className="w-full h-[220px] object-contain"
                  />

                  <h3 className="font-black text-[#081325] text-2xl mt-5">
                    {item.title}
                  </h3>

                  <p className="text-slate-600 mt-2 leading-relaxed">
                    {item.desc}
                  </p>

                  <Link
                    href="/products"
                    className="inline-flex mt-5 border border-[#C23B4A] text-[#C23B4A] px-5 py-2 rounded-md font-semibold"
                  >
                    View Products
                  </Link>

                </div>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-14 bg-white">

        <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

          <div className="text-center mb-10">

            <h2
              className="font-black text-[#081325]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2.2rem,3vw,3.4rem)",
              }}
            >
              WHY CHOOSE US
            </h2>

            <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />

          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">

            {[
              "Reliable Supply",
              "Flexible MOQ",
              "Custom Packaging",
              "Export Support",
              "Quality Focused",
              "Global Reach",
            ].map((item) => (
              <div
                key={item}
                className="text-center border-r border-[#F0E3E6] last:border-r-0"
              >
                <div className="w-20 h-20 rounded-full bg-[#FFF2F4] flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-[#C23B4A]" />
                </div>

                <h3 className="font-black text-[#081325]">
                  {item}
                </h3>

                <p className="text-slate-600 text-sm mt-3 px-2">
                  Premium Himalayan Pink Salt solutions for
                  international buyers.
                </p>
              </div>
            ))}

          </div>

        </div>
      </section>
      {/* QUALITY STANDARDS */}
      <section className="py-14 bg-[#FFF8F5]">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

          <div className="text-center mb-10">

            <h2
              className="font-black text-[#081325]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2.2rem,3vw,3.4rem)",
              }}
            >
              OUR QUALITY STANDARDS
            </h2>

            <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />

            <p className="text-slate-600 mt-4">
              Certified quality you can trust.
            </p>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">

            {[
              "/cert-iso.png",
              "/cert-haccp.png",
              "/cert-gmp.png",
              "/cert-halal.png",
              "/cert-fda.png",
              "/cert-food.png",
            ].map((cert, index) => (
              <div
                key={index}
                className="bg-white rounded-[22px] border border-[#EFE3E5] p-5 flex items-center justify-center"
              >
                <Image
                  src={cert}
                  alt="Certification"
                  width={120}
                  height={120}
                  className="object-contain"
                />
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* EXPORT MARKETS */}
      <section className="py-16 bg-white">

        <div className="max-w-[1800px] mx-auto px-6 lg:px-16">

          <div className="text-center mb-10">

            <h2
              className="font-black text-[#081325]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2.3rem,3vw,3.6rem)",
              }}
            >
              TRUSTED BY BUYERS IN 50+ COUNTRIES
            </h2>

            <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />

          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-6">

            {/* MAP */}
            <div className="border border-[#EFE3E5] rounded-[28px] p-6">

              <Image
                src="/world-map.png"
                alt="World Map"
                width={1400}
                height={700}
                className="w-full h-auto object-contain"
              />

            </div>

            {/* STATS */}
            <div className="bg-[#FFF8F5] border border-[#EFE3E5] rounded-[28px] p-8">

              <div className="space-y-8">

                <div>
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    50+
                  </h3>
                  <p className="text-slate-600 mt-1">
                    Export Destinations
                  </p>
                </div>

                <div>
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    500+
                  </h3>
                  <p className="text-slate-600 mt-1">
                    International Buyers
                  </p>
                </div>

                <div>
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    Bulk
                  </h3>
                  <p className="text-slate-600 mt-1">
                    Supply Capability
                  </p>
                </div>

                <div>
                  <h3 className="text-5xl font-black text-[#C23B4A]">
                    100%
                  </h3>
                  <p className="text-slate-600 mt-1">
                    Export Quality Focused
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

    </main>
  );
}