import { supabase } from './supabase';
import { ANNUAIRE_AVOCATS_FRANCE_DATA, type DataGouvAvocat } from '../data/annuaireAvocatsFrance';
import { getCourDAppelForCity } from './jurisdictions';

export interface UnifiedLawyer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city: string;
  postal_code: string;
  specialty?: string;
  specialties?: string[];
  bar_association: string;
  company_name?: string;
  siren?: string;
  oath_date?: string;
  languages?: string;
  role: 'lawyer' | 'professor' | 'doctorate';
  is_verified: boolean;
  avatar_url?: string;
  cour_d_appel: string;
  premier_president: string;
  source: 'supabase' | 'data_gouv';
  lawyers?: {
    bar_association?: string;
  };
}

export function normalizeBarreau(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^barreau\s+(de\s+|d'|des\s+|du\s+)?/i, '')
    .replace(/[\(\)-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchBarreau(bar1?: string | null, bar2?: string | null): boolean {
  if (!bar1 || !bar2) return false;
  const n1 = normalizeBarreau(bar1);
  const n2 = normalizeBarreau(bar2);
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

let cachedAllCsvLawyers: DataGouvAvocat[] | null = null;
let isCsvLoading = false;

export async function loadFullDatasetFromCsv(): Promise<DataGouvAvocat[]> {
  if (cachedAllCsvLawyers && cachedAllCsvLawyers.length > 0) {
    return cachedAllCsvLawyers;
  }
  if (isCsvLoading) {
    await new Promise(res => setTimeout(res, 250));
    return cachedAllCsvLawyers || ANNUAIRE_AVOCATS_FRANCE_DATA;
  }
  isCsvLoading = true;
  try {
    const res = await fetch('/data/annuaire-avocats-complet.csv');
    if (!res.ok) {
      isCsvLoading = false;
      return ANNUAIRE_AVOCATS_FRANCE_DATA;
    }
    const text = await res.text();
    const lines = text.split('\n');
    const results: DataGouvAvocat[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(';');
      if (cols.length >= 8) {
        results.push({
          NomBarreau: cols[0] || '',
          avNom: cols[1] || '',
          avPrenom: cols[2] || '',
          cbRaisonSociale: cols[3] || '',
          cbSiretSiren: cols[4] || '',
          cbAdresse1: cols[5] || '',
          cbAdresse2: cols[6] || '',
          cbCp: cols[7] || '',
          cbVille: cols[8] || '',
          spLibelle1: cols[9] || '',
          spLibelle2: cols[10] || '',
          spLibelle3: cols[11] || '',
          acDateSerment: cols[12] || '',
          avLang: cols[13] || 'Français'
        });
      }
    }
    cachedAllCsvLawyers = results;
    isCsvLoading = false;
    return results;
  } catch (err) {
    console.error('Error fetching full CSV dataset:', err);
    isCsvLoading = false;
    return ANNUAIRE_AVOCATS_FRANCE_DATA;
  }
}

/**
 * Normalizes dataset entry to UnifiedLawyer format
 */
export function normalizeDataGouvAvocat(av: DataGouvAvocat, index: number): UnifiedLawyer {
  const courInfo = getCourDAppelForCity(av.cbVille, av.cbCp);
  return {
    id: `data-gouv-${index}-${(av.avNom || '').toLowerCase()}`,
    first_name: av.avPrenom,
    last_name: av.avNom,
    email: av.email || `${(av.avPrenom || '').toLowerCase()}.${(av.avNom || '').toLowerCase()}@avocat-france.fr`,
    phone: av.phone || '01 40 00 00 00',
    city: av.cbVille,
    postal_code: av.cbCp,
    specialty: av.spLibelle1 || 'Droit général',
    specialties: [av.spLibelle1, av.spLibelle2, av.spLibelle3].filter(Boolean) as string[],
    bar_association: av.NomBarreau,
    company_name: av.cbRaisonSociale,
    siren: av.cbSiretSiren,
    oath_date: av.acDateSerment,
    languages: av.avLang || 'Français',
    role: 'lawyer',
    is_verified: true,
    avatar_url: `https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80`,
    cour_d_appel: courInfo.name,
    premier_president: courInfo.premierPresident,
    source: 'data_gouv',
    lawyers: {
      bar_association: av.NomBarreau
    }
  };
}

export function getDeletedUserEmails(): Set<string> {
  try {
    const raw = localStorage.getItem('francejustice_deleted_emails');
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {
    console.error(e);
  }
  return new Set<string>();
}

export function registerDeletedUser(email?: string) {
  if (!email) return;
  const set = getDeletedUserEmails();
  set.add(email.toLowerCase());
  try {
    localStorage.setItem('francejustice_deleted_emails', JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Fetches real-time lawyers from Supabase, enriches with Cour d'Appel,
 * and merges with the official data.gouv.fr dataset.
 */
export async function getUnifiedLawyersList(): Promise<UnifiedLawyer[]> {
  const deletedEmails = getDeletedUserEmails();
  const datasetLawyers = ANNUAIRE_AVOCATS_FRANCE_DATA.map((av, idx) => normalizeDataGouvAvocat(av, idx))
    .filter(d => !deletedEmails.has(d.email.toLowerCase()));

  try {
    const { data: dbProfiles, error } = await supabase
      .from('profiles_just')
      .select('*, lawyers:lawyers_just(*)')
      .in('role', ['lawyer', 'professor', 'doctorate'])
      .eq('is_verified', true)
      .order('last_name');

    if (error || !dbProfiles) {
      return datasetLawyers;
    }

    const supabaseLawyers: UnifiedLawyer[] = dbProfiles
      .filter(p => p.email && !deletedEmails.has(p.email.toLowerCase()))
      .map((p) => {
        const lawyerInfo = Array.isArray(p.lawyers) ? p.lawyers[0] : p.lawyers;
        const barAssoc = lawyerInfo?.bar_association || 'Paris';
        const courInfo = getCourDAppelForCity(p.city, p.postal_code);

        return {
          id: p.id,
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          email: p.email || '',
          phone: p.phone,
          city: p.city || 'Paris',
          postal_code: p.postal_code || '75001',
          specialty: p.specialty || lawyerInfo?.specialty || 'Droit général',
          specialties: p.specialties || [p.specialty || 'Droit général'],
          bar_association: barAssoc,
          company_name: lawyerInfo?.company_name,
          siren: lawyerInfo?.siren,
          oath_date: lawyerInfo?.oath_date,
          languages: 'Français',
          role: p.role || 'lawyer',
          is_verified: p.is_verified ?? true,
          avatar_url: p.avatar_url,
          cour_d_appel: courInfo.name,
          premier_president: courInfo.premierPresident,
          source: 'supabase'
        };
      });

    // Merge: Supabase profiles take precedence over dataset fallback
    const supabaseEmails = new Set(supabaseLawyers.map(l => l.email.toLowerCase()));
    const filteredDataset = datasetLawyers.filter(d => !supabaseEmails.has(d.email.toLowerCase()));

    return [...supabaseLawyers, ...filteredDataset];
  } catch {
    return datasetLawyers;
  }
}

/**
 * Seeds dataset lawyers into Supabase if missing
 */
export async function seedDataGouvLawyersToSupabase(): Promise<void> {
  try {
    const datasetLawyers = ANNUAIRE_AVOCATS_FRANCE_DATA.map((av, idx) => normalizeDataGouvAvocat(av, idx));
    for (const av of datasetLawyers) {
      const { data: existing } = await supabase
        .from('profiles_just')
        .select('id')
        .eq('email', av.email)
        .single();

      if (!existing) {
        const { data: newProf } = await supabase
          .from('profiles_just')
          .insert([{
            email: av.email,
            first_name: av.first_name,
            last_name: av.last_name,
            role: 'lawyer',
            city: av.city,
            postal_code: av.postal_code,
            is_verified: true
          }])
          .select('id')
          .single();

        if (newProf?.id) {
          await supabase
            .from('lawyers_just')
            .insert([{
              user_id: newProf.id,
              bar_association: av.bar_association,
              verification_status: 'verified'
            }]);
        }
      }
    }
  } catch (err) {
    console.error('Error seeding data.gouv lawyers to Supabase:', err);
  }
}
