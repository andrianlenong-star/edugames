import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Question, QuestionType, QuizSet, MatchingPair, Jenjang, MataPelajaran, Difficulty } from '../types';

export interface ParsedFileResult {
  title: string;
  description: string;
  category: MataPelajaran;
  grade: Jenjang;
  targetClass?: string;
  difficulty: Difficulty;
  questions: Question[];
  rawTextPreview?: string;
  sourceFileName: string;
  detectedCount: number;
}

/**
 * Downloads a pre-formatted Excel template (.xlsx) for teachers
 * containing sample questions of ALL 4 types: Multiple Choice, True/False, Fill in Blank, and Matching.
 */
export function downloadExcelTemplate(): void {
  const sampleData = [
    {
      No: 1,
      'Tipe Soal': 'Pilihan Ganda',
      Pertanyaan: 'Organel sel yang berfungsi sebagai pusat penghasil energi seluler (ATP) adalah...',
      'Pilihan A': 'Ribosom',
      'Pilihan B': 'Mitokondria',
      'Pilihan C': 'Badan Golgi',
      'Pilihan D': 'Retikulum Endoplasma',
      'Kunci Jawaban': 'B',
      Pembahasan: 'Mitokondria dijuluki The Powerhouse of Cell karena menghasilkan energi ATP melalui respirasi sel.',
      Petunjuk: 'Dikenal sebagai pabrik energi sel.',
    },
    {
      No: 2,
      'Tipe Soal': 'Benar / Salah',
      Pertanyaan: 'Gas oksigen yang dihirup manusia merupakan hasil dari proses fotosintesis pada tumbuhan hijau.',
      'Pilihan A': 'Benar',
      'Pilihan B': 'Salah',
      'Pilihan C': '',
      'Pilihan D': '',
      'Kunci Jawaban': 'Benar',
      Pembahasan: 'Fotosintesis menghasilkan glukosa dan melepaskan gas oksigen (O2) ke atmosfer sebagai produk sampingan.',
      Petunjuk: 'Tumbuhan menghasilkan gas yang dibutuhkan pernapasan.',
    },
    {
      No: 3,
      'Tipe Soal': 'Isian Singkat',
      Pertanyaan: 'Ibukota negara Indonesia yang berada di wilayah pulau Jawa adalah kota...',
      'Pilihan A': '',
      'Pilihan B': '',
      'Pilihan C': '',
      'Pilihan D': '',
      'Kunci Jawaban': 'Jakarta',
      Pembahasan: 'DKI Jakarta adalah pusat perekonomian dan ibukota negara Indonesia di pulau Jawa.',
      Petunjuk: 'Kota metropolitan terbesar di Indonesia.',
    },
    {
      No: 4,
      'Tipe Soal': 'Menjodohkan',
      Pertanyaan: 'Jodohkan zat biologis berikut dengan peran utamanya dalam tubuh:',
      'Pilihan A': '',
      'Pilihan B': '',
      'Pilihan C': '',
      'Pilihan D': '',
      'Kunci Jawaban': 'Klorofil = Zat hijau daun; Hemoglobin = Pengikat oksigen darah; Insulin = Pengatur gula darah',
      Pembahasan: 'Klorofil terdapat pada tumbuhan, hemoglobin pada sel darah merah, insulin dihasilkan oleh pankreas.',
      Petunjuk: 'Hubungkan istilah dengan fungsinya.',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Tipe Soal
    { wch: 55 }, // Pertanyaan
    { wch: 22 }, // Pilihan A
    { wch: 22 }, // Pilihan B
    { wch: 22 }, // Pilihan C
    { wch: 22 }, // Pilihan D
    { wch: 35 }, // Kunci
    { wch: 50 }, // Pembahasan
    { wch: 25 }, // Petunjuk
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Soal EduZone');
  XLSX.writeFile(wb, 'Template_Soal_EduZone.xlsx');
}

/**
 * Downloads a pre-formatted CSV template
 */
export function downloadCsvTemplate(): void {
  const csvContent =
    'No,Tipe Soal,Pertanyaan,Pilihan A,Pilihan B,Pilihan C,Pilihan D,Kunci Jawaban,Pembahasan,Petunjuk\n' +
    '1,"Pilihan Ganda","Apa organel penghasil energi ATP?","Ribosom","Mitokondria","Badan Golgi","Nukleus","B","Mitokondria menghasilkan ATP","Pabrik energi"\n' +
    '2,"Benar / Salah","Fotosintesis menghasilkan gas oksigen.","Benar","Salah","","","Benar","Fotosintesis melepas O2","Tumbuhan hijau"\n' +
    '3,"Isian Singkat","Sebutkan nama ibukota negara Indonesia di Pulau Jawa!","","","","","Jakarta","DKI Jakarta","Ibukota RI"\n' +
    '4,"Menjodohkan","Pasangkan organ dengan fungsinya:","","","","","Jantung = Memompa darah; Paru-paru = Menukar oksigen","Jantung memompa darah ke seluruh tubuh","Organ vital"\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Soal_EduZone.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function cleanStr(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Normalize string for fuzzy comparison
 */
function normKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Detects if a cell/text represents an explicit question type
 */
function classifyTypeString(raw: string): QuestionType | null {
  const s = raw.toLowerCase().trim();
  if (!s) return null;

  // True / False
  if (
    s === 'benar salah' ||
    s === 'benar / salah' ||
    s === 'benar-salah' ||
    s === 'bs' ||
    s === 'b/s' ||
    s === 'b-s' ||
    s === 'tf' ||
    s === 'true/false' ||
    s === 'true false' ||
    s === 'benar' ||
    s === 'salah' ||
    s.includes('benar') ||
    s.includes('salah') ||
    s.includes('true') ||
    s.includes('false')
  ) {
    return 'true_false';
  }

  // Matching / Menjodohkan
  if (
    s.includes('jodoh') ||
    s.includes('match') ||
    s.includes('pasang') ||
    s.includes('cocok')
  ) {
    return 'matching';
  }

  // Fill in blank / Isian
  if (
    s.includes('isian') ||
    s.includes('singkat') ||
    s.includes('fill') ||
    s.includes('short') ||
    s.includes('uraian') ||
    s.includes('essay') ||
    s.includes('melengkapi')
  ) {
    return 'fill_blank';
  }

  // Multiple Choice / Pilihan Ganda
  if (
    s.includes('pilgan') ||
    s.includes('pg') ||
    s.includes('ganda') ||
    s.includes('choice') ||
    s.includes('pilihan')
  ) {
    return 'multiple_choice';
  }

  return null;
}

/**
 * Parse Excel (.xlsx, .xls) or CSV file
 * Supports multi-sheet workbooks and dynamic header recognition across sheets.
 */
export async function parseExcelOrCsvFile(file: File): Promise<ParsedFileResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File spreadsheet tidak memiliki sheet yang dapat dibaca.');
  }

  const baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  const questions: Question[] = [];

  const headerKeywords = [
    'soal',
    'pertanyaan',
    'pernyataan',
    'tanya',
    'question',
    'tipe',
    'jenis',
    'bentuk',
    'format',
    'pilihan',
    'opsi',
    'kunci',
    'jawaban',
    'nomor',
    'no',
  ];

  // Process all sheets in workbook (combine questions from multiple sheets if present)
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rawRows || rawRows.length === 0) continue;

    // Detect if sheet name itself indicates question type (e.g., "Pilihan Ganda", "Benar-Salah", "Isian")
    const sheetTypeHint = classifyTypeString(sheetName);

    // 1. Locate header row dynamically (within the first 15 rows)
    let headerRowIdx = 0;
    let maxHeaderMatches = 0;

    for (let r = 0; r < Math.min(15, rawRows.length); r++) {
      const row = rawRows[r] || [];
      let matches = 0;
      for (const cell of row) {
        const cStr = cleanStr(cell).toLowerCase();
        if (headerKeywords.some((kw) => cStr.includes(kw))) {
          matches++;
        }
      }
      if (matches > maxHeaderMatches) {
        maxHeaderMatches = matches;
        headerRowIdx = r;
      }
    }

    const headerRow = (rawRows[headerRowIdx] || []).map((c: any) => cleanStr(c));
    const dataRows: any[] = [];

    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const rowArr = rawRows[r];
      if (!rowArr || rowArr.length === 0) continue;
      const rowObj: Record<string, string> = {};
      let hasAnyData = false;

      headerRow.forEach((colName, cIdx) => {
        const val = cleanStr(rowArr[cIdx]);
        if (val) hasAnyData = true;
        const keyName = colName || `Col_${cIdx}`;
        rowObj[keyName] = val;
      });

      if (hasAnyData) {
        dataRows.push(rowObj);
      }
    }

    let activeSectionType: QuestionType | null = sheetTypeHint;

    dataRows.forEach((row, rowIndex) => {
      // Safe column getter: avoids accidental substring matching for short keys like 'a', 'b'
      const getVal = (patterns: string[]): string => {
        const keys = Object.keys(row);

        // 1. Exact match (case insensitive)
        for (const pattern of patterns) {
          const pLower = pattern.toLowerCase().trim();
          const found = keys.find((k) => k.toLowerCase().trim() === pLower);
          if (found && cleanStr(row[found])) return cleanStr(row[found]);
        }

        // 2. Normalized match (without spaces or symbols)
        for (const pattern of patterns) {
          const pNorm = normKey(pattern);
          const found = keys.find((k) => normKey(k) === pNorm);
          if (found && cleanStr(row[found])) return cleanStr(row[found]);
        }

        // 3. Substring match ONLY for longer descriptive patterns (len >= 3)
        // Strictly prevents single letter 'a' or 'b' from matching 'Pertanyaan' or 'Jawaban'!
        for (const pattern of patterns) {
          if (pattern.length < 3) continue;
          const pNorm = normKey(pattern);
          const found = keys.find((k) => {
            const kNorm = normKey(k);
            return kNorm.length >= 3 && kNorm.includes(pNorm);
          });
          if (found && cleanStr(row[found])) return cleanStr(row[found]);
        }

        return '';
      };

      // Check if row is a section divider row (e.g. single cell: "BAGIAN I: PILIHAN GANDA")
      const valuesInRow = Object.values(row).filter((v) => cleanStr(v).length > 0);
      if (valuesInRow.length === 1) {
        const singleText = String(valuesInRow[0] || '');
        const sectionType = classifyTypeString(singleText);
        if (sectionType) {
          activeSectionType = sectionType;
          return; // Skip section title row
        }
      }

      let questionText = getVal([
        'pertanyaan',
        'soal',
        'pernyataan',
        'soal pertanyaan',
        'question',
        'tanya',
        'isi soal',
        'teks soal',
        'kalimat',
        'deskripsi',
        'item',
        'materi',
        'soal no',
        'teks',
      ]);

      // If questionText empty, look for longest text cell in row
      if (!questionText) {
        const keys = Object.keys(row);
        let longestVal = '';
        for (const k of keys) {
          const v = cleanStr(row[k]);
          if (v.length > longestVal.length && isNaN(Number(v))) {
            longestVal = v;
          }
        }
        if (longestVal.length >= 8) {
          questionText = longestVal;
        }
      }

      if (!questionText) return;

      const rawType = getVal([
        'tipe soal',
        'jenis soal',
        'bentuk soal',
        'tipe',
        'jenis',
        'type',
        'format',
        'model soal',
        'kategori soal',
      ]);

      const optA = getVal([
        'pilihan a',
        'opsi a',
        'jawaban a',
        'option a',
        'a',
        'opsi 1',
        'pilihan 1',
        '(a)',
        '[a]',
        'a.',
        'a)',
      ]);
      const optB = getVal([
        'pilihan b',
        'opsi b',
        'jawaban b',
        'option b',
        'b',
        'opsi 2',
        'pilihan 2',
        '(b)',
        '[b]',
        'b.',
        'b)',
      ]);
      const optC = getVal([
        'pilihan c',
        'opsi c',
        'jawaban c',
        'option c',
        'c',
        'opsi 3',
        'pilihan 3',
        '(c)',
        '[c]',
        'c.',
        'c)',
      ]);
      const optD = getVal([
        'pilihan d',
        'opsi d',
        'jawaban d',
        'option d',
        'd',
        'opsi 4',
        'pilihan 4',
        '(d)',
        '[d]',
        'd.',
        'd)',
      ]);
      const optE = getVal([
        'pilihan e',
        'opsi e',
        'jawaban e',
        'option e',
        'e',
        'opsi 5',
        'pilihan 5',
        '(e)',
        '[e]',
        'e.',
        'e)',
      ]);

      const rawKey = getVal([
        'kunci jawaban',
        'kunci',
        'jawaban benar',
        'jawaban',
        'answer',
        'key',
        'benar',
        'kunci_jawaban',
        'kunci/jawaban',
      ]);
      const explanation =
        getVal(['pembahasan', 'penjelasan', 'explanation', 'alasan']) ||
        'Pembahasan materi konsep pembelajaran.';
      const hint =
        getVal(['petunjuk', 'hint', 'clue', 'tips']) || 'Perhatikan kata kunci pada pertanyaan.';

      // Determine Question Type
      let type: QuestionType = 'multiple_choice';

      const explicitType = classifyTypeString(rawType);
      if (explicitType) {
        type = explicitType;
      } else if (activeSectionType) {
        type = activeSectionType;
      } else {
        // Auto-detect based on options and key content
        const keyLow = rawKey.toLowerCase().trim();
        const aLow = optA.toLowerCase().trim();
        const bLow = optB.toLowerCase().trim();

        if (
          (aLow === 'benar' && bLow === 'salah') ||
          (aLow === 'salah' && bLow === 'benar') ||
          (aLow === 'true' && bLow === 'false') ||
          (['benar', 'salah', 'true', 'false', 'bs', 'b/s'].includes(keyLow) && !optC && !optD)
        ) {
          type = 'true_false';
        } else if (
          rawKey.includes('=') ||
          rawKey.includes('->') ||
          rawKey.includes('↔') ||
          rawKey.includes(';') ||
          questionText.toLowerCase().includes('jodohkan') ||
          questionText.toLowerCase().includes('pasangkan')
        ) {
          type = 'matching';
        } else if (!optA && !optB && rawKey) {
          type = 'fill_blank';
        } else {
          type = 'multiple_choice';
        }
      }

      let options: string[] | undefined = undefined;
      let correctIndex = 0;
      let isTrue = true;
      let correctAnswer = rawKey || optA || 'Benar';
      let acceptableAnswers: string[] | undefined = undefined;
      let matchingPairs: MatchingPair[] | undefined = undefined;

      if (type === 'multiple_choice') {
        const opts = [optA, optB, optC, optD, optE].filter(Boolean);
        while (opts.length < 4) {
          opts.push(`Pilihan ${String.fromCharCode(65 + opts.length)}`);
        }
        options = opts.slice(0, 4);

        const keyUpper = rawKey.toUpperCase().trim();
        if (['A', '0'].includes(keyUpper)) correctIndex = 0;
        else if (['B', '1'].includes(keyUpper)) correctIndex = 1;
        else if (['C', '2'].includes(keyUpper)) correctIndex = 2;
        else if (['D', '3'].includes(keyUpper)) correctIndex = 3;
        else {
          const foundIdx = options.findIndex(
            (o) => o.toLowerCase().trim() === rawKey.toLowerCase().trim()
          );
          correctIndex = foundIdx >= 0 ? foundIdx : 0;
        }
        correctAnswer = options[correctIndex] || options[0];
      } else if (type === 'true_false') {
        options = ['Benar', 'Salah'];
        const keyLower = rawKey.toLowerCase().trim();
        if (keyLower === 'a' && optA.toLowerCase().includes('benar')) isTrue = true;
        else if (keyLower === 'b' && optB.toLowerCase().includes('salah')) isTrue = false;
        else if (keyLower === 'salah' || keyLower === 'false' || keyLower === 's' || keyLower === '0') isTrue = false;
        else isTrue = true;
        correctAnswer = isTrue ? 'Benar' : 'Salah';
      } else if (type === 'fill_blank') {
        correctAnswer = rawKey || 'Jawaban Tepat';
        acceptableAnswers = [correctAnswer, correctAnswer.toLowerCase()];
      } else if (type === 'matching') {
        const rawPairStr = rawKey || questionText;
        const pairTokens = rawPairStr.split(/[;\n]/).map((t) => t.trim()).filter(Boolean);
        const parsedPairs: MatchingPair[] = [];

        pairTokens.forEach((tok, pIdx) => {
          const parts = tok.split(/[=->↔:]+/);
          if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
            parsedPairs.push({
              id: `pair-${questions.length}-${pIdx}`,
              left: parts[0].trim().replace(/^\d+[\.\)]\s*/, ''),
              right: parts[1].trim(),
            });
          }
        });

        if (parsedPairs.length >= 2) {
          matchingPairs = parsedPairs;
          correctAnswer = matchingPairs.map((p) => `${p.left} ↔ ${p.right}`).join(', ');
        } else {
          matchingPairs = [
            { id: `p1-${questions.length}`, left: 'Konsep A', right: 'Definisi A' },
            { id: `p2-${questions.length}`, left: 'Konsep B', right: 'Definisi B' },
          ];
          correctAnswer = 'Konsep A ↔ Definisi A, Konsep B ↔ Definisi B';
        }
      }

      questions.push({
        id: `imported-q-${Date.now()}-${questions.length + 1}`,
        type,
        question: questionText,
        options,
        correctIndex,
        isTrue,
        correctAnswer,
        acceptableAnswers,
        matchingPairs,
        explanation,
        hint,
        anagramWord: 'KUIS',
      });
    });
  }

  if (questions.length === 0) {
    throw new Error('Tidak ditemukan baris data soal yang valid pada file spreadsheet ini.');
  }

  return {
    title: `Paket Soal: ${baseTitle}`,
    description: `Paket ${questions.length} butir soal diimpor dari spreadsheet (${file.name})`,
    category: 'Pengetahuan Umum',
    grade: 'SMP',
    targetClass: 'Kelas 7 SMP',
    difficulty: 'Sedang',
    questions,
    sourceFileName: file.name,
    detectedCount: questions.length,
  };
}

/**
 * Intelligent regex-based text parser for Indonesian question formats.
 * Works seamlessly with Word (.docx), PDF text, or any pasted document text.
 * Strictly guarantees EACH question is separated into an individual,
 * independently editable question card by its specific type.
 */
export function parseQuestionsFromRawText(
  rawText: string,
  fileName = 'Dokumen'
): ParsedFileResult {
  const baseTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

  // 1. Normalize line endings and whitespace characters
  let text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ') // Non-breaking spaces
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width spaces
    .replace(/[–—]/g, '-') // Em-dashes to standard hyphen
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // 2. Extract separate bottom answer key table if present at the end of the document
  // e.g., "KUNCI JAWABAN: 1. A, 2. B, 3. Benar, 4. ..."
  const bottomKeyMap = new Map<number, string>();
  const bottomKeyHeaderMatch = text.match(
    /\n\s*(?:KUNCI\s+JAWABAN|KUNCI\s+SOAL|ANSWER\s+KEYS?|KUNCI\s+DAN\s+PEMBAHASAN)[\s\:\-]+([\s\S]+)$/i
  );

  if (bottomKeyHeaderMatch) {
    const bottomKeySection = bottomKeyHeaderMatch[1];
    const keyPairRegex = /(?:(?:No\.?|Nomor)?\s*(\d{1,3})[\.\:\)]\s*([^\n,;]+))/gi;
    let km: RegExpExecArray | null;
    while ((km = keyPairRegex.exec(bottomKeySection)) !== null) {
      const qNum = parseInt(km[1], 10);
      const qKeyVal = km[2].trim();
      if (!isNaN(qNum) && qKeyVal) {
        bottomKeyMap.set(qNum, qKeyVal);
      }
    }
    // Remove the bottom key section from main text so it doesn't get treated as questions
    text = text.slice(0, bottomKeyHeaderMatch.index);
  }

  // 3. Ensure section headers have clear preceding newlines
  text = text.replace(
    /([^\n\r])\s+(?=(?:(?:BAGIAN|ROMAN|ROMAWI|PART)\s*(?:[IVX]+|[A-D]|\d+)[\.\:\-]|(?:PILIHAN\s+GANDA|BENAR\s*[\/-]?\s*SALAH|ISIAN\s*SINGKAT|MENJODOHKAN))\b)/gi,
    '$1\n\n'
  );

  // 4. Ensure question numbers have clear preceding newlines
  // Matches: "1. Soal", "2) Soal", "No. 3:", "Pertanyaan 4."
  text = text.replace(
    /([^\n\r])\s+(?=(?:(?:Soal|Pertanyaan|No\.?|Nomor|Butir)\s*(?:ke-?\d+|\d+)?[\.\:\)]|\b\d{1,3}[\.\)\:]|\(\d{1,3}\)|\[\d{1,3}\])\s+[^\n\r])/gi,
    '$1\n'
  );

  // 5. Ensure options A-E have clear preceding newlines if they are inline
  text = text.replace(
    /([^\n\r])\s+(?=(?:\*?\s*[A-Ea-e][\.\)]|\*?\s*\[[A-Ea-e]\]|\*?\s*\([A-Ea-e]\))\s+[^\n\r])/g,
    '$1\n'
  );

  // 6. Ensure keywords (Kunci, Jawaban, Pembahasan, Petunjuk) have newlines
  text = text.replace(
    /([^\n\r])\s+(?=(?:Kunci|Jawaban|Kunci\s*Jawaban|Answer|Key|Jwb|Pembahasan|Penjelasan|Petunjuk|Hint)[\s\:\-]+)/gi,
    '$1\n'
  );

  const lines = text.split('\n');

  // Detect Section Headers (e.g. "I. PILIHAN GANDA", "B. BENAR / SALAH", "C. ISIAN SINGKAT", "D. MENJODOHKAN")
  const isSectionHeader = (line: string): QuestionType | null => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 100) return null;

    // Must not be a numbered question (e.g. "1. Soal...")
    if (/^\d{1,3}[\.\)]\s+/.test(trimmed)) return null;

    const lower = trimmed.toLowerCase();

    // Check multiple choice section
    if (/(?:pilihan\s+ganda|pilgan|multiple\s*choice)/i.test(lower)) {
      return 'multiple_choice';
    }

    // Check true / false section
    if (
      /(?:benar\s*[\/-]?\s*salah|true\s*[\/-]?\s*false|benar\s+atau\s+salah|soal\s*b\s*[\/-]?\s*s|\bb\s*\/\s*s\b)/i.test(
        lower
      )
    ) {
      return 'true_false';
    }

    // Check fill in blank section
    if (
      /(?:isian\s*singkat|soal\s*isian|fill\s*in|jawaban\s*singkat|uraian\s*singkat|melengkapi)/i.test(
        lower
      )
    ) {
      return 'fill_blank';
    }

    // Check matching section
    if (/(?:menjodohkan|soal\s*jodoh|pasangkan|cocokkan|matching)/i.test(lower)) {
      return 'matching';
    }

    return null;
  };

  // Detect Question Start Lines
  const isQuestionStart = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    // e.g. "1. ", "1.", "1) ", "1)", "(1) ", "[1] ", "1 - "
    if (/^\d{1,3}[\.\)\:\-]\s*/.test(trimmed)) return true;
    if (/^\(\d{1,3}\)\s*/.test(trimmed)) return true;
    if (/^\[\d{1,3}\]\s*/.test(trimmed)) return true;

    // e.g. "No. 1 ", "Nomor 1:", "Soal 1.", "Pertanyaan 1:", "Butir 1:"
    if (/^(?:Soal|Pertanyaan|No\.?|Nomor|Butir)\s*(?:ke-?\d+|\d+)?[\.\:\)]?\s+/i.test(trimmed)) {
      return true;
    }

    // e.g. "Q1: ", "Q.1 "
    if (/^q\s*\.?\s*\d{1,3}[\.\:\)]\s*/i.test(trimmed)) return true;

    return false;
  };

  // Filter out top document banners and general instructions before question 1
  const isDocumentMetadata = (line: string): boolean => {
    const l = line.toLowerCase().trim();
    return (
      l.includes('kementerian') ||
      l.includes('dinas pendidikan') ||
      l.includes('penilaian akhir') ||
      l.includes('ujian akhir') ||
      l.includes('ulangan harian') ||
      l.includes('tahun ajaran') ||
      l.includes('semester') ||
      l.includes('mata pelajaran') ||
      l.includes('nama siswa') ||
      l.includes('kelas /') ||
      l.includes('petunjuk umum') ||
      l.includes('petunjuk khusus') ||
      l.includes('waktu :') ||
      l.includes('hari / tanggal') ||
      l.startsWith('nama:')
    );
  };

  interface RawQuestionBlock {
    questionNumber?: number;
    sectionType: QuestionType | null;
    rawLines: string[];
  }

  const questionBlocks: RawQuestionBlock[] = [];
  let currentBlockLines: string[] = [];
  let currentSectionType: QuestionType | null = null;
  let hasFoundFirstQuestion = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line is a Section Header
    const sectionType = isSectionHeader(trimmed);
    if (sectionType) {
      if (currentBlockLines.length > 0) {
        questionBlocks.push({
          sectionType: currentSectionType,
          rawLines: currentBlockLines,
        });
        currentBlockLines = [];
      }
      currentSectionType = sectionType;
      continue;
    }

    // Skip top document title/metadata before first question begins
    if (!hasFoundFirstQuestion && isDocumentMetadata(trimmed)) {
      continue;
    }

    if (isQuestionStart(trimmed)) {
      hasFoundFirstQuestion = true;
      if (currentBlockLines.length > 0) {
        questionBlocks.push({
          sectionType: currentSectionType,
          rawLines: currentBlockLines,
        });
      }
      currentBlockLines = [trimmed];
    } else {
      if (hasFoundFirstQuestion && currentBlockLines.length > 0) {
        currentBlockLines.push(trimmed);
      }
    }
  }

  if (currentBlockLines.length > 0) {
    questionBlocks.push({
      sectionType: currentSectionType,
      rawLines: currentBlockLines,
    });
  }

  // Fallback: If no numbered question blocks found, split by double newlines
  if (questionBlocks.length === 0) {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 15);
    paragraphs.forEach((p) => {
      const pLines = p.split('\n').map((l) => l.trim()).filter(Boolean);
      if (pLines.length > 0 && !isDocumentMetadata(pLines[0])) {
        questionBlocks.push({
          sectionType: currentSectionType,
          rawLines: pLines,
        });
      }
    });
  }

  const questions: Question[] = [];

  questionBlocks.forEach((block, index) => {
    const blockLines = block.rawLines;
    if (blockLines.length === 0) return;

    let questionText = '';
    const rawOptions: { letter: string; text: string; isMarkedCorrect?: boolean }[] = [];
    let detectedKey = '';
    let explanation = '';
    let hint = '';

    // Extract question number from first line if available
    let questionNumber = index + 1;
    const numMatch = blockLines[0].match(/^(?:(?:Soal|No\.?|Nomor|Pertanyaan)?\s*(\d{1,3}))[\.\:\)\-]/i);
    if (numMatch) {
      const parsedNum = parseInt(numMatch[1], 10);
      if (!isNaN(parsedNum)) questionNumber = parsedNum;
    }

    for (const line of blockLines) {
      // 1. Answer Key Line (e.g. "Kunci: A", "Jawaban: B", "Kunci Jawaban: Benar", "Jwb: A")
      const keyMatch = line.match(
        /^(?:Kunci|Jawaban|Kunci\s*Jawaban|Answer|Key|Jwb|Jawab(?:an)?\s*Benar)[\s\:\-]+(.+)$/i
      );
      if (keyMatch) {
        detectedKey = keyMatch[1].trim();
        continue;
      }

      // 2. Explanation Line
      const expMatch = line.match(/^(?:Pembahasan|Penjelasan|Explanation|Catatan)[\s\:\-]+(.+)$/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        continue;
      }

      // 3. Hint Line
      const hintMatch = line.match(/^(?:Petunjuk|Hint|Tips|Clue)[\s\:\-]+(.+)$/i);
      if (hintMatch) {
        hint = hintMatch[1].trim();
        continue;
      }

      // 4. Options Line
      // Single option line: e.g. "A. Opsi", "a) Opsi", "*C. Opsi", "(A) Opsi", "[A] Opsi"
      const singleOptMatch = line.match(
        /^(\*?)\s*(?:([A-Ea-e])[\.\)\:\-]|\[([A-Ea-e])\]|\(([A-Ea-e])\))\s*(.+)$/
      );
      if (singleOptMatch) {
        const isMarked =
          singleOptMatch[1] === '*' ||
          singleOptMatch[5].endsWith('*') ||
          /\(benar\)$/i.test(singleOptMatch[5]);
        const letter = (
          singleOptMatch[2] ||
          singleOptMatch[3] ||
          singleOptMatch[4]
        ).toUpperCase();
        const optText = singleOptMatch[5]
          .replace(/\*$/, '')
          .replace(/\(benar\)$/i, '')
          .trim();
        rawOptions.push({ letter, text: optText, isMarkedCorrect: isMarked });
        continue;
      }

      // Inline multiple options: e.g. "A. Pilihan 1  B. Pilihan 2  C. Pilihan 3  D. Pilihan 4"
      const inlineOptRegex = new RegExp(
        '(?:^|\\s)(\\*?)\\s*(?:([A-Ea-e])[\\.\\)\\:\\-]|\\[([A-Ea-e])\\]|\\(([A-Ea-e])\\))\\s*([^\\n\\r]+?)(?=(?:\\s+\\*?\\s*(?:[A-Ea-e][\\.\\)\\:\\-]|\\[[A-Ea-e]\\]|\\([A-Ea-e]\\))|\\s+(?:Kunci|Jawaban|Pembahasan|Petunjuk)|$))',
        'gi'
      );
      const matches: RegExpExecArray[] = [];
      let m: RegExpExecArray | null;
      while ((m = inlineOptRegex.exec(line)) !== null) {
        matches.push(m);
      }

      if (matches.length >= 2) {
        matches.forEach((item) => {
          const isMarked =
            item[1] === '*' || item[5].endsWith('*') || /\(benar\)$/i.test(item[5]);
          const letter = (item[2] || item[3] || item[4]).toUpperCase();
          const optText = item[5]
            .replace(/\*$/, '')
            .replace(/\(benar\)$/i, '')
            .trim();
          rawOptions.push({ letter, text: optText, isMarkedCorrect: isMarked });
        });
        continue;
      }

      // 5. Accumulate Question Text
      if (!questionText) {
        // Strip leading number or prefix from question line
        const stripped = line
          .replace(
            /^(?:(?:Soal|Pertanyaan|No\.?|Nomor|Butir)\s*(?:ke-?\d+|\d+)?[\.\:\)]?\s*|^\d{1,3}[\.\)\:\-]\s*|^\(\d{1,3}\)\s*|^\[\d{1,3}\]\s*)/i,
            ''
          )
          .trim();
        questionText = stripped || line;
      } else if (rawOptions.length === 0 && !detectedKey) {
        questionText += '\n' + line;
      }
    }

    if (!questionText || questionText.trim().length === 0) return;

    // Check if key is available from bottom answer key map
    if (!detectedKey && bottomKeyMap.has(questionNumber)) {
      detectedKey = bottomKeyMap.get(questionNumber)!;
    }

    // Determine Question Type
    let type: QuestionType = block.sectionType || 'multiple_choice';

    const textLower = questionText.toLowerCase();
    const keyLower = detectedKey.toLowerCase().trim();

    // Check options structure
    if (rawOptions.length >= 2) {
      const optTexts = rawOptions.map((o) => o.text.toLowerCase().trim());
      const hasBenar = optTexts.some((t) => t === 'benar' || t.startsWith('benar'));
      const hasSalah = optTexts.some((t) => t === 'salah' || t.startsWith('salah'));

      if (hasBenar && hasSalah && rawOptions.length <= 3) {
        type = 'true_false';
      } else if (block.sectionType) {
        type = block.sectionType;
      } else {
        type = 'multiple_choice';
      }
    } else {
      // No options detected
      if (block.sectionType) {
        type = block.sectionType;
      } else if (
        ['benar', 'salah', 'true', 'false', 'b', 's'].includes(keyLower) ||
        textLower.includes('benar atau salah') ||
        textLower.includes('(benar/salah)') ||
        textLower.includes('[benar/salah]') ||
        textLower.includes('(b/s)') ||
        textLower.includes('[b/s]')
      ) {
        type = 'true_false';
      } else if (
        textLower.includes('jodohkan') ||
        textLower.includes('pasangkan') ||
        textLower.includes('cocokkan') ||
        detectedKey.includes('->') ||
        detectedKey.includes('↔') ||
        detectedKey.includes('=')
      ) {
        type = 'matching';
      } else {
        type = 'fill_blank';
      }
    }

    let options: string[] | undefined = undefined;
    let correctIndex = 0;
    let isTrue = true;
    let correctAnswer = detectedKey || 'A';
    let acceptableAnswers: string[] | undefined = undefined;
    let matchingPairs: MatchingPair[] | undefined = undefined;

    if (type === 'multiple_choice') {
      const sortedOpts = rawOptions.sort((a, b) => a.letter.localeCompare(b.letter));
      let finalOpts = sortedOpts.map((o) => o.text);

      if (finalOpts.length === 0) {
        finalOpts = ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'];
      } else {
        while (finalOpts.length < 4) {
          finalOpts.push(`Pilihan ${String.fromCharCode(65 + finalOpts.length)}`);
        }
      }
      options = finalOpts.slice(0, 4);

      // Check marked option first (*)
      const markedIdx = sortedOpts.findIndex((o) => o.isMarkedCorrect);
      if (markedIdx >= 0) {
        correctIndex = markedIdx;
      } else {
        // Match key letter
        const cleanLetter = detectedKey.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 1);
        if (cleanLetter === 'A' || cleanLetter === '0') correctIndex = 0;
        else if (cleanLetter === 'B' || cleanLetter === '1') correctIndex = 1;
        else if (cleanLetter === 'C' || cleanLetter === '2') correctIndex = 2;
        else if (cleanLetter === 'D' || cleanLetter === '3') correctIndex = 3;
        else {
          // Check if key matches option text
          const found = options.findIndex(
            (o) => o.toLowerCase().trim() === detectedKey.toLowerCase().trim()
          );
          correctIndex = found >= 0 ? found : 0;
        }
      }
      correctAnswer = options[correctIndex] || options[0];
    } else if (type === 'true_false') {
      options = ['Benar', 'Salah'];
      const keyLow = detectedKey.toLowerCase().trim();
      if (
        keyLow === 'salah' ||
        keyLow === 'false' ||
        keyLow === 's' ||
        keyLow === '0' ||
        (keyLow === 'b' && rawOptions[1]?.text.toLowerCase().includes('salah'))
      ) {
        isTrue = false;
      } else {
        isTrue = true;
      }
      correctAnswer = isTrue ? 'Benar' : 'Salah';
    } else if (type === 'matching') {
      const rawPairStr = detectedKey || questionText;
      const pairTokens = rawPairStr.split(/[;\n]/).map((t) => t.trim()).filter(Boolean);
      const parsedPairs: MatchingPair[] = [];

      pairTokens.forEach((tok, pIdx) => {
        const parts = tok.split(/[=->↔:]+/);
        if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
          parsedPairs.push({
            id: `p-${index}-${pIdx}`,
            left: parts[0].trim().replace(/^\d+[\.\)]\s*/, ''),
            right: parts[1].trim(),
          });
        }
      });

      if (parsedPairs.length >= 2) {
        matchingPairs = parsedPairs;
      } else {
        matchingPairs = [
          { id: `p1-${index}`, left: 'Konsep A', right: 'Pasangan A' },
          { id: `p2-${index}`, left: 'Konsep B', right: 'Pasangan B' },
        ];
      }
      correctAnswer = matchingPairs.map((p) => `${p.left} ↔ ${p.right}`).join(', ');
    } else {
      // fill_blank
      correctAnswer = detectedKey || 'Jawaban Tepat';
      acceptableAnswers = [correctAnswer, correctAnswer.toLowerCase()];
    }

    // Clean question text of lingering keys or instructions
    questionText = questionText
      .replace(/(?:Kunci|Jawaban|Kunci\s*Jawaban|Answer|Key|Jwb)[\s\:\-]+.+$/i, '')
      .replace(/(?:Pembahasan|Penjelasan|Explanation|Petunjuk|Hint)[\s\:\-]+.+$/i, '')
      .trim();

    questions.push({
      id: `imported-q-${index + 1}-${Date.now()}`,
      type,
      question: questionText,
      options,
      correctIndex,
      isTrue,
      correctAnswer,
      acceptableAnswers,
      matchingPairs,
      explanation: explanation || 'Pembahasan materi konsep pembelajaran.',
      hint: hint || 'Pahami kata kunci utama pada pertanyaan.',
      anagramWord: 'KUIS',
    });
  });

  return {
    title: `Paket Soal: ${baseTitle}`,
    description: `Paket ${questions.length} butir soal diimpor dari dokumen (${fileName})`,
    category: 'Pengetahuan Umum',
    grade: 'SMP',
    targetClass: 'Kelas 7 SMP',
    difficulty: 'Sedang',
    questions,
    rawTextPreview: text.slice(0, 1500),
    sourceFileName: fileName,
    detectedCount: questions.length,
  };
}

/**
 * Parse Word (.docx) file using mammoth
 * Converts HTML blocks (<p>, <tr>, <td>, <li>) to structured line breaks to guarantee clean question separation.
 */
export async function parseWordDocxFile(file: File): Promise<ParsedFileResult> {
  const arrayBuffer = await file.arrayBuffer();

  let extractedText = '';

  try {
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const rawHtml = htmlResult.value || '';

    // Convert block elements and table cells to clean line breaks and spaces
    extractedText = rawHtml
      .replace(/<\/(td|th)>/gi, ' \t ')
      .replace(/<\/(tr|p|div|li|h[1-6])>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '') // strip remaining tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  } catch {
    // Fallback to raw text extraction
    const rawResult = await mammoth.extractRawText({ arrayBuffer });
    extractedText = rawResult.value;
  }

  if (!extractedText || !extractedText.trim()) {
    throw new Error('Dokumen Word kosong atau tidak dapat diekstraksi teksnya.');
  }

  const parsed = parseQuestionsFromRawText(extractedText, file.name);
  if (parsed.questions.length === 0) {
    throw new Error(
      'Tidak ditemukan format pertanyaan yang dapat diekstraksi dari dokumen Word ini. Pastikan terdapat nomor soal (misal: 1. Soal ... A. ... B. ... Kunci: ...).'
    );
  }

  return parsed;
}

/**
 * Loads PDF.js dynamically with multi-CDN fallback
 */
async function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  const cdnUrls = [
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
  ];

  for (const url of cdnUrls) {
    try {
      const loaded = await new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });

      if (loaded && (window as any).pdfjsLib) {
        const lib = (window as any).pdfjsLib;
        lib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        return lib;
      }
    } catch {
      continue;
    }
  }

  throw new Error('Pustaka PDF.js gagal dimuat dari CDN.');
}

/**
 * Server-side extraction fallback via /api/extract-pdf-text
 */
async function extractPdfTextViaServer(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }
    const base64Data = btoa(binary);

    const resp = await fetch('/api/extract-pdf-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data }),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.text) {
        return data.text;
      }
    }
  } catch (err) {
    console.warn('Server-side PDF extraction failed, attempting binary fallback:', err);
  }
  return '';
}

/**
 * Fallback binary text extractor for PDF if PDF.js is unavailable
 */
function extractTextFromPdfBufferFallback(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binaryStr = '';
  const len = Math.min(bytes.length, 500000);
  for (let i = 0; i < len; i++) {
    binaryStr += String.fromCharCode(bytes[i]);
  }

  const matches = binaryStr.match(/\(([^()]{2,150})\)\s*T[jJ]/g) || [];
  if (matches.length > 5) {
    return matches
      .map((m) => m.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, ''))
      .filter((t) => /^[a-zA-Z0-9\s.,?!:;'"()/-]+$/.test(t))
      .join('\n');
  }

  return '';
}

/**
 * Parse PDF file (.pdf)
 * Groups text blocks by page and vertical coordinates to preserve line structure accurately.
 */
export async function parsePdfDocumentFile(file: File): Promise<ParsedFileResult> {
  const arrayBuffer = await file.arrayBuffer();
  let fullText = '';

  try {
    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      interface TextLineItem {
        y: number;
        x: number;
        str: string;
      }

      const items: TextLineItem[] = [];

      for (const item of textContent.items as any[]) {
        const str = cleanStr(item.str);
        if (!str) continue;
        const x = item.transform ? Math.round(item.transform[4]) : 0;
        const y = item.transform ? Math.round(item.transform[5]) : 0;
        items.push({ x, y, str });
      }

      // Sort top-to-bottom (higher Y to lower Y in PDF), then left-to-right (lower X to higher X)
      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 4) {
          return b.y - a.y;
        }
        return a.x - b.x;
      });

      let pageText = '';
      let lastY: number | null = null;

      for (const item of items) {
        if (lastY !== null && Math.abs(item.y - lastY) > 4) {
          pageText += '\n';
        } else if (pageText && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = item.y;
      }

      fullText += pageText + '\n\n';
    }
  } catch (pdfJsErr) {
    console.warn('PDF.js reading failed, attempting server-side extractor:', pdfJsErr);
    // 1. Try server extraction
    fullText = await extractPdfTextViaServer(file);
    // 2. If still empty, try client binary extraction
    if (!fullText || fullText.trim().length < 15) {
      fullText = extractTextFromPdfBufferFallback(arrayBuffer);
    }
  }

  if (!fullText || fullText.trim().length < 15) {
    throw new Error(
      'Gagal membaca teks dari file PDF. Pastikan file PDF berbasis teks (bukan hasil scan foto/gambar tanpa OCR).'
    );
  }

  const parsed = parseQuestionsFromRawText(fullText, file.name);
  if (parsed.questions.length === 0) {
    throw new Error(
      'Teks berhasil dibaca tetapi tidak ditemukan butir soal berformat (1. Soal ... A. Opsi ... Kunci: ...). Silakan periksa isi file atau gunakan template Excel.'
    );
  }

  return parsed;
}

/**
 * Unified File Upload Parser for PDF, Word (.docx), Excel (.xlsx, .xls, .csv)
 */
export async function parseUploadedDocument(file: File): Promise<ParsedFileResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
    return parseExcelOrCsvFile(file);
  } else if (name.endsWith('.docx')) {
    return parseWordDocxFile(file);
  } else if (name.endsWith('.pdf')) {
    return parsePdfDocumentFile(file);
  } else {
    throw new Error(
      'Format file tidak didukung. Mohon upload file dengan format PDF (.pdf), Word (.docx), atau Excel (.xlsx, .xls, .csv).'
    );
  }
}
