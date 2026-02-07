-- Enregistrer l'envoi du rappel "2 jours restants" pour ne pas renvoyer
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'trial_reminder_sent_at') THEN
      ALTER TABLE public.users ADD COLUMN trial_reminder_sent_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;
