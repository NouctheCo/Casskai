# 📊 Status Configuration Journaux Comptables

**Date** : 12 Octobre 2025
**Statut** : ⚠️ **MIGRATION APPLIQUÉE - VÉRIFICATION EN COURS**

---

## ✅ CE QUI A ÉTÉ FAIT

### 1. Migration SQL créée et appliquée
**Fichier** : `supabase/migrations/20251012_210000_create_default_journals.sql`

**Résultat de l'application** :
```
✅ NOTICE: Journaux par défaut créés pour l'entreprise 21c6c65f-1f3a-4a13-bab4-928a00796e37
✅ NOTICE: Templates d'écritures créés pour l'entreprise 21c6c65f-1f3a-4a13-bab4-928a00796e37
✅ NOTICE: Journaux par défaut créés pour l'entreprise 0610a1ef-e09b-447f-8900-9a1044ce58e3
✅ NOTICE: Templates d'écritures créés pour l'entreprise 0610a1ef-e09b-447f-8900-9a1044ce58e3
✅ NOTICE: Journaux par défaut créés pour l'entreprise fff1b4eb-09f8-4079-a230-2ec0d8d61e42
✅ NOTICE: Templates d'écritures créés pour l'entreprise fff1b4eb-09f8-4079-a230-2ec0d8d61e42
✅ NOTICE: Journaux et templates créés pour toutes les entreprises existantes
✅ NOTICE: Migration create_default_journals terminée avec succès
✅ NOTICE: ✅ Journaux créés: VENTES, ACHATS, BANQUE, OD
✅ NOTICE: ✅ Templates créés pour: factures vente/achat, paiements
✅ NOTICE: ✅ Trigger activé pour nouvelles entreprises
```

**Commande utilisée** :
```bash
npx supabase db push --include-all
```

### 2. Composant EmptyState créé
**Fichier** : `src/components/ui/EmptyState.tsx`

✅ 7 variants disponibles (no-data, empty-list, error, loading, no-results, coming-soon, no-permission)
✅ 5 composants spécialisés (EmptyInvoices, EmptyCustomers, EmptyTransactions, EmptyReports, ErrorState)
✅ Design élégant et rassurant

### 3. Scripts de vérification créés
- ✅ `verify-journals.js` - Vérification complète des journaux
- ✅ `test-journals-direct.js` - Test d'accès direct
- ✅ `test-journal-insert.js` - Test d'insertion
- ✅ `check-db-schema.js` - Vérification du schéma

---

## ⚠️ PROBLÈME RENCONTRÉ

### La table `journals` est vide

**Symptômes** :
- ✅ Table `journals` existe (accessible)
- ❌ Table `journals` ne contient aucune donnée
- ❌ Table `journal_entry_templates` n'existe pas dans le schema cache
- ❌ Aucune entreprise n'est accessible via les scripts de test

**Diagnostic** :
```bash
$ node test-journals-direct.js
✅ Table 'journals' accessible
   Nombre total de journaux: 0

⚠️  Aucun journal trouvé dans la table
```

### Cause racine probable

**RLS (Row Level Security) bloque l'accès** :

Les scripts de test utilisent la clé `ANON_KEY` qui nécessite un utilisateur authentifié pour accéder aux données. Les RLS policies définies dans la migration nécessitent que l'utilisateur soit lié à l'entreprise via `user_companies`.

**Solution** : Utiliser la clé `SERVICE_ROLE_KEY` qui bypass les RLS policies.

---

## 🔧 ACTIONS À FAIRE

### Option 1 : Récupérer la clé SERVICE_ROLE_KEY (RECOMMANDÉ)

1. **Aller sur le dashboard Supabase** : https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/settings/api

2. **Copier la clé `service_role`** (section "Project API keys")

3. **Ajouter dans `.env`** :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (la clé complète)
   ```

4. **Relancer les tests** :
   ```bash
   node test-journal-insert.js
   ```

### Option 2 : Vérifier via le dashboard Supabase

1. **Aller sur le Table Editor** : https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/editor

2. **Ouvrir la table `journals`**

3. **Vérifier le contenu** :
   - Si vide → Les NOTICE étaient trompeurs, la migration a échoué silencieusement
   - Si plein → Le problème est uniquement l'accès RLS

4. **Ouvrir la table `journal_entry_templates`** (même vérification)

### Option 3 : Réappliquer la migration manuellement

Si les tables sont vides, il faut créer les journaux manuellement :

```sql
-- Via le SQL Editor du dashboard Supabase
SELECT create_default_journals('21c6c65f-1f3a-4a13-bab4-928a00796e37');
SELECT create_default_entry_templates('21c6c65f-1f3a-4a13-bab4-928a00796e37');

SELECT create_default_journals('0610a1ef-e09b-447f-8900-9a1044ce58e3');
SELECT create_default_entry_templates('0610a1ef-e09b-447f-8900-9a1044ce58e3');

SELECT create_default_journals('fff1b4eb-09f8-4079-a230-2ec0d8d61e42');
SELECT create_default_entry_templates('fff1b4eb-09f8-4079-a230-2ec0d8d61e42');
```

---

## 📊 VÉRIFICATION RAPIDE

### Via SQL Editor (recommandé)

1. **Ouvrir SQL Editor** : https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/sql/new

2. **Exécuter** :
```sql
-- Vérifier les journaux
SELECT COUNT(*) as total_journals FROM journals;
SELECT company_id, code, name FROM journals ORDER BY company_id, code;

-- Vérifier les templates
SELECT COUNT(*) as total_templates FROM journal_entry_templates;
SELECT company_id, name, type FROM journal_entry_templates ORDER BY company_id, type;

-- Vérifier les entreprises
SELECT id, name FROM companies LIMIT 10;
```

**Résultat attendu** :
- `total_journals` : 12 (4 journaux × 3 entreprises)
- `total_templates` : 12 (4 templates × 3 entreprises)
- Liste des 3 entreprises

---

## 🎯 PROCHAINES ÉTAPES

### Une fois les journaux vérifiés

1. **Intégrer dans invoicingService.ts**
   - Créer fonction `createJournalEntriesFromInvoice()`
   - Appeler lors de la création de facture

2. **Intégrer dans purchasesService.ts**
   - Créer fonction `createJournalEntriesFromPurchase()`
   - Appeler lors de la création d'achat

3. **Intégrer dans services bancaires**
   - Créer fonction `createJournalEntriesFromPayment()`
   - Appeler lors de l'enregistrement de paiement

4. **Remplacer les messages d'erreur**
   - Utiliser `<EmptyState />` dans tous les composants
   - Remplacer "Erreur de chargement" par des messages rassurants

---

## 📝 NOTES IMPORTANTES

### RLS Policies

Les politiques RLS sont configurées pour isoler les données par entreprise :

```sql
CREATE POLICY "Company users can access their journals"
  ON journals
  USING (
    company_id IN (
      SELECT company_id
      FROM user_companies
      WHERE user_id = auth.uid()
    )
  );
```

**Impact** :
- ✅ Sécurité : Chaque utilisateur ne voit que les journaux de ses entreprises
- ⚠️ Tests : Les scripts Node.js nécessitent la `SERVICE_ROLE_KEY` pour bypasser RLS
- ⚠️ Frontend : Les composants React nécessitent un utilisateur authentifié

### Format des templates

**Ligne de template** :
```json
{
  "account_number": "411",
  "label": "Client",
  "debit_formula": "total_ttc",
  "credit_formula": "0"
}
```

**Formules disponibles** :
- `total_ttc` : Montant TTC
- `total_ht` : Montant HT
- `total_vat` : Montant TVA
- `amount` : Montant (pour les paiements)
- `0` : Zéro (pas de montant)

---

## 🆘 EN CAS DE PROBLÈME

### Erreur "table journal_entry_templates does not exist"

**Cause** : La migration n'a pas créé la table (erreur silencieuse)

**Solution** : Recréer la table manuellement via SQL Editor en copiant le DDL depuis `20251012_210000_create_default_journals.sql`

### Erreur "Cannot find function create_default_journals"

**Cause** : La migration n'a pas créé les fonctions

**Solution** : Recréer les fonctions manuellement via SQL Editor

### Table vide mais NOTICE affichés

**Cause** : Transaction rollback silencieux après les NOTICE

**Solution** : Vérifier les logs Supabase pour l'erreur complète :
https://supabase.com/dashboard/project/smtdtgrymuzwvctattmx/logs/postgres-logs

---

**Créé par** : Assistant IA
**Dernière mise à jour** : 12 Octobre 2025
**Statut** : En attente de vérification manuelle
