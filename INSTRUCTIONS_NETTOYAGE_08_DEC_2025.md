# 🗑️ Instructions de nettoyage des doublons - 08 Décembre 2025

## 📋 Situation

Suite à la correction du bug d'import FEC, vous avez maintenant :
- ✅ **Nouvelles écritures** avec les montants corrects
- ❌ **Anciennes écritures** avec tous les montants à 0 (doublons)

## ⚠️ IMPORTANT - Backup OBLIGATOIRE

**AVANT TOUTE CHOSE**, faites un backup de votre base de données :

1. Allez sur **Supabase Dashboard**
2. Cliquez sur **Database** → **Backups**
3. Cliquez sur **"Create backup"** ou notez l'heure du dernier backup automatique

**SI QUELQUE CHOSE SE PASSE MAL**, vous pourrez restaurer depuis ce backup.

---

## 🔍 Étape 1 : Vérification (LIRE SEULEMENT)

1. Allez sur **Supabase Dashboard**
2. Ouvrez **SQL Editor**
3. **Copiez les requêtes 1 et 2** du fichier `NETTOYAGE_DOUBLONS_08_DEC_2025.sql`
4. **Exécutez-les**

Vous devriez voir quelque chose comme :
```
Lignes avec montants à 0: 705
Lignes avec montants non-0: 13
Total lignes: 718
```

**Si vous voyez que toutes les lignes sont à 0**, **N'ALLEZ PAS PLUS LOIN** et prévenez-moi !

---

## 🗑️ Étape 2 : Suppression des doublons

### Option A : Supprimer UNIQUEMENT les lignes à 0 (RECOMMANDÉ)

Cette option garde les écritures comptables (headers) mais supprime uniquement les lignes avec montants à 0.

Dans **SQL Editor**, exécutez :

```sql
-- Supprimer les lignes avec montants à 0
DELETE FROM journal_entry_lines
WHERE debit_amount = 0 AND credit_amount = 0;
```

**Résultat attendu** : `DELETE X` où X = nombre de lignes supprimées (devrait être ~705)

### Option B : Tout supprimer et réimporter (RADICAL)

Si vous préférez repartir de zéro :

```sql
-- Supprimer TOUTES les lignes d'écritures
DELETE FROM journal_entry_lines;

-- Supprimer TOUTES les écritures
DELETE FROM journal_entries;
```

⚠️ **Après cette option, vous devrez réimporter votre fichier FEC !**

---

## 🔧 Étape 3 : Nettoyage des écritures vides

Après avoir supprimé les lignes, certaines écritures peuvent être vides (sans lignes).

**Exécutez** :

```sql
-- Supprimer les écritures qui n'ont plus de lignes
DELETE FROM journal_entries
WHERE id NOT IN (
  SELECT DISTINCT journal_entry_id
  FROM journal_entry_lines
);
```

---

## 📊 Étape 4 : Recalculer les soldes

Les soldes des comptes doivent être recalculés après la suppression.

**Exécutez** :

```sql
-- Recalculer les soldes de tous les comptes
UPDATE chart_of_accounts
SET
  balance_debit = COALESCE((
    SELECT SUM(jel.debit_amount)
    FROM journal_entry_lines jel
    WHERE jel.account_id = chart_of_accounts.id
  ), 0),
  balance_credit = COALESCE((
    SELECT SUM(jel.credit_amount)
    FROM journal_entry_lines jel
    WHERE jel.account_id = chart_of_accounts.id
  ), 0),
  current_balance = COALESCE((
    SELECT SUM(jel.credit_amount - jel.debit_amount)
    FROM journal_entry_lines jel
    WHERE jel.account_id = chart_of_accounts.id
  ), 0),
  updated_at = NOW();
```

**Résultat attendu** : `UPDATE X` où X = nombre de comptes mis à jour

---

## ✅ Étape 5 : Vérification finale

**Exécutez** :

```sql
-- Vérifier qu'il ne reste plus de lignes à 0
SELECT COUNT(*) as lignes_a_zero
FROM journal_entry_lines
WHERE debit_amount = 0 AND credit_amount = 0;

-- Vérifier les lignes avec montants
SELECT COUNT(*) as lignes_avec_montants
FROM journal_entry_lines
WHERE debit_amount != 0 OR credit_amount != 0;

-- Vérifier les totaux
SELECT
  SUM(debit_amount) as total_debit,
  SUM(credit_amount) as total_credit,
  SUM(debit_amount) - SUM(credit_amount) as difference
FROM journal_entry_lines;
```

**Résultat attendu** :
- `lignes_a_zero` : **0** ✅
- `lignes_avec_montants` : **13** (ou plus si vous avez réimporté)
- `difference` : devrait être proche de 0 (principe de la partie double)

---

## 🔄 Étape 6 : Rafraîchir l'application

1. Allez sur **https://casskai.app**
2. **Videz le cache du navigateur** : `Ctrl+Shift+R` (ou `Cmd+Shift+R` sur Mac)
3. **Rechargez la page** : `F5`
4. Allez dans **Dashboard** → Les données devraient maintenant être affichées
5. Allez dans **Comptabilité** → Vérifiez que les écritures sont bien là

---

## 🐛 Si quelque chose ne va pas

### Les données ne s'affichent toujours pas

1. **Videz complètement le cache** :
   - Chrome : `F12` → Application → Clear storage → Clear site data
   - Firefox : `Ctrl+Shift+Del` → Tout cocher → Effacer

2. **Déconnectez-vous et reconnectez-vous**

3. **Vérifiez dans Supabase** que les données sont bien là :
   ```sql
   SELECT * FROM journal_entry_lines LIMIT 10;
   ```

### J'ai supprimé par erreur

1. **Restaurez depuis le backup Supabase** :
   - Dashboard → Database → Backups
   - Cliquez sur le backup d'avant la suppression
   - "Restore"

2. **Réimportez le fichier FEC** (maintenant corrigé)

---

## 📞 Résumé des étapes

1. ✅ **Backup** : Créer ou noter l'heure du dernier backup
2. 🔍 **Vérifier** : Compter les lignes à 0 vs non-0
3. 🗑️ **Supprimer** : Lignes avec montants à 0
4. 🧹 **Nettoyer** : Écritures vides
5. 📊 **Recalculer** : Soldes des comptes
6. ✅ **Vérifier** : Plus de lignes à 0
7. 🔄 **Rafraîchir** : Application web

---

## 💡 Recommandation

**Option recommandée** : Supprimer uniquement les lignes à 0 (Option A)

Cette option :
- ✅ Garde les écritures avec montants corrects
- ✅ Supprime uniquement les doublons à 0
- ✅ Plus rapide
- ✅ Moins risqué

**Option radicale** : Tout supprimer et réimporter (Option B)

Cette option si :
- ❌ Vous n'êtes pas sûr des données
- ❌ Il y a d'autres problèmes
- ❌ Vous voulez repartir de zéro

---

**Date** : 08 Décembre 2025
**Status** : 📝 Instructions prêtes
**Fichier SQL** : `NETTOYAGE_DOUBLONS_08_DEC_2025.sql`
