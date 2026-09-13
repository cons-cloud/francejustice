import React from 'react';

interface CleanLegalTextProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

/**
 * CleanLegalText: Formateur haute-fidélité pour les analyses juridiques de l'IA.
 * Supprime les astérisques bruts (**) et les tirets désordonnés (-),
 * applique du gras natif HTML (<strong>) avec typographie soignée,
 * et structure les listes à puces et étapes numérotées de manière élégante.
 */
export const CleanLegalText: React.FC<CleanLegalTextProps> = ({
  content,
  isUser = false,
  className = ''
}) => {
  if (!content) return null;

  // Découpe le texte en lignes et nettoie les sauts de lignes redondants
  const rawLines = content.split('\n');

  // Analyse et rendu d'une ligne avec mise en gras sans aucun astérisque
  const renderInline = (text: string, keyPrefix: string) => {
    // Si la ligne contient des marqueurs **texte**, on les découpe
    // Regex pour capturer **gras** ou __gras__
    const parts = text.split(/(\*\*.*?\*\*|__.*?__)/g);

    return parts.map((part, i) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        const cleanBold = part.slice(2, -2).replace(/\*/g, '').trim();
        return (
          <strong
            key={`${keyPrefix}-bold-${i}`}
            className={`font-black ${isUser ? 'text-white font-extrabold' : 'text-slate-950 font-black'}`}
          >
            {cleanBold}
          </strong>
        );
      }

      // Nettoie tout astérisque orphelin ou résiduel dans le texte normal
      const cleanNormal = part.replace(/\*/g, '');
      return <React.Fragment key={`${keyPrefix}-txt-${i}`}>{cleanNormal}</React.Fragment>;
    });
  };

  const renderedElements: React.ReactNode[] = [];
  let lineIdx = 0;

  while (lineIdx < rawLines.length) {
    const rawLine = rawLines[lineIdx];
    const trimmed = rawLine.trim();

    // Ligne vide -> Espacement contrôlé
    if (!trimmed) {
      lineIdx++;
      continue;
    }

    // 1. Détection des Titres de section (ex: ### Titre, ## Titre, # Titre, ou **TITRE :**)
    const headerMatch = trimmed.match(/^(?:#{1,4}\s+|(?:\*\*([A-Z0-9À-ÖØ-öø-ÿ\s:—–\-]{4,})\*\*)$)/);
    if (headerMatch || (trimmed.startsWith('###') || trimmed.startsWith('##'))) {
      const cleanTitle = trimmed
        .replace(/^#{1,4}\s*/, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .replace(/\*/g, '')
        .trim();

      renderedElements.push(
        <div key={`h-${lineIdx}`} className="pt-3 pb-1">
          <h4 className={`text-base sm:text-lg font-black tracking-tight flex items-center gap-2 ${isUser ? 'text-white' : 'text-cyan-950'}`}>
            <span className={`w-2 h-4 rounded-full inline-block ${isUser ? 'bg-white' : 'bg-cyan-600'}`} />
            <span>{cleanTitle}</span>
          </h4>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 2. Détection des Étapes numérotées (ex: 1. Étape, 2️⃣ Étape, 1/ Étape)
    const stepMatch = trimmed.match(/^(?:(\d+)[.)/-]\s+|([1-9]️⃣)\s*)(.*)/);
    if (stepMatch) {
      const stepNumber = stepMatch[1] || stepMatch[2];
      const stepBody = stepMatch[3] || '';

      renderedElements.push(
        <div key={`step-${lineIdx}`} className="flex items-start gap-3 my-2 pl-1">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-2xs ${
              isUser
                ? 'bg-white text-cyan-800'
                : 'bg-cyan-100 border border-cyan-300 text-cyan-950'
            }`}
          >
            {stepNumber}
          </span>
          <div className={`flex-1 text-sm sm:text-base leading-relaxed ${isUser ? 'text-white' : 'text-slate-800 font-medium'}`}>
            {renderInline(stepBody, `step-${lineIdx}`)}
          </div>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 3. Détection des Puces / Tirets (ex: - item, * item, • item, — item)
    const bulletMatch = trimmed.match(/^(?:[-*•—–]+|\+\s+)\s*(.*)/);
    if (bulletMatch) {
      const bulletBody = bulletMatch[1] || '';

      renderedElements.push(
        <div key={`bullet-${lineIdx}`} className="flex items-start gap-2.5 my-1.5 pl-2">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2.5 ${
              isUser ? 'bg-cyan-200' : 'bg-cyan-600'
            }`}
          />
          <div className={`flex-1 text-sm sm:text-base leading-relaxed ${isUser ? 'text-white' : 'text-slate-800 font-medium'}`}>
            {renderInline(bulletBody, `bullet-${lineIdx}`)}
          </div>
        </div>
      );
      lineIdx++;
      continue;
    }

    // 4. Paragraphe standard
    renderedElements.push(
      <p key={`p-${lineIdx}`} className={`text-sm sm:text-base leading-relaxed my-2 font-normal ${isUser ? 'text-white' : 'text-slate-800'}`}>
        {renderInline(trimmed, `p-${lineIdx}`)}
      </p>
    );

    lineIdx++;
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {renderedElements}
    </div>
  );
};

export default CleanLegalText;
