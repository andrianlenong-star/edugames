import React, { useRef, useState, useEffect } from 'react';
import { Bold, Italic, Underline, Eraser, Eye, Sparkles } from 'lucide-react';
import { FormattedText } from './FormattedText';
import { sounds } from '../../utils/audio';

interface Props {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export const QuestionTextInput: React.FC<Props> = ({
  value = '',
  onChange,
  label = 'Teks Pertanyaan *',
  placeholder = 'Tuliskan teks pertanyaan soal di sini... (Gunakan tombol Bold, Italic, Underline di bawah atau Ctrl+B / Ctrl+I / Ctrl+U)',
  rows = 3,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  // Check active styles at current selection/cursor position
  const checkActiveStyles = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const textBefore = value.substring(0, start);

    const lastOpenB = textBefore.lastIndexOf('<b>');
    const lastCloseB = textBefore.lastIndexOf('</b>');
    const isBold = lastOpenB !== -1 && lastOpenB > lastCloseB;

    const lastOpenI = textBefore.lastIndexOf('<i>');
    const lastCloseI = textBefore.lastIndexOf('</i>');
    const isItalic = lastOpenI !== -1 && lastOpenI > lastCloseI;

    const lastOpenU = textBefore.lastIndexOf('<u>');
    const lastCloseU = textBefore.lastIndexOf('</u>');
    const isUnderline = lastOpenU !== -1 && lastOpenU > lastCloseU;

    setActiveStyles({
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
    });
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelect = () => checkActiveStyles();
    textarea.addEventListener('select', handleSelect);
    textarea.addEventListener('keyup', handleSelect);
    textarea.addEventListener('click', handleSelect);

    return () => {
      textarea.removeEventListener('select', handleSelect);
      textarea.removeEventListener('keyup', handleSelect);
      textarea.removeEventListener('click', handleSelect);
    };
  }, [value]);

  const applyFormat = (tag: 'b' | 'i' | 'u') => {
    sounds.playClick();
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;

    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;
    const openTagLen = openTag.length;
    const closeTagLen = closeTag.length;

    // Case 1: Text is selected
    if (start !== end) {
      const selected = value.substring(start, end);

      // Check if selected itself starts with open tag and ends with close tag
      if (
        selected.toLowerCase().startsWith(openTag.toLowerCase()) &&
        selected.toLowerCase().endsWith(closeTag.toLowerCase())
      ) {
        // Toggle OFF: Strip outer tags
        const stripped = selected.slice(openTagLen, -closeTagLen);
        const nextVal = value.substring(0, start) + stripped + value.substring(end);
        onChange(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start + stripped.length);
          checkActiveStyles();
        }, 15);
        return;
      }

      // Check if text immediately surrounding selection is wrapped in the tags
      const beforeSel = value.substring(Math.max(0, start - openTagLen), start);
      const afterSel = value.substring(end, Math.min(value.length, end + closeTagLen));

      if (
        beforeSel.toLowerCase() === openTag.toLowerCase() &&
        afterSel.toLowerCase() === closeTag.toLowerCase()
      ) {
        // Toggle OFF: Remove outer surrounding tags
        const nextVal =
          value.substring(0, start - openTagLen) +
          selected +
          value.substring(end + closeTagLen);
        onChange(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start - openTagLen, end - openTagLen);
          checkActiveStyles();
        }, 15);
        return;
      }

      // Toggle ON: Wrap selected text
      const replacement = `${openTag}${selected}${closeTag}`;
      const nextVal = value.substring(0, start) + replacement + value.substring(end);
      onChange(nextVal);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + openTagLen, start + openTagLen + selected.length);
        checkActiveStyles();
      }, 15);
      return;
    }

    // Case 2: Cursor without selection (start === end)
    // Find word boundaries around cursor
    let wordStart = start;
    let wordEnd = end;
    while (wordStart > 0 && /\S/.test(value[wordStart - 1])) {
      wordStart--;
    }
    while (wordEnd < value.length && /\S/.test(value[wordEnd])) {
      wordEnd++;
    }

    if (wordStart < wordEnd) {
      const word = value.substring(wordStart, wordEnd);
      if (
        word.toLowerCase().startsWith(openTag.toLowerCase()) &&
        word.toLowerCase().endsWith(closeTag.toLowerCase())
      ) {
        // Toggle OFF
        const stripped = word.slice(openTagLen, -closeTagLen);
        const nextVal = value.substring(0, wordStart) + stripped + value.substring(wordEnd);
        onChange(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(wordStart, wordStart + stripped.length);
          checkActiveStyles();
        }, 15);
        return;
      }

      // Toggle ON
      const replacement = `${openTag}${word}${closeTag}`;
      const nextVal = value.substring(0, wordStart) + replacement + value.substring(wordEnd);
      onChange(nextVal);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(wordStart + openTagLen, wordStart + openTagLen + word.length);
        checkActiveStyles();
      }, 15);
      return;
    }

    // Case 3: Empty space: Insert empty tags and place cursor right in between
    const replacement = `${openTag}${closeTag}`;
    const nextVal = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTagLen, start + openTagLen);
      checkActiveStyles();
    }, 15);
  };

  const removeAllFormatting = () => {
    sounds.playClick();
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = value.substring(start, end);

    if (selected) {
      const cleaned = selected
        .replace(/<\/?([b-zB-Z0-9]+)>/gi, '')
        .replace(/\*\*|__|\*/g, '');
      const nextVal = value.substring(0, start) + cleaned + value.substring(end);
      onChange(nextVal);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + cleaned.length);
        checkActiveStyles();
      }, 15);
    } else {
      const cleaned = value
        .replace(/<\/?([b-zB-Z0-9]+)>/gi, '')
        .replace(/\*\*|__|\*/g, '');
      onChange(cleaned);
      setTimeout(() => {
        textarea.focus();
        checkActiveStyles();
      }, 15);
    }
  };

  const insertDots = () => {
    sounds.playClick();
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const dots = ' . . . . ';
    const nextVal = value.substring(0, start) + dots + value.substring(end);
    onChange(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + dots.length, start + dots.length);
    }, 15);
  };

  // Keyboard shortcut listener for Ctrl+B, Ctrl+I, Ctrl+U
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        applyFormat('b');
      } else if (key === 'i') {
        e.preventDefault();
        applyFormat('i');
      } else if (key === 'u') {
        e.preventDefault();
        applyFormat('u');
      }
    }
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-200">
          {label}
        </label>
        <span className="text-[11px] text-slate-400 font-medium">
          Shortcut: <b className="text-amber-300 font-black">Ctrl+B</b> (Bold), <i className="text-sky-300 font-semibold">Ctrl+I</i> (Italic), <u className="text-emerald-300 underline font-bold">Ctrl+U</u> (Underline)
        </span>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs select-none shadow-sm">
        <div className="flex items-center gap-1.5">
          {/* Bold Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('b')}
            className={`px-3 py-1.5 rounded-lg font-black border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group ${
              activeStyles.bold
                ? 'bg-amber-500/20 text-amber-300 border-amber-400 ring-1 ring-amber-400/50 shadow-amber-950/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-amber-400/70'
            }`}
            title="Tebalkan Teks (Bold) atau gunakan Ctrl+B"
          >
            <Bold className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-extrabold text-xs text-amber-300">Bold</span>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">(Tebal)</span>
          </button>

          {/* Italic Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('i')}
            className={`px-3 py-1.5 rounded-lg italic border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group ${
              activeStyles.italic
                ? 'bg-sky-500/20 text-sky-300 border-sky-400 ring-1 ring-sky-400/50 shadow-sky-950/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-sky-400/70'
            }`}
            title="Miringkan Teks (Italic) atau gunakan Ctrl+I"
          >
            <Italic className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-sky-300">Italic</span>
            <span className="text-[10px] text-slate-400 font-medium not-italic hidden sm:inline">(Miring)</span>
          </button>

          {/* Underline Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('u')}
            className={`px-3 py-1.5 rounded-lg underline border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group ${
              activeStyles.underline
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 ring-1 ring-emerald-400/50 shadow-emerald-950/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-emerald-400/70'
            }`}
            title="Garis Bawahi Teks (Underline) atau gunakan Ctrl+U"
          >
            <Underline className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs text-emerald-300">Underline</span>
            <span className="text-[10px] text-slate-400 font-medium no-underline hidden sm:inline">(Garis Bawah)</span>
          </button>

          {/* Quick Insert Dots for Fill-in questions */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertDots}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold cursor-pointer transition-all hidden md:flex items-center gap-1"
            title="Sisipkan titik-titik isian . . . ."
          >
            <span>. . . .</span>
            <span className="text-[10px] text-slate-400 font-sans">(Isian)</span>
          </button>

          {/* Clear Formatting Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={removeAllFormatting}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 flex items-center gap-1 transition-all cursor-pointer"
            title="Hapus format (Bold/Italic/Underline) dari teks yang dipilih atau seluruh teks"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold hidden sm:inline">Hapus Format</span>
          </button>
        </div>

        {/* Toggle Live Preview */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowPreview(!showPreview)}
          className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
            showPreview
              ? 'bg-indigo-600/30 text-indigo-300 border-indigo-400/60'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title="Tampilkan / sembunyikan pratinjau tampilan siswa"
        >
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span>Pratinjau {showPreview ? 'Aktif' : 'Sembunyi'}</span>
        </button>
      </div>

      {/* Direct Textarea Editor */}
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-400 transition-colors resize-y min-h-[90px] placeholder:text-slate-500 leading-relaxed font-sans"
      />

      {/* Real-time Visual Output Preview */}
      {showPreview && (
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/40 shadow-inner space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pratinjau Tampilan Siswa:</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Format tebal (<b className="text-amber-300">kuning</b>), miring (<i className="text-sky-300">biru</i>), dan garis bawah (<u className="text-emerald-300">hijau</u>)
            </span>
          </div>
          <div className="text-sm text-slate-200 font-medium leading-relaxed pt-0.5 break-words">
            {value && value.trim() ? (
              <FormattedText text={value} />
            ) : (
              <span className="text-slate-500 italic font-normal text-xs">
                (Tulis teks soal lalu klik tombol Bold, Italic, atau Underlined di atas untuk melihat hasilnya secara langsung di sini)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
