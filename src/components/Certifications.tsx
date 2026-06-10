export default function Certifications() {
  return (
    <section className="bg-[#FFF8F5] py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="uppercase tracking-[5px] text-[#C98A92] font-bold text-xs">
              Production Standards
            </span>

            <h2 className="text-5xl font-bold mt-4 text-slate-950">
              Produced Through Trusted Manufacturing Partners
            </h2>

            <p className="text-slate-600 mt-6 text-lg leading-relaxed">
              Our Himalayan Pink Salt products are sourced and packed through
              manufacturing facilities operating under internationally
              recognized food safety and quality systems.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <div className="bg-white border border-[#F0DDE1] rounded-2xl px-6 py-4 font-semibold">
                HACCP Compliant Facility
              </div>

              <div className="bg-white border border-[#F0DDE1] rounded-2xl px-6 py-4 font-semibold">
                HALAL Production Facility
              </div>

              <div className="bg-white border border-[#F0DDE1] rounded-2xl px-6 py-4 font-semibold">
                Food Grade Manufacturing
              </div>

              <div className="bg-white border border-[#F0DDE1] rounded-2xl px-6 py-4 font-semibold">
                Export Quality Standards
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-[#F0DDE1] p-10">
            <h3 className="text-2xl font-bold text-slate-950">
              Quality Commitment
            </h3>

            <ul className="mt-6 space-y-4 text-slate-600">
              <li>✓ Food Grade Himalayan Pink Salt</li>
              <li>✓ Export Documentation Support</li>
              <li>✓ Global Supply Capability</li>
              <li>✓ Private Label Manufacturing</li>
              <li>✓ Quality Checked Before Dispatch</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}