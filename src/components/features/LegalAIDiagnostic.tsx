import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Scale, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Download, 
  RefreshCw, 
  ChevronRight, 
  ShieldCheck, 
  BookOpen, 
  Calendar, 
  Users, 
  ArrowRight,
  TrendingUp,
  FileSearch,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../i18n';
import { 
  analyzeLegalCaseWithAI, 
  saveLegalDiagnosticToSupabase, 
  type LegalDiagnosticResult 
} from '../../lib/legalDiagnosticEngine';

const SpeechRecognition = typeof window !== 'undefined' 
  ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) 
  : null;

interface LegalAIDiagnosticProps {
  roleMode?: 'citizen' | 'lawyer' | 'academic';
}

export const LegalAIDiagnostic: React.FC<LegalAIDiagnosticProps> = ({ roleMode = 'citizen' }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  const [caseTitle, setCaseTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [extractedText, setExtractedText] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnostic, setDiagnostic] = useState<LegalDiagnosticResult | null>(null);

  // Voice AI States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Saved diagnostics from Supabase Realtime
  const [savedDiagnostics, setSavedDiagnostics] = useState<any[]>([]);

  // 1. Fetch saved diagnostics & subscribe to Supabase Realtime
  const fetchDiagnostics = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('legal_diagnostics_just')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setSavedDiagnostics(data);
      }
    } catch (e) {
      console.warn("Error fetching diagnostics from Supabase:", e);
    }
  };

  useEffect(() => {
    fetchDiagnostics();

    const channel = supabase
      .channel('realtime-legal-diagnostics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'legal_diagnostics_just' }, () => {
        fetchDiagnostics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 2. File Upload & Text Extraction
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);

      selectedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            setExtractedText(prev => `${prev}\n--- ${file.name} ---\n${content.substring(0, 3000)}`);
          }
        };
        if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          reader.readAsText(file);
        } else {
          setExtractedText(prev => `${prev}\n--- ${file.name} (Pièce/Jugement importé) ---`);
        }
      });
      success("Pièces juridiques importées avec succès.");
    }
  };

  // 3. Voice Input (Speech Recognition)
  const toggleListening = () => {
    if (!SpeechRecognition) {
      toastError("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'fr-FR';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setDescription(prev => `${prev} ${text}`);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
      success("Écoute vocale activée. Exprimez les faits de votre litige...");
    } catch (e) {
      setIsListening(false);
    }
  };

  // 4. Voice Read-Aloud (Text-to-Speech)
  const toggleSpeaking = (textToRead: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = textToRead.replace(/[#*`_]/g, '');
    const utt = new SpeechSynthesisUtterance(cleanText);
    utt.lang = 'fr-FR';
    utt.rate = 1.0;

    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utt);
    synthRef.current = utt;
    setIsSpeaking(true);
  };

  // 5. Run Full Legal Diagnosis
  const runDiagnostic = async () => {
    if (!description.trim() && !extractedText.trim()) {
      toastError("Veuillez saisir une description ou importer au moins une pièce juridique.");
      return;
    }

    setIsAnalyzing(true);
    setDiagnostic(null);

    try {
      const result = await analyzeLegalCaseWithAI(
        caseTitle || "Litige sans titre",
        description,
        extractedText
      );

      setDiagnostic(result);

      if (user) {
        await saveLegalDiagnosticToSupabase(
          user.id,
          null,
          result,
          files.map(f => f.name)
        );
      }

      success("Diagnostic juridique IA généré et synchronisé en temps réel !");
    } catch (err) {
      toastError("Erreur lors du calcul du diagnostic juridique.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // PDF Export
  const downloadDiagnosticPDF = (diag: LegalDiagnosticResult) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Diagnostic Juridique - ${diag.caseTitle}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; font-weight: bold; background: #dcfce7; color: #166534; margin-top: 10px; }
            .section { margin-bottom: 25px; padding: 15px; border-radius: 8px; background: #f8fafc; border-left: 4px solid #3b82f6; }
            .section-title { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 6px; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Rapport de Diagnostic Juridique & Opportunité d'Appel</div>
            <div>Dossier : ${diag.caseTitle}</div>
            <div class="badge">Chances de succès estimées : ${diag.winProbability}% - ${diag.isDefendable ? 'Défendable' : 'Risqué'}</div>
          </div>

          <div class="section">
            <div class="section-title">1. Synthèse & Avis Juridique</div>
            <p>${diag.summary}</p>
          </div>

          <div class="section">
            <div class="section-title">2. Évaluation du Verdict & Diagnostic d'Appel</div>
            <p><strong>Bilan du jugement :</strong> ${diag.verdictAnalysis.verdictEvaluated}</p>
            <p><strong>Opportunité d'Appel :</strong> ${diag.verdictAnalysis.shouldAppeal ? 'OUI - Appel fortement recommandé' : 'NON - Procédure d\'appel peu opportune'}</p>
            <p><strong>Motifs d'Appel :</strong></p>
            <ul>${diag.verdictAnalysis.appealReasons.map(r => `<li>${r}</li>`).join('')}</ul>
            <p><strong>Délais de recours :</strong> ${diag.verdictAnalysis.deadlinesAndPrescription}</p>
          </div>

          <div class="section">
            <div class="section-title">3. Fondements Juridiques & Jurisprudences</div>
            <p><strong>Textes applicables :</strong></p>
            <ul>${diag.extractedResults.legalBasis.map(b => `<li>${b}</li>`).join('')}</ul>
            <p><strong>Jurisprudences clés :</strong></p>
            <ul>${diag.extractedResults.relevantJurisprudence.map(j => `<li>${j}</li>`).join('')}</ul>
          </div>

          <div class="section">
            <div class="section-title">4. Marche à suivre & Plan d'Action</div>
            <ul>${diag.roadmap.map(step => `<li>${step}</li>`).join('')}</ul>
          </div>

          <div class="section">
            <div class="section-title">5. Procédures & Contacts Utiles</div>
            <p><strong>Procédure préconisée :</strong> ${diag.proceduresAndContacts.recommendedProcedure}</p>
            <p><strong>Juridiction compétente :</strong> ${diag.proceduresAndContacts.targetCourt}</p>
            <p><strong>Professionnel à contacter :</strong> ${diag.proceduresAndContacts.professionalToContact}</p>
          </div>

          <div class="footer">
            Document édité automatiquement par la Plateforme Officielle FranceJustice - Chiffrement & Conformité RGPD.
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-blue-800/50 shadow-xl text-white">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> IA Générative & Vocale Temps Réel
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Diagnostic Juridique Approfondi &amp; Analyse d&apos;Appel
              </h2>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl">
                Importez vos dossiers, jugements ou pièces. L&apos;IA analyse les faits, évalue la justesse du verdict, calcule vos chances de succès et définit la marche à suivre.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleListening}
                variant={isListening ? 'danger' : 'outline'}
                className={`flex items-center gap-2 border-slate-700 text-white ${isListening ? 'bg-red-600 animate-pulse' : 'bg-slate-800/80 hover:bg-slate-700'}`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-400" />}
                {isListening ? 'Arrêter la dictée' : 'Dictée Vocale'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Form & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & File Import */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-slate-900/90 border-slate-800 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-blue-400" />
                Import de Dossier &amp; Description
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Déposez vos jugements, pièces, contrats ou résumez le litige vocalement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Intitulé du dossier / Litige
                </label>
                <Input
                  value={caseTitle}
                  onChange={e => setCaseTitle(e.target.value)}
                  placeholder="ex: Contestation licenciement ou Appel jugement bail commercial"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description des faits &amp; motifs contestés
                </label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Expliquez le litige ou la décision reçue... Vous pouvez utiliser la dictée vocale."
                  rows={4}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                />
              </div>

              {/* Drag & Drop File Upload */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Pièces juridiques &amp; Jugements (PDF, TXT, Images)
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/60 rounded-xl p-4 cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 text-blue-400 mb-2" />
                  <span className="text-xs font-medium text-slate-300 text-center">
                    Cliquez ou glissez-déposez vos fichiers ici
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">PDF, TXT, DOCX, JPG, PNG</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* File list preview */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400">Pièces jointes ({files.length}) :</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg text-xs border border-slate-800 text-slate-300">
                        <span className="truncate flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(0)} Ko</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={runDiagnostic}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 shadow-lg shadow-blue-600/20"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Analyse &amp; calcul du verdict par l&apos;IA...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" /> Générer le Diagnostic Juridique Complet
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Diagnostic Report */}
        <div className="lg:col-span-7 space-y-6">
          {!diagnostic && !isAnalyzing && (
            <Card className="bg-slate-900/60 border-slate-800 text-center p-8 flex flex-col items-center justify-center min-h-[400px]">
              <Scale className="w-16 h-16 text-blue-500/30 mb-4" />
              <h3 className="text-lg font-bold text-slate-200 mb-2">Aucun diagnostic en cours</h3>
              <p className="text-slate-400 text-sm max-w-md">
                Décrivez votre litige ou importez les pièces du dossier à gauche pour lancer l&apos;analyse IA complète avec calcul des chances de succès et opportunité d&apos;appel.
              </p>
            </Card>
          )}

          {isAnalyzing && (
            <Card className="bg-slate-900/90 border-blue-500/30 text-center p-8 flex flex-col items-center justify-center min-h-[400px]">
              <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mb-4" />
              <h3 className="text-xl font-extrabold text-white mb-2">Analyse Juridique Approfondie par l&apos;IA...</h3>
              <p className="text-slate-300 text-sm max-w-md">
                Examen des pièces, qualification des faits, confrontation avec les Codes de loi et jurisprudences en vigueur...
              </p>
            </Card>
          )}

          {diagnostic && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Score & Verdict Banner */}
                <Card className={`border shadow-xl ${diagnostic.winProbability >= 60 ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-500/40' : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border-amber-500/40'}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Évaluation des chances de succès</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${diagnostic.isDefendable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {diagnostic.isDefendable ? 'Dossier Solide / Défendable' : 'Risqué / Complexité Haute'}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-white">{diagnostic.caseTitle}</h3>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-3xl font-black ${diagnostic.winProbability >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {diagnostic.winProbability}%
                          </div>
                          <div className="text-[11px] text-slate-400">Chances d&apos;issue favorable</div>
                        </div>

                        <Button
                          onClick={() => toggleSpeaking(diagnostic.summary)}
                          variant="outline"
                          size="sm"
                          className="bg-slate-800 border-slate-700 text-slate-200"
                        >
                          {isSpeaking ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
                        </Button>

                        <Button
                          onClick={() => downloadDiagnosticPDF(diagnostic)}
                          variant="outline"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                        >
                          <Download className="w-4 h-4 mr-1.5" /> PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 1. Synthèse et Avis */}
                <Card className="bg-slate-900/90 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400" /> 1. Avis &amp; Diagnostic Juridique Global
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-300 leading-relaxed space-y-2 whitespace-pre-line">
                    {diagnostic.summary}
                  </CardContent>
                </Card>

                {/* 2. Analyse du Verdict & Diagnostic d'Appel */}
                <Card className="bg-slate-900/90 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-400" /> 2. Évaluation du Verdict &amp; Opportunité d&apos;Appel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Bilan du jugement / situation :</span>
                      <p className="text-slate-200">{diagnostic.verdictAnalysis.verdictEvaluated}</p>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                      <span className="font-semibold text-slate-200">Recommandation d&apos;Appel ou Recours :</span>
                      <span className={`px-3 py-1 rounded-full font-extrabold text-xs ${diagnostic.verdictAnalysis.shouldAppeal ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                        {diagnostic.verdictAnalysis.shouldAppeal ? 'OUI - Appel vivement conseillé' : 'NON - Voie d\'appel peu opportune'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Motifs juridiques d&apos;Appel retenus :</span>
                      <ul className="space-y-1.5">
                        {diagnostic.verdictAnalysis.appealReasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-lg flex items-start gap-2.5 text-amber-200 text-xs">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Délais de prescription et de recours :</span>
                        <p className="mt-0.5 text-amber-300/90">{diagnostic.verdictAnalysis.deadlinesAndPrescription}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Textes & Jurisprudence */}
                <Card className="bg-slate-900/90 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-400" /> 3. Textes de Loi &amp; Jurisprudences Clés
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                      <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1.5">Articles &amp; Textes Applicables :</span>
                      <ul className="space-y-1 text-slate-400">
                        {diagnostic.extractedResults.legalBasis.map((b, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                      <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1.5">Jurisprudences de référence :</span>
                      <ul className="space-y-1 text-slate-400">
                        {diagnostic.extractedResults.relevantJurisprudence.map((j, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0" /> {j}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Marche à Suivre & Procédures */}
                <Card className="bg-slate-900/90 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-md font-bold text-slate-100 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-amber-400" /> 4. Marche à suivre &amp; Procédures conseillées
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Feuille de route chronologique :</span>
                      <div className="space-y-2">
                        {diagnostic.roadmap.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-slate-200 mt-0.5">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                        <span className="text-slate-400 block font-semibold mb-1">Procédure conseillée :</span>
                        <span className="text-blue-300 font-bold">{diagnostic.proceduresAndContacts.recommendedProcedure}</span>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                        <span className="text-slate-400 block font-semibold mb-1">Juridiction compétente :</span>
                        <span className="text-purple-300 font-bold">{diagnostic.proceduresAndContacts.targetCourt}</span>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                        <span className="text-slate-400 block font-semibold mb-1">Professionnel à contacter :</span>
                        <span className="text-emerald-300 font-bold">{diagnostic.proceduresAndContacts.professionalToContact}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Historical Realtime Diagnostics */}
          {savedDiagnostics.length > 0 && (
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader>
                <CardTitle className="text-md font-bold text-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" /> Historique des Diagnostics Synchronisés (Temps Réel)
                  </span>
                  <span className="text-xs text-slate-400 font-normal">{savedDiagnostics.length} rapport(s)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedDiagnostics.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setDiagnostic(item.full_analysis)}
                    className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800/80 hover:border-blue-500/50 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-200">{item.case_title}</div>
                      <div className="text-xs text-slate-400">
                        Chances : {item.win_probability}% • {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                      Consulter <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalAIDiagnostic;
