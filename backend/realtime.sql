-- ADD MISSING TABLES TO SUPABASE REALTIME PUBLICATION

DO $$ 
BEGIN
    -- Add documents table
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'documents') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
    END IF;

    -- Add search_history table
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'search_history') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.search_history;
    END IF;
    
    -- Ensure profiles is added (just in case they missed schema.sql partially)
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
    
    -- Ensure lawyers is added
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lawyers') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lawyers;
    END IF;
END $$;
