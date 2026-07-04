-- ============================================================
-- Triggers PostgreSQL — Notifications automatiques Just-Law
-- À exécuter dans Supabase Studio > SQL Editor
-- APRÈS avoir exécuté supabase_notifications_migration.sql
-- ============================================================


-- ── Helper : évite de notifier l'utilisateur de ses propres actions ──────────
-- (ex: un avocat qui crée un devis ne reçoit pas de notification pour lui-même)


-- ============================================================
-- 1. DEVIS (quotes_just)
-- ============================================================

-- 1a. Quand un avocat crée un devis → notifier le citoyen
CREATE OR REPLACE FUNCTION public.trg_notify_quote_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_lawyer_name TEXT;
BEGIN
  -- Récupère le nom de l'avocat
  SELECT COALESCE(first_name || ' ' || last_name, 'Un avocat')
  INTO v_lawyer_name
  FROM public.profiles_just
  WHERE id = NEW.lawyer_id;

  -- Notifie le citoyen
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.client_id,
    'quote',
    'Nouveau devis reçu',
    'Maître ' || COALESCE(v_lawyer_name, 'Un avocat') ||
      ' a envoyé un devis pour votre demande.',
    '/dashboard/user'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quote_created ON public.quotes_just;
CREATE TRIGGER trg_quote_created
  AFTER INSERT ON public.quotes_just
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_quote_created();


-- 1b. Quand le statut du devis change → notifier les deux parties
CREATE OR REPLACE FUNCTION public.trg_notify_quote_status_changed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_name TEXT;
  v_lawyer_name TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;  -- pas de changement, ne rien faire
  END IF;

  SELECT COALESCE(first_name || ' ' || last_name, 'Le client')
  INTO v_client_name
  FROM public.profiles_just WHERE id = NEW.client_id;

  SELECT COALESCE(first_name || ' ' || last_name, 'L''avocat')
  INTO v_lawyer_name
  FROM public.profiles_just WHERE id = NEW.lawyer_id;

  -- Devis accepté par le citoyen
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.lawyer_id,
      'quote',
      'Devis accepté ✓',
      COALESCE(v_client_name, 'Le client') || ' a accepté votre devis. En attente de paiement.',
      '/dashboard/lawyer'
    );
  END IF;

  -- Devis refusé
  IF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.lawyer_id,
      'quote',
      'Devis refusé',
      COALESCE(v_client_name, 'Le client') || ' a refusé votre devis.',
      '/dashboard/lawyer'
    );
  END IF;

  -- Paiement confirmé (mis à jour par le webhook Stripe)
  IF NEW.status = 'paid' THEN
    -- Notifie l'avocat que son paiement a été reçu
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.lawyer_id,
      'payment',
      'Paiement reçu ✓',
      COALESCE(v_client_name, 'Votre client') || ' a payé le devis. Fonds disponibles.',
      '/dashboard/lawyer'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quote_status_changed ON public.quotes_just;
CREATE TRIGGER trg_quote_status_changed
  AFTER UPDATE OF status ON public.quotes_just
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_quote_status_changed();


-- ============================================================
-- 2. RENDEZ-VOUS (appointments_just)
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_notify_appointment_changed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_client_name TEXT;
  v_lawyer_name TEXT;
  v_date_str    TEXT;
BEGIN
  SELECT COALESCE(first_name || ' ' || last_name, 'Le client')
  INTO v_client_name
  FROM public.profiles_just WHERE id = NEW.client_id;

  SELECT COALESCE(first_name || ' ' || last_name, 'L''avocat')
  INTO v_lawyer_name
  FROM public.profiles_just WHERE id = NEW.lawyer_id;

  v_date_str := TO_CHAR(NEW.appointment_date::timestamptz AT TIME ZONE 'Africa/Casablanca',
                        'DD/MM/YYYY à HH24:MI');

  -- Nouveau RDV créé → notifie l'avocat
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.lawyer_id,
      'appointment',
      'Nouvelle demande de RDV',
      COALESCE(v_client_name, 'Un client') || ' souhaite un rendez-vous le ' || v_date_str || '.',
      '/dashboard/lawyer'
    );
    RETURN NEW;
  END IF;

  -- Changement de statut
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- RDV confirmé → notifie le citoyen
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.client_id,
        'appointment',
        'Rendez-vous confirmé ✓',
        'Maître ' || COALESCE(v_lawyer_name, 'votre avocat') ||
          ' a confirmé votre rendez-vous le ' || v_date_str || '.',
        '/dashboard/user'
      );
    END IF;

    -- RDV annulé → notifie les deux parties
    IF NEW.status = 'cancelled' THEN
      -- Notifie le citoyen
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.client_id,
        'appointment',
        'Rendez-vous annulé',
        'Votre rendez-vous du ' || v_date_str || ' avec Maître ' ||
          COALESCE(v_lawyer_name, 'votre avocat') || ' a été annulé.',
        '/dashboard/user'
      );
      -- Notifie l'avocat (si c'est le client qui a annulé)
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.lawyer_id,
        'appointment',
        'Rendez-vous annulé',
        COALESCE(v_client_name, 'Un client') || ' a annulé le rendez-vous du ' || v_date_str || '.',
        '/dashboard/lawyer'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_insert ON public.appointments_just;
CREATE TRIGGER trg_appointment_insert
  AFTER INSERT ON public.appointments_just
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_appointment_changed();

DROP TRIGGER IF EXISTS trg_appointment_update ON public.appointments_just;
CREATE TRIGGER trg_appointment_update
  AFTER UPDATE OF status ON public.appointments_just
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_appointment_changed();


-- ============================================================
-- 3. MESSAGES CHAT (chat_messages_just)
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sender_name TEXT;
  v_recipient_id UUID;
BEGIN
  -- Récupère le nom de l'expéditeur
  SELECT COALESCE(first_name || ' ' || last_name, 'Quelqu''un')
  INTO v_sender_name
  FROM public.profiles_just
  WHERE id = NEW.sender_id;

  -- Récupère le destinataire (l'autre membre de la room)
  SELECT
    CASE
      WHEN cr.client_id = NEW.sender_id THEN cr.lawyer_id
      ELSE cr.client_id
    END
  INTO v_recipient_id
  FROM public.chat_rooms_just cr
  WHERE cr.id = NEW.room_id;

  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      v_recipient_id,
      'message',
      'Nouveau message',
      COALESCE(v_sender_name, 'Quelqu''un') || ' vous a envoyé un message.'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_message_insert ON public.chat_messages_just;
CREATE TRIGGER trg_chat_message_insert
  AFTER INSERT ON public.chat_messages_just
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_new_message();


-- ============================================================
-- 4. CLASSROOMS / LIVE (classrooms_just)
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_notify_classroom_live()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Quand un classroom passe en is_live = true → notifier tous les inscrits
  IF TG_OP = 'UPDATE'
     AND OLD.is_live IS DISTINCT FROM NEW.is_live
     AND NEW.is_live = true
  THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT
      cr.user_id,
      'live',
      'Session live démarrée 🔴',
      'La session "' || NEW.title || '" vient de commencer. Rejoignez-la maintenant !',
      '/classrooms'
    FROM public.classroom_registrations_just cr
    WHERE cr.classroom_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_classroom_live ON public.classrooms_just;
CREATE TRIGGER trg_classroom_live
  AFTER UPDATE OF is_live ON public.classrooms_just
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_classroom_live();


-- ============================================================
-- Vérification : liste des triggers créés
-- ============================================================
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trg_%'
ORDER BY event_object_table, trigger_name;
