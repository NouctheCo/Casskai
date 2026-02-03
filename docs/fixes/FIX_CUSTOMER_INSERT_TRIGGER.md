# Fix: Erreur de création de client via formulaire de facture

## 🐛 Problème identifié

**Symptôme** : Lors de la création d'un client depuis le formulaire de facture (ou tout formulaire qui n'envoie pas explicitement `payment_terms` ou `currency`), l'erreur suivante apparaît :

```
Error creating customer: 
code: "42804"
details: "Returned type text does not match expected type integer in column 17.*"
message: "returned row structure does not match the structure of the triggering table"
```

**Cause racine** : 
- La vue `customers` utilise un trigger INSTEAD OF INSERT (`insert_customer_view()`)
- Quand `payment_terms` ou `currency` sont NULL, le trigger les insère tels quels dans `third_parties`
- La colonne `payment_terms` de `third_parties` est de type `INTEGER NOT NULL DEFAULT 30`
- Le conflit de type provient de l'absence de gestion des valeurs NULL dans le trigger

## ✅ Solution

La migration SQL `20260201_fix_customer_insert_trigger.sql` a été créée pour :

1. **Ajouter des valeurs par défaut dans le trigger `insert_customer_view()`** :
   - `payment_terms` → défaut à `30` si NULL
   - `currency` → défaut à `'EUR'` si NULL
   - `billing_country` → défaut à `'FR'` si NULL
   - `is_active` → défaut à `true` si NULL

2. **Même correction pour `insert_supplier_view()`** pour cohérence

3. **Conversion du code auto-généré** :
   - Avant : `'C-' || EXTRACT(EPOCH FROM NOW())::TEXT` (peut causer des problèmes de type)
   - Après : `'C-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT` (conversion explicite en BIGINT d'abord)

## 📋 Procédure d'application

### Option 1: Via Supabase Dashboard (Recommandé)

1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller le contenu de `supabase/migrations/20260201_fix_customer_insert_trigger.sql`
3. Exécuter la requête
4. Vérifier que les 2 fonctions sont recréées sans erreur

### Option 2: Via CLI Supabase (Si configuré)

```bash
supabase db push
```

## 🧪 Test de validation

Après application de la migration, tester :

1. **Création client depuis facturation** :
   - Aller sur `/invoicing`
   - Cliquer "Nouvelle facture"
   - Dans le sélecteur client, cliquer "+ Nouveau client"
   - Remplir uniquement le nom (ne pas remplir de champs optionnels)
   - Sauvegarder
   - ✅ Le client doit être créé sans erreur

2. **Création client depuis module Tiers** :
   - Aller sur `/third-parties`
   - Cliquer "Nouveau client"
   - Remplir tous les champs y compris `payment_terms` et `currency`
   - Sauvegarder
   - ✅ Le client doit être créé avec les valeurs fournies

3. **Création client depuis CRM** :
   - Aller sur `/crm`
   - Cliquer "Nouveau client"
   - Remplir les informations de base
   - Sauvegarder
   - ✅ Le client doit être créé avec les valeurs par défaut

## 📊 Résumé des formulaires vérifiés

| Formulaire | Fichier | Méthode | `payment_terms` | `currency` | Status |
|-----------|---------|---------|-----------------|-----------|--------|
| Facturation → Nouveau client | `ClientSelector.tsx` | Insert direct `customers` | ❌ Non envoyé | ❌ Non envoyé | ✅ Corrigé via trigger |
| Module Tiers | `ThirdPartyFormDialog.tsx` | Service `createCustomer` | ✅ Défaut: 30 | ✅ Défaut: currency entreprise | ✅ OK |
| CRM | `NewClientModal.tsx` | Insert direct `third_parties` | ❌ Non envoyé | ❌ Non envoyé | ✅ OK (defaults DB) |
| Onglet Clients | `OptimizedClientsTab.tsx` | Service `createCustomer` | ✅ Service défaut | ✅ Service défaut | ✅ OK |

## 🔍 Détails techniques

### Colonnes avec valeurs par défaut dans `third_parties`

```sql
payment_terms INTEGER DEFAULT 30 CHECK (payment_terms > 0),
currency TEXT DEFAULT 'EUR',
billing_country TEXT DEFAULT 'FR',
is_active BOOLEAN DEFAULT true,
```

### Avant correction (trigger `insert_customer_view`)

```sql
payment_terms, currency, discount_rate,
...
) VALUES (
NEW.payment_terms,  -- ❌ NULL causait l'erreur
NEW.currency,       -- ❌ NULL causait l'erreur
...
```

### Après correction

```sql
payment_terms, currency, discount_rate,
...
) VALUES (
COALESCE(NEW.payment_terms, 30),    -- ✅ Défaut à 30
COALESCE(NEW.currency, 'EUR'),      -- ✅ Défaut à 'EUR'
...
```

## 🚨 Rollback (si besoin)

Si la migration cause des problèmes, restaurer les anciennes fonctions :

```sql
-- Voir le fichier original :
-- supabase/migrations/20260130_fix_security_linter_issues.sql
-- lignes 168-192 (insert_customer_view)
-- lignes 244-268 (insert_supplier_view)
```

## 📝 Notes

- Cette correction est **rétrocompatible** : les formulaires qui envoient déjà `payment_terms` et `currency` continueront de fonctionner
- Les triggers UPDATE ne sont pas modifiés car ils ne présentent pas ce problème
- Les valeurs par défaut de la table `third_parties` restent identiques
