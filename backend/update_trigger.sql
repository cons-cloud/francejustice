-- SCRIPT POUR METTRE A JOUR LE TRIGGER DE CREATION DE COMPTE (SIGNUP)
-- Ce script permet à Supabase de récupérer toutes les informations du formulaire
-- (ville, téléphone, infos avocats...) envoyées lors de l'inscription pour les
-- enregistrer automatiquement et sans erreur de droits d'accès RLS.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Extract role, defaults to 'user'
  v_role := coalesce(new.raw_user_meta_data->>'role', 'user');

  -- 1. Insert into profiles with all metadata
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_verified, 
    phone, 
    city, 
    country, 
    postal_code, 
    birth_date
  )
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    v_role,
    false,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'postal_code',
    new.raw_user_meta_data->>'birth_date'
  );

  -- 2. If it's a lawyer, also automatically create their lawyers row!
  IF v_role = 'lawyer' THEN
    INSERT INTO public.lawyers (
      id,
      bar_association,
      license_number,
      experience_years,
      is_available
    ) VALUES (
      new.id,
      coalesce(new.raw_user_meta_data->>'bar_association', ''),
      coalesce(new.raw_user_meta_data->>'license_number', ''),
      NULLIF(new.raw_user_meta_data->>'experience', '')::integer,
      true
    );
  END IF;

  RETURN new;
END;
$$;
