import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Lightbulb } from 'lucide-react';

export interface PlanSlice {
  name: string;
  value: number;
  color: string;
}

export default function SubscriptionChart({ slices }: { slices: PlanSlice[] }) {
  const total = slices.reduce((a, s) => a + s.value, 0);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(15,31,61,0.06)] dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-1 text-[15px] font-bold text-ink dark:text-white">Subscriptions by Plan</h2>
      {total === 0 ? (
        <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted">No subscriptions yet</div>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} strokeWidth={0}>
                  {slices.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e6ecf5', fontSize: 12 }}
                  formatter={(value) => [value, 'Subscriptions']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-ink dark:text-white">{total}</span>
              <span className="text-[11px] font-medium text-muted">Total<br />Subscriptions</span>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            {slices.map((s) => {
              const pct = total ? ((s.value / total) * 100).toFixed(1) : '0.0';
              return (
                <div key={s.name} className="flex items-center gap-2.5 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="flex-1 font-medium text-slate-600 dark:text-slate-300">{s.name}</span>
                  <span className="font-bold text-ink dark:text-white">{s.value}</span>
                  <span className="w-12 text-right text-xs text-muted">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-brand-600/[0.06] p-3.5 dark:bg-brand-600/10">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600/10 text-brand-600">
          <Lightbulb size={17} />
        </span>
        <span className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <b className="text-ink dark:text-white">Great! Your subscription count is stable.</b>
          <br />
          Keep growing your user base to increase revenue. →
        </span>
      </div>
    </div>
  );
}
