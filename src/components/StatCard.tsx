import type { LucideIcon } from 'lucide-react';

export function fmtBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function fmtINR(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function StatCard({
  label,
  value,
  description,
  icon: Icon,
  pastel,
  growth = '+0%',
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  pastel: string;
  growth?: string;
}) {
  return (
    <div className="group relative flex min-h-[148px] flex-col overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(15,31,61,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,31,61,0.10)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${pastel}`}>
          <Icon size={20} strokeWidth={2.1} />
        </span>
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-600 dark:bg-green-950 dark:text-green-400">
          {growth}
        </span>
      </div>
      <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-0.5 text-[26px] font-extrabold leading-tight text-ink dark:text-white">{value}</div>
      <div className="mt-0.5 truncate text-xs text-muted">{description}</div>
      <Icon
        size={72}
        strokeWidth={1.2}
        className="pointer-events-none absolute -bottom-3 -right-3 text-slate-100 transition-transform duration-200 group-hover:scale-110 dark:text-slate-800"
      />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="min-h-[148px] rounded-2xl border border-line bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="skeleton h-11 w-11 rounded-xl" />
      <div className="skeleton mt-3 h-3 w-20 rounded" />
      <div className="skeleton mt-2 h-7 w-24 rounded" />
      <div className="skeleton mt-2 h-3 w-32 rounded" />
    </div>
  );
}
