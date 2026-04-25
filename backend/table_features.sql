-- ==============================================================================
-- SCRIPT DE MIGRATION POUR LES NOUVELLES FONCTIONNALITES (Formations, Outils, Assistance)
-- ==============================================================================

-- 1. TABLE FORMATIONS
CREATE TABLE IF NOT EXISTS public.formations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  duration TEXT,
  level TEXT,
  category TEXT,
  status TEXT DEFAULT 'Brouillon', -- 'Publié' ou 'Brouillon'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published formations" 
  ON public.formations FOR SELECT 
  USING (status = 'Publié');

CREATE POLICY "Admins can view all formations" 
  ON public.formations FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Admins can insert formations" 
  ON public.formations FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update formations" 
  ON public.formations FOR UPDATE 
  USING (public.is_admin());

CREATE POLICY "Admins can delete formations" 
  ON public.formations FOR DELETE 
  USING (public.is_admin());


-- 2. TABLE OUTILS
CREATE TABLE IF NOT EXISTS public.outils (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'Actif', -- 'Actif' ou 'En Test'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.outils ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can view active outils" 
  ON public.outils FOR SELECT 
  USING (public.get_user_role(auth.uid()) IN ('lawyer', 'admin'));

CREATE POLICY "Admins can insert outils" 
  ON public.outils FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update outils" 
  ON public.outils FOR UPDATE 
  USING (public.is_admin());

CREATE POLICY "Admins can delete outils" 
  ON public.outils FOR DELETE 
  USING (public.is_admin());


-- 3. TABLE ASSISTANCE TICKETS
CREATE TABLE IF NOT EXISTS public.assistance_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'En attente', -- 'En attente', 'En cours', 'Résolu'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assistance_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" 
  ON public.assistance_tickets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tickets" 
  ON public.assistance_tickets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" 
  ON public.assistance_tickets FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Admins can update all tickets" 
  ON public.assistance_tickets FOR UPDATE 
  USING (public.is_admin());

CREATE POLICY "Admins can delete all tickets" 
  ON public.assistance_tickets FOR DELETE 
  USING (public.is_admin());

-- ENABLE REAL-TIME SYNC
ALTER PUBLICATION supabase_realtime ADD TABLE formations;
ALTER PUBLICATION supabase_realtime ADD TABLE outils;
ALTER PUBLICATION supabase_realtime ADD TABLE assistance_tickets;
