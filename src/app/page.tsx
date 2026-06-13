import Hero from "@/components/Hero";
import PrivateLabel from "@/components/PrivateLabel";
import Products from "@/components/Products";
import WhyChooseUs from "@/components/WhyChooseUs";
import Certifications from "@/components/Certifications";
import ExportMarkets from "@/components/ExportMarkets";

export default function Home() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <Hero />

      {/* PRIVATE LABEL - IMMEDIATELY AFTER HERO */}
      <PrivateLabel />

      {/* PRODUCTS */}
      <Products />

      {/* WHY CHOOSE US */}
      <WhyChooseUs />

      {/* CERTIFICATIONS */}
      <Certifications />

      {/* EXPORT MARKETS */}
      <ExportMarkets />
    </main>
  );
}