-- Migration: Refactor table bookings pour Cal.com
-- Date: 2026-02-04

-- Ajouter les colonnes nécessaires si elles n'existent pas
DO $$ 
BEGIN
  -- Type de réservation (flash ou project)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'type'
  ) THEN
    ALTER TABLE bookings ADD COLUMN type TEXT CHECK (type IN ('flash', 'project'));
  END IF;

  -- ID de réservation Cal.com
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'cal_com_booking_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cal_com_booking_id TEXT UNIQUE;
  END IF;

  -- scheduled_at (remplace date_debut si nécessaire)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'scheduled_at'
  ) THEN
    -- Si date_debut existe, créer scheduled_at à partir de date_debut
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'date_debut'
    ) THEN
      ALTER TABLE bookings ADD COLUMN scheduled_at TIMESTAMPTZ;
      UPDATE bookings SET scheduled_at = date_debut WHERE scheduled_at IS NULL;
    ELSE
      ALTER TABLE bookings ADD COLUMN scheduled_at TIMESTAMPTZ NOT NULL;
    END IF;
  END IF;

  -- duration_minutes (remplace duree_minutes si nécessaire)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'duration_minutes'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'duree_minutes'
    ) THEN
      ALTER TABLE bookings ADD COLUMN duration_minutes INTEGER;
      UPDATE bookings SET duration_minutes = duree_minutes WHERE duration_minutes IS NULL;
    ELSE
      ALTER TABLE bookings ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 60;
    END IF;
  END IF;

  -- acompte_amount (remplace deposit_amount si nécessaire)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'acompte_amount'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'deposit_amount'
    ) THEN
      ALTER TABLE bookings ADD COLUMN acompte_amount DECIMAL(10,2);
      UPDATE bookings SET acompte_amount = deposit_amount / 100.0 WHERE acompte_amount IS NULL;
    ELSE
      ALTER TABLE bookings ADD COLUMN acompte_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
  END IF;

  -- acompte_paid (remplace deposit_paid si nécessaire)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'acompte_paid'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'deposit_paid'
    ) THEN
      ALTER TABLE bookings ADD COLUMN acompte_paid BOOLEAN DEFAULT FALSE;
      UPDATE bookings SET acompte_paid = deposit_paid WHERE acompte_paid IS NULL;
    ELSE
      ALTER TABLE bookings ADD COLUMN acompte_paid BOOLEAN DEFAULT FALSE;
    END IF;
  END IF;

  -- stripe_payment_intent_id (remplace stripe_deposit_intent_id si nécessaire)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'stripe_deposit_intent_id'
    ) THEN
      ALTER TABLE bookings ADD COLUMN stripe_payment_intent_id TEXT;
      UPDATE bookings SET stripe_payment_intent_id = stripe_deposit_intent_id WHERE stripe_payment_intent_id IS NULL;
    ELSE
      ALTER TABLE bookings ADD COLUMN stripe_payment_intent_id TEXT;
    END IF;
  END IF;

  -- status (remplace statut_booking si nécessaire)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'status'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'statut_booking'
    ) THEN
      ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));
      UPDATE bookings SET status = statut_booking WHERE status IS NULL;
    ELSE
      ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));
    END IF;
  END IF;

  -- confirmed_by_artist_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'confirmed_by_artist_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN confirmed_by_artist_at TIMESTAMPTZ;
  END IF;
END $$;

-- Ajouter les champs pour projets custom si nécessaire
DO $$
BEGIN
  -- project_description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'project_description'
  ) THEN
    ALTER TABLE bookings ADD COLUMN project_description TEXT;
  END IF;

  -- project_zone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'project_zone'
  ) THEN
    ALTER TABLE bookings ADD COLUMN project_zone TEXT;
  END IF;

  -- project_taille
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'project_taille'
  ) THEN
    ALTER TABLE bookings ADD COLUMN project_taille TEXT;
  END IF;

  -- project_budget
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'project_budget'
  ) THEN
    ALTER TABLE bookings ADD COLUMN project_budget DECIMAL(10,2);
  END IF;

  -- reference_images
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'reference_images'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reference_images TEXT[];
  END IF;
END $$;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_bookings_cal_com_booking_id ON bookings(cal_com_booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(type);

-- Commentaires pour documentation
COMMENT ON COLUMN bookings.type IS 'Type de réservation: flash ou project';
COMMENT ON COLUMN bookings.cal_com_booking_id IS 'ID de la réservation Cal.com (unique)';
COMMENT ON COLUMN bookings.scheduled_at IS 'Date et heure du rendez-vous';
COMMENT ON COLUMN bookings.duration_minutes IS 'Durée du rendez-vous en minutes';
COMMENT ON COLUMN bookings.acompte_amount IS 'Montant de l''acompte en euros';
COMMENT ON COLUMN bookings.acompte_paid IS 'Indique si l''acompte a été payé';
COMMENT ON COLUMN bookings.status IS 'Statut de la réservation: pending, confirmed, cancelled, completed';
