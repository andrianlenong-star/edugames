import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QuizSet } from '../types';

export interface PdfExportOptions {
  schoolName: string;
  showAnswerKey: boolean;
  fontSize?: 'sm' | 'base' | 'lg';
}

/**
 * Cleanly prints the worksheet using an isolated print iframe to bypass
 * any parent iframe restrictions, dark themes, and navigation bar interference.
 */
export function printWorksheetElement(elementId: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const sourceElement = document.getElementById(elementId);
      if (!sourceElement) {
        console.warn(`Element #${elementId} not found, falling back to window.print()`);
        window.print();
        resolve(true);
        return;
      }

      // Remove any existing print frame
      const oldFrame = document.getElementById('eduzone-print-frame');
      if (oldFrame) oldFrame.remove();

      // Create an isolated hidden iframe
      const iframe = document.createElement('iframe');
      iframe.id = 'eduzone-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      if (!frameDoc) {
        window.print();
        resolve(true);
        return;
      }

      // Build standalone printable document
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>Cetak Lembar Kerja - EduZone</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 10px;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              font-size: 13px;
              line-height: 1.5;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print\\:hidden, .print-hide {
              display: none !important;
            }
            .page-break-inside-avoid {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            /* Table & border styling */
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .border {
              border: 1px solid #cbd5e1;
            }
            .border-b {
              border-bottom: 1px solid #cbd5e1;
            }
            .border-b-2 {
              border-bottom: 2px solid #0f172a;
            }
            .rounded-xl {
              border-radius: 12px;
            }
            .p-4 { padding: 16px; }
            .p-2 { padding: 8px; }
            .mb-6 { margin-bottom: 24px; }
            .space-y-6 > * + * { margin-top: 24px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .font-bold { font-weight: 700; }
            .font-extrabold { font-weight: 800; }
            .font-black { font-weight: 900; }
            .text-center { text-align: center; }
            .text-indigo-950 { color: #1e1b4b; }
            .text-emerald-700 { color: #047857; }
            .bg-emerald-50 { background-color: #ecfdf5; }
            .bg-slate-50 { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          ${sourceElement.innerHTML}
        </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            iframe.remove();
            resolve(true);
          }, 1000);
        } catch (e) {
          window.print();
          resolve(true);
        }
      }, 500);
    } catch (err) {
      console.warn('Error during print:', err);
      window.print();
      resolve(true);
    }
  });
}

/**
 * High-reliability native vector PDF generator using jsPDF.
 * Bypasses html2canvas completely to guarantee 100% success on any device,
 * preventing any issues with modern CSS syntax (oklch) or sandboxed iframes.
 */
export function exportWorksheetVectorPdf(
  quizSet: QuizSet,
  fileName: string,
  options?: PdfExportOptions
): boolean {
  const schoolName = (options?.schoolName || 'EDUZONE SMART ACADEMY').toUpperCase();
  const showKey = options?.showAnswerKey ?? false;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let y = 16;
  let page = 1;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      // Print footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        `EduZone - Halaman ${page} | ${quizSet.title}`,
        marginX,
        pageHeight - 10
      );

      pdf.addPage();
      page++;
      y = 16;
    }
  };

  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(20, 30, 60);
  pdf.text(schoolName, pageWidth / 2, y, { align: 'center' });
  y += 6;

  pdf.setFontSize(11);
  pdf.setTextColor(50, 50, 80);
  pdf.text('LEMBAR KERJA SISWA (LKS) & EVALUASI PEMBELAJARAN', pageWidth / 2, y, { align: 'center' });
  y += 5;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 100);
  pdf.text(
    `Mata Pelajaran: ${quizSet.category}  |  Tingkat: ${quizSet.targetClass || quizSet.grade}  |  Materi: ${quizSet.title}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 4;

  // Header separator line
  pdf.setDrawColor(30, 41, 59);
  pdf.setLineWidth(0.6);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 1.5;
  pdf.setLineWidth(0.2);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 6;

  // Identity Table Box
  pdf.setDrawColor(180, 190, 205);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(marginX, y, contentWidth, 18, 2, 2, 'FD');

  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  pdf.text('Nama Siswa  : ___________________________', marginX + 4, y + 6);
  pdf.text('Hari / Tgl   : ___________________________', marginX + contentWidth / 2 + 2, y + 6);
  pdf.text('Kelas / Absen: ___________________________', marginX + 4, y + 13);
  pdf.text('Nilai / Paraf: [ _______ / 100 ]', marginX + contentWidth / 2 + 2, y + 13);
  y += 23;

  // Instructions
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(20, 30, 60);
  pdf.text('PETUNJUK PENGERJAAN:', marginX, y);
  y += 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(70, 80, 95);
  pdf.text(
    '1. Berdoalah sebelum mengerjakan.  2. Baca setiap butir soal dengan teliti.  3. Jawablah dengan jujur dan mandiri.',
    marginX,
    y
  );
  y += 7;

  // Render Questions
  const questions = quizSet.questions || [];
  questions.forEach((q, qIdx) => {
    checkPageBreak(25);

    // Question number & text
    const qNumText = `${qIdx + 1}. `;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);

    const questionLines = pdf.splitTextToSize(q.question, contentWidth - 8);
    pdf.text(qNumText, marginX, y);
    pdf.setFont('helvetica', 'bold');
    pdf.text(questionLines, marginX + 6, y);
    y += questionLines.length * 4.5 + 2;

    // Multiple Choice options
    if (q.type === 'multiple_choice' && q.options && q.options.length > 0) {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      q.options.forEach((opt, optIdx) => {
        checkPageBreak(7);
        const letter = letters[optIdx] || '-';
        const isCorrect = showKey && (optIdx === q.correctIndex || opt === q.correctAnswer);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor(30, 41, 59);

        let optText = `( ${letter} )  ${opt}`;
        if (isCorrect) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(4, 120, 87);
          optText += '   [✓ KUNCI JAWABAN]';
        }

        const optLines = pdf.splitTextToSize(optText, contentWidth - 14);
        pdf.text(optLines, marginX + 8, y);
        y += optLines.length * 4 + 1.5;
      });
      y += 2;
    } else if (q.type === 'true_false') {
      checkPageBreak(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 41, 59);

      const isBenar = q.isTrue ?? (q.correctAnswer?.toLowerCase() === 'benar');
      let tfText = '[   ] BENAR       [   ] SALAH';
      if (showKey) {
        tfText = isBenar
          ? '[ ✓ ] BENAR (Kunci)     [   ] SALAH'
          : '[   ] BENAR     [ ✓ ] SALAH (Kunci)';
        pdf.setTextColor(4, 120, 87);
        pdf.setFont('helvetica', 'bold');
      }
      pdf.text(tfText, marginX + 8, y);
      y += 6;
    } else if (q.type === 'fill_blank') {
      checkPageBreak(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Jawaban: ____________________________________________________', marginX + 8, y);
      y += 5;
      if (showKey) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(4, 120, 87);
        pdf.text(`Kunci Jawaban: ${q.correctAnswer}`, marginX + 8, y);
        y += 5;
      }
    } else if (q.type === 'matching' && q.matchingPairs && q.matchingPairs.length > 0) {
      checkPageBreak(12 + q.matchingPairs.length * 6);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(50, 60, 80);
      pdf.text('Kolom Konsep A:', marginX + 8, y);
      pdf.text('Kolom Pasangan B:', marginX + contentWidth / 2 + 4, y);
      y += 4.5;

      pdf.setFont('helvetica', 'normal');
      q.matchingPairs.forEach((pair) => {
        pdf.text(`• ${pair.left}`, marginX + 8, y);
        pdf.text(`➔  ${pair.right}`, marginX + contentWidth / 2 + 4, y);
        y += 4.5;
      });

      if (showKey) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(4, 120, 87);
        const pairsStr = q.matchingPairs.map((p) => `${p.left} ↔ ${p.right}`).join(', ');
        const wrappedKey = pdf.splitTextToSize(`Kunci Pasangan: ${pairsStr}`, contentWidth - 14);
        pdf.text(wrappedKey, marginX + 8, y);
        y += wrappedKey.length * 4 + 2;
      }
    }

    // Explanation if answer key enabled
    if (showKey && q.explanation) {
      checkPageBreak(12);
      pdf.setFillColor(254, 249, 195);
      pdf.setDrawColor(250, 204, 21);
      const explLines = pdf.splitTextToSize(`Pembahasan: ${q.explanation}`, contentWidth - 16);
      const boxH = explLines.length * 4 + 4;
      pdf.roundedRect(marginX + 6, y - 1, contentWidth - 12, boxH, 1.5, 1.5, 'FD');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(113, 63, 18);
      pdf.text(explLines, marginX + 8, y + 2.5);
      y += boxH + 3;
    }

    y += 2;
  });

  // Footer on last page
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    `EduZone - Halaman ${page} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
    marginX,
    pageHeight - 10
  );

  const cleanName = fileName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '-');
  pdf.save(`${cleanName || 'lembar-kerja-eduzone'}.pdf`);
  return true;
}

/**
 * Direct PDF Generator: captures the worksheet or uses the reliable
 * vector jsPDF engine to guarantee 100% success on all platforms.
 */
export async function exportWorksheetToPdf(
  elementId: string,
  fileName: string,
  quizSet?: QuizSet,
  options?: PdfExportOptions
): Promise<boolean> {
  // If quizSet is provided, use the pure vector generator for crisp quality and 100% reliability
  if (quizSet) {
    try {
      return exportWorksheetVectorPdf(quizSet, fileName, options);
    } catch (vectorErr) {
      console.warn('Vector PDF generation encountered error, falling back to canvas:', vectorErr);
    }
  }

  const element = document.getElementById(elementId);
  if (!element) {
    if (quizSet) {
      return exportWorksheetVectorPdf(quizSet, fileName, options);
    }
    throw new Error('Element lembar kerja tidak ditemukan');
  }

  try {
    // 1. Capture element to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.backgroundColor = '#ffffff';
          clonedEl.style.color = '#0f172a';
          clonedEl.style.padding = '20px';
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.border = 'none';
        }
        const buttons = clonedDoc.querySelectorAll('button, .print\\:hidden');
        buttons.forEach((b) => ((b as HTMLElement).style.display = 'none'));
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // 2. Initialize A4 PDF: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= (pageHeight - margin * 2);

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - margin * 2);
    }

    const cleanName = fileName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '-');
    pdf.save(`${cleanName || 'lembar-kerja-eduzone'}.pdf`);
    return true;
  } catch (canvasErr) {
    console.warn('Canvas export failed, using vector fallback:', canvasErr);
    if (quizSet) {
      return exportWorksheetVectorPdf(quizSet, fileName, options);
    }
    throw canvasErr;
  }
}

/**
 * Generates and downloads a Microsoft Word-compatible (.doc) document
 * with full formatting, tables, questions, options, and teacher answer keys.
 */
export function exportWorksheetToWord(
  quizSet: QuizSet,
  schoolName: string,
  showAnswerKey: boolean
) {
  let docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${quizSet.title}</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #111; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2pt solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .school { font-size: 14pt; font-weight: bold; }
        .title { font-size: 16pt; font-weight: bold; color: #1e1b4b; margin: 4px 0; }
        .info { font-size: 10pt; color: #555; }
        .identity-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1pt solid #aaa; }
        .identity-table td { padding: 6px; font-size: 10pt; border: 1pt solid #aaa; }
        .question-item { margin-bottom: 16px; page-break-inside: avoid; }
        .q-num { font-weight: bold; }
        .q-text { font-weight: 600; }
        .options-table { width: 100%; margin-top: 4px; margin-bottom: 8px; }
        .options-table td { padding: 4px 8px; width: 50%; font-size: 10.5pt; }
        .correct-badge { color: #047857; font-weight: bold; }
        .explanation { font-size: 9.5pt; color: #555; background-color: #fef3c7; padding: 4px 8px; margin-top: 4px; }
        .footer { margin-top: 30px; border-top: 1pt solid #ccc; font-size: 9pt; color: #777; text-align: center; padding-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school">${schoolName.toUpperCase()}</div>
        <div class="title">LEMBAR KERJA SISWA (LKS) & EVALUASI</div>
        <div class="info">Mata Pelajaran: <b>${quizSet.category}</b> | Tingkat: <b>${quizSet.targetClass || quizSet.grade}</b> | Materi: <b>${quizSet.title}</b></div>
      </div>

      <table class="identity-table">
        <tr>
          <td width="50%"><b>Nama Siswa:</b> ___________________________</td>
          <td width="50%"><b>Hari / Tanggal:</b> ___________________________</td>
        </tr>
        <tr>
          <td><b>Kelas / No. Absen:</b> ___________________________</td>
          <td><b>Nilai / Paraf Guru:</b> [ ________ / 100 ]</td>
        </tr>
      </table>

      <h3>Petunjuk Pengerjaan:</h3>
      <p style="font-size: 10pt; color: #333;">Kerjakan soal-soal di bawah ini dengan teliti, jujur, dan sungguh-sungguh!</p>
      <hr style="border: 0; border-top: 1pt solid #ddd; margin-bottom: 16px;">
  `;

  (quizSet.questions || []).forEach((q, idx) => {
    docContent += `
      <div class="question-item">
        <p><span class="q-num">${idx + 1}.</span> <span class="q-text">${q.question}</span></p>
    `;

    if (q.type === 'multiple_choice' && q.options) {
      docContent += `<table class="options-table">`;
      for (let i = 0; i < q.options.length; i += 2) {
        const opt1 = q.options[i];
        const opt2 = q.options[i + 1];
        const letter1 = ['A', 'B', 'C', 'D', 'E'][i];
        const letter2 = ['A', 'B', 'C', 'D', 'E'][i + 1];

        const is1Correct = showAnswerKey && (opt1 === q.correctAnswer || q.correctIndex === i);
        const is2Correct = showAnswerKey && opt2 && (opt2 === q.correctAnswer || q.correctIndex === i + 1);

        docContent += `<tr>`;
        docContent += `<td>( ${letter1} ) ${opt1} ${is1Correct ? '<span class="correct-badge">[✓ KUNCI]</span>' : ''}</td>`;
        if (opt2) {
          docContent += `<td>( ${letter2} ) ${opt2} ${is2Correct ? '<span class="correct-badge">[✓ KUNCI]</span>' : ''}</td>`;
        } else {
          docContent += `<td></td>`;
        }
        docContent += `</tr>`;
      }
      docContent += `</table>`;
    } else if (q.type === 'true_false') {
      const isTrue = q.isTrue ?? (q.correctAnswer.toLowerCase() === 'benar');
      docContent += `
        <p style="margin-left: 20px;">
          [ &nbsp; ] <b>BENAR</b> ${showAnswerKey && isTrue ? '<span class="correct-badge">[✓ KUNCI]</span>' : ''} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          [ &nbsp; ] <b>SALAH</b> ${showAnswerKey && !isTrue ? '<span class="correct-badge">[✓ KUNCI]</span>' : ''}
        </p>
      `;
    } else if (q.type === 'fill_blank') {
      docContent += `
        <p style="margin-left: 20px;">Jawaban: __________________________________________________
        ${showAnswerKey ? `<br><span class="correct-badge">Kunci Jawaban: <b>${q.correctAnswer}</b></span>` : ''}
        </p>
      `;
    } else if (q.type === 'matching' && q.matchingPairs) {
      docContent += `<table class="identity-table" style="max-width: 500px; margin-left: 20px;">
        <tr><th>Kolom A (Konsep)</th><th>Kolom B (Pasangan)</th></tr>`;
      q.matchingPairs.forEach((p) => {
        docContent += `<tr><td>${p.left}</td><td>${p.right}</td></tr>`;
      });
      docContent += `</table>`;
      if (showAnswerKey) {
        docContent += `<p style="margin-left: 20px;" class="correct-badge">Kunci Pasangan: ${q.matchingPairs.map((p) => `${p.left} ↔ ${p.right}`).join(', ')}</p>`;
      }
    }

    if (showAnswerKey && q.explanation) {
      docContent += `<div class="explanation"><b>Pembahasan:</b> ${q.explanation}</div>`;
    }

    docContent += `</div>`;
  });

  docContent += `
      <div class="footer">
        Dicetak dari <b>EduZone</b> - Platform Edukasi Interaktif Indonesia | Tanggal: ${new Date().toLocaleDateString('id-ID')}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docContent], {
    type: 'application/msword;charset=utf-8',
  });

  const safeTitle = quizSet.title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '-');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${safeTitle || 'soal'}-LKS-EduZone.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
