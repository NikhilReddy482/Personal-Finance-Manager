import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  Filter,
  Download,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { api } from '../../api/client';
import { AccountDateFilterBar, formatDateToISO } from '../../components/common/AccountDateFilterBar';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);

  // Bank Account & Date Range Filter State
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  const now = new Date();
  const defaultStart = formatDateToISO(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultEnd = formatDateToISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);

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

  const fetchTransactions = async (page = 1, opts?: {
    account?: string;
    start?: string;
    end?: string;
    type?: string;
    searchQuery?: string;
  }) => {
    setLoading(true);
    try {
      const activeAcc = opts?.account !== undefined ? opts.account : selectedAccount;
      const activeStart = opts?.start || startDate;
      const activeEnd = opts?.end || endDate;
      const activeType = opts?.type !== undefined ? opts.type : selectedType;
      const activeSearch = opts?.searchQuery !== undefined ? opts.searchQuery : search;

      const params: any = { page, limit: 25 };
      if (activeSearch) params.search = activeSearch;
      if (activeType) params.transactionType = activeType;
      if (activeAcc && activeAcc !== 'all') params.accountId = activeAcc;
      if (activeStart && activeEnd) {
        params.startDate = activeStart;
        params.endDate = activeEnd;
      }

      const res: any = await api.get('/transactions', { params });
      if (res.success) {
        setTransactions(res.data.transactions);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    fetchTransactions(1);
  }, []);

  const handleAccountChange = (newAcc: string) => {
    setSelectedAccount(newAcc);
    fetchTransactions(1, { account: newAcc });
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    fetchTransactions(1, { start, end });
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    fetchTransactions(1, { type });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(1, { searchQuery: search });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Unified Bank Account & Date Period HUD */}
      <AccountDateFilterBar
        title="Transactions Ledger"
        subtitle="Review, filter, and audit canonical normalized financial records with account isolation"
        accounts={accounts}
        selectedAccount={selectedAccount}
        onAccountChange={handleAccountChange}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        onAccountsUpdated={() => {
          loadAccounts();
          fetchTransactions(1, { account: 'all' });
        }}
      />

      {/* Search & Transaction Type Sub-Filter Bar */}
      <div className="fintech-panel rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, merchant, or reference..."
            className="w-full pl-10 pr-4 py-2 bg-[#090D17] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-400"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="bg-[#090D17] border border-white/10 text-slate-300 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">All Flow Types</option>
              <option value="EXPENSE">Expenses Only</option>
              <option value="INCOME">Incomes Only</option>
              <option value="INVESTMENT">Investments Only</option>
              <option value="DEBT_PAYMENT">Debt Payments</option>
              <option value="TRANSFER">Internal Transfers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="fintech-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#090D17] text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/[0.07]">
              <tr>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Account</th>
                <th className="py-3.5 px-5">Description & Payee</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Engine Confidence</th>
                <th className="py-3.5 px-5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {transactions.map((tx) => {
                const isIncome = tx.transactionType === 'INCOME';
                const isInvestment = tx.transactionType === 'INVESTMENT';
                const isAnomaly = tx.isAnomaly;

                return (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition group">
                    {/* Date */}
                    <td className="py-3 px-5 text-xs font-medium text-slate-400 whitespace-nowrap tabular-nums">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Bank Account */}
                    <td className="py-3 px-5 whitespace-nowrap">
                      {tx.account ? (
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-md bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                            <Building2 className="w-3 h-3 text-blue-400" />
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-slate-200">{tx.account.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {tx.account.institutionName} {tx.account.maskedIdentifier ? `(${tx.account.maskedIdentifier})` : ''}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Primary Account</span>
                      )}
                    </td>

                    {/* Description & Payee */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-xs truncate max-w-sm">
                          {tx.description}
                        </span>
                        {isAnomaly && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-2.5 h-2.5" /> Anomaly
                          </span>
                        )}
                      </div>
                      {tx.merchant && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          Payee: <span className="text-slate-300 font-medium">{tx.merchant}</span>
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-5">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                        {tx.category}
                      </span>
                    </td>

                    {/* Method & Confidence */}
                    <td className="py-3 px-5 text-xs text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                          {tx.classificationMethod || 'AUTO'}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 font-medium">
                          {Math.round((tx.classificationConfidence || 0.85) * 100)}%
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <div
                        className={`text-xs font-semibold tabular-nums ${
                          isIncome
                            ? 'text-emerald-400'
                            : isInvestment
                            ? 'text-blue-400'
                            : 'text-white'
                        }`}
                      >
                        {isIncome ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500 text-sm">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-[#090D17] border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-slate-300">No transactions match your filters</div>
                      <p className="text-xs text-slate-400">
                        Try adjusting your date range, flow type, or search keywords.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 bg-[#090D17] border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white tabular-nums">{(pagination.page - 1) * 25 + 1}</strong> -{' '}
            <strong className="text-white tabular-nums">{Math.min(pagination.page * 25, pagination.total)}</strong> of{' '}
            <strong className="text-white tabular-nums">{pagination.total}</strong> verified records
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchTransactions(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0E1424] hover:bg-[#141C2E] text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="px-2 text-slate-400 font-mono text-[11px]">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchTransactions(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0E1424] hover:bg-[#141C2E] text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 font-medium"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
