import { Sparkles, Key, History, PlusCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { GeminiSettings } from '../types/essay';

interface HeaderProps {
  settings: GeminiSettings;
  historyCount: number;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onNewEssay: () => void;
}

export function Header({
  settings,
  historyCount,
  onOpenSettings,
  onOpenHistory,
  onNewEssay,
}: HeaderProps) {
  const hasKey = !!settings.apiKey?.trim();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-800 text-lg tracking-tight">WritingCraft AI</h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Gemini 驅動
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              通用英語學習者的智慧批改、潤飾與即時 AI 助教
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onNewEssay}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl border border-slate-200 transition shadow-sm"
            title="開啟新作文"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">新文章</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl border border-slate-200 transition shadow-sm"
            title="查看歷史紀錄"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">歷史紀錄</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* API Key Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition shadow-sm ${
              hasKey
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 animate-pulse'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline font-mono text-[11px] text-slate-600">
              {settings.model}
            </span>
            {hasKey ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">已配置</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-amber-700 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>填入 Key</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
