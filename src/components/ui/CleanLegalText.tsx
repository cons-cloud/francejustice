import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Download, Maximize2, Loader2, Sparkles, FileSpreadsheet, X } from 'lucide-react';
import { cleanAITypography, fixUtf8Encoding } from '../../lib/encodingUtils';
import { downloadImageFromUrl, downloadExcelSpreadsheet, downloadGenericFile } from '../../lib/universalFileGenerator';
export { fixUtf8Encoding };

interface CleanLegalTextProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

/**
 * AIPhotoCard: Rendu interactif des photos & images générées par IA (style Midjourney / DALL-E / Gemini)
 * Supporte le chargement fluide, l'agrandissement plein écran (modal zoom) et le téléchargement HD.
 */
const AIPhotoCard: React.FC<{ alt: string; src: string }> = ({ alt, src }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cleanDescription = (alt || "Photo générée par IA").replace(/[*_#]/g, '').trim();

  const handleDownload = async () => {
    setDownloading(true);
    const filename = cleanDescription.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 30) || 'photo_ia';
    await downloadImageFromUrl(src, `${filename}.jpg`);
    setDownloading(false);
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 shadow-md">
      <div className="relative group overflow-hidden bg-slate-950 flex items-center justify-center min-h-[220px] max-h-[500px]">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-300 gap-2.5 z-10">
            <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
            <span className="text-xs font-medium">Génération / Chargement de l'image haute résolution...</span>
          </div>
        )}
        {error ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Impossible d'afficher l'aperçu. <a href={src} target="_blank" rel="noopener noreferrer" className="underline text-cyan-400">Ouvrir l'image originale</a>
          </div>
        ) : (
          <img
            src={src}
            alt={cleanDescription}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            className={`w-full max-h-[500px] object-contain transition-all duration-300 cursor-zoom-in group-hover:scale-[1.01] ${loading ? 'opacity-0' : 'opacity-100'}`}
            onClick={() => setIsZoomed(true)}
            loading="lazy"
          />
        )}
      </div>

      {/* Barre d'outils sous l'image */}
      <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-700 font-medium min-w-0 max-w-md">
          <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
          <span className="line-clamp-1 italic text-slate-800">{cleanDescription}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors cursor-pointer border border-cyan-200/80"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Téléchargement...' : 'Télécharger (.jpg)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Agrandir en plein écran"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Zoom plein écran */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-full cursor-pointer"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={src} alt={cleanDescription} className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" />
            <div className="mt-3 flex items-center gap-3">
              <span className="text-white text-xs font-medium max-w-md truncate">{cleanDescription}</span>
              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger HD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * CodeSnippet: Bloc de code syntaxique avec bouton copier et bouton de téléchargement de fichier source
 */
const CodeSnippet: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const getExtension = (lang?: string) => {
    const l = (lang || '').toLowerCase();
    if (l.includes('python') || l === 'py') return 'py';
    if (l.includes('javascript') || l === 'js') return 'js';
    if (l.includes('typescript') || l === 'ts') return 'ts';
    if (l.includes('html')) return 'html';
    if (l.includes('css')) return 'css';
    if (l.includes('json')) return 'json';
    if (l.includes('sql')) return 'sql';
    if (l.includes('sh') || l.includes('bash')) return 'sh';
    if (l.includes('markdown') || l === 'md') return 'md';
    return 'txt';
  };

  const handleDownload = () => {
    const ext = getExtension(language);
    downloadGenericFile(code, `code_source.${ext}`, 'text/plain');
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
        <span className="uppercase text-[11px] font-bold tracking-wider">{language || 'Code'}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Télécharger ce code directement dans un fichier"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>.{getExtension(language)}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié' : 'Copier'}</span>
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * MarkdownTable: Rendu réactif des tableaux markdown avec export Excel (.csv) et copie rapide
 */
const MarkdownTable: React.FC<{ headers: string[]; rows: string[][] }> = ({ headers, rows }) => {
  const [copied, setCopied] = useState(false);

  const handleExportExcel = () => {
    downloadExcelSpreadsheet([headers, ...rows], 'Tableau_Donnees_IA');
  };

  const handleCopyTable = () => {
    const tableText = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-200 shadow-2xs bg-white">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          Tableau de données
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyTable}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            title="Copier le tableau"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copié' : 'Copier'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
            title="Télécharger ce tableau au format Excel (.csv)"
          >
            <Download className="w-3 h-3" />
            <span>Excel (.csv)</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3.5 py-2.5 whitespace-nowrap">{h.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 text-slate-700">{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * CleanLegalText: Formateur haute-fidélité pour les analyses juridiques de l'IA.
 * Supprime intégralement les artéfacts, blocs d'actions JSON, fuites de prompt,
 * gère les liens externes cliquables, tableaux, blocs de code, et structure
 * le texte avec une typographie ordonnée digne de ChatGPT, Gemini et Claude.
 */
export const CleanLegalText: React.FC<CleanLegalTextProps> = ({
  content,
  isUser = false,
  className = ''
}) => {
  if (!content) return null;

  // 1. Pré-nettoyage et réparation intégrale UTF-8
  const sanitized = cleanAITypography(content);
  const rawLines = sanitized.split('\n');

  // Rendu en ligne enrichi (liens externes, URLs, gras, italique, inline code)
  const renderInline = (text: string, keyPrefix: string): React.ReactNode => {
    // Supprimer les dièses markdown orphelins
    const withoutHashes = text.replace(/#{1,6}\s*/g, '');

    // Tokenizer regex :
    // 1. Liens Markdown : [Texte](https://url)
    // 2. URLs brutes : https://... ou http://...
    // 3. Code inline : `...`
    // 4. Gras : **...** ou __...__
    // 5. Italique : *...* ou _..._
    const tokenRegex = /(\[(?:[^\]]+)\]\((?:https?:\/\/[^\s)]+)\)|https?:\/\/[^\s<)]+|`[^`]+`|\*\*[^*]+?\*\*|__[^_]+?__|\*[^*]+?\*|_[^_]+?_)/g;
    const parts = withoutHashes.split(tokenRegex);

    return parts.map((part, i) => {
      if (!part) return null;

      // 1. Liens Markdown [Texte](URL)
      const mdLinkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (mdLinkMatch) {
        const linkText = mdLinkMatch[1];
        const linkUrl = mdLinkMatch[2];
        return (
          <a
            key={`${keyPrefix}-link-${i}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 font-semibold underline underline-offset-2 transition-colors cursor-pointer ${
              isUser ? 'text-cyan-200 hover:text-white' : 'text-cyan-700 hover:text-cyan-900'
            }`}
            title={`Consulter la source officielle : ${linkUrl}`}
          >
            <span>{linkText}</span>
            <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-80" />
          </a>
        );
      }

      // 2. URLs brutes
      if (/^https?:\/\/[^\s<)]+$/.test(part)) {
        const displayUrl = part.replace(/^https?:\/\/(?:www\.)?/, '').slice(0, 36) + (part.length > 40 ? '...' : '');
        return (
          <a
            key={`${keyPrefix}-rawurl-${i}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 font-semibold underline underline-offset-2 transition-colors cursor-pointer ${
              isUser ? 'text-cyan-200 hover:text-white' : 'text-cyan-700 hover:text-cyan-900'
            }`}
            title={`Ouvrir le lien externe : ${part}`}
          >
            <span>{displayUrl}</span>
            <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-80" />
          </a>
        );
      }

      // 3. Code inline
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={`${keyPrefix}-code-${i}`}
            className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${
              isUser ? 'bg-white/20 text-white' : 'bg-slate-100 text-cyan-900 border border-slate-200'
            }`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // 4. Gras : **texte** ou __texte__
      if ((part.startsWith('**') && part.endsWith('**') && part.length > 4) ||
          (part.startsWith('__') && part.endsWith('__') && part.length > 4)) {
        const cleanBold = part.slice(2, -2).replace(/\*/g, '').trim();
        return (
          <strong
            key={`${keyPrefix}-b-${i}`}
            className={`font-semibold ${isUser ? 'text-white font-bold' : 'text-slate-900'}`}
          >
            {cleanBold}
          </strong>
        );
      }

      // 5. Italique : *texte* ou _texte_
      if ((part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
          (part.startsWith('_') && part.endsWith('_') && part.length > 2)) {
        const cleanItalic = part.slice(1, -1).replace(/\*/g, '').trim();
        return (
          <em
            key={`${keyPrefix}-em-${i}`}
            className={`italic ${isUser ? 'text-slate-100' : 'text-slate-700'}`}
          >
            {cleanItalic}
          </em>
        );
      }

      // Texte standard sans astérisques résiduels
      const cleanNormal = part.replace(/\*/g, '');
      return <React.Fragment key={`${keyPrefix}-t-${i}`}>{cleanNormal}</React.Fragment>;
    });
  };

  const renderedElements: React.ReactNode[] = [];
  let lineIdx = 0;

  while (lineIdx < rawLines.length) {
    const rawLine = rawLines[lineIdx];
    const trimmed = rawLine.trim();

    // Ligne vide -> saut de paragraphe aéré
    if (!trimmed) {
      lineIdx++;
      continue;
    }

    // 0. Image / Photo Markdown (![alt](url))
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/);
    if (imageMatch) {
      renderedElements.push(
        <AIPhotoCard key={`img-${lineIdx}`} alt={imageMatch[1]} src={imageMatch[2]} />
      );
      lineIdx++;
      continue;
    }

    // 1. Blocs de code (```language ... ```)
    if (trimmed.startsWith('```')) {
      const language = trimmed.replace(/^```/, '').trim();
      const codeLines: string[] = [];
      lineIdx++;
      while (lineIdx < rawLines.length && !rawLines[lineIdx].trim().startsWith('```')) {
        codeLines.push(rawLines[lineIdx]);
        lineIdx++;
      }
      if (lineIdx < rawLines.length && rawLines[lineIdx].trim().startsWith('```')) {
        lineIdx++; // Consommer le ``` fermant
      }
      renderedElements.push(
        <CodeSnippet key={`codeblock-${lineIdx}`} code={codeLines.join('\n')} language={language} />
      );
      continue;
    }

    // 2. Tableaux Markdown (| Col 1 | Col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = [];
      while (lineIdx < rawLines.length && rawLines[lineIdx].trim().startsWith('|') && rawLines[lineIdx].trim().endsWith('|')) {
        tableLines.push(rawLines[lineIdx].trim());
        lineIdx++;
      }

      if (tableLines.length >= 2) {
        const parseRow = (rowStr: string) => rowStr.split('|').slice(1, -1).map(c => c.trim());
        const headers = parseRow(tableLines[0]);
        // Ignorer la ligne de séparateurs |---|---| si présente
        const contentRowStartIndex = tableLines[1].replace(/[-:\s|]/g, '') === '' ? 2 : 1;
        const rows = tableLines.slice(contentRowStartIndex).map(parseRow);

        renderedElements.push(
          <MarkdownTable key={`table-${lineIdx}`} headers={headers} rows={rows} />
        );
        continue;
      }
    }

    // 3. Séparateur horizontal (--- ou ___ ou ***)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      renderedElements.push(
        <div key={`divider-${lineIdx}`} className="py-2.5">
          <hr className={`border-t ${isUser ? 'border-white/20' : 'border-slate-200'}`} />
        </div>
      );
      lineIdx++;
      continue;
    }

    // 4. Bloc de citation (> ou >>>)
    if (trimmed.startsWith('>') || trimmed.startsWith('>>>')) {
      const calloutText = trimmed.replace(/^>+\s*/, '');
      renderedElements.push(
        <div
          key={`callout-${lineIdx}`}
          className={`my-3 p-3.5 rounded-xl border-l-4 text-sm sm:text-base leading-relaxed ${
            isUser
              ? 'bg-white/10 border-white text-white'
              : 'bg-cyan-50/70 border-cyan-600 text-cyan-950 font-medium'
          }`}
        >
          {renderInline(calloutText, `callout-${lineIdx}`)}
        </div>
      );
      lineIdx++;
      continue;
    }

    // 5. Titres de section majeurs (# Titre, ## Titre, ### Titre)
    const isMarkdownHeader = /^#{1,6}\s+/.test(trimmed);
    const isNumberedSectionTitle = /^(?:[I|V|X]+\.|\d+\.)\s+[A-ZÀ-ÖØ-öø-ÿ\s:—–\-()'/.,!?]+$/.test(trimmed) && trimmed.length > 5;
    const isKnownSectionTitle = /^(?:1\.|2\.|3\.|4\.|5\.|Synthèse|Chronologie|Analyse juridique|Dispositif|Rapport|Examen|Visas|Décompte|Sommation|Plan d'action|Recommandations|Guide|Bordereau|Procédure)/i.test(trimmed.replace(/^[#*\s-]+/, ''));

    if (isMarkdownHeader || (isNumberedSectionTitle && isKnownSectionTitle)) {
      const cleanTitle = trimmed
        .replace(/^#{1,6}\s*/, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .replace(/\*/g, '')
        .trim();

      renderedElements.push(
        <div key={`h-${lineIdx}`} className="pt-3 pb-1">
          <h4 className={`text-base sm:text-lg font-bold tracking-tight flex items-center gap-2.5 ${isUser ? 'text-white' : 'text-slate-900'}`}>
            <span className={`w-1.5 h-4 rounded-full inline-block ${isUser ? 'bg-white' : 'bg-cyan-600'}`} />
            <span>{cleanTitle}</span>
          </h4>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 6. Sous-titres isolés
    const isStandaloneBoldHeader = /^\*\*[A-Za-z0-9À-ÖØ-öø-ÿ\s:—–\-()'/.,!?]+\*\*$/.test(trimmed) && trimmed.length > 5;
    if (isStandaloneBoldHeader) {
      const cleanSubTitle = trimmed
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .replace(/\*/g, '')
        .trim();

      renderedElements.push(
        <div key={`subh-${lineIdx}`} className="pt-2 pb-0.5">
          <h5 className={`text-sm sm:text-base font-semibold tracking-tight ${isUser ? 'text-white' : 'text-slate-900'}`}>
            {cleanSubTitle}
          </h5>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 7. Étapes numérotées (1. Étape)
    const stepMatch = trimmed.match(/^(\d+)[.)/-]\s+(.*)/);
    if (stepMatch) {
      const stepNumber = stepMatch[1];
      const stepBody = stepMatch[2];

      renderedElements.push(
        <div key={`step-${lineIdx}`} className="flex items-start gap-3 my-2 pl-0.5">
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
              isUser
                ? 'bg-white text-cyan-800'
                : 'bg-cyan-100 text-cyan-800'
            }`}
          >
            {stepNumber}
          </span>
          <div className={`flex-1 text-sm sm:text-base leading-relaxed ${isUser ? 'text-white' : 'text-slate-800'}`}>
            {renderInline(stepBody, `step-${lineIdx}`)}
          </div>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 8. Puces / Tirets (• item, - item)
    const bulletMatch = trimmed.match(/^(?:[-*•—–]+|\+\s+)\s*(.+)/);
    if (bulletMatch) {
      const bulletBody = bulletMatch[1];

      renderedElements.push(
        <div key={`bullet-${lineIdx}`} className="flex items-start gap-2.5 my-1.5 pl-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2.5 ${
              isUser ? 'bg-cyan-200' : 'bg-cyan-600'
            }`}
          />
          <div className={`flex-1 text-sm sm:text-base leading-relaxed ${isUser ? 'text-white' : 'text-slate-800'}`}>
            {renderInline(bulletBody, `bullet-${lineIdx}`)}
          </div>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 9. Paragraphe standard ordonné
    renderedElements.push(
      <p key={`p-${lineIdx}`} className={`text-sm sm:text-[15px] leading-relaxed my-2 font-normal ${isUser ? 'text-white' : 'text-slate-800'}`}>
        {renderInline(trimmed, `p-${lineIdx}`)}
      </p>
    );

    lineIdx++;
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {renderedElements}
    </div>
  );
};

export default CleanLegalText;
