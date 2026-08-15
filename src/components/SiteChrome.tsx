"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PublicSectionLayoutController from "@/components/PublicSectionLayoutController";
import PublicCmsRuntimeController from "@/components/PublicCmsRuntimeController";
import CustomCmsSectionsRenderer from "@/components/CustomCmsSectionsRenderer";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <div className="site-shell">
      <Navbar />
      <PublicSectionLayoutController />
      <PublicCmsRuntimeController />
      {children}
      <CustomCmsSectionsRenderer />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
