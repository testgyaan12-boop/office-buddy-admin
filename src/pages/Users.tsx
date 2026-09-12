import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errMsg, type Page } from '../api';
import { DateRangeButton, ExpandSearch } from '../components/filterControls';

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

function Toggle({ on, onChange, title, tone = 'green' }: { on: boolean; onChange: () => void; title?: string; tone?: 'green' | 'red' }) {
  const onColor = tone === 'red' ? 'bg-red-500' : 'bg-green-500';
  return (
    <button
      onClick={onChange}
      title={title}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? onColor : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

export default function Users() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
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
      const [userRes, docs, companies, reminders, invoices, subs] = await Promise.all([
        api.get(`/admin/users/${u.id}`),
        api.get('/admin/documents', { params: { userId: u.id, page: 0, size: 1 } }),
        api.get('/admin/companies', { params: { userId: u.id, page: 0, size: 1 } }),
        api.get('/admin/reminders', { params: { userId: u.id, page: 0, size: 1 } }),
        api.get('/admin/invoices', { params: { userId: u.id, page: 0, size: 1 } }),
        api.get('/admin/subscriptions', { params: { userId: u.id, page: 0, size: 5 } }),
      ]);
      setFull(userRes.data as FullUser);
      const subList = (subs.data?.content || []) as { planCode?: string; planName?: string; status?: string; storageLimitBytes?: number }[];
      const active = subList.find((s) => s.status === 'ACTIVE') || subList[0];
      const bytes = active?.storageLimitBytes || 0;
      setDetail({
        plan: active ? `${active.planName || active.planCode} (${active.status})` : 'Free (no subscription)',
        storage: bytes >= 1024 * 1024 * 1024 ? `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB` : `${(bytes / 1024 / 1024).toFixed(0)} MB`,
        companies: companies.data?.totalElements ?? 0,
        documents: docs.data?.totalElements ?? 0,
        reminders: reminders.data?.totalElements ?? 0,
        invoices: invoices.data?.totalElements ?? 0,
      });
    } catch {
      setDetail({ plan: '—', storage: '—', companies: 0, documents: 0, reminders: 0, invoices: 0 });
    } finally {
      setDetailLoading(false);
    }
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
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      alert('Name, email and password are required');
      return;
    }
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">{total} total • click 👁 for full details</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAddForm({ name: '', email: '', password: '', accessRole: 'admin' });
              setShowAddPass(false);
              setShowAdd(true);
            }}
            className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-4 text-sm font-semibold text-white shadow hover:opacity-95"
          >
            + Add Admin
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
          {(from || to || q) && (
            <button
              onClick={() => {
                setQ('');
                setFrom('');
                setTo('');
                setPage(0);
              }}
              title="Clear all filters"
              className="inline-flex h-10 items-center rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-500 hover:bg-red-100 hover:text-red-600"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>
      {error && <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">User</th>
              <th className="px-4 py-3">📞 Phone</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">DOB</th>
              <th className="px-4 py-3">Blood</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Job Role</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 transition hover:bg-violet-50/40">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={u.name}
                      email={u.email}
                      avatarUrl={u.avatarUrl}
                      onZoom={u.avatarUrl ? () => setLightbox({ src: u.avatarUrl!, name: u.name || u.email }) : undefined}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">{u.name}</div>
                      <div className="truncate text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-slate-700">{u.gender || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-700">{u.dateOfBirth || '—'}</td>
                <td className="px-4 py-3">
                  {u.bloodGroup ? (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">{u.bloodGroup}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="max-w-[140px] truncate px-4 py-3 text-slate-700" title={u.currentCompany || ''}>{u.currentCompany || '—'}</td>
                <td className="max-w-[140px] truncate px-4 py-3 text-slate-700" title={u.role || ''}>{u.role || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.accessRole === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                    {u.accessRole || 'member'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${(u.isActive ?? 1) === 1 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {(u.isActive ?? 1) === 1 ? '● Active' : '● Inactive'}
                    </span>
                    {isLocked(u) && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">🔒 Locked</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className="mr-2 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-1" title={isLocked(u) ? 'Account is LOCKED — click toggle to unlock' : 'Account is unlocked — click toggle to lock'}>
                    <span className="text-sm">{isLocked(u) ? '🔒' : '🔓'}</span>
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
                  <button
                    onClick={() => openView(u)}
                    title="View full details"
                    className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-base text-sky-700 transition hover:bg-sky-100 hover:shadow"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => setDeleteUser(u)}
                    title="Delete user and all their data"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-base text-red-600 transition hover:bg-red-100 hover:shadow"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-slate-400">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
        <button disabled={page <= 0} onClick={() => setPage(page - 1)} className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40">← Prev</button>
        <span>Page {page + 1} • {total} total</span>
        <button disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)} className="rounded-lg border bg-white px-3 py-1.5 disabled:opacity-40">Next →</button>
      </div>

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
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-3xl ${confirmBox.danger ? 'bg-amber-100' : 'bg-violet-100'}`}>
              {confirmBox.danger ? '⚠️' : '❓'}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{confirmBox.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{confirmBox.message}</p>
            <div className="mt-5 flex gap-2">
              <button disabled={confirming} onClick={() => setConfirmBox(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
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
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-3xl ${isLocked(lockUser) ? 'bg-green-100' : 'bg-amber-100'}`}>
              {isLocked(lockUser) ? '🔓' : '🔒'}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{isLocked(lockUser) ? 'Unlock user?' : 'Lock user?'}</h2>
            <p className="mt-1 text-sm text-slate-500">
              <b>{lockUser.name}</b> ({lockUser.email})
              {isLocked(lockUser)
                ? ' will be able to log in again and failed attempts reset.'
                : ' will be blocked from logging in.'}
            </p>
            {!isLocked(lockUser) && (
              <label className="mt-4 block text-sm">
                <span className="mb-1 block text-left text-slate-600">Lock duration</span>
                <select
                  value={lockHours}
                  onChange={(e) => setLockHours(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold"
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
              <button disabled={locking} onClick={() => setLockUser(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
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

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !adding && setShowAdd(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-3xl text-white">+</div>
            <h2 className="text-center text-lg font-bold text-slate-900">Add New Admin</h2>
            <p className="mt-1 text-center text-sm text-slate-500">Account is verified instantly, no email needed.</p>
            <label className="mb-3 mt-4 block text-sm">
              <span className="mb-1 block text-slate-600">Name</span>
              <input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Full name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </label>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-slate-600">Email</span>
              <input
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="admin@example.com"
                type="email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </label>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-slate-600">Password</span>
              <div className="relative">
                <input
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  type={showAddPass ? 'text' : 'password'}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-11 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() => setShowAddPass(!showAddPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-lg leading-none text-slate-500 hover:text-slate-800"
                >
                  {showAddPass ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
            <label className="mb-1 block text-sm">
              <span className="mb-1 block text-slate-600">Role</span>
              <select
                value={addForm.accessRole}
                onChange={(e) => setAddForm({ ...addForm, accessRole: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-semibold text-violet-700"
              >
                <option value="admin">admin</option>
                <option value="member">member</option>
              </select>
            </label>
            <div className="mt-5 flex gap-2">
              <button disabled={adding} onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button disabled={adding} onClick={confirmAdd} className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {adding ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setDeleteUser(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">⚠️</div>
            <h2 className="text-lg font-bold text-slate-900">Delete user?</h2>
            <p className="mt-1 text-sm text-slate-500">
              <b>{deleteUser.name}</b> ({deleteUser.email}) and <b>all their data</b> will be permanently removed.
            </p>
            <div className="mt-5 flex gap-2">
              <button disabled={deleting} onClick={() => setDeleteUser(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button disabled={deleting} onClick={confirmDelete} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-50 py-2 text-sm last:border-0">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800 break-all">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</div>
      {children}
    </div>
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
        { icon: '🧾', label: 'Invoices', value: String(detail.invoices), path: '/invoices' },
      ]
    : [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-blue-500 p-5 text-white">
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
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-white/70 hover:text-white">✕</button>
        </div>
        <div className="space-y-3 p-5">
          {loading && <div className="py-6 text-center text-slate-500">Loading full details…</div>}
          {!loading && full && (
            <>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3">
                <span className="text-sm text-slate-600">Status</span>
                <Toggle on={(full.isActive ?? 1) === 1} onChange={onToggle} />
                <span className={`text-sm font-semibold ${(full.isActive ?? 1) === 1 ? 'text-green-600' : 'text-amber-600'}`}>
                  {(full.isActive ?? 1) === 1 ? 'Active' : 'Inactive'}
                </span>
                <span className="mx-1 h-5 w-px bg-slate-200" />
                <span className="text-sm text-slate-600">Role</span>
                <select
                  value={full.accessRole || 'member'}
                  onChange={(e) => onRole(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-violet-700"
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
                <button onClick={onDelete} className="ml-auto rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                  🗑 Delete user
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tiles.map((t) => (
                  <div key={t.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="text-xl">{t.icon}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{t.label}</div>
                    <div className="truncate text-sm font-bold text-slate-900" title={t.value}>{t.value}</div>
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
