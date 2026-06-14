"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-[999] bg-white border-b border-[#F1E2E5] shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-16 h-[84px] flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="The Salt Origin"
              width={110}
              height={110}
              priority
              className="h-[55px] lg:h-[62px] w-auto object-contain"
            />
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden lg:flex items-center gap-12 text-[16px] font-semibold text-[#111827]">
            <Link href="/" className="hover:text-[#C54B5B] transition">
              Home
            </Link>

            <Link
              href="/about"
              className="hover:text-[#C54B5B] transition"
            >
              About Us
            </Link>

            <Link
              href="/products"
              className="hover:text-[#C54B5B] transition"
            >
              Products
            </Link>

            <Link
              href="/private-label"
              className="hover:text-[#C54B5B] transition"
            >
              Private Label
            </Link>

            <Link
               href="/certifications"
              className="hover:text-[#C54B5B] transition"
            >
              Certifications
            </Link>

            <Link
              href="/contact"
              className="hover:text-[#C54B5B] transition"
            >
              Contact
            </Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/contact"
              className="hidden md:flex items-center justify-center bg-[#C54B5B] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition"
            >
              Get Quote
            </Link>

            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden flex flex-col gap-1.5 p-1"
              aria-label="Open menu"
            >
              <span className="w-7 h-[2.5px] bg-[#111827] rounded-full"></span>
              <span className="w-7 h-[2.5px] bg-[#111827] rounded-full"></span>
              <span className="w-7 h-[2.5px] bg-[#111827] rounded-full"></span>
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

          <div className="fixed top-0 right-0 h-screen w-[80%] max-w-[360px] bg-white z-[100] shadow-2xl">
            <div className="p-6 border-b border-[#F0DDE1] flex items-center justify-between">
              <Image
                src="/logo.png"
                alt="The Salt Origin"
                width={80}
                height={80}
                className="h-[55px] w-auto object-contain"
              />

              <button
                onClick={() => setIsOpen(false)}
                className="text-3xl leading-none text-[#111827]"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="p-8 flex flex-col gap-2 text-lg font-semibold text-[#111827]">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-[#FFF4F5] hover:text-[#C54B5B] transition"
              >
                Home
              </Link>

              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-[#FFF4F5] hover:text-[#C54B5B] transition"
              >
                About Us
              </Link>

              <Link
                href="/products"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-[#FFF4F5] hover:text-[#C54B5B] transition"
              >
                Products
              </Link>

              <Link
                href="/private-label"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-[#FFF4F5] hover:text-[#C54B5B] transition"
              >
                Private Label
              </Link>

              <Link
                href="/certifications"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-[#FFF4F5] hover:text-[#C54B5B] transition"
              >
                Certifications
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-[#FFF4F5] hover:text-[#C54B5B] transition"
              >
                Contact
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="mt-5 bg-[#C54B5B] text-white text-center py-4 rounded-xl font-bold w-full hover:opacity-90 transition"
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