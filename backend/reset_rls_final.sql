-- ==============================================================================
-- CORRECTION DÉFINITIVE : BOUCLE INFINIE RLS "PROFILES" (ERREUR 500)
-- ==============================================================================

-- 1. On crée une fonction hautement sécurisée qui contourne le RLS 
-- pour lire le rôle de l'utilisateur sans déclencher de boucle.
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = user_id;
$$;

-- 2. On supprime ABSOLUMENT TOUTES les stratégies (policies) actuelles 
-- de la table profiles, car l'une d'elles provoque la boucle infinie de l'erreur 500.
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 3. On réactive le RLS proprement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Nouvelles règles saines (Aucune ne boucle sur elle-même) :

-- A) Tout le monde peut lire les profils (Arrête la boucle de sécurité)
CREATE POLICY "Public read profiles" ON public.profiles 
FOR SELECT USING (true);

-- B) L'utilisateur peut s'inscrire / créer son propre profil
CREATE POLICY "Users insert own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- C) L'utilisateur peut modifier son profil, OU l'Admin peut le faire (ex: approuver un avocat)
CREATE POLICY "Users and Admins update profiles" ON public.profiles 
FOR UPDATE USING (
  auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin'
);

-- D) Seul l'Admin peut supprimer un compte
CREATE POLICY "Admins delete profiles" ON public.profiles 
FOR DELETE USING (
  public.get_user_role(auth.uid()) = 'admin'
);
