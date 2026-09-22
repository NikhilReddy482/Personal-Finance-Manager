import React, { useState, useEffect } from 'react';
import { Layers, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';

export const SubscriptionsPage: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await api.get('/recurring');
        if (res.success) setSummary(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">Subscriptions & Recurring Commitments</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Automated recurrence detection, monthly burn rate, and annual projections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="fintech-panel rounded-2xl p-6">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Monthly Recurring Burn</div>
          <div className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
            ₹{(summary?.totalMonthlyCommitment || 0).toLocaleString()}
          </div>
        </div>
        <div className="fintech-panel rounded-2xl p-6">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Annualized Commitments</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            ₹{(summary?.totalAnnualCommitment || 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="fintech-panel rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar-footer)]">
          <h3 className="font-semibold text-[var(--text-primary)] text-sm">Detected Recurring Subscriptions & EMIs</h3>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
          {summary?.recurringItems?.map((item: any) => (
            <div key={item.id} className="p-4 flex items-center justify-between text-sm hover:bg-[var(--bg-surface-hover)] transition">
              <div>
                <div className="font-semibold text-[var(--text-primary)]">{item.merchant}</div>
                <div className="text-xs text-[var(--text-muted)]">{item.category} • {item.frequency}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[var(--text-primary)] tabular-nums">₹{item.typicalAmount.toLocaleString()}</div>
                <div className="text-[11px] text-[var(--text-muted)]">Next: {new Date(item.nextExpectedDate).toLocaleDateString('en-IN')}</div>
              </div>
            </div>
          ))}
          {(!summary?.recurringItems || summary?.recurringItems.length === 0) && (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              No recurring commitments detected yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
