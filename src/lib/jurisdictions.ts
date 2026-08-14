export interface CourDAppel {
  id: string;
  name: string;
  code: string;
  region: string;
  type: 'Cour d\'Appel' | 'CSM';
}

export const COURS_D_APPEL_LIST: CourDAppel[] = [
  { id: 'ca-paris', name: 'Cour d\'Appel de Paris', code: '75', region: 'Île-de-France', type: 'Cour d\'Appel' },
  { id: 'ca-versailles', name: 'Cour d\'Appel de Versailles', code: '78', region: 'Île-de-France', type: 'Cour d\'Appel' },
  { id: 'ca-paris-nord', name: 'Cour d\'Appel de Paris-Nord (Île-de-France)', code: '93', region: 'Île-de-France', type: 'Cour d\'Appel' },
  { id: 'ca-aix', name: 'Cour d\'Appel d\'Aix-en-Provence', code: '13', region: 'Provence-Alpes-Côte d\'Azur', type: 'Cour d\'Appel' },
  { id: 'ca-agen', name: 'Cour d\'Appel d\'Agen', code: '47', region: 'Nouvelle-Aquitaine', type: 'Cour d\'Appel' },
  { id: 'ca-amiens', name: 'Cour d\'Appel d\'Amiens', code: '80', region: 'Hauts-de-France', type: 'Cour d\'Appel' },
  { id: 'ca-angers', name: 'Cour d\'Appel d\'Angers', code: '49', region: 'Pays de la Loire', type: 'Cour d\'Appel' },
  { id: 'ca-bastia', name: 'Cour d\'Appel de Bastia', code: '2B', region: 'Corse', type: 'Cour d\'Appel' },
  { id: 'ca-bordeaux', name: 'Cour d\'Appel de Bordeaux', code: '33', region: 'Nouvelle-Aquitaine', type: 'Cour d\'Appel' },
  { id: 'ca-bourges', name: 'Cour d\'Appel de Bourges', code: '18', region: 'Centre-Val de Loire', type: 'Cour d\'Appel' },
  { id: 'ca-caen', name: 'Cour d\'Appel de Caen', code: '14', region: 'Normandie', type: 'Cour d\'Appel' },
  { id: 'ca-chambery', name: 'Cour d\'Appel de Chambéry', code: '73', region: 'Auvergne-Rhône-Alpes', type: 'Cour d\'Appel' },
  { id: 'ca-colmar', name: 'Cour d\'Appel de Colmar', code: '68', region: 'Grand Est', type: 'Cour d\'Appel' },
  { id: 'ca-dijon', name: 'Cour d\'Appel de Dijon', code: '21', region: 'Bourgogne-Franche-Comté', type: 'Cour d\'Appel' },
  { id: 'ca-douai', name: 'Cour d\'Appel de Douai', code: '59', region: 'Hauts-de-France', type: 'Cour d\'Appel' },
  { id: 'ca-grenoble', name: 'Cour d\'Appel de Grenoble', code: '38', region: 'Auvergne-Rhône-Alpes', type: 'Cour d\'Appel' },
  { id: 'ca-limoges', name: 'Cour d\'Appel de Limoges', code: '87', region: 'Nouvelle-Aquitaine', type: 'Cour d\'Appel' },
  { id: 'ca-lyon', name: 'Cour d\'Appel de Lyon', code: '69', region: 'Auvergne-Rhône-Alpes', type: 'Cour d\'Appel' },
  { id: 'ca-metz', name: 'Cour d\'Appel de Metz', code: '57', region: 'Grand Est', type: 'Cour d\'Appel' },
  { id: 'ca-montpellier', name: 'Cour d\'Appel de Montpellier', code: '34', region: 'Occitanie', type: 'Cour d\'Appel' },
  { id: 'ca-nancy', name: 'Cour d\'Appel de Nancy', code: '54', region: 'Grand Est', type: 'Cour d\'Appel' },
  { id: 'ca-nimes', name: 'Cour d\'Appel de Nîmes', code: '30', region: 'Occitanie', type: 'Cour d\'Appel' },
  { id: 'ca-noumea', name: 'Cour d\'Appel de Nouméa', code: '988', region: 'Nouvelle-Calédonie', type: 'Cour d\'Appel' },
  { id: 'ca-orleans', name: 'Cour d\'Appel d\'Orléans', code: '45', region: 'Centre-Val de Loire', type: 'Cour d\'Appel' },
  { id: 'ca-papeete', name: 'Cour d\'Appel de Papeete', code: '987', region: 'Polynésie Française', type: 'Cour d\'Appel' },
  { id: 'ca-pau', name: 'Cour d\'Appel de Pau', code: '64', region: 'Nouvelle-Aquitaine', type: 'Cour d\'Appel' },
  { id: 'ca-poitiers', name: 'Cour d\'Appel de Poitiers', code: '86', region: 'Nouvelle-Aquitaine', type: 'Cour d\'Appel' },
  { id: 'ca-reims', name: 'Cour d\'Appel de Reims', code: '51', region: 'Grand Est', type: 'Cour d\'Appel' },
  { id: 'ca-rennes', name: 'Cour d\'Appel de Rennes', code: '35', region: 'Bretagne', type: 'Cour d\'Appel' },
  { id: 'ca-riom', name: 'Cour d\'Appel de Riom', code: '63', region: 'Auvergne-Rhône-Alpes', type: 'Cour d\'Appel' },
  { id: 'ca-rouen', name: 'Cour d\'Appel de Rouen', code: '76', region: 'Normandie', type: 'Cour d\'Appel' },
  { id: 'ca-st-denis', name: 'Cour d\'Appel de Saint-Denis de la Réunion', code: '974', region: 'La Réunion', type: 'Cour d\'Appel' },
  { id: 'ca-fort-de-france', name: 'Cour d\'Appel de Fort-de-France (Martinique)', code: '972', region: 'Martinique', type: 'Cour d\'Appel' },
  { id: 'ca-toulouse', name: 'Cour d\'Appel de Toulouse', code: '31', region: 'Occitanie', type: 'Cour d\'Appel' },
  { id: 'ca-basse-terre', name: 'Cour d\'Appel de Basse-Terre (Guadeloupe)', code: '971', region: 'Guadeloupe', type: 'Cour d\'Appel' },
  { id: 'csm-nominations', name: 'Conseil Supérieur de la Magistrature (CSM - Nominations)', code: 'CSM', region: 'National', type: 'CSM' }
];
