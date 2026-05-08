-- SCRIPT DE DUPLICATION DE SCHEMA POUR LAW JUST (_just)

-- 1. DUPLICATION DES TABLES (STRUCTURE ET DONNÉES)
-- Note: On utilise CREATE TABLE ... AS SELECT ... pour aller vite, 
-- mais on doit ensuite rajouter manuellement les PK, FK et contraintes.

DO $$ 
DECLARE
    table_name_rec record;
BEGIN
    FOR table_name_rec IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
                           AND tablename NOT LIKE '%_just'
                           AND tablename IN ('profiles', 'lawyers', 'legal_news', 'documents', 'appointments', 'ai_conversations', 'payments', 'contact_messages', 'search_history', 'services'))
    LOOP
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I_just AS SELECT * FROM public.%I', table_name_rec.tablename, table_name_rec.tablename);
    END LOOP;
END $$;

-- 2. AJOUT DES CLÉS PRIMAIRES ET CONTRAINTES
ALTER TABLE public.profiles_just ADD PRIMARY KEY (id);
ALTER TABLE public.lawyers_just ADD PRIMARY KEY (id);
ALTER TABLE public.legal_news_just ADD PRIMARY KEY (id);
ALTER TABLE public.documents_just ADD PRIMARY KEY (id);
ALTER TABLE public.appointments_just ADD PRIMARY KEY (id);
ALTER TABLE public.ai_conversations_just ADD PRIMARY KEY (id);
ALTER TABLE public.payments_just ADD PRIMARY KEY (id);
ALTER TABLE public.contact_messages_just ADD PRIMARY KEY (id);
ALTER TABLE public.search_history_just ADD PRIMARY KEY (id);
ALTER TABLE public.services_just ADD PRIMARY KEY (id);

-- 3. AJOUT DES CLÉS ÉTRANGÈRES (Pointant vers les tables _just)
ALTER TABLE public.lawyers_just ADD CONSTRAINT lawyers_just_id_fkey FOREIGN KEY (id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;
ALTER TABLE public.legal_news_just ADD CONSTRAINT legal_news_just_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles_just(id) ON DELETE SET NULL;
ALTER TABLE public.documents_just ADD CONSTRAINT documents_just_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;
ALTER TABLE public.appointments_just ADD CONSTRAINT appointments_just_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;
ALTER TABLE public.appointments_just ADD CONSTRAINT appointments_just_lawyer_id_fkey FOREIGN KEY (lawyer_id) REFERENCES public.lawyers_just(id) ON DELETE CASCADE;
ALTER TABLE public.ai_conversations_just ADD CONSTRAINT ai_conversations_just_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;
ALTER TABLE public.payments_just ADD CONSTRAINT payments_just_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles_just(id) ON DELETE CASCADE;
ALTER TABLE public.search_history_just ADD CONSTRAINT search_history_just_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles_just(id) ON DELETE SET NULL;

-- 4. REAL-TIME CONFIGURATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lawyers_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services_just;

-- 5. RLS POLICIES (Duplication)
ALTER TABLE public.profiles_just ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers_just ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_news_just ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_just ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments_just ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations_just ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments_just ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages_just ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history_just ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_just ENABLE ROW LEVEL SECURITY;

-- Exemples de politiques pour les nouvelles tables
CREATE POLICY "Public can see basic profile info just" ON public.profiles_just FOR SELECT USING (true);
CREATE POLICY "Users can update own profile just" ON public.profiles_just FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public can see lawyers just" ON public.lawyers_just FOR SELECT USING (true);
CREATE POLICY "Lawyers can update own info just" ON public.lawyers_just FOR UPDATE USING (auth.uid() = id);
-- Note: Pour simplifier, vous pouvez recréer toutes les politiques via l'interface Supabase ou via un script étendu.

-- 6. MISE À JOUR DU TRIGGER DE SIGNUP
-- On modifie handle_new_user pour qu'il insère dans les DEUX sets de tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := coalesce(new.raw_user_meta_data->>'role', 'user');

  -- Insertion dans les tables ORIGINALES
  INSERT INTO public.profiles (id, email, first_name, last_name, role, is_verified, phone, city, country, postal_code, birth_date)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data->>'first_name', ''), coalesce(new.raw_user_meta_data->>'last_name', ''), v_role, false, new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'city', new.raw_user_meta_data->>'country', new.raw_user_meta_data->>'postal_code', new.raw_user_meta_data->>'birth_date');

  -- Insertion dans les tables _JUST
  INSERT INTO public.profiles_just (id, email, first_name, last_name, role, is_verified, phone, city, country, postal_code, birth_date)
  VALUES (new.id, new.email, coalesce(new.raw_user_meta_data->>'first_name', ''), coalesce(new.raw_user_meta_data->>'last_name', ''), v_role, false, new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'city', new.raw_user_meta_data->>'country', new.raw_user_meta_data->>'postal_code', new.raw_user_meta_data->>'birth_date');

  IF v_role = 'lawyer' THEN
    -- Original
    INSERT INTO public.lawyers (id, bar_association, license_number, experience_years, is_available)
    VALUES (new.id, coalesce(new.raw_user_meta_data->>'bar_association', ''), coalesce(new.raw_user_meta_data->>'license_number', ''), NULLIF(new.raw_user_meta_data->>'experience', '')::integer, true);
    
    -- _Just
    INSERT INTO public.lawyers_just (id, bar_association, license_number, experience_years, is_available)
    VALUES (new.id, coalesce(new.raw_user_meta_data->>'bar_association', ''), coalesce(new.raw_user_meta_data->>'license_number', ''), NULLIF(new.raw_user_meta_data->>'experience', '')::integer, true);
  END IF;

  RETURN new;
END;
$$;
