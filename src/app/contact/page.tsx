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
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16 py-16 lg:py-20">
        {/* HERO */}
        <div className="text-center mb-12">
          <span className="uppercase tracking-[7px] text-[#C23B4A] font-black text-lg">
            Contact Us
          </span>

          {/* SMLHDNG */}
          <h1 className="text-3xl lg:text-5xl font-black mt-3 text-[#07142B]">
            Let's Discuss Your Salt Requirements
          </h1>

          <p className="max-w-3xl mx-auto text-slate-600 mt-4 text-base lg:text-lg">
            Contact our export team for quotations, private label
            manufacturing, bulk supply opportunities and international
            distribution inquiries.
          </p>
        </div>

        {/* QUICK CONTACT */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          <a
            href="mailto:thekhanandco@gmail.com"
            className="bg-white border border-[#EFE3E5] rounded-[24px] p-6 hover:shadow-[0_15px_40px_rgba(194,59,74,0.08)] transition-all duration-300"
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
            className="bg-white border border-[#EFE3E5] rounded-[24px] p-6 hover:shadow-[0_15px_40px_rgba(194,59,74,0.08)] transition-all duration-300"
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
              Bulk & Private Label
            </h3>

            <p className="text-slate-500 mt-2">
              OEM Packaging & Export Orders
            </p>
          </div>
        </div>

        {/* MAIN SECTION */}
        <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8">
          {/* FORM */}
          <div className="bg-white rounded-[32px] border border-[#EFE3E5] p-8 lg:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.03)]">
            <h2 className="text-2xl lg:text-3xl font-black text-[#07142B] mb-2">
              Send Us Your Inquiry
            </h2>

            <p className="text-slate-600 mb-8">
              Share your requirements and our team will get back to you
              with pricing, packaging options and export information.
            </p>

            <ContactForm />
          </div>

          {/* INFO PANEL */}
          <div className="bg-white rounded-[32px] border border-[#EFE3E5] p-8 lg:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.03)]">
            <h2 className="text-2xl lg:text-3xl font-black text-[#07142B] mb-8">
              Contact Information
            </h2>

            <div className="space-y-8">
              <div className="flex gap-4">
                <Mail className="w-6 h-6 text-[#C23B4A] mt-1 shrink-0" />

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
                <Phone className="w-6 h-6 text-[#C23B4A] mt-1 shrink-0" />

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
                <MapPin className="w-6 h-6 text-[#C23B4A] mt-1 shrink-0" />

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
                <Clock3 className="w-6 h-6 text-[#C23B4A] mt-1 shrink-0" />

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

            <div className="mt-10 p-6 rounded-[24px] bg-[#FFF4F5] border border-[#F3DADD]">
              <h3 className="text-xl font-black text-[#07142B]">
                Export & Wholesale Orders
              </h3>

              <p className="text-slate-600 mt-3">
                For bulk orders, distributor partnerships and private
                label projects, contact us directly on WhatsApp for
                faster assistance.
              </p>
            </div>

            <Link
              href="https://wa.me/923462771693"
              target="_blank"
              className="mt-8 inline-flex items-center justify-center w-full bg-[#C23B4A] text-white py-4 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Chat On WhatsApp
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}