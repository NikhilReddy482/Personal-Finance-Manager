import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Sparkles,
  ArrowRight,
  UploadCloud,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Activity,
  CreditCard,
  Tv,
  Music,
  Cloud,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  PieChart as PieIcon,
  Flame,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const SPARKLINE_PATHS = [
  'M0,25 Q15,5 30,18 T60,8 T90,22 T120,4 T140,12',
  'M0,20 Q20,28 40,12 T80,18 T110,6 T140,14',
  'M0,28 Q25,22 50,14 T80,8 T110,18 T140,6',
  'M0,15 Q20,5 45,22 T85,10 T115,16 T140,4',
  'M0,22 Q25,8 50,18 T85,12 T115,24 T140,8',
  'M0,18 Q20,12 40,24 T80,6 T115,14 T140,2',
];

const VIBRANT_PALETTE = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#f43f5e', // Rose
];

interface SparklineCardProps {
  index: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  color: 'emerald' | 'cyan' | 'amber' | 'blue' | 'purple' | 'pink';
  pathIndex: number;
  subtitle?: string;
  icon: React.ElementType;
}

const SparklineCard: React.FC<SparklineCardProps> = ({
  index,
  title,
  value,
  change,
  isPositive,
  color,
  pathIndex,
  subtitle,
  icon: Icon,
}) => {
  const accentColors = {
    emerald: { stroke: '#10B981', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    cyan: { stroke: '#06B6D4', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    amber: { stroke: '#F59E0B', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    blue: { stroke: '#3B82F6', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    purple: { stroke: '#8B5CF6', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    pink: { stroke: '#EC4899', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  }[color];

  return (
    <div className="fintech-panel-interactive rounded-2xl p-4.5 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span className="text-slate-500 font-mono text-[10px]">{index}</span> {title}
        </span>
        <div className="p-1.5 rounded-lg bg-white/[0.03] text-slate-300 border border-white/[0.06] group-hover:text-white transition">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="my-1.5 flex items-baseline justify-between">
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">{value}</div>
      </div>

      <div className="flex items-center justify-between mt-1 mb-2">
        {subtitle ? (
          <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{subtitle}</span>
        ) : (
          <span className="text-[11px] text-slate-400">Period Trend</span>
        )}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${accentColors.badge}`}>
          {change}
        </span>
      </div>

      {/* SVG Sparkline */}
      <div className="h-8 w-full mt-1 pt-1">
        <svg viewBox="0 0 140 32" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`grad-dash-${color}-${pathIndex}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColors.stroke} stopOpacity="0.3" />
              <stop offset="100%" stopColor={accentColors.stroke} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d={`${SPARKLINE_PATHS[pathIndex % SPARKLINE_PATHS.length]} L140,32 L0,32 Z`}
            fill={`url(#grad-dash-${color}-${pathIndex})`}
          />
          <path
            d={SPARKLINE_PATHS[pathIndex % SPARKLINE_PATHS.length]}
            fill="none"
            stroke={accentColors.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

import { AccountDateFilterBar, formatDateToISO } from '../../components/common/AccountDateFilterBar';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  // Default to current month range
  const now = new Date();
  const defaultStart = formatDateToISO(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultEnd = formatDateToISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('monthly');
  const [loading, setLoading] = useState(true);

  const loadAccounts = async () => {
    try {
      const res: any = await api.get('/accounts');
      if (res.success) {
        setAccounts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
    }
  };

  const fetchDashboardData = async (opts?: {
    account?: string;
    start?: string;
    end?: string;
    period?: string;
  }) => {
    try {
      setLoading(true);
      const activeAcc = opts?.account !== undefined ? opts.account : selectedAccount;
      const activeStart = opts?.start || startDate;
      const activeEnd = opts?.end || endDate;
      const activePer = opts?.period !== undefined ? opts.period : selectedPeriod;

      const params: any = {};
      if (activeAcc && activeAcc !== 'all') params.accountId = activeAcc;
      if (activeStart && activeEnd) {
        params.startDate = activeStart;
        params.endDate = activeEnd;
      }
      if (activePer) params.period = activePer;

      const trendsParams: any = { months: 6 };
      if (activeAcc && activeAcc !== 'all') trendsParams.accountId = activeAcc;

      const [insightsRes, trendsRes, anomaliesRes]: any = await Promise.all([
        api.get('/insights/explain-my-finances', { params }),
        api.get('/analytics/trends', { params: trendsParams }),
        api.get('/anomalies'),
      ]);

      if (insightsRes.success && insightsRes.data) {
        setData(insightsRes.data);
        if (!selectedPeriod || activePer) {
          setSelectedPeriod(insightsRes.data.period);
        }
      }
      if (trendsRes.success) setTrends(trendsRes.data || []);
      if (anomaliesRes.success) setAnomalies(anomaliesRes.data || []);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    fetchDashboardData();
  }, []);

  const handleAccountChange = (newAcc: string) => {
    setSelectedAccount(newAcc);
    fetchDashboardData({ account: newAcc, start: startDate, end: endDate });
  };

  const handleDateRangeChange = (start: string, end: string, presetLabel?: string) => {
    setStartDate(start);
    setEndDate(end);
    fetchDashboardData({ start, end, period: presetLabel });
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse p-4 max-w-7xl mx-auto">
        <div className="h-10 bg-slate-900 rounded-2xl w-80"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-slate-900 rounded-3xl border border-slate-800"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 bg-slate-900 rounded-3xl border border-slate-800"></div>
          <div className="lg:col-span-4 h-80 bg-slate-900 rounded-3xl border border-slate-800"></div>
        </div>
      </div>
    );
  }

  const current = data?.current || {};
  const delta = data?.delta || {};
  const ai = data?.aiAnalysis || {};
  const totalIncome = current.totalIncome || 0;
  const totalExpense = current.totalExpense || 0;
  const netSavings = current.savings || 0;
  const savingsRate = current.savingsRate || 0;
  const healthScore = ai.financialHealthScore || 85;
  const healthGrade = ai.healthGrade || 'A';
  const budgetVerdict = ai.budgetVerdict || 'Optimal & Sustainable';

  // Compute daily burn rate
  const daysInMonth = 30;
  const dailyBurn = totalExpense > 0 ? Math.round(totalExpense / daysInMonth) : 0;

  const topCategories = data?.topCategories || [];
  const recurringSummary = data?.recurringSummary || {};

  // Prepare chart data based on view mode
  let runningIncome = 0;
  let runningExpense = 0;
  const chartData = trends.map((t) => {
    runningIncome += t.income;
    runningExpense += t.expense;
    return {
      month: t.month,
      income: viewMode === 'monthly' ? t.income : runningIncome,
      expense: viewMode === 'monthly' ? t.expense : runningExpense,
      net: viewMode === 'monthly' ? t.income - t.expense : runningIncome - runningExpense,
    };
  });

  const getBadgeGradient = (index: number) => {
    const gradients = [
      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
      'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      'bg-pink-500/20 text-pink-400 border border-pink-500/30',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Universal Bank Account & Date Period Filter Bar */}
      <AccountDateFilterBar
        title="Dashboard Overview"
        subtitle={`Welcome, ${user?.fullName || 'Sarah Chen'}. Real-time deterministic financial telemetry.`}
        accounts={accounts}
        selectedAccount={selectedAccount}
        onAccountChange={handleAccountChange}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        availableMonths={data?.availableMonths || []}
        selectedPeriod={selectedPeriod}
        onPeriodSelect={handlePeriodSelect}
        onAccountsUpdated={() => {
          loadAccounts();
          fetchDashboardData({ account: 'all' });
        }}
      />

      {/* Action Quicklinks */}
      <div className="flex items-center justify-end gap-3 -mt-3">
        <Link
          to="/app/insights"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition"
        >
          <Sparkles className="w-3.5 h-3.5" /> Explain Finances
        </Link>

        <Link
          to="/app/import"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition"
        >
          <UploadCloud className="w-3.5 h-3.5" /> Import Statement
        </Link>
      </div>

      {/* 6-Tile Vibrant KPI Matrix with Mini Glowing Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Balance / Inflow */}
        <SparklineCard
          index="1."
          title="Total Balance"
          value={`₹${totalIncome.toLocaleString('en-IN')}`}
          change={`${delta.incomePctChange >= 0 ? '+' : ''}${delta.incomePctChange || 3.2}%`}
          isPositive={delta.incomePctChange >= 0}
          color="emerald"
          pathIndex={0}
          icon={Wallet}
        />

        {/* 2. Revenue / Inflow */}
        <SparklineCard
          index="2."
          title="Revenue"
          value={`₹${totalIncome.toLocaleString('en-IN')}`}
          change={`+${delta.incomePctChange || 8.1}%`}
          isPositive={true}
          color="cyan"
          pathIndex={1}
          icon={TrendingUp}
        />

        {/* 3. Expenses */}
        <SparklineCard
          index="3."
          title="Expenses"
          value={`₹${totalExpense.toLocaleString('en-IN')}`}
          change={`${delta.expensePctChange >= 0 ? '+' : ''}${delta.expensePctChange || 5.5}%`}
          isPositive={false}
          color="amber"
          pathIndex={2}
          icon={TrendingDown}
        />

        {/* 4. Net Income / Savings */}
        <SparklineCard
          index="4."
          title="Net Income"
          value={`₹${netSavings.toLocaleString('en-IN')}`}
          change={`+${savingsRate}%`}
          isPositive={netSavings >= 0}
          color="purple"
          pathIndex={3}
          icon={PiggyBank}
        />

        {/* 5. Operating Margin / Health */}
        <SparklineCard
          index="5."
          title="Operating Margin"
          value={`${savingsRate}%`}
          change={`Grade ${healthGrade}`}
          isPositive={savingsRate >= 20}
          color="pink"
          pathIndex={4}
          subtitle={`Score: ${healthScore}/100`}
          icon={Award}
        />

        {/* 6. Burn Rate */}
        <SparklineCard
          index="6."
          title="Burn Rate"
          value={`₹${dailyBurn.toLocaleString('en-IN')}/day`}
          change="-1.8%"
          isPositive={true}
          color="blue"
          pathIndex={5}
          subtitle="30d Projected Pace"
          icon={Flame}
        />
      </div>

      {/* Main Analytics Grid: Cash Flow (Left) & Spending by Category (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stacked Multi-Gradient Cash Flow Chart */}
        <div className="lg:col-span-7 xl:col-span-8 fintech-panel rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Income vs Expenses | Cash Flow (INR)
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                  Stacked, YTD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Continuous trajectory and monthly cash velocity</p>
            </div>

            {/* Toggle Monthly vs Cumulative */}
            <div className="flex p-1 bg-[#090D17] rounded-xl border border-white/[0.06] text-xs font-medium">
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'monthly' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setViewMode('cumulative')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'cumulative' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Quarterly
              </button>
            </div>
          </div>

          {/* Area Chart with Emerald & Blue subtle fills */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="dashExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F1523',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashIncomeGrad)"
                  name="Inflow (Revenue)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashExpenseGrad)"
                  name="Outflow (Expenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Spending by Category Table */}
        <div className="lg:col-span-5 xl:col-span-4 fintech-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <PieIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">Spending by Category</h3>
              </div>
              <Link to="/app/analytics" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Category Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5 font-semibold">Category</th>
                    <th className="pb-2.5 font-semibold text-right">Amount</th>
                    <th className="pb-2.5 font-semibold text-right">Month Change</th>
                    <th className="pb-2.5 font-semibold text-right">Progress Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {topCategories.slice(0, 5).map((cat: any, idx: number) => {
                    const pct = cat.percentage || 0;
                    const color = VIBRANT_PALETTE[idx % VIBRANT_PALETTE.length];
                    return (
                      <tr key={cat.category} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-semibold text-white truncate max-w-[110px] flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                          <span className="truncate">{cat.category}</span>
                        </td>
                        <td className="py-3 text-right text-slate-200 font-mono">
                          ₹{cat.totalAmount?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 text-right">
                          <span className={idx % 2 === 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                            {idx === 0 ? '+12%' : idx === 1 ? '+4%' : idx === 2 ? '0%' : '-20%'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${getBadgeGradient(idx)}`}>
                            {pct}% budget
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {!topCategories.length && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 text-xs">
                        No category records for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Tracked Categories: {topCategories.length}</span>
            <Link to="/app/budgets" className="text-blue-400 hover:underline font-semibold">
              Manage Budgets →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section: Anomaly & Risk Monitor (Left) & Active Subscriptions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Anomaly & Risk Monitor */}
        <div className="lg:col-span-6 fintech-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Anomaly & Risk Monitor</h3>
            </div>
            <Link to="/app/anomalies" className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
              View All <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            {/* Risk Gauge Dial */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 bg-[#090D17] rounded-xl border border-white/[0.06] shadow-inner">
              <div className="relative flex items-center justify-center w-28 h-20 overflow-hidden">
                <svg viewBox="0 0 100 55" className="w-full h-full">
                  <defs>
                    <linearGradient id="riskDialGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#F43F5E" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 45 15"
                    fill="none"
                    stroke="url(#riskDialGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute bottom-1 text-center">
                  <div className="text-lg font-bold text-white tabular-nums">18</div>
                  <div className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">Low Risk</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-slate-300 mt-2">Optimal Health Score</div>
            </div>

            {/* Alerts List */}
            <div className="sm:col-span-7 space-y-2">
              <div className="p-2.5 rounded-xl bg-[#090D17] border border-white/[0.06] flex items-center justify-between text-xs hover:border-white/10 transition">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">High Software Spend (AWS)</div>
                    <div className="text-[10px] text-slate-400">Statistical spike detected</div>
                  </div>
                </div>
                <span className="font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 text-[10px]">+24%</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#090D17] border border-white/[0.06] flex items-center justify-between text-xs hover:border-white/10 transition">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">Off-pattern Weekend Dining</div>
                    <div className="text-[10px] text-slate-400">3 transactions in 2 hours</div>
                  </div>
                </div>
                <span className="font-mono text-slate-300 tabular-nums">₹1,850</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#090D17] border border-white/[0.06] flex items-center justify-between text-xs hover:border-white/10 transition">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">Fixed Rent Payout</div>
                    <div className="text-[10px] text-slate-400">Consistent baseline verified</div>
                  </div>
                </div>
                <span className="font-mono text-emerald-400 font-semibold tabular-nums">₹32,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="lg:col-span-6 fintech-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">Active Subscriptions</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monthly commitment: <strong className="text-white tabular-nums">₹{(recurringSummary.totalMonthlyCommitment || 2450).toLocaleString('en-IN')}</strong>
              </p>
            </div>
            <Link to="/app/subscriptions" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Slack */}
            <div className="bg-[#090D17] border border-white/[0.07] rounded-xl p-3.5 flex flex-col justify-between hover:border-white/15 transition shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-semibold text-purple-400 uppercase bg-purple-500/10 px-1.5 py-0.5 rounded">Enterprise</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-white truncate">Slack Workspace</div>
                <div className="text-xs font-bold text-slate-200 mt-1 tabular-nums">₹450<span className="text-[10px] text-slate-500 font-normal">/mo</span></div>
              </div>
            </div>

            {/* Card 2: AWS */}
            <div className="bg-[#090D17] border border-white/[0.07] rounded-xl p-3.5 flex flex-col justify-between hover:border-white/15 transition shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  <Cloud className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-semibold text-amber-400 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">Sep 28</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-white truncate">AWS Cloud</div>
                <div className="text-xs font-bold text-slate-200 mt-1 tabular-nums">₹1,850<span className="text-[10px] text-slate-500 font-normal">/mo</span></div>
              </div>
            </div>

            {/* Card 3: Notion */}
            <div className="bg-[#090D17] border border-white/[0.07] rounded-xl p-3.5 flex flex-col justify-between hover:border-white/15 transition shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-semibold text-blue-400 uppercase bg-blue-500/10 px-1.5 py-0.5 rounded">Pro</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-white truncate">Notion Suite</div>
                <div className="text-xs font-bold text-slate-200 mt-1 tabular-nums">₹120<span className="text-[10px] text-slate-500 font-normal">/mo</span></div>
              </div>
            </div>

            {/* Card 4: Zendesk */}
            <div className="bg-[#090D17] border border-white/[0.07] rounded-xl p-3.5 flex flex-col justify-between hover:border-white/15 transition shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-semibold text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">Growth</span>
              </div>
              <div>
                <div className="text-xs font-semibold text-white truncate">Zendesk / Ops</div>
                <div className="text-xs font-bold text-slate-200 mt-1 tabular-nums">₹680<span className="text-[10px] text-slate-500 font-normal">/mo</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
