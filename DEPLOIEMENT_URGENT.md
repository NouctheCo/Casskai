# 🚨 GUIDE DE DÉPLOIEMENT URGENT - Correction Bug Duplication

**Date :** 23 janvier 2026, 03:15 UTC
**Problème :** Lignes d'écritures dupliquées à chaque modification
**Cause :** Politique RLS défectueuse + données orphelines

---

## ⚡ ORDRE D'EXÉCUTION (CRITIQUE!)

### ✅ ÉTAPE 1 : Nettoyer les données orphelines (10 min)

**Pourquoi ?** Vous avez des `journal_entry_lines` qui référencent des `journal_entries` supprimés. Il faut nettoyer AVANT d'ajouter les contraintes FK.

**Actions :**

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard)
2. Aller dans **SQL Editor**
3. Copier/coller **TOUT** le contenu de : [NETTOYAGE_DONNEES_ORPHELINES.sql](./NETTOYAGE_DONNEES_ORPHELINES.sql)
4. Cliquer sur **"Run"**
5. **Vérifier qu'il n'y a pas d'erreur**

**Résultat attendu :**
```
✅ Contrainte FK journal_entries.journal_id créée
✅ Contrainte FK journal_entry_lines.journal_entry_id créée
```

**Vérification :**
```sql
-- Copier/coller cette requête APRÈS l'exécution du script
-- Doit retourner 0
SELECT COUNT(*) as lignes_orphelines
FROM journal_entry_lines jel
WHERE NOT EXISTS (
  SELECT 1 FROM journal_entries je WHERE je.id = jel.journal_entry_id
);
```

---

### ✅ ÉTAPE 2 : Corriger les politiques RLS (2 min)

**Actions :**

1. Rester dans **Supabase SQL Editor**
2. Copier/coller **PARTIE 1** de : [CORRECTIONS_RLS_ET_JOURNAUX.sql](./CORRECTIONS_RLS_ET_JOURNAUX.sql)
   - De la ligne 1 jusqu'à "PARTIE 2"
3. Cliquer sur **"Run"**

**Résultat attendu :**
```
Aucune erreur
4 nouvelles politiques RLS créées
```

**Vérification :**
```sql
-- Doit retourner 4 politiques (delete, select, update, insert)
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'journal_entry_lines'
  AND policyname LIKE '%_v2'
ORDER BY cmd;
```

---

### ✅ ÉTAPE 3 : Déployer le code frontend (2 min)

**Actions :**

```powershell
# Depuis le dossier c:\Users\noutc\Casskai
.\deploy-vps.ps1
```

**Résultat attendu :**
```
✅ Build réussi
✅ Upload réussi
✅ Tests de santé : OK
```

---

### ✅ ÉTAPE 4 : Tester en production (3 min)

**Actions :**

1. Ouvrir [https://casskai.app](https://casskai.app)
2. Se connecter
3. Aller dans **Comptabilité → Écritures**
4. **Ouvrir la console navigateur** (F12)
5. Cliquer sur **"Modifier"** une écriture existante
6. Changer un montant
7. **Sauvegarder**

**Logs attendus dans la console :**
```
🔍 Lignes trouvées AVANT suppression: 2
ℹ️ 2 anciennes lignes supprimées (2 trouvées avant)  ← ✅ DOIT ÊTRE > 0 !
🔍 Tentative insertion de 2 NOUVELLES lignes
✅ 2 NOUVELLES lignes insérées avec succès
```

**Vérification visuelle :**
- Rouvrir la même écriture en mode modification
- **Compter les lignes** : doit correspondre au nombre attendu (pas de doublons)

---

## 🔴 EN CAS D'ERREUR

### Erreur : "FK constraint violation"

**Cause :** Étape 1 (nettoyage) pas exécutée ou incomplète.

**Solution :**
1. Retourner à l'ÉTAPE 1
2. Ré-exécuter **NETTOYAGE_DONNEES_ORPHELINES.sql** en entier
3. Vérifier qu'aucune erreur n'apparaît

### Erreur : "0 lignes supprimées" dans les logs

**Cause :** Politiques RLS pas encore appliquées.

**Solution :**
1. Vérifier que l'ÉTAPE 2 est bien exécutée
2. Déconnecter/reconnecter de l'application
3. Re-tester

### Erreur : "Policy already exists"

**Cause :** Script déjà exécuté partiellement.

**Solution :**
1. C'est normal, continuer
2. Les `DROP POLICY IF EXISTS` suppriment les anciennes

---

## 📊 VÉRIFICATIONS POST-DÉPLOIEMENT

### 1. Vérifier les politiques RLS

```sql
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'journal_entry_lines'
ORDER BY cmd, policyname;
```

**Attendu :** 4 lignes avec suffixe `_v2`

### 2. Vérifier les contraintes FK

```sql
SELECT
  con.conname,
  tbl.relname,
  CASE con.contype
    WHEN 'f' THEN 'FK'
    WHEN 'p' THEN 'PK'
  END as type
FROM pg_constraint con
JOIN pg_class tbl ON con.conrelid = tbl.oid
WHERE tbl.relname IN ('journal_entries', 'journal_entry_lines')
  AND con.contype = 'f'
ORDER BY tbl.relname;
```

**Attendu :**
- `fk_journal_entries_journal_id`
- `fk_journal_entry_lines_entry_id`

### 3. Vérifier l'index

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('journal_entries', 'journal_entry_lines')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Attendu :** 3 index créés

---

## 🎯 RÉSULTAT FINAL

Après toutes les étapes, vous devriez avoir :

✅ **Base de données propre**
- Aucune ligne orpheline
- Contraintes FK en place
- Index de performance créés

✅ **Politiques RLS corrigées**
- Suppression fonctionne correctement
- Pas de sous-requête complexe

✅ **Application fonctionnelle**
- Modification d'écriture = remplacement (pas ajout)
- Logs clairs dans la console
- Données cohérentes

---

## 📞 SUPPORT

Si problème persistant :

1. **Capturer les logs console** (F12 → Console → Clic droit → Save as)
2. **Exporter résultat des vérifications SQL** ci-dessus
3. **Vérifier dans Supabase** :
   - Dashboard → Logs → Filter: errors
   - Regarder les 10 dernières erreurs

---

## 🗑️ NETTOYAGE OPTIONNEL (Après validation)

Si tout fonctionne bien pendant 24h, vous pouvez supprimer la table de backup :

```sql
-- Vérifier le contenu avant suppression
SELECT COUNT(*) FROM _backup_orphan_entry_lines;

-- Supprimer la table de backup
DROP TABLE IF EXISTS _backup_orphan_entry_lines;
```

---

**Temps total estimé : 15-20 minutes**
**Statut actuel :** ⏳ En attente d'exécution

---

## 📝 CHECKLIST

- [ ] ÉTAPE 1 : Nettoyage données orphelines exécuté
- [ ] ÉTAPE 1 : Vérification 0 ligne orpheline ✅
- [ ] ÉTAPE 2 : Politiques RLS corrigées
- [ ] ÉTAPE 2 : Vérification 4 politiques v2 créées ✅
- [ ] ÉTAPE 3 : Code déployé sur VPS
- [ ] ÉTAPE 4 : Test modification écriture OK
- [ ] ÉTAPE 4 : Logs montrent suppression > 0 ✅
- [ ] POST : Toutes vérifications SQL passent ✅
- [ ] POST : Aucune erreur en production pendant 1h ✅

**Date de déploiement :** _____________
**Validé par :** _____________
