import Hero from "@/components/Hero";
import PrivateLabel from "@/components/PrivateLabel";
import Products from "@/components/Products";
import WhyChooseUs from "@/components/WhyChooseUs";
import Certifications from "@/components/Certifications";
import ExportMarkets from "@/components/ExportMarkets";

export default function Home() {
  return (
    <main className="bg-white">
      <Hero />

      <PrivateLabel />

      <Products />

      <WhyChooseUs />

      <Certifications />

      <ExportMarkets />
    </main>
  );
}