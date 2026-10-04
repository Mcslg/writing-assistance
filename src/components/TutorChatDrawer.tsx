import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, Loader2, Quote } from 'lucide-react';
import { EssayAssessment, ChatMessage, GeminiSettings } from '../types/essay';
import { sendTutorChatMessage } from '../services/geminiService';
import { saveChatHistoryToDB, getChatHistoryFromDB } from '../services/storageService';

interface TutorChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: EssayAssessment;
  settings: GeminiSettings;
  focusedSentence?: string | null;
  onClearFocusedSentence?: () => void;
}

const QUICK_PROMPTS = [
  '這句話文法規則是什麼？請詳細解釋',
  '請提供 3 個母語者更常用的口語化說法',
  '如果想改寫成學術論文語氣，該怎麼說？',
  '這句有什麼常見的台式英文 (Chinglish) 陷阱嗎？',
];

export function TutorChatDrawer({
  isOpen,
  onClose,
  assessment,
  settings,
  focusedSentence,
  onClearFocusedSentence,
}: TutorChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 載入當前作文的對話歷史
  useEffect(() => {
    if (assessment.id) {
      getChatHistoryFromDB(assessment.id).then((history) => {
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // 預設歡迎訊息
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: `你好！我是你的 AI 英文寫作助教。我已經閱讀了《${assessment.title}》的批改診斷。\n\n你可以隨時點選句子追問「為什麼這樣改」，或在下方輸入你的疑問！`,
              timestamp: Date.now(),
            },
          ]);
        }
      });
    }
  }, [assessment.id, assessment.title]);

  // 自動捲動至底
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isSending) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: query,
      referencedSentence: focusedSentence || undefined,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsSending(true);

    try {
      const reply = await sendTutorChatMessage({
        apiKey: settings.apiKey,
        model: settings.model,
        assessment,
        chatHistory: messages,
        userMessage: query,
        referencedSentence: focusedSentence || undefined,
      });

      const assistantMsg: ChatMessage = {
        id: `reply_${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      await saveChatHistoryToDB(assessment.id, finalMessages);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `抱歉，助教暫時無法回應: ${err.message}`,
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slide-left">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              AI 寫作助教 (Tutor)
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              上下文：{assessment.title.slice(0, 20)}...
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Focused Sentence Banner if selected */}
      {focusedSentence && (
        <div className="p-3 bg-indigo-50/80 border-b border-indigo-100 flex items-start justify-between gap-2 text-xs">
          <div className="flex items-start gap-1.5 text-indigo-900">
            <Quote className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[10px] uppercase text-indigo-600 tracking-wider block">
                正在聚焦討論此句：
              </span>
              <p className="font-serif italic text-slate-700">{focusedSentence}</p>
            </div>
          </div>
          {onClearFocusedSentence && (
            <button
              type="button"
              onClick={onClearFocusedSentence}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              title="取消聚焦"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs leading-relaxed ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-xs whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-none'
              }`}
            >
              {msg.referencedSentence && (
                <div className="mb-1.5 pb-1 border-b border-indigo-500/30 text-[10px] opacity-80 italic">
                  針對："{msg.referencedSentence.slice(0, 30)}..."
                </div>
              )}
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-10">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>助教正在思考並整理學習建議...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(qp)}
            disabled={isSending}
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg text-slate-600 whitespace-nowrap transition disabled:opacity-50"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="向助教提問（例: 為什麼這裡不用 was?）..."
            disabled={isSending}
            className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
