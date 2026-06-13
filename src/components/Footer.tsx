import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
} from "lucide-react";

import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#3A3A3A] text-white">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16 py-10">
        <div className="grid lg:grid-cols-[1.8fr_1fr_1fr] gap-10 items-start">
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

                <p className="text-gray-300 text-sm">
                  Himalayan Pink Salt Exporter
                </p>
              </div>
            </div>

            <p className="text-gray-300 mt-5 leading-relaxed max-w-md">
              Premium Himalayan Pink Salt supplier offering retail
              packaging, bulk supply and private label solutions for
              distributors, wholesalers and international buyers
              worldwide.
            </p>

            {/* SOCIAL ICONS */}
            <div className="flex gap-3 mt-6">
              <Link
                href="https://wa.me/923462771693"
                target="_blank"
                className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C23B4A] hover:border-[#C23B4A] transition"
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </Link>

              <Link
                href="#"
                target="_blank"
                className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C23B4A] hover:border-[#C23B4A] transition"
              >
                <FaInstagram className="text-white text-[18px]" />
              </Link>

              <Link
                href="#"
                target="_blank"
                className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C23B4A] hover:border-[#C23B4A] transition"
              >
                <FaFacebookF className="text-white text-[16px]" />
              </Link>

              <Link
                href="#"
                target="_blank"
                className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C23B4A] hover:border-[#C23B4A] transition"
              >
                <FaLinkedinIn className="text-white text-[16px]" />
              </Link>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="font-bold text-white text-lg mb-5">
              Quick Links
            </h4>

            <ul className="space-y-3 text-gray-300">
              <li><Link href="/" className="hover:text-[#C23B4A] transition">Home</Link></li>
              <li><Link href="/about" className="hover:text-[#C23B4A] transition">About Us</Link></li>
              <li><Link href="/products" className="hover:text-[#C23B4A] transition">Products</Link></li>
              <li><Link href="/private-label" className="hover:text-[#C23B4A] transition">Private Label</Link></li>
              <li><Link href="/contact" className="hover:text-[#C23B4A] transition">Contact</Link></li>
            </ul>
          </div>

          {/* CONTACT INFO */}
          <div>
            <h4 className="font-bold text-white text-lg mb-5">
              Contact Info
            </h4>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-gray-300">
                <Mail className="w-5 h-5 mt-0.5 text-[#C23B4A]" />
                <span>thekhanandco@gmail.com</span>
              </div>

              <div className="flex items-start gap-3 text-gray-300">
                <Phone className="w-5 h-5 mt-0.5 text-[#C23B4A]" />
                <span>+92 346 2771693</span>
              </div>

              <div className="flex items-start gap-3 text-gray-300">
                <MapPin className="w-5 h-5 mt-0.5 text-[#C23B4A]" />
                <span>Pakistan</span>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center mt-6 bg-[#C23B4A] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Request Quote
            </Link>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="border-t border-white/10 mt-8 pt-5 flex flex-col lg:flex-row items-center justify-between gap-3">
          <p className="text-gray-400 text-sm text-center lg:text-left">
            © 2026 The Salt Secrets by Khan & Co. All Rights Reserved.
          </p>

          <p className="text-gray-400 text-sm text-center lg:text-right">
            Premium Himalayan Pink Salt Supplier & Private Label Partner
          </p>
        </div>
      </div>
    </footer>
  );
}