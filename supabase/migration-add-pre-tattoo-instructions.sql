-- ============================================
-- Migration: Instructions avant tatouage (email J-2)
-- Objectif: Permettre à l'artiste de personnaliser les consignes pré-tattoo
-- Table: public.artists
-- ============================================

ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS pre_tattoo_instructions TEXT;

