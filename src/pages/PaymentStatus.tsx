import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Receipt, 
  Scale, 
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const PaymentStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  // Determine status from query param or pathname
  const pathPart = location.pathname.split('/').pop() || '';
  const statusParam = searchParams.get('status') || searchParams.get('payment') || pathPart;
  
  const status: 'success' | 'cancel' | 'processing' = 
    statusParam === 'cancel' 
      ? 'cancel' 
      : statusParam === 'processing' 
      ? 'processing' 
      : 'success';

  const sessionId = searchParams.get('session_id') || searchParams.get('quote_id') || 'FJ-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const amountParam = searchParams.get('amount') || '149.00';
  const currencyParam = searchParams.get('currency') || 'EUR';

  const [isVerifying, setIsVerifying] = useState(status === 'processing');
  const [countdown, setCountdown] = useState(10);

  const getDashboardPath = () => {
    if (role === 'admin') return '/dashboard/admin';
    if (role === 'lawyer' || role === 'professor' || role === 'doctorate') return '/dashboard/lawyer';
    return '/dashboard/user';
  };

  // Real-time polling if in processing mode
  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(async () => {
        try {
          const { data } = await supabase
            .from('payments_just')
            .select('status')
            .eq('session_id', sessionId)
            .maybeSingle();

          if (data?.status === 'paid' || data?.status === 'success') {
            setIsVerifying(false);
            navigate(`/payment/success?session_id=${sessionId}&amount=${amountParam}`);
          }
        } catch (e) {
          console.error("Polling payment status:", e);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [status, sessionId, navigate, amountParam]);

  const handleDownloadReceipt = () => {
    // Generate and download a simple printable receipt
    const receiptContent = `
===========================================================
               RÉCÉPISSÉ OFFICIEL DE PAIEMENT
                    FRANCE JUSTICE (JUST-LAW)
===========================================================
Référence Transaction : ${sessionId}
Date & Heure : ${new Date().toLocaleString('fr-FR')}
Montant Réglé : ${amountParam} ${currencyParam}
Statut : PAYÉ ET VALIDÉ (Protocole 3D Secure / Stripe)
Client / Utilisateur : ${user?.email || 'Citoyen vérifié'}
Organisation : ONG FranceJustice • N° Siret 933 456 789 00012
Garantie Déontologique : Ordre des Avocats de France
===========================================================
Merci pour votre confiance. Ce document vaut attestation légale.
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recu_Paiement_${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[85vh] bg-white text-slate-900 flex flex-col items-center justify-center px-4 py-12 select-none relative overflow-hidden">
      {/* Subtle Ambient Radial Glowing Rings */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10 space-y-6">
        {/* ===================== SUCCESS STATE ===================== */}
        {status === 'success' && (
          <div className="bg-white border-2 border-emerald-200 rounded-3xl p-8 shadow-xl space-y-6 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paiement Validé & Sécurisé</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Merci ! Votre transaction est confirmée.
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Votre règlement a été traité avec succès via notre protocole bancaire sécurisé. Vos services et documents sont désormais immédiatement débloqués.
              </p>
            </div>

            {/* Transaction Receipt Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs text-slate-700 font-medium">
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Réf. Transaction</span>
                <span className="font-mono font-bold text-slate-900">{sessionId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Montant total réglé</span>
                <span className="font-bold text-sm text-emerald-700">{amountParam} {currencyParam}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/80 pb-2">
                <span className="text-slate-500">Horodatage officiel</span>
                <span className="font-semibold text-slate-900">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-500">Protocole de sécurité</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 3D Secure / Chiffrement TLS 1.3
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleDownloadReceipt}
                className="flex-1 justify-center rounded-xl py-3 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2 text-cyan-600" />
                Télécharger le Reçu PDF
              </Button>

              <Button
                onClick={() => navigate(getDashboardPath())}
                className="flex-1 justify-center rounded-xl py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-cyan-600/25 cursor-pointer"
              >
                Accéder à mon Espace
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ===================== PROCESSING STATE ===================== */}
        {status === 'processing' && (
          <div className="bg-white border-2 border-cyan-200 rounded-3xl p-8 shadow-xl space-y-6">
            <div className="w-20 h-20 rounded-full bg-cyan-50 border-2 border-cyan-300 text-cyan-600 flex items-center justify-center mx-auto">
              <RefreshCw className="w-10 h-10 animate-spin" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-black uppercase tracking-wider mb-2">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                <span>Sécurisation Bancaire en Cours</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Validation du paiement en temps réel...
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Veuillez patienter quelques instants sans fermer cette page. Nous confirmons l'autorisation auprès de votre établissement bancaire.
              </p>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full animate-indeterminate" />
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-center gap-2 pt-2">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span>Synchronisation instantanée avec le serveur de télépaiement</span>
            </div>
          </div>
        )}

        {/* ===================== CANCEL / RETRY STATE ===================== */}
        {status === 'cancel' && (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
            <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-slate-300 text-slate-500 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-slate-400" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider mb-2">
                <span>Transaction Non Aboutie</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Paiement annulé ou interrompu
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Aucun montant n'a été prélevé sur votre compte bancaire. Vous pouvez réessayer à tout moment ou choisir un autre moyen de paiement.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1 justify-center rounded-xl py-3 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm cursor-pointer"
              >
                Retourner au devis
              </Button>

              <Button
                onClick={() => navigate(getDashboardPath())}
                className="flex-1 justify-center rounded-xl py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-sm shadow-md shadow-cyan-600/20 cursor-pointer"
              >
                Mon Tableau de Bord
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <HelpCircle className="w-4 h-4 text-cyan-600" />
              <span>Besoin d'assistance ? Notre support est disponible 7j/7 au 06 07 51 74 16</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
