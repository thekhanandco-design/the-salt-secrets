import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Products from "@/components/Products";
import PrivateLabel from "@/components/PrivateLabel";
import Certifications from "@/components/Certifications";
import ExportMarkets from "@/components/ExportMarkets";

export default function Home() {
  return (
    <main className="bg-white">
      <Hero />

      <Products />

      <WhyChooseUs />

      <PrivateLabel />

      <Certifications />

      <ExportMarkets />

    </main>
  );
}