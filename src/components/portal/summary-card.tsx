type SummaryCardProps = {
  detail: string;
  label: string;
  value: number;
};

export function SummaryCard({ detail, label, value }: SummaryCardProps) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 shadow-[0_12px_35px_rgba(26,26,26,0.04)] sm:p-6">
      <p className="text-sm font-bold text-black/55">{label}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-black/50">{detail}</p>
    </section>
  );
}
