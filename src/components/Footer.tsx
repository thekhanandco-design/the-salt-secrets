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
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16 py-7">
        <div className="grid lg:grid-cols-[1.8fr_1fr_1fr] gap-8 items-start">
          {/* BRAND */}
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="The Salt Secrets"
                width={60}
                height={60}
              />

              <div>
                <h3 className="text-xl font-black">
                  The Salt Secrets
                </h3>

                <p className="text-gray-300 text-xs">
                  Himalayan Pink Salt Exporter
                </p>
              </div>
            </div>

            <p className="text-gray-300 mt-4 leading-8 max-w-md">
              Premium Himalayan Pink Salt supplier offering retail
              packaging, bulk supply and private label solutions for
              distributors, wholesalers and international buyers worldwide.
            </p>

            {/* SOCIAL ICONS */}
            <div className="flex gap-2 mt-4">
              <Link
                href="https://wa.me/923462771693"
                target="_blank"
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C23B4A] transition"
              >
                <MessageCircle className="w-4 h-4 text-white" />
              </Link>

              <Link
                href="#"
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C23B4A] transition"
              >
                <FaInstagram className="text-white text-[15px]" />
              </Link>

              <Link
                href="#"
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C23B4A] transition"
              >
                <FaFacebookF className="text-white text-[14px]" />
              </Link>

              <Link
                href="#"
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#C23B4A] transition"
              >
                <FaLinkedinIn className="text-white text-[14px]" />
              </Link>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="font-bold text-lg mb-4">
              Quick Links
            </h4>

            <ul className="space-y-2 text-gray-300">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/private-label">Private Label</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="font-bold text-lg mb-4">
              Contact Info
            </h4>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-4 h-4 text-[#C23B4A]" />
                <span>thekhanandco@gmail.com</span>
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="w-4 h-4 text-[#C23B4A]" />
                <span>+92 346 2771693</span>
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="w-4 h-4 text-[#C23B4A]" />
                <span>Pakistan</span>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center mt-5 bg-[#C23B4A] text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Request Quote
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 mt-5 pt-4 flex flex-col lg:flex-row items-center justify-between gap-2">
          <p className="text-gray-400 text-xs">
            © 2026 The Salt Secrets by Khan & Co. All Rights Reserved.
          </p>

          <p className="text-gray-400 text-xs">
            Premium Himalayan Pink Salt Supplier & Private Label Partner
          </p>
        </div>
      </div>
    </footer>
  );
}