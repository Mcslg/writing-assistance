import { useState, useMemo } from 'react';
import { Columns, AlignLeft } from 'lucide-react';
import * as Diff from 'diff';

interface DiffViewerProps {
  originalText: string;
  improvedText: string;
  onSelectSentence?: (originalSentence: string) => void;
}

export function DiffViewer({ originalText, improvedText }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'split' | 'inline'>('split');

  // 計算詞級差異
  const wordDiff = useMemo(() => {
    return Diff.diffWordsWithSpace(originalText, improvedText);
  }, [originalText, improvedText]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header and Toggle */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-sm">全文修訂對比檢視 (Diff View)</span>
          <span className="text-xs text-slate-400 hidden sm:inline">| 紅色為刪除/修改前，綠色為潤飾後</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              viewMode === 'split'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>雙欄並排</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('inline')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
              viewMode === 'inline'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>單欄行內標記</span>
          </button>
        </div>
      </div>

      {/* Diff Content View */}
      {viewMode === 'inline' ? (
        <div className="p-6 text-sm leading-loose font-serif text-slate-800 bg-slate-50/20 whitespace-pre-wrap">
          {wordDiff.map((part, index) => {
            if (part.added) {
              return (
                <span
                  key={index}
                  className="bg-emerald-100 text-emerald-900 font-semibold px-1 py-0.5 rounded mx-0.5 border border-emerald-200"
                >
                  {part.value}
                </span>
              );
            }
            if (part.removed) {
              return (
                <span
                  key={index}
                  className="bg-rose-100 text-rose-800 line-through px-1 py-0.5 rounded mx-0.5 opacity-80 border border-rose-200"
                >
                  {part.value}
                </span>
              );
            }
            return <span key={index}>{part.value}</span>;
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Original Column */}
          <div className="p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                原文 (Original)
              </span>
            </div>
            <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-serif flex-1">
              {wordDiff.map((part, index) => {
                if (part.added) return null; // 原文側不顯示新增內容
                if (part.removed) {
                  return (
                    <mark
                      key={index}
                      className="bg-rose-100 text-rose-900 line-through px-0.5 rounded mx-0.5"
                    >
                      {part.value}
                    </mark>
                  );
                }
                return <span key={index}>{part.value}</span>;
              })}
            </div>
          </div>

          {/* Improved Column */}
          <div className="p-5 flex flex-col bg-emerald-50/10">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                潤飾版本 (Enhanced)
              </span>
            </div>
            <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-serif flex-1">
              {wordDiff.map((part, index) => {
                if (part.removed) return null; // 潤飾側不顯示刪除內容
                if (part.added) {
                  return (
                    <mark
                      key={index}
                      className="bg-emerald-100 text-emerald-950 font-semibold px-0.5 rounded mx-0.5"
                    >
                      {part.value}
                    </mark>
                  );
                }
                return <span key={index}>{part.value}</span>;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
