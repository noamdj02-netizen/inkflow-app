-- ============================================
-- Migration: Add Subscription Plans Support
-- ============================================
-- This migration adds the user_plan field to the artists table
-- to support FREE, STARTER, PRO, and STUDIO subscription tiers

-- Add user_plan column to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS user_plan TEXT DEFAULT 'FREE' 
CHECK (user_plan IN ('FREE', 'STARTER', 'PRO', 'STUDIO'));

-- Add index for plan-based queries
CREATE INDEX IF NOT EXISTS idx_artists_user_plan ON artists(user_plan);

-- Add comment for documentation
COMMENT ON COLUMN artists.user_plan IS 'Subscription plan: FREE (default), STARTER, PRO, or STUDIO';

-- Update existing artists to have FREE plan (if NULL)
UPDATE artists SET user_plan = 'FREE' WHERE user_plan IS NULL;
