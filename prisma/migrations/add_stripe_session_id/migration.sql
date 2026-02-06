-- Migration: Ajouter stripeSessionId au modèle Booking
-- Date: 2024
-- Table name is lowercase "booking" (PostgreSQL default for unquoted identifiers).

-- Ajouter la colonne stripeSessionId si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'booking' AND column_name = 'stripeSessionId'
    ) THEN
        ALTER TABLE "booking" ADD COLUMN "stripeSessionId" TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS "booking_stripeSessionId_key" ON "booking"("stripeSessionId") WHERE "stripeSessionId" IS NOT NULL;
    END IF;
END $$;
