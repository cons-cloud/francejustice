import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  recipientName?: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();
    const { to, subject, htmlContent } = payload;

    if (!to || !subject || !htmlContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, htmlContent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Variables SMTP Hostinger (à définir dans Supabase Edge Function Secrets) ──
    const smtpHost     = Deno.env.get('SMTP_HOST')     || 'smtp.hostinger.com';
    const smtpPort     = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser     = Deno.env.get('SMTP_USER')     || '';
    const smtpPassword = Deno.env.get('SMTP_PASSWORD') || '';
    const senderEmail  = Deno.env.get('SENDER_EMAIL')  || smtpUser;
    const senderName   = Deno.env.get('SENDER_NAME')   || 'France Justice';

    if (!smtpUser || !smtpPassword) {
      console.warn('[Email] SMTP credentials missing — configure SMTP_USER and SMTP_PASSWORD in Supabase secrets.');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'SMTP not configured. Add SMTP_USER and SMTP_PASSWORD in Supabase Edge Function secrets.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Envoi via SMTP Hostinger ──────────────────────────────────────────────
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: smtpPort === 465,   // SSL direct sur port 465, STARTTLS sur 587
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    await client.send({
      from: `${senderName} <${senderEmail}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });

    await client.close();

    console.log(`[Email] ✅ Envoyé via SMTP Hostinger → ${to} | Sujet: ${subject}`);

    return new Response(
      JSON.stringify({ success: true, provider: 'hostinger-smtp', to }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[Email] Erreur SMTP Hostinger:', err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Erreur serveur SMTP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
