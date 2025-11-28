# 🔧 Correction Migration Module Bancaire

## ❌ Erreur Rencontrée

```
Error: Failed to run sql query: ERROR: 42703: column "status" does not exist
```

## ✅ Solution Appliquée

La migration a été corrigée pour gérer le cas où la table `bank_accounts` existe déjà sans certaines colonnes.

### Changements

**AVANT** (migration cassée):
```sql
CREATE TABLE IF NOT EXISTS bank_accounts (
  ...
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
  ...
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON bank_accounts(status);
```

**APRÈS** (migration corrigée):
```sql
CREATE TABLE IF NOT EXISTS bank_accounts (
  ...
  -- Colonnes de base seulement
);

-- Ajouter status si manquante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_accounts' AND column_name = 'status'
  ) THEN
    ALTER TABLE bank_accounts
      ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended'));
  END IF;
END $$;

-- Index conditionnel
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_accounts' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON bank_accounts(status);
  END IF;
END $$;
```

## 📋 Application de la Migration Corrigée

### Méthode 1: Supabase Dashboard

1. Ouvrez Supabase Dashboard
2. Allez dans **SQL Editor**
3. Copiez le contenu de: `supabase/migrations/20251128_bank_module_complete.sql`
4. Cliquez sur **Run**

### Méthode 2: Supabase CLI

```bash
supabase migration up
```

### Méthode 3: Script Node.js

```bash
node apply-bank-migration.js
```

## 🔍 Vérification Post-Migration

Vérifiez que les tables ont été créées:

```sql
-- Vérifier bank_accounts
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bank_accounts'
ORDER BY ordinal_position;

-- Vérifier bank_transactions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bank_transactions'
ORDER BY ordinal_position;

-- Vérifier sepa_exports
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sepa_exports'
ORDER BY ordinal_position;

-- Vérifier sepa_payments
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sepa_payments'
ORDER BY ordinal_position;

-- Compter les politiques RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('bank_accounts', 'bank_transactions', 'sepa_exports', 'sepa_payments')
ORDER BY tablename, policyname;
```

Vous devriez voir:
- ✅ `bank_accounts` avec colonnes `status` et `last_import`
- ✅ `bank_transactions` avec toutes les colonnes de rapprochement
- ✅ `sepa_exports` et `sepa_payments`
- ✅ 16 politiques RLS au total
- ✅ Fonction `update_bank_account_balance()`
- ✅ Trigger `trigger_update_bank_balance`

## 🎯 Colonnes Ajoutées

Si `bank_accounts` existait déjà, ces colonnes ont été ajoutées:

| Colonne | Type | Défaut | Description |
|---------|------|--------|-------------|
| `status` | VARCHAR(20) | 'active' | Statut compte (active/closed/suspended) |
| `last_import` | TIMESTAMP | NULL | Date dernier import relevé |

Contraintes ajoutées:
- ✅ CHECK sur `account_type` (checking/savings/business/other)
- ✅ CHECK sur `status` (active/closed/suspended)
- ✅ UNIQUE sur (company_id, iban)

## 🚀 Test Rapide

Testez que tout fonctionne:

```sql
-- Insérer un compte de test
INSERT INTO bank_accounts (
  company_id,
  bank_name,
  account_name,
  iban,
  bic,
  currency,
  balance,
  account_type,
  status
) VALUES (
  (SELECT id FROM companies LIMIT 1), -- Votre company_id
  'Banque Test',
  'Compte Courant',
  'FR7612345678901234567890123',
  'BNPAFRPP',
  'EUR',
  0,
  'checking',
  'active'
) RETURNING *;

-- Vérifier la colonne status
SELECT id, account_name, status, last_import
FROM bank_accounts
WHERE bank_name = 'Banque Test';

-- Nettoyer
DELETE FROM bank_accounts WHERE bank_name = 'Banque Test';
```

## ✅ Résolution Confirmée

Si la requête ci-dessus fonctionne sans erreur, la migration est correctement appliquée!

---

**Statut**: ✅ Migration corrigée et prête
**Fichier**: [supabase/migrations/20251128_bank_module_complete.sql](supabase/migrations/20251128_bank_module_complete.sql)
