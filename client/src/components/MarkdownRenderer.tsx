import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content leading-relaxed text-sm ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2 mt-3 flex items-center gap-1.5">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold text-white mb-2 mt-3 flex items-center gap-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-blue-300 mb-1.5 mt-2.5 flex items-center gap-1.5">{children}</h3>,
          p: ({ children }) => <p className="mb-2 last:mb-0 text-slate-200">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-slate-200 pl-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-slate-200 pl-1">{children}</ol>,
          li: ({ children }) => <li className="text-slate-200">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-3 my-2 text-slate-300 italic bg-slate-900/40 py-1 rounded-r">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-mono text-xs border border-slate-700">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-slate-800 bg-slate-950/80">
              <table className="w-full text-left border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-800/60">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-slate-900/40 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="p-2.5 font-semibold text-slate-300">{children}</th>,
          td: ({ children }) => <td className="p-2.5 text-slate-300">{children}</td>,
          hr: () => <hr className="border-slate-800 my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
