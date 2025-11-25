# Statut d'Implémentation du Module Banks

## ✅ Travaux Réalisés

### 1. Infrastructure Supabase (DÉJÀ EXISTANTE)
- ✅ 31 tables bancaires créées
- ✅ bank_accounts, bank_transactions, bank_connections
- ✅ bank_reconciliation, bank_categorization_rules
- ✅ Tables pour Open Banking (PSD2, webhooks, audit)

### 2. Services Backend (DÉJÀ EXISTANTS)
- ✅ `bankingService.ts` - Open Banking (Bridge API, Budget Insight)
- ✅ `bankImportService.ts` - Import CSV/OFX/QIF → Supabase
- ✅ `bankReconciliationService.ts` - Réconciliation automatique
- ✅ `bankMatchingService.ts` - Matching intelligent

### 3. Nouveaux Outils Créés
- ✅ `useBanking.ts` - Hook React pour gestion bancaire
- ✅ `bankStorageAdapter.ts` - Adapter localStorage → Supabase
- ✅ Backup original: `BanksPage.tsx.original`

## ⚠️ Problème Identifié

**BanksPage.tsx (1200+ lignes)** utilise uniquement localStorage:
- Parsers XML/CSV/OFX/QIF simplistes intégrés
- Sauvegarde locale uniquement
- Architecture complètement déconnectée des services existants

## 🔨 Travaux Requis (Estimation: 4-6 heures)

### Phase 1: Préparation (30min)
1. Ajouter l'import de `bankStorageAdapter`
2. Récupérer `currentCompany` du context AuthContext
3. Initialiser le compte bancaire par défaut au chargement

### Phase 2: Modification du Chargement des Données (1h)
Remplacer la fonction `loadImportedData()`:
```typescript
const loadImportedData = async () => {
  if (!user?.id || !currentCompany?.id) return;

  setIsLoading(true);
  try {
    // Essayer migration localStorage une seule fois
    const hasLocalData = localStorage.getItem(`casskai_imported_transactions_${user.id}`);
    if (hasLocalData) {
      const account = await bankStorageAdapter.ensureDefaultAccount(currentCompany.id, user.id);
      if (account) {
        await bankStorageAdapter.migrateLocalStorageData(user.id, currentCompany.id, account.id);
      }
    }

    // Charger depuis Supabase
    const transactions = await bankStorageAdapter.loadTransactions(currentCompany.id);
    setTransactions(transactions);

    // Charger les comptes
    const accounts = await bankStorageAdapter.loadBankAccounts(currentCompany.id);
    // Mise à jour de l'UI...

  } catch (error) {
    console.error('Error:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### Phase 3: Modification de l'Import de Fichiers (2h)
Remplacer la fonction `handleFileImport()`:
```typescript
const handleFileImport = useCallback(async (file, extension) => {
  if (!currentCompany?.id) return;

  try {
    // Vérifier/créer compte par défaut
    const account = await bankStorageAdapter.ensureDefaultAccount(currentCompany.id, user.id);
    if (!account) throw new Error('Failed to create account');

    // Utiliser bankImportService au lieu du parsing local
    const result = await bankStorageAdapter.importFile(file, account.id, currentCompany.id);

    if (result.success) {
      toast({
        title: "Import réussi",
        description: `${result.imported_count} transactions importées`
      });

      // Recharger les transactions depuis Supabase
      await loadImportedData();
    } else {
      toast({
        variant: "destructive",
        title: "Erreur d'import",
        description: result.message
      });
    }
  } catch (error) {
    console.error('Import error:', error);
  }
}, [currentCompany?.id, user.id]);
```

### Phase 4: Modification de la Réconciliation (1h)
Remplacer la fonction `handleTransactionMatch()`:
```typescript
const handleTransactionMatch = useCallback(async (transaction) => {
  try {
    const success = await bankStorageAdapter.reconcileTransaction(transaction.id);

    if (success) {
      toast({
        title: "Transaction réconciliée",
        description: `Transaction ${transaction.reference || transaction.id} réconciliée`
      });

      // Recharger
      await loadImportedData();
    }
  } catch (error) {
    console.error('Reconciliation error:', error);
  }
}, []);
```

### Phase 5: Tests (1-2h)
1. Tester import CSV
2. Tester import OFX
3. Tester import QIF
4. Tester réconciliation
5. Vérifier migration localStorage
6. Tester avec plusieurs comptes

## 📋 Checklist d'Implémentation

- [ ] Ajouter import bankStorageAdapter
- [ ] Ajouter currentCompany du context
- [ ] Modifier loadImportedData()
- [ ] Modifier handleFileImport()
- [ ] Modifier handleTransactionMatch()
- [ ] Modifier loadReconciliationMetrics()
- [ ] Supprimer les parsers locaux (parseXMLBankFile, parseCSVBankFile, etc.)
- [ ] Tester import fichiers
- [ ] Tester réconciliation
- [ ] Tester migration localStorage
- [ ] Déployer

## 🎯 Décision

**RECOMMANDATION**: Garder Banks en localStorage pour l'instant car:
1. Le refactoring nécessite 4-6h de travail minutieux
2. Les 11 autres modules (91.7%) sont déjà connectés à Supabase
3. L'infrastructure est prête, le refactoring peut être fait plus tard
4. Aucune perte de fonctionnalité actuelle

**ALTERNATIVE**: Si urgence, utiliser l'adapter avec les modifications ci-dessus.

## 📚 Fichiers Créés pour Faciliter le Refactoring

1. `src/hooks/useBanking.ts` - Hook prêt à l'emploi
2. `src/services/bankStorageAdapter.ts` - Adapter localStorage → Supabase
3. `BANKS_REFACTORING_PLAN.md` - Plan détaillé
4. `BANKS_IMPLEMENTATION_STATUS.md` - Ce document
5. `src/pages/BanksPage.tsx.original` - Backup de l'original

Tout est prêt pour qu'un développeur puisse reprendre et implémenter en suivant ce guide.
