-- ==============================================================================
-- SCRIPT DE MIGRATION V2 : FK CORRECTION, PAIEMENTS ET PARAMÈTRES
-- ==============================================================================

-- 1. CORRECTION ASSISTANCE_TICKETS (Fix 400 Bad Request)
DROP TABLE IF EXISTS public.assistance_tickets CASCADE;

CREATE TABLE public.assistance_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'En attente', -- 'En attente', 'En cours', 'Résolu'
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assistance_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" ON public.assistance_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON public.assistance_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.assistance_tickets FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all tickets" ON public.assistance_tickets FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete all tickets" ON public.assistance_tickets FOR DELETE USING (public.is_admin());


-- 2. TABLE PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'En attente', -- 'Complété', 'En attente', 'Échoué'
  service_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete payments" ON public.payments FOR DELETE USING (public.is_admin());


-- 3. TABLE PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY,
  maintenance_mode BOOLEAN DEFAULT false,
  commission_rate NUMERIC DEFAULT 10,
  welcome_message TEXT DEFAULT 'Bienvenue sur Just-Law',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.platform_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert settings" ON public.platform_settings FOR INSERT WITH CHECK (public.is_admin());

-- INIT CONFIG
INSERT INTO public.platform_settings (id, maintenance_mode, commission_rate, welcome_message)
VALUES ('global', false, 15.0, 'Bienvenue sur la plateforme juridique')
ON CONFLICT (id) DO NOTHING;

-- ENABLE REAL-TIME SYNC
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_settings;
-- Note: assistance_tickets might already be in publication, but dropping it removes it from publication.
-- If the command fails, use the dashboard, otherwise try adding it back softly:
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'assistance_tickets'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE assistance_tickets;
    END IF;
  END
  $$;
COMMIT;
