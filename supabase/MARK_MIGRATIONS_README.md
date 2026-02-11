# Marquer les migrations comme appliquées

## ✅ Ce que vous devez faire

### 1. Ouvrir le SQL Editor Supabase

Allez sur : [https://supabase.com/dashboard/project/_/sql](https://supabase.com/dashboard/project/_/sql)

### 2. Copier-coller le script

Ouvrez le fichier [`mark_migrations_as_applied.sql`](./mark_migrations_as_applied.sql) et copiez **tout son contenu**.

### 3. Exécuter le script

Collez le SQL dans l'éditeur et cliquez sur **Run** (ou `Ctrl+Enter`).

### 4. Vérifier

Le script affiche automatiquement les 20 dernières migrations marquées. Vous devriez voir :

```
version                          | name
---------------------------------|---------------------------------------------
20260115000000_update_fec...     | 20260115000000_update_fec_export_separator_tab.sql
20260114170000_create_rfa...     | 20260114170000_create_rfa_imports.sql
...
```

### 5. Tester le push

Retournez dans votre terminal et testez :

```bash
cd c:\Users\noutc\Casskai
supabase db push --linked --dry-run
```

**Résultat attendu** :
- ✅ Aucune migration antérieure bloquante
- ✅ Vous pouvez maintenant créer de nouvelles migrations normalement

---

## 📋 Contenu du script

Le script marque **158 migrations** comme appliquées :
- De `20250104_add_missing_automation_columns_v2` 
- Jusqu'à `20260115000000_update_fec_export_separator_tab`

Chaque migration est insérée avec :
```sql
('version', ARRAY['-- Already applied manually'], 'filename.sql')
```

La clause `ON CONFLICT DO NOTHING` garantit qu'on ne crée pas de doublons.

---

## ⚠️ Important

Ce script **ne modifie pas** votre schéma de base de données. Il marque seulement les migrations comme "déjà exécutées" dans la table d'historique Supabase.

**Utilisez ce script seulement si** :
- ✅ Ces migrations sont déjà appliquées manuellement dans votre DB
- ✅ Votre base de données Supabase est à jour
- ✅ Vous voulez juste synchroniser l'historique local avec le remote

---

## ❓ Problèmes ?

Si après exécution `supabase db push` continue de bloquer :

1. Vérifiez que le script s'est bien exécuté (pas d'erreur SQL)
2. Relancez `supabase migration list --linked` pour voir les migrations marquées
3. Si certaines migrations sont toujours manquantes, ajoutez-les manuellement au script

---

## 🎯 Prochaines étapes

Après avoir marqué les migrations :

1. ✅ Créez de nouvelles migrations normalement
2. ✅ Utilisez `supabase db push --linked` sans erreur
3. ✅ Vos fichiers dans `_archived_local_only/` restent disponibles pour référence
