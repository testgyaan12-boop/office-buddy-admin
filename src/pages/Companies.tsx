import { useSearchParams } from 'react-router-dom';
import CrudPage from '../components/CrudPage';
import { companiesRes, documentsRes } from '../resources';

export default function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'documents' ? 'documents' : 'companies';

  const setTab = (t: 'companies' | 'documents') => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
      <div className="mb-2 mt-2 inline-flex rounded-xl bg-white p-1 shadow-sm border border-slate-100">
        <button
          onClick={() => setTab('companies')}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
            tab === 'companies' ? 'bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          🏢 My Company
        </button>
        <button
          onClick={() => setTab('documents')}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
            tab === 'documents' ? 'bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          📄 My Documents
        </button>
      </div>
      {tab === 'companies' ? (
        <CrudPage key="companies" resource={companiesRes} />
      ) : (
        <CrudPage key="documents" resource={documentsRes} />
      )}
    </div>
  );
}
