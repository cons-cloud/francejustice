import React, { useState, useMemo } from 'react';
import { MapPin, Building2, Search, Globe, X, Shield, Sparkles, Award } from 'lucide-react';
import { CourtsAnnuaireModal } from './CourtsAnnuaireModal';

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
  path: string;
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
  cx: number;
  cy: number;
  courDAppel: string;
  isOverseas?: boolean;
}

// Full 18 French Regions (13 Metropolitan + 5 DROM + 2 POM)
export const regions: RegionData[] = [
  { id: 'HDF', name: 'Hauts-de-France', path: 'M 180 20 L 220 20 L 240 60 L 210 100 L 160 80 Z', labelX: 200, labelY: 50, departments: ['59', '62', '02', '60', '80'] },
  { id: 'NOR', name: 'Normandie', path: 'M 110 80 L 160 80 L 170 110 L 140 130 L 90 110 Z', labelX: 130, labelY: 100, departments: ['14', '27', '50', '76', '61'] },
  { id: 'IDF', name: 'Île-de-France', path: 'M 170 100 L 210 100 L 210 130 L 170 130 Z', labelX: 190, labelY: 115, departments: ['75', '77', '78', '91', '92', '93', '94', '95'] },
  { id: 'GES', name: 'Grand Est', path: 'M 220 20 L 290 50 L 320 100 L 270 150 L 220 120 L 210 100 L 240 60 Z', labelX: 270, labelY: 90, departments: ['67', '68', '08', '10', '51', '52', '54', '55', '57', '88'] },
  { id: 'BRE', name: 'Bretagne', path: 'M 30 100 L 90 110 L 80 150 L 20 140 Z', labelX: 55, labelY: 125, departments: ['22', '29', '35', '56'] },
  { id: 'PDL', name: 'Pays de la Loire', path: 'M 90 110 L 140 130 L 120 190 L 70 180 L 80 150 Z', labelX: 100, labelY: 160, departments: ['44', '49', '53', '72', '85'] },
  { id: 'CVL', name: 'Centre-Val de Loire', path: 'M 140 130 L 170 110 L 210 130 L 210 170 L 160 200 L 120 190 Z', labelX: 170, labelY: 160, departments: ['18', '28', '36', '37', '41', '45'] },
  { id: 'BFC', name: 'Bourgogne-Franche-Comté', path: 'M 210 130 L 220 120 L 270 150 L 280 200 L 220 230 L 210 170 Z', labelX: 245, labelY: 175, departments: ['21', '25', '39', '58', '70', '71', '89', '90'] },
  { id: 'ARA', name: 'Auvergne-Rhône-Alpes', path: 'M 210 210 L 220 230 L 280 200 L 310 260 L 290 300 L 220 300 L 170 270 Z', labelX: 240, labelY: 260, departments: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'] },
  { id: 'NAQ', name: 'Nouvelle-Aquitaine', path: 'M 70 180 L 120 190 L 160 200 L 170 270 L 220 300 L 190 350 L 110 350 L 90 290 Z', labelX: 130, labelY: 270, departments: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'] },
  { id: 'OCC', name: 'Occitanie', path: 'M 170 270 L 220 300 L 240 330 L 220 370 L 150 370 L 110 350 Z', labelX: 180, labelY: 335, departments: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'] },
  { id: 'PAC', name: "Provence-Alpes-Côte d'Azur", path: 'M 290 300 L 320 290 L 330 330 L 270 340 L 240 330 Z', labelX: 285, labelY: 320, departments: ['04', '05', '06', '13', '83', '84'] },
  { id: 'COR', name: 'Corse', path: 'M 320 350 L 340 350 L 340 380 L 320 380 Z', labelX: 330, labelY: 365, departments: ['2A', '2B'] },
  // Outre-Mer (DROM-COM)
  { id: 'GLP', name: 'Guadeloupe', path: '', labelX: 0, labelY: 0, departments: ['971'], isOverseas: true },
  { id: 'MTQ', name: 'Martinique', path: '', labelX: 0, labelY: 0, departments: ['972'], isOverseas: true },
  { id: 'GUY', name: 'Guyane', path: '', labelX: 0, labelY: 0, departments: ['973'], isOverseas: true },
  { id: 'REU', name: 'La Réunion', path: '', labelX: 0, labelY: 0, departments: ['974'], isOverseas: true },
  { id: 'MAY', name: 'Mayotte', path: '', labelX: 0, labelY: 0, departments: ['976'], isOverseas: true },
  { id: 'NCL', name: 'Nouvelle-Calédonie', path: '', labelX: 0, labelY: 0, departments: ['988'], isOverseas: true },
  { id: 'PYF', name: 'Polynésie Française', path: '', labelX: 0, labelY: 0, departments: ['987'], isOverseas: true },
];

export const barreauxList: BarreauData[] = [
  // Île-de-France
  { id: 'b-paris', name: 'Barreau de Paris', shortName: 'Paris', region: 'Île-de-France', cx: 190, cy: 115, courDAppel: "Cour d'Appel de Paris" },
  { id: 'b-versailles', name: 'Barreau de Versailles', shortName: 'Versailles', region: 'Île-de-France', cx: 180, cy: 122, courDAppel: "Cour d'Appel de Versailles" },
  { id: 'b-nanterre', name: 'Barreau des Hauts-de-Seine (Nanterre)', shortName: 'Nanterre', region: 'Île-de-France', cx: 185, cy: 112, courDAppel: "Cour d'Appel de Versailles" },
  { id: 'b-bobigny', name: 'Barreau de Seine-Saint-Denis (Bobigny)', shortName: 'Bobigny', region: 'Île-de-France', cx: 196, cy: 110, courDAppel: "Cour d'Appel de Paris" },
  { id: 'b-valdemarne', name: 'Barreau du Val-de-Marne (Créteil)', shortName: 'Créteil', region: 'Île-de-France', cx: 195, cy: 120, courDAppel: "Cour d'Appel de Paris" },
  // Hauts-de-France
  { id: 'b-lille', name: 'Barreau de Lille', shortName: 'Lille', region: 'Hauts-de-France', cx: 200, cy: 45, courDAppel: "Cour d'Appel de Douai" },
  { id: 'b-amiens', name: 'Barreau d\'Amiens', shortName: 'Amiens', region: 'Hauts-de-France', cx: 185, cy: 70, courDAppel: "Cour d'Appel d'Amiens" },
  // Normandie
  { id: 'b-rouen', name: 'Barreau de Rouen', shortName: 'Rouen', region: 'Normandie', cx: 155, cy: 90, courDAppel: "Cour d'Appel de Rouen" },
  { id: 'b-caen', name: 'Barreau de Caen', shortName: 'Caen', region: 'Normandie', cx: 125, cy: 100, courDAppel: "Cour d'Appel de Caen" },
  // Grand Est
  { id: 'b-strasbourg', name: 'Barreau de Strasbourg', shortName: 'Strasbourg', region: 'Grand Est', cx: 310, cy: 105, courDAppel: "Cour d'Appel de Colmar" },
  { id: 'b-nancy', name: 'Barreau de Nancy', shortName: 'Nancy', region: 'Grand Est', cx: 275, cy: 110, courDAppel: "Cour d'Appel de Nancy" },
  { id: 'b-reims', name: 'Barreau de Reims', shortName: 'Reims', region: 'Grand Est', cx: 235, cy: 85, courDAppel: "Cour d'Appel de Reims" },
  { id: 'b-metz', name: 'Barreau de Metz', shortName: 'Metz', region: 'Grand Est', cx: 285, cy: 88, courDAppel: "Cour d'Appel de Metz" },
  // Bretagne
  { id: 'b-rennes', name: 'Barreau de Rennes', shortName: 'Rennes', region: 'Bretagne', cx: 75, cy: 130, courDAppel: "Cour d'Appel de Rennes" },
  { id: 'b-brest', name: 'Barreau de Brest', shortName: 'Brest', region: 'Bretagne', cx: 35, cy: 115, courDAppel: "Cour d'Appel de Rennes" },
  // Pays de la Loire
  { id: 'b-nantes', name: 'Barreau de Nantes', shortName: 'Nantes', region: 'Pays de la Loire', cx: 90, cy: 160, courDAppel: "Cour d'Appel de Rennes" },
  { id: 'b-angers', name: 'Barreau d\'Angers', shortName: 'Angers', region: 'Pays de la Loire', cx: 118, cy: 152, courDAppel: "Cour d'Appel d'Angers" },
  // Centre-Val de Loire
  { id: 'b-orleans', name: 'Barreau d\'Orléans', shortName: 'Orléans', region: 'Centre-Val de Loire', cx: 175, cy: 145, courDAppel: "Cour d'Appel d'Orléans" },
  { id: 'b-tours', name: 'Barreau de Tours', shortName: 'Tours', region: 'Centre-Val de Loire', cx: 145, cy: 165, courDAppel: "Cour d'Appel d'Orléans" },
  // Bourgogne-Franche-Comté
  { id: 'b-dijon', name: 'Barreau de Dijon', shortName: 'Dijon', region: 'Bourgogne-Franche-Comté', cx: 240, cy: 165, courDAppel: "Cour d'Appel de Dijon" },
  { id: 'b-besancon', name: 'Barreau de Besançon', shortName: 'Besançon', region: 'Bourgogne-Franche-Comté', cx: 270, cy: 160, courDAppel: "Cour d'Appel de Besançon" },
  // Auvergne-Rhône-Alpes
  { id: 'b-lyon', name: 'Barreau de Lyon', shortName: 'Lyon', region: 'Auvergne-Rhône-Alpes', cx: 250, cy: 235, courDAppel: "Cour d'Appel de Lyon" },
  { id: 'b-grenoble', name: 'Barreau de Grenoble', shortName: 'Grenoble', region: 'Auvergne-Rhône-Alpes', cx: 265, cy: 265, courDAppel: "Cour d'Appel de Grenoble" },
  { id: 'b-clermont', name: 'Barreau de Clermont-Ferrand', shortName: 'Clermont', region: 'Auvergne-Rhône-Alpes', cx: 205, cy: 235, courDAppel: "Cour d'Appel de Riom" },
  // Nouvelle-Aquitaine
  { id: 'b-bordeaux', name: 'Barreau de Bordeaux', shortName: 'Bordeaux', region: 'Nouvelle-Aquitaine', cx: 120, cy: 275, courDAppel: "Cour d'Appel de Bordeaux" },
  { id: 'b-poitiers', name: 'Barreau de Poitiers', shortName: 'Poitiers', region: 'Nouvelle-Aquitaine', cx: 135, cy: 205, courDAppel: "Cour d'Appel de Poitiers" },
  { id: 'b-pau', name: 'Barreau de Pau', shortName: 'Pau', region: 'Nouvelle-Aquitaine', cx: 125, cy: 335, courDAppel: "Cour d'Appel de Pau" },
  // Occitanie
  { id: 'b-toulouse', name: 'Barreau de Toulouse', shortName: 'Toulouse', region: 'Occitanie', cx: 165, cy: 330, courDAppel: "Cour d'Appel de Toulouse" },
  { id: 'b-montpellier', name: 'Barreau de Montpellier', shortName: 'Montpellier', region: 'Occitanie', cx: 215, cy: 325, courDAppel: "Cour d'Appel de Montpellier" },
  { id: 'b-nimes', name: 'Barreau de Nîmes', shortName: 'Nîmes', region: 'Occitanie', cx: 235, cy: 305, courDAppel: "Cour d'Appel de Nîmes" },
  // PACA
  { id: 'b-marseille', name: 'Barreau de Marseille', shortName: 'Marseille', region: "Provence-Alpes-Côte d'Azur", cx: 275, cy: 330, courDAppel: "Cour d'Appel d'Aix-en-Provence" },
  { id: 'b-aix', name: 'Barreau d\'Aix-en-Provence', shortName: 'Aix-en-Provence', region: "Provence-Alpes-Côte d'Azur", cx: 270, cy: 320, courDAppel: "Cour d'Appel d'Aix-en-Provence" },
  { id: 'b-nice', name: 'Barreau de Nice', shortName: 'Nice', region: "Provence-Alpes-Côte d'Azur", cx: 325, cy: 310, courDAppel: "Cour d'Appel d'Aix-en-Provence" },
  { id: 'b-toulon', name: 'Barreau de Toulon', shortName: 'Toulon', region: "Provence-Alpes-Côte d'Azur", cx: 290, cy: 340, courDAppel: "Cour d'Appel d'Aix-en-Provence" },
  // Corse
  { id: 'b-bastia', name: 'Barreau de Bastia', shortName: 'Bastia', region: 'Corse', cx: 335, cy: 360, courDAppel: "Cour d'Appel de Bastia" },
  { id: 'b-ajaccio', name: 'Barreau d\'Ajaccio', shortName: 'Ajaccio', region: 'Corse', cx: 330, cy: 375, courDAppel: "Cour d'Appel de Bastia" },
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

  const handleRegionClick = (regionName: string) => {
    if (selectedRegion === regionName) {
      if (onSelectRegion) onSelectRegion(null);
    } else {
      if (onSelectRegion) onSelectRegion(regionName);
    }
  };

  const handleBarreauClick = (barreau: BarreauData) => {
    if (selectedBarreau === barreau.name) {
      if (onSelectBarreau) onSelectBarreau(null);
    } else {
      if (onSelectBarreau) onSelectBarreau(barreau.name);
      if (onSelectRegion && barreau.region) onSelectRegion(barreau.region);
    }
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
            Carte Nationale des Barreaux de France
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Explorez l'intégralité du territoire français (Métropole & Outre-mer)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAnnuaireOpen(true)}
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
              onClick={() => {
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
        
        {/* SVG Interactive Map */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 relative min-h-[360px]">
          
          {/* Tooltip Overlay */}
          {hoveredItem && (
            <div className="absolute top-4 left-4 z-30 bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-indigo-500/30 text-xs shadow-xl animate-fade-in pointer-events-none">
              <div className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                {hoveredItem.name}
              </div>
              {hoveredItem.extra && <div className="text-[10px] text-slate-400 mt-0.5">{hoveredItem.extra}</div>}
              <div className="text-[11px] text-amber-300 font-semibold mt-1">
                👥 Avocats : {lawyerCounts[hoveredItem.name] || 0}
              </div>
            </div>
          )}

          <svg
            viewBox="0 0 380 400"
            className="w-full max-w-[360px] h-auto drop-shadow-2xl"
          >
            {/* Metropolitan Regions */}
            {regions.filter(r => !r.isOverseas).map((region) => {
              const isSelected = selectedRegion === region.name;
              const isHovered = hoveredItem?.type === 'region' && hoveredItem?.name === region.name;

              return (
                <g key={region.id} className="cursor-pointer">
                  <path
                    d={region.path}
                    fill={isSelected ? '#4F46E5' : isHovered ? '#6366F1' : '#1E293B'}
                    stroke={isSelected ? '#818CF8' : '#334155'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="transition-colors duration-200 hover:opacity-90"
                    onClick={() => handleRegionClick(region.name)}
                    onMouseEnter={() => setHoveredItem({ type: 'region', name: region.name, extra: `Région (${region.departments.length} dépts)` })}
                    onMouseLeave={() => setHoveredItem(null)}
                  />
                </g>
              );
            })}

            {/* Barreaux Pinpoints (Visible when viewMode === 'barreaux' or searched) */}
            {viewMode === 'barreaux' && barreauxList.filter(b => !b.isOverseas).map((barreau) => {
              const isSelected = selectedBarreau === barreau.name;
              const isHovered = hoveredItem?.type === 'barreau' && hoveredItem?.name === barreau.name;
              const count = lawyerCounts[barreau.name] || 0;

              return (
                <g
                  key={barreau.id}
                  className="cursor-pointer transition-transform duration-200 hover:scale-125"
                  onClick={() => handleBarreauClick(barreau)}
                  onMouseEnter={() => setHoveredItem({ type: 'barreau', name: barreau.name, extra: barreau.courDAppel })}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <circle
                    cx={barreau.cx}
                    cy={barreau.cy}
                    r={isSelected ? 6.5 : isHovered ? 5.5 : 4}
                    fill={isSelected ? '#F59E0B' : count > 0 ? '#10B981' : '#818CF8'}
                    stroke="#0F172A"
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                  {isSelected && (
                    <circle
                      cx={barreau.cx}
                      cy={barreau.cy}
                      r="10"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      className="animate-ping opacity-75"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Map Subtitle Legend */}
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Avocats Inscrits
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> Barreau Actif
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Sélectionné
            </span>
          </div>
        </div>

        {/* Right Sidebar: Barreaux & Regions Directory */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-indigo-400" />
              {viewMode === 'barreaux' ? `Barreaux (${filteredBarreaux.length})` : `Régions (${filteredRegions.length})`}
            </h4>
            {searchQuery && <span className="text-[10px] text-indigo-400 font-semibold">Filtre actif</span>}
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
            {viewMode === 'barreaux' ? (
              filteredBarreaux.map((barreau) => {
                const count = lawyerCounts[barreau.name] || 0;
                const isSelected = selectedBarreau === barreau.name;

                return (
                  <button
                    key={barreau.id}
                    onClick={() => handleBarreauClick(barreau)}
                    onMouseEnter={() => setHoveredItem({ type: 'barreau', name: barreau.name, extra: barreau.courDAppel })}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-bold flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 shrink-0 text-amber-400" />
                        <span className="truncate">{barreau.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{barreau.courDAppel}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 font-extrabold ${
                      isSelected ? 'bg-amber-400 text-slate-950' : count > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {count} {count > 1 ? 'avocats' : 'avocat'}
                    </span>
                  </button>
                );
              })
            ) : (
              filteredRegions.map((region) => {
                const count = lawyerCounts[region.name] || 0;
                const isSelected = selectedRegion === region.name;

                return (
                  <button
                    key={region.id}
                    onClick={() => handleRegionClick(region.name)}
                    onMouseEnter={() => setHoveredItem({ type: 'region', name: region.name })}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{region.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 font-extrabold ${
                      isSelected ? 'bg-amber-400 text-slate-950' : count > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
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
            const count = lawyerCounts[barreau.name] || 0;
            const isSelected = selectedBarreau === barreau.name || selectedRegion === barreau.region;

            return (
              <button
                key={barreau.id}
                onClick={() => handleBarreauClick(barreau)}
                className={`p-2 rounded-xl text-center text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg scale-105'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-200 border-slate-800'
                }`}
              >
                <span className="text-[11px] truncate w-full">{barreau.shortName}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
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
      />

    </div>
  );
};
