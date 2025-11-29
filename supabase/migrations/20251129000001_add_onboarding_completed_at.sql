-- Migration: Ajouter colonne onboarding_completed_at à companies
-- Date: 2025-11-29
-- Description: Permet de tracker quand l'onboarding a été terminé

-- Ajouter la colonne onboarding_completed_at si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'onboarding_completed_at'
  ) THEN
    ALTER TABLE public.companies 
    ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    
    COMMENT ON COLUMN public.companies.onboarding_completed_at IS 
      'Date et heure de complétion du processus d''onboarding pour cette entreprise';
  END IF;
END $$;

-- Mettre à jour les entreprises existantes qui ont un owner_id
-- (elles ont déjà passé l'onboarding avant la migration)
UPDATE public.companies
SET onboarding_completed_at = created_at
WHERE onboarding_completed_at IS NULL 
  AND owner_id IS NOT NULL
  AND created_at < NOW() - INTERVAL '1 hour';

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_companies_onboarding_completed 
ON public.companies (onboarding_completed_at) 
WHERE onboarding_completed_at IS NOT NULL;
