export interface OfficialFormation {
  id: string;
  title: string;
  shortTitle: string;
  level: string;
  ects: number;
  duration: string;
  category: string;
  certifier: string;
  pdfUrl: string;
  pdfName: string;
  pdfSize: string;
  description: string;
  objectives: string[];
  prerequisites: string[];
  publicTarget: string;
  careerOpportunities: string[];
  programModules: {
    title: string;
    duration?: string;
    details: string[];
  }[];
  evaluationMethods: string[];
  type: 'direct' | 'differe' | 'video';
  is_pdf_formation: boolean;
  format: 'texte_pdf';
  scheduled_at?: string;
  date?: string;
  time?: string;
  duration_minutes: number;
  lawyer_first_name: string;
  lawyer_last_name: string;
  course_category: 'masterclass' | 'diplomante';
}

export const OFFICIAL_FEDE_FORMATIONS: OfficialFormation[] = [
  // ── 1. MASTÈRE EUROPÉEN JURISTE D'ENTREPRISE (BAC+5) ──
  {
    id: 'fede-master-droit-affaires',
    title: 'Mastère Européen Juriste d\'Entreprise - Droit Européen & International des Affaires (Niveau 7 CEC)',
    shortTitle: 'Mastère Juriste d\'Entreprise (Niveau 7 CEC)',
    level: 'Niveau 7 CEC (Bac +5 / Master)',
    ects: 120,
    duration: '2 ans (Initial ou Alternance)',
    category: 'Droit Européen & des Affaires',
    course_category: 'diplomante',
    certifier: 'Commission Européenne & Nationale Diplômante',
    pdfUrl: '/assets/pdf/MASTER DROIT DES AFFAIRES .pdf',
    pdfName: 'MASTER_EUROPEN_JURISTE_ENTREPRISE_DIPLOMANTE.pdf',
    pdfSize: '412 KB',
    description: `Le Mastère européen juriste d'entreprise, spécialité droit européen et international des affaires, forme des professionnels immédiatement opérationnels. Le juriste d'entreprise protège les intérêts de son organisation en gérant les contrats, les contentieux, et en veillant à la légalité des décisions. En contexte international, il négocie et rédigé en anglais. Associé aux prises de décisions, il évalue les risques et propose des montages juridiques avantageux. Dans une PME, il peut coordonner des avocats extérieurs. Dans un grand groupe, il est souvent rattaché à la direction générale. Ses missions incluent l'analyse, la négociation et la rédaction de contrats, la gestion des contentieux et le conseil en droit des affaires.`,
    objectives: [
      'Mener une veille juridique autonome',
      'Conseiller juridiquement les différents services d\'une entreprise ou organisation',
      'Maîtriser les techniques de rédactions contractuelles',
      'Maîtriser les instruments de paiement et de crédit ainsi que les garanties dans un contexte international',
      'Comprendre et rédiger des contrats internationaux',
      'Maîtriser le droit international privé des affaires',
      'Mener des négociations juridiques et rédiger des documents contractuels en langue anglaise'
    ],
    prerequisites: [
      'Candidats titulaires d\'un diplôme de niveau 6 du CEC (Bac +3) ou diplôme équivalent (180 ECTS)'
    ],
    publicTarget: 'Étudiants, demandeurs d\'emploi, salariés et professionnels du secteur juridique & commercial',
    careerOpportunities: [
      'Juriste d\'entreprise PME ou Grand Groupe',
      'Direction Générale ou Direction Financière',
      'Organisations non marchandes (ONG, Fondations, structures militantes)',
      'Bureaux de conseil et d\'influence (lobbies, experts, syndicats professionnels)'
    ],
    programModules: [
      {
        title: 'Mastère 1 : Instruments de paiement, crédit & commerce international (560H-710H)',
        duration: '1ère Année',
        details: [
          'Instruments de paiement/de crédit/de garanties à l\'international : compte bancaire, garanties int.',
          'Droit du commerce international : opérateurs internationaux, contrats internationaux.',
          'Notions juridiques, méthodologie et veille juridique : juridictions, droit des obligations, concurrence UE.',
          'Mission professionnelle (≥ 12 semaines) : stage, alternance ou emploi salarié.'
        ]
      },
      {
        title: 'Mastère 2 : Droit international privé & Rédaction contractuelle',
        duration: '2ème Année',
        details: [
          'Droit international privé et modes alternatifs de règlements des différends (conflits de juridiction, conflits de lois, jugements étrangers).',
          'Anglais juridique & Techniques de rédactions contractuelles.',
          'Mission professionnelle (≥ 12 semaines) : mémoire de recherche, thèse et soutenance.'
        ]
      },
      {
        title: 'Culture et Citoyenneté Européennes & Langues (100H à 120H)',
        duration: 'Transversal',
        details: [
          'Les entreprises et les enjeux de la transition écologique (crise climatique, cadre normatif, RSE).',
          'LV1 Niveau B2 du CECRL (Anglais, Allemand, Espagnol, Français, Italien, Portugais).',
          'LV2 & LV3 facultatives.'
        ]
      }
    ],
    evaluationMethods: [
      'Contrôle continu, QCM (1h30), Étude de cas (5h), Mémoire & Soutenance (1h)',
      'Langue vivante : Compréhension écrite (1h45) & orale (45 min)',
      'Évaluations CCE : QCM (1h)'
    ],
    type: 'differe',
    is_pdf_formation: true,
    format: 'texte_pdf',
    duration_minutes: 0,
    lawyer_first_name: 'Formation Diplômante',
    lawyer_last_name: 'Officielle'
  },

  // ── 2. MASTÈRE EUROPÉEN EXPERT IT - IA & BIG DATA (BAC+5) ──
  {
    id: 'fede-master-ia-bigdata',
    title: 'Mastère Européen Expert IT - Applications Intelligentes & Big Data (IA - Niveau 7 CEC)',
    shortTitle: 'Mastère Expert IT & IA (Niveau 7 CEC)',
    level: 'Niveau 7 CEC (Bac +5 / Master)',
    ects: 120,
    duration: '2 ans (Initial ou Alternance)',
    category: 'Intelligence Artificielle & Big Data',
    course_category: 'diplomante',
    certifier: 'Commission Européenne & Nationale Diplômante',
    pdfUrl: '/assets/pdf/master IA .pdf',
    pdfName: 'MASTER_EUROPEN_EXPERT_IT_IA_BIGDATA_DIPLOMANTE.pdf',
    pdfSize: '250 KB',
    description: `Les projets de développement d'applications intelligentes, axés sur la Big Data ou non, se multiplient avec la digitalisation dans les secteurs tels que les télécoms, l'E-Commerce, l'industrie, les services, les loisirs, l'éducation, la formation, l'agriculture ou encore l'agroalimentaire. Les entreprises recherchent des professionnels aux capacités techniques solides, experts dans la digitalisation intelligente et sécurisée. Ils doivent être capables de piloter des équipes, gérer des projets dans leur ensemble et répondre aux besoins spécifiques des clients. Cette formation prépare les apprenants à concevoir des projets digitaux complexes avec compétence et autonomie.`,
    objectives: [
      'Réaliser un audit/cahier des charges pour développer une solution logicielle adaptée',
      'Piloter un projet de développement logiciel en équipe',
      'Livrer le produit au client et assurer la maintenance',
      'Gérer le cycle de vie logiciel et l\'intégration DevOps',
      'Maîtriser les interactions d\'une application avec les bases de données (SQL, NoSQL, Hadoop, MongoDB)',
      'Connaître les différentes techniques de tests et de sécurisation du code',
      'Comprendre et maîtriser les enjeux économiques du Big Data et des applications intelligentes d\'IA'
    ],
    prerequisites: [
      'Candidats titulaires d\'un diplôme de niveau 6 du CEC (Bac +3) ou diplôme équivalent (180 ECTS)'
    ],
    publicTarget: 'Étudiants, demandeurs d\'emploi, salariés, développeurs et professionnels du secteur informatique',
    careerOpportunities: [
      'Manager de projet informatique / Manager Big Data',
      'Architecte technique / Consultant(e) IA & Big Data',
      'Consultant(e) technique & fonctionnel',
      'Chef de projet de développement d\'applications intelligentes / mobiles / Web Services',
      'ScrumMaster & Responsable DevOps'
    ],
    programModules: [
      {
        title: 'Mastère 1 : Management IT, BDD & Apps Intelligentes (675H-780H)',
        duration: '1ère Année',
        details: [
          'Management de projet informatique : outils/méthodes de gestion de projet, culture informatique d\'entreprise.',
          'Dev et base de données fondamentaux : langages de dev, BDD relationnelles, Big Data & NoSQL.',
          'Dev d\'apps intelligentes et Big Data : JEE et Oracle, PHP Avancé et MongoDB, Python et Cassandra, Java/Kotlin Android.',
          'Mission professionnelle (≥ 12 semaines) : stage, alternance ou emploi.'
        ]
      },
      {
        title: 'Mastère 2 : Architectures DevOps, Data Mining & IA',
        duration: '2ème Année',
        details: [
          'Dev et BDD perfectionnement : Hadoop et Java, Data Mining et IA, architectures DevOps.',
          'Dev d\'applications intelligentes perfectionnement : Python & Data Mining IA, Node.js & MongoDB, Cross Platforms & Hybrides, Projet de programmation libre.',
          'Mission professionnelle (≥ 12 semaines) : thèse et soutenance.'
        ]
      },
      {
        title: 'Culture et Citoyenneté Européennes & Langues (100H à 120H)',
        duration: 'Transversal',
        details: [
          'Transition écologique & numérique responsable dans les projets digitaux.',
          'LV1 Niveau B2 du CECRL (Anglais IT).',
          'LV2 & LV3 facultatives.'
        ]
      }
    ],
    evaluationMethods: [
      'Contrôle continu, Exercices pratiques n°1 (1h30/2h), Exercices pratiques n°2 (2h), Mémoire & Soutenance (1h)',
      'Langue vivante : Compréhension écrite (1h45) & orale (45 min)',
      'Évaluations CCE : QCM (1h)'
    ],
    type: 'differe',
    is_pdf_formation: true,
    format: 'texte_pdf',
    duration_minutes: 0,
    lawyer_first_name: 'Formation Diplômante',
    lawyer_last_name: 'Officielle'
  },

  // ── 3. BACHELOR EUROPÉEN IMMOBILIER (BAC+3) ──
  {
    id: 'fede-bachelor-immobilier',
    title: 'Bachelor Européen Immobilier - Transaction & Gestion Immobilière (Niveau 6 CEC)',
    shortTitle: 'Bachelor Immobilier (Niveau 6 CEC)',
    level: 'Niveau 6 CEC (Bac +3 / Licence)',
    ects: 60,
    duration: '1 an (Initial ou Alternance)',
    category: 'Droit & Gestion Immobilière',
    course_category: 'diplomante',
    certifier: 'Commission Européenne & Nationale Diplômante',
    pdfUrl: '/assets/pdf/LICENCE IMMOBILIER .pdf',
    pdfName: 'BACHELOR_EUROPEN_IMMOBILIER_DIPLOMANTE.pdf',
    pdfSize: '618 KB',
    description: `Le Bachelor européen immobilier est ouvert aux titulaires d'un premier diplôme ou aux personnes bénéficiant d'une expérience significative dans le secteur immobilier de se spécialiser en transaction ou gestion immobilière. Bien qu'il ne permette pas directement l'obtention d'une carte professionnelle, ce programme constitue un tremplin théorique, juridique et technique pour évoluer dans l'immobilier, en apportant les connaissances théoriques fondamentales aux futurs professionnels. Le programme laisse le choix aux apprenants de s'orienter vers une spécialisation en transaction immobilière ou en gestion immobilière.`,
    objectives: [
      'Connaître son domaine d\'action et l\'environnement réglementaire immobilier',
      'Maîtriser les règles de droit inhérentes aux différents métiers de l\'immobilier (Transaction & Gestion)',
      'Conseiller les clients vendeurs, acquéreurs, bailleurs ou copropriétaires',
      'Évaluer, promouvoir ou entretenir les biens immobiliers de la clientèle',
      'Développer et pérenniser un portefeuille client ou immobilier',
      'Maîtriser les baux commerciaux, d\'habitation et la comptabilité mandante'
    ],
    prerequisites: [
      'Candidats titulaires d\'un diplôme de niveau 5 du CEC (Bac +2) ou diplôme équivalent à l\'obtention de 120 ECTS'
    ],
    publicTarget: 'Étudiants, demandeurs d\'emploi, salariés et professionnels en reconversion vers l\'immobilier',
    careerOpportunities: [
      'Transaction immobilière : Négociateur(trice) immobilier, Chargé(e) de clientèle, Attaché(e) commercial',
      'Gestion immobilière : Gestionnaire de parc locatif (privé/public), Responsable / Gestionnaire de copropriétés, Administrateur(trice) de biens'
    ],
    programModules: [
      {
        title: 'Tronc Commun : Expertise Professionnelle Immobilière (345H-470H)',
        duration: 'Tronc Commun',
        details: [
          'Analyse du marché & Cadre juridique immobilier.',
          'Architecture, Urbanisme, Construction, Assurances & Environnement.'
        ]
      },
      {
        title: 'Spécialisation Transaction Immobilière',
        duration: 'Spécialisation 1',
        details: [
          'Prospection, évaluation du prix de vente et du loyer, le mandat, diffusion du bien.',
          'Négociation, analyse financière, finalisation de la vente et de la location, notions de copropriété.'
        ]
      },
      {
        title: 'Spécialisation Gestion Immobilière',
        duration: 'Spécialisation 2',
        details: [
          'Les organes de la copropriété, l\'assemblée générale, gestion administrative & comptable.',
          'Mandat de gérance, suivi du bail, suivi technique et compte-rendu de gestion.'
        ]
      },
      {
        title: 'Culture & Citoyenneté Européennes & Langues (100H)',
        duration: 'Transversal',
        details: [
          'Le projet européen, citoyenneté en action, le management interculturel et RSE.',
          'LV1 Niveau B1 du CECRL.',
          'Mission professionnelle (≥ 12 semaines) : rapport d\'activité et soutenance.'
        ]
      }
    ],
    evaluationMethods: [
      'Contrôle continu, Étude de cas Tronc Commun (3h), Étude de cas Spécialisation (3h)',
      'Rapport d\'activité et soutenance professionnelle (30 min)',
      'LV1 : Compréhension écrite (1h) & Oral (45 min), QCM CCE (1h20)'
    ],
    type: 'differe',
    is_pdf_formation: true,
    format: 'texte_pdf',
    duration_minutes: 0,
    lawyer_first_name: 'Formation Diplômante',
    lawyer_last_name: 'Officielle'
  }
];

export const OFFICIAL_DIPLOMANTE_FORMATIONS = OFFICIAL_FEDE_FORMATIONS;

/**
 * Returns the 3 official diploma courses formatted as Classrooms for public/student view
 */
export function getOfficialFormationsAsClassrooms() {
  return OFFICIAL_FEDE_FORMATIONS.map(f => ({
    id: f.id,
    title: f.title,
    description: f.description,
    type: f.type,
    is_pdf_formation: true,
    format: 'texte_pdf' as const,
    course_category: 'diplomante' as const,
    lawyer_id: 'lawyer-diplomante',
    lawyer_first_name: f.lawyer_first_name,
    lawyer_last_name: f.lawyer_last_name,
    duration_minutes: f.duration_minutes,
    max_members: 300,
    created_at: '2026-01-01T00:00:00Z',
    category: f.category,
    pdf_url: f.pdfUrl,
    curriculum: f.programModules.map(m => ({
      title: m.title,
      content: m.details.join(' • ')
    })),
    attachments: [
      {
        id: `att-${f.id}`,
        name: f.pdfName,
        type: 'pdf' as const,
        size: f.pdfSize,
        dataUrl: f.pdfUrl,
        created_at: '2026-01-01T00:00:00Z'
      }
    ]
  }));
}

/**
 * Returns the 3 official diploma courses formatted as Admin Formation items
 */
export function getOfficialFormationsAsAdminItems() {
  return OFFICIAL_FEDE_FORMATIONS.map(f => ({
    id: f.id,
    title: f.title,
    category: f.category,
    course_category: 'diplomante' as const,
    level: f.level,
    duration: f.duration,
    description: f.description,
    author_name: `${f.certifier} (Formation Diplômante)`,
    status: 'Publié',
    format: 'texte_pdf' as const,
    is_pdf_formation: true,
    created_at: '2026-01-01T00:00:00Z',
    pdf_url: f.pdfUrl,
    attachments: [
      {
        id: `att-${f.id}`,
        name: f.pdfName,
        type: 'pdf' as const,
        size: f.pdfSize,
        dataUrl: f.pdfUrl,
        created_at: '2026-01-01T00:00:00Z'
      }
    ]
  }));
}

/**
 * Merges any list of formations with the 3 official FEDE diploma courses (preventing duplicates)
 */
export function getMergedOfficialFormations(existingFormations: any[]) {
  const officialAdmin = getOfficialFormationsAsAdminItems();
  if (!existingFormations || existingFormations.length === 0) {
    return officialAdmin;
  }
  const existingIds = new Set(existingFormations.map(f => f.id));
  const missingOfficial = officialAdmin.filter(f => !existingIds.has(f.id));
  return [...missingOfficial, ...existingFormations];
}

/**
 * Merges any list of classrooms/courses with the 3 official FEDE diploma courses
 */
export function getMergedOfficialClassrooms(existingClassrooms: any[]) {
  const officialRooms = getOfficialFormationsAsClassrooms();
  if (!existingClassrooms || existingClassrooms.length === 0) {
    return officialRooms;
  }
  const existingIds = new Set(existingClassrooms.map(c => c.id));
  const missingOfficial = officialRooms.filter(r => !existingIds.has(r.id));
  return [...missingOfficial, ...existingClassrooms];
}
