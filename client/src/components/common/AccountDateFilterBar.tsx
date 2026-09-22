import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  SlidersHorizontal,
  Clock,
  Sparkles,
  RotateCcw,
  Check,
  X,
  Trash2,
  Plus,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Wallet
} from 'lucide-react';
import { api } from '../../api/client';

export interface AccountOption {
  _id: string;
  name: string;
  institutionName: string;
  accountType?: string;
  maskedIdentifier?: string;
  currency?: string;
  currentBalanceMinor?: number;
}

export interface AccountDateFilterBarProps {
  accounts: AccountOption[];
  selectedAccount: string;
  onAccountChange: (accountId: string) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (startDate: string, endDate: string, presetLabel?: string) => void;
  availableMonths?: string[];
  selectedPeriod?: string;
  onPeriodSelect?: (period: string) => void;
  onAccountsUpdated?: () => void;
  title?: string;
  subtitle?: string;
}

export const formatDateToISO = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AccountDateFilterBar: React.FC<AccountDateFilterBarProps> = ({
  accounts,
  selectedAccount,
  onAccountChange,
  startDate,
  endDate,
  onDateRangeChange,
  availableMonths = [],
  selectedPeriod,
  onPeriodSelect,
  onAccountsUpdated,
  title,
  subtitle,
}) => {
  // Modal Visibility States
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showManageAccountsModal, setShowManageAccountsModal] = useState<boolean>(false);

  // Filter Staging State (committed only upon clicking "Apply Filters")
  const [activePreset, setActivePreset] = useState<string>('this_month');
  const [activePresetLabel, setActivePresetLabel] = useState<string>('This Month');
  const [stagedPreset, setStagedPreset] = useState<string>('this_month');
  const [stagedStart, setStagedStart] = useState<string>(startDate);
  const [stagedEnd, setStagedEnd] = useState<string>(endDate);
  const [stagedMonth, setStagedMonth] = useState<string>(selectedPeriod || '');

  // Account Management State
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<AccountOption | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [accountActionMessage, setAccountActionMessage] = useState<string>('');

  // Create Account State inside manager
  const [showAddAccountForm, setShowAddAccountForm] = useState<boolean>(false);
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccInstitution, setNewAccInstitution] = useState<string>('HDFC Bank');
  const [newAccType, setNewAccType] = useState<string>('SAVINGS');
  const [newAccMasked, setNewAccMasked] = useState<string>('•••• 4921');
  const [creatingAccount, setCreatingAccount] = useState<boolean>(false);

  useEffect(() => {
    setStagedStart(startDate);
    setStagedEnd(endDate);
  }, [startDate, endDate]);

  const openFilterModal = () => {
    setStagedPreset(activePreset);
    setStagedStart(startDate);
    setStagedEnd(endDate);
    setStagedMonth(selectedPeriod || '');
    setShowFilterModal(true);
  };

  const handleSelectPresetInModal = (preset: string) => {
    setStagedPreset(preset);
    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStagedStart(formatDateToISO(start));
      setStagedEnd(formatDateToISO(end));
    } else if (preset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStagedStart(formatDateToISO(start));
      setStagedEnd(formatDateToISO(end));
    } else if (preset === 'last_30_days') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = now;
      setStagedStart(formatDateToISO(start));
      setStagedEnd(formatDateToISO(end));
    } else if (preset === 'last_90_days') {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      end = now;
      setStagedStart(formatDateToISO(start));
      setStagedEnd(formatDateToISO(end));
    } else if (preset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      setStagedStart(formatDateToISO(start));
      setStagedEnd(formatDateToISO(end));
    } else if (preset === 'all_time') {
      start = new Date('2020-01-01');
      end = new Date();
      setStagedStart(formatDateToISO(start));
      setStagedEnd(formatDateToISO(end));
    }
  };

  const handleApplyFilters = () => {
    if (new Date(stagedStart) > new Date(stagedEnd)) {
      alert('From Date cannot be later than To Date.');
      return;
    }

    setActivePreset(stagedPreset);
    let label = 'Custom Range';
    if (stagedPreset === 'this_month') label = 'This Month';
    else if (stagedPreset === 'last_month') label = 'Last Month';
    else if (stagedPreset === 'last_30_days') label = 'Last 30 Days';
    else if (stagedPreset === 'last_90_days') label = 'Last 90 Days';
    else if (stagedPreset === 'this_year') label = 'This Year';
    else if (stagedPreset === 'all_time') label = 'All Time';
    else if (stagedMonth) label = `${stagedMonth} Statement`;

    setActivePresetLabel(label);

    if (stagedMonth && onPeriodSelect) {
      onPeriodSelect(stagedMonth);
    }

    onDateRangeChange(stagedStart, stagedEnd, label);
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startISO = formatDateToISO(start);
    const endISO = formatDateToISO(end);

    setStagedPreset('this_month');
    setStagedStart(startISO);
    setStagedEnd(endISO);
    setStagedMonth('');
    setActivePreset('this_month');
    setActivePresetLabel('This Month');

    if (onPeriodSelect) onPeriodSelect('');
    onDateRangeChange(startISO, endISO, 'This Month');
    setShowFilterModal(false);
  };

  // Delete Bank Account
  const handleDeleteAccountConfirm = async () => {
    if (!accountToDelete) return;
    setDeleteLoading(true);
    setAccountActionMessage('');
    try {
      const res: any = await api.delete(`/accounts/${accountToDelete._id}`);
      if (res.success) {
        setAccountActionMessage(`Account "${accountToDelete.name}" was successfully removed.`);
        if (selectedAccount === accountToDelete._id) {
          onAccountChange('all');
        }
        if (onAccountsUpdated) {
          onAccountsUpdated();
        }
        setAccountToDelete(null);
      }
    } catch (err: any) {
      setAccountActionMessage(err.message || 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Create New Account inside modal
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAccount(true);
    setAccountActionMessage('');
    try {
      const res: any = await api.post('/accounts', {
        name: newAccName || `${newAccInstitution} Account`,
        institutionName: newAccInstitution,
        accountType: newAccType,
        maskedIdentifier: newAccMasked,
        currency: 'INR',
        openingBalanceMinor: 5000000,
      });
      if (res.success) {
        setAccountActionMessage(`Account "${res.data.name}" added successfully!`);
        setShowAddAccountForm(false);
        setNewAccName('');
        if (onAccountsUpdated) {
          onAccountsUpdated();
        }
        onAccountChange(res.data._id);
      }
    } catch (err: any) {
      setAccountActionMessage(err.message || 'Failed to create account.');
    } finally {
      setCreatingAccount(false);
    }
  };

  const selectedAccountObj = accounts.find((a) => a._id === selectedAccount);

  return (
    <>
      <div className="fintech-panel rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Main Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Title & Live Badge */}
          {title && (
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
                  {title}
                </h2>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Live Ledger
                </span>
              </div>
              {subtitle && <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>}
            </div>
          )}

          {/* Right Controls: Bank Account Dropdown + Filter Trigger */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            {/* 1. Bank Account Selector */}
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[220px]">
              <div className="relative w-full">
                <div className="absolute left-3.5 top-2.5 pointer-events-none text-blue-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  value={selectedAccount}
                  onChange={(e) => onAccountChange(e.target.value)}
                  className="w-full bg-[var(--bg-inset)] border border-[var(--border-color)] hover:border-blue-500/50 text-[var(--text-primary)] text-xs font-semibold rounded-xl pl-9 pr-8 py-2.5 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 transition shadow-inner cursor-pointer"
                >
                  <option value="all">Combined (All Accounts - {accounts.length})</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name} ({acc.institutionName} {acc.maskedIdentifier ? `• ${acc.maskedIdentifier}` : ''})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-muted)]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Manage Accounts Button */}
              <button
                onClick={() => {
                  setAccountActionMessage('');
                  setShowManageAccountsModal(true);
                }}
                type="button"
                title="Manage & Delete Bank Accounts"
                className="p-2.5 rounded-xl bg-[var(--bg-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition shadow-sm flex items-center justify-center flex-shrink-0"
              >
                <Wallet className="w-4 h-4 text-blue-500" />
              </button>
            </div>

            {/* 2. Filter Button */}
            <button
              onClick={openFilterModal}
              type="button"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-semibold shadow-md shadow-blue-600/20 border border-blue-400/30 transition-all flex items-center gap-2 flex-shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-200" />
              <span>Filters</span>
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {activePresetLabel}
              </span>
            </button>
          </div>
        </div>

        {/* Selected Filter Summary Pill */}
        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-500" /> Active Scope:
            </span>
            <span className="bg-[var(--bg-inset)] px-2.5 py-1 rounded-lg border border-[var(--border-color)] font-medium text-[var(--text-primary)] tabular-nums text-xs">
              <strong>{startDate}</strong> to <strong>{endDate}</strong>
            </span>
            {selectedAccountObj ? (
              <span className="bg-blue-500/10 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/20 font-medium text-[11px]">
                {selectedAccountObj.name} ({selectedAccountObj.institutionName})
              </span>
            ) : (
              <span className="bg-[var(--bg-inset)] text-[var(--text-primary)] px-2.5 py-1 rounded-lg border border-[var(--border-color)] font-medium text-[11px]">
                Combined (All {accounts.length} Accounts)
              </span>
            )}
          </div>

          <button
            onClick={openFilterModal}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium hidden sm:inline transition"
          >
            Adjust Scope
          </button>
        </div>
      </div>

      {/* 1. FILTER POPUP MODAL */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="fintech-panel rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative overflow-hidden bg-[var(--bg-surface)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">Statement & Date Filter Engine</h3>
                  <p className="text-xs text-[var(--text-muted)]">Select date parameters and click Apply Filters</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Quick Timeframes
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'this_month', label: 'This Month' },
                  { id: 'last_month', label: 'Last Month' },
                  { id: 'last_30_days', label: 'Last 30 Days' },
                  { id: 'last_90_days', label: 'Last 90 Days' },
                  { id: 'this_year', label: 'This Year' },
                  { id: 'all_time', label: 'All Time' },
                ].map((preset) => {
                  const isSelected = stagedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetInModal(preset.id)}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom From & To Date Pickers */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Custom Date Boundary (From & To)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">From Date:</span>
                  <input
                    type="date"
                    value={stagedStart}
                    onChange={(e) => {
                      setStagedStart(e.target.value);
                      setStagedPreset('custom');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">To Date:</span>
                  <input
                    type="date"
                    value={stagedEnd}
                    onChange={(e) => {
                      setStagedEnd(e.target.value);
                      setStagedPreset('custom');
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Statement Month Dropdown (if available) */}
            {availableMonths.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Or Select Historical Statement Month
                </label>
                <select
                  value={stagedMonth}
                  onChange={(e) => {
                    const p = e.target.value;
                    setStagedMonth(p);
                    if (p) {
                      const [yr, mo] = p.split('-');
                      const s = new Date(Date.UTC(parseInt(yr), parseInt(mo) - 1, 1));
                      const ed = new Date(Date.UTC(parseInt(yr), parseInt(mo), 0));
                      setStagedStart(formatDateToISO(s));
                      setStagedEnd(formatDateToISO(ed));
                      setStagedPreset('statement_month');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-semibold rounded-2xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Historical Statement Month --</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      📅 {m} Statement Period
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Footer with Reset and Apply Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold border border-slate-800 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Default
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-black shadow-xl shadow-blue-500/25 border border-blue-400/30 transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MANAGE & DELETE BANK ACCOUNTS MODAL */}
      {/* ========================================================= */}
      {showManageAccountsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Bank Accounts Management</h3>
                  <p className="text-xs text-slate-400">View, add, or delete your linked financial accounts</p>
                </div>
              </div>
              <button
                onClick={() => setShowManageAccountsModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Message */}
            {accountActionMessage && (
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>{accountActionMessage}</span>
              </div>
            )}

            {/* List of Accounts with Delete Option */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {accounts.map((acc) => (
                <div
                  key={acc._id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                      🏛️
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        {acc.name}
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {acc.accountType || 'SAVINGS'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {acc.institutionName} {acc.maskedIdentifier ? `(${acc.maskedIdentifier})` : ''} • Currency: {acc.currency || 'INR'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountToDelete(acc)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 transition flex items-center gap-1.5 text-xs font-bold"
                      title="Delete Bank Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}

              {accounts.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No bank accounts registered. Click Add Account below to link one.
                </div>
              )}
            </div>

            {/* Add Account Inline Form Toggle */}
            {showAddAccountForm ? (
              <form onSubmit={handleCreateAccount} className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-cyan-400" /> Create New Bank Account
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Account Nickname (e.g. HDFC Salary)"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    required
                    className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={newAccInstitution}
                    onChange={(e) => setNewAccInstitution(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Chase Bank">Chase Bank</option>
                    <option value="Citibank">Citibank</option>
                    <option value="Custom Institution">Other Bank / Institution</option>
                  </select>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CHECKING">Checking / Current Account</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="INVESTMENT">Investment / Demat Account</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Masked Number (e.g. •••• 8831)"
                    value={newAccMasked}
                    onChange={(e) => setNewAccMasked(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAccountForm(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAccount}
                    className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> {creatingAccount ? 'Saving...' : 'Save Account'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddAccountForm(true)}
                className="w-full py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 text-cyan-400" /> Link Another Bank Account
              </button>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManageAccountsModal(false)}
                className="px-5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DELETE CONFIRMATION DIALOG */}
      {/* ========================================================= */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="text-lg font-black text-white">Delete Bank Account?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">"{accountToDelete.name}"</strong> ({accountToDelete.institutionName})?
                This will remove the account and purge its associated transactions from your financial ledger.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteAccountConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Deleting...' : 'Yes, Delete Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountDateFilterBar;
