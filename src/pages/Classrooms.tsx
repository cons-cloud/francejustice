import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  Video, Users, Search, BookOpen, Clock,
  Tv, User, Loader2, Download, CheckCircle2, X, Sparkles
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import JitsiMeeting from "../components/features/JitsiMeeting";
import { useTranslation } from "../i18n";
import { generatePDF } from "../lib/pdfUtils";
import { AnnualPlanning } from "../components/features/AnnualPlanning";
import { filterActiveSessions } from "../lib/classroomUtils";
import {
  type FormationAttachment,
  exportAttachmentFile,
  exportAllAttachments,
  getFormationAttachments
} from "../lib/formationAttachmentUtils";

interface CurriculumSection {
  title: string;
  content: string;
}

interface Classroom {
  id: string;
  title: string;
  description: string;
  type: "direct" | "differe" | "video";
  video_url?: string;
  lawyer_id: string;
  scheduled_at?: string;
  date?: string;
  time?: string;
  duration_minutes: number;
  max_members: number;
  created_at: string;
  lawyer_first_name?: string;
  lawyer_last_name?: string;
  curriculum?: CurriculumSection[];
  category?: string;
  attachments?: FormationAttachment[];
}

const getRichDescription = (title: string, currentDesc?: string): string => {
  if (currentDesc && currentDesc.trim().length > 0) {
    return currentDesc;
  }
  if (t.includes('contrat')) {
    return "Formation académique et professionnelle d'excellence dédiée à la pratique des contrats civils et commerciaux. Cette masterclass aborde la négociation précontractuelle, la rédaction des clauses à hauts risques (responsabilité, pénalités, force majeure), l'analyse des viciations du consentement et la gestion stratégique des inexécutions et des résiliations unilatérales ou judiciaires.";
  }
  if (t.includes('contentieux') || t.includes('litige') || t.includes('procédure')) {
    return "Programme intensif de stratégie judiciaire et de pratique contentieuse devant le Tribunal Judiciaire et le Tribunal de Commerce. Couvre la préparation des mises en demeure précontentieuses, le respect des préalables amiables obligatoires (Art. 750-1 CPC), la rédaction d'assignations percutantes, la mise en état et la constitution du dossier de plaidoirie pour convaincre le juge.";
  }
  if (t.includes('travail') || t.includes('social') || t.includes('prud\'homme')) {
    return "Cycle complet de perfectionnement en droit du travail et contentieux prud'homal. Décodage approfondi de la relation de subordination, de la rédaction des clauses contractuelles sensibles (non-concurrence, mobilité), de la sécurisation des procédures de licenciement (motif personnel et économique) et de la défense devant le Bureau de Conciliation et d'Orientation (BCO) et de Jugement (BJ).";
  }
  if (t.includes('rgpd') || t.includes('données') || t.includes('numérique') || t.includes('data')) {
    return "Masterclass officielle de mise en conformité RGPD (Règlement UE 2016/679) et gouvernance des données. Apprenez à élaborer le registre des traitements (Art. 30), piloter les Analyses d'Impact (AIPD), contractualiser avec les sous-traitants (Art. 28), gérer les violations de données sous 72h auprès de la CNIL et traiter l'exercice des droits citoyens (droit à l'oubli).";
  }
  if (t.includes('famille') || t.includes('divorce') || t.includes('enfant')) {
    return "Enseignement spécialisé en droit de la famille, régimes matrimoniaux et protection des mineurs. Analyse méthodique du divorce par consentement mutuel sous seing privé par acte d'avocat déposé chez notaire, des divorces contentieux devant le JAF, du calcul des prestations compensatoires (Art. 270 Code civil) et des modalités de l'autorité parentale et des pensions alimentaires.";
  }
  if (t.includes('droits humains') || t.includes('cedh') || t.includes('liberté') || t.includes('international')) {
    return "Formation de haut niveau consacrée aux libertés fondamentales et au contentieux européen des droits de l'Homme. Maîtrise des garanties de la DUDH et de la Convention Européenne, application du droit au procès équitable (Article 6 CEDH), respect des conditions d'admissibilité des requêtes individuelles et procédure de saisine de la Cour de Strasbourg (HUDOC).";
  }
  return "Formation juridique complète dispensée par des avocats spécialisés du barreau. Ce programme associe théorie universitaire rigoureuse, analyse d'arrêts majeurs de jurisprudence, études de cas pratiques et remise d'un support pédagogique téléchargeable 100% en PDF.";
};

const getRichCurriculum = (title: string, existingCurriculum?: CurriculumSection[], customDesc?: string): CurriculumSection[] => {
  if (existingCurriculum && existingCurriculum.length >= 3 && existingCurriculum[0].content.length > 100) {
    return existingCurriculum;
  }
  const t = (title || '').toLowerCase();
  const customFirstModuleContent = (customDesc && customDesc.trim().length > 0)
    ? customDesc
    : `Présentation synthétique des objectifs pédagogiques et du cadre juridique de : ${title}.`;
  
  if (t.includes('contrat')) {
    return [
      {
        title: "Module 1 : Principes cardinaux, consentement et validité (Art. 1128 du Code Civil)",
        content: "Un contrat est un accord de volontés entre deux ou plusieurs personnes destiné à créer, modifier, transmettre ou éteindre des obligations. Conformément à l'article 1128 du Code civil français, la validité exige trois conditions cumulatives : le consentement libre et éclairé des parties, leur capacité juridique de contracter, et un contenu licite et certain. La rencontre de l'offre et de l'acceptation fixe irrévocablement le lien contractuel."
      },
      {
        title: "Module 2 : Les clauses contractuelles clés et la gestion des risques",
        content: "La rédaction contractuelle requiert une rigueur absolue. Les clauses limitatives ou exonératoires de responsabilité encadrent l'indemnisation financière (sans pouvoir vider l'obligation essentielle de sa substance, jurisprudence Chronopost/Faurecia). La clause pénale (Art. 1231-5) détermine à l'avance les dommages-intérêts en cas d'inexécution. La clause de force majeure (Art. 1218) définit les critères d'imprévisibilité, d'irrésistibilité et d'extériorité."
      },
      {
        title: "Module 3 : Inexécution contractuelle, résolution et voies de recours (Art. 1217)",
        content: "En cas de manquement d'une partie, le créancier dispose d'un panel de sanctions graduées : l'exception d'inexécution (Art. 1219), l'exécution forcée en nature (Art. 1221), la réduction du prix (Art. 1223), la résolution unilatérale par notification après mise en demeure (Art. 1226), ou la résolution judiciaire (Art. 1227) assortie de dommages-intérêts réparateurs."
      },
      {
        title: "Module 4 : Cas pratique de synthèse & Grille d'audit contractuel",
        content: "Analyse méthodologique d'un contrat commercial type (prestations de services, bail commercial, fourniture). Identification des failles de rédaction, sécurisation des délais de paiement, clauses d'attribution de juridiction et conditions de résiliation anticipée."
      }
    ];
  }
  if (t.includes('contentieux') || t.includes('litige') || t.includes('procédure')) {
    return [
      {
        title: "Module 1 : Phase précontentieuse & Préalable amiable obligatoire (Art. 750-1 CPC)",
        content: "Avant toute action en justice, l'avocat doit vérifier les préalables obligatoires de conciliation, médiation ou procédure participative. La lettre de mise en demeure rédigée par avocat formalise la réclamation juridique, fait courir les intérêts moratoires (Art. 1344 Code civil) et fixe un dernier délai de conformité exécutoire."
      },
      {
        title: "Module 2 : Stratégies de procédure, rédaction d'assignation & Signification",
        content: "Détermination de la compétence matérielle et territoriale (Tribunal judiciaire, Tribunal de commerce, JDJ). Rédaction rigoureuse de l'assignation énonçant les faits, le bordereau de pièces et les moyens en droit. Signification obligatoire par commissaire de justice (huissier) et placement au greffe dans les délais légaux."
      },
      {
        title: "Module 3 : Déroulement de l'instruction & Principe du contradictoire (Art. 16 CPC)",
        content: "Gestion des conclusions récapitulatives et du calendrier de mise en état devant le juge de la mise en état (JME). Communication intégrale des pièces justificatives sous bordereau numéroté pour garantir le respect strict des droits de la défense et du principe du contradictoire."
      },
      {
        title: "Module 4 : L'audience de plaidoirie & Constitution du dossier du juge",
        content: "Préparation synthétique du dossier de plaidoirie. Structuration d'une plaidoirie percutante axée sur les points clés contestés, réponse claire aux prétentions de la partie adverse et présentation convaincante des demandes d'exécution provisoire et d'indemnité au titre de l'article 700 du CPC."
      }
    ];
  }
  if (t.includes('travail') || t.includes('social') || t.includes('prud\'homme')) {
    return [
      {
        title: "Module 1 : Le contrat de travail & Encadrement des clauses sensibles",
        content: "Analyse de la relation de subordination juridique (arrêt Société Générale 1996). Rédaction des clauses essentielles : période d'essai, durée du travail (forfait jours/heures), clause de non-concurrence (nécessitant l'existence d'une contrepartie financière réelle et une limitation spatiotemporelle), et clause de mobilité."
      },
      {
        title: "Module 2 : Procédures de licenciement & Rupture conventionnelle",
        content: "Procédure de licenciement pour motif personnel (faute simple, grave, lourde, insuffisance professionnelle) ou motif économique : convocation écrite à entretien préalable, déroulement de l'entretien avec conseiller du salarié, et lettre de notification motivée (Art. L.1232-6). Procédure de rupture conventionnelle homologuée par la DREETS."
      },
      {
        title: "Module 3 : La procédure prud'homale : Conciliation (BCO) & Jugement (BJ)",
        content: "Saisine du Conseil de Prud'hommes par requête motivée. Déroulement de l'audience de conciliation et d'orientation (BCO) pour négocier un accord forfaitaire net d'impôt (Art. L.1235-1). En cas de non-conciliation, passage devant le bureau de jugement (BJ) composé paritairement de juges salariés et employeurs."
      },
      {
        title: "Module 4 : Calcul des indemnités & Barème Macron (Art. L.1235-3)",
        content: "Maîtrise des modes de calcul des indemnités légales ou conventionnelles de licenciement, de préavis et de congés payés. Application du barème d'indemnisation du licenciement sans cause réelle et sérieuse, et cas d'éviction du barème en cas de violation d'une liberté fondamentale (harcèlement, discrimination)."
      }
    ];
  }
  if (t.includes('rgpd') || t.includes('données') || t.includes('numérique') || t.includes('data')) {
    return [
      {
        title: "Module 1 : Les principes cardinaux du RGPD (Règlement UE 2016/679)",
        content: "Champ d'application matériel et extraterritorial du RGPD. Les 6 principes fondamentaux : licéité, loyauté et transparence des traitements ; limitation des finalités ; minimisation des données collectées ; exactitude ; limitation de la conservation ; et sécurité/confidentialité renforcée."
      },
      {
        title: "Module 2 : Gouvernance, Registre des traitements & Rôle du DPO",
        content: "Obligation de cartographier l'ensemble des flux de données de l'organisation. Rédaction du registre des activités de traitement (Art. 30 RGPD). Désignation du Délégué à la Protection des Données (DPO) et mise en conformité des contrats avec les sous-traitants (Art. 28 RGPD)."
      },
      {
        title: "Module 3 : Analyse d'Impact (AIPD) & Gérer les violations de données",
        content: "Conduite d'une Analyse d'Impact relative à la Protection des Données (AIPD / PIA) pour les traitements présentant un risque élevé pour les droits des personnes. Procédure d'urgence de notification des violations de données à la CNIL sous 72 heures maximum (Art. 33) et information des personnes concernées (Art. 34)."
      },
      {
        title: "Module 4 : Traitement des demandes d'exercice des droits des citoyens",
        content: "Implémentation des procédures internes pour répondre sous 30 jours aux demandes : Droit d'accès, droit de rectification, droit à l'effacement (droit à l'oubli Art. 17), droit à la limitation, droit à la portabilité des données et droit d'opposition."
      }
    ];
  }
  if (t.includes('famille') || t.includes('divorce') || t.includes('enfant')) {
    return [
      {
        title: "Module 1 : Le divorce par consentement mutuel (Acte d'avocat sous seing privé)",
        content: "Procédure extrajudiciaire instituée par la loi du 18 novembre 2016. Rédaction de la convention de divorce par deux avocats distincts, respect du délai de réflexion de 15 jours francs, et dépôt au rang des minutes d'un notaire pour donner force exécutoire immédiate sans passer devant le juge."
      },
      {
        title: "Module 2 : Les divorces contentieux devant le Juge aux Affaires Familiales (JAF)",
        content: "Procédure judiciaire de divorce (Divorce pour faute Art. 242, Altération définitive du lien conjugal Art. 246, ou Acceptation du principe du divorce Art. 233). Déroulement de l'audience d'orientation et sur mesures provisoires (AOMP) pour fixer la jouissance du logement et l'attribution des gardes."
      },
      {
        title: "Module 3 : Prestation compensatoire & Liquidation du régime matrimonial",
        content: "Évaluation et négociation de la prestation compensatoire (Art. 270 et suivants du Code civil) destinée à compenser la disparité de niveau de vie provoquée par le divorce. Analyse des critères : durée du mariage, âge, état de santé, droits à la retraite. Liquidation et partage de la communauté ou de l'indivision."
      },
      {
        title: "Module 4 : Autorité parentale, résidence de l'enfant & Contribution alimentaire",
        content: "Fixation des modalités de l'autorité parentale conjointe. Modalités de résidence de l'enfant (résidence alternée ou résidence principale chez l'un des parents avec droit de visite et d'hébergement). Calcul de la pension alimentaire selon la grille indicative du Ministère de la Justice."
      }
    ];
  }
  if (t.includes('droits humains') || t.includes('cedh') || t.includes('liberté') || t.includes('international')) {
    return [
      {
        title: "Module 1 : Piliers de la DUDH 1948 & Convention Européenne des Droits de l'Homme",
        content: "Analyse des textes fondateurs internationaux : Déclaration Universelle des Droits de l'Homme (1948) et Convention Européenne de 1950. Étude des droits intangibles : Droit à la vie (Art. 2), interdiction de la torture et des peines dégradantes (Art. 3), interdiction de l'esclavage (Art. 4)."
      },
      {
        title: "Module 2 : Le droit au procès équitable & Droits de la défense (Article 6 CEDH)",
        content: "Portée consacrée de l'article 6 de la CEDH : droit d'être entendu par un tribunal indépendant et impartial, droit à un jugement dans un délai raisonnable, présomption d'innocence (Art. 6§2), principe d'égalité des armes et assistance effective par un avocat dès les premières minutes d'une mesure de contrainte."
      },
      {
        title: "Module 3 : Conditions d'admissibilité des requêtes devant la Cour de Strasbourg",
        content: "Critères stricts d'admissibilité d'une requête individuelle devant la CEDH (Art. 34 et 35) : qualité de victime directe, épuisement obligatoire de toutes les voies de recours internes efficaces (Cour de cassation / Conseil d'État), et respect du délai impératif de 4 mois suivant la décision interne définitive."
      },
      {
        title: "Module 4 : Rédaction de la requête officielle & Exécution des arrêts de la CEDH",
        content: "Formulaire officiel de requête devant la CEDH, présentation claire des faits, griefs articulés au regard des articles de la Convention. Portée des arrêts de la Cour constatant une violation et mécanismes de satisfaction équitable (indemnités) et de réexamen des décisions pénales en droit interne."
      }
    ];
  }

  return [
    {
      title: "Module 1 : Cadre juridique, textes de loi & principes fondamentaux",
      content: "Examen approfondi des sources du droit applicables (Codes officiels, ordonnances, décrets d'application et traités internationaux). Délimitation exacte des droits, obligations et périmètres d'application des règles juridiques en vigueur."
    },
    {
      title: "Module 2 : Analyse de la jurisprudence constante & Arrêts de principe",
      content: "Étude critique des décisions majeures rendues par les hautes juridictions (Cour de cassation, Conseil d'État, Cour de justice de l'UE). Analyse des revirements de jurisprudence et de l'interprétation souveraine des juges du fond."
    },
    {
      title: "Module 3 : Stratégie de conseil, prévention des risques & formalités",
      content: "Méthodologie de sécurisation des actes et des démarches juridiques. Rédaction des clauses de sauvegarde, respect des délais d'action et conduite des négociations précontentieuses pour protéger efficacement les intérêts en jeu."
    },
    {
      title: "Module 4 : Cas pratiques, études de dossiers réels & Guide de rédaction",
      content: "Mise en pratique opérationnelle à travers l'étude de dossiers réels. Rédaction commentée d'actes juridiques, préparation des mémoires et transmission des outils méthodologiques d'avocat."
    }
  ];
};

// Complete Legal Masterclass & Training Catalog (Lawyer Account Formations)
const INITIAL_FORMATIONS: Classroom[] = [
  {
    id: 'form-contrats',
    title: 'Droit des Contrats & Rédaction Contractuelle (Pratique Avocat)',
    description: getRichDescription('Droit des Contrats'),
    type: 'video',
    lawyer_id: 'avocat-master-1',
    lawyer_first_name: 'Me Élisabeth',
    lawyer_last_name: 'Moreau',
    duration_minutes: 120,
    max_members: 150,
    created_at: '2024-01-15T00:00:00Z',
    category: 'Droit Privé & des Affaires',
    curriculum: getRichCurriculum('Droit des Contrats')
  },
  {
    id: 'form-contentieux',
    title: 'Techniques de Contentieux & Procédure Civile et Commerciale',
    description: getRichDescription('Contentieux'),
    type: 'direct',
    lawyer_id: 'avocat-master-2',
    lawyer_first_name: 'Me Alexandre',
    lawyer_last_name: 'Benali',
    duration_minutes: 90,
    max_members: 200,
    created_at: '2024-01-20T00:00:00Z',
    category: 'Procédure & Litiges',
    curriculum: getRichCurriculum('Contentieux')
  },
  {
    id: 'form-travail',
    title: 'Droit du Travail & Contentieux devant le Conseil de Prud’hommes',
    description: getRichDescription('Droit du travail'),
    type: 'differe',
    lawyer_id: 'avocat-master-3',
    lawyer_first_name: 'Me Sophie',
    lawyer_last_name: 'Laurent',
    duration_minutes: 110,
    max_members: 300,
    created_at: '2024-01-22T00:00:00Z',
    category: 'Droit Social & Travail',
    curriculum: getRichCurriculum('Droit du travail')
  },
  {
    id: 'form-rgpd',
    title: 'Conformité RGPD, Protection des Données & Cyber-Sécurité',
    description: getRichDescription('RGPD'),
    type: 'video',
    lawyer_id: 'avocat-master-4',
    lawyer_first_name: 'Me Karim',
    lawyer_last_name: 'El Mansouri',
    duration_minutes: 100,
    max_members: 250,
    created_at: '2024-01-25T00:00:00Z',
    category: 'Droit Numérique & Data',
    curriculum: getRichCurriculum('RGPD')
  },
  {
    id: 'form-famille',
    title: 'Droit de la Famille, Divorce, Prestation Compensatoire & Garde d’Enfants',
    description: getRichDescription('Famille'),
    type: 'direct',
    lawyer_id: 'avocat-master-5',
    lawyer_first_name: 'Me Claire',
    lawyer_last_name: 'Dubois',
    duration_minutes: 105,
    max_members: 180,
    created_at: '2024-01-28T00:00:00Z',
    category: 'Droit de la Famille',
    curriculum: getRichCurriculum('Famille')
  },
  {
    id: 'form-droits-homme',
    title: 'Droits Humains, Libertés Fondamentales & Recours devant la CEDH (HUDOC)',
    description: getRichDescription('Droits humains'),
    type: 'differe',
    lawyer_id: 'avocat-master-6',
    lawyer_first_name: 'Me Jean',
    lawyer_last_name: 'Rousseau',
    duration_minutes: 120,
    max_members: 300,
    created_at: '2024-02-01T00:00:00Z',
    category: 'Droits Humains & International',
    curriculum: getRichCurriculum('Droits humains')
  }
];

const isSessionPassed = (room: Classroom): boolean => {
  if (room.type !== 'direct') return false;
  if (!room.date) return false;
  
  try {
    const [year, month, day] = room.date.split('-');
    const [hours, minutes] = (room.time || '00:00').split(':');
    const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
    
    const durationMinutes = room.duration_minutes || 120;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    
    return new Date() > endDate;
  } catch (e) {
    console.error("Error parsing date:", e);
    return false;
  }
};

const isSessionInProgress = (room: Classroom): boolean => {
  if (room.type !== 'direct') return false;
  if (!room.date) return false;
  
  try {
    const [year, month, day] = room.date.split('-');
    const [hours, minutes] = (room.time || '00:00').split(':');
    const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
    
    const durationMinutes = room.duration_minutes || 120;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    const now = new Date();
    
    return now >= startDate && now <= endDate;
  } catch (e) {
    return false;
  }
};

const isSessionUpcoming = (room: Classroom): boolean => {
  if (room.type !== 'direct') return true; // non-direct are always "upcoming" (available)
  if (!room.date) return true;
  
  try {
    const [year, month, day] = room.date.split('-');
    const [hours, minutes] = (room.time || '00:00').split(':');
    const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
    
    return new Date() < startDate;
  } catch (e) {
    return true;
  }
};

type StatusFilter = 'all_status' | 'upcoming' | 'in_progress' | 'finished';

const getSessionSummaryText = (title: string): string => {
  const t = (title || '').toLowerCase();
  if (t.includes('contrat')) {
    return "La séance s'est concentrée sur la prévention des risques contractuels. Les participants ont étudié les clauses de limitation de responsabilité et de force majeure sous l'égide de la jurisprudence récente. Les points clés abordés incluent : la distinction entre obligation de moyens et de résultat, la rédaction de pénalités dissuasives mais licites, et les conditions de résiliation pour force majeure. Un modèle type de contrat commercial révisé a été partagé.";
  }
  if (t.includes('travail') || t.includes('licenciement')) {
    return "Cette séance a couvert les étapes critiques des procédures de licenciement individuel et collectif. L'avocat a détaillé les risques de requalification devant le conseil de prud'hommes, l'importance du formalisme lors de l'entretien préalable et de la notification écrite. Les participants ont également analysé des exemples de ruptures conventionnelles homologuées et la négociation d'indemnités transactionnelles.";
  }
  if (t.includes('rgpd') || t.includes('données')) {
    return "La session a permis de passer en revue la mise en conformité RGPD pratique pour les structures de toutes tailles. L'intervenant a détaillé la cartographie des traitements, la désignation du DPO, et la gestion des violations de données sous 72h auprès de la CNIL. Une étude de cas sur les sanctions prononcées récemment a illustré l'importance du consentement explicite.";
  }
  if (t.includes('famille') || t.includes('divorce')) {
    return "Séance consacrée aux nouvelles procédures de divorce par consentement mutuel par acte d'avocats. Les points clés traités concernent la liquidation du régime matrimonial, l'estimation de la prestation compensatoire, et les modalités de garde des enfants (résidence alternée). Les participants ont échangé sur les meilleures pratiques de médiation familiale.";
  }
  if (t.includes('cedh') || t.includes('droits')) {
    return "Focus sur la recevabilité des requêtes devant la Cour Européenne des Droits de l'Homme. L'avocat a présenté le parcours d'un dossier, l'obligation d'épuisement préalable des voies de recours internes, et les articles les plus souvent invoqués (droit à un procès équitable, respect de la vie privée). Une analyse de cas pratiques a conclu la séance.";
  }
  return "La séance en direct a permis d'aborder les réformes législatives les plus récentes et leurs impacts directs. Les participants ont pu échanger lors d'une session interactive de questions-réponses avec l'avocat modérateur. Les notions de responsabilité civile et professionnelle ont été détaillées et illustrées par des exemples de jurisprudence.";
};

const getEmbedUrl = (url: string): string => {
  if (!url) return '';
  const cleanUrl = url.trim();
  
  // eslint-disable-next-line no-useless-escape
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  
  // eslint-disable-next-line no-useless-escape
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  return cleanUrl;
};

const VideoPlayer: React.FC<{ url: string }> = ({ url }) => {
  const embedUrl = getEmbedUrl(url);
  const isMp4 = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().includes('.mp4?');
  
  if (isMp4) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-video bg-slate-900 border border-slate-800">
        <video 
          src={url} 
          controls 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-video bg-slate-900 border border-slate-800">
      <iframe
        src={embedUrl}
        className="absolute top-0 left-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Session Video Player"
      />
    </div>
  );
};

const ClassroomsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [classrooms, setClassrooms] = useState<Classroom[]>(INITIAL_FORMATIONS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "direct" | "differe" | "video">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all_status');
  const [mainTab, setMainTab] = useState<'catalog' | 'planning'>('catalog');
  const [activeClassroom, setActiveClassroom] = useState<Classroom | null>(null);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [selectedFormationModal, setSelectedFormationModal] = useState<Classroom | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: rooms, error: roomsErr } = await supabase
        .from("classrooms_just")
        .select("*, registrations:classroom_registrations_just(count)")
        .order("created_at", { ascending: false });

      let enriched: Classroom[] = [];
      if (!roomsErr && rooms && rooms.length > 0) {
        const lawyerIds = [...new Set(rooms.map((r) => r.lawyer_id))] as string[];
        const { data: profiles } = await supabase
          .from("profiles_just")
          .select("id, first_name, last_name")
          .in("id", lawyerIds);

        const profileMap: Record<string, { first_name: string; last_name: string }> = {};
        profiles?.forEach((p) => { profileMap[p.id] = p; });

        enriched = rooms.map((r) => ({
          ...r,
          description: getRichDescription(r.title, r.description),
          curriculum: getRichCurriculum(r.title, r.curriculum),
          lawyer_first_name: profileMap[r.lawyer_id]?.first_name || "Avocat",
          lawyer_last_name: profileMap[r.lawyer_id]?.last_name || "Partenaire",
          registered_count: (r.registrations as any)?.[0]?.count || 0,
        }));
      }

      const { data: dbFormations } = await supabase
        .from("formations_just")
        .select("*")
        .eq("status", "Publié")
        .order("created_at", { ascending: false });

      let staticFormations: Classroom[] = [];
      if (dbFormations && dbFormations.length > 0) {
        staticFormations = dbFormations.map(f => {
          const atts = getFormationAttachments(f);
          return {
            id: f.id,
            title: f.title,
            description: f.description || `Module de formation en ${f.category || 'Droit'} dispensé par ${f.author_name || 'France Justice'}.`,
            lawyer_id: f.author_id,
            lawyer_first_name: f.author_name ? f.author_name.split(' ')[0] : 'Expert',
            lawyer_last_name: f.author_name ? f.author_name.split(' ').slice(1).join(' ') : 'France Justice',
            category: f.category || 'Formation Juridique',
            duration_minutes: parseInt(f.duration) || 120,
            type: 'video',
            is_active: true,
            attachments: atts
          };
        });
      }

      // Merge enriched Supabase rooms, staticFormations with INITIAL_FORMATIONS
      const merged = [...staticFormations, ...INITIAL_FORMATIONS, ...enriched];
      const uniqueMap = new Map<string, Classroom>();
      merged.forEach(item => {
        const existing = uniqueMap.get(item.id);
        if (!existing) {
          uniqueMap.set(item.id, item);
        } else {
          uniqueMap.set(item.id, {
            ...item,
            description: getRichDescription(item.title, item.description || existing.description),
            curriculum: getRichCurriculum(item.title, item.curriculum || existing.curriculum)
          });
        }
      });

      const activeRooms = filterActiveSessions(Array.from(uniqueMap.values()));
      setClassrooms(activeRooms);
    } catch (e) {
      console.error("fetchData error:", e);
      setClassrooms(filterActiveSessions(INITIAL_FORMATIONS));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const ch = supabase
      .channel("classrooms-public-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "classrooms_just" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "classroom_registrations_just" }, fetchData)
      .subscribe();

    // Ticker every 30 seconds to automatically remove past visio sessions in real-time
    const timer = setInterval(() => {
      setClassrooms(prev => filterActiveSessions(prev));
    }, 30000);

    return () => { 
      supabase.removeChannel(ch);
      clearInterval(timer);
    };
  }, [user, fetchData]);

  const joinMeeting = async (classroom: Classroom) => {
    if (!user) { navigate(`/login?redirect=/classrooms?formation=${classroom.id}`); return; }
    setActiveClassroom(classroom);
    setIsInMeeting(true);

    if (classroom.lawyer_id === user.id) {
      await supabase
        .from("classrooms_just")
        .update({ is_live: true })
        .eq("id", classroom.id);
    }
  };

  const leaveMeeting = useCallback(async () => {
    if (activeClassroom && user && activeClassroom.lawyer_id === user.id) {
      await supabase
        .from("classrooms_just")
        .update({ is_live: false })
        .eq("id", activeClassroom.id);
    }
    setIsInMeeting(false);
    setActiveClassroom(null);
  }, [activeClassroom, user]);

  const downloadFormationPDF = (classroom: Classroom) => {
    const curriculumText = (classroom.curriculum || getRichCurriculum(classroom.title))
      .map(c => `${c.title.toUpperCase()}\n${c.content}`)
      .join('\n\n' + '='.repeat(50) + '\n\n');

    const fullContent = `PROGRAMME OFFICIEL DE FORMATION JURIDIQUE EN LIGNE
--------------------------------------------------
INTITULÉ DU COURS : ${classroom.title.toUpperCase()}
CATÉGORIE JURIDIQUE : ${classroom.category || 'Pratique Juridique'}
INTERVENANT / FORMATEUR : Me ${classroom.lawyer_first_name || ''} ${classroom.lawyer_last_name || 'Avocat au Barreau'}
DURÉE DU PROGRAMME : ${classroom.duration_minutes} minutes (4 Modules de Spécialisation)
DOCUMENTATION : Édition Académique Officielle France Justice

PRÉSENTATION GÉNÉRALE ET OBJECTIFS DU COURS :
${getRichDescription(classroom.title, classroom.description)}

==================================================
SYLLABUS ET CONTENU DÉTAILLÉ DU PROGRAMME :
==================================================

${curriculumText}`;

    generatePDF(fullContent, {
      title: `PROGRAMME COMPLET — ${classroom.title}`,
      subtitle: `France Justice — Académie Juridique & Masterclass Avocat`,
      category: classroom.category || 'Formation Juridique',
      author: `Me ${classroom.lawyer_first_name || ''} ${classroom.lawyer_last_name || ''}`,
      filename: `formation_juridique_complete_${classroom.id}`
    });
  };

  const filtered = classrooms.filter((r) => {
    const q = searchQuery.toLowerCase();
    const match = r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    const typeMatch = activeFilter === "all" ? true : r.type === activeFilter;
    
    let statusMatch = true;
    if (statusFilter === 'upcoming') statusMatch = isSessionUpcoming(r);
    else if (statusFilter === 'in_progress') statusMatch = isSessionInProgress(r);
    else if (statusFilter === 'finished') statusMatch = isSessionPassed(r);
    
    return match && typeMatch && statusMatch;
  });

  if (isInMeeting && activeClassroom) {
    const displayName = profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : user?.email || "Participant";
    const email = user?.email || "";
    const isHost = activeClassroom.lawyer_id === user?.id;

    return (
      <JitsiMeeting
        roomId={activeClassroom.id}
        displayName={displayName || "Participant"}
        email={email}
        onLeave={leaveMeeting}
        isHost={isHost}
      />
    );
  }

  const filters = [
    { id: "all", label: t('classrooms.filter_all', 'Toutes les formations') },
    { id: "video", label: t('classrooms.filter_video', 'Masterclass Vidéo') },
    { id: "direct", label: t('classrooms.filter_direct', 'Direct & Visioconférence') },
    { id: "differe", label: t('classrooms.filter_delayed', 'Différé & E-Learning') },
  ];

  const statusFilters: { id: StatusFilter; label: string; color: string }[] = [
    { id: 'all_status', label: 'Tous les statuts', color: 'bg-slate-600' },
    { id: 'upcoming', label: '📅 À venir', color: 'bg-blue-600' },
    { id: 'in_progress', label: '🔴 En cours', color: 'bg-red-600' },
    { id: 'finished', label: '✅ Terminées', color: 'bg-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden mb-12 shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-16 border border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(59,130,246,0.15),transparent_60%)]" />
          <div className="relative z-10 max-w-3xl space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/30">
              <Tv className="w-3.5 h-3.5" /> Académie Juridique & Formations Avocat
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Formations Juridiques & Masterclasses Détaillées
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Consultez l'ensemble des programmes académiques dispensés par nos avocats partenaires. Chaque formation comprend un programme exhaustif, des textes de loi de référence et un cours téléchargeable au format PDF.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setMainTab('catalog')}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all border ${
                  mainTab === 'catalog'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                📚 Catalogue des Formations
              </button>
              <button
                onClick={() => setMainTab('planning')}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all border ${
                  mainTab === 'planning'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                📅 Planning Annuel & Agenda
              </button>
            </div>
          </div>
        </div>

        {mainTab === 'planning' ? (
          <AnnualPlanning mode="public" onEventClick={(evt) => setSelectedFormationModal({
            id: evt.id,
            title: evt.title,
            description: evt.description,
            type: 'direct',
            duration_minutes: evt.duration_minutes || 60,
            max_members: 100,
            created_at: new Date().toISOString(),
            lawyer_id: evt.lawyer_id || '',
            lawyer_first_name: evt.lawyer_first_name,
            lawyer_last_name: evt.lawyer_last_name,
            date: evt.event_date,
            time: evt.event_time,
            video_url: evt.video_url
          })} />
        ) : (
          <>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as "all" | "direct" | "differe" | "video")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  activeFilter === f.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((sf) => (
              <button
                key={sf.id}
                onClick={() => setStatusFilter(sf.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  statusFilter === sf.id
                    ? `${sf.color} text-white border-transparent shadow-md`
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une formation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center gap-3 py-24 text-slate-400">
            <Loader2 className="animate-spin h-8 w-8" />
            <span className="text-sm font-medium">Chargement des programmes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-16 text-center max-w-xl mx-auto shadow-sm text-slate-100">
            <BookOpen className="h-14 w-14 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">Aucune formation trouvée</h3>
            <p className="text-slate-400 text-sm">Essayez de modifier votre recherche ou vos filtres.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((room) => {
              const displayDesc = getRichDescription(room.title, room.description);
              const displayCurriculum = getRichCurriculum(room.title, room.curriculum);

              return (
                <Card key={room.id} className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-800 shadow-md flex flex-col bg-slate-900 text-slate-100 group">
                  <div className={`h-2 bg-gradient-to-r ${
                    room.type === "direct" ? "from-red-500 to-orange-400" :
                    room.type === "video" ? "from-indigo-600 to-blue-500" :
                    "from-emerald-500 to-teal-400"
                  }`} />
                  <CardContent className="p-6 flex-1 flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                        {room.category || 'Formation Avocat'}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium whitespace-nowrap">
                        <Users className="w-3.5 h-3.5" /> {(room as any).registered_count || 18} / {room.max_members}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 line-clamp-2 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                        {room.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{displayDesc}</p>
                    </div>

                    <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span>Me {room.lawyer_first_name} {room.lawyer_last_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Durée : {room.duration_minutes} min • {displayCurriculum.length} Modules exhaustifs</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 mt-auto pt-2">
                      <Button
                        variant="outline"
                        className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold flex items-center justify-center gap-2"
                        onClick={() => setSelectedFormationModal({ ...room, description: displayDesc, curriculum: displayCurriculum })}
                      >
                        <BookOpen className="w-4 h-4" /> Consulter le Programme Détaillé
                      </Button>

                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-md"
                        onClick={() => downloadFormationPDF({ ...room, description: displayDesc, curriculum: displayCurriculum })}
                      >
                        <Download className="w-4 h-4" /> Télécharger le Cours (PDF)
                      </Button>

                      {isSessionPassed(room) ? (
                        <div className="w-full text-center py-2.5 px-3 bg-slate-100 rounded-xl text-slate-500 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" /> Séance Terminée (Résumé disponible)
                        </div>
                      ) : user ? (
                        <Button
                          variant="primary"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2"
                          onClick={() => joinMeeting(room)}
                        >
                          <Video className="w-4 h-4" /> Rejoindre la Session Visio
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs text-slate-500"
                          onClick={() => navigate(`/login?redirect=/classrooms?formation=${room.id}`)}
                        >
                          Se connecter pour la visio
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>

      {/* FORMATION DETAIL MODAL */}
      {selectedFormationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-950 text-white rounded-t-3xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {selectedFormationModal.category || 'Formation Juridique Officielle'}
                </span>
                <h2 className="text-xl font-bold mt-1 text-white">{selectedFormationModal.title}</h2>
                <p className="text-xs text-slate-400 mt-1">Formateur : Me {selectedFormationModal.lawyer_first_name} {selectedFormationModal.lawyer_last_name} • Durée : {selectedFormationModal.duration_minutes} min</p>
              </div>
              <button
                onClick={() => setSelectedFormationModal(null)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              <div className="bg-indigo-950/40 rounded-2xl p-5 border border-indigo-800/50">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Objectifs & Présentation Générale
                </h4>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {getRichDescription(selectedFormationModal.title, selectedFormationModal.description)}
                </p>
              </div>

              {isSessionPassed(selectedFormationModal) && (
                <div className="bg-emerald-950/40 rounded-2xl p-5 border border-emerald-800/50 space-y-4">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Résumé & Enregistrement de la Séance (Terminée)
                  </h4>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                    {getSessionSummaryText(selectedFormationModal.title)}
                  </p>
                  
                  {selectedFormationModal.video_url && (
                    <div className="mt-4 space-y-2">
                      <h5 className="font-bold text-white text-xs uppercase tracking-wide">
                        Replay / Enregistrement Vidéo de la Séance
                      </h5>
                      <VideoPlayer url={selectedFormationModal.video_url} />
                    </div>
                  )}
                </div>
              )}

              {/* PDF & Image Attachments Export Section */}
              {selectedFormationModal.attachments && selectedFormationModal.attachments.length > 0 && (
                <div className="bg-slate-950 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        📑 Pièces Jointes & Supports de Cours ({selectedFormationModal.attachments.length})
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Documents PDF et supports images intégrés à cette formation</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => exportAllAttachments(selectedFormationModal.attachments || [])}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <Download className="w-3.5 h-3.5" /> Exporter Tous les Fichiers (PDF & Images)
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedFormationModal.attachments.map((att) => (
                      <div key={att.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-indigo-500/50 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {att.type === 'image' ? (
                            <img src={att.dataUrl} alt={att.name} className="w-10 h-10 rounded-lg object-cover border border-slate-700 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400 font-bold text-xs flex-shrink-0">
                              PDF
                            </div>
                          )}
                          <div className="truncate">
                            <p className="text-xs font-bold text-white truncate">{att.name}</p>
                            <p className="text-[10px] text-slate-400">{att.size} • {att.type.toUpperCase()}</p>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportAttachmentFile(att)}
                          className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white text-xs font-semibold px-2.5 py-1 flex items-center gap-1 flex-shrink-0"
                        >
                          <Download className="w-3 h-3" /> Exporter
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" /> Syllabus & Modules d'Enseignement Intégral ({getRichCurriculum(selectedFormationModal.title, selectedFormationModal.curriculum).length} Modules)
                </h4>
                <div className="space-y-4">
                  {getRichCurriculum(selectedFormationModal.title, selectedFormationModal.curriculum).map((sec, idx) => (
                    <div key={idx} className="bg-slate-950 rounded-2xl p-5 border border-slate-800 hover:border-indigo-800 transition-colors">
                      <h5 className="font-extrabold text-white text-sm flex items-center gap-2.5 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {sec.title}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed pl-6 whitespace-pre-line">{sec.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950 rounded-b-3xl flex flex-wrap justify-between items-center gap-3">
              <Button variant="outline" onClick={() => setSelectedFormationModal(null)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Fermer
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg"
                onClick={() => downloadFormationPDF(selectedFormationModal)}
              >
                <Download className="w-4 h-4" /> Télécharger le Cours Complet (PDF)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomsPage;
