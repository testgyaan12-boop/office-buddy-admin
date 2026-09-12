import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, BadgeCheck, Building2, FileText, Package, RefreshCw, Search } from 'lucide-react';
import CrudPage from '../components/CrudPage';
import { DateRangeButton, ExpandSearch } from '../components/filterControls';
import { companiesRes, documentsRes, packDownloadsRes } from '../resources';
import { api } from '../api';

type Tab = 'companies' | 'documents' | 'downloads';

const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: 'companies', label: 'My Company', icon: Building2 },
  { key: 'documents', label: 'My Documents', icon: FileText },
  { key: 'downloads', label: 'Job Pack Download', icon: Package },
];

interface Summary {
  total: number;
  active: number;
  current: number;
  docs: number;
  loading: boolean;
}

function SummaryCard({ icon: Icon, pastel, label, value, sub }: { icon: typeof Building2; pastel: string; label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_3px_rgba(15,31,61,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,31,61,0.10)] dark:border-slate-800 dark:bg-slate-900">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${pastel}`}>
        <Icon size={20} strokeWidth={2.1} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
        <span className="block text-[22px] font-extrabold leading-tight text-ink dark:text-white">{value}</span>
        <span className="block truncate text-xs text-muted">{sub}</span>
      </span>
    </div>
  );
}

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab: Tab = raw === 'documents' || raw === 'downloads' ? raw : 'companies';
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState<Summary>({ total: 0, active: 0, current: 0, docs: 0, loading: true });
  const [filters, setFilters] = useState<Record<Tab, { q: string; from: string; to: string }>>({
    companies: { q: '', from: '', to: '' },
    documents: { q: '', from: '', to: '' },
    downloads: { q: '', from: '', to: '' },
  });

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  const loadSummary = useCallback(async () => {
    setSummary((s) => ({ ...s, loading: true }));
    try {
      const [companies, docs] = await Promise.all([
        api.get('/admin/companies', { params: { page: 0, size: 1000 } }),
        api.get('/admin/documents', { params: { page: 0, size: 1 } }),
      ]);
      const list = (companies.data?.content || []) as { isActive?: number; current?: boolean }[];
      setSummary({
        total: companies.data?.totalElements ?? list.length,
        active: list.filter((c) => c.isActive === 1).length,
        current: list.filter((c) => c.current === true).length,
        docs: docs.data?.totalElements ?? 0,
        loading: false,
      });
    } catch {
      setSummary((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, refreshKey]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Building2 size={22} />
          </span>
          <span>
            <h1 className="text-[22px] font-extrabold tracking-tight text-ink dark:text-white">Companies</h1>
            <p className="text-[13px] text-muted">Manage your companies, documents and job pack resources.</p>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tab !== 'downloads' && (
            <ExpandSearch
              value={filters[tab].q}
              placeholder={tab === 'documents' ? 'Search documents…' : 'Search companies…'}
              onChange={(v) => setFilters((p) => ({ ...p, [tab]: { ...p[tab], q: v } }))}
            />
          )}
          {tab === 'companies' && (
            <DateRangeButton
              from={filters[tab].from}
              to={filters[tab].to}
              onApply={(from, to) => setFilters((p) => ({ ...p, [tab]: { ...p[tab], from, to } }))}
            />
          )}
          {(filters[tab].q || filters[tab].from || filters[tab].to) && (
            <button
              onClick={() => setFilters((p) => ({ ...p, [tab]: { q: '', from: '', to: '' } }))}
              title="Clear all filters"
              aria-label="Clear all filters"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-semibold text-slate-500 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300"
            >
              <Search size={13} />✕
            </button>
          )}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refresh"
            aria-label="Refresh"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-sm transition hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      <div className="mb-2 inline-flex max-w-full overflow-x-auto rounded-xl bg-white p-1 shadow-sm border border-line dark:bg-slate-900 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-[10px] px-4 sm:px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              tab === t.key
                ? 'bg-gradient-to-r from-brand-600 to-brand-purple text-white shadow-[0_4px_14px_rgba(37,99,235,0.35)]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {summary.loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-line bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="skeleton h-11 w-11 rounded-xl" />
              <div className="skeleton mt-3 h-3 w-24 rounded" />
              <div className="skeleton mt-2 h-6 w-16 rounded" />
            </div>
          ))
        ) : (
          <>
            <SummaryCard icon={Building2} pastel="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" label="Total Companies" value={String(summary.total)} sub="Companies in your workspace" />
            <SummaryCard icon={BadgeCheck} pastel="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" label="Active Companies" value={String(summary.active)} sub="Currently active" />
            <SummaryCard icon={Award} pastel="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" label="Current Companies" value={String(summary.current)} sub="Currently assigned" />
            <SummaryCard icon={FileText} pastel="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" label="Documents" value={String(summary.docs)} sub="Total uploaded documents" />
          </>
        )}
      </div>

      {tab === 'companies' ? (
        <CrudPage
          key={`companies-${refreshKey}`}
          resource={companiesRes}
          hideFilters
          extQ={filters.companies.q}
          onExtQ={(v) => setFilters((p) => ({ ...p, companies: { ...p.companies, q: v } }))}
          extFrom={filters.companies.from}
          extTo={filters.companies.to}
          onExtDates={(from, to) => setFilters((p) => ({ ...p, companies: { ...p.companies, from, to } }))}
        />
      ) : tab === 'documents' ? (
        <CrudPage
          key={`documents-${refreshKey}`}
          resource={documentsRes}
          hideFilters
          extQ={filters.documents.q}
          onExtQ={(v) => setFilters((p) => ({ ...p, documents: { ...p.documents, q: v } }))}
        />
      ) : (
        <CrudPage key={`downloads-${refreshKey}`} resource={packDownloadsRes} />
      )}
    </div>
  );
}
