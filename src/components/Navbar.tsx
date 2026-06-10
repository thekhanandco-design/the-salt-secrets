"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-5 lg:px-6 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="The Salt Secrets"
              width={70}
              height={70}
              priority
            />

            <div>
              <h2 className="font-bold text-xl lg:text-3xl text-slate-900 leading-none">
                The Salt Secrets
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                by Khan & Co.
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-10 font-medium text-slate-700">
            <Link href="/" className="hover:text-[#C98A92] transition">
              Home
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
              href="/about"
              className="hover:text-[#C98A92] transition"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="hover:text-[#C98A92] transition"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/contact"
              className="hidden md:flex bg-[#C98A92] text-white px-7 py-3 rounded-full font-semibold hover:opacity-90 transition"
            >
              Get Quote
            </Link>

            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden flex flex-col gap-1"
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
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="The Salt Secrets"
                  width={50}
                  height={50}
                />

                <div>
                  <h3 className="font-bold text-lg">
                    The Salt Secrets
                  </h3>

                  <p className="text-xs text-slate-500">
                    by Khan & Co.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-3xl"
              >
                ×
              </button>
            </div>

            <div className="p-8 flex flex-col gap-6 text-lg font-medium">
              <Link href="/" onClick={() => setIsOpen(false)}>
                Home
              </Link>

              <Link
                href="/products"
                onClick={() => setIsOpen(false)}
              >
                Products
              </Link>

              <Link
                href="/private-label"
                onClick={() => setIsOpen(false)}
              >
                Private Label
              </Link>

              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
              >
                About Us
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="mt-4 bg-[#C98A92] text-white text-center py-4 rounded-full font-semibold"
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