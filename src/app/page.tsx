import Hero from "@/components/Hero";
import WhyChooseUs from "@/components/WhyChooseUs";
import Products from "@/components/Products";
import PrivateLabel from "@/components/PrivateLabel";
import ExportMarkets from "@/components/ExportMarkets";
import ContactCTA from "@/components/ContactCTA";

export default function Home() {
  return (
    <main className="bg-white">
      <Hero />

      <WhyChooseUs />

      <Products />

      <PrivateLabel />

      <ExportMarkets />

      <ContactCTA />
    </main>
  );
}