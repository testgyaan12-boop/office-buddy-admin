import { useCallback, useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { api, errMsg } from '../api';
import { fmtINR } from '../components/StatCard';
import CrudPage from '../components/CrudPage';
import { invoicesRes } from '../resources';

interface Invoice {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  invoiceNo: string;
  planCode: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  issuedAt: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  isActive?: number;
}

const STATUS_PILL: Record<string, { bg: string; text: string; dot: string }> = {
  PAID: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  PENDING: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  FAILED: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  CANCELLED: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
  REFUNDED: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InvoicesTab({ refreshKey, onRefresh }: { refreshKey: number; onRefresh: () => void }) {
  const [preview, setPreview] = useState<Invoice | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold text-ink dark:text-white">Invoices</h2>
          <p className="text-[13px] text-muted">Issued invoices and payment receipts</p>
        </div>
        <button onClick={onRefresh} title="Refresh" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-sm transition hover:border-brand-600 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <RefreshCw size={17} />
        </button>
      </div>

      <CrudPage
        key={`invoices-${refreshKey}`}
        resource={invoicesRes}
        hideFilters
        onView={(row) => setPreview(row as unknown as Invoice)}
      />

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/40">
                    <FileText size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-ink dark:text-white">Invoice Preview</h3>
                    <p className="text-[11px] text-muted">{preview.invoiceNo}</p>
                  </div>
                </div>
                <button onClick={() => setPreview(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-red-100 hover:text-red-600 dark:bg-slate-800">✕</button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Status + Amount */}
              <div className="flex items-center justify-between">
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_PILL[preview.status]?.bg || 'bg-slate-100'} ${STATUS_PILL[preview.status]?.text || 'text-slate-600'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_PILL[preview.status]?.dot || 'bg-slate-400'}`} />
                  {preview.status}
                </div>
                <span className="text-2xl font-extrabold text-ink dark:text-white">{fmtINR(preview.amount)}</span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">User</div>
                  <div className="mt-0.5 text-sm font-semibold text-ink dark:text-white truncate">{preview.userName || '—'}</div>
                  <div className="text-[11px] text-muted truncate">{preview.userEmail || ''}</div>
                </div>
                <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Plan</div>
                  <div className="mt-0.5 text-sm font-semibold text-ink dark:text-white">{preview.planName}</div>
                  <div className="text-[11px] text-muted">{preview.planCode}</div>
                </div>
                <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Issued</div>
                  <div className="mt-0.5 text-sm font-semibold text-ink dark:text-white">{formatDate(preview.issuedAt)}</div>
                </div>
                <div className="rounded-xl bg-slate-50 px-3.5 py-3 dark:bg-slate-800/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Currency</div>
                  <div className="mt-0.5 text-sm font-semibold text-ink dark:text-white">{preview.currency}</div>
                </div>
              </div>

              {/* Payment IDs */}
              {(preview.razorpayOrderId || preview.razorpayPaymentId) && (
                <div className="space-y-2 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Payment Details</div>
                  {preview.razorpayOrderId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Order ID</span>
                      <span className="font-mono text-xs text-ink dark:text-white truncate max-w-[200px]" title={preview.razorpayOrderId}>{preview.razorpayOrderId}</span>
                    </div>
                  )}
                  {preview.razorpayPaymentId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Payment ID</span>
                      <span className="font-mono text-xs text-ink dark:text-white truncate max-w-[200px]" title={preview.razorpayPaymentId}>{preview.razorpayPaymentId}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button onClick={() => setPreview(null)} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-2.5 text-sm font-semibold text-white transition hover:shadow-md">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
