import Link from "next/link";
import {
  Box,
  Clock,
  FileText,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Send,
  Tags,
} from "lucide-react";

import ContactForm from "@/components/ContactForm";

const helpItems = [
  {
    icon: Tags,
    title: "Private Label Development",
    text: "Custom branding and packaging solutions.",
  },
  {
    icon: Box,
    title: "Bulk Orders",
    text: "Competitive pricing for bulk quantity orders.",
  },
  {
    icon: FileText,
    title: "Product Specifications",
    text: "Detailed product information and data.",
  },
  {
    icon: Globe2,
    title: "Export Documentation",
    text: "All necessary export documents support.",
  },
  {
    icon: Package,
    title: "Sample Requests",
    text: "Product samples available on request.",
  },
  {
    icon: Package,
    title: "Packaging Options",
    text: "Wide range of packaging solutions available.",
  },
];

export default function ContactPage() {
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

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 py-10 lg:py-14">
          <div className="max-w-xl">
            <div className="flex items-center gap-4">
              <span className="uppercase tracking-[6px] text-[#C23B4A] font-black text-sm">
                Get In Touch
              </span>
              <span className="w-12 h-[2px] bg-[#C23B4A]" />
            </div>

            <h1
              className="text-[#081325] font-black leading-tight mt-6"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2rem,3.2vw,3.4rem)",
              }}
            >
              Let&apos;s Discuss
              <br />
              Your Requirements
            </h1>

            <div className="w-20 h-[3px] bg-[#C23B4A] mt-6" />

            <p className="text-slate-700 mt-6 leading-relaxed text-lg">
              Whether you&apos;re looking for private label solutions, bulk
              supply or product information, our team is ready to assist.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                href="#contact-form"
                className="inline-flex items-center gap-3 bg-[#C23B4A] text-white px-8 py-4 rounded-md font-black hover:opacity-90 transition"
              >
                <Send className="w-5 h-5" />
                Request Quote
              </Link>

              <Link
                href="https://wa.me/923462771693"
                target="_blank"
                className="inline-flex items-center gap-3 bg-white border border-[#C23B4A] text-[#C23B4A] px-8 py-4 rounded-md font-black hover:bg-[#FFF4F5] transition"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT INFO STRIP */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 -mt-4 relative z-20">
        <div className="bg-white border border-[#F1D9DD] rounded-[18px] shadow-[0_18px_45px_rgba(194,59,74,0.10)] grid md:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 text-center border-b lg:border-b-0 lg:border-r border-[#F1D9DD]">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0F2] border border-[#F1C8CF] flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#C23B4A]" />
            </div>

            <h3 className="font-black mt-5">Our Location</h3>
            <p className="text-slate-600 mt-3 leading-relaxed">
              Pakistan
            </p>
          </div>

          <div className="p-5 text-center border-b lg:border-b-0 lg:border-r border-[#F1D9DD]">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0F2] border border-[#F1C8CF] flex items-center justify-center">
              <Phone className="w-6 h-6 text-[#C23B4A]" />
            </div>

            <h3 className="font-black mt-5">Phone / WhatsApp</h3>
            <p className="text-slate-600 mt-3 leading-relaxed">
              +92 331 1281289
            </p>
          </div>

          <div className="p-5 text-center border-b md:border-b-0 lg:border-r border-[#F1D9DD]">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0F2] border border-[#F1C8CF] flex items-center justify-center">
              <Mail className="w-6 h-6 text-[#C23B4A]" />
            </div>

            <h3 className="font-black mt-5">Email Address</h3>
            <p className="text-slate-600 mt-3 leading-relaxed break-all">
              thekhanandco@gmail.com
            </p>
          </div>

          <div className="p-5 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0F2] border border-[#F1C8CF] flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#C23B4A]" />
            </div>

            <h3 className="font-black mt-5">Business Hours</h3>
            <p className="text-slate-600 mt-3 leading-relaxed">
              Mon - Sat: 09:00 AM - 06:00 PM
              <br />
              Sunday: Closed
            </p>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section id="contact-form" className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10">
        <div className="bg-white border border-[#F1D9DD] rounded-[22px] p-6 lg:p-12 shadow-[0_18px_45px_rgba(194,59,74,0.08)]">
          <div className="text-center mb-9">
            <h2
              className="font-black text-[#081325]"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(2rem,3vw,3rem)",
              }}
            >
              Send Us A Message
            </h2>

            <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-4" />

            <p className="text-slate-600 mt-5">
              Fill out the form below and our team will get back to you promptly.
            </p>
          </div>

          <ContactForm />
        </div>
      </section>

      {/* HELP SECTION */}
      <section className="bg-gradient-to-b from-white to-[#FFF0F2] py-12">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className="w-12 h-[2px] bg-[#D9909A]" />
            <h2 className="uppercase tracking-[5px] text-[#C23B4A] font-black text-lg text-center">
              How We Can Help You
            </h2>
            <span className="w-12 h-[2px] bg-[#D9909A]" />
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6">
            {helpItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className={`p-4 text-center ${
                    index !== helpItems.length - 1
                      ? "lg:border-r border-[#F1C8CF]"
                      : ""
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#FFE8EC] border border-[#F1C8CF] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#C23B4A]" />
                  </div>

                  <h3 className="font-black text-[#081325] mt-5 leading-tight">
                    {item.title}
                  </h3>

                  <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}