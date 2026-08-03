"use client";
import AdminShell from "@/components/admin/AdminShell";
import B2BModulePage from "@/components/admin/B2BModulePage";

export default function LeadsPage() {
  return <AdminShell><B2BModulePage moduleKey="leads" /></AdminShell>;
}
