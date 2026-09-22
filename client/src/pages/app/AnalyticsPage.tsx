import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Store,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Calendar,
  Zap,
  ShoppingBag,
  Utensils,
  Home,
  Tv,
  Car,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Award,
  ShieldCheck,
  Percent,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../../api/client';

const VIBRANT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f43f5e', // Rose
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

import { AccountDateFilterBar, formatDateToISO } from '../../components/common/AccountDateFilterBar';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  const now = new Date();
  const defaultStart = formatDateToISO(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultEnd = formatDateToISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'categories' | 'merchants' | 'cashflow'>('all');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAccounts = async () => {
    try {
      const res: any = await api.get('/accounts');
      if (res.success) {
        setAccounts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load accounts', err);
    }
  };

  const fetchAnalytics = async (opts?: {
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

      const [insightsRes, trendsRes]: any = await Promise.all([
        api.get('/insights/explain-my-finances', { params }),
        api.get('/analytics/trends', { params: trendsParams }),
      ]);

      if (insightsRes.success && insightsRes.data) {
        setData(insightsRes.data);
        if (!selectedPeriod || activePer) {
          setSelectedPeriod(insightsRes.data.period);
        }
      }
      if (trendsRes.success) setTrends(trendsRes.data || []);
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    fetchAnalytics();
  }, []);

  const handleAccountChange = (newAcc: string) => {
    setSelectedAccount(newAcc);
    fetchAnalytics({ account: newAcc, start: startDate, end: endDate });
  };

  const handleDateRangeChange = (start: string, end: string, presetLabel?: string) => {
    setStartDate(start);
    setEndDate(end);
    fetchAnalytics({ start, end, period: presetLabel });
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse p-4 max-w-7xl mx-auto">
        <div className="h-10 bg-slate-900 rounded-2xl w-80"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-2xl border border-slate-800"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-900 rounded-3xl border border-slate-800"></div>
          <div className="h-96 bg-slate-900 rounded-3xl border border-slate-800"></div>
        </div>
      </div>
    );
  }

  const current = data?.current || {};
  const totalExpense = current.totalExpense || 0;
  const totalIncome = current.totalIncome || 0;
  const netSavings = current.savings || 0;
  const savingsRate = current.savingsRate || 0;
  const topCategories = data?.topCategories || [];
  const topMerchants = data?.topMerchants || [];
  const rule503020 = data?.rule503020 || {};
  const txnCount = current.transactionCount || 0;
  const avgTicket = txnCount > 0 ? Math.round(totalExpense / txnCount) : 0;

  // Prepare Merchant Bar Chart Data
  const merchantChartData = topMerchants.slice(0, 7).map((m: any, idx: number) => ({
    merchant: m.merchant || 'Other',
    amount: m.totalAmount || 0,
    count: m.transactionCount || 1,
    avgTicket: m.avgTicket || Math.round(m.totalAmount / (m.transactionCount || 1)),
    category: m.category || 'General',
    color: VIBRANT_COLORS[idx % VIBRANT_COLORS.length],
  }));

  // Prepare Category Pie Data
  const categoryPieData = topCategories.map((c: any, idx: number) => ({
    name: c.category,
    value: c.totalAmount || 0,
    percentage: c.percentage || 0,
    count: c.count || 0,
    subcategories: c.subcategories || [],
    color: VIBRANT_COLORS[idx % VIBRANT_COLORS.length],
  }));

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Universal Bank Account & Date Period Filter Bar */}
      <AccountDateFilterBar
        title="Behavior & Spending Visualizer"
        subtitle="Multi-dimensional analysis of merchant frequency, spend velocity, and category hierarchies"
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
          fetchAnalytics({ account: 'all' });
        }}
      />

      {/* Quick Action Link */}
      <div className="flex items-center justify-end -mt-3">
        <Link
          to="/app/insights"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition"
        >
          <Sparkles className="w-3.5 h-3.5" /> Explain Finances
        </Link>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/80">
        {[
          { id: 'all', label: '📊 All Visualizations', icon: Layers },
          { id: 'categories', label: '🍩 Category Deep-Dive', icon: PieIcon },
          { id: 'merchants', label: '🏪 Merchant Leaderboard', icon: Store },
          { id: 'cashflow', label: '📈 Cash Flow & 50/30/20', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="fintech-panel rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Outflow</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
            ₹{totalExpense.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-semibold text-[10px] tabular-nums">
              {txnCount} Transactions
            </span>
            <span className="text-[11px]">Recorded</span>
          </div>
        </div>

        {/* Active Categories */}
        <div className="fintech-panel rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Categories</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
            {topCategories.length} Categories
          </div>
          <div className="mt-2 text-xs text-slate-400 truncate">
            Top: <strong className="text-blue-300 font-medium">{topCategories[0]?.category || 'None'}</strong>
          </div>
        </div>

        {/* Unique Merchants */}
        <div className="fintech-panel rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Unique Merchants</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
            {topMerchants.length} Outlets
          </div>
          <div className="mt-2 text-xs text-slate-400 truncate">
            Leader: <strong className="text-amber-300 font-medium">{topMerchants[0]?.merchant || 'None'}</strong>
          </div>
        </div>

        {/* Average Ticket Size */}
        <div className="fintech-panel rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Average Ticket</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight tabular-nums">
            ₹{avgTicket.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Per transaction average
          </div>
        </div>
      </div>

      {/* Visual Block 1: Category Dynamics & Donut Matrix */}
      {(activeTab === 'all' || activeTab === 'categories') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Chart */}
          <div className="lg:col-span-5 fintech-panel rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <PieIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Category Distribution</h3>
                    <p className="text-xs text-slate-400">Percentage share of monthly outflow</p>
                  </div>
                </div>
              </div>

              {/* Donut Graphic */}
              <div className="h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      stroke="#0f172a"
                      strokeWidth={3}
                    >
                      {categoryPieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                      }}
                      formatter={(val: any, name: any) => [
                        `₹${Number(val).toLocaleString('en-IN')}`,
                        `${name}`,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Badge */}
                <div className="absolute text-center pointer-events-none">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    ₹{totalExpense >= 100000 ? `${(totalExpense / 100000).toFixed(1)}L` : `${(totalExpense / 1000).toFixed(0)}k`}
                  </div>
                  <div className="text-[10px] text-blue-400 font-semibold">{topCategories.length} Categories</div>
                </div>
              </div>
            </div>

            {/* Micro Color Legend Pills */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
              {categoryPieData.slice(0, 5).map((item: any) => (
                <div
                  key={item.name}
                  className="px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300 font-medium truncate max-w-[90px]">{item.name}</span>
                  <span className="text-slate-400 font-bold">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Hierarchical Breakdown Table with Progress Bars */}
          <div className="lg:col-span-7 fintech-panel rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Category Breakdown & Subcategories</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Detailed spend amounts and sub-allocations</p>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Sorted by Highest Spend</span>
              </div>

              {/* Hierarchical Category Rows */}
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {topCategories.map((cat: any, idx: number) => {
                  const color = VIBRANT_COLORS[idx % VIBRANT_COLORS.length];
                  const isExpanded = expandedCategory === cat.category;
                  const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;

                  return (
                    <div
                      key={cat.category}
                      className="p-3 bg-[#090D17] border border-white/[0.06] rounded-xl hover:border-white/10 transition"
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          ></div>
                          <div>
                            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                              {cat.category}
                              {hasSubcategories && (
                                <span className="text-slate-400 text-[10px]">
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {cat.count || 1} transaction(s) • Avg: ₹{Math.round(cat.totalAmount / (cat.count || 1)).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-semibold text-white tabular-nums">
                            ₹{cat.totalAmount?.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] font-medium" style={{ color }}>
                            {cat.percentage}% of total
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#121929] rounded-full h-1.5 mt-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(8, cat.percentage))}%`,
                            backgroundColor: color,
                          }}
                        ></div>
                      </div>

                      {/* Subcategory Expansion */}
                      {isExpanded && hasSubcategories && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {cat.subcategories.map((sub: any) => (
                            <div
                              key={sub.subcategory}
                              className="p-2 rounded-lg bg-[#0E1424] border border-white/[0.06] flex items-center justify-between text-[11px]"
                            >
                              <span className="text-slate-300 font-medium truncate max-w-[120px]">
                                {sub.subcategory || 'General'}
                              </span>
                              <span className="font-mono text-slate-200 font-semibold tabular-nums">
                                ₹{sub.amount?.toLocaleString('en-IN') || (sub.amountMinor ? (sub.amountMinor / 100).toLocaleString('en-IN') : 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!topCategories.length && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No category transactions found for this period.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Block 2: Merchant Frequency & Leaderboard */}
      {(activeTab === 'all' || activeTab === 'merchants') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Merchant Leaderboard Bar Chart */}
          <div className="lg:col-span-7 fintech-panel rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Top Merchant Spending Volume</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Cumulative expenditure ranked by merchant</p>
                  </div>
                </div>
              </div>

              {/* Colorful Bar Chart */}
              <div className="h-72 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={merchantChartData}
                    margin={{ top: 15, right: 10, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="merchant"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      angle={-15}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Total Spent']}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {merchantChartData.map((entry: any, index: number) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top 4 Merchant Scorecards */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white tracking-tight">Merchant Scorecards</h3>
                <span className="text-xs font-semibold text-slate-400">Top Payees</span>
              </div>

              <div className="space-y-3">
                {topMerchants.slice(0, 4).map((m: any, idx: number) => {
                  const color = VIBRANT_COLORS[idx % VIBRANT_COLORS.length];
                  return (
                    <div
                      key={m.merchant}
                      className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md flex-shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px]">
                            {m.merchant}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              {m.category || 'Expense'}
                            </span>
                            <span>{m.transactionCount || 1} visit(s)</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-black text-white font-mono">
                          ₹{m.totalAmount?.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Avg: ₹{(m.avgTicket || Math.round(m.totalAmount / (m.transactionCount || 1))).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!topMerchants.length && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No merchant records available.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span>Tracked Outlets: {topMerchants.length}</span>
              <Link to="/app/transactions" className="text-blue-400 hover:underline font-semibold">
                View Ledger →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Visual Block 3: 50/30/20 Rule Spectrum & Cash Flow Trajectory */}
      {(activeTab === 'all' || activeTab === 'cashflow') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 50/30/20 Need vs Want Spectrum */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">50/30/20 Budget Spectrum</h3>
                    <p className="text-xs text-slate-400">Needs vs Wants vs Savings Compliance</p>
                  </div>
                </div>
              </div>

              {/* Multi-Colored Spectrum Bar */}
              <div className="space-y-4 my-4">
                {/* Needs */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Needs (Essentials)
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">
                      ₹{(rule503020.needs?.amount || 0).toLocaleString('en-IN')} ({rule503020.needs?.percentage || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (rule503020.needs?.percentage || 0) * 2)}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Target benchmark: 50% of income</div>
                </div>

                {/* Wants */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Wants (Discretionary)
                    </span>
                    <span className="text-amber-400 font-mono font-bold">
                      ₹{(rule503020.wants?.amount || 0).toLocaleString('en-IN')} ({rule503020.wants?.percentage || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (rule503020.wants?.percentage || 0) * 3.33)}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Target benchmark: 30% of income</div>
                </div>

                {/* Savings */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Savings & Wealth
                    </span>
                    <span className="text-blue-400 font-mono font-bold">
                      ₹{(rule503020.savings?.amount || 0).toLocaleString('en-IN')} ({rule503020.savings?.percentage || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (rule503020.savings?.percentage || 0) * 5)}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Target benchmark: ≥ 20% of income</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs text-slate-300">
              💡 <strong>Compliance Verdict:</strong> {rule503020.savings?.percentage >= 20 ? '🟢 Highly disciplined savings profile' : '🟡 Discretionary spending can be optimized'}
            </div>
          </div>

          {/* 6-Month Cash Flow Area Trajectory */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">6-Month Cash Flow Dynamics</h3>
                    <p className="text-xs text-slate-400">Income vs Expenses vs Net Savings Curve</p>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="analyticsExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: '#1e293b',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#analyticsIncomeGrad)"
                      name="Inflow (Income)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#analyticsExpenseGrad)"
                      name="Outflow (Expenses)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
