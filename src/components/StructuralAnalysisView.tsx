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
import { StructuralAnalysis, ArgumentHealth } from '../types/essay';

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
