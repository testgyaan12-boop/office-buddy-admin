import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Moon, PanelLeft, Sun, UserRound } from 'lucide-react';
import { useTheme } from './Layout';
import { useAuth } from '../auth';
import { useAdminStats } from '../hooks/useAdminStats';

export default function TopHeader({
  onMenu,
  onToggleCollapse,
  onRequestLogout,
}: {
  onMenu: () => void;
  onToggleCollapse: () => void;
  onRequestLogout: () => void;
}) {
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const { stats } = useAdminStats();

  const alerts: { title: string; sub: string; tone: string }[] = [];
  if ((stats?.lockedAccounts ?? 0) > 0) {
    alerts.push({
      title: `${stats!.lockedAccounts} account${stats!.lockedAccounts === 1 ? '' : 's'} locked`,
      sub: 'Review in Users',
      tone: 'bg-red-100 text-red-600',
    });
  }
  if ((stats?.newUsers30d ?? 0) > 0) {
    alerts.push({
      title: `${stats!.newUsers30d} new users in 30 days`,
      sub: 'Welcome them aboard',
      tone: 'bg-green-100 text-green-600',
    });
  }
  if ((stats?.invoices ?? 0) > 0) {
    alerts.push({
      title: `${stats!.invoices} invoices issued`,
      sub: 'Check Subscription tab',
      tone: 'bg-violet-100 text-violet-600',
    });
  }
  if (alerts.length === 0) {
    alerts.push({ title: 'All clear', sub: 'No new activity', tone: 'bg-slate-100 text-slate-500' });
  }

  return (
    <header className="sticky top-0 z-20 flex h-[70px] items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
      <button onClick={onMenu} title="Open menu" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800">
        <Menu size={20} />
      </button>
      <button onClick={onToggleCollapse} title="Toggle sidebar" aria-label="Toggle sidebar" className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:block dark:text-slate-300 dark:hover:bg-slate-800">
        <PanelLeft size={20} />
      </button>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setBellOpen(!bellOpen);
              setProfileOpen(false);
            }}
            title="Notifications"
            className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Bell size={19} />
            {(stats?.lockedAccounts ?? 0) > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
          {bellOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-line px-4 py-3 text-sm font-bold text-ink dark:border-slate-700 dark:text-white">
                  Notifications
                </div>
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${a.tone.split(' ')[0]}`} />
                    <span>
                      <span className="block text-sm font-semibold text-ink dark:text-slate-100">{a.title}</span>
                      <span className="block text-xs text-muted">{a.sub}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <span className="mx-1 hidden h-8 w-px bg-line sm:block dark:bg-slate-700" />
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setBellOpen(false);
            }}
            className="flex items-center gap-2.5 rounded-xl p-1.5 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white">
              {((user?.name || user?.email) || 'A')[0].toUpperCase()}
            </span>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-sm font-semibold text-ink dark:text-white">{user?.name || 'Administrator'}</span>
              <span className="block text-xs text-muted">Administrator</span>
            </span>
            <ChevronDown size={15} className="hidden text-slate-400 md:block" />
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate('/profile');
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <UserRound size={16} /> My Profile
                </button>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    onRequestLogout();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
