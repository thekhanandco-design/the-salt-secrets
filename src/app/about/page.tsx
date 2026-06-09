import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      {/* Hero */}
      <div className="max-w-5xl">
        <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
          About Us
        </span>

        <h1 className="text-6xl font-bold mt-4 leading-tight">
          The Salt Secrets
          <br />
          by Khan & Co.
        </h1>

        <p className="text-xl text-slate-600 mt-8 leading-relaxed">
          The Salt Secrets is a premium Himalayan Pink Salt exporter committed
          to supplying high-quality salt products to importers, distributors,
          wholesalers, retailers and private label brands worldwide.
        </p>

        <p className="text-xl text-slate-600 mt-6 leading-relaxed">
          Our mission is to deliver consistent quality, reliable supply and
          professional export services that help our partners grow in their
          local markets with confidence.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-8 mt-20">
        <div className="bg-white p-8 rounded-[30px] shadow-lg">
          <h3 className="text-5xl font-bold">20+</h3>
          <p className="text-slate-600 mt-3">Countries Served</p>
        </div>

        <div className="bg-white p-8 rounded-[30px] shadow-lg">
          <h3 className="text-5xl font-bold">100%</h3>
          <p className="text-slate-600 mt-3">Natural Products</p>
        </div>

        <div className="bg-white p-8 rounded-[30px] shadow-lg">
          <h3 className="text-5xl font-bold">PL</h3>
          <p className="text-slate-600 mt-3">Private Label Expertise</p>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-white rounded-[40px] p-12 mt-20 shadow-lg">
        <h2 className="text-4xl font-bold mb-8">
          Why Businesses Choose Us
        </h2>

        <div className="grid md:grid-cols-2 gap-10 text-slate-600 text-lg">
          <div>
            ✓ Premium Himalayan Pink Salt Products
            <br />
            ✓ Consistent Product Quality
            <br />
            ✓ Food-Grade Manufacturing Standards
            <br />
            ✓ Flexible Packaging Options
          </div>

          <div>
            ✓ International Export Experience
            <br />
            ✓ Reliable Supply Chain
            <br />
            ✓ Private Label Solutions
            <br />
            ✓ Long-Term Business Partnerships
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-8 mt-20">
        <div className="bg-white p-10 rounded-[30px] shadow-lg">
          <h3 className="text-3xl font-bold mb-4">Our Mission</h3>

          <p className="text-slate-600 leading-relaxed">
            To provide premium Himalayan Pink Salt products with reliable
            service, professional export support and long-term value for
            partners around the world.
          </p>
        </div>

        <div className="bg-white p-10 rounded-[30px] shadow-lg">
          <h3 className="text-3xl font-bold mb-4">Our Vision</h3>

          <p className="text-slate-600 leading-relaxed">
            To become a trusted global supplier of Himalayan Pink Salt products
            and private label solutions for retailers, distributors and brands.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-24">
        <h2 className="text-4xl font-bold">
          Ready To Work With Us?
        </h2>

        <p className="text-slate-600 text-lg mt-4">
          Let's discuss your Himalayan Pink Salt sourcing requirements.
        </p>

        <Link
          href="/contact"
          className="inline-block mt-8 bg-[#C98A92] text-white px-10 py-4 rounded-full font-semibold text-lg hover:opacity-90"
        >
          Contact Us Today
        </Link>
      </div>
    </div>
  );
}