import React, { useState, useRef } from 'react';
import { QuizSet, Question, QuestionType, Jenjang, MataPelajaran, Difficulty, MatchingPair } from '../../types';
import { sounds } from '../../utils/audio';
import {
  Sparkles,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Wand2,
  FileText,
  Loader2,
  GraduationCap,
  Copy,
  Infinity,
  Edit3,
  Check,
  ChevronUp,
  ChevronDown,
  UploadCloud,
  FileSpreadsheet,
  FileCheck,
  Download,
} from 'lucide-react';
import {
  parseUploadedDocument,
  downloadExcelTemplate,
  downloadCsvTemplate,
} from '../../utils/fileQuestionParser';
import { QuestionImageUploader } from '../common/QuestionImageUploader';
import { QuestionTextInput } from '../common/QuestionTextInput';
import { FormattedText } from '../common/FormattedText';
import { BANK_SOAL_TOPIC_PRESETS, generateCurriculumBankQuestions } from '../../utils/curriculumBank';

export const GRADE_CLASSES_MAP: Record<Jenjang, { id: string; name: string; fase?: string }[]> = {
  SD: [
    { id: 'Semua Kelas SD', name: 'Semua Tingkat SD (Kelas 1 - 6)' },
    { id: 'Kelas 1 SD', name: 'Kelas 1 SD', fase: 'Fase A (Awal Angka & Membaca)' },
    { id: 'Kelas 2 SD', name: 'Kelas 2 SD', fase: 'Fase A (Dasar)' },
    { id: 'Kelas 3 SD', name: 'Kelas 3 SD', fase: 'Fase B (Pemahaman)' },
    { id: 'Kelas 4 SD', name: 'Kelas 4 SD', fase: 'Fase B (Menengah)' },
    { id: 'Kelas 5 SD', name: 'Kelas 5 SD', fase: 'Fase C (Lanjutan)' },
    { id: 'Kelas 6 SD', name: 'Kelas 6 SD', fase: 'Fase C (Ujian Akhir & Kelulusan)' },
  ],
  SMP: [
    { id: 'Semua Kelas SMP', name: 'Semua Tingkat SMP (Kelas 7 - 9)' },
    { id: 'Kelas 7 SMP', name: 'Kelas 7 SMP', fase: 'Fase D (Transisi & Adaptasi)' },
    { id: 'Kelas 8 SMP', name: 'Kelas 8 SMP', fase: 'Fase D (Pendalaman Konsep)' },
    { id: 'Kelas 9 SMP', name: 'Kelas 9 SMP', fase: 'Fase D (Persiapan Masuk SMA)' },
  ],
  SMA: [
    { id: 'Semua Kelas SMA', name: 'Semua Tingkat SMA/SMK (Kelas 10 - 12)' },
    { id: 'Kelas 10 SMA', name: 'Kelas 10 SMA/SMK', fase: 'Fase E (Eksplorasi Minat)' },
    { id: 'Kelas 11 SMA', name: 'Kelas 11 SMA/SMK', fase: 'Fase F (Peminatan Lanjutan)' },
    { id: 'Kelas 12 SMA', name: 'Kelas 12 SMA/SMK', fase: 'Fase F (Persiapan SNBT & PTN)' },
  ],
  'Kuliah / Umum': [
    { id: 'Umum / Semua Usia', name: 'Umum / Semua Usia' },
    { id: 'Tingkat Mahasiswa', name: 'Tingkat Kuliah / Mahasiswa' },
    { id: 'Tingkat Dasar (Pemula)', name: 'Tingkat Dasar (Pemula)' },
    { id: 'Tingkat Menengah', name: 'Tingkat Menengah (Intermediate)' },
    { id: 'Tingkat Mahir', name: 'Tingkat Lanjut (Mahir / Profesional)' },
  ],
};

interface Props {
  onSaveQuiz: (newQuiz: QuizSet) => void;
  onCancel: () => void;
}

export const QuestionCreator: React.FC<Props> = ({ onSaveQuiz, onCancel }) => {
  const [mode, setMode] = useState<'ai' | 'manual' | 'upload'>('ai');

  // File Upload state
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessUploadedFile = async (file: File) => {
    setIsUploadLoading(true);
    setUploadError(null);
    sounds.playClick();

    try {
      const res = await parseUploadedDocument(file);
      setTitle(res.title);
      setDescription(res.description);
      setCategory(res.category);
      setGrade(res.grade);
      setTargetClass(res.targetClass || 'Kelas 7 SMP');
      setDifficulty(res.difficulty);
      setQuestions(res.questions);
      setMode('manual');

      const breakdown = res.typeBreakdown || {
        multiple_choice: res.questions.filter((q) => q.type === 'multiple_choice').length,
        complex_multiple_choice: res.questions.filter((q) => q.type === 'complex_multiple_choice').length,
        true_false: res.questions.filter((q) => q.type === 'true_false').length,
        fill_blank: res.questions.filter((q) => q.type === 'fill_blank').length,
        matching: res.questions.filter((q) => q.type === 'matching').length,
      };

      const breakdownParts = [
        breakdown.multiple_choice > 0 ? `${breakdown.multiple_choice} Pilihan Ganda` : null,
        breakdown.complex_multiple_choice > 0 ? `${breakdown.complex_multiple_choice} PG Kompleks` : null,
        breakdown.true_false > 0 ? `${breakdown.true_false} Benar/Salah` : null,
        breakdown.fill_blank > 0 ? `${breakdown.fill_blank} Isian` : null,
        breakdown.matching > 0 ? `${breakdown.matching} Menjodohkan` : null,
      ].filter(Boolean);

      setAiNotice(
        `Berhasil mengimpor & mengklasifikasikan ${res.questions.length} butir soal dari "${file.name}" (${
          breakdownParts.join(', ') || 'Semua format'
        }). Setiap butir soal telah dipisahkan dan siap diedit atau diubah jenisnya.`
      );
      sounds.playSuccess();
    } catch (err: any) {
      console.error('File parsing error:', err);
      setUploadError(err?.message || 'Gagal mengekstrak soal dari file. Periksa format file Anda.');
      sounds.playError();
    } finally {
      setIsUploadLoading(false);
    }
  };

  // AI Generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiGrade, setAiGrade] = useState<Jenjang>('SD');
  const [aiTargetClass, setAiTargetClass] = useState<string>('Kelas 5 SD');
  const [aiSubject, setAiSubject] = useState<MataPelajaran>('Bahasa Indonesia');
  const [aiCount, setAiCount] = useState<number>(6);
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('Sedang');
  const [aiFormat, setAiFormat] = useState<string>('campuran'); // 'campuran' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching'
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Manual / Staging state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MataPelajaran>('Bahasa Indonesia');
  const [grade, setGrade] = useState<Jenjang>('SD');
  const [targetClass, setTargetClass] = useState<string>('Kelas 5 SD');
  const [difficulty, setDifficulty] = useState<Difficulty>('Sedang');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingPackageQuestionIdx, setEditingPackageQuestionIdx] = useState<number | null>(null);
  const [creatorTypeFilter, setCreatorTypeFilter] = useState<'all' | QuestionType>('all');

  const handleUpdatePackageQuestion = (idx: number, patch: Partial<Question>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...patch };
    setQuestions(updated);
  };

  const handleReclassifyQuestion = (idx: number, newType: QuestionType) => {
    sounds.playClick();
    const q = questions[idx];
    if (!q) return;

    let updatedOptions = q.options && q.options.length >= 2 ? [...q.options] : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'];
    while (updatedOptions.length < 4) {
      updatedOptions.push(`Pilihan ${String.fromCharCode(65 + updatedOptions.length)}`);
    }

    let correctIndex = q.correctIndex !== undefined ? q.correctIndex : 0;
    let correctIndices = q.correctIndices && q.correctIndices.length > 0 ? q.correctIndices : [0, 1];
    let isTrue = q.isTrue !== undefined ? q.isTrue : true;
    let correctAnswer = q.correctAnswer || '';
    let matchingPairs = q.matchingPairs;

    if (newType === 'multiple_choice') {
      correctIndex = correctIndices[0] ?? 0;
      correctAnswer = updatedOptions[correctIndex] || updatedOptions[0];
    } else if (newType === 'complex_multiple_choice') {
      correctIndices = [correctIndex, (correctIndex + 1) % updatedOptions.length];
      correctAnswer = correctIndices.map((i) => updatedOptions[i]).join(', ');
    } else if (newType === 'true_false') {
      updatedOptions = ['Benar', 'Salah'];
      isTrue = true;
      correctAnswer = 'Benar';
    } else if (newType === 'fill_blank') {
      correctAnswer = q.correctAnswer || 'Jawaban Tepat';
    } else if (newType === 'matching') {
      matchingPairs = [
        { id: `p1-${Date.now()}`, left: 'Konsep A', right: 'Definisi A' },
        { id: `p2-${Date.now()}`, left: 'Konsep B', right: 'Definisi B' },
      ];
      correctAnswer = 'Konsep A ↔ Definisi A, Konsep B ↔ Definisi B';
    }

    handleUpdatePackageQuestion(idx, {
      type: newType,
      options: ['multiple_choice', 'complex_multiple_choice'].includes(newType) ? updatedOptions : undefined,
      correctIndex: newType === 'multiple_choice' ? correctIndex : undefined,
      correctIndices: newType === 'complex_multiple_choice' ? correctIndices : undefined,
      isTrue: newType === 'true_false' ? isTrue : undefined,
      matchingPairs: newType === 'matching' ? matchingPairs : undefined,
      correctAnswer,
    });
  };

  // Current editing question in manual form
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIdx, setQCorrectIdx] = useState<number>(0);
  const [qComplexCorrectIndices, setQComplexCorrectIndices] = useState<number[]>([0, 1]);
  const [qIsTrue, setQIsTrue] = useState<boolean>(true);
  const [qFillAnswer, setQFillAnswer] = useState('');
  const [qFillVariations, setQFillVariations] = useState('');
  const [qMatchingPairs, setQMatchingPairs] = useState<MatchingPair[]>([
    { id: '1', left: '', right: '' },
    { id: '2', left: '', right: '' },
    { id: '3', left: '', right: '' },
  ]);
  const [qExplanation, setQExplanation] = useState('');
  const [qHint, setQHint] = useState('');
  const [qAnagram, setQAnagram] = useState('');
  const [qImageUrl, setQImageUrl] = useState<string | undefined>(undefined);

  // AI Generation handler
  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      setAiError('Mohon isi topik soal yang ingin dibuat');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);
    setAiNotice(null);
    sounds.playClick();

    try {
      let generated: any = null;
      let noticeMsg: string | null = null;

      try {
        const res = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: aiTopic,
            grade: aiGrade,
            targetClass: aiTargetClass,
            subject: aiSubject,
            count: aiCount,
            difficulty: aiDifficulty,
            questionFormat: aiFormat,
          }),
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const json = await res.json();
            if (json && json.data && Array.isArray(json.data.questions) && json.data.questions.length > 0) {
              generated = json.data;
              noticeMsg = json.notice || null;
            }
          }
        }
      } catch (networkErr) {
        console.warn('API call failed or timed out, generating via local curriculum engine:', networkErr);
      }

      // Fallback to client-side curriculum bank generator if backend API was unavailable, returned HTML, or timed out
      if (!generated || !Array.isArray(generated.questions) || generated.questions.length === 0) {
        generated = generateCurriculumBankQuestions({
          topic: aiTopic,
          grade: aiGrade,
          targetClass: aiTargetClass,
          subject: aiSubject,
          count: aiCount,
          difficulty: aiDifficulty,
          questionFormat: aiFormat,
        });
        noticeMsg = `Paket ${generated.questions.length} butir soal autentik kurikulum berhasil disusun untuk topik "${aiTopic}".`;
      }

      if (noticeMsg) {
        setAiNotice(noticeMsg);
      }

      setTitle(generated.title || `Kuis: ${aiTopic}`);
      setDescription(generated.description || `Paket soal ${aiSubject} tentang ${aiTopic}`);
      setCategory(aiSubject);
      setGrade(aiGrade);
      setTargetClass(aiTargetClass);
      setDifficulty(aiDifficulty);

      // Map questions
      const parsedQuestions: Question[] = (generated.questions || []).map((q: any, i: number) => {
        const type: QuestionType = [
          'multiple_choice',
          'complex_multiple_choice',
          'true_false',
          'fill_blank',
          'matching',
        ].includes(q.type)
          ? q.type
          : 'multiple_choice';

        let correctAns = q.correctAnswer || '';
        if (type === 'multiple_choice' && q.options && q.correctIndex !== undefined) {
          correctAns = q.options[q.correctIndex] || correctAns;
        } else if (type === 'complex_multiple_choice') {
          if (q.options && q.correctIndices && q.correctIndices.length > 0) {
            correctAns = q.correctIndices.map((idx: number) => q.options[idx] || '').filter(Boolean).join(', ');
          }
        } else if (type === 'true_false') {
          correctAns = q.isTrue ? 'Benar' : 'Salah';
        }

        const pairs: MatchingPair[] = (q.matchingPairs || []).map((p: any, pIdx: number) => ({
          id: `mp-${i}-${pIdx}`,
          left: p.left || '',
          right: p.right || '',
        }));

        return {
          id: `ai-q-${Date.now()}-${i}`,
          type,
          question: q.question,
          options: q.options || (['multiple_choice', 'complex_multiple_choice'].includes(type) ? ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'] : undefined),
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : 0,
          correctIndices: q.correctIndices,
          isTrue: q.isTrue !== undefined ? q.isTrue : true,
          acceptableAnswers: q.acceptableAnswers || [correctAns],
          matchingPairs: pairs.length > 0 ? pairs : undefined,
          correctAnswer: correctAns,
          explanation: q.explanation || 'Pembahasan mendalam konsep materi pembelajaran.',
          hint: q.hint || 'Pahami kata kunci utama pada pertanyaan.',
          anagramWord: q.anagramWord || 'KUIS',
          subject: aiSubject,
          grade: aiGrade,
          targetClass: aiTargetClass,
          difficulty: aiDifficulty,
        };
      });

      setQuestions(parsedQuestions);
      setMode('manual');
      sounds.playSuccess();
    } catch (err: any) {
      console.error('Final fallback error:', err);
      setAiError('Gagal memproses soal: ' + (err?.message || 'Terjadi kesalahan sistem'));
      sounds.playError();
    } finally {
      setIsAiLoading(false);
    }
  };

  const [manualError, setManualError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add question manually
  const handleAddManualQuestion = () => {
    setManualError(null);
    if (!qText.trim()) {
      setManualError('Teks pertanyaan wajib diisi.');
      return;
    }

    sounds.playClick();
    let correctAns = '';
    let pairs: MatchingPair[] | undefined = undefined;
    let acceptable: string[] | undefined = undefined;

    if (qType === 'multiple_choice') {
      if (qOptions.some((o) => !o.trim())) {
        setManualError('Semua 4 pilihan jawaban harus diisi.');
        return;
      }
      correctAns = qOptions[qCorrectIdx];
    } else if (qType === 'complex_multiple_choice') {
      if (qOptions.some((o) => !o.trim())) {
        setManualError('Semua 4 pilihan jawaban harus diisi.');
        return;
      }
      if (qComplexCorrectIndices.length === 0) {
        setManualError('Pilih minimal satu atau dua opsi sebagai kunci jawaban benar.');
        return;
      }
      correctAns = qComplexCorrectIndices.map((i) => qOptions[i]).join(', ');
    } else if (qType === 'true_false') {
      correctAns = qIsTrue ? 'Benar' : 'Salah';
    } else if (qType === 'fill_blank') {
      if (!qFillAnswer.trim()) {
        setManualError('Kunci jawaban isian singkat wajib diisi.');
        return;
      }
      correctAns = qFillAnswer.trim();
      const vars = qFillVariations
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      acceptable = [correctAns, ...vars];
    } else if (qType === 'matching') {
      const validPairs = qMatchingPairs.filter((p) => p.left.trim() && p.right.trim());
      if (validPairs.length < 2) {
        setManualError('Minimal sediakan 2 pasang konsep untuk dijodohkan.');
        return;
      }
      pairs = validPairs;
      correctAns = 'Semua pasangan cocok';
    }

    const newQ: Question = {
      id: `manual-q-${Date.now()}`,
      type: qType,
      question: qText.trim(),
      options: ['multiple_choice', 'complex_multiple_choice'].includes(qType) ? [...qOptions] : undefined,
      correctIndex: qType === 'multiple_choice' ? qCorrectIdx : (qComplexCorrectIndices[0] ?? 0),
      correctIndices: qType === 'complex_multiple_choice' ? [...qComplexCorrectIndices] : undefined,
      isTrue: qType === 'true_false' ? qIsTrue : undefined,
      acceptableAnswers: acceptable,
      matchingPairs: pairs,
      correctAnswer: correctAns,
      explanation: qExplanation.trim() || 'Pembahasan materi pembelajaran.',
      hint: qHint.trim() || 'Petunjuk soal.',
      anagramWord: qAnagram.trim() || undefined,
      imageUrl: qImageUrl,
      subject: category,
      grade: grade,
      targetClass: targetClass,
      difficulty: difficulty,
    };

    setQuestions([...questions, newQ]);

    // Reset inputs
    setQText('');
    setQImageUrl(undefined);
    setQOptions(['', '', '', '']);
    setQFillAnswer('');
    setQFillVariations('');
    setQMatchingPairs([
      { id: '1', left: '', right: '' },
      { id: '2', left: '', right: '' },
      { id: '3', left: '', right: '' },
    ]);
    setQExplanation('');
    setQHint('');
    setQAnagram('');
    setManualError(null);
  };

  const handleRemoveQuestion = (id: string) => {
    sounds.playClick();
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleDuplicateQuestion = (q: Question) => {
    sounds.playClick();
    const cloned: Question = {
      ...q,
      id: `manual-q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      question: `${q.question} (Salinan)`,
      options: q.options ? [...q.options] : undefined,
      matchingPairs: q.matchingPairs
        ? q.matchingPairs.map((p) => ({ ...p, id: `mp-clone-${Date.now()}-${Math.random()}` }))
        : undefined,
      acceptableAnswers: q.acceptableAnswers ? [...q.acceptableAnswers] : undefined,
    };
    setQuestions([...questions, cloned]);
  };

  const handleSaveQuizSet = () => {
    setSaveError(null);
    if (questions.length === 0) {
      setSaveError('Paket soal harus memiliki minimal 1 pertanyaan sebelum disimpan.');
      return;
    }

    const finalTitle = title.trim() || `Paket Soal: ${category} (${targetClass || grade})`;
    sounds.playWin();
    const newQuiz: QuizSet = {
      id: `custom-quiz-${Date.now()}`,
      title: finalTitle,
      description: description.trim() || `Paket soal ${category} jenjang ${targetClass || grade}`,
      category,
      grade,
      targetClass,
      difficulty,
      icon: 'BookOpen',
      color: 'from-indigo-600 to-sky-700',
      questions,
      playCount: 1,
      isCustom: true,
      createdAt: new Date().toLocaleDateString('id-ID'),
    };

    onSaveQuiz(newQuiz);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-4 space-y-6">
      {/* Header Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 md:p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>
              Studio Pembuat Soal{' '}
              <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-300 bg-clip-text text-transparent">
                EduZone
              </span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Infinity className="w-3.5 h-3.5" />
              <span>Tanpa Batas</span>
            </span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            Dukung 4 format: Pilihan Ganda, Benar/Salah, Isian Singkat, & Menjodohkan • Kapasitas Soal Bebas
          </p>
        </div>

        <div className="flex flex-wrap items-center p-1 bg-slate-800 rounded-2xl border border-slate-700/80 gap-1">
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'ai'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>AI Generator</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'upload'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-emerald-400" />
            <span>Upload File (PDF/Word/Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mode === 'manual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Editor Manual ({questions.length})</span>
          </button>
        </div>
      </div>

      {/* AI GENERATOR PANEL */}
      {mode === 'ai' && (
        <div className="bg-slate-900/90 border-2 border-indigo-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-indigo-400" />
              <span>Buat Paket Soal Otomatis dengan AI</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cukup masukkan topik materi yang diajarkan, AI akan menyusun soal lengkap dengan pembahasan edukatif.
            </p>
          </div>

          {aiError && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {aiNotice && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{aiNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Topik */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 block">
                  Topik Materi Pembelajaran *
                </label>
                <span className="text-[11px] text-indigo-400 font-bold">
                  Bentuk Pertanyaan Sesuai Bank Soal Kurikulum
                </span>
              </div>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Ketik topik materi (contoh: Teks Prosedur, Surat Pribadi, Imbuhan, Fotosintesis, dsb.)..."
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none"
              />

              {/* Quick Pick Bank Soal Presets */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pilih Cepat Topik dari Bank Soal Kurikulum:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BANK_SOAL_TOPIC_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setAiTopic(preset.name);
                        setAiSubject(preset.subject as MataPelajaran);
                        setAiGrade(preset.grade as Jenjang);
                        setAiTargetClass(preset.targetClass);
                        sounds.playClick();
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        aiTopic === preset.name
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-900/40 ring-1 ring-indigo-300'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80 hover:border-indigo-500/50'
                      }`}
                    >
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Mata Pelajaran
              </label>
              <select
                value={aiSubject}
                onChange={(e) => setAiSubject(e.target.value as MataPelajaran)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none"
              >
                <option value="IPA / Sains">IPA / Sains</option>
                <option value="Matematika">Matematika</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
                <option value="IPS & Sejarah">IPS & Sejarah</option>
                <option value="Informatika & Logika">Informatika & Logika</option>
                <option value="Pengetahuan Umum">Pengetahuan Umum</option>
              </select>
            </div>

            {/* Jenjang & Tingkatan / Kelas Spesifik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <span>Jenjang Pendidikan *</span>
                </label>
                <select
                  value={aiGrade}
                  onChange={(e) => {
                    const newGrade = e.target.value as Jenjang;
                    setAiGrade(newGrade);
                    const classes = GRADE_CLASSES_MAP[newGrade];
                    setAiTargetClass(classes[1]?.id || classes[0].id);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none cursor-pointer"
                >
                  <option value="SD">SD (Sekolah Dasar)</option>
                  <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                  <option value="SMA">SMA / SMK (Sekolah Menengah Atas)</option>
                  <option value="Kuliah / Umum">Kuliah / Umum</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tingkatan / Kelas Sasaran *</span>
                </label>
                <select
                  value={aiTargetClass}
                  onChange={(e) => setAiTargetClass(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-indigo-500/50 text-white text-sm focus:border-indigo-400 outline-none font-semibold cursor-pointer"
                >
                  {GRADE_CLASSES_MAP[aiGrade].map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.fase ? `• ${cls.fase}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Format Soal Khusus */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Format Soal yang Diinginkan
              </label>
              <select
                value={aiFormat}
                onChange={(e) => setAiFormat(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none"
              >
                <option value="campuran">Variasi Campuran (Semua 4 Format)</option>
                <option value="multiple_choice">Hanya Pilihan Ganda (4 Opsi)</option>
                <option value="true_false">Hanya Benar / Salah</option>
                <option value="fill_blank">Hanya Isian Singkat</option>
                <option value="matching">Hanya Menjodohkan Pasangan</option>
              </select>
            </div>

            {/* Jumlah Soal (Tanpa Batas) & Kesulitan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <span>Jumlah Soal Dibuat</span>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                      <Infinity className="w-3 h-3" />
                      <span>Tanpa Batas</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCount(!isCustomCount)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    {isCustomCount ? 'Pilih Preset' : 'Ketik Angka Bebas'}
                  </button>
                </div>

                {isCustomCount ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={aiCount}
                      onChange={(e) => setAiCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      placeholder="Masukkan jumlah soal (misal: 15, 25, 50)..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-emerald-500/50 text-white text-sm focus:border-emerald-400 outline-none font-bold"
                    />
                    <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Soal</span>
                  </div>
                ) : (
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none cursor-pointer"
                  >
                    <option value={5}>5 Soal (Cepat)</option>
                    <option value={10}>10 Soal (Standar)</option>
                    <option value={15}>15 Soal (Lengkap)</option>
                    <option value={20}>20 Soal (Ulangan Harian)</option>
                    <option value={25}>25 Soal (Ujian Bab)</option>
                    <option value={30}>30 Soal (Try Out)</option>
                    <option value={50}>50 Soal (Bank Soal Besar)</option>
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Tingkat Kesulitan
                </label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as Difficulty)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-400 outline-none cursor-pointer"
                >
                  <option value="Mudah">Mudah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tantangan">Tantangan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={isAiLoading || !aiTopic.trim()}
              onClick={handleGenerateAI}
              className="btn-3d px-7 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-900/40 cursor-pointer disabled:opacity-40"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI Sedang Menyusun Soal...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Hasilkan Soal Edukatif</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FILE UPLOAD PANEL (PDF, WORD, EXCEL) */}
      {mode === 'upload' && (
        <div className="bg-slate-900/90 border-2 border-emerald-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
              <span>Upload Soal File (PDF, Word, Excel)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Unggah file materi / soal guru dalam format PDF (.pdf), Microsoft Word (.docx), atau Excel (.xlsx, .csv).
              Sistem akan otomatis mengekstrak semua pertanyaan, pilihan jawaban, kunci, dan pembahasan.
            </p>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleProcessUploadedFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? 'border-emerald-400 bg-emerald-950/40 scale-[0.99]'
                : 'border-slate-700 hover:border-emerald-500/60 bg-slate-800/40 hover:bg-slate-800/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleProcessUploadedFile(f);
              }}
            />

            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              {isUploadLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8" />
              )}
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-black text-white">
                {isUploadLoading
                  ? 'Sedang Membaca & Mengekstrak Soal...'
                  : 'Klik untuk Memilih File atau Tarik File ke Sini'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Dukung file: <strong className="text-emerald-300">Excel (.xlsx, .csv)</strong>,{' '}
                <strong className="text-blue-300">Word (.docx)</strong>, atau{' '}
                <strong className="text-rose-300">PDF Dokumen (.pdf)</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Excel (.xlsx, .xls, .csv)
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Word (.docx)
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-rose-400" />
                PDF Dokumen (.pdf)
              </span>
            </div>
          </div>

          {/* Upload Error Alert */}
          {uploadError && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <strong className="block font-bold">Terjadi Kesalahan Ekstraksi:</strong>
                <span>{uploadError}</span>
              </div>
            </div>
          )}

          {/* Template Download Section */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Unduh Format Template Resmi Excel (.xlsx)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gunakan template untuk memastikan kolom soal, opsi pilihan A-D, dan kunci jawaban terbaca 100% sempurna
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  downloadExcelTemplate();
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download Template Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  downloadCsvTemplate();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white border border-slate-600 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Download Template CSV</span>
              </button>
            </div>
          </div>

          {/* Panduan Format Word & PDF */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Format Standar Word & PDF yang Dikenali Otomatis:</span>
            </div>
            <p>
              Format soal berurutan: <code>1. Teks Soal...</code> lalu <code>A. Pilihan... B. Pilihan...</code> dan baris <code>Kunci: A</code> atau <code>Jawaban: Benar</code>.
              Sistem mengenali 4 tipe soal: Pilihan Ganda, Benar/Salah, Isian Singkat, dan Menjodohkan.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}
      {mode === 'manual' && (
        <div className="space-y-6">
          {aiNotice && (
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
                <span>{aiNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAiNotice(null)}
                className="text-indigo-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-indigo-900/50 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top Quick Save Bar */}
          {questions.length > 0 && (
            <div className="sticky top-20 z-20 bg-slate-900/95 border-2 border-emerald-500/60 p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    {questions.length} Butir Soal Siap Disimpan
                  </h4>
                  <p className="text-xs text-slate-300">
                    {title.trim() ? title : 'Judul otomatis akan diberikan jika tidak diisi'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuizSet}
                  className="btn-3d px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan ke Bank Soal</span>
                </button>
              </div>
            </div>
          )}

          {saveError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Metadata Package Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Informasi Paket Soal</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Judul Paket Soal / Permainan *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      const prefix = ['Kuis Interaktif', 'Tantangan Pintar', 'Latihan Mandiri', 'Game Cerdas Cermat'][Math.floor(Math.random() * 4)];
                      setTitle(`${prefix}: ${category} - ${targetClass || grade}`);
                    }}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Ubah judul secara otomatis"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Ubah Judul Otomatis</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Ulangan Harian Tata Surya Kelas 7"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Deskripsi
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat materi..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Mata Pelajaran
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MataPelajaran)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none"
                >
                  <option value="IPA / Sains">IPA / Sains</option>
                  <option value="Matematika">Matematika</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Bahasa Inggris">Bahasa Inggris</option>
                  <option value="IPS & Sejarah">IPS & Sejarah</option>
                  <option value="Informatika & Logika">Informatika & Logika</option>
                  <option value="Pengetahuan Umum">Pengetahuan Umum</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Jenjang
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => {
                      const newGrade = e.target.value as Jenjang;
                      setGrade(newGrade);
                      const classes = GRADE_CLASSES_MAP[newGrade];
                      setTargetClass(classes[1]?.id || classes[0].id);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none cursor-pointer"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA / SMK</option>
                    <option value="Kuliah / Umum">Kuliah / Umum</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-indigo-400" />
                    <span>Tingkatan / Kelas</span>
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-indigo-500/50 text-white text-sm outline-none font-semibold cursor-pointer"
                  >
                    {GRADE_CLASSES_MAP[grade].map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Kesulitan
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none cursor-pointer"
                  >
                    <option value="Mudah">Mudah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tantangan">Tantangan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Form to Add / Insert Question */}
          <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 md:p-6 space-y-4">
            {manualError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Tambah Soal Baru</span>
              </h3>

              {/* Format Selector Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'multiple_choice', label: 'Pilihan Ganda' },
                    { id: 'complex_multiple_choice', label: 'PG Kompleks (Multi)' },
                    { id: 'true_false', label: 'Benar / Salah' },
                    { id: 'fill_blank', label: 'Isian Singkat' },
                    { id: 'matching', label: 'Menjodohkan' },
                  ] as { id: QuestionType; label: string }[]
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setQType(fmt.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      qType === fmt.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Text with RichText Toolbar */}
            <QuestionTextInput
              value={qText}
              onChange={setQText}
              label="Teks Pertanyaan / Pernyataan *"
              placeholder={
                qType === 'true_false'
                  ? 'Tuliskan pernyataan yang akan dinilai kebenarannya...'
                  : qType === 'complex_multiple_choice'
                  ? 'Tuliskan pertanyaan dengan beberapa pilihan jawaban yang benar...'
                  : qType === 'fill_blank'
                  ? 'Gunakan tanda "_____" untuk bagian kalimat yang harus diisi...'
                  : qType === 'matching'
                  ? 'Tuliskan instruksi penjodohan konsep...'
                  : 'Tuliskan pertanyaan pilihan ganda...'
              }
            />

            {/* Upload Gambar Penjelas Soal */}
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/70">
              <QuestionImageUploader
                imageUrl={qImageUrl}
                onChange={setQImageUrl}
                label="Upload Gambar Penjelas Soal (Bagan, Teks Bacaan, Grafik, atau Foto Ilustrasi)"
              />
            </div>

            {/* Dynamic Input based on Question Type */}
            {qType === 'multiple_choice' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Pilihan Jawaban (Pilih radio untuk menandai kunci jawaban yang benar):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['A', 'B', 'C', 'D'].map((letter, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700"
                    >
                      <input
                        type="radio"
                        name="correctIdx"
                        checked={qCorrectIdx === idx}
                        onChange={() => setQCorrectIdx(idx)}
                        className="w-4 h-4 accent-indigo-500 cursor-pointer"
                      />
                      <span className="font-bold text-xs text-indigo-400 w-5">
                        {letter}.
                      </span>
                      <input
                        type="text"
                        value={qOptions[idx]}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[idx] = e.target.value;
                          setQOptions(updated);
                        }}
                        placeholder={`Teks Opsi ${letter}...`}
                        className="flex-1 bg-transparent text-sm text-white outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qType === 'complex_multiple_choice' && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Pilihan Ganda Kompleks (Centang kotak di opsi untuk jawaban yang benar):</span>
                  </label>
                  <span className="text-[11px] text-cyan-300 font-bold bg-cyan-500/20 px-2 py-0.5 rounded-md">
                    Bisa lebih dari 1 kunci
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {qOptions.map((optVal, idx) => {
                    const letter = ['A', 'B', 'C', 'D', 'E', 'F'][idx] || String.fromCharCode(65 + idx);
                    const isChecked = qComplexCorrectIndices.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-cyan-950/60 border-cyan-500 ring-1 ring-cyan-500/40'
                            : 'bg-slate-800/80 border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setQComplexCorrectIndices((prev) =>
                              prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                            );
                          }}
                          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                        />
                        <span className="font-bold text-xs text-cyan-400 w-5">
                          {letter}.
                        </span>
                        <input
                          type="text"
                          value={qOptions[idx] || ''}
                          onChange={(e) => {
                            const updated = [...qOptions];
                            updated[idx] = e.target.value;
                            setQOptions(updated);
                          }}
                          placeholder={`Teks Opsi ${letter}...`}
                          className="flex-1 bg-transparent text-sm text-white outline-none"
                        />
                        {isChecked && (
                          <span className="text-[10px] bg-cyan-500 text-white px-1.5 py-0.5 rounded font-black uppercase">
                            Kunci
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {qType === 'true_false' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Kunci Kebenaran Pernyataan:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-sm font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="tfChoice"
                      checked={qIsTrue === true}
                      onChange={() => setQIsTrue(true)}
                      className="accent-emerald-500"
                    />
                    <span>Pernyataan ini BENAR</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-sm font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="tfChoice"
                      checked={qIsTrue === false}
                      onChange={() => setQIsTrue(false)}
                      className="accent-rose-500"
                    />
                    <span>Pernyataan ini SALAH</span>
                  </label>
                </div>
              </div>
            )}

            {qType === 'fill_blank' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Kunci Jawaban Tepat *
                  </label>
                  <input
                    type="text"
                    value={qFillAnswer}
                    onChange={(e) => setQFillAnswer(e.target.value)}
                    placeholder="Contoh: Gravitasi"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Variasi Jawaban Diterima (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={qFillVariations}
                    onChange={(e) => setQFillVariations(e.target.value)}
                    placeholder="Contoh: gaya gravitasi, gravitation"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm outline-none"
                  />
                </div>
              </div>
            )}

            {qType === 'matching' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Pasangan Konsep (Kiri dijodohkan dengan Kanan):
                </label>
                <div className="space-y-2">
                  {qMatchingPairs.map((pair, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-400 w-6">#{idx + 1}</span>
                      <input
                        type="text"
                        value={pair.left}
                        onChange={(e) => {
                          const updated = [...qMatchingPairs];
                          updated[idx].left = e.target.value;
                          setQMatchingPairs(updated);
                        }}
                        placeholder="Konsep Kiri (misal: Jupiter)"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                      />
                      <span className="text-slate-500">↔</span>
                      <input
                        type="text"
                        value={pair.right}
                        onChange={(e) => {
                          const updated = [...qMatchingPairs];
                          updated[idx].right = e.target.value;
                          setQMatchingPairs(updated);
                        }}
                        placeholder="Pasangan Kanan (misal: Planet Terbesar)"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQMatchingPairs([
                      ...qMatchingPairs,
                      { id: String(Date.now()), left: '', right: '' },
                    ])
                  }
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Baris Pasangan</span>
                </button>
              </div>
            )}

            {/* Explanation & Hint */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Pembahasan Edukatif (Muncul setelah dijawab)
                </label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Jelaskan alasan dan konsep di balik jawaban..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Petunjuk Bantuan (Hint)
                </label>
                <input
                  type="text"
                  value={qHint}
                  onChange={(e) => setQHint(e.target.value)}
                  placeholder="Petunjuk singkat jika siswa kesulitan..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddManualQuestion}
                className="btn-3d px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambahkan Soal ke Paket</span>
              </button>
            </div>
          </div>

          {/* List of Questions in the Package */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Daftar Soal Dalam Paket ({questions.length})
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Infinity className="w-3.5 h-3.5" />
                  <span>Tanpa Batas</span>
                </span>
              </div>
              <span className="text-xs text-slate-400 font-normal">
                Bisa ditambah sebanyak mungkin & langsung dimainkan di semua mode
              </span>
            </div>

            {questions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-sm">
                Belum ada soal dalam paket ini. Tambahkan soal secara manual atau gunakan AI Generator.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Classification Breakdown Panel & Filter Tabs */}
                {(() => {
                  const mcCount = questions.filter((q) => q.type === 'multiple_choice').length;
                  const cmcCount = questions.filter((q) => q.type === 'complex_multiple_choice').length;
                  const tfCount = questions.filter((q) => q.type === 'true_false').length;
                  const fillCount = questions.filter((q) => q.type === 'fill_blank').length;
                  const matchCount = questions.filter((q) => q.type === 'matching').length;

                  return (
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">
                            Klasifikasi Jenis Soal Terdeteksi ({questions.length} Butir)
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Klik tab di bawah untuk filter, atau ubah tipe per butir soal lewat dropdown
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCreatorTypeFilter('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            creatorTypeFilter === 'all'
                              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Semua</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                            {questions.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCreatorTypeFilter('multiple_choice')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            creatorTypeFilter === 'multiple_choice'
                              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Pilihan Ganda</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                            {mcCount}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCreatorTypeFilter('complex_multiple_choice')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            creatorTypeFilter === 'complex_multiple_choice'
                              ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>PG Kompleks</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                            {cmcCount}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCreatorTypeFilter('true_false')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            creatorTypeFilter === 'true_false'
                              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Benar / Salah</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                            {tfCount}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCreatorTypeFilter('fill_blank')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            creatorTypeFilter === 'fill_blank'
                              ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Isian Singkat</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                            {fillCount}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCreatorTypeFilter('matching')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            creatorTypeFilter === 'matching'
                              ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Menjodohkan</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-black">
                            {matchCount}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {questions
                  .map((q, originalIdx) => ({ q, originalIdx }))
                  .filter(({ q }) => creatorTypeFilter === 'all' || q.type === creatorTypeFilter)
                  .map(({ q, originalIdx }) => {
                    const isEditingThis = editingPackageQuestionIdx === originalIdx;

                    const typeBadge = (() => {
                      switch (q.type) {
                        case 'multiple_choice':
                          return { label: 'Pilihan Ganda', style: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
                        case 'complex_multiple_choice':
                          return { label: 'PG Kompleks (Multi)', style: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
                        case 'true_false':
                          return { label: 'Benar / Salah', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
                        case 'fill_blank':
                          return { label: 'Isian Singkat', style: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
                        case 'matching':
                          return { label: 'Menjodohkan', style: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
                        default:
                          return { label: q.type, style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
                      }
                    })();

                    return (
                      <div
                        key={q.id || originalIdx}
                        className={`rounded-2xl border transition-all ${
                          isEditingThis
                            ? 'bg-slate-900 border-indigo-500/80 shadow-xl ring-2 ring-indigo-500/30'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Summary Row */}
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-300">
                                #{originalIdx + 1}
                              </span>
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${typeBadge.style}`}>
                                {typeBadge.label}
                              </span>
                              
                              {/* Quick Reclassify Dropdown */}
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">Ubah:</span>
                                <select
                                  value={q.type}
                                  onChange={(e) => handleReclassifyQuestion(originalIdx, e.target.value as QuestionType)}
                                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white cursor-pointer focus:border-indigo-500 outline-none"
                                  title="Ubah Klasifikasi Jenis Soal Ini Secara Cepat"
                                >
                                  <option value="multiple_choice">Pilihan Ganda</option>
                                  <option value="complex_multiple_choice">PG Kompleks (Multi)</option>
                                  <option value="true_false">Benar / Salah</option>
                                  <option value="fill_blank">Isian Singkat</option>
                                  <option value="matching">Menjodohkan</option>
                                </select>
                              </div>

                              {isEditingThis && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-extrabold uppercase border border-amber-500/30">
                                  Mode Edit
                                </span>
                              )}
                              {q.imageUrl && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-extrabold uppercase border border-emerald-500/30 flex items-center gap-1">
                                  📷 Gambar
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-white line-clamp-2">
                              <FormattedText text={q.question || '(Belum ada teks pertanyaan)'} />
                            </h4>

                            <div className="text-xs text-slate-400">
                              Kunci Jawaban:{' '}
                              <strong className="text-emerald-400 font-semibold">{q.correctAnswer || '(Belum ditentukan)'}</strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setEditingPackageQuestionIdx(isEditingThis ? null : originalIdx);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                isEditingThis
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30'
                              }`}
                              title="Edit Soal & Kunci Jawaban"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{isEditingThis ? 'Tutup' : 'Edit'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicateQuestion(q)}
                              className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl transition-colors cursor-pointer"
                              title="Gandakan Soal Ini"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(q.id)}
                              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                              title="Hapus Soal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Question Editor */}
                        {isEditingThis && (
                          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 rounded-b-2xl space-y-4">
                            {/* Question Text with RichText Toolbar */}
                            <QuestionTextInput
                              value={q.question}
                              onChange={(val) => handleUpdatePackageQuestion(originalIdx, { question: val })}
                              label="Teks Pertanyaan *"
                              placeholder="Tuliskan pertanyaan di sini..."
                            />

                            {/* Upload Gambar Penjelas Soal */}
                            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/70">
                              <QuestionImageUploader
                                imageUrl={q.imageUrl}
                                onChange={(url) => handleUpdatePackageQuestion(originalIdx, { imageUrl: url })}
                                label="Upload Gambar Penjelas Soal (Bagan, Teks Bacaan, Grafik, atau Foto Ilustrasi)"
                              />
                            </div>

                          {/* Multiple Choice Editor */}
                          {q.type === 'multiple_choice' && (() => {
                            const opts = q.options && q.options.length > 0 ? q.options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'];
                            const letters = ['A', 'B', 'C', 'D', 'E'];

                            let effectiveCorrectIdx = 0;
                            if (q.correctIndex !== undefined && q.correctIndex >= 0 && q.correctIndex < opts.length) {
                              effectiveCorrectIdx = q.correctIndex;
                            } else {
                              const foundIdx = opts.findIndex(
                                (opt) => opt.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase()
                              );
                              if (foundIdx !== -1) effectiveCorrectIdx = foundIdx;
                            }

                            const handleSetCorrect = (targetIdx: number) => {
                              const chosen = opts[targetIdx] || '';
                              handleUpdatePackageQuestion(originalIdx, {
                                correctIndex: targetIdx,
                                correctAnswer: chosen,
                              });
                              sounds.playClick();
                            };

                            const handleUpdateText = (targetIdx: number, val: string) => {
                              const nextOpts = [...opts];
                              nextOpts[targetIdx] = val;
                              const isThisCorrect = effectiveCorrectIdx === targetIdx;
                              const patch: Partial<Question> = { options: nextOpts };
                              if (isThisCorrect) {
                                patch.correctAnswer = val;
                                patch.correctIndex = targetIdx;
                              }
                              handleUpdatePackageQuestion(originalIdx, patch);
                            };

                            return (
                              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                  <label className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Tentukan Kunci Jawaban Benar:</span>
                                  </label>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-slate-400">Pilih Cepat Kunci:</span>
                                    {opts.map((_, oIdx) => (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        onClick={() => handleSetCorrect(oIdx)}
                                        className={`px-2.5 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                          effectiveCorrectIdx === oIdx
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                      >
                                        Opsi {letters[oIdx]}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {opts.map((opt, optIdx) => {
                                    const isCorrect = effectiveCorrectIdx === optIdx;

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                                          isCorrect
                                            ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                                            : 'bg-slate-800/80 border-slate-700/80'
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name={`creator-correct-${q.id || originalIdx}`}
                                          checked={isCorrect}
                                          onChange={() => handleSetCorrect(optIdx)}
                                          className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
                                        />

                                        <button
                                          type="button"
                                          onClick={() => handleSetCorrect(optIdx)}
                                          className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center cursor-pointer shrink-0 ${
                                            isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                                          }`}
                                        >
                                          {letters[optIdx]}
                                        </button>

                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => handleUpdateText(optIdx, e.target.value)}
                                          className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white focus:outline-none font-bold"
                                          placeholder={`Teks Opsi ${letters[optIdx]}...`}
                                        />

                                        {isCorrect ? (
                                          <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold text-[10px] uppercase shrink-0">
                                            Kunci Benar
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleSetCorrect(optIdx)}
                                            className="px-2 py-0.5 rounded-md bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer shrink-0"
                                          >
                                            Pilih Kunci
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Complex Multiple Choice Editor */}
                          {q.type === 'complex_multiple_choice' && (() => {
                            const opts = q.options && q.options.length > 0 ? q.options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'];
                            const letters = ['A', 'B', 'C', 'D', 'E'];
                            const activeIndices = q.correctIndices && q.correctIndices.length > 0
                              ? q.correctIndices
                              : (q.correctIndex !== undefined ? [q.correctIndex] : [0, 1]);

                            const handleToggleIndex = (targetIdx: number) => {
                              const next = activeIndices.includes(targetIdx)
                                ? activeIndices.filter((i) => i !== targetIdx)
                                : [...activeIndices, targetIdx];
                              const safeNext = next.length > 0 ? next : [targetIdx];
                              const correctAnsStr = safeNext.map((i) => opts[i] || '').filter(Boolean).join(', ');
                              handleUpdatePackageQuestion(originalIdx, {
                                correctIndices: safeNext,
                                correctAnswer: correctAnsStr,
                              });
                              sounds.playClick();
                            };

                            const handleUpdateText = (targetIdx: number, val: string) => {
                              const nextOpts = [...opts];
                              nextOpts[targetIdx] = val;
                              const correctAnsStr = activeIndices.map((i) => nextOpts[i] || '').filter(Boolean).join(', ');
                              handleUpdatePackageQuestion(originalIdx, {
                                options: nextOpts,
                                correctAnswer: correctAnsStr,
                              });
                            };

                            return (
                              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                  <label className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                                    <span>Kunci Jawaban PG Kompleks (Pilih 1 atau Lebih Jawaban Benar):</span>
                                  </label>
                                  <div className="text-[11px] text-slate-400">
                                    Kunci Terpilih:{' '}
                                    <strong className="text-cyan-300 font-bold">
                                      {activeIndices.map((i) => `Opsi ${letters[i]}`).join(', ') || 'Belum ada'}
                                    </strong>
                                  </div>
                                </div>

                                {/* Quick toggle pills */}
                                <div className="flex flex-wrap items-center gap-1.5 py-1">
                                  <span className="text-[11px] font-bold text-slate-400 mr-1">Centang Cepat:</span>
                                  {opts.map((_, oIdx) => {
                                    const isSelected = activeIndices.includes(oIdx);
                                    return (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        onClick={() => handleToggleIndex(oIdx)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                                          isSelected
                                            ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300'
                                            : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                        }`}
                                      >
                                        <span>{isSelected ? '☑' : '☐'} Opsi {letters[oIdx]}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="space-y-2">
                                  {opts.map((opt, optIdx) => {
                                    const isCorrect = activeIndices.includes(optIdx);

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                                          isCorrect
                                            ? 'bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/30'
                                            : 'bg-slate-800/80 border-slate-700/80'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isCorrect}
                                          onChange={() => handleToggleIndex(optIdx)}
                                          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer shrink-0"
                                        />

                                        <button
                                          type="button"
                                          onClick={() => handleToggleIndex(optIdx)}
                                          className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center cursor-pointer shrink-0 ${
                                            isCorrect ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'
                                          }`}
                                        >
                                          {letters[optIdx]}
                                        </button>

                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={(e) => handleUpdateText(optIdx, e.target.value)}
                                          className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white focus:outline-none font-bold"
                                          placeholder={`Teks Opsi ${letters[optIdx]}...`}
                                        />

                                        {isCorrect ? (
                                          <span className="px-2 py-0.5 rounded-md bg-cyan-500 text-white font-extrabold text-[10px] uppercase shrink-0">
                                            Kunci Benar
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleToggleIndex(optIdx)}
                                            className="px-2 py-0.5 rounded-md bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer shrink-0"
                                          >
                                            Pilih Kunci
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          {/* True / False Editor */}
                          {q.type === 'true_false' && (() => {
                            const isCurrentTrue =
                              q.isTrue !== undefined
                                ? q.isTrue
                                : (q.correctAnswer || '').toLowerCase() === 'benar';

                            return (
                              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                                <label className="text-xs font-black text-emerald-400 block mb-1">
                                  Kunci Jawaban Pernyataan Ini:
                                </label>
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdatePackageQuestion(originalIdx, {
                                        isTrue: true,
                                        correctAnswer: 'Benar',
                                      });
                                      sounds.playClick();
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                                      isCurrentTrue
                                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    BENAR (True)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdatePackageQuestion(originalIdx, {
                                        isTrue: false,
                                        correctAnswer: 'Salah',
                                      });
                                      sounds.playClick();
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                                      !isCurrentTrue
                                        ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    SALAH (False)
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Fill Blank Editor */}
                          {q.type === 'fill_blank' && (
                            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                              <label className="text-xs font-black text-emerald-400 block">
                                Kunci Jawaban Utama Baku *
                              </label>
                              <input
                                type="text"
                                value={q.correctAnswer}
                                onChange={(e) => handleUpdatePackageQuestion(originalIdx, { correctAnswer: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                                placeholder="Contoh: Fotosintesis"
                              />
                            </div>
                          )}

                          {/* Explanation & Hint */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1">
                                Pembahasan Soal
                              </label>
                              <input
                                type="text"
                                value={q.explanation || ''}
                                onChange={(e) => handleUpdatePackageQuestion(originalIdx, { explanation: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-medium focus:outline-none"
                                placeholder="Penjelasan jawaban..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1">
                                Petunjuk (Hint)
                              </label>
                              <input
                                type="text"
                                value={q.hint || ''}
                                onChange={(e) => handleUpdatePackageQuestion(originalIdx, { hint: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-medium focus:outline-none"
                                placeholder="Petunjuk singkat..."
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setEditingPackageQuestionIdx(null);
                              }}
                              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Selesai Edit Soal Ini</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Save */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={questions.length === 0}
              onClick={handleSaveQuizSet}
              className="btn-3d px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-extrabold rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-950/40 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              <span>Simpan ke Bank Soal ({questions.length} Soal)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
