# 🔧 Correction : Double Comptage KPI & Reprises Comptables

**Date** : 3 février 2026  
**Ticket** : N/A (Discussion utilisateur)  
**Fichier modifié** : `src/services/realDashboardKpiService.ts`

---

## 🔴 Problèmes identifiés

### 1. **Double comptage du CA** (CRITIQUE)

**Symptôme** : Le chiffre d'affaires était additionné depuis deux sources :
- Factures de vente (`invoices`)
- Comptes comptables classe 7 (`chart_of_accounts`)

**Problème** : Les factures génèrent automatiquement des écritures comptables via `invoiceJournalEntryService.ts`, donc le CA était compté **deux fois**.

```typescript
// ❌ AVANT (double comptage)
const totalRevenue = totalFromInvoices + totalFromAccounts;
```

### 2. **Reprises de comptabilité ignorées dans Top 5 clients**

**Symptôme** : Lors d'une reprise comptable (migration depuis un autre logiciel), toutes les données sont en écritures comptables, pas en factures dans l'application. Le Top 5 clients était donc vide ou incomplet.

**Problème** : La méthode `getTopClients()` ne lisait que depuis `invoices`, ignorant les comptes auxiliaires 411xxx qui contiennent l'historique comptable.

### 3. **Comptes auxiliaires clients non exploités**

**Symptôme** : Les comptes clients (411XXXXX) avec `auxiliary_account` permettent d'identifier précisément les clients, mais n'étaient pas utilisés.

**Problème** : Perte d'information cruciale pour les reprises comptables et le suivi client.

---

## ✅ Solutions implémentées

### 1. **Correction du double comptage CA**

**Nouvelle logique en cascade (priorité comptabilité)** :

1. **PRIORITÉ** : Lire depuis `journal_entry_lines` (écritures comptables sur comptes 70x)
   - Source de vérité pour les reprises comptables
   - Utilise `entry_date` de `journal_entries` pour filtrer la période
   - Calcul : `SUM(credit_amount - debit_amount)` sur comptes ventes

2. **FALLBACK 1** : Lire depuis `chart_of_accounts` (soldes cumulés classe 7)
   - Si aucune écriture détaillée trouvée

3. **FALLBACK 2** : Lire depuis `invoices` (factures de vente)
   - Uniquement si la comptabilité n'est pas alimentée (cas rare)

```typescript
// ✅ APRÈS (cascade sans double comptage)
// 1️⃣ Essayer journal_entry_lines
const { data: journalLines } = await supabase
  .from('journal_entry_lines')
  .select('credit_amount, debit_amount, journal_entries!inner(entry_date)')
  .eq('journal_entries.company_id', companyId)
  .ilike('account_number', '70%')
  .gte('journal_entries.entry_date', startDate)
  .lte('journal_entries.entry_date', endDate);

if (journalLines?.length > 0) {
  return SUM(credit - debit); // ✅ Comptabilité trouvée
}

// 2️⃣ Fallback chart_of_accounts
// 3️⃣ Fallback invoices
```

### 2. **Top 5 clients depuis comptes auxiliaires 411xxx**

**Nouvelle logique en cascade** :

1. **PRIORITÉ** : Lire depuis `journal_entry_lines` (comptes 411xxx)
   - Filtrer sur `account_number ILIKE '411%'`
   - Agréger par `auxiliary_account` (code client)
   - CA client = `SUM(debit_amount - credit_amount)` où positif
   - Récupérer le nom depuis `third_parties.auxiliary_account`

2. **FALLBACK** : Lire depuis `invoices` (factures de vente)
   - Si aucune écriture 411xxx trouvée

```typescript
// ✅ APRÈS (avec comptes auxiliaires)
const { data: clientLines } = await supabase
  .from('journal_entry_lines')
  .select(`
    debit_amount,
    credit_amount,
    auxiliary_account,
    journal_entries!inner(entry_date)
  `)
  .ilike('account_number', '411%')
  .gte('journal_entries.entry_date', startDate)
  .lte('journal_entries.entry_date', endDate);

// Agréger par auxiliary_account
clientMap.set(auxAccount, { name, amount });

// Récupérer nom depuis third_parties
const { data: thirdParty } = await supabase
  .from('third_parties')
  .select('name')
  .eq('auxiliary_account', auxAccount)
  .single();
```

---

## 📊 Impact

### Avant (problématique)

| Scénario | CA Total | Top 5 Clients |
|----------|----------|---------------|
| **Factures uniquement** | ❌ Doublé si écritures générées | ✅ OK |
| **Reprise comptable** | ⚠️ Partiel (factures manquantes) | ❌ Vide |
| **Mix factures + écritures** | ❌ Double comptage | ⚠️ Incomplet |

### Après (corrigé)

| Scénario | CA Total | Top 5 Clients |
|----------|----------|---------------|
| **Factures uniquement** | ✅ Correct (via écritures générées) | ✅ OK (via 411xxx) |
| **Reprise comptable** | ✅ Correct (depuis journal) | ✅ OK (via 411xxx) |
| **Mix factures + écritures** | ✅ Correct (priorité compta) | ✅ Complet (411xxx) |

---

## 🔍 Points de vigilance

### 1. **Liaison third_parties ↔ auxiliary_account**

Pour que le Top 5 clients fonctionne avec les comptes auxiliaires, il faut que :
- Les tiers clients aient leur `auxiliary_account` renseigné (ex: `411001`, `411002`...)
- Ce champ corresponde aux `account_number` ou `auxiliary_account` des `journal_entry_lines`

**Recommandation** : Lors de l'import FEC ou de reprises comptables, mapper systématiquement :
```
third_parties.auxiliary_account = journal_entry_lines.auxiliary_account
```

### 2. **Migration des données existantes**

Si des données existent déjà avec l'ancienne logique, il peut être nécessaire de :
1. Vider le cache KPI : `kpiCacheService.invalidateCache(companyId)`
2. Vérifier les `auxiliary_account` dans `third_parties`
3. Re-générer les écritures manquantes pour les factures anciennes

### 3. **Performance**

La requête `journal_entry_lines` avec `JOIN journal_entries` peut être lente sur grandes volumétries.

**Optimisations possibles** :
- Index composite sur `(account_number, journal_entry_id)`
- Cache des résultats agrégés mensuels
- Matérialized view pour les KPIs

---

## ✅ Tests recommandés

### Test 1 : Reprise comptable sans factures
```sql
-- Créer des écritures comptables directement
INSERT INTO journal_entries (company_id, entry_date, ...)
INSERT INTO journal_entry_lines (account_number = '411001', debit_amount = 1000, ...)
INSERT INTO journal_entry_lines (account_number = '707000', credit_amount = 1000, ...)

-- Vérifier que le dashboard affiche :
-- - CA = 1000€
-- - Top 5 clients contient le client avec auxiliary_account = '411001'
```

### Test 2 : Factures avec écritures générées
```typescript
// Créer une facture via l'UI
// Vérifier que invoiceJournalEntryService génère l'écriture
// Vérifier que le CA n'est compté qu'une seule fois
```

### Test 3 : Période fiscale
```typescript
// Filtrer dashboard sur année N-1
// Vérifier que seules les écritures de N-1 sont comptées
// (utilise entry_date, pas created_at)
```

---

## 📚 Références

- **Service modifié** : [realDashboardKpiService.ts](src/services/realDashboardKpiService.ts)
- **Service génération écritures** : [invoiceJournalEntryService.ts](src/services/invoiceJournalEntryService.ts)
- **Cache KPI** : [kpiCacheService.ts](src/services/kpiCacheService.ts)
- **Mapping comptes** : [accountMappingService.ts](src/services/accountMappingService.ts)

---

## 🎯 Conclusion

Ces corrections permettent :
- ✅ **Éviter le double comptage** du CA (factures + écritures)
- ✅ **Supporter les reprises comptables** (écritures sans factures)
- ✅ **Exploiter les comptes auxiliaires** (411xxx) pour identifier les clients
- ✅ **Respecter la source de vérité** : la comptabilité prime sur les factures

**La comptabilité est maintenant la source unique de vérité pour les KPI.**
