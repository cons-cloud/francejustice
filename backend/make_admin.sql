-- SCRIPT POUR PROMOUVOIR LE COMPTE justlaw@gmail.com EN TANT QU'ADMINISTRATEUR

-- Si le profil n'a pas été créé par le trigger ou existe déjà, on fait un upsert
INSERT INTO public.profiles (id, email, first_name, last_name, role, is_verified)
SELECT id, email, 'Admin', 'JustLaw', 'admin', true
FROM auth.users
WHERE email = 'justlaw@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_verified = true;
