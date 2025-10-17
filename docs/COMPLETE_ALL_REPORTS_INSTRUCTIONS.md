# Instructions pour compléter tous les 8 rapports manquants

## État actuel

✅ **Implémenté** :
- Bilan (Balance Sheet)
- Compte de Résultat (Income Statement)
- Balance Générale (Trial Balance)
- Grand Livre (General Ledger)
- Déclaration TVA (VAT Report) - Existe déjà
- Flux de trésorerie (Cash Flow) - Partiellement

❌ **Manquants** :
- Clients échéancier (Aged Receivables)
- Fournisseurs échéancier (Aged Payables)
- Ratios financiers (Financial Ratios)
- Analyse budgétaire (Budget Variance)
- Tableau de bord KPI (KPI Dashboard)
- Synthèse fiscale (Tax Summary)

## Fichiers créés

### 1. Types ajoutés ✅
**Fichier**: `src/utils/reportGeneration/types.ts`

Tous les types nécessaires ont été ajoutés (lignes 258-455):
- `AgedReceivablesData`
- `AgedPayablesData`
- `FinancialRatiosData`
- `BudgetVarianceData`
- `KPIDashboardData`
- `TaxSummaryData`

### 2. Méthodes du service ✅
**Fichier**: `src/services/reportsServiceExtensions.ts` (nouveau fichier créé)

Contient toutes les 6 méthodes prêtes à intégrer:
- `generateAgedReceivables(companyId, asOfDate)`
- `generateAgedPayables(companyId, asOfDate)`
- `generateFinancialRatios(companyId, periodStart, periodEnd)`
- `generateBudgetVariance(companyId, periodStart, periodEnd)`
- `generateKPIDashboard(companyId, periodStart, periodEnd)`
- `generateTaxSummary(companyId, fiscalYear)`

## Actions requises

### Étape 1: Intégrer les méthodes dans reportsService.ts

**Ouvrir** : `src/services/reportsService.ts`

**À la ligne 1147** (juste avant `}`), ajouter le contenu du fichier `src/services/reportsServiceExtensions.ts` (lignes 17-616).

OU plus simplement, copier-coller les 6 méthodes depuis `reportsServiceExtensions.ts` à la fin de la classe `ReportsService` dans `reportsService.ts`.

### Étape 2: Mettre à jour OptimizedReportsTab.tsx

**Fichier**: `src/components/accounting/OptimizedReportsTab.tsx`

**Dans la fonction `handleGenerateReport`**, ajouter les cas manquants dans le `switch` statement (après le cas `general_ledger`, ligne ~610):

```typescript
case 'aged_receivables':
  result = await reportsService.generateAgedReceivables(currentCompany.id, periodDates.end);
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error('Aucune donnée retournée');

  // Vérifier données vides
  if (!result.data.customers || result.data.customers.length === 0) {
    setEmptyStateReport({ type: reportType, name: reportName });
    showToast('Aucune facture impayée pour cette période', 'info');
    return;
  }

  // TODO: Générer PDF/Excel (à implémenter)
  showToast('Rapport Clients échéancier généré', 'success');
  break;

case 'aged_payables':
  result = await reportsService.generateAgedPayables(currentCompany.id, periodDates.end);
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error('Aucune donnée retournée');

  if (!result.data.suppliers || result.data.suppliers.length === 0) {
    setEmptyStateReport({ type: reportType, name: reportName });
    showToast('Aucune facture fournisseur impayée', 'info');
    return;
  }

  // TODO: Générer PDF/Excel
  showToast('Rapport Fournisseurs échéancier généré', 'success');
  break;

case 'financial_ratios':
  result = await reportsService.generateFinancialRatios(currentCompany.id, periodDates.start, periodDates.end);
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error('Aucune donnée retournée');

  // TODO: Générer PDF/Excel
  showToast('Rapport Ratios financiers généré', 'success');
  break;

case 'vat_report':
  result = await reportsService.generateVATDeclaration(currentCompany.id, periodDates.start, periodDates.end);
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error('Aucune donnée retournée');

  // TODO: Générer PDF/Excel
  showToast('Déclaration TVA générée', 'success');
  break;

case 'budget_variance':
  result = await reportsService.generateBudgetVariance(currentCompany.id, periodDates.start, periodDates.end);
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error('Aucune donnée retournée');

  // TODO: Générer PDF/Excel
  showToast('Analyse budgétaire générée', 'success');
  break;

case 'kpi_dashboard':
  result = await reportsService.generateKPIDashboard(currentCompany.id, periodDates.start, periodDates.end);
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error('Aucune donnée retournée');

  // TODO: Générer PDF/Excel
  showToast('Tableau de bord KPI généré', 'success');
  break;

case 'tax_summary':
  const fiscalYear = new Date(periodDates.end).getFullYear().toString();
  result = await reportsService.generateTaxSummary(currentCompany.id, fiscalYear);
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error('Aucune donnée retournée');

  // TODO: Générer PDF/Excel
  showToast('Synthèse fiscale générée', 'success');
  break;
```

### Étape 3: Créer les générateurs PDF (Phase 2)

Pour chaque rapport, créer les méthodes dans `pdfGenerator.ts` :

```typescript
// Dans src/utils/reportGeneration/core/pdfGenerator.ts

public static generateAgedReceivables(data: AgedReceivablesData, config: PDFReportConfig): PDFGenerator {
  const generator = new PDFGenerator(config);

  // En-tête
  generator.addTitle('CLIENTS ÉCHÉANCIER');
  generator.addSubtitle(`Date: ${new Date(data.report_date).toLocaleDateString('fr-FR')}`);

  // Tableau récapitulatif
  const summary = [
    ['0-30 jours', generator.formatCurrency(data.totals.total_current)],
    ['31-60 jours', generator.formatCurrency(data.totals.total_30)],
    ['61-90 jours', generator.formatCurrency(data.totals.total_60)],
    ['90+ jours', generator.formatCurrency(data.totals.total_90_plus)],
    ['TOTAL', generator.formatCurrency(data.totals.total_receivables)]
  ];

  generator.addTable(['Ancienneté', 'Montant'], summary);

  // Détail par client
  generator.addSectionTitle('Détail par client');
  data.customers.forEach(customer => {
    generator.addText(`${customer.customer_name} - ${generator.formatCurrency(customer.total_amount)}`);
  });

  return generator;
}

// Répéter pour les autres rapports...
```

### Étape 4: Créer les générateurs Excel (Phase 2)

Pour chaque rapport, créer les méthodes dans `excelGenerator.ts` :

```typescript
// Dans src/utils/reportGeneration/core/excelGenerator.ts

public static async generateAgedReceivables(
  data: AgedReceivablesData,
  config: ExcelReportConfig
): Promise<Blob> {
  const generator = new ExcelGenerator(config);
  const worksheet = generator.workbook.addWorksheet('Clients échéancier');

  // En-tête entreprise
  generator.addCompanyHeader(worksheet);

  // Tableau de données
  const headerRow = worksheet.addRow(['Client', 'Total', '0-30j', '31-60j', '61-90j', '90+j']);
  generator.applyHeaderStyle(headerRow);

  data.customers.forEach(customer => {
    worksheet.addRow([
      customer.customer_name,
      customer.total_amount,
      customer.current,
      customer.days_30,
      customer.days_60,
      customer.days_90_plus
    ]);
  });

  // Total
  const totalRow = worksheet.addRow([
    'TOTAL',
    data.totals.total_receivables,
    data.totals.total_current,
    data.totals.total_30,
    data.totals.total_60,
    data.totals.total_90_plus
  ]);
  generator.applyTotalStyle(totalRow);

  return generator.workbook.xlsx.writeBuffer().then(buffer => new Blob([buffer]));
}

// Répéter pour les autres rapports...
```

### Étape 5: Mise à jour des imports

**Dans `OptimizedReportsTab.tsx`**, ajouter les imports des nouveaux types:

```typescript
import type {
  BalanceSheetData,
  IncomeStatementData,
  TrialBalanceData,
  GeneralLedgerData,
  AgedReceivablesData,
  AgedPayablesData,
  FinancialRatiosData,
  BudgetVarianceData,
  KPIDashboardData,
  TaxSummaryData,
  PDFReportConfig,
  ExcelReportConfig,
  CompanyInfo
} from '@/utils/reportGeneration/types';
```

## Ordre d'implémentation recommandé

### Phase 1: Service + UI de base (ACTUEL)
1. ✅ Types créés
2. ✅ Méthodes service créées (dans `reportsServiceExtensions.ts`)
3. ⏳ Intégrer méthodes dans `reportsService.ts`
4. ⏳ Ajouter switch cases dans `OptimizedReportsTab.tsx`
5. ⏳ Tester que les données sont récupérées

### Phase 2: Générateurs PDF/Excel
1. Créer générateurs PDF pour les 6 rapports
2. Créer générateurs Excel pour les 6 rapports
3. Intégrer dans handleGenerateReport (remplacer TODO)
4. Tester génération PDF + Excel

### Phase 3: Polish
1. Ajouter Empty States personnalisés
2. Upload automatique vers Storage
3. Tests complets
4. Documentation

## Commandes rapides

### Intégrer les méthodes automatiquement

Vous pouvez copier le contenu avec cette commande:

```bash
# Afficher les méthodes à copier
cat src/services/reportsServiceExtensions.ts

# Ouvrir le fichier pour édition
code src/services/reportsService.ts
```

Puis coller à la ligne 1147, juste avant le `}` final de la classe.

### Vérifier que tout compile

```bash
npm run type-check
```

## Temps estimé

- **Phase 1** (Service + UI): 30 minutes
- **Phase 2** (PDF + Excel): 2-3 heures
- **Phase 3** (Polish): 30 minutes

**Total**: ~3-4 heures pour TOUS les rapports

## Fichiers à éditer - Résumé

1. ✅ `src/utils/reportGeneration/types.ts` - Types ajoutés
2. ⏳ `src/services/reportsService.ts` - Ajouter 6 méthodes (copier de reportsServiceExtensions.ts)
3. ⏳ `src/components/accounting/OptimizedReportsTab.tsx` - Ajouter 7 switch cases
4. ⏳ `src/utils/reportGeneration/core/pdfGenerator.ts` - Ajouter 6 méthodes
5. ⏳ `src/utils/reportGeneration/core/excelGenerator.ts` - Ajouter 6 méthodes

## Questions?

Si besoin d'aide pour une étape spécifique, demandez-moi et je fournirai le code exact pour cette partie.

---

**Note**: Une fois Phase 1 terminée, tous les rapports seront "fonctionnels" (ils récupèrent les données) mais afficheront juste un toast au lieu de générer le PDF/Excel. C'est suffisant pour tester que tout fonctionne avant d'implémenter les générateurs.
