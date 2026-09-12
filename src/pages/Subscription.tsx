import { useSearchParams } from 'react-router-dom';
import CrudPage from '../components/CrudPage';
import { invoicesRes, paymentConfigsRes, plansRes, subscriptionsRes } from '../resources';

type Tab = 'subscriptions' | 'invoices' | 'plans' | 'payments';

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'subscriptions', label: 'My Subscription', icon: '💳' },
  { key: 'invoices', label: 'My Invoice', icon: '🧾' },
  { key: 'plans', label: 'My Plan', icon: '📦' },
  { key: 'payments', label: 'My Payment', icon: '💰' },
];

export default function Subscription() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab: Tab = raw === 'invoices' || raw === 'plans' || raw === 'payments' ? raw : 'subscriptions';

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
      <div className="mb-2 mt-2 inline-flex rounded-xl bg-white p-1 shadow-sm border border-slate-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              tab === t.key ? 'bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab === 'subscriptions' && <CrudPage key="subscriptions" resource={subscriptionsRes} />}
      {tab === 'invoices' && <CrudPage key="invoices" resource={invoicesRes} />}
      {tab === 'plans' && <CrudPage key="plans" resource={plansRes} />}
      {tab === 'payments' && <CrudPage key="payments" resource={paymentConfigsRes} />}
    </div>
  );
}
