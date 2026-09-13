import { NavLink } from 'react-router-dom';
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  Timer,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';

interface Link {
  to: string;
  label: string;
  icon: LucideIcon;
}

const links: Link[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/subscriptions', label: 'Subscription', icon: CreditCard },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/reminders', label: 'Reminders', icon: Timer },
  { to: '/config', label: 'Config', icon: Settings },
  { to: '/profile', label: 'My Profile', icon: UserRound },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  userName,
  userEmail,
  onLogout,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}) {
  const initial = ((userName || userEmail) || 'A')[0].toUpperCase();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onCloseMobile} aria-hidden />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-navy-900 text-slate-300 transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-[280px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        aria-label="Admin sidebar"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            OB
          </span>
          {!collapsed && (
            <span className="leading-tight">
              <span className="block text-[17px] font-bold text-white">OfficeBuddy</span>
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-violet-400">ADMIN</span>
            </span>
          )}
          <button
            onClick={onCloseMobile}
            title="Close sidebar"
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              title={collapsed ? l.label : undefined}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <l.icon size={19} strokeWidth={2} />
              {!collapsed && l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white">
              {initial}
            </span>
            {!collapsed && (
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-sm font-semibold text-white">{userName || 'Administrator'}</span>
                <span className="block truncate text-xs text-slate-400">{userEmail || 'admin@officebuddy.app'}</span>
              </span>
            )}
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] bg-white/5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white ${
              collapsed ? 'px-0' : ''
            }`}
          >
            <LogOut size={17} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>
    </>
  );
}
