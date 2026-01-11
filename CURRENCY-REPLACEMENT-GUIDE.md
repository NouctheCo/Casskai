# Guide complet de remplacement des symboles € vers Currency Components

## Résumé
- **Fichiers à traiter**: 141 fichiers TypeScript/React
- **Occurrences totales**: 393 symboles €
- **Fichiers déjà traités**: 2 (AccountingPage.tsx, OptimizedJournalEntriesTab.tsx, AnomalyDetectionDashboard.tsx)
- **Fichiers restants**: 139

## Composants disponibles

### 1. CurrencyAmount Component
**Fichier**: `src/components/ui/CurrencyAmount.tsx`
**Usage**: Pour afficher des montants dans le JSX
```tsx
<CurrencyAmount amount={montant} />
```

### 2. useCompanyCurrency Hook
**Fichier**: `src/hooks/useCompanyCurrency.ts`
**Usage**: Pour formater des montants dans des strings/template literals
```tsx
const { formatAmount } = useCompanyCurrency();
// Puis utiliser:
{formatAmount(montant)}
```

## Patterns de remplacement

### Pattern 1: JSX avec toFixed
**Rechercher (regex)**:
```regex
\{([a-zA-Z_][a-zA-Z0-9_\.]*(?:\.toFixed\(\d+\))?)\}\s*€
```

**Remplacer par**:
```tsx
<CurrencyAmount amount={$1} />
```

**Exemples**:
- `{amount.toFixed(2)} €` → `<CurrencyAmount amount={amount} />`
- `{total} €` → `<CurrencyAmount amount={total} />`
- `{anomaly.amount.toFixed(2)} €` → `<CurrencyAmount amount={anomaly.amount} />`

### Pattern 2: Template literals
**Rechercher (regex)**:
```regex
`\$\{([a-zA-Z_][a-zA-Z0-9_\.]*(?:\.toFixed\(\d+\))?)\}\s*€`
```

**Remplacer par**:
```tsx
{formatAmount($1)}
```

**Note**: Nécessite d'ajouter dans le composant:
```tsx
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
const { formatAmount } = useCompanyCurrency();
```

### Pattern 3: Expressions conditionnelles
**Rechercher (regex)**:
```regex
(\w+)\s*>\s*0\s*\?\s*`\$\{(\w+)\.toFixed\(\d+\)\}\s*€`\s*:\s*['"]?['"]?
```

**Remplacer par**:
```tsx
$1 > 0 ? <CurrencyAmount amount={$2} /> : ''
```

**Exemple**:
```tsx
// Avant:
{entry.debit > 0 ? `${entry.debit.toFixed(2)} €` : ''}

// Après:
{entry.debit > 0 ? <CurrencyAmount amount={entry.debit} /> : ''}
```

### Pattern 4: Spans avec font-mono
**Rechercher (regex)**:
```regex
<span[^>]*className="[^"]*font-mono[^"]*"[^>]*>\{([a-zA-Z_][a-zA-Z0-9_\.]*(?:\.toFixed\(\d+\))?)\}\s*€</span>
```

**Remplacer par**:
```tsx
<CurrencyAmount amount={$1} />
```

## Import nécessaire

Pour chaque fichier modifié, ajouter en haut (après les derniers imports):
```tsx
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
```

## Procédure recommandée

### Option A: VS Code Find & Replace (Recommandé)
1. Ouvrir VS Code
2. Ctrl+Shift+H (Find & Replace in Files)
3. Activer le mode Regex (icône `.*`)
4. Pour chaque pattern:
   - Coller le pattern "Rechercher"
   - Coller le pattern "Remplacer par"
   - Vérifier les résultats dans la preview
   - Cliquer "Replace All"

### Option B: PowerShell Script Automatisé
Utiliser le script `scripts/replace-currency-symbols.ps1`:
```powershell
cd C:\Users\noutc\Casskai
.\scripts\replace-currency-symbols.ps1
```

### Option C: Traitement manuel par batch
Traiter les fichiers par groupes de 10-15 en utilisant la liste ci-dessous.

## Liste complète des fichiers (par priorité)

### Batch 1: Accounting Components (Priorité HAUTE)
- [ ] src/components/accounting/FECImportTab.tsx (3 occurrences)
- [ ] src/components/accounting/LettragePanel.tsx (4 occurrences)
- [ ] src/components/accounting/OptimizedJournalsTab.tsx (4 occurrences)
- [ ] src/components/accounting/OptimizedReportsTab.tsx (6+ occurrences)
- [ ] src/components/ai/AIInsightsDashboard.tsx
- [ ] src/components/ai/PredictiveDashboard.tsx
- [ ] src/components/ai/widgets/AIAssistantChat.tsx
- [ ] src/components/assets/AssetDetailDialog.tsx
- [ ] src/components/assets/AssetFormDialog.tsx
- [ ] src/components/assets/CategoryManagementDialog.tsx
- [ ] src/components/assets/GenerateEntriesDialog.tsx

### Batch 2: Banking & Budget Components
- [ ] src/components/banking/BankAccountFormModal.tsx
- [ ] src/components/banking/BankReconciliation.tsx
- [ ] src/components/banking/TransactionRow.tsx
- [ ] src/components/budget/BudgetCategoryForm.tsx
- [ ] src/components/budget/BudgetForm.tsx
- [ ] src/components/budget/BudgetFormModern.tsx

### Batch 3: Invoicing Components
- [ ] src/components/invoicing/OptimizedQuotesTab.tsx
- [ ] src/components/invoicing/OptimizedInvoicesTab.tsx
- [ ] src/components/invoicing/OptimizedClientsTab.tsx
- [ ] src/components/invoicing/OptimizedPaymentsTab.tsx
- [ ] src/components/invoicing/InvoiceComplianceSettings.tsx
- [ ] src/pages/InvoicingPage.tsx

### Batch 4: Dashboard & Stats
- [ ] src/components/dashboard/RealOperationalDashboard.tsx
- [ ] src/components/dashboard/DashboardWidgetRenderer.tsx
- [ ] src/components/widgets/WidgetRenderer.tsx
- [ ] src/hooks/useWidgetData.ts

### Batch 5: Third Parties & Contracts
- [ ] src/components/third-parties/TransactionsTab.tsx
- [ ] src/components/third-parties/AgingAnalysisTab.tsx
- [ ] src/components/contracts/ContractForm.tsx

### Batch 6: Settings & Modules
- [ ] src/components/settings/CompanySettings.tsx
- [ ] src/components/modules/ModuleManager.tsx
- [ ] src/components/setup/SetupWizard.tsx

### Batch 7: Reports & Analytics
- [ ] src/components/reports/ReportViewer.tsx
- [ ] src/components/reports/DashboardSection.tsx
- [ ] src/components/reports/ReportsKPI.tsx
- [ ] src/pages/Reports/TaxSimulator.tsx
- [ ] src/pages/Reports/LoanSimulator.tsx

### Batch 8: HR & Projects
- [ ] src/components/hr/ExpenseFormModal.tsx
- [ ] src/components/hr/EmployeeFormModal.tsx
- [ ] src/components/hr/ObjectiveFormModal.tsx
- [ ] src/components/hr/HRAnalyticsDashboard.tsx
- [ ] src/components/projects/TimesheetFormModal.tsx
- [ ] src/pages/ProjectsPage.tsx
- [ ] src/pages/projects/*.tsx (5 fichiers)

### Batch 9: Inventory Components
- [ ] src/components/inventory/InventoryDialogs.tsx
- [ ] src/components/inventory/NewArticleModal.tsx
- [ ] src/components/inventory/MovementsTab.tsx
- [ ] src/components/inventory/ProductionOrderCard.tsx
- [ ] src/components/inventory/ProductsTab.tsx
- [ ] src/components/inventory/SuppliersTab.tsx
- [ ] src/components/inventory/InventoryStats.tsx
- [ ] src/pages/inventory/*.tsx (6 fichiers)

### Batch 10: Services (Critiques)
- [ ] src/services/invoicingService.ts
- [ ] src/services/invoicePdfService.ts
- [ ] src/services/pdfService.ts
- [ ] src/services/reportGenerationService.ts
- [ ] src/services/businessPlanService.ts
- [ ] src/services/realDashboardKpiService.ts

### Batch 11: Services (Fiscal & Accounting)
- [ ] src/services/fiscal/FrenchTaxComplianceService.ts
- [ ] src/services/fiscal/TaxIntegrationService.ts
- [ ] src/services/fiscal/TaxSimulationService.ts
- [ ] src/services/accounting/lettrageService.ts
- [ ] src/services/accounting/anomalyDetectionService.ts
- [ ] src/services/fecExportService.ts
- [ ] src/services/fecValidationService.ts
- [ ] src/services/fecService.ts
- [ ] src/services/vatCalculationService.ts

### Batch 12: Services (Banking & Currency)
- [ ] src/services/bankAccountBalanceService.ts
- [ ] src/services/bankMatchingService.ts
- [ ] src/services/currencyConversionService.ts
- [ ] src/services/currencyService.ts
- [ ] src/services/sepaExportService.ts

### Batch 13: Services (AI & Automation)
- [ ] src/services/aiAssistantService.ts
- [ ] src/services/ai/OpenAIService.ts
- [ ] src/services/ai/anomalyDetectionService.ts
- [ ] src/services/ai/cashFlowPredictionService.ts
- [ ] src/services/ai/taxOptimizationService.ts

### Batch 14: Services (Autres)
- [ ] src/services/budgetImportExportService.ts
- [ ] src/services/accountingRulesService.ts
- [ ] src/services/accountingValidationService.ts
- [ ] src/services/AdvancedBusinessValidationService.ts
- [ ] src/services/autoAccountingIntegrationService.ts
- [ ] src/services/workflowExecutionService.ts
- [ ] src/services/onboardingService.ts
- [ ] src/services/teamService.ts
- [ ] src/services/hrDocumentTemplatesService.ts
- [ ] src/services/hrPayrollService.ts
- [ ] src/services/referentialsService.ts
- [ ] src/services/rfaCalculationService.ts
- [ ] src/services/migrationService.ts
- [ ] src/services/marketPricingService.ts
- [ ] src/services/crmExportService.ts
- [ ] src/services/einvoicing/core/ValidationService.ts

### Batch 15: Pages
- [ ] src/pages/BanksPage.tsx
- [ ] src/pages/DocumentationArticlePage.tsx
- [ ] src/pages/GDPRPage.tsx
- [ ] src/pages/TeamPage.tsx
- [ ] src/pages/TermsOfSalePage.tsx
- [ ] src/pages/SalesCrmPage.tsx
- [ ] src/pages/HumanResourcesPage.tsx
- [ ] src/pages/MentionsLegalesPage.tsx
- [ ] src/pages/FAQPage.tsx

### Batch 16: Constants & Utils
- [ ] src/utils/accountingFileParser.ts
- [ ] src/utils/constants.ts
- [ ] src/utils/countries.ts
- [ ] src/data/taxConfigurations.ts
- [ ] src/data/markets.ts
- [ ] src/config/currencies.ts
- [ ] src/constants/templates/allFranceTemplates.ts
- [ ] src/constants/regulatoryCountries.ts

### Batch 17: Documentation & Misc
- [ ] src/pages/docs/TeamManagementGuide.tsx
- [ ] src/pages/documentation/DocumentationArticlesData.tsx
- [ ] src/components/ui/DataTable.tsx
- [ ] src/components/SEO/SEOHelmet.tsx
- [ ] src/components/SubscriptionManager.tsx
- [ ] src/components/subscription/EnterpriseTrialManager.tsx
- [ ] src/components/enterprise/EnterpriseForm.tsx
- [ ] src/components/enterprise/EnterpriseFormTabs.tsx
- [ ] src/components/fiscal/FECExportButton.tsx
- [ ] src/components/fiscal/AutoVATDeclarationButton.tsx
- [ ] src/components/fiscal/FrenchTaxCompliancePanel.tsx
- [ ] src/components/purchases/PurchaseForm.tsx
- [ ] src/components/purchases/ExportUtils.ts
- [ ] src/components/crm/OpportunityPipeline.tsx
- [ ] src/components/crm/OpportunitiesKanban.tsx
- [ ] src/components/invoicing/LateFeeCalculator.tsx

### Batch 18: Tests & Hooks
- [ ] src/hooks/useCurrency.ts
- [ ] src/services/ai/OpenAIService.test.ts
- [ ] src/lib/utils.test.ts
- [ ] src/i18n/i18n.ts

## Vérification après remplacement

### 1. Build TypeScript
```bash
npm run type-check
```

### 2. Build complet
```bash
npm run build
```

### 3. Tests (si disponibles)
```bash
npm test
```

### 4. Vérification manuelle
Rechercher les occurrences restantes:
```bash
grep -r "€" src --include="*.tsx" --include="*.ts" | grep -v "EUR" | grep -v "node_modules"
```

## Notes importantes

1. **Ne PAS modifier** les chaînes statiques comme:
   - Labels/descriptions contenant "€" ou "EUR"
   - Commentaires
   - Strings de configuration

2. **Vérifier** après chaque batch:
   - Pas d'erreurs TypeScript
   - Les imports sont bien ajoutés
   - Le formatage est correct

3. **Cas spéciaux**:
   - Si `amount` peut être `null` ou `undefined`, utiliser: `<CurrencyAmount amount={amount ?? 0} />`
   - Pour les totaux, sommes, etc., préférer `CurrencyAmount`
   - Pour les valeurs dans des attributs HTML, utiliser `formatAmount()`

## Estimation de temps

- **Automatique (script PowerShell)**: 5-10 minutes
- **Manuel (VS Code Find & Replace)**: 30-45 minutes
- **Manuel (fichier par fichier)**: 4-6 heures

## Support

Si des problèmes surviennent:
1. Vérifier que les composants `CurrencyAmount` et le hook `useCompanyCurrency` existent
2. Vérifier les imports
3. Faire un `npm install` si nécessaire
4. Nettoyer le cache: `npm run clean` (si disponible)

---

**Dernière mise à jour**: 2026-01-11
**Fichiers traités**: 3/141
**Progression**: 2%
