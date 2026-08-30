import React, { useEffect, useState } from 'react';
import { X, FileCode, Copy, Check, Loader2 } from 'lucide-react';
import { fetchFileContent } from '../services/api';

export default function CodeViewerModal({ filePath, owner, repo, branch, onClose }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchFileContent(owner, repo, filePath, branch || 'main');
        setContent(data.content || `// ${filePath}\n// File loaded.`);
      } catch (err) {
        setContent(`// Could not load file: ${filePath}`);
      } finally {
        setLoading(false);
      }
    }
    if (filePath) load();
  }, [filePath, owner, repo, branch]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!filePath) return null;

  const lines = content.split('\n');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-sky-400" />
            <span className="font-mono text-xs font-semibold text-slate-200">
              {filePath}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#0d1117] font-mono text-xs text-slate-300">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
              <p className="text-slate-500">Loading code...</p>
            </div>
          ) : (
            <div className="table w-full">
              {lines.map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-800/40">
                  <span className="table-cell pr-4 text-right text-slate-600 select-none w-10 border-r border-slate-800/60">
                    {idx + 1}
                  </span>
                  <span className="table-cell pl-4 whitespace-pre leading-relaxed">
                    {line}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
