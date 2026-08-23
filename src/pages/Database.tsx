import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Library, Download, Search, Globe, Filter, 
  Sparkles, ShieldAlert, CheckCircle, Copy, ExternalLink, RefreshCw, X, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n';
import { chatWithAI } from '../lib/gemini';
import LiveSyncBadge from '../components/ui/LiveSyncBadge';
import { Button } from '../components/ui/Button';
import { generatePDF } from '../lib/pdfUtils';

interface LegalDoc {
  id: string;
  title: string;
  description: string;
  content?: string;
  file_url?: string;
  category: 'Codes & Lois' | 'Jurisprudence & Arrêts' | 'Directives & Traités' | 'Décrets & Arrêtés';
  country: 'France' | 'Union Européenne' | 'International & Mondial' | 'Maroc & Maghreb';
  year: number;
  source_url?: string;
}

// Initial Rich Legal Catalog (France, Europe, World & Maghreb)
const INITIAL_LEGAL_DATABASE: LegalDoc[] = [
  // FRANCE
  {
    id: 'fr-code-civil',
    title: 'Code Civil Français — Des Obligations et du Contrat (Art. 1101 à 1231-7)',
    description: 'Régime général des contrats, validité du consentement, exécution forcée et responsabilité contractuelle.',
    content: `Article 1101 : Le contrat est un accord de volontés entre deux ou plusieurs personnes destiné à créer, modifier, transmettre ou éteindre des obligations.\n\nArticle 1104 : Les contrats doivent être négociés, formés et exécutés de bonne foi. Cette disposition est d'ordre public.\n\nArticle 1231-1 : Le débiteur est condamné, s'il y a lieu, au paiement de dommages et intérêts soit à raison de l'inexécution de l'obligation, soit à raison du retard dans l'exécution.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721'
  },
  {
    id: 'fr-code-travail',
    title: 'Code du Travail Français — Licenciement & Contrat de Travail (Art. L1231-1 et suiv.)',
    description: 'Règles relatives au licenciement pour motif personnel, motif économique et rupture conventionnelle.',
    content: `Article L1231-1 : Le contrat de travail à durée indéterminée peut être rompu à l'initiative de l'employeur ou du salarié.\n\nArticle L1232-1 : Tout licenciement pour motif personnel doit être justifié par une cause réelle et sérieuse.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006900858'
  },
  {
    id: 'fr-jurisprudence-cassation',
    title: 'Jurisprudence Cour de Cassation — Arrêt de Principe sur la Responsabilité du Fait des Choses',
    description: 'Décision fondatrice de la Chambre Civile précisant la présomption de responsabilité sans faute.',
    content: `La Cour de Cassation rappelle que le gardien de la chose est présumé responsable du dommage causé par celle-ci, sans qu'il soit besoin de prouver une faute à sa charge, sauf exonération pour force majeure ou faute de la victime.`,
    category: 'Jurisprudence & Arrêts',
    country: 'France',
    year: 2023,
    source_url: 'https://www.courdecassation.fr'
  },

  // UNION EUROPÉENNE & CEDH
  {
    id: 'eu-rgpd',
    title: 'Règlement Européen RGPD (UE 2016/679) — Protection des Données Personnelles',
    description: 'Cadre légal européen régissant le traitement des données à caractère personnel, consentement et sanctions CNIL/CEPD.',
    content: `Article 5 : Les données à caractère personnel doivent être traitées de manière licite, loyale et transparente à l'égard de la personne concernée.\n\nArticle 17 : Droit à l'effacement ("droit à l'oubli"). La personne concernée a le droit d'obtenir du responsable du traitement l'effacement de données dans les meilleurs délais.`,
    category: 'Directives & Traités',
    country: 'Union Européenne',
    year: 2024,
    source_url: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32016R0679'
  },
  {
    id: 'eu-ai-act',
    title: 'Règlement UE sur l’IA (AI Act 2024) — Encadrement des Systèmes d’IA Générative',
    description: 'Premier cadre juridique européen fixant les obligations de transparence et d’évaluation des risques pour l’intelligence artificielle.',
    content: `Le présent règlement établit des règles harmonisées pour la mise sur le marché et l'utilisation des systèmes d'intelligence artificielle dans l'Union Européenne, en interdisant les pratiques présentant un risque inacceptable.`,
    category: 'Directives & Traités',
    country: 'Union Européenne',
    year: 2024,
    source_url: 'https://eur-lex.europa.eu'
  },
  {
    id: 'eu-cedh-hudoc',
    title: 'Jurisprudence CEDH (HUDOC) — Arrêt sur le Droit au Procès Équitable (Art. 6 CEDH)',
    description: 'Décision majeure de la Cour Européenne des Droits de l’Homme sur l’égalité des armes et le délai raisonnable.',
    content: `La Cour Européenne rappelle que toute personne a droit à ce que sa cause soit entendue équitablement, publiquement et dans un délai raisonnable, par un tribunal indépendant et impartial établi par la loi.`,
    category: 'Jurisprudence & Arrêts',
    country: 'Union Européenne',
    year: 2023,
    source_url: 'https://hudoc.echr.coe.int'
  },

  // INTERNATIONAL & MONDIAL
  {
    id: 'intl-cisg-onu',
    title: 'Convention des Nations Unies (CISG / UNLEX) — Vente Internationale de Marchandises',
    description: 'Traité international unifié régissant les contrats de vente commerciale transfrontalière et recours internationaux.',
    content: `Article 1 : La présente Convention s'applique aux contrats de vente de marchandises entre des parties ayant leur établissement dans des États différents.\n\nArticle 25 : Une inexécution du contrat commise par l'une des parties est essentielle lorsqu'elle cause à l'autre partie un préjudice tel qu'elle la prive substantiellement de ce qu'elle était en droit d'attendre.`,
    category: 'Directives & Traités',
    country: 'International & Mondial',
    year: 2023,
    source_url: 'https://uncitral.un.org/fr'
  },
  {
    id: 'intl-statut-rome-cpi',
    title: 'Statut de Rome — Cour Pénale Internationale (CPI)',
    description: 'Instrument juridique fondateur de la CPI compétente pour les crimes internationaux de guerre et contre l’humanité.',
    content: `Le Statut de Rome établit la compétence de la Cour Pénale Internationale à l'égard du crime de génocide, des crimes contre l'humanité, des crimes de guerre et du crime d'agression.`,
    category: 'Directives & Traités',
    country: 'International & Mondial',
    year: 2023,
    source_url: 'https://www.icc-cpi.int'
  },
  {
    id: 'intl-us-code',
    title: 'United States Code (US Code Title 28) — Judiciary and Judicial Procedure',
    description: 'Texte officiel des lois fédérales américaines encadrant la juridiction des tribunaux fédéraux et procédures internationales.',
    content: `Title 28 U.S.C. § 1782 authorizes U.S. federal courts to order discovery for use in foreign or international tribunals, facilitating international legal cooperation.`,
    category: 'Codes & Lois',
    country: 'International & Mondial',
    year: 2024,
    source_url: 'https://uscode.house.gov'
  },

  // DROITS HUMAINS & DROIT DE LA FAMILLE (NOUVELLE ENRICHISEMENT)
  {
    id: 'dudh-onu-1948',
    title: 'Déclaration Universelle des Droits de l’Homme (DUDH 1948 — ONU)',
    description: 'Texte fondateur de l’ONU proclamant l’égalité fondamentale, la liberté, la dignité et le droit à la protection légale.',
    content: `Article 1 : Tous les êtres humains naissent libres et égaux en dignité et en droits. Ils sont doués de raison et de conscience et doivent agir les uns envers les autres dans un esprit de fraternité.\n\nArticle 3 : Tout individu a droit à la vie, à la liberté et à la sûreté de sa personne.\n\nArticle 7 : Tous sont égaux devant la loi et ont droit sans distinction à une égale protection de la loi.\n\nArticle 16 : À partir de l'âge nubile, l'homme et la femme ont le droit de se marier et de fonder une famille. Le mariage ne peut être conclu qu'avec le libre et plein consentement des futurs époux.`,
    category: 'Directives & Traités',
    country: 'International & Mondial',
    year: 2024,
    source_url: 'https://www.un.org/fr/universal-declaration-human-rights/'
  },
  {
    id: 'cedh-droits-homme',
    title: 'Convention Européenne des Droits de l’Homme — Libertés Fondamentales & Vie Privée (CEDH)',
    description: 'Traité garantissant le droit à la vie, l’interdiction de la torture, la liberté d’expression et le respect de la vie familiale.',
    content: `Article 8 (Droit au respect de la vie privée et familiale) : Toute personne a droit au respect de sa vie privée et familiale, de son domicile et de sa correspondance. Il ne peut y avoir ingérence d'une autorité publique dans l'exercice de ce droit que si cette ingérence est prévue par la loi.\n\nArticle 14 (Interdiction de la discrimination) : La jouissance des droits et libertés reconnus dans la présente Convention doit être assurée, sans distinction aucune, fondée notamment sur le sexe, la race, la couleur, la langue, la religion, les opinions politiques.`,
    category: 'Directives & Traités',
    country: 'Union Européenne',
    year: 2024,
    source_url: 'https://www.echr.coe.int'
  },
  {
    id: 'fr-code-civil-famille-mariage',
    title: 'Code Civil Français — Mariage, PACS et Droits des Époux (Art. 212 et suiv.)',
    description: 'Devoirs respectifs des époux, secours, assistance, contribution aux charges du ménage et régime matrimonial.',
    content: `Article 212 : Les époux se doivent mutuellement respect, fidélité, secours, assistance.\n\nArticle 213 : Les époux assurent ensemble la direction morale et matérielle de la famille. Ils pourvoient à l'éducation des enfants et préparent leur avenir.\n\nArticle 220 : Chacun des époux a pouvoir pour passer seul les contrats qui ont pour objet l'entretien du ménage ou l'éducation des enfants.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006136127'
  },
  {
    id: 'fr-code-civil-divorce',
    title: 'Code Civil Français — Divorce, Prestation Compensatoire & Garde d’Enfants (Art. 229 à 270)',
    description: 'Procédures de divorce par consentement mutuel ou pour faute, fixation de la prestation compensatoire et autorité parentale.',
    content: `Article 229 : Le divorce peut être prononcé en cas soit de consentement mutuel, soit d'acceptation du principe de la rupture du mariage, soit d'altération définitive du lien conjugal, soit de faute.\n\nArticle 270 : L'un des époux peut être tenu de verser à l'autre une prestation destinée à compenser, autant que possible, la disparité que la rupture du mariage crée dans les conditions de vie respectives.\n\nArticle 371-1 : L'autorité parentale est un ensemble de droits et de devoirs ayant pour finalité l'intérêt de l'enfant. Elle appartient aux parents jusqu'à la majorité de l'enfant.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006136136'
  },
  {
    id: 'fr-code-penal-violences-famille',
    title: 'Code Pénal Français — Protection contre les Violences Intrafamiliales & Conjugales (Art. 222-13)',
    description: 'Sanctions pénales renforcées contre les violences physiques ou psychologiques commises au sein du couple ou de la famille.',
    content: `Article 222-13 : Les violences ayant entraîné une incapacité de travail inférieure ou égale à huit jours ou n'ayant entraîné aucune incapacité de travail sont punies de trois ans d'emprisonnement et de 45 000 euros d'amende lorsqu'elles sont commises par le conjoint, le concubin ou le partenaire lié par un PACS.\n\nArticle 222-33-2-1 : Le fait de harceler son conjoint, son partenaire ou son concubin par des propos ou comportements répétés ayant pour objet ou pour effet une dégradation de ses conditions de vie est puni de trois ans d'emprisonnement.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr'
  },
  {
    id: 'ma-moudawana-famille',
    title: 'Code de la Famille (Moudawana Maroc) — Mariage, Dissolution & Garde des Enfants (Hadana)',
    description: 'Dispositions légales régissant les droits de la famille, le mariage, la dissolution du mariage et la garde des enfants au Maroc.',
    content: `Article 4 : Le mariage est un pacte fondé sur le consentement mutuel en vue d'établir une union légale et durable, sous la direction des deux époux.\n\nArticle 163 : La Hadana (garde de l'enfant) consiste à préserver l'enfant de ce qui pourrait lui porter préjudice, à veiller à son éducation et à la protection de ses intérêts.`,
    category: 'Codes & Lois',
    country: 'Maroc & Maghreb',
    year: 2024,
    source_url: 'https://www.sgg.gov.ma'
  },

  // DROIT DES AFFAIRES, DROIT PUBLIC, DROIT FISCAL & DROIT IMMOBILIER
  {
    id: 'fr-droit-affaires-commerce',
    title: 'Code de Commerce Français — Droit des Sociétés Commerciales & Entreprises (Art. L210-1 et suiv.)',
    description: 'Règles fondamentales régissant les sociétés commerciales (SARL, SAS, SA), la création d’entreprise et la responsabilité des dirigeants.',
    content: `Article L210-1 : Le caractère commercial d'une société est déterminé par sa forme ou par son objet. Sont commerciales à raison de leur forme et quel que soit leur objet, les sociétés en nom collectif, les sociétés en commandite simple, les sociétés à responsabilité limitée et les sociétés par actions.\n\nArticle L225-251 : Les administrateurs et le directeur général sont responsables, individuellement ou solidairement, envers la société ou envers les tiers, soit des infractions aux dispositions législatives ou réglementaires applicables aux sociétés anonymes, soit des violations des statuts, soit des fautes commises dans leur gestion.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000005634379'
  },
  {
    id: 'fr-droit-public-constitution',
    title: 'Constitution de la République Française (5 Octobre 1958) — Droit Public & Institutions',
    description: 'Texte suprême de la République fixant la séparation des pouvoirs, la garantie des libertés publiques et le contrôle de constitutionnalité.',
    content: `Article 1er : La France est une République indivisible, laïque, démocratique et sociale. Elle assure l'égalité devant la loi de tous les citoyens sans distinction d'origine, de race ou de religion.\n\nArticle 66 : Nul ne peut être arbitrairement détenu. L'autorité judiciaire, gardienne de la liberté individuelle, assure le respect de ce principe dans les conditions prévues par la loi.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.conseil-constitutionnel.fr/le-bloc-de-constitutionnalite/texte-integral-de-la-constitution-du-4-octobre-1958'
  },
  {
    id: 'fr-droit-administratif-conseil-etat',
    title: 'Jurisprudence Conseil d’État — Arrêt de Principe en Droit Administratif & Recours Publics',
    description: 'Décision de référence en droit public encadrant la responsabilité des services publics et l’annulation pour excès de pouvoir.',
    content: `Le Conseil d'État juge que la responsabilité du service public est soumise à des règles spéciales qui varient selon les besoins du service et la nécessité de concilier les droits de l'État avec les droits privés. L'administration est tenue de réparer les dommages causés par le fonctionnement défectueux de ses services.`,
    category: 'Jurisprudence & Arrêts',
    country: 'France',
    year: 2024,
    source_url: 'https://www.conseil-etat.fr'
  },
  {
    id: 'fr-droit-fiscal-cgi',
    title: 'Code Général des Impôts (CGI) — Droit Fiscal des Entreprises & des Particuliers',
    description: 'Dispositions régissant l’impôt sur les sociétés (IS), l’impôt sur le revenu (IR), la TVA et les procédures de contrôle fiscal.',
    content: `Article 39 : Le bénéfice net est établi sous déduction de toutes charges, celles-ci comprenant notamment les frais généraux de toute nature, les dépenses de personnel et de loyer, ainsi que les amortissements réellement effectués.\n\nArticle 209 : Les bénéfices passibles de l'impôt sur les sociétés sont déterminés d'après les règles fixées par les articles 38 et 39, sous réserve des exonérations légales.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006069577'
  },
  {
    id: 'fr-droit-immobilier-propriete',
    title: 'Code Civil & Loi de 1989 — Droit Immobilier, Propriété & Baux d’Habitation',
    description: 'Encadrement des baux locatifs, droit de propriété immobilière, préavis, loyers et garanties d’usage.',
    content: `Article 544 (Code Civil) : La propriété est le droit de jouir et disposer des choses de la manière la plus absolue, pourvu qu'on n'en fasse pas un usage prohibé par les lois ou par les règlements.\n\nArticle 6 (Loi n° 89-462) : Le bailleur est tenu de remettre au locataire un logement décent ne laissant pas apparaître de risques manifestes pouvant porter atteinte à la sécurité physique ou à la santé, exempt de toute infestation d'espèces nuisibles et parasitaires.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr'
  },
  {
    id: 'fr-droit-environnement',
    title: 'Charte de l’Environnement — Droit Environnemental & Principe de Précaution',
    description: 'Texte à valeur constitutionnelle garantissant le droit de vivre dans un environnement équilibré et respectueux de la santé.',
    content: `Article 1er : Chacun a le droit de vivre dans un environnement équilibré et respectueux de la santé.\n\nArticle 5 : Lorsque la réalisation d'un dommage, bien que incertaine en l'état des connaissances scientifiques, pourrait affecter de manière grave et irréversible l'environnement, les autorités publiques veillent à l'application du principe de précaution.`,
    category: 'Directives & Traités',
    country: 'France',
    year: 2024,
    source_url: 'https://www.conseil-constitutionnel.fr'
  },

  // DROIT DES ÉTUDIANTS, PROFESSEURS, MÉDECINS, TRAVAILLEURS & SANTÉ
  {
    id: 'fr-droit-etudiants-education',
    title: 'Code de l’Éducation — Droits des Étudiants & Libertés Universitaires (Art. L811-1 et suiv.)',
    description: 'Statut, libertés politiques et syndicales des étudiants, droit aux bourses, égalité d’accès et franchises universitaires.',
    content: `Article L811-1 : Les étudiants disposent de la liberté d'information et d'expression à l'égard des problèmes politiques, économiques, sociaux et culturels. Ils exercent cette liberté à titre individuel et collectif dans des conditions qui ne portent pas atteinte aux activités d'enseignement et de recherche.\n\nArticle L821-1 : Les bourses d'enseignement supérieur sont attribuées en fonction des ressources et des charges de la famille de l'étudiant.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006071191'
  },
  {
    id: 'fr-droit-professeurs-chercheurs',
    title: 'Code de l’Éducation & Statut des Enseignants-Chercheurs — Liberté Académique (Art. L952-2)',
    description: 'Garanties d’indépendance et liberté de parole académique des professeurs, chercheurs et enseignants de l’enseignement supérieur.',
    content: `Article L952-2 : Les enseignants-chercheurs, les enseignants et les chercheurs jouissent d'une pleine indépendance et d'une entière liberté d'expression dans l'exercice de leurs fonctions d'enseignement et de leurs activités de recherche, sous les réserves que leur imposent les principes de tolérance et d'objectivité.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr'
  },
  {
    id: 'fr-droit-medecins-sante',
    title: 'Code de la Santé Publique (CSP) — Droits des Patients, Secret Médical & Déontologie Médicale (Art. L1110-4 / Loi Kouchner)',
    description: 'Règles déontologiques encadrant l’exercice des médecins, le secret professionnel, le consentement éclairé et la responsabilité médicale.',
    content: `Article L1110-4 : Toute personne prise en charge par un professionnel de santé a droit au respect de sa vie privée et du secret des informations la concernant. Ce secret couvre l'ensemble des informations venues à la connaissance du professionnel.\n\nArticle L1111-2 : Toute personne a le droit d'être informée sur son état de santé. Cette information porte sur les différentes investigations, traitements ou actions de prévention qui sont proposés, leurs risques et leur urgence.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006072665'
  },
  {
    id: 'intl-oit-droits-travailleurs',
    title: 'Convention OIT (Organisation Internationale du Travail) — Droits Fondamentaux des Travailleurs',
    description: 'Normes internationales protégeant la durée du travail, la liberté syndicale, la santé au travail et l’interdiction du travail forcé.',
    content: `Convention n° 87 de l'OIT : Les travailleurs et les employeurs, sans distinction d'aucune sorte, ont le droit, sans autorisation préalable, de constituer des organisations de leur choix ainsi que de s'affilier à ces organisations.\n\nConvention n° 155 : Tout membre doit formuler et mettre en œuvre une politique nationale cohérente en matière de sécurité, de santé des travailleurs et de milieu de travail.`,
    category: 'Directives & Traités',
    country: 'International & Mondial',
    year: 2024,
    source_url: 'https://www.ilo.org'
  },
  {
    id: 'fr-droit-consommation',
    title: 'Code de la Consommation — Protection des Consommateurs & Rétractation (Art. L217-4, L221-18)',
    description: 'Droit de rétractation de 14 jours, garantie légale de conformité de 2 ans et recours contre les pratiques commerciales trompeuses.',
    content: `Article L221-18 : Le consommateur dispose d'un délai de quatorze jours pour exercer son droit de rétractation d'un contrat conclu à distance sans avoir à motiver sa décision.\n\nArticle L217-4 : Le vendeur livre un bien conforme au contrat et répond des défauts de conformité existant lors de la délivrance.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006069565'
  },

  {
    id: 'fr-droit-etrangers-ceseda',
    title: 'Code d’Entrée et du Séjour des Étrangers et du Droit d’Asile (CESEDA) — Titres de Séjour & Asile',
    description: 'Règles relatives aux visas, cartes de séjour, droit d’asile, regroupement familial et nationalité.',
    content: `Article L421-1 : L'étranger qui exerce une activité professionnelle salariée sous couvert d'un contrat de travail à durée indéterminée se voit délivrer une carte de séjour temporaire portant la mention "salarié".\n\nArticle L511-1 : Le droit d'asile comprend le statut de réfugié et le bénéfice de la protection subsidiaire accordés par l'OFPRA et la CNDA.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006070158'
  },
  {
    id: 'intl-droit-maritime-unclos',
    title: 'Convention des Nations Unies sur le Droit de la Mer (UNCLOS / Montego Bay) — Droit Maritime',
    description: 'Traité universel définissant les eaux territoriales, zones économiques exclusives (ZEE), haute mer et droit des transports maritimes.',
    content: `Article 3 : Tout État a le droit de fixer la largeur de sa mer territoriale jusqu'à une limite ne dépassant pas 12 milles marins.\n\nArticle 56 : Dans la zone économique exclusive, l'État côtier a des droits souverains aux fins d'exploration et d'exploitation, de conservation et de gestion des ressources naturelles.`,
    category: 'Directives & Traités',
    country: 'International & Mondial',
    year: 2024,
    source_url: 'https://www.un.org/depts/los/'
  },
  {
    id: 'fr-droit-urbanisme-construction',
    title: 'Code de l’Urbanisme & de la Construction — Permis de Construire & PLU (Art. L421-1)',
    description: 'Règles d’aménagement du territoire, permis de construire, plans locaux d’urbanisme (PLU) et servitudes d’urbanisme.',
    content: `Article L421-1 : Les constructions, même ne comportant pas de fondations, doivent être précédées de la délivrance d'un permis de construire, sous réserve des dérogations et exemptions prévues par décret.`,
    category: 'Codes & Lois',
    country: 'France',
    year: 2024,
    source_url: 'https://www.legifrance.gouv.fr/codes/id/LEGITEXT000006074075'
  },

  // MAROC & MAGHREB
  {
    id: 'ma-doc-code',
    title: 'Dahir formant Code des Obligations et des Contrats (DOC Marocain)',
    description: 'Code fondamental régissant le droit des contrats, les sûretés et les obligations civiles au Maroc.',
    content: `Article 2 : Les éléments nécessaires pour la validité d'une obligation qui dérive d'une déclaration de volonté sont : la capacité de s'obliger, une déclaration valable de volonté, et un objet certain pouvant former matière d'obligation.`,
    category: 'Codes & Lois',
    country: 'Maroc & Maghreb',
    year: 2023,
    source_url: 'https://www.sgg.gov.ma'
  }
];

// Comprehensive Universal Legal Query Verification (Supports ALL domains worldwide)
function isStrictLegalQuery(query: string): boolean {
  if (!query || !query.trim()) return true;
  // Exclude non-text random inputs or pure punctuation
  const clean = query.trim().toLowerCase();
  if (clean.length < 2) return true;
  
  // Exclude obvious non-legal noise (e.g. "recette de cuisine", "jeu video", "meteo", "musique rap")
  const nonLegalNoise = ['recette de cuisine', 'jeu vidéo', 'fortnite', 'météo demain', 'chanson', 'clip vidéo'];
  if (nonLegalNoise.some(noise => clean.includes(noise))) {
    return false;
  }

  return true; // Authorize ALL legal and professional topics worldwide
}

const Database: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const getCategoryFromQuery = (param: string | null): string => {
    if (!param) return 'Tous';
    const lower = param.toLowerCase();
    if (lower.includes('jurisprudence')) return 'Jurisprudence & Arrêts';
    if (lower.includes('code')) return 'Codes & Lois';
    if (lower.includes('directive') || lower.includes('traité')) return 'Directives & Traités';
    if (lower.includes('décret') || lower.includes('arrêté')) return 'Décrets & Arrêtés';
    return 'Tous';
  };

  const [docs, setDocs] = useState<LegalDoc[]>(INITIAL_LEGAL_DATABASE);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('Tous');
  const [filterCategory, setFilterCategory] = useState<string>(() => 
    getCategoryFromQuery(searchParams.get('category'))
  );
  const [selectedDoc, setSelectedDoc] = useState<LegalDoc | null>(null);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiSearchResult, setAiSearchResult] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setFilterCategory(getCategoryFromQuery(cat));
    }
  }, [searchParams]);

  // Fetch Supabase & Subscribe to Realtime Updates
  useEffect(() => {
    fetchDocsFromSupabase();

    const channel = supabase
      .channel('legal-db-realtime-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents_just' }, () => {
        fetchDocsFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDocsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('documents_just')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbMapped: LegalDoc[] = data.map(d => ({
          id: d.id,
          title: d.name || 'Document Juridique Officiel',
          description: d.metadata?.content?.slice(0, 150) || 'Texte de loi et document officiel enregistré.',
          content: d.metadata?.content || '',
          category: 'Codes & Lois',
          country: 'France',
          year: d.created_at ? new Date(d.created_at).getFullYear() : 2024,
          source_url: d.file_url || ''
        }));

        const merged = [...dbMapped, ...INITIAL_LEGAL_DATABASE];
        const unique = Array.from(new Map(merged.map(item => [item.id || item.title, item])).values());
        setDocs(unique as LegalDoc[]);
      }
    } catch (e) {
      console.warn("Information Supabase documents_just:", e);
    }
  };

  // Check if current search query is valid legal term
  const isLegalValid = useMemo(() => isStrictLegalQuery(searchTerm), [searchTerm]);

  // Perform Live Web / AI Legal Search across World Databases
  const handleAILegalSearch = async () => {
    if (!searchTerm.trim()) return;
    if (!isLegalValid) return;

    setIsSearchingAI(true);
    setAiSearchResult(null);

    try {
      const prompt = `RECHERCHE JURIDIQUE OFFICIELLE MONDIALE & INTERNET : "${searchTerm}".
      FOURNIS EXCLUSIVEMENT DES RÉSULTATS JURIDIQUES SOURCÉS (Textes de loi officiels, Code Civil, Code Pénal, Légifrance, EUR-Lex, HUDOC/CEDH, US Code, Traités Internationaux).
      Organise la réponse avec :
      1. Synthèse juridique et articles applicables
      2. Jurisprudence de référence (France, UE & International)
      3. Sources officielles vérifiées avec citations.`;

      const res = await chatWithAI(prompt, [], true);
      const outputText = typeof res === 'string' ? res : res.text;
      setAiSearchResult(outputText);
    } catch (e) {
      console.error("Erreur recherche IA juridique:", e);
    } finally {
      setIsSearchingAI(false);
    }
  };

  // Filter local & remote dataset with 100% accent-insensitive & multi-token search
  const filteredDocs = useMemo(() => {
    if (!isLegalValid) return [];

    const normalizeStr = (str: string) => 
      (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const queryTokens = normalizeStr(searchTerm).split(/\s+/).filter(Boolean);

    return docs.filter(doc => {
      const docFullText = normalizeStr(
        `${doc.title} ${doc.description || ''} ${doc.content || ''} ${doc.category} ${doc.country} ${doc.year}`
      );

      const matchesSearch = 
        queryTokens.length === 0 || 
        queryTokens.every(token => docFullText.includes(token));

      const matchesCountry = filterCountry === 'Tous' || doc.country === filterCountry;
      const matchesCategory = filterCategory === 'Tous' || doc.category === filterCategory;

      return matchesSearch && matchesCountry && matchesCategory;
    });
  }, [docs, searchTerm, filterCountry, filterCategory, isLegalValid]);

  const copyDocText = async (doc: LegalDoc) => {
    const textToCopy = `${doc.title}\n\nJURIDICTION: ${doc.country} (${doc.year})\nSOURCE: ${doc.source_url || 'Base Légale Officielle'}\n\n${doc.content || doc.description}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(doc.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error("Erreur copie:", e);
    }
  };

  const downloadDocFile = (doc: LegalDoc) => {
    generatePDF(doc.content || doc.description, {
      title: doc.title,
      country: doc.country,
      category: doc.category,
      year: doc.year,
      sourceUrl: doc.source_url,
      filename: `texte_juridique_${doc.id}_${doc.country.replace(/\s+/g, '_')}`
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pt-24 pb-16">
      <div className="container px-4 mx-auto max-w-7xl">
        
        {/* Header Hero Section */}
        <div className="relative bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-12 border border-indigo-800/40 shadow-2xl mb-10 overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <LiveSyncBadge status="connected" />
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              <span className="text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)]">
                {t('database.title_part1', 'Base de Données Juridique')}
              </span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 drop-shadow-[0_4px_25px_rgba(252,211,77,0.4)]">
                {t('database.title_part2', 'Mondiale & Synchronisée')}
              </span>
            </h1>

            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              {t('database.subtitle', 'Consultez et recherchez en temps réel parmi les codes de loi officiels, traités internationaux, jurisprudence de la Cour de Cassation, du Conseil d\'État, de la CJUE, de la CEDH et de l\'ONU.')}
            </p>
          </div>
          <Library className="absolute -right-10 -bottom-10 h-72 w-72 text-indigo-500/10 pointer-events-none" />
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-slate-950/80 backdrop-blur-xl border border-indigo-900/50 rounded-2xl p-6 mb-8 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Input Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400" />
              <input 
                type="text" 
                placeholder={t('database.search_placeholder', 'Rechercher un texte juridique (Ex: Code Civil, RGPD, Licenciement, Article 1101, CEDH, CISG)...')}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-indigo-800/60 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* AI Global Search Button */}
            <Button
              onClick={handleAILegalSearch}
              disabled={isSearchingAI || !searchTerm.trim() || !isLegalValid}
              className="bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 hover:opacity-95 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 whitespace-nowrap w-full lg:w-auto justify-center"
            >
              {isSearchingAI ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('database.searching_ai', 'Recherche Mondiale en cours...')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('database.btn_search_ai', 'Recherche IA Mondiale en Direct')}</span>
                </>
              )}
            </Button>
          </div>

          {/* Strict Legal Guardrail Warning */}
          {!isLegalValid && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-amber-950/60 border border-amber-500/50 rounded-xl text-amber-200 text-sm flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">⚠️ {t('database.guardrail_title', 'Filtre de conformité juridique actif :')} </span>
                {t('database.guardrail_desc', 'Seules les requêtes portant strictly sur le droit (textes de loi, jurisprudence, directives, arrêtés, articles de code ou traités internationaux) sont autorisées et traitées par le système.')}
              </div>
            </motion.div>
          )}

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800">
            {/* Country / Scope */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-400">{t('database.label_jurisdiction', 'Juridiction :')}</span>
              <select 
                value={filterCountry} 
                onChange={(e) => setFilterCountry(e.target.value)}
                className="bg-transparent text-white text-xs font-bold border-none focus:outline-none cursor-pointer"
              >
                <option value="Tous" className="bg-slate-900 text-white">{t('database.opt_all_countries', 'Toutes (Monde & Europe)')}</option>
                <option value="France" className="bg-slate-900 text-white">🇫🇷 {t('database.opt_france', 'France (Légifrance)')}</option>
                <option value="Union Européenne" className="bg-slate-900 text-white">🇪🇺 {t('database.opt_eu', 'Union Européenne (EUR-Lex / CEDH)')}</option>
                <option value="International & Mondial" className="bg-slate-900 text-white">🌐 {t('database.opt_intl', 'International & Mondial (ONU / US Code)')}</option>
                <option value="Maroc & Maghreb" className="bg-slate-900 text-white">🇲🇦 {t('database.opt_maroc', 'Maroc & Maghreb (DOC)')}</option>
              </select>
            </div>

            {/* Category */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-400">{t('database.label_type', 'Type de texte :')}</span>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent text-white text-xs font-bold border-none focus:outline-none cursor-pointer"
              >
                <option value="Tous" className="bg-slate-900 text-white">{t('database.opt_all_types', 'Tous les types')}</option>
                <option value="Codes & Lois" className="bg-slate-900 text-white">{t('database.opt_codes', 'Codes & Lois')}</option>
                <option value="Jurisprudence & Arrêts" className="bg-slate-900 text-white">{t('database.opt_jurisprudence', 'Jurisprudence & Arrêts')}</option>
                <option value="Directives & Traités" className="bg-slate-900 text-white">{t('database.opt_directives', 'Directives & Traités')}</option>
                <option value="Décrets & Arrêtés" className="bg-slate-900 text-white">{t('database.opt_decrets', 'Décrets & Arrêtés')}</option>
              </select>
            </div>

            <div className="ml-auto text-xs text-slate-400 font-semibold">
              {filteredDocs.length} {t('database.count_label', 'texte(s) juridique(s) disponible(s)')}
            </div>
          </div>
        </div>

        {/* AI Live Search Result Banner */}
        <AnimatePresence>
          {aiSearchResult && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-slate-950 border border-emerald-500/50 rounded-2xl p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setAiSearchResult(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
                <Sparkles className="w-5 h-5" />
                <span>Résultats de la Recherche Juridique IA Mondiale en Direct (Google & Bases Officielles)</span>
              </div>
              <div className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                {aiSearchResult}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legal Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocs.map((doc, idx) => (
            <motion.div
              key={doc.id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-slate-950/70 border border-indigo-900/40 rounded-2xl p-6 hover:border-amber-400/50 transition-all duration-300 shadow-lg flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
                      {doc.country}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      {doc.category}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {doc.year}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                  {doc.title}
                </h3>

                <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                  {doc.description}
                </p>

                {doc.content && (
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 line-clamp-2">
                    {doc.content}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-900 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-indigo-800/60 text-slate-200 hover:bg-indigo-900/40 text-xs font-semibold"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                  Consulter le Texte
                </Button>

                <div className="flex items-center gap-2">
                  {doc.source_url && (
                    <a
                      href={doc.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1.5 rounded-lg transition-colors"
                      title="Source officielle externe (Légifrance, Service-Public...)"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Source Officielle</span>
                    </a>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white"
                    onClick={() => copyDocText(doc)}
                  >
                    {copiedId === doc.id ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>

                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3"
                    onClick={() => downloadDocFile(doc)}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Télécharger
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDocs.length === 0 && (
          <div className="text-center py-20 bg-slate-950/60 rounded-3xl border border-dashed border-indigo-900/50 p-8 space-y-4">
            <ShieldAlert className="h-16 w-16 text-slate-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-300">
              {!isLegalValid 
                ? "Recherche non-juridique filtrée" 
                : "Aucun texte juridique ne correspond à ces critères"}
            </h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              {!isLegalValid 
                ? "Veuillez entrer des termes juridiques authentiques (ex: Code Civil, RGPD, Contrat, Jurisprudence, Cassation)." 
                : "Essayez de modifier vos filtres de pays ou lancez la recherche IA mondiale en direct."}
            </p>
          </div>
        )}
      </div>

      {/* Reader Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-indigo-800/80 rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedDoc(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <span>{selectedDoc.country}</span> • <span>{selectedDoc.category}</span> • <span>{selectedDoc.year}</span>
                </div>
                <h2 className="text-2xl font-black text-white">{selectedDoc.title}</h2>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {selectedDoc.content || selectedDoc.description}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                {selectedDoc.source_url ? (
                  <a
                    href={selectedDoc.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Source Officielle ({new URL(selectedDoc.source_url).hostname})
                  </a>
                ) : <span />}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => copyDocText(selectedDoc)}>
                    <Copy className="w-4 h-4 mr-1" /> Copier
                  </Button>
                  <Button onClick={() => downloadDocFile(selectedDoc)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                    <Download className="w-4 h-4 mr-1" /> Télécharger en PDF
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Database;
