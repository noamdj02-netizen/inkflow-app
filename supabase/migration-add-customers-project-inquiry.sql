-- ============================================
-- Migration: Customers + Project INQUIRY
-- Objectif:
-- - Créer une table customers (unique par email)
-- - Lier projects -> customers
-- - Ajouter deposit_paid sur projects
-- - Ajouter le statut 'inquiry' (équivalent "INQUIRY")
-- ============================================

-- 1) Table customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger updated_at (si la fonction existe déjà dans votre schéma)
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (pas de policy publique; insert via service role/edge function)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 2) Colonnes sur projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON public.projects(customer_id);

-- 3) Statut 'inquiry' (on garde aussi 'pending' pour compat legacy)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'projects_statut_check'
      AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects DROP CONSTRAINT projects_statut_check;
  END IF;
END $$;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_statut_check
  CHECK (statut IN ('pending', 'inquiry', 'approved', 'rejected', 'quoted'));

-- Nouveau défaut: inquiry
ALTER TABLE public.projects
  ALTER COLUMN statut SET DEFAULT 'inquiry';

