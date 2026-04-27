-- ==============================================================================
-- MASTER SYNC SQL : LAW JUST PLATFORM
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HELPERS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role::text FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. TABLES MANQUANTES / CORRECTIONS

-- Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    maintenance_mode BOOLEAN DEFAULT false,
    commission_rate DECIMAL(5,2) DEFAULT 20.00,
    welcome_message TEXT DEFAULT 'Bienvenue sur JustLaw',
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.platform_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- Quotes (Devis)
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    case_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    lawyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, paid, commissioned
    stripe_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Chat Rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lawyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(lawyer_id, client_id)
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Complaints (Plaintes)
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reported_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Formations
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  duration TEXT,
  level TEXT DEFAULT 'Débutant',
  category TEXT,
  status TEXT DEFAULT 'Publié',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Outils
CREATE TABLE IF NOT EXISTS public.outils (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'Actif',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Assistance Tickets
CREATE TABLE IF NOT EXISTS public.assistance_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'En attente',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. REAL-TIME
-- On s'assure que toutes les tables sont dans la publication realtime
DO $$ 
DECLARE
    tab text;
BEGIN
    FOR tab IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', tab);
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tab);
        EXCEPTION WHEN others THEN
            -- Ignore si déjà ajouté
        END;
    END LOOP;
END $$;

-- 4. RLS POLICIES (Sync 100%)

-- On active le RLS partout
DO $$ 
DECLARE
    tab text;
BEGIN
    FOR tab IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tab);
    END LOOP;
END $$;

-- Règle Admin Universelle
DO $$ 
DECLARE
    tab text;
BEGIN
    FOR tab IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admin Sync 100" ON public.%I', tab);
        EXECUTE format('CREATE POLICY "Admin Sync 100" ON public.%I FOR ALL USING (public.is_admin())', tab);
    END LOOP;
END $$;

-- Règles spécifiques pour le Chat
DROP POLICY IF EXISTS "Chat access" ON public.chat_rooms;
CREATE POLICY "Chat access" ON public.chat_rooms FOR ALL USING (
    auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin()
);

DROP POLICY IF EXISTS "Messages access" ON public.chat_messages;
CREATE POLICY "Messages access" ON public.chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.chat_rooms WHERE id = room_id AND (auth.uid() = client_id OR auth.uid() = lawyer_id))
    OR public.is_admin()
);

-- Règles spécifiques pour les Devis (Quotes)
DROP POLICY IF EXISTS "Quotes access" ON public.quotes;
CREATE POLICY "Quotes access" ON public.quotes FOR ALL USING (
    auth.uid() = client_id OR auth.uid() = lawyer_id OR public.is_admin()
);

-- Public access to News and Formations
DROP POLICY IF EXISTS "News public access" ON public.legal_news;
CREATE POLICY "News public access" ON public.legal_news FOR SELECT USING (true);

DROP POLICY IF EXISTS "Formations public access" ON public.formations;
CREATE POLICY "Formations public access" ON public.formations FOR SELECT USING (true);

-- Profiles public access (crucial for fetching first_name/last_name in queries)
-- 5. AUTOMATIC PROFILE CREATION TRIGGER
-- This ensures that every user created in Supabase Auth gets a row in public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::text, 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AUTO-CONFIRM EMAIL TRIGGER
-- Bypasses the strict Supabase email confirmation requirement programmatically
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS trigger AS $$
BEGIN
  new.email_confirmed_at = now();
  new.confirmed_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS bypass_email_confirmation ON auth.users;
CREATE TRIGGER bypass_email_confirmation
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_email();

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- MANUAL FIX FOR ADMIN PROFILE (Run this if the admin is missing)
-- You need to get the UUID from Supabase Auth for justlaw@gmail.com
-- INSERT INTO public.profiles (id, email, first_name, last_name, role, is_verified)
-- VALUES ('REPLACE_WITH_UUID', 'justlaw@gmail.com', 'Admin', 'JustLaw', 'admin', true)
-- ON CONFLICT (email) DO UPDATE SET role = 'admin', is_verified = true;

