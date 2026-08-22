import PDFDocument from 'pdfkit';
import { SITE_NAME } from '@/lib/public/site';
import { formatDuration, round1 } from '@/lib/attempts/analysis';
import { resolveTamilFonts } from './fonts';
import type { ResultReport } from './result-report';

/**
 * Render an A4 PDF report of a result: bilingual header, score summary and
 * subject/chapter analysis — clean enough to show a parent. Tamil lines render
 * only when a Tamil font is available (see resolveTamilFonts); otherwise the
 * report is English-only.
 */

const BRAND = '#dc2626';
const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#e2e8f0';

const STRENGTH_COLOR = { strong: '#16a34a', average: '#d97706', weak: '#dc2626' } as const;

const LEFT = 50;
const RIGHT = 545;

export function generateResultPdf(report: ResultReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Register a Tamil font if one is available.
    let hasTamil = false;
    const tamil = resolveTamilFonts();
    if (tamil) {
      try {
        doc.registerFont('Tamil', tamil.regular.path, tamil.regular.family);
        doc.registerFont('Tamil-Bold', tamil.bold.path, tamil.bold.family);
        hasTamil = true;
      } catch {
        hasTamil = false;
      }
    }
    const ta = (s: string, font: 'Tamil' | 'Tamil-Bold', size: number, color = MUTED) => {
      if (!hasTamil) return;
      doc.font(font).fontSize(size).fillColor(color).text(s);
    };

    const rule = (y: number) => doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor(LINE).stroke();
    const s = report.summary;

    // ---- Header (bilingual) ------------------------------------------------
    doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(20).text(SITE_NAME, LEFT, 46);
    doc.fillColor(MUTED).font('Helvetica').fontSize(10).text('Performance Report');
    ta('செயல்திறன் அறிக்கை', 'Tamil', 11, MUTED);
    rule(doc.y + 6);
    doc.moveDown(0.8);

    // ---- Meta --------------------------------------------------------------
    const metaY = doc.y;
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text(report.testTitle.en, LEFT, metaY, { width: 340 });
    if (hasTamil && report.testTitle.ta) {
      doc.font('Tamil').fontSize(10).fillColor(MUTED).text(report.testTitle.ta, LEFT, doc.y, { width: 340 });
    }
    doc.font('Helvetica').fontSize(10).fillColor(MUTED);
    const dateStr = report.submittedAt
      ? new Date(report.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    doc.text(`Student: ${report.studentName}`, 380, metaY, { width: 165, align: 'right' });
    doc.text(`Date: ${dateStr}`, 380, doc.y, { width: 165, align: 'right' });
    if (report.status === 'AUTO_SUBMITTED') doc.text('Auto-submitted', 380, doc.y, { width: 165, align: 'right' });

    doc.moveDown(1.5);

    // ---- Score summary -----------------------------------------------------
    let y = Math.max(doc.y, metaY + 60);
    doc.roundedRect(LEFT, y, RIGHT - LEFT, 88, 8).fillAndStroke('#f8fafc', LINE);
    doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(11).text('Score Summary', LEFT + 16, y + 12);
    ta('மதிப்பெண் சுருக்கம்', 'Tamil', 9, MUTED);

    doc.fillColor(BRAND).font('Helvetica-Bold').fontSize(30).text(`${s.score}`, LEFT + 16, y + 34);
    doc.fillColor(MUTED).font('Helvetica').fontSize(10).text(`out of ${s.maxScore}  ·  ${s.percentage}%`, LEFT + 16, y + 68);

    const cells: [string, string][] = [
      ['Questions', `${s.totalQuestions}`],
      ['Correct', `${s.correct}`],
      ['Wrong', `${s.wrong}`],
      ['Skipped', `${s.skipped}`],
      ['Accuracy', `${round1(s.accuracy)}%`],
      ['Time', formatDuration(s.timeTakenSeconds)],
    ];
    let cx = LEFT + 150;
    const cw = (RIGHT - (LEFT + 150)) / 3;
    cells.forEach(([label, value], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = cx + col * cw;
      const cyy = y + 20 + row * 34;
      doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(label.toUpperCase(), x, cyy, { width: cw - 6 });
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(13).text(value, x, cyy + 10, { width: cw - 6 });
    });
    void cx;

    doc.y = y + 104;

    // ---- Subject analysis --------------------------------------------------
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text('Subject Analysis', LEFT, doc.y);
    ta('பாட பகுப்பாய்வு', 'Tamil', 9, MUTED);
    doc.moveDown(0.4);

    const cols = { subject: LEFT, attempted: 250, correct: 330, accuracy: 400, marks: 470 };
    let ty = doc.y;
    doc.fontSize(9).fillColor(MUTED).font('Helvetica-Bold');
    doc.text('SUBJECT', cols.subject, ty);
    doc.text('ATT.', cols.attempted, ty, { width: 60, align: 'right' });
    doc.text('CORR.', cols.correct, ty, { width: 50, align: 'right' });
    doc.text('ACC.', cols.accuracy, ty, { width: 50, align: 'right' });
    doc.text('MARKS', cols.marks, ty, { width: 75, align: 'right' });
    rule(ty + 14);
    ty += 20;

    doc.font('Helvetica').fontSize(10).fillColor(INK);
    for (const row of report.subjects) {
      doc.fillColor(INK).text(row.name.en, cols.subject, ty, { width: 190 });
      doc.fillColor('#334155');
      doc.text(`${row.attempted}`, cols.attempted, ty, { width: 60, align: 'right' });
      doc.text(`${row.correct}`, cols.correct, ty, { width: 50, align: 'right' });
      doc.text(`${round1(row.accuracy)}%`, cols.accuracy, ty, { width: 50, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(INK).text(`${row.marks}`, cols.marks, ty, { width: 75, align: 'right' });
      doc.font('Helvetica');
      ty += 18;
    }
    doc.y = ty + 6;

    // ---- Chapter analysis --------------------------------------------------
    if (report.chapters.length > 0) {
      if (doc.y > 700) doc.addPage();
      doc.fillColor(INK).font('Helvetica-Bold').fontSize(12).text('Chapter Analysis', LEFT, doc.y);
      ta('அத்தியாய பகுப்பாய்வு', 'Tamil', 9, MUTED);
      doc.font('Helvetica').fontSize(8).fillColor(MUTED).text('Strong >= 70%   Average 40-69%   Weak < 40%', LEFT, doc.y + 2);
      doc.moveDown(0.6);

      for (const c of report.chapters) {
        if (doc.y > 760) doc.addPage();
        const cy = doc.y;
        const color = STRENGTH_COLOR[c.strength];
        doc.roundedRect(LEFT, cy, 8, 8, 2).fill(color);
        doc.fillColor(INK).font('Helvetica').fontSize(10).text(c.name.en, LEFT + 16, cy - 1, { width: 300 });
        doc.fillColor(MUTED).fontSize(9).text(`${c.subjectCode} · ${c.correct}/${c.attempted}`, 330, cy - 1, { width: 120 });
        doc.fillColor(color).font('Helvetica-Bold').fontSize(10).text(`${round1(c.accuracy)}%`, 470, cy - 1, { width: 75, align: 'right' });
        doc.moveDown(0.9);
      }
    }

    // ---- Footer ------------------------------------------------------------
    doc.font('Helvetica').fillColor('#94a3b8').fontSize(8);
    doc.text('This is a computer-generated report from SIVORA UPRISING.', LEFT, 800, { width: 495, align: 'center' });

    doc.end();
  });
}
