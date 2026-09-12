import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlarmClock, Bell, CalendarClock, CalendarDays, CheckSquare, FileText, RefreshCw, Target } from 'lucide-react';
import CrudPage from '../components/CrudPage';
import StatCard, { StatSkeleton } from '../components/StatCard';
import { api } from '../api';
import { goalsRes, notesRes, remindersRes, tasksRes } from '../resources';

type Tab = 'reminders' | 'goals' | 'tasks' | 'notes';

const tabs: { key: Tab; label: string; icon: typeof Bell }[] = [
  { key: 'reminders', label: 'My Reminder', icon: Bell },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'tasks', label: 'Task', icon: CheckSquare },
  { key: 'notes', label: 'Notes', icon: FileText },
];

interface Summary {
  total: number;
  today: number;
  upcoming: number;
  loading: boolean;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Reminders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab: Tab = raw === 'goals' || raw === 'tasks' || raw === 'notes' ? raw : 'reminders';
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState<Summary>({ total: 0, today: 0, upcoming: 0, loading: true });

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  const loadSummary = useCallback(async () => {
    setSummary((s) => ({ ...s, loading: true }));
    try {
      const r = await api.get('/admin/reminders', { params: { page: 0, size: 1000 } });
      const list = ((r.data?.content || []) as { remindAt?: string }[]);
      const today = dayKey(new Date());
      let todayCount = 0;
      let upcomingCount = 0;
      for (const item of list) {
        const day = typeof item.remindAt === 'string' ? item.remindAt.slice(0, 10) : '';
        if (!day) continue;
        if (day === today) todayCount++;
        else if (day > today) upcomingCount++;
      }
      setSummary({
        total: r.data?.totalElements ?? list.length,
        today: todayCount,
        upcoming: upcomingCount,
        loading: false,
      });
    } catch {
      setSummary((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, refreshKey]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
            <AlarmClock size={22} />
          </span>
          <span>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink dark:text-white">Reminders</h1>
            <p className="text-[13px] text-muted">Stay organized and never miss an important task.</p>
          </span>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          title="Refresh"
          aria-label="Refresh reminders"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-sm transition hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        {summary.loading ? (
          Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Reminders"
              value={String(summary.total)}
              description="All reminders"
              icon={Bell}
              pastel="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300"
            />
            <StatCard
              label="Today"
              value={String(summary.today)}
              description="Due today"
              icon={CalendarDays}
              pastel="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
            />
            <StatCard
              label="Upcoming"
              value={String(summary.upcoming)}
              description="Scheduled ahead"
              icon={CalendarClock}
              pastel="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
            />
          </>
        )}
      </div>

      <div className="mb-2 inline-flex max-w-full overflow-x-auto rounded-xl bg-white p-1 shadow-sm border border-line dark:bg-slate-900 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-[10px] px-4 sm:px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              tab === t.key
                ? 'bg-gradient-to-r from-brand-600 to-brand-purple text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reminders' ? (
        <CrudPage key={`reminders-${refreshKey}`} resource={remindersRes} />
      ) : tab === 'goals' ? (
        <CrudPage key={`goals-${refreshKey}`} resource={goalsRes} />
      ) : tab === 'tasks' ? (
        <CrudPage key={`tasks-${refreshKey}`} resource={tasksRes} />
      ) : (
        <CrudPage key={`notes-${refreshKey}`} resource={notesRes} />
      )}
    </div>
  );
}
