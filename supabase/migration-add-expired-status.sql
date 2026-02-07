-- Ajouter la valeur 'expired' à l'enum subscription_status (Supabase)
-- À exécuter dans l'éditeur SQL Supabase si l'enum existe déjà

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'expired';
  END IF;
END $$;
