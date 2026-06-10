export default function WhyChooseUs() {
  const features = [
    "Private Label Solutions",
    "Export Documentation",
    "Bulk Production Capacity",
    "Quality Control",
    "Worldwide Shipping",
  ];

  const faqs = [
    {
      question: "Do you export Himalayan Pink Salt worldwide?",
      answer:
        "Yes. We supply Himalayan Pink Salt products to importers, distributors, wholesalers and private label brands across global markets.",
    },
    {
      question: "Do you offer private label services?",
      answer:
        "Yes. We provide custom branding, packaging design and private label manufacturing solutions.",
    },
    {
      question: "What packaging options are available?",
      answer:
        "We offer retail jars, grinder bottles, shaker bottles, stand-up pouches and bulk packaging options.",
    },
    {
      question: "Can you handle bulk orders?",
      answer:
        "Yes. We have large-scale production capabilities for wholesale and export buyers.",
    },
  ];

  return (
    <section className="bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
            Why Choose Us
          </span>

          <h2 className="text-5xl font-bold mt-4">
            Trusted Export Partner
          </h2>

          <p className="text-slate-600 mt-4 max-w-3xl mx-auto">
            The Salt Secrets by Khan & Co. delivers premium Himalayan Pink Salt
            products with strict quality control, export expertise and reliable
            worldwide logistics.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {features.map((item) => (
            <div
              key={item}
              className="bg-white p-8 rounded-[24px] shadow-sm border hover:shadow-lg transition"
            >
              <h3 className="font-bold text-xl">
                {item}
              </h3>
            </div>
          ))}
        </div>

        {/* FAQ SECTION */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
              Frequently Asked Questions
            </span>

            <h2 className="text-5xl font-bold mt-4">
              Common Buyer Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="bg-white border rounded-[24px] p-8"
              >
                <h3 className="text-xl font-bold mb-3">
                  {faq.question}
                </h3>

                <p className="text-slate-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}