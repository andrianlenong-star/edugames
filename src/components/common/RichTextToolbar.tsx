import React, { useEffect, useState } from 'react';
import { Bold, Italic, Underline, Eraser, Sparkles, Code, Eye } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface RichTextToolbarProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  editableRef?: React.RefObject<HTMLDivElement | null>;
  value: string;
  onChange: (newValue: string) => void;
  showPreview?: boolean;
  onTogglePreview?: () => void;
  isCodeMode?: boolean;
  onToggleCodeMode?: () => void;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  textareaRef,
  editableRef,
  value,
  onChange,
  showPreview,
  onTogglePreview,
  isCodeMode = false,
  onToggleCodeMode,
}) => {
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  // Track cursor position to update active style indicators
  const updateActiveStates = () => {
    // 1. Check contentEditable state if active
    if (!isCodeMode && editableRef?.current) {
      try {
        const isBold = document.queryCommandState('bold');
        const isItalic = document.queryCommandState('italic');
        const isUnderline = document.queryCommandState('underline');
        setActiveStyles({
          bold: isBold,
          italic: isItalic,
          underline: isUnderline,
        });
        return;
      } catch {
        // Fallback to text inspection below
      }
    }

    // 2. Check textarea position
    const textarea = textareaRef?.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const textBefore = value.substring(0, start);

    // Check if cursor is inside <b>...</b>
    const lastOpenB = textBefore.lastIndexOf('<b>');
    const lastCloseB = textBefore.lastIndexOf('</b>');
    const isBold = lastOpenB !== -1 && lastOpenB > lastCloseB;

    // Check if cursor is inside <i>...</i>
    const lastOpenI = textBefore.lastIndexOf('<i>');
    const lastCloseI = textBefore.lastIndexOf('</i>');
    const isItalic = lastOpenI !== -1 && lastOpenI > lastCloseI;

    // Check if cursor is inside <u>...</u>
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
    const handleSelection = () => updateActiveStates();
    document.addEventListener('selectionchange', handleSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [value, isCodeMode]);

  const applyFormat = (command: 'bold' | 'italic' | 'underline', tagOpen: string, tagClose: string) => {
    sounds.playClick();

    // Approach A: Visual contentEditable WYSIWYG mode
    if (!isCodeMode && editableRef?.current) {
      const el = editableRef.current;
      el.focus();
      document.execCommand(command, false);
      const updatedHtml = el.innerHTML;
      onChange(updatedHtml);
      updateActiveStates();
      return;
    }

    // Approach B: Textarea code mode
    const textarea = textareaRef?.current;
    if (!textarea) return;

    textarea.focus();
    let start = textarea.selectionStart ?? 0;
    let end = textarea.selectionEnd ?? 0;

    const openTagLen = tagOpen.length;
    const closeTagLen = tagClose.length;

    // Case 1: Text is highlighted
    if (start !== end) {
      const selectedText = value.substring(start, end);

      // Check if selectedText itself is wrapped in the tags
      if (
        selectedText.toLowerCase().startsWith(tagOpen.toLowerCase()) &&
        selectedText.toLowerCase().endsWith(tagClose.toLowerCase())
      ) {
        // Toggle OFF: Strip outer tags
        const stripped = selectedText.slice(openTagLen, -closeTagLen);
        const nextVal = value.substring(0, start) + stripped + value.substring(end);
        onChange(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start + stripped.length);
          updateActiveStates();
        }, 10);
        return;
      }

      // Check if text immediately around selection is wrapped in the tags
      const beforeSel = value.substring(Math.max(0, start - openTagLen), start);
      const afterSel = value.substring(end, Math.min(value.length, end + closeTagLen));

      if (
        beforeSel.toLowerCase() === tagOpen.toLowerCase() &&
        afterSel.toLowerCase() === tagClose.toLowerCase()
      ) {
        // Toggle OFF: Remove surrounding tags
        const nextVal =
          value.substring(0, start - openTagLen) +
          selectedText +
          value.substring(end + closeTagLen);
        onChange(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start - openTagLen, end - openTagLen);
          updateActiveStates();
        }, 10);
        return;
      }

      // Toggle ON: Wrap the selection
      const replacement = `${tagOpen}${selectedText}${tagClose}`;
      const nextVal = value.substring(0, start) + replacement + value.substring(end);
      onChange(nextVal);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + openTagLen, start + openTagLen + selectedText.length);
        updateActiveStates();
      }, 10);
      return;
    }

    // Case 2: Cursor with NO selection (start === end)
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
        word.toLowerCase().startsWith(tagOpen.toLowerCase()) &&
        word.toLowerCase().endsWith(tagClose.toLowerCase())
      ) {
        const stripped = word.slice(openTagLen, -closeTagLen);
        const nextVal = value.substring(0, wordStart) + stripped + value.substring(wordEnd);
        onChange(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(wordStart, wordStart + stripped.length);
          updateActiveStates();
        }, 10);
        return;
      }

      const replacement = `${tagOpen}${word}${tagClose}`;
      const nextVal = value.substring(0, wordStart) + replacement + value.substring(wordEnd);
      onChange(nextVal);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(wordStart + openTagLen, wordStart + openTagLen + word.length);
        updateActiveStates();
      }, 10);
      return;
    }

    // Case 3: Empty space: Insert empty tags and place cursor right in between
    const replacement = `${tagOpen}${tagClose}`;
    const nextVal = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTagLen, start + openTagLen);
      updateActiveStates();
    }, 10);
  };

  const removeAllFormatting = () => {
    sounds.playClick();

    if (!isCodeMode && editableRef?.current) {
      const el = editableRef.current;
      el.focus();
      document.execCommand('removeFormat', false);
      onChange(el.innerHTML);
      updateActiveStates();
      return;
    }

    const textarea = textareaRef?.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selected = value.substring(start, end);

    if (selected) {
      const cleaned = selected.replace(/<\/?([b-zB-Z0-9]+)>/gi, '').replace(/\*\*|__|\*/g, '');
      const nextVal = value.substring(0, start) + cleaned + value.substring(end);
      onChange(nextVal);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + cleaned.length);
        updateActiveStates();
      }, 10);
    } else {
      const cleaned = value.replace(/<\/?([b-zB-Z0-9]+)>/gi, '').replace(/\*\*|__|\*/g, '');
      onChange(cleaned);
      setTimeout(() => {
        textarea.focus();
        updateActiveStates();
      }, 10);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-900 border border-slate-700/80 rounded-xl mb-1 text-xs select-none shadow-sm">
      <div className="flex items-center gap-1.5">
        {/* Bold Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => applyFormat('bold', '<b>', '</b>')}
          className={`px-2.5 py-1.5 rounded-lg font-black border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group ${
            activeStyles.bold
              ? 'bg-amber-500/20 text-amber-300 border-amber-400 ring-1 ring-amber-400/50 shadow-amber-950/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-amber-400/70'
          }`}
          title="Tebalkan Teks (Bold) atau gunakan Ctrl+B"
        >
          <Bold className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="font-extrabold text-[11px] text-amber-300">Bold</span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">(Tebal)</span>
        </button>

        {/* Italic Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => applyFormat('italic', '<i>', '</i>')}
          className={`px-2.5 py-1.5 rounded-lg italic border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group ${
            activeStyles.italic
              ? 'bg-sky-500/20 text-sky-300 border-sky-400 ring-1 ring-sky-400/50 shadow-sky-950/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-sky-400/70'
          }`}
          title="Miringkan Teks (Italic) atau gunakan Ctrl+I"
        >
          <Italic className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-[11px] text-sky-300">Italic</span>
          <span className="text-[10px] text-slate-400 font-medium not-italic hidden sm:inline">(Miring)</span>
        </button>

        {/* Underline Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => applyFormat('underline', '<u>', '</u>')}
          className={`px-2.5 py-1.5 rounded-lg underline border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 group ${
            activeStyles.underline
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 ring-1 ring-emerald-400/50 shadow-emerald-950/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700 hover:border-emerald-400/70'
          }`}
          title="Garis Bawahi Teks (Underline) atau gunakan Ctrl+U"
        >
          <Underline className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-[11px] text-emerald-300">Underlined</span>
          <span className="text-[10px] text-slate-400 font-medium no-underline hidden sm:inline">(Garis Bawah)</span>
        </button>

        {/* Clear Format Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={removeAllFormatting}
          className="px-2 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-rose-300 border border-slate-700/70 flex items-center gap-1 transition-all cursor-pointer text-[10px] font-bold"
          title="Hapus format (tebal/miring/garis bawah) dari teks yang dipilih"
        >
          <Eraser className="w-3 h-3 text-rose-400" />
          <span className="hidden md:inline">Hapus Format</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Toggle between Visual WYSIWYG Mode & HTML Source Mode */}
        {onToggleCodeMode && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={onToggleCodeMode}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
              isCodeMode
                ? 'bg-indigo-900/60 text-indigo-300 border-indigo-500'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title={isCodeMode ? 'Beralih ke Editor Visual (Teks langsung tebal/miring)' : 'Beralih ke Editor Kode Tag HTML'}
          >
            {isCodeMode ? <Eye className="w-3 h-3 text-indigo-300" /> : <Code className="w-3 h-3 text-slate-400" />}
            <span>{isCodeMode ? 'Mode Visual' : 'Mode Tag'}</span>
          </button>
        )}

        <span className="hidden lg:inline text-[10px] text-slate-400 font-medium">
          <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px] border border-slate-700">Ctrl+B</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px] border border-slate-700">Ctrl+I</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px] border border-slate-700">Ctrl+U</kbd>
        </span>

        {onTogglePreview && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={onTogglePreview}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 ${
              showPreview
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-800 text-indigo-300 hover:text-white border-slate-700 hover:border-indigo-500/50'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{showPreview ? 'Sembunyikan Pratinjau' : 'Pratinjau Hasil'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
