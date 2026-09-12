export default function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

export function fmtBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function fmtINR(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}
