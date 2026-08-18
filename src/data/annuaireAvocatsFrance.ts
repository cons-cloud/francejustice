export interface DataGouvAvocat {
  NomBarreau: string;
  avNom: string;
  avPrenom: string;
  cbRaisonSociale?: string;
  cbSiretSiren?: string;
  cbAdresse1?: string;
  cbAdresse2?: string;
  cbCp: string;
  cbVille: string;
  spLibelle1?: string;
  spLibelle2?: string;
  spLibelle3?: string;
  acDateSerment?: string;
  avLang?: string;
  email?: string;
  phone?: string;
}

export const ANNUAIRE_AVOCATS_FRANCE_DATA: DataGouvAvocat[] = [
  // Paris (Cour d'Appel de Paris)
  {
    NomBarreau: "Paris",
    avNom: "DUPONT",
    avPrenom: "Alexandre",
    cbRaisonSociale: "Cabinet Dupont & Associés",
    cbSiretSiren: "809123456",
    cbAdresse1: "12 Boulevard de la Madeleine",
    cbCp: "75009",
    cbVille: "Paris",
    spLibelle1: "Droit des affaires",
    spLibelle2: "Droit commercial",
    acDateSerment: "20101115",
    avLang: "Français, Anglais",
    email: "a.dupont@cabinet-dupont.fr",
    phone: "01 42 68 00 00"
  },
  {
    NomBarreau: "Paris",
    avNom: "MOREAU",
    avPrenom: "Camille",
    cbRaisonSociale: "SELARL Moreau Avocats",
    cbSiretSiren: "812345678",
    cbAdresse1: "45 Rue du Faubourg Saint-Honoré",
    cbCp: "75008",
    cbVille: "Paris",
    spLibelle1: "Droit pénal",
    spLibelle2: "Droit des libertés fondamentales",
    acDateSerment: "20140120",
    avLang: "Français, Espagnol",
    email: "c.moreau@moreau-avocats.fr",
    phone: "01 44 55 66 77"
  },
  {
    NomBarreau: "Paris",
    avNom: "BENALI",
    avPrenom: "Yassine",
    cbRaisonSociale: "Benali Avocats",
    cbSiretSiren: "834567890",
    cbAdresse1: "88 Avenue Kléber",
    cbCp: "75116",
    cbVille: "Paris",
    spLibelle1: "Droit du travail",
    spLibelle2: "Droit social",
    acDateSerment: "20160310",
    avLang: "Français, Anglais, Arabe",
    email: "y.benali@benali-justice.fr",
    phone: "01 53 10 20 30"
  },

  // Versailles (Cour d'Appel de Versailles)
  {
    NomBarreau: "Versailles",
    avNom: "BERNARD",
    avPrenom: "Élodie",
    cbRaisonSociale: "Bernard & Partenaires",
    cbSiretSiren: "823456789",
    cbAdresse1: "14 Avenue de Paris",
    cbCp: "78000",
    cbVille: "Versailles",
    spLibelle1: "Droit de la famille",
    spLibelle2: "Droit des personnes et du patrimoine",
    acDateSerment: "20120905",
    avLang: "Français, Anglais",
    email: "e.bernard@versailles-avocats.fr",
    phone: "01 39 50 12 34"
  },

  // Hauts-de-Seine / Nanterre (Cour d'Appel de Versailles)
  {
    NomBarreau: "Hauts-de-Seine",
    avNom: "LECLERC",
    avPrenom: "Nicolas",
    cbRaisonSociale: "Cabinet Leclerc Defense",
    cbSiretSiren: "845678901",
    cbAdresse1: "2 Avenue Gambetta",
    cbCp: "92400",
    cbVille: "Courbevoie",
    spLibelle1: "Droit immobilier",
    spLibelle2: "Droit de la construction",
    acDateSerment: "20110512",
    avLang: "Français, Allemand",
    email: "n.leclerc@leclerc-avocat.fr",
    phone: "01 47 88 99 00"
  },

  // Lyon (Cour d'Appel de Lyon)
  {
    NomBarreau: "Lyon",
    avNom: "ROUSSEAU",
    avPrenom: "Antoine",
    cbRaisonSociale: "Rousseau & Associés Lyon",
    cbSiretSiren: "856789012",
    cbAdresse1: "25 Rue de la République",
    cbCp: "69002",
    cbVille: "Lyon",
    spLibelle1: "Droit des sociétés",
    spLibelle2: "Droit fiscal",
    acDateSerment: "20080618",
    avLang: "Français, Anglais, Italien",
    email: "a.rousseau@lyon-avocats.fr",
    phone: "04 78 37 00 11"
  },
  {
    NomBarreau: "Lyon",
    avNom: "GARCIA",
    avPrenom: "Sophie",
    cbRaisonSociale: "Cabinet Garcia Droit Public",
    cbSiretSiren: "867890123",
    cbAdresse1: "10 Place Bellecour",
    cbCp: "69002",
    cbVille: "Lyon",
    spLibelle1: "Droit public",
    spLibelle2: "Droit de l'environnement",
    acDateSerment: "20151004",
    avLang: "Français, Espagnol",
    email: "s.garcia@garcia-avocat-lyon.fr",
    phone: "04 72 40 55 66"
  },

  // Marseille (Cour d'Appel d'Aix-en-Provence)
  {
    NomBarreau: "Marseille",
    avNom: "BONNET",
    avPrenom: "Marc",
    cbRaisonSociale: "Bonnet & Méditerranée Avocats",
    cbSiretSiren: "878901234",
    cbAdresse1: "50 Rue Saint-Ferréol",
    cbCp: "13001",
    cbVille: "Marseille",
    spLibelle1: "Droit maritime",
    spLibelle2: "Droit des transports",
    acDateSerment: "20090214",
    avLang: "Français, Anglais, Grec",
    email: "m.bonnet@marseille-avocats.com",
    phone: "04 91 13 44 55"
  },

  // Aix-en-Provence (Cour d'Appel d'Aix-en-Provence)
  {
    NomBarreau: "Aix-en-Provence",
    avNom: "LAURENT",
    avPrenom: "Claire",
    cbRaisonSociale: "Laurent Juris Provence",
    cbSiretSiren: "889012345",
    cbAdresse1: "18 Cours Mirabeau",
    cbCp: "13100",
    cbVille: "Aix-en-Provence",
    spLibelle1: "Droit pénal des affaires",
    spLibelle2: "Droit des garanties",
    acDateSerment: "20130722",
    avLang: "Français, Anglais",
    email: "c.laurent@aix-juridique.fr",
    phone: "04 42 26 77 88"
  },

  // Bordeaux (Cour d'Appel de Bordeaux)
  {
    NomBarreau: "Bordeaux",
    avNom: "GIRARD",
    avPrenom: "Mathieu",
    cbRaisonSociale: "Girard & Aquitaine Avocats",
    cbSiretSiren: "890123456",
    cbAdresse1: "12 Cours de l'Intendance",
    cbCp: "33000",
    cbVille: "Bordeaux",
    spLibelle1: "Droit rural et viticole",
    spLibelle2: "Droit des contrats",
    acDateSerment: "20071201",
    avLang: "Français, Anglais, Espagnol",
    email: "m.girard@bordeaux-avocat.fr",
    phone: "05 56 44 11 22"
  },

  // Lille (Cour d'Appel de Douai)
  {
    NomBarreau: "Lille",
    avNom: "VERMEULEN",
    avPrenom: "Pierre",
    cbRaisonSociale: "Vermeulen Nord-Justice",
    cbSiretSiren: "901234567",
    cbAdresse1: "8 Place Rihour",
    cbCp: "59800",
    cbVille: "Lille",
    spLibelle1: "Droit du travail",
    spLibelle2: "Droit de la sécurité sociale",
    acDateSerment: "20110419",
    avLang: "Français, Néerlandais, Anglais",
    email: "p.vermeulen@lille-avocats.fr",
    phone: "03 20 15 30 40"
  },

  // Toulouse (Cour d'Appel de Toulouse)
  {
    NomBarreau: "Toulouse",
    avNom: "CARON",
    avPrenom: "Julien",
    cbRaisonSociale: "Caron & Occitanie Lex",
    cbSiretSiren: "912345678",
    cbAdresse1: "15 Allée Jean Jaurès",
    cbCp: "31000",
    cbVille: "Toulouse",
    spLibelle1: "Droit de la propriété intellectuelle",
    spLibelle2: "Droit des nouvelles technologies",
    acDateSerment: "20160914",
    avLang: "Français, Anglais",
    email: "j.caron@toulouse-juris.fr",
    phone: "05 61 21 80 90"
  },

  // Nice (Cour d'Appel d'Aix-en-Provence)
  {
    NomBarreau: "Nice",
    avNom: "ROSSI",
    avPrenom: "Matteo",
    cbRaisonSociale: "Rossi Riviera Law Firm",
    cbSiretSiren: "923456789",
    cbAdresse1: "22 Promenade des Anglais",
    cbCp: "06000",
    cbVille: "Nice",
    spLibelle1: "Droit international privé",
    spLibelle2: "Droit immobilier",
    acDateSerment: "20100228",
    avLang: "Français, Italien, Anglais, Russe",
    email: "m.rossi@nice-lawfirm.com",
    phone: "04 93 87 65 43"
  },

  // Strasbourg (Cour d'Appel de Colmar)
  {
    NomBarreau: "Strasbourg",
    avNom: "MULLER",
    avPrenom: "Charlotte",
    cbRaisonSociale: "Muller & Alsace Europe",
    cbSiretSiren: "934567890",
    cbAdresse1: "5 Place Kléber",
    cbCp: "67000",
    cbVille: "Strasbourg",
    spLibelle1: "Droit européen",
    spLibelle2: "Droit de l'homme",
    acDateSerment: "20131108",
    avLang: "Français, Allemand, Anglais",
    email: "c.muller@strasbourg-lex.eu",
    phone: "03 88 32 10 00"
  },

  // Rennes (Cour d'Appel de Rennes)
  {
    NomBarreau: "Rennes",
    avNom: "LE GALL",
    avPrenom: "Erwan",
    cbRaisonSociale: "Le Gall Armorique Avocats",
    cbSiretSiren: "945678901",
    cbAdresse1: "12 Place des Lices",
    cbCp: "35000",
    cbVille: "Rennes",
    spLibelle1: "Droit bancaire et boursier",
    spLibelle2: "Droit du crédit",
    acDateSerment: "20090530",
    avLang: "Français, Anglais, Breton",
    email: "e.legall@rennes-avocats.bzh",
    phone: "02 99 79 50 50"
  },

  // Nantes (Cour d'Appel de Rennes)
  {
    NomBarreau: "Nantes",
    avNom: "GUERIN",
    avPrenom: "Audrey",
    cbRaisonSociale: "Guérin & Loire-Atlantique Justice",
    cbSiretSiren: "956789012",
    cbAdresse1: "7 Place Royale",
    cbCp: "44000",
    cbVille: "Nantes",
    spLibelle1: "Droit de la famille",
    spLibelle2: "Droit du dommage corporel",
    acDateSerment: "20170110",
    avLang: "Français, Anglais",
    email: "a.guerin@nantes-avocat.fr",
    phone: "02 40 48 20 30"
  },

  // Montpellier (Cour d'Appel de Montpellier)
  {
    NomBarreau: "Montpellier",
    avNom: "FABRE",
    avPrenom: "David",
    cbRaisonSociale: "Fabre Languedoc Avocats",
    cbSiretSiren: "967890123",
    cbAdresse1: "14 Place de la Comédie",
    cbCp: "34000",
    cbVille: "Montpellier",
    spLibelle1: "Droit pénal",
    spLibelle2: "Droit des victimes",
    acDateSerment: "20140602",
    avLang: "Français, Espagnol",
    email: "d.fabre@montpellier-justice.fr",
    phone: "04 67 60 40 50"
  },

  // Basse-Terre / Guadeloupe (Cour d'Appel de Basse-Terre)
  {
    NomBarreau: "Guadeloupe",
    avNom: "JOSEPH",
    avPrenom: "Kévin",
    cbRaisonSociale: "Joseph & Caraïbes Avocats",
    cbSiretSiren: "978901234",
    cbAdresse1: "10 Rue de la République",
    cbCp: "97100",
    cbVille: "Basse-Terre",
    spLibelle1: "Droit du travail",
    spLibelle2: "Droit administratif",
    acDateSerment: "20150315",
    avLang: "Français, Créole, Anglais",
    email: "k.joseph@guadeloupe-avocats.fr",
    phone: "05 90 81 22 33"
  },

  // Fort-de-France / Martinique (Cour d'Appel de Fort-de-France)
  {
    NomBarreau: "Martinique",
    avNom: "CÉSAIRE",
    avPrenom: "Nathalie",
    cbRaisonSociale: "Césaire & Martinique Lex",
    cbSiretSiren: "989012345",
    cbAdresse1: "25 Rue Victor Sévère",
    cbCp: "97200",
    cbVille: "Fort-de-France",
    spLibelle1: "Droit de la famille",
    spLibelle2: "Droit immobilier",
    acDateSerment: "20121120",
    avLang: "Français, Créole, Anglais",
    email: "n.cesaire@martinique-avocats.fr",
    phone: "05 96 63 44 55"
  },

  // Saint-Denis / La Réunion (Cour d'Appel de Saint-Denis)
  {
    NomBarreau: "La Réunion",
    avNom: "PAYET",
    avPrenom: "Romain",
    cbRaisonSociale: "Payet & Océan Indien Juris",
    cbSiretSiren: "990123456",
    cbAdresse1: "42 Rue de Paris",
    cbCp: "97400",
    cbVille: "Saint-Denis",
    spLibelle1: "Droit des affaires",
    spLibelle2: "Droit fiscal",
    acDateSerment: "20100808",
    avLang: "Français, Anglais, Créole",
    email: "r.payet@reunion-avocats.re",
    phone: "02 62 21 33 44"
  },

  // Cayenne / Guyane (Cour d'Appel de Cayenne)
  {
    NomBarreau: "Guyane",
    avNom: "LAMA",
    avPrenom: "Gabriel",
    cbRaisonSociale: "Lama & Amazonie Avocats",
    cbSiretSiren: "991234567",
    cbAdresse1: "15 Avenue De Gaulle",
    cbCp: "97300",
    cbVille: "Cayenne",
    spLibelle1: "Droit pénal",
    spLibelle2: "Droit de l'environnement",
    acDateSerment: "20130412",
    avLang: "Français, Portugais, Créole",
    email: "g.lama@guyane-avocats.fr",
    phone: "05 94 31 55 66"
  },

  // Nouméa / Nouvelle-Calédonie (Cour d'Appel de Nouméa)
  {
    NomBarreau: "Nouvelle-Calédonie",
    avNom: "WAMO",
    avPrenom: "Jean-Pierre",
    cbRaisonSociale: "Wamo & Pacifique Avocats",
    cbSiretSiren: "992345678",
    cbAdresse1: "8 Rue de la Somme",
    cbCp: "98800",
    cbVille: "Nouméa",
    spLibelle1: "Droit coutumier",
    spLibelle2: "Droit des biens",
    acDateSerment: "20111005",
    avLang: "Français, Anglais",
    email: "jp.wamo@noumea-avocats.nc",
    phone: "06 87 28 40 50"
  },

  // Papeete / Polynésie Française (Cour d'Appel de Papeete)
  {
    NomBarreau: "Polynésie Française",
    avNom: "TAEREA",
    avPrenom: "Moana",
    cbRaisonSociale: "Taerea & Fenua Juris",
    cbSiretSiren: "993456789",
    cbAdresse1: "12 Avenue Pouvanaa a Oopa",
    cbCp: "98713",
    cbVille: "Papeete",
    spLibelle1: "Droit foncier",
    spLibelle2: "Droit des affaires",
    acDateSerment: "20140218",
    avLang: "Français, Tahitien, Anglais",
    email: "m.taerea@papeete-avocats.pf",
    phone: "06 89 42 11 22"
  }
];
