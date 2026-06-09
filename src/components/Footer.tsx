export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-2xl font-bold">
              The Salt Secrets
            </h3>

            <p className="text-slate-400 mt-4">
              Premium Himalayan Pink Salt exporter serving
              distributors, wholesalers and private label brands
              worldwide.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">
              Quick Links
            </h4>

            <ul className="space-y-2 text-slate-400">
              <li>Home</li>
              <li>Products</li>
              <li>Private Label</li>
              <li>About</li>
              <li>Contact</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">
              Contact
            </h4>

            <p className="text-slate-400">
              info@thesaltsecrets.com
            </p>

            <p className="text-slate-400 mt-2">
              Pakistan
            </p>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-12 pt-6 text-center text-slate-500">
          © 2026 The Salt Secrets. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}