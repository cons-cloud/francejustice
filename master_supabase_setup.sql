-- ==============================================================================
-- FRANCE JUSTICE / LAW JUST PLATFORM — MASTER SUPABASE DATABASE MIGRATION
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHEMAS & TABLES CREATION

-- Profiles (Utilisateurs et Avocats)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user', -- 'user', 'lawyer', 'admin'
    is_verified BOOLEAN DEFAULT false,
    phone TEXT,
    city TEXT,
    country TEXT DEFAULT 'France',
    postal_code TEXT,
    birth_date DATE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles_just (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user',
    is_verified BOOLEAN DEFAULT false,
    phone TEXT,
    city TEXT,
    country TEXT DEFAULT 'France',
    postal_code TEXT,
    birth_date DATE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Lawyers Details (Spécialités, Tarifs, Barreaux)
CREATE TABLE IF NOT EXISTS public.lawyers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    bar_number TEXT,
    specialties TEXT[],
    experience_years INT DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 150.00,
    bio TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lawyers_just (
    id UUID PRIMARY KEY REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    bar_number TEXT,
    specialties TEXT[],
    experience_years INT DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 150.00,
    bio TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Documents Vault (Coffre-fort documents)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'Document',
    file_url TEXT,
    file_size TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.documents_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'Document',
    file_url TEXT,
    file_size TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Quotes (Devis)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID,
    lawyer_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) DEFAULT 0.00,
    description TEXT,
    status TEXT DEFAULT 'pending',
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quotes_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID,
    lawyer_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) DEFAULT 0.00,
    description TEXT,
    status TEXT DEFAULT 'pending',
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Appointments (Rendez-vous)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    lawyer_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'En attente',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.appointments_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    lawyer_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    status TEXT DEFAULT 'En attente',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Chat Rooms & Messages
CREATE TABLE IF NOT EXISTS public.chat_rooms_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lawyer_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(lawyer_id, client_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms_just(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles_just(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Search History (Recherche IA)
CREATE TABLE IF NOT EXISTS public.search_history_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    results_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Nouvelle conversation',
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Legal News (Actualités Juridiques)
CREATE TABLE IF NOT EXISTS public.legal_news_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Droit du Travail',
    country TEXT DEFAULT 'France',
    media_type TEXT DEFAULT 'Article',
    image_url TEXT,
    author TEXT DEFAULT 'Rédaction Juridique',
    published_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    source_url TEXT,
    impact TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Formations & Classrooms
CREATE TABLE IF NOT EXISTS public.formations_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    duration TEXT,
    level TEXT DEFAULT 'Débutant',
    category TEXT,
    status TEXT DEFAULT 'Publié',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.outils_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'Actif',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.classrooms_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    lawyer_id UUID REFERENCES public.profiles_just(id) ON DELETE SET NULL,
    date DATE,
    time TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    max_participants INT DEFAULT 50,
    meeting_link TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.classroom_registrations_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    classroom_id UUID REFERENCES public.classrooms_just(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles_just(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(classroom_id, user_id)
);

-- Services & Tickets
CREATE TABLE IF NOT EXISTS public.services_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    icon_name TEXT,
    path TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assistance_tickets_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'En attente',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contact_messages_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Notifications & Complaints
CREATE TABLE IF NOT EXISTS public.notifications_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.complaints_just (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles_just(id) ON DELETE SET NULL,
    reported_id UUID REFERENCES public.profiles_just(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.platform_settings_just (
    id TEXT PRIMARY KEY DEFAULT 'global',
    maintenance_mode BOOLEAN DEFAULT false,
    commission_rate DECIMAL(5,2) DEFAULT 20.00,
    welcome_message TEXT DEFAULT 'Bienvenue sur France Justice',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. STORAGE BUCKETS CREATION
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('classroom-files', 'classroom-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Storage Access" ON storage.objects;
CREATE POLICY "Public Storage Access" ON storage.objects 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Storage Upload" ON storage.objects;
CREATE POLICY "Authenticated Storage Upload" ON storage.objects 
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated Storage Update" ON storage.objects;
CREATE POLICY "Authenticated Storage Update" ON storage.objects 
FOR UPDATE TO authenticated USING (true);

-- 4. REALTIME PUBLICATION CONFIGURATION
DO $$ 
DECLARE
    t text;
    tables_list text[] := ARRAY[
        'profiles_just', 'lawyers_just', 'documents_just', 'quotes_just',
        'appointments_just', 'chat_rooms_just', 'chat_messages_just',
        'search_history_just', 'ai_conversations_just', 'legal_news_just',
        'formations_just', 'outils_just', 'classrooms_just',
        'classroom_registrations_just', 'services_just', 'assistance_tickets_just',
        'contact_messages_just', 'notifications_just', 'complaints_just', 'platform_settings_just'
    ];
BEGIN
    FOREACH t IN ARRAY tables_list
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
        EXCEPTION WHEN others THEN
            -- Ignorer si déjà configuré
        END;
    END LOOP;
END $$;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
DO $$ 
DECLARE
    t text;
    tables_list text[] := ARRAY[
        'profiles_just', 'lawyers_just', 'documents_just', 'quotes_just',
        'appointments_just', 'chat_rooms_just', 'chat_messages_just',
        'search_history_just', 'ai_conversations_just', 'legal_news_just',
        'formations_just', 'outils_just', 'classrooms_just',
        'classroom_registrations_just', 'services_just', 'assistance_tickets_just',
        'contact_messages_just', 'notifications_just', 'complaints_just', 'platform_settings_just'
    ];
BEGIN
    FOREACH t IN ARRAY tables_list
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Permissive Access %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Permissive Access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
    END LOOP;
END $$;

-- 6. AUTOMATIC USER CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, is_verified, phone, city, country)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    false,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    COALESCE(new.raw_user_meta_data->>'country', 'France')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles_just (id, email, first_name, last_name, role, is_verified, phone, city, country)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    false,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    COALESCE(new.raw_user_meta_data->>'country', 'France')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. INITIAL PLATFORM SETTINGS
INSERT INTO public.platform_settings_just (id, maintenance_mode, commission_rate, welcome_message)
VALUES ('global', false, 20.00, 'Bienvenue sur la plateforme France Justice')
ON CONFLICT (id) DO NOTHING;

SELECT 'Master Supabase Database Migration Completed Successfully!' AS status;
