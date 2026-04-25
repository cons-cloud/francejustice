-- SCHEMA COMPLET LAW JUST (SUPABASE / POSTGRES)

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'lawyer', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM ('identity', 'license', 'legal_template', 'client_document');
    END IF;
END $$;

-- 3. PROFILES (Base table for everyone)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  first_name text,
  last_name text,
  role user_role default 'user'::user_role,
  phone text,
  city text,
  country text default 'Maroc',
  postal_code text,
  birth_date date,
  avatar_url text,
  is_verified boolean default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. LAWYERS (Detailed info for lawyers)
create table if not exists public.lawyers (
  id uuid references public.profiles(id) on delete cascade primary key,
  bar_association text not null,
  license_number text unique not null,
  experience_years int,
  specialties text[], -- Array of strings
  bio text,
  is_available boolean default true,
  rating decimal(3,2) default 0.0,
  office_address text,
  office_phone text,
  verification_status text default 'pending', -- pending, approved, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. LEGAL NEWS (For the public blog/news)
create table if not exists public.legal_news (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  excerpt text,
  image_url text,
  category text,
  author_id uuid references public.profiles(id) on delete set null,
  published_at timestamp with time zone default timezone('utc'::text, now()),
  is_featured boolean default false,
  slug text unique
);

-- 6. DOCUMENTS
create table if not exists public.documents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type document_type not null,
  file_url text,
  owner_id uuid references public.profiles(id) on delete cascade,
  case_id uuid, -- Optional, linked to a case
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. APPOINTMENTS (Lawyer - Client interactions)
create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  lawyer_id uuid references public.lawyers(id) on delete cascade not null,
  scheduled_at timestamp with time zone not null,
  duration_minutes int default 30,
  status appointment_status default 'pending'::appointment_status,
  notes text,
  price decimal(10,2),
  payment_status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. AI CONVERSATIONS
create table if not exists public.ai_conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  messages jsonb not null, -- Array of messages
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. PAYMENTS (Logs)
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  amount decimal(10,2) not null,
  currency text default 'MAD',
  stripe_payment_intent_id text unique,
  status text,
  type text, -- subscription, appointment, document
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. CONTACT MESSAGES
create table if not exists public.contact_messages (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text default 'new', -- new, read, replied
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. SEARCH HISTORY (For analytics)
create table if not exists public.search_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  query text not null,
  filters jsonb,
  results_count int,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. SERVICES (Dynamic offerings)
create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  icon_name text, -- lucide icon name
  category text,
  is_active boolean default true,
  price_info text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12.5 INDEXES FOR SCALABILITY
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_documents_owner_id ON public.documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_appointments_lawyer_id ON public.appointments(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lawyers_verification_status ON public.lawyers(verification_status);
CREATE INDEX IF NOT EXISTS idx_lawyers_is_available ON public.lawyers(is_available);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);

-- 12. REAL-TIME CONFIGURATION
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lawyers') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lawyers;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ai_conversations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'contact_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'services') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
    END IF;
END $$;

-- 13. RLS POLICIES
alter table public.profiles enable row level security;
alter table public.lawyers enable row level security;
alter table public.legal_news enable row level security;
alter table public.documents enable row level security;
alter table public.appointments enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.payments enable row level security;
alter table public.contact_messages enable row level security;
alter table public.search_history enable row level security;

-- (Security Policies - Comprehensive & Idempotent)
DO $$ 
BEGIN
    -- profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can see basic profile info' AND tablename = 'profiles') THEN
        CREATE POLICY "Public can see basic profile info" ON public.profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- lawyers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can see lawyers' AND tablename = 'lawyers') THEN
        CREATE POLICY "Public can see lawyers" ON public.lawyers FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lawyers can update own info' AND tablename = 'lawyers') THEN
        CREATE POLICY "Lawyers can update own info" ON public.lawyers FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- documents
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see own documents' AND tablename = 'documents') THEN
        CREATE POLICY "Users can see own documents" ON public.documents FOR SELECT USING (auth.uid() = owner_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own documents' AND tablename = 'documents') THEN
        CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = owner_id);
    END IF;

    -- appointments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their appointments' AND tablename = 'appointments') THEN
        CREATE POLICY "Users can see their appointments" ON public.appointments FOR SELECT USING (auth.uid() = client_id OR auth.uid() = lawyer_id);
    END IF;

    -- ai_conversations
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their AI chats' AND tablename = 'ai_conversations') THEN
        CREATE POLICY "Users can see their AI chats" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- contact_messages
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can send a message' AND tablename = 'contact_messages') THEN
        CREATE POLICY "Anyone can send a message" ON public.contact_messages FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can see messages' AND tablename = 'contact_messages') THEN
        CREATE POLICY "Admins can see messages" ON public.contact_messages FOR ALL USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;

    -- Global Admin Override
    -- Note: We add this to ALL tables where admins need global access
    DECLARE
        t text;
    BEGIN
        FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS "Admin full access" ON public.%I', t);
            IF t != 'profiles' THEN
                EXECUTE format('CREATE POLICY "Admin full access" ON public.%I FOR ALL USING (
                    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin'')
                )', t);
            END IF;
        END LOOP;
    END;
END $$;
