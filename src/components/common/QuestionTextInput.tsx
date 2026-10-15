import React, { useRef, useState, useEffect } from 'react';
import { RichTextToolbar } from './RichTextToolbar';
import { FormattedText } from './FormattedText';

interface Props {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

export const QuestionTextInput: React.FC<Props> = ({
  value,
  onChange,
  label = 'Teks Pertanyaan *',
  placeholder = 'Tuliskan teks pertanyaan soal di sini...',
  rows = 3,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editableRef = useRef<HTMLDivElement | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isCodeMode, setIsCodeMode] = useState(false);

  // Synchronize value to contentEditable div when value changes externally
  useEffect(() => {
    if (editableRef.current && !isCodeMode) {
      if (editableRef.current.innerHTML !== value) {
        // Only update if innerHTML doesn't match to avoid resetting cursor while typing
        const currentInner = editableRef.current.innerHTML;
        // Normalize comparison
        if (currentInner.trim() !== value.trim()) {
          editableRef.current.innerHTML = value || '';
        }
      }
    }
  }, [value, isCodeMode]);

  // Handle contentEditable user input
  const handleEditableInput = () => {
    if (!editableRef.current) return;
    let html = editableRef.current.innerHTML;

    // Clean up excessive browser generated tags, normalize strong/em/b/i
    html = html
      .replace(/<strong>/gi, '<b>')
      .replace(/<\/strong>/gi, '</b>')
      .replace(/<em>/gi, '<i>')
      .replace(/<\/em>/gi, '</i>')
      .replace(/<span style="font-weight:\s*bold[^"]*">(.*?)<\/span>/gi, '<b>$1</b>')
      .replace(/<span style="font-style:\s*italic[^"]*">(.*?)<\/span>/gi, '<i>$1</i>')
      .replace(/<span style="text-decoration:\s*underline[^"]*">(.*?)<\/span>/gi, '<u>$1</u>')
      .replace(/<div><br><\/div>/gi, '\n')
      .replace(/<div>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<br>/gi, '\n');

    // If completely empty or just <br>, reset to empty string
    if (html === '<br>' || html === '\n') html = '';

    onChange(html);
  };

  // Keyboard shortcut listener for Ctrl+B, Ctrl+I, Ctrl+U in textarea mode
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const key = e.key.toLowerCase();

    if (key === 'b' || key === 'i' || key === 'u') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const tag = key === 'b' ? 'b' : key === 'i' ? 'i' : 'u';
      const openTag = `<${tag}>`;
      const closeTag = `</${tag}>`;
      const openTagLen = openTag.length;
      const closeTagLen = closeTag.length;

      let start = textarea.selectionStart ?? 0;
      let end = textarea.selectionEnd ?? 0;

      // 1. Text is selected
      if (start !== end) {
        const selected = value.substring(start, end);

        // Check if selected is wrapped
        if (
          selected.toLowerCase().startsWith(openTag.toLowerCase()) &&
          selected.toLowerCase().endsWith(closeTag.toLowerCase())
        ) {
          const stripped = selected.slice(openTagLen, -closeTagLen);
          const nextVal = value.substring(0, start) + stripped + value.substring(end);
          onChange(nextVal);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start, start + stripped.length);
          }, 10);
          return;
        }

        // Toggle on: Wrap selection
        const replacement = `${openTag}${selected}${closeTag}`;
        const nextVal = value.substring(0, start) + replacement + value.substring(end);
        onChange(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + openTagLen, start + openTagLen + selected.length);
        }, 10);
        return;
      }

      // 2. Cursor without selection
      let ws = start;
      let we = end;
      while (ws > 0 && /\S/.test(value[ws - 1])) ws--;
      while (we < value.length && /\S/.test(value[we])) we++;

      if (ws < we) {
        const word = value.substring(ws, we);
        const replacement = `${openTag}${word}${closeTag}`;
        const nextVal = value.substring(0, ws) + replacement + value.substring(we);
        onChange(nextVal);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(ws + openTagLen, ws + openTagLen + word.length);
        }, 10);
        return;
      }

      // 3. Empty cursor: Insert open and close tag
      const replacement = `${openTag}${closeTag}`;
      const nextVal = value.substring(0, start) + replacement + value.substring(end);
      onChange(nextVal);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + openTagLen, start + openTagLen);
      }, 10);
    }
  };

  const isEmpty = !value || value.trim() === '';

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-300">
          {label}
        </label>
        <span className="text-[10px] text-slate-400 font-medium">
          Mendukung <b className="text-amber-300 font-black">Bold (Ctrl+B)</b>, <i className="text-sky-300 font-semibold">Italic (Ctrl+I)</i>, &amp; <u className="text-emerald-300 underline font-bold">Underlined (Ctrl+U)</u>
        </span>
      </div>

      <RichTextToolbar
        textareaRef={textareaRef}
        editableRef={editableRef}
        value={value}
        onChange={onChange}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        isCodeMode={isCodeMode}
        onToggleCodeMode={() => setIsCodeMode(!isCodeMode)}
      />

      {/* Editor Box */}
      <div className="relative">
        {!isCodeMode ? (
          /* Visual WYSIWYG Editable Area */
          <div className="relative">
            <div
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditableInput}
              onBlur={handleEditableInput}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-400 font-medium transition-colors min-h-[82px] max-h-[220px] overflow-y-auto break-words whitespace-pre-wrap outline-none leading-relaxed [&_b]:font-black [&_b]:text-amber-300 [&_strong]:font-black [&_strong]:text-amber-300 [&_i]:italic [&_i]:text-sky-300 [&_em]:italic [&_em]:text-sky-300 [&_u]:underline [&_u]:decoration-2 [&_u]:decoration-emerald-400 [&_u]:text-emerald-300"
            />
            {isEmpty && (
              <div
                onClick={() => editableRef.current?.focus()}
                className="absolute top-2.5 left-3.5 text-xs sm:text-sm text-slate-500 font-medium pointer-events-none select-none"
              >
                {placeholder}
              </div>
            )}
          </div>
        ) : (
          /* Raw HTML / Tag Textarea Mode */
          <textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-400 font-mono transition-colors resize-y min-h-[82px] placeholder:text-slate-500"
          />
        )}
      </div>

      {/* Real-time Visual Output Preview */}
      {showPreview && (
        <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-500/40 shadow-inner space-y-1 animate-in fade-in">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pratinjau Tampilan Siswa:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Hasil akhir format tebal, miring, dan garis bawah yang dilihat siswa
            </span>
          </div>
          <div className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed pt-0.5 break-words">
            {value ? (
              <FormattedText text={value} />
            ) : (
              <span className="text-slate-500 italic font-normal">
                (Tulis teks soal dan gunakan tombol Bold, Italic, atau Underlined di atas untuk melihat hasilnya di sini)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
