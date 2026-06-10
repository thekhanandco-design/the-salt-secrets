import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#081528] text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12">
          {/* BRAND */}
          <div>
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="The Salt Secrets"
                width={60}
                height={60}
              />

              <h3 className="text-2xl font-bold">
                The Salt Secrets
              </h3>
            </div>

            <p className="text-slate-400 mt-6 leading-relaxed max-w-md">
              Premium Himalayan Pink Salt manufacturer and exporter
              supplying distributors, wholesalers, supermarkets,
              retailers and private label brands worldwide.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <span className="px-4 py-2 rounded-full border border-slate-700 text-sm">
                HACCP Certified
              </span>

              <span className="px-4 py-2 rounded-full border border-slate-700 text-sm">
                HALAL Certified
              </span>

              <span className="px-4 py-2 rounded-full border border-slate-700 text-sm">
                Worldwide Export
              </span>

              <span className="px-4 py-2 rounded-full border border-slate-700 text-sm">
                Private Label
              </span>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="font-semibold text-lg mb-6">
              Quick Links
            </h4>

            <ul className="space-y-4 text-slate-400">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  href="/products"
                  className="hover:text-white transition"
                >
                  Products
                </Link>
              </li>

              <li>
                <Link
                  href="/private-label"
                  className="hover:text-white transition"
                >
                  Private Label
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* PRODUCTS */}
          <div>
            <h4 className="font-semibold text-lg mb-6">
              Products
            </h4>

            <ul className="space-y-4 text-slate-400">
              <li>Salt Grinder</li>
              <li>Pink Salt Jar</li>
              <li>Salt Shaker</li>
              <li>Rock Salt Chunks</li>
              <li>Bulk Salt Supply</li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="font-semibold text-lg mb-6">
              Contact
            </h4>

            <div className="space-y-4 text-slate-400">
              <p>info@thesaltsecrets.com</p>

              <p>Pakistan</p>

              <p>Worldwide Export Operations</p>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center mt-8 bg-[#C23B4A] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Request Quote
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 The Salt Secrets. All Rights Reserved.
          </p>

          <p className="text-slate-500 text-sm">
            Premium Himalayan Pink Salt Manufacturer & Exporter
          </p>
        </div>
      </div>
    </footer>
  );
}