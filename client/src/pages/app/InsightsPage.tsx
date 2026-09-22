import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Lightbulb,
  Building2,
  RefreshCw,
  MessageSquare,
  Award,
  Wallet,
  Target
} from 'lucide-react';
import { api } from '../../api/client';

export const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'ai' | 'deterministic'>('ai');

  const fetchInsights = async (month?: string) => {
    try {
      if (!data) setLoading(true);
      else setRefreshing(true);
      
      const queryParam = month ? `?period=${month}` : '';
      const res: any = await api.get(`/insights/explain-my-finances${queryParam}`);
      if (res.success && res.data) {
        setData(res.data);
        if (!selectedMonth || month) {
          setSelectedMonth(res.data.period);
        }
      }
    } catch (err) {
      console.error('Failed to load financial insights', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    fetchInsights(newMonth);
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '₹0';
    return `₹${Math.abs(val).toLocaleString('en-IN')}`;
  };

  const formatMonthLabel = (m: string) => {
    if (!m) return '';
    try {
      const [year, month] = m.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch {
      return m;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-10 bg-slate-800/60 rounded-xl w-1/3"></div>
        <div className="h-44 bg-slate-800/40 rounded-3xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/40 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-800/40 rounded-2xl"></div>
          <div className="h-64 bg-slate-800/40 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const ai = data?.aiAnalysis;
  const current = data?.current || {};
  const delta = data?.delta || {};
  const rule = data?.rule503020;
  const availableMonths = data?.availableMonths || [];

  const healthScore = ai?.financialHealthScore ?? 75;
  const healthGrade = ai?.healthGrade ?? 'A';
  const budgetVerdict = ai?.budgetVerdict ?? 'Cash Flow Positive';

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'from-emerald-500 to-teal-400 text-emerald-300 border-emerald-500/30';
    if (grade.startsWith('B')) return 'from-blue-500 to-cyan-400 text-blue-300 border-blue-500/30';
    if (grade.startsWith('C')) return 'from-amber-500 to-yellow-400 text-amber-300 border-amber-500/30';
    return 'from-rose-500 to-orange-400 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Autonomous Financial Intelligence Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Explain My Finances
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Grounded behavioral analysis, macroeconomic metrics, and actionable wealth guidance
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm rounded-xl pl-9 pr-8 py-2.5 font-medium hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer w-full sm:w-48 appearance-none"
            >
              {availableMonths.length > 0 ? (
                availableMonths.map((m: string) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {formatMonthLabel(m)}
                  </option>
                ))
              ) : (
                <option value={selectedMonth}>{formatMonthLabel(selectedMonth) || 'Current Period'}</option>
              )}
            </select>
          </div>

          <button
            onClick={() => fetchInsights(selectedMonth)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Intelligence"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Executive Summary & Health Score Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-blue-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-400" /> Period: {formatMonthLabel(data?.period)}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> {budgetVerdict}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-400" /> Executive Financial Briefing
              </h2>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {viewMode === 'ai' ? ai?.executiveSummary || data?.narrative : data?.narrative}
              </p>
            </div>

            {/* Toggle & Action */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setViewMode('ai')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'ai' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AI Synthesis
                </button>
                <button
                  onClick={() => setViewMode('deterministic')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'deterministic' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Algorithmic Facts
                </button>
              </div>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-ai-assistant', { detail: { prompt: 'Can you analyze my financial health and give actionable optimization advice?' } }));
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Discuss with Financial AI Assistant
              </button>
            </div>
          </div>

          {/* Health Score Box */}
          <div className="flex sm:flex-row lg:flex-col items-center justify-center gap-4 bg-slate-950/70 border border-slate-800/80 p-5 rounded-2xl min-w-[220px] w-full lg:w-auto shadow-inner">
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-black text-white">{healthScore}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Score / 100</div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 mb-1">
                <Award className="w-4 h-4 text-amber-400" /> Health Rating
              </div>
              <span className={`inline-block px-3 py-1 rounded-lg text-sm font-extrabold border bg-gradient-to-r ${getGradeColor(healthGrade)}`}>
                Grade {healthGrade}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Top-line KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Inflow</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatCurrency(current.totalIncome)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            {delta.incomeDiff >= 0 ? (
              <span className="text-emerald-400 flex items-center font-semibold">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{delta.incomePctChange}%
              </span>
            ) : (
              <span className="text-rose-400 flex items-center font-semibold">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {delta.incomePctChange}%
              </span>
            )}
            <span className="text-slate-500 ml-1">vs prev month</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Outflow</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatCurrency(current.totalExpense)}</div>
          <div className="flex items-center gap-1 mt-2 text-xs">
            {delta.expenseDiff > 0 ? (
              <span className="text-rose-400 flex items-center font-semibold">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{delta.expensePctChange}%
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center font-semibold">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {delta.expensePctChange}%
              </span>
            )}
            <span className="text-slate-500 ml-1">vs prev month</span>
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Net Cash Flow</span>
            <div className={`p-2 rounded-xl ${current.savings >= 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${current.savings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {current.savings < 0 ? '-' : ''}{formatCurrency(current.savings)}
          </div>
          <div className="mt-2 text-xs text-slate-400 font-medium">
            {current.savings >= 0 ? 'Retained capital' : 'Net monthly deficit'}
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Savings Rate</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{current.savingsRate ?? 0}%</div>
          <div className="mt-2 text-xs font-semibold">
            {current.savingsRate >= 20 ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Above 20% Goal
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Below 20% Benchmark
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 50/30/20 Rule Analysis Section */}
      {rule && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-400" /> 50/30/20 Budget Allocation Model
              </h3>
              <p className="text-slate-400 text-xs">Standard wealth distribution of Needs (50%), Wants (30%), and Savings (20%)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Needs */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Essential Needs</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold">
                  Target: {rule.needs.targetPercentage}%
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{formatCurrency(rule.needs.amount)}</div>
              <div className="text-xs text-slate-400 mb-3">{rule.needs.percentage}% of total income</div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    rule.needs.percentage <= 50 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, rule.needs.percentage)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Housing, utilities, groceries, healthcare & debt</p>
            </div>

            {/* Wants */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Discretionary Wants</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold">
                  Target: {rule.wants.targetPercentage}%
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{formatCurrency(rule.wants.amount)}</div>
              <div className="text-xs text-slate-400 mb-3">{rule.wants.percentage}% of total income</div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    rule.wants.percentage <= 30 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, rule.wants.percentage)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Dining, entertainment, shopping & subscriptions</p>
            </div>

            {/* Savings */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Invested & Saved</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                  Target: {rule.savings.targetPercentage}%
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-400 mb-1">{formatCurrency(rule.savings.amount)}</div>
              <div className="text-xs text-slate-400 mb-3">{rule.savings.percentage}% of total income</div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.max(0, rule.savings.percentage))}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Surplus capital, emergency buffer & investments</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Spending Drivers & Payees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Categories */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-blue-400" /> Spending Distribution by Category
          </h3>
          <p className="text-slate-400 text-xs mb-4">Top outward expenditure flows for {formatMonthLabel(data?.period)}</p>

          <div className="space-y-3.5">
            {data?.topCategories && data.topCategories.length > 0 ? (
              data.topCategories.map((cat: any, idx: number) => (
                <div key={idx} className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-white">{cat.category}</span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(cat.totalAmount)}{' '}
                      <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No category expense transactions in this period.</div>
            )}
          </div>
        </div>

        {/* Top Payees & Merchants */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" /> Top Payees & Merchants
          </h3>
          <p className="text-slate-400 text-xs mb-4">Largest recipient entities during this period</p>

          <div className="space-y-2.5">
            {data?.topMerchants && data.topMerchants.length > 0 ? (
              data.topMerchants.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-white truncate max-w-[180px] sm:max-w-[220px]">
                        {m.merchant || 'Unknown Payee'}
                      </div>
                      <div className="text-[11px] text-slate-400">{m.count} transaction(s)</div>
                    </div>
                  </div>
                  <div className="font-bold text-slate-200">{formatCurrency(m.totalAmount)}</div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No merchant data recorded in this period.</div>
            )}
          </div>
        </div>
      </div>

      {/* AI Key Takeaways & Actionable Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Takeaways */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Financial Takeaways & Discoveries
          </h3>
          <p className="text-slate-400 text-xs mb-4">Core macroeconomic conclusions for this period</p>

          <div className="space-y-3">
            {ai?.keyTakeaways && ai.keyTakeaways.length > 0 ? (
              ai.keyTakeaways.map((point: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-slate-300 leading-relaxed">{point}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500">No takeaways available.</div>
            )}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-md">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" /> Actionable Wealth Directives
          </h3>
          <p className="text-slate-400 text-xs mb-4">Concrete steps to optimize cash flow and compound savings</p>

          <div className="space-y-3">
            {ai?.actionableRecommendations && ai.actionableRecommendations.length > 0 ? (
              ai.actionableRecommendations.map((rec: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 mt-0.5">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-slate-300 leading-relaxed">{rec}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500">No recommendations generated.</div>
            )}
          </div>
        </div>
      </div>

      {/* Algorithmic Signals & Insights */}
      {data?.structuredInsights && data.structuredInsights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Algorithmic Rules & Signal Flags
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.structuredInsights.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  item.severity === 'WARNING'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    : item.severity === 'POSITIVE'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-white mb-1.5">
                  {item.severity === 'WARNING' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  ) : item.severity === 'POSITIVE' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  {item.title}
                </div>
                <div className="text-[11px] leading-relaxed opacity-90">{item.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
