-- Permettre les RDV manuels (réception, consultation, hors plateforme) sans flash_id ni project_id
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS is_manual_booking BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.bookings.is_manual_booking IS 'True pour RDV ajoutés manuellement (réception, consultation, hors plateforme)';

-- Remplacer la contrainte pour accepter (flash OU project) OU manuel
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS booking_type_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT booking_type_check CHECK (
    (flash_id IS NOT NULL AND project_id IS NULL AND (is_manual_booking IS NOT TRUE)) OR
    (flash_id IS NULL AND project_id IS NOT NULL AND (is_manual_booking IS NOT TRUE)) OR
    (is_manual_booking = true AND flash_id IS NULL AND project_id IS NULL)
  );
