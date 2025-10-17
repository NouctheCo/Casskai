# Fix: "Could not find the 'class' column of 'chart_of_accounts'"

## Problème Identifié

L'erreur survient lors de l'initialisation du plan comptable standard car le code tente d'insérer une colonne `class` dans la table `chart_of_accounts`, mais cette colonne n'existe pas dans le schéma de la base de données.

## Cause Racine

La table `chart_of_accounts` ne possède pas de colonne `class` (ou `account_class`), alors que:
1. Le code dans `accountingService.ts` essaie d'insérer des données avec `class: parseInt(account.number.charAt(0))`
2. La table `chart_of_accounts_templates` possède bien une colonne `class`, mais pas `chart_of_accounts`

## Solution Appliquée

### 1. Migration SQL Créée ✅

Une nouvelle migration a été créée: `20251014100000_add_account_class_to_chart_of_accounts.sql`

Cette migration:
- Ajoute la colonne `account_class` de type INTEGER
- Ajoute un commentaire descriptif
- Ajoute une contrainte CHECK pour valider les valeurs (1-7)
- Crée un index pour améliorer les performances
- Met à jour les enregistrements existants en extrayant la classe du `account_number`

### 2. Code TypeScript Corrigé ✅

**Fichiers modifiés:**

#### `src/services/accountingService.ts`
- Ligne 279: Remplacé `class:` par `account_class:`
- Ligne 296: Remplacé `class:` par `account_class:`

#### `src/services/accountingValidationService.ts`
- Ligne 145: Supprimé `class` de la requête SELECT (non nécessaire, la classe est extraite du `account_number`)

## Application de la Migration

### Option 1: Via Supabase Dashboard (RECOMMANDÉ)

1. Allez sur: https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/sql/new
2. Copiez-collez le contenu du fichier:
   ```
   supabase/migrations/20251014100000_add_account_class_to_chart_of_accounts.sql
   ```
3. Cliquez sur "Run"

### Option 2: Via CLI Supabase

```bash
# Méthode 1: Push automatique (peut avoir un conflit avec migration 20251012)
npx supabase migration repair --status reverted 20251012
echo "Y" | npx supabase db push --include-all

# Méthode 2: Application manuelle via psql (si disponible)
psql "postgresql://postgres.smtdtgrymuzwvctattmx:Myriam2705+@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -f supabase/migrations/20251014100000_add_account_class_to_chart_of_accounts.sql
```

## Contenu de la Migration SQL

```sql
-- Migration: Add account_class column to chart_of_accounts
-- Date: 2025-10-14
-- Purpose: Fix "Could not find the 'class' column" error during plan initialization

-- Add the account_class column to chart_of_accounts table
ALTER TABLE public.chart_of_accounts
ADD COLUMN IF NOT EXISTS account_class INTEGER;

-- Add a comment explaining the column
COMMENT ON COLUMN public.chart_of_accounts.account_class IS 'Classe du compte (1-7): 1=Capitaux, 2=Immobilisations, 3=Stocks, 4=Tiers, 5=Financier, 6=Charges, 7=Produits';

-- Add a check constraint to ensure valid class values (1-7)
ALTER TABLE public.chart_of_accounts
ADD CONSTRAINT chart_of_accounts_account_class_check
CHECK (account_class IS NULL OR (account_class >= 1 AND account_class <= 7));

-- Create an index on account_class for better query performance
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_account_class
ON public.chart_of_accounts(account_class);

-- Update existing records to set account_class based on account_number
-- Extract the first digit of account_number as the class
UPDATE public.chart_of_accounts
SET account_class = CAST(SUBSTRING(account_number, 1, 1) AS INTEGER)
WHERE account_class IS NULL
  AND account_number ~ '^[1-7].*'
  AND LENGTH(account_number) > 0;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added account_class column to chart_of_accounts';
  RAISE NOTICE 'Updated % records with account_class derived from account_number',
    (SELECT COUNT(*) FROM public.chart_of_accounts WHERE account_class IS NOT NULL);
END $$;
```

## Vérification Post-Migration

Après avoir appliqué la migration, vérifiez que:

1. **La colonne existe:**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'chart_of_accounts'
   AND column_name = 'account_class';
   ```

2. **Les valeurs sont correctement remplies:**
   ```sql
   SELECT account_number, account_name, account_class
   FROM chart_of_accounts
   LIMIT 10;
   ```

3. **L'initialisation du plan comptable fonctionne:**
   - Testez en créant une nouvelle entreprise
   - Sélectionnez le plan comptable standard (FR ou SYSCOHADA)
   - Vérifiez qu'aucune erreur n'apparaît

## Classes Comptables Définies

| Classe | Nom | Type |
|--------|-----|------|
| 1 | Capitaux | Equity |
| 2 | Immobilisations | Asset |
| 3 | Stocks | Asset |
| 4 | Tiers | Asset/Liability |
| 5 | Financier | Asset |
| 6 | Charges | Expense |
| 7 | Produits | Revenue |

## Statut

- ✅ Migration créée
- ✅ Code TypeScript corrigé
- ⏳ Migration à appliquer sur Supabase (action manuelle requise)
- ⏳ Test de l'initialisation du plan comptable

## Fichiers Modifiés

1. ✅ `supabase/migrations/20251014100000_add_account_class_to_chart_of_accounts.sql` - CRÉÉ
2. ✅ `src/services/accountingService.ts` - MODIFIÉ (lignes 279, 296)
3. ✅ `src/services/accountingValidationService.ts` - MODIFIÉ (ligne 145)
4. ✅ `apply-account-class-migration.cjs` - CRÉÉ (script d'aide)

## Prochaines Étapes

1. **Appliquer la migration SQL via Supabase Dashboard** (Option 1 recommandée)
2. Tester l'initialisation d'un plan comptable pour une nouvelle entreprise
3. Vérifier que les comptes sont créés avec la bonne `account_class`
4. Nettoyer le fichier `apply-account-class-migration.cjs` si non nécessaire

## Support

Si vous rencontrez des problèmes:
- Vérifiez les logs Supabase pour les erreurs SQL
- Consultez le fichier de migration: `supabase/migrations/20251014100000_add_account_class_to_chart_of_accounts.sql`
- Vérifiez que la connexion à la base de données fonctionne correctement
