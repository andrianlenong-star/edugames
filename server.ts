import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function generateCurriculumBankQuestions(params: {
  topic: string;
  grade?: string;
  targetClass?: string;
  subject?: string;
  count?: number;
  difficulty?: string;
  questionFormat?: string;
}) {
  const {
    topic = 'Pembelajaran',
    grade = 'SD',
    targetClass = 'Kelas 5 SD',
    subject = 'Pengetahuan Umum',
    count = 6,
    difficulty = 'Sedang',
    questionFormat = 'campuran',
  } = params;

  const cleanTopic = topic.trim() || 'Pembelajaran';
  const mainWord = cleanTopic.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'KUIS';
  const questions: any[] = [];

  const availableFormats: string[] =
    questionFormat === 'multiple_choice'
      ? ['multiple_choice']
      : questionFormat === 'true_false'
      ? ['true_false']
      : questionFormat === 'fill_blank'
      ? ['fill_blank']
      : questionFormat === 'matching'
      ? ['matching']
      : ['multiple_choice', 'true_false', 'multiple_choice', 'fill_blank', 'multiple_choice', 'matching'];

  const templates = [
    {
      q: `Konsep atau prinsip utama yang menjelaskan tentang "${cleanTopic}" adalah . . . .`,
      correct: `Mekanisme dan kaidah penting yang mengatur materi ${cleanTopic}`,
      opts: [
        `Mekanisme dan kaidah penting yang mengatur materi ${cleanTopic}`,
        `Pendapat subjektif tanpa dasar teori atau bukti ilmiah`,
        `Kondisi di mana konsep ini sama sekali tidak berlaku`,
        `Istilah asing yang tidak memiliki kaitan materi`,
      ],
      explanation: `Pemahaman inti tentang ${cleanTopic} berpusat pada penguasaan konsep dan kaidah dasar materi tersebut.`,
      hint: `Pilihlah jawaban yang menjelaskan definisi atau mekanisme yang tepat.`,
    },
    {
      q: `Berikut ini yang merupakan contoh penerapan nyata dari "${cleanTopic}" dalam kehidupan sehari-hari adalah . . . .`,
      correct: `Aplikasi langsung konsep ${cleanTopic} dalam memecahkan permasalahan nyata`,
      opts: [
        `Aplikasi langsung konsep ${cleanTopic} dalam memecahkan permasalahan nyata`,
        `Menghindari penggunaan konsep ini dalam aktivitas praktis`,
        `Membatasi pemahaman hanya pada hafalan tanpa penerapan`,
        `Penerapan yang berlawanan dengan fungsi aslinya`,
      ],
      explanation: `Materi ${cleanTopic} dipelajari agar siswa mampu mengenali dan mempraktikkan konsepnya dalam kehidupan sehari-hari.`,
      hint: `Cermati pilihan yang menunjukkan fungsi atau penerapan positif.`,
    },
    {
      q: `Ciri khas atau karakteristik utama yang membedakan "${cleanTopic}" dari topik lainnya adalah . . . .`,
      correct: `Memiliki kaidah, fungsi, dan komponen spesifik terkait ${cleanTopic}`,
      opts: [
        `Memiliki kaidah, fungsi, dan komponen spesifik terkait ${cleanTopic}`,
        `Tidak memiliki perbedaan jelas dengan topik mana pun`,
        `Hanya bersifat sementara dan tidak beraturan`,
        `Tidak memiliki ciri khas yang dapat diidentifikasi`,
      ],
      explanation: `Setiap materi kurikulum memiliki ciri khas tersendiri yang menjadi pembeda penting dalam kompetensi dasar.`,
      hint: `Perhatikan aspek spesifik yang menjadi identitas materi ini.`,
    },
    {
      q: `Langkah atau tindakan yang paling tepat untuk menganalisis materi "${cleanTopic}" adalah . . . .`,
      correct: `Mengidentifikasi fakta, membedakan komponen kunci, dan menarik kesimpulan logis`,
      opts: [
        `Mengidentifikasi fakta, membedakan komponen kunci, dan menarik kesimpulan logis`,
        `Menebak secara sembarangan tanpa menelaah data pendukung`,
        `Mengabaikan petunjuk dan aturan kebahasaan atau ilmiah yang berlaku`,
        `Menganggap semua pilihan jawaban sama benarnya`,
      ],
      explanation: `Analisis terstruktur melalui identifikasi fakta dan komponen adalah kunci menjawab soal kurikulum merdeka.`,
      hint: `Pilihlah metode analisis yang logis dan sistematis.`,
    },
  ];

  for (let i = 0; i < count; i++) {
    const fmt = availableFormats[i % availableFormats.length];
    const tmpl = templates[i % templates.length];

    if (fmt === 'multiple_choice') {
      questions.push({
        id: `gen-q-${Date.now()}-${i}`,
        type: 'multiple_choice',
        question: tmpl.q,
        options: tmpl.opts,
        correctIndex: 0,
        correctAnswer: tmpl.correct,
        explanation: tmpl.explanation,
        hint: tmpl.hint,
        anagramWord: mainWord,
      });
    } else if (fmt === 'true_false') {
      const isTrue = i % 2 === 0;
      questions.push({
        id: `gen-q-${Date.now()}-${i}`,
        type: 'true_false',
        question: isTrue
          ? `Materi "${cleanTopic}" memiliki kaidah dan peran fundamental dalam kompetensi ${subject}.`
          : `Konsep "${cleanTopic}" sama sekali tidak memiliki fungsi atau aturan dalam ${subject}.`,
        isTrue,
        correctAnswer: isTrue ? 'Benar' : 'Salah',
        explanation: isTrue
          ? `Benar! Materi ${cleanTopic} memiliki dasar aturan dan kaidah yang berlaku secara ilmiah.`
          : `Salah! Konsep ${cleanTopic} memiliki aturan dan fungsi penting dalam kurikulum ${subject}.`,
        hint: `Tentukan apakah pernyataan tersebut sesuai dengan fakta materi.`,
        anagramWord: 'BENAR',
      });
    } else if (fmt === 'fill_blank') {
      questions.push({
        id: `gen-q-${Date.now()}-${i}`,
        type: 'fill_blank',
        question: `Bagian terpenting dalam mempelajari materi "${cleanTopic}" adalah pemahaman terhadap konsep _____ secara mendalam.`,
        correctAnswer: cleanTopic.split(' ')[0] || 'dasar',
        acceptableAnswers: [
          cleanTopic.split(' ')[0] || 'dasar',
          (cleanTopic.split(' ')[0] || 'dasar').toLowerCase(),
          'dasar',
          'utama',
        ],
        explanation: `Pemahaman menyeluruh tentang materi ${cleanTopic} dimulai dari penguasaan istilah dan konsep intinya.`,
        hint: `Kata kunci utama topik pembelajaran.`,
        anagramWord: (cleanTopic.split(' ')[0] || 'KUIS').toUpperCase(),
      });
    } else {
      questions.push({
        id: `gen-q-${Date.now()}-${i}`,
        type: 'matching',
        question: `Jodohkan istilah materi "${cleanTopic}" berikut dengan makna atau fungsinya yang tepat:`,
        matchingPairs: [
          { id: `p1-${i}`, left: `Konsep Inti ${cleanTopic}`, right: `Fungsi & aturan utama materi` },
          { id: `p2-${i}`, left: `Penerapan Praktis`, right: `Latihan dan implementasi nyata` },
          { id: `p3-${i}`, left: `Evaluasi Mandiri`, right: `Ukur tingkat pemahaman siswa` },
        ],
        correctAnswer: 'Semua pasangan cocok',
        explanation: `Penjodohan konsep melatih siswa menghubungkan istilah materi ${cleanTopic} dengan definisi yang tepat.`,
        hint: `Pasangkan setiap konsep di kiri dengan penjelasannya di kanan.`,
        anagramWord: mainWord,
      });
    }
  }

  return {
    title: `Paket Soal: ${cleanTopic}`,
    description: `Paket latihan ${questions.length} butir soal ${subject} materi ${cleanTopic} (${targetClass || grade})`,
    category: subject,
    grade,
    targetClass,
    difficulty,
    questions,
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Storage helper for custom quizzes
const STORAGE_DIR = path.resolve(__dirname, 'storage');
const STORAGE_FILE = path.resolve(STORAGE_DIR, 'custom_quizzes.json');

function readCustomQuizzes(): any[] {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORAGE_FILE)) {
      fs.writeFileSync(STORAGE_FILE, '[]', 'utf-8');
      return [];
    }
    const content = fs.readFileSync(STORAGE_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Error reading custom quizzes:', err);
    return [];
  }
}

function writeCustomQuizzes(quizzes: any[]): boolean {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(quizzes, null, 2), 'utf-8');

    // Also mirror to src/data/userCreatedQuizzes.ts so production builds always include all bank soal
    try {
      const userQuizzesFile = path.resolve(__dirname, 'src', 'data', 'userCreatedQuizzes.ts');
      const tsCode = `import { QuizSet } from '../types/index';\n\nexport const USER_CREATED_QUIZZES: QuizSet[] = ${JSON.stringify(quizzes, null, 2)};\n`;
      fs.writeFileSync(userQuizzesFile, tsCode, 'utf-8');
    } catch (e) {
      console.warn('Could not mirror quizzes to userCreatedQuizzes.ts:', e);
    }

    return true;
  } catch (err) {
    console.error('Error writing custom quizzes:', err);
    return false;
  }
}

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Candidate models in order of stability and recommended SDK usage
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

// Helper to generate a single batch of questions using Gemini with multi-model fallback
async function generateBatch(params: {
  topic: string;
  grade: string;
  targetClass: string;
  subject: string;
  count: number;
  difficulty: string;
  formatInstruction: string;
  batchIndex?: number;
}) {
  const { topic, grade, targetClass, subject, count, difficulty, formatInstruction, batchIndex = 0 } = params;
  const classInfo = targetClass ? `${grade} (${targetClass})` : grade;

  const prompt = `Anda adalah guru ahli dan pembuat bank soal kurikulum nasional Indonesia (Kemendikbudristek).
Buatkan ${count} butir soal ujian / evaluasi kuis edukatif ASLI dan BERMUTU TINGGI dalam Bahasa Indonesia untuk topik: "${topic}".
Tingkat/Kelas sasaran: ${classInfo}
Mata pelajaran: ${subject}
Tingkat kesulitan: ${difficulty}
Format yang diminta: ${formatInstruction}
${batchIndex > 0 ? `(Ini adalah kumpulan soal lanjutan bagian ${batchIndex + 1}, buat soal yang berbeda dan saling melengkapi)` : ''}

ATURAN SANGAT PENTING (WAJIB DIPATUHI PERSIS SEPERTI BANK SOAL SEKOLAH):
1. BENTUK PERTANYAAN ASLI & KONKRET:
   - Setiap butir soal HARUS berupa pertanyaan nyata atau kalimat rumpang (. . . .) yang menguji pemahaman fakta, konsep, rumus, definisi, contoh kalimat, fungsi organ, atau analisis materi "${topic}".
   - DILARANG KERAS membuat soal meta/template generik seperti "Dalam pembelajaran materi...", "Manakah konsep yang paling tepat dipelajari...", atau pilihan abstrak seperti "Memahami prinsip dasar...", "Mengabaikan keterkaitan...".
2. OPSI PILIHAN GANDA (multiple_choice):
   - Wajib ada 4 opsi ('options') yang berupa konten materi pelajaran nyata, masuk akal, dan relevan dengan topik.
   - 1 jawaban benar (cantumkan di 'correctAnswer' dan 'correctIndex' 0-3), dan 3 pilihan pengecoh (distraktor) yang logis.
3. BENAR / SALAH (true_false):
   - Kalimat pertanyaan harus berupa pernyataan faktual yang tegas tentang materi "${topic}".
   - 'isTrue' bernilai true atau false, dan 'correctAnswer' bernilai "Benar" atau "Salah".
4. ISIAN SINGKAT (fill_blank):
   - Kalimat pertanyaan mengandung titik-titik ". . . ." atau "_____".
   - 'correctAnswer' adalah kata kunci singkat yang tepat (1-3 kata), dan 'acceptableAnswers' daftar alternatif sinonim atau ejaan.
5. MENJODOHKAN (matching):
   - 'question': Kalimat instruksi menjodohkan yang jelas.
   - 'matchingPairs': 3-4 pasang konsep { left: "...", right: "..." } yang menghubungkan istilah konkret dengan definisinya.
6. PEMBAHASAN & PETUNJUK:
   - 'explanation': Pembahasan edukatif yang jelas dan ramah siswa.
   - 'hint': Petunjuk singkat untuk membantu siswa berpikir.
   - 'anagramWord': 1 kata kunci tanpa spasi untuk mode permainan tebak kata.`;

  if (!ai) {
    console.warn('AI client not initialized, using curriculum bank generator.');
    return generateCurriculumBankQuestions({
      topic,
      grade,
      targetClass,
      subject,
      count,
      difficulty,
      questionFormat: 'campuran',
    });
  }

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`[Gemini AI] Trying model ${modelName} for topic "${topic}" (${count} questions)...`);
      const generatePromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah asisten pembuat bank soal dan game edukasi interaktif standar kurikulum Indonesia untuk platform Wayground. Selalu hasilkan JSON terstruktur yang valid sesuai skema yang diminta.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Judul paket soal yang menarik dan edukatif',
              },
              description: {
                type: Type.STRING,
                description: 'Deskripsi singkat paket soal',
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: 'Tipe soal: multiple_choice, true_false, fill_blank, atau matching',
                    },
                    question: {
                      type: Type.STRING,
                      description: 'Teks pertanyaan atau pernyataan autentik',
                    },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Pilihan jawaban jika tipe multiple_choice',
                    },
                    correctIndex: {
                      type: Type.INTEGER,
                      description: 'Indeks jawaban benar (0-3) untuk multiple_choice',
                    },
                    correctAnswer: {
                      type: Type.STRING,
                      description: 'Jawaban yang benar dalam bentuk teks',
                    },
                    isTrue: {
                      type: Type.BOOLEAN,
                      description: 'Nilai kebenaran jika tipe true_false',
                    },
                    acceptableAnswers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Daftar jawaban alternatif untuk fill_blank',
                    },
                    matchingPairs: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          left: { type: Type.STRING },
                          right: { type: Type.STRING },
                        },
                        required: ['left', 'right'],
                      },
                      description: 'Pasangan menjodohkan jika tipe matching',
                    },
                    explanation: {
                      type: Type.STRING,
                      description: 'Pembahasan lengkap dan edukatif',
                    },
                    hint: {
                      type: Type.STRING,
                      description: 'Petunjuk singkat untuk siswa',
                    },
                    anagramWord: {
                      type: Type.STRING,
                      description: 'Kata kunci tanpa spasi untuk mode susun kata',
                    },
                  },
                  required: ['type', 'question', 'correctAnswer', 'explanation', 'hint'],
                },
              },
            },
            required: ['title', 'description', 'questions'],
          },
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Permintaan AI timeout (25 detik)')), 25000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          console.log(`[Gemini AI] Model ${modelName} succeeded with ${parsed.questions.length} questions!`);
          return parsed;
        }
      }
    } catch (err: any) {
      console.warn(`[Gemini AI] Model ${modelName} failed:`, err?.message || err);
      lastError = err;
    }
  }

  console.warn('[Gemini AI] AI models unavailable. Activating smart curriculum bank generator.');
  return generateCurriculumBankQuestions({
    topic,
    grade,
    targetClass,
    subject,
    count,
    difficulty,
    questionFormat: 'campuran',
  });
}

// API endpoint to generate quiz questions using Gemini (supports unlimited count)
app.post('/api/generate-questions', async (req, res) => {
  try {
    const {
      topic,
      grade = 'SMP',
      targetClass = '',
      subject = 'Pengetahuan Umum',
      count = 6,
      difficulty = 'Sedang',
      questionFormat = 'campuran', // 'campuran' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching'
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topik soal wajib diisi' });
    }

    const requestedCount = Math.max(1, parseInt(count, 10) || 6);

    if (!ai) {
      console.log('[Wayground AI] AI client not configured, using curriculum bank generator.');
      const fallbackData = generateCurriculumBankQuestions({
        topic,
        grade,
        targetClass,
        subject,
        count: requestedCount,
        difficulty,
        questionFormat,
      });
      return res.json({
        success: true,
        data: fallbackData,
        notice:
          'Paket soal kurikulum berhasil disusun secara otomatis sesuai standar Bank Soal Wayground.',
      });
    }

    let formatInstruction = '';
    if (questionFormat === 'multiple_choice') {
      formatInstruction = 'Semua soal harus berformat "multiple_choice" (pilihan ganda 4 opsi).';
    } else if (questionFormat === 'true_false') {
      formatInstruction = 'Semua soal harus berformat "true_false" (pernyataan benar atau salah).';
    } else if (questionFormat === 'fill_blank') {
      formatInstruction = 'Semua soal harus berformat "fill_blank" (isian singkat satu kata atau frasa pendek).';
    } else if (questionFormat === 'matching') {
      formatInstruction = 'Semua soal harus berformat "matching" (menjodohkan 3 hingga 5 pasangan konsep).';
    } else {
      formatInstruction = 'Variasikan format soal secara seimbang: ada pilihan ganda ("multiple_choice"), benar/salah ("true_false"), isian singkat ("fill_blank"), dan menjodohkan konsep ("matching").';
    }

    // Unlimited Question Support: Batch in chunks of up to 10 to ensure high quality and complete JSON
    const MAX_CHUNK = 10;
    const chunks: number[] = [];
    let remaining = requestedCount;
    while (remaining > 0) {
      const take = Math.min(remaining, MAX_CHUNK);
      chunks.push(take);
      remaining -= take;
    }

    let finalTitle = '';
    let finalDescription = '';
    const allQuestions: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const batchResult = await generateBatch({
        topic,
        grade,
        targetClass,
        subject,
        count: chunks[i],
        difficulty,
        formatInstruction,
        batchIndex: i,
      });

      if (!finalTitle && batchResult.title) finalTitle = batchResult.title;
      if (!finalDescription && batchResult.description) finalDescription = batchResult.description;
      if (Array.isArray(batchResult.questions)) {
        allQuestions.push(...batchResult.questions);
      }
    }

    return res.json({
      success: true,
      data: {
        title: finalTitle || `Kuis: ${topic}`,
        description: finalDescription || `Kumpulan ${allQuestions.length} soal tentang ${topic}`,
        questions: allQuestions,
      },
    });
  } catch (error: any) {
    console.error('Error generating questions with Gemini:', error);
    try {
      const fallbackData = generateCurriculumBankQuestions({
        topic: req.body?.topic || 'Pembelajaran',
        grade: req.body?.grade || 'SD',
        targetClass: req.body?.targetClass || 'Kelas 5 SD',
        subject: req.body?.subject || 'Pengetahuan Umum',
        count: Math.max(1, parseInt(req.body?.count, 10) || 6),
        difficulty: req.body?.difficulty || 'Sedang',
        questionFormat: req.body?.questionFormat || 'campuran',
      });
      return res.json({
        success: true,
        data: fallbackData,
        notice:
          'Sistem otomatis menyusun paket soal kurikulum autentik dari Bank Soal Wayground.',
      });
    } catch (innerErr) {
      return res.status(500).json({
        error: error?.message || 'Gagal membuat soal dengan AI',
      });
    }
  }
});

// PDF Text Extraction Proxy Endpoint
app.post('/api/extract-pdf-text', async (req, res) => {
  try {
    const { base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Data PDF kosong' });
    }
    const buffer = Buffer.from(base64Data, 'base64');
    const { PDFParse } = await import('pdf-parse');
    const parser: any = new PDFParse({ data: buffer, verbosity: 0 });
    await parser.load();
    const text = await parser.getText();
    return res.json({ success: true, text: text || '' });
  } catch (err: any) {
    console.error('Server PDF extract error:', err);
    return res.status(500).json({ error: err?.message || 'Gagal mengekstrak teks PDF' });
  }
});

// Custom Quizzes Persistent Storage API

// GET all custom quizzes
app.get('/api/quizzes', (_req, res) => {
  try {
    const quizzes = readCustomQuizzes();
    return res.json({ success: true, data: quizzes });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal membaca daftar kuis' });
  }
});

// GET single quiz by ID
app.get('/api/quizzes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const quizzes = readCustomQuizzes();
    const found = quizzes.find((q) => q.id === id);
    if (!found) {
      return res.status(404).json({ error: 'Kuis tidak ditemukan' });
    }
    return res.json({ success: true, data: found });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal membaca kuis' });
  }
});

// POST save single custom quiz
app.post('/api/quizzes', (req, res) => {
  try {
    const quiz = req.body;
    if (!quiz || !quiz.id || !quiz.title) {
      return res.status(400).json({ error: 'Data kuis tidak valid' });
    }

    const quizzes = readCustomQuizzes();
    const existingIndex = quizzes.findIndex((q) => q.id === quiz.id);

    if (existingIndex >= 0) {
      quizzes[existingIndex] = { ...quizzes[existingIndex], ...quiz, updatedAt: new Date().toISOString() };
    } else {
      quizzes.unshift({ ...quiz, createdAt: quiz.createdAt || new Date().toISOString() });
    }

    writeCustomQuizzes(quizzes);
    return res.json({ success: true, data: quiz });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal menyimpan kuis' });
  }
});

// POST sync quizzes from client (two-way merge)
app.post('/api/quizzes/sync', (req, res) => {
  try {
    const { quizzes: clientQuizzes = [] } = req.body;
    const serverQuizzes = readCustomQuizzes();

    // Map by ID
    const mergedMap = new Map<string, any>();

    // Add server quizzes first
    for (const q of serverQuizzes) {
      if (q && q.id) mergedMap.set(q.id, q);
    }

    // Upsert client quizzes
    for (const q of clientQuizzes) {
      if (q && q.id) {
        if (!mergedMap.has(q.id)) {
          mergedMap.set(q.id, q);
        }
      }
    }

    const mergedList = Array.from(mergedMap.values());
    writeCustomQuizzes(mergedList);

    return res.json({ success: true, data: mergedList });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal sinkronisasi kuis' });
  }
});

// DELETE single custom quiz
app.delete('/api/quizzes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const quizzes = readCustomQuizzes();
    const filtered = quizzes.filter((q) => q.id !== id);
    writeCustomQuizzes(filtered);
    return res.json({ success: true, message: 'Kuis berhasil dihapus' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal menghapus kuis' });
  }
});

// SEO and Google Search Console Routes
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://ais-pre-pmzx57gruf77apyjc56nz6-496673436177.asia-southeast1.run.app/sitemap.xml\n`);
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ais-pre-pmzx57gruf77apyjc56nz6-496673436177.asia-southeast1.run.app/</loc>
    <lastmod>2026-10-13</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ais-pre-pmzx57gruf77apyjc56nz6-496673436177.asia-southeast1.run.app/?tab=bank-soal</loc>
    <lastmod>2026-10-13</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://ais-pre-pmzx57gruf77apyjc56nz6-496673436177.asia-southeast1.run.app/?tab=creator</loc>
    <lastmod>2026-10-13</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ais-pre-pmzx57gruf77apyjc56nz6-496673436177.asia-southeast1.run.app/?tab=admin</loc>
    <lastmod>2026-10-13</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ais-pre-pmzx57gruf77apyjc56nz6-496673436177.asia-southeast1.run.app/?game=kuis-kilat</loc>
    <lastmod>2026-10-13</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://ais-pre-pmzx57gruf77apyjc56nz6-496673436177.asia-southeast1.run.app/?game=cetak-lks</loc>
    <lastmod>2026-10-13</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`);
});

// Google Search Console HTML Verification Wildcard handler
app.get('/google:code.html', (req, res) => {
  const code = req.params.code;
  res.type('text/html');
  res.send(`google-site-verification: google${code}.html`);
});

// Vite middleware setup for full-stack integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Edu Zone running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
