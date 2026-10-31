import { USER_CREATED_QUIZZES } from '../src/data/userCreatedQuizzes';

// In-memory fallback storage for Vercel serverless environment
let inMemoryQuizzes: any[] = [...USER_CREATED_QUIZZES];

export default function handler(req: any, res: any) {
  // Set CORS headers so any client or gawai can access
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, data: inMemoryQuizzes });
  }

  if (req.method === 'POST') {
    try {
      const incoming = req.body;
      const payload = incoming?.quizzes || incoming;
      if (Array.isArray(payload)) {
        inMemoryQuizzes = payload;
      } else if (incoming && typeof incoming === 'object' && incoming.id) {
        const existingIdx = inMemoryQuizzes.findIndex((q: any) => q.id === incoming.id);
        if (existingIdx !== -1) {
          inMemoryQuizzes[existingIdx] = incoming;
        } else {
          inMemoryQuizzes.unshift(incoming);
        }
      }
      return res.status(200).json({ success: true, data: inMemoryQuizzes, count: inMemoryQuizzes.length });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
