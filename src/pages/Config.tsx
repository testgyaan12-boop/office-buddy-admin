import { useSearchParams } from 'react-router-dom';
import CrudPage from '../components/CrudPage';
import { adConfigsRes, adProvidersRes, customAdsRes, lookupsRes, securitySettingsRes } from '../resources';

type Tab = 'config' | 'ads' | 'providers' | 'lookups' | 'customads';

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'config', label: 'My Config', icon: '⚙️' },
  { key: 'ads', label: 'Ads', icon: '📢' },
  { key: 'providers', label: 'Ad Providers', icon: '🏷️' },
  { key: 'lookups', label: 'Lookups', icon: '📚' },
  { key: 'customads', label: 'Custom Ad', icon: '📣' },
];

export default function Config() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab: Tab = raw === 'ads' || raw === 'providers' || raw === 'lookups' || raw === 'customads' ? raw : 'config';

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Config</h1>
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
      {tab === 'config' && <CrudPage key="config" resource={securitySettingsRes} />}
      {tab === 'ads' && <CrudPage key="ads" resource={adConfigsRes} />}
      {tab === 'providers' && <CrudPage key="providers" resource={adProvidersRes} />}
      {tab === 'lookups' && <CrudPage key="lookups" resource={lookupsRes} />}
      {tab === 'customads' && <CrudPage key="customads" resource={customAdsRes} />}
    </div>
  );
}
