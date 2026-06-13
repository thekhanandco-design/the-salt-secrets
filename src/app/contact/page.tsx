import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
} from "lucide-react";

import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="bg-gradient-to-b from-[#FFF4F5] to-white border-b border-[#F3E5E7]">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-16 py-16 lg:py-20">
          <div className="text-center">
            <span className="uppercase tracking-[10px] text-[#C23B4A] font-black text-2xl lg:text-3xl">
              CONTACT US
            </span>

            {/* SMLHDNG SIZE */}
            <h1
              className="mt-5 text-[#07142B] font-black leading-tight"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2.6rem,4vw,4.2rem)",
              }}
            >
              Let&apos;s Discuss Your
              <br />
              Pink Salt Requirements
            </h1>

            <p className="max-w-3xl mx-auto text-slate-600 mt-6 text-base lg:text-lg leading-relaxed">
              Whether you need private label packaging, bulk supply,
              retail-ready products or export solutions, our team is
              ready to assist.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="#contact-form"
                className="bg-[#C23B4A] text-white px-10 py-4 rounded-xl font-bold hover:opacity-90 transition"
              >
                Get a Quote →
              </Link>

              <Link
                href="https://wa.me/923462771693"
                target="_blank"
                className="bg-white border border-[#E8C9CF] text-[#07142B] px-10 py-4 rounded-xl font-bold hover:bg-[#FFF8F5] transition"
              >
                WhatsApp Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <section className="py-10 bg-white">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-8 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF4F5] flex items-center justify-center mb-5">
                <MapPin className="w-8 h-8 text-[#C23B4A]" />
              </div>

              <h3
                className="font-bold text-[#07142B]"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "1.75rem",
                }}
              >
                Office
              </h3>

              <p className="text-slate-600 mt-2">
                Pakistan
              </p>
            </div>

            <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-8 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF4F5] flex items-center justify-center mb-5">
                <Mail className="w-8 h-8 text-[#C23B4A]" />
              </div>

              <h3
                className="font-bold text-[#07142B]"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "1.75rem",
                }}
              >
                Email
              </h3>

              <p className="text-slate-600 mt-2 break-all">
                thekhanandco@gmail.com
              </p>
            </div>

            <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-8 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF4F5] flex items-center justify-center mb-5">
                <Phone className="w-8 h-8 text-[#C23B4A]" />
              </div>

              <h3
                className="font-bold text-[#07142B]"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "1.75rem",
                }}
              >
                Phone
              </h3>

              <p className="text-slate-600 mt-2">
                +92 346 2771693
              </p>
            </div>

            <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-8 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF4F5] flex items-center justify-center mb-5">
                <MessageCircle className="w-8 h-8 text-[#C23B4A]" />
              </div>

              <h3
                className="font-bold text-[#07142B]"
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "1.75rem",
                }}
              >
                WhatsApp
              </h3>

              <p className="text-slate-600 mt-2">
                Chat With Sales Team
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section
        id="contact-form"
        className="pb-20"
      >
        <div className="max-w-[1700px] mx-auto px-6 lg:px-16">
          <div className="bg-white border border-[#EFE3E5] rounded-[32px] p-8 lg:p-12 shadow-sm">
            <h2
              className="text-center font-bold text-[#07142B] mb-10"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2rem,2.5vw,3rem)",
              }}
            >
              Send Us A Message
            </h2>

            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}