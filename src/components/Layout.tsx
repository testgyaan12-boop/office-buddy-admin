import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

interface ThemeCtx {
  dark: boolean;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ dark: false, toggle: () => {} });

export const useTheme = () => useContext(Ctx);

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {}
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem('sidebar_collapsed', c ? '0' : '1');
      } catch {}
      return !c;
    });
  }, []);

  const doLogout = () => {
    setConfirmLogout(false);
    logout();
    navigate('/login');
  };

  return (
    <Ctx.Provider value={{ dark, toggle }}>
      <div className="min-h-screen bg-canvas dark:bg-slate-950">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          userName={user?.name}
          userEmail={user?.email}
          onLogout={() => setConfirmLogout(true)}
        />
        <div className={`transition-all duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[280px]'}`}>
          <TopHeader
            onMenu={() => setMobileOpen(true)}
            onToggleCollapse={toggleCollapse}
            onRequestLogout={() => setConfirmLogout(true)}
          />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>

        {confirmLogout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmLogout(false)}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl">👋</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Logout?</h2>
              <p className="mt-1 text-sm text-slate-500">
                Signed in as <b>{user?.email}</b>. You will need to log in again.
              </p>
              <div className="mt-5 flex gap-2">
                <button onClick={() => setConfirmLogout(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button onClick={doLogout} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
