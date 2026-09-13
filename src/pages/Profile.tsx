import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  Camera,
  Check,
  Copy,
  Fingerprint,
  Globe,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { api, errMsg } from '../api';
import { useAuth } from '../auth';

interface Profile {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  headline?: string;
  role?: string;
  domain?: string;
  phone?: string;
  address?: string;
  accessRole?: string;
  isActive?: number;
  isDeleted?: number;
}

const FIELDS: { key: 'name' | 'headline' | 'role' | 'domain' | 'phone' | 'address'; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'headline', label: 'Headline' },
  { key: 'role', label: 'Job Role' },
  { key: 'domain', label: 'Domain' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
];

const COMPLETION_FIELDS: { key: keyof Profile; label: string }[] = [
  { key: 'name', label: 'name' },
  { key: 'email', label: 'email' },
  { key: 'headline', label: 'headline' },
  { key: 'role', label: 'job role' },
  { key: 'domain', label: 'domain' },
  { key: 'phone', label: 'phone number' },
  { key: 'address', label: 'address' },
];

function isFilled(v: unknown): boolean {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

function FieldValue({ value, mutedText = 'Not provided' }: { value: unknown; mutedText?: string }) {
  if (!isFilled(value)) {
    return <span className="text-sm text-slate-400 dark:text-slate-500">{mutedText}</span>;
  }
  return <span className="break-words text-[15px] font-medium text-ink dark:text-white">{String(value)}</span>;
}

export default function Profile() {
  const { logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setFormError('');
    setSaved('');
    setEditing(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setFormError('Name is required');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const r = await api.put('/users/me', form);
      setProfile(r.data as Profile);
      setEditing(false);
      setSaved('Profile updated successfully');
    } catch (e) {
      setFormError(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const copyId = async () => {
    if (!profile?.id) return;
    try {
      await navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Copy failed');
    }
  };

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return;
    setAvatarUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const r = await api.post('/users/me/avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(r.data as Profile);
      setAvatarFailed(false);
      setSaved('Profile photo updated');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setAvatarUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const changePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) {
      setPassError('Current and new password are required');
      return;
    }
    if (passForm.newPassword !== passForm.confirm) {
      setPassError('New passwords do not match');
      return;
    }
    setPassSaving(true);
    setPassError('');
    try {
      await api.put('/users/me/password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      setShowPassword(false);
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
      setSaved('Password changed successfully');
    } catch (e) {
      setPassError(errMsg(e));
    } finally {
      setPassSaving(false);
    }
  };

  const filledCount = profile ? COMPLETION_FIELDS.filter((f) => isFilled(profile[f.key])).length : 0;
  const pct = Math.round((filledCount / COMPLETION_FIELDS.length) * 100);
  const missing = profile ? COMPLETION_FIELDS.filter((f) => !isFilled(profile[f.key])).map((f) => f.label) : [];
  const active = (profile?.isActive ?? 1) === 1;

  return (
    <div className="mx-auto max-w-[1150px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink dark:text-white">My Profile</h1>
          <p className="mt-0.5 text-[13px] text-muted">Manage your personal information and account details.</p>
        </div>
        <button
          onClick={startEdit}
          disabled={!profile}
          className="inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-r from-brand-600 to-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] disabled:opacity-50"
        >
          <Pencil size={15} /> Edit Profile
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error} <button onClick={load} className="ml-2 font-semibold underline">Retry</button>
        </div>
      )}
      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          <Check size={16} /> {saved}
        </div>
      )}

      {!profile && !error ? (
        <div className="rounded-[18px] border border-line bg-white p-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-5">
            <div className="skeleton h-24 w-24 shrink-0 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-6 w-48 rounded" />
              <div className="skeleton mt-2 h-4 w-64 rounded" />
            </div>
          </div>
          <div className="skeleton mt-6 h-3 w-full rounded" />
        </div>
      ) : profile ? (
        <>
          <section className="rounded-[18px] border border-line bg-white p-6 shadow-[0_1px_3px_rgba(15,31,61,0.06)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(15,31,61,0.08)] sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                {profile.avatarUrl && !avatarFailed ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name || 'avatar'}
                    onError={() => setAvatarFailed(true)}
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-violet-100 dark:ring-violet-950"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-purple text-4xl font-bold text-white">
                    {((profile.name || profile.email) || '?')[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarUploading}
                  title="Change photo"
                  aria-label="Change photo"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-200 transition hover:text-brand-600 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                >
                  {avatarUploading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
                  ) : (
                    <Camera size={15} />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload profile photo"
                  onChange={(e) => uploadAvatar(e.target.files?.[0])}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[24px] font-bold tracking-tight text-ink dark:text-white">{profile.name}</div>
                <div className="truncate text-sm text-muted">{profile.email}</div>
                <div className="mt-0.5 text-[13px] text-muted">{profile.headline || profile.role || 'Account administrator'}</div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Profile completeness</span>
                    <span className="text-ink dark:text-white">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-purple transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  {missing.length > 0 && (
                    <p className="mt-1.5 text-xs text-muted">
                      Add your {missing.slice(0, 2).join(' and ')} to complete your profile.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:items-end">
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  {profile.accessRole || 'member'}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    active ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-slate-400'}`} />
                  {active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </section>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
            <section className="rounded-[18px] border border-line bg-white p-6 shadow-[0_1px_3px_rgba(15,31,61,0.06)] sm:p-7 lg:col-span-3 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-[18px] font-semibold text-ink dark:text-white">Personal Information</h2>
              <p className="mt-0.5 text-[13px] text-muted">Your basic account information</p>
              <div className="mt-5 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                <InfoField icon={<UserIcon size={16} />} label="Full Name" value={profile.name} />
                <InfoField icon={<Mail size={16} />} label="Email" value={profile.email} />
                <InfoField icon={<BadgeCheck size={16} />} label="Headline" value={profile.headline} />
                <InfoField icon={<Briefcase size={16} />} label="Job Role" value={profile.role} />
                <InfoField icon={<Phone size={16} />} label="Phone" value={profile.phone} />
                <InfoField icon={<Globe size={16} />} label="Domain" value={profile.domain} />
              </div>
            </section>

            <section className="rounded-[18px] border border-line bg-white p-6 shadow-[0_1px_3px_rgba(15,31,61,0.06)] sm:p-7 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-[18px] font-semibold text-ink dark:text-white">Account Information</h2>
              <p className="mt-0.5 text-[13px] text-muted">System-managed account details</p>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Account Type</div>
                  <div className="mt-1 text-[15px] font-semibold capitalize text-ink dark:text-white">{profile.accessRole || 'member'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Account Status</div>
                  <div className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-slate-400'}`} />
                    {active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted">User ID</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Fingerprint size={15} className="shrink-0 text-slate-400" />
                    <span className="truncate font-mono text-[13px] text-slate-600 dark:text-slate-300" title={profile.id || ''}>
                      {profile.id ? `${profile.id.slice(0, 18)}…` : '—'}
                    </span>
                    {profile.id && (
                      <button
                        onClick={copyId}
                        title="Copy user ID"
                        aria-label="Copy user ID"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-violet-100 hover:text-violet-700 dark:bg-slate-800"
                      >
                        {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                  {copied && <div className="mt-1 text-xs font-semibold text-green-600">Copied!</div>}
                </div>
              </div>
            </section>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
            <section className="rounded-[18px] border border-line bg-white p-6 shadow-[0_1px_3px_rgba(15,31,61,0.06)] sm:p-7 lg:col-span-3 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-[18px] font-semibold text-ink dark:text-white">Contact & Location</h2>
              <div className="mt-5 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                <InfoField icon={<Phone size={16} />} label="Phone" value={profile.phone} />
                <InfoField icon={<Globe size={16} />} label="Domain" value={profile.domain} />
                <div className="sm:col-span-2">
                  <InfoField icon={<MapPin size={16} />} label="Address" value={profile.address} />
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-line bg-white p-6 shadow-[0_1px_3px_rgba(15,31,61,0.06)] sm:p-7 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="flex items-center gap-2 text-[18px] font-semibold text-ink dark:text-white">
                <ShieldCheck size={18} className="text-brand-600" /> Security
              </h2>
              {!showPassword ? (
                <>
                  <div className="mt-5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Password</div>
                    <div className="mt-1 text-[15px] font-semibold tracking-widest text-ink dark:text-white">••••••••</div>
                  </div>
                  <button
                    onClick={() => {
                      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
                      setPassError('');
                      setShowPassword(true);
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-[10px] border border-line px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    <KeyRound size={15} /> Change Password
                  </button>
                </>
              ) : (
                <div className="mt-4">
                  <PassField label="Current Password" value={passForm.currentPassword} onChange={(v) => setPassForm({ ...passForm, currentPassword: v })} />
                  <PassField label="New Password" value={passForm.newPassword} onChange={(v) => setPassForm({ ...passForm, newPassword: v })} />
                  <PassField label="Confirm New Password" value={passForm.confirm} onChange={(v) => setPassForm({ ...passForm, confirm: v })} />
                  {passError && <div className="mb-3 rounded-xl bg-red-50 p-3 text-[13px] font-medium text-red-600 dark:bg-red-950/40 dark:text-red-300">{passError}</div>}
                  <div className="flex gap-2">
                    <button onClick={() => setShowPassword(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                      Cancel
                    </button>
                    <button
                      disabled={passSaving}
                      onClick={changePassword}
                      className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-purple py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {passSaving ? 'Saving…' : 'Update'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line bg-white p-5 shadow-[0_1px_3px_rgba(15,31,61,0.06)] sm:px-7 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="text-[15px] font-semibold text-ink dark:text-white">Account Actions</h2>
              <p className="text-[13px] text-muted">Sign out of the admin panel on this device.</p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className="inline-flex items-center gap-2 rounded-[10px] border border-line px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
            >
              <LogOut size={15} /> Logout
            </button>
          </section>

      {confirmLogout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmLogout(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">
              <LogOut size={24} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Logout?</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You will be signed out of the admin panel on this device.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button onClick={logout} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      ) : null}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="modal-pop max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[18px] bg-white p-6 sm:p-7 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Profile</h2>
                <p className="mt-0.5 text-[13px] text-muted">Update your personal information.</p>
              </div>
              <button onClick={() => setEditing(false)} title="Close" aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <label key={f.key} className={`block text-sm ${f.key === 'address' ? 'sm:col-span-2' : ''}`}>
                  <span className="mb-1 block text-[13px] font-medium text-slate-600 dark:text-slate-300">{f.label}</span>
                  <input
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.label}
                    aria-label={f.label}
                    className="h-12 w-full rounded-[10px] border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
              ))}
            </div>
            {formError && <div className="mt-3 rounded-xl bg-red-50 p-3 text-[13px] font-medium text-red-600 dark:bg-red-950/40 dark:text-red-300">{formError}</div>}
            <div className="mt-5 flex gap-2">
              <button onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={save}
                className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-purple py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition hover:opacity-95 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: unknown }) {
  return (
    <div className="border-b border-slate-50 py-3 last:border-0 dark:border-slate-800">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <div className="mt-1">
        <FieldValue value={value} />
      </div>
    </div>
  );
}

function PassField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block text-[13px] font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-12 w-full rounded-[10px] border border-line bg-white px-3.5 pr-11 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          title={show ? 'Hide password' : 'Show password'}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-lg leading-none text-slate-500 hover:text-slate-800 dark:text-slate-400"
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </label>
  );
}
