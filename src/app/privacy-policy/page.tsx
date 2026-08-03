import type { Metadata } from "next";
import LegalPolicyPage from "@/components/LegalPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | The Salt Origin",
  description: "Privacy information for The Salt Origin website and business inquiries.",
};

export default function PrivacyPolicyPage() {
  return <LegalPolicyPage pageSlug="privacy-policy" fallbackTitle="Privacy Policy" />;
}
