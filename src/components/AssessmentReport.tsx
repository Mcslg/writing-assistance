import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  TrendingUp,
  Compass,
  Copy,
  Check,
  MessageSquare,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { EssayAssessment, ExamEstimates } from '../types/essay';

interface AssessmentReportProps {
  assessment: EssayAssessment;
  onOpenChatWithTopic?: (topic: string) => void;
}

const CEFR_DESCRIPTIONS: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  A1: { label: 'A1 入門級 (Breakthrough)', desc: '能理解並運用極基本的日常用語與簡短語句。', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
  A2: { label: 'A2 初級 (Waystage)', desc: '能進行與日常切身相關主題的簡單直接溝通。', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
  B1: { label: 'B1 進階級 (Threshold)', desc: '能清楚描述熟悉主題、工作或旅遊經歷，文意清晰。', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
  B2: { label: 'B2 高階級 (Vantage)', desc: '能針對多樣主題進行流暢連貫的表達，語法結構豐富。', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-300' },
  C1: { label: 'C1 流利級 (Effective)', desc: '靈活精確運用複雜詞彙與多樣句型，邏輯嚴謹。', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300' },
  C2: { label: 'C2 精通級 (Mastery)', desc: '近乎母語者的表達力，用詞極其精準生動。', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
};

function getFallbackExamEstimates(overallScore: number): ExamEstimates {
  const gsatRaw = Math.round((overallScore / 100) * 20 * 10) / 10;
  const gsatGrade = gsatRaw >= 17 ? '15 (滿級分)' : gsatRaw >= 15 ? '13~14 級分 (頂標)' : gsatRaw >= 12 ? '11~12 級分 (前標)' : gsatRaw >= 9 ? '8~10 級分 (均標)' : '後標或待加強';
  const ieltsBand = overallScore >= 90 ? '8.0' : overallScore >= 80 ? '7.0' : overallScore >= 70 ? '6.5' : overallScore >= 60 ? '6.0' : overallScore >= 50 ? '5.5' : '5.0';
  const toeflScore = Math.min(30, Math.max(10, Math.round((overallScore / 100) * 30)));
  const toeicScore = Math.min(200, Math.max(60, Math.round((overallScore / 100) * 200 / 10) * 10));

  return {
    gsat: {
      examName: '台灣學測英文作文 (GSAT)',
      scale: '滿分 20 分',
      estimatedScore: `${gsatRaw} / 20 分 (推估約 ${gsatGrade})`,
      rubricBreakdownZh: '大考中心規準：內容充實、組織架構、文法句構完整性與字彙拼字正確度推估。',
    },
    ielts: {
      examName: 'IELTS 雅思寫作測驗',
      scale: 'Band 0 - 9.0',
      estimatedScore: `Band ${ieltsBand} / 9.0`,
      rubricBreakdownZh: '依據 Task Response, Cohesion, Lexical, Grammar 四大向度評定。',
    },
    toefl: {
      examName: 'TOEFL iBT 托福寫作',
      scale: '滿分 30 分',
      estimatedScore: `${toeflScore} / 30 分`,
      rubricBreakdownZh: '依據學術論述深度、舉例邏輯與語言使用流暢度推估。',
    },
    toeic: {
      examName: 'TOEIC 多益寫作測驗',
      scale: '滿分 200 分',
      estimatedScore: `${toeicScore} / 200 分`,
      rubricBreakdownZh: '依據職場書信回覆、觀點論述邏輯與商務語境適切性評定。',
    },
  };
}

export function AssessmentReport({ assessment, onOpenChatWithTopic }: AssessmentReportProps) {
  const [copied, setCopied] = useState(false);
  const [isExamEstimatesOpen, setIsExamEstimatesOpen] = useState(false);

  const cefrInfo = CEFR_DESCRIPTIONS[assessment.cefrLevel] || CEFR_DESCRIPTIONS.B1;
  const examEstimates = assessment.examEstimates || getFallbackExamEstimates(assessment.scores.overall);

  const handleCopyImproved = () => {
    navigator.clipboard.writeText(assessment.improvedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreMetrics = [
    { label: '文法與拼字準確度 (Grammar)', score: assessment.scores.grammar, desc: '時態、主謂一致、標點' },
    { label: '詞彙豐富與多樣度 (Vocabulary)', score: assessment.scores.vocabulary, desc: '用字深度、同義詞靈活度' },
    { label: '篇章邏輯與連貫性 (Coherence)', score: assessment.scores.coherence, desc: '過渡轉折、論述結構' },
    { label: '表達自然與母語感 (Expression)', score: assessment.scores.expression, desc: '慣用搭配、修辭語氣' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6 p-6">
      {/* Top Banner: Score & CEFR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50/40 to-violet-50/50 border border-indigo-100/80">
        {/* Overall Score */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-indigo-100 flex flex-col items-center justify-center shrink-0">
            <span className="text-2xl font-black text-indigo-600 tracking-tight">
              {assessment.scores.overall}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase -mt-0.5">總評分 / 100</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">寫作品質綜合評分</h3>
            <p className="text-xs text-slate-500 mt-0.5">基於語言準確度與連貫性加權評定</p>
          </div>
        </div>

        {/* CEFR Level Tag */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border ${cefrInfo.bg} ${cefrInfo.color} font-black text-lg shadow-xs shrink-0`}>
            {assessment.cefrLevel}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">{cefrInfo.label}</span>
              <Award className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{cefrInfo.desc}</p>
          </div>
        </div>

        {/* Quick Action: Copy Improved Text */}
        <div className="flex items-center justify-start md:justify-end gap-2">
          <button
            type="button"
            onClick={handleCopyImproved}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            {copied ? '已複製潤飾全文' : '複製潤飾全文'}
          </button>
        </div>
      </div>

      {/* Metrics Breakdown Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {scoreMetrics.map((m, idx) => (
          <div key={idx} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-700">{m.label}</span>
              <span className="font-mono font-bold text-indigo-600">{m.score}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  m.score >= 85 ? 'bg-emerald-500' : m.score >= 70 ? 'bg-indigo-500' : 'bg-amber-500'
                }`}
                style={{ width: `${m.score}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* 各大英文檢定/考試換算估分（收合欄位） */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
        <button
          type="button"
          onClick={() => setIsExamEstimatesOpen(!isExamEstimatesOpen)}
          className="w-full px-5 py-3.5 flex items-center justify-between bg-white hover:bg-slate-50/90 text-left transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800">
                各類英語考試換算預估成績 (學測 / 雅思 / 托福 / 多益)
              </span>
              <p className="text-[11px] text-slate-500">
                依據大考中心與國際標準對標目前文章水平之預估給分
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
            <span>{isExamEstimatesOpen ? '收合估分' : '展開估分'}</span>
            {isExamEstimatesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isExamEstimatesOpen && (
          <div className="p-5 border-t border-slate-200/80 bg-slate-50/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-fade-in">
            {/* 1. 台灣學測 */}
            <div className="p-3.5 bg-white rounded-xl border border-indigo-100/90 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">台灣學測英文作文</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold font-mono">
                  {examEstimates.gsat.scale}
                </span>
              </div>
              <div className="text-base font-black text-indigo-600 tracking-tight">
                {examEstimates.gsat.estimatedScore}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                {examEstimates.gsat.rubricBreakdownZh}
              </p>
            </div>

            {/* 2. 雅思 IELTS */}
            <div className="p-3.5 bg-white rounded-xl border border-rose-100/90 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-950">IELTS 雅思寫作</span>
                <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold font-mono">
                  {examEstimates.ielts.scale}
                </span>
              </div>
              <div className="text-base font-black text-rose-600 tracking-tight">
                {examEstimates.ielts.estimatedScore}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                {examEstimates.ielts.rubricBreakdownZh}
              </p>
            </div>

            {/* 3. 托福 TOEFL */}
            <div className="p-3.5 bg-white rounded-xl border border-amber-100/90 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950">TOEFL iBT 托福寫作</span>
                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold font-mono">
                  {examEstimates.toefl.scale}
                </span>
              </div>
              <div className="text-base font-black text-amber-600 tracking-tight">
                {examEstimates.toefl.estimatedScore}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                {examEstimates.toefl.rubricBreakdownZh}
              </p>
            </div>

            {/* 4. 多益 TOEIC */}
            <div className="p-3.5 bg-white rounded-xl border border-emerald-100/90 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">TOEIC 多益寫作</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono">
                  {examEstimates.toeic.scale}
                </span>
              </div>
              <div className="text-base font-black text-emerald-600 tracking-tight">
                {examEstimates.toeic.estimatedScore}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                {examEstimates.toeic.rubricBreakdownZh}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Highlights & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>本文優點與亮點 (Strengths)</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {assessment.summary.strengths.map((s, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>建議加強面向 (Areas to Improve)</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {assessment.summary.improvements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold shrink-0">•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Overall Comments & Focus */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Compass className="w-4 h-4 text-indigo-600" />
            <span>導師綜合指導與下一步學習方向</span>
          </div>
          {onOpenChatWithTopic && (
            <button
              type="button"
              onClick={() => onOpenChatWithTopic('我想了解我的作文整體該如何突破提升？')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" /> 追問導師
            </button>
          )}
        </div>
        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
          {assessment.summary.overallCommentsZh}
        </p>
        <div className="pt-2 border-t border-slate-200/60 text-slate-600 flex items-center gap-1.5">
          <strong className="text-indigo-600 font-semibold shrink-0">建議專注點：</strong>
          <span>{assessment.summary.recommendedFocus}</span>
        </div>
      </div>
    </div>
  );
}
