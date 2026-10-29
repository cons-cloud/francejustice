/**
 * France Justice — Utilitaires Légers de Normalisation et Correspondance des Barreaux
 */

export function normalizeBarreau(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^barreau\s+(de\s+|d'|des\s+|du\s+)?/i, '')
    .replace(/[\(\)-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchBarreau(bar1?: string | null, bar2?: string | null): boolean {
  if (!bar1 || !bar2) return false;
  const n1 = normalizeBarreau(bar1);
  const n2 = normalizeBarreau(bar2);
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}
