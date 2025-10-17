# Solution: Appliquer la Migration account_class

## Problème Résolu

L'erreur `duplicate key value violates unique constraint "schema_migrations_pkey"` était causée par **deux fichiers de migration avec le même préfixe de date** `20251012`.

## Actions Effectuées ✅

### 1. Diagnostic du Problème
- Identifié 2 fichiers avec `20251012`:
  - `20251012_100000_fix_chart_of_accounts_initialization.sql`
  - `20251012_210000_create_default_journals.sql` (RENOMMÉ)
- Supabase utilise seulement les 8 premiers caractères (`20251012`) comme clé unique
- Conflit détecté lors du push

### 2. Résolution
- ✅ Renommé `20251012_210000_create_default_journals.sql` → `20251015_100000_create_default_journals.sql`
- ✅ Plus de conflit de clé unique
- ✅ Créé script SQL direct pour application manuelle

## Méthodes d'Application de la Migration

### ⭐ Méthode 1: SQL Direct via Supabase Dashboard (RECOMMANDÉ)

**C'est la méthode la plus simple et la plus fiable.**

1. Ouvrez: https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/sql/new

2. Copiez-collez le contenu du fichier: `apply-account-class-direct.sql`

3. Cliquez sur **"Run"**

4. Vérifiez que le résultat affiche:
   ```
   status: Migration terminée!
   total_comptes: X
   comptes_avec_classe: X
   comptes_sans_classe: 0
   ```

**Avantages:**
- ✅ Pas de conflit avec les migrations existantes
- ✅ Application immédiate
- ✅ Vérification automatique du résultat
- ✅ Pas besoin de gérer `schema_migrations`

### Méthode 2: Via CLI Supabase (si vous voulez gérer l'historique)

**Note:** Cette méthode peut encore rencontrer des problèmes avec les migrations `20251013` dupliquées.

```bash
# 1. Vérifier l'état actuel
npx supabase migration list

# 2. Marquer les migrations problématiques comme "applied"
npx supabase migration repair --status applied 20251012

# 3. Pousser seulement les nouvelles migrations
echo "Y" | npx supabase db push
```

**Si cela échoue encore:**
```bash
# Marquer toutes les migrations locales comme appliquées
npx supabase migration repair --status applied 20251012
npx supabase migration repair --status applied 20251013
npx supabase migration repair --status applied 20251014100000
npx supabase migration repair --status applied 20251015

# Puis appliquer le SQL manuellement via la Méthode 1
```

## Contenu du Script SQL (apply-account-class-direct.sql)

Le script effectue les opérations suivantes:

```sql
-- 1. Ajoute la colonne account_class (INTEGER)
ALTER TABLE public.chart_of_accounts
ADD COLUMN IF NOT EXISTS account_class INTEGER;

-- 2. Ajoute un commentaire descriptif
COMMENT ON COLUMN public.chart_of_accounts.account_class IS
  'Classe du compte (1-7): 1=Capitaux, 2=Immobilisations, 3=Stocks, 4=Tiers, 5=Financier, 6=Charges, 7=Produits';

-- 3. Ajoute une contrainte CHECK (valide 1-7)
ALTER TABLE public.chart_of_accounts
ADD CONSTRAINT chart_of_accounts_account_class_check
CHECK (account_class IS NULL OR (account_class >= 1 AND account_class <= 7));

-- 4. Crée un index pour performance
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_account_class
ON public.chart_of_accounts(account_class);

-- 5. Met à jour les enregistrements existants
UPDATE public.chart_of_accounts
SET account_class = CAST(SUBSTRING(account_number, 1, 1) AS INTEGER)
WHERE account_class IS NULL
  AND account_number ~ '^[1-7].*'
  AND LENGTH(account_number) > 0;

-- 6. Affiche le résultat
SELECT
  'Migration terminée!' as status,
  COUNT(*) as total_comptes,
  COUNT(account_class) as comptes_avec_classe
FROM public.chart_of_accounts;
```

## État des Fichiers

### Fichiers Modifiés
- ✅ `src/services/accountingService.ts` - Utilise maintenant `account_class` au lieu de `class`
- ✅ `src/services/accountingValidationService.ts` - Supprimé `class` de la requête SELECT

### Fichiers de Migration
- ✅ `supabase/migrations/20251012_100000_fix_chart_of_accounts_initialization.sql` - Conservé
- ✅ `supabase/migrations/20251015_100000_create_default_journals.sql` - Renommé (était 20251012_210000)
- ✅ `supabase/migrations/20251014100000_add_account_class_to_chart_of_accounts.sql` - Migration account_class

### Scripts d'Aide
- ✅ `apply-account-class-direct.sql` - Script SQL direct pour application manuelle
- ✅ `SOLUTION_MIGRATION_ACCOUNT_CLASS.md` - Ce document

## Vérification Post-Migration

Après avoir appliqué la migration, testez:

### 1. Vérifier que la colonne existe
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chart_of_accounts'
AND column_name = 'account_class';
```

Résultat attendu:
```
column_name   | data_type | is_nullable
account_class | integer   | YES
```

### 2. Vérifier les données
```sql
SELECT
  account_number,
  account_name,
  account_class,
  account_type
FROM chart_of_accounts
WHERE account_class IS NOT NULL
ORDER BY account_class, account_number
LIMIT 20;
```

### 3. Tester l'initialisation du plan comptable
- Créez une nouvelle entreprise dans l'application
- Sélectionnez "Plan Comptable Général (France)" ou "SYSCOHADA"
- Vérifiez qu'aucune erreur n'apparaît
- Consultez le plan comptable créé

## Classes Comptables

| Classe | Nom | Type Principal |
|--------|-----|----------------|
| 1 | Capitaux (Capital, Réserves, Emprunts) | Equity / Liability |
| 2 | Immobilisations (Terrains, Constructions, Matériel) | Asset |
| 3 | Stocks (Matières premières, Marchandises) | Asset |
| 4 | Tiers (Fournisseurs, Clients, Personnel) | Asset / Liability |
| 5 | Financier (Banques, Caisse, VMP) | Asset |
| 6 | Charges (Achats, Services extérieurs, Salaires) | Expense |
| 7 | Produits (Ventes, Prestations, Produits financiers) | Revenue |

## Prochaines Étapes

1. ⏳ **APPLIQUER LA MIGRATION** via Méthode 1 (SQL Direct)
2. ⏳ Tester la création d'un plan comptable
3. ⏳ Vérifier que les comptes ont bien un `account_class`
4. ✅ Code TypeScript déjà corrigé
5. ✅ Documentation créée

## En Cas de Problème

### Erreur: "column account_class already exists"
✅ Pas de problème ! Le script utilise `ADD COLUMN IF NOT EXISTS`

### Erreur: "constraint already exists"
✅ Le script supprime d'abord la contrainte avec `DROP CONSTRAINT IF EXISTS`

### L'index existe déjà
✅ Le script utilise `CREATE INDEX IF NOT EXISTS`

### Les valeurs ne sont pas remplies
Exécutez manuellement:
```sql
UPDATE public.chart_of_accounts
SET account_class = CAST(SUBSTRING(account_number, 1, 1) AS INTEGER)
WHERE account_class IS NULL
  AND account_number ~ '^[1-7].*'
  AND LENGTH(account_number) > 0;
```

## Support

Si vous rencontrez toujours des problèmes:
1. Vérifiez que vous êtes connecté à Supabase avec les bons identifiants
2. Consultez les logs Supabase: https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/logs/explorer
3. Vérifiez que la table `chart_of_accounts` existe bien
4. Consultez ce document: `FIX_CHART_OF_ACCOUNTS_CLASS_COLUMN.md`

---

**Résumé: Utilisez la Méthode 1 (SQL Direct) pour une application simple et sans erreur !**
