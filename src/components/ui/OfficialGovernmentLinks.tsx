import React, { useState } from 'react';
import { ExternalLink, Building2, BookOpen, ShieldCheck, Scale, FileText, Globe, Search, Award } from 'lucide-react';
import { Card, CardContent } from './Card';
import { useTranslation } from '../../i18n';

export interface OfficialLinkItem {
  name: string;
  url: string;
  description: string;
  category: 'laws' | 'ministries' | 'courts' | 'business' | 'rights';
  badge: string;
  isPopular?: boolean;
}

export const OFFICIAL_GOVERNMENT_LINKS: OfficialLinkItem[] = [
  // 1. Textes & Codes Officiels
  {
    name: 'Légifrance',
    url: 'https://www.legifrance.gouv.fr/',
    description: 'Le service public officiel de la diffusion du droit français (Codes, lois, décrets, jurisprudence).',
    category: 'laws',
    badge: 'Référence Officielle',
    isPopular: true
  },
  {
    name: 'Journal Officiel (JO)',
    url: 'https://www.journal-officiel.gouv.fr/',
    description: 'Publication quotidienne des lois et actes administratifs de la République Française.',
    category: 'laws',
    badge: 'JOFR'
  },
  {
    name: 'EUR-Lex',
    url: 'https://eur-lex.europa.eu/',
    description: 'Accès direct au droit de l\'Union Européenne (Traités, directives, règlements, CJUE).',
    category: 'laws',
    badge: 'Union Européenne',
    isPopular: true
  },
  {
    name: 'Code Civil Français',
    url: 'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721/',
    description: 'Texte intégral officiel du Code civil français réactualisé.',
    category: 'laws',
    badge: 'Code Officiel'
  },
  {
    name: 'Code du Travail',
    url: 'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006072050/',
    description: 'Règlementation officielle des relations de travail, contrats, licenciements et Prud\'hommes.',
    category: 'laws',
    badge: 'Code Officiel'
  },

  // 2. Portails Ministériels & Justice
  {
    name: 'Service-Public.fr',
    url: 'https://www.service-public.fr/',
    description: 'Le site officiel d\'information de l\'administration française pour les citoyens et démarches.',
    category: 'ministries',
    badge: 'Gouvernement',
    isPopular: true
  },
  {
    name: 'Ministère de la Justice',
    url: 'https://www.justice.gouv.fr/',
    description: 'Portail institutionnel de l\'administration judiciaire et des réformes de la Justice.',
    category: 'ministries',
    badge: 'Ministère',
    isPopular: true
  },
  {
    name: 'Justice.fr',
    url: 'https://www.justice.fr/',
    description: 'Portail d\'orientation des usagers, demandes d\'aide juridictionnelle et formulaires Cerfa.',
    category: 'ministries',
    badge: 'Portail Usagers'
  },
  {
    name: 'Ministère du Travail',
    url: 'https://travail-emploi.gouv.fr/',
    description: 'Fiches pratiques du droit du travail, conventions collectives et démarches d\'emploi.',
    category: 'ministries',
    badge: 'Ministère'
  },

  // 3. Hautes Juridictions & Ordres
  {
    name: 'Conseil National des Barreaux (CNB)',
    url: 'https://www.cnb.avocat.fr/',
    description: 'Établissement d\'utilité publique représentant l\'ensemble des avocats de France.',
    category: 'courts',
    badge: 'Ordre National',
    isPopular: true
  },
  {
    name: 'Cour de Cassation',
    url: 'https://www.courdecassation.fr/',
    description: 'Plus haute juridiction de l\'ordre judiciaire en France (matières civile, commerciale, sociale et pénale).',
    category: 'courts',
    badge: 'Ordre Judiciaire',
    isPopular: true
  },
  {
    name: 'Conseil d\'État',
    url: 'https://www.conseil-etat.fr/',
    description: 'Juridiction administrative suprême et conseiller du gouvernement pour les projets de loi.',
    category: 'courts',
    badge: 'Ordre Administratif'
  },
  {
    name: 'Conseil Constitutionnel',
    url: 'https://www.conseil-constitutionnel.fr/',
    description: 'Garant de la conformité des lois à la Constitution (QPC & contrôle de constitutionnalité).',
    category: 'courts',
    badge: 'Constitution'
  },
  {
    name: 'CEDH — Cour Européenne',
    url: 'https://www.echr.coe.int/',
    description: 'Cour Européenne des Droits de l\'Homme garantissant la Convention Européenne des Droits de l\'Homme.',
    category: 'courts',
    badge: 'International'
  },

  // 4. Entreprises & Registres
  {
    name: 'Pappers.fr',
    url: 'https://www.pappers.fr/',
    description: 'Plateforme gratuite de recherche d\'informations légales, statuts et comptes des entreprises.',
    category: 'business',
    badge: 'Données Entreprises',
    isPopular: true
  },
  {
    name: 'Infogreffe / RCS',
    url: 'https://www.infogreffe.fr/',
    description: 'Registre du Commerce et des Sociétés et annonces légales des Greffes des Tribunaux de Commerce.',
    category: 'business',
    badge: 'Greffe'
  },
  {
    name: 'INPI — Propriété Industrielle',
    url: 'https://www.inpi.fr/',
    description: 'Institut National de la Propriété Industrielle pour le dépôt de marques, brevets et modèles.',
    category: 'business',
    badge: 'Marques & Brevets'
  },
  {
    name: 'Data.gouv.fr',
    url: 'https://www.data.gouv.fr/',
    description: 'Plateforme ouverte des données publiques de l\'État français (Open Data officiel).',
    category: 'business',
    badge: 'Open Data'
  },

  // 5. Droits & Libertés
  {
    name: 'CNIL — RGPD',
    url: 'https://www.cnil.fr/',
    description: 'Commission Nationale de l\'Informatique et des Libertés (Protection des données personnelles).',
    category: 'rights',
    badge: 'Données Personnelles',
    isPopular: true
  },
  {
    name: 'Défenseur des Droits',
    url: 'https://www.defenseurdesdroits.fr/',
    description: 'Institution constitutionnelle indépendante chargée de défendre les droits des usagers.',
    category: 'rights',
    badge: 'Institution'
  },
  {
    name: 'ANTS — Titres Sécurisés',
    url: 'https://ants.gouv.fr/',
    description: 'Agence Nationale des Titres Sécurisés (Passeports, Cartes d\'identité, Permis de conduire).',
    category: 'rights',
    badge: 'Démarches'
  }
];

export const OfficialGovernmentLinks: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: t('gov.cat_all', 'Tous les Portails (20+)'), icon: Globe },
    { id: 'laws', label: t('gov.cat_laws', 'Textes & Codes Officiels'), icon: BookOpen },
    { id: 'ministries', label: t('gov.cat_ministries', 'Gouvernement & Ministères'), icon: Building2 },
    { id: 'courts', label: t('gov.cat_courts', 'Hautes Juridictions & Ordres'), icon: Scale },
    { id: 'business', label: t('gov.cat_business', 'Entreprises & Registres'), icon: FileText },
    { id: 'rights', label: t('gov.cat_rights', 'Droits & Libertés'), icon: ShieldCheck },
  ];

  const filteredLinks = OFFICIAL_GOVERNMENT_LINKS.filter(link => {
    const matchesCategory = activeCategory === 'all' || link.category === activeCategory;
    const matchesSearch = link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          link.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-14 bg-slate-950 text-slate-100 relative overflow-hidden border-t border-slate-800">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        
        {/* Header Title */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-300 border border-blue-500/30 shadow-md">
            <Award className="w-4 h-4 text-blue-400" />
            <span>Portails Officiels de l'État & Références Légales Partenaires</span>
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Accès Direct aux Sources du Droit Français & Européen
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            FranceJustice (francejustice.com) s'interconnecte en direct avec les plateformes gouvernementales officielles pour vous garantir la traçabilité juridique la plus stricte.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-4">
          
          {/* Search Input */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un site officiel (ex: Légifrance, CNB, Pappers...)"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.03]'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((item, idx) => (
            <Card
              key={idx}
              className="bg-slate-900/90 border-slate-800/90 hover:border-blue-500/50 transition-all duration-300 group hover:shadow-xl hover:shadow-blue-500/10 rounded-2xl overflow-hidden backdrop-blur-md"
            >
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      {item.badge}
                    </span>

                    {item.isPopular && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        ⭐ Incontournable
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-extrabold text-white group-hover:text-blue-300 transition-colors flex items-center gap-2">
                    {item.name}
                  </h3>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
                    {item.url.replace('https://www.', '').replace('https://', '')}
                  </span>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 group-hover:text-blue-300 hover:underline"
                  >
                    <span>Visiter</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-400 font-medium">
            💡 FranceJustice.com est une initiative indépendante. Pour toute démarche officielle, vous pouvez également consulter le portail central <a href="https://www.service-public.fr" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">Service-Public.fr</a>.
          </p>
        </div>

      </div>
    </section>
  );
};

export default OfficialGovernmentLinks;
