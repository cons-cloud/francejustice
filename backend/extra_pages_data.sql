-- ==============================================================================
-- EXTRA PAGES DATA (News & Legal Database)
-- ==============================================================================

-- 1. Legal News (Actualités Juridiques)
CREATE TABLE IF NOT EXISTS public.legal_news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    category TEXT DEFAULT 'Général', -- Maroc, France, International
    image_url TEXT,
    author TEXT DEFAULT 'JustLaw Editorial',
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Legal Database (Bibliothèque de textes de loi)
CREATE TABLE IF NOT EXISTS public.legal_database (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    category TEXT, -- Code, Dahir, Décret
    country TEXT DEFAULT 'Maroc',
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. INITIAL CONTENT SEEDING

-- Seed News
INSERT INTO public.legal_news (title, summary, category, author) VALUES
('Réforme du Code de la Famille au Maroc 2026', 'Les points clés de la nouvelle réforme attendue pour l''été.', 'Maroc', 'Dr. Alami'),
('Nouveaux barèmes Stripe pour l''Afrique du Nord', 'Adaptation des tarifs de transaction pour les services digitaux.', 'Économie', 'Stripe Team'),
('IA et Justice : Le cadre européen IA Act Décrypté', 'Comment la nouvelle réglementation impacte les outils juridiques IA.', 'International', 'M. Dupont');

-- Seed Database
INSERT INTO public.legal_database (title, category, country, year) VALUES
('Code Civil Français (Version 2025)', 'Code', 'France', 2025),
('Code du Travail Marocain (Dernière Version)', 'Code', 'Maroc', 2024),
('Dahir sur l''Investissement Numérique', 'Dahir', 'Maroc', 2023);

-- 4. REAL-TIME & RLS
ALTER TABLE public.legal_news REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legal_news;

ALTER TABLE public.legal_database REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.legal_database;

-- RLS
ALTER TABLE public.legal_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_database ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public News Access" ON public.legal_news;
CREATE POLICY "Public News Access" ON public.legal_news FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public DB Access" ON public.legal_database;
CREATE POLICY "Public DB Access" ON public.legal_database FOR SELECT USING (true);
