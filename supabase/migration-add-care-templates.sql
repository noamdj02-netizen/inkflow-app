-- ============================================
-- Migration: Care templates + Project care fields
-- Objectif:
-- - CRUD de templates "soins" par artiste
-- - Lier un project à un template + notes custom
-- - Tracker l'envoi (care_sent_at)
-- ============================================

-- 1) Table care_templates
CREATE TABLE IF NOT EXISTS public.care_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_templates_artist_id ON public.care_templates(artist_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_care_templates_updated_at ON public.care_templates;
CREATE TRIGGER update_care_templates_updated_at BEFORE UPDATE ON public.care_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.care_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artists can manage own care templates" ON public.care_templates;
CREATE POLICY "Artists can manage own care templates" ON public.care_templates
  FOR ALL USING (artist_id::text = auth.uid()::text)
  WITH CHECK (artist_id::text = auth.uid()::text);

-- 2) Colonnes sur projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS care_template_id UUID REFERENCES public.care_templates(id) ON DELETE SET NULL;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS custom_care_instructions TEXT;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS care_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_projects_care_template_id ON public.projects(care_template_id);

