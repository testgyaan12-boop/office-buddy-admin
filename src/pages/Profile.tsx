import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from '../api';

interface Profile {
  id?: string;
  name?: string;
  email?: string;
  headline?: string;
  role?: string;
  domain?: string;
  phone?: string;
  address?: string;
  accessRole?: string;
}

const FIELDS: { key: keyof Profile; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'headline', label: 'Headline' },
  { key: 'role', label: 'Job Role' },
  { key: 'domain', label: 'Domain' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
];

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/users/me');
      setProfile(r.data as Profile);
      setError('');
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    if (!profile) return;
    const f: Record<string, string> = {};
    for (const field of FIELDS) {
      const v = profile[field.key];
      f[field.key] = v === null || v === undefined ? '' : String(v);
    }
    setForm(f);
    setSaved('');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put('/users/me', form);
      setProfile(r.data as Profile);
      setEditing(false);
      setSaved('Profile updated successfully');
    } catch (e) {
      alert(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">My Profile</h1>
      {error && <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {saved && <div className="mb-3 rounded-xl bg-green-50 p-3 text-sm text-green-600">{saved}</div>}
      {!profile && !error && <div className="text-slate-500">Loading profile…</div>}
      {profile && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-3xl font-bold text-white">
              {((profile.name || profile.email) || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xl font-bold text-slate-900">{profile.name}</div>
              <div className="truncate text-sm text-slate-500">{profile.email}</div>
            </div>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              {profile.accessRole || 'member'}
            </span>
          </div>
          {!editing ? (
            <>
              <div className="divide-y divide-slate-50">
                {FIELDS.map((f) => (
                  <div key={f.key} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                    <span className="shrink-0 text-slate-500">{f.label}</span>
                    <span className="text-right font-medium text-slate-800">{profile[f.key] || '—'}</span>
                  </div>
                ))}
              </div>
              <button onClick={startEdit} className="mt-5 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">
                ✏️ Edit Profile
              </button>
            </>
          ) : (
            <>
              {FIELDS.map((f) => (
                <label key={f.key} className="mb-3 block text-sm">
                  <span className="mb-1 block text-slate-600">{f.label}</span>
                  <input
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
              ))}
              <div className="mt-4 flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button disabled={saving} onClick={save} className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
