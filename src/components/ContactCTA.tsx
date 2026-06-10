import Link from "next/link";

export default function ContactCTA() {
  return (
    <section id="contact" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-slate-900 text-white rounded-[40px] p-16 text-center">
          <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
            Worldwide Export Solutions
          </span>

          <h2 className="text-5xl font-bold mt-6 mb-6">
            Looking For A Reliable
            <br />
            Himalayan Pink Salt Supplier?
          </h2>

          <p className="text-slate-300 text-lg max-w-3xl mx-auto mb-10">
            Partner with The Salt Secrets by Khan & Co. for premium Himalayan
            Pink Salt, private label manufacturing, retail packaging and bulk
            export solutions tailored for your market.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <div>
              <h3 className="text-3xl font-bold text-[#C98A92]">
                25+
              </h3>
              <p className="text-slate-400">
                Countries Served
              </p>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-[#C98A92]">
                500+
              </h3>
              <p className="text-slate-400">
                Tons Exported
              </p>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-[#C98A92]">
                Private
              </h3>
              <p className="text-slate-400">
                Label Solutions
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="bg-[#C98A92] px-8 py-4 rounded-full font-semibold hover:opacity-90 transition"
            >
              Request Quotation
            </Link>

            <Link
              href="mailto:thekhanandco@gmail.com"
              className="border border-slate-600 px-8 py-4 rounded-full font-semibold hover:bg-slate-800 transition"
            >
              Email Us
            </Link>

            <Link
              href="https://wa.me/923462771693"
              target="_blank"
              className="border border-slate-600 px-8 py-4 rounded-full font-semibold hover:bg-slate-800 transition"
            >
              WhatsApp Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}