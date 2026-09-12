import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, errMsg, type Page } from '../api';
import { DateRangeButton, ExpandSearch } from './filterControls';

export interface Field {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  options?: string[];
  readOnly?: boolean;
}

export interface Resource {
  title: string;
  base: string;
  paged: boolean;
  hideTitle?: boolean;
  searchable?: boolean;
  dateRange?: boolean;
  fixedParams?: Record<string, string>;
  columns: { key: string; label: string; copy?: boolean; iconBool?: boolean }[];
  fields: Field[];
  allowCreate?: boolean;
  allowDelete?: boolean;
  allowToggle?: boolean;
  allowView?: boolean;
  idKey?: string;
}

function prettyLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase());
}

function prettyValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function MiniToggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      title={on ? 'Active — click to deactivate' : 'Inactive — click to activate'}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? 'bg-green-500' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 60);
  const s = String(v);
  return s.length > 40 ? s.slice(0, 40) + '…' : s;
}

const PILL: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  SENT: 'bg-sky-100 text-sky-700',
  SCHEDULED: 'bg-sky-100 text-sky-700',
  FAILED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-slate-200 text-slate-600',
};

function IdsCell({ row }: { row: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false);
  const u = typeof row.userId === 'string' ? row.userId : '';
  const c = typeof row.companyId === 'string' ? row.companyId : '';
  const short = (s: string) => (s ? (s.length > 8 ? s.slice(0, 8) + '…' : s) : '—');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`userId: ${u}\ncompanyId: ${c}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert('Copy failed');
    }
  };
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-xs text-slate-600" title={`userId: ${u || '—'}\ncompanyId: ${c || '—'}`}>
      U:{short(u)} • C:{short(c)}
      <button
        onClick={(e) => {
          e.stopPropagation();
          copy();
        }}
        title="Copy full IDs"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs transition hover:bg-violet-100"
      >
        {copied ? '✅' : '📋'}
      </button>
    </span>
  );
}

function CopyCell({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false);
  const s = value === null || value === undefined ? '' : String(value);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(s);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert('Copy failed');
    }
  };
  if (!s) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-600" title={s}>
      <span className="block max-w-[140px] truncate">{s}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          copy();
        }}
        title="Copy full value"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs transition hover:bg-violet-100"
      >
        {copied ? '✅' : '📋'}
      </button>
    </span>
  );
}

function BoolIcon({ value, invert = false }: { value: unknown; invert?: boolean }) {
  const on = value === 1 || value === true;
  const good = invert ? !on : on;
  return (
    <span
      title={on ? 'Yes' : 'No'}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
        good ? 'bg-green-100' : 'bg-slate-200'
      }`}
    >
      {on ? '✅' : '❌'}
    </span>
  );
}

function StatusCell({ value }: { value: unknown }) {
  const s = cell(value);
  const key = s.toUpperCase();
  if (PILL[key]) {
    return (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PILL[key]}`}>
        {key === 'ACTIVE' ? '● ' : ''}{s}
      </span>
    );
  }
  if (key === '1' || key === '0') {
    const on = key === '1';
    return (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${on ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
        {on ? '● On' : '○ Off'}
      </span>
    );
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return <span className="whitespace-nowrap text-slate-600">{s.slice(0, 16).replace('T', ' ')}</span>;
  }
  return <span className="text-slate-700">{s}</span>;
}

export default function CrudPage({ resource }: { resource: Resource }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ row: Record<string, unknown> | null } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [deleteRow, setDeleteRow] = useState<Record<string, unknown> | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewRow, setViewRow] = useState<Record<string, unknown> | null>(null);
  const [toggleRow, setToggleRow] = useState<{ row: Record<string, unknown>; next: boolean } | null>(null);
  const [toggling, setToggling] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get('userId') || '';
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const size = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = { page, size, ...(resource.fixedParams || {}) };
      if (resource.searchable && q) params.q = q;
      if (resource.dateRange && from) params.from = from;
      if (resource.dateRange && to) params.to = to;
      if (userId) params.userId = userId;
      const r = await api.get(resource.base, { params });
      if (resource.paged && r.data && typeof r.data === 'object' && 'content' in r.data) {
        const p = r.data as Page<Record<string, unknown>>;
        setRows(p.content);
        setTotal(p.totalElements);
      } else {
        const list = Array.isArray(r.data) ? r.data : [];
        setRows(list);
        setTotal(list.length);
      }
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [resource, page, q, from, to, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (row: Record<string, unknown> | null) => {
    setEditing({ row });
    const f: Record<string, string> = {};
    for (const field of resource.fields) {
      const v = row ? row[field.key] : '';
      f[field.key] = v === null || v === undefined ? '' : String(v);
    }
    setForm(f);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.row) {
        const id = editing.row[resource.idKey || 'id'];
        await api.put(`${resource.base}/${id}`, form);
      } else {
        await api.post(resource.base, form);
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
      await api.put(`${resource.base}/${toggleRow.row[resource.idKey || 'id']}`, { isActive: toggleRow.next ? 1 : 0 });
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
      await api.delete(`${resource.base}/${deleteRow[resource.idKey || 'id']}`);
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {!resource.hideTitle && (
            <h1 className="text-2xl font-bold text-slate-900">{resource.title}</h1>
          )}
          {userId && (
            <span className="flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              User: {userId.slice(0, 8)}…
              <button
                onClick={() => {
                  searchParams.delete('userId');
                  setSearchParams(searchParams);
                  setPage(0);
                }}
                className="hover:text-violet-900"
              >
                ✕ Clear
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {resource.searchable && (
            <ExpandSearch
              value={q}
              placeholder="Search…"
              onChange={(v) => {
                setPage(0);
                setQ(v);
              }}
            />
          )}
          {resource.dateRange && (
            <DateRangeButton
              from={from}
              to={to}
              onApply={(f, t) => {
                setPage(0);
                setFrom(f);
                setTo(t);
              }}
            />
          )}
          {(q || from || to) && (resource.searchable || resource.dateRange) && (
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
          {resource.allowCreate && (
            <button onClick={() => openEdit(null)} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700">
              + New
            </button>
          )}
        </div>
      </div>
      {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <div className="rounded-2xl bg-white shadow-md border border-slate-100 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-violet-600 to-blue-500 text-left text-xs uppercase tracking-wide text-white">
              {resource.columns.map((c, ci) => (
                <th key={c.key} className={`px-5 py-3.5 font-semibold ${ci === 0 ? 'rounded-tl-2xl' : ''}`}>{c.label}</th>
              ))}
              <th className="px-5 py-3.5 font-semibold rounded-tr-2xl text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0, 1, 2].map((i) => (
                <tr key={i} className="border-t border-slate-100 animate-pulse">
                  {resource.columns.map((c) => (
                    <td key={c.key} className="px-5 py-3.5"><div className="h-4 w-24 rounded bg-slate-100" /></td>
                  ))}
                  <td className="px-5 py-3.5"><div className="ml-auto h-4 w-16 rounded bg-slate-100" /></td>
                </tr>
              ))
            ) : (
              rows.map((row, i) => {
                const editable = resource.fields.length > 0;
                const active = row.isActive === 1 || row.isActive === true;
                return (
                <tr key={String(row[resource.idKey || 'id'] ?? i)} className="border-t border-slate-100 transition hover:bg-violet-50/50">
                  {resource.columns.map((c, ci) => (
                    <td
                      key={c.key}
                      className={`px-5 py-3 ${ci === 0 && editable ? 'cursor-pointer' : ''}`}
                      title={ci === 0 && editable ? 'Click to edit' : undefined}
                      onClick={ci === 0 && editable ? () => openEdit(row) : undefined}
                    >
                      {c.key === '__ids' ? (
                        <IdsCell row={row} />
                      ) : c.iconBool ? (
                        <BoolIcon value={row[c.key]} invert={c.key === 'isDeleted'} />
                      ) : c.copy ? (
                        <CopyCell value={row[c.key]} />
                      ) : ci === 0 ? (
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-400 text-xs font-bold text-white">
                            {cell(row[c.key])[0]?.toUpperCase() || '?'}
                          </span>
                          <span className="block max-w-[220px] truncate font-semibold text-slate-900" title={String(row[c.key] ?? '')}>{cell(row[c.key])}</span>
                        </div>
                      ) : (
                        <StatusCell value={row[c.key]} />
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    {resource.fields.length > 0 && (
                      <button onClick={() => openEdit(row)} title="Edit record" className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-base text-violet-600 transition hover:bg-violet-100 hover:shadow">
                        ✏️
                      </button>
                    )}
                    {resource.allowView && (
                      <button onClick={() => setViewRow(row)} title="View details" className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-base text-sky-700 transition hover:bg-sky-100 hover:shadow">
                        👁️
                      </button>
                    )}
                    {resource.allowToggle && row.isActive !== undefined && (
                      <span className="mr-3 inline-flex items-center">
                        <MiniToggle on={active} onChange={() => setToggleRow({ row, next: !active })} />
                      </span>
                    )}
                    {resource.allowDelete && (
                      <button onClick={() => setDeleteRow(row)} title="Delete record" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-base text-red-600 transition hover:bg-red-100 hover:shadow">
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
                );
              })
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={resource.columns.length + 1} className="px-4 py-10 text-center">
                  <div className="text-4xl">📭</div>
                  <div className="mt-2 text-slate-400">No records found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {resource.paged && (
        <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
          <button disabled={page <= 0} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Prev</button>
          <span>Page {page + 1} • {total} total</span>
          <button disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      )}
      {editing !== null && (
        <EditDialog
          title={editing.row ? `Edit ${resource.title}` : `New ${resource.title}`}
          fields={resource.fields}
          form={form}
          setForm={setForm}
          onClose={() => setEditing(null)}
          onSave={() => setConfirmSave(true)}
          isNew={!editing.row}
        />
      )}
      {confirmSave && editing !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => !saving && setConfirmSave(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-3xl">💾</div>
            <h2 className="text-lg font-bold text-slate-900">{editing.row ? 'Save changes?' : 'Create record?'}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {editing.row ? 'Changes will be applied immediately.' : 'A new record will be created.'}
            </p>
            <div className="mt-5 flex gap-2">
              <button disabled={saving} onClick={() => setConfirmSave(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
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
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-3xl ${toggleRow.next ? 'bg-green-100' : 'bg-amber-100'}`}>
              {toggleRow.next ? '✅' : '⏸️'}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{toggleRow.next ? 'Activate' : 'Deactivate'} {resource.title}?</h2>
            <p className="mt-1 text-sm text-slate-500">
              <b>{cell(toggleRow.row[resource.columns[0]?.key || 'id'])}</b> will be {toggleRow.next ? 'activated and visible again' : 'deactivated and hidden'}.
            </p>
            <div className="mt-5 flex gap-2">
              <button disabled={toggling} onClick={() => setToggleRow(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
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
      {viewRow !== null && (
        <ViewModal
          title={`${resource.title} details`}
          row={viewRow}
          onClose={() => setViewRow(null)}
        />
      )}
      {deleteRow !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setDeleteRow(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">⚠️</div>
            <h2 className="text-lg font-bold text-slate-900">Delete {resource.title}?</h2>
            <p className="mt-1 text-sm text-slate-500">
              <b>{cell(deleteRow[resource.columns[0]?.key || 'id'])}</b> will be permanently removed. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button disabled={deleting} onClick={() => setDeleteRow(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
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

function EditDialog({
  title,
  fields,
  form,
  setForm,
  onClose,
  onSave,
  isNew,
}: {
  title: string;
  fields: Field[];
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onClose: () => void;
  onSave: () => void;
  isNew: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        {fields.map((f) => (
          <label key={f.key} className="mb-3 block text-sm">
            <span className="mb-1 block text-slate-600">{f.label}</span>
            {f.type === 'select' ? (
              <select
                value={form[f.key] ?? ''}
                disabled={f.readOnly && !isNew}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {(f.options || []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                type={f.type === 'number' ? 'number' : 'text'}
                value={form[f.key] ?? ''}
                disabled={f.readOnly && !isNew}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            )}
          </label>
        ))}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <button onClick={onSave} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">Save</button>
        </div>
      </div>
    </div>
  );
}

function isImageFile(name: string, mime: string): boolean {
  if (mime.toLowerCase().startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name);
}

function isPdfFile(name: string, mime: string): boolean {
  if (mime.toLowerCase() === 'application/pdf') return true;
  return /\.pdf$/i.test(name);
}

function ViewModal({ title, row, onClose }: { title: string; row: Record<string, unknown>; onClose: () => void }) {
  const rawUrl = typeof row.fileUrl === 'string' ? row.fileUrl : '';
  const href = rawUrl
    ? /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : `${(api.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '')}${rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl}`
    : '';
  const fileName = typeof row.fileName === 'string' && row.fileName ? row.fileName : typeof row.title === 'string' ? row.title : 'document';
  const mime = typeof row.mimeType === 'string' ? row.mimeType : '';
  const showImage = href && isImageFile(fileName, mime);
  const showPdf = href && !showImage && isPdfFile(fileName, mime);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="truncate text-sm font-semibold text-slate-700">{fileName}</div>
          <div className="flex items-center gap-1">
            {href && (
              <a
                href={href}
                download={fileName}
                title="Download file"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-lg text-violet-600 transition hover:bg-violet-100 hover:shadow"
              >
                ⬇️
              </a>
            )}
            <button onClick={onClose} title="Close" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
          </div>
        </div>
        {!href && <div className="py-10 text-center text-slate-400">No preview available</div>}
        {showImage && (
          <img src={href} alt={fileName} className="max-h-[70vh] w-full rounded-xl object-contain bg-slate-50" />
        )}
        {showPdf && (
          <iframe src={href} title={fileName} className="h-[70vh] w-full rounded-xl border border-slate-100 bg-slate-50" />
        )}
        {href && !showImage && !showPdf && (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <div className="text-6xl">📄</div>
            <div className="mt-3 text-sm">Preview not available for this file type</div>
          </div>
        )}
      </div>
    </div>
  );
}
