import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, errMsg } from '../api';
import StatCard, { fmtBytes, fmtINR } from '../components/StatCard';

interface Stats {
  usersTotal: number;
  admins: number;
  members: number;
  newUsers30d: number;
  usersByMonth: { month: string; count: number }[];
  subscriptionsByPlan: { plan: string; count: number }[];
  revenuePaise: number;
  invoices: number;
  documents: number;
  companies: number;
  reminders: number;
  storageUsedBytes: number;
  storageAllocatedBytes: number;
  lockedAccounts: number;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;
  if (!stats) return <div className="text-slate-500">Loading analytics…</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={String(stats.usersTotal)} icon="👥" />
        <StatCard label="New (30d)" value={String(stats.newUsers30d)} icon="✨" />
        <StatCard label="Revenue" value={fmtINR(stats.revenuePaise)} icon="💰" />
        <StatCard label="Documents" value={String(stats.documents)} icon="📄" />
        <StatCard label="Storage Used" value={fmtBytes(stats.storageUsedBytes)} icon="💾" />
        <StatCard label="Storage Allocated" value={fmtBytes(stats.storageAllocatedBytes)} icon="🗄️" />
        <StatCard label="Locked Accounts" value={String(stats.lockedAccounts)} icon="🔒" />
        <StatCard label="Invoices" value={String(stats.invoices)} icon="🧾" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h2 className="font-bold mb-3">User Growth</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.usersByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
          <h2 className="font-bold mb-3">Subscriptions by Plan</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={stats.subscriptionsByPlan} dataKey="count" nameKey="plan" outerRadius={90} label>
                {stats.subscriptionsByPlan.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
