import Image from "next/image";

const certifications = [
  "/cert-haccp.png",
  "/cert-halal.png",
  "/cert-fda.png",
  "/cert-iso.png",
  "/cert-gmp.png",
  "/cert-food.png",
];

export default function Certifications() {
  return (
    <section className="py-16 lg:py-20 bg-[#FFF8F5]">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

        {/* HEADER */}
        <div className="text-center mb-12">

          <span className="uppercase tracking-[7px] text-[#C23B4A] font-black text-lg">
            Certified Manufacturing
          </span>

          {/* SMLHDNG */}
          <h2 className="text-3xl lg:text-5xl font-black mt-3 text-[#07142B]">
            Certified Facility Standards
          </h2>

          <p className="max-w-3xl mx-auto text-slate-600 mt-4 text-base lg:text-lg">
            Manufactured and packed in compliance with recognized food
            safety, quality assurance and export standards for
            international markets.
          </p>

        </div>

        {/* CERTIFICATE LOGOS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">

          {certifications.map((cert, index) => (
            <div
              key={index}
              className="bg-white border border-[#EFE3E5] rounded-[24px] h-[150px] flex items-center justify-center p-6 hover:shadow-[0_12px_35px_rgba(194,59,74,0.08)] transition-all duration-300"
            >
              <Image
                src={cert}
                alt="Certification"
                width={120}
                height={120}
                className="max-w-full max-h-[80px] object-contain"
              />
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}