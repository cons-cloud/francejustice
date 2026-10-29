/**
 * France Justice — Gestionnaire Léger des Utilisateurs Supprimés
 * Stocke et vérifie les emails des utilisateurs supprimés sans charger les datasets volumineux.
 */

const STORAGE_KEY = 'francejustice_deleted_emails';

export function getDeletedUserEmails(): Set<string> {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {
    console.error('Erreur lecture deleted_emails:', e);
  }
  return new Set<string>();
}

export function registerDeletedUser(email?: string): void {
  if (!email || typeof window === 'undefined') return;
  const set = getDeletedUserEmails();
  set.add(email.toLowerCase());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Erreur écriture deleted_emails:', e);
  }
}
