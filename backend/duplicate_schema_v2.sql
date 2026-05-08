-- SCRIPT DE DUPLICATION COMPLET (100% TABLES)

-- 1. DUPLICATION DES TABLES
DO $$ 
DECLARE
    table_name_rec record;
BEGIN
    FOR table_name_rec IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
                           AND tablename NOT LIKE '%_just'
                           AND tablename IN ('documents', 'appointments', 'legal_news', 'services', 'ai_conversations', 
                                          'payments', 'profiles', 'lawyers', 'contact_messages', 'search_history',
                                          'formations', 'outils', 'assistance_tickets', 'platform_settings', 
                                          'quotes', 'chat_rooms', 'chat_messages', 'complaints'))
    LOOP
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I_just AS SELECT * FROM public.%I', table_name_rec.tablename, table_name_rec.tablename);
    END LOOP;
END $$;

-- 2. AJOUT DES PK (Pour les nouvelles tables détectées)
ALTER TABLE public.formations_just ADD PRIMARY KEY (id);
ALTER TABLE public.outils_just ADD PRIMARY KEY (id);
ALTER TABLE public.assistance_tickets_just ADD PRIMARY KEY (id);
ALTER TABLE public.platform_settings_just ADD PRIMARY KEY (key);
ALTER TABLE public.quotes_just ADD PRIMARY KEY (id);
ALTER TABLE public.chat_rooms_just ADD PRIMARY KEY (id);
ALTER TABLE public.chat_messages_just ADD PRIMARY KEY (id);
ALTER TABLE public.complaints_just ADD PRIMARY KEY (id);

-- 3. AJOUT DES FK (Si applicable)
-- Note: Les FK pour profiles_just ont déjà été faites au premier tour, 
-- mais on s'assure que tout est lié aux versions _just.
-- ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ...

-- 4. REAL-TIME COMPLETION (Toutes les tables doivent être dans la publication)
ALTER PUBLICATION supabase_realtime ADD TABLE public.formations_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.outils_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assistance_tickets_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legal_news_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments_just;
ALTER PUBLICATION supabase_realtime ADD TABLE public.search_history_just;
