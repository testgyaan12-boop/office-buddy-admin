import { CalendarDays } from 'lucide-react';

export default function DashboardHeader({ userName, loadedAt }: { userName?: string; loadedAt: Date | null }) {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = (loadedAt || new Date()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink dark:text-white">
          Welcome back, {userName || 'Administrator'} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s happening with your OfficeBuddy application today.</p>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-2.5 shadow-[0_1px_3px_rgba(15,31,61,0.06)] dark:border-slate-800 dark:bg-slate-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-600">
          <CalendarDays size={18} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold text-ink dark:text-white">{date}</span>
          <span className="block text-xs text-muted">Last updated • {time}</span>
        </span>
      </div>
    </div>
  );
}
