import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

interface FranceMapProps {
  onSelectRegion: (regionName: string | null) => void;
  selectedRegion: string | null;
  lawyerCounts: Record<string, number>; // Maps region/city/dept to number of lawyers
}

interface RegionData {
  id: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
  departments: string[];
}

// Stylized polygonal paths for the 13 French metropolitan regions (centered in 400x400 viewBox)
export const regions: RegionData[] = [
  {
    id: 'HDF',
    name: 'Hauts-de-France',
    path: 'M 180 20 L 220 20 L 240 60 L 210 100 L 160 80 Z',
    labelX: 200,
    labelY: 50,
    departments: ['59', '62', '02', '60', '80']
  },
  {
    id: 'NOR',
    name: 'Normandie',
    path: 'M 110 80 L 160 80 L 170 110 L 140 130 L 90 110 Z',
    labelX: 130,
    labelY: 100,
    departments: ['14', '27', '50', '76', '61']
  },
  {
    id: 'IDF',
    name: 'Île-de-France',
    path: 'M 170 100 L 210 100 L 210 130 L 170 130 Z',
    labelX: 190,
    labelY: 115,
    departments: ['75', '77', '78', '91', '92', '93', '94', '95']
  },
  {
    id: 'GES',
    name: 'Grand Est',
    path: 'M 220 20 L 290 50 L 320 100 L 270 150 L 220 120 L 210 100 L 240 60 Z',
    labelX: 270,
    labelY: 90,
    departments: ['67', '68', '08', '10', '51', '52', '54', '55', '57', '88']
  },
  {
    id: 'BRE',
    name: 'Bretagne',
    path: 'M 30 100 L 90 110 L 80 150 L 20 140 Z',
    labelX: 55,
    labelY: 125,
    departments: ['22', '29', '35', '56']
  },
  {
    id: 'PDL',
    name: 'Pays de la Loire',
    path: 'M 90 110 L 140 130 L 120 190 L 70 180 L 80 150 Z',
    labelX: 100,
    labelY: 160,
    departments: ['44', '49', '53', '72', '85']
  },
  {
    id: 'CVL',
    name: 'Centre-Val de Loire',
    path: 'M 140 130 L 170 110 L 210 130 L 210 170 L 160 200 L 120 190 Z',
    labelX: 170,
    labelY: 160,
    departments: ['18', '28', '36', '37', '41', '45']
  },
  {
    id: 'BFC',
    name: 'Bourgogne-Franche-Comté',
    path: 'M 210 130 L 220 120 L 270 150 L 280 200 L 220 230 L 210 170 Z',
    labelX: 245,
    labelY: 175,
    departments: ['21', '25', '39', '58', '70', '71', '89', '90']
  },
  {
    id: 'ARA',
    name: 'Auvergne-Rhône-Alpes',
    path: 'M 210 210 L 220 230 L 280 200 L 310 260 L 290 300 L 220 300 L 170 270 Z',
    labelX: 240,
    labelY: 260,
    departments: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74']
  },
  {
    id: 'NAQ',
    name: 'Nouvelle-Aquitaine',
    path: 'M 70 180 L 120 190 L 160 200 L 170 270 L 220 300 L 190 350 L 110 350 L 90 290 Z',
    labelX: 130,
    labelY: 270,
    departments: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87']
  },
  {
    id: 'OCC',
    name: 'Occitanie',
    path: 'M 170 270 L 220 300 L 240 330 L 220 370 L 150 370 L 110 350 Z',
    labelX: 180,
    labelY: 335,
    departments: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82']
  },
  {
    id: 'PAC',
    name: "Provence-Alpes-Côte d'Azur",
    path: 'M 290 300 L 320 290 L 330 330 L 270 340 L 240 330 Z',
    labelX: 285,
    labelY: 320,
    departments: ['04', '05', '06', '13', '83', '84']
  },
  {
    id: 'COR',
    name: 'Corse',
    path: 'M 320 350 L 340 350 L 340 380 L 320 380 Z',
    labelX: 330,
    labelY: 365,
    departments: ['2A', '2B']
  }
];

export const FranceMap: React.FC<FranceMapProps> = ({ onSelectRegion, selectedRegion, lawyerCounts }) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const handleRegionClick = (regionName: string) => {
    if (selectedRegion === regionName) {
      onSelectRegion(null); // Deselect if clicked again
    } else {
      onSelectRegion(regionName);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-secondary-200 shadow-md relative flex flex-col md:flex-row items-center gap-8">
      <div className="flex-1 w-full flex justify-center">
        <svg
          viewBox="0 0 380 400"
          className="w-full max-w-[340px] h-auto drop-shadow-xl"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {regions.map((region) => {
            const isSelected = selectedRegion === region.name;
            const isHovered = hoveredRegion === region.name;

            return (
              <g key={region.id} className="cursor-pointer">
                {/* Region Path */}
                <path
                  d={region.path}
                  fill={isSelected ? '#6366F1' : isHovered ? '#818CF8' : '#F1F5F9'}
                  stroke={isSelected ? '#4F46E5' : '#CBD5E1'}
                  strokeWidth={isSelected ? '2' : '1.5'}
                  className="transition-colors duration-200"
                  onClick={() => handleRegionClick(region.name)}
                  onMouseEnter={() => setHoveredRegion(region.name)}
                  onMouseLeave={() => setHoveredRegion(null)}
                />

                {/* Region Label Indicator dot */}
                <circle
                  cx={region.labelX}
                  cy={region.labelY}
                  r="3.5"
                  className="pointer-events-none"
                  fill={isSelected ? '#FFFFFF' : '#94A3B8'}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex-1 space-y-4 w-full">
        <div>
          <h3 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            Recherche par Région
          </h3>
          <p className="text-xs text-secondary-500 mt-1">
            Cliquez sur une région pour filtrer immédiatement les avocats correspondants.
          </p>
        </div>

        {/* Legend / Stats list */}
        <div className="max-h-[200px] overflow-y-auto pr-2 space-y-1.5 scrollbar-thin">
          {regions.map((region) => {
            const count = lawyerCounts[region.name] || 0;
            const isSelected = selectedRegion === region.name;

            return (
              <button
                key={region.id}
                onClick={() => handleRegionClick(region.name)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold transition-all ${
                  isSelected 
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600 font-bold' 
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <span>{region.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  isSelected ? 'bg-primary-600 text-white' : count > 0 ? 'bg-secondary-100 text-secondary-800' : 'bg-secondary-50 text-secondary-400'
                }`}>
                  {count} {count > 1 ? 'avocats' : 'avocat'}
                </span>
              </button>
            );
          })}
        </div>

        {selectedRegion && (
          <button
            onClick={() => onSelectRegion(null)}
            className="w-full py-2.5 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 text-xs font-bold rounded-xl transition-colors text-center"
          >
            Réinitialiser le filtre régional
          </button>
        )}
      </div>
    </div>
  );
};
