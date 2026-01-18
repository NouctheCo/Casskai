# Fix Third Parties Tabs - Bugs Corrigés

**Date**: 2025-01-09
**Fichiers Modifiés**:
- `src/components/third-parties/AgingAnalysisTab.tsx`
- `src/components/third-parties/TransactionsTab.tsx`

**Status**: ✅ COMPLETE

---

## 🐛 Bug 1: AgingAnalysisTab - Colonne `paid_amount` inexistante dans `purchases`

### Problème
**Erreur**: `column purchases.paid_amount does not exist`

La table `purchases` n'a pas de colonne `paid_amount`. Les colonnes correctes sont:
- `total_amount` - Montant total de l'achat
- `payment_status` - Statut du paiement ('paid', 'unpaid', 'partial')
- `paid_at` - Date du paiement

### Solution Appliquée

#### Ligne 71: Requête SQL corrigée
**Avant**:
```typescript
.select('id, purchase_date, due_date, total_amount, paid_amount, status')
.eq('company_id', companyId)
.neq('status', 'paid');
```

**Après**:
```typescript
.select('id, purchase_date, due_date, total_amount, payment_status')
.eq('company_id', companyId)
.neq('payment_status', 'paid');
```

#### Lignes 94-95: Calcul du balance corrigé
**Avant**:
```typescript
const balance = (purch.total_amount || 0) - (purch.paid_amount || 0);
```

**Après**:
```typescript
// Pour purchases: si payment_status != 'paid', le montant entier est dû
const balance = purch.payment_status === 'paid' ? 0 : (purch.total_amount || 0);
```

#### Lignes 108-110: Agrégation des payables corrigée
**Avant**:
```typescript
const payables = purchasesInBucket.reduce(
  (sum, purch) => sum + ((purch.total_amount || 0) - (purch.paid_amount || 0)),
  0
);
```

**Après**:
```typescript
const payables = purchasesInBucket.reduce(
  (sum, purch) => sum + (purch.payment_status === 'paid' ? 0 : (purch.total_amount || 0)),
  0
);
```

#### Debug Logging Ajouté
```typescript
logger.debug('AgingAnalysisTab', `📊 Loaded ${invoices?.length || 0} unpaid invoices and ${purchases?.length || 0} unpaid purchases`);
```

---

## 🐛 Bug 2: TransactionsTab - Relations `third_parties` inexistantes

### Problème
**Erreur**: `Could not find a foreign key relationship between 'invoices' and 'third_parties'`

Les relations ont changé:
- ❌ `invoices` → `third_parties` (n'existe plus)
- ✅ `invoices` → `customers` (via `customer_id`)
- ✅ `purchases` → `suppliers` (via `supplier_id`)

### Solution Appliquée

#### 1. Fonction `loadThirdParties()` - Lignes 79-118

**Avant**: Requête sur table unifiée `third_parties`
```typescript
const { data, error } = await supabase
  .from('third_parties')
  .select('id, name')
  .eq('company_id', companyId)
  .eq('is_active', true)
  .order('name');
```

**Après**: Combinaison de `customers` + `suppliers`
```typescript
// Charger les clients
const { data: customers, error: custError } = await supabase
  .from('customers')
  .select('id, name')
  .eq('company_id', companyId)
  .eq('is_active', true)
  .order('name');

// Charger les fournisseurs
const { data: suppliers, error: suppError } = await supabase
  .from('suppliers')
  .select('id, name')
  .eq('company_id', companyId)
  .eq('is_active', true)
  .order('name');

// Combiner les deux listes
const combined = [
  ...(customers || []),
  ...(suppliers || [])
];

setThirdParties(combined);
```

#### 2. Requête Invoices - Lignes 125-169

**Avant**: Relation `third_parties`
```typescript
.select(`
  id,
  invoice_number,
  invoice_date,
  due_date,
  third_party_id,
  third_parties(name, type),
  total_incl_tax,
  paid_amount,
  status
`)
```

**Après**: Relation `customers` via `customer_id`
```typescript
.select(`
  id,
  invoice_number,
  invoice_date,
  due_date,
  customer_id,
  client:customers!customer_id(name),
  total_incl_tax,
  paid_amount,
  status
`)
```

**Mapping des données**:
```typescript
third_party_id: inv.customer_id || '',
third_party_name: inv.client?.name || 'Inconnu',
third_type: 'customer',
```

#### 3. Requête Purchases - Lignes 171-214

**Avant**: Relation incorrecte `third_parties`
```typescript
.select(`
  id,
  invoice_number,
  purchase_date,
  due_date,
  supplier_id,
  third_parties!purchases_supplier_id_fkey(name, type),
  total_ttc,
  paid_amount,
  status
`)
```

**Après**: Relation `suppliers` via `supplier_id` + correction `paid_amount`
```typescript
.select(`
  id,
  invoice_number,
  purchase_date,
  due_date,
  supplier_id,
  supplier:suppliers!supplier_id(name),
  total_amount,
  payment_status
`)
```

**Calcul du balance corrigé**:
```typescript
// Pour purchases: pas de paid_amount, on utilise payment_status
const balance = purch.payment_status === 'paid' ? 0 : (purch.total_amount || 0);
```

**Mapping des données**:
```typescript
third_party_id: purch.supplier_id || '',
third_party_name: purch.supplier?.name || 'Inconnu',
third_type: 'supplier',
amount: purch.total_amount || 0,
paid_amount: purch.payment_status === 'paid' ? (purch.total_amount || 0) : 0,
status: purch.payment_status || 'unpaid',
```

#### 4. Paiements (Payments) - Lignes 215-289

**Problème**: Table `payments` peut ne pas avoir de relation directe avec `third_parties`

**Solution**: Simplification temporaire
```typescript
// Suppression de la relation third_parties
// Utilisation de invoice_id pour lien indirect
.select(`
  id,
  reference,
  payment_date,
  invoice_id,
  amount,
  payment_method,
  description
`)
```

**Gestion des erreurs**:
```typescript
if (payRecError) {
  logger.warn('TransactionsTab', 'Error loading payments received (may not exist):', payRecError);
  // Ne pas throw, continuer avec les autres données
}
```

**Note TODO**: Les paiements affichent des noms génériques pour l'instant:
- Paiements reçus: "Paiement reçu"
- Paiements émis: "Paiement émis"

Pour afficher les vrais noms, il faudrait joindre via `invoice_id` → `invoices` → `customers/suppliers`.

#### Debug Logging Ajouté
```typescript
logger.debug('TransactionsTab', `📋 Loaded ${customers?.length || 0} customers and ${suppliers?.length || 0} suppliers`);
logger.debug('TransactionsTab', `📄 Loaded ${invoices?.length || 0} invoices`);
logger.debug('TransactionsTab', `🛒 Loaded ${purchases?.length || 0} purchases`);
logger.debug('TransactionsTab', `💰 Loaded ${paymentsReceived?.length || 0} payments received`);
logger.debug('TransactionsTab', `💸 Loaded ${paymentsSent?.length || 0} payments sent`);
logger.debug('TransactionsTab', `✅ Total transactions loaded: ${allTransactions.length}`);
```

---

## 📊 Résumé des Changements

### AgingAnalysisTab.tsx
| Ligne | Changement | Raison |
|-------|-----------|---------|
| 71 | `paid_amount` → `payment_status` | Colonne inexistante dans `purchases` |
| 73 | `neq('status')` → `neq('payment_status')` | Nom de colonne correct |
| 95 | Calcul balance simplifié | Utilisation de `payment_status` |
| 109 | Agrégation corrigée | Calcul basé sur `payment_status` |
| 78 | Debug log ajouté | Traçabilité des données chargées |

### TransactionsTab.tsx
| Lignes | Changement | Raison |
|--------|-----------|---------|
| 79-118 | Réécriture complète `loadThirdParties()` | Combinaison `customers` + `suppliers` |
| 125-146 | Requête invoices modifiée | Relation vers `customers` via `customer_id` |
| 171-214 | Requête purchases modifiée | Relation vers `suppliers` + correction `paid_amount` |
| 215-252 | Payments received simplifiés | Suppression relation `third_parties` |
| 253-289 | Payments sent simplifiés | Suppression relation `third_parties` |
| Partout | Debug logs ajoutés | Traçabilité complète du chargement |

---

## ✅ Tests à Effectuer

### AgingAnalysisTab
- [ ] Page charge sans erreur
- [ ] Les buckets affichent les créances (invoices)
- [ ] Les buckets affichent les dettes (purchases)
- [ ] Les totaux sont corrects
- [ ] L'export CSV fonctionne

### TransactionsTab
- [ ] Page charge sans erreur
- [ ] Liste des tiers affiche clients et fournisseurs
- [ ] Filtre par tiers fonctionne
- [ ] Les factures (invoices) s'affichent avec nom client
- [ ] Les achats (purchases) s'affichent avec nom fournisseur
- [ ] Les paiements s'affichent (même avec noms génériques)
- [ ] Les filtres fonctionnent (type, statut, dates)
- [ ] L'export CSV fonctionne

---

## 🔮 Améliorations Futures

### TransactionsTab - Paiements
Pour afficher les vrais noms dans les paiements, créer une requête avec double join:

```typescript
// Paiements reçus avec client name
.select(`
  *,
  invoice:invoices!invoice_id(
    customer:customers!customer_id(name)
  )
`)

// Utilisation
third_party_name: pay.invoice?.customer?.name || 'Client inconnu'
```

### Calcul des Balances Réels
Actuellement, les balances dans ThirdPartiesPage sont à 0 (TODO). Pour les calculer:

**Pour customers**:
```sql
SELECT
  c.id,
  c.name,
  COALESCE(SUM(i.total_incl_tax - i.paid_amount), 0) as balance
FROM customers c
LEFT JOIN invoices i ON i.customer_id = c.id AND i.status != 'paid'
GROUP BY c.id
```

**Pour suppliers**:
```sql
SELECT
  s.id,
  s.name,
  COALESCE(SUM(
    CASE
      WHEN p.payment_status != 'paid' THEN p.total_amount
      ELSE 0
    END
  ), 0) as balance
FROM suppliers s
LEFT JOIN purchases p ON p.supplier_id = s.id
GROUP BY s.id
```

---

## 📚 Documents Connexes

- [MIGRATION_THIRD_PARTIES_PAGE_FIX.md](MIGRATION_THIRD_PARTIES_PAGE_FIX.md) - Fix de la page principale
- [MIGRATION_THIRD_PARTIES_SUMMARY.md](MIGRATION_THIRD_PARTIES_SUMMARY.md) - Vue d'ensemble migration
- [MIGRATION_SUPPLIERS_COMPLETE.md](MIGRATION_SUPPLIERS_COMPLETE.md) - Migration fournisseurs

---

**Status**: ✅ **Les deux bugs sont corrigés**

Les pages Third Parties, Aging Analysis et Transactions devraient maintenant fonctionner correctement avec la nouvelle structure `customers` + `suppliers`.
