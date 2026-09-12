import { Database, FileText, IndianRupee, Lock, Receipt, Server, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../auth';
import { useAdminStats } from '../hooks/useAdminStats';
import DashboardHeader from '../components/DashboardHeader';
import StatCard, { StatSkeleton, fmtBytes, fmtINR } from '../components/StatCard';
import SubscriptionChart, { type PlanSlice } from '../components/SubscriptionChart';
import UserGrowthChart from '../components/UserGrowthChart';

function planSlices(plans: { plan: string; count: number }[]): PlanSlice[] {
  const buckets: Record<string, number> = { 'Free Plan': 0, 'Pro Plan': 0, 'Business Plan': 0 };
  for (const p of plans) {
    const code = (p.plan || '').toUpperCase();
    if (code.includes('YEARLY')) buckets['Business Plan'] += p.count;
    else if (code.includes('MONTHLY') || code.includes('PRO')) buckets['Pro Plan'] += p.count;
    else buckets['Free Plan'] += p.count;
  }
  return [
    { name: 'Free Plan', value: buckets['Free Plan'], color: '#2563eb' },
    { name: 'Pro Plan', value: buckets['Pro Plan'], color: '#7c3aed' },
    { name: 'Business Plan', value: buckets['Business Plan'], color: '#06b6d4' },
  ];
}

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, loading, error, loadedAt, reload } = useAdminStats();

  return (
    <div>
      <DashboardHeader userName={user?.name} loadedAt={loadedAt} />

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span>Failed to load analytics: {error}</span>
          <button onClick={reload} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {loading || !stats ? (
          Array.from({ length: 8 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Total Users" value={String(stats.usersTotal)} description="Active users in your system" icon={Users} pastel="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
            <StatCard label="New (30D)" value={String(stats.newUsers30d)} description="New users in last 30 days" icon={Sparkles} pastel="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" />
            <StatCard label="Revenue" value={fmtINR(stats.revenuePaise)} description="Total revenue (30 days)" icon={IndianRupee} pastel="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" />
            <StatCard label="Documents" value={String(stats.documents)} description="Total uploaded documents" icon={FileText} pastel="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" />
            <StatCard label="Storage Used" value={fmtBytes(stats.storageUsedBytes)} description={`Used of ${fmtBytes(stats.storageAllocatedBytes)}`} icon={Database} pastel="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" />
            <StatCard label="Storage Allocated" value={fmtBytes(stats.storageAllocatedBytes)} description="Total allocated storage" icon={Server} pastel="bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400" />
            <StatCard label="Locked Accounts" value={String(stats.lockedAccounts)} description="Currently locked accounts" icon={Lock} pastel="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" />
            <StatCard label="Invoices" value={String(stats.invoices)} description="Total invoices" icon={Receipt} pastel="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
        {loading || !stats ? (
          <>
            <div className="rounded-2xl border border-line bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="skeleton h-5 w-32 rounded" />
              <div className="skeleton mt-4 h-[240px] rounded-xl" />
            </div>
            <div className="rounded-2xl border border-line bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="skeleton h-5 w-44 rounded" />
              <div className="skeleton mx-auto mt-4 h-[210px] w-[210px] rounded-full" />
            </div>
          </>
        ) : (
          <>
            <UserGrowthChart data={stats.usersByMonth} totalUsers={stats.usersTotal} newUsers={stats.newUsers30d} />
            <SubscriptionChart slices={planSlices(stats.subscriptionsByPlan)} />
          </>
        )}
      </div>
    </div>
  );
}
