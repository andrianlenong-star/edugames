import React from 'react';
import { Question, QuestionType } from '../../types';
import { QuestionTextInput } from '../common/QuestionTextInput';
import { QuestionImageUploader } from '../common/QuestionImageUploader';
import { FormattedText } from '../common/FormattedText';
import { sounds } from '../../utils/audio';
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  CheckCircle2,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface Props {
  question: Question;
  index: number;
  totalQuestions: number;
  onUpdate: (patch: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onPrevQuestion?: () => void;
  onNextQuestion?: () => void;
  onAddNewQuestion?: () => void;
}

export const QuestionSingleEditor: React.FC<Props> = ({
  question: q,
  index: idx,
  totalQuestions,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onPrevQuestion,
  onNextQuestion,
  onAddNewQuestion,
}) => {
  return (
    <div className="rounded-2xl border-2 border-indigo-500/50 bg-slate-900 shadow-xl overflow-hidden space-y-4 p-5 sm:p-6 animate-in fade-in duration-150">
      {/* Question Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
            #{idx + 1}
          </span>
          <div>
            <h4 className="text-sm font-black text-white">
              Butir Soal Ke-{idx + 1} dari {totalQuestions}
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">
              Ubah teks soal, format, pilihan jawaban, kunci, atau gambar penjelas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Format Selector */}
          <select
            value={q.type}
            onChange={(e) => {
              const newType = e.target.value as QuestionType;
              let newCorrect = q.correctAnswer;
              if (newType === 'true_false') newCorrect = 'Benar';
              if (newType === 'multiple_choice' && q.options) {
                newCorrect = q.options[0] || '';
              }
              onUpdate({ type: newType, correctAnswer: newCorrect });
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-indigo-500/40 text-xs font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="multiple_choice">Pilihan Ganda (PG)</option>
            <option value="true_false">Benar / Salah (B/S)</option>
            <option value="fill_blank">Isian Singkat (Isian)</option>
            <option value="matching">Menjodohkan (Jodoh)</option>
          </select>

          {/* Reordering & Action buttons */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
              title="Pindah Naik"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
              title="Pindah Turun"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onDuplicate}
              className="p-1.5 rounded text-slate-400 hover:text-indigo-400 cursor-pointer"
              title="Duplikat Soal Ini"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded text-rose-400 hover:text-rose-200 cursor-pointer"
              title="Hapus Butir Soal Ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 1. Teks Pertanyaan (With Bold, Italic, Underlined Toolbar) */}
      <QuestionTextInput
        value={q.question}
        onChange={(val) => onUpdate({ question: val })}
        label={`Teks Pertanyaan Soal #${idx + 1} *`}
        placeholder="Tuliskan teks pertanyaan soal di sini... (Gunakan tombol Tebal, Miring, atau Garis Bawah di atas)"
      />

      {/* 2. Upload Gambar Penjelas Soal */}
      <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/80">
        <QuestionImageUploader
          imageUrl={q.imageUrl}
          onChange={(url) => onUpdate({ imageUrl: url })}
          label="Upload Gambar Penjelas Soal (Bagan, Teks Bacaan, Grafik, atau Foto Ilustrasi)"
        />
      </div>

      {/* 3. Specific Format Editor */}
      {/* MULTIPLE CHOICE */}
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

        const handleSetCorrectOption = (optIdx: number) => {
          const targetOpt = opts[optIdx] || '';
          onUpdate({
            correctIndex: optIdx,
            correctAnswer: targetOpt,
          });
          sounds.playClick();
        };

        const handleUpdateOptionText = (optIdx: number, val: string) => {
          const newOpts = [...opts];
          newOpts[optIdx] = val;
          const isThisCorrect = effectiveCorrectIdx === optIdx;
          const patch: Partial<Question> = { options: newOpts };
          if (isThisCorrect) {
            patch.correctAnswer = val;
            patch.correctIndex = optIdx;
          }
          onUpdate(patch);
        };

        const handleAddOption = () => {
          if (opts.length >= 5) return;
          const nextLetter = letters[opts.length] || 'X';
          onUpdate({ options: [...opts, `Pilihan ${nextLetter}`] });
          sounds.playClick();
        };

        const handleRemoveOption = (optIdx: number) => {
          if (opts.length <= 2) return;
          const newOpts = opts.filter((_, i) => i !== optIdx);
          let nextCorrect = effectiveCorrectIdx;
          if (optIdx === effectiveCorrectIdx) {
            nextCorrect = Math.max(0, optIdx - 1);
          } else if (optIdx < effectiveCorrectIdx) {
            nextCorrect = effectiveCorrectIdx - 1;
          }
          onUpdate({
            options: newOpts,
            correctIndex: nextCorrect,
            correctAnswer: newOpts[nextCorrect] || '',
          });
          sounds.playClick();
        };

        return (
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
              <div>
                <label className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Kunci Jawaban Benar (Pilihan Ganda):</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik radio, huruf, atau tombol "Jadikan Kunci" pada opsi yang benar di bawah.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">Pilih Kunci:</span>
                <select
                  value={effectiveCorrectIdx}
                  onChange={(e) => handleSetCorrectOption(parseInt(e.target.value, 10))}
                  className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-black text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  {opts.map((opt, oIdx) => (
                    <option key={oIdx} value={oIdx}>
                      Opsi {letters[oIdx]}: {opt.slice(0, 32)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Option Selector Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Pilihan Cepat Kunci:</span>
              {opts.map((_, oIdx) => {
                const isSelected = effectiveCorrectIdx === oIdx;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSetCorrectOption(oIdx)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300 scale-105'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    <span>● Opsi {letters[oIdx]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                );
              })}

              {opts.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-xl border border-indigo-500/30 hover:border-indigo-400 cursor-pointer ml-auto"
                >
                  + Tambah Opsi ({letters[opts.length]})
                </button>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-2.5 pt-1">
              {opts.map((opt, oIdx) => {
                const isCorrect = effectiveCorrectIdx === oIdx;
                const letter = letters[oIdx] || String.fromCharCode(65 + oIdx);

                return (
                  <div
                    key={oIdx}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-2 transition-all ${
                      isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-opt-${idx}`}
                      checked={isCorrect}
                      onChange={() => handleSetCorrectOption(oIdx)}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer ml-1"
                    />

                    <button
                      type="button"
                      onClick={() => handleSetCorrectOption(oIdx)}
                      className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-90 ${
                        isCorrect
                          ? 'bg-emerald-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      title={`Klik untuk jadikan Opsi ${letter} sebagai KUNCI JAWABAN BENAR`}
                    >
                      {letter}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleUpdateOptionText(oIdx, e.target.value)}
                        placeholder={`Teks pilihan jawaban ${letter}... (Mendukung Bold/Italic/Underline)`}
                        className="w-full bg-transparent text-xs sm:text-sm text-white font-semibold focus:outline-none"
                      />
                      {(opt.includes('<') || opt.includes('*') || opt.includes('_')) && (
                        <div className="text-[11px] text-slate-300 font-medium pt-0.5 border-t border-slate-700/50 flex items-center gap-1.5">
                          <span className="text-[9px] text-indigo-400 font-bold uppercase shrink-0">Tampilan Siswa:</span>
                          <span className="truncate"><FormattedText text={opt} /></span>
                        </div>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const isBold = opt.toLowerCase().startsWith('<b>') && opt.toLowerCase().endsWith('</b>');
                          handleUpdateOptionText(oIdx, isBold ? opt.slice(3, -4) : `<b>${opt}</b>`);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-[10px] border border-slate-700 cursor-pointer"
                        title="Tebalkan (Bold) opsi ini"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const isItalic = opt.toLowerCase().startsWith('<i>') && opt.toLowerCase().endsWith('</i>');
                          handleUpdateOptionText(oIdx, isItalic ? opt.slice(3, -4) : `<i>${opt}</i>`);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 italic font-bold text-[10px] border border-slate-700 cursor-pointer"
                        title="Miringkan (Italic) opsi ini"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const isUnderline = opt.toLowerCase().startsWith('<u>') && opt.toLowerCase().endsWith('</u>');
                          handleUpdateOptionText(oIdx, isUnderline ? opt.slice(3, -4) : `<u>${opt}</u>`);
                        }}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 underline font-bold text-[10px] border border-slate-700 cursor-pointer"
                        title="Garis bawahi (Underline) opsi ini"
                      >
                        U
                      </button>
                    </div>

                    {isCorrect ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40 flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>KUNCI BENAR</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(oIdx)}
                        className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-slate-400 hover:text-emerald-300 border border-slate-700 text-[11px] font-bold cursor-pointer shrink-0 transition-colors"
                      >
                        Jadikan Kunci
                      </button>
                    )}

                    {opts.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(oIdx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer shrink-0"
                        title="Hapus opsi ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* TRUE / FALSE */}
      {q.type === 'true_false' && (() => {
        const isCurrentTrue = q.isTrue !== undefined ? q.isTrue : q.correctAnswer === 'Benar';

        return (
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <label className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pilih Kunci Jawaban Pernyataan Ini:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onUpdate({
                    isTrue: true,
                    correctAnswer: 'Benar',
                  });
                  sounds.playClick();
                }}
                className={`p-3.5 rounded-2xl border-2 font-black text-sm flex items-center justify-between cursor-pointer transition-all ${
                  isCurrentTrue
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-4 ring-emerald-500/20 shadow-lg'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isCurrentTrue ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-slate-600'
                    }`}
                  >
                    {isCurrentTrue && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span>BENAR (True)</span>
                </div>
                {isCurrentTrue && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold uppercase">
                    Kunci Benar
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdate({
                    isTrue: false,
                    correctAnswer: 'Salah',
                  });
                  sounds.playClick();
                }}
                className={`p-3.5 rounded-2xl border-2 font-black text-sm flex items-center justify-between cursor-pointer transition-all ${
                  !isCurrentTrue
                    ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-4 ring-rose-500/20 shadow-lg'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      !isCurrentTrue ? 'border-rose-400 bg-rose-500 text-white' : 'border-slate-600'
                    }`}
                  >
                    {!isCurrentTrue && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span>SALAH (False)</span>
                </div>
                {!isCurrentTrue && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold uppercase">
                    Kunci Benar
                  </span>
                )}
              </button>
            </div>
          </div>
        );
      })()}

      {/* FILL IN THE BLANK */}
      {q.type === 'fill_blank' && (
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
          <div>
            <label className="block text-xs font-bold text-emerald-400 mb-1">
              Kunci Jawaban Isian Tepat *
            </label>
            <input
              type="text"
              value={q.correctAnswer}
              onChange={(e) => {
                const val = e.target.value;
                const acceptable = q.acceptableAnswers || [];
                const updatedAcc = acceptable.includes(val) ? acceptable : [val, ...acceptable];
                onUpdate({
                  correctAnswer: val,
                  acceptableAnswers: updatedAcc,
                });
              }}
              placeholder="Jawaban kata atau frasa yang benar..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-black focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Variasi Jawaban Tambahan yang Diterima (Dipisahkan tanda koma)
            </label>
            <input
              type="text"
              value={(q.acceptableAnswers || []).join(', ')}
              onChange={(e) => {
                const parts = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                onUpdate({ acceptableAnswers: parts });
              }}
              placeholder="Contoh: foto sintesis, proses fotosintesis, fotosintesa..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* MATCHING PAIRS */}
      {q.type === 'matching' && (
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-cyan-300">
              Pasangan Konsep (Kiri ➔ Kanan):
            </label>
            <button
              type="button"
              onClick={() => {
                const currentPairs = q.matchingPairs || [];
                const newPair = {
                  id: `mp-${Date.now()}-${currentPairs.length + 1}`,
                  left: `Konsep ${currentPairs.length + 1}`,
                  right: `Pasangan ${currentPairs.length + 1}`,
                };
                onUpdate({ matchingPairs: [...currentPairs, newPair] });
              }}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
            >
              + Tambah Pasangan
            </button>
          </div>

          <div className="space-y-2">
            {(q.matchingPairs || []).map((pair, pIdx) => (
              <div
                key={pair.id || pIdx}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700"
              >
                <input
                  type="text"
                  value={pair.left}
                  onChange={(e) => {
                    const pairs = [...(q.matchingPairs || [])];
                    pairs[pIdx].left = e.target.value;
                    onUpdate({ matchingPairs: pairs });
                  }}
                  placeholder="Pernyataan Kiri"
                  className="flex-1 bg-transparent text-xs text-white font-bold focus:outline-none"
                />
                <span className="text-cyan-400 font-black">➔</span>
                <input
                  type="text"
                  value={pair.right}
                  onChange={(e) => {
                    const pairs = [...(q.matchingPairs || [])];
                    pairs[pIdx].right = e.target.value;
                    onUpdate({ matchingPairs: pairs });
                  }}
                  placeholder="Pasangan Kanan"
                  className="flex-1 bg-transparent text-xs text-white font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const pairs = (q.matchingPairs || []).filter((_, i) => i !== pIdx);
                    onUpdate({ matchingPairs: pairs });
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                  title="Hapus pasangan ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Explanation and Hint */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-xs font-bold text-indigo-300 mb-1">
            Pembahasan / Penjelasan Materi
          </label>
          <textarea
            rows={2}
            value={q.explanation}
            onChange={(e) => onUpdate({ explanation: e.target.value })}
            placeholder="Jelaskan alasan mengapa jawaban tersebut benar..."
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-amber-300 mb-1">
            Petunjuk / Rumus Bantuan
          </label>
          <textarea
            rows={2}
            value={q.hint}
            onChange={(e) => onUpdate({ hint: e.target.value })}
            placeholder="Petunjuk singkat jika siswa kesulitan..."
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* 5. Bottom Navigation Bar for Per-Soal Editor */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={!onPrevQuestion || idx === 0}
          onClick={onPrevQuestion}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Soal Sebelumnya</span>
        </button>

        <span className="text-xs font-extrabold text-slate-400">
          Soal #{idx + 1} dari {totalQuestions}
        </span>

        {idx < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={onNextQuestion}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <span>Soal Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onAddNewQuestion}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Soal Baru</span>
          </button>
        )}
      </div>
    </div>
  );
};
