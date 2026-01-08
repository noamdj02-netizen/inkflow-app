-- ============================================
-- FIX URGENT: Corriger la contrainte bookings_statut_booking_check
-- ============================================
-- Ce script corrige l'erreur "violates check constraint" lors du refus d'une réservation
-- 
-- INSTRUCTIONS:
-- 1. Allez sur https://supabase.com/dashboard
-- 2. Sélectionnez votre projet
-- 3. Allez dans SQL Editor
-- 4. Copiez-collez ce script complet
-- 5. Cliquez sur "Run"

-- Étape 1: Vérifier la contrainte actuelle (optionnel, pour debug)
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'bookings'::regclass 
-- AND conname = 'bookings_statut_booking_check';

-- Étape 2: Supprimer l'ancienne contrainte si elle existe
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_statut_booking_check;

-- Étape 3: Recréer la contrainte avec TOUS les statuts autorisés
ALTER TABLE bookings
ADD CONSTRAINT bookings_statut_booking_check 
CHECK (statut_booking IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'no_show'));

-- Étape 4: Mettre à jour la valeur par défaut
ALTER TABLE bookings
ALTER COLUMN statut_booking SET DEFAULT 'pending';

-- Étape 5: Vérifier que la contrainte a été créée correctement
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'bookings'::regclass 
-- AND conname = 'bookings_statut_booking_check';
-- 
-- Vous devriez voir: CHECK (statut_booking IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'no_show'))

-- ✅ La contrainte est maintenant corrigée !
-- Vous pouvez maintenant refuser des réservations sans erreur.

