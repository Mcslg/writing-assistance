import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { EssayAssessment, ChatMessage, GeminiSettings } from '../types/essay';

const SETTINGS_KEY = 'writing_assistant_settings';

interface WritingAssistantDB extends DBSchema {
  assessments: {
    key: string;
    value: EssayAssessment;
    indexes: { 'by-date': number };
  };
  chatHistories: {
    key: string; // essayId
    value: {
      essayId: string;
      messages: ChatMessage[];
      updatedAt: number;
    };
  };
}

const DB_NAME = 'writing_assistance_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<WritingAssistantDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<WritingAssistantDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('assessments')) {
          const store = db.createObjectStore('assessments', { keyPath: 'id' });
          store.createIndex('by-date', 'createdAt');
        }
        if (!db.objectStoreNames.contains('chatHistories')) {
          db.createObjectStore('chatHistories', { keyPath: 'essayId' });
        }
      },
    });
  }
  return dbPromise;
}

// ==================== LocalStorage Settings ====================

export const DEFAULT_SETTINGS: GeminiSettings = {
  apiKey: '',
  model: 'gemini-3.5-flash',
  temperature: 0.3,
};

export function getStoredSettings(): GeminiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Failed to parse stored settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: GeminiSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function clearStoredSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}

// ==================== IndexedDB Assessments ====================

export async function saveAssessmentToDB(assessment: EssayAssessment): Promise<void> {
  const db = await getDB();
  await db.put('assessments', assessment);
}

export async function getAllAssessmentsFromDB(): Promise<EssayAssessment[]> {
  try {
    const db = await getDB();
    const items = await db.getAllFromIndex('assessments', 'by-date');
    return items.reverse(); // 最新排序
  } catch (e) {
    console.error('Failed to read assessments from DB:', e);
    return [];
  }
}

export async function getAssessmentByIdFromDB(id: string): Promise<EssayAssessment | undefined> {
  const db = await getDB();
  return await db.get('assessments', id);
}

export async function deleteAssessmentFromDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('assessments', id);
  await db.delete('chatHistories', id);
}

export async function clearAllAssessmentsFromDB(): Promise<void> {
  const db = await getDB();
  await db.clear('assessments');
  await db.clear('chatHistories');
}

// ==================== IndexedDB Chat Histories ====================

export async function saveChatHistoryToDB(essayId: string, messages: ChatMessage[]): Promise<void> {
  const db = await getDB();
  await db.put('chatHistories', {
    essayId,
    messages,
    updatedAt: Date.now(),
  });
}

export async function getChatHistoryFromDB(essayId: string): Promise<ChatMessage[]> {
  try {
    const db = await getDB();
    const record = await db.get('chatHistories', essayId);
    return record ? record.messages : [];
  } catch (e) {
    console.error('Failed to read chat history:', e);
    return [];
  }
}

// 一鍵清除所有本地資訊（設定 + IndexedDB）
export async function wipeAllLocalData(): Promise<void> {
  clearStoredSettings();
  await clearAllAssessmentsFromDB();
}
