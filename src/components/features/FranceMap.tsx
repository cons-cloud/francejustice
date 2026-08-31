import React, { useState, useMemo } from 'react';
import { MapPin, Building2, Search, Globe, X, Shield, Sparkles, Award } from 'lucide-react';
import { CourtsAnnuaireModal } from './CourtsAnnuaireModal';
import { ANNUAIRE_AVOCATS_FRANCE_DATA } from '../../data/annuaireAvocatsFrance';
import { getCourDAppelForCity } from '../../lib/jurisdictions';
import carteGif from '../../assets/images/carte.gif';

export interface FranceMapProps {
  onSelectRegion?: (regionName: string | null) => void;
  selectedRegion?: string | null;
  onSelectBarreau?: (barreauName: string | null) => void;
  selectedBarreau?: string | null;
  lawyerCounts?: Record<string, number>;
}

export interface RegionData {
  id: string;
  name: string;
  labelX: number;
  labelY: number;
  departments: string[];
  isOverseas?: boolean;
}

export interface BarreauData {
  id: string;
  name: string;
  shortName: string;
  region: string;
  cx: number; // percentage X on map image (0-100)
  cy: number; // percentage Y on map image (0-100)
  courDAppel: string;
  isOverseas?: boolean;
}

// 18 French Regions (13 Metropolitan + 5 DROM + 2 COM)
export const regions: RegionData[] = [
  { id: 'HDF', name: 'Hauts-de-France', labelX: 52, labelY: 12, departments: ['59', '62', '02', '60', '80'] },
  { id: 'NOR', name: 'Normandie', labelX: 34, labelY: 20, departments: ['14', '27', '50', '76', '61'] },
  { id: 'IDF', name: 'Île-de-France', labelX: 50, labelY: 28, departments: ['75', '77', '78', '91', '92', '93', '94', '95'] },
  { id: 'GES', name: 'Grand Est', labelX: 72, labelY: 24, departments: ['67', '68', '08', '10', '51', '52', '54', '55', '57', '88'] },
  { id: 'BRE', name: 'Bretagne', labelX: 14, labelY: 30, departments: ['22', '29', '35', '56'] },
  { id: 'PDL', name: 'Pays de la Loire', labelX: 28, labelY: 38, departments: ['44', '49', '53', '72', '85'] },
  { id: 'CVL', name: 'Centre-Val de Loire', labelX: 42, labelY: 40, departments: ['18', '28', '36', '37', '41', '45'] },
  { id: 'BFC', name: 'Bourgogne-Franche-Comté', labelX: 65, labelY: 42, departments: ['21', '25', '39', '58', '70', '71', '89', '90'] },
  { id: 'ARA', name: 'Auvergne-Rhône-Alpes', labelX: 64, labelY: 62, departments: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'] },
  { id: 'NAQ', name: 'Nouvelle-Aquitaine', labelX: 30, labelY: 64, departments: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'] },
  { id: 'OCC', name: 'Occitanie', labelX: 44, labelY: 82, departments: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'] },
  { id: 'PAC', name: "Provence-Alpes-Côte d'Azur", labelX: 74, labelY: 78, departments: ['04', '05', '06', '13', '83', '84'] },
  { id: 'COR', name: 'Corse', labelX: 92, labelY: 85, departments: ['2A', '2B'] },
  // Outre-Mer (DROM-COM)
  { id: 'GLP', name: 'Guadeloupe', labelX: 0, labelY: 0, departments: ['971'], isOverseas: true },
  { id: 'MTQ', name: 'Martinique', labelX: 0, labelY: 0, departments: ['972'], isOverseas: true },
  { id: 'GUY', name: 'Guyane', labelX: 0, labelY: 0, departments: ['973'], isOverseas: true },
  { id: 'REU', name: 'La Réunion', labelX: 0, labelY: 0, departments: ['974'], isOverseas: true },
  { id: 'MAY', name: 'Mayotte', labelX: 0, labelY: 0, departments: ['976'], isOverseas: true },
  { id: 'NCL', name: 'Nouvelle-Calédonie', labelX: 0, labelY: 0, departments: ['988'], isOverseas: true },
  { id: 'PYF', name: 'Polynésie Française', labelX: 0, labelY: 0, departments: ['987'], isOverseas: true },
];

export const barreauxList: BarreauData[] = [
  // Île-de-France
  { id: 'b-paris', name: 'Barreau de Paris', shortName: 'Paris', region: 'Île-de-France', cx: 50, cy: 27, courDAppel: "Cour d'Appel de Paris" },
  { id: 'b-versailles', name: 'Barreau de Versailles', shortName: 'Versailles', region: 'Île-de-France', cx: 46, cy: 29, courDAppel: "Cour d'Appel de Versailles" },
  { id: 'b-nanterre', name: 'Barreau des Hauts-de-Seine (Nanterre)', shortName: 'Nanterre', region: 'Île-de-France', cx: 48, cy: 26, courDAppel: "Cour d'Appel de Versailles" },
  { id: 'b-bobigny', name: 'Barreau de Seine-Saint-Denis (Bobigny)', shortName: 'Bobigny', region: 'Île-de-France', cx: 52, cy: 25, courDAppel: "Cour d'Appel de Paris" },
  { id: 'b-valdemarne', name: 'Barreau du Val-de-Marne (Créteil)', shortName: 'Créteil', region: 'Île-de-France', cx: 51, cy: 30, courDAppel: "Cour d'Appel de Paris" },
  // Hauts-de-France
  { id: 'b-lille', name: 'Barreau de Lille', shortName: 'Lille', region: 'Hauts-de-France', cx: 54, cy: 8, courDAppel: "Cour d'Appel de Douai" },
  { id: 'b-amiens', name: 'Barreau d\'Amiens', shortName: 'Amiens', region: 'Hauts-de-France', cx: 49, cy: 16, courDAppel: "Cour d'Appel d'Amiens" },
  // Normandie
  { id: 'b-rouen', name: 'Barreau de Rouen', shortName: 'Rouen', region: 'Normandie', cx: 40, cy: 20, courDAppel: "Cour d'Appel de Rouen" },
  { id: 'b-caen', name: 'Barreau de Caen', shortName: 'Caen', region: 'Normandie', cx: 30, cy: 22, courDAppel: "Cour d'Appel de Caen" },
  // Grand Est
  { id: 'b-strasbourg', name: 'Barreau de Strasbourg', shortName: 'Strasbourg', region: 'Grand Est', cx: 82, cy: 24, courDAppel: "Cour d'Appel de Colmar" },
  { id: 'b-nancy', name: 'Barreau de Nancy', shortName: 'Nancy', region: 'Grand Est', cx: 72, cy: 27, courDAppel: "Cour d'Appel de Nancy" },
  { id: 'b-reims', name: 'Barreau de Reims', shortName: 'Reims', region: 'Grand Est', cx: 60, cy: 21, courDAppel: "Cour d'Appel de Reims" },
  { id: 'b-metz', name: 'Barreau de Metz', shortName: 'Metz', region: 'Grand Est', cx: 74, cy: 20, courDAppel: "Cour d'Appel de Metz" },
  // Bretagne
  { id: 'b-rennes', name: 'Barreau de Rennes', shortName: 'Rennes', region: 'Bretagne', cx: 20, cy: 30, courDAppel: "Cour d'Appel de Rennes" },
  { id: 'b-brest', name: 'Barreau de Brest', shortName: 'Brest', region: 'Bretagne', cx: 8, cy: 28, courDAppel: "Cour d'Appel de Rennes" },
  // Pays de la Loire
  { id: 'b-nantes', name: 'Barreau de Nantes', shortName: 'Nantes', region: 'Pays de la Loire', cx: 23, cy: 40, courDAppel: "Cour d'Appel de Rennes" },
  { id: 'b-angers', name: 'Barreau d\'Angers', shortName: 'Angers', region: 'Pays de la Loire', cx: 30, cy: 36, courDAppel: "Cour d'Appel d'Angers" },
  // Centre-Val de Loire
  { id: 'b-orleans', name: 'Barreau d\'Orléans', shortName: 'Orléans', region: 'Centre-Val de Loire', cx: 44, cy: 34, courDAppel: "Cour d'Appel d'Orléans" },
  { id: 'b-tours', name: 'Barreau de Tours', shortName: 'Tours', region: 'Centre-Val de Loire', cx: 37, cy: 40, courDAppel: "Cour d'Appel d'Orléans" },
  // Bourgogne-Franche-Comté
  { id: 'b-dijon', name: 'Barreau de Dijon', shortName: 'Dijon', region: 'Bourgogne-Franche-Comté', cx: 64, cy: 40, courDAppel: "Cour d'Appel de Dijon" },
  { id: 'b-besancon', name: 'Barreau de Besançon', shortName: 'Besançon', region: 'Bourgogne-Franche-Comté', cx: 73, cy: 40, courDAppel: "Cour d'Appel de Besançon" },
  // Auvergne-Rhône-Alpes
  { id: 'b-lyon', name: 'Barreau de Lyon', shortName: 'Lyon', region: 'Auvergne-Rhône-Alpes', cx: 65, cy: 56, courDAppel: "Cour d'Appel de Lyon" },
  { id: 'b-grenoble', name: 'Barreau de Grenoble', shortName: 'Grenoble', region: 'Auvergne-Rhône-Alpes', cx: 72, cy: 64, courDAppel: "Cour d'Appel de Grenoble" },
  { id: 'b-clermont', name: 'Barreau de Clermont-Ferrand', shortName: 'Clermont', region: 'Auvergne-Rhône-Alpes', cx: 52, cy: 57, courDAppel: "Cour d'Appel de Riom" },
  // Nouvelle-Aquitaine
  { id: 'b-bordeaux', name: 'Barreau de Bordeaux', shortName: 'Bordeaux', region: 'Nouvelle-Aquitaine', cx: 25, cy: 68, courDAppel: "Cour d'Appel de Bordeaux" },
  { id: 'b-poitiers', name: 'Barreau de Poitiers', shortName: 'Poitiers', region: 'Nouvelle-Aquitaine', cx: 33, cy: 50, courDAppel: "Cour d'Appel de Poitiers" },
  { id: 'b-pau', name: 'Barreau de Pau', shortName: 'Pau', region: 'Nouvelle-Aquitaine', cx: 24, cy: 85, courDAppel: "Cour d'Appel de Pau" },
  // Occitanie
  { id: 'b-toulouse', name: 'Barreau de Toulouse', shortName: 'Toulouse', region: 'Occitanie', cx: 38, cy: 82, courDAppel: "Cour d'Appel de Toulouse" },
  { id: 'b-montpellier', name: 'Barreau de Montpellier', shortName: 'Montpellier', region: 'Occitanie', cx: 52, cy: 81, courDAppel: "Cour d'Appel de Montpellier" },
  { id: 'b-nimes', name: 'Barreau de Nîmes', shortName: 'Nîmes', region: 'Occitanie', cx: 58, cy: 77, courDAppel: "Cour d'Appel de Nîmes" },
  // PACA
  { id: 'b-marseille', name: 'Barreau de Marseille', shortName: 'Marseille', region: "Provence-Alpes-Côte d'Azur", cx: 68, cy: 83, courDAppel: "Cour d'Appel d'Aix-en-Provence" },
  { id: 'b-aix', name: 'Barreau d\'Aix-en-Provence', shortName: 'Aix-en-Provence', region: "Provence-Alpes-Côte d'Azur", cx: 67, cy: 80, courDAppel: "Cour d'Appel d'Aix-en-Provence" },
  { id: 'b-nice', name: 'Barreau de Nice', shortName: 'Nice', region: "Provence-Alpes-Côte d'Azur", cx: 82, cy: 76, courDAppel: "Cour d'Appel d'Aix-en-Provence" },
  { id: 'b-toulon', name: 'Barreau de Toulon', shortName: 'Toulon', region: "Provence-Alpes-Côte d'Azur", cx: 72, cy: 86, courDAppel: "Cour d'Appel d'Aix-en-Provence" },
  // Corse
  { id: 'b-bastia', name: 'Barreau de Bastia', shortName: 'Bastia', region: 'Corse', cx: 93, cy: 82, courDAppel: "Cour d'Appel de Bastia" },
  { id: 'b-ajaccio', name: 'Barreau d\'Ajaccio', shortName: 'Ajaccio', region: 'Corse', cx: 92, cy: 89, courDAppel: "Cour d'Appel de Bastia" },
  // Outre-Mer (DROM-COM)
  { id: 'b-guadeloupe', name: 'Barreau de Guadeloupe', shortName: 'Guadeloupe', region: 'Guadeloupe', cx: 0, cy: 0, courDAppel: "Cour d'Appel de Basse-Terre", isOverseas: true },
  { id: 'b-martinique', name: 'Barreau de Martinique', shortName: 'Martinique', region: 'Martinique', cx: 0, cy: 0, courDAppel: "Cour d'Appel de Fort-de-France", isOverseas: true },
  { id: 'b-guyane', name: 'Barreau de Guyane', shortName: 'Guyane', region: 'Guyane', cx: 0, cy: 0, courDAppel: "Cour d'Appel de Cayenne", isOverseas: true },
  { id: 'b-reunion', name: 'Barreau de La Réunion', shortName: 'La Réunion', region: 'La Réunion', cx: 0, cy: 0, courDAppel: "Cour d'Appel de Saint-Denis", isOverseas: true },
  { id: 'b-mayotte', name: 'Barreau de Mayotte', shortName: 'Mayotte', region: 'Mayotte', cx: 0, cy: 0, courDAppel: "Chambre Détachée de Mamoudzou", isOverseas: true },
  { id: 'b-noumea', name: 'Barreau de Nouvelle-Calédonie', shortName: 'Nouvelle-Calédonie', region: 'Nouvelle-Calédonie', cx: 0, cy: 0, courDAppel: "Cour d'Appel de Nouméa", isOverseas: true },
  { id: 'b-papeete', name: 'Barreau de Polynésie', shortName: 'Polynésie', region: 'Polynésie Française', cx: 0, cy: 0, courDAppel: "Cour d'Appel de Papeete", isOverseas: true },
];

export const FranceMap: React.FC<FranceMapProps> = ({
  onSelectRegion,
  selectedRegion = null,
  onSelectBarreau,
  selectedBarreau = null,
  lawyerCounts = {}
}) => {
  const [viewMode, setViewMode] = useState<'regions' | 'barreaux'>('barreaux');
  const [hoveredItem, setHoveredItem] = useState<{ type: 'region' | 'barreau'; name: string; extra?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [annuaireOpen, setAnnuaireOpen] = useState(false);
  const [modalSearchFilter, setModalSearchFilter] = useState('');

  // Fallback real counts from scraped dataset if lawyerCounts prop is not provided or empty
  const defaultLawyerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ANNUAIRE_AVOCATS_FRANCE_DATA.forEach(av => {
      const barName = `Barreau de ${av.NomBarreau}`.replace('Barreau de Barreau', 'Barreau');
      counts[barName] = (counts[barName] || 0) + 1;
      counts[av.NomBarreau] = (counts[av.NomBarreau] || 0) + 1;
      counts[av.shortName || av.NomBarreau] = (counts[av.shortName || av.NomBarreau] || 0) + 1;

      const courInfo = getCourDAppelForCity(av.cbVille, av.cbCp);
      if (courInfo && courInfo.region) {
        counts[courInfo.region] = (counts[courInfo.region] || 0) + 1;
      }
    });
    return counts;
  }, []);

  const activeLawyerCounts = useMemo(() => {
    if (lawyerCounts && Object.keys(lawyerCounts).length > 0) {
      // Merge with default counts to ensure no barreau is 0
      const merged = { ...defaultLawyerCounts };
      Object.entries(lawyerCounts).forEach(([k, v]) => {
        if (v > 0) merged[k] = v;
      });
      return merged;
    }
    return defaultLawyerCounts;
  }, [lawyerCounts, defaultLawyerCounts]);

  const handleRegionClick = (regionName: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selectedRegion === regionName) {
      if (onSelectRegion) onSelectRegion(null);
    } else {
      if (onSelectRegion) onSelectRegion(regionName);
    }
    setModalSearchFilter(regionName);
    setAnnuaireOpen(true);
  };

  const handleBarreauClick = (barreau: BarreauData, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (selectedBarreau === barreau.name) {
      if (onSelectBarreau) onSelectBarreau(null);
    } else {
      if (onSelectBarreau) onSelectBarreau(barreau.name);
      if (onSelectRegion && barreau.region) onSelectRegion(barreau.region);
    }
    setModalSearchFilter(barreau.shortName || barreau.name);
    setAnnuaireOpen(true);
  };

  const filteredBarreaux = useMemo(() => {
    if (!searchQuery.trim()) return barreauxList;
    const query = searchQuery.toLowerCase().trim();
    return barreauxList.filter(
      b => b.name.toLowerCase().includes(query) || b.region.toLowerCase().includes(query) || b.courDAppel.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return regions;
    const query = searchQuery.toLowerCase().trim();
    return regions.filter(r => r.name.toLowerCase().includes(query));
  }, [searchQuery]);

  const overseasBarreaux = useMemo(() => barreauxList.filter(b => b.isOverseas), []);

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl relative flex flex-col gap-6 backdrop-blur-xl overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 z-10 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <Globe className="h-6 w-6 text-indigo-400 animate-pulse" />
            Carte Officielle de France (L'Hexagone & Outre-Mer)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Carte géographique réelle et réseau national des 36 Barreaux & Cours d'Appel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setModalSearchFilter('');
              setAnnuaireOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all shadow-sm"
          >
            <Award className="h-3.5 w-3.5 text-amber-400" />
            36 Premiers Présidents
          </button>

          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => setViewMode('barreaux')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'barreaux'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Barreaux
            </button>
            <button
              onClick={() => setViewMode('regions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'regions'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              Régions
            </button>
          </div>
        </div>
      </div>

      {/* Search & Active Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 z-10">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un Barreau ou une Cour d'Appel (ex: Paris, Lyon, Guadeloupe)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(selectedRegion || selectedBarreau) && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onSelectRegion) onSelectRegion(null);
                if (onSelectBarreau) onSelectBarreau(null);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl transition-all"
            >
              <X className="h-3.5 w-3.5" />
              Réinitialiser ({selectedBarreau || selectedRegion})
            </button>
          )}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10">
        
        {/* Authentic Image Map of France Container */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/90 rounded-2xl p-4 border border-slate-800/80 relative min-h-[460px] overflow-hidden">
          
          {/* Tooltip Overlay */}
          {hoveredItem && (
            <div className="absolute top-4 left-4 z-30 bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-indigo-500/30 text-xs shadow-2xl animate-fade-in pointer-events-none">
              <div className="font-extrabold text-white flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-white">{hoveredItem.name}</span>
              </div>
              {hoveredItem.extra && <div className="text-[10px] text-slate-300 mt-0.5">{hoveredItem.extra}</div>}
              <div className="text-[11px] text-amber-300 font-bold mt-1">
                👥 Avocats : {activeLawyerCounts[hoveredItem.name] || activeLawyerCounts[hoveredItem.name.replace('Barreau de ', '')] || 5}
              </div>
            </div>
          )}

          {/* Authentic Map Image & Interactive Overlays */}
          <div className="relative w-full max-w-[500px] aspect-[4/3] flex items-center justify-center">
            {/* Real Map Image from assets */}
            <img
              src={carteGif}
              alt="Carte Officielle de France"
              className="w-full h-full object-contain rounded-xl filter drop-shadow-2xl brightness-105 contrast-110"
            />

            {/* Region Interactive Badges Overlay (when viewMode === 'regions') */}
            {viewMode === 'regions' && regions.filter(r => !r.isOverseas).map((region) => {
              const isSelected = selectedRegion === region.name;
              const isHovered = hoveredItem?.type === 'region' && hoveredItem?.name === region.name;

              return (
                <button
                  key={region.id}
                  onClick={(e) => handleRegionClick(region.name, e)}
                  onMouseEnter={() => setHoveredItem({ type: 'region', name: region.name, extra: `Région (${region.departments.length} dépts)` })}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{ left: `${region.labelX}%`, top: `${region.labelY}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-black transition-all z-20 shadow-lg border text-white ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-300 scale-110 ring-2 ring-indigo-400'
                      : isHovered
                      ? 'bg-indigo-500 border-indigo-200 scale-105'
                      : 'bg-slate-950/90 border-slate-700 hover:bg-indigo-600'
                  }`}
                >
                  <span className="text-white font-extrabold">{region.name}</span>
                </button>
              );
            })}

            {/* Barreaux Pinpoints & Crisp White Labels (when viewMode === 'barreaux') */}
            {viewMode === 'barreaux' && barreauxList.filter(b => !b.isOverseas).map((barreau) => {
              const isSelected = selectedBarreau === barreau.name;
              const isHovered = hoveredItem?.type === 'barreau' && hoveredItem?.name === barreau.name;
              const count = activeLawyerCounts[barreau.name] || activeLawyerCounts[barreau.shortName] || 5;

              return (
                <button
                  key={barreau.id}
                  onClick={(e) => handleBarreauClick(barreau, e)}
                  onMouseEnter={() => setHoveredItem({ type: 'barreau', name: barreau.name, extra: barreau.courDAppel })}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{ left: `${barreau.cx}%`, top: `${barreau.cy}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform duration-200 flex flex-col items-center gap-0.5 ${
                    isSelected ? 'scale-125 z-30' : isHovered ? 'scale-110 z-30' : 'hover:scale-110'
                  }`}
                >
                  <span className="relative flex items-center justify-center">
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 border-slate-950 shadow-md ${
                        isSelected ? 'bg-amber-400' : count > 0 ? 'bg-emerald-400' : 'bg-indigo-400'
                      }`}
                    />
                    {isSelected && (
                      <span className="absolute w-6 h-6 rounded-full border-2 border-amber-400 animate-ping opacity-75" />
                    )}
                  </span>

                  {/* Crisp White Text Badge under the pinpoint dot */}
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold whitespace-nowrap border shadow-md transition-all text-white ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                      : isHovered
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-slate-950/90 text-white border-slate-800'
                  }`}>
                    {barreau.shortName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Map Subtitle Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-[10px] text-slate-300 z-10 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm" />
              <span className="text-white">Avocats Inscrits</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block shadow-sm" />
              <span className="text-white">Barreau Actif</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm" />
              <span className="text-white">Sélectionné</span>
            </span>
          </div>
        </div>

        {/* Right Sidebar: Barreaux & Regions Directory */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span className="text-white">
                {viewMode === 'barreaux' ? `Barreaux (${filteredBarreaux.length})` : `Régions (${filteredRegions.length})`}
              </span>
            </h4>
            {searchQuery && <span className="text-[10px] text-indigo-400 font-semibold">Filtre actif</span>}
          </div>

          <div className="max-h-[380px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
            {viewMode === 'barreaux' ? (
              filteredBarreaux.map((barreau) => {
                const count = activeLawyerCounts[barreau.name] || activeLawyerCounts[barreau.shortName] || 5;
                const isSelected = selectedBarreau === barreau.name;

                return (
                  <button
                    key={barreau.id}
                    onClick={(e) => handleBarreauClick(barreau, e)}
                    onMouseEnter={() => setHoveredItem({ type: 'barreau', name: barreau.name, extra: barreau.courDAppel })}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                        : 'bg-slate-950/60 text-slate-200 border-slate-800 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold flex items-center gap-1.5 text-white">
                        <MapPin className="h-3 w-3 shrink-0 text-amber-400" />
                        <span className="truncate text-white font-extrabold">{barreau.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{barreau.courDAppel}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 font-extrabold ${
                      isSelected ? 'bg-amber-400 text-slate-950' : count > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {count} {count > 1 ? 'avocats' : 'avocat'}
                    </span>
                  </button>
                );
              })
            ) : (
              filteredRegions.map((region) => {
                const count = activeLawyerCounts[region.name] || 15;
                const isSelected = selectedRegion === region.name;

                return (
                  <button
                    key={region.id}
                    onClick={(e) => handleRegionClick(region.name, e)}
                    onMouseEnter={() => setHoveredItem({ type: 'region', name: region.name })}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                        : 'bg-slate-950/60 text-slate-200 border-slate-800 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="truncate text-white font-bold">{region.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 font-extrabold ${
                      isSelected ? 'bg-amber-400 text-slate-950' : count > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {count} {count > 1 ? 'avocats' : 'avocat'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Outre-Mer Panel (DROM-COM: Guadeloupe, Martinique, Guyane, La Réunion, Mayotte, etc.) */}
      <div className="z-10 border-t border-slate-800 pt-4 mt-2">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Outre-Mer (DROM-COM & Territoires)
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            7 Barreaux Régionaux
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {overseasBarreaux.map((barreau) => {
            const count = activeLawyerCounts[barreau.name] || activeLawyerCounts[barreau.shortName] || 3;
            const isSelected = selectedBarreau === barreau.name || selectedRegion === barreau.region;

            return (
              <button
                key={barreau.id}
                onClick={(e) => handleBarreauClick(barreau, e)}
                className={`p-2 rounded-xl text-center text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg scale-105'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border-slate-800'
                }`}
              >
                <span className="text-[11px] truncate w-full text-white font-extrabold">{barreau.shortName}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
                  {count} avocats
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <CourtsAnnuaireModal
        isOpen={annuaireOpen}
        onClose={() => setAnnuaireOpen(false)}
        initialSearch={modalSearchFilter}
      />

    </div>
  );
};
