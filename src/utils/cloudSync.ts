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
import { saveQuizToFirestore, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function syncQuizzesToCloud(quizzes: QuizSet[]): Promise<{ success: boolean; message: string }> {
  const customQuizzes = quizzes.filter((q) => q.isCustom);

  // 1. Always save immediately to LocalStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customQuizzes));
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }

  // 2. Sync to Firebase Firestore (Realtime Cloud Persistence across all devices)
  let firestoreSuccess = false;
  try {
    for (const q of customQuizzes) {
      await saveQuizToFirestore(q);
    }
    firestoreSuccess = true;
  } catch (e) {
    console.warn('Firestore sync failed, proceeding with server fallback', e);
  }

  // 3. Sync to Backend / Serverless API endpoint
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
    console.warn('Server sync failed', e);
  }

  return {
    success: true,
    message: firestoreSuccess || serverSuccess
      ? 'Soal berhasil disinkronkan ke Firebase Cloud & tersinkronisasi otomatis di semua gawai Anda!'
      : 'Soal tersimpan aman di perangkat dan siap disinkronkan ke cloud.',
  };
}

/**
 * Loads quizzes from cloud sources (Firestore, Server API, and local fallback).
 */
export async function fetchQuizzesFromCloud(): Promise<QuizSet[]> {
  let loadedList: QuizSet[] = [];

  // 1. Fetch from Firebase Firestore
  try {
    const snap = await getDocs(collection(db, 'quizzes'));
    if (!snap.empty) {
      const fromFs: QuizSet[] = [];
      snap.forEach((d) => {
        const item = d.data() as QuizSet;
        if (item && item.id && item.title) {
          fromFs.push({ ...item, isCustom: true });
        }
      });
      if (fromFs.length > 0) {
        loadedList = fromFs;
      }
    }
  } catch (e) {
    console.warn('Firestore fetch failed, checking server API:', e);
  }

  // 2. Try fetching from server/Vercel serverless /api/quizzes
  if (loadedList.length === 0) {
    try {
      const res = await fetch('/api/quizzes');
      if (res.ok) {
        const data = await res.json();
        const payload = Array.isArray(data) ? data : data?.data;
        if (Array.isArray(payload) && payload.length > 0) {
          loadedList = payload;
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
