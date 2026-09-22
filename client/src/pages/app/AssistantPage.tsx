import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Database, ShieldCheck, Eye, RefreshCw, Zap } from 'lucide-react';
import { api } from '../../api/client';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';

interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  evidence?: any;
}

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([
    {
      role: 'assistant',
      content:
        '👋 Hello! I am your **Financial Flow AI Advisor**. I analyze your real, verified statements and transactions to give you clear, actionable, and human-friendly insights.\n\nAsk me anything about your spending habits, savings rate, budgets, categories, or how to optimize your finances!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
          content: '⚠️ Unable to process query right now. Please verify your connection or retry in a few moments.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Are my financial spendings really good?',
    'What were my biggest expense drivers?',
    'How can I improve my savings rate?',
    'How much did I spend on Food & Dining?',
    'What are my recurring subscriptions?',
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" /> Grounded AI Financial Advisor
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Powered by real transaction data and deterministic mathematical verification
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" /> Live Intelligence
        </div>
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-y-auto space-y-5 shadow-xl">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`p-4 rounded-2xl max-w-2xl text-sm leading-relaxed shadow-md ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-950 border border-slate-800/90 text-slate-200 rounded-bl-none'
              }`}
            >
              {m.role === 'assistant' ? (
                <MarkdownRenderer content={m.content} />
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}

              {m.evidence && (
                <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Database className="w-3 h-3" /> Grounded in {m.evidence.period || 'Statement'} Data
                  </span>
                  <button
                    onClick={() => setSelectedEvidence(m.evidence)}
                    className="text-blue-400 hover:text-blue-300 font-medium hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> View Data Evidence
                  </button>
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-300 mt-1 shadow-md">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2.5 text-xs text-blue-400 p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl max-w-xs">
            <Sparkles className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" />
            <span>Analyzing real financial records & calculating response...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {samplePrompts.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(undefined, p)}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs rounded-xl whitespace-nowrap transition disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={(e) => handleSend(e)} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your spending, savings, categories, budgets, or financial goals..."
          className="w-full pl-5 pr-12 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-xl transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl absolute right-2.5 top-2.5 disabled:opacity-40 transition shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Evidence Modal */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Verified Financial Data Dossier
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                {selectedEvidence.period || 'Statement'}
              </span>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">{selectedEvidence.summary}</div>
            <pre className="p-4 bg-slate-950 rounded-xl text-xs text-slate-300 overflow-x-auto max-h-72 border border-slate-800 font-mono">
              {JSON.stringify(selectedEvidence.data, null, 2)}
            </pre>
            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
