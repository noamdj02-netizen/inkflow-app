-- Migration: Add Premium Subscription Support
-- This migration adds columns to support Stripe subscriptions and premium status

-- Add premium/subscription columns to artists table
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT,
ADD COLUMN IF NOT EXISTS user_plan TEXT DEFAULT 'free'; -- free, starter, pro, studio

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_artists_is_premium ON artists(is_premium);
CREATE INDEX IF NOT EXISTS idx_artists_stripe_customer_id ON artists(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_artists_stripe_subscription_id ON artists(stripe_subscription_id);

-- Optional: Create a dedicated subscriptions table for better tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL, -- active, canceled, past_due, incomplete, etc.
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for subscriptions table
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create updated_at trigger for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriptions_updated_at();

-- Enable RLS on subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Comments
COMMENT ON COLUMN artists.is_premium IS 'Whether the user has an active premium subscription';
COMMENT ON COLUMN artists.premium_until IS 'Date until which premium access is valid';
COMMENT ON COLUMN artists.stripe_customer_id IS 'Stripe Customer ID';
COMMENT ON COLUMN artists.stripe_subscription_id IS 'Stripe Subscription ID';
COMMENT ON COLUMN artists.stripe_subscription_status IS 'Status of Stripe subscription (active, canceled, etc.)';
COMMENT ON COLUMN artists.user_plan IS 'User plan: free, starter, pro, studio';
