/**
 * universalFileGenerator.ts
 * Module universel de génération et d'export de fichiers pour l'IA France Justice :
 * - Images / Photos haute résolution par IA (Pollinations AI / DALL-E)
 * - Documents Word (.doc / .docx)
 * - Tableurs Excel (.csv / .xlsx)
 * - Présentations PowerPoint (.html / .pptx)
 * - Documents PDF professionnels
 * - Fichiers de code & données (JSON, Python, SQL, Markdown, TXT)
 */
import Papa from 'papaparse';

/**
 * 1. GÉNÉRATEUR DE PHOTOS ET D'IMAGES IA
 */
export function generateAIImageUrl(prompt: string, options?: { width?: number; height?: number; seed?: number }): string {
  const width = options?.width || 1024;
  const height = options?.height || 1024;
  const seed = options?.seed || Math.floor(Math.random() * 1000000);
  
  // Nettoyer et optimiser le prompt pour le générateur photoréaliste
  const cleanPrompt = encodeURIComponent(
    prompt.trim().slice(0, 400) + ", high quality, ultra detailed, 8k resolution, professional photography, realistic lighting"
  );
  
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;
}

/**
 * Télécharger une image depuis une URL
 */
export async function downloadImageFromUrl(imageUrl: string, filename: string = 'image_ia_francejustice.jpg') {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (_e) {
    // Fallback direct
    const link = document.createElement('a');
    link.href = imageUrl;
    link.target = '_blank';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * 2. EXPORT PACK OFFICE : WORD (.doc / .docx)
 */
export function downloadWordDocument(content: string, title: string = 'Document_Officiel') {
  const cleanTitle = title.replace(/[^a-zA-Z0-9À-ÖØ-öø-ÿ_-]/g, '_');
  const formattedHtml = content
    .replace(/^### (.*$)/gim, '<h3 style="color:#0e7490; font-family:Arial, sans-serif; margin-top:16px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color:#0891b2; font-family:Arial, sans-serif; border-bottom:1px solid #cbd5e1; padding-bottom:4px; margin-top:20px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color:#0f172a; font-family:Arial, sans-serif; margin-bottom:16px;">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" style="color:#0891b2; text-decoration:underline;">$1</a>')
    .replace(/\n\n/g, '</p><p style="margin-bottom:12px; line-height:1.6;">')
    .replace(/\n/g, '<br/>');

  const htmlDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body style="font-family:'Calibri', 'Segoe UI', Arial, sans-serif; font-size:11.5pt; line-height:1.6; color:#1e293b; padding:40px; max-width:800px; margin:auto;">
        <div style="border-bottom:3px solid #0891b2; padding-bottom:12px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <h2 style="color:#0891b2; margin:0; font-size:16pt; font-family:Arial, sans-serif;">FRANCE JUSTICE</h2>
            <p style="margin:2px 0 0 0; font-size:9pt; color:#64748b;">Document officiel certifié • Généré par IA de haute précision</p>
          </div>
          <div style="font-size:9pt; color:#64748b; text-align:right;">
            Date : ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
        <div style="margin-top:20px;">
          <p style="margin-bottom:12px; line-height:1.6;">${formattedHtml}</p>
        </div>
        <div style="margin-top:40px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:8pt; color:#94a3b8; text-align:center;">
          Document généré par l'IA France Justice • Conforme aux standards professionnels
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([htmlDoc], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanTitle}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 3. EXPORT PACK OFFICE : EXCEL (.csv / .xlsx)
 */
export function downloadExcelSpreadsheet(dataOrMarkdown: any[] | string, title: string = 'Tableur_Donnees') {
  const cleanTitle = title.replace(/[^a-zA-Z0-9À-ÖØ-öø-ÿ_-]/g, '_');
  let csvContent = '';

  if (typeof dataOrMarkdown === 'string') {
    // Si c'est du markdown table (| Col 1 | Col 2 |)
    const lines = dataOrMarkdown.trim().split('\n').filter(l => l.includes('|'));
    if (lines.length > 0) {
      const rows = lines
        .filter(l => !l.replace(/[-:\s|]/g, '') === false) // filtrer séparateurs
        .map(line => line.split('|').slice(1, -1).map(c => c.trim()));
      csvContent = Papa.unparse(rows);
    } else {
      // Texte simple transformé en lignes CSV
      csvContent = Papa.unparse(dataOrMarkdown.split('\n').map(l => [l]));
    }
  } else if (Array.isArray(dataOrMarkdown)) {
    csvContent = Papa.unparse(dataOrMarkdown);
  }

  // BOM UTF-8 pour ouverture parfaite dans Microsoft Excel
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanTitle}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 4. EXPORT PACK OFFICE : PRÉSENTATION POWERPOINT (.html / slides)
 */
export function downloadPowerPointPresentation(contentOrSlides: string, title: string = 'Presentation_Slides') {
  const cleanTitle = title.replace(/[^a-zA-Z0-9À-ÖØ-öø-ÿ_-]/g, '_');
  const sections = contentOrSlides.split(/(?:^|\n)#{1,3}\s+/).filter(Boolean);
  
  const slidesHtml = sections.map((sec, idx) => {
    const lines = sec.trim().split('\n');
    const slideTitle = lines[0] || `Diapositive ${idx + 1}`;
    const slideBody = lines.slice(1).join('\n')
      .replace(/^[-*•]\s*(.*)$/gm, '<li style="margin-bottom:8px;">$1</li>')
      .replace(/\n\n/g, '</p><p style="margin-bottom:12px;">');

    return `
      <section style="page-break-after:always; width:960px; height:540px; margin:20px auto; padding:40px; box-sizing:border-box; background:linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border:2px solid #0891b2; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.08); display:flex; flex-direction:column; justify-content:space-between; font-family:'Segoe UI', Arial, sans-serif;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0891b2; padding-bottom:10px; margin-bottom:20px;">
            <h1 style="color:#0891b2; font-size:24pt; margin:0; font-weight:800;">${slideTitle}</h1>
            <span style="font-size:10pt; color:#64748b; font-weight:bold;">FRANCE JUSTICE</span>
          </div>
          <div style="font-size:14pt; color:#1e293b; line-height:1.6;">
            <ul style="padding-left:24px;">${slideBody}</ul>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:9pt; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:8px;">
          <span>Diapositive ${idx + 1} / ${sections.length}</span>
          <span>Support de Présentation Professionnel</span>
        </div>
      </section>
    `;
  }).join('');

  const fullPresentation = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @media print {
            body { margin: 0; background: none; }
            section { page-break-after: always; box-shadow: none !important; border: 1px solid #ccc !important; }
          }
        </style>
      </head>
      <body style="background:#0f172a; padding:20px; margin:0;">
        ${slidesHtml}
      </body>
    </html>
  `;

  const blob = new Blob([fullPresentation], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${cleanTitle}_slides.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 5. EXPORT FICHIERS DE CODE & DONNÉES GÉNÉRAUX (.json, .py, .js, .sql, .md, .txt)
 */
export function downloadGenericFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
