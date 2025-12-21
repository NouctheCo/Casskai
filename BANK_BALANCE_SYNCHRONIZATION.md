# 🏦 Synchronisation Automatique des Soldes Bancaires

**Date** : 21 décembre 2025  
**Status** : ✅ Implémenté  
**Approche** : Double synchronisation (automatique + manuelle)

---

## 📋 Résumé

Implémentation complète de la synchronisation du `current_balance` des comptes bancaires avec les opérations comptables.

**Problème résolu** :
- Avant : Le `current_balance` restait statique après la modification manuelle du solde
- Maintenant : Le solde se met à jour automatiquement en fonction des écritures comptables ET peut être recalculé manuellement si besoin

---

## 🎯 Architecture

### Deux approches complémentaires

#### **Approche 1 : Synchronisation Automatique (Temps Réel)**
```
Création d'une écriture comptable (module banque)
        ↓
journalEntriesService.createJournalEntry()
        ↓
bankAccountBalanceService.updateBalancesFromJournalEntry()
        ↓
current_balance mis à jour automatiquement
```

**Quand ça s'applique** :
- ✅ Création d'une facture qui génère une écriture bancaire
- ✅ Rapprochement d'une transaction bancaire
- ✅ Création manuelle d'une écriture dans le journal banque
- ✅ Virements entre comptes bancaires

#### **Approche 2 : Recalcul Manuel (Ponctuel)**
```
Bouton utilisateur "Recalculer les soldes"
        ↓
bankAccountBalanceService.recalculateBankAccountBalance()
        ↓
Récalcule : initial_balance + SOMME(tous les mouvements du journal banque)
        ↓
current_balance recalculé et mis à jour
```

**Quand l'utiliser** :
- 🔄 Correction de désynchronisation
- 🔄 Maintenance système
- 🔄 Migration de données
- 🔄 Audit des soldes

---

## 📂 Fichiers Créés/Modifiés

### 1. **Service de Gestion du Solde** 
📄 `src/services/bankAccountBalanceService.ts` (NOUVEAU)

**Classe** : `BankAccountBalanceService`

**Méthodes principales** :

#### Approche Automatique
```typescript
// Met à jour le solde d'un compte après une écriture
updateBalanceFromJournalEntry(
  companyId: string,
  journalEntryId: string,
  bankAccountId: string
): Promise<BankAccountBalanceUpdate | null>

// Met à jour tous les comptes impactés par une écriture
updateBalancesFromJournalEntry(
  companyId: string,
  journalEntryId: string
): Promise<BankAccountBalanceUpdate[]>
```

#### Approche Manuelle
```typescript
// Recalcule complètement le solde d'un compte
recalculateBankAccountBalance(
  companyId: string,
  bankAccountId: string
): Promise<{ success: boolean; newBalance: number; message: string }>

// Recalcule tous les comptes d'une entreprise
recalculateAllBankAccountBalances(
  companyId: string
): Promise<{ success: boolean; results: Array<...> }>
```

#### Utilitaires
```typescript
// Récupère l'historique des mouvements pour déboguer
getBankAccountMovementHistory(
  companyId: string,
  bankAccountId: string,
  limit?: number
): Promise<Array<{ entryId, entryDate, debit, credit, movement }>>
```

---

### 2. **Intégration Auto-Comptabilité**
📄 `src/services/autoAccountingIntegrationService.ts` (MODIFIÉ)

**Changement** : Ajout de l'appel automatique au service de balance

```typescript
// Ligne ~313
const result = await journalEntriesService.createJournalEntry(payload);

if (result.success && result.data) {
  // ✅ MISE À JOUR AUTOMATIQUE DU SOLDE BANCAIRE
  await bankAccountBalanceService.updateBalancesFromJournalEntry(company_id, result.data.id);
  
  return { success: true, entryId: result.data.id };
}
```

---

### 3. **Composant UI de Gestion**
📄 `src/components/banking/BankAccountBalanceManager.tsx` (NOUVEAU)

**Fonctionnalités** :
- 🔄 Bouton pour recalculer un compte spécifique
- 🔄 Bouton pour recalculer tous les comptes
- 📊 Affichage de l'historique des mouvements
- 📋 Résultats détaillés du recalcul
- 💡 Informations pédagogiques

**Props** :
```typescript
interface BankAccountBalanceManagerProps {
  companyId: string;
  bankAccounts: Array<{
    id: string;
    account_name: string;
    current_balance: number;
    currency: string;
  }>;
  onBalanceUpdated?: () => void;
}
```

**Utilisation** :
```tsx
<BankAccountBalanceManager
  companyId={currentCompany.id}
  bankAccounts={bankAccounts}
  onBalanceUpdated={() => loadBankAccounts()}
/>
```

---

## 🔄 Flux de Données - Exemple Concret

### Scenario 1 : Création d'une Facture Vente

```
User crée facture de vente: 1000€
  ↓
Module Facturation: appelle generateInvoiceJournalEntry()
  ↓
Crée écriture comptable:
  - Débit 411 (Clients) : 1000€
  - Crédit 707 (Ventes) : 1000€
  ↓
autoAccountingIntegrationService.generateInvoiceJournalEntry()
  ↓
journalEntriesService.createJournalEntry()
  ↓
bankAccountBalanceService.updateBalancesFromJournalEntry()
  ↓
✅ Aucun impact direct sur compte bancaire (c'est normal, facture ≠ paiement)
```

### Scenario 2 : Rapprochement d'une Transaction Bancaire

```
User rapproche transaction bancaire: +500€
  ↓
BanksPage.handleReconcile()
  ↓
Crée écriture comptable:
  - Débit 512 (Banque) : 500€
  - Crédit 411 (Clients) : 500€
  ↓
generateBankTransactionEntry()
  ↓
journalEntriesService.createJournalEntry()
  ↓
bankAccountBalanceService.updateBalancesFromJournalEntry()
  ↓
✅ current_balance du compte += 500€ (automatique)
```

### Scenario 3 : Correction Manuelle

```
User clique "Recalculer les soldes"
  ↓
BankAccountBalanceManager.handleRecalculateAll()
  ↓
Pour chaque compte:
  - initial_balance = 1000€ (solde initial fixe)
  - + SOMME(débit du journal banque) - SOMME(crédit du journal banque)
  - + 500€ (transaction rapprochée)
  - + 200€ (autre transaction)
  = Nouveau current_balance
  ↓
✅ Solde synchronisé même en cas de désynchronisation
```

---

## 📊 Structure BDD Impliquée

### Table `bank_accounts`
```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  account_name VARCHAR NOT NULL,
  
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,  -- ← Solde initial (fixe)
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,  -- ← Solde actuel (mis à jour)
  
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP,
  ...
);
```

### Table `journal_entries`
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  journal_id UUID NOT NULL,
  entry_date DATE NOT NULL,
  
  journal_entry_lines (
    account_id UUID,
    debit_amount DECIMAL(15,2),
    credit_amount DECIMAL(15,2)
  )
);
```

**Logique de calcul** :
```
current_balance = initial_balance + Σ(mouvements du journal banque)
                = 1000€ + [+500€, -200€, +300€]
                = 1600€
```

---

## ✅ Cas d'Utilisation Couverts

| Cas | Auto | Manuel | ✅ |
|-----|------|--------|-----|
| Facture vente créée | ❌ Non impacté | N/A | ✅ |
| Transaction bancaire rapprochée | ✅ Auto-maj | ✅ Vérifiable | ✅ |
| Écriture manuelle journal banque | ✅ Auto-maj | ✅ Vérifiable | ✅ |
| Virement entre comptes | ✅ Auto-maj | ✅ Vérifiable | ✅ |
| Suppression d'écriture | ⚠️ Non géré | ✅ Recalcul | ⚠️ |
| Modification d'écriture | ⚠️ Non géré | ✅ Recalcul | ⚠️ |
| Désynchronisation détectée | N/A | ✅ Correction | ✅ |

> **Note** : Pour gérer les suppressions/modifications, il faudrait ajouter des triggers ou webhook

---

## 🛠️ Intégration dans BanksPage

### Exemple d'Intégration Complète

```tsx
// src/pages/BanksPage.tsx

import { BankAccountBalanceManager } from '@/components/banking/BankAccountBalanceManager';

const BanksPageNew: React.FC = () => {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  const loadData = async () => {
    // Charger les comptes bancaires
    const accounts = await bankStorageAdapter.loadBankAccounts(companyId);
    setBankAccounts(accounts);
  };

  return (
    <div className="space-y-6">
      {/* Onglets existants */}
      {activeTab === 'accounts' && (
        <BankAccountsTab
          companyId={currentCompany.id}
          accounts={bankAccounts}
          onRefresh={loadData}
        />
      )}

      {/* NOUVEAU : Gestionnaire de soldes */}
      {activeTab === 'account-sync' && (
        <BankAccountBalanceManager
          companyId={currentCompany.id}
          bankAccounts={bankAccounts}
          onBalanceUpdated={loadData}
        />
      )}
    </div>
  );
};
```

---

## 🔍 Débogage

### Vérifier les mouvements d'un compte

```typescript
const movements = await bankAccountBalanceService.getBankAccountMovementHistory(
  companyId,
  bankAccountId,
  50
);

// Résultat :
// [
//   {
//     entryId: "uuid-123",
//     entryDate: "2025-12-21",
//     description: "Client ABC - Facture FAC-001",
//     debit: 500,
//     credit: 0,
//     movement: 500
//   },
//   {
//     entryId: "uuid-124",
//     entryDate: "2025-12-20",
//     description: "Paiement facture FOU-001",
//     debit: 0,
//     credit: 200,
//     movement: -200
//   }
// ]
```

### Récalcul complet avec logs

```typescript
const result = await bankAccountBalanceService.recalculateBankAccountBalance(
  companyId,
  bankAccountId
);

console.log(result);
// {
//   success: true,
//   newBalance: 1600,
//   message: "✅ Solde recalculé: 1500€ → 1600€ (correction: +100€)"
// }
```

---

## 📋 Checklist de Maintenance

### ✅ Tests à Faire

- [ ] Créer une facture vente → vérifier que current_balance ne change pas
- [ ] Créer une transaction bancaire → vérifier que current_balance augmente/diminue
- [ ] Rapprocher une transaction → vérifier la mise à jour automatique
- [ ] Recalculer manuellement → vérifier la synchronisation
- [ ] Créer un virement entre 2 comptes → vérifier les 2 soldes

### ⚠️ À Noter

1. **Les suppressions d'écritures** ne mettent pas à jour le solde automatiquement
   - Solution : Utiliser le bouton "Recalculer" après suppression

2. **Les modifications d'écritures** ne mettent pas à jour le solde automatiquement
   - Solution : Utiliser le bouton "Recalculer" après modification

3. **Décalage avec les APIs Open Banking**
   - Les soldes des APIs de banque (Bridge, Plaid) sont synchronisés séparément
   - `current_balance` est basé sur les écritures comptables, pas sur l'API banque

---

## 🚀 Évolutions Futures

1. **Ajouter des triggers Supabase** pour gérer les suppressions/modifications automatiquement
2. **Webhook de synchronisation** avec les APIs Open Banking
3. **Alertes de désynchronisation** automatiques
4. **Rapport de réconciliation bancaire** automatisé
5. **Import de transactions** avec mise à jour automatique du solde

---

## 📞 Support

Pour toute question, consulter :
- `bankAccountBalanceService.ts` - Logique de synchronisation
- `BankAccountBalanceManager.tsx` - Interface utilisateur
- `autoAccountingIntegrationService.ts` - Intégration auto-comptabilité
