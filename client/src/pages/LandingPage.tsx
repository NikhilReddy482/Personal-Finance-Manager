import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, PieChart, Lock, Bot, Database, Zap } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const [demoLoading, setDemoLoading] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await api.post('/auth/demo');
      await refreshUser();
      navigate('/app/dashboard');
    } catch (err) {
      navigate('/auth/login');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Financial Flow Logo"
              className="w-9 h-9 rounded-xl object-contain shadow-lg shadow-blue-500/25 border border-blue-500/20"
            />
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">Financial Flow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              to="/auth/register"
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Personal Finance Intelligence Platform
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-6">
          Understand where your money goes, why it changes, and what deserves your attention.
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Import heterogeneous bank statements (CSV, XLSX, PDF), auto-categorize with hybrid ML, detect recurring commitments & anomalies, and converse with an AI assistant strictly grounded in your verified financial data.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auth/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-xl shadow-blue-600/25 transition"
          >
            Start Free Intelligence <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded-xl transition disabled:opacity-50"
          >
            {demoLoading ? 'Launching Demo...' : '⚡ Explore Live Demo'}
          </button>
        </div>

      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
            <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Universal Statement Normalizer</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Heterogeneous header mapping for CSV, XLSX, and text PDFs. Normalizes messy narrations and eliminates duplicate transactions automatically.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
            <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Hybrid ML Classification</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Deterministic rule engine combined with Scikit-Learn TF-IDF classification across 24 hierarchical categories and 100+ subcategories.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6">
            <div className="p-2.5 w-fit rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Grounded AI Assistant</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              No financial hallucinations. Every personal data answer is strictly computed by backend tools with transparent calculation evidence inspection.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
