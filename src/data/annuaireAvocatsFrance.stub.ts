export interface DataGouvAvocat {
  NomBarreau: string;
  avNom: string;
  avPrenom: string;
  cbRaisonSociale?: string;
  siren?: string;
  cbVille?: string;
  cbCodePostal?: string;
  cbEmail?: string;
  cbTelephone?: string;
  datePrestationSerment?: string;
  cbLangues?: string;
}

// Empty stub — the real 100k-line dataset is only needed at runtime, not in tests
export const ANNUAIRE_AVOCATS_FRANCE_DATA: DataGouvAvocat[] = [];
