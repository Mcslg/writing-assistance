import { useState } from 'react';
import { CheckCircle2, AlertCircle, MessageSquarePlus, Lightbulb, Filter } from 'lucide-react';
import { SentenceAnalysis, SuggestionCategory } from '../types/essay';

interface SentenceAnalysisListProps {
  sentenceAnalyses: SentenceAnalysis[];
  onAskAboutSentence: (sentence: SentenceAnalysis) => void;
}

const TYPE_CONFIG: Record<
  SuggestionCategory,
  { label: string; bg: string; text: string; border: string }
> = {
  grammar: { label: '文法與句法', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  spelling: { label: '拼字/標點', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  vocabulary: { label: '詞彙搭配', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  conciseness: { label: '簡潔度贅字', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  style: { label: '語氣語感', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

export function SentenceAnalysisList({
  sentenceAnalyses,
  onAskAboutSentence,
}: SentenceAnalysisListProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'changedOnly'>('changedOnly');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filtered = sentenceAnalyses.filter((s) => {
    if (filterMode === 'changedOnly' && !s.hasChange) return false;
    if (selectedType !== 'all' && s.type !== selectedType) return false;
    return true;
  });

  const totalChanges = sentenceAnalyses.filter((s) => s.hasChange).length;

  return (
    <div className="space-y-4">
      {/* List Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-sm">逐句解析與學習點</span>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
            共 {sentenceAnalyses.length} 句 / {totalChanges} 處修訂
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="changedOnly">僅顯示有修訂句 ({totalChanges})</option>
              <option value="all">顯示全文所有句 ({sentenceAnalyses.length})</option>
            </select>
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">所有修訂類型</option>
            <option value="grammar">文法與句法</option>
            <option value="spelling">拼字與標點</option>
            <option value="vocabulary">詞彙與搭配詞</option>
            <option value="conciseness">簡潔度與贅字</option>
            <option value="style">語氣與語感</option>
          </select>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            此篩選條件下沒有符合的句子
          </div>
        ) : (
          filtered.map((item) => {
            const typeConfig = item.type ? TYPE_CONFIG[item.type] : TYPE_CONFIG.grammar;

            return (
              <div
                key={item.sentenceIndex}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                  item.hasChange ? 'border-slate-200/90' : 'border-slate-100 bg-slate-50/40 opacity-90'
                }`}
              >
                {/* Sentence Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
                      {item.sentenceIndex}
                    </span>

                    {item.hasChange ? (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}
                      >
                        {typeConfig.label}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> 表達良好
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onAskAboutSentence(item)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                    title="針對這句話向 AI 助教深入提問"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>追問助教</span>
                  </button>
                </div>

                {/* Original vs Improved Sentences */}
                <div className="space-y-2 mb-3">
                  <div className="text-xs">
                    <span className="font-semibold text-rose-700 mr-2 uppercase tracking-wider text-[10px]">
                      原文：
                    </span>
                    <span className="text-slate-700 font-serif leading-relaxed line-through decoration-rose-400">
                      {item.original}
                    </span>
                  </div>

                  {item.hasChange && (
                    <div className="text-xs">
                      <span className="font-semibold text-emerald-700 mr-2 uppercase tracking-wider text-[10px]">
                        改寫：
                      </span>
                      <span className="text-slate-900 font-serif font-medium leading-relaxed bg-emerald-50/60 px-1 py-0.5 rounded">
                        {item.improved}
                      </span>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">說明與學習重點：</strong>
                      <span className="text-slate-600">{item.explanationZh}</span>
                    </div>
                  </div>

                  {/* Alternative Phrasings */}
                  {item.alternativePhrasings && item.alternativePhrasings.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                        <Lightbulb className="w-3 h-3" /> 其他地道替換說法：
                      </div>
                      <div className="space-y-1 pl-4">
                        {item.alternativePhrasings.map((alt, aIdx) => (
                          <div key={aIdx} className="text-[11px] font-serif text-slate-700">
                            • {alt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
