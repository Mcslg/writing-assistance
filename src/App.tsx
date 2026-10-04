import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Header,
} from './components/Header';
import { ApiKeyModal } from './components/ApiKeyModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { TutorChatDrawer } from './components/TutorChatDrawer';
import { EssayInputArea } from './components/EssayInputArea';
import { InteractiveAnnotatedEditor } from './components/InteractiveAnnotatedEditor';
import { AssessmentReport } from './components/AssessmentReport';
import { DiffViewer } from './components/DiffViewer';
import { SentenceAnalysisList } from './components/SentenceAnalysisList';

import {
  EssayAssessment,
  GeminiSettings,
  WritingGoal,
  SentenceAnalysis,
} from './types/essay';

import {
  getStoredSettings,
  saveStoredSettings,
  wipeAllLocalData,
  saveAssessmentToDB,
  getAllAssessmentsFromDB,
  deleteAssessmentFromDB,
  clearAllAssessmentsFromDB,
} from './services/storageService';

import { analyzeEssayWithGemini } from './services/geminiService';
import { Bot, RefreshCw, AlertCircle, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
  // Settings & Modals state
  const [settings, setSettings] = useState<GeminiSettings>(getStoredSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Data state
  const [assessments, setAssessments] = useState<EssayAssessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<EssayAssessment | null>(null);
  const [focusedSentence, setFocusedSentence] = useState<string | null>(null);
  const [textMode, setTextMode] = useState<'input' | 'review'>('input');
  const [currentWorkingText, setCurrentWorkingText] = useState<string>('');
  const [showSentenceList, setShowSentenceList] = useState(false);

  // Loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 初始載入歷史紀錄
  useEffect(() => {
    getAllAssessmentsFromDB().then((items) => {
      setAssessments(items);
    });
  }, []);

  // 儲存設定
  const handleSaveSettings = (newSettings: GeminiSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  // 一鍵清空所有資料
  const handleWipeAllData = async () => {
    await wipeAllLocalData();
    setSettings(getStoredSettings());
    setAssessments([]);
    setCurrentAssessment(null);
    setTextMode('input');
    setCurrentWorkingText('');
  };

  // 開始批改
  const handleAnalyzeEssay = async (text: string, goal: WritingGoal, topic?: string) => {
    if (!settings.apiKey?.trim()) {
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const assessment = await analyzeEssayWithGemini({
        apiKey: settings.apiKey,
        model: settings.model,
        essayText: text,
        writingGoal: goal,
        promptTopic: topic,
      });

      setCurrentAssessment(assessment);
      setCurrentWorkingText(text);
      setTextMode('review');
      await saveAssessmentToDB(assessment);

      // 更新歷史列表
      const updatedList = await getAllAssessmentsFromDB();
      setAssessments(updatedList);

      // 微慶祝動效
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '批改分析時發生未知錯誤，請檢查網路連線或 API Key。');
    } finally {
      setIsLoading(false);
    }
  };

  // 刪除單筆紀錄
  const handleDeleteAssessment = async (id: string) => {
    await deleteAssessmentFromDB(id);
    const updated = await getAllAssessmentsFromDB();
    setAssessments(updated);
    if (currentAssessment?.id === id) {
      setCurrentAssessment(null);
    }
  };

  // 清空所有歷史紀錄
  const handleClearAllHistory = async () => {
    await clearAllAssessmentsFromDB();
    setAssessments([]);
    setCurrentAssessment(null);
  };

  // 從逐句清單點擊「追問助教」
  const handleAskAboutSentence = (sentence: SentenceAnalysis) => {
    setFocusedSentence(sentence.original);
    setIsChatOpen(true);
  };

  // 點擊新增文章
  const handleNewEssay = () => {
    setCurrentAssessment(null);
    setFocusedSentence(null);
    setErrorMessage(null);
    setTextMode('input');
    setCurrentWorkingText('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navigation */}
      <Header
        settings={settings}
        historyCount={assessments.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewEssay={handleNewEssay}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-800 text-xs shadow-xs animate-shake">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-rose-900">分析未完成：</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 font-bold px-2 py-0.5"
            >
              關閉
            </button>
          </div>
        )}

        {/* Essay Area: Toggle between Interactive Annotated Review and Raw Input */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {currentAssessment && textMode === 'review'
                  ? '英文作文審閱與浮動建議'
                  : '英文作文輸入'}
              </h2>
              <p className="text-xs text-slate-500">
                {currentAssessment && textMode === 'review'
                  ? '點選文中標有波浪底線的句子，浮動視窗將顯示精確修正原因、替代說法與一鍵採納'
                  : '貼上欲改善的文章，AI 將依據選定的目標進行語法診斷與高階潤飾'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentAssessment && textMode === 'input' && (
                <button
                  type="button"
                  onClick={() => setTextMode('review')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                >
                  返回審閱浮動視窗
                </button>
              )}
              {currentAssessment && (
                <button
                  type="button"
                  onClick={handleNewEssay}
                  className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 撰寫新篇章
                </button>
              )}
            </div>
          </div>

          {currentAssessment && textMode === 'review' ? (
            <InteractiveAnnotatedEditor
              originalText={currentWorkingText || currentAssessment.originalText}
              wordSuggestions={currentAssessment.wordSuggestions || []}
              settings={settings}
              onApplyAllChanges={(updated) => setCurrentWorkingText(updated)}
              onAskTutor={(query) => {
                setFocusedSentence(query);
                setIsChatOpen(true);
              }}
              onSwitchToEdit={() => setTextMode('input')}
            />
          ) : (
            <EssayInputArea
              initialText={currentWorkingText || (currentAssessment ? currentAssessment.originalText : '')}
              initialTopic={currentAssessment?.promptTopic || ''}
              initialGoal={currentAssessment?.writingGoal || 'general'}
              onSubmit={handleAnalyzeEssay}
              isLoading={isLoading}
              hasApiKey={!!settings.apiKey?.trim()}
              onPromptApiKey={() => setIsSettingsOpen(true)}
            />
          )}
        </section>

        {/* Assessment Section (Rendered when available) */}
        {currentAssessment && (
          <section id="assessment-section" className="space-y-6 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>批改診斷報告：{currentAssessment.title}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  模型：{currentAssessment.modelUsed} • 完成於{' '}
                  {new Date(currentAssessment.createdAt).toLocaleTimeString()}
                </p>
              </div>

              {/* Float Chat Trigger */}
              <button
                type="button"
                onClick={() => {
                  setFocusedSentence(null);
                  setIsChatOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
              >
                <Bot className="w-4 h-4" />
                <span>開啟 AI 助教對話</span>
              </button>
            </div>

            {/* 1. Dashboard Overview */}
            <AssessmentReport
              assessment={currentAssessment}
              onOpenChatWithTopic={() => {
                setFocusedSentence(null);
                setIsChatOpen(true);
              }}
            />

            {/* 2. Full-text Diff Viewer */}
            <DiffViewer
              originalText={currentAssessment.originalText}
              improvedText={currentAssessment.improvedText}
            />

            {/* 3. Collapsible Sentence-by-sentence detailed breakdown */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSentenceList(!showSentenceList)}
                className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 hover:text-indigo-600 transition flex items-center justify-center gap-2 shadow-xs"
              >
                <ListChecks className="w-4 h-4" />
                <span>
                  {showSentenceList
                    ? '收合全文逐句清單'
                    : `查看全文逐句詳細清單 (共 ${currentAssessment.sentenceAnalyses.length} 句)`}
                </span>
                {showSentenceList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSentenceList && (
                <div className="mt-4 animate-fade-in">
                  <SentenceAnalysisList
                    sentenceAnalyses={currentAssessment.sentenceAnalyses}
                    onAskAboutSentence={handleAskAboutSentence}
                  />
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button for Chat when assessment exists and chat is closed */}
      {currentAssessment && !isChatOpen && (
        <button
          type="button"
          onClick={() => {
            setFocusedSentence(null);
            setIsChatOpen(true);
          }}
          className="fixed bottom-6 right-6 z-30 p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center gap-2 text-xs font-bold transition hover:scale-105 active:scale-95"
          title="開啟隨身 AI 助教"
        >
          <Bot className="w-5 h-5" />
          <span className="hidden sm:inline">提問助教</span>
        </button>
      )}

      {/* Modals & Drawers */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onClearAllData={handleWipeAllData}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        assessments={assessments}
        currentId={currentAssessment?.id}
        onSelectAssessment={(item) => {
          setCurrentAssessment(item);
          setCurrentWorkingText(item.originalText);
          setTextMode('review');
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        }}
        onDeleteAssessment={handleDeleteAssessment}
        onClearAll={handleClearAllHistory}
      />

      {currentAssessment && (
        <TutorChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          assessment={currentAssessment}
          settings={settings}
          focusedSentence={focusedSentence}
          onClearFocusedSentence={() => setFocusedSentence(null)}
        />
      )}
    </div>
  );
}
