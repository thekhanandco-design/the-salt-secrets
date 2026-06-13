import Image from "next/image";
import Link from "next/link";
import {
  BadgeDollarSign,
  ShieldCheck,
  Package,
  Globe,
  Leaf,
  Award,
  Tag,
  Factory,
  CheckCircle2,
  Truck,
  Clock3,
  Box,
} from "lucide-react";

export default function PrivateLabelPage() {
  return (
    <div className="bg-[#fffafa]">

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-12 text-center">
        <p className="uppercase tracking-[5px] text-[#c23b4a] font-bold">
          Private Label Manufacturer
        </p>

        <h1 className="text-5xl lg:text-7xl font-black text-[#081325] mt-4 leading-tight">
          Launch Your Own
          <br />
          Himalayan Pink Salt Brand
        </h1>

        <p className="max-w-3xl mx-auto mt-6 text-slate-600 text-lg">
          From custom labels and packaging to complete private label
          manufacturing, we help brands create retail-ready Himalayan Pink Salt
          products for global markets.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <Link
            href="/contact"
            className="bg-[#c23b4a] text-white px-8 py-4 rounded-xl font-bold"
          >
            Request Private Label Quote
          </Link>

          <Link
            href="/contact"
            className="border-2 border-[#c23b4a] text-[#c23b4a] px-8 py-4 rounded-xl font-bold"
          >
            Download Catalog
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-14 text-sm font-semibold">
          <div className="flex items-center justify-center gap-2">
            <Leaf className="w-5 h-5 text-[#c23b4a]" />
            100% Natural
          </div>

          <div className="flex items-center justify-center gap-2">
            <Award className="w-5 h-5 text-[#c23b4a]" />
            Premium Quality
          </div>

          <div className="flex items-center justify-center gap-2">
            <Tag className="w-5 h-5 text-[#c23b4a]" />
            Custom Branding
          </div>

          <div className="flex items-center justify-center gap-2">
            <Globe className="w-5 h-5 text-[#c23b4a]" />
            Global Shipping
          </div>
        </div>
      </section>

      {/* WHY PRIVATE LABEL */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-center text-4xl font-black mb-10">
          Why Private Label?
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-8 border">
            <BadgeDollarSign className="w-12 h-12 text-[#c23b4a] mx-auto" />
            <h3 className="font-black text-center mt-4">
              Higher Profit Margins
            </h3>
          </div>

          <div className="bg-white rounded-3xl p-8 border">
            <ShieldCheck className="w-12 h-12 text-[#c23b4a] mx-auto" />
            <h3 className="font-black text-center mt-4">
              Brand Ownership
            </h3>
          </div>

          <div className="bg-white rounded-3xl p-8 border">
            <Package className="w-12 h-12 text-[#c23b4a] mx-auto" />
            <h3 className="font-black text-center mt-4">
              Custom Packaging
            </h3>
          </div>

          <div className="bg-white rounded-3xl p-8 border">
            <Globe className="w-12 h-12 text-[#c23b4a] mx-auto" />
            <h3 className="font-black text-center mt-4">
              Global Market Reach
            </h3>
          </div>
        </div>
      </section>

      {/* WHAT WE CUSTOMIZE */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-center text-4xl font-black mb-10">
          What We Customize
        </h2>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white border rounded-3xl overflow-hidden">
            <Image
              src="/custom-logo-design.png"
              alt=""
              width={600}
              height={400}
              className="w-full h-[260px] object-contain p-6"
            />
            <div className="p-6 text-center">
              <h3 className="font-black text-xl">Logo Design</h3>
            </div>
          </div>

          <div className="bg-white border rounded-3xl overflow-hidden">
            <Image
              src="/custom-labels.png"
              alt=""
              width={600}
              height={400}
              className="w-full h-[260px] object-contain p-6"
            />
            <div className="p-6 text-center">
              <h3 className="font-black text-xl">Product Labels</h3>
            </div>
          </div>

          <div className="bg-white border rounded-3xl overflow-hidden">
            <Image
              src="/custom-packaging.png"
              alt=""
              width={600}
              height={400}
              className="w-full h-[260px] object-contain p-6"
            />
            <div className="p-6 text-center">
              <h3 className="font-black text-xl">Packaging Design</h3>
            </div>
          </div>
        </div>
      </section>
      {/* PACKAGING OPTIONS */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-center text-4xl font-black mb-10">
          Packaging Options
        </h2>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            ["/pet-bottles.png", "PET Bottles"],
            ["/pet-jars.png", "PET Jars"],
            ["/grinder-bottles1.png", "Grinder Bottles"],
            ["/ceramic-grinders.png", "Ceramic Grinders"],
            ["/shaker-bottles.png", "Shaker Bottles"],
            ["/standup-pouch.png", "Stand-Up Pouches"],
          ].map(([img, title]) => (
            <div
              key={title}
              className="bg-white border rounded-2xl p-4 text-center"
            >
              <Image
                src={img}
                alt={title}
                width={300}
                height={300}
                className="h-32 object-contain mx-auto"
              />
              <h3 className="font-black mt-3">{title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section
        className="py-16 bg-center bg-cover"
        style={{
          backgroundImage: "url('/mountains-bg.png')",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-4xl font-black mb-12">
            Our Private Label Process
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 mx-auto text-[#c23b4a]" />
              <h3 className="font-black mt-4">Consultation</h3>
            </div>

            <div className="text-center">
              <Tag className="w-14 h-14 mx-auto text-[#c23b4a]" />
              <h3 className="font-black mt-4">Design Approval</h3>
            </div>

            <div className="text-center">
              <Factory className="w-14 h-14 mx-auto text-[#c23b4a]" />
              <h3 className="font-black mt-4">Production</h3>
            </div>

            <div className="text-center">
              <Truck className="w-14 h-14 mx-auto text-[#c23b4a]" />
              <h3 className="font-black mt-4">Worldwide Delivery</h3>
            </div>
          </div>
        </div>
      </section>

      {/* MOQ */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white border rounded-3xl p-10 text-center">
            <Box className="w-12 h-12 mx-auto text-[#c23b4a]" />
            <h3 className="text-5xl font-black text-[#c23b4a] mt-4">1200</h3>
            <p className="font-bold">PCS MOQ</p>
          </div>

          <div className="bg-white border rounded-3xl p-10 text-center">
            <Clock3 className="w-12 h-12 mx-auto text-[#c23b4a]" />
            <h3 className="text-5xl font-black text-[#c23b4a] mt-4">
              15-30
            </h3>
            <p className="font-bold">Days Lead Time</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#b81f32] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-black">
            Ready To Launch Your Own Salt Brand?
          </h2>

          <p className="mt-4 text-white/90">
            Partner with a trusted Himalayan Pink Salt manufacturer.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              href="/contact"
              className="bg-white text-[#b81f32] px-8 py-4 rounded-xl font-bold"
            >
              Get Free Quote
            </Link>

            <Link
              href="/contact"
              className="border border-white px-8 py-4 rounded-xl font-bold"
            >
              WhatsApp Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}