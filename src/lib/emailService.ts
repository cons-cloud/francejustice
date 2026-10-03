import { supabase } from './supabase';

export interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  recipientName?: string;
  category?: 'diagnostic' | 'quote' | 'appointment' | 'payment' | 'system';
}

// Authorized notification types in Postgres check constraint: ('quote', 'appointment', 'payment', 'message', 'live', 'system')
const VALID_NOTIFICATION_TYPES = ['quote', 'appointment', 'payment', 'message', 'live', 'system'] as const;
type ValidNotificationType = typeof VALID_NOTIFICATION_TYPES[number];

/**
 * Dispatches a transactional email notification via Supabase Edge Function or database notification.
 */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<boolean> {
  try {
    // 1. Attempt to invoke Supabase 'send-email' Edge Function ONLY if enabled in env
    // (Prevents browser CORS preflight ERR_FAILED when the function is not yet deployed on Supabase)
    const isEmailServiceEnabled = import.meta.env.VITE_ENABLE_SEND_EMAIL === 'true';
    if (isEmailServiceEnabled) {
      try {
        const { error: edgeError } = await supabase.functions.invoke('send-email', {
          body: payload
        });
        if (edgeError) {
          console.warn("Supabase send-email edge function notice:", edgeError.message);
        }
      } catch (invokeErr) {
        console.warn("Edge function send-email not reachable:", invokeErr);
      }
    }

    // 2. Also log in notifications table for in-app notification bell
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const notifType: ValidNotificationType = (payload.category && (VALID_NOTIFICATION_TYPES as readonly string[]).includes(payload.category))
          ? (payload.category as ValidNotificationType)
          : 'system';

        const { error: notifErr } = await supabase.from('notifications').insert([{
          user_id: userData.user.id,
          title: payload.subject,
          message: payload.subject,
          type: notifType,
          is_read: false,
          created_at: new Date().toISOString()
        }]);

        if (notifErr) {
          // Silent fallback if table has strict RLS or different column schema
          console.debug("In-app notification note:", notifErr.message);
        }
      }
    } catch (_dbErr) {
      // Table may be notifications or notifications_just
    }

    return true;
  } catch (err) {
    console.warn("Transactional email dispatch notice:", err);
    return false;
  }
}

/**
 * Notifies client when an AI legal diagnostic is ready.
 */
export async function notifyAnalysisReady(userEmail: string, caseTitle: string, summaryPreview: string): Promise<boolean> {
  return sendTransactionalEmail({
    to: userEmail,
    subject: `Votre analyse juridique est prête : ${caseTitle}`,
    category: 'diagnostic',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0891b2;">France Justice • Rapport d'Analyse Juridique</h2>
        <p>Bonjour,</p>
        <p>L'Agent IA de France Justice a terminé l'analyse contradictoire de votre dossier : <strong>${caseTitle}</strong>.</p>
        <div style="background: #f0fdfa; border-left: 4px solid #0891b2; padding: 12px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px;">${summaryPreview.substring(0, 300)}...</p>
        </div>
        <p>Vous pouvez consulter l'analyse complète, les calculs de barèmes et télécharger les actes depuis votre tableau de bord.</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 30px;">Plateforme Officielle France Justice • Sécurisé et Confidentiel</p>
      </div>
    `
  });
}

/**
 * Notifies lawyer when a client submits a case.
 */
export async function notifyLawyerNewCase(lawyerEmail: string, caseTitle: string, clientName: string): Promise<boolean> {
  return sendTransactionalEmail({
    to: lawyerEmail,
    subject: `Nouveau dossier juridique soumis : ${caseTitle}`,
    category: 'quote',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0891b2;">France Justice • Espace Avocat</h2>
        <p>Maître,</p>
        <p>Un nouveau justiciable (<strong>${clientName}</strong>) vient de soumettre un dossier : <strong>${caseTitle}</strong>.</p>
        <p>Le dossier avec pièces et pré-audit IA est disponible sur votre tableau de bord avocat.</p>
      </div>
    `
  });
}

/**
 * Opens email client with pre-formatted legal document or analysis, with automatic fallback
 */
export function sendDocumentByEmail(title: string, content: string, defaultTo?: string): boolean {
  const subject = encodeURIComponent(`France Justice — Document Officiel : ${title}`);
  const plainText = content.replace(/[*#_`>]/g, '').substring(0, 1800);
  const body = encodeURIComponent(
    `Bonjour,\n\nVeuillez trouver ci-dessous le document juridique certifié généré sur France Justice (${title}) :\n\n----------------------------------------\n${plainText}\n----------------------------------------\n\nGénéré via France Justice • Plateforme Juridique Certifiée\nhttps://francejustice.com`
  );
  const mailtoUrl = `mailto:${defaultTo || ''}?subject=${subject}&body=${body}`;
  if (typeof window !== 'undefined') {
    window.location.href = mailtoUrl;
    return true;
  }
  return false;
}
