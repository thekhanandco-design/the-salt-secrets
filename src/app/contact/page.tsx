import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
          Contact Us
        </span>

        <h1 className="text-6xl font-bold mt-4">
          Let's Discuss Your
          <br />
          Salt Requirements
        </h1>

        <p className="text-xl text-slate-600 mt-6 max-w-3xl mx-auto">
          Contact our export team for quotations, private label opportunities
          and wholesale inquiries.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <ContactForm />

        <div className="bg-white p-10 rounded-[30px] shadow-lg">
          <h2 className="text-3xl font-bold mb-8">
            Contact Information
          </h2>

          <div className="space-y-6 text-lg">
            <div>
              <h3 className="font-bold">Email</h3>
              <p className="text-slate-600">
                thekhanandco@gmail.com
              </p>
            </div>

            <div>
              <h3 className="font-bold">Phone</h3>
              <p className="text-slate-600">
                +92 XXX XXXXXXX
              </p>
            </div>

            <div>
              <h3 className="font-bold">Location</h3>
              <p className="text-slate-600">
                Pakistan
              </p>
            </div>

            <div>
              <h3 className="font-bold">Business Hours</h3>
              <p className="text-slate-600">
                Monday - Friday
                <br />
                9:00 AM - 6:00 PM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}