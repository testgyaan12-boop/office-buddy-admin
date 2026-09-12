import { useState } from 'react';

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ExpandSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Search"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm transition hover:border-violet-300 hover:shadow"
      >
        🔍
      </button>
    );
  }
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-64 rounded-xl border border-violet-300 bg-white py-2.5 pl-10 pr-9 text-sm shadow-sm outline-none focus:ring-2 focus:ring-violet-100"
      />
      <button
        onClick={() => {
          onChange('');
          setOpen(false);
        }}
        title="Close search"
        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 hover:bg-slate-200"
      >
        ✕
      </button>
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DateRangeButton({
  from,
  to,
  onApply,
}: {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());
  const [selFrom, setSelFrom] = useState(from);
  const [selTo, setSelTo] = useState(to);
  const active = !!(from || to);

  const openPopup = () => {
    setSelFrom(from);
    setSelTo(to);
    const base = from ? new Date(from + 'T00:00:00') : today;
    setViewY(base.getFullYear());
    setViewM(base.getMonth());
    setOpen(true);
  };

  const move = (delta: number) => {
    const d = new Date(viewY, viewM + delta, 1);
    setViewY(d.getFullYear());
    setViewM(d.getMonth());
  };

  const pick = (iso: string) => {
    if (!selFrom || (selFrom && selTo)) {
      setSelFrom(iso);
      setSelTo('');
    } else if (iso >= selFrom) {
      setSelTo(iso);
    } else {
      setSelFrom(iso);
    }
  };

  const preset = (days: number | null) => {
    if (days === null) {
      setSelFrom('');
      setSelTo('');
      return;
    }
    const end = today;
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    setSelFrom(toISO(start));
    setSelTo(toISO(end));
    setViewY(end.getFullYear());
    setViewM(end.getMonth());
  };

  const apply = () => {
    onApply(selFrom, selFrom && !selTo ? selFrom : selTo);
    setOpen(false);
  };

  const first = new Date(viewY, viewM, 1).getDay();
  const count = new Date(viewY, viewM + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null)];
  for (let d = 1; d <= count; d++) {
    cells.push(`${viewY}-${String(viewM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="relative shrink-0">
      <button
        onClick={openPopup}
        title="Filter by date"
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-lg shadow-sm transition hover:shadow ${
          active ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-100' : 'border-slate-200 bg-white hover:border-violet-300'
        }`}
      >
        📅
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-violet-600 to-blue-500 px-4 py-3 text-white">
              <div className="text-xs uppercase tracking-wide text-white/70">Select range</div>
              <div className="text-sm font-bold">
                {selFrom || '…'} → {selTo || (selFrom ? selFrom : '…')}
              </div>
            </div>
            <div className="flex items-center justify-between px-3 pt-3">
              <button onClick={() => move(-1)} className="rounded-lg px-2 py-1 text-lg hover:bg-slate-100">‹</button>
              <div className="text-sm font-bold text-slate-800">{MONTHS[viewM]} {viewY}</div>
              <button onClick={() => move(1)} className="rounded-lg px-2 py-1 text-lg hover:bg-slate-100">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 px-3 pt-2 text-center text-[11px] font-bold text-slate-400">
              {DAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 p-3 text-center text-sm">
              {cells.map((iso, i) =>
                iso === null ? (
                  <div key={i} />
                ) : (
                  <button
                    key={iso}
                    onClick={() => pick(iso)}
                    className={`h-8 w-8 rounded-full text-[13px] transition ${
                      iso === selFrom || iso === selTo
                        ? 'bg-gradient-to-br from-violet-600 to-blue-500 font-bold text-white shadow'
                        : selFrom && selTo && iso > selFrom && iso < selTo
                          ? 'bg-violet-100 font-semibold text-violet-700'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {parseInt(iso.slice(8), 10)}
                  </button>
                ),
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {[
                { label: 'Today', days: 1 },
                { label: '7D', days: 7 },
                { label: '30D', days: 30 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => preset(p.days)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-violet-100 hover:text-violet-700"
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => preset(null)}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-red-100 hover:text-red-600"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2 border-t border-slate-100 p-3">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={apply} className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-2 text-sm font-semibold text-white">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
