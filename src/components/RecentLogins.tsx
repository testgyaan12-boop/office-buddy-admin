import { useEffect, useState } from 'react';
import { Activity, Clock, User as UserIcon } from 'lucide-react';
import { api } from '../api';

interface LoginUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  accessRole?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

const AVATAR_TONES = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-500',
];

function tone(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length];
}

function timeAgo(iso?: string): string {
  if (!iso) return 'Never';
  const ms = Date.now() - Date.parse(iso);
  if (ms < 0) return 'Just now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function RecentLogins() {
  const [users, setUsers] = useState<LoginUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats/recent-logins')
      .then((r) => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(15,31,61,0.06)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
            <Activity size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-ink dark:text-white">Recent Logins</h3>
            <p className="text-[11px] text-muted">Last {users.length} active users</p>
          </div>
        </div>
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
          {users.length}
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
              <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-3 w-36 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="h-3 w-12 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <UserIcon size={18} />
            </div>
            <p className="text-xs text-muted">No login activity yet</p>
          </div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.name} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tone(u.name)} text-xs font-bold text-white`}>
                  {(u.name || '?')[0]?.toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-ink dark:text-white">{u.name}</span>
                  {u.accessRole === 'admin' && (
                    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">ADMIN</span>
                  )}
                </div>
                <span className="block truncate text-[12px] text-muted">{u.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <Clock size={11} />
                {timeAgo(u.lastLoginAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
