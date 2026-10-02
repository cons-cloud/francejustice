import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, CheckCircle2, Lock, RefreshCw, AlertCircle, Sparkles, Scale, Fingerprint } from 'lucide-react';

interface SecurityCaptchaProps {
  onVerify: (isValid: boolean, token?: string) => void;
  theme?: 'light' | 'dark';
  className?: string;
  size?: 'normal' | 'compact';
}

interface TelemetryPoint {
  x: number;
  y: number;
  t: number;
}

export const SecurityCaptcha: React.FC<SecurityCaptchaProps> = ({
  onVerify,
  theme = 'light',
  className = '',
  size = 'normal'
}) => {
  const [isVerified, setIsVerified] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0); // 0 to 100%
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState("Glissez pour vérifier");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(120);
  const [securityToken, setSecurityToken] = useState<string | null>(null);
  const [challengeMode, setChallengeMode] = useState<'slider' | 'puzzle'>('slider');

  // Interactive puzzle canvas states
  const [puzzleTarget, setPuzzleTarget] = useState({ x: 160, y: 30 });
  const [puzzleAnswer, setPuzzleAnswer] = useState(0);
  const puzzleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Behavioral Telemetry for bot detection
  const telemetryRef = useRef<TelemetryPoint[]>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a randomized puzzle configuration
  const generateNewPuzzle = useCallback(() => {
    const targetX = Math.floor(Math.random() * 120) + 80; // 80 - 200px
    const targetY = Math.floor(Math.random() * 20) + 15;
    setPuzzleTarget({ x: targetX, y: targetY });
    setPuzzleAnswer(0);
  }, []);

  // Draw dynamic holographic puzzle canvas
  useEffect(() => {
    if (challengeMode !== 'puzzle') return;
    const canvas = puzzleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background Cyber Grid
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, theme === 'dark' ? '#0f172a' : '#f1f5f9');
    gradient.addColorStop(1, theme === 'dark' ? '#1e293b' : '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = theme === 'dark' ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Dynamic wave animation
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const y = 35 + Math.sin(x * 0.05 + Date.now() * 0.003) * 8;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Target Silhouette (Justice Seal circle with dashed border)
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#0284c7';
    ctx.fillStyle = theme === 'dark' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(2, 132, 199, 0.15)';
    ctx.beginPath();
    ctx.arc(puzzleTarget.x, 35, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draggable Puzzle Piece
    const pieceX = Math.min(Math.max(puzzleAnswer, 20), canvas.width - 25);
    ctx.save();
    ctx.shadowColor = 'rgba(2, 132, 199, 0.4)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(pieceX, 35, 16, 0, Math.PI * 2);
    ctx.fill();

    // Balance Icon inner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚖️', pieceX, 35);
    ctx.restore();
  }, [challengeMode, puzzleTarget, puzzleAnswer, theme]);

  // Handle Drag Start
  const handleStart = (clientX: number) => {
    if (isVerified || isAnalyzing) return;
    setIsDragging(true);
    setErrorMsg(null);
    startXRef.current = clientX;
    telemetryRef.current = [{ x: clientX, y: 0, t: Date.now() }];
    setAnalysisText("Analyse biométrique en cours...");
  };

  // Handle Drag Move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !trackRef.current || isVerified) return;

    const rect = trackRef.current.getBoundingClientRect();
    const trackWidth = rect.width - 48; // minus handle width
    const currentX = Math.max(0, Math.min(clientX - rect.left - 24, trackWidth));
    const percent = Math.round((currentX / trackWidth) * 100);

    setSliderPosition(percent);
    telemetryRef.current.push({ x: clientX, y: clientY, t: Date.now() });

    if (percent > 85) {
      setAnalysisText("Presque validé...");
    } else if (percent > 40) {
      setAnalysisText("Calcul des micro-variations...");
    }
  }, [isDragging, isVerified]);

  // Handle Drag End & Biometric Security Evaluation
  const handleEnd = useCallback(() => {
    if (!isDragging || isVerified) return;
    setIsDragging(false);

    if (sliderPosition >= 96) {
      // Analyze Telemetry to block bot scripts
      setIsAnalyzing(true);
      setAnalysisText("Authentification du jeton...");

      const pts = telemetryRef.current;
      const duration = pts.length > 1 ? pts[pts.length - 1].t - pts[0].t : 0;
      
      // Calculate velocity changes & standard deviation of micro-jitters
      let velocityChanges = 0;
      for (let i = 1; i < pts.length; i++) {
        const dt = pts[i].t - pts[i - 1].t;
        const dx = Math.abs(pts[i].x - pts[i - 1].x);
        if (dt > 0 && dx > 0) velocityChanges++;
      }

      // Check human criteria:
      // 1. Duration must be human (> 220ms and < 8000ms)
      // 2. Velocity samples must show natural acceleration (> 4 data points)
      const isHumanLike = duration > 220 && duration < 8000 && velocityChanges >= 4;

      setTimeout(() => {
        if (isHumanLike) {
          triggerVerifiedSuccess();
        } else {
          // Suspicious pattern (instant script jump) -> switch to puzzle challenge
          setSliderPosition(0);
          setIsAnalyzing(false);
          setChallengeMode('puzzle');
          generateNewPuzzle();
          setErrorMsg("Mouvement automatisé détecté. Veuillez aligner le sceau ci-dessous.");
        }
      }, 450);
    } else {
      // Snap back if released early
      setSliderPosition(0);
      setAnalysisText("Glissez jusqu'au bout pour vérifier");
    }
  }, [isDragging, isVerified, sliderPosition, generateNewPuzzle]);

  // Complete and issue cryptographic token
  const triggerVerifiedSuccess = () => {
    setIsAnalyzing(false);
    setIsVerified(true);
    setSliderPosition(100);
    setErrorMsg(null);
    setAnalysisText("Identité Humaine Certifiée");

    const nonce = Math.random().toString(36).substring(2, 9);
    const ts = Date.now();
    const token = `FJ-GUARD-${ts}-${nonce}-SECURE`;
    setSecurityToken(token);
    onVerify(true, token);

    // Live countdown timer for token expiration
    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as any);
          setIsVerified(false);
          setSliderPosition(0);
          onVerify(false);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Validate Puzzle Piece Slider
  const handlePuzzleSlide = (val: number) => {
    setPuzzleAnswer(val);
    const diff = Math.abs(val - puzzleTarget.x);
    if (diff < 8) {
      triggerVerifiedSuccess();
      setChallengeMode('slider');
    }
  };

  // Global mouse & touch listeners during active drag
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onMouseUp = () => handleEnd();
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className={`select-none transition-all duration-300 ${className}`}>
      <div 
        className={`rounded-2xl border transition-all duration-300 relative overflow-hidden ${
          isVerified 
            ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border-emerald-500/40 text-emerald-800 shadow-sm' 
            : theme === 'dark'
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 shadow-lg'
              : 'bg-white border-slate-200 text-slate-800 shadow-sm hover:border-slate-300'
        } ${size === 'compact' ? 'p-3' : 'p-4'}`}
      >
        {/* Holographic Radar Scanner Beam (Active during drag/analysis) */}
        {(isDragging || isAnalyzing) && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-shimmer pointer-events-none" />
        )}

        {/* Header Info Bar */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
              isVerified 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
            }`}>
              {isVerified ? (
                <ShieldCheck className="w-4 h-4 animate-scale-up" />
              ) : (
                <Fingerprint className="w-4 h-4 animate-pulse" />
              )}
            </div>
            <div>
              <span className="text-xs font-extrabold tracking-tight block">
                {isVerified ? 'Sécurité France Justice Certifiée' : 'Protection Anti-Bot Temps Réel'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                {isVerified ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Jeton actif • {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
                  </span>
                ) : (
                  analysisText
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-mono text-[9px] font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
              FJ-GUARD v2.4
            </span>
            {securityToken && (
              <span className="font-mono text-[8px] text-slate-400 mt-0.5 truncate max-w-[100px]">
                {securityToken}
              </span>
            )}
          </div>
        </div>

        {/* MODE 1: Interactive Biometric Drag Slider */}
        {challengeMode === 'slider' && (
          <div 
            ref={trackRef}
            className={`relative h-12 rounded-xl border flex items-center p-1 transition-all ${
              isVerified 
                ? 'bg-emerald-50 border-emerald-300' 
                : 'bg-slate-100/90 border-slate-200 shadow-inner'
            }`}
          >
            {/* Filled Track Progress with Glowing Gradient */}
            <div 
              className={`absolute left-0 top-0 bottom-0 rounded-xl transition-all duration-75 ${
                isVerified 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 w-full' 
                  : 'bg-gradient-to-r from-cyan-500 to-teal-500 opacity-25'
              }`}
              style={{ width: `${Math.max(sliderPosition, 8)}%` }}
            />

            {/* Slider Track Guide Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-bold text-slate-400 tracking-wider uppercase text-[11px]">
              {isVerified ? (
                <span className="text-emerald-700 flex items-center gap-1.5 font-extrabold normal-case text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Vérification Humaine Validée
                </span>
              ) : isAnalyzing ? (
                <span className="text-cyan-700 animate-pulse">Validation des paramètres...</span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1 opacity-70">
                  Glissez vers la droite →
                </span>
              )}
            </div>

            {/* Interactive Draggable Handle */}
            {!isVerified && (
              <div
                onMouseDown={(e) => handleStart(e.clientX)}
                onTouchStart={(e) => e.touches[0] && handleStart(e.touches[0].clientX)}
                style={{ 
                  transform: `translateX(${(sliderPosition / 100) * ((trackRef.current?.clientWidth || 280) - 48)}px)` 
                }}
                className={`relative z-10 w-11 h-10 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow shadow-md select-none ${
                  isDragging
                    ? 'bg-cyan-600 text-white shadow-cyan-500/40 ring-4 ring-cyan-500/20'
                    : 'bg-white text-cyan-700 border border-slate-200 hover:border-cyan-500 hover:shadow-cyan-500/10'
                }`}
              >
                {isAnalyzing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Scale className={`w-5 h-5 transition-transform ${isDragging ? 'scale-110' : ''}`} />
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: Holographic Puzzle Alignment Challenge */}
        {challengeMode === 'puzzle' && (
          <div className="mt-2 space-y-2 animate-fade-in">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner">
              <canvas 
                ref={puzzleCanvasRef} 
                width={280} 
                height={70} 
                className="w-full h-[70px] block"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-600 shrink-0">
                Ajuster :
              </span>
              <input
                type="range"
                min="20"
                max="260"
                value={puzzleAnswer}
                onChange={(e) => handlePuzzleSlide(Number(e.target.value))}
                className="w-full accent-cyan-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={generateNewPuzzle}
                className="p-1.5 text-slate-500 hover:text-cyan-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Générer un autre défi"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Error Notice */}
        {errorMsg && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityCaptcha;
