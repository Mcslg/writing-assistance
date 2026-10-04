import { useState, useId } from 'react';
import { Sparkles, FileText, Target, BookOpen, Loader2, Eraser } from 'lucide-react';
import { WritingGoal } from '../types/essay';
import { countWords } from '../services/geminiService';

interface EssayInputAreaProps {
  initialText?: string;
  initialTopic?: string;
  initialGoal?: WritingGoal;
  onSubmit: (text: string, goal: WritingGoal, topic?: string) => void;
  isLoading: boolean;
  hasApiKey: boolean;
  onPromptApiKey: () => void;
}

const SAMPLE_ESSAYS: Array<{ title: string; goal: WritingGoal; topic: string; text: string }> = [
  {
    title: '日常生活範例 (General Daily)',
    goal: 'general',
    topic: 'A Memorable Weekend Trip',
    text: `Last week, I go to the mountain with my family. The weather was very nice and sunny, so everyone are feeling very excited. We take a lot of pictures and eat delicious foods on the top of the hill. However, on the way back, our car break down sudden. We wait for two hours until a kind man help us. Although it was a little dangerous, but I still think it is a unforgettable experience that I will remember forever.`,
  },
  {
    title: '應試論說文範例 (IELTS/Exam)',
    goal: 'exam',
    topic: 'Should Remote Work Replace Traditional Offices?',
    text: `In recent years, more and more people works from home due to advanced technologies. In my opinion, I agree that remote working brings many advantages, but it also have serious drawbacks. Firstly, employees can saving a lot of commute times and spend more moments with their families. Secondly, company can reduce their office rental costs. On the other hand, working alone at home make people feel lonely easily. In conclusion, I believe a hybrid model is more better than completely working from home.`,
  },
  {
    title: '商用書信範例 (Business)',
    goal: 'business',
    topic: 'Project Delay Notification',
    text: `Dear Mr. Smith,\n\nI am write this email to tell you about the delay of our project. Because our supplier did not send the materials on time, so we cannot finish the testing phase this Friday. We are very sorry for make you inconvenience. We will try our best to push them and hope to deliver the product next Wednesday. Please let me know if you have any questions.\n\nBest regards,\nAlex`,
  },
];

export function EssayInputArea({
  initialText = '',
  initialTopic = '',
  initialGoal = 'general',
  onSubmit,
  isLoading,
  hasApiKey,
  onPromptApiKey,
}: EssayInputAreaProps) {
  const [text, setText] = useState(initialText);
  const [topic, setTopic] = useState(initialTopic);
  const [goal, setGoal] = useState<WritingGoal>(initialGoal);
  const topicInputId = useId();

  const words = countWords(text);
  const chars = text.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasApiKey) {
      onPromptApiKey();
      return;
    }
    if (!text.trim()) return;
    onSubmit(text, goal, topic.trim() || undefined);
  };

  const handleLoadSample = (sample: typeof SAMPLE_ESSAYS[0]) => {
    setText(sample.text);
    setTopic(sample.topic);
    setGoal(sample.goal);
  };

  const handleClear = () => {
    if (text.trim() && window.confirm('確定要清空當前輸入的內容嗎？')) {
      setText('');
      setTopic('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition">
      {/* Top Setting Bar */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        {/* Goal Selector */}
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-700">寫作目標：</span>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as WritingGoal)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="general">通用日常英語 (日常基礎、生活敘事)</option>
            <option value="exam">應試檢定 (IELTS / TOEFL / 升學作文)</option>
            <option value="academic">學術論文 (論文、客觀嚴謹)</option>
            <option value="business">商務書信 (職場職場、簡潔正式)</option>
            <option value="creative">故事敘事 (文學創意、描寫修辭)</option>
          </select>
        </div>

        {/* Quick Samples Dropdown */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-500 font-medium">載入測試範文：</span>
          <div className="flex items-center gap-1.5">
            {SAMPLE_ESSAYS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadSample(s)}
                className="px-2.5 py-1 text-xs bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg transition"
              >
                {idx === 0 ? '日常' : idx === 1 ? '應試' : '商務'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Topic Input (Optional) */}
        <div>
          <label htmlFor={topicInputId} className="block text-xs font-semibold text-slate-600 mb-1">
            作文題目或寫作背景 (選填)
          </label>
          <input
            id={topicInputId}
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例: My Favorite Hobby 或 An email to reschedule a meeting"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="在此輸入或貼上您的英文作文... (建議 50 ~ 800 字)"
            className="w-full p-4 bg-slate-50/60 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-normal transition resize-y"
          />
          {text.trim() && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
              title="清空文字"
            >
              <Eraser className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Bar: Stats and Submit */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <strong className="text-slate-700 font-semibold">{words}</strong> 字 (Words)
            </span>
            <span>
              <strong className="text-slate-700 font-semibold">{chars}</strong> 字元 (Chars)
            </span>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className={`px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition ${
              isLoading
                ? 'bg-indigo-400 text-white cursor-not-allowed'
                : !text.trim()
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:shadow'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemini 深入批改中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>開始批改與智慧潤飾</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
