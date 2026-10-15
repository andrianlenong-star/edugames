import { QuizSet } from '../types';
import { USER_CREATED_QUIZZES } from '../data/userCreatedQuizzes';

const LOCAL_STORAGE_KEY = 'wayground_custom_quizzes';
const CLOUD_SYNC_ROOM_KEY = 'eduzone_cloud_room_id';
const DEFAULT_CLOUD_ROOM = 'eduzone-guru-primary';

// Compression helper using native base64 with URI encoding
export function encodeQuizzesForSyncUrl(quizzes: QuizSet[]): string {
  try {
    const minified = quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      grade: q.grade,
      targetClass: q.targetClass,
      difficulty: q.difficulty,
      icon: q.icon,
      color: q.color,
      isCustom: true,
      questions: q.questions,
    }));
    const jsonStr = JSON.stringify(minified);
    return encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
  } catch (e) {
    console.error('Failed to encode sync token', e);
    return '';
  }
}

export function decodeQuizzesFromSyncUrl(token: string): QuizSet[] | null {
  try {
    const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(token))));
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map((q) => ({ ...q, isCustom: true }));
    }
    return null;
  } catch (e) {
    console.error('Failed to decode sync token', e);
    return null;
  }
}

/**
 * Saves quizzes to both local storage, the /api/quizzes server endpoint,
 * and external cloud storage when available.
 */
export async function syncQuizzesToCloud(quizzes: QuizSet[]): Promise<{ success: boolean; message: string }> {
  const customQuizzes = quizzes.filter((q) => q.isCustom);

  // 1. Always save immediately to LocalStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customQuizzes));
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }

  // 2. Sync to Backend / Serverless API endpoint
  let serverSuccess = false;
  try {
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customQuizzes),
    });
    if (res.ok) {
      serverSuccess = true;
    }
  } catch (e) {
    console.warn('Server sync failed, proceeding with fallback', e);
  }

  // 3. Sync to Free Global Cloud Key-Value Store for cross-device persistence
  let cloudKvSuccess = false;
  try {
    const roomId = localStorage.getItem(CLOUD_SYNC_ROOM_KEY) || DEFAULT_CLOUD_ROOM;
    // We send payload to global KV store (e.g. kvdb.io or npoint)
    const kvRes = await fetch(`https://kvdb.io/4y7c4R5s5j3E9N2e1t6Yx7/${roomId}`, {
      method: 'POST',
      body: JSON.stringify(customQuizzes),
    });
    if (kvRes.ok) {
      cloudKvSuccess = true;
    }
  } catch {
    // Graceful offline fallback
  }

  return {
    success: true,
    message: serverSuccess || cloudKvSuccess
      ? 'Soal berhasil disinkronkan ke Cloud & dapat dibuka di gawai mana pun!'
      : 'Soal tersimpan aman di perangkat dan siap disinkronkan ke cloud.',
  };
}

/**
 * Loads quizzes from cloud sources with fallback to USER_CREATED_QUIZZES and local storage.
 */
export async function fetchQuizzesFromCloud(): Promise<QuizSet[]> {
  let loadedList: QuizSet[] = [];

  // 1. Try fetching from server/Vercel serverless /api/quizzes
  try {
    const res = await fetch('/api/quizzes');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        loadedList = data;
      }
    }
  } catch {
    // Fallback
  }

  // 2. Try fetching from Global Cloud Room if loadedList is still empty
  if (loadedList.length === 0) {
    try {
      const roomId = localStorage.getItem(CLOUD_SYNC_ROOM_KEY) || DEFAULT_CLOUD_ROOM;
      const kvRes = await fetch(`https://kvdb.io/4y7c4R5s5j3E9N2e1t6Yx7/${roomId}`);
      if (kvRes.ok) {
        const kvData = await kvRes.json();
        if (Array.isArray(kvData) && kvData.length > 0) {
          loadedList = kvData;
        }
      }
    } catch {
      // Fallback
    }
  }

  // 3. Fallback to localStorage
  if (loadedList.length === 0) {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedList = parsed;
        }
      } catch {}
    }
  }

  // 4. Always ensure embedded USER_CREATED_QUIZZES are included
  const combined = [...loadedList];
  USER_CREATED_QUIZZES.forEach((embedded) => {
    const exists = combined.some((q) => q.id === embedded.id || q.title === embedded.title);
    if (!exists) {
      combined.push(embedded);
    }
  });

  return combined;
}
