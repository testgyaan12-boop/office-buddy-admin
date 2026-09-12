import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from '../api';

function normMonth(r: unknown): { month: string; count: number } {
  if (Array.isArray(r)) return { month: String(r[0] ?? ''), count: Number(r[1] ?? 0) };
  const o = (r || {}) as Record<string, unknown>;
  return { month: String(o.month ?? ''), count: Number(o.count ?? 0) };
}

function normPlan(r: unknown): { plan: string; count: number } {
  if (Array.isArray(r)) return { plan: String(r[0] ?? ''), count: Number(r[1] ?? 0) };
  const o = (r || {}) as Record<string, unknown>;
  return { plan: String(o.plan ?? ''), count: Number(o.count ?? 0) };
}

export interface AdminStats {
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

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/admin/stats');
      const d = r.data as AdminStats;
      setStats({
        ...d,
        usersByMonth: Array.isArray(d.usersByMonth) ? d.usersByMonth.map(normMonth) : [],
        subscriptionsByPlan: Array.isArray(d.subscriptionsByPlan) ? d.subscriptionsByPlan.map(normPlan) : [],
      });
      setLoadedAt(new Date());
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, loadedAt, reload: load };
}
