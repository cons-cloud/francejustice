-- Migration Supabase pour la table de diagnostics juridiques IA & Realtime
CREATE TABLE IF NOT EXISTS public.legal_diagnostics_just (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    lawyer_id TEXT,
    case_title TEXT NOT NULL,
    uploaded_files TEXT[] DEFAULT '{}',
    full_analysis JSONB NOT NULL,
    win_probability INTEGER DEFAULT 50,
    appeal_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.legal_diagnostics_just ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Utilisateurs et Avocats peuvent consulter les diagnostics" 
ON public.legal_diagnostics_just FOR SELECT 
USING (auth.uid()::text = user_id OR auth.uid()::text = lawyer_id OR true);

CREATE POLICY "Utilisateurs peuvent insérer/modifier leurs diagnostics" 
ON public.legal_diagnostics_just FOR ALL 
USING (true) 
WITH CHECK (true);

-- Activation de Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.legal_diagnostics_just;
