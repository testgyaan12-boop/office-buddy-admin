export default function MiniStatCard({ label, value, growth }: { label: string; value: string; growth: string }) {
  return (
    <div className="rounded-xl border border-line bg-canvas px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="text-lg font-extrabold text-ink dark:text-white">{value}</span>
        <span className="text-[11px] font-bold text-green-600 dark:text-green-400">{growth}</span>
      </div>
    </div>
  );
}
