import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  LogOut, 
  ChevronDown, 
  Check, 
  Lock, 
  Shield,
  Sliders
} from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface SessionTimeoutManagerProps {
  roleMode?: 'citizen' | 'lawyer' | 'admin';
  className?: string;
}

const DURATION_OPTIONS = [
  { minutes: 15, label: '15 minutes', description: 'Sécurité Maximale (Secret Professionnel / Recommandé)' },
  { minutes: 30, label: '30 minutes', description: 'Standard Avocats & Citoyens' },
  { minutes: 60, label: '1 heure', description: 'Session Prolongée' },
  { minutes: 120, label: '2 heures', description: 'Session Longue (Usage Bureautique)' }
];

export const SessionTimeoutManager: React.FC<SessionTimeoutManagerProps> = ({
  roleMode = 'citizen',
  className = ''
}) => {
  const { success, warning } = useToast();

  // Load preferred duration or default to 15 minutes for high-security compliance
  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('francejustice_session_duration');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if ([15, 30, 60, 120].includes(parsed)) return parsed;
      }
    }
    return 15;
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(durationMinutes * 60);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  // Logout handler
  const handleAutoLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('francejustice_session_expired', 'true');
        sessionStorage.setItem('francejustice_session_expired_role', roleMode);
      }
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Error during auto-signout:", e);
    } finally {
      window.location.href = '/login';
    }
  }, [roleMode]);

  // Reset timer on user action
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingSeconds(durationMinutes * 60);
    setIsWarningOpen(false);
  }, [durationMinutes]);

  // Extend session manually
  const extendSession = () => {
    resetTimer();
    setIsDropdownOpen(false);
    success("Session prolongée avec succès !");
  };

  // Change duration preference
  const selectDuration = (mins: number) => {
    setDurationMinutes(mins);
    localStorage.setItem('francejustice_session_duration', mins.toString());
    setRemainingSeconds(mins * 60);
    lastActivityRef.current = Date.now();
    setIsDropdownOpen(false);
    success(`Durée de session fixée à ${mins} minutes.`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inactivity listeners: throttled reset
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleUserActivity = () => {
      if (throttleTimeout) return;

      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
      }, 3000); // at most once every 3s

      // Only silently reset if warning modal is NOT currently showing
      // If warning modal is showing, require explicit click on "Prolonger" to prevent abandoned desk logins
      if (!isWarningOpen && remainingSeconds > 60) {
        lastActivityRef.current = Date.now();
        setRemainingSeconds(durationMinutes * 60);
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, handleUserActivity, { passive: true }));

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleUserActivity));
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [durationMinutes, isWarningOpen, remainingSeconds]);

  // Main countdown timer ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoLogout();
          return 0;
        }

        // Trigger warning modal when <= 60 seconds remain
        if (prev === 61) {
          setIsWarningOpen(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleAutoLogout]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Color coding based on remaining time
  const isCritical = remainingSeconds <= 60;
  const isWarning = remainingSeconds <= 180 && remainingSeconds > 60;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Top Bar Indicator Button */}
      <button
        onClick={() => setIsDropdownOpen(prev => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
          isCritical 
            ? 'bg-red-500 text-white border-red-400 animate-pulse ring-2 ring-red-300' 
            : isWarning 
            ? 'bg-amber-500 text-white border-amber-400 ring-2 ring-amber-200' 
            : 'bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-xs'
        }`}
        title={`Session active : ${formatTime(remainingSeconds)} restant avant déconnexion de sécurité`}
      >
        <Clock className={`w-3.5 h-3.5 ${isCritical ? 'animate-spin' : ''}`} />
        <span className="font-mono">{formatTime(remainingSeconds)}</span>
        <ChevronDown className="w-3 h-3 opacity-80" />
      </button>

      {/* Session Management Dropdown (Strict Light Theme) */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Session Sécurisée</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Protection des données juridiques</p>
                </div>
              </div>
              <span className="text-xs font-mono font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200">
                {formatTime(remainingSeconds)}
              </span>
            </div>

            <div className="space-y-1.5 mb-3">
              <div className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-600" /> Durée d&apos;inactivité autorisée :
              </div>
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.minutes}
                  onClick={() => selectDuration(opt.minutes)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                    durationMinutes === opt.minutes
                      ? 'bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">{opt.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{opt.description}</div>
                  </div>
                  {durationMinutes === opt.minutes && (
                    <Check className="w-4 h-4 text-cyan-600 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Button
                onClick={extendSession}
                size="sm"
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Prolonger
              </Button>
              <Button
                onClick={handleAutoLogout}
                variant="outline"
                size="sm"
                className="bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-700 border-slate-200 hover:border-red-200 rounded-xl text-xs flex items-center justify-center gap-1"
                title="Déconnexion immédiate"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Modal (Popup when remaining time <= 60 seconds) */}
      <AnimatePresence>
        {isWarningOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-200 text-slate-900 text-center relative overflow-hidden"
            >
              {/* Top Accent bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Session Bientôt Expirée
              </h3>

              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Par mesure de sécurité et pour garantir la confidentialité de vos dossiers juridiques (secret professionnel &amp; RGPD), votre session sera automatiquement fermée dans :
              </p>

              {/* Countdown Display */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl py-3 px-6 inline-block mb-6 shadow-xs">
                <span className="text-4xl font-black font-mono text-amber-700">
                  {remainingSeconds}s
                </span>
                <span className="block text-[11px] text-amber-800 font-bold uppercase tracking-wider mt-0.5">
                  secondes restantes
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={extendSession}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-extrabold py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Prolonger ma session
                </Button>
                <Button
                  onClick={handleAutoLogout}
                  variant="outline"
                  className="bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border-slate-200 hover:border-red-200 font-bold py-3 rounded-xl"
                >
                  <LogOut className="w-4 h-4 mr-1.5" /> Me déconnecter
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionTimeoutManager;
