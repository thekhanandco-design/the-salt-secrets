import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white mt-24">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-4 gap-12">

          {/* BRAND */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="The Salt Secrets"
                width={70}
                height={70}
              />

              <div>
                <h3 className="text-3xl font-bold">
                  The Salt Secrets
                </h3>

                <p className="text-slate-400">
                  by Khan & Co.
                </p>
              </div>
            </div>

            <p className="text-slate-400 mt-6 max-w-xl leading-relaxed">
              Premium Himalayan Pink Salt exporter supplying
              importers, distributors, wholesalers, retailers and
              private label brands across international markets.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <span className="px-4 py-2 border border-slate-700 rounded-full text-sm">
                HACCP Facility
              </span>

              <span className="px-4 py-2 border border-slate-700 rounded-full text-sm">
                HALAL Production
              </span>

              <span className="px-4 py-2 border border-slate-700 rounded-full text-sm">
                Worldwide Export
              </span>

              <span className="px-4 py-2 border border-slate-700 rounded-full text-sm">
                Private Label
              </span>
            </div>
          </div>

          {/* LINKS */}
          <div>
            <h4 className="font-bold text-lg mb-5">
              Quick Links
            </h4>

            <ul className="space-y-3 text-slate-400">
              <li>
                <Link href="/">Home</Link>
              </li>

              <li>
                <Link href="/products">Products</Link>
              </li>

              <li>
                <Link href="/private-label">Private Label</Link>
              </li>

              <li>
                <Link href="/about">About Us</Link>
              </li>

              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="font-bold text-lg mb-5">
              Contact
            </h4>

            <div className="space-y-3 text-slate-400">
              <p>info@thesaltsecrets.com</p>

              <p>Pakistan</p>

              <p>Worldwide Export Operations</p>
            </div>

            <Link
              href="/contact"
              className="inline-block mt-6 bg-[#C98A92] text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition"
            >
              Request Quote
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 The Salt Secrets. All Rights Reserved.
          </p>

          <p className="text-slate-500 text-sm">
            Premium Himalayan Pink Salt Exporter
          </p>
        </div>
      </div>
    </footer>
  );
}