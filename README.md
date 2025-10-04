# CassKai

CassKai est une plateforme de gestion financiere et de pilotage pour PME et independants. L application propose un tableau de bord unique pour la facturation, la comptabilite, l analyse de flux de tresorerie et l automatisation de processus via Supabase et Stripe.

## Fonctionnalites principales
- Tableau de bord consolidant chiffre d affaires, depenses et indicateurs previsionnels
- Modules de facturation, reconciliation bancaire et gestion d abonnements Stripe
- Automatisation des workflows critiques (onboarding, relances, rapports financiers)
- Support multilingue avec i18next et generation de documents (PDF, Excel)
- Integration Supabase pour l authentification, les donnees metier et les fonctions serverless

## Stack technique
- Frontend: React 18, TypeScript, Vite, TailwindCSS, Radix UI, Vitest/Playwright
- Backend: API Node/Express (dossier `backend/`) pour les webhooks Stripe et la synchronisation avec Supabase
- Services tiers: Supabase (Postgres + Auth), Stripe (paiements et abonnements), OpenAI/Tensorflow pour les analyses avancees

## Prerequis
- Node.js >= 18 et npm >= 8
- Acces a un projet Supabase configure (URL + Anon Key pour le frontend)
- Compte Stripe avec cles API et secret de webhook
- Supabase CLI installe pour configurer les Edge Functions (`npm install -g supabase`)

## ⚠️ Configuration Securisee IMPORTANTE

**Les secrets ne doivent JAMAIS etre commites dans le code.** Voir les guides suivants :
- 📘 [SECURITY_CONFIGURATION_GUIDE.md](SECURITY_CONFIGURATION_GUIDE.md) - Guide complet de configuration
- 📋 [SECURITY_FIXES_SUMMARY.md](SECURITY_FIXES_SUMMARY.md) - Resume des corrections de securite
- 🔧 Scripts d'aide : `scripts/configure-secrets.sh` (Linux/macOS) ou `scripts/configure-secrets.ps1` (Windows)

## Mise en route rapide
1. Cloner le depot puis installer les dependances du frontend:
   ```bash
   npm install
   ```
2. Copier le fichier `.env.example` en `.env` puis renseigner les variables requises (Supabase, Stripe, URL d application, etc.).
3. Lancer le front en developpement:
   ```bash
   npm run dev
   ```
4. (Optionnel) Installer et lancer l API Stripe:
   ```bash
   cd backend
   npm install
   cp .env.example .env # puis completer les cles Stripe/Supabase
   npm run dev
   ```
5. Executer les tests unitaires et e2e selon les besoins:
   ```bash
   npm run test        # Vitest
   npm run test:e2e    # Playwright
   ```

## Structure du projet
- `src/` : composants React, services, hooks et styles
- `scripts/` : scripts de maintenance (diagnostics, migrations, tests de flux critiques)
- `backend/` : micro-service Stripe (webhooks, portail client, securite)
- `docs/` : documentation fonctionnelle et technique
- `_cleanup_backup/` : copie de sauvegarde temporaire des artefacts et fichiers archives (peut etre supprimee une fois le menage valide)

## Conseils de developpement
- Utiliser `npm run type-check` avant tout commit pour garantir la coherence TypeScript
- Garder les artefacts temporaires hors du depot (rapports Playwright, resultats de tests, logs) grace aux entrees dans `.gitignore`
- S appuyer sur la documentation du dossier `docs/` (performances, strategie de tests, exigences securite)

## Deploiement
- Scripts disponibles dans `scripts/deploy.sh` et documentation associee dans `docs/`
- Le backend peut etre deploye sur Railway, Vercel ou un VPS (voir `backend/README.md`)
- Penser a configurer les secrets Supabase et Stripe sur chaque environnement (staging, production)

## License
Projet sous licence MIT.
