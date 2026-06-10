import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock3,
  Package,
} from "lucide-react";

import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <div className="bg-[#FFF8F5]">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* HERO */}
        <div className="text-center mb-16">
          <span className="uppercase tracking-[6px] text-[#C23B4A] font-bold text-xs">
            Contact Us
          </span>

          <h1 className="text-5xl lg:text-7xl font-black mt-4 text-[#07142B] leading-tight">
            Let's Discuss Your
            <br />
            Salt Requirements
          </h1>

          <p className="text-lg text-slate-600 mt-6 max-w-3xl mx-auto">
            Contact our export team for quotations, private label
            manufacturing, bulk supply opportunities and international
            distribution inquiries.
          </p>
        </div>

        {/* QUICK CONTACT */}
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          <a
            href="mailto:thekhanandco@gmail.com"
            className="bg-white border border-[#EFE3E5] rounded-[24px] p-6 hover:shadow-lg transition"
          >
            <Mail className="w-8 h-8 text-[#C23B4A] mb-4" />
            <h3 className="font-bold text-xl text-[#07142B]">
              Email Us
            </h3>
            <p className="text-slate-500 mt-2">
              thekhanandco@gmail.com
            </p>
          </a>

          <a
            href="https://wa.me/923462771693"
            target="_blank"
            className="bg-white border border-[#EFE3E5] rounded-[24px] p-6 hover:shadow-lg transition"
          >
            <MessageCircle className="w-8 h-8 text-[#C23B4A] mb-4" />
            <h3 className="font-bold text-xl text-[#07142B]">
              WhatsApp
            </h3>
            <p className="text-slate-500 mt-2">
              Fastest Response
            </p>
          </a>

          <div className="bg-white border border-[#EFE3E5] rounded-[24px] p-6">
            <Package className="w-8 h-8 text-[#C23B4A] mb-4" />
            <h3 className="font-bold text-xl text-[#07142B]">
              Export Inquiries
            </h3>
            <p className="text-slate-500 mt-2">
              Bulk Orders & Private Label
            </p>
          </div>
        </div>

        {/* FORM + INFO */}
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10">
          <div className="bg-white rounded-[32px] border border-[#EFE3E5] p-8">
            <ContactForm />
          </div>

          <div className="bg-white rounded-[32px] border border-[#EFE3E5] p-10">
            <h2 className="text-3xl font-black text-[#07142B] mb-8">
              Contact Information
            </h2>

            <div className="space-y-8">
              <div className="flex gap-4">
                <Mail className="w-6 h-6 text-[#C23B4A] mt-1" />

                <div>
                  <h3 className="font-bold text-[#07142B]">
                    Email Address
                  </h3>

                  <p className="text-slate-600 mt-1">
                    thekhanandco@gmail.com
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Phone className="w-6 h-6 text-[#C23B4A] mt-1" />

                <div>
                  <h3 className="font-bold text-[#07142B]">
                    Phone / WhatsApp
                  </h3>

                  <p className="text-slate-600 mt-1">
                    +92 346 2771693
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <MapPin className="w-6 h-6 text-[#C23B4A] mt-1" />

                <div>
                  <h3 className="font-bold text-[#07142B]">
                    Location
                  </h3>

                  <p className="text-slate-600 mt-1">
                    Pakistan
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock3 className="w-6 h-6 text-[#C23B4A] mt-1" />

                <div>
                  <h3 className="font-bold text-[#07142B]">
                    Business Hours
                  </h3>

                  <p className="text-slate-600 mt-1">
                    Monday - Friday
                    <br />
                    9:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="https://wa.me/923462771693"
              target="_blank"
              className="mt-10 inline-flex items-center justify-center w-full bg-[#C23B4A] text-white py-4 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Chat On WhatsApp
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}