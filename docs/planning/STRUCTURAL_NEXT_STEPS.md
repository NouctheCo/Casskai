# Roadmap Refactors Structurels (Q4 2025)

## 1. Pages front volumineuses
- **Decouper** `src/pages/BanksPage.tsx`, `ProjectsPage.tsx`, `LandingPage.tsx` en sous-modules chargeables dynamiquement.
- **Extraire** la logique metier vers des hooks/services dedies (ex. `useBanks`, `useProjectsBoard`).
- **Cibler** une taille maximale de ~400 lignes par composant de page.
- **Prevoir** des tests unitaires pour chaque hook nouvellement extrait.

## 2. Backend Stripe & API
- **Modulariser** `backend/server.js` en dossiers `routes/`, `controllers/`, `services/`.
- **Uniformiser** la gestion des erreurs et reponses JSON (middleware commun).
- **Revoir** la configuration Stripe (variables d-env, logging) et ajouter des tests d-integration supertest.
- **Capitaliser** sur la bascule des services critiques (email + scheduler) vers l-API interne et archiver les Edge Functions historiques.

## 3. Transactionnalisation comptabilite
- **Creer** une procedure SQL/RPC `create_journal_entry_with_lines` (transaction atomique).
- **Adapter** `useAccounting` pour utiliser cette procedure et gerer les retours d-erreurs.
- **Ajouter** des tests (Vitest) simulant des ecritures equilibrees / desequilibrees.
- **Prevoir** un rollback clair cote UI avec toasts explicites.

## 4. Qualite & tests
- **Documenter** les conventions lint (suppression `any`, `console.*`). 
- **Preparer** une campagne de tests e2e Playwright : onboarding multi-utilisateur, upgrade plan, compta transactionnelle.
- **Suivre** les progres dans un tableau Kanban (Notion/Jira) afin d-etaler ces refactors sur plusieurs sprints.
