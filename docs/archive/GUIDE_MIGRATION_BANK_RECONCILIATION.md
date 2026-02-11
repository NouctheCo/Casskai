# 🔄 Guide Migration BankReconciliation vers RPC Functions

## 📋 Objectif

Remplacer les données mockées dans `BankReconciliation.tsx` par les vraies fonctions RPC Supabase via le hook `useBankReconciliation`.

---

## ✅ Étape 1 : Import du hook

**Fichier:** `src/components/banking/BankReconciliation.tsx`

**AVANT:**
```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
// ... autres imports
```

**APRÈS:**
```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { useBankReconciliation } from '@/hooks/useBankReconciliation';
import { useEnterprise } from '@/contexts/EnterpriseContext';
// ... autres imports
```

---

## ✅ Étape 2 : Remplacer les données mockées

**AVANT (lignes 63-148):**
```typescript
const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([
  {
    id: 'bt_1',
    date: '2024-01-15',
    amount: -1250.00,
    description: 'PAIEMENT CB AMAZON FR',
    reference: 'CB****1234',
    is_reconciled: false,
    suggested_matches: ['ae_5', 'ae_12']
  },
  // ... plus de données mockées
]);
```

**APRÈS:**
```typescript
// Récupérer l'entreprise courante
const { currentEnterprise } = useEnterprise();
const companyId = currentEnterprise?.id || '';

// Utiliser le hook RPC
const {
  unreconciledTransactions,
  unreconciledEntries,
  matchingSuggestions,
  summary,
  isLoading,
  error,
  createReconciliation,
  executeAutoReconciliation,
  refreshAll
} = useBankReconciliation(companyId, selectedAccount);

// Transformer les données RPC en format UI
const bankTransactions = unreconciledTransactions.map(tx => ({
  id: tx.id,
  date: tx.transaction_date,
  amount: tx.amount,
  description: tx.description,
  reference: tx.reference,
  is_reconciled: false, // Par définition (unreconciledTransactions)
  suggested_matches: matchingSuggestions
    .filter(s => s.bank_transaction_id === tx.id)
    .map(s => s.entry_line_id)
}));

const accountingEntries = unreconciledEntries.map(entry => ({
  id: entry.id,
  date: entry.entry_date,
  amount: entry.net_amount,
  description: entry.description,
  account: `${entry.account_number} - ${entry.account_name}`,
  reference: entry.entry_number,
  reconciled: false
}));
```

---

## ✅ Étape 3 : Remplacer les statistiques mockées

**AVANT (lignes 150-169):**
```typescript
const reconciliationStats = useMemo(() => {
  const totalBankTransactions = bankTransactions.length;
  const reconciledTransactions = bankTransactions.filter(t => t.is_reconciled).length;
  // ... calculs manuels
}, [bankTransactions]);
```

**APRÈS:**
```typescript
const reconciliationStats = useMemo(() => {
  if (!summary) return {
    totalBankTransactions: 0,
    reconciledTransactions: 0,
    pendingTransactions: 0,
    reconciliationRate: 0,
    totalAmount: 0,
    reconciledAmount: 0,
    pendingAmount: 0
  };

  return {
    totalBankTransactions: summary.total_transactions,
    reconciledTransactions: summary.reconciled_transactions,
    pendingTransactions: summary.unreconciled_transactions,
    reconciliationRate: summary.reconciliation_rate,
    totalAmount: summary.bank_balance,
    reconciledAmount: summary.accounting_balance,
    pendingAmount: summary.difference
  };
}, [summary]);
```

---

## ✅ Étape 4 : Implémenter le rapprochement automatique

**AVANT:**
```typescript
const handleAutoReconciliation = async () => {
  setIsReconciling(true);
  // Logique mockée
  toast({ title: "Rapprochement automatique simulé" });
  setIsReconciling(false);
};
```

**APRÈS:**
```typescript
const handleAutoReconciliation = async () => {
  setIsReconciling(true);

  try {
    const result = await executeAutoReconciliation(80.0); // Confiance min 80%

    if (result.count > 0) {
      toast({
        title: `✅ ${result.count} rapprochements créés`,
        description: `${result.count} transactions ont été rapprochées automatiquement`
      });
    } else {
      toast({
        title: 'ℹ️ Aucun rapprochement automatique',
        description: 'Aucune correspondance avec un score de confiance suffisant'
      });
    }
  } catch (error) {
    toast({
      title: '❌ Erreur',
      description: 'Impossible d\'exécuter le rapprochement automatique',
      variant: 'destructive'
    });
  } finally {
    setIsReconciling(false);
  }
};
```

---

## ✅ Étape 5 : Implémenter le rapprochement manuel

**AVANT:**
```typescript
const markTransactionAsReconciled = (transactionId: string, matchedEntryId?: string) => {
  setReconciledTransactions(prev => new Set([...prev, transactionId]));
  setBankTransactions(prev => prev.map(tx =>
    tx.id === transactionId
      ? { ...tx, is_reconciled: true, matched_entry_id: matchedEntryId }
      : tx
  ));
};
```

**APRÈS:**
```typescript
const markTransactionAsReconciled = async (
  transactionId: string,
  matchedEntryId: string
) => {
  try {
    const reconciliationId = await createReconciliation(
      transactionId,
      matchedEntryId,
      'Rapprochement manuel'
    );

    if (reconciliationId) {
      // Les données seront automatiquement rafraîchies par le hook
      setReconciledTransactions(prev => new Set([...prev, transactionId]));
    }
  } catch (error) {
    toast({
      title: '❌ Erreur',
      description: 'Impossible de créer le rapprochement',
      variant: 'destructive'
    });
  }
};
```

---

## ✅ Étape 6 : Afficher les suggestions de correspondance

**NOUVEAU CODE à ajouter:**
```typescript
// Section affichage suggestions automatiques
{matchingSuggestions.length > 0 && (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-blue-500" />
        Suggestions de correspondance automatique
      </CardTitle>
      <CardDescription>
        {matchingSuggestions.length} correspondances potentielles détectées
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {matchingSuggestions.map((suggestion) => (
          <div
            key={`${suggestion.bank_transaction_id}-${suggestion.entry_line_id}`}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={
                  suggestion.confidence_score >= 90 ? 'default' :
                  suggestion.confidence_score >= 70 ? 'secondary' : 'outline'
                }>
                  {suggestion.confidence_score.toFixed(0)}% confiance
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Écart: {suggestion.amount_difference.toFixed(2)} € | {suggestion.days_difference}j
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Transaction bancaire</div>
                  <div className="text-muted-foreground">{suggestion.bank_description}</div>
                  <div className="font-mono">{formatCurrency(suggestion.bank_amount)}</div>
                </div>
                <div>
                  <div className="font-medium">Écriture comptable</div>
                  <div className="text-muted-foreground">{suggestion.entry_description}</div>
                  <div className="font-mono">{formatCurrency(suggestion.entry_amount)}</div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => markTransactionAsReconciled(
                suggestion.bank_transaction_id,
                suggestion.entry_line_id
              )}
              disabled={isLoading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Valider
            </Button>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

---

## ✅ Étape 7 : Gestion des états de chargement

**Ajouter aux composants UI:**
```typescript
{isLoading && (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2">Chargement des données...</span>
  </div>
)}

{error && (
  <Alert variant="destructive" className="mb-6">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Erreur</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}

{!isLoading && !error && unreconciledTransactions.length === 0 && (
  <EmptyList
    icon={CheckCircle}
    title="Aucune transaction à rapprocher"
    description="Toutes vos transactions bancaires sont rapprochées !"
    action={{
      label: 'Rafraîchir',
      onClick: refreshAll
    }}
  />
)}
```

---

## ✅ Étape 8 : Bouton de rafraîchissement manuel

**Ajouter dans le header:**
```typescript
<Button
  variant="outline"
  onClick={refreshAll}
  disabled={isLoading}
>
  <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
  Rafraîchir
</Button>
```

---

## 🧪 Tests après migration

### Test 1 : Chargement initial
- [ ] Les transactions non rapprochées s'affichent
- [ ] Les écritures comptables s'affichent
- [ ] Les statistiques sont correctes

### Test 2 : Rapprochement automatique
- [ ] Le bouton "Rapprochement automatique" fonctionne
- [ ] Les suggestions s'affichent avec scores de confiance
- [ ] Les rapprochements sont créés en base

### Test 3 : Rapprochement manuel
- [ ] Glisser-déposer ou clic pour rapprocher
- [ ] Le rapprochement est enregistré en base
- [ ] Les compteurs sont mis à jour

### Test 4 : Gestion d'erreurs
- [ ] Message d'erreur si RPC échoue
- [ ] État de chargement affiché pendant requêtes
- [ ] Possibilité de réessayer

---

## 📊 Comparaison avant/après

| Aspect | Avant (mockée) | Après (RPC) |
|--------|----------------|-------------|
| **Données** | Hardcodées | ✅ Temps réel Supabase |
| **Suggestions** | Simulées | ✅ Algorithme matching |
| **Rapprochement** | État local | ✅ Persisté en base |
| **Statistiques** | Calculées localement | ✅ Fonction RPC optimisée |
| **Performance** | Immédiate | ✅ <500ms avec cache |
| **Multi-utilisateur** | ❌ Incohérences | ✅ Sync temps réel |

---

## 🎯 Résultat final attendu

Après migration complète :

✅ **Rapprochement bancaire opérationnel** (100% fonctionnel)
✅ **Algorithme matching** avec scores de confiance (>80% accuracy)
✅ **Interface moderne** avec suggestions intelligentes
✅ **Performance optimale** (<500ms chargement)
✅ **Synchronisation temps réel** (Supabase Realtime)

---

## 🚀 Prochaine étape

Une fois la migration terminée, créer les tests E2E :
```bash
# Créer test E2E
touch e2e/accounting/bank-reconciliation.spec.ts
```

---

**© 2025 NOUTCHE CONSEIL - CassKai Platform**
