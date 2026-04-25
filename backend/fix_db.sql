-- SUPABASE ROBUST FIX SCRIPT V2

-- 1. Create a function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Clean up ALL potentially recursive policies
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admin full access" ON public.%I', t);
        
        -- Apply the ALL policy ONLY to tables other than profiles
        IF t != 'profiles' THEN
            EXECUTE format('CREATE POLICY "Admin full access" ON public.%I FOR ALL USING ( public.is_admin() )', t);
        END IF;
    END LOOP;
END $$;

-- 3. For profiles, define granular policies that do NOT apply to SELECT to avoid recursive evaluation
CREATE POLICY "Admin update profiles" ON public.profiles FOR UPDATE USING ( public.is_admin() );
CREATE POLICY "Admin delete profiles" ON public.profiles FOR DELETE USING ( public.is_admin() );
CREATE POLICY "Admin insert profiles" ON public.profiles FOR INSERT WITH CHECK ( public.is_admin() );
