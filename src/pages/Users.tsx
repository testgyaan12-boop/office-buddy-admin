import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  Calendar,
  Crown,
  Droplet,
  Eye,
  Lock,
  LockOpen,

  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  Users as UsersIcon,
  VenusAndMars,
  X,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { api, errMsg, type Page } from '../api';
import { DateRangeButton, ExpandSearch } from '../components/filterControls';
import { useAdminStats } from '../hooks/useAdminStats';

interface UserRow {
  id: string;
  name: string;
  email: string;
  accessRole?: string;
  isActive?: number;
  isDeleted?: number;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  currentCompany?: string;
  role?: string;
  avatarUrl?: string;
  failedLoginAttempts?: number;
  accountLockedUntil?: string;
}

function isLocked(u: UserRow): boolean {
  if (!u.accountLockedUntil) return false;
  return new Date(u.accountLockedUntil).getTime() > Date.now();
}

function Avatar({ name, email, avatarUrl, size = 'h-10 w-10 text-base', onZoom }: { name?: string; email?: string; avatarUrl?: string; size?: string; onZoom?: () => void }) {
  const [failed, setFailed] = useState(false);
  if (avatarUrl && !failed) {
    const img = (
      <img
        src={avatarUrl}
        alt={name || email || 'avatar'}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    );
    if (!onZoom) {
      return <span className={`${size} block shrink-0 overflow-hidden rounded-full ring-2 ring-violet-100`}>{img}</span>;
    }
    return (
      <button
        onClick={onZoom}
        title="View photo"
        aria-label="View photo"
        className={`${size} shrink-0 overflow-hidden rounded-full ring-2 ring-violet-100 transition hover:ring-4 hover:ring-violet-300`}
      >
        {img}
      </button>
    );
  }
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 font-bold text-white`}>
      {(name || email || '?')[0].toUpperCase()}
    </div>
  );
}

interface FullUser extends UserRow {
  avatarUrl?: string;
  headline?: string;
  role?: string;
  domain?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  currentCompany?: string;
  salary?: string;
  expectedSalary?: string;
  skills?: string;
  address?: string;
  bloodGroup?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  uanNumber?: string;
  pfNumber?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  emergencyContact?: string;
}

interface UserDetail {
  plan: string;
  storage: string;
  companies: number;
  documents: number;
  reminders: number;
  invoices: number;
}

function val(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-slate-300 dark:text-slate-600">{children}</span>;
}

function Toggle({ on, onChange, title, tone = 'blue' }: { on: boolean; onChange: () => void; title?: string; tone?: 'blue' | 'red' }) {
  const onColor = tone === 'red' ? 'bg-red-500' : 'bg-brand-600';
  return (
    <button
      onClick={onChange}
      title={title}
      aria-label={title || 'Toggle'}
      aria-checked={on}
      role="switch"
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${on ? onColor : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

function IconBtn({
  onClick,
  title,
  className,
  children,
}: {
  onClick: () => void;
  title: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:shadow ${className}`}
    >
      {children}
    </button>
  );
}

export default function Users() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState(() => searchParams.get('q') || '');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);
  const [full, setFull] = useState<FullUser | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lockUser, setLockUser] = useState<UserRow | null>(null);
  const [lockHours, setLockHours] = useState('12');
  const [locking, setLocking] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', accessRole: 'admin' });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [showAddPass, setShowAddPass] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);
  const [confirmBox, setConfirmBox] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    busyLabel?: string;
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const size = 20;

  const load = useCallback(async () => {
    try {
      const r = await api.get('/admin/users', {
        params: { page, size, q: q || undefined, from: from || undefined, to: to || undefined },
      });
      const p = r.data as Page<UserRow>;
      setRows(p.content);
      setTotal(p.totalElements);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [page, q, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const openView = async (u: UserRow) => {
    setViewId(u.id);
    setFull(null);
    setDetail(null);
    setDetailLoading(true);
    try {
      const userRes = await api.get(`/admin/users/${u.id}`);
      setFull(userRes.data as FullUser);
    } catch (e) {
      alert(errMsg(e));
      setViewId(null);
      setDetailLoading(false);
      return;
    }
    const settled = await Promise.allSettled([
      api.get('/admin/documents', { params: { userId: u.id, page: 0, size: 1 } }),
      api.get('/admin/companies', { params: { userId: u.id, page: 0, size: 1 } }),
      api.get('/admin/reminders', { params: { userId: u.id, page: 0, size: 1 } }),
      api.get('/admin/invoices', { params: { userId: u.id, page: 0, size: 1 } }),
      api.get('/admin/subscriptions', { params: { userId: u.id, page: 0, size: 5 } }),
    ]);
    const val = (s: PromiseSettledResult<{ data?: unknown }>) =>
      s.status === 'fulfilled' ? (s.value.data as { content?: unknown[]; totalElements?: number } | undefined) : undefined;
    const [docs, companies, reminders, invoices, subs] = settled.map(val);
    const subList = (subs?.content || []) as { planCode?: string; planName?: string; status?: string; storageLimitBytes?: number }[];
    const active = subList.find((s) => s.status === 'ACTIVE') || subList[0];
    const bytes = active?.storageLimitBytes || 0;
    setDetail({
      plan: active ? `${active.planName || active.planCode} (${active.status})` : 'Free (no subscription)',
      storage: bytes >= 1024 * 1024 * 1024 ? `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB` : `${(bytes / 1024 / 1024).toFixed(0)} MB`,
      companies: companies?.totalElements ?? 0,
      documents: docs?.totalElements ?? 0,
      reminders: reminders?.totalElements ?? 0,
      invoices: invoices?.totalElements ?? 0,
    });
    setDetailLoading(false);
  };

  const refreshView = async (id: string) => {
    try {
      const r = await api.get(`/admin/users/${id}`);
      setFull(r.data as FullUser);
      load();
    } catch (e) {
      alert(errMsg(e));
    }
  };

  const runConfirm = async () => {
    if (!confirmBox) return;
    setConfirming(true);
    try {
      await confirmBox.onConfirm();
      setConfirmBox(null);
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setConfirming(false);
    }
  };

  const askRoleChange = (u: FullUser, role: string) => {
    if ((u.accessRole || 'member') === role) return;
    setConfirmBox({
      title: 'Change role?',
      message: `${u.name} (${u.email}) will become ${role}.`,
      confirmLabel: 'Yes, Change',
      onConfirm: async () => {
        await api.put(`/admin/users/${u.id}`, { accessRole: role });
        refreshView(u.id);
      },
    });
  };

  const askToggleActive = (u: FullUser) => {
    const next = (u.isActive ?? 1) === 1 ? 0 : 1;
    setConfirmBox({
      title: next === 1 ? 'Activate user?' : 'Deactivate user?',
      message:
        next === 1
          ? `${u.name} (${u.email}) will be able to log in again.`
          : `${u.name} (${u.email}) will be blocked from logging in.`,
      confirmLabel: next === 1 ? 'Yes, Activate' : 'Yes, Deactivate',
      danger: next === 0,
      onConfirm: async () => {
        await api.put(`/admin/users/${u.id}`, { isActive: next });
        refreshView(u.id);
      },
    });
  };

  const askRowToggleActive = (u: UserRow) => {
    askToggleActive(u as FullUser);
  };

  const confirmLockToggle = async () => {
    if (!lockUser) return;
    setLocking(true);
    try {
      if (isLocked(lockUser)) {
        await api.put(`/admin/users/${lockUser.id}`, { accountLockedUntil: null, failedLoginAttempts: 0 });
      } else {
        const hours = parseInt(lockHours, 10) || 12;
        const until = new Date(Date.now() + hours * 3600 * 1000).toISOString().slice(0, 19);
        await api.put(`/admin/users/${lockUser.id}`, { accountLockedUntil: until });
      }
      setLockUser(null);
      load();
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setLocking(false);
    }
  };

  const confirmAdd = async () => {
    const errs: Record<string, string> = {};
    if (!addForm.name.trim()) errs.name = 'Name is required';
    if (!addForm.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(addForm.email.trim())) errs.email = 'Enter a valid email address';
    if (!addForm.password) errs.password = 'Password is required';
    else if (addForm.password.length < 8) errs.password = 'Password must be at least 8 characters';
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setAdding(true);
    try {
      await api.post('/admin/users', addForm);
      setShowAdd(false);
      setAddForm({ name: '', email: '', password: '', accessRole: 'admin' });
      load();
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteUser.id}`);
      setDeleteUser(null);
      if (viewId === deleteUser.id) setViewId(null);
      load();
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <UsersIcon size={22} />
          </span>
          <span>
            <h1 className="text-[22px] font-extrabold tracking-tight text-ink dark:text-white">Users</h1>
            <p className="text-[13px] text-muted">{total} total • click 👁 for full details</p>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAddForm({ name: '', email: '', password: '', accessRole: 'admin' });
              setAddErrors({});
              setShowAddPass(false);
              setShowAdd(true);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-purple px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)]"
          >
            <Plus size={16} strokeWidth={2.5} /> Add Admin
          </button>
          <ExpandSearch
            value={q}
            placeholder="Search name or email…"
            onChange={(v) => {
              setPage(0);
              setQ(v);
            }}
          />
          <DateRangeButton
            from={from}
            to={to}
            onApply={(f, t) => {
              setPage(0);
              setFrom(f);
              setTo(t);
            }}
          />
          <button
            onClick={() => load()}
            title="Refresh list"
            aria-label="Refresh list"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-sm transition hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw size={16} />
          </button>
          {(from || to || q) && (
            <button
              onClick={() => {
                setQ('');
                setFrom('');
                setTo('');
                setPage(0);
              }}
              title="Clear all filters"
              aria-label="Clear all filters"
              className="inline-flex h-10 items-center rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-500 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>
      {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(15,31,61,0.06)] dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[1080px] text-sm">
          <thead>
            <tr className="border-b border-line bg-slate-50/80 text-left dark:border-slate-800 dark:bg-slate-800/50">
              <Th icon={<UserRound size={13} />} label="User" />
              <Th icon={<Phone size={13} />} label="Phone" />
              <Th icon={<VenusAndMars size={13} />} label="Gender" hide="xl" />
              <Th icon={<Calendar size={13} />} label="DOB" hide="xl" />
              <Th icon={<Droplet size={13} />} label="Blood" hide="xl" />
              <Th icon={<Building2 size={13} />} label="Company" hide="lg" />
              <Th icon={<Briefcase size={13} />} label="Job Role" hide="lg" />
              <Th icon={<ShieldCheck size={13} />} label="Access" />
              <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 transition-colors duration-200 last:border-0 hover:bg-violet-50/40 dark:border-slate-800 dark:hover:bg-slate-800/60">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="relative shrink-0">
                      <Avatar
                        name={u.name}
                        email={u.email}
                        avatarUrl={u.avatarUrl}
                        onZoom={u.avatarUrl ? () => setLightbox({ src: u.avatarUrl!, name: u.name || u.email }) : undefined}
                      />
                      <span
                        title={(u.isActive ?? 1) === 1 ? 'Active' : 'Inactive'}
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${(u.isActive ?? 1) === 1 ? 'bg-green-500' : 'bg-slate-400'}`}
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-ink dark:text-white">{u.name}</div>
                      <div className="truncate text-xs text-muted">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-700 dark:text-slate-300">{u.phone || <Muted>—</Muted>}</td>
                <td className="hidden px-4 py-4 text-slate-700 xl:table-cell dark:text-slate-300">{u.gender || <Muted>—</Muted>}</td>
                <td className="hidden whitespace-nowrap px-4 py-4 text-slate-700 xl:table-cell dark:text-slate-300">{u.dateOfBirth || <Muted>—</Muted>}</td>
                <td className="hidden px-4 py-4 xl:table-cell">
                  {u.bloodGroup ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-950 dark:text-red-400">{u.bloodGroup}</span>
                  ) : (
                    <Muted>—</Muted>
                  )}
                </td>
                <td className="hidden max-w-[140px] truncate px-4 py-4 text-slate-700 lg:table-cell dark:text-slate-300" title={u.currentCompany || ''}>{u.currentCompany || <Muted>—</Muted>}</td>
                <td className="hidden max-w-[140px] truncate px-4 py-4 text-slate-700 lg:table-cell dark:text-slate-300" title={u.role || ''}>{u.role || <Muted>—</Muted>}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${u.accessRole === 'admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {u.accessRole === 'admin' && <Crown size={11} />}
                    {u.accessRole || 'member'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <span className="mr-1.5 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1 dark:bg-slate-800" title={isLocked(u) ? 'Locked — click to unlock' : 'Unlocked — click to lock'}>
                    <span className="text-xs">{isLocked(u) ? '🔒' : '🔓'}</span>
                    <Toggle
                      on={isLocked(u)}
                      tone="red"
                      title={isLocked(u) ? 'Locked — click to unlock' : 'Unlocked — click to lock'}
                      onChange={() => {
                        setLockHours('12');
                        setLockUser(u);
                      }}
                    />
                  </span>
                  <IconBtn
                    onClick={() => askRowToggleActive(u)}
                    title={(u.isActive ?? 1) === 1 ? 'Deactivate user' : 'Activate user'}
                    className={`text-sm ${(u.isActive ?? 1) === 1 ? 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950 dark:text-green-400' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    {(u.isActive ?? 1) === 1 ? <UserCheck size={13} /> : <UserX size={13} />}
                  </IconBtn>
                  <IconBtn onClick={() => openView(u)} title="View full details" className="ml-1.5 bg-sky-50 text-sm text-sky-700 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300">
                    <Eye size={13} />
                  </IconBtn>
                  <IconBtn onClick={() => setDeleteUser(u)} title="Delete user and all their data" className="ml-1.5 bg-red-50 text-sm text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400">
                    <Trash2 size={13} />
                  </IconBtn>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <Search size={20} />
                  </div>
                  <div className="text-sm text-muted">No users found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-muted">
        <button disabled={page <= 0} onClick={() => setPage(page - 1)} aria-label="Previous page" className="rounded-[10px] border border-line bg-white px-3.5 py-2 font-medium transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted dark:border-slate-700 dark:bg-slate-900">
          ← Prev
        </button>
        <span className="rounded-[10px] bg-white px-3 py-2 text-xs font-semibold dark:bg-slate-900">Page {page + 1} • {total} total</span>
        <button disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)} aria-label="Next page" className="rounded-[10px] border border-line bg-white px-3.5 py-2 font-medium transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted dark:border-slate-700 dark:bg-slate-900">
          Next →
        </button>
      </div>

      <UserAnalytics />

      {viewId && (
        <UserViewModal
          full={full}
          detail={detail}
          loading={detailLoading}
          onZoomPhoto={(src, name) => setLightbox({ src, name })}
          onClose={() => setViewId(null)}
          onRole={(role) => full && askRoleChange(full, role)}
          onToggle={() => full && askToggleActive(full)}
          onDelete={() => {
            const row = rows.find((r) => r.id === viewId);
            if (row) setDeleteUser(row);
          }}
          onOpen={(path) => {
            setViewId(null);
            navigate(`${path}?userId=${viewId}`);
          }}
        />
      )}

      {confirmBox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => !confirming && setConfirmBox(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-3xl ${confirmBox.danger ? 'bg-amber-100' : 'bg-violet-100'}`}>
              {confirmBox.danger ? '⚠️' : '❓'}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{confirmBox.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{confirmBox.message}</p>
            <div className="mt-5 flex gap-2">
              <button disabled={confirming} onClick={() => setConfirmBox(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button
                disabled={confirming}
                onClick={runConfirm}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${confirmBox.danger ? 'bg-amber-500 hover:bg-amber-600' : 'bg-violet-600 hover:bg-violet-700'}`}
              >
                {confirming ? 'Working…' : confirmBox.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {lockUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !locking && setLockUser(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${isLocked(lockUser) ? 'bg-green-100' : 'bg-amber-100'}`}>
              {isLocked(lockUser) ? <LockOpen size={26} className="text-green-600" /> : <Lock size={26} className="text-amber-600" />}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{isLocked(lockUser) ? 'Unlock user?' : 'Lock user?'}</h2>
            <p className="mt-1 text-sm text-slate-500">
              <b>{lockUser.name}</b> ({lockUser.email})
              {isLocked(lockUser)
                ? ' will be able to log in again and failed attempts reset.'
                : ' will be blocked from logging in.'}
            </p>
            {!isLocked(lockUser) && (
              <label className="mt-4 block text-sm">
                <span className="mb-1 block text-left text-slate-600 dark:text-slate-300">Lock duration</span>
                <select
                  value={lockHours}
                  onChange={(e) => setLockHours(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                </select>
              </label>
            )}
            <div className="mt-5 flex gap-2">
              <button disabled={locking} onClick={() => setLockUser(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button
                disabled={locking}
                onClick={confirmLockToggle}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${isLocked(lockUser) ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'}`}
              >
                {locking ? 'Working…' : isLocked(lockUser) ? 'Yes, Unlock' : 'Yes, Lock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !adding && setShowAdd(false)}>
          <div className="w-full max-w-sm rounded-[18px] bg-white p-6 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-purple text-2xl font-bold text-white">+</div>
            <h2 className="text-center text-lg font-bold text-slate-900 dark:text-white">Add New Admin</h2>
            <p className="mt-1 text-center text-sm text-slate-500">Account is verified instantly, no email needed.</p>
            <AddField label="Name" error={addErrors.name}>
              <input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Full name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </AddField>
            <AddField label="Email" error={addForm.email}>
              <input
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="admin@example.com"
                type="email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </AddField>
            <AddField label="Password" error={addForm.password}>
              <div className="relative">
                <input
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  type={showAddPass ? 'text' : 'password'}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-11 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowAddPass(!showAddPass)}
                  title={showAddPass ? 'Hide password' : 'Show password'}
                  aria-label={showAddPass ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-lg leading-none text-slate-500 hover:text-slate-800 dark:text-slate-400"
                >
                  {showAddPass ? '🙈' : '👁️'}
                </button>
              </div>
            </AddField>
            <AddField label="Role">
              <select
                value={addForm.accessRole}
                onChange={(e) => setAddForm({ ...addForm, accessRole: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-violet-700 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="admin">admin</option>
                <option value="member">member</option>
              </select>
            </AddField>
            <div className="mt-5 flex gap-2">
              <button disabled={adding} onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button disabled={adding} onClick={confirmAdd} className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-purple py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition hover:opacity-95 disabled:opacity-50">
                {adding ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setDeleteUser(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">⚠️</div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Delete user?</h2>
            <p className="mt-1 text-sm text-slate-500">
              <b>{deleteUser.name}</b> ({deleteUser.email}) and <b>all their data</b> will be permanently removed.
            </p>
            <div className="mt-5 flex gap-2">
              <button disabled={deleting} onClick={() => setDeleteUser(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button disabled={deleting} onClick={confirmDelete} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.src} alt="photo" className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl" />
            <div className="mt-3 flex justify-end">
              <button onClick={() => setLightbox(null)} className="rounded-lg bg-white/10 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/20">
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ icon, label, hide }: { icon: React.ReactNode; label: string; hide?: 'lg' | 'xl' }) {
  return (
    <th className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted ${hide === 'lg' ? 'hidden lg:table-cell' : hide === 'xl' ? 'hidden xl:table-cell' : ''}`}>
      <span className="inline-flex items-center gap-1.5">{icon}{label}</span>
    </th>
  );
}

function AddField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-50 py-2 text-sm last:border-0 dark:border-slate-800">
      <span className="shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800 break-all dark:text-slate-100">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</div>
      {children}
    </div>
  );
}

function UserAnalytics() {
  const { stats, loading, error } = useAdminStats();
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-[15px] font-bold text-ink dark:text-white">User Analytics</h2>
      {error ? (
        <div className="rounded-2xl border border-line bg-white p-4 text-sm text-muted dark:border-slate-800 dark:bg-slate-900">
          Analytics unavailable right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(15,31,61,0.06)] dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Total Users</div>
            {loading || !stats ? (
              <div className="skeleton mt-2 h-8 w-20 rounded" />
            ) : (
              <div className="mt-1 text-[26px] font-extrabold text-ink dark:text-white">{stats.usersTotal}</div>
            )}
            <div className="mt-0.5 text-xs text-muted">All registered accounts</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(15,31,61,0.06)] dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">New Users (30D)</div>
            {loading || !stats ? (
              <div className="skeleton mt-2 h-8 w-20 rounded" />
            ) : (
              <div className="mt-1 text-[26px] font-extrabold text-ink dark:text-white">{stats.newUsers30d}</div>
            )}
            <div className="mt-0.5 text-xs text-muted">Joined in last 30 days</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(15,31,61,0.06)] dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">User Growth</div>
            {loading || !stats ? (
              <div className="skeleton mt-2 h-[52px] rounded-lg" />
            ) : stats.usersByMonth.length === 0 ? (
              <div className="mt-2 py-4 text-center text-xs text-muted">No growth data yet</div>
            ) : (
              <GrowthSpark stats={stats.usersByMonth} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GrowthSpark({ stats }: { stats: { month: string; count: number }[] }) {
  const data = stats.slice(-6);
  return (
    <ResponsiveContainer width="100%" height={52}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="userGrowthMini" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ borderRadius: 10, border: '1px solid #e6ecf5', fontSize: 11 }}
          formatter={(value) => [value, 'Users']}
        />
        <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} fill="url(#userGrowthMini)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function UserViewModal({
  full,
  detail,
  loading,
  onZoomPhoto,
  onClose,
  onRole,
  onToggle,
  onDelete,
  onOpen,
}: {
  full: FullUser | null;
  detail: UserDetail | null;
  loading: boolean;
  onZoomPhoto: (src: string, name: string) => void;
  onClose: () => void;
  onRole: (role: string) => void;
  onToggle: () => void;
  onDelete: () => void;
  onOpen: (path: string) => void;
}) {
  const tiles = detail
    ? [
        { icon: '💳', label: 'Plan', value: detail.plan, path: '/subscriptions' },
        { icon: '🗄️', label: 'Storage', value: detail.storage, path: '/subscriptions' },
        { icon: '🏢', label: 'Companies', value: String(detail.companies), path: '/companies' },
        { icon: '📄', label: 'Documents', value: String(detail.documents), path: '/documents' },
        { icon: '⏰', label: 'Reminders', value: String(detail.reminders), path: '/reminders' },
        { icon: '🧾', label: 'Invoices', value: String(detail.invoices), path: '/subscriptions' },
      ]
    : [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-brand-600 to-brand-purple p-5 text-white">
          <Avatar
            name={full?.name}
            email={full?.email}
            avatarUrl={full?.avatarUrl}
            size="h-14 w-14 text-2xl"
            onZoom={full?.avatarUrl ? () => onZoomPhoto(full.avatarUrl as string, full.name || full.email) : undefined}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-bold">{full?.name || '…'}</div>
            <div className="truncate text-sm text-white/80">{full?.email || ''}</div>
          </div>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{full?.accessRole || 'member'}</span>
          <button onClick={onClose} aria-label="Close details" className="rounded-lg px-2 py-1 text-xl text-white/70 hover:text-white">✕</button>
        </div>
        <div className="space-y-3 p-5">
          {loading && <div className="py-6 text-center text-slate-500">Loading full details…</div>}
          {!loading && full && (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <span className="text-sm text-slate-600 dark:text-slate-300">Status</span>
                <Toggle on={(full.isActive ?? 1) === 1} onChange={onToggle} />
                <span className={`text-sm font-semibold ${(full.isActive ?? 1) === 1 ? 'text-green-600' : 'text-amber-600'}`}>
                  {(full.isActive ?? 1) === 1 ? 'Active' : 'Inactive'}
                </span>
                <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-sm text-slate-600 dark:text-slate-300">Role</span>
                <select
                  value={full.accessRole || 'member'}
                  onChange={(e) => onRole(e.target.value)}
                  aria-label="Change role"
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-violet-700 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
                <button onClick={onDelete} className="ml-auto rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400">
                  🗑 Delete user
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tiles.map((t) => (
                  <div key={t.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="text-xl">{t.icon}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{t.label}</div>
                    <div className="truncate text-sm font-bold text-slate-900 dark:text-white" title={t.value}>{t.value}</div>
                    <button onClick={() => onOpen(t.path)} className="mt-1 text-xs font-semibold text-violet-600 hover:underline">
                      Open →
                    </button>
                  </div>
                ))}
              </div>
              <Section title="👤 Personal">
                <InfoRow label="Name" value={val(full.name)} />
                <InfoRow label="Email" value={val(full.email)} />
                <InfoRow label="Gender" value={val(full.gender)} />
                <InfoRow label="DOB" value={val(full.dateOfBirth)} />
                <InfoRow label="Blood Group" value={val(full.bloodGroup)} />
                <InfoRow label="Phone" value={val(full.phone)} />
              </Section>
              <Section title="💼 Professional">
                <InfoRow label="Headline" value={val(full.headline)} />
                <InfoRow label="Job Role" value={val(full.role)} />
                <InfoRow label="Domain" value={val(full.domain)} />
                <InfoRow label="Company" value={val(full.currentCompany)} />
                <InfoRow label="Salary" value={val(full.salary)} />
                <InfoRow label="Expected" value={val(full.expectedSalary)} />
                <InfoRow label="Skills" value={val(full.skills)} />
                <InfoRow label="LinkedIn" value={val(full.linkedInUrl)} />
                <InfoRow label="Portfolio" value={val(full.portfolioUrl)} />
              </Section>
              <Section title="🪪 Identity & Bank">
                <InfoRow label="PAN" value={val(full.panNumber)} />
                <InfoRow label="Aadhaar" value={val(full.aadhaarNumber)} />
                <InfoRow label="UAN" value={val(full.uanNumber)} />
                <InfoRow label="PF No." value={val(full.pfNumber)} />
                <InfoRow label="Bank A/c" value={val(full.bankAccountNumber)} />
                <InfoRow label="IFSC" value={val(full.ifscCode)} />
              </Section>
              <Section title="📍 Contact">
                <InfoRow label="Address" value={val(full.address)} />
                <InfoRow label="Emergency" value={val(full.emergencyContact)} />
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );

  function val(v: unknown): string {
    if (v === null || v === undefined || v === '') return '—';
    return String(v);
  }
}
