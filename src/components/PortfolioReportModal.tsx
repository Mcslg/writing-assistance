import React from 'react';
import {
  X,
  Award,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Download,
  Calendar,
  CheckCircle,
  FileText,
  ArrowRight,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { PortfolioReport, SuggestionCategory } from '../types/essay';

interface PortfolioReportModalProps {
  report: PortfolioReport;
  onClose: () => void;
  onSelectEssay?: (essayId: string) => void;
}

const CATEGORY_MAP: Record<SuggestionCategory, { label: string; color: string; badgeBg: string }> = {
  grammar: { label: '文法句構', color: 'text-red-700', badgeBg: 'bg-red-50 border-red-200 text-red-700' },
  spelling: { label: '拼字大小寫', color: 'text-amber-700', badgeBg: 'bg-amber-50 border-amber-200 text-amber-700' },
  vocabulary: { label: '用詞搭配', color: 'text-purple-700', badgeBg: 'bg-purple-50 border-purple-200 text-purple-700' },
  conciseness: { label: '簡潔度精簡', color: 'text-sky-700', badgeBg: 'bg-sky-50 border-sky-200 text-sky-700' },
  style: { label: '風格語氣', color: 'text-emerald-700', badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
};

const TRAJECTORY_MAP = {
  improving: { label: '穩步提升中', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', icon: TrendingUp },
  stable: { label: '平穩持平', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', icon: Minus },
  fluctuating: { label: '起伏波動', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', icon: TrendingUp },
  needs_attention: { label: '需特別針對調整', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: TrendingDown },
};

export const PortfolioReportModal: React.FC<PortfolioReportModalProps> = ({
  report,
  onClose,
  onSelectEssay,
}) => {
  const trajectoryInfo = TRAJECTORY_MAP[report.growthAnalysis.trajectory] || TRAJECTORY_MAP.stable;
  const TrajectoryIcon = trajectoryInfo.icon;

  const handleExportMarkdown = () => {
    const dateStr = new Date(report.createdAt).toLocaleString('zh-TW');
    let md = `# 全歷史英文寫作體檢與橫向重評報告\n\n`;
    md += `- **分析日期**：${dateStr}\n`;
    md += `- **分析篇數**：共 ${report.totalEssaysAnalyzed} 篇歷史文章\n`;
    md += `- **成長走勢**：${trajectoryInfo.label}\n\n`;

    md += `## 一、整體診斷總結\n\n${report.overallSummary}\n\n`;

    md += `## 二、橫向校準評分排行榜 (拉開鑑別度)\n\n`;
    md += `| 排名 | 文章標題 | 日期 | 原始評分 | 校準後分數 | 調整幅度 | 校準理由 |\n`;
    md += `| :---: | :--- | :---: | :---: | :---: | :---: | :--- |\n`;
    report.calibratedRanks.forEach((r) => {
      const diff = r.calibratedScore - r.originalScore;
      const diffStr = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '持平';
      md += `| #${r.rank} | ${r.title} | ${r.date} | ${r.originalScore} | **${r.calibratedScore}** | ${diffStr} | ${r.calibrationReason} |\n`;
    });
    md += `\n`;

    md += `## 三、跨篇高頻頑疾 Top ${report.commonErrorPatterns.length} (反覆出現的盲點)\n\n`;
    report.commonErrorPatterns.forEach((p, idx) => {
      md += `### ${idx + 1}. [${CATEGORY_MAP[p.category]?.label || p.category}] ${p.name}\n`;
      md += `- **出現頻率**：約 ${p.frequency} 次 (影響 ${p.affectedEssayCount} 篇文章)\n`;
      md += `- **錯誤原理剖析**：${p.description}\n`;
      md += `- **破除頑疾指南**：${p.advice}\n\n`;
      if (p.examples && p.examples.length > 0) {
        md += `#### 代表性例句對照：\n`;
        p.examples.forEach((ex, eIdx) => {
          md += `*例 ${eIdx + 1}:*\n`;
          md += `- 原文：\`${ex.original}\`\n`;
          md += `- 建議：\`${ex.improved}\`\n`;
          md += `- 解說：${ex.explanation}\n\n`;
        });
      }
    });

    md += `## 四、縱向成長與能力變化軌跡\n\n`;
    md += `- **詞彙多樣與精準度**：${report.growthAnalysis.vocabularyProgress}\n`;
    md += `- **文法控制力與句型豐富度**：${report.growthAnalysis.grammarProgress}\n`;
    md += `- **篇章邏輯與段落銜接**：${report.growthAnalysis.coherenceProgress}\n\n`;

    md += `### 下一階段寫作行動方針：\n`;
    report.growthAnalysis.strategicAdvice.forEach((adv, i) => {
      md += `${i + 1}. ${adv}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `writing_portfolio_diagnosis_${new Date(report.createdAt).toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">全歷史寫作縱向診斷與橫向重評報告</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-medium border border-indigo-400/30">
                  {report.totalEssaysAnalyzed} 篇文章比對
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                跨篇校準鑑別度・高頻盲點提煉・歷程發展走勢
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
              title="匯出 Markdown 格式報告"
            >
              <Download className="w-3.5 h-3.5" />
              匯出 .md 報告
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 bg-slate-50">
          
          {/* 總結卡片 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                總體寫作實力評述
              </h3>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${trajectoryInfo.bg} ${trajectoryInfo.color}`}>
                <TrajectoryIcon className="w-3.5 h-3.5" />
                {trajectoryInfo.label}
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-lg border border-slate-200/60">
              {report.overallSummary}
            </p>
          </div>

          {/* 橫向校準評分排行榜 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  全篇章橫向校準評分榜 (拉開真實鑑別度)
                </h3>
                <span className="text-xs text-slate-500">
                  原單篇打分易趨中，經橫向多篇對比重新校正
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/80">
                    <th className="py-2.5 px-3 text-center w-14">名次</th>
                    <th className="py-2.5 px-3">文章標題</th>
                    <th className="py-2.5 px-3 text-center w-28">撰寫日期</th>
                    <th className="py-2.5 px-3 text-center w-20">原單篇分</th>
                    <th className="py-2.5 px-3 text-center w-24">校準後分數</th>
                    <th className="py-2.5 px-3">橫向對比調校理由</th>
                    {onSelectEssay && <th className="py-2.5 px-3 text-center w-16">查看</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.calibratedRanks.map((item) => {
                    const diff = item.calibratedScore - item.originalScore;
                    return (
                      <tr key={item.essayId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            item.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            item.rank === 2 ? 'bg-slate-200 text-slate-700' :
                            item.rank === 3 ? 'bg-amber-700/10 text-amber-900' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {item.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {item.title}
                        </td>
                        <td className="py-3 px-3 text-center text-xs text-slate-500">
                          {item.date}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">
                          {item.originalScore}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 font-bold">
                            <span className="text-slate-900 text-base">{item.calibratedScore}</span>
                            {diff > 0 && (
                              <span className="text-[11px] text-emerald-600 font-semibold">(+{diff})</span>
                            )}
                            {diff < 0 && (
                              <span className="text-[11px] text-rose-600 font-semibold">({diff})</span>
                            )}
                            {diff === 0 && (
                              <span className="text-[11px] text-slate-400 font-normal">(=)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600 leading-relaxed">
                          {item.calibrationReason}
                        </td>
                        {onSelectEssay && (
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                onSelectEssay(item.essayId);
                                onClose();
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                            >
                              開啟
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 跨篇高頻頑疾 Top 3-5 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                跨篇反覆出現的高頻頑疾 Top {report.commonErrorPatterns.length}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                即使換了寫作主題依然反覆踩中的深層盲點與思維模式
              </p>
            </div>

            <div className="space-y-4">
              {report.commonErrorPatterns.map((pattern, idx) => {
                const cat = CATEGORY_MAP[pattern.category] || CATEGORY_MAP.grammar;
                return (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${cat.badgeBg}`}>
                          {cat.label}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {idx + 1}. {pattern.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>累計出現約 <strong className="text-rose-600 font-semibold">{pattern.frequency}</strong> 次</span>
                        <span>•</span>
                        <span>影響 <strong className="text-slate-800 font-semibold">{pattern.affectedEssayCount}</strong> 篇文章</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      {pattern.description}
                    </p>

                    {/* 代表例句 */}
                    {pattern.examples && pattern.examples.length > 0 && (
                      <div className="space-y-2 mb-3 bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          真實文章實例比對
                        </span>
                        {pattern.examples.map((ex, eIdx) => (
                          <div key={eIdx} className="text-xs space-y-1">
                            <div className="flex items-start gap-1.5 text-slate-700">
                              <span className="text-rose-600 font-mono flex-shrink-0">✕ 原文:</span>
                              <span className="line-through decoration-rose-400 text-slate-500 font-mono">{ex.original}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0 mx-1 mt-0.5" />
                              <span className="text-emerald-700 font-medium font-mono">✓ {ex.improved}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 pl-4">{ex.explanation}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 突破指南 */}
                    <div className="flex items-start gap-2 bg-indigo-50/70 border border-indigo-100 rounded-lg p-2.5 text-xs text-indigo-950">
                      <Lightbulb className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-indigo-900">破除頑疾指南：</strong>
                        <span className="text-indigo-800">{pattern.advice}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 縱向成長軌跡與下一步戰略 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              縱向能力演進與下一階段行動方針
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-indigo-900 block mb-1">詞彙多樣與用字精確性</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {report.growthAnalysis.vocabularyProgress}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-indigo-900 block mb-1">文法控制度與句構多樣性</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {report.growthAnalysis.grammarProgress}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-indigo-900 block mb-1">篇章論述邏輯與銜接</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {report.growthAnalysis.coherenceProgress}
                </p>
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                下一階段突破瓶頸建議清單 (Strategic Action Plan)
              </h4>
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {report.growthAnalysis.strategicAdvice.map((adv, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-emerald-700">{idx + 1}.</span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            診斷生成於 {new Date(report.createdAt).toLocaleString('zh-TW')}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            關閉報告
          </button>
        </div>

      </div>
    </div>
  );
};
