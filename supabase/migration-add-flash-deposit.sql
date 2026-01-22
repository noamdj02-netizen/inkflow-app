-- ============================================
-- Migration: Add deposit_amount to flashs table
-- ============================================
-- This migration adds a deposit_amount field to the flashs table
-- to allow artists to set a specific deposit amount for each flash
-- If NULL, the deposit will be calculated from prix * deposit_percentage

-- Add deposit_amount column to flashs table
ALTER TABLE flashs 
ADD COLUMN IF NOT EXISTS deposit_amount INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN flashs.deposit_amount IS 'Deposit amount in centimes. If NULL, calculated from prix * artist.deposit_percentage';

-- For existing flashs, we can calculate deposit_amount from prix and artist deposit_percentage
-- But we'll leave it NULL for now and calculate it dynamically in the application
