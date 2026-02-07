-- Reset UNIQUEMENT le schéma public (ne touche pas à auth.*).
-- À exécuter dans Supabase : SQL Editor → New query → Coller puis Run.
-- Ensuite en local : npx prisma db push

DO $$
BEGIN
  DROP SCHEMA IF EXISTS public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO postgres;
  GRANT ALL ON SCHEMA public TO public;
END $$;
