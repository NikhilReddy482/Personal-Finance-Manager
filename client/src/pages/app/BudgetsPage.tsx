import React, { useState, useEffect } from 'react';
import { Target, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';

export const BudgetsPage: React.FC = () => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [amountLimit, setAmountLimit] = useState('');

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/budgets');
      if (res.success) setBudgets(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    try {
      await api.post('/budgets', {
        period,
        category: category || undefined,
        amountLimit: parseFloat(amountLimit),
      });
      setCategory('');
      setAmountLimit('');
      loadBudgets();
    } catch (err) {
      alert('Failed to set budget');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Budget Intelligence & Pace Tracking</h1>
          <p className="text-xs text-slate-400 mt-1">Deterministic pace estimation and month-end spend projections</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="fintech-panel rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. Food & Dining or leave blank for Overall)"
          className="px-3.5 py-2.5 bg-[#090D17] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 flex-1 min-w-[200px]"
        />
        <input
          type="number"
          required
          value={amountLimit}
          onChange={(e) => setAmountLimit(e.target.value)}
          placeholder="Budget Limit (₹)"
          className="px-3.5 py-2.5 bg-[#090D17] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-44 tabular-nums"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Set Budget
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map((b) => (
          <div key={b.id} className="fintech-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">{b.category}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                  b.status === 'HEALTHY'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : b.status === 'EXCEEDED'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {b.status}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-2 tabular-nums">
                <span>Spent: <strong className="text-white">₹{b.spent.toLocaleString()}</strong></span>
                <span>Limit: <strong className="text-slate-300">₹{b.budgetLimit.toLocaleString()}</strong></span>
              </div>
              <div className="w-full h-2 bg-[#090D17] rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    b.status === 'HEALTHY'
                      ? 'bg-emerald-500'
                      : b.status === 'EXCEEDED'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, b.percentageSpent ?? b.percentage ?? 0)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06]">
              <span>Pace: <strong className="text-slate-200 tabular-nums">{b.percentageSpent ?? b.percentage ?? 0}% consumed</strong></span>
              <span className="text-slate-400 tabular-nums">Rem: ₹{Math.max(0, b.budgetLimit - b.spent).toLocaleString()}</span>
            </div>
          </div>
        ))}

        {budgets.length === 0 && !loading && (
          <div className="col-span-full fintech-panel rounded-2xl p-12 text-center text-slate-400">
            <Target className="w-8 h-8 mx-auto text-slate-500 mb-3" />
            <div className="font-semibold text-white text-sm">No active budgets established yet</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Set categorical or overall limits using the form above to track spending velocity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
