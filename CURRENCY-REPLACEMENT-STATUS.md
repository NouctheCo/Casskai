# Rapport de remplacement des symboles € - État actuel

**Date**: 2026-01-11
**Heure**: Opération en cours

## Résumé global

| Métrique | Valeur |
|----------|--------|
| Symboles € initiaux | 393 |
| Symboles € remplacés | 114 |
| Symboles € restants | **279** |
| Progression | **29%** |
| Fichiers traités | 37 |
| Fichiers restants | ~104 |

## Détails par type de fichier

### Fichiers TSX (Composants React)
- **Symboles restants**: 154
- **Fichiers traités**: 26
- **Remplacements effectués**: 76

#### Fichiers TSX traités avec succès ✅
1. AnomalyDetectionDashboard.tsx - CurrencyAmount
2. LettragePanel.tsx - 4 remplacements
3. OptimizedJournalEntriesTab.tsx - 2 remplacements
4. OptimizedJournalsTab.tsx - 5 remplacements
5. OptimizedReportsTab.tsx - 1 remplacement
6. AIAssistantChat.tsx - 1 remplacement
7. GenerateEntriesDialog.tsx - 1 remplacement
8. BankReconciliation.tsx - 1 remplacement
9. TransactionRow.tsx - 6 remplacements
10. BudgetCategoryForm.tsx - 3 remplacements
11. AutoVATDeclarationButton.tsx - 4 remplacements
12. FECExportButton.tsx - 3 remplacements
13. HRAnalyticsDashboard.tsx - 1 remplacement
14. OptimizedClientsTab.tsx - 2 remplacements
15. OptimizedInvoicesTab.tsx - 1 remplacement
16. OptimizedPaymentsTab.tsx - 5 remplacements
17. OptimizedQuotesTab.tsx - 4 remplacements
18. ModuleManager.tsx - 1 remplacement (useCompanyCurrency)
19. AgingAnalysisTab.tsx - 8 remplacements
20. TransactionsTab.tsx - 9 remplacements
21. DataTable.tsx - 1 remplacement (useCompanyCurrency)
22. BanksPage.tsx - 1 remplacement
23. DocumentationArticlePage.tsx - 1 remplacement
24. InvoicingPage.tsx - 8 remplacements
25. TeamPage.tsx - 1 remplacement
26. DocumentationArticlesData.tsx - 1 remplacement
27. SubscriptionManager.tsx - 1 remplacement

#### Fichiers TSX nécessitant révision manuelle ⚠️

Les fichiers suivants contiennent encore des symboles € qui n'ont pas été détectés par les patterns automatiques:

1. FECImportTab.tsx
2. AIInsightsDashboard.tsx
3. PredictiveDashboard.tsx
4. AssetDetailDialog.tsx
5. AssetFormDialog.tsx
6. CategoryManagementDialog.tsx
7. BankAccountFormModal.tsx
8. BudgetForm.tsx
9. BudgetFormModern.tsx
10. ContractForm.tsx
11. OpportunitiesKanban.tsx
12. OpportunityPipeline.tsx
13. DashboardWidgetRenderer.tsx
14. RealOperationalDashboard.tsx
15. EnterpriseForm.tsx
16. EnterpriseFormTabs.tsx
17. FrenchTaxCompliancePanel.tsx
18. EmployeeFormModal.tsx
19. ExpenseFormModal.tsx
20. ObjectiveFormModal.tsx
21. Inventory* (multiple files)
22. Invoice* (quelques fichiers)
23. Projects* (multiples fichiers)
24. Misc components

**Patterns complexes détectés**:
- Template literals avec conditionnels imbriqués
- Objets/arrays contenant des montants
- Props passés entre composants
- Valeurs dans des constantes

### Fichiers TS (Services & Utils)
- **Symboles restants**: 125
- **Fichiers traités**: 11
- **Remplacements effectués**: 21 (simple strings → EUR)

#### Fichiers TS traités avec succès ✅
1. useCurrency.ts - 2 remplacements
2. currencies.ts - 1 remplacement
3. regulatoryCountries.ts - 1 remplacement
4. taxConfigurations.ts - 3 remplacements
5. useCompanyCurrency.ts - 1 remplacement
6. i18n.ts - 2 remplacements
7. budgetImportExportService.ts - 1 remplacement
8. businessPlanService.ts - 7 remplacements
9. currencyConversionService.ts - 2 remplacements
10. currencyService.ts - 1 remplacement

#### Fichiers TS nécessitant révision manuelle ⚠️

**Services avec patterns complexes** (151 symboles €):
- accountingRulesService.ts
- accountingValidationService.ts
- AdvancedBusinessValidationService.ts
- aiAssistantService.ts
- autoAccountingIntegrationService.ts
- bankAccountBalanceService.ts
- bankMatchingService.ts
- crmExportService.ts
- fecExportService.ts
- fecService.ts - 7 symboles
- fecValidationService.ts - 7 symboles
- hrDocumentTemplatesService.ts - 1 symbole
- hrPayrollService.ts - 6 symboles
- invoicePdfService.ts - 1 symbole
- invoicingService.ts - 1 symbole
- marketPricingService.ts - 6 symboles
- realDashboardKpiService.ts - 5 symboles
- reportGenerationService.ts - 1 symbole
- rfaCalculationService.ts - 3 symboles
- sepaExportService.ts - 1 symbole
- teamService.ts - 2 symboles
- vatCalculationService.ts - 5 symboles
- workflowExecutionService.ts - 3 symboles
- Services AI (anomalyDetectionService, cashFlowPredictionService, OpenAIService, taxOptimizationService)
- Fiscal services (FrenchTaxComplianceService, TaxIntegrationService, TaxSimulationService)

**Utils & Constants**:
- ExportUtils.ts
- allFranceTemplates.ts
- markets.ts
- accountingFileParser.ts
- constants.ts
- countries.ts

## Scripts utilisés

### 1. replace-currency-symbols.ps1 ✅
- **Cible**: Fichiers .tsx (composants React)
- **Patterns détectés**:
  - `{amount.toFixed(2)} €` → `<CurrencyAmount amount={amount} />`
  - `{amount.toLocaleString(...)} €` → `<CurrencyAmount amount={amount} />`
  - `` `${amount} €` `` → `{formatAmount(amount)}`
  - `{amount} €` → `<CurrencyAmount amount={amount} />`
- **Résultats**: 26 fichiers modifiés, 76 remplacements

### 2. replace-currency-services.ps1 ✅
- **Cible**: Fichiers .ts (services, utils)
- **Stratégie**: Remplacer € par "EUR" (format texte)
- **Patterns détectés**:
  - Template literals: `` `${amount} €` `` → `` `${amount} EUR` ``
  - Strings: `"... €"` → `"... EUR"`
  - Single quotes: `'... €'` → `'... EUR'`
- **Résultats**: 11 fichiers modifiés, 21 remplacements

## Patterns non détectés (Révision manuelle requise)

### Pattern A: Conditionnels complexes
```tsx
// Avant:
{value > 0 ? `Montant: ${value.toFixed(2)} €` : 'N/A'}

// Après (manuel):
{value > 0 ? <>Montant: <CurrencyAmount amount={value} /></> : 'N/A'}
```

### Pattern B: Objets et arrays
```tsx
// Avant:
const data = {
  total: `${amount} €`,
  label: 'Total HT'
}

// Après (manuel):
const { formatAmount } = useCompanyCurrency();
const data = {
  total: formatAmount(amount),
  label: 'Total HT'
}
```

### Pattern C: Props et callbacks
```tsx
// Avant:
<Component label={`${price} €`} />

// Après (manuel):
const { formatAmount } = useCompanyCurrency();
<Component label={formatAmount(price)} />
```

### Pattern D: Template literals avec interpolations multiples
```tsx
// Avant:
`Prix: ${price} € TTC (dont ${vat} € TVA)`

// Après (manuel):
const { formatAmount } = useCompanyCurrency();
`Prix: ${formatAmount(price)} TTC (dont ${formatAmount(vat)} TVA)`
```

### Pattern E: Commentaires et descriptions
```tsx
// NE PAS MODIFIER - Ce sont des chaînes statiques
const description = "Le prix est en €";
// Label: "Montant en €"
```

## Prochaines étapes

### Étape 1: Traitement automatisé restant (optionnel)
Améliorer les scripts pour détecter plus de patterns:
- Conditionnels complexes
- Objets/arrays
- Template literals avec multiple interpolations

### Étape 2: Traitement manuel (RECOMMANDÉ)
Utiliser VS Code Find & Replace avec regex:

**Pattern 1 - Template literals simples**:
```regex
Rechercher: `\$\{([^}]+)\}\s*€`
Remplacer: {formatAmount($1)}
```
⚠️ Ajouter `const { formatAmount } = useCompanyCurrency();` dans chaque composant

**Pattern 2 - En attributs HTML**:
```regex
Rechercher: (label|title|placeholder)=\{`([^`]*)\s*€`\}
Remplacer: $1={formatAmount($2)}
```

**Pattern 3 - Dans objets**:
```regex
Rechercher: :\s*`\$\{([^}]+)\}\s*€`
Remplacer: : formatAmount($1)
```

### Étape 3: Vérification
1. Rechercher les symboles € restants:
   ```bash
   grep -r "€" src --include="*.tsx" --include="*.ts" | grep -v "EUR"
   ```

2. Vérifier les imports:
   ```bash
   # Fichiers utilisant CurrencyAmount sans import
   grep -l "CurrencyAmount" src/**/*.tsx | xargs grep -L "import.*CurrencyAmount"

   # Fichiers utilisant formatAmount sans import
   grep -l "formatAmount" src/**/*.tsx | xargs grep -L "import.*useCompanyCurrency"
   ```

3. Build TypeScript:
   ```bash
   npm run type-check
   ```

4. Build complet:
   ```bash
   npm run build
   ```

## Estimation temps restant

- **Automatisé (améliorer scripts)**: 2-3 heures de développement + 10 minutes d'exécution
- **Manuel (VS Code Find & Replace)**: 1-2 heures
- **Manuel (fichier par fichier)**: 4-6 heures
- **Vérification et tests**: 30 minutes

## Notes importantes

1. **Components déjà OK** ✅:
   - AccountingPage.tsx
   - OptimizedJournalEntriesTab.tsx
   - + 26 autres listés ci-dessus

2. **Ne PAS modifier**:
   - Commentaires contenant "€" ou "EUR"
   - Labels/descriptions statiques
   - Documentation
   - Tests (*.test.ts)

3. **Priorité HAUTE** (fichiers critiques):
   - Services de facturation (invoicingService, invoicePdfService, pdfService)
   - Services fiscaux (FEC, VAT, Tax)
   - Services de reporting (reportGenerationService, realDashboardKpiService)
   - Composants de dashboard

4. **Vérifier après remplacement**:
   - Imports correctement ajoutés
   - Pas de double conversion (ex: formatAmount sur une string déjà formatée)
   - Gestion des valeurs nulles/undefined: `amount ?? 0`

## Logs des exécutions

### Exécution 1: replace-currency-symbols.ps1
- **Date**: 2026-01-11
- **Durée**: ~30 secondes
- **Fichiers scannés**: 85 .tsx
- **Fichiers modifiés**: 26
- **Remplacements**: 76
- **Status**: ✅ Succès

### Exécution 2: replace-currency-services.ps1
- **Date**: 2026-01-11
- **Durée**: ~20 secondes
- **Fichiers scannés**: 54 .ts
- **Fichiers modifiés**: 11
- **Remplacements**: 21 (€ → EUR)
- **Status**: ✅ Succès

---

**Total progression**: 29% complété (114/393 symboles)
**Temps écoulé**: ~1 heure
**Temps estimé restant**: 2-4 heures (selon méthode choisie)
