import React from 'react';
import { Question } from '../../types';
import { Triangle, Diamond, Circle, Square, Check, X } from 'lucide-react';
import { FormattedText } from '../common/FormattedText';

interface Props {
  question: Question;
  selectedAnswer: string | null;
  isAnswerSubmitted: boolean;
  onSelectAnswer: (answer: string) => void;
  disabled: boolean;
}

const OPTION_STYLES = [
  {
    bg: 'bg-rose-500 hover:bg-rose-600 border-rose-600',
    selectedBg: 'bg-rose-600 ring-4 ring-rose-300',
    icon: Triangle,
    letter: 'A',
    key: '1',
  },
  {
    bg: 'bg-sky-500 hover:bg-sky-600 border-sky-600',
    selectedBg: 'bg-sky-600 ring-4 ring-sky-300',
    icon: Diamond,
    letter: 'B',
    key: '2',
  },
  {
    bg: 'bg-amber-500 hover:bg-amber-600 border-amber-600',
    selectedBg: 'bg-amber-600 ring-4 ring-amber-300',
    icon: Circle,
    letter: 'C',
    key: '3',
  },
  {
    bg: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600',
    selectedBg: 'bg-emerald-600 ring-4 ring-emerald-300',
    icon: Square,
    letter: 'D',
    key: '4',
  },
];

export const MultipleChoiceQuestion: React.FC<Props> = ({
  question,
  selectedAnswer,
  isAnswerSubmitted,
  onSelectAnswer,
  disabled,
}) => {
  const options = question.options || [];
  const isComplex = question.type === 'complex_multiple_choice';

  // Multi-select state for complex multiple choice
  const [selectedList, setSelectedList] = React.useState<string[]>(() => {
    if (selectedAnswer) {
      return selectedAnswer.split(', ').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  });

  const toggleComplexOption = (opt: string) => {
    if (disabled || isAnswerSubmitted) return;
    setSelectedList((prev) => {
      const next = prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt];
      return next;
    });
  };

  const submitComplex = () => {
    if (selectedList.length === 0) return;
    onSelectAnswer(selectedList.join(', '));
  };

  return (
    <div className="w-full space-y-3">
      {isComplex && (
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-extrabold text-purple-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>Pilihan Ganda Kompleks: Pilih satu atau lebih jawaban yang benar</span>
          </span>
          <span className="text-slate-400">
            Terpilih: <strong className="text-white">{selectedList.length}</strong> opsi
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full">
        {options.map((opt, idx) => {
          const style = OPTION_STYLES[idx % OPTION_STYLES.length];
          const Icon = style.icon;

          const isSelected = isComplex
            ? selectedList.includes(opt)
            : selectedAnswer === opt;

          // Correctness calculation
          let isTargetCorrect = false;
          if (isComplex) {
            if (question.correctIndices && question.correctIndices.length > 0) {
              isTargetCorrect = question.correctIndices.includes(idx);
            } else if (question.correctAnswer) {
              const expectedList = question.correctAnswer
                .split(',')
                .map((s) => s.trim().toLowerCase());
              isTargetCorrect = expectedList.includes(opt.trim().toLowerCase());
            } else if (question.correctIndex !== undefined) {
              isTargetCorrect = idx === question.correctIndex;
            }
          } else {
            isTargetCorrect =
              opt.trim().toLowerCase() === (question.correctAnswer || '').trim().toLowerCase() ||
              (question.correctIndex !== undefined && idx === question.correctIndex);
          }

          const isCorrect = isAnswerSubmitted && isTargetCorrect;
          const isWrong = isAnswerSubmitted && isSelected && !isTargetCorrect;

          let btnClass = `${style.bg} text-white shadow-lg shadow-black/20 border-b-4`;

          if (isAnswerSubmitted) {
            if (isCorrect) {
              btnClass = 'bg-emerald-500 border-emerald-700 text-white ring-4 ring-emerald-300 animate-pulse';
            } else if (isWrong) {
              btnClass = 'bg-rose-600 border-rose-800 text-white opacity-90';
            } else {
              btnClass = 'bg-slate-700 border-slate-800 text-slate-400 opacity-40';
            }
          } else if (isSelected) {
            btnClass = `${style.selectedBg} text-white border-b-2 translate-y-1 ring-4 ring-white/50`;
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (isComplex) {
                  toggleComplexOption(opt);
                } else {
                  onSelectAnswer(opt);
                }
              }}
              className={`btn-3d flex items-center p-4 md:p-5 rounded-2xl font-bold text-left transition-all duration-150 cursor-pointer disabled:cursor-default relative ${btnClass}`}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/25 shrink-0 mr-3.5 text-white">
                {isAnswerSubmitted && isCorrect ? (
                  <Check className="w-6 h-6 stroke-[3]" />
                ) : isAnswerSubmitted && isWrong ? (
                  <X className="w-6 h-6 stroke-[3]" />
                ) : isComplex ? (
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-white text-slate-900 border-white' : 'border-white/60 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                ) : (
                  <Icon className="w-5 h-5 fill-current" />
                )}
              </div>

              <div className="flex-1 pr-2">
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-75 block mb-0.5">
                  Pilihan {style.letter}
                </span>
                <span className="text-base md:text-lg leading-snug line-clamp-3">
                  <FormattedText text={opt} />
                </span>
              </div>

              <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 rounded bg-black/20 text-white/80 shrink-0">
                [{style.key}]
              </span>
            </button>
          );
        })}
      </div>

      {isComplex && !isAnswerSubmitted && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={disabled || selectedList.length === 0}
            onClick={submitComplex}
            className="btn-3d px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer disabled:opacity-40"
          >
            <Check className="w-5 h-5" />
            <span>Kirim Jawaban ({selectedList.length} Dipilih)</span>
          </button>
        </div>
      )}
    </div>
  );
};
