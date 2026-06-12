"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-[999] bg-[#F9F4F2]/95 backdrop-blur-md border-b border-white/50">
        <div className="w-full max-w-[1800px] mx-auto px-8 lg:px-16 h-24 flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="The Salt Secrets"
              width={120}
              height={120}
              priority
              className="h-[70px] w-auto object-contain"
            />
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden lg:flex items-center gap-12 text-[16px] font-semibold text-[#07142B]">
            <Link href="/" className="hover:text-[#C54B5B] transition">
              Home
            </Link>

            <Link href="/about" className="hover:text-[#C54B5B] transition">
              About Us
            </Link>

            <Link href="/products" className="hover:text-[#C54B5B] transition">
              Products
            </Link>

            <Link
              href="/private-label"
              className="hover:text-[#C54B5B] transition"
            >
              Private Label
            </Link>

            <Link
              href="/#certifications"
              className="hover:text-[#C54B5B] transition"
            >
              Certifications
            </Link>

            <Link href="/contact" className="hover:text-[#C54B5B] transition">
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
              className="lg:hidden flex flex-col gap-1.5"
              aria-label="Open menu"
            >
              <span className="w-7 h-[2px] bg-[#07142B]"></span>
              <span className="w-7 h-[2px] bg-[#07142B]"></span>
              <span className="w-7 h-[2px] bg-[#07142B]"></span>
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

          <div className="fixed top-0 right-0 h-screen w-[85%] max-w-[380px] bg-[#F9F4F2] z-[100] shadow-2xl">
            <div className="p-6 border-b border-[#F0DDE1] flex items-center justify-between">
              <Image
                src="/logo.png"
                alt="The Salt Secrets"
                width={80}
                height={80}
                className="h-[65px] w-auto object-contain"
              />

              <button
                onClick={() => setIsOpen(false)}
                className="text-3xl leading-none text-[#07142B]"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="p-8 flex flex-col gap-6 text-lg font-semibold text-[#07142B]">
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

              <Link href="/#certifications" onClick={() => setIsOpen(false)}>
                Certifications
              </Link>

              <Link href="/contact" onClick={() => setIsOpen(false)}>
                Contact
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="mt-4 bg-[#C54B5B] text-white text-center py-4 rounded-xl font-bold"
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