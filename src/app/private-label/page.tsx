import Link from "next/link";

export default function PrivateLabelPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center max-w-4xl mx-auto">
        <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
          Private Label Solutions
        </span>

        <h1 className="text-6xl font-bold mt-4">
          Launch Your Own
          <br />
          Himalayan Pink Salt Brand
        </h1>

        <p className="text-xl text-slate-600 mt-6">
          We help importers, distributors, retailers and entrepreneurs create
          premium private label Himalayan Pink Salt products ready for global
          markets.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
        <div className="bg-white p-8 rounded-[30px] shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Custom Packaging</h3>
          <p className="text-slate-600">
            Retail jars, grinders, pouches and bulk packaging tailored to your
            brand.
          </p>
        </div>

        <div className="bg-white p-8 rounded-[30px] shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Custom Labels</h3>
          <p className="text-slate-600">
            Professional label design and branding with your logo and product
            information.
          </p>
        </div>

        <div className="bg-white p-8 rounded-[30px] shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Export Support</h3>
          <p className="text-slate-600">
            Complete export documentation and international shipping support.
          </p>
        </div>

        <div className="bg-white p-8 rounded-[30px] shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Quality Assurance</h3>
          <p className="text-slate-600">
            Consistent product quality with food-grade manufacturing standards.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-12 mt-20 shadow-lg">
        <h2 className="text-4xl font-bold mb-6">
          Why Choose Our Private Label Program?
        </h2>

        <div className="grid md:grid-cols-2 gap-8 text-slate-600 text-lg">
          <div>
            ✓ Low-risk brand launch
            <br />
            ✓ Premium Himalayan Pink Salt
            <br />
            ✓ Multiple packaging options
            <br />
            ✓ Flexible order quantities
          </div>

          <div>
            ✓ International export experience
            <br />
            ✓ Fast production timelines
            <br />
            ✓ Custom branding support
            <br />
            ✓ Long-term supply partnership
          </div>
        </div>
      </div>

      <div className="mt-24">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold">
            Our Private Label Process
          </h2>

          <p className="text-slate-600 mt-4">
            From idea to shelf-ready product.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-[30px] shadow-lg">
            <div className="text-4xl font-bold text-[#C98A92] mb-4">01</div>
            <h3 className="text-xl font-bold">Consultation</h3>
            <p className="text-slate-600 mt-3">
              Discuss product requirements and target market.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[30px] shadow-lg">
            <div className="text-4xl font-bold text-[#C98A92] mb-4">02</div>
            <h3 className="text-xl font-bold">Branding</h3>
            <p className="text-slate-600 mt-3">
              Create packaging and private label design.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[30px] shadow-lg">
            <div className="text-4xl font-bold text-[#C98A92] mb-4">03</div>
            <h3 className="text-xl font-bold">Production</h3>
            <p className="text-slate-600 mt-3">
              Manufacturing and quality inspection.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[30px] shadow-lg">
            <div className="text-4xl font-bold text-[#C98A92] mb-4">04</div>
            <h3 className="text-xl font-bold">Export</h3>
            <p className="text-slate-600 mt-3">
              Documentation, shipping and delivery.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mt-20">
        <h2 className="text-4xl font-bold">
          Ready To Build Your Salt Brand?
        </h2>

        <p className="text-slate-600 text-lg mt-4">
          Contact us today to discuss your private label requirements.
        </p>

        <Link
          href="/contact"
          className="inline-block mt-8 bg-[#C98A92] text-white px-10 py-4 rounded-full font-semibold text-lg hover:opacity-90"
        >
          Request Private Label Quote
        </Link>
      </div>
    </div>
  );
}

