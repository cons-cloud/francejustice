-- SCRIPT POUR PROMOUVOIR LE COMPTE francejustice@gmail.com EN TANT QU'ADMINISTRATEUR

-- Si le profil n'a pas été créé par le trigger ou existe déjà, on fait un upsert
INSERT INTO public.profiles (id, email, first_name, last_name, role, is_verified)
SELECT id, email, 'Admin', 'France Justice', 'admin', true
FROM auth.users
WHERE email = 'francejustice@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_verified = true;
