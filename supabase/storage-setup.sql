-- ============================================
-- Supabase Storage Configuration
-- ============================================
-- Ce script configure les buckets pour stocker les images de flashs et avatars

-- Créer le bucket pour les images de flashs
INSERT INTO storage.buckets (id, name, public)
VALUES ('flash-images', 'flash-images', true)
ON CONFLICT (id) DO NOTHING;

-- Créer le bucket pour les avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Politique RLS : Tout le monde peut lire les images (publiques)
CREATE POLICY "Flash images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'flash-images');

-- Politique RLS : Seuls les artistes authentifiés peuvent uploader
CREATE POLICY "Artists can upload flash images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'flash-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique RLS : Seuls les artistes peuvent modifier leurs propres images
CREATE POLICY "Artists can update own flash images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'flash-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique RLS : Seuls les artistes peuvent supprimer leurs propres images
CREATE POLICY "Artists can delete own flash images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'flash-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- POLITIQUES RLS POUR LE BUCKET AVATARS
-- ============================================

-- Politique RLS : Tout le monde peut lire les avatars (publiques)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Politique RLS : Seuls les artistes authentifiés peuvent uploader leurs avatars
CREATE POLICY "Artists can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique RLS : Seuls les artistes peuvent modifier leurs propres avatars
CREATE POLICY "Artists can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique RLS : Seuls les artistes peuvent supprimer leurs propres avatars
CREATE POLICY "Artists can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

