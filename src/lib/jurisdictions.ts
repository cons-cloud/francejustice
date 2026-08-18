export interface CourDAppel {
  id: string;
  name: string;
  code: string;
  region: string;
  type: 'Cour d\'Appel' | 'CSM';
  premierPresident: string;
  procureurGeneral: string;
  ville: string;
  adresse?: string;
  telephone?: string;
  email?: string;
}

export const COURS_D_APPEL_LIST: CourDAppel[] = [
  { 
    id: 'ca-paris', 
    name: 'Cour d\'Appel de Paris', 
    code: '75', 
    region: 'Île-de-France', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Jacques Boulard',
    procureurGeneral: 'M. Rémy Heitz',
    ville: 'Paris',
    adresse: '34 Quai des Orfèvres, 75001 Paris',
    telephone: '01 44 32 50 00',
    email: 'ca-paris@justice.fr'
  },
  { 
    id: 'ca-versailles', 
    name: 'Cour d\'Appel de Versailles', 
    code: '78', 
    region: 'Île-de-France', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Jean-François Beynel',
    procureurGeneral: 'M. Marc Cimamonti',
    ville: 'Versailles',
    adresse: '5 Place André Mignot, 78000 Versailles',
    telephone: '01 39 49 67 00',
    email: 'ca-versailles@justice.fr'
  },
  { 
    id: 'ca-aix', 
    name: 'Cour d\'Appel d\'Aix-en-Provence', 
    code: '13', 
    region: 'Provence-Alpes-Côte d\'Azur', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Renaud Le Breton de Vannoise',
    procureurGeneral: 'Mme Marie-Suzanne Le Quéau',
    ville: 'Aix-en-Provence',
    adresse: '20 Place de Verdun, 13100 Aix-en-Provence',
    telephone: '04 42 17 50 00',
    email: 'ca-aix-en-provence@justice.fr'
  },
  { 
    id: 'ca-agen', 
    name: 'Cour d\'Appel d\'Agen', 
    code: '47', 
    region: 'Nouvelle-Aquitaine', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Stéphane Brossard',
    procureurGeneral: 'M. Claude Derens',
    ville: 'Agen',
    adresse: 'Place Armand Fallières, 47000 Agen',
    telephone: '05 53 77 34 00',
    email: 'ca-agen@justice.fr'
  },
  { 
    id: 'ca-amiens', 
    name: 'Cour d\'Appel d\'Amiens', 
    code: '80', 
    region: 'Hauts-de-France', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Pascal Le Luong',
    procureurGeneral: 'M. Éric de Montgolfier',
    ville: 'Amiens',
    adresse: '14 Rue Robert de Luzarches, 80000 Amiens',
    telephone: '03 22 82 33 00',
    email: 'ca-amiens@justice.fr'
  },
  { 
    id: 'ca-angers', 
    name: 'Cour d\'Appel d\'Angers', 
    code: '49', 
    region: 'Pays de la Loire', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Jean-Charles Givron',
    procureurGeneral: 'M. Éric Bouillard',
    ville: 'Angers',
    adresse: 'Place du Ralliement, 49100 Angers',
    telephone: '02 41 20 51 00',
    email: 'ca-angers@justice.fr'
  },
  { 
    id: 'ca-bastia', 
    name: 'Cour d\'Appel de Bastia', 
    code: '2B', 
    region: 'Corse', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. François Racine',
    procureurGeneral: 'M. Jean-Jacques Fagni',
    ville: 'Bastia',
    adresse: 'Rond-Point du Palais de Justice, 20200 Bastia',
    telephone: '04 95 34 11 00',
    email: 'ca-bastia@justice.fr'
  },
  { 
    id: 'ca-besancon', 
    name: 'Cour d\'Appel de Besançon', 
    code: '25', 
    region: 'Bourgogne-Franche-Comté', 
    type: 'Cour d\'Appel',
    premierPresident: 'Mme Joëlle Munoz',
    procureurGeneral: 'M. Christophe Barret',
    ville: 'Besançon',
    adresse: '1 Rue Hôtellerie, 25000 Besançon',
    telephone: '03 81 65 14 00',
    email: 'ca-besancon@justice.fr'
  },
  { 
    id: 'ca-bordeaux', 
    name: 'Cour d\'Appel de Bordeaux', 
    code: '33', 
    region: 'Nouvelle-Aquitaine', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Éric Ruelle',
    procureurGeneral: 'M. Pierre-Yves Couilleau',
    ville: 'Bordeaux',
    adresse: 'Place de la République, 33000 Bordeaux',
    telephone: '05 56 01 37 00',
    email: 'ca-bordeaux@justice.fr'
  },
  { 
    id: 'ca-bourges', 
    name: 'Cour d\'Appel de Bourges', 
    code: '18', 
    region: 'Centre-Val de Loire', 
    type: 'Cour d\'Appel',
    premierPresident: 'Mme Mauricette Danchaud',
    procureurGeneral: 'Mme Marie-Christine Tarrare',
    ville: 'Bourges',
    adresse: '8 Rue des Arènes, 18000 Bourges',
    telephone: '02 48 68 33 00',
    email: 'ca-bourges@justice.fr'
  },
  { 
    id: 'ca-caen', 
    name: 'Cour d\'Appel de Caen', 
    code: '14', 
    region: 'Normandie', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Jean-François Le Pouliquen',
    procureurGeneral: 'M. Stéphane Hardouin',
    ville: 'Caen',
    adresse: 'Place Gambetta, 14000 Caen',
    telephone: '02 31 30 73 00',
    email: 'ca-caen@justice.fr'
  },
  { 
    id: 'ca-chambery', 
    name: 'Cour d\'Appel de Chambéry', 
    code: '73', 
    region: 'Auvergne-Rhône-Alpes', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Michel Allaix',
    procureurGeneral: 'M. Jacques Dallest',
    ville: 'Chambéry',
    adresse: 'Place du Palais de Justice, 73000 Chambéry',
    telephone: '04 79 33 84 00',
    email: 'ca-chambery@justice.fr'
  },
  { 
    id: 'ca-colmar', 
    name: 'Cour d\'Appel de Colmar', 
    code: '68', 
    region: 'Grand Est', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Jean-Pierre Meneveau',
    procureurGeneral: 'M. Jean-François Thony',
    ville: 'Colmar',
    adresse: '9 Avenue Raymond Poincaré, 68000 Colmar',
    telephone: '03 89 20 80 00',
    email: 'ca-colmar@justice.fr'
  },
  { 
    id: 'ca-dijon', 
    name: 'Cour d\'Appel de Dijon', 
    code: '21', 
    region: 'Bourgogne-Franche-Comté', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Bruno Laplane',
    procureurGeneral: 'M. Thierry Pocquet du Haut-Jussé',
    ville: 'Dijon',
    adresse: '8 Rue du Palais, 21000 Dijon',
    telephone: '03 80 44 61 00',
    email: 'ca-dijon@justice.fr'
  },
  { 
    id: 'ca-douai', 
    name: 'Cour d\'Appel de Douai', 
    code: '59', 
    region: 'Hauts-de-France', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Bruno Pireyre',
    procureurGeneral: 'M. Frédéric Fèvre',
    ville: 'Douai',
    adresse: '47 Rue de Clery, 59500 Douai',
    telephone: '03 27 93 27 00',
    email: 'ca-douai@justice.fr'
  },
  { 
    id: 'ca-grenoble', 
    name: 'Cour d\'Appel de Grenoble', 
    code: '38', 
    region: 'Auvergne-Rhône-Alpes', 
    type: 'Cour d\'Appel',
    premierPresident: 'Mme Anne-Marie Gallen',
    procureurGeneral: 'M. Jacques Louvier',
    ville: 'Grenoble',
    adresse: 'Place Firmin Gautier, 38000 Grenoble',
    telephone: '04 76 76 77 00',
    email: 'ca-grenoble@justice.fr'
  },
  { 
    id: 'ca-limoges', 
    name: 'Cour d\'Appel de Limoges', 
    code: '87', 
    region: 'Nouvelle-Aquitaine', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Carl Hemsert',
    procureurGeneral: 'M. Patrick Desjardins',
    ville: 'Limoges',
    adresse: '17 Place d\'Aine, 87000 Limoges',
    telephone: '05 55 79 52 00',
    email: 'ca-limoges@justice.fr'
  },
  { 
    id: 'ca-lyon', 
    name: 'Cour d\'Appel de Lyon', 
    code: '69', 
    region: 'Auvergne-Rhône-Alpes', 
    type: 'Cour d\'Appel',
    premierPresident: 'Mme Catherine Pautrat',
    procureurGeneral: 'Mme Fabienne Klein-Donati',
    ville: 'Lyon',
    adresse: '1 Rue du Palais de Justice, 69005 Lyon',
    telephone: '04 72 77 30 00',
    email: 'ca-lyon@justice.fr'
  },
  { 
    id: 'ca-metz', 
    name: 'Cour d\'Appel de Metz', 
    code: '57', 
    region: 'Grand Est', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Thierry Polle',
    procureurGeneral: 'M. Thomas Pison',
    ville: 'Metz',
    adresse: '3 Rue Haute Pierre, 57000 Metz',
    telephone: '03 87 56 75 00',
    email: 'ca-metz@justice.fr'
  },
  { 
    id: 'ca-montpellier', 
    name: 'Cour d\'Appel de Montpellier', 
    code: '34', 
    region: 'Occitanie', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Tristan Gervais de Lafond',
    procureurGeneral: 'M. Jean-Marie Beney',
    ville: 'Montpellier',
    adresse: '1 Rue Foch, 34000 Montpellier',
    telephone: '04 67 12 34 00',
    email: 'ca-montpellier@justice.fr'
  },
  { 
    id: 'ca-nancy', 
    name: 'Cour d\'Appel de Nancy', 
    code: '54', 
    region: 'Grand Est', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Jean-Pierre Delavenay',
    procureurGeneral: 'M. Bernard Marchal',
    ville: 'Nancy',
    adresse: 'Rue du Haut-Bourgeois, 54000 Nancy',
    telephone: '03 83 17 24 00',
    email: 'ca-nancy@justice.fr'
  },
  { 
    id: 'ca-nimes', 
    name: 'Cour d\'Appel de Nîmes', 
    code: '30', 
    region: 'Occitanie', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Michel Senthille',
    procureurGeneral: 'Mme Françoise Pieri-Gauthier',
    ville: 'Nîmes',
    adresse: '3 Boulevard des Arènes, 30000 Nîmes',
    telephone: '04 66 76 47 00',
    email: 'ca-nimes@justice.fr'
  },
  { 
    id: 'ca-orleans', 
    name: 'Cour d\'Appel d\'Orléans', 
    code: '45', 
    region: 'Centre-Val de Loire', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Régis Vanhasbrouck',
    procureurGeneral: 'M. Gilles Accomando',
    ville: 'Orléans',
    adresse: '44 Rue de la Bretonnerie, 45000 Orléans',
    telephone: '02 38 74 58 00',
    email: 'ca-orleans@justice.fr'
  },
  { 
    id: 'ca-pau', 
    name: 'Cour d\'Appel de Pau', 
    code: '64', 
    region: 'Nouvelle-Aquitaine', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Rémi Le Hors',
    procureurGeneral: 'M. Dominique Boiron',
    ville: 'Pau',
    adresse: 'Place de la Libération, 64000 Pau',
    telephone: '05 59 82 22 00',
    email: 'ca-pau@justice.fr'
  },
  { 
    id: 'ca-poitiers', 
    name: 'Cour d\'Appel de Poitiers', 
    code: '86', 
    region: 'Nouvelle-Aquitaine', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Gwenole Le Bur',
    procureurGeneral: 'M. Éric Corbaux',
    ville: 'Poitiers',
    adresse: 'Place Alphonse Lepetit, 86000 Poitiers',
    telephone: '05 49 50 22 00',
    email: 'ca-poitiers@justice.fr'
  },
  { 
    id: 'ca-reims', 
    name: 'Cour d\'Appel de Reims', 
    code: '51', 
    region: 'Grand Est', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Jean-François Pasquier',
    procureurGeneral: 'M. Matthieu Bourrette',
    ville: 'Reims',
    adresse: '55 Rue Thiers, 51100 Reims',
    telephone: '03 26 77 39 00',
    email: 'ca-reims@justice.fr'
  },
  { 
    id: 'ca-rennes', 
    name: 'Cour d\'Appel de Rennes', 
    code: '35', 
    region: 'Bretagne', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Xavier Ronsin',
    procureurGeneral: 'M. Frédéric Benet-Chambellan',
    ville: 'Rennes',
    adresse: 'Place du Parlement de Bretagne, 35000 Rennes',
    telephone: '02 99 29 64 00',
    email: 'ca-rennes@justice.fr'
  },
  { 
    id: 'ca-riom', 
    name: 'Cour d\'Appel de Riom', 
    code: '63', 
    region: 'Auvergne-Rhône-Alpes', 
    type: 'Cour d\'Appel',
    premierPresident: 'Mme Marie-Christine Tarrare',
    procureurGeneral: 'M. Laurent Zuchowicz',
    ville: 'Riom',
    adresse: '2 Boulevard de la Sainte-Chapelle, 63200 Riom',
    telephone: '04 73 64 50 00',
    email: 'ca-riom@justice.fr'
  },
  { 
    id: 'ca-rouen', 
    name: 'Cour d\'Appel de Rouen', 
    code: '76', 
    region: 'Normandie', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Pierre-Yves Couilleau',
    procureurGeneral: 'M. Frédéric Teillet',
    ville: 'Rouen',
    adresse: 'Place Joffre, 76000 Rouen',
    telephone: '02 35 52 87 00',
    email: 'ca-rouen@justice.fr'
  },
  { 
    id: 'ca-toulouse', 
    name: 'Cour d\'Appel de Toulouse', 
    code: '31', 
    region: 'Occitanie', 
    type: 'Cour d\'Appel',
    premierPresident: 'Mme Chantal Ferreira',
    procureurGeneral: 'M. Franck Rastoul',
    ville: 'Toulouse',
    adresse: 'Place Salinis, 31000 Toulouse',
    telephone: '05 61 33 70 00',
    email: 'ca-toulouse@justice.fr'
  },
  // Outre-Mer (DROM-COM)
  { 
    id: 'ca-basse-terre', 
    name: 'Cour d\'Appel de Basse-Terre (Guadeloupe)', 
    code: '971', 
    region: 'Guadeloupe', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Philippe Petit',
    procureurGeneral: 'M. Éric Maurel',
    ville: 'Basse-Terre',
    adresse: 'Boulevard Lardenoy, 97100 Basse-Terre',
    telephone: '05 90 80 63 00',
    email: 'ca-basse-terre@justice.fr'
  },
  { 
    id: 'ca-fort-de-france', 
    name: 'Cour d\'Appel de Fort-de-France (Martinique)', 
    code: '972', 
    region: 'Martinique', 
    type: 'Cour d\'Appel',
    premierPresident: 'Mme Ida Chassaing',
    procureurGeneral: 'Mme Clarisse Taron',
    ville: 'Fort-de-France',
    adresse: '35 Rue Victor Sévère, 97200 Fort-de-France',
    telephone: '05 96 70 20 00',
    email: 'ca-fort-de-france@justice.fr'
  },
  { 
    id: 'ca-cayenne', 
    name: 'Cour d\'Appel de Cayenne (Guyane)', 
    code: '973', 
    region: 'Guyane', 
    type: 'Cour d\'Appel',
    premierPresident: 'Mme Marie-Laure Piazza',
    procureurGeneral: 'M. Yves Le Clair',
    ville: 'Cayenne',
    adresse: '15 Avenue du Général de Gaulle, 97300 Cayenne',
    telephone: '05 94 29 76 00',
    email: 'ca-cayenne@justice.fr'
  },
  { 
    id: 'ca-st-denis', 
    name: 'Cour d\'Appel de Saint-Denis (La Réunion)', 
    code: '974', 
    region: 'La Réunion', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Alain Chateauneuf',
    procureurGeneral: 'M. Laurent Zuchowicz',
    ville: 'Saint-Denis',
    adresse: '166 Rue Jean Chatel, 97400 Saint-Denis',
    telephone: '02 62 40 23 00',
    email: 'ca-saint-denis@justice.fr'
  },
  { 
    id: 'ca-noumea', 
    name: 'Cour d\'Appel de Nouméa (Nouvelle-Calédonie)', 
    code: '988', 
    region: 'Nouvelle-Calédonie', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Thierry Dran',
    procureurGeneral: 'M. Yves Dupas',
    ville: 'Nouméa',
    adresse: '1 Rue de la Somme, 98800 Nouméa',
    telephone: '06 87 27 24 00',
    email: 'ca-noumea@justice.fr'
  },
  { 
    id: 'ca-papeete', 
    name: 'Cour d\'Appel de Papeete (Polynésie Française)', 
    code: '987', 
    region: 'Polynésie Française', 
    type: 'Cour d\'Appel',
    premierPresident: 'M. Thierry Fuchs',
    procureurGeneral: 'Mme Solène Belaouar',
    ville: 'Papeete',
    adresse: 'Avenue Pouvanaa a Oopa, 98713 Papeete',
    telephone: '06 89 41 55 00',
    email: 'ca-papeete@justice.fr'
  },
  { 
    id: 'csm-nominations', 
    name: 'Conseil Supérieur de la Magistrature (CSM)', 
    code: 'CSM', 
    region: 'National', 
    type: 'CSM',
    premierPresident: 'Présidé par le Premier Président de la Cour de Cassation (M. Christophe Soulard)',
    procureurGeneral: 'Procureur Général près la Cour de Cassation (M. Rémy Heitz)',
    ville: 'Paris',
    adresse: '21 Boulevard Raspail, 75007 Paris',
    telephone: '01 44 32 50 50',
    email: 'csm@justice.fr'
  }
];

export function getCourDAppelByRegion(region: string): CourDAppel[] {
  return COURS_D_APPEL_LIST.filter(c => c.region === region);
}

export function getCourDAppelByCode(code: string): CourDAppel | undefined {
  return COURS_D_APPEL_LIST.find(c => c.code === code);
}

export function getCourDAppelForCity(city?: string, postalCode?: string): CourDAppel {
  if (postalCode && postalCode.length >= 2) {
    const dept = postalCode.trim().substring(0, 2);
    const overseasDept = postalCode.trim().substring(0, 3);
    const foundByOverseas = COURS_D_APPEL_LIST.find(c => c.code === overseasDept);
    if (foundByOverseas) return foundByOverseas;
    
    const foundByDept = COURS_D_APPEL_LIST.find(c => c.code === dept);
    if (foundByDept) return foundByDept;
  }

  if (city) {
    const normCity = city.toLowerCase().trim();
    if (normCity.includes('paris') || normCity.includes('evry') || normCity.includes('melun') || normCity.includes('meaux') || normCity.includes('bobigny') || normCity.includes('créteil')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-paris') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('versailles') || normCity.includes('nanterre') || normCity.includes('pontoise') || normCity.includes('chartres')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-versailles') || COURS_D_APPEL_LIST[1];
    }
    if (normCity.includes('lyon') || normCity.includes('saint-étienne') || normCity.includes('bourg')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-lyon') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('marseille') || normCity.includes('aix') || normCity.includes('nice') || normCity.includes('toulon') || normCity.includes('avignon')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-aix') || COURS_D_APPEL_LIST[2];
    }
    if (normCity.includes('bordeaux') || normCity.includes('périgueux') || normCity.includes('angoulême')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-bordeaux') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('lille') || normCity.includes('douai') || normCity.includes('arras') || normCity.includes('dunkerque')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-douai') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('rennes') || normCity.includes('brest') || normCity.includes('nantes') || normCity.includes('lorient') || normCity.includes('vannes')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-rennes') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('toulouse') || normCity.includes('albi') || normCity.includes('montauban')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-toulouse') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('montpellier') || normCity.includes('perpignan') || normCity.includes('béziers')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-montpellier') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('strasbourg') || normCity.includes('colmar') || normCity.includes('mulhouse')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-colmar') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('guadeloupe') || normCity.includes('pointe-à-pitre') || normCity.includes('basse-terre')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-basse-terre') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('martinique') || normCity.includes('fort-de-france')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-fort-de-france') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('guyane') || normCity.includes('cayenne')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-cayenne') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('réunion') || normCity.includes('saint-denis')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-st-denis') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('calédonie') || normCity.includes('nouméa')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-noumea') || COURS_D_APPEL_LIST[0];
    }
    if (normCity.includes('polynésie') || normCity.includes('papeete')) {
      return COURS_D_APPEL_LIST.find(c => c.id === 'ca-papeete') || COURS_D_APPEL_LIST[0];
    }
    
    const foundByVille = COURS_D_APPEL_LIST.find(c => normCity.includes(c.ville.toLowerCase()));
    if (foundByVille) return foundByVille;
  }

  return COURS_D_APPEL_LIST[0];
}
