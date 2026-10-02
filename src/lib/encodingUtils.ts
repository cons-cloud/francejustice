/**
 * France Justice - Robust UTF-8 Encoding & Typography Normalizer
 * Repares degraded UTF-8 byte sequences (mojibake) and normalizes legal typography
 * across all AI modules (Agent IA, Diagnostic, Recherche, Base Légifrance, Assistant).
 */

/**
 * Répare les séquences d'octets UTF-8 corrompues ou décodées en Latin-1 / Windows-1252.
 */
export function fixUtf8Encoding(text: string): string {
  if (!text) return '';
  return text
    // Minuscules accentuées
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã«/g, 'ë')
    .replace(/Ã /g, 'à')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã®/g, 'î')
    .replace(/Ã¯/g, 'ï')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã¹/g, 'ù')
    .replace(/Ã»/g, 'û')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã§/g, 'ç')
    // Majuscules accentuées
    .replace(/Ã€/g, 'À')
    .replace(/Ã‰/g, 'É')
    .replace(/Ãˆ/g, 'È')
    .replace(/ÃŠ/g, 'Ê')
    .replace(/Ã‡/g, 'Ç')
    // Symboles monétaires, guillemets et tirets
    .replace(/â‚¬/g, '€')
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€\x9d/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€“/g, '–')
    .replace(/â€”/g, '—')
    .replace(/Â«/g, '«')
    .replace(/Â»/g, '»')
    .replace(/Â°/g, '°')
    .replace(/Â/g, '')
    .replace(/\u00A0/g, ' ');
}

/**
 * Nettoie et ordonne le texte IA : supprime les fuites de prompt, les blocs techniques JSON,
 * dé-échappe les sauts de ligne et garantit une présentation aérée et fluide.
 */
export function cleanAITypography(text: string): string {
  if (!text) return '';
  let cleaned = fixUtf8Encoding(text);

  // 1. Dé-échappement des sauts de ligne littéraux
  cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\r/g, '');

  // 2. Suppression des blocs d'action techniques (```action ... ``` ou ```json ... ```)
  cleaned = cleaned.replace(/```(?:action|json|javascript|ts)?[\s\S]*?```/gi, '');

  // 3. Suppression des résidus JSON de type {"type": "CREATE_DOCUMENT", ...}
  cleaned = cleaned.replace(/\{\s*"type"\s*:\s*"(?:CREATE_DOCUMENT|SWITCH_TAB)"[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/\{\s*"type"\s*:\s*"[^"]+"[\s\S]*?\}\s*\}?/gi, '');

  // 4. Suppression des fuites éventuelles d'instructions système ou de directives internes
  cleaned = cleaned.replace(/VOUS ÊTES L'AGENT IA D'ÉLITE FRANCE JUSTICE[\s\S]*?=== DEMANDE DE L'UTILISATEUR ===\n*/gi, '');
  cleaned = cleaned.replace(/=== INSTRUCTIONS SYSTÈME ===[\s\S]*?===\n*/gi, '');
  cleaned = cleaned.replace(/=== RÉSULTATS DES OUTILS EXÉCUTÉS PAR L'AGENT DANS CE RUN ===[\s\S]*?===\n*/gi, '');
  cleaned = cleaned.replace(/RÈGLES D'AFFICHAGE ET DE RIGUEUR :[\s\S]*$/gi, '');

  // 5. Nettoyage des backticks ou accolades orphelines en fin de texte
  cleaned = cleaned.replace(/```+\s*$/g, '').replace(/\}\s*$/g, '').trim();

  // 6. Normalisation des sauts de ligne consécutifs pour des paragraphes nets et bien aérés
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned;
}
