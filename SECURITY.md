# Sécurité et Gestion des Secrets

Ce document décrit les pratiques de gestion des secrets et les mesures à appliquer en cas d'exposition.

## Principes

- Aucun secret ne doit être committé dans le dépôt.
- Les variables serveur (clés Stripe secrètes, Supabase Service Role, webhooks, mots de passe DB) sont gérées via:
  - CI/CD (secrets GitHub Actions, etc.)
  - `supabase secrets set` pour les Edge Functions
  - Variables d'environnement sur le serveur (non versionnées)
- Côté client, seules les variables préfixées `VITE_` peuvent être exposées.

## Emplacements

- Public (OK à committer): `.env.example`, documentation sans valeurs réelles.
- Privé (jamais committé): `.env`, `.env.*.local`, secrets CI, variables serveur.

## Procédure en cas d'exposition

1. Révoquer / faire tourner immédiatement les secrets exposés (Stripe, Supabase, DB).
2. Remplacer les secrets dans les stores sécurisés (CI, `supabase secrets`).
3. Purger les références du code et des fichiers suivis.
4. Envisager une réécriture d'historique Git si l'exposition est large et récente.
5. Auditer les logs (Stripe, Supabase, serveur) pour activité suspecte.

## Prévention

- Hooks pre-commit (ggshield, git-secrets) pour détecter les secrets avant commit.
- `.gitignore` strict pour tous les fichiers `.env*` sauf `.env.example`.
- Revue de code axée sécurité (scripts de déploiement, docs) avant fusion.

## Déploiement sécurisé

- Scripts de déploiement doivent:
  - Échouer rapidement (`set -euo pipefail`).
  - Lire l'hôte/utilisateur/chemins depuis l'environnement.
  - Déployer de manière atomique (répertoire versionné + symlink).
  - Éviter les `chown -R` systématiques.
  - Utiliser un utilisateur non-root avec clé SSH.

## Contacts

Ouvrez une issue avec le label `security` ou contactez un mainteneur.
