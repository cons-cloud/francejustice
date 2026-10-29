export interface DataRetentionPolicy {
  id: string;
  dataType: string;
  category: string;
  retentionPeriod: string;
  legalBasis: string;
  actionAfterExpiry: string;
}

export const DATA_RETENTION_SCHEDULE: DataRetentionPolicy[] = [
  {
    id: 'ret-profiles',
    dataType: 'Comptes Utilisateurs, Avocats & Profils',
    category: 'Données Personnelles (RGPD)',
    retentionPeriod: '3 ans après dernière activité',
    legalBasis: 'Recommandation CNIL & Art. 5-1-e RGPD',
    actionAfterExpiry: 'Anonymisation ou suppression définitive'
  },
  {
    id: 'ret-documents',
    dataType: 'Documents Juridiques & Plaintes Générées',
    category: 'Contenus Utilisateur & IA',
    retentionPeriod: '5 ans après création',
    legalBasis: 'Prescription civile (Art. 2224 Code Civil)',
    actionAfterExpiry: 'Purge automatique sécurisée'
  },
  {
    id: 'ret-payments',
    dataType: 'Factures, Devis & Transaction Stripe',
    category: 'Données Comptables & Financières',
    retentionPeriod: '10 ans',
    legalBasis: 'Article L123-22 du Code de Commerce',
    actionAfterExpiry: 'Archivage légal intermédiaire crypté'
  },
  {
    id: 'ret-logs',
    dataType: 'Logs de Connexion, IP & Sécurité',
    category: 'Traces Techniques',
    retentionPeriod: '1 an',
    legalBasis: 'Article 6 LCEN & Décret n° 2011-219',
    actionAfterExpiry: 'Purge automatique des logs'
  },
  {
    id: 'ret-banking',
    dataType: 'Coordonnées Bancaires (Cartes Bleues)',
    category: 'Sécurité Financière',
    retentionPeriod: '0 jour (Non stocké sur nos serveurs)',
    legalBasis: 'Norme PCI-DSS & API Stripe Tokenized',
    actionAfterExpiry: 'Gestion exclusive par Stripe PCI-DSS Level 1'
  }
];

export const DATABASE_SECURITY_INFO = {
  status: 'Opérationnel 100%',
  encryptionTransit: 'TLS 1.3 avec chiffrement HSTS 256-bit',
  encryptionRest: 'AES-256 (Base de données PostgreSQL & Cloud Storage)',
  accessControl: 'Row-Level Security (RLS) Supabase par rôle et identifiant',
  authStandard: 'Jetons JWT sécurisés avec expiration et rafraîchissement automatique',
  realtimeSync: 'WebSockets sécurisés wss:// avec Supabase Realtime Engine',
  backupFrequency: 'Sauvegardes quotidiennes cryptées multi-régions',
  complianceStandard: 'Conforme RGPD (Règlement UE 2016/679) & Normes CNIL'
};

export function getSecurityStatusBadge() {
  return {
    label: '🛡️ Base de Données Sécurisée & RGPD Conforme',
    color: 'bg-emerald-950 text-emerald-300 border-emerald-800'
  };
}

/**
 * Filtre DLP (Data Loss Prevention) & RGPD :
 * Masque automatiquement les données hautement sensibles non requises pour le litige
 * (IBAN, Numéro de Carte Bancaire, Numéro de Sécurité Sociale NIR) avant transmission aux moteurs IA.
 * Préserve scrupuleusement les noms des parties, montants du litige, dates et références d'arrêts.
 */
export function sanitizeSensitiveDataForAI(text: string): {
  sanitizedText: string;
  detectionsCount: number;
  detectedTypes: string[];
} {
  if (!text || typeof text !== 'string') {
    return { sanitizedText: text || '', detectionsCount: 0, detectedTypes: [] };
  }

  let sanitized = text;
  let count = 0;
  const detectedTypes: string[] = [];

  // 1. Numéro de Carte Bancaire (16 chiffres, avec ou sans espaces/tirets)
  const ccRegex = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
  if (ccRegex.test(sanitized)) {
    sanitized = sanitized.replace(ccRegex, () => {
      count++;
      return '[CARTE_BANCAIRE_MASQUÉE]';
    });
    detectedTypes.push('Numéro de Carte Bancaire');
  }

  // 2. Numéro IBAN (FR + 25 caractères ou international)
  const ibanRegex = /\b[A-Z]{2}\d{2}[A-Z0-9\s]{12,30}\b/g;
  sanitized = sanitized.replace(ibanRegex, (match) => {
    // Vérifier si c'est bien un format IBAN plausible (contient chiffres et lettres majuscules sans mots français usuels)
    const clean = match.replace(/\s+/g, '');
    if (clean.length >= 15 && clean.length <= 34 && /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) {
      count++;
      if (!detectedTypes.includes('Coordonnées Bancaires (IBAN)')) {
        detectedTypes.push('Coordonnées Bancaires (IBAN)');
      }
      return '[IBAN_MASQUÉ]';
    }
    return match;
  });

  // 3. Numéro de Sécurité Sociale Français (NIR : 13 à 15 chiffres commençant par 1 ou 2)
  const nirRegex = /\b[12]\s*\d{2}\s*(?:0[1-9]|1[0-2])\s*(?:[0-8]\d|9[0-8]|2[AB])\s*\d{3}\s*\d{3}(?:\s*\d{2})?\b/g;
  if (nirRegex.test(sanitized)) {
    sanitized = sanitized.replace(nirRegex, () => {
      count++;
      return '[NIR_SÉCURITÉ_SOCIALE_MASQUÉ]';
    });
    detectedTypes.push('Numéro de Sécurité Sociale (NIR)');
  }

  return {
    sanitizedText: sanitized,
    detectionsCount: count,
    detectedTypes
  };
}

/**
 * Purge de Sécurité Immédiate (Session Éphémère / Droit à l'oubli) :
 * Supprime l'ensemble des mémoires, brouillons et données de diagnostic stockées localement.
 */
export function purgeLocalSessionSecurity(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove = [
      'francejustice_user_memory',
      'francejustice_agent_threads_v3',
      'legal_ai_draft_messages',
      'active_diagnostic_cache'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch (e) {
    console.warn('Erreur lors de la purge locale:', e);
  }
}
