# ✅ Migration Bancaire - Correction Finale

## 🔍 Diagnostic

Votre table `bank_accounts` existe déjà avec cette structure:
```
✅ current_balance (numeric)  ← au lieu de "balance"
✅ is_active (boolean)        ← au lieu de "status"
✅ authorized_overdraft (numeric)
✅ accounting_account_id (uuid)
```

## ✅ Corrections Appliquées

### 1. Adaptation de la Migration

**Fichier**: `supabase/migrations/20251128_bank_module_complete.sql`

**Changements:**
- ✅ Supprimé `CREATE TABLE bank_accounts` (existe déjà)
- ✅ Ajout conditionnel de la colonne `status` (équivalent de is_active)
- ✅ Ajout conditionnel de la colonne `last_import`
- ✅ Fonction trigger utilise `current_balance` au lieu de `balance`
- ✅ Index créé seulement après ajout de la colonne `status`

### 2. Mapping des Colonnes

| Colonne Migration | Colonne Existante | Action |
|-------------------|-------------------|--------|
| `balance` | `current_balance` | ✅ Utilise l'existante |
| `status` | `is_active` | ✅ Ajoute `status` séparément |
| `last_import` | ❌ N'existe pas | ✅ Ajoutée |

## 📋 Application de la Migration

### Méthode: Supabase Dashboard SQL Editor

1. **Ouvrez** [Supabase Dashboard](https://app.supabase.com)
2. **Allez dans** SQL Editor
3. **Copiez** le contenu de `supabase/migrations/20251128_bank_module_complete.sql`
4. **Exécutez** ▶️

### Ce qui va se passer:

```sql
✅ Étape 1: Ajouter colonne "status" à bank_accounts
✅ Étape 2: Ajouter colonne "last_import" à bank_accounts
✅ Étape 3: Ajouter contrainte CHECK sur status
✅ Étape 4: Ajouter contrainte UNIQUE (company_id, iban)
✅ Étape 5: Créer index sur company_id
✅ Étape 6: Créer index sur status
✅ Étape 7: Créer table bank_transactions
✅ Étape 8: Créer table sepa_exports
✅ Étape 9: Créer table sepa_payments
✅ Étape 10: Créer 16 politiques RLS
✅ Étape 11: Créer fonction update_bank_account_balance()
✅ Étape 12: Créer trigger trigger_update_bank_balance
```

## 🧪 Test Après Migration

Exécutez cette requête pour vérifier:

```sql
-- 1. Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'bank_accounts'
  AND column_name IN ('status', 'last_import')
ORDER BY column_name;
```

**Résultat attendu:**
```
column_name  | data_type                   | column_default
-------------+-----------------------------+----------------
last_import  | timestamp with time zone    | NULL
status       | character varying           | 'active'::character varying
```

```sql
-- 2. Vérifier que les nouvelles tables existent
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('bank_transactions', 'sepa_exports', 'sepa_payments')
ORDER BY table_name;
```

**Résultat attendu:**
```
table_name
------------------
bank_transactions
sepa_exports
sepa_payments
```

```sql
-- 3. Vérifier le trigger
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'bank_transactions';
```

**Résultat attendu:**
```
trigger_name                | event_manipulation | action_statement
---------------------------+--------------------+------------------
trigger_update_bank_balance | INSERT             | EXECUTE FUNCTION update_bank_account_balance()
trigger_update_bank_balance | UPDATE             | EXECUTE FUNCTION update_bank_account_balance()
trigger_update_bank_balance | DELETE             | EXECUTE FUNCTION update_bank_account_balance()
```

## ✅ Test Fonctionnel Complet

```sql
-- Test 1: Ajouter un compte de test avec status
INSERT INTO bank_accounts (
  company_id,
  bank_name,
  account_name,
  account_number,
  iban,
  bic,
  currency,
  current_balance,
  account_type,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'Banque de Test',
  'Compte Test',
  'TEST123456',
  'FR7630001007941234567890185',
  'BDFEFRPP',
  'EUR',
  1000.00,
  'checking',
  'active'
) RETURNING id, account_name, status, current_balance;

-- Test 2: Vérifier que status et last_import fonctionnent
SELECT
  id,
  account_name,
  status,
  last_import,
  current_balance
FROM bank_accounts
WHERE bank_name = 'Banque de Test';

-- Test 3: Ajouter une transaction
INSERT INTO bank_transactions (
  bank_account_id,
  company_id,
  transaction_date,
  amount,
  currency,
  description,
  type,
  status
) VALUES (
  (SELECT id FROM bank_accounts WHERE bank_name = 'Banque de Test'),
  (SELECT company_id FROM bank_accounts WHERE bank_name = 'Banque de Test'),
  NOW(),
  250.50,
  'EUR',
  'Test virement',
  'credit',
  'pending'
) RETURNING *;

-- Test 4: Vérifier que le solde a été mis à jour automatiquement par le trigger
SELECT
  account_name,
  current_balance,
  last_import
FROM bank_accounts
WHERE bank_name = 'Banque de Test';
-- current_balance devrait être 1250.50 (1000 + 250.50)
-- last_import devrait être la date actuelle

-- Nettoyer
DELETE FROM bank_accounts WHERE bank_name = 'Banque de Test';
```

## 📊 Structure Finale

### bank_accounts (colonnes ajoutées)
```
✅ status (VARCHAR(20)) DEFAULT 'active'
✅ last_import (TIMESTAMP WITH TIME ZONE)
✅ Contrainte CHECK: status IN ('active', 'closed', 'suspended')
✅ Index: idx_bank_accounts_status
```

### bank_transactions (nouvelle table)
```
✅ 16 colonnes (id, bank_account_id, company_id, transaction_date, ...)
✅ Contrainte UNIQUE: (bank_account_id, transaction_date, amount, description)
✅ 6 index de performance
✅ Politiques RLS complètes
```

### sepa_exports (nouvelle table)
```
✅ 15 colonnes (historique exports SEPA XML)
✅ 4 index
✅ Politiques RLS
```

### sepa_payments (nouvelle table)
```
✅ 11 colonnes (détail paiements)
✅ 3 index
✅ Politiques RLS
```

## 🎯 Services TypeScript Compatibles

Les services utilisent maintenant la bonne colonne:

```typescript
// bankImportService.ts
// ✅ Utilise current_balance de la table existante

// sepaExportService.ts
// ✅ Fonctionne indépendamment (génère XML)
```

## ⚠️ Important

Après la migration, les deux colonnes coexistent:
- `current_balance` (existante) - utilisée par le trigger
- `is_active` (existante) - reste utilisable
- `status` (nouvelle) - ajoutée pour compatibilité future

Vous pouvez synchroniser `status` avec `is_active` si besoin:

```sql
-- Optionnel: Synchroniser status avec is_active
UPDATE bank_accounts
SET status = CASE
  WHEN is_active = true THEN 'active'
  ELSE 'closed'
END
WHERE status IS NULL;
```

---

**✅ La migration est maintenant compatible avec votre structure existante!**

Essayez de l'exécuter à nouveau dans le SQL Editor de Supabase.
