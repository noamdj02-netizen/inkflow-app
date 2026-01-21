-- ============================================
-- Migration: Artist theme customization (hex colors)
-- Objectif:
-- - Permettre à l'artiste de personnaliser l'accent + un secondaire (gradient/glow)
-- ============================================

ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS theme_accent_hex TEXT;

ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS theme_secondary_hex TEXT;

