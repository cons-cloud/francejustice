import React from 'react';
import { Scale, ShieldCheck, Sparkles } from 'lucide-react';

interface ProfessionalLoaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  fullScreen?: boolean;
}

export const ProfessionalLoader: React.FC<ProfessionalLoaderProps> = ({
  title = "France Justice",
  subtitle = "Chargement sécurisé et synchronisation en temps réel...",
  badge = "Plateforme Juridique Officielle",
  fullScreen = false,
}) => {
  return (
    <div
      className={`w-full ${
        fullScreen ? 'fixed inset-0 z-[9999]' : 'min-h-[70vh]'
      } bg-white flex flex-col items-center justify-center p-6 text-slate-900 select-none`}
    >
      {/* Subtle Ambient Radial Cyan Glow */}
      <div className="absolute w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none animate-pulse" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Animated Scales Emblem with Rotating Aura */}
        <div className="relative mb-6">
          {/* Rotating Glowing Ring */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-cyan-500/30 to-teal-500/20 blur-sm animate-spin-slow pointer-events-none" />

          {/* Icon Container */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white shadow-xl shadow-cyan-600/30 border border-white/40">
            <Scale className="h-10 w-10 text-white animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-white" />
            </span>
          </div>
        </div>

        {/* Official Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>{badge}</span>
        </div>

        {/* Platform Title */}
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          {title}
        </h2>

        {/* Subtitle / Status message */}
        <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed max-w-sm">
          {subtitle}
        </p>

        {/* High-End Indeterminate Progress Bar */}
        <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner relative mb-4">
          <div className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-600 rounded-full animate-indeterminate" />
        </div>

        {/* Security & Sync Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Chiffrement WebRTC • Audit déontologique actif</span>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalLoader;
