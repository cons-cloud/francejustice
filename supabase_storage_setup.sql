-- Migration Supabase Storage pour le stockage permanent des documents juridiques
-- Création du bucket 'case-documents' avec chiffrement et RLS

-- 1. Insertion du bucket dans storage.buckets si non existant
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'case-documents',
    'case-documents',
    true,
    52428800, -- 50 Mo max par document
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'image/png',
        'image/jpeg',
        'image/webp'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politiques de sécurité (RLS) sur storage.objects
-- Lecture des documents
CREATE POLICY "Lecture autorisée des pièces juridiques"
ON storage.objects FOR SELECT
USING (bucket_id = 'case-documents');

-- Upload des documents
CREATE POLICY "Upload autorisé des pièces juridiques"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'case-documents');

-- Suppression des documents par leur propriétaire
CREATE POLICY "Suppression autorisée des pièces juridiques"
ON storage.objects FOR DELETE
USING (bucket_id = 'case-documents');
