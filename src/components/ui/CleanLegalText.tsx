import React from 'react';

interface CleanLegalTextProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

/**
 * CleanLegalText: Formateur haute-fidélité pour les analyses juridiques de l'IA.
 * Supprime intégralement les artéfacts, blocs d'actions JSON, fuites de prompt,
 * échappements résiduels (\n---\n\n), astérisques orphelins (*),
 * et structure le texte avec une typographie ordonnée digne de ChatGPT, Gemini et Claude.
 */
import { cleanAITypography, fixUtf8Encoding } from '../../lib/encodingUtils';
export { fixUtf8Encoding };

export const CleanLegalText: React.FC<CleanLegalTextProps> = ({
  content,
  isUser = false,
  className = ''
}) => {
  if (!content) return null;

  // 1. Pré-nettoyage, décontamination du texte brut et réparation intégrale UTF-8
  const sanitized = cleanAITypography(content);

  // Découpage en lignes
  const rawLines = sanitized.split('\n');

  // Rendu en ligne sans aucun astérisque résiduel
  const renderInline = (text: string, keyPrefix: string) => {
    // Supprimer les dièses markdown résiduels
    const withoutHashes = text.replace(/#{1,6}\s*/g, '');

    // Découpage sur les blocs de gras (**...**) et d'italique (*...*)
    const parts = withoutHashes.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__)/g);

    return parts.map((part, i) => {
      // Bloc Gras : **texte** ou __texte__
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

      // Bloc Italique : *texte*
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
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

      // Texte standard : on élimine tout astérisque orphelin égaré
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

    // 1. Séparateur horizontal (--- ou ___ ou ***)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      renderedElements.push(
        <div key={`divider-${lineIdx}`} className="py-2.5">
          <hr className={`border-t ${isUser ? 'border-white/20' : 'border-slate-200'}`} />
        </div>
      );
      lineIdx++;
      continue;
    }

    // 2. Bloc de citation ou Sommation formelle (> ou >>>)
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

    // 3. Détection des Titres de section majeurs (ex: ### Titre, ## Titre, # Titre)
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

    // 4. Détection des Sous-titres isolés
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

    // 5. Détection des Étapes numérotées (ex: 1. Étape, 2. Étape)
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

    // 6. Détection des Puces / Tirets (ex: • item, - item, * item)
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

    // 7. Paragraphe standard ordonné
    renderedElements.push(
      <p key={`p-${lineIdx}`} className={`text-sm sm:text-base leading-relaxed my-2 font-normal ${isUser ? 'text-white' : 'text-slate-800'}`}>
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

