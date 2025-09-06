# CassKai - Configuration et Commandes

## Déploiement
- **Commande de déploiement** : `npm run deploy`
- **Type-check** : `npm run type-check`
- **Build** : `npm run build`

## État TypeScript
Il reste des erreurs TypeScript complexes liées à :
- Conflits de types entre `ai.types` et `ai-types`
- Types de base de données manquants
- Imports et déclarations dupliquées

**Solution recommandée** : Configurer TypeScript avec `skipLibCheck: true` temporairement pour le déploiement, et nettoyer les types progressivement.

## Corrections urgentes à faire :
1. Unifier les types AI dans un seul fichier (`ai-types.ts`)
2. Nettoyer les déclarations globales dupliquées
3. Vérifier les imports de services (`journalEntriesService` vs `journalEntryService`)

## Architecture déployée :
- **VPS** : 89.116.111.88
- **Domaine** : https://casskai.app
- **SSL** : Let's Encrypt avec Nginx
- **Frontend** : React/Vite servi par Nginx