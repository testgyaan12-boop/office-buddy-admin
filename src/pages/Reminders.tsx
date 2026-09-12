import { useSearchParams } from 'react-router-dom';
import CrudPage from '../components/CrudPage';
import { goalsRes, notesRes, remindersRes, tasksRes } from '../resources';

type Tab = 'reminders' | 'goals' | 'tasks' | 'notes';

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'reminders', label: 'My Reminder', icon: '⏰' },
  { key: 'goals', label: 'Goals', icon: '🎯' },
  { key: 'tasks', label: 'Task', icon: '✅' },
  { key: 'notes', label: 'Notes', icon: '📝' },
];

export default function Reminders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab: Tab = raw === 'goals' || raw === 'tasks' || raw === 'notes' ? raw : 'reminders';

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Reminders</h1>
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
      {tab === 'reminders' && <CrudPage key="reminders" resource={remindersRes} />}
      {tab === 'goals' && <CrudPage key="goals" resource={goalsRes} />}
      {tab === 'tasks' && <CrudPage key="tasks" resource={tasksRes} />}
      {tab === 'notes' && <CrudPage key="notes" resource={notesRes} />}
    </div>
  );
}
