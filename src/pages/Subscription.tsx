import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  CalendarDays,
  CreditCard,
  Database,
  FileText,
  Package,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import CrudPage from '../components/CrudPage';
import { DateRangeButton, ExpandSearch } from '../components/filterControls';
import StatCard, { StatSkeleton, fmtBytes, fmtINR } from '../components/StatCard';
import { api } from '../api';
import { invoicesRes, paymentConfigsRes, plansRes, subscriptionsRes } from '../resources';
import PlansTab from './PlansTab';
import InvoicesTab from './InvoicesTab';

type Tab = 'subscriptions' | 'invoices' | 'plans' | 'payments';

const tabs: { key: Tab; label: string; icon: typeof CreditCard }[] = [
  { key: 'subscriptions', label: 'My Subscription', icon: CreditCard },
  { key: 'invoices', label: 'My Invoice', icon: FileText },
  { key: 'plans', label: 'My Plan', icon: Package },
  { key: 'payments', label: 'My Payment', icon: Wallet },
];

interface SubRow {
  planCode?: string;
  planName?: string;
  status?: string;
  storageLimitBytes?: number;
  expiryDate?: string;
}

interface PlanRow {
  planCode?: string;
  planName?: string;
  period?: string;
  allocatedBytes?: number;
  amount?: number;
  currency?: string;
}

function periodSuffix(period?: string): string {
  const p = (period || '').toUpperCase();
  if (p.includes('MONTH')) return 'month';
  if (p.includes('YEAR')) return 'year';
  if (p.includes('LIFE')) return 'one-time';
  return p ? p.toLowerCase() : '';
}

function expiryInfo(iso?: string): { date: string; rel: string; tone: 'red' | 'amber' | 'muted' } {
  if (!iso) return { date: '—', rel: '', tone: 'muted' };
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return { date: iso.slice(0, 10), rel: '', tone: 'muted' };
  const d = new Date(t);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.ceil((t - startOfToday) / 86400000);
  if (days < 0) return { date, rel: 'Expired', tone: 'red' };
  if (days <= 30) return { date, rel: `Expires in ${days} day${days === 1 ? '' : 's'}`, tone: 'amber' };
  return { date, rel: `Expires in ${days} days`, tone: 'muted' };
}

export default function Subscription() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab: Tab = raw === 'invoices' || raw === 'plans' || raw === 'payments' ? raw : 'subscriptions';
  const [refreshKey, setRefreshKey] = useState(0);
  const [queries, setQueries] = useState<Record<Tab, string>>({ subscriptions: '', invoices: '', plans: '', payments: '' });
  const [summary, setSummary] = useState<{
    loading: boolean;
    total: number;
    current: SubRow | null;
    price: string | null;
    period: string | null;
  }>({ loading: true, total: 0, current: null, price: null, period: null });

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  const setQ = (t: Tab, v: string) =>
    setQueries((prev) => ({ ...prev, [t]: v }));

  const loadSummary = useCallback(async () => {
    setSummary((s) => ({ ...s, loading: true }));
    try {
      const [subsRes, plansApi] = await Promise.all([
        api.get('/admin/subscriptions', { params: { page: 0, size: 100 } }),
        api.get('/admin/plans'),
      ]);
      const list = ((subsRes.data?.content || []) as SubRow[]);
      const total = subsRes.data?.totalElements ?? list.length;
      const current = list.find((s) => (s.status || '').toUpperCase() === 'ACTIVE') || list[0] || null;
      let price: string | null = null;
      let period: string | null = null;
      if (current) {
        const plans = (Array.isArray(plansApi.data) ? plansApi.data : []) as PlanRow[];
        const match = plans.find((p) => p.planCode === current.planCode);
        if (match && match.amount !== null && match.amount !== undefined) {
          const suffix = periodSuffix(match.period);
          price = `${fmtINR(match.amount)}${suffix ? ` / ${suffix}` : ''}`;
          period = match.period || null;
        }
      }
      setSummary({ loading: false, total, current, price, period });
    } catch {
      setSummary({ loading: false, total: 0, current: null, price: null, period: null });
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, refreshKey]);

  const exp = expiryInfo(summary.current?.expiryDate);
  const storageBytes =
    typeof summary.current?.storageLimitBytes === 'number' ? summary.current.storageLimitBytes : null;

  const toolbarTitles: Record<Tab, { title: string; sub: string }> = {
    subscriptions: { title: 'Subscriptions', sub: 'Manage all subscription records' },
    invoices: { title: 'Invoices', sub: 'Issued invoices and payment receipts' },
    plans: { title: 'Plans', sub: 'Pricing plans offered to users' },
    payments: { title: 'Payments', sub: 'Configured payment gateways' },
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
            <Wallet size={22} />
          </span>
          <span>
            <h1 className="text-[22px] font-extrabold tracking-tight text-ink dark:text-white">Subscription</h1>
            <p className="text-[13px] text-muted">Manage your plans, billing, payments and invoices.</p>
          </span>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          title="Refresh"
          aria-label="Refresh"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-sm transition hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="mb-5 inline-flex max-w-full overflow-x-auto rounded-xl bg-white p-1 shadow-sm border border-line dark:bg-slate-900 dark:border-slate-800">
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

      {tab === 'subscriptions' && (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {summary.loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            ) : (
              <>
                <StatCard
                  label="Active Plan"
                  value={summary.current?.planCode || '—'}
                  description={summary.current ? `${summary.total} subscription${summary.total === 1 ? '' : 's'} total` : 'No subscriptions yet'}
                  icon={CreditCard}
                  pastel="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                />
                <StatCard
                  label="Subscription Status"
                  value={summary.current?.status || '—'}
                  description={summary.current ? `Plan ${summary.current.planName || summary.current.planCode}` : 'Nothing to show'}
                  icon={Activity}
                  pastel="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                />
                <StatCard
                  label="Storage"
                  value={storageBytes !== null ? fmtBytes(storageBytes) : '—'}
                  description="Allocated to current plan"
                  icon={Database}
                  pastel="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                />
                <StatCard
                  label="Expiry"
                  value={exp.date}
                  description={exp.rel || 'No expiry set'}
                  icon={CalendarDays}
                  pastel="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
                />
              </>
            )}
          </div>

          {summary.current && (
            <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgba(15,31,61,0.06)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Current Plan</div>
                  <div className="mt-1 text-[26px] font-extrabold tracking-tight text-ink dark:text-white">
                    {summary.current.planCode}
                    {summary.price ? <span className="ml-3 align-middle text-lg font-bold text-brand-600">{summary.price}</span> : null}
                  </div>
                  <div className="mt-0.5 text-sm text-muted">
                    {[summary.current.planName, summary.period ? `${summary.period} subscription` : null].filter(Boolean).join(' • ') || 'Subscription'}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    (summary.current.status || '').toUpperCase() === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      (summary.current.status || '').toUpperCase() === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                  />
                  {summary.current.status || '—'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-line px-5 py-4 sm:px-6 dark:border-slate-800">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Storage</div>
                  <div className="mt-0.5 text-sm font-bold text-ink dark:text-white">
                    {storageBytes !== null ? fmtBytes(storageBytes) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Expiry</div>
                  <div className={`mt-0.5 text-sm font-bold ${exp.tone === 'red' ? 'text-red-600 dark:text-red-400' : exp.tone === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-ink dark:text-white'}`}>
                    {exp.date}
                    {exp.rel ? <span className="ml-2 text-xs font-semibold">{exp.rel}</span> : null}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4 sm:px-6 dark:border-slate-800">
                <button
                  onClick={() => setTab('plans')}
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600/90"
                >
                  View Plan
                </button>
                <button
                  onClick={() => setTab('invoices')}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
                >
                  View Invoices
                </button>
              </div>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-ink dark:text-white">Subscriptions</h2>
              <p className="text-[13px] text-muted">Manage all subscription records</p>
            </div>
            <div className="flex items-center gap-2">
              <ToolbarSearch value={queries.subscriptions} placeholder="Search subscriptions…" onChange={(v) => setQ('subscriptions', v)} />
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Refresh"
                aria-label="Refresh subscriptions"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-sm transition hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>
          <CrudPage
            key={`subscriptions-${refreshKey}`}
            resource={subscriptionsRes}
            hideFilters
            extQ={queries.subscriptions}
            onExtQ={(v) => setQ('subscriptions', v)}
          />
        </>
      )}

      {tab === 'invoices' && <InvoicesTab refreshKey={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} />}

      {tab === 'plans' && <PlansTab refreshKey={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} />}

      {tab === 'payments' && (
        <>
          <SectionToolbar
            title="Payments"
            sub="Configured payment gateways"
            query={queries.payments}
            placeholder="Search…"
            onQuery={(v) => setQ('payments', v)}
            onRefresh={() => setRefreshKey((k) => k + 1)}
            searchable={false}
          />
          <CrudPage
            key={`payments-${refreshKey}`}
            resource={paymentConfigsRes}
            hideFilters
            extQ={queries.payments}
            onExtQ={(v) => setQ('payments', v)}
          />
        </>
      )}
    </div>
  );
}

function ToolbarSearch({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-52 rounded-xl border border-line bg-white py-2.5 pl-4 pr-4 text-sm text-ink shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 sm:w-64 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  );
}

function SectionToolbar({
  title,
  sub,
  query,
  placeholder,
  onQuery,
  onRefresh,
  searchable = true,
}: {
  title: string;
  sub: string;
  query: string;
  placeholder: string;
  onQuery: (v: string) => void;
  onRefresh: () => void;
  searchable?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-[18px] font-bold text-ink dark:text-white">{title}</h2>
        <p className="text-[13px] text-muted">{sub}</p>
      </div>
      <div className="flex items-center gap-2">
        {searchable && <ToolbarSearch value={query} placeholder={placeholder} onChange={onQuery} />}
        <button
          onClick={onRefresh}
          title="Refresh"
          aria-label={`Refresh ${title.toLowerCase()}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-sm transition hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw size={17} />
        </button>
      </div>
    </div>
  );
}
