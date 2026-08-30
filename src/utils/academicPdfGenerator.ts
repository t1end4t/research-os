import { jsPDF } from 'jspdf';
import { PaperDoc } from '../types';

/**
 * Generates an authentic academic publication PDF document from PaperDoc data.
 * Returns a Uint8Array containing the binary PDF.
 */
export function generateAcademicPdf(paper: PaperDoc): Uint8Array {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const margin = 46;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const addNewPage = () => {
    doc.addPage();
    cursorY = margin + 20;
    drawHeaderFooter();
  };

  const drawHeaderFooter = () => {
    const pageNumber = doc.internal.pages.length - 1;
    // Header (skip on page 1)
    if (pageNumber > 1) {
      doc.setFont('times', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `${paper.authors.split('&')[0].trim()} et al. • ${paper.title.slice(0, 48)}...`,
        margin,
        margin - 10
      );
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, margin - 5, pageWidth - margin, margin - 5);
    }

    // Footer on all pages
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
    doc.text('Instrument Epistemic Graph Reader', pageWidth - margin, pageHeight - 25, { align: 'right' });
  };

  // --- Page 1 Header ---
  // Top metadata banner
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(paper.citation.toUpperCase(), margin, cursorY);
  cursorY += 12;

  doc.setDrawColor(30, 30, 30);
  doc.setLineWidth(1.2);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 24;

  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize(paper.title, contentWidth);
  doc.text(titleLines, margin, cursorY);
  cursorY += titleLines.length * 22 + 8;

  // Authors
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(paper.authors, margin, cursorY);
  cursorY += 16;

  // Publication info
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(110, 110, 110);
  doc.text(`Published ${paper.year} • Document ID: ${paper.id}`, margin, cursorY);
  cursorY += 22;

  // Abstract Box
  if (paper.abstract) {
    const abstractBoxY = cursorY;
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text('ABSTRACT', margin + 14, cursorY + 16);

    doc.setFont('times', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    const abstractLines = doc.splitTextToSize(paper.abstract, contentWidth - 28);
    doc.text(abstractLines, margin + 14, cursorY + 30);

    const abstractHeight = 36 + abstractLines.length * 13;
    // Draw subtle box border & background
    doc.setFillColor(248, 248, 248);
    doc.rect(margin, abstractBoxY, contentWidth, abstractHeight, 'F');
    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.75);
    doc.rect(margin, abstractBoxY, contentWidth, abstractHeight, 'S');

    // Re-draw text on top of filled rect
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text('ABSTRACT', margin + 14, abstractBoxY + 16);
    doc.setFont('times', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(50, 50, 50);
    doc.text(abstractLines, margin + 14, abstractBoxY + 30);

    cursorY = abstractBoxY + abstractHeight + 24;
  }

  // --- Two-Column / Section Layout ---
  const colGap = 20;
  const colWidth = (contentWidth - colGap) / 2;
  let currentCol = 0; // 0 = left, 1 = right
  let colY = cursorY;
  const colTopY = cursorY;

  for (const sec of paper.sections) {
    // Section Heading
    const headingHeight = 28;
    if (colY + headingHeight > pageHeight - margin - 40) {
      if (currentCol === 0) {
        currentCol = 1;
        colY = colTopY;
      } else {
        addNewPage();
        currentCol = 0;
        colY = margin + 20;
      }
    }

    const colX = margin + currentCol * (colWidth + colGap);

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(sec.heading.toUpperCase(), colX, colY);
    colY += 6;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(colX, colY, colX + colWidth, colY);
    colY += 14;

    // Paragraphs
    for (const par of sec.paragraphs) {
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(35, 35, 35);

      const lines = doc.splitTextToSize(par.text, colWidth);
      const parHeight = lines.length * 13.5 + 8;

      if (colY + parHeight > pageHeight - margin - 40) {
        if (currentCol === 0) {
          currentCol = 1;
          colY = colTopY;
        } else {
          addNewPage();
          currentCol = 0;
          colY = margin + 20;
        }
      }

      const activeColX = margin + currentCol * (colWidth + colGap);

      // Highlight bar if linked to a claim
      if (par.linkedClaimId) {
        doc.setFillColor(235, 248, 242);
        doc.rect(activeColX - 3, colY - 9, colWidth + 6, lines.length * 13.5 + 4, 'F');
        doc.setFillColor(16, 185, 129);
        doc.rect(activeColX - 4, colY - 9, 2.5, lines.length * 13.5 + 4, 'F');
      }

      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(35, 35, 35);
      doc.text(lines, activeColX, colY);
      colY += lines.length * 13.5 + 10;
    }
    colY += 8;
  }

  // Draw footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(130, 130, 130);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
    doc.text('Instrument • Epistemic Research Reader', pageWidth - margin, pageHeight - 25, { align: 'right' });
  }

  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}
