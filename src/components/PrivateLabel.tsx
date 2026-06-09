import Image from "next/image";

export default function PrivateLabel() {
  return (
    <section
      id="private-label"
      className="max-w-7xl mx-auto px-6 py-24"
    >
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <Image
            src="/product-2.png"
            alt="Private Label"
            width={700}
            height={700}
            className="rounded-[30px]"
          />
        </div>

        <div>
          <span className="uppercase tracking-[5px] text-[#C98A92] font-semibold">
            Private Label
          </span>

          <h2 className="text-5xl font-bold mt-4 mb-6">
            Build Your Own Salt Brand
          </h2>

          <p className="text-lg text-slate-600 leading-relaxed">
            We help importers, distributors and retailers launch their own
            Himalayan Pink Salt brands with custom packaging, labeling and
            export-ready solutions.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 border rounded-2xl">Custom Labels</div>
            <div className="p-4 border rounded-2xl">Retail Packaging</div>
            <div className="p-4 border rounded-2xl">Bulk Export</div>
            <div className="p-4 border rounded-2xl">Private Branding</div>
          </div>
        </div>
      </div>
    </section>
  );
}