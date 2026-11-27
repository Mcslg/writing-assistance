import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Compass,
  ArrowRight,
  X,
  FileText,
  LayoutGrid,
} from 'lucide-react';
import {
  StructuralAnalysis,
  ArgumentHealth,
  RhetoricalRole,
  SentenceLogicItem,
  ParagraphAnalysis,
} from '../types/essay';

interface StructuralAnalysisViewProps {
  structuralAnalysis: StructuralAnalysis;
  onAskTutorWithParagraph?: (paragraphText: string, contextNote: string) => void;
}

const HEALTH_CONFIG: Record<
  ArgumentHealth,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  solid: {
    label: '論述扎實',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  weak_evidence: {
    label: '論據薄弱',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
  },
  lacks_topic_sentence: {
    label: '缺乏明確主題句',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: HelpCircle,
  },
  leap_in_logic: {
    label: '邏輯推論跳躍',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: AlertTriangle,
  },
  off_topic: {
    label: '偏離核心題旨',
    badgeClass: 'bg-red-50 text-red-800 border-red-300',
    icon: AlertTriangle,
  },
};

// 11 種修辭角色行內標示風格配置
const ROLE_THEME_MAP: Record<
  RhetoricalRole,
  {
    label: string;
    inlineStyle: string;
    badgeStyle: string;
    borderStyle: string;
  }
> = {
  hook: {
    label: '引入背景 (Hook)',
    inlineStyle: 'bg-cyan-50/70 border-b-2 border-cyan-400 hover:bg-cyan-100/70 text-slate-900',
    badgeStyle: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    borderStyle: 'border-cyan-400',
  },
  thesis: {
    label: '核心立場 (Thesis)',
    inlineStyle: 'bg-indigo-50/80 border-b-2 border-indigo-500 hover:bg-indigo-100/80 text-slate-900 font-medium',
    badgeStyle: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    borderStyle: 'border-indigo-500',
  },
  topic_sentence: {
    label: '段落主題句 (Topic Sentence)',
    inlineStyle: 'bg-blue-50/80 border-b-2 border-blue-500 hover:bg-blue-100/80 text-slate-900 font-medium',
    badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200',
    borderStyle: 'border-blue-500',
  },
  explanation: {
    label: '論據闡述 (Explanation)',
    inlineStyle: 'bg-purple-50/60 border-b border-purple-300 hover:bg-purple-100/70 text-slate-800',
    badgeStyle: 'bg-purple-50 text-purple-800 border-purple-200',
    borderStyle: 'border-purple-300',
  },
  evidence: {
    label: '事實/例證 (Evidence)',
    inlineStyle: 'bg-emerald-50/80 border-b-2 border-emerald-500 hover:bg-emerald-100/80 text-slate-900',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borderStyle: 'border-emerald-500',
  },
  elaboration: {
    label: '推論深化 (Elaboration)',
    inlineStyle: 'bg-violet-50/60 border-b border-violet-300 hover:bg-violet-100/70 text-slate-800',
    badgeStyle: 'bg-violet-50 text-violet-800 border-violet-200',
    borderStyle: 'border-violet-300',
  },
  counterargument: {
    label: '反方論點 (Counterargument)',
    inlineStyle: 'bg-amber-50/70 border-b border-amber-400 hover:bg-amber-100/70 text-slate-800',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200',
    borderStyle: 'border-amber-400',
  },
  refutation: {
    label: '反駁回應 (Refutation)',
    inlineStyle: 'bg-orange-50/70 border-b-2 border-orange-400 hover:bg-orange-100/70 text-slate-900',
    badgeStyle: 'bg-orange-50 text-orange-800 border-orange-200',
    borderStyle: 'border-orange-400',
  },
  conclusion: {
    label: '段落小結 (Conclusion)',
    inlineStyle: 'bg-slate-100/70 border-b-2 border-slate-400 hover:bg-slate-200/70 text-slate-800 font-medium',
    badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300',
    borderStyle: 'border-slate-400',
  },
  transition: {
    label: '過渡銜接 (Transition)',
    inlineStyle: 'bg-sky-50/60 border-b border-sky-300 hover:bg-sky-100/60 text-slate-800',
    badgeStyle: 'bg-sky-50 text-sky-800 border-sky-200',
    borderStyle: 'border-sky-300',
  },
  fluff: {
    label: '空泛贅句 (Fluff)',
    inlineStyle: 'bg-rose-50/70 border-b-2 border-dashed border-rose-400 hover:bg-rose-100/80 text-rose-950',
    badgeStyle: 'bg-rose-50 text-rose-800 border-rose-200',
    borderStyle: 'border-rose-400',
  },
};

const QUALITY_DOT_MAP: Record<
  'strong' | 'acceptable' | 'weak' | 'flawed',
  { label: string; dot: string; textClass: string }
> = {
  strong: { label: '論證有力', dot: 'bg-emerald-500', textClass: 'text-emerald-700' },
  acceptable: { label: '推論合理', dot: 'bg-blue-500', textClass: 'text-blue-700' },
  weak: { label: '支撐偏弱', dot: 'bg-amber-500', textClass: 'text-amber-700' },
  flawed: { label: '存在推論缺陷/跳躍', dot: 'bg-rose-500', textClass: 'text-rose-700 font-semibold' },
};

export const StructuralAnalysisView: React.FC<StructuralAnalysisViewProps> = ({
  structuralAnalysis,
  onAskTutorWithParagraph,
}) => {
  // 檢視模式：'inline' (行內沉浸標記，如 micro) 或 'cards' (段落卡片清單)
  const [displayMode, setDisplayMode] = useState<'inline' | 'cards'>('inline');

  // 卡片模式展開狀態
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({ 1: true });

  // 行內浮動視窗狀態
  const [activeSentence, setActiveSentence] = useState<{
    item: SentenceLogicItem;
    paragraph: ParagraphAnalysis;
  } | null>(null);

  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
    placeAbove: boolean;
  } | null>(null);

  const inlineContainerRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    structuralAnalysis.paragraphs.forEach((p) => {
      all[p.paragraphIndex] = true;
    });
    setExpandedIndices(all);
  };

  const collapseAll = () => {
    setExpandedIndices({});
  };

  // 點擊句子彈出浮動卡片
  const handleSentenceClick = (
    item: SentenceLogicItem,
    paragraph: ParagraphAnalysis,
    e: React.MouseEvent<HTMLSpanElement>
  ) => {
    e.stopPropagation();
    const spanRect = e.currentTarget.getBoundingClientRect();
    const containerRect = inlineContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const spaceBelow = window.innerHeight - spanRect.bottom;
    const placeAbove = spaceBelow < 280;

    const popoverLeft = Math.max(
      16,
      Math.min(spanRect.left - containerRect.left, containerRect.width - 380)
    );
    const popoverTop = placeAbove
      ? spanRect.top - containerRect.top - 8
      : spanRect.bottom - containerRect.top + 8;

    setActiveSentence({ item, paragraph });
    setPopoverPosition({
      top: popoverTop,
      left: popoverLeft,
      placeAbove,
    });
  };

  // 點擊容器外關閉浮動卡片
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (inlineContainerRef.current && !inlineContainerRef.current.contains(e.target as Node)) {
        setActiveSentence(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 頂部：篇章宏觀架構總覽卡片 */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <Compass className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">篇章架構與論證邏輯分析 (Macro View)</h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 font-medium">
                  {structuralAnalysis.structurePattern}
                </span>
              </div>
              <p className="text-xs text-indigo-200/70 mt-0.5">
                診斷全文篇章脈絡、段落功能切分、主題句明確度與推論嚴密性
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-indigo-300 uppercase tracking-wider block font-semibold">
                架構與邏輯得分
              </span>
              <div className="text-2xl font-black text-amber-300 font-mono leading-none mt-0.5">
                {structuralAnalysis.overallStructureScore}{' '}
                <span className="text-xs text-indigo-300 font-normal">/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* 宏觀銜接與過渡評估 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
            <span className="font-semibold text-indigo-200 block mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              篇章連貫與論點開展 (Coherence)
            </span>
            <p className="text-indigo-100/90 leading-relaxed">
              {structuralAnalysis.coherenceEvaluationZh}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
            <span className="font-semibold text-indigo-200 block mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              轉折過渡與銜接詞評價 (Transitions)
            </span>
            <p className="text-indigo-100/90 leading-relaxed">
              {structuralAnalysis.transitionsUsageZh}
            </p>
          </div>
        </div>
      </div>

      {/* 控制列：檢視模式切換（行內標示 vs 段落卡片） */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>篇章結構剖析模式</span>
          </h4>
          <span className="text-xs text-slate-400">
            {displayMode === 'inline' ? '點擊文中句子可彈出浮動邏輯診斷' : '檢視段落逐層拆解與補強建議'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {displayMode === 'cards' && (
            <div className="flex items-center gap-1.5 text-xs mr-2">
              <button
                type="button"
                onClick={expandAll}
                className="text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition"
              >
                全部展開
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded hover:bg-slate-100 transition"
              >
                全部收合
              </button>
            </div>
          )}

          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setDisplayMode('inline');
                setActiveSentence(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                displayMode === 'inline'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>行內沉浸標記 (Inline)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDisplayMode('cards');
                setActiveSentence(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                displayMode === 'cards'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>段落卡片清單 (Cards)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================== 模式 A：行內沉浸標記 (Inline Annotation) ==================== */}
      {displayMode === 'inline' && (
        <div className="space-y-4">
          {/* 修辭角色圖例 (Legend) */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold mr-1">修辭角色圖例：</span>
            <span className="px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 font-medium text-[11px]">
              主題句 (Topic/Thesis)
            </span>
            <span className="px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-[11px]">
              事實例證 (Evidence)
            </span>
            <span className="px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200 font-medium text-[11px]">
              論證深化 (Explanation/Elaboration)
            </span>
            <span className="px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 font-medium text-[11px]">
              反方/讓步 (Counter/Refutation)
            </span>
            <span className="px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 font-medium text-[11px]">
              空泛贅句 (Fluff)
            </span>
          </div>

          {/* 文章本體 (帶行內高亮與浮動視窗定位容器) */}
          <div
            ref={inlineContainerRef}
            className="relative bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6"
          >
            {structuralAnalysis.paragraphs.map((p) => {
              const healthCfg = HEALTH_CONFIG[p.health] || HEALTH_CONFIG.solid;
              const HealthIcon = healthCfg.icon;

              return (
                <div key={p.paragraphIndex} className="space-y-2">
                  {/* 段落徽章 */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md font-mono">
                      Paragraph #{p.paragraphIndex}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{p.roleZh}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold ${healthCfg.badgeClass}`}
                    >
                      <HealthIcon className="w-3 h-3" />
                      {p.healthLabelZh || healthCfg.label}
                    </span>
                  </div>

                  {/* 段落正文：逐句行內標記 */}
                  <div className="text-sm leading-relaxed text-slate-800 font-serif p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-wrap gap-x-1.5 gap-y-2">
                    {p.sentenceBreakdown && p.sentenceBreakdown.length > 0 ? (
                      p.sentenceBreakdown.map((sb) => {
                        const theme = ROLE_THEME_MAP[sb.role] || ROLE_THEME_MAP.explanation;
                        const isSelected = activeSentence?.item.sentenceIndex === sb.sentenceIndex && activeSentence?.paragraph.paragraphIndex === p.paragraphIndex;

                        return (
                          <span
                            key={sb.sentenceIndex}
                            onClick={(e) => handleSentenceClick(sb, p, e)}
                            className={`cursor-pointer px-1 py-0.5 rounded transition relative group inline-block ${theme.inlineStyle} ${
                              isSelected ? 'ring-2 ring-indigo-500 shadow-xs' : ''
                            }`}
                            title={`點擊查看：${sb.roleLabelZh}`}
                          >
                            {/* 句子序號小徽章 */}
                            <span className="text-[9px] font-mono mr-1 text-slate-400 font-bold opacity-70 group-hover:opacity-100">
                              S{sb.sentenceIndex}
                            </span>
                            <span>{sb.text}</span>
                          </span>
                        );
                      })
                    ) : (
                      // 若無 sentenceBreakdown fallback
                      <span>{p.originalParagraph}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 浮動診斷視窗 Popover (像 micro 那樣懸浮在被點擊的句子旁) */}
            {activeSentence && popoverPosition && (
              <div
                style={{
                  top: `${popoverPosition.top}px`,
                  left: `${popoverPosition.left}px`,
                  transform: popoverPosition.placeAbove ? 'translateY(-100%)' : 'none',
                }}
                className="absolute z-30 w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-4 space-y-3 animate-fade-in"
              >
                {/* 標題與關閉 */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md font-mono">
                      P{activeSentence.paragraph.paragraphIndex}-S{activeSentence.item.sentenceIndex}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                        ROLE_THEME_MAP[activeSentence.item.role]?.badgeStyle || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {activeSentence.item.roleLabelZh || ROLE_THEME_MAP[activeSentence.item.role]?.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSentence(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 推論健全度狀態 */}
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-medium">論證健全度：</span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        QUALITY_DOT_MAP[activeSentence.item.logicQuality]?.dot || 'bg-blue-500'
                      }`}
                    />
                    <span
                      className={
                        QUALITY_DOT_MAP[activeSentence.item.logicQuality]?.textClass || 'text-slate-700'
                      }
                    >
                      {QUALITY_DOT_MAP[activeSentence.item.logicQuality]?.label || '合理'}
                    </span>
                  </div>
                </div>

                {/* 原文引述 */}
                <div className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 font-serif italic">
                  "{activeSentence.item.text}"
                </div>

                {/* 邏輯作用與盲點點評 */}
                <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                  <span className="font-bold text-indigo-950 block">邏輯功能剖析：</span>
                  <p className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-indigo-950">
                    {activeSentence.item.critiqueZh}
                  </p>
                </div>

                {/* 追問助教按鈕 */}
                {onAskTutorWithParagraph && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onAskTutorWithParagraph(
                          activeSentence.item.text,
                          `請分析第 ${activeSentence.paragraph.paragraphIndex} 段第 ${activeSentence.item.sentenceIndex} 句（${activeSentence.item.roleLabelZh}）的論述邏輯與健全度：${activeSentence.item.critiqueZh}`
                        );
                        setActiveSentence(null);
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>向 AI 助教深入討論此句</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 模式 B：段落卡片清單 (Cards Breakdown) ==================== */}
      {displayMode === 'cards' && (
        <div className="space-y-4">
          {structuralAnalysis.paragraphs.map((p) => {
            const isExpanded = !!expandedIndices[p.paragraphIndex];
            const healthCfg = HEALTH_CONFIG[p.health] || HEALTH_CONFIG.solid;
            const HealthIcon = healthCfg.icon;

            return (
              <div
                key={p.paragraphIndex}
                className={`border rounded-2xl bg-white shadow-xs transition-all duration-200 overflow-hidden ${
                  isExpanded ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* 卡片標題列 */}
                <div
                  onClick={() => toggleExpand(p.paragraphIndex)}
                  className="p-4 sm:p-5 cursor-pointer flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-800 font-bold text-xs font-mono">
                      P{p.paragraphIndex}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{p.roleZh}</span>
                        <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
                          ({p.role})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${healthCfg.badgeClass}`}
                    >
                      <HealthIcon className="w-3.5 h-3.5" />
                      {p.healthLabelZh || healthCfg.label}
                    </span>

                    <div className="p-1 text-slate-400 hover:text-slate-600 transition">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* 卡片內容主體 */}
                <div className="p-4 sm:p-5 space-y-4 border-t border-slate-100">
                  {/* 原文段落展示 */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      段落原文：
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif">
                      {p.originalParagraph}
                    </p>
                  </div>

                  {/* 主題句識別 */}
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      p.hasClearTopicSentence
                        ? 'bg-indigo-50/60 border-indigo-100 text-indigo-950'
                        : 'bg-amber-50/60 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="mt-0.5">
                      {p.hasClearTopicSentence ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="font-bold block mb-0.5">
                        {p.hasClearTopicSentence ? '段落核心主題句 (Topic Sentence)：' : '主題句診斷：'}
                      </span>
                      <p className="font-sans leading-relaxed">
                        {p.hasClearTopicSentence ? `"${p.topicSentence}"` : p.topicSentence}
                      </p>
                    </div>
                  </div>

                  {/* 階梯式折疊深入邏輯剖析 */}
                  {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 animate-fade-in">
                      {/* 邏輯鏈條與推論深度 */}
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                          段落邏輯鏈條剖析 (Logical Reasoning)
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {p.logicCritiqueZh}
                        </p>

                        {p.evidenceQualityZh && (
                          <div className="pt-2 border-t border-slate-100 text-xs">
                            <span className="font-semibold text-slate-500 block mb-0.5">
                              論據與例證支撐力道：
                            </span>
                            <p className="text-slate-600 leading-relaxed">{p.evidenceQualityZh}</p>
                          </div>
                        )}
                      </div>

                      {/* 具體強化指南 */}
                      <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                        <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-emerald-900 block mb-0.5">
                            架構補強具體建議：
                          </strong>
                          <p className="text-emerald-900 leading-relaxed">{p.actionableAdviceZh}</p>
                        </div>
                      </div>

                      {/* 段落逐句修辭角色清單 */}
                      {p.sentenceBreakdown && p.sentenceBreakdown.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5 text-indigo-600" />
                              段內逐句修辭角色與推論推移 (共 {p.sentenceBreakdown.length} 句)
                            </span>
                            <span className="text-[11px] text-slate-400">
                              PEEL / 論證功能拆解
                            </span>
                          </div>

                          <div className="space-y-2">
                            {p.sentenceBreakdown.map((sb) => {
                              const roleCfg = ROLE_THEME_MAP[sb.role] || {
                                label: sb.roleLabelZh || '論述句',
                                badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
                              };
                              const qualityCfg = QUALITY_DOT_MAP[sb.logicQuality] || QUALITY_DOT_MAP.acceptable;

                              return (
                                <div
                                  key={sb.sentenceIndex}
                                  className="p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200 transition space-y-1.5"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded font-mono">
                                        S{sb.sentenceIndex}
                                      </span>
                                      <span
                                        className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${roleCfg.badgeStyle}`}
                                      >
                                        {sb.roleLabelZh || roleCfg.label}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px]">
                                      <span className={`w-2 h-2 rounded-full ${qualityCfg.dot}`} />
                                      <span className={qualityCfg.textClass}>{qualityCfg.label}</span>
                                    </div>
                                  </div>

                                  <p className="text-xs text-slate-800 font-serif leading-relaxed pl-1">
                                    "{sb.text}"
                                  </p>

                                  <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60 leading-relaxed flex items-start gap-1.5">
                                    <span className="text-indigo-600 font-semibold shrink-0">評析:</span>
                                    <span>{sb.critiqueZh}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 追問助教按鈕 */}
                      {onAskTutorWithParagraph && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onAskTutorWithParagraph(
                                p.originalParagraph,
                                `我想針對第 ${p.paragraphIndex} 段（${p.roleZh}）的架構與論證邏輯請教：${p.logicCritiqueZh}`
                              )
                            }
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 border border-indigo-200/60 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            向 AI 助教深入討論此段邏輯
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
