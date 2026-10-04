import { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, Trash2, X, ExternalLink, Loader2 } from 'lucide-react';
import { GeminiSettings, SUPPORTED_MODELS } from '../types/essay';
import { validateApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GeminiSettings;
  onSave: (settings: GeminiSettings) => void;
  onClearAllData: () => void;
}

export function ApiKeyModal({ isOpen, onClose, settings, onSave, onClearAllData }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [model, setModel] = useState(settings.model || 'gemini-3.5-flash');
  const [customModel, setCustomModel] = useState(settings.customModel || '');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const targetModel = model === 'custom' ? customModel : model;
    const res = await validateApiKey(apiKey, targetModel);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = () => {
    const targetModel = model === 'custom' ? (customModel.trim() || 'gemini-3.5-flash') : model;
    onSave({
      apiKey: apiKey.trim(),
      model: targetModel,
      customModel: customModel.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Gemini API 設定</h3>
              <p className="text-xs text-slate-500">金鑰僅存於您的本地瀏覽器，絕不上傳第三方伺服器</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700">Gemini API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
              >
                免費獲取 Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="貼上 AI Studio 取得的 API Key (AIza...)"
                className="w-full pr-10 pl-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 transition"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">驅動模型選擇</label>
            <div className="space-y-2">
              {SUPPORTED_MODELS.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    model === item.id
                      ? 'border-indigo-500 bg-indigo-50/40 text-slate-800'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="modelSelection"
                    checked={model === item.id}
                    onChange={() => {
                      setModel(item.id);
                      setTestResult(null);
                    }}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.description}</div>
                  </div>
                </label>
              ))}

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  model === 'custom'
                    ? 'border-indigo-500 bg-indigo-50/40'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="modelSelection"
                  checked={model === 'custom'}
                  onChange={() => {
                    setModel('custom');
                    setTestResult(null);
                  }}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="w-full">
                  <div className="text-sm font-semibold text-slate-800">自訂模型名稱 (Custom Model)</div>
                  {model === 'custom' && (
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="例: gemini-2.0-flash 或 fine-tuned model"
                      className="mt-2 w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                testResult.valid
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold">
                  {testResult.valid ? 'API Key 驗證成功！可正常連線。' : '驗證失敗'}
                </span>
                {testResult.error && <p className="mt-0.5 opacity-90 break-all">{testResult.error}</p>}
              </div>
            </div>
          )}

          {/* Clear Data Danger Zone */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>重置本地狀態：</span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('確定要清除所有已儲存的 API Key 與作文歷史紀錄嗎？此動作無法復原。')) {
                  onClearAllData();
                  setApiKey('');
                  setTestResult(null);
                  onClose();
                }
              }}
              className="text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> 一鍵清空所有本地資料
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            disabled={!apiKey.trim() || isTesting}
            onClick={handleTestConnection}
            className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            測試金鑰連線
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition"
            >
              儲存設定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
