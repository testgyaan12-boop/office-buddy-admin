import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from './Layout';
import MiniStatCard from './MiniStatCard';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortMonth(ym: string): string {
  const m = parseInt(ym.slice(5, 7), 10);
  return Number.isNaN(m) ? ym : MONTHS[m - 1];
}

export default function UserGrowthChart({
  data,
  totalUsers,
  newUsers,
}: {
  data: { month: string; count: number }[];
  totalUsers: number;
  newUsers: number;
}) {
  const [range, setRange] = useState<'1' | '3' | '6'>('6');
  const { dark } = useTheme();
  const grid = dark ? '#1e293b' : '#eef2f7';
  const tick = dark ? '#94a3b8' : '#94a3b8';

  const points = data.slice(-parseInt(range, 10)).map((d) => ({ ...d, label: shortMonth(d.month) }));

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_3px_rgba(15,31,61,0.06)] dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-ink dark:text-white">User Growth</h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as '1' | '3' | '6')}
          className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs font-semibold text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          aria-label="Growth range"
        >
          <option value="1">This Month</option>
          <option value="3">Last 3 Months</option>
          <option value="6">Last 6 Months</option>
        </select>
      </div>
      {points.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-muted">No growth data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={points} margin={{ top: 12, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={grid} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} dy={6} />
            <YAxis tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e6ecf5',
                fontSize: 12,
                background: dark ? '#0f172a' : '#fff',
                color: dark ? '#fff' : '#0f1f3d',
              }}
            />
            <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fill="url(#growthFill)" dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 2, stroke: dark ? '#0f172a' : '#fff' }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <MiniStatCard label="Total Users" value={String(totalUsers)} growth="+0%" />
        <MiniStatCard label="New Users (30D)" value={String(newUsers)} growth="+0%" />
        <MiniStatCard label="Growth Rate" value="0%" growth="+0%" />
      </div>
    </div>
  );
}
