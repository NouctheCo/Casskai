# 🐛 DEBUG Import FEC - Montants à 0

## 📊 Situation

**Problème** : Lors de l'import d'un fichier FEC, les écritures sont créées mais tous les montants (débit et crédit) sont à 0 dans la base de données.

**Exemple de données source** :
```
JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise
RAN|Report à nouveau|1|20240101|101300|Capital souscrit|||C1|20240101|À-nouveaux|0,00|1000,00|||20250219 10:25:37||
RAN|Report à nouveau|1|20240101|119000|Report à nouveau débiteur|||C1|20240101|À-nouveaux|3297,36|0,00|||20250219 10:25:37||
```

**Résultat attendu** :
- Ligne 1 : Débit = 0, Crédit = 1000
- Ligne 2 : Débit = 3297.36, Crédit = 0

**Résultat actuel** :
- Ligne 1 : Débit = 0, Crédit = 0 ❌
- Ligne 2 : Débit = 0, Crédit = 0 ❌

## ✅ Tests effectués

### 1. Test du parser de montants

**Fichier** : `test-parser.js`

**Résultat** : ✅ **FONCTIONNE PARFAITEMENT**

```
Input: "1000,00" → Output: 1000
Input: "3297,36" → Output: 3297.36
Input: "4903,08" → Output: 4903.08
```

**Conclusion** : Le parser `parseAmount()` dans `accountingFileParser.ts` convertit correctement les montants avec virgule décimale.

### 2. Logs de débogage ajoutés

**Fichiers modifiés** :
- ✅ `src/services/accountingImportService.ts` (lignes 613-621 et 638-646)

**Logs ajoutés** :
1. **Avant création des lignes** : Log des montants de chaque entrée
2. **Avant insertion SQL** : Log d'un échantillon des 3 premières lignes

**Objectif** : Identifier à quelle étape les montants deviennent 0.

## 🔍 Hypothèses

### Hypothèse 1 : Problème de parsing ❌
**Status** : ÉLIMINÉE par les tests

Le parser fonctionne correctement. `"1000,00"` est bien converti en `1000`.

### Hypothèse 2 : Problème de typage TypeScript ⚠️
**Status** : POSSIBLE

Les montants pourraient être convertis en string au lieu de number lors de la construction de l'objet.

**Vérification à faire** :
- Regarder dans les logs console si `debitType` et `creditType` sont bien `"number"`

### Hypothèse 3 : Problème d'insertion Supabase ⚠️
**Status** : POSSIBLE

Supabase pourrait rejeter ou convertir les montants lors de l'insertion si :
- Le schéma de la table attend un type différent
- Il y a une validation qui échoue silencieusement
- Les colonnes n'existent pas dans la table

**Vérification à faire** :
- Vérifier que les colonnes `debit_amount` et `credit_amount` existent bien
- Vérifier le type de ces colonnes (doit être NUMERIC ou DECIMAL)
- Regarder les erreurs Supabase dans la console

### Hypothèse 4 : Fonction RPC qui écrase les données ⚠️
**Status** : MOINS PROBABLE

La fonction `generate_fec_export` récupère les données mais ne les modifie pas.

## 📝 Étapes de débogage

### Étape 1 : Vérifier les logs dans la console

1. Aller sur https://casskai.app
2. Ouvrir la console (F12 → Console)
3. Aller dans Comptabilité → Importer
4. Importer le fichier FEC
5. Copier TOUS les logs qui commencent par `[Parser]`, `[Import]`

**Logs attendus** :
```javascript
[Parser] Raw Debit: "0,00" | Raw Credit: "1000,00"
[Parser] Parsed Debit: 0 | Parsed Credit: 1000
[Import] Line 1 - Account 101300: {
  debit: 0,
  credit: 1000,
  debitType: "number",
  creditType: "number"
}
[Import] Sample of lines to insert (first 3): [
  {account: "101300", debit: 0, credit: 1000, desc: "À-nouveaux"},
  {account: "119000", debit: 3297.36, credit: 0, desc: "À-nouveaux"},
  ...
]
```

**Si les logs montrent** :
- ✅ `debit: 1000, debitType: "number"` → Le parsing fonctionne, problème dans Supabase
- ❌ `debit: "1000", debitType: "string"` → Problème de typage TypeScript
- ❌ `debit: 0` alors que le parsing a donné `1000` → Problème dans la construction de l'objet

### Étape 2 : Vérifier le schéma Supabase

Aller dans Supabase Dashboard → Table Editor → `journal_entry_lines`

**Vérifier** :
- ✅ Colonne `debit_amount` existe (type: NUMERIC ou DECIMAL)
- ✅ Colonne `credit_amount` existe (type: NUMERIC ou DECIMAL)
- ✅ Aucune contrainte CHECK qui force les montants à 0
- ✅ Aucune valeur par défaut à 0

### Étape 3 : Test SQL direct

Dans Supabase SQL Editor, exécuter :

```sql
-- Vérifier le schéma
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'journal_entry_lines'
AND column_name IN ('debit_amount', 'credit_amount');

-- Insérer une ligne de test
INSERT INTO journal_entry_lines (
  journal_entry_id,
  account_id,
  description,
  debit_amount,
  credit_amount,
  line_order
) VALUES (
  (SELECT id FROM journal_entries LIMIT 1),
  (SELECT id FROM chart_of_accounts LIMIT 1),
  'Test montant',
  1000.50,
  2500.75,
  1
) RETURNING *;

-- Vérifier que les montants sont bien enregistrés
SELECT debit_amount, credit_amount, description
FROM journal_entry_lines
WHERE description = 'Test montant';
```

**Si l'insertion SQL fonctionne** → Le problème est côté client (TypeScript/JavaScript)
**Si l'insertion SQL échoue** → Le problème est dans le schéma de la base

### Étape 4 : Vérifier les RLS policies

Les Row Level Security policies pourraient bloquer ou modifier les données.

```sql
-- Lister les policies sur journal_entry_lines
SELECT *
FROM pg_policies
WHERE tablename = 'journal_entry_lines';
```

## 🛠️ Corrections possibles

### Si le problème est le typage

**Dans** : `src/services/accountingImportService.ts` ligne 617-618

```typescript
// AVANT (pourrait causer le problème)
debit_amount: entry.debit || 0,
credit_amount: entry.credit || 0,

// APRÈS (forcer la conversion en number)
debit_amount: Number(entry.debit) || 0,
credit_amount: Number(entry.credit) || 0,

// OU ENCORE MIEUX (typage strict)
debit_amount: typeof entry.debit === 'number' ? entry.debit : 0,
credit_amount: typeof entry.credit === 'number' ? entry.credit : 0,
```

### Si le problème est le schéma SQL

**Migration à créer** : `supabase/migrations/20241208_fix_journal_entry_lines_amounts.sql`

```sql
-- Vérifier et corriger le type des colonnes
ALTER TABLE journal_entry_lines
  ALTER COLUMN debit_amount TYPE NUMERIC(15, 2),
  ALTER COLUMN credit_amount TYPE NUMERIC(15, 2);

-- S'assurer qu'il n'y a pas de valeur par défaut à 0
ALTER TABLE journal_entry_lines
  ALTER COLUMN debit_amount DROP DEFAULT,
  ALTER COLUMN credit_amount DROP DEFAULT;

-- Vérifier les contraintes
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'journal_entry_lines'::regclass;
```

### Si le problème est une RLS policy

**Désactiver temporairement pour tester** :

```sql
-- Désactiver RLS sur la table (TEMPORAIRE - SEULEMENT POUR TEST)
ALTER TABLE journal_entry_lines DISABLE ROW LEVEL SECURITY;

-- Puis réactiver après le test
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
```

## 📋 Checklist de débogage

- [ ] Logs console récupérés et analysés
- [ ] Schéma Supabase vérifié (colonnes et types)
- [ ] Test SQL direct effectué
- [ ] RLS policies vérifiées
- [ ] Correction appliquée selon le diagnostic
- [ ] Test d'import après correction
- [ ] Vérification dans la base que les montants sont bien enregistrés

## 📞 Informations à fournir

Pour continuer le débogage, fournir :

1. **Les logs console** complets lors de l'import
2. **Résultat de la requête SQL** de vérification du schéma
3. **Capture d'écran** de la table `journal_entry_lines` dans Supabase Table Editor
4. **Résultat du test SQL** d'insertion directe

---

**Date** : 08 Décembre 2025
**Status** : 🔍 En attente des logs de débogage
**Prochaine étape** : Analyser les logs console pour identifier où les montants deviennent 0
