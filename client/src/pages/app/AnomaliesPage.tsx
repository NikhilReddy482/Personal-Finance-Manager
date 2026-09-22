import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, AlertTriangle } from 'lucide-react';
import { api } from '../../api/client';

export const AnomaliesPage: React.FC = () => {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/anomalies');
      if (res.success) setAnomalies(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, []);

  const handleDismiss = async (id: string) => {
    await api.patch(`/anomalies/${id}/dismiss`);
    setAnomalies((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">Unusual Transaction & Anomaly Detection</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Statistical deviation and Isolation Forest flagging with explainable signals</p>
      </div>

      {anomalies.length === 0 && !loading ? (
        <div className="fintech-panel rounded-2xl p-12 text-center">
          <ShieldAlert className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">No Anomalies Found</h3>
          <p className="text-[var(--text-muted)] text-xs">All observed spending aligns with historical behavior benchmarks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {anomalies.map((a) => (
            <div key={a.id} className="fintech-panel rounded-2xl p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-[var(--text-primary)] text-sm">{a.description}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                      Score: {a.anomalyScore}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 mb-2">{a.category} • {new Date(a.date).toLocaleDateString('en-IN')}</p>
                  <div className="p-2.5 bg-[var(--bg-inset)] rounded-xl text-xs text-amber-700 dark:text-amber-300/90 border border-amber-500/20">
                    {a.anomalyReason}
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-3 flex-shrink-0">
                <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">₹{a.amount.toLocaleString()}</div>
                <button
                  onClick={() => handleDismiss(a.id)}
                  className="px-3 py-1.5 bg-[var(--bg-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-medium rounded-lg flex items-center gap-1 transition shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnomaliesPage;
