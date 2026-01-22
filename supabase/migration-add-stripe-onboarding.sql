-- ============================================
-- Migration: Add Stripe Onboarding Status
-- ============================================
-- This migration adds the stripe_onboarding_complete field to track
-- whether the artist has completed the Stripe Connect Express onboarding flow

-- Add stripe_onboarding_complete column to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN artists.stripe_onboarding_complete IS 'Whether the artist has completed Stripe Connect Express onboarding and can receive payments';

-- Update existing artists: if stripe_connected is true, assume onboarding is complete
UPDATE artists 
SET stripe_onboarding_complete = TRUE 
WHERE stripe_connected = TRUE AND stripe_onboarding_complete IS NULL;
