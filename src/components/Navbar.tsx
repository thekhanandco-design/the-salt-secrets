import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="The Salt Secrets"
            width={55}
            height={55}
          />

          <div>
            <h2 className="font-bold text-lg md:text-2xl text-slate-900">
              The Salt Secrets
            </h2>

            <p className="text-slate-500 text-xs md:text-sm">
              by Khan & Co.
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-medium text-slate-700">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
          <Link href="/private-label">Private Label</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <Link
          href="/contact"
          className="bg-[#C98A92] text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold hover:opacity-90"
        >
          Get Quote
        </Link>
      </div>
    </header>
  );
}