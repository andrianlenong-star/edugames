import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  getDocFromServer,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { QuizSet } from './types';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Operation types for error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration.');
    }
  }
}

// Clean helper to remove undefined values before Firestore write
function cleanPayload<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (Array.isArray(val)) {
        cleaned[key] = val.map((item) =>
          item !== null && typeof item === 'object' ? cleanPayload(item) : item
        );
      } else if (val !== null && typeof val === 'object') {
        cleaned[key] = cleanPayload(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned;
}

// Save or update single quiz to Firestore
export async function saveQuizToFirestore(quiz: QuizSet): Promise<boolean> {
  const path = `quizzes/${quiz.id}`;
  try {
    const payload = cleanPayload({
      ...quiz,
      isCustom: true,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'quizzes', quiz.id), payload, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// Delete quiz from Firestore
export async function deleteQuizFromFirestore(quizId: string): Promise<boolean> {
  const path = `quizzes/${quizId}`;
  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

// Seed all initial bank soal if Firestore collection is empty
export async function seedQuizzesIfEmpty(defaultQuizzes: QuizSet[]): Promise<QuizSet[]> {
  const path = 'quizzes';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const fromDb = snap.docs.map((d) => d.data() as QuizSet);
      return fromDb;
    }

    // Seed in batches of 20
    const batch = writeBatch(db);
    for (const q of defaultQuizzes) {
      if (q && q.id) {
        const ref = doc(db, 'quizzes', q.id);
        batch.set(ref, cleanPayload({ ...q, isCustom: true, updatedAt: new Date().toISOString() }));
      }
    }
    await batch.commit();
    return defaultQuizzes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return defaultQuizzes;
  }
}

// Real-time synchronization subscription for all devices
export function subscribeToFirestoreQuizzes(
  onUpdate: (quizzes: QuizSet[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'quizzes';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: QuizSet[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as QuizSet;
        if (data && data.id && data.title) {
          list.push(data);
        }
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}
