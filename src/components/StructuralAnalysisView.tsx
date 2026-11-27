import React, { useState } from 'react';
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
} from 'lucide-react';
import { StructuralAnalysis, ArgumentHealth, RhetoricalRole } from '../types/essay';

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

const ROLE_BADGE_MAP: Record<RhetoricalRole, { label: string; badge: string }> = {
  hook: { label: '吸引引子 (Hook)', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  thesis: { label: '核心立場 (Thesis)', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  topic_sentence: { label: '段落主題句 (Topic Sentence)', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  explanation: { label: '論據闡述 (Explanation)', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  evidence: { label: '事實/例證 (Evidence)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  elaboration: { label: '推論深化 (Elaboration)', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  counterargument: { label: '反方論點 (Counterargument)', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  refutation: { label: '反駁回應 (Refutation)', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  conclusion: { label: '段落小結 (Conclusion)', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
  transition: { label: '過渡銜接 (Transition)', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  fluff: { label: '空泛贅句 (Fluff)', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
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
  // 控制各段落是否展開深入邏輯診斷 (預設全部展開或第一段展開)
  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({ 1: true });

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

          <div className="flex items-center gap-3">
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

      {/* 控制列：展開/收合全部 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            段落逐段邏輯解構 (共 {structuralAnalysis.paragraphs.length} 個段落)
          </h4>
          <span className="text-xs text-slate-400">點擊卡片可展開深度論證診斷</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="text-indigo-600 hover:text-indigo-700 font-medium px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition"
          >
            全部展開
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-slate-500 hover:text-slate-700 font-medium px-2.5 py-1 rounded-lg hover:bg-slate-100 transition"
          >
            全部收合
          </button>
        </div>
      </div>

      {/* 段落卡片清單 */}
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
              {/* 卡片標題列 (點擊切換展開) */}
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
                {/* 1. 原文段落展示 */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    段落原文：
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif">
                    {p.originalParagraph}
                  </p>
                </div>

                {/* 2. 主題句識別 (Topic Sentence) */}
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

                {/* 3. 階梯式折疊深入邏輯剖析 (展開時可見) */}
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

                    {/* 4. 段落逐句修辭角色與邏輯推移 (Sentence-by-Sentence Flow) */}
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
                            const roleCfg = ROLE_BADGE_MAP[sb.role] || {
                              label: sb.roleLabelZh || '論述句',
                              badge: 'bg-slate-100 text-slate-700 border-slate-200',
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
                                      className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${roleCfg.badge}`}
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
    </div>
  );
};
