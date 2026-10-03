-- ==============================================================================
-- FRANCE JUSTICE — SUPABASE SECURITY HARDENING & PRODUCTION RLS LOCKDOWN
-- Script universel et robuste de sécurisation de la base de données Supabase
-- ==============================================================================

-- 1. FONCTIONS DE SÉCURITÉ (SECURITY DEFINER)
-- ------------------------------------------------------------------------------

-- Fonction vérifiant si l'utilisateur courant possède les privilèges administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    COALESCE(auth.jwt() ->> 'email', '') IN ('justlaw@gmail.com', 'francejustice@gmail.com')
    OR EXISTS (
      SELECT 1 FROM public.profiles_just
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR (
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );
$$;

-- Fonction protégeant contre l'auto-attribution du rôle 'admin' ou du statut 'is_verified'
CREATE OR REPLACE FUNCTION public.protect_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role = 'admin' AND (OLD.role IS NULL OR OLD.role <> 'admin') THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Privilege Escalation Forbidden: Only existing administrators can assign the admin role.';
    END IF;
  END IF;

  IF NEW.is_verified = true AND (OLD.is_verified IS NULL OR OLD.is_verified = false) THEN
    IF NOT public.is_admin() THEN
      NEW.is_verified := false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Triggers d'intégrité sur profiles_just
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles_just') THEN
    DROP TRIGGER IF EXISTS trg_protect_profiles_just ON public.profiles_just;
    CREATE TRIGGER trg_protect_profiles_just
    BEFORE INSERT OR UPDATE ON public.profiles_just
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privilege_escalation();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DROP TRIGGER IF EXISTS trg_protect_profiles ON public.profiles;
    CREATE TRIGGER trg_protect_profiles
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privilege_escalation();
  END IF;
END $$;


-- 2. PURGE DES ANCIENNES POLITIQUES PERMISSIVES
-- ------------------------------------------------------------------------------
DO $$ 
DECLARE
    t text;
    tables_list text[] := ARRAY[
        'profiles_just', 'profiles', 'lawyers_just', 'lawyers', 'academic_profiles_just',
        'documents_just', 'documents', 'quotes_just', 'quotes',
        'appointments_just', 'appointments', 'chat_rooms_just', 'chat_messages_just',
        'search_history_just', 'ai_conversations_just', 'legal_news_just',
        'formations_just', 'outils_just', 'classrooms_just',
        'classroom_registrations_just', 'services_just', 'assistance_tickets_just',
        'contact_messages_just', 'notifications_just', 'notifications',
        'complaints_just', 'platform_settings_just', 'legal_diagnostics_just'
    ];
    pol record;
BEGIN
    FOREACH t IN ARRAY tables_list
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            FOR pol IN 
                SELECT policyname 
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = t
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
            END LOOP;
        END IF;
    END LOOP;
END $$;


-- 3. POLITIQUES STRICTES TABLE PAR TABLE (AVEC VÉRIFICATION D'EXISTENCE)
-- ------------------------------------------------------------------------------

-- PROFILES_JUST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles_just') THEN
    EXECUTE '
      CREATE POLICY "profiles_select_policy" ON public.profiles_just
      FOR SELECT USING (
        auth.uid() = id 
        OR role IN (''lawyer'', ''professor'', ''doctorate'') 
        OR public.is_admin()
      );

      CREATE POLICY "profiles_insert_policy" ON public.profiles_just
      FOR INSERT WITH CHECK (
        auth.uid() = id OR public.is_admin()
      );

      CREATE POLICY "profiles_update_policy" ON public.profiles_just
      FOR UPDATE USING (
        auth.uid() = id OR public.is_admin()
      ) WITH CHECK (
        auth.uid() = id OR public.is_admin()
      );

      CREATE POLICY "profiles_delete_policy" ON public.profiles_just
      FOR DELETE USING (
        auth.uid() = id OR public.is_admin()
      );
    ';
  END IF;
END $$;

-- PROFILES (table legacy si présente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    EXECUTE '
      CREATE POLICY "legacy_profiles_select" ON public.profiles
      FOR SELECT USING (auth.uid() = id OR role IN (''lawyer'', ''professor'', ''doctorate'') OR public.is_admin());
      CREATE POLICY "legacy_profiles_insert" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
      CREATE POLICY "legacy_profiles_update" ON public.profiles
      FOR UPDATE USING (auth.uid() = id OR public.is_admin());
      CREATE POLICY "legacy_profiles_delete" ON public.profiles
      FOR DELETE USING (auth.uid() = id OR public.is_admin());
    ';
  END IF;
END $$;

-- LAWYERS_JUST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lawyers_just') THEN
    EXECUTE '
      CREATE POLICY "lawyers_select_public" ON public.lawyers_just FOR SELECT USING (true);
      CREATE POLICY "lawyers_insert_own" ON public.lawyers_just FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
      CREATE POLICY "lawyers_update_own" ON public.lawyers_just FOR UPDATE USING (auth.uid() = id OR public.is_admin());
      CREATE POLICY "lawyers_delete_own" ON public.lawyers_just FOR DELETE USING (auth.uid() = id OR public.is_admin());
    ';
  END IF;
END $$;

-- ACADEMIC_PROFILES_JUST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academic_profiles_just') THEN
    EXECUTE '
      CREATE POLICY "academic_select_public" ON public.academic_profiles_just FOR SELECT USING (true);
      CREATE POLICY "academic_insert_own" ON public.academic_profiles_just FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
      CREATE POLICY "academic_update_own" ON public.academic_profiles_just FOR UPDATE USING (auth.uid() = id OR public.is_admin());
      CREATE POLICY "academic_delete_own" ON public.academic_profiles_just FOR DELETE USING (auth.uid() = id OR public.is_admin());
    ';
  END IF;
END $$;

-- DOCUMENTS_JUST & DOCUMENTS (Détection dynamique de la colonne propriétaire : owner_id ou user_id)
DO $$
DECLARE
  doc_col text;
  leg_col text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents_just') THEN
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents_just' AND column_name = 'owner_id') THEN 'owner_id'
      ELSE 'user_id'
    END INTO doc_col;

    EXECUTE format('
      CREATE POLICY "documents_select_owner" ON public.documents_just
      FOR SELECT USING (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "documents_insert_owner" ON public.documents_just
      FOR INSERT WITH CHECK (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "documents_update_owner" ON public.documents_just
      FOR UPDATE USING (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "documents_delete_owner" ON public.documents_just
      FOR DELETE USING (auth.uid() = %I OR public.is_admin());
    ', doc_col, doc_col, doc_col, doc_col);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'owner_id') THEN 'owner_id'
      ELSE 'user_id'
    END INTO leg_col;

    EXECUTE format('
      CREATE POLICY "legacy_documents_select_owner" ON public.documents
      FOR SELECT USING (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "legacy_documents_insert_owner" ON public.documents
      FOR INSERT WITH CHECK (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "legacy_documents_update_owner" ON public.documents
      FOR UPDATE USING (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "legacy_documents_delete_owner" ON public.documents
      FOR DELETE USING (auth.uid() = %I OR public.is_admin());
    ', leg_col, leg_col, leg_col, leg_col);
  END IF;
END $$;

-- APPOINTMENTS_JUST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments_just') THEN
    EXECUTE '
      CREATE POLICY "appointments_select_parties" ON public.appointments_just
      FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin());

      CREATE POLICY "appointments_insert_parties" ON public.appointments_just
      FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin());

      CREATE POLICY "appointments_update_parties" ON public.appointments_just
      FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin());

      CREATE POLICY "appointments_delete_parties" ON public.appointments_just
      FOR DELETE USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin());
    ';
  END IF;
END $$;

-- QUOTES_JUST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes_just') THEN
    EXECUTE '
      CREATE POLICY "quotes_select_parties" ON public.quotes_just
      FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin());

      CREATE POLICY "quotes_insert_lawyer" ON public.quotes_just
      FOR INSERT WITH CHECK (auth.uid() = lawyer_id OR public.is_admin());

      CREATE POLICY "quotes_update_parties" ON public.quotes_just
      FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin());

      CREATE POLICY "quotes_delete_lawyer" ON public.quotes_just
      FOR DELETE USING (auth.uid() = lawyer_id OR public.is_admin());
    ';
  END IF;
END $$;

-- CHAT_ROOMS_JUST & CHAT_MESSAGES_JUST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_rooms_just') THEN
    EXECUTE '
      CREATE POLICY "chat_rooms_select_parties" ON public.chat_rooms_just
      FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin());

      CREATE POLICY "chat_rooms_insert_parties" ON public.chat_rooms_just
      FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin());
    ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages_just') THEN
    EXECUTE '
      CREATE POLICY "chat_messages_select_parties" ON public.chat_messages_just
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.chat_rooms_just r
          WHERE r.id = chat_messages_just.room_id
          AND (r.client_id = auth.uid() OR r.lawyer_id = auth.uid())
        )
        OR public.is_admin()
      );

      CREATE POLICY "chat_messages_insert_sender" ON public.chat_messages_just
      FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
          SELECT 1 FROM public.chat_rooms_just r
          WHERE r.id = chat_messages_just.room_id
          AND (r.client_id = auth.uid() OR r.lawyer_id = auth.uid())
        )
      );
    ';
  END IF;
END $$;

-- LEGAL_DIAGNOSTICS_JUST
DO $$
DECLARE
  diag_col text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legal_diagnostics_just') THEN
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'legal_diagnostics_just' AND column_name = 'owner_id') THEN 'owner_id'
      ELSE 'user_id'
    END INTO diag_col;

    EXECUTE format('
      CREATE POLICY "diagnostics_select_policy" ON public.legal_diagnostics_just
      FOR SELECT USING (auth.uid()::text = %I::text OR auth.uid()::text = lawyer_id::text OR public.is_admin());

      CREATE POLICY "diagnostics_insert_policy" ON public.legal_diagnostics_just
      FOR INSERT WITH CHECK (auth.uid()::text = %I::text OR public.is_admin());

      CREATE POLICY "diagnostics_update_policy" ON public.legal_diagnostics_just
      FOR UPDATE USING (auth.uid()::text = %I::text OR auth.uid()::text = lawyer_id::text OR public.is_admin());

      CREATE POLICY "diagnostics_delete_policy" ON public.legal_diagnostics_just
      FOR DELETE USING (auth.uid()::text = %I::text OR public.is_admin());
    ', diag_col, diag_col, diag_col, diag_col);
  END IF;
END $$;

-- SEARCH_HISTORY_JUST & AI_CONVERSATIONS_JUST
DO $$
DECLARE
  sh_col text;
  ai_col text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'search_history_just') THEN
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'search_history_just' AND column_name = 'owner_id') THEN 'owner_id'
      ELSE 'user_id'
    END INTO sh_col;

    EXECUTE format('
      CREATE POLICY "search_history_own" ON public.search_history_just
      FOR ALL USING (auth.uid() = %I OR public.is_admin())
      WITH CHECK (auth.uid() = %I OR public.is_admin());
    ', sh_col, sh_col);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_conversations_just') THEN
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_conversations_just' AND column_name = 'owner_id') THEN 'owner_id'
      ELSE 'user_id'
    END INTO ai_col;

    EXECUTE format('
      CREATE POLICY "ai_conversations_own" ON public.ai_conversations_just
      FOR ALL USING (auth.uid() = %I OR public.is_admin())
      WITH CHECK (auth.uid() = %I OR public.is_admin());
    ', ai_col, ai_col);
  END IF;
END $$;

-- NOTIFICATIONS_JUST & NOTIFICATIONS
DO $$
DECLARE
  notif_just_col text;
  notif_col text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications_just') THEN
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications_just' AND column_name = 'owner_id') THEN 'owner_id'
      ELSE 'user_id'
    END INTO notif_just_col;

    EXECUTE format('
      CREATE POLICY "notifications_just_select" ON public.notifications_just
      FOR SELECT USING (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "notifications_just_update" ON public.notifications_just
      FOR UPDATE USING (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "notifications_just_delete" ON public.notifications_just
      FOR DELETE USING (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "notifications_just_insert" ON public.notifications_just
      FOR INSERT WITH CHECK (auth.uid() = %I OR public.is_admin() OR current_user = ''service_role'');
    ', notif_just_col, notif_just_col, notif_just_col, notif_just_col);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'owner_id') THEN 'owner_id'
      ELSE 'user_id'
    END INTO notif_col;

    EXECUTE format('
      CREATE POLICY "notifications_select" ON public.notifications
      FOR SELECT USING (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "notifications_update" ON public.notifications
      FOR UPDATE USING (auth.uid() = %I OR public.is_admin());

      CREATE POLICY "notifications_insert" ON public.notifications
      FOR INSERT WITH CHECK (auth.uid() = %I OR public.is_admin() OR current_user = ''service_role'');
    ', notif_col, notif_col, notif_col);
  END IF;
END $$;

-- ASSISTANCE_TICKETS_JUST
DO $$
DECLARE
  ticket_col text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assistance_tickets_just') THEN
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assistance_tickets_just' AND column_name = 'owner_id') THEN 'owner_id'
      ELSE 'user_id'
    END INTO ticket_col;

    EXECUTE format('
      CREATE POLICY "tickets_select" ON public.assistance_tickets_just FOR SELECT USING (auth.uid() = %I OR public.is_admin());
      CREATE POLICY "tickets_insert" ON public.assistance_tickets_just FOR INSERT WITH CHECK (auth.uid() = %I OR public.is_admin());
      CREATE POLICY "tickets_update" ON public.assistance_tickets_just FOR UPDATE USING (auth.uid() = %I OR public.is_admin());
      CREATE POLICY "tickets_delete" ON public.assistance_tickets_just FOR DELETE USING (auth.uid() = %I OR public.is_admin());
    ', ticket_col, ticket_col, ticket_col, ticket_col);
  END IF;
END $$;

-- CONTACT_MESSAGES_JUST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_messages_just') THEN
    EXECUTE '
      CREATE POLICY "contact_insert_public" ON public.contact_messages_just FOR INSERT WITH CHECK (true);
      CREATE POLICY "contact_select_admin_only" ON public.contact_messages_just FOR SELECT USING (public.is_admin());
      CREATE POLICY "contact_modify_admin_only" ON public.contact_messages_just FOR UPDATE USING (public.is_admin());
      CREATE POLICY "contact_delete_admin_only" ON public.contact_messages_just FOR DELETE USING (public.is_admin());
    ';
  END IF;
END $$;

-- COMPLAINTS_JUST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'complaints_just') THEN
    EXECUTE '
      CREATE POLICY "complaints_insert" ON public.complaints_just FOR INSERT WITH CHECK (auth.uid() = reporter_id OR public.is_admin());
      CREATE POLICY "complaints_select" ON public.complaints_just FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());
      CREATE POLICY "complaints_manage_admin" ON public.complaints_just FOR ALL USING (public.is_admin());
    ';
  END IF;
END $$;

-- PLATFORM_SETTINGS_JUST
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_settings_just') THEN
    EXECUTE '
      CREATE POLICY "platform_settings_read_public" ON public.platform_settings_just FOR SELECT USING (true);
      CREATE POLICY "platform_settings_manage_admin" ON public.platform_settings_just FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
    ';
  END IF;
END $$;

-- CONTENUS PUBLICS (Actualités, Outils, Services, Formations, Classrooms)
DO $$
DECLARE
  form_rule text;
  class_rule text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legal_news_just') THEN
    EXECUTE '
      CREATE POLICY "news_read_public" ON public.legal_news_just FOR SELECT USING (true);
      CREATE POLICY "news_manage_admin" ON public.legal_news_just FOR ALL USING (public.is_admin());
    ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services_just') THEN
    EXECUTE '
      CREATE POLICY "services_read_public" ON public.services_just FOR SELECT USING (true);
      CREATE POLICY "services_manage_admin" ON public.services_just FOR ALL USING (public.is_admin());
    ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'outils_just') THEN
    EXECUTE '
      CREATE POLICY "outils_read_public" ON public.outils_just FOR SELECT USING (true);
      CREATE POLICY "outils_manage_admin" ON public.outils_just FOR ALL USING (public.is_admin());
    ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'formations_just') THEN
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'formations_just' AND column_name = 'author_id') THEN 'auth.uid() = author_id OR public.is_admin()'
      ELSE 'public.is_admin()'
    END INTO form_rule;

    EXECUTE format('
      CREATE POLICY "formations_read_public" ON public.formations_just FOR SELECT USING (true);
      CREATE POLICY "formations_manage" ON public.formations_just FOR ALL USING (%s);
    ', form_rule);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'classrooms_just') THEN
    SELECT CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'classrooms_just' AND column_name = 'lawyer_id') THEN 'auth.uid() = lawyer_id OR public.is_admin()'
      ELSE 'public.is_admin()'
    END INTO class_rule;

    EXECUTE format('
      CREATE POLICY "classrooms_read_public" ON public.classrooms_just FOR SELECT USING (true);
      CREATE POLICY "classrooms_manage" ON public.classrooms_just FOR ALL USING (%s);
    ', class_rule);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'classroom_registrations_just') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'classroom_registrations_just' AND column_name = 'user_id') THEN
      EXECUTE '
        CREATE POLICY "registrations_select" ON public.classroom_registrations_just
        FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
        CREATE POLICY "registrations_insert" ON public.classroom_registrations_just
        FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
      ';
    ELSE
      EXECUTE '
        CREATE POLICY "registrations_select" ON public.classroom_registrations_just FOR SELECT USING (public.is_admin());
        CREATE POLICY "registrations_insert" ON public.classroom_registrations_just FOR INSERT WITH CHECK (public.is_admin());
      ';
    END IF;
  END IF;
END $$;


-- 4. SÉCURISATION DU STOCKAGE SUPABASE (STORAGE)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- Rendre les buckets de pièces judiciaires privés
  UPDATE storage.buckets
  SET public = false
  WHERE id IN ('case-documents', 'documents');

  -- Supprimer les anciennes politiques storage
  DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Storage Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Storage Update" ON storage.objects;
  DROP POLICY IF EXISTS "Lecture autorisée des pièces juridiques" ON storage.objects;
  DROP POLICY IF EXISTS "Upload autorisé des pièces juridiques" ON storage.objects;
  DROP POLICY IF EXISTS "Suppression autorisée des pièces juridiques" ON storage.objects;
  DROP POLICY IF EXISTS "Avatars Public Read" ON storage.objects;
  DROP POLICY IF EXISTS "Avatars User Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Avatars User Update" ON storage.objects;
  DROP POLICY IF EXISTS "Case Documents Owner Read" ON storage.objects;
  DROP POLICY IF EXISTS "Case Documents Owner Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Case Documents Owner Delete" ON storage.objects;

  -- Avatars : lecture publique, upload restreint à l'utilisateur connecté
  CREATE POLICY "Avatars Public Read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

  CREATE POLICY "Avatars User Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

  CREATE POLICY "Avatars User Update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

  -- Documents confidentiels : isolation stricte par dossier utilisateur ({userId}/...)
  CREATE POLICY "Case Documents Owner Read" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('case-documents', 'documents') 
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

  CREATE POLICY "Case Documents Owner Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('case-documents', 'documents') 
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

  CREATE POLICY "Case Documents Owner Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('case-documents', 'documents') 
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );
END $$;
