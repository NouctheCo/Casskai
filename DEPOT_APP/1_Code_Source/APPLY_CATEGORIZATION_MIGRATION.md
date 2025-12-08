# 🚀 Guide Rapide - Application Migration Catégorisation

## ⚡ Application Immédiate (2 minutes)

### Méthode Recommandée: Supabase Dashboard

1. **Ouvrir Supabase**
   ```
   https://app.supabase.com
   ```

2. **Sélectionner le projet CassKai**
   - Dans la liste de vos projets

3. **Ouvrir SQL Editor**
   - Menu gauche → "SQL Editor"
   - Ou cliquez sur l'icône `</>` dans la barre latérale

4. **Nouvelle requête**
   - Cliquer sur "+ New query"

5. **Copier le SQL**
   - Ouvrir le fichier: `supabase/migrations/20251128_categorization_rules.sql`
   - Tout sélectionner (Ctrl+A)
   - Copier (Ctrl+C)

6. **Coller et exécuter**
   - Coller dans l'éditeur Supabase (Ctrl+V)
   - Cliquer sur "Run" (ou Ctrl+Enter)

7. **Vérifier le succès**

   Vous devriez voir:
   ```
   ✅ Migration Catégorisation Bancaire complétée!
      - Table categorization_rules créée
      - Colonnes suggested_account_id et matched_entry_id ajoutées
      - 4 politiques RLS créées
      - Trigger automatique activé
   ```

---

## ✅ Vérification Rapide

Exécutez cette requête dans SQL Editor:

```sql
-- Vérifier que la table existe
SELECT COUNT(*) as rules_count
FROM categorization_rules;

-- Résultat attendu: 0 (table vide mais existe)
```

---

## 🎯 Utilisation Immédiate

### Étape 1: Accéder à la Catégorisation

1. Ouvrir CassKai: https://casskai.app
2. Menu → "Banque"
3. Onglet **"Catégorisation"**

### Étape 2: Créer votre première règle

1. Cliquer sur **"Règles auto"**
2. **"Ajouter une nouvelle règle"**
3. Remplir:
   ```
   Motif: AMAZON
   Compte: 6060 - Achats non stockés
   ```
4. Cliquer **"Créer la règle"**

### Étape 3: Importer des transactions

1. Retour onglet **"Import"**
2. Sélectionner votre compte bancaire
3. Choisir un fichier CSV/OFX/QIF
4. Upload

### Étape 4: Catégoriser

1. Retour onglet **"Catégorisation"**
2. Les transactions contenant "AMAZON" ont une suggestion automatique ✨
3. Sélectionner le compte pour les autres
4. Cliquer sur ✓ pour valider
5. L'écriture comptable est générée automatiquement !

---

## 🔧 En cas de problème

### Erreur: "table already exists"

Si la table existe déjà:

```sql
-- Supprimer et recréer
DROP TABLE IF EXISTS categorization_rules CASCADE;

-- Puis relancer la migration complète
```

### Erreur: "column already exists"

C'est normal si vous avez déjà une version partielle. La migration vérifie:

```sql
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'bank_transactions'
    AND column_name = 'suggested_account_id'
)
```

Relancez simplement la migration, elle passera les parties existantes.

### Vérifier les logs

Dans Supabase Dashboard:
1. Menu → "Logs"
2. Filtrer par "postgres"
3. Chercher "categorization_rules"

---

## 📊 Test Complet

### Script de test (copier dans SQL Editor)

```sql
-- 1. Vérifier la structure
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'categorization_rules'
ORDER BY ordinal_position;

-- 2. Créer une règle de test
INSERT INTO categorization_rules (
  company_id,
  pattern,
  account_id,
  is_regex,
  priority
) VALUES (
  (SELECT id FROM companies LIMIT 1),
  'TEST',
  (SELECT id FROM accounts WHERE account_number LIKE '6%' LIMIT 1),
  false,
  0
) RETURNING *;

-- 3. Vérifier la règle
SELECT * FROM categorization_rules;

-- 4. Nettoyer le test
DELETE FROM categorization_rules WHERE pattern = 'TEST';
```

---

## 🎉 C'est Prêt !

Une fois la migration appliquée, le système est **immédiatement opérationnel**.

Toutes les fonctionnalités sont disponibles:
- ✅ Catégorisation manuelle
- ✅ Suggestions automatiques
- ✅ Règles de catégorisation
- ✅ Génération d'écritures comptables
- ✅ Catégorisation en masse

**Temps d'application**: < 2 minutes
**Build TypeScript**: ✅ 0 erreurs
**Status**: Production Ready

---

**Besoin d'aide ?** Consultez [BANK_CATEGORIZATION_COMPLETE.md](BANK_CATEGORIZATION_COMPLETE.md) pour la documentation complète.
