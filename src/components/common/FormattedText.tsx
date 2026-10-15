import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
}

/**
 * Safely parses and renders text with formatting:
 * - <b>text</b>, <strong>text</strong> or **text** -> Bold
 * - <i>text</i>, <em>text</em> or *text* / _text_ -> Italic
 * - <u>text</u>, <ins>text</ins> or __text__ -> Underline
 * - \n -> Line break
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className = '',
  theme = 'auto',
}) => {
  if (!text) return null;

  // Auto-close unclosed tags for real-time preview while typing
  const autoCloseTags = (str: string): string => {
    let result = str;
    const openB = (result.match(/<b>/gi) || []).length;
    const closeB = (result.match(/<\/b>/gi) || []).length;
    if (openB > closeB) result += '</b>'.repeat(openB - closeB);

    const openI = (result.match(/<i>/gi) || []).length;
    const closeI = (result.match(/<\/i>/gi) || []).length;
    if (openI > closeI) result += '</i>'.repeat(openI - closeI);

    const openU = (result.match(/<u>/gi) || []).length;
    const closeU = (result.match(/<\/u>/gi) || []).length;
    if (openU > closeU) result += '</u>'.repeat(openU - closeU);

    return result;
  };

  // Function to parse inline tags safely into React elements
  const parseContent = (input: string): React.ReactNode[] => {
    // 1. Normalize HTML tags and markdown
    let normalized = input
      .replace(/<(\/?)strong>/gi, '<$1b>')
      .replace(/<(\/?)em>/gi, '<$1i>')
      .replace(/<(\/?)ins>/gi, '<$1u>')
      .replace(/<span\s+style="[^"]*font-weight:\s*(?:bold|[7-9]00)[^"]*">(.*?)<\/span>/gi, '<b>$1</b>')
      .replace(/<span\s+style="[^"]*font-style:\s*italic[^"]*">(.*?)<\/span>/gi, '<i>$1</i>')
      .replace(/<span\s+style="[^"]*text-decoration:\s*underline[^"]*">(.*?)<\/span>/gi, '<u>$1</u>')
      .replace(/<\/?b>/gi, (m) => m.toLowerCase())
      .replace(/<\/?i>/gi, (m) => m.toLowerCase())
      .replace(/<\/?u>/gi, (m) => m.toLowerCase())
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/(?<!\*)\*(?!\*)([^*\n]+)(?<!\*)\*(?!\*)/g, '<i>$1</i>')
      .replace(/(?<!_)_(?!_)([^_\n]+)(?<!_)_(?!_)/g, '<i>$1</i>');

    normalized = autoCloseTags(normalized);

    // Tokenize by <b>...</b>, <i>...</i>, <u>...</u>, and newlines
    const regex = /(<b>[\s\S]*?<\/b>|<i>[\s\S]*?<\/i>|<u>[\s\S]*?<\/u>|\n)/gi;
    const parts = normalized.split(regex);

    return parts.map((part, index) => {
      if (part === '\n') {
        return <br key={index} />;
      }

      const lowerPart = part.toLowerCase();

      // Bold: <b>...</b>
      if (lowerPart.startsWith('<b>') && lowerPart.endsWith('</b>')) {
        const inner = part.slice(3, -4);
        const boldClasses =
          theme === 'light'
            ? 'font-black text-slate-900 bg-amber-100/90 px-1 py-0.5 rounded tracking-wide border-b-2 border-amber-400'
            : 'font-black text-amber-300 tracking-wide drop-shadow-sm print:text-black print:font-extrabold';

        return (
          <strong key={index} className={boldClasses}>
            {parseContent(inner)}
          </strong>
        );
      }

      // Italic: <i>...</i>
      if (lowerPart.startsWith('<i>') && lowerPart.endsWith('</i>')) {
        const inner = part.slice(3, -4);
        const italicClasses =
          theme === 'light'
            ? 'italic font-bold text-sky-800'
            : 'italic font-semibold text-sky-300 print:text-black';

        return (
          <em key={index} className={italicClasses}>
            {parseContent(inner)}
          </em>
        );
      }

      // Underline: <u>...</u>
      if (lowerPart.startsWith('<u>') && lowerPart.endsWith('</u>')) {
        const inner = part.slice(3, -4);
        const underlineClasses =
          theme === 'light'
            ? 'underline decoration-2 decoration-emerald-600 underline-offset-4 text-emerald-900 font-bold'
            : 'underline decoration-2 decoration-emerald-400 underline-offset-4 text-emerald-300 font-bold print:text-black';

        return (
          <u key={index} className={underlineClasses}>
            {parseContent(inner)}
          </u>
        );
      }

      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return <span className={className}>{parseContent(text)}</span>;
};
