export type Language = 'id' | 'en';

export interface Translations {
  // Navigation
  bankSoal: string;
  createAi: string;
  adminDashboard: string;
  googlePub: string;
  timerOn: string;
  timerRelaxed: string;
  soundOnTitle: string;
  soundOffTitle: string;
  lightModeTitle: string;
  darkModeTitle: string;
  switchLangTitle: string;

  // Gamification & Mode Branding
  eduzoneMode: string;
  eduzoneLiveArena: string;
  eduzoneStudyTool: string;
  eduzoneMemes: string;
  sourceAttribution: string;
  uploadedViaFile: string;

  // Bank Soal Explorer
  searchPlaceholder: string;
  allSubjects: string;
  allGrades: string;
  totalQuestions: string;
  questionsCount: string;
  estimatedMinutes: string;
  adminCreated: string;
  playQuiz: string;
  wordMaze: string;
  memoryMatch: string;
  spinWheel: string;
  duelPlayer: string;
  printWorksheet: string;
  uploadDocument: string;
  createNewPackage: string;
  changeTitle: string;
  shareQuiz: string;
  exportImport: string;

  // Quiz Player
  questionOf: string;
  officialAnswerKey: string;
  revealAnswerBtn: string;
  revealAnswerModalTitle: string;
  correctAnswerBadge: string;
  learningExplanation: string;
  hintHelp: string;
  nextQuestion: string;
  finishQuiz: string;
  answerSubmitted: string;
  streakText: string;
  scoreText: string;
  rankText: string;
  redemptionRoundTitle: string;
  redemptionRoundDesc: string;

  // Result & Podium
  quizCompleted: string;
  accuracyRate: string;
  timeSpent: string;
  playAgain: string;
  backToBank: string;
  shareResult: string;
  leaderboard: string;
  reviewAnswers: string;

  // Creator & Admin
  createTitle: string;
  createSubtitle: string;
  adminTitle: string;
  adminSubtitle: string;
  saveChanges: string;
  cancel: string;
  deleteQuiz: string;
  editQuiz: string;
}

const ID_TRANSLATIONS: Translations = {
  bankSoal: 'Bank Soal',
  createAi: 'Buat Soal / AI',
  adminDashboard: 'Dashboard Admin',
  googlePub: 'Publikasi Google',
  timerOn: 'Timer ON',
  timerRelaxed: 'Santai (Tanpa Timer)',
  soundOnTitle: 'Matikan Suara',
  soundOffTitle: 'Nyalakan Suara',
  lightModeTitle: 'Beralih ke Mode Terang',
  darkModeTitle: 'Beralih ke Mode Gelap',
  switchLangTitle: 'Ganti Bahasa (ID / EN)',

  eduzoneMode: 'EduZone Gamification Mode',
  eduzoneLiveArena: 'EDUZONE LIVE ARENA',
  eduzoneStudyTool: 'EduZone Study Tool',
  eduzoneMemes: 'Meme & Reaksi EduZone Gamification',
  sourceAttribution: 'Sumber: EduZone Gamification Mode',
  uploadedViaFile: 'Diimpor via Dokumen File',

  searchPlaceholder: 'Cari judul materi, kata kunci, jenjang, atau mata pelajaran...',
  allSubjects: 'Semua Mapel',
  allGrades: 'Semua Jenjang',
  totalQuestions: 'Total Soal',
  questionsCount: 'Butir Soal',
  estimatedMinutes: 'Menit',
  adminCreated: 'Buatan Admin',
  playQuiz: 'Main Kuis',
  wordMaze: 'Labirin Kata',
  memoryMatch: 'Kartu Cocok',
  spinWheel: 'Roda Putar',
  duelPlayer: 'Duel 1 vs 1',
  printWorksheet: 'Cetak LKS',
  uploadDocument: 'Upload Dokumen',
  createNewPackage: 'Buat Paket Baru',
  changeTitle: 'Ubah Judul',
  shareQuiz: 'Bagikan',
  exportImport: 'Ekspor / Impor',

  questionOf: 'Soal',
  officialAnswerKey: 'Kunci Jawaban Resmi',
  revealAnswerBtn: 'Buka Kunci',
  revealAnswerModalTitle: 'Kunci Jawaban & Pembahasan Lengkap (EduZone Gamification Mode)',
  correctAnswerBadge: 'Jawaban Benar',
  learningExplanation: 'Pembahasan Pembelajaran',
  hintHelp: 'Petunjuk Soal',
  nextQuestion: 'Soal Berikutnya',
  finishQuiz: 'Selesaikan Kuis',
  answerSubmitted: 'Jawaban Terkirim',
  streakText: 'Streak',
  scoreText: 'Skor',
  rankText: 'Peringkat',
  redemptionRoundTitle: 'Babak Kesempatan EduZone (Redemption Round)',
  redemptionRoundDesc: 'EduZone memberimu kesempatan untuk memperbaiki pertanyaan yang sempat keliru dan meningkatkan skormu!',

  quizCompleted: 'Kuis Selesai! Kerja Luar Biasa!',
  accuracyRate: 'Akurasi Jawaban',
  timeSpent: 'Durasi Waktu',
  playAgain: 'Mainkan Lagi',
  backToBank: 'Kembali ke Bank Soal',
  shareResult: 'Bagikan Hasil',
  leaderboard: 'Papan Peringkat',
  reviewAnswers: 'Tinjau Semua Jawaban',

  createTitle: 'Studio Pembuat Soal',
  createSubtitle: 'Rancang kuis interaktif dengan teks, gambar, dan berbagai tipe soal seru.',
  adminTitle: 'Pusat Manajemen Bank Soal',
  adminSubtitle: 'Kelola, edit, sinkronkan ke server, dan cetak paket soal kurikulum.',
  saveChanges: 'Simpan Perubahan',
  cancel: 'Batal',
  deleteQuiz: 'Hapus Paket',
  editQuiz: 'Edit Soal',
};

const EN_TRANSLATIONS: Translations = {
  bankSoal: 'Question Bank',
  createAi: 'Create Quiz / AI',
  adminDashboard: 'Admin Dashboard',
  googlePub: 'Google Publishing',
  timerOn: 'Timer ON',
  timerRelaxed: 'Relaxed (No Timer)',
  soundOnTitle: 'Mute Sound',
  soundOffTitle: 'Unmute Sound',
  lightModeTitle: 'Switch to Light Mode',
  darkModeTitle: 'Switch to Dark Mode',
  switchLangTitle: 'Switch Language (ID / EN)',

  eduzoneMode: 'EduZone Gamification Mode',
  eduzoneLiveArena: 'EDUZONE LIVE ARENA',
  eduzoneStudyTool: 'EduZone Study Tool',
  eduzoneMemes: 'EduZone Gamification Memes & Reactions',
  sourceAttribution: 'Source: EduZone Gamification Mode',
  uploadedViaFile: 'Imported via File Document',

  searchPlaceholder: 'Search quiz title, topic keywords, grade, or subject...',
  allSubjects: 'All Subjects',
  allGrades: 'All Grades',
  totalQuestions: 'Total Questions',
  questionsCount: 'Questions',
  estimatedMinutes: 'Mins',
  adminCreated: 'Admin Created',
  playQuiz: 'Play Quiz',
  wordMaze: 'Word Maze',
  memoryMatch: 'Memory Match',
  spinWheel: 'Spin Wheel',
  duelPlayer: '1 vs 1 Duel',
  printWorksheet: 'Print Worksheet',
  uploadDocument: 'Upload Document',
  createNewPackage: 'Create New Quiz',
  changeTitle: 'Rename',
  shareQuiz: 'Share',
  exportImport: 'Export / Import',

  questionOf: 'Question',
  officialAnswerKey: 'Official Answer Key',
  revealAnswerBtn: 'Reveal Answer',
  revealAnswerModalTitle: 'Official Answer & Explanation (EduZone Gamification Mode)',
  correctAnswerBadge: 'Correct Answer',
  learningExplanation: 'Learning Explanation',
  hintHelp: 'Question Hint',
  nextQuestion: 'Next Question',
  finishQuiz: 'Finish Quiz',
  answerSubmitted: 'Answer Submitted',
  streakText: 'Streak',
  scoreText: 'Score',
  rankText: 'Rank',
  redemptionRoundTitle: 'EduZone Redemption Round',
  redemptionRoundDesc: 'EduZone gives you a second chance to fix questions you missed and boost your final score!',

  quizCompleted: 'Quiz Completed! Fantastic Job!',
  accuracyRate: 'Accuracy',
  timeSpent: 'Time Elapsed',
  playAgain: 'Play Again',
  backToBank: 'Back to Bank',
  shareResult: 'Share Result',
  leaderboard: 'Leaderboard',
  reviewAnswers: 'Review Answers',

  createTitle: 'Quiz Creator Studio',
  createSubtitle: 'Design interactive quizzes with text, images, and multiple fun question formats.',
  adminTitle: 'Bank Management Center',
  adminSubtitle: 'Manage, edit, sync to server, and generate curriculum worksheets.',
  saveChanges: 'Save Changes',
  cancel: 'Cancel',
  deleteQuiz: 'Delete Quiz',
  editQuiz: 'Edit Quiz',
};

const LANG_STORAGE_KEY = 'eduzone_language';

let currentLanguage: Language = (() => {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'id') return saved;
  } catch {
    // ignore
  }
  return 'id';
})();

const listeners = new Set<(lang: Language) => void>();

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn(lang));
}

export function toggleLanguage(): Language {
  const next = currentLanguage === 'id' ? 'en' : 'id';
  setLanguage(next);
  return next;
}

export function getTranslations(lang: Language = currentLanguage): Translations {
  return lang === 'en' ? EN_TRANSLATIONS : ID_TRANSLATIONS;
}

export function subscribeLanguage(listener: (lang: Language) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
