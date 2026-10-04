import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Check,
  X,
  MessageSquarePlus,
  AlertCircle,
  Edit3,
  Eye,
  CheckCheck,
  SpellCheck,
  Sparkles,
  Scissors,
  Feather,
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  WordLevelSuggestion,
  SuggestionCategory,
  NuanceAnalysis,
  GeminiSettings,
} from '../types/essay';
import { fetchWordNuanceAnalysis } from '../services/geminiService';

interface InteractiveAnnotatedEditorProps {
  originalText: string;
  wordSuggestions: WordLevelSuggestion[];
  settings: GeminiSettings;
  onApplyAllChanges: (updatedText: string) => void;
  onAskTutor: (querySnippet: string) => void;
  onSwitchToEdit: () => void;
}

// 5 大修改分類客製化風格配置
const CATEGORY_THEMES: Record<
  SuggestionCategory,
  {
    label: string;
    icon: typeof AlertCircle;
    underline: string;
    badge: string;
    text: string;
    border: string;
    bg: string;
    cardBorder: string;
  }
> = {
  grammar: {
    label: '文法與句法',
    icon: AlertCircle,
    underline: 'decoration-rose-500 decoration-wavy underline underline-offset-4 bg-rose-50/70 hover:bg-rose-100',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    text: 'text-rose-700',
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    cardBorder: 'border-rose-400',
  },
  spelling: {
    label: '拼字與標點',
    icon: SpellCheck,
    underline: 'decoration-amber-500 decoration-wavy underline underline-offset-4 bg-amber-50/70 hover:bg-amber-100',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    text: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    cardBorder: 'border-amber-400',
  },
  vocabulary: {
    label: '詞彙與搭配詞',
    icon: Sparkles,
    underline: 'decoration-purple-500 decoration-dotted underline underline-offset-4 bg-purple-50/70 hover:bg-purple-100',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    text: 'text-purple-700',
    border: 'border-purple-200',
    bg: 'bg-purple-50',
    cardBorder: 'border-purple-400',
  },
  conciseness: {
    label: '簡潔度與贅字',
    icon: Scissors,
    underline: 'decoration-sky-500 decoration-dashed underline underline-offset-4 bg-sky-50/70 hover:bg-sky-100',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
    text: 'text-sky-700',
    border: 'border-sky-200',
    bg: 'bg-sky-50',
    cardBorder: 'border-sky-400',
  },
  style: {
    label: '語氣與語感',
    icon: Feather,
    // 依反饋要求：半透明實線底線
    underline: 'decoration-teal-500/50 underline underline-offset-4 bg-teal-50/50 hover:bg-teal-100/60',
    badge: 'bg-teal-100 text-teal-800 border-teal-300',
    text: 'text-teal-700',
    border: 'border-teal-200',
    bg: 'bg-teal-50',
    cardBorder: 'border-teal-400',
  },
};

interface TextSegment {
  id: string;
  text: string;
  isSuggestion: boolean;
  suggestion?: WordLevelSuggestion;
}

export function InteractiveAnnotatedEditor({
  originalText,
  wordSuggestions,
  settings,
  onApplyAllChanges,
  onAskTutor,
  onSwitchToEdit,
}: InteractiveAnnotatedEditorProps) {
  // 記錄已被採納的建議 ID
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  // 當前作用中的字級建議
  const [activeSuggestion, setActiveSuggestion] = useState<WordLevelSuggestion | null>(null);
  // 浮動視窗座標
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null);

  // 籠統字深入拆解狀態（按需非同步快取）
  const [nuanceData, setNuanceData] = useState<Record<string, NuanceAnalysis>>({});
  const [loadingNuanceId, setLoadingNuanceId] = useState<string | null>(null);
  const [isNuanceOpen, setIsNuanceOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 根據 wordSuggestions 將原文精準分割為 segments
  const segments: TextSegment[] = useMemo(() => {
    if (!originalText || !wordSuggestions || wordSuggestions.length === 0) {
      return [{ id: 'seg_0', text: originalText, isSuggestion: false }];
    }

    const segs: TextSegment[] = [];
    let currentIndex = 0;

    // 依原文出現位置過濾並排序建議
    const validSuggestions = wordSuggestions
      .filter((s) => s.originalSpan && originalText.includes(s.originalSpan))
      .map((s) => {
        const foundPos = originalText.indexOf(s.originalSpan, currentIndex);
        return { ...s, foundPos };
      })
      .filter((s) => s.foundPos !== -1)
      .sort((a, b) => a.foundPos - b.foundPos);

    for (let i = 0; i < validSuggestions.length; i++) {
      const sugg = validSuggestions[i];
      const matchIndex = originalText.indexOf(sugg.originalSpan, currentIndex);

      if (matchIndex === -1 || matchIndex < currentIndex) {
        continue;
      }

      // 匹配前的未修改文字
      if (matchIndex > currentIndex) {
        segs.push({
          id: `seg_plain_${currentIndex}`,
          text: originalText.substring(currentIndex, matchIndex),
          isSuggestion: false,
        });
      }

      // 匹配到的字級建議
      segs.push({
        id: sugg.id,
        text: sugg.originalSpan,
        isSuggestion: true,
        suggestion: sugg,
      });

      currentIndex = matchIndex + sugg.originalSpan.length;
    }

    // 剩餘文字
    if (currentIndex < originalText.length) {
      segs.push({
        id: `seg_plain_end`,
        text: originalText.substring(currentIndex),
        isSuggestion: false,
      });
    }

    return segs;
  }, [originalText, wordSuggestions]);

  // 點擊字詞時彈出浮動卡片
  const handleWordClick = (suggestion: WordLevelSuggestion, e: React.MouseEvent<HTMLSpanElement>) => {
    const spanRect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const spaceBelow = window.innerHeight - spanRect.bottom;
    const placeAbove = spaceBelow < 320;

    const popoverLeft = Math.max(16, Math.min(spanRect.left - containerRect.left, containerRect.width - 390));
    const popoverTop = placeAbove
      ? spanRect.top - containerRect.top - 8
      : spanRect.bottom - containerRect.top + 8;

    setActiveSuggestion(suggestion);
    setIsNuanceOpen(false); // 每次切換字詞預設收合深入剖析
    setPopoverPosition({
      top: popoverTop,
      left: popoverLeft,
      placeAbove,
    });
  };

  // 採納單字建議
  const handleAcceptSingle = (suggestion: WordLevelSuggestion) => {
    setAcceptedIds((prev) => new Set(prev).add(suggestion.id));
    setActiveSuggestion(null);
  };

  // 採納全部
  const handleAcceptAll = () => {
    const allIds = new Set(wordSuggestions.map((s) => s.id));
    setAcceptedIds(allIds);

    // 替換所有建議並組裝全文
    let updated = originalText;
    for (const sugg of wordSuggestions) {
      if (sugg.originalSpan && sugg.suggestedSpan !== undefined) {
        updated = updated.split(sugg.originalSpan).join(sugg.suggestedSpan);
      }
    }
    onApplyAllChanges(updated);
    setActiveSuggestion(null);
  };

  // 展開深入詞義剖析（按需非同步調用 Gemini）
  const handleToggleNuance = async (suggestion: WordLevelSuggestion) => {
    if (isNuanceOpen) {
      setIsNuanceOpen(false);
      return;
    }

    setIsNuanceOpen(true);

    if (nuanceData[suggestion.id]) {
      return; // 已有快取
    }

    setLoadingNuanceId(suggestion.id);
    try {
      const res = await fetchWordNuanceAnalysis({
        apiKey: settings.apiKey,
        model: settings.model,
        word: suggestion.originalSpan,
        sentenceContext: originalText.slice(0, 150),
      });
      setNuanceData((prev) => ({ ...prev, [suggestion.id]: res }));
    } catch (e) {
      console.error('Failed to fetch nuance analysis:', e);
    } finally {
      setLoadingNuanceId(null);
    }
  };

  // 點擊外部關閉浮動視窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.annotated-word')
      ) {
        setActiveSuggestion(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalSuggestions = wordSuggestions.length;
  const remainingCount = wordSuggestions.filter((s) => !acceptedIds.has(s.id)).length;

  return (
    <div
      ref={containerRef}
      className="relative bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-visible transition"
    >
      {/* Top Review Toolbar */}
      <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
            <Eye className="w-3.5 h-3.5" /> 字級互動審閱 ({totalSuggestions} 處)
          </span>
          <span className="text-xs text-slate-500 hidden md:inline">
            依 5 大類別精準標記單字，點擊單字可開啟專屬浮動卡片
          </span>
        </div>

        <div className="flex items-center gap-2">
          {remainingCount > 0 ? (
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <CheckCheck className="w-3.5 h-3.5" /> 全部採納 ({remainingCount} 處建議)
            </button>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Check className="w-3.5 h-3.5" /> 已全數採納
            </span>
          )}

          <button
            type="button"
            onClick={onSwitchToEdit}
            className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <Edit3 className="w-3.5 h-3.5" /> 純文字編輯
          </button>
        </div>
      </div>

      {/* 5 大類別圖例說明列 */}
      <div className="px-5 py-2 bg-slate-100/60 border-b border-slate-200/60 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
        <span className="font-semibold text-slate-700 text-xs">標記類別圖例：</span>
        {(Object.keys(CATEGORY_THEMES) as SuggestionCategory[]).map((catKey) => {
          const cat = CATEGORY_THEMES[catKey];
          const Icon = cat.icon;
          return (
            <span key={catKey} className="flex items-center gap-1">
              <Icon className={`w-3.5 h-3.5 ${cat.text}`} />
              <span className={cat.underline}>{cat.label}</span>
            </span>
          );
        })}
      </div>

      {/* Main Annotated Text Body */}
      <div className="p-6 text-sm md:text-base leading-loose font-serif text-slate-800 min-h-[220px] whitespace-pre-wrap">
        {segments.map((seg) => {
          if (!seg.isSuggestion || !seg.suggestion) {
            return <span key={seg.id}>{seg.text}</span>;
          }

          const sugg = seg.suggestion;
          const isAccepted = acceptedIds.has(sugg.id);
          const theme = CATEGORY_THEMES[sugg.category] || CATEGORY_THEMES.grammar;
          const isActive = activeSuggestion?.id === sugg.id;

          if (isAccepted) {
            return (
              <span
                key={seg.id}
                className="bg-emerald-50 text-emerald-950 font-sans font-medium px-1 py-0.5 rounded border border-emerald-200 transition"
                title="已採納修改"
              >
                {sugg.suggestedSpan || <span className="line-through opacity-50">{sugg.originalSpan}</span>}
              </span>
            );
          }

          return (
            <span
              key={seg.id}
              onClick={(e) => handleWordClick(sugg, e)}
              className={`annotated-word cursor-pointer font-medium px-0.5 rounded transition inline ${
                theme.underline
              } ${isActive ? 'ring-2 ring-indigo-500 bg-indigo-100/70' : ''}`}
            >
              {seg.text}
            </span>
          );
        })}
      </div>

      {/* 客製化浮動卡片 (Custom Floating Popover) */}
      {activeSuggestion && popoverPosition && (
        <div
          ref={popoverRef}
          style={{
            top: `${popoverPosition.top}px`,
            left: `${popoverPosition.left}px`,
            transform: popoverPosition.placeAbove ? 'translateY(-100%)' : 'none',
          }}
          className={`absolute z-50 w-full max-w-[390px] bg-white rounded-2xl shadow-2xl border ${
            CATEGORY_THEMES[activeSuggestion.category].cardBorder
          } p-4 space-y-3 animate-fade-in font-sans`}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              {(() => {
                const Icon = CATEGORY_THEMES[activeSuggestion.category].icon;
                return (
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${
                      CATEGORY_THEMES[activeSuggestion.category].badge
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {CATEGORY_THEMES[activeSuggestion.category].label}
                  </span>
                );
              })()}
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {activeSuggestion.ruleName}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveSuggestion(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Word Replacement Comparison Card */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">原詞：</span>
              <span className="font-serif line-through text-slate-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {activeSuggestion.originalSpan}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">建議：</span>
              {activeSuggestion.suggestedSpan ? (
                <span className="font-serif font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  {activeSuggestion.suggestedSpan}
                </span>
              ) : (
                <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-semibold flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-sky-600" /> 直接刪除此贅字
                </span>
              )}
            </div>
          </div>

          {/* Explanation */}
          <div className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <span>{activeSuggestion.explanationZh}</span>
          </div>

          {/* Alternatives Quick Chips */}
          {activeSuggestion.alternatives && activeSuggestion.alternatives.length > 0 && (
            <div className="pt-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                可選替換詞：
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeSuggestion.alternatives.map((alt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      // 替換建議為點選的 alternative
                      activeSuggestion.suggestedSpan = alt;
                      handleAcceptSingle(activeSuggestion);
                    }}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded text-[11px] font-serif transition"
                    title="點擊直接採用此替換詞"
                  >
                    + {alt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 籠統字深入拆解（按需非同步展開：僅在明確偵測為籠統模糊用詞時顯示） */}
          {Boolean(activeSuggestion.isGeneralWord) && (
            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleToggleNuance(activeSuggestion)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 rounded-lg text-xs font-semibold transition"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>籠統字深入剖析與微差異</span>
                </span>
                {isNuanceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isNuanceOpen && (
                <div className="mt-2 p-2.5 bg-indigo-50/30 rounded-xl border border-indigo-100 text-xs space-y-2 animate-fade-in max-h-56 overflow-y-auto">
                  {loadingNuanceId === activeSuggestion.id ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-indigo-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在分析「{activeSuggestion.originalSpan}」在本文中的語義精確度...</span>
                    </div>
                  ) : nuanceData[activeSuggestion.id] ? (
                    (() => {
                      const data = nuanceData[activeSuggestion.id];
                      return (
                        <div className="space-y-2 text-[11px]">
                          <div>
                            <span className="font-bold text-slate-800">在本文語境之意：</span>
                            <p className="text-slate-600 mt-0.5">{data.contextMeaningZh}</p>
                          </div>

                          <div className="pt-1.5 border-t border-indigo-100/60">
                            <span className="font-bold text-indigo-800 block mb-1">場景精準推薦詞：</span>
                            <div className="space-y-1.5">
                              {data.contextualReplacements.map((cr, idx) => (
                                <div key={idx} className="bg-white p-1.5 rounded border border-indigo-100">
                                  <div className="flex items-center justify-between">
                                    <strong className="font-serif text-indigo-950 font-bold text-xs">{cr.word}</strong>
                                    {cr.cefr && (
                                      <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold">
                                        CEFR {cr.cefr}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-500 mt-0.5 text-[10px]">{cr.nuanceZh}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-slate-400 text-center py-2">點擊上方按鈕載入剖析</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onAskTutor(`關於「${activeSuggestion.originalSpan}」建議改成「${activeSuggestion.suggestedSpan}」`);
                setActiveSuggestion(null);
              }}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" /> 追問助教
            </button>

            {!acceptedIds.has(activeSuggestion.id) && (
              <button
                type="button"
                onClick={() => handleAcceptSingle(activeSuggestion)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs text-white transition ${
                  activeSuggestion.category === 'conciseness' && !activeSuggestion.suggestedSpan
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {activeSuggestion.category === 'conciseness' && !activeSuggestion.suggestedSpan ? (
                  <>
                    <Scissors className="w-3.5 h-3.5" /> 移除贅字
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> 採納修改
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
