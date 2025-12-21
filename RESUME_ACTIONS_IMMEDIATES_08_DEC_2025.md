# 🚀 Actions immédiates - Résumé des problèmes post-import

## 🔴 3 problèmes critiques identifiés

### 1️⃣ Cache React : Écritures supprimées toujours visibles
**Solution rapide** : Vider le cache navigateur + Recharger
- Aller sur [https://casskai.app/clear-all-cache.html](https://casskai.app/clear-all-cache.html)
- Cliquer sur "Tout vider + Recharger"

**Solution permanente** : Ajouter `refresh()` après import (voir détails dans CORRECTIONS_CACHE_RAPPORTS_08_DEC_2025.md)

---

### 2️⃣ Rapports vides après import ⚠️ **C'EST LE PROBLÈME PRINCIPAL**
**Cause** : Les rapports filtrent sur `status = 'posted'` mais l'import crée des écritures avec `status = 'draft'`

**Solution SQL IMMÉDIATE** (pour tester tout de suite) :

```sql
-- Passer toutes vos écritures en statut "posted"
UPDATE journal_entries
SET
  status = 'posted',
  posted_at = NOW()
WHERE company_id = 'VOTRE_COMPANY_ID'
  AND status = 'draft';

-- Vérifier le résultat
SELECT status, COUNT(*) FROM journal_entries GROUP BY status;
```

Après avoir exécuté ce SQL :
1. Allez sur [https://casskai.app/clear-all-cache.html](https://casskai.app/clear-all-cache.html)
2. Cliquez sur "Tout vider + Recharger"
3. Reconnectez-vous
4. Allez dans Rapports → Les données devraient s'afficher !

---

### 3️⃣ Pas de logs d'activité après import
**Impact** : Faible (juste pour la traçabilité)
**Solution** : Ajouter code d'audit dans `accountingImportService.ts` (voir CORRECTIONS_CACHE_RAPPORTS_08_DEC_2025.md)

---

## ✅ Actions immédiates (dans l'ordre)

### Étape 1 : Tester si c'est bien un problème de status
```sql
-- Dans Supabase SQL Editor
SELECT
  je.status,
  COUNT(DISTINCT je.id) as nb_ecritures,
  COUNT(jel.id) as nb_lignes,
  SUM(jel.debit_amount) as total_debit,
  SUM(jel.credit_amount) as total_credit
FROM journal_entries je
LEFT JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
WHERE je.company_id = 'VOTRE_COMPANY_ID'
GROUP BY je.status;
```

**Résultat attendu** :
```
status  | nb_ecritures | nb_lignes | total_debit | total_credit
--------|--------------|-----------|-------------|-------------
draft   | X            | Y         | 1000.00     | 1000.00
```

Si vous voyez `status = 'draft'`, c'est confirmé ! Passez à l'étape 2.

---

### Étape 2 : Passer les écritures en "posted"
```sql
UPDATE journal_entries
SET
  status = 'posted',
  posted_at = NOW()
WHERE company_id = 'VOTRE_COMPANY_ID'
  AND status = 'draft';
```

---

### Étape 3 : Vider le cache du navigateur
1. Allez sur [https://casskai.app/clear-all-cache.html](https://casskai.app/clear-all-cache.html)
2. Cliquez sur "Tout vider + Recharger"

---

### Étape 4 : Vérifier les rapports
1. Reconnectez-vous
2. Allez dans **Rapports** ou **Dashboard**
3. Les données devraient maintenant s'afficher ✅

---

## 🔧 Corrections à long terme

Voir le document complet : [CORRECTIONS_CACHE_RAPPORTS_08_DEC_2025.md](CORRECTIONS_CACHE_RAPPORTS_08_DEC_2025.md)

**3 corrections à implémenter** :
1. Ajouter `refresh()` après import FEC
2. Ajouter filtre `status = 'posted'` dans les services de rapports
3. Ajouter logs d'audit après import

---

## 📊 Récapitulatif

| Problème | Cause | Solution immédiate | Solution permanente |
|----------|-------|-------------------|---------------------|
| Cache React | Pas de refresh() après import | Vider cache navigateur | Ajouter callback refresh |
| Rapports vides | Filtre status != match | SQL: UPDATE status | Modifier import pour créer en 'posted' |
| Pas de logs | Code d'audit manquant | - | Ajouter code audit_logs |

---

**Date** : 08 Décembre 2025
**Status** : 🔴 Action requise
**Priorité** : Étape 2 (SQL UPDATE status) est CRITIQUE
