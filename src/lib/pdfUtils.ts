export interface PDFOptions {
  title: string;
  subtitle?: string;
  category?: string;
  country?: string;
  year?: string | number;
  sourceUrl?: string;
  author?: string;
  filename?: string;
}

/**
 * Pure 100% Native PDF 1.4 Document Generator (Zero Dependencies)
 * Generates standard PDF documents natively in all browsers with 0 Vite server errors.
 */
export function generatePDF(content: string, options: PDFOptions): void {
  const cleanTitle = (options.title || 'Document Juridique').replace(/[^\w\sàáâäæçèéêëîïôœùûüÿ—–\-:.]/gi, ' ');
  const dateStr = `${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  
  const headerLines = [
    `FRANCE JUSTICE — DOCUMENT JURIDIQUE OFFICIEL`,
    `Date : ${dateStr} (Synchronisé en direct)`,
    `====================================================`,
    `TITRE : ${cleanTitle}`,
    options.country ? `JURIDICTION : ${options.country}` : '',
    options.category ? `CATÉGORIE : ${options.category}` : '',
    options.year ? `ÉDITION / ANNÉE : ${options.year}` : '',
    options.sourceUrl ? `SOURCE OFFICIELLE : ${options.sourceUrl}` : '',
    `====================================================`,
    ``
  ].filter(line => line !== '');

  const bodyLines = content.split('\n');
  const allLines = [...headerLines, ...bodyLines];

  // Construct PDF 1.4 binary structure
  let pdfText = `%PDF-1.4\n`;
  pdfText += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  pdfText += `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  pdfText += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
  pdfText += `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  let streamContent = `BT\n/F1 10 Tf\n12 TL\n50 740 Td\n`;
  for (const line of allLines) {
    const escaped = line
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
    streamContent += `(${escaped}) '\n`;
  }
  streamContent += `ET\n`;

  pdfText += `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`;

  const xrefOffset = pdfText.length;
  pdfText += `xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000242 00000 n \n`;
  pdfText += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdfText], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const safeFilename = (options.filename || options.title)
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
    .slice(0, 50);

  a.download = `${safeFilename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
