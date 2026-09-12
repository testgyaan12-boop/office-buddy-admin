import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/companies', label: 'Companies', icon: '🏢' },
  { to: '/subscriptions', label: 'Subscription', icon: '💳' },
  { to: '/reminders', label: 'Reminders', icon: '⏰' },
  { to: '/custom-ads', label: 'Custom Ads', icon: '📣' },
  { to: '/config', label: 'Config', icon: '⚙️' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [confirmLogout, setConfirmLogout] = useState(false);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem('sidebar_collapsed', c ? '0' : '1');
      } catch {}
      return !c;
    });
  };

  const doLogout = () => {
    setConfirmLogout(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      <aside
        className={`${collapsed ? 'w-16' : 'w-60'} shrink-0 bg-slate-900 text-slate-200 flex flex-col transition-all duration-200 sticky top-0 h-screen`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
          {!collapsed && (
            <div className="text-xl font-bold text-white">
              OfficeBuddy <span className="text-xs font-normal text-violet-400">ADMIN</span>
            </div>
          )}
          <button
            onClick={toggle}
            title={collapsed ? 'Open sidebar' : 'Close sidebar'}
            className="rounded-lg p-1.5 text-lg text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {collapsed ? '☰' : '✕'}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              title={collapsed ? l.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-5'} py-2.5 text-sm hover:bg-slate-800 ${
                  isActive ? 'bg-slate-800 text-white border-l-4 border-violet-500' : 'border-l-4 border-transparent'
                }`
              }
            >
              <span className="text-lg">{l.icon}</span>
              {!collapsed && l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700 text-sm">
          {!collapsed && (
            <>
              <div className="truncate text-slate-300">{user?.name}</div>
              <div className="truncate text-xs text-slate-500">{user?.email}</div>
            </>
          )}
          <button
            onClick={() => setConfirmLogout(true)}
            title="Logout"
            className={`mt-2 w-full rounded-lg bg-slate-800 py-2 text-sm hover:bg-slate-700 ${collapsed ? 'px-0 text-lg' : ''}`}
          >
            {collapsed ? '⏻' : 'Logout'}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-x-auto">{children}</main>

      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmLogout(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl">👋</div>
            <h2 className="text-lg font-bold text-slate-900">Logout?</h2>
            <p className="mt-1 text-sm text-slate-500">
              Signed in as <b>{user?.email}</b>. You will need to log in again.
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={doLogout} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
