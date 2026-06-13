import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#07142B] text-white">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16 py-16">
        <div className="grid lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-12">
          {/* BRAND */}
          <div>
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="The Salt Secrets"
                width={70}
                height={70}
              />

              <div>
                <h3 className="text-2xl font-black">
                  The Salt Secrets
                </h3>

                <p className="text-slate-400 text-sm">
                  Himalayan Pink Salt Exporter
                </p>
              </div>
            </div>

            <p className="text-slate-400 mt-6 leading-relaxed max-w-md">
              Premium Himalayan Pink Salt supplier offering retail
              packaging, bulk supply and private label solutions for
              distributors, wholesalers and international buyers.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <span className="px-4 py-2 rounded-full border border-slate-700 text-sm">
                HACCP Facility
              </span>

              <span className="px-4 py-2 rounded-full border border-slate-700 text-sm">
                HALAL Production
              </span>

              <span className="px-4 py-2 rounded-full border border-slate-700 text-sm">
                Export Quality
              </span>

              <span className="px-4 py-2 rounded-full border border-slate-700 text-sm">
                Private Label
              </span>
            </div>

            {/* SOCIAL */}
            <div className="flex gap-3 mt-8">
              <Link
                href="https://wa.me/923462771693"
                target="_blank"
                className="w-11 h-11 rounded-full border border-slate-700 flex items-center justify-center hover:bg-[#C23B4A] hover:border-[#C23B4A] transition"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="font-bold text-lg mb-6">
              Quick Links
            </h4>

            <ul className="space-y-4 text-slate-400">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#C23B4A] transition"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/about"
                  className="hover:text-[#C23B4A] transition"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  href="/products"
                  className="hover:text-[#C23B4A] transition"
                >
                  Products
                </Link>
              </li>

              <li>
                <Link
                  href="/private-label"
                  className="hover:text-[#C23B4A] transition"
                >
                  Private Label
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="hover:text-[#C23B4A] transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* PRODUCTS */}
          <div>
            <h4 className="font-bold text-lg mb-6">
              Products
            </h4>

            <ul className="space-y-4 text-slate-400">
              <li>Salt Grinder</li>
              <li>Pink Salt Jar</li>
              <li>Salt Shaker</li>
              <li>Rock Salt Chunks</li>
              <li>Private Label Solutions</li>
            </ul>
          </div>

          {/* CONTACT INFO */}
          <div>
            <h4 className="font-bold text-lg mb-6">
              Contact Info
            </h4>

            <div className="space-y-5">
              <div className="flex items-start gap-3 text-slate-400">
                <Mail className="w-5 h-5 mt-0.5 text-[#C23B4A]" />
                <span>thekhanandco@gmail.com</span>
              </div>

              <div className="flex items-start gap-3 text-slate-400">
                <Phone className="w-5 h-5 mt-0.5 text-[#C23B4A]" />
                <span>+92 346 2771693</span>
              </div>

              <div className="flex items-start gap-3 text-slate-400">
                <MapPin className="w-5 h-5 mt-0.5 text-[#C23B4A]" />
                <span>Pakistan</span>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center mt-8 bg-[#C23B4A] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Request Quote
            </Link>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-slate-800 mt-14 pt-8 flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm text-center lg:text-left">
            © 2026 The Salt Secrets by Khan & Co. All Rights Reserved.
          </p>

          <p className="text-slate-500 text-sm text-center lg:text-right">
            Premium Himalayan Pink Salt Supplier & Private Label Partner
          </p>
        </div>
      </div>
    </footer>
  );
}