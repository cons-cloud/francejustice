-- =============================================================================
-- SEED : Formations & Outils pour la plateforme France Justice
-- À exécuter dans l'éditeur SQL Supabase :
-- https://supabase.com/dashboard/project/zchhijltemvrsthdaxex/sql
-- =============================================================================

-- ─── FORMATIONS ──────────────────────────────────────────────────────────────
INSERT INTO public.formations_just (title, duration, level, category, status)
VALUES
  ('Introduction au droit des contrats', '3h 00', 'Débutant', 'Droit des Contrats', 'Publié'),
  ('Techniques de négociation en contentieux', '4h 30', 'Intermédiaire', 'Contentieux', 'Publié'),
  ('Droit du travail : licenciements et procédures', '5h 00', 'Intermédiaire', 'Droit Social', 'Publié'),
  ('Protection des données personnelles (RGPD)', '2h 30', 'Débutant', 'Droit Numérique', 'Publié'),
  ('Rédaction d''actes juridiques professionnels', '6h 00', 'Avancé', 'Pratique Juridique', 'Publié'),
  ('Droit pénal des affaires', '4h 00', 'Avancé', 'Droit Pénal', 'Publié'),
  ('Propriété intellectuelle et brevets', '3h 30', 'Intermédiaire', 'Propriété Intellectuelle', 'Publié'),
  ('Arbitrage et médiation commerciale', '4h 00', 'Avancé', 'Résolution des Conflits', 'Publié'),
  ('Fiscalité des entreprises pour avocats', '3h 00', 'Intermédiaire', 'Droit Fiscal', 'Publié'),
  ('Gestion déontologique du cabinet', '2h 00', 'Débutant', 'Déontologie', 'Publié'),
  ('Droit des successions et libéralités', '3h 30', 'Intermédiaire', 'Droit Civil', 'Publié'),
  ('Contentieux administratif et recours', '4h 00', 'Avancé', 'Droit Administratif', 'Publié');

-- ─── OUTILS ──────────────────────────────────────────────────────────────────
INSERT INTO public.outils_just (title, category, status)
VALUES
  ('Générateur de Contrats IA', 'Intelligence Artificielle', 'Actif'),
  ('Calculateur d''Honoraires', 'Gestion Cabinet', 'Actif'),
  ('Base de Jurisprudence Annotée', 'Recherche Juridique', 'Actif'),
  ('Assistant de Rédaction Légale', 'Intelligence Artificielle', 'Actif'),
  ('Agenda Judiciaire Synchronisé', 'Gestion Cabinet', 'Actif'),
  ('Suivi des Délais de Prescription', 'Procédures', 'Actif'),
  ('Bibliothèque de Modèles d''Actes', 'Documentation', 'Actif'),
  ('Analyseur de Clauses Contractuelles', 'Intelligence Artificielle', 'En Test'),
  ('Gestion Électronique des Dossiers', 'Gestion Cabinet', 'Actif'),
  ('Veille Juridique Automatisée', 'Recherche Juridique', 'En Test'),
  ('Simulateur de Pensions Alimentaires', 'Droit de la Famille', 'Actif'),
  ('Outil d''Anonymisation de Documents', 'Conformité', 'Actif');

-- ─── VÉRIFICATION ─────────────────────────────────────────────────────────────
SELECT 'formations_just' AS table_name, COUNT(*) AS rows FROM public.formations_just
UNION ALL
SELECT 'outils_just', COUNT(*) FROM public.outils_just;
