import Link from "next/link";
import Image from "next/image";
import {
  Award,
  BadgeCheck,
  ClipboardCheck,
  Factory,
  FileCheck,
  Globe,
  Search,
  ShieldCheck,
  Package,
  FileText,
} from "lucide-react";

const certifications = [
  {
    title: "ISO 22000",
    subtitle: "Food Safety Management System",
    icon: ShieldCheck,
  },
  {
    title: "HACCP",
    subtitle: "Hazard Analysis & Critical Control Points",
    icon: BadgeCheck,
  },
  {
    title: "GMP",
    subtitle: "Good Manufacturing Practice",
    icon: Factory,
  },
  {
    title: "HALAL",
    subtitle: "Halal Compliant Production",
    icon: Award,
  },
  {
    title: "FDA",
    subtitle: "FDA Registered Facility",
    icon: ClipboardCheck,
  },
  {
    title: "Food Safety",
    subtitle: "International Food Safety Standards",
    icon: ShieldCheck,
  },
];

const documents = [
  "ISO 22000 Certificate",
  "HACCP Certificate",
  "GMP Certificate",
  "Halal Certificate",
  "FDA Registration",
];

export default function CertificationsPage() {
  return (
    <main className="bg-white text-[#081325]">
      {/* HERO */}

      <section className="relative overflow-hidden bg-gradient-to-r from-[#FFF0F2] via-[#FFF6F7] to-white">
        <div
          className="absolute inset-y-0 right-0 w-full lg:w-[65%] bg-right bg-no-repeat bg-contain opacity-40"
          style={{
            backgroundImage: "url('/mountains-bg.png')",
          }}
        />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-20">
          <div className="max-w-[650px]">
            <div className="flex items-center gap-4">
              <span className="uppercase tracking-[5px] text-[#C23B4A] font-black text-sm">
                Quality & Compliance
              </span>
              <span className="w-12 h-[2px] bg-[#C23B4A]" />
            </div>

            <h1
              className="mt-5 font-black leading-tight text-[#081325]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2.2rem,4vw,4.2rem)",
              }}
            >
              Reliable Himalayan
              <br />
              Pink Salt Supply For
              <br />
              Brands Worldwide
            </h1>

            <p className="mt-6 text-slate-700 leading-relaxed text-lg">
              From private label packaging to bulk export solutions,
              we help businesses source premium Himalayan Pink Salt
              products backed by quality-focused production, export
              expertise, and reliable global supply.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                href="/contact"
                className="bg-[#C23B4A] text-white px-8 py-4 rounded-md font-black"
              >
                Request Documents
              </Link>

              <Link
                href="/contact"
                className="border border-[#C23B4A] text-[#C23B4A] px-8 py-4 rounded-md font-black"
              >
                Get Quote →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS */}

      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        <div className="text-center">
          <div className="uppercase tracking-[4px] text-[#C23B4A] font-black text-sm">
            Quality Standards Supported
          </div>

          <h2
            className="mt-3 font-black"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(2rem,3vw,2.8rem)",
            }}
          >
            Quality Certifications
          </h2>

          <p className="text-slate-600 mt-4 max-w-3xl mx-auto">
            Our products are supplied in compliance with internationally
            recognized quality and food safety standards required by
            global buyers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-5 mt-12">
          {certifications.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="border border-[#F1D9DD] rounded-[18px] p-6 text-center"
              >
                <Icon className="w-14 h-14 mx-auto text-[#C23B4A]" />

                <h3 className="font-black mt-5">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-600 mt-3">
                  {item.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 border border-[#F1D9DD] rounded-xl p-5 text-center bg-[#FFF7F8]">
          <span className="font-semibold text-slate-700">
            These standards reflect our commitment to quality,
            safety and consistency in every shipment we deliver.
          </span>
        </div>
      </section>

      {/* COMMITMENT */}

      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-16">
        <div className="text-center">
          <div className="uppercase tracking-[4px] text-[#C23B4A] font-black text-sm">
            Why Quality Matters
          </div>

          <h2
            className="mt-3 font-black"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(2rem,3vw,2.8rem)",
            }}
          >
            Our Commitment To Excellence
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mt-12">
          <div className="text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-[#C23B4A]" />
            <h3 className="font-black mt-4">Food Safety</h3>
            <p className="text-slate-600 text-sm mt-3">
              Ensuring safe products for consumption.
            </p>
          </div>

          <div className="text-center">
            <Award className="w-12 h-12 mx-auto text-[#C23B4A]" />
            <h3 className="font-black mt-4">Quality Consistency</h3>
            <p className="text-slate-600 text-sm mt-3">
              Maintaining consistent quality in every batch.
            </p>
          </div>

          <div className="text-center">
            <Globe className="w-12 h-12 mx-auto text-[#C23B4A]" />
            <h3 className="font-black mt-4">Export Compliance</h3>
            <p className="text-slate-600 text-sm mt-3">
              Meeting international market requirements.
            </p>
          </div>

          <div className="text-center">
            <BadgeCheck className="w-12 h-12 mx-auto text-[#C23B4A]" />
            <h3 className="font-black mt-4">Customer Confidence</h3>
            <p className="text-slate-600 text-sm mt-3">
              Building long-term trust through quality.
            </p>
          </div>
        </div>
      </section>

      {/* DOCUMENTS */}

      <section className="bg-[#FFF8F8] py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="text-center">
            <div className="uppercase tracking-[4px] text-[#C23B4A] font-black text-sm">
              Quality & Compliance Documents
            </div>

            <h2
              className="mt-3 font-black"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2rem,3vw,2.8rem)",
              }}
            >
              Documents Available On Request
            </h2>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-5 mt-12">
            {documents.map((doc) => (
              <div
                key={doc}
                className="bg-white border border-[#F1D9DD] rounded-[18px] p-6 text-center"
              >
                <FileCheck className="w-12 h-12 mx-auto text-[#C23B4A]" />
                <h3 className="font-black text-sm mt-4">
                  {doc}
                </h3>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/contact"
              className="bg-[#C23B4A] text-white px-8 py-4 rounded-md font-black inline-block"
            >
              Request Documents
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}