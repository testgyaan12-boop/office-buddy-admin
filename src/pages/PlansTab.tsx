import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { api, errMsg } from '../api';
import { fmtBytes, fmtINR } from '../components/StatCard';
import { plansRes } from '../resources';

interface Plan {
  id: number;
  planName?: string;
  planCode?: string;
  period?: string;
  allocatedBytes?: number;
  allocatedUnit?: string;
  amount?: number;
  currency?: string;
  isActive?: number;
  isDeleted?: number;
  remarks?: string;
}

function periodSuffix(period?: string): string {
  const p = (period || '').toUpperCase();
  if (p.includes('MONTH')) return 'month';
  if (p.includes('YEAR')) return 'year';
  if (p.includes('LIFE')) return 'one-time';
  return p ? p.toLowerCase() : '';
}

export default function PlansTab({ refreshKey, onRefresh }: { refreshKey: number; onRefresh: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ row: Plan | null } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [confirmSave, setConfirmSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggleRow, setToggleRow] = useState<{ row: Plan; next: boolean } | null>(null);
  const [toggling, setToggling] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/admin/plans');
      setPlans(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const filtered = plans.filter((p) => {
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return (
      (p.planName || '').toLowerCase().includes(needle) ||
      (p.planCode || '').toLowerCase().includes(needle)
    );
  });

  const openEdit = (row: Plan | null) => {
    setEditing({ row });
    const f: Record<string, string> = {};
    for (const field of plansRes.fields) {
      const v = row ? (row as unknown as Record<string, unknown>)[field.key] : '';
      f[field.key] = v === null || v === undefined ? '' : String(v);
    }
    setForm(f);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.row) {
        await api.put(`/admin/plans/${editing.row.id}`, form);
      } else {
        await api.post('/admin/plans', form);
      }
      setEditing(null);
      setConfirmSave(false);
      load();
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmToggle = async () => {
    if (!toggleRow) return;
    setToggling(true);
    try {
      await api.put(`/admin/plans/${toggleRow.row.id}`, { isActive: toggleRow.next ? 1 : 0 });
      setToggleRow(null);
      load();
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setToggling(false);
    }
  };

  const confirmRemove = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/plans/${deleteRow.id}`);
      setDeleteRow(null);
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
          <h2 className="text-[18px] font-bold text-ink dark:text-white">Plans</h2>
          <p className="text-[13px] text-muted">Pricing plans offered to users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search plans…"
              aria-label="Search plans"
              className="w-52 rounded-xl border border-line bg-white py-2.5 pl-4 pr-4 text-sm text-ink shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 sm:w-64 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            onClick={() => openEdit(null)}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600/90"
          >
            + New Plan
          </button>
          <button
            onClick={onRefresh}
            title="Refresh"
            aria-label="Refresh plans"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-sm transition hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error} <button onClick={load} className="ml-2 font-semibold underline">Retry</button></div>}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-line bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="skeleton h-6 w-32 rounded" />
              <div className="skeleton mt-3 h-9 w-24 rounded" />
              <div className="skeleton mt-4 h-4 w-full rounded" />
              <div className="skeleton mt-2 h-4 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-4 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-3xl dark:bg-slate-800">📦</div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">No plans found</div>
          <div className="mt-1 text-xs text-slate-400">Create your first plan to get started.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
          {filtered.map((p) => {
            const isOn = p.isActive === 1;
            const price = p.amount !== null && p.amount !== undefined ? fmtINR(p.amount) : null;
            const suffix = periodSuffix(p.period);
            return (
              <div
                key={p.id}
                className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(15,31,61,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,31,61,0.10)] dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{p.planCode}</div>
                    <div className="mt-0.5 text-xl font-extrabold tracking-tight text-ink dark:text-white">{p.planName}</div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isOn ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isOn ? 'bg-green-500' : 'bg-slate-400'}`} />
                    {isOn ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-[28px] font-extrabold tracking-tight text-ink dark:text-white">
                    {price ?? '—'}
                  </span>
                  {price && suffix && <span className="text-sm text-muted">/ {suffix}</span>}
                </div>
                <ul className="mt-4 flex-1 space-y-2.5 text-sm">
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                    <Check size={15} className="shrink-0 text-green-500" />
                    {p.allocatedBytes ? `${fmtBytes(p.allocatedBytes)} storage` : 'Storage included'}
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                    <Check size={15} className="shrink-0 text-green-500" />
                    {p.period ? `${p.period} billing` : 'Recurring billing'}
                  </li>
                </ul>
                <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 dark:border-slate-800">
                  <button onClick={() => openEdit(p)} title="Edit plan" aria-label="Edit plan" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-base text-violet-600 transition-all duration-200 hover:bg-violet-100 hover:shadow dark:bg-violet-950 dark:text-violet-300">
                    ✏️
                  </button>
                  <button
                    onClick={() => setToggleRow({ row: p, next: !isOn })}
                    title={isOn ? 'Deactivate plan' : 'Activate plan'}
                    aria-label={isOn ? 'Deactivate plan' : 'Activate plan'}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${isOn ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    role="switch"
                    aria-checked={isOn}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${isOn ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                  <button onClick={() => setDeleteRow(p)} title="Delete plan" aria-label="Delete plan" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-base text-red-600 transition-all duration-200 hover:bg-red-100 hover:shadow dark:bg-red-950 dark:text-red-400">
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">{editing.row ? 'Edit Plan' : 'New Plan'}</h2>
            {plansRes.fields.map((f) => (
              <label key={f.key} className="mb-3 block text-sm">
                <span className="mb-1 block text-slate-600 dark:text-slate-300">{f.label}</span>
                {f.type === 'select' ? (
                  <select
                    value={form[f.key] ?? ''}
                    disabled={!!f.readOnly && !!editing.row}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {(f.options || []).map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={form[f.key] ?? ''}
                    disabled={!!f.readOnly && !!editing.row}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                )}
              </label>
            ))}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-lg border px-4 py-2 text-sm dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button onClick={() => setConfirmSave(true)} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">Save</button>
            </div>
          </div>
        </div>
      )}

      {confirmSave && editing !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setConfirmSave(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-3xl">💾</div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editing.row ? 'Save changes?' : 'Create plan?'}</h2>
            <div className="mt-5 flex gap-2">
              <button disabled={saving} onClick={() => setConfirmSave(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button disabled={saving} onClick={save} className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Yes, Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toggleRow !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !toggling && setToggleRow(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-3xl ${toggleRow.next ? 'bg-green-100' : 'bg-amber-100'}`}>
              {toggleRow.next ? '✅' : '⏸️'}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{toggleRow.next ? 'Activate' : 'Deactivate'} plan?</h2>
            <p className="mt-1 text-sm text-slate-500">
              <b>{toggleRow.row.planName || toggleRow.row.planCode}</b> will be {toggleRow.next ? 'activated and visible again' : 'deactivated and hidden'}.
            </p>
            <div className="mt-5 flex gap-2">
              <button disabled={toggling} onClick={() => setToggleRow(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button
                disabled={toggling}
                onClick={confirmToggle}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${toggleRow.next ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'}`}
              >
                {toggling ? 'Working…' : toggleRow.next ? 'Yes, Activate' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteRow !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setDeleteRow(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">⚠️</div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Delete plan?</h2>
            <p className="mt-1 text-sm text-slate-500">
              <b>{deleteRow.planName || deleteRow.planCode}</b> will be permanently removed. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button disabled={deleting} onClick={() => setDeleteRow(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button disabled={deleting} onClick={confirmRemove} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
