-- ============================================
-- Fix: Ajouter 'pending' et 'rejected' aux statuts autorisés pour bookings
-- ============================================

-- Supprimer l'ancienne contrainte CHECK
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_statut_booking_check;

-- Recréer la contrainte avec les nouveaux statuts
ALTER TABLE bookings
ADD CONSTRAINT bookings_statut_booking_check 
CHECK (statut_booking IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'no_show'));

-- Mettre à jour le default pour être 'pending' au lieu de 'confirmed'
ALTER TABLE bookings
ALTER COLUMN statut_booking SET DEFAULT 'pending';

-- Optionnel: Mettre à jour les bookings existants qui sont 'confirmed' mais devraient être 'pending'
-- (Si vous avez des données de test, vous pouvez décommenter cette ligne)
-- UPDATE bookings SET statut_booking = 'pending' WHERE statut_booking = 'confirmed' AND statut_paiement = 'pending';

