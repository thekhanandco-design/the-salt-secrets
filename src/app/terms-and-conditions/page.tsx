import type { Metadata } from "next";
import LegalPolicyPage from "@/components/LegalPolicyPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | The Salt Origin",
  description: "Website and business terms for The Salt Origin.",
};

export default function TermsAndConditionsPage() {
  return <LegalPolicyPage pageSlug="terms-and-conditions" fallbackTitle="Terms & Conditions" />;
}
