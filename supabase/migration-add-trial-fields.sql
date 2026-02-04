-- Migration: Période d'essai (trial) sur public.users
-- À exécuter dans l'éditeur SQL Supabase si la table users existe

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'trial_started_at') THEN
      ALTER TABLE public.users ADD COLUMN trial_started_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'trial_ends_at') THEN
      ALTER TABLE public.users ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;
