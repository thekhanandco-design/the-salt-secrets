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
    <section className="py-16 bg-[#FFF8F5]">
      <div className="max-w-[1700px] mx-auto px-6 lg:px-16">

        {/* HEADING */}
        <div className="text-center mb-12">
          <h2
            className="font-black text-[#07142B]"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(2rem,3vw,3.3rem)",
            }}
          >
            QUALITY STANDARDS
          </h2>

          <div className="w-16 h-[3px] bg-[#C23B4A] mx-auto mt-3" />

          <p className="max-w-3xl mx-auto text-slate-600 mt-5">
            Manufactured according to internationally recognized food safety
            and quality standards for global export markets.
          </p>
        </div>

        {/* CERTIFICATIONS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">

          {certifications.map((cert, index) => (
            <div
              key={index}
              className={`flex flex-col items-center justify-center py-6 px-4 ${
                index !== certifications.length - 1
                  ? "lg:border-r border-[#EFD6DA]"
                  : ""
              }`}
            >
              <div className="w-28 h-28 rounded-full bg-white border border-[#F1D9DD] flex items-center justify-center shadow-sm">
                <Image
                  src={cert}
                  alt="Certification"
                  width={90}
                  height={90}
                  className="max-w-[70px] max-h-[70px] object-contain"
                />
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}