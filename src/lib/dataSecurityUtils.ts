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
