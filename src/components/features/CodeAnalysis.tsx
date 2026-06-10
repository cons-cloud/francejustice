import React, { useState, useRef } from 'react';
import { 
  FileText, Shield, AlertTriangle, CheckCircle, AlertCircle, 
  Upload, Sparkles, Brain, Save, ArrowRight, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface RiskIndicator {
  title: string;
  level: 'low' | 'medium' | 'high';
  score: number;
  description: string;
}

interface AnalyzedClause {
  id: string;
  name: string;
  content: string;
  status: 'approved' | 'warning' | 'danger';
  explanation: string;
  recommendation: string;
}

interface AnalysisResult {
  score: number;
  level: 'Faible' | 'Modéré' | 'Élevé';
  summary: string;
  clauses: AnalyzedClause[];
  indicators: RiskIndicator[];
}

const CodeAnalysis: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const runAnalysis = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setIsSaved(false);
    setResult(null);
    
    const steps = [
      "Prétraitement du texte et nettoyage...",
      "Extraction des clauses clés et identification de la structure...",
      "Analyse sémantique croisée avec le droit français...",
      "Évaluation des indicateurs de risques et conformité...",
      "Calcul du score global et rédaction des recommandations..."
    ];

    for (const step of steps) {
      setAnalysisStep(step);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Generate mock analysis depending on the content length/keywords
    const lowerText = inputText.toLowerCase();
    let score = 38; // Default risk score (high risk)
    let level: 'Faible' | 'Modéré' | 'Élevé' = 'Élevé';
    let clauses: AnalyzedClause[] = [];
    let indicators: RiskIndicator[] = [];

    if (lowerText.includes('non-concurrence') || lowerText.includes('concurrence')) {
      clauses.push({
        id: 'c1',
        name: 'Clause de non-concurrence',
        content: "L'employé s'interdit d'exercer une activité concurrente sous quelque forme que ce soit en France pour une durée de 5 ans sans compensation financière.",
        status: 'danger',
        explanation: "La clause est excessive dans sa durée (5 ans) et sa portée géographique (toute la France). Plus grave encore, elle ne prévoit aucune contrepartie financière pour le salarié pendant toute sa période d'application.",
        recommendation: "Exigez l'ajout d'une indemnité compensatrice mensuelle (ex: 30% à 50% du salaire mensuel moyen) et limitez la durée à 1 ou 2 ans maximum ainsi qu'à une zone géographique restreinte (ex: département ou région limitrophe)."
      });
    }

    if (lowerText.includes('période d\'essai') || lowerText.includes('essai')) {
      clauses.push({
        id: 'c2',
        name: 'Période d\'essai et renouvellement',
        content: "La période d'essai est fixée à 4 mois, renouvelable une fois pour une durée identique à l'initiative exclusive de l'employeur.",
        status: 'warning',
        explanation: "Un renouvellement de la période d'essai ne peut pas se faire à la seule initiative de l'employeur. Il nécessite l'accord exprès et écrit du salarié en cours de période d'essai.",
        recommendation: "Faites modifier cette formulation pour préciser que le renouvellement nécessite un accord écrit et signé des deux parties et doit être prévu par la convention collective applicable."
      });
    }

    if (lowerText.includes('propriété intellectuelle') || lowerText.includes('brevet') || lowerText.includes('droit')) {
      clauses.push({
        id: 'c3',
        name: 'Cession des droits de propriété intellectuelle',
        content: "Le salarié cède irrévocablement tous ses droits d'auteur, inventions et créations réalisés, y compris en dehors du temps de travail et n'ayant aucun lien avec l'activité.",
        status: 'danger',
        explanation: "La cession automatique des droits sur des inventions ou créations n'ayant aucun lien avec l'activité de l'entreprise et réalisées en dehors du temps de travail est abusive et viole le Code de la propriété intellectuelle.",
        recommendation: "Demandez à limiter la cession exclusivement aux inventions et créations réalisées dans le cadre de vos fonctions au sein de l'entreprise et pendant vos heures de travail effectives."
      });
    }

    if (lowerText.includes('préavis') || lowerText.includes('démission') || lowerText.includes('rupture')) {
      clauses.push({
        id: 'c4',
        name: 'Délai de préavis de rupture',
        content: "En cas de rupture du contrat de travail pour quelque motif que ce soit, le préavis est de 3 mois pour les deux parties.",
        status: 'approved',
        explanation: "Cette clause est conforme à la législation standard pour les cadres. La réciprocité de la durée (3 mois pour l'employeur comme pour le salarié) respecte les usages légaux.",
        recommendation: "Aucune action requise. Cette clause est équilibrée et conforme."
      });
    }

    // Default clauses if none match
    if (clauses.length === 0) {
      score = 15;
      level = 'Faible';
      clauses = [
        {
          id: 'c_def1',
          name: 'Structure et clarté générale',
          content: "L'ensemble des clauses analysées présente des formulations standards sans ambiguïtés manifestes.",
          status: 'approved',
          explanation: "La terminologie employée correspond aux modèles légaux validés par la jurisprudence usuelle.",
          recommendation: "Assurez-vous simplement que les annexes ou conditions particulières éventuelles soient rédigées dans le même esprit."
        },
        {
          id: 'c_def2',
          name: 'Juridiction compétente',
          content: "Tout litige relatif à l'interprétation ou l'exécution du présent contrat sera soumis aux tribunaux compétents du siège social.",
          status: 'warning',
          explanation: "Bien que courante, cette clause peut compliquer la tâche du cocontractant s'il réside loin du siège social de l'entreprise.",
          recommendation: "Si vous êtes un consommateur ou salarié, sachez que la loi vous permet souvent de choisir le tribunal de votre domicile malgré cette clause."
        }
      ];
    } else {
      // Adjust score and level based on clauses status
      const dangerCount = clauses.filter(c => c.status === 'danger').length;
      const warningCount = clauses.filter(c => c.status === 'warning').length;
      
      if (dangerCount > 0) {
        score = Math.min(65 + dangerCount * 10, 95);
        level = 'Élevé';
      } else if (warningCount > 0) {
        score = 45 + warningCount * 5;
        level = 'Modéré';
      } else {
        score = 12;
        level = 'Faible';
      }
    }

    indicators = [
      {
        title: "Conformité Légale",
        level: score > 70 ? 'high' : score > 35 ? 'medium' : 'low',
        score: Math.max(100 - score, 10),
        description: "Mesure l'adéquation globale des clauses avec le droit positif français."
      },
      {
        title: "Équilibre Contractuel",
        level: score > 60 ? 'high' : score > 30 ? 'medium' : 'low',
        score: Math.max(100 - score - 5, 8),
        description: "Évalue si les droits et obligations sont équitablement répartis entre les parties."
      },
      {
        title: "Risque de Litige",
        level: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
        score: score,
        description: "Probabilité que certaines clauses soient contestées ou conduisent à des poursuites judiciaires."
      }
    ];

    setResult({
      score,
      level,
      summary: score > 70 
        ? "Attention : Ce document contient des clauses potentiellement abusives ou à haut risque juridique pour vous. Il est fortement conseillé de les négocier ou de faire réviser le contrat par un avocat avant toute signature."
        : score > 35 
        ? "Modéré : Le document est globalement équilibré mais comporte quelques points d'attention qui méritent d'être clarifiés ou modifiés pour sécuriser au mieux vos intérêts."
        : "Favorable : Le document présente un excellent niveau de sécurité juridique et est conforme aux usages réglementaires.",
      clauses,
      indicators
    });
    
    setIsAnalyzing(false);
  };

  const handleSaveResult = async () => {
    if (!result) return;
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Vous devez être connecté pour sauvegarder l'analyse dans votre coffre-fort.");
        setIsSaving(false);
        return;
      }

      const reportName = `Analyse_IA_${fileName ? fileName.split('.')[0] : 'Document'}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '_')}`;
      const mockFileUrl = `https://zchhijltemvrsthdaxex.supabase.co/storage/v1/object/public/documents/${user.id}/${Date.now()}_${reportName}.pdf`;

      const { error } = await supabase
        .from('documents_just')
        .insert([{
          name: reportName,
          type: 'Rapport d\'analyse',
          file_url: mockFileUrl,
          owner_id: user.id,
          created_at: new Date().toISOString(),
          metadata: { 
            source: 'Analyseur IA', 
            score: result.score,
            level: result.level,
            clauses_analyzed: result.clauses.length
          }
        }]);

      if (error) throw error;
      setIsSaved(true);
    } catch (err) {
      console.error("Error saving analysis:", err);
      alert("Une erreur est survenue lors de l'enregistrement de l'analyse.");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: 'approved' | 'warning' | 'danger') => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle className="h-3 w-3 mr-1" /> Conforme
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
            <AlertTriangle className="h-3 w-3 mr-1" /> Point de vigilance
          </span>
        );
      case 'danger':
        return (
          <span className="flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
            <AlertCircle className="h-3 w-3 mr-1" /> Risque élevé / Abusif
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <Card className="border border-slate-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <Brain className="h-5 w-5 text-indigo-600 mr-2" />
              Analyseur intelligent de contrats & documents
            </CardTitle>
            <CardDescription>
              Déposez votre contrat de travail, bail commercial, CGV ou tout document juridique pour en analyser les risques et clauses abusives selon le droit français.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and drop zone */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40 transition duration-200 rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-3"
              onClick={triggerFileSelect}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".txt,.pdf,.doc,.docx"
              />
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">
                  {fileName ? `Fichier sélectionné : ${fileName}` : "Glissez-déposez votre document ici"}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Format acceptés : PDF, Word, Texte (.txt, .docx, .pdf)
                </p>
              </div>
              <Button type="button" variant="outline" size="sm">
                Parcourir les fichiers
              </Button>
            </div>

            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="px-3 text-sm text-slate-400 font-medium bg-white">OU</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Text input area */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">
                Coller le texte du document juridique
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Collez ici le texte intégral ou les clauses spécifiques que vous souhaitez faire analyser par notre IA..."
                className="w-full h-60 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono text-sm leading-relaxed"
                disabled={isAnalyzing}
              />
            </div>

            <Button
              onClick={runAnalysis}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 transition duration-200 shadow-sm"
              disabled={isAnalyzing || !inputText.trim()}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>{analysisStep}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Lancer l'analyse juridique IA</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Card */}
          <Card className={`border-l-4 shadow-md ${
            result.level === 'Élevé' ? 'border-rose-500' : 
            result.level === 'Modéré' ? 'border-amber-500' : 'border-emerald-500'
          }`}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center text-slate-800">
                    <Shield className={`h-6 w-6 mr-2 ${
                      result.level === 'Élevé' ? 'text-rose-500' : 
                      result.level === 'Modéré' ? 'text-amber-500' : 'text-emerald-500'
                    }`} />
                    Résultats de l'analyse juridique
                  </CardTitle>
                  <CardDescription className="text-slate-500 mt-1">
                    {fileName ? `Document : ${fileName}` : "Texte brut analysé"}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => {
                      setResult(null);
                      setInputText('');
                      setFileName('');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" /> Nouvelle analyse
                  </Button>
                  <Button
                    onClick={handleSaveResult}
                    disabled={isSaving || isSaved}
                    className={`${isSaved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800'} text-white`}
                    size="sm"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Enregistrement...
                      </>
                    ) : isSaved ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1.5" /> Enregistré !
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1.5" /> Sauvegarder dans mon coffre-fort
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="text-center md:border-r border-slate-200 pb-4 md:pb-0">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Indice de risque</p>
                  <div className="mt-2 flex items-baseline justify-center">
                    <span className={`text-5xl font-black ${
                      result.level === 'Élevé' ? 'text-rose-600' : 
                      result.level === 'Modéré' ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {result.score}%
                    </span>
                  </div>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    result.level === 'Élevé' ? 'bg-rose-100 text-rose-800' : 
                    result.level === 'Modéré' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Risque {result.level}
                  </span>
                </div>
                <div className="col-span-2 space-y-2">
                  <h4 className="font-bold text-slate-800">Synthèse générale</h4>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {result.summary}
                  </p>
                </div>
              </div>

              {/* Specific Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.indicators.map((ind, i) => (
                  <div key={i} className="border border-slate-100 p-4 rounded-xl bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-slate-700 text-sm">{ind.title}</span>
                        <span className={`text-xs font-bold ${
                          ind.level === 'high' ? 'text-rose-600' : 
                          ind.level === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {ind.score}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            ind.level === 'high' ? 'bg-rose-500' : 
                            ind.level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${ind.score}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 italic mt-1 leading-snug">{ind.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* List of analyzed clauses */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-indigo-600" />
              Clauses spécifiques analysées ({result.clauses.length})
            </h3>
            
            <div className="space-y-4">
              {result.clauses.map((clause) => (
                <Card key={clause.id} className="border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{clause.name}</span>
                    {getStatusBadge(clause.status)}
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Texte de la clause</span>
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-700 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                        {clause.content}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-amber-50/20 border border-amber-100/50 rounded-lg p-4">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center mb-1">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Explication juridique
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {clause.explanation}
                        </p>
                      </div>
                      <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-lg p-4">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center mb-1">
                          <Sparkles className="h-3.5 w-3.5 mr-1" /> Recommandation de rédaction
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {clause.recommendation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeAnalysis;
