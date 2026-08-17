import PDFDocument from 'pdfkit';
import type { InvoiceData } from './service';
import { SITE_NAME } from '@/lib/public/site';

/**
 * Render a simple A4 tax invoice PDF from the stored invoice snapshot.
 * Uses "Rs." rather than the ₹ glyph, which isn't in PDFKit's standard fonts.
 */
export function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const money = (n: number) => `Rs. ${n.toFixed(2)}`;
    const date = new Date(data.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Header
    doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(20).text(SITE_NAME, 50, 50);
    doc.fillColor('#475569').font('Helvetica').fontSize(10).text('Tax Invoice');
    doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#e2e8f0').stroke();

    // Invoice meta
    doc.fillColor('#0f172a').fontSize(11);
    doc.text(`Invoice No: ${data.invoiceNumber}`, 50, 115);
    doc.text(`Date: ${date}`, 50, 132);

    // Billed to
    doc.font('Helvetica-Bold').text('Billed to', 50, 165);
    doc.font('Helvetica').fillColor('#334155');
    doc.text(data.studentName, 50, 182);
    doc.text(`Mobile: +91 ${data.studentMobile}`);
    if (data.studentEmail) doc.text(`Email: ${data.studentEmail}`);

    // Line-item header
    const tableTop = 250;
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11);
    doc.text('Description', 50, tableTop);
    doc.text('Amount', 400, tableTop, { width: 145, align: 'right' });
    doc.moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).strokeColor('#e2e8f0').stroke();

    // Line item
    const rowY = tableTop + 28;
    doc.font('Helvetica').fillColor('#334155');
    doc.text(data.testTitle, 50, rowY, { width: 330 });
    doc.text(money(data.subtotal), 400, rowY, { width: 145, align: 'right' });

    // Totals
    const totalsY = rowY + 50;
    const totalRow = (label: string, value: string, bold = false) => {
      const y = doc.y > totalsY ? doc.y : totalsY;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#0f172a');
      doc.text(label, 320, y, { width: 130, align: 'right' });
      doc.text(value, 450, y, { width: 95, align: 'right' });
      doc.moveDown(0.4);
    };
    doc.y = totalsY;
    totalRow('Subtotal', money(data.subtotal));
    totalRow(`GST (${data.gstRate}%)`, money(data.gstAmount)); // placeholder GST line
    doc.moveTo(320, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.3);
    totalRow('Total', money(data.total), true);

    // Footer notes
    doc.font('Helvetica').fillColor('#94a3b8').fontSize(8);
    doc.text(
      'GST is shown as a placeholder line and is currently 0%. Replace with your GSTIN and applicable rate before going live.',
      50,
      720,
      { width: 495 },
    );
    doc.text('This is a computer-generated invoice.', 50, 745);

    doc.end();
  });
}
