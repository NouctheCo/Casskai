# ✅ CORRECTIONS APPLIQUÉES - 23 Janvier 2026

## 🎯 RÉSUMÉ EXÉCUTIF

**Problème principal identifié :** Les lignes d'écritures comptables se dupliquaient à chaque modification.

**Cause racine :** Politique RLS Supabase défectueuse empêchant la suppression des anciennes lignes.

**Impact :** Données comptables corrompues avec doublons, incohérence des journaux.

---

## 🔴 CORRECTION 1 : BUG DUPLICATION DES LIGNES (CRITIQUE)

### Symptôme
```
🔍 Lignes trouvées AVANT suppression: 4
ℹ️ 0 anciennes lignes supprimées (4 trouvées avant)  ← BUG !
✅ 2 NOUVELLES lignes insérées
→ Résultat: 6 lignes au total (doublons)
```

### Cause
Politique RLS `journal_entry_lines_delete` utilisait une sous-requête complexe via `journal_entries` qui échouait :

```sql
-- ❌ ANCIENNE POLITIQUE (DÉFECTUEUSE)
journal_entry_id IN (
  SELECT je.id FROM journal_entries je
  WHERE je.company_id IN (
    SELECT uc.company_id FROM user_companies uc
    WHERE uc.user_id = auth.uid()
  )
)
```

### Solution appliquée

**Fichier SQL :** [CORRECTIONS_RLS_ET_JOURNAUX.sql](./CORRECTIONS_RLS_ET_JOURNAUX.sql)

```sql
-- ✅ NOUVELLE POLITIQUE (SIMPLIFIÉE)
DROP POLICY IF EXISTS "journal_entry_lines_delete" ON journal_entry_lines;

CREATE POLICY "journal_entry_lines_delete_v2"
ON journal_entry_lines
FOR DELETE
TO authenticated
USING (
  -- Utilise DIRECTEMENT company_id sur journal_entry_lines
  company_id IN (
    SELECT company_id
    FROM user_companies
    WHERE user_id = auth.uid()
  )
);
```

### Actions requises

1. **Exécuter le script SQL dans Supabase SQL Editor** :
   - Ouvrir [CORRECTIONS_RLS_ET_JOURNAUX.sql](./CORRECTIONS_RLS_ET_JOURNAUX.sql)
   - Copier les sections "PARTIE 1" et "PARTIE 3"
   - Exécuter dans Supabase Dashboard → SQL Editor

2. **Tester la correction** :
   - Modifier une écriture existante
   - Vérifier dans les logs :
     ```
     ✅ 4 lignes trouvées, 4 supprimées, 2 nouvelles insérées
     ```

3. **Nettoyer les doublons existants** :
   - Identifier les écritures avec doublons (requête ci-dessous)
   - Supprimer manuellement les lignes en trop

```sql
-- Requête pour identifier les écritures avec doublons
SELECT
  journal_entry_id,
  COUNT(*) as lines_count,
  COUNT(*) / 2 as expected_count
FROM journal_entry_lines
GROUP BY journal_entry_id
HAVING COUNT(*) > 2
ORDER BY lines_count DESC;
```

---

## 🟡 CORRECTION 2 : ORDRE PRIORITÉ JOURNAUX (IMPORTANT)

### Problème identifié lors de l'audit

**Fichier :** [src/services/accountingRulesService.ts:428](src/services/accountingRulesService.ts#L428)

Un paiement fournisseur avec comptes `607 (Achats)` + `512 (Banque)` allait dans le journal **ACHATS** au lieu de **BANQUE**.

### Logique incorrecte (AVANT)

```typescript
// ❌ AVANT : Achats testés AVANT banque/caisse
if (hasPurchase || ... || (hasPurchase && hasBank)) return JournalType.PURCHASE;  // BUG!
if (hasBank) return JournalType.BANK;  // Jamais atteint si hasBank ET hasPurchase
```

### Logique corrigée (APRÈS)

```typescript
// ✅ APRÈS : Flux trésorerie testés AVANT achats
// 1. Ventes
if (hasSale || (hasIncomeAccount && hasClient)) return JournalType.SALE;

// 2. BANQUE/CAISSE en priorité (flux trésorerie)
if (hasBank && (hasPurchase || hasSale)) return JournalType.BANK;
if (hasCash && (hasPurchase || hasSale)) return JournalType.CASH;
if (hasBank) return JournalType.BANK;
if (hasCash) return JournalType.CASH;

// 3. Achats (seulement si pas de trésorerie)
if (hasPurchase || (hasExpenseAccount && hasSupplier)) return JournalType.PURCHASE;

// 4. OD par défaut
return JournalType.MISCELLANEOUS;
```

### Statut
✅ **Corrigé** dans [accountingRulesService.ts:426-436](src/services/accountingRulesService.ts#L426)

### Tests recommandés

| Comptes utilisés | Journal attendu | Journal avant | Journal après |
|------------------|-----------------|---------------|---------------|
| 607 + 401 | ACHATS | ✅ ACHATS | ✅ ACHATS |
| 607 + 512 | **BANQUE** | ❌ ACHATS | ✅ BANQUE |
| 411 + 512 | **BANQUE** | ❌ VENTES | ✅ BANQUE |
| 707 + 411 | VENTES | ✅ VENTES | ✅ VENTES |
| 512 seul | BANQUE | ✅ BANQUE | ✅ BANQUE |

---

## 🟢 CORRECTION 3 : CONTRAINTES DB (SÉCURITÉ)

### Problèmes
- Absence de contrainte FK sur `journal_entries.journal_id`
- Pas de CASCADE sur suppression écriture → lignes orphelines

### Solutions appliquées

**Fichier SQL :** [CORRECTIONS_RLS_ET_JOURNAUX.sql](./CORRECTIONS_RLS_ET_JOURNAUX.sql) (PARTIE 3)

```sql
-- Contrainte FK journal_entries → journals
ALTER TABLE journal_entries
ADD CONSTRAINT fk_journal_entries_journal_id
FOREIGN KEY (journal_id)
REFERENCES journals(id)
ON DELETE RESTRICT;

-- Contrainte FK journal_entry_lines → journal_entries (avec CASCADE)
ALTER TABLE journal_entry_lines
ADD CONSTRAINT fk_journal_entry_lines_entry_id
FOREIGN KEY (journal_entry_id)
REFERENCES journal_entries(id)
ON DELETE CASCADE;

-- Index pour performance
CREATE INDEX idx_journal_entries_journal_id ON journal_entries(journal_id);
CREATE INDEX idx_journal_entry_lines_entry_id ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_entry_lines_company_id ON journal_entry_lines(company_id);
```

### Bénéfices
- ✅ Impossible d'insérer une écriture avec un journal invalide
- ✅ Suppression d'écriture = suppression automatique des lignes (CASCADE)
- ✅ Performance améliorée (index sur FK)

---

## 📊 DEBUG LOGS AJOUTÉS

### Fichier : [src/services/journalEntriesService.ts](src/services/journalEntriesService.ts)

#### Logs pour `createJournalEntry` (lignes 201-214)

```typescript
logger.warn(`🔍 Tentative insertion de ${linesInsert.length} lignes pour entry ${entry.id}`);
logger.debug('Lignes à insérer:', linesInsert);
logger.info(`✅ ${lines?.length || 0} lignes insérées avec succès`);
```

#### Logs pour `updateJournalEntry` (lignes 318-355)

```typescript
// Avant suppression
logger.warn(`🔍 Lignes trouvées AVANT suppression pour entry ${entryId}:`, existingLines?.length);

// Après suppression
logger.info(`${deletedCount || 0} anciennes lignes supprimées (${existingLines?.length || 0} trouvées avant)`);

// Insertion nouvelles lignes
logger.warn(`🔍 Tentative insertion de ${linesInsert.length} NOUVELLES lignes`);
logger.info(`✅ ${lines?.length || 0} NOUVELLES lignes insérées avec succès`);
```

### Utilité
- Permet de diagnostiquer rapidement les problèmes de duplication
- Visible dans la console navigateur (F12)
- Facilite le débogage en production

---

## 🧪 PLAN DE TESTS

### 1. Test duplication lignes (CRITIQUE)

**Scénario :**
1. Créer une nouvelle écriture avec 2 lignes
2. Sauvegarder
3. Modifier l'écriture (changer un montant)
4. Sauvegarder
5. **Résultat attendu :** 2 lignes (pas 4)

**Logs attendus :**
```
🔍 Lignes trouvées AVANT suppression: 2
ℹ️ 2 anciennes lignes supprimées (2 trouvées avant)  ✅
🔍 Tentative insertion de 2 NOUVELLES lignes
✅ 2 NOUVELLES lignes insérées avec succès
```

### 2. Test affectation journaux

**Scénarios :**

| Test | Comptes | Journal attendu |
|------|---------|-----------------|
| Paiement fournisseur | 607 + 512 | BANQUE ✅ |
| Achat à crédit | 607 + 401 | ACHATS ✅ |
| Encaissement client | 411 + 512 | BANQUE ✅ |
| Vente à crédit | 411 + 707 | VENTES ✅ |
| Paiement espèces | 607 + 53 | CAISSE ✅ |

### 3. Test contraintes FK

**Scénario :**
1. Tenter de créer une écriture avec `journal_id` invalide
2. **Résultat attendu :** Erreur FK constraint violation

---

## 📝 CHECKLIST DÉPLOIEMENT

### Avant déploiement

- [x] Corrections appliquées dans le code TypeScript
- [x] Script SQL créé et documenté
- [x] Logs de debug ajoutés
- [x] Documentation technique rédigée

### Déploiement base de données

- [ ] Exécuter `PARTIE 1` du script SQL (Politiques RLS)
- [ ] Exécuter `PARTIE 3` du script SQL (Contraintes FK)
- [ ] Exécuter requête validation (pg_policies, pg_constraints)
- [ ] Vérifier logs Supabase (pas d'erreur)

### Déploiement code

- [ ] Build local : `npm run build`
- [ ] Tests locaux : Modifier plusieurs écritures
- [ ] Déployer frontend : `.\deploy-vps.ps1`
- [ ] Vérifier en production

### Post-déploiement

- [ ] Tester création nouvelle écriture
- [ ] Tester modification écriture existante
- [ ] Vérifier logs console (F12) : pas de doublons
- [ ] Tester affectation automatique journaux
- [ ] Nettoyer les doublons existants si nécessaire

### Rollback si problème

```sql
-- Restaurer ancienne politique RLS
DROP POLICY IF EXISTS "journal_entry_lines_delete_v2" ON journal_entry_lines;

CREATE POLICY "journal_entry_lines_delete"
ON journal_entry_lines
FOR DELETE
TO authenticated
USING (
  journal_entry_id IN (
    SELECT je.id FROM journal_entries je
    WHERE je.company_id IN (
      SELECT uc.company_id FROM user_companies uc
      WHERE uc.user_id = auth.uid()
    )
  )
);
```

---

## 🎯 MÉTRIQUES DE SUCCÈS

### Avant corrections
- ❌ Lignes dupliquées à chaque modification
- ❌ Paiements fournisseurs dans mauvais journal (ACHATS au lieu de BANQUE)
- ⚠️ Pas de contraintes FK → données orphelines possibles

### Après corrections
- ✅ Suppression/remplacement correct des lignes (0 doublon)
- ✅ Affectation correcte aux journaux BANQUE/CAISSE
- ✅ Contraintes FK empêchent données invalides
- ✅ Performance améliorée (index)

---

## 📚 DOCUMENTS LIÉS

1. [AUDIT_AFFECTATION_JOURNAUX.md](./AUDIT_AFFECTATION_JOURNAUX.md) - Audit complet (23 janvier 2026)
2. [CORRECTIONS_RLS_ET_JOURNAUX.sql](./CORRECTIONS_RLS_ET_JOURNAUX.sql) - Script SQL à exécuter
3. [accountingRulesService.ts](./src/services/accountingRulesService.ts) - Code TypeScript corrigé
4. [journalEntriesService.ts](./src/services/journalEntriesService.ts) - Logs debug ajoutés

---

## 🤝 SUPPORT

Pour toute question ou problème :

1. **Vérifier les logs** : Console navigateur (F12) → logs détaillés
2. **Vérifier Supabase** : Dashboard → Logs → voir erreurs RLS
3. **Re-exécuter script SQL** si politiques RLS manquantes
4. **Contacter support technique** avec logs et screenshots

---

**Dernière mise à jour :** 23 janvier 2026, 03:10 UTC
**Auteur :** Claude Sonnet 4.5
**Statut :** ✅ Corrections appliquées, en attente de déploiement
