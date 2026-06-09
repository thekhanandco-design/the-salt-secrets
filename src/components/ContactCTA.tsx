export default function ContactCTA() {
  return (
    <section id="contact" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-slate-900 text-white rounded-[40px] p-16 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Looking For A Reliable Salt Supplier?
          </h2>

          <p className="text-slate-300 text-lg mb-10">
            Contact Khan & Co. today for quotations, catalogs and export inquiries.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button className="bg-[#C98A92] px-8 py-4 rounded-full font-semibold">
              Request Quotation
            </button>

            <button className="border border-slate-600 px-8 py-4 rounded-full font-semibold">
              Email Us
            </button>

            <button className="border border-slate-600 px-8 py-4 rounded-full font-semibold">
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}