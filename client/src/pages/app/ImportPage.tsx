import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Download,
  Building2,
  Sparkles,
  Zap,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  Filter,
  RefreshCw,
  Clock,
  CheckCheck
} from 'lucide-react';
import { api } from '../../api/client';

const STANDARD_CATEGORIES = [
  'Food & Dining',
  'Shopping & Retail',
  'Housing & Rent',
  'Utilities & Bills',
  'Transportation',
  'Digital & Subscriptions',
  'Income',
  'Investments',
  'Transfers & Payments',
  'Cash & ATM',
  'Healthcare',
  'Education',
  'General Expenses',
];

export const ImportPage: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [autoConfirming, setAutoConfirming] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Processing Progress State
  const [processingStep, setProcessingStep] = useState(1);
  const [progressPercent, setProgressPercent] = useState(15);
  const [estimatedSeconds, setEstimatedSeconds] = useState(1.8);

  // Preview Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REQUIRES_REVIEW' | 'WARNING'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // New Account Modal State
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccInstitution, setNewAccInstitution] = useState('HDFC Bank');
  const [newAccType, setNewAccType] = useState('SAVINGS');
  const [newAccMasked, setNewAccMasked] = useState('•••• 4921');
  const [creatingAccount, setCreatingAccount] = useState(false);

  const navigate = useNavigate();

  const loadAccounts = async () => {
    try {
      const res: any = await api.get('/accounts');
      if (res.success && res.data.length > 0) {
        setAccounts(res.data);
        setSelectedAccount((prev) => prev || res.data[0]._id);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Animated processing timer
  useEffect(() => {
    let interval: any;
    if (uploading) {
      setProgressPercent(15);
      setProcessingStep(1);
      setEstimatedSeconds(2.0);

      interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev < 40) {
            setProcessingStep(2);
            setEstimatedSeconds(1.4);
            return prev + 12;
          }
          if (prev < 75) {
            setProcessingStep(3);
            setEstimatedSeconds(0.8);
            return prev + 10;
          }
          if (prev < 92) {
            setProcessingStep(4);
            setEstimatedSeconds(0.3);
            return prev + 4;
          }
          return prev;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [uploading]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAccount(true);
    setError('');
    try {
      const res: any = await api.post('/accounts', {
        name: newAccName || `${newAccInstitution} Primary Account`,
        institutionName: newAccInstitution,
        accountType: newAccType,
        maskedIdentifier: newAccMasked,
        currency: 'INR',
        openingBalanceMinor: 5000000,
      });
      if (res.success) {
        await loadAccounts();
        setSelectedAccount(res.data._id);
        setShowCreateAccount(false);
        setNewAccName('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleAutoCreateDefaultAccount = async () => {
    setCreatingAccount(true);
    try {
      const res: any = await api.post('/accounts', {
        name: 'Primary Savings Account',
        institutionName: 'HDFC Bank',
        accountType: 'SAVINGS',
        maskedIdentifier: '•••• 8831',
        currency: 'INR',
        openingBalanceMinor: 10000000,
      });
      if (res.success) {
        await loadAccounts();
        setSelectedAccount(res.data._id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to auto-create account');
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a bank statement file (CSV, XLSX, or PDF).');
      return;
    }

    if (!selectedAccount) {
      setError('Please select or create a destination account first.');
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('statement', file);
    formData.append('accountId', selectedAccount);

    try {
      const res: any = await api.post('/imports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.success) {
        setProgressPercent(100);
        setEstimatedSeconds(0);
        setPreviewData(res.data);
      }
    } catch (err: any) {
      setError(
        err.message ||
          'Failed to parse statement. Please ensure the file contains valid tabular transaction records.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async (autoCategorizeAll: boolean = false) => {
    if (!previewData?.batchId) return;
    if (autoCategorizeAll) setAutoConfirming(true);
    else setConfirming(true);

    try {
      await api.post(`/imports/${previewData.batchId}/confirm`, {
        autoCategorizeAll,
        updatedRows: previewData.preview,
      });
      navigate('/app/transactions');
    } catch (err: any) {
      setError(err.message || 'Failed to confirm import.');
    } finally {
      setConfirming(false);
      setAutoConfirming(false);
    }
  };

  const handleCategoryChange = (index: number, newCategory: string) => {
    if (!previewData?.preview) return;
    const updated = [...previewData.preview];
    updated[index] = {
      ...updated[index],
      category: newCategory,
      reviewStatus: 'VALID',
    };
    setPreviewData({
      ...previewData,
      preview: updated,
    });
  };

  const handleSampleDownload = () => {
    const csvContent = `Date,Narration,Withdrawal,Deposit,Balance
2026-09-01,SALARY CREDIT ACME TECH,,,125000.00,125000.00
2026-09-03,UPI-SWIGGY-ORDER-1982,580.00,,124420.00
2026-09-05,RENT TO LANDLORD BANGALORE,32000.00,,92420.00
2026-09-08,BLINKIT QUICK COMMERCE,1420.00,,91000.00
2026-09-10,NETFLIX SUBSCRIPTION,649.00,,90351.00
2026-09-12,UBER TRIP TO AIRPORT,420.00,,89931.00
2026-09-15,ZERODHA BROKING EQUITY SIP,15000.00,,74931.00
`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HDFC_Bank_Sample_Statement.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleDirectly = () => {
    const csvContent = `Date,Narration,Withdrawal,Deposit,Balance
2026-09-01,SALARY CREDIT ACME TECH,,,125000.00,125000.00
2026-09-03,UPI-SWIGGY-ORDER-1982,580.00,,124420.00
2026-09-05,RENT TO LANDLORD BANGALORE,32000.00,,92420.00
2026-09-08,BLINKIT QUICK COMMERCE,1420.00,,91000.00
2026-09-10,NETFLIX SUBSCRIPTION,649.00,,90351.00
2026-09-12,UBER TRIP TO AIRPORT,420.00,,89931.00
2026-09-15,ZERODHA BROKING EQUITY SIP,15000.00,,74931.00
`;
    const sampleFile = new File([csvContent], 'HDFC_Bank_Sample_Statement.csv', { type: 'text/csv' });
    setFile(sampleFile);
    setError('');
  };

  // Filtered & Paginated Preview Rows
  const filteredPreview = useMemo(() => {
    if (!previewData?.preview) return [];
    return previewData.preview.filter((row: any) => {
      const matchSearch =
        searchTerm === '' ||
        row.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.category && row.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'VALID' && row.reviewStatus === 'VALID') ||
        (statusFilter === 'REQUIRES_REVIEW' && row.reviewStatus === 'REQUIRES_REVIEW') ||
        (statusFilter === 'WARNING' && (row.reviewStatus === 'WARNING' || row.isDuplicate));

      return matchSearch && matchStatus;
    });
  }, [previewData, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPreview.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPreview.slice(start, start + rowsPerPage);
  }, [filteredPreview, currentPage]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Zap className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            High-Throughput Ingestion Engine
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Bank Statement Ingestion
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
          Fast multi-format parser with vectorized batch categorization, missing value normalization, and duplicate hashing
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3 shadow-lg shadow-rose-500/5">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Statement Ingestion Notice</div>
            <p className="text-xs text-rose-300/90 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Live Processing Indicator Modal / HUD */}
      {uploading && (
        <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ingesting & Processing Statement</h3>
                <p className="text-xs text-slate-400">High-speed vectorized classification in progress</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Est. Time: ~{estimatedSeconds.toFixed(1)}s
              </div>
              <div className="text-[11px] text-slate-400">{progressPercent}% complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/50"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Live Step Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
              processingStep >= 1 ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : 'bg-slate-950/60 border-slate-800 text-slate-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${processingStep >= 1 ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`}></span>
              1. Universal Tabular Parser & Structure Detection
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
              processingStep >= 2 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-slate-950/60 border-slate-800 text-slate-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${processingStep >= 2 ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`}></span>
              2. Vectorized ML & In-Memory Category Mapping
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
              processingStep >= 3 ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-slate-950/60 border-slate-800 text-slate-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${processingStep >= 3 ? 'bg-purple-400 animate-pulse' : 'bg-slate-600'}`}></span>
              3. Cryptographic Deduplication & Missing Imputation
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition ${
              processingStep >= 4 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-950/60 border-slate-800 text-slate-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${processingStep >= 4 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
              4. Finalizing High-Speed Ledger Preview
            </div>
          </div>
        </div>
      )}

      {!previewData && !uploading && (
        <div className="space-y-6">
          {/* Main Upload Form */}
          <form onSubmit={handleUpload} className="fintech-panel rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Account Selector & Inline Creator */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Destination Financial Account
                </label>
                <button
                  type="button"
                  onClick={() => setShowCreateAccount(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add New Account
                </button>
              </div>

              {accounts.length > 0 ? (
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090D17] border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.institutionName} — {acc.name} ({acc.maskedIdentifier || acc.accountType})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-[#090D17] border border-amber-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-amber-300">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>No financial account registered yet.</span>
                  </div>
                  <button
                    type="button"
                    disabled={creatingAccount}
                    onClick={handleAutoCreateDefaultAccount}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow transition whitespace-nowrap"
                  >
                    {creatingAccount ? 'Creating...' : 'Create Default HDFC Account (1-Click)'}
                  </button>
                </div>
              )}
            </div>

            {/* Drag & Drop Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  setFile(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition ${
                isDragOver
                  ? 'border-blue-500 bg-blue-500/5'
                  : 'border-white/10 hover:border-white/20 bg-[#090D17]'
              }`}
            >
              <UploadCloud className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <div className="text-sm font-medium text-white mb-1">
                {file ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-2 font-semibold">
                    <FileSpreadsheet className="w-4 h-4" /> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  'Drag and drop your bank statement file here'
                )}
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Supported formats: <strong>CSV, XLSX, XLS, PDF</strong> (Up to 10,000 transactions per batch)
              </p>
              <label className="inline-block px-4 py-2 bg-[#0E1424] hover:bg-[#151E33] border border-white/10 text-slate-200 text-xs font-medium rounded-xl cursor-pointer transition shadow-sm">
                Browse Files
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !file || !selectedAccount}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" /> Fast Analyze & Preview Statement
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Sample Statement Helper Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Need a test statement?</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Try our verified HDFC bank statement template to test high-speed parsing, deduplication, and ML classification.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSampleDownload}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
              <button
                type="button"
                onClick={handleLoadSampleDirectly}
                className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-xl transition whitespace-nowrap"
              >
                ⚡ Load Sample
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview View */}
      {previewData && !uploading && (
        <div className="space-y-6">
          {/* Summary KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Detected Rows</div>
              <div className="text-2xl font-bold text-white mt-1">{previewData.detectedCount}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow">
              <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Valid New</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{previewData.validCount}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow">
              <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Duplicates</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{previewData.duplicateCount}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center shadow">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Warnings / Review</div>
              <div className="text-2xl font-bold text-slate-300 mt-1">{previewData.warningCount}</div>
            </div>
          </div>

          {/* Action Bar with Method 1: 1-Click Auto-Categorize & Confirm All */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Statement Preview ({previewData.preview?.length || 0} Transactions)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect categorized entries or use 1-Click Auto-Confirm to accept all AI suggestions instantly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>

              {/* Method 1: 1-Click Auto-Categorize & Confirm All Button */}
              <button
                onClick={() => handleConfirm(true)}
                disabled={confirming || autoConfirming}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                {autoConfirming ? 'Auto-Confirming...' : '⚡ Auto-Categorize & Confirm All'}
              </button>

              <button
                onClick={() => handleConfirm(false)}
                disabled={confirming || autoConfirming}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {confirming ? 'Saving to Ledger...' : 'Confirm & Save'} <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search, Status Filters & Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by description, merchant, or category..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto text-xs">
                {(['ALL', 'VALID', 'REQUIRES_REVIEW', 'WARNING'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      statusFilter === st
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'All'
                      : st === 'VALID'
                      ? '🟢 Valid'
                      : st === 'REQUIRES_REVIEW'
                      ? '⚠️ Needs Review'
                      : '🚫 Duplicates'}
                  </button>
                ))}
              </div>
            </div>

            {/* Paginated Table */}
            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 z-10">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Narration / Description</th>
                    <th className="p-3.5">Category (Editable)</th>
                    <th className="p-3.5">Validation Status</th>
                    <th className="p-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedRows.map((p: any, idx: number) => {
                    const globalIdx = (currentPage - 1) * rowsPerPage + idx;
                    return (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 whitespace-nowrap text-slate-400 font-mono">
                          {new Date(p.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3.5 font-medium text-white max-w-xs truncate">{p.description}</td>
                        <td className="p-3.5">
                          <select
                            value={p.category || 'General Expenses'}
                            onChange={(e) => handleCategoryChange(globalIdx, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-blue-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            {STANDARD_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat} className="bg-slate-900 text-white">
                                {cat}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.reviewStatus === 'DUPLICATE'
                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                : p.reviewStatus === 'VALID'
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            }`}
                          >
                            {p.reviewStatus === 'VALID' ? '🟢 Valid' : p.reviewStatus === 'REQUIRES_REVIEW' ? '⚠️ Needs Review' : '🚫 Duplicate'}
                          </span>
                        </td>
                        <td
                          className={`p-3.5 text-right font-bold font-mono ${
                            p.transactionType === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {p.transactionType === 'INCOME' ? '+' : '-'}₹{(p.amountMinor / 100).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                  {!paginatedRows.length && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        No transactions match your current search/filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60">
              <div>
                Showing {Math.min(filteredPreview.length, (currentPage - 1) * rowsPerPage + 1)} to{' '}
                {Math.min(filteredPreview.length, currentPage * rowsPerPage)} of {filteredPreview.length} entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Create Account Modal */}
      {showCreateAccount && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" /> Add Destination Account
            </h3>
            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold uppercase">Bank / Institution</label>
                <input
                  type="text"
                  required
                  value={newAccInstitution}
                  onChange={(e) => setNewAccInstitution(e.target.value)}
                  placeholder="HDFC Bank, ICICI, SBI, etc."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold uppercase">Account Name</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="Primary Salary Account"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase">Account Type</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  >
                    <option value="SAVINGS">Savings</option>
                    <option value="CHECKING">Checking</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="INVESTMENT">Investment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold uppercase">Identifier</label>
                  <input
                    type="text"
                    value={newAccMasked}
                    onChange={(e) => setNewAccMasked(e.target.value)}
                    placeholder="•••• 4921"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateAccount(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAccount}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50"
                >
                  {creatingAccount ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPage;
