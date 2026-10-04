import { History, X, Trash2, Calendar, FileText, Download } from 'lucide-react';
import { EssayAssessment } from '../types/essay';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assessments: EssayAssessment[];
  currentId?: string;
  onSelectAssessment: (assessment: EssayAssessment) => void;
  onDeleteAssessment: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  assessments,
  currentId,
  onSelectAssessment,
  onDeleteAssessment,
  onClearAll,
}: HistoryDrawerProps) {
  if (!isOpen) return null;

  const handleExportMarkdown = (item: EssayAssessment, e: React.MouseEvent) => {
    e.stopPropagation();
    const md = `
# 英文作文批改報告: ${item.title}
- **評估等級**: CEFR ${item.cefrLevel} (綜合評分: ${item.scores.overall}/100)
- **寫作目標**: ${item.writingGoal}
- **批改時間**: ${new Date(item.createdAt).toLocaleString()}
- **模型驅動**: ${item.modelUsed}

---

## 一、 原文 (Original)
${item.originalText}

---

## 二、 潤飾建議 (Enhanced)
${item.improvedText}

---

## 三、 多維度評分
- 文法與拼字: ${item.scores.grammar}/100
- 詞彙豐富度: ${item.scores.vocabulary}/100
- 篇章連貫性: ${item.scores.coherence}/100
- 地道表達力: ${item.scores.expression}/100

---

## 四、 導師綜合評語
${item.summary.overallCommentsZh}

### 本文亮點
${item.summary.strengths.map((s) => `- ${s}`).join('\n')}

### 建議加強
${item.summary.improvements.map((i) => `- ${i}`).join('\n')}

---

## 五、 逐句修訂與學習點
${item.sentenceAnalyses
  .map(
    (s) => `### 第 ${s.sentenceIndex} 句
- **原文**: ${s.original}
- **潤飾**: ${s.improved}
- **說明**: ${s.explanationZh}
${s.alternativePhrasings?.length ? `- **其他說法**: ${s.alternativePhrasings.join(' / ')}` : ''}
`
  )
  .join('\n')}
    `.trim();

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Essay_Feedback_${item.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-full sm:w-[420px] bg-white shadow-2xl border-r border-slate-200 flex flex-col animate-slide-right">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">歷史批改紀錄</h3>
            <p className="text-[11px] text-slate-500">保存在本機 IndexedDB</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
        {assessments.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            目前尚無歷史紀錄。送出您的第一篇作文批改吧！
          </div>
        ) : (
          assessments.map((item) => {
            const isSelected = item.id === currentId;
            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelectAssessment(item);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition cursor-pointer group ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/30 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-bold text-slate-800 text-xs line-clamp-1 group-hover:text-indigo-600 transition">
                    {item.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 shrink-0">
                    {item.cefrLevel} • {item.scores.overall}分
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 font-serif mb-2.5">
                  {item.originalText}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {item.wordCount.original} 字
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleExportMarkdown(item, e)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                      title="匯出 Markdown 報告"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('確定要刪除這筆批改紀錄嗎？')) {
                          onDeleteAssessment(item.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="刪除紀錄"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer */}
      {assessments.length > 0 && (
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('確定要清空所有的作文歷史紀錄嗎？')) {
                onClearAll();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 px-3 py-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> 清空所有歷史紀錄
          </button>
        </div>
      )}
    </div>
  );
}
