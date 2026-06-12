"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-[999] bg-[#FFF8F5]/95 backdrop-blur-sm border-b border-[#F0DDE1]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-[88px] flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="The Salt Secrets"
              width={110}
              height={110}
              priority
              className="h-[62px] w-auto object-contain"
            />
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden lg:flex items-center gap-10 text-[15px] font-medium text-slate-700">
            <Link href="/" className="hover:text-[#C98A92] transition">
              Home
            </Link>

            <Link
              href="/about"
              className="hover:text-[#C98A92] transition"
            >
              About Us
            </Link>

            <Link
              href="/products"
              className="hover:text-[#C98A92] transition"
            >
              Products
            </Link>

            <Link
              href="/private-label"
              className="hover:text-[#C98A92] transition"
            >
              Private Label
            </Link>

            <Link
              href="/#certifications"
              className="hover:text-[#C98A92] transition"
            >
              Certifications
            </Link>

            <Link
              href="/contact"
              className="hover:text-[#C98A92] transition"
            >
              Contact
            </Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/contact"
              className="hidden md:flex items-center justify-center bg-[#C98A92] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Get Quote
            </Link>

            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden flex flex-col gap-1.5"
            >
              <span className="w-7 h-[2px] bg-slate-900"></span>
              <span className="w-7 h-[2px] bg-slate-900"></span>
              <span className="w-7 h-[2px] bg-slate-900"></span>
            </button>
          </div>
        </div>
      </header>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[90]"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed top-0 right-0 h-screen w-[85%] max-w-[380px] bg-white z-[100] shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <Image
                src="/logo.png"
                alt="The Salt Secrets"
                width={75}
                height={75}
                className="h-[60px] w-auto object-contain"
              />

              <button
                onClick={() => setIsOpen(false)}
                className="text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-8 flex flex-col gap-6 text-lg font-medium">
              <Link href="/" onClick={() => setIsOpen(false)}>
                Home
              </Link>

              <Link href="/about" onClick={() => setIsOpen(false)}>
                About Us
              </Link>

              <Link href="/products" onClick={() => setIsOpen(false)}>
                Products
              </Link>

              <Link href="/private-label" onClick={() => setIsOpen(false)}>
                Private Label
              </Link>

              <Link
                href="/#certifications"
                onClick={() => setIsOpen(false)}
              >
                Certifications
              </Link>

              <Link href="/contact" onClick={() => setIsOpen(false)}>
                Contact
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="mt-4 bg-[#C98A92] text-white text-center py-4 rounded-xl font-semibold"
              >
                Get Quote
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}