-- Migration: Empêcher strictement les créneaux en double (overlap) pour un même artiste
-- Deux réservations ne peuvent pas se chevaucher si statut_booking IN ('pending', 'confirmed')

CREATE OR REPLACE FUNCTION check_booking_no_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  overlap_count INTEGER;
BEGIN
  -- Ne vérifier que pour les statuts qui "bloquent" le créneau
  IF NEW.statut_booking NOT IN ('pending', 'confirmed') THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO overlap_count
  FROM public.bookings
  WHERE artist_id = NEW.artist_id
    AND id IS DISTINCT FROM NEW.id
    AND statut_booking IN ('pending', 'confirmed')
    AND date_debut < NEW.date_fin
    AND date_fin > NEW.date_debut;

  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'booking_overlap: Ce créneau chevauche une réservation existante.'
      USING ERRCODE = '23P01'; -- exclusion_violation
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_booking_no_overlap ON public.bookings;
CREATE TRIGGER trigger_check_booking_no_overlap
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE PROCEDURE check_booking_no_overlap();

COMMENT ON FUNCTION check_booking_no_overlap() IS 'Empêche deux réservations (pending/confirmed) de se chevaucher pour le même artiste';
