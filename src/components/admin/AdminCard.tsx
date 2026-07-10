export function AdminCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="rounded-[24px] border border-[#EFE3E5] bg-white p-6 shadow-[0_12px_30px_rgba(194,59,74,0.05)]">
      <p className="text-sm text-slate-500 font-semibold">{title}</p>
      <h2 className="mt-2 text-4xl font-black text-[#081325]">{value}</h2>
      {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
