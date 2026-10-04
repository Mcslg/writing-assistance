export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type WritingGoal = 'general' | 'academic' | 'business' | 'exam' | 'creative';

// 5 大修改建議分類
export type SuggestionCategory = 'grammar' | 'spelling' | 'vocabulary' | 'conciseness' | 'style';

export interface ScoreBreakdown {
  overall: number;       // 0 - 100
  grammar: number;       // 0 - 100 文法與拼字準確度
  vocabulary: number;    // 0 - 100 詞彙豐富度與精確度
  coherence: number;     // 0 - 100 篇章流暢與邏輯連貫性
  expression: number;    // 0 - 100 語氣與地道表達
}

// 各類考試預估成績結構
export interface ExamScoreDetail {
  examName: string;          // 測驗名稱（如「台灣學測英文作文」、「IELTS 雅思寫作」）
  scale: string;             // 滿分與制式（如「滿分 20 分」、「0 - 9.0」）
  estimatedScore: string;    // 預估分數（如「15 / 20 分 (約 13~14 級分水準)」、「6.5 / 9.0」）
  rubricBreakdownZh: string;  // 評核理由與評分標準簡要說明
}

export interface ExamEstimates {
  gsat: ExamScoreDetail;     // 台灣大學學測
  ielts: ExamScoreDetail;    // 雅思學術/一般寫作
  toefl: ExamScoreDetail;    // 托福 iBT 寫作
  toeic: ExamScoreDetail;    // 多益寫作測驗
}

// 籠統字/詞彙深度拆解介面（按需非同步載入）
export interface NuanceAnalysis {
  word: string;
  contextMeaningZh: string;        // 在本句中的精確含義說明
  generalMeanings: Array<{         // 該原字常見的多種涵義拆解
    meaningZh: string;
    example: string;
  }>;
  contextualReplacements: Array<{   // 在當前情境下推薦的替換詞與微差異
    word: string;
    nuanceZh: string;
    cefr?: CEFRLevel;
  }>;
}

// 字級/片語級精確修改建議
export interface WordLevelSuggestion {
  id: string;
  category: SuggestionCategory;
  ruleName: string;                // 繁體中文規則名稱（如「主謂一致」、「時態混淆」、「贅言消除」）
  originalSpan: string;            // 原文中的精確字詞/片語
  suggestedSpan: string;           // 建議替換的字詞/片語（若為贅字移除可為空字串）
  explanationZh: string;           // 繁體中文詳細解釋
  alternatives?: string[];         // 2-3 個其他替換選擇
  isGeneralWord?: boolean;         // 是否屬於籠統字（可進一步展開深度拆解）
  cefrLevel?: CEFRLevel;           // 建議用詞等級
  isAccepted?: boolean;            // 是否已採納
}

// 逐句總結（保留用於全局報告）
export interface SentenceAnalysis {
  sentenceIndex: number;
  original: string;
  improved: string;
  hasChange: boolean;
  type?: SuggestionCategory;
  explanationZh: string;
  alternativePhrasings?: string[];
}

export interface SummaryFeedback {
  strengths: string[];
  improvements: string[];
  overallCommentsZh: string;
  recommendedFocus: string;
}

export interface EssayAssessment {
  id: string;
  title: string;
  promptTopic?: string;
  writingGoal: WritingGoal;
  originalText: string;
  improvedText: string;
  cefrLevel: CEFRLevel;
  scores: ScoreBreakdown;
  summary: SummaryFeedback;
  wordSuggestions: WordLevelSuggestion[]; // 字級/片語級建議
  sentenceAnalyses: SentenceAnalysis[];   // 逐句解析
  examEstimates?: ExamEstimates;          // 各大英文考試換算估分
  wordCount: {
    original: number;
    improved: number;
  };
  modelUsed: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  referencedSentence?: string;
  timestamp: number;
}

export interface GeminiSettings {
  apiKey: string;
  model: string;
  customModel?: string;
  temperature?: number;
}

export const SUPPORTED_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (預設推薦)', description: '兼顧快速回應與優異改寫能力' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (輕量替補)', description: '極低延遲，適合長文即時回饋' },
  { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro (深度分析)', description: '更細膩的篇章邏輯與高級詞彙分析' },
] as const;
