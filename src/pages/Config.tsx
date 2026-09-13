import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, Megaphone, Layers, BookOpen, Volume2, Plus, RefreshCw, Search, Settings, CheckCircle, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../api';
import CrudPage from '../components/CrudPage';
import { adConfigsRes, adProvidersRes, customAdsRes, lookupsRes, securitySettingsRes, paymentConfigsRes } from '../resources';

type Tab = 'config' | 'ads' | 'providers' | 'lookups' | 'customads' | 'payments';

const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'config', label: 'Security', icon: <Shield size={15} />, color: 'violet' },
  { key: 'payments', label: 'Payments', icon: <Settings size={15} />, color: 'blue' },
  { key: 'ads', label: 'Ad Configs', icon: <Megaphone size={15} />, color: 'amber' },
  { key: 'providers', label: 'Providers', icon: <Layers size={15} />, color: 'green' },
  { key: 'lookups', label: 'Lookups', icon: <BookOpen size={15} />, color: 'cyan' },
  { key: 'customads', label: 'Custom Ads', icon: <Volume2 size={15} />, color: 'rose' },
];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  config: <Shield size={18} />,
  payments: <Settings size={18} />,
  ads: <Megaphone size={18} />,
  providers: <Layers size={18} />,
  lookups: <BookOpen size={18} />,
  customads: <Volume2 size={18} />,
};

const STATUSES = ['All', 'Active', 'Inactive'];
const RESOURCE_MAP: Record<Tab, typeof securitySettingsRes> = {
  config: securitySettingsRes,
  payments: paymentConfigsRes,
  ads: adConfigsRes,
  providers: adProvidersRes,
  lookups: lookupsRes,
  customads: customAdsRes,
};

interface Stats {
  total: number;
  active: number;
  inactive: number;
  loading: boolean;
}

export default function Config() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab: Tab = tabs.some(t => t.key === raw) ? (raw as Tab) : 'config';

  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, loading: true });
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [q, setQ] = useState('');

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
    setFilter('All');
    setQ('');
  };

  const loadStats = useCallback(async () => {
    setStats(s => ({ ...s, loading: true }));
    try {
      const r = await api.get(RESOURCE_MAP[tab].base);
      const list = Array.isArray(r.data) ? r.data : [];
      const total = list.length;
      const active = list.filter((r: any) => r.isActive === 1 || r.isActive === true).length;
      setStats({ total, active, inactive: total - active, loading: false });
    } catch {
      setStats({ total: 0, active: 0, inactive: 0, loading: false });
    }
  }, [tab]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const statusColor = (s: string) =>
    s === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
    s === 'Inactive' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300';

  const statCards = [
    { label: 'Total', value: stats.total, icon: <Layers size={16} />, bg: 'bg-slate-50 dark:bg-slate-800/60', textColor: 'text-slate-700 dark:text-slate-200' },
    { label: 'Active', value: stats.active, icon: <CheckCircle size={16} />, bg: 'bg-green-50 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-300' },
    { label: 'Inactive', value: stats.inactive, icon: <AlertCircle size={16} />, bg: 'bg-amber-50 dark:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-300' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-ink dark:text-white">
            {TAB_ICONS[tab]} Config
          </h1>
          <p className="mt-1 text-sm text-muted">System configuration & ad management</p>
        </div>
        <button
          onClick={loadStats}
          disabled={stats.loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={14} className={stats.loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tab Bar */}
      <div className="inline-flex rounded-xl bg-white p-1 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? 'bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className={`flex items-center gap-3 rounded-xl border border-slate-100 ${s.bg} px-4 py-3 dark:border-slate-800`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-900 ${s.textColor}`}>
              {s.icon}
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{s.label}</div>
              <div className={`text-lg font-bold ${s.textColor}`}>{stats.loading ? '—' : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search configs..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm font-medium text-ink placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${statusColor(s)} ${filter === s ? 'ring-2 ring-violet-300 dark:ring-violet-600' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* CrudPage with client-side filter */}
      <CrudPage
        key={tab}
        resource={RESOURCE_MAP[tab]}
        hideFilters
        clientFilter={(row) => {
          if (filter === 'Active' && !(row.isActive === 1 || row.isActive === true)) return false;
          if (filter === 'Inactive' && (row.isActive === 1 || row.isActive === true)) return false;
          if (q) {
            const ql = q.toLowerCase();
            const cols = RESOURCE_MAP[tab].columns;
            const match = cols.some((c) => {
              const v = row[c.key];
              return v !== null && v !== undefined && String(v).toLowerCase().includes(ql);
            });
            if (!match) return false;
          }
          return true;
        }}
      />
    </div>
  );
}
