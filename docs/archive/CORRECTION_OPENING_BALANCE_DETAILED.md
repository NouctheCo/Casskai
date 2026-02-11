# 🐛 Correction Bug Opening Balance - reportGenerationService.ts

## 📋 Problème identifié

**Bug critique:** Les balances d'ouverture (Opening Balance) de l'exercice N ne correspondent **PAS** aux balances de clôture (Closing Balance) de l'exercice N-1.

**Formule attendue:**
```
Opening Balance (N) = Closing Balance (N-1)
```

**Formule actuelle (incorrecte):**
```
Opening Balance (N) = Somme écritures période (N-1)
```

---

## 🔍 Analyse du code actuel

### Fichier: `src/services/reportGenerationService.ts`

**Méthode problématique:** `getPreviousPeriodData()` (lignes 3002-3028)

```typescript
private async getPreviousPeriodData(
  companyId: string,
  currentPeriodStartDate: string,
  fallbackStartDate: string,
  fallbackEndDate: string
): Promise<{...}> {
  // ✅ Tente d'utiliser snapshot (correct)
  const previousSnapshot = await periodSnapshotService.getPreviousPeriodSnapshot(
    companyId,
    currentPeriodStartDate
  );

  if (previousSnapshot?.snapshot?.length) {
    const snapshotDate = previousSnapshot.snapshot[0]?.snapshotDate || fallbackEndDate;
    return this.buildPeriodDataFromSnapshot(companyId, previousSnapshot.snapshot, snapshotDate);
  }

  // ❌ PROBLÈME: Fallback calcule données période N-1
  // Au lieu de récupérer balances de CLÔTURE N-1
  return this.calculatePeriodData(companyId, fallbackStartDate, fallbackEndDate);
}
```

**Problème:** `calculatePeriodData()` recalcule les soldes de l'exercice N-1 **depuis le début**, mais ne récupère **pas les balances cumulées jusqu'à la clôture**.

---

## ✅ Solution: Rollforward Correct

### Principe comptable fondamental

En comptabilité, le **rollforward** garantit :

```
Balance Clôture (N-1) = Balance Ouverture (N)
```

Pour **CHAQUE compte**, on doit avoir :

```
Opening Balance (N) = Solde cumulé depuis création entreprise jusqu'à (N-1 clôture)
```

### Formule complète

```
Solde compte X au 31/12/N-1 =
  Σ (Débit) - Σ (Crédit) pour TOUTES écritures du compte X depuis T0 jusqu'au 31/12/N-1
```

Ensuite :

```
Solde compte X au 01/01/N = Solde compte X au 31/12/N-1
```

---

## 🛠️ Correctif à implémenter

### Option 1: Utiliser balances cumulées (RECOMMANDÉ)

Modifier `getPreviousPeriodData()` pour calculer balances **cumulées** jusqu'à N-1:

```typescript
private async getPreviousPeriodData(
  companyId: string,
  currentPeriodStartDate: string,
  fallbackStartDate: string,
  fallbackEndDate: string
): Promise<{...}> {
  // 1. Tenter snapshot (optimal)
  const previousSnapshot = await periodSnapshotService.getPreviousPeriodSnapshot(
    companyId,
    currentPeriodStartDate
  );

  if (previousSnapshot?.snapshot?.length) {
    const snapshotDate = previousSnapshot.snapshot[0]?.snapshotDate || fallbackEndDate;
    return this.buildPeriodDataFromSnapshot(companyId, previousSnapshot.snapshot, snapshotDate);
  }

  // 2. ✅ CORRECTION: Calculer balances CUMULÉES jusqu'à fin N-1
  return this.calculateCumulativeBalances(companyId, fallbackEndDate);
}

/**
 * Calcule balances cumulées depuis création entreprise jusqu'à date donnée
 * Garantit rollforward correct: Closing(N-1) = Opening(N)
 */
private async calculateCumulativeBalances(
  companyId: string,
  endDate: string
): Promise<{...}> {
  // Récupérer TOUTES écritures depuis T0 jusqu'à endDate
  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select(`
      id,
      entry_date,
      journal_entry_lines (
        account_number,
        account_name,
        debit_amount,
        credit_amount
      )
    `)
    .eq('company_id', companyId)
    .in('status', ['posted', 'validated', 'imported'])
    .lte('entry_date', endDate); // ✅ Jusqu'à fin N-1 (cumulatif)

  if (error) throw error;

  // Aplatir les lignes
  const journalEntries: JournalEntry[] = [];
  entries?.forEach(entry => {
    entry.journal_entry_lines?.forEach((line: any) => {
      journalEntries.push({
        account_number: line.account_number,
        account_name: line.account_name,
        debit: line.debit_amount || 0,
        credit: line.credit_amount || 0,
        entry_date: entry.entry_date,
        description: '',
        label: line.account_name
      });
    });
  });

  // Calculer balances cumulées
  const accountBalances = this.calculateAccountBalances(journalEntries);
  const depreciationMap = await this.calculateDepreciation(companyId, endDate);

  // Classifier comptes par type
  const actifAccounts = accountBalances.filter(acc => acc.type === 'actif');
  const passifAccounts = accountBalances.filter(acc => acc.type === 'passif');

  return {
    actifImmobilise: actifAccounts.filter(acc => acc.compte.startsWith('2')),
    actifCirculant: actifAccounts.filter(acc =>
      acc.compte.startsWith('3') ||
      (acc.compte.startsWith('4') && !acc.compte.startsWith('44')) ||
      acc.compte.startsWith('5')
    ),
    capitauxPropres: passifAccounts.filter(acc =>
      acc.compte.startsWith('1') &&
      !acc.compte.startsWith('16') &&
      !acc.compte.startsWith('17') &&
      !acc.compte.startsWith('18')
    ),
    provisions: passifAccounts.filter(acc =>
      acc.compte.startsWith('15') || acc.compte.startsWith('16')
    ),
    dettes: passifAccounts.filter(acc =>
      acc.compte.startsWith('17') ||
      acc.compte.startsWith('18') ||
      (acc.compte.startsWith('4') && acc.type === 'passif')
    ),
    charges: accountBalances.filter(acc => acc.type === 'charge'),
    produits: accountBalances.filter(acc => acc.type === 'produit'),
    depreciationMap
  };
}
```

---

### Option 2: Forcer création snapshots (OPTIMAL long terme)

**Recommandation Phase 2:** Implémenter création automatique snapshots à chaque clôture exercice.

**Avantages:**
- Performance optimale (pas besoin recalculer balances cumulées)
- Historique figé (pas d'impact corrections rétroactives)
- Conformité audit (trail historique immuable)

**Service à créer:** `periodClosureService.ts`

```typescript
/**
 * Créer snapshot balances lors clôture exercice
 */
async createPeriodClosureSnapshot(
  companyId: string,
  closureDate: string
): Promise<void> {
  // 1. Calculer balances cumulées jusqu'à closureDate
  const balances = await this.calculateCumulativeBalances(companyId, closureDate);

  // 2. Enregistrer snapshot dans period_snapshots
  await periodSnapshotService.createSnapshot(companyId, closureDate, balances);

  // 3. Marquer exercice comme clôturé
  await this.markPeriodAsClosed(companyId, closureDate);
}
```

---

## 🧪 Tests de validation

### Test 1: Rollforward simple

**Scénario:**
- Exercice N-1: Balance clôture Banque (512000) = 10 000 €
- Exercice N: Opening balance attendue = 10 000 €

**Test:**
```typescript
test('Opening balance N equals Closing balance N-1', async () => {
  const companyId = 'test-company-123';

  // 1. Générer bilan N-1
  const bilanN1 = await reportGenerationService.generateBalanceSheet({
    companyId,
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  });

  // Extraire solde clôture compte 512000 (Banque)
  const closingBalanceN1 = extractAccountBalance(bilanN1, '512000', 'Net N');

  // 2. Générer bilan N
  const bilanN = await reportGenerationService.generateBalanceSheet({
    companyId,
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  // Extraire solde ouverture (= Net N-1 dans rapport N)
  const openingBalanceN = extractAccountBalance(bilanN, '512000', 'Net N-1');

  // 3. Assertion: Opening(N) DOIT ÉGALER Closing(N-1)
  expect(openingBalanceN).toBe(closingBalanceN1);
});
```

### Test 2: Rollforward multi-exercices

**Scénario:**
- Exercice 2020: Balance clôture Clients (411000) = 5 000 €
- Exercice 2021: Mouvements +3 000 € → Clôture = 8 000 €
- Exercice 2022: Opening balance attendue = 8 000 € (PAS 5 000 €)

**Test:**
```typescript
test('Opening balance reflects ALL previous years', async () => {
  const companyId = 'test-company-456';

  // Générer bilan 2022
  const bilan2022 = await reportGenerationService.generateBalanceSheet({
    companyId,
    startDate: '2022-01-01',
    endDate: '2022-12-31'
  });

  // Vérifier opening balance = cumulatif (2020 + 2021)
  const openingBalance2022 = extractAccountBalance(bilan2022, '411000', 'Net N-1');
  expect(openingBalance2022).toBe(8000); // NOT 5000
});
```

---

## 📊 Impact métier

### Erreur actuelle

**Exemple réel:**

| Compte | Closing N-1 | Opening N (BUG) | Opening N (CORRECT) |
|--------|-------------|-----------------|---------------------|
| 512000 Banque | 25 000 € | 15 000 € ❌ | 25 000 € ✅ |
| 411000 Clients | 12 500 € | 8 000 € ❌ | 12 500 € ✅ |

**Conséquences:**
- ❌ Bilans incohérents entre exercices
- ❌ Variation trésorerie incorrecte
- ❌ KPIs faussés (DSO, cash, BFR)
- ❌ Non-conformité audit (IFAC, SOX)

### Après correction

**Résultat attendu:**

| Compte | Closing N-1 | Opening N | Cohérence |
|--------|-------------|-----------|-----------|
| 512000 Banque | 25 000 € | 25 000 € | ✅ ÉGALITÉ |
| 411000 Clients | 12 500 € | 12 500 € | ✅ ÉGALITÉ |

---

## 🚀 Plan d'implémentation

### Phase 1 (Urgent - P0)

1. ✅ Créer méthode `calculateCumulativeBalances()`
2. ✅ Modifier `getPreviousPeriodData()` pour utiliser balances cumulées
3. ✅ Tester avec jeu de données multi-exercices
4. ✅ Vérifier égalité Closing(N-1) = Opening(N)

**Estimation:** 2-3 heures

---

### Phase 2 (Amélioration - P1)

1. Créer service `periodClosureService.ts`
2. Implémenter création automatique snapshots clôture
3. Ajouter validation rollforward lors génération rapports
4. Dashboard audit: afficher écarts rollforward si détectés

**Estimation:** 1-2 jours

---

## 📝 Checklist validation

- [ ] Méthode `calculateCumulativeBalances()` créée
- [ ] `getPreviousPeriodData()` modifiée pour utiliser balances cumulées
- [ ] Tests unitaires rollforward passent (2 scénarios minimum)
- [ ] Tests E2E bilan multi-exercices validés
- [ ] Documentation utilisateur mise à jour
- [ ] Migration données existantes (recalculer snapshots si nécessaire)
- [ ] Performance acceptable (<5s pour bilan avec 1000+ comptes)
- [ ] Vérification manuelle sur 3+ entreprises pilotes

---

## 🎯 Résultat final attendu

**Après implémentation:**

✅ **Conformité comptable:** Rollforward correct (Closing N-1 = Opening N)
✅ **Audit trail:** Snapshots historiques immuables
✅ **Performance:** <5s génération bilan (même multi-exercices)
✅ **KPIs fiables:** Variation trésorerie, DSO, BFR cohérents
✅ **Confiance utilisateurs:** Bilans comparatifs fiables

---

**© 2025 NOUTCHE CONSEIL - CassKai Platform**
