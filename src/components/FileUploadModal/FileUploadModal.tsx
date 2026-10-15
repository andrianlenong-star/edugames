import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  Trash2,
  Edit3,
  X,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowRight,
  Save,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import {
  parseUploadedDocument,
  downloadExcelTemplate,
  downloadCsvTemplate,
  ParsedFileResult,
} from '../../utils/fileQuestionParser';
import { QuizSet, Question, Jenjang, MataPelajaran, Difficulty } from '../../types';
import { QuestionImageUploader } from '../common/QuestionImageUploader';
import { QuestionTextInput } from '../common/QuestionTextInput';
import { FormattedText } from '../common/FormattedText';
import { sounds } from '../../utils/audio';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveQuiz: (newQuiz: QuizSet) => void;
  onOpenInEditor?: (quizDraft: {
    title: string;
    description: string;
    category: MataPelajaran;
    grade: Jenjang;
    targetClass?: string;
    difficulty: Difficulty;
    questions: Question[];
  }) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onSaveQuiz,
  onOpenInEditor,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedFileResult | null>(null);

  // Form customization once parsed
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customCategory, setCustomCategory] = useState<MataPelajaran>('Bahasa Indonesia');
  const [customGrade, setCustomGrade] = useState<Jenjang>('SD');
  const [customTargetClass, setCustomTargetClass] = useState<string>('Kelas 5 SD');
  const [customDifficulty, setCustomDifficulty] = useState<Difficulty>('Sedang');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpdateQuestion = (idx: number, patch: Partial<Question>) => {
    setPreviewQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...patch };
      return updated;
    });
  };

  const handleAddNewQuestion = () => {
    sounds.playClick();
    const newQ: Question = {
      id: `imported-q-${Date.now()}-${previewQuestions.length}`,
      type: 'multiple_choice',
      question: 'Tuliskan teks pertanyaan baru di sini...',
      options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
      correctIndex: 0,
      correctAnswer: 'Pilihan A',
      isTrue: true,
      explanation: 'Pembahasan materi pembelajaran.',
      hint: 'Petunjuk pengerjaan soal.',
      anagramWord: 'KUIS',
    };
    setPreviewQuestions((prev) => [...prev, newQ]);
    setEditingQuestionIdx(previewQuestions.length);
  };

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    sounds.playClick();

    try {
      const result = await parseUploadedDocument(file);
      setParsedData(result);
      setCustomTitle(result.title);
      setCustomDesc(result.description);
      setCustomCategory(result.category);
      setCustomGrade(result.grade);
      setCustomTargetClass(result.targetClass || 'Kelas 7 SMP');
      setCustomDifficulty(result.difficulty);
      setPreviewQuestions(result.questions);
      sounds.playSuccess();
    } catch (err: any) {
      console.error('File parse error:', err);
      setErrorMsg(err?.message || 'Gagal memproses file. Pastikan format file sesuai.');
      sounds.playError();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDeleteQuestion = (idx: number) => {
    sounds.playClick();
    setPreviewQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveToBankSoal = () => {
    if (previewQuestions.length === 0) {
      setErrorMsg('Minimal terdapat 1 butir soal untuk disimpan.');
      return;
    }

    const finalTitle = customTitle.trim() || `Paket Soal: ${customCategory}`;
    const newQuiz: QuizSet = {
      id: `quiz-upload-${Date.now()}`,
      title: finalTitle,
      description:
        customDesc.trim() ||
        `Paket ${previewQuestions.length} butir soal diimpor dari file dokumen`,
      category: customCategory,
      grade: customGrade,
      targetClass: customTargetClass,
      difficulty: customDifficulty,
      icon: 'BookOpen',
      color: 'from-emerald-600 to-teal-700',
      questions: previewQuestions,
      playCount: 1,
      isCustom: true,
      createdAt: new Date().toLocaleDateString('id-ID'),
    };

    sounds.playWin();
    onSaveQuiz(newQuiz);
    onClose();
  };

  const handleEditInStudio = () => {
    if (onOpenInEditor) {
      onOpenInEditor({
        title: customTitle.trim(),
        description: customDesc.trim(),
        category: customCategory,
        grade: customGrade,
        targetClass: customTargetClass,
        difficulty: customDifficulty,
        questions: previewQuestions,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>Upload Soal File</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  PDF • Word • Excel
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Unggah dokumen soal guru (.pdf, .docx, .xlsx, .csv) dan otomatis dikonversi ke Bank Soal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: DROPZONE IF NOT YET PARSED */}
          {!parsedData && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-950/30 scale-[0.99]'
                    : 'border-slate-700 hover:border-emerald-500/60 bg-slate-800/40 hover:bg-slate-800/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">
                    {isLoading ? 'Sedang Membaca & Mengekstrak Soal...' : 'Klik atau Tarik File ke Sini'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                    Mendukung file dokumen soal:{' '}
                    <strong className="text-emerald-300">PDF (.pdf)</strong>,{' '}
                    <strong className="text-blue-300">Word (.docx)</strong>, atau{' '}
                    <strong className="text-emerald-400">Excel (.xlsx, .csv)</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    Excel (.xlsx, .csv)
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

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Terjadi Kesalahan Pembacaan File:</strong>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* Template Download Section */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Unduh Template Format Standar Soal Guru</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Gunakan template resmi untuk hasil ekstraksi 100% cepat dan rapi
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

              {/* Panduan Format File Word & PDF */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <span>Tips Format Dokumen Word & PDF:</span>
                </div>
                <p>
                  Pastikan soal memiliki nomor urut (contoh: <code>1. Teks soal...</code>), pilihan jawaban (<code>A. Opsi A</code>, <code>B. Opsi B</code>), serta baris kunci jawaban (<code>Kunci: A</code> atau <code>Jawaban: Benar</code>). Sistem otomatis mengenali 4 tipe soal: Pilihan Ganda, Benar/Salah, Isian Singkat, dan Menjodohkan.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & CUSTOMIZATION AFTER PARSING */}
          {parsedData && (
            <div className="space-y-6">
              {/* Success Notification */}
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Berhasil membaca file <strong>{parsedData.sourceFileName}</strong> • Terdeteksi{' '}
                    <strong>{previewQuestions.length} butir soal</strong> siap diimpor!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedData(null);
                    setPreviewQuestions([]);
                  }}
                  className="text-xs underline hover:text-white font-bold cursor-pointer"
                >
                  Ganti File
                </button>
              </div>

              {/* Customization Grid */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Pengaturan Identitas Paket Permainan</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 mb-1">
                      Judul Paket Permainan:
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Contoh: Kuis Biologi Sel Kelas 7"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 mb-1">
                      Mata Pelajaran:
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as MataPelajaran)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    >
                      {[
                        'IPA / Sains',
                        'Matematika',
                        'Bahasa Indonesia',
                        'Bahasa Inggris',
                        'IPS & Sejarah',
                        'Informatika & Logika',
                        'Pengetahuan Umum',
                      ].map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 mb-1">
                      Tingkat / Kelas Target:
                    </label>
                    <input
                      type="text"
                      value={customTargetClass}
                      onChange={(e) => setCustomTargetClass(e.target.value)}
                      placeholder="Contoh: Kelas 7 SMP atau Fase D"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-300 mb-1">
                      Tingkat Kesulitan:
                    </label>
                    <select
                      value={customDifficulty}
                      onChange={(e) => setCustomDifficulty(e.target.value as Difficulty)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Mudah">Mudah (Pemula)</option>
                      <option value="Sedang">Sedang (Standar)</option>
                      <option value="Tantangan">Tantangan (Olimpiade/Lanjutan)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    Deskripsi Singkat:
                  </label>
                  <input
                    type="text"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="Deskripsi singkat paket soal..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Questions List Preview & Editing */}
              {(() => {
                const mcCount = previewQuestions.filter((q) => q.type === 'multiple_choice').length;
                const tfCount = previewQuestions.filter((q) => q.type === 'true_false').length;
                const fillCount = previewQuestions.filter((q) => q.type === 'fill_blank').length;
                const matchCount = previewQuestions.filter((q) => q.type === 'matching').length;

                const filteredList = previewQuestions
                  .map((q, originalIdx) => ({ q, originalIdx }))
                  .filter(({ q }) => {
                    if (selectedTypeFilter === 'all') return true;
                    return q.type === selectedTypeFilter;
                  });

                return (
                  <div className="space-y-4">
                    {/* Header & Stats Banner */}
                    <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <h4 className="text-sm font-black text-white">
                            {previewQuestions.length} Butir Soal Berhasil Dipisahkan Otomatis
                          </h4>
                        </div>
                        <span className="text-[11px] text-indigo-300 font-bold bg-indigo-900/60 px-2.5 py-1 rounded-lg border border-indigo-500/30 self-start sm:self-auto">
                          Tipe Terdeteksi Mandiri
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Setiap pertanyaan telah dipisahkan menjadi satu kartu soal tersendiri. Anda dapat mengedit teks soal, mengganti opsi pilihan A-D, mengubah kunci jawaban, atau menambahkan soal baru sebelum disimpan.
                      </p>

                      {/* Filter by question type */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedTypeFilter('all')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedTypeFilter === 'all'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Semua ({previewQuestions.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTypeFilter('multiple_choice')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedTypeFilter === 'multiple_choice'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Pilihan Ganda ({mcCount})
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTypeFilter('true_false')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedTypeFilter === 'true_false'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Benar / Salah ({tfCount})
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTypeFilter('fill_blank')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedTypeFilter === 'fill_blank'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Isian Singkat ({fillCount})
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedTypeFilter('matching')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedTypeFilter === 'matching'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Menjodohkan ({matchCount})
                        </button>
                      </div>
                    </div>

                    {/* Questions Cards List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {filteredList.map(({ q, originalIdx }) => {
                        const isEditing = editingQuestionIdx === originalIdx;

                        return (
                          <div
                            key={q.id || originalIdx}
                            className={`rounded-2xl border transition-all ${
                              isEditing
                                ? 'bg-slate-900 border-indigo-500 shadow-xl ring-2 ring-indigo-500/20'
                                : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                            }`}
                          >
                            {/* Card Header / Summary */}
                            <div className="p-3.5 sm:p-4 flex items-start justify-between gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                                    #{originalIdx + 1}
                                  </span>

                                  {/* Type Badge with distinctive color */}
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                      q.type === 'multiple_choice'
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                        : q.type === 'true_false'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                        : q.type === 'fill_blank'
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    }`}
                                  >
                                    {q.type === 'multiple_choice'
                                      ? 'Pilihan Ganda'
                                      : q.type === 'true_false'
                                      ? 'Benar / Salah'
                                      : q.type === 'fill_blank'
                                      ? 'Isian Singkat'
                                      : 'Menjodohkan'}
                                  </span>

                                  <span className="text-xs font-bold text-emerald-400">
                                    Kunci: {q.correctAnswer || 'A'}
                                  </span>

                                  {q.imageUrl && (
                                    <span className="text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      📷 Gambar
                                    </span>
                                  )}

                                  {isEditing && (
                                    <span className="text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                                      Sedang Diedit
                                    </span>
                                  )}
                                </div>

                                {!isEditing && (
                                  <>
                                    <p className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                                      <FormattedText text={q.question || '(Belum ada teks soal)'} />
                                    </p>
                                    {q.type === 'multiple_choice' && q.options && q.options.length > 0 && (
                                      <div className="text-[11px] text-slate-400 line-clamp-1">
                                        Pilihan: {q.options.join(' • ')}
                                      </div>
                                    )}
                                    {q.type === 'matching' && q.matchingPairs && q.matchingPairs.length > 0 && (
                                      <div className="text-[11px] text-amber-300/80 line-clamp-1">
                                        Pasangan: {q.matchingPairs.map((p) => `${p.left} ↔ ${p.right}`).join(', ')}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    sounds.playClick();
                                    setEditingQuestionIdx(isEditing ? null : originalIdx);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    isEditing
                                      ? 'bg-indigo-600 text-white shadow-sm'
                                      : 'bg-slate-700/80 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30'
                                  }`}
                                  title="Edit teks soal, opsi jawaban, atau kunci"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{isEditing ? 'Tutup' : 'Edit Soal'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(originalIdx)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
                                  title="Hapus butir soal ini"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Inline Form Editor (Opened when clicked Edit) */}
                            {isEditing && (
                              <div className="p-4 sm:p-5 border-t border-slate-700/80 bg-slate-950/80 rounded-b-2xl space-y-4 animate-in fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Change Question Type */}
                                  <div>
                                    <label className="block text-xs font-extrabold text-slate-300 mb-1">
                                      Jenis / Tipe Soal:
                                    </label>
                                    <select
                                      value={q.type}
                                      onChange={(e) => {
                                        const newType = e.target.value as any;
                                        handleUpdateQuestion(originalIdx, {
                                          type: newType,
                                          correctAnswer:
                                            newType === 'true_false'
                                              ? 'Benar'
                                              : newType === 'multiple_choice'
                                              ? q.options?.[0] || 'A'
                                              : 'Jawaban Tepat',
                                        });
                                      }}
                                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 focus:outline-none"
                                    >
                                      <option value="multiple_choice">Pilihan Ganda (A, B, C, D)</option>
                                      <option value="true_false">Benar / Salah</option>
                                      <option value="fill_blank">Isian Singkat</option>
                                      <option value="matching">Menjodohkan</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-extrabold text-slate-300 mb-1">
                                      Kunci Jawaban Saat Ini:
                                    </label>
                                    <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 text-xs font-extrabold">
                                      {q.correctAnswer || '(Belum dipilih)'}
                                    </div>
                                  </div>
                                </div>

                                {/* Question Text with RichText Toolbar */}
                                <QuestionTextInput
                                  value={q.question}
                                  onChange={(val) =>
                                    handleUpdateQuestion(originalIdx, { question: val })
                                  }
                                  label="Teks Pertanyaan Soal *"
                                  placeholder="Tuliskan pertanyaan soal..."
                                />

                                {/* Upload Gambar Penjelas Soal */}
                                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80">
                                  <QuestionImageUploader
                                    imageUrl={q.imageUrl}
                                    onChange={(url) =>
                                      handleUpdateQuestion(originalIdx, { imageUrl: url })
                                    }
                                    label="Upload Gambar Penjelas Soal (Bagan, Teks Bacaan, Grafik, atau Foto Ilustrasi)"
                                  />
                                </div>

                                {/* Multiple Choice Options */}
                                {q.type === 'multiple_choice' && (
                                  <div className="space-y-2">
                                    <label className="block text-xs font-extrabold text-indigo-300">
                                      Pilihan Jawaban (Klik lingkaran untuk memilih kunci yang benar):
                                    </label>
                                    {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                                      const currentOpts = q.options && q.options.length >= 4 ? q.options : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'];
                                      const isCorrect = q.correctIndex === optIdx || q.correctAnswer === currentOpts[optIdx];

                                      return (
                                        <div
                                          key={letter}
                                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                            isCorrect
                                              ? 'bg-emerald-950/40 border-emerald-500/60'
                                              : 'bg-slate-900 border-slate-800'
                                          }`}
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              sounds.playClick();
                                              handleUpdateQuestion(originalIdx, {
                                                correctIndex: optIdx,
                                                correctAnswer: currentOpts[optIdx],
                                              });
                                            }}
                                            className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${
                                              isCorrect
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                            title="Jadikan sebagai kunci jawaban benar"
                                          >
                                            {letter}
                                          </button>

                                          <input
                                            type="text"
                                            value={currentOpts[optIdx] || ''}
                                            onChange={(e) => {
                                              const updated = [...currentOpts];
                                              updated[optIdx] = e.target.value;
                                              handleUpdateQuestion(originalIdx, {
                                                options: updated,
                                                correctAnswer: isCorrect ? e.target.value : q.correctAnswer,
                                              });
                                            }}
                                            placeholder={`Teks pilihan ${letter}...`}
                                            className="flex-1 bg-transparent text-xs text-white font-bold focus:outline-none"
                                          />

                                          {isCorrect && (
                                            <span className="text-[10px] font-black uppercase text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20">
                                              Kunci Benar
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* True / False Editor */}
                                {q.type === 'true_false' && (
                                  <div>
                                    <label className="block text-xs font-extrabold text-emerald-300 mb-1.5">
                                      Pilih Pernyataan Benar atau Salah:
                                    </label>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          sounds.playClick();
                                          handleUpdateQuestion(originalIdx, {
                                            isTrue: true,
                                            correctAnswer: 'Benar',
                                          });
                                        }}
                                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                          q.correctAnswer === 'Benar' || q.isTrue
                                            ? 'bg-emerald-600 text-white shadow-md'
                                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                                        }`}
                                      >
                                        ✓ Benar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          sounds.playClick();
                                          handleUpdateQuestion(originalIdx, {
                                            isTrue: false,
                                            correctAnswer: 'Salah',
                                          });
                                        }}
                                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                          q.correctAnswer === 'Salah' || q.isTrue === false
                                            ? 'bg-rose-600 text-white shadow-md'
                                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                                        }`}
                                      >
                                        ✕ Salah
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Fill Blank Editor */}
                                {q.type === 'fill_blank' && (
                                  <div>
                                    <label className="block text-xs font-extrabold text-purple-300 mb-1">
                                      Kunci Jawaban Isian Singkat:
                                    </label>
                                    <input
                                      type="text"
                                      value={q.correctAnswer || ''}
                                      onChange={(e) =>
                                        handleUpdateQuestion(originalIdx, {
                                          correctAnswer: e.target.value,
                                          acceptableAnswers: [e.target.value, e.target.value.toLowerCase()],
                                        })
                                      }
                                      placeholder="Contoh: Fotosintesis"
                                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:border-purple-500 focus:outline-none"
                                    />
                                  </div>
                                )}

                                {/* Matching Editor */}
                                {q.type === 'matching' && (
                                  <div className="space-y-2">
                                    <label className="block text-xs font-extrabold text-amber-300">
                                      Pasangan Konsep ↔ Jawaban:
                                    </label>
                                    {(q.matchingPairs || []).map((pair, pIdx) => (
                                      <div
                                        key={pair.id || pIdx}
                                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800"
                                      >
                                        <input
                                          type="text"
                                          value={pair.left}
                                          onChange={(e) => {
                                            const updated = [...(q.matchingPairs || [])];
                                            updated[pIdx].left = e.target.value;
                                            handleUpdateQuestion(originalIdx, { matchingPairs: updated });
                                          }}
                                          placeholder="Konsep kiri..."
                                          className="flex-1 bg-transparent text-xs text-white font-bold focus:outline-none"
                                        />
                                        <span className="text-amber-400 font-bold">↔</span>
                                        <input
                                          type="text"
                                          value={pair.right}
                                          onChange={(e) => {
                                            const updated = [...(q.matchingPairs || [])];
                                            updated[pIdx].right = e.target.value;
                                            handleUpdateQuestion(originalIdx, { matchingPairs: updated });
                                          }}
                                          placeholder="Definisi kanan..."
                                          className="flex-1 bg-transparent text-xs text-white font-bold focus:outline-none"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Explanation & Hint */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                  <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                      Pembahasan Materi:
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={q.explanation || ''}
                                      onChange={(e) =>
                                        handleUpdateQuestion(originalIdx, { explanation: e.target.value })
                                      }
                                      placeholder="Penjelasan jawaban..."
                                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                      Petunjuk / Hint:
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={q.hint || ''}
                                      onChange={(e) =>
                                        handleUpdateQuestion(originalIdx, { hint: e.target.value })
                                      }
                                      placeholder="Petunjuk singkat..."
                                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      sounds.playClick();
                                      setEditingQuestionIdx(null);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Selesai Edit Butir Ini</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {filteredList.length === 0 && (
                        <div className="p-6 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                          Tidak ada butir soal untuk filter yang dipilih.
                        </div>
                      )}
                    </div>

                    {/* Add question button */}
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleAddNewQuestion}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Butir Soal Baru</span>
                      </button>

                      <span className="text-xs text-slate-400">
                        Total {previewQuestions.length} butir soal siap disimpan ke Bank Soal
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>

          {parsedData && (
            <div className="flex items-center gap-2">
              {onOpenInEditor && (
                <button
                  type="button"
                  onClick={handleEditInStudio}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Buka di Studio Soal</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveToBankSoal}
                className="btn-3d px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan ke Bank Soal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
