-- Migration: Ajout des champs d'abonnement Stripe à la table users
-- Date: 2026-02-02

-- Ajouter les colonnes d'abonnement si elles n'existent pas déjà
DO $$ 
BEGIN
  -- Enum pour les plans d'abonnement
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE subscription_plan AS ENUM ('STARTER', 'PRO', 'STUDIO');
  END IF;

  -- Enum pour le statut d'abonnement
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM (
      'active',
      'trialing',
      'past_due',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'unpaid'
    );
  END IF;
END $$;

-- Ajouter les colonnes à la table users (si elle existe)
-- Note: Si vous utilisez Supabase Auth, la table users peut être dans auth.users
-- Cette migration suppose une table public.users liée à auth.users via id

-- Vérifier si la table users existe dans public
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Ajouter les colonnes si elles n'existent pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'stripe_customer_id') THEN
      ALTER TABLE public.users ADD COLUMN stripe_customer_id TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'stripe_subscription_id') THEN
      ALTER TABLE public.users ADD COLUMN stripe_subscription_id TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'subscription_plan') THEN
      ALTER TABLE public.users ADD COLUMN subscription_plan subscription_plan;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'subscription_status') THEN
      ALTER TABLE public.users ADD COLUMN subscription_status subscription_status;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'subscription_current_period_end') THEN
      ALTER TABLE public.users ADD COLUMN subscription_current_period_end TIMESTAMPTZ;
    END IF;

    -- Créer les index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);
    CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
    CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON public.users(subscription_plan);
  END IF;
END $$;

-- Si vous utilisez Supabase Auth et que vous avez une table artists liée à auth.users,
-- vous pouvez aussi ajouter les colonnes à artists si nécessaire
-- (dans ce cas, l'abonnement serait géré au niveau de l'artiste, pas de l'utilisateur)

-- Note: Pour Supabase, vous devrez peut-être créer une fonction RLS (Row Level Security)
-- pour permettre aux utilisateurs de lire/mettre à jour leurs propres données d'abonnement
