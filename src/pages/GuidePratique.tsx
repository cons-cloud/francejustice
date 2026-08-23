import React, { useState, useMemo } from 'react';
import { 
  FileText, Scale, AlertTriangle, Search, ChevronRight, 
  Download, Sparkles, BookOpen, Clock, CheckCircle2, 
  FileCheck, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generatePDF } from '../lib/pdfUtils';
import { useTranslation } from '../i18n';

interface LegalGuideItem {
  id: string;
  title: string;
  category: 'Droit du Travail' | 'Immobilier & Logement' | 'Famille & Succession' | 'Consommation & Litiges' | 'Procédures & Justice' | 'Entreprise & Sociétés';
  iconName: string;
  summary: string;
  estimatedTime: string;
  difficulty: 'Facile' | 'Intermédiaire' | 'Avancé';
  legalBasis: string;
  requiredDocuments: string[];
  steps: {
    number: number;
    title: string;
    description: string;
    tip?: string;
  }[];
  errorsToAvoid: string[];
  templateType?: string;
}

const GUIDES_DATABASE: LegalGuideItem[] = [
  {
    id: 'guide-plainte-procureur',
    title: 'Déposer une plainte au Commissariat ou auprès du Procureur de la République',
    category: 'Procédures & Justice',
    iconName: 'FileText',
    summary: 'Procédure pas à pas pour porter plainte en cas d’infraction pénale (vol, escroquerie, agression, harcèlement) avec ou sans constitution de partie civile.',
    estimatedTime: '30 min à 1h',
    difficulty: 'Facile',
    legalBasis: 'Articles 15-3 et 40 du Code de procédure pénale',
    requiredDocuments: [
      'Pièce d’identité officielle en cours de validité (CNI ou passeport)',
      'Preuves écrites (captures d’écran, emails, SMS, factures, récépissés)',
      'Certificat médical ou constat d’ITT (Interruption Totale de Travail) si dommage physique',
      'Témoignages écrits certifiés avec copie de carte d’identité'
    ],
    steps: [
      {
        number: 1,
        title: 'Identifier les faits et qualifier l’infraction',
        description: 'Notez précisément la date, l’heure exacte, le lieu et le déroulé chronologique des faits. Rassemblez tous les éléments matériels prouvant l’infraction.',
        tip: 'Faites des sauvegardes horodatées de tous vos échanges numériques.'
      },
      {
        number: 2,
        title: 'Choisir le mode de dépôt de plainte',
        description: 'Vous pouvez soit vous rendre au commissariat/gendarmerie (dépôt sur place ou pré-plainte en ligne), soit adresser un courrier directement au Procureur du Tribunal Judiciaire.',
        tip: 'Le courrier recommandé avec accusé de réception adressé au Procureur évite tout refus de guichet.'
      },
      {
        number: 3,
        title: 'Rédaction du récépissé et audition',
        description: 'L’agent de police rédigera un procès-verbal d’audition. Relisez attentivement chaque mot avant d’imposer votre signature.',
        tip: 'Exigez la délivrance immédiate du récépissé de dépôt de plainte et d’une copie intégrale du procès-verbal.'
      },
      {
        number: 4,
        title: 'Suivi des poursuites ou saisine du Doyen des juges',
        description: 'Le Procureur décide soit d’ouvrir une enquête, soit d’un classement sans suite. Sans réponse sous 3 mois, vous pouvez saisir le Juge d’instruction.',
        tip: 'Consultez la notice d’aide juridictionnelle si vos ressources sont modestes.'
      }
    ],
    errorsToAvoid: [
      'Dépasser le délai de prescription pénale (6 ans pour un délit, 1 an pour une contravention)',
      'Faire une fausse déclaration sous peine de poursuites pour dénonciation calomnieuse (Art. 226-10 Code pénal)',
      'Omettre de réclamer la copie certifiée du procès-verbal de dépôt'
    ],
    templateType: 'plainte'
  },
  {
    id: 'guide-rupture-conventionnelle',
    title: 'Négocier et réussir sa Rupture Conventionnelle de contrat (CDI)',
    category: 'Droit du Travail',
    iconName: 'Briefcase',
    summary: 'Guide juridique pour obtenir une rupture conventionnelle homologuée avec indemnité légale et maintien des droits à l’allocation chômage (France Travail).',
    estimatedTime: '15 jours à 1 mois',
    difficulty: 'Intermédiaire',
    legalBasis: 'Articles L. 1237-11 à L. 1237-16 du Code du travail',
    requiredDocuments: [
      'Contrat de travail initial et derniers bulletins de paie',
      'Convention de rupture CERFA officielle',
      'Relevé d’ancienneté et décompte des droits à congés payés',
      'Comptes rendus d’entretiens préalables signés'
    ],
    steps: [
      {
        number: 1,
        title: 'Demande d’entretien et préparation de l’argumentaire',
        description: 'Sollicitez un entretien officiel avec l’employeur. Préparez le calcul de votre indemnité légale de rupture (au minimum égal à l’indemnité de licenciement).',
        tip: 'Vous avez le droit de vous faire assister par un salarié de l’entreprise ou un conseiller du salarié.'
      },
      {
        number: 2,
        title: 'Signature du formulaire CERFA',
        description: 'Lors de la signature de la convention, fixez d’un commun accord la date exacte de fin de contrat et le montant précis de l’indemnité spécifique.',
        tip: 'L’indemnité ne peut pas être inférieure au barème légal (1/4 de mois par année d’ancienneté).'
      },
      {
        number: 3,
        title: 'Respect du délai de rétractation (15 jours calendaires)',
        description: 'Chaque partie dispose de 15 jours francs pour se rétracter sans justification par lettre recommandée avec AR.',
        tip: 'Comptez 15 jours calendaires révolus à partir du lendemain de la signature.'
      },
      {
        number: 4,
        title: 'Télé-homologation par la DREETS',
        description: 'La convention est envoyée à l’administration. Sans réponse de la DREETS sous 15 jours ouvrables, la rupture est implicitement homologuée.',
        tip: 'Conservez le récépissé de télétransmission en ligne de TéléRC.'
      }
    ],
    errorsToAvoid: [
      'Signer une rupture conventionnelle sous la pression ou le harcèlement (risque d’annulation)',
      'Omettre de vérifier l’homologation effective avant de quitter son poste',
      'Accepter une indemnité inférieure au minimum légal ou conventionnel'
    ],
    templateType: 'rupture'
  },
  {
    id: 'guide-depot-garantie',
    title: 'Récupérer son Dépôt de Garantie (Caution) retenu abusiverment par le propriétaire',
    category: 'Immobilier & Logement',
    iconName: 'Home',
    summary: 'Marche à suivre légale pour contraindre votre bailleur à restituer votre caution sous 1 à 2 mois avec pénalités de retard de 10% par mois.',
    estimatedTime: '15 jours',
    difficulty: 'Facile',
    legalBasis: 'Article 22 de la Loi n° 89-462 du 6 juillet 1989',
    requiredDocuments: [
      'État des lieux d’entrée et État des lieux de sortie signés',
      'Quittances de loyer des 6 derniers mois',
      'Preuve de remise des clés (récépissé ou recommandé)',
      'Mise en demeure de restitution sous 8 jours'
    ],
    steps: [
      {
        number: 1,
        title: 'Comparer l’état des lieux d’entrée et de sortie',
        description: 'Si l’état des lieux de sortie est conforme à celui d’entrée (hors usure normale), le bailleur dispose de 1 mois pour vous restituer l’intégralité du dépôt de garantie.',
        tip: 'La vétusté naturelle du logement ne peut pas être déduite de la caution.'
      },
      {
        number: 2,
        title: 'Mise en demeure préalable obligatoire',
        description: 'Si le délai est dépassé (1 ou 2 mois selon la conformité), envoyez une lettre de mise en demeure en recommandé AR réclamant la somme majorée des pénalités.',
        tip: 'Le solde restant dû est augmenté d’une somme égale à 10% du loyer mensuel hors charges pour chaque mois de retard entamé.'
      },
      {
        number: 3,
        title: 'Saisine de la Commission Départementale de Conciliation (CDC)',
        description: 'En cas de refus du propriétaire, saisissez gratuitement la CDC de votre département pour tenter une résolution amiable rapide.',
        tip: 'La procédure devant la CDC est totalement gratuite et stoppe les frais d’avocat.'
      },
      {
        number: 4,
        title: 'Saisine du Juge de Contentieux de la Protection (JCP)',
        description: 'En l’absence d’accord, déposez une requête sans avocat devant le Tribunal Judiciaire territorialement compétent.',
        tip: 'Utilisez le formulaire Cerfa n° 16042*01 de requête au greffe.'
      }
    ],
    errorsToAvoid: [
      'Partir sans signer d’état des lieux de sortie contradictoire',
      'Ne pas réclamer les justificatifs et factures détaillées des travaux retenus',
      'Arrêter de payer le dernier mois de loyer (interdit par la loi)'
    ],
    templateType: 'bail'
  },
  {
    id: 'guide-divorce-consentement',
    title: 'Engager une procédure de Divorce par Consentement Mutuel (Divorce sans juge)',
    category: 'Famille & Succession',
    iconName: 'Users',
    summary: 'Comprendre les étapes et obligations juridiques du divorce amiable par acte sous signature d’avocats déposé au rang des minutes d’un notaire.',
    estimatedTime: '1 à 3 mois',
    difficulty: 'Intermédiaire',
    legalBasis: 'Articles 229-1 et suivants du Code civil',
    requiredDocuments: [
      'Copie intégrale de l’acte de mariage (moins de 3 mois)',
      'Actes de naissance des époux et des enfants communs',
      'Livret de famille original',
      'Convention d’avocats et état liquidatif du patrimoine immobilier rédigé par notaire'
    ],
    steps: [
      {
        number: 1,
        title: 'Choix de deux avocats distincts obligatoires',
        description: 'Chaque époux doit obligatoirement être représenté par son propre avocat indépendant pour éviter tout conflit d’intérêts.',
        tip: 'Un avocat unique pour les deux époux n’est plus autorisé depuis la réforme 2017.'
      },
      {
        number: 2,
        title: 'Négociation et rédaction de la Convention de Divorce',
        description: 'La convention règle toutes les conséquences : résidence des enfants, pension alimentaire, prestation compensatoire, partage des biens.',
        tip: 'Les enfants mineurs doivent être informés de leur droit d’être entendus par un juge via un formulaire dédié.'
      },
      {
        number: 3,
        title: 'Délai de réflexion de 15 jours',
        description: 'La projet de convention est notifié par chaque avocat à son client par LRAR. Un délai de réflexion obligatoire de 15 jours doit être respecté avant signature.',
        tip: 'Toute signature avant l’expiration exacte des 15 jours entraîne la nullité de la convention.'
      },
      {
        number: 4,
        title: 'Dépôt au rang des minutes du Notaire',
        description: 'Dans les 7 jours suivant la signature, la convention est transmise au notaire qui contrôle le formalisme et procède au dépôt.',
        tip: 'Le dépôt donne à la convention date certaine et force exécutoire sur tout le territoire.'
      }
    ],
    errorsToAvoid: [
      'Dissimuler des éléments de patrimoine ou des comptes bancaires',
      'Omettre la notification préalable aux enfants mineurs formés de leur droit à l’écoute',
      'Tenter de signer sans le respect strict du délai de 15 jours de rétractation'
    ],
    templateType: 'divorce'
  },
  {
    id: 'guide-litige-consommation',
    title: 'Résoudre un litige commercial, arnaque internet ou inexécution de contrat',
    category: 'Consommation & Litiges',
    iconName: 'Scale',
    summary: 'Comment utiliser la médiation de la consommation, SignalConso, et la mise en demeure pour obtenir le remboursement intégral d’un achat.',
    estimatedTime: '7 à 20 jours',
    difficulty: 'Facile',
    legalBasis: 'Articles L. 211-1 et suivants du Code de la consommation & Art. 1103 Code civil',
    requiredDocuments: [
      'Bon de commande, facture d’achat et preuve de paiement',
      'Historique des réclamations écrites envoyées au service client',
      'Captures d’écran de l’offre commerciale ou des conditions générales de vente (CGV)',
      'Signalement officiel effectué sur SignalConso.gouv.fr'
    ],
    steps: [
      {
        number: 1,
        title: 'Exercer son Droit de Rétractation (14 jours)',
        description: 'Pour tout achat à distance (internet, téléphone), vous disposez de 14 jours francs pour annuler votre commande sans motif ni pénalité.',
        tip: 'Le vendeur doit vous rembourser la totalité des sommes versées sous 14 jours.'
      },
      {
        number: 2,
        title: 'Signalement auprès de la DGCCRF via SignalConso',
        description: 'En cas de refus du marchand ou de pratique commerciale trompeuse, déposez un signalement sur le portail officiel SignalConso.',
        tip: 'Le signalement incite le professionnel à régler le litige sous contrôle de la répression des fraudes.'
      },
      {
        number: 3,
        title: 'Mise en demeure et saisine du Médiateur de la Consommation',
        description: 'Envoyez une lettre recommandée de mise en demeure d’exécuter ou de rembourser. En l’absence de réponse sous 30 jours, saisissez le médiateur désigné au contrat.',
        tip: 'La médiation de la consommation est totalement gratuite pour le consommateur.'
      },
      {
        number: 4,
        title: 'Procédure simplifiée du Tribunal (Demande en injonction de payer)',
        description: 'Pour les litiges inférieurs à 5 000 €, saisissez le juge judiciaire par requête simplifiée d’injonction de faire ou de payer.',
        tip: 'Remplissez le formulaire Cerfa n° 16000*01 de saisine gratuite du tribunal.'
      }
    ],
    errorsToAvoid: [
      'Laisser passer le délai de rétractation de 14 jours sans courrier écrit probant',
      'Payer des frais de médiation (la médiation commerciale est obligatoirement gratuite pour vous)',
      'Négocier uniquement par téléphone sans garder de traces écrites'
    ],
    templateType: 'litige'
  },
  {
    id: 'guide-creation-entreprise',
    title: 'Créer et immatriculer son entreprise en France (Auto-entrepreneur, SASU, EURL)',
    category: 'Entreprise & Sociétés',
    iconName: 'Building2',
    summary: 'Les formalités d’immatriculation au Guichet Unique de l’INPI, la rédaction des statuts et la protection du patrimoine personnel.',
    estimatedTime: '2 à 5 jours',
    difficulty: 'Intermédiaire',
    legalBasis: 'Loi n° 2019-486 (Loi PACTE) & Code de commerce',
    requiredDocuments: [
      'Justificatif de domicile de moins de 3 mois ou bail commercial',
      'Pièce d’identité certifiée conforme à l’original par le fondateur',
      'Attestation de parution de l’annonce légale',
      'Certificat de dépôt des fonds délivré par la banque'
    ],
    steps: [
      {
        number: 1,
        title: 'Choix du statut juridique et fiscal adapté',
        description: 'Arbitrez entre Entreprise Individuelle (Auto-entrepreneur) ou Société commerciale (SASU / EURL). Évaluez le régime d’imposition (IR vs IS) et la protection sociale.',
        tip: 'L’entreprise individuelle protège automatiquement votre résidence principale des créanciers.'
      },
      {
        number: 2,
        title: 'Dépôt du capital social et rédaction des Statuts',
        description: 'Rédigez les statuts fondateurs (apports, gérance, décisions d’associés) et déposez le capital social sur un compte bancaire bloqué.',
        tip: 'Utilisez un modèle de statuts vérifié par un juriste pour éviter les blocages de l’INPI.'
      },
      {
        number: 3,
        title: 'Publication de l’annonce légale et guichet INPI',
        description: 'Publiez l’avis de constitution dans un Journal d’Annonces Légales (JAL) puis saisissez le dossier sur le portail Guichet Unique (inpi.fr).',
        tip: 'Le Guichet Unique délivre votre numéro SIREN et l’extrait Kbis sous 48h à 72h.'
      },
      {
        number: 4,
        title: 'Obtention du Kbis et activation du compte professionnel',
        description: 'Dès réception du Kbis et du numéro de TVA intracommunautaire, débloquez les fonds de la banque et démarrez l’activité.',
        tip: 'Pensez à faire la demande d’ACRE dans les 45 jours si vous êtes demandeur d’emploi.'
      }
    ],
    errorsToAvoid: [
      'Rédiger des statuts avec des clauses de pouvoir contradictoires entre associés',
      'Omettre de souscrire une assurance Responsabilité Civile Professionnelle (RC Pro)',
      'Dépasser les plafonds de chiffre d’affaires de la micro-entreprise sans anticiper le passage à l’IS'
    ],
    templateType: 'entreprise'
  }
];

const GuidePratique: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedGuide, setSelectedGuide] = useState<LegalGuideItem | null>(null);

  const categories = [
    { id: 'Tous', label: t('guide.cat_all', 'Tous les Guides') },
    { id: 'Droit du Travail', label: t('guide.cat_labor', 'Droit du Travail') },
    { id: 'Immobilier & Logement', label: t('guide.cat_housing', 'Immobilier & Logement') },
    { id: 'Famille & Succession', label: t('guide.cat_family', 'Famille & Succession') },
    { id: 'Consommation & Litiges', label: t('guide.cat_consumer', 'Consommation & Litiges') },
    { id: 'Procédures & Justice', label: t('guide.cat_procedure', 'Procédures & Justice') },
    { id: 'Entreprise & Sociétés', label: t('guide.cat_company', 'Entreprise & Sociétés') }
  ];

  const translatedGuides = useMemo(() => {
    return GUIDES_DATABASE.map((guide) => ({
      ...guide,
      title: t(`guide.${guide.id}.title`, guide.title),
      summary: t(`guide.${guide.id}.summary`, guide.summary),
      legalBasis: t(`guide.${guide.id}.legalBasis`, guide.legalBasis),
      estimatedTime: t(`guide.${guide.id}.estimatedTime`, guide.estimatedTime),
      difficulty: t(`guide.diff_${guide.difficulty.toLowerCase()}`, guide.difficulty),
      requiredDocuments: guide.requiredDocuments.map((doc, idx) => t(`guide.${guide.id}.doc_${idx}`, doc)),
      steps: guide.steps.map((step) => ({
        ...step,
        title: t(`guide.${guide.id}.step_${step.number}_title`, step.title),
        description: t(`guide.${guide.id}.step_${step.number}_desc`, step.description),
        tip: step.tip ? t(`guide.${guide.id}.step_${step.number}_tip`, step.tip) : undefined,
      })),
      errorsToAvoid: guide.errorsToAvoid.map((err, idx) => t(`guide.${guide.id}.error_${idx}`, err)),
    }));
  }, [t]);

  const filteredGuides = useMemo(() => {
    return translatedGuides.filter((guide) => {
      const matchesCat = selectedCategory === 'Tous' || guide.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQ = !q || 
        guide.title.toLowerCase().includes(q) || 
        guide.summary.toLowerCase().includes(q) || 
        guide.legalBasis.toLowerCase().includes(q) ||
        guide.category.toLowerCase().includes(q);

      return matchesCat && matchesQ;
    });
  }, [translatedGuides, selectedCategory, searchQuery]);

  const handleExportPDF = (guide: LegalGuideItem) => {
    const fullText = `GUIDE JURIDIQUE OFFICIEL : ${guide.title}\n\n` +
      `Catégorie : ${guide.category}\n` +
      `Fondement Légal : ${guide.legalBasis}\n` +
      `Temps estimé : ${guide.estimatedTime} | Difficulté : ${guide.difficulty}\n\n` +
      `SYNTHÈSE :\n${guide.summary}\n\n` +
      `PIÈCES OBLIGATOIRES À FOURNIR :\n${guide.requiredDocuments.map(d => `• ${d}`).join('\n')}\n\n` +
      `ÉTAPES PAS À PAS :\n${guide.steps.map(s => `Étape ${s.number}: ${s.title}\n${s.description}\nConseil: ${s.tip || 'N/A'}`).join('\n\n')}\n\n` +
      `ERREURS À ÉVITER :\n${guide.errorsToAvoid.map(e => `⚠️ ${e}`).join('\n')}`;

    generatePDF(fullText, {
      title: guide.title,
      category: guide.category,
      country: 'France',
      year: '2026',
      filename: `guide_juridique_${guide.id}`
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-20">
      <div className="container px-4 mx-auto max-w-7xl space-y-10">

        {/* Hero Banner Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-12 border border-indigo-500/30 shadow-2xl overflow-hidden">
          <div className="relative z-10 space-y-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary-500/20 text-primary-300 border border-primary-400/40 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <BookOpen className="w-4 h-4 text-primary-400" />
              <span>Guides Juridiques Pratiques & Démarches 2026</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              <span className="text-white">Vos Démarches Juridiques</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300">
                Pas à Pas et Sans Erreur
              </span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
              Consultez des guides explicatifs complets, appuyés par les textes officiels du Code civil, Code du travail et du Code de procédure pénale. Téléchargez les modèles de documents et exportez vos fiches en PDF.
            </p>

            {/* Live Search Input */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={t('guide.search_placeholder', 'Rechercher un guide (ex: plainte, rupture conventionnelle, caution, divorce, litige)...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-700 rounded-2xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/30 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <Scale className="absolute -right-10 -bottom-10 h-72 w-72 text-indigo-500/10 pointer-events-none" />
        </div>

        {/* Category Navigation Filter Pills */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('guide.filter_domain', 'Filtrer par domaine juridique :')}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              <strong className="text-amber-300 font-black">{filteredGuides.length}</strong> {t('guide.available_count', 'guide(s) disponible(s)')}
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4.5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 border-primary-400 text-white shadow-lg shadow-primary-950/60 ring-1 ring-primary-400'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Guides Grid Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGuides.map((guide, idx) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-primary-400 hover:shadow-2xl hover:shadow-primary-950/40 transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Header Info */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 bg-primary-950 text-primary-300 border border-primary-800 rounded-xl text-[11px] font-black uppercase">
                    {guide.category}
                  </span>

                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {guide.estimatedTime}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-black text-white group-hover:text-primary-300 transition-colors leading-snug">
                  {guide.title}
                </h3>

                {/* Summary */}
                <p className="text-slate-300 text-xs leading-relaxed line-clamp-3 font-medium">
                  {guide.summary}
                </p>

                {/* Legal Basis Callout */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{guide.legalBasis}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => setSelectedGuide(guide)}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-primary-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md group-hover:bg-primary-600"
                >
                  <span>{t('guide.read_full', 'Consulter le guide complet')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGuides.length === 0 && (
          <div className="text-center py-20 bg-slate-900 rounded-3xl border border-dashed border-slate-800 p-8 space-y-4">
            <BookOpen className="h-16 w-16 text-slate-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-300">
              {t('guide.empty_title', 'Aucun guide juridique ne correspond à votre recherche')}
            </h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              {t('guide.empty_desc', 'Essayez de modifier votre mot-clé ou réinitialisez les filtres par catégorie.')}
            </p>
            <button
              onClick={() => { setSelectedCategory('Tous'); setSearchQuery(''); }}
              className="bg-primary-600 hover:bg-primary-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all"
            >
              {t('guide.reset_filters', 'Réinitialiser les filtres')}
            </button>
          </div>
        )}

        {/* Detailed Modal Reader */}
        <AnimatePresence>
          {selectedGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              >
                {/* Modal Header */}
                <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-primary-950 text-primary-300 border border-primary-800 rounded-lg text-xs font-black uppercase">
                        {selectedGuide.category}
                      </span>
                      <span className="px-3 py-1 bg-slate-800 text-amber-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {selectedGuide.estimatedTime}
                      </span>
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold">
                        {t('guide.difficulty_label', 'Difficulté :')} {selectedGuide.difficulty}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                      {selectedGuide.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => setSelectedGuide(null)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body Content */}
                <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1 text-slate-300 text-sm leading-relaxed">
                  
                  {/* Legal Basis Callout */}
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex items-center gap-3">
                    <Scale className="w-6 h-6 text-indigo-400 shrink-0" />
                    <div>
                      <strong className="text-white text-xs block font-bold">{t('guide.legal_basis_title', 'Fondement légal et textes de référence :')}</strong>
                      <span className="text-indigo-200 text-xs font-mono">{selectedGuide.legalBasis}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-2">
                    <h4 className="text-white font-extrabold text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary-400" />
                      <span>{t('guide.summary_title', 'Présentation et objectifs du guide :')}</span>
                    </h4>
                    <p className="text-slate-200 text-sm leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      {selectedGuide.summary}
                    </p>
                  </div>

                  {/* Required Documents */}
                  <div className="space-y-3">
                    <h4 className="text-white font-extrabold text-base flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span>{t('guide.documents_title', 'Pièces et documents obligatoires à réunir :')}</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedGuide.requiredDocuments.map((doc, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step-by-Step Procedure Timeline */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-white font-extrabold text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{t('guide.steps_title', 'Étapes chronologiques de la procédure :')}</span>
                    </h4>

                    <div className="space-y-4">
                      {selectedGuide.steps.map((step) => (
                        <div key={step.number} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 relative">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-full bg-primary-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                              {step.number}
                            </span>
                            <h5 className="text-white font-bold text-sm">
                              {step.title}
                            </h5>
                          </div>
                          <p className="text-slate-300 text-xs leading-relaxed pl-10">
                            {step.description}
                          </p>
                          {step.tip && (
                            <div className="ml-10 p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-200 text-xs flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                              <span><strong>{t('guide.tip_label', 'Conseil Pratique :')}</strong> {step.tip}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Errors to Avoid */}
                  <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3">
                    <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
                      <AlertTriangle className="w-5 h-5" />
                      <span>{t('guide.errors_title', 'Erreurs fatales à éviter obligatoirement :')}</span>
                    </div>
                    <ul className="space-y-2 text-xs text-rose-200">
                      {selectedGuide.errorsToAvoid.map((err, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <button
                    onClick={() => navigate('/generator')}
                    className="flex items-center gap-2 text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-primary-400" />
                    <span>{t('guide.generate_linked', 'Générer un modèle de document lié')}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleExportPDF(selectedGuide)}
                      className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t('guide.export_pdf', 'Exporter le Guide en PDF')}</span>
                    </button>

                    <button
                      onClick={() => setSelectedGuide(null)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      {t('common.close', 'Fermer')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default GuidePratique;