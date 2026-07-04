-- ============================================================
-- Migration: Table notifications (Just-Law)
-- À exécuter dans Supabase Studio > SQL Editor
-- ============================================================

-- 1. Création de la table
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('quote', 'appointment', 'payment', 'message', 'live', 'system')),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  link        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index pour les requêtes filtrées par user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications (user_id, created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politique : chaque utilisateur ne voit que ses propres notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : chaque utilisateur peut mettre à jour is_read de ses notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : le service backend (role service_role) peut insérer pour n'importe quel user
-- Les fonctions server-side et triggers peuvent insérer librement
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- 4. Activer Supabase Realtime sur cette table
-- (À faire aussi dans Supabase Studio > Database > Replication si non activé)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- Fonctions utilitaires pour créer des notifications
-- (appelables depuis des triggers ou depuis le backend Django)
-- ============================================================

-- Notifier un utilisateur lors d'un nouveau devis
CREATE OR REPLACE FUNCTION public.notify_new_quote(
  p_user_id   UUID,
  p_quote_ref TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    p_user_id,
    'quote',
    'Nouveau devis reçu',
    'Un avocat a répondu à votre demande de devis : ' || p_quote_ref
  );
END;
$$;

-- Notifier lors de l'acceptation d'un RDV
CREATE OR REPLACE FUNCTION public.notify_appointment_accepted(
  p_user_id    UUID,
  p_lawyer_name TEXT,
  p_date        TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    p_user_id,
    'appointment',
    'Rendez-vous confirmé',
    'Votre rendez-vous avec ' || p_lawyer_name || ' le ' || p_date || ' a été confirmé.'
  );
END;
$$;

-- Notifier lors d'un paiement
CREATE OR REPLACE FUNCTION public.notify_payment(
  p_user_id UUID,
  p_amount  TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    p_user_id,
    'payment',
    'Paiement confirmé',
    'Votre paiement de ' || p_amount || ' MAD a bien été reçu.'
  );
END;
$$;

-- Notifier lors d'un nouveau message
CREATE OR REPLACE FUNCTION public.notify_new_message(
  p_user_id    UUID,
  p_sender_name TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    p_user_id,
    'message',
    'Nouveau message',
    p_sender_name || ' vous a envoyé un message.'
  );
END;
$$;

-- Notifier lors d'une session live imminente
CREATE OR REPLACE FUNCTION public.notify_live_session(
  p_user_id UUID,
  p_title   TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    p_user_id,
    'live',
    'Session live démarrée',
    'La session "' || p_title || '" vient de commencer. Rejoignez-la maintenant !'
  );
END;
$$;

-- ============================================================
-- Données de test (optionnel — à supprimer en production)
-- ============================================================
-- INSERT INTO public.notifications (user_id, type, title, message)
-- VALUES (
--   '<votre-user-id-ici>',
--   'quote',
--   'Test : nouveau devis',
--   'Ceci est une notification de test.'
-- );
