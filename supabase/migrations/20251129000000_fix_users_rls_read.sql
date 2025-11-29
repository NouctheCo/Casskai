-- Migration: Corriger les politiques RLS pour public.users
-- Date: 2025-11-29
-- Description: Permet aux utilisateurs authentifiés de lire leur propre profil

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Activer RLS sur la table users si ce n'est pas déjà fait
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Créer la politique de lecture : chaque utilisateur peut lire son propre profil
CREATE POLICY "Users can read own profile" 
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Créer la politique de mise à jour : chaque utilisateur peut mettre à jour son propre profil
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Créer la politique d'insertion : permettre la création lors de l'inscription
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Commentaire pour documentation
COMMENT ON TABLE public.users IS 'Table des profils utilisateurs avec RLS activé - lecture/écriture limitée au propriétaire';
