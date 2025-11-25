# Plan de Refactoring du Module Banks

## État Actuel
- **BanksPage.tsx** : 1200+ lignes, utilise localStorage uniquement
- **Infrastructure Supabase** : 31 tables bancaires déjà créées
- **Services existants** :
  - bankingService.ts (Open Banking avec Bridge API)
  - bankImportService.ts (Import CSV/OFX/QIF vers Supabase)
  - bankReconciliationService.ts
  - bankMatchingService.ts

## Problème
BanksPage n'utilise AUCUN de ces services - architecture complètement déconnectée.

## Solutions

### Option 1: Refactoring complet (RECOMMANDÉ mais ~3h de travail)
1. Créer hook `useBanking` ✅ FAIT
2. Remplacer tout le code localStorage par useBanking
3. Utiliser bankImportService pour les imports
4. Connecter à toutes les tables Supabase
5. Bénéficier de toutes les fonctionnalités (réconciliation, catégorisation auto, etc.)

**Avantages:**
- Architecture cohérente avec le reste de l'app
- Données synchronisées entre appareils
- Backup automatique
- Toutes les fonctionnalités Open Banking disponibles

**Inconvénients:**
- Temps de développement important
- Tests approfondis nécessaires
- Migration des données localStorage existantes

### Option 2: Approche hybride simple (~30min)
1. Garder BanksPage tel quel
2. Ajouter un layer de synchronisation localStorage ↔ Supabase
3. Au chargement: localStorage → Supabase (si données existent)
4. Après import: fichier → localStorage → Supabase

**Avantages:**
- Rapide à implémenter
- Pas de refactoring majeur
- Garde l'UI actuelle

**Inconvénients:**
- Dette technique
- Double système de stockage
- Pas d'accès aux fonctionnalités avancées

## Décision Utilisateur
**Option 2** choisie pour gagner du temps.

## Implémentation Option 2

### Étape 1: Créer un service de sync localStorage/Supabase
```typescript
// src/services/bankLocalStorageSync.ts
```

### Étape 2: Hook dans BanksPage
```typescript
// Ajouter useEffect pour sync au chargement
useEffect(() => {
  syncLocalStorageToSupabase();
}, []);
```

### Étape 3: Hook après import fichier
```typescript
// Après chaque import localStorage, sync vers Supabase
await syncTransactionsToSupabase(transactions);
```

## État
- useBanking hook créé ✅
- En attente de décision sur approche finale
- Option 2 en cours d'implémentation
