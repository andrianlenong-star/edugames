import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { QuizSet } from '../../types';
import { sounds } from '../../utils/audio';

interface RenameQuizModalProps {
  quiz: QuizSet | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (quizId: string, newTitle: string) => void;
}

export const RenameQuizModal: React.FC<RenameQuizModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onRename,
}) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quiz && isOpen) {
      setTitle(quiz.title || '');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [quiz, isOpen]);

  if (!isOpen || !quiz) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Nama judul permainan tidak boleh kosong.');
      sounds.playError();
      return;
    }

    sounds.playWin();
    onRename(quiz.id, trimmed);
    onClose();
  };

  const suggestions = [
    `Kuis ${quiz.category}: ${quiz.targetClass || quiz.grade}`,
    `Tantangan ${quiz.title.replace(/^Paket Soal:\s*|^Kuis:\s*/i, '')}`,
    `Latihan Ujian: ${quiz.title.replace(/^Paket Soal:\s*|^Kuis:\s*/i, '')}`,
    `Game Cerdas Cermat - ${quiz.category}`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-sky-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Ubah Nama Judul Permainan</span>
              </h2>
              <p className="text-xs text-slate-400">
                Ubah judul paket kuis agar mudah dikenali siswa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Current Info */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-slate-300">{quiz.category}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{quiz.targetClass || quiz.grade}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full font-extrabold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px]">
              {quiz.questions.length} Butir Soal
            </span>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-200">
              Judul Permainan Baru:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ketik nama judul permainan baru..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 text-white font-extrabold text-sm sm:text-base outline-none transition-colors shadow-inner"
            />
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 pt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Saran Judul Cepat:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setTitle(sug);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-left truncate max-w-full cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-3d px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-indigo-950/40 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Nama Judul</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
