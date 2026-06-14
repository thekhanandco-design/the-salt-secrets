import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Box,
  CheckCircle2,
  Clock3,
  Factory,
  Globe,
  Leaf,
  MessageCircle,
  Package,
  PencilRuler,
  ShieldCheck,
  Tag,
  TrendingUp,
  Truck,
} from "lucide-react";

const packagingOptions = [
  { image: "/pet-bottles.png", title: "PET BOTTLES", sizes: "100g, 200g, 250g, 500g, 1kg, 2kg" },
  { image: "/pet-jars.png", title: "PET JARS", sizes: "250g, 500g, 1kg, 2kg, 3kg, 5kg" },
  { image: "/grinder-bottles1.png", title: "GRINDER BOTTLES", sizes: "100g, 200g, 250g, 400g" },
  { image: "/ceramic-grinders.png", title: "CERAMIC GRINDERS", sizes: "150g, 250g, 400g" },
  { image: "/shaker-bottles.png", title: "SHAKER BOTTLES", sizes: "100g, 200g, 250g, 500g" },
  { image: "/standup-pouch.png", title: "STAND-UP POUCHES", sizes: "250g, 500g, 1kg, 2kg, 5kg" },
];

const receiveItemsLeft = [
  "Private Label Manufacturing",
  "Custom Label Design",
  "Custom Packaging",
  "Export Documentation",
];

const receiveItemsRight = [
  "Quality Control",
  "Worldwide Delivery",
  "Dedicated Account Support",
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="hidden sm:block w-14 h-[2px] bg-[#D9909A]" />
      <h2
        className="text-center text-[#081325] font-black uppercase leading-tight"
        style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.8rem,2.8vw,3rem)" }}
      >
        {children}
      </h2>
      <span className="hidden sm:block w-14 h-[2px] bg-[#D9909A]" />
    </div>
  );
}

function WhyCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white border border-[#F1D9DD] rounded-[22px] p-7 text-center shadow-[0_15px_35px_rgba(194,59,74,0.06)]">
      <div className="w-20 h-20 mx-auto rounded-full bg-[#FFF0F2] flex items-center justify-center">{icon}</div>
      <h3 className="font-black text-[#081325] text-base mt-5 uppercase leading-tight">{title}</h3>
      <p className="text-slate-600 text-sm mt-4 leading-relaxed">{text}</p>
    </div>
  );
}

function CustomizeCard({ image, title, text }: { image: string; title: string; text: string }) {
  return (
    <div className="bg-white border border-[#F1C8CF] rounded-[14px] overflow-hidden">
      <div className="h-[270px] flex items-center justify-center bg-[#FFF8F5] p-5">
        <Image src={image} alt={title} width={520} height={360} className="max-h-[245px] w-auto object-contain" />
      </div>
      <div className="border-t border-[#F1C8CF] p-6 text-center">
        <h3 className="font-black text-[#081325] uppercase">{title}</h3>
        <p className="text-slate-600 mt-3 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function ProcessStep({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="relative text-center">
      <div className="relative mx-auto w-24 h-24 rounded-full border-2 border-[#C23B4A] bg-white flex items-center justify-center">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#C23B4A] text-white text-sm font-black flex items-center justify-center">
          {number}
        </span>
        {icon}
      </div>
      <h3 className="font-black text-[#081325] text-sm uppercase mt-6">{title}</h3>
      <p className="text-slate-600 text-sm mt-3 max-w-[180px] mx-auto leading-relaxed">{text}</p>
    </div>
  );
}

export default function PrivateLabelPage() {
  return (
    <main className="bg-white text-[#081325]">
      <section className="bg-gradient-to-b from-[#FFF0F2] via-[#FFF7F8] to-white">
        <div className="max-w-[1400px] mx-auto px-6 pt-20 pb-10 text-center">
          <div className="flex items-center justify-center gap-4">
            <span className="hidden sm:block w-16 h-[2px] bg-[#D9909A]" />
            <span className="uppercase tracking-[6px] text-[#C23B4A] font-black text-lg lg:text-xl">Private Label Manufacturer</span>
            <span className="hidden sm:block w-16 h-[2px] bg-[#D9909A]" />
          </div>

          <h1
            className="mt-6 text-[#081325] font-black leading-[0.95]"
            style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2.4rem,4.2vw,4.8rem)" }}
          >
            Launch Your Own
            <br />
            Himalayan Pink Salt Brand
          </h1>

          <p className="max-w-3xl mx-auto text-slate-600 text-lg mt-7 leading-relaxed">
            From custom labels and packaging to complete private label manufacturing, we help brands create retail-ready
            Himalayan Pink Salt products for global markets.
          </p>

          <div className="flex flex-wrap justify-center gap-5 mt-9">
            <Link href="/contact" className="inline-flex items-center justify-center gap-3 bg-[#C23B4A] text-white px-8 py-4 rounded-md font-black uppercase text-sm hover:opacity-90 transition">
              <Package className="w-5 h-5" />
              Request Private Label Quote
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-3 bg-white border-2 border-[#C23B4A] text-[#C23B4A] px-8 py-4 rounded-md font-black uppercase text-sm hover:bg-[#FFF4F5] transition">
              <Tag className="w-5 h-5" />
              Download Catalog
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mt-14">
            <div className="flex items-center justify-center gap-3 text-sm font-black uppercase">
              <Leaf className="w-8 h-8 text-[#C23B4A]" />
              100% Natural
            </div>
            <div className="flex items-center justify-center gap-3 text-sm font-black uppercase">
              <Award className="w-8 h-8 text-[#C23B4A]" />
              Premium Quality
            </div>
            <div className="flex items-center justify-center gap-3 text-sm font-black uppercase">
              <Tag className="w-8 h-8 text-[#C23B4A]" />
              Custom Branding
            </div>
            <div className="flex items-center justify-center gap-3 text-sm font-black uppercase">
              <Globe className="w-8 h-8 text-[#C23B4A]" />
              Global Shipping
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 py-12">
        <SectionTitle>Why Private Label?</SectionTitle>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-7 mt-10">
          <WhyCard icon={<TrendingUp className="w-12 h-12 text-[#C23B4A]" />} title="Higher Profit Margins" text="Sell under your own brand and maximize your profits." />
          <WhyCard icon={<ShieldCheck className="w-12 h-12 text-[#C23B4A]" />} title="Brand Ownership" text="Build long-term brand value and customer loyalty." />
          <WhyCard icon={<Package className="w-12 h-12 text-[#C23B4A]" />} title="Custom Packaging" text="Unique packaging that represents your brand identity." />
          <WhyCard icon={<Globe className="w-12 h-12 text-[#C23B4A]" />} title="Global Market Reach" text="Retail and wholesale ready for international markets." />
        </div>
      </section>

      <section className="max-w-[1300px] mx-auto px-6 py-8">
        <SectionTitle>What We Customize</SectionTitle>
        <div className="grid lg:grid-cols-3 gap-7 mt-10">
          <CustomizeCard image="/custom-logo-design.png" title="Logo Design" text="Create a unique logo that represents your brand." />
          <CustomizeCard image="/custom-labels.png" title="Product Labels" text="Custom labels with your brand name, design, and details." />
          <CustomizeCard image="/custom-packaging.png" title="Packaging Design" text="Custom packaging that stands out on the shelves." />
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 py-10">
        <SectionTitle>Packaging Options</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5 mt-10">
          {packagingOptions.map((item) => (
            <div key={item.title} className="bg-white border border-[#F1C8CF] rounded-[12px] p-4 text-center">
              <div className="h-[180px] flex items-center justify-center">
                <Image src={item.image} alt={item.title} width={260} height={260} className="max-h-[165px] w-auto object-contain" />
              </div>
              <h3 className="font-black text-[#081325] text-sm uppercase mt-3">{item.title}</h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">{item.sizes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#FFF0F2] py-14">
        <Image src="/mountains-bg.png" alt="" width={900} height={400} className="absolute left-0 bottom-0 w-[360px] lg:w-[520px] opacity-20" />
        <Image src="/mountains-bg.png" alt="" width={900} height={400} className="absolute right-0 bottom-0 w-[360px] lg:w-[520px] opacity-20 scale-x-[-1]" />
        <div className="relative z-10 max-w-[1300px] mx-auto px-6">
          <SectionTitle>Our Private Label Process</SectionTitle>
          <div className="grid md:grid-cols-4 gap-9 mt-12">
            <ProcessStep number="01" icon={<MessageCircle className="w-10 h-10 text-[#C23B4A]" />} title="Consultation" text="Share your requirements and ideas with our team." />
            <ProcessStep number="02" icon={<PencilRuler className="w-10 h-10 text-[#C23B4A]" />} title="Design Approval" text="We create designs and send for your approval." />
            <ProcessStep number="03" icon={<Factory className="w-10 h-10 text-[#C23B4A]" />} title="Production" text="High-quality manufacturing with strict quality control." />
            <ProcessStep number="04" icon={<Truck className="w-10 h-10 text-[#C23B4A]" />} title="Worldwide Delivery" text="Safe packaging and on-time delivery to your destination." />
          </div>
        </div>
      </section>

      <section className="max-w-[1300px] mx-auto px-6 py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="font-black text-[#081325] mb-8" style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2rem,3vw,3rem)" }}>
              MOQ & LEAD TIME
            </h2>
            <div className="grid sm:grid-cols-2 gap-5 max-w-[520px]">
              <div className="bg-white border border-[#F1D9DD] rounded-[18px] p-7 text-center shadow-sm">
                <Box className="w-10 h-10 text-[#C23B4A] mx-auto" />
                <p className="font-black uppercase text-sm mt-3">MOQ</p>
                <div className="font-black text-[#C23B4A] mt-2" style={{ fontFamily: "Georgia, serif", fontSize: "3.2rem" }}>6000</div>
                <p className="font-black">PCS</p>
                <p className="text-slate-600 text-sm mt-2">Minimum order quantity for private label.</p>
              </div>
              <div className="bg-white border border-[#F1D9DD] rounded-[18px] p-7 text-center shadow-sm">
                <Clock3 className="w-10 h-10 text-[#C23B4A] mx-auto" />
                <p className="font-black uppercase text-sm mt-3">Lead Time</p>
                <div className="font-black text-[#C23B4A] mt-2" style={{ fontFamily: "Georgia, serif", fontSize: "3.2rem" }}>45-60</div>
                <p className="font-black">DAYS</p>
                <p className="text-slate-600 text-sm mt-2">Production time after design approval.</p>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle>What You Receive</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <div className="space-y-4">
                {receiveItemsLeft.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#C23B4A]" />
                    <span className="font-semibold">{item}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {receiveItemsRight.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#C23B4A]" />
                    <span className="font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#B51F32] text-white">
        <Image src="/mountains-bg.png" alt="" width={1000} height={400} className="absolute inset-x-0 bottom-0 mx-auto w-full max-h-[230px] object-cover opacity-15" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-[260px_1fr_260px] gap-8 items-center">
            <div className="hidden lg:flex justify-center">
              <Image src="/pet-bottles.png" alt="Private Label Bottles" width={300} height={260} className="max-h-[190px] w-auto object-contain" />
            </div>
            <div className="text-center">
              <h2 className="font-black leading-tight" style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2rem,4vw,3.4rem)" }}>
                Ready To Launch Your Own Salt Brand?
              </h2>
              <p className="text-white/90 text-lg mt-4">Partner with a trusted Himalayan Pink Salt manufacturer for your private label requirements.</p>
              <div className="flex flex-wrap justify-center gap-5 mt-8">
                <Link href="/contact" className="bg-white text-[#B51F32] px-8 py-4 rounded-md font-black uppercase text-sm inline-flex items-center gap-3">
                  Get Free Quote
                  <span className="text-xl">→</span>
                </Link>
                <Link href="https://wa.me/923462771693" target="_blank" className="border border-white px-8 py-4 rounded-md font-black uppercase text-sm inline-flex items-center gap-3">
                  WhatsApp Us
                  <MessageCircle className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <Image src="/standup-pouch.png" alt="Private Label Pouch" width={300} height={260} className="max-h-[190px] w-auto object-contain" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
