import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Database,
  Eye,
  RotateCcw,
  Zap,
  ChevronDown,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { api } from '../../api/client';
import { MarkdownRenderer } from '../MarkdownRenderer';

interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  evidence?: any;
}

export const FloatingAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<IMessage[]>([
    {
      role: 'assistant',
      content:
        '👋 Hello! I am your **Financial Flow AI Advisor**.\n\nI have access to your verified bank statements and transactions to give you clear, actionable, and mathematically grounded financial insights.\n\nAsk me anything about your cash flow, top spending drivers, 50/30/20 budget, or ways to boost your savings!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Listen to global open event (e.g. from InsightsPage or other triggers)
  useEffect(() => {
    const handleGlobalOpen = (e: any) => {
      setIsOpen(true);
      if (e?.detail?.prompt) {
        handleSend(undefined, e.detail.prompt);
      }
    };
    window.addEventListener('open-ai-assistant', handleGlobalOpen);
    return () => window.removeEventListener('open-ai-assistant', handleGlobalOpen);
  }, []);

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = (customPrompt || input).trim();
    if (!query || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res: any = await api.post('/assistant/chat', { message: query });
      if (res.success && res.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.response,
            evidence: res.data.evidence,
          },
        ]);
      } else {
        throw new Error('No response from AI Assistant');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Unable to generate insight right now. Please verify your connection or try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Are my spendings good?',
    'What were my top expense drivers?',
    'How can I improve my savings rate?',
    'What are my recurring subscriptions?',
  ];

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          '✨ Chat history reset! How can I assist you with your finances today?',
      },
    ]);
  };

  return (
    <>
      {/* Floating Chat Pop-up Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col shadow-2xl rounded-3xl border border-[var(--border-color)] fintech-panel backdrop-blur-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10'
              : 'bottom-24 right-4 sm:right-6 w-[420px] sm:w-[460px] h-[620px] max-h-[calc(100vh-7.5rem)] max-w-[calc(100vw-2rem)]'
          }`}
        >
          {/* Header */}
          <div className="px-5 py-4 bg-[var(--bg-sidebar-footer)] border-b border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Financial Flow Logo"
                  className="w-10 h-10 rounded-2xl object-contain border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-md p-0.5"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-surface)]"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Financial Flow AI Advisor</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Grounded in verified ledger data</p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                type="button"
                title="Reset Conversation"
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                type="button"
                title={isExpanded ? 'Restore size' : 'Expand'}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition hidden sm:inline-flex"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                title="Minimize / Close"
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans text-xs sm:text-sm bg-[var(--bg-canvas)]">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-blue-500/10'
                      : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-bl-none'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <MarkdownRenderer content={m.content} />
                  ) : (
                    <div className="whitespace-pre-wrap font-medium">{m.content}</div>
                  )}

                  {m.evidence && (
                    <div className="mt-2.5 pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[10px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Database className="w-2.5 h-2.5" /> Verified Data
                      </span>
                      <button
                        onClick={() => setSelectedEvidence(m.evidence)}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-2.5 h-2.5" /> View Evidence
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center animate-pulse">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                  Synthesizing financial statement data...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-4 py-2 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-blue-500" /> Prompts:
            </span>
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(undefined, p)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--bg-inset)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] whitespace-nowrap transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 sm:p-4 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about spending, cash flow, budgets, categories..."
                disabled={loading}
                className="w-full pl-4 pr-12 py-2.5 bg-[var(--bg-inset)] border border-[var(--border-color)] focus:border-blue-500 rounded-2xl text-xs text-[var(--text-primary)] focus:outline-none transition shadow-inner placeholder-[var(--text-muted)]"
              />
            </div>
          </form>
        </div>
      )}

      {/* Floating Round Trigger Button at Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          aria-label="Open AI Financial Assistant"
          className="group relative w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-blue-400/40"
        >
          {/* Animated Glow Ring */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-40 blur-sm group-hover:opacity-75 transition duration-500"></span>

          {/* Icon */}
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
            ) : (
              <>
                <img
                  src="/logo.png"
                  alt="Financial Flow AI"
                  className="w-9 h-9 rounded-full object-cover shadow-inner"
                />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Evidence Inspector Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Verified Data Evidence</h4>
              </div>
              <button
                onClick={() => setSelectedEvidence(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-60 overflow-y-auto">
              <pre className="text-[11px] font-mono text-emerald-300 whitespace-pre-wrap">
                {JSON.stringify(selectedEvidence, null, 2)}
              </pre>
            </div>
            <div className="text-right">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIAssistant;
