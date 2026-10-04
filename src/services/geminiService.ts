import {
  EssayAssessment,
  WritingGoal,
  ChatMessage,
  WordLevelSuggestion,
  NuanceAnalysis,
  ExamEstimates,
} from '../types/essay';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// 批改結果的 JSON Schema 定義 (先 improvedText 再 wordSuggestions)
const ASSESSMENT_JSON_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', description: '文章簡短英文或中文標題' },
    cefrLevel: {
      type: 'STRING',
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      description: '原文的歐洲語言共同參考架構等級估計',
    },
    scores: {
      type: 'OBJECT',
      properties: {
        overall: { type: 'INTEGER', description: '整體總分 0-100' },
        grammar: { type: 'INTEGER', description: '文法與標點拼字正確性 0-100' },
        vocabulary: { type: 'INTEGER', description: '詞彙多樣與用字精確度 0-100' },
        coherence: { type: 'INTEGER', description: '段落銜接與邏輯連貫性 0-100' },
        expression: { type: 'INTEGER', description: '語氣流暢與地道母語感 0-100' },
      },
      required: ['overall', 'grammar', 'vocabulary', 'coherence', 'expression'],
    },
    improvedText: {
      type: 'STRING',
      description: '【最優先產出】全文高品質潤飾後版本（維持原意，展現最自然的母語行文節奏與流暢度）',
    },
    examEstimates: {
      type: 'OBJECT',
      description: '各大常見英文測驗之換算估分與評核理由',
      properties: {
        gsat: {
          type: 'OBJECT',
          properties: {
            examName: { type: 'STRING' },
            scale: { type: 'STRING' },
            estimatedScore: { type: 'STRING', description: '例: 14.5 / 20 分 (約 13 級分)' },
            rubricBreakdownZh: { type: 'STRING', description: '依據學測四大向度(內容、組織、文法句構、字彙拼字)的簡要分析' },
          },
          required: ['examName', 'scale', 'estimatedScore', 'rubricBreakdownZh'],
        },
        ielts: {
          type: 'OBJECT',
          properties: {
            examName: { type: 'STRING' },
            scale: { type: 'STRING' },
            estimatedScore: { type: 'STRING', description: '例: Band 6.5 / 9.0' },
            rubricBreakdownZh: { type: 'STRING', description: '針對 Task Response, Cohesion, Lexical, Grammar 的簡要評核' },
          },
          required: ['examName', 'scale', 'estimatedScore', 'rubricBreakdownZh'],
        },
        toefl: {
          type: 'OBJECT',
          properties: {
            examName: { type: 'STRING' },
            scale: { type: 'STRING' },
            estimatedScore: { type: 'STRING', description: '例: 22 / 30 分' },
            rubricBreakdownZh: { type: 'STRING', description: '學術論述力度與語言發展說明' },
          },
          required: ['examName', 'scale', 'estimatedScore', 'rubricBreakdownZh'],
        },
        toeic: {
          type: 'OBJECT',
          properties: {
            examName: { type: 'STRING' },
            scale: { type: 'STRING' },
            estimatedScore: { type: 'STRING', description: '例: 150 / 200 分' },
            rubricBreakdownZh: { type: 'STRING', description: '職場書信與商務訊息傳達之評估' },
          },
          required: ['examName', 'scale', 'estimatedScore', 'rubricBreakdownZh'],
        },
      },
      required: ['gsat', 'ielts', 'toefl', 'toeic'],
    },
    wordSuggestions: {
      type: 'ARRAY',
      description: '【緊接對照提取】對照原文與 improvedText 之間的所有修改，精確提取為字級/片語級修改建議清單',
      items: {
        type: 'OBJECT',
        properties: {
          category: {
            type: 'STRING',
            enum: ['grammar', 'spelling', 'vocabulary', 'conciseness', 'style'],
            description: '修改建議類別：文法、拼字、詞彙、簡潔冗餘、語氣風格',
          },
          ruleName: {
            type: 'STRING',
            description: '具體規則標籤，如「主謂一致」、「時態混用」、「贅言消除」、「籠統詞替換」等繁體中文名稱',
          },
          originalSpan: {
            type: 'STRING',
            description: '原文中被修改的精確單字或最短片語（必須與原文文字完全相符）',
          },
          suggestedSpan: {
            type: 'STRING',
            description: '在 improvedText 中對應替換後的單字或片語（若是刪除贅字則為空字串 ""）',
          },
          explanationZh: {
            type: 'STRING',
            description: '修改理由與教學重點（繁體中文）',
          },
          alternatives: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: '其他 1-2 個同義可替換詞',
          },
          isGeneralWord: {
            type: 'BOOLEAN',
            description: '該字是否屬於籠統常用詞（如 good, get, thing, make 等）',
          },
          cefrLevel: {
            type: 'STRING',
            enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
            description: '建議詞彙之難度等級估計',
          },
        },
        required: ['category', 'ruleName', 'originalSpan', 'suggestedSpan', 'explanationZh'],
      },
    },
    summary: {
      type: 'OBJECT',
      properties: {
        strengths: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: '原文展現的 2-3 個優點（以繁體中文說明）',
        },
        improvements: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: '最需要加強的 2-3 個具體方向（以繁體中文說明）',
        },
        overallCommentsZh: {
          type: 'STRING',
          description: '整體綜合評語與激勵指導（以繁體中文說明）',
        },
        recommendedFocus: {
          type: 'STRING',
          description: '一句話總結下一步學習重點（以繁體中文說明）',
        },
      },
      required: ['strengths', 'improvements', 'overallCommentsZh', 'recommendedFocus'],
    },
    sentenceAnalyses: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          sentenceIndex: { type: 'INTEGER', description: '句子序號從 1 開始' },
          original: { type: 'STRING', description: '原文該句' },
          improved: { type: 'STRING', description: '潤飾後該句' },
          hasChange: { type: 'BOOLEAN', description: '是否有做修改' },
          type: {
            type: 'STRING',
            enum: ['grammar', 'spelling', 'vocabulary', 'conciseness', 'style'],
            description: '修改主要類型',
          },
          explanationZh: {
            type: 'STRING',
            description: '詳細修改原因及文法/詞彙學習點（以繁體中文說明）',
          },
          alternativePhrasings: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: '其他 1-2 種不同的地道英語表達方式',
          },
        },
        required: ['sentenceIndex', 'original', 'improved', 'hasChange', 'explanationZh'],
      },
    },
  },
  required: ['title', 'cefrLevel', 'scores', 'improvedText', 'examEstimates', 'wordSuggestions', 'summary'],
};

// 驗證 API Key 是否有效
export async function validateApiKey(apiKey: string, model: string = 'gemini-3.5-flash'): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: '請輸入 Gemini API Key' };
  }

  try {
    const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hello, confirm you are online with "OK".' }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const message = errData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      return { valid: false, error: message };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err.message || '連線逾時或網路錯誤' };
  }
}

// 寫作目標對應之提示詞強化
const GOAL_INSTRUCTIONS: Record<WritingGoal, string> = {
  general: '目標受眾為一般英語學習者，重點在於文法正確、基礎用字精確、以及自然的日常英語表達。',
  academic: '目標為學術寫作，請注重客觀嚴謹的學術詞彙、被動語態與複合句式的合適使用，並避免口語化俚語。',
  business: '目標為商務職場溝通，注重專業、簡潔、禮貌且具行動導向的表達，消除冗言贅字。',
  exam: '目標為雅思/托福等應試寫作，注重語法多樣性（Task Response / Lexical Resource / Grammatical Range & Accuracy / Coherence & Cohesion）。',
  creative: '目標為故事敘述與創意寫作，注重生動的描繪性動詞、形容詞與生動語感。',
};

// 計算英文詞數
export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// 預設各考試估分推導（用於容錯或補全）
export function generateDefaultExamEstimates(overallScore: number): ExamEstimates {
  // 學測 20 分制：約 overall / 5
  const gsatRaw = Math.round((overallScore / 100) * 20 * 10) / 10;
  const gsatGrade = gsatRaw >= 17 ? '15 (滿級分)' : gsatRaw >= 15 ? '13~14 級分 (頂標)' : gsatRaw >= 12 ? '11~12 級分 (前標)' : gsatRaw >= 9 ? '8~10 級分 (均標)' : '後標或待加強';

  // 雅思 0 - 9.0 (0.5 為單位)
  const ieltsBand = overallScore >= 90 ? '8.0' : overallScore >= 80 ? '7.0' : overallScore >= 70 ? '6.5' : overallScore >= 60 ? '6.0' : overallScore >= 50 ? '5.5' : '5.0';

  // 托福 0 - 30
  const toeflScore = Math.min(30, Math.max(10, Math.round((overallScore / 100) * 30)));

  // 多益寫作 0 - 200
  const toeicScore = Math.min(200, Math.max(60, Math.round((overallScore / 100) * 200 / 10) * 10));

  return {
    gsat: {
      examName: '台灣學測英文作文 (GSAT)',
      scale: '滿分 20 分',
      estimatedScore: `${gsatRaw} / 20 分 (推估約 ${gsatGrade})`,
      rubricBreakdownZh: '依據學測大考中心標準：內容充實度、組織架構連貫、文法句構多樣性與單字拼字正確性綜合推估。',
    },
    ielts: {
      examName: 'IELTS 雅思寫作測驗',
      scale: 'Band 0 - 9.0',
      estimatedScore: `Band ${ieltsBand} / 9.0`,
      rubricBreakdownZh: '依據 Task Achievement/Response、Coherence & Cohesion、Lexical Resource、Grammar Range & Accuracy 四大標準推估。',
    },
    toefl: {
      examName: 'TOEFL iBT 托福寫作',
      scale: '滿分 30 分',
      estimatedScore: `${toeflScore} / 30 分`,
      rubricBreakdownZh: '依據學術論述深度、舉例支撐完整度、句型複雜度與語言使用流暢度推估。',
    },
    toeic: {
      examName: 'TOEIC 多益寫作測驗',
      scale: '滿分 200 分',
      estimatedScore: `${toeicScore} / 200 分`,
      rubricBreakdownZh: '依據職場書信回覆、觀點論述邏輯與商務語境適切性評定。',
    },
  };
}

// 呼叫 Gemini 進行全文結構化批改（嚴格遵循先改寫後提取差異）
export async function analyzeEssayWithGemini(params: {
  apiKey: string;
  model: string;
  essayText: string;
  writingGoal: WritingGoal;
  promptTopic?: string;
}): Promise<EssayAssessment> {
  const { apiKey, model, essayText, writingGoal, promptTopic } = params;

  if (!apiKey.trim()) {
    throw new Error('未設定 Gemini API Key，請點擊右上角設定輸入金鑰。');
  }

  const systemInstructionText = `
你是一位具備多年國際檢定與升學輔導經驗的母語級英語寫作教學導師。
你的任務是進行嚴謹、透明、且「改寫版與標記 100% 對齊」的作文批改。

【核心生成順序與對齊原則（極重要）】
0. 【學習者目標指導方針】
   - ${GOAL_INSTRUCTIONS[writingGoal]}
1. 【第一步：產出高品質潤飾全文 (improvedText)】
   - 以母語者視角，維持作者原意與基本骨架，輸出最自然流暢的高品質潤飾全文。
2. 【第二步：全面提取改動至 wordSuggestions，杜絕改了不標記】
   - 仔細比對原文 (originalText) 與你剛剛寫出的 (improvedText)。
   - **凡是在 improvedText 中發生的實質修改（包含動詞時態、主謂一致、拼寫、冠詞、同義替換、贅字移除），必須全部（100%）提取到 wordSuggestions 中！**
   - 絕不可在 improvedText 改了文字，但在 wordSuggestions 卻遺漏未標記。
3. 【第三步：粒度分級原則】
   - **單字/短片語優先**：時態、拼字、單複數、冠詞、介系詞、同義詞、贅字，**強制鎖定在最小單一單字或 2-3 字最短搭配詞**。
   - **子句片段僅限句構**：只有在涉及整句倒裝、關係子句精簡為分詞等結構連動時，才允許跨詞標記為子句片段，且 category 必須設為 structure 或 style，ruleName 標明「句型重組」。
   - originalSpan 必須與原文文字完全吻合（字符完全一致）。
4. 【第四步：各類考試預估成績】
   - 精確依據台灣大學學測英文作文（滿分 20 分規準）、雅思寫作（Band 0-9.0）、托福寫作（0-30）、多益寫作（0-200）提供客觀預估分數與繁體中文給分點評。
5. 【第五步：isGeneralWord 籠統字嚴格判定準則】
   - 只有當原文用字屬於語義過於泛指、模糊、缺乏具體畫面感的常見籠統字（如 good, bad, get, make, do, thing, big, small, very, nice, fine, happy, stuff, a lot of 等，適合拆解細微語境與多元高級推薦詞）時，才將 isGeneralWord 設為 true。
   - 一般固定搭配詞修正（如 listen to）、介系詞或一般領域用詞，不可設為 true，必須為 false。
6. 所有修正理由、評語與學習點，務必使用「繁體中文（台灣習慣用語）」撰寫，保持客觀中立。
`.trim();

  const userPrompt = `
【寫作題目/情境】: ${promptTopic ? promptTopic : '未指定（自主寫作）'}
【寫作目標類別】: ${writingGoal}

【待批改作文全文】:
${essayText}

請嚴格根據 JSON Schema 產出評估、潤飾全文 improvedText、考試估分 examEstimates，並 100% 提取對照改動至 wordSuggestions。
`.trim();

  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstructionText }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      response_schema: ASSESSMENT_JSON_SCHEMA,
      temperature: 0.2,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const errorMsg = errorJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`Gemini API 呼叫失敗: ${errorMsg}`);
  }

  const data = await response.json();
  const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawContent) {
    throw new Error('Gemini API 未回傳有效文字內容，請稍後重試。');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawContent);
  } catch (e) {
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  }

  // 格式化 wordSuggestions
  const wordSuggestions: WordLevelSuggestion[] = (parsed.wordSuggestions || []).map((w: any, idx: number) => ({
    id: `w_sugg_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    category: w.category || 'grammar',
    ruleName: w.ruleName || '語法調整',
    originalSpan: w.originalSpan || '',
    suggestedSpan: w.suggestedSpan !== undefined ? w.suggestedSpan : '',
    explanationZh: w.explanationZh || '',
    alternatives: w.alternatives || [],
    isGeneralWord: !!w.isGeneralWord,
    cefrLevel: w.cefrLevel || undefined,
    isAccepted: false,
  }));

  const overallScore = Number(parsed.scores?.overall) || 75;

  const assessment: EssayAssessment = {
    id: `essay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: parsed.title || 'Untitled Essay',
    promptTopic: promptTopic || undefined,
    writingGoal,
    originalText: essayText,
    improvedText: parsed.improvedText || essayText,
    cefrLevel: parsed.cefrLevel || 'B1',
    scores: {
      overall: overallScore,
      grammar: Number(parsed.scores?.grammar) || 75,
      vocabulary: Number(parsed.scores?.vocabulary) || 75,
      coherence: Number(parsed.scores?.coherence) || 75,
      expression: Number(parsed.scores?.expression) || 75,
    },
    examEstimates: parsed.examEstimates || generateDefaultExamEstimates(overallScore),
    summary: {
      strengths: parsed.summary?.strengths || [],
      improvements: parsed.summary?.improvements || [],
      overallCommentsZh: parsed.summary?.overallCommentsZh || '',
      recommendedFocus: parsed.summary?.recommendedFocus || '',
    },
    wordSuggestions,
    sentenceAnalyses: (parsed.sentenceAnalyses || []).map((s: any, idx: number) => ({
      sentenceIndex: s.sentenceIndex ?? idx + 1,
      original: s.original || '',
      improved: s.improved || '',
      hasChange: !!s.hasChange,
      type: s.type || 'grammar',
      explanationZh: s.explanationZh || '',
      alternativePhrasings: s.alternativePhrasings || [],
    })),
    wordCount: {
      original: countWords(essayText),
      improved: countWords(parsed.improvedText || ''),
    },
    modelUsed: model,
    createdAt: Date.now(),
  };

  return assessment;
}

// 非同步按需查詢：籠統字深入拆解與場景意涵分析
export async function fetchWordNuanceAnalysis(params: {
  apiKey: string;
  model: string;
  word: string;
  sentenceContext: string;
}): Promise<NuanceAnalysis> {
  const { apiKey, model, word, sentenceContext } = params;

  const prompt = `
請針對以下英文句子中使用的較籠統字詞進行深度的「語義拆解與情境替換分析」：

【目標字詞】: "${word}"
【所在句子語境】: "${sentenceContext}"

請以繁體中文分析，並嚴格按照以下 JSON 格式回傳：
{
  "word": "${word}",
  "contextMeaningZh": "說明該字在此特定句中所扮演的具體意思",
  "generalMeanings": [
    { "meaningZh": "常見字典含義1", "example": "英文短例句" },
    { "meaningZh": "常見字典含義2", "example": "英文短例句" }
  ],
  "contextualReplacements": [
    {
      "word": "推薦替換詞1",
      "nuanceZh": "相較於原字，此詞在此處能帶來什麼精準的語義或畫面感",
      "cefr": "B2"
    },
    {
      "word": "推薦替換詞2",
      "nuanceZh": "此詞在此處帶來的語氣與修辭效果",
      "cefr": "C1"
    }
  ]
}
`.trim();

  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('未取得詞義拆解結果');
  }

  try {
    return JSON.parse(text) as NuanceAnalysis;
  } catch (e) {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as NuanceAnalysis;
  }
}

// 互動式 AI 助教對話
export async function sendTutorChatMessage(params: {
  apiKey: string;
  model: string;
  assessment: EssayAssessment;
  chatHistory: ChatMessage[];
  userMessage: string;
  referencedSentence?: string;
}): Promise<string> {
  const { apiKey, model, assessment, chatHistory, userMessage, referencedSentence } = params;

  const systemPrompt = `
你是一位隨身英語寫作 AI 助教。
目前學習者正在檢視這篇作文的批改結果：

【原文】:
${assessment.originalText}

【修改潤飾版】:
${assessment.improvedText}

【評估等級】: CEFR ${assessment.cefrLevel}，總分: ${assessment.scores.overall}/100
【弱點改進方向】: ${assessment.summary.improvements.join('；')}

【你的回答準則】:
1. 用繁體中文友善、耐心地回答學習者的疑問。
2. 針對學習者的問題進行深入解析，適時提供例句、常見錯誤陷阱或同義片語對比。
3. 如果學習者詢問特定句子或字詞，請聚焦該字詞的語境、搭配詞與母語者用詞習慣。
4. 保持精煉、條理分明。
`.trim();

  const contents: any[] = [];

  for (const msg of chatHistory) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: msg.referencedSentence
            ? `[針對字句: "${msg.referencedSentence}"]\n${msg.content}`
            : msg.content,
        },
      ],
    });
  }

  const currentQuery = referencedSentence
    ? `[我想深入詢問這個字句]: "${referencedSentence}"\n\n我的問題是: ${userMessage}`
    : userMessage;

  contents.push({
    role: 'user',
    parts: [{ text: currentQuery }],
  });

  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1500,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    const errorMsg = errorJson?.error?.message || `HTTP ${response.status}`;
    throw new Error(`助教回覆失敗: ${errorMsg}`);
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!reply) {
    throw new Error('未收到助教回覆，請稍後重試。');
  }

  return reply;
}
