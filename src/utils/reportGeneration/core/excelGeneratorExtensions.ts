/**
 * Extensions de l'ExcelGenerator pour les 8 rapports manquants
 * À intégrer dans excelGenerator.ts à la fin de la classe (avant le dernier })
 */

import ExcelJS from 'exceljs';
import type {
  CashFlowData,
  AgedReceivablesData,
  AgedPayablesData,
  FinancialRatiosData,
  BudgetVarianceData,
  KPIDashboardData,
  TaxSummaryData,
  TaxDeclarationVAT,
  ExcelReportConfig
} from '../types';

// Note: Ces méthodes doivent être copiées dans la classe ExcelGenerator

/**
 * 1. Flux de trésorerie (Cash Flow Statement)
 */
public static async generateCashFlowStatement(
  data: CashFlowData,
  config: ExcelReportConfig
): Promise<Blob> {
  const generator = new ExcelGenerator(config);
  const worksheet = generator.workbook.addWorksheet('Flux de trésorerie');

  // En-tête entreprise
  generator.addCompanyHeader(worksheet);
  worksheet.addRow([]);

  // Flux opérationnels
  let row = worksheet.addRow(['FLUX DE TRÉSORERIE LIÉS À L\'ACTIVITÉ']);
  row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  worksheet.addRow(['Résultat net', data.operating_activities.amount]);
  worksheet.addRow(['Description', data.operating_activities.description]);
  worksheet.addRow([]);

  // Flux d'investissement
  row = worksheet.addRow(['FLUX DE TRÉSORERIE LIÉS AUX INVESTISSEMENTS']);
  row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  worksheet.addRow(['Investissements nets', data.investing_activities.amount]);
  worksheet.addRow(['Description', data.investing_activities.description]);
  worksheet.addRow([]);

  // Flux de financement
  row = worksheet.addRow(['FLUX DE TRÉSORERIE LIÉS AU FINANCEMENT']);
  row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  worksheet.addRow(['Financement net', data.financing_activities.amount]);
  worksheet.addRow(['Description', data.financing_activities.description]);
  worksheet.addRow([]);

  // Synthèse
  row = worksheet.addRow(['SYNTHÈSE']);
  row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  worksheet.addRow(['Flux d\'exploitation', data.summary.operating]);
  worksheet.addRow(['Flux d\'investissement', data.summary.investing]);
  worksheet.addRow(['Flux de financement', data.summary.financing]);
  const totalRow = worksheet.addRow(['VARIATION DE TRÉSORERIE', data.summary.net_cash_change]);
  generator.applyTotalStyle(totalRow);

  // Format colonnes
  worksheet.getColumn(1).width = 40;
  worksheet.getColumn(2).width = 20;
  worksheet.getColumn(2).numFmt = '#,##0.00 €';

  return generator.workbook.xlsx.writeBuffer().then(buffer => new Blob([buffer]));
}

/**
 * 2. Clients échéancier (Aged Receivables)
 */
public static async generateAgedReceivables(
  data: AgedReceivablesData,
  config: ExcelReportConfig
): Promise<Blob> {
  const generator = new ExcelGenerator(config);
  const worksheet = generator.workbook.addWorksheet('Clients échéancier');

  // En-tête entreprise
  generator.addCompanyHeader(worksheet);
  worksheet.addRow([]);

  // Synthèse par ancienneté
  const summaryRow = worksheet.addRow(['SYNTHÈSE PAR ANCIENNETÉ', '', '', '', '']);
  summaryRow.font = { bold: true, size: 12 };

  const headerRow = worksheet.addRow(['Ancienneté', 'Montant']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow(['0-30 jours', data.totals.total_current]);
  worksheet.addRow(['31-60 jours', data.totals.total_30]);
  worksheet.addRow(['61-90 jours', data.totals.total_60]);
  worksheet.addRow(['Plus de 90 jours', data.totals.total_90_plus]);

  const totalRow = worksheet.addRow(['TOTAL CRÉANCES', data.totals.total_receivables]);
  generator.applyTotalStyle(totalRow);

  worksheet.addRow([]);

  // Détail par client
  const detailHeaderRow = worksheet.addRow(['Client', 'Total', '0-30j', '31-60j', '61-90j', '90+j']);
  generator.applyHeaderStyle(detailHeaderRow);

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

  // Format colonnes
  worksheet.getColumn(1).width = 30;
  [2, 3, 4, 5, 6].forEach(col => {
    worksheet.getColumn(col).width = 15;
    worksheet.getColumn(col).numFmt = '#,##0.00 €';
  });

  return generator.workbook.xlsx.writeBuffer().then(buffer => new Blob([buffer]));
}

/**
 * 3. Fournisseurs échéancier (Aged Payables)
 */
public static async generateAgedPayables(
  data: AgedPayablesData,
  config: ExcelReportConfig
): Promise<Blob> {
  const generator = new ExcelGenerator(config);
  const worksheet = generator.workbook.addWorksheet('Fournisseurs échéancier');

  // En-tête entreprise
  generator.addCompanyHeader(worksheet);
  worksheet.addRow([]);

  // Synthèse par ancienneté
  const summaryRow = worksheet.addRow(['SYNTHÈSE PAR ANCIENNETÉ', '', '', '', '']);
  summaryRow.font = { bold: true, size: 12 };

  const headerRow = worksheet.addRow(['Ancienneté', 'Montant']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow(['0-30 jours', data.totals.total_current]);
  worksheet.addRow(['31-60 jours', data.totals.total_30]);
  worksheet.addRow(['61-90 jours', data.totals.total_60]);
  worksheet.addRow(['Plus de 90 jours', data.totals.total_90_plus]);

  const totalRow = worksheet.addRow(['TOTAL DETTES', data.totals.total_payables]);
  generator.applyTotalStyle(totalRow);

  worksheet.addRow([]);

  // Détail par fournisseur
  const detailHeaderRow = worksheet.addRow(['Fournisseur', 'Total', '0-30j', '31-60j', '61-90j', '90+j']);
  generator.applyHeaderStyle(detailHeaderRow);

  data.suppliers.forEach(supplier => {
    worksheet.addRow([
      supplier.supplier_name,
      supplier.total_amount,
      supplier.current,
      supplier.days_30,
      supplier.days_60,
      supplier.days_90_plus
    ]);
  });

  // Format colonnes
  worksheet.getColumn(1).width = 30;
  [2, 3, 4, 5, 6].forEach(col => {
    worksheet.getColumn(col).width = 15;
    worksheet.getColumn(col).numFmt = '#,##0.00 €';
  });

  return generator.workbook.xlsx.writeBuffer().then(buffer => new Blob([buffer]));
}

/**
 * 4. Ratios financiers (Financial Ratios)
 */
public static async generateFinancialRatios(
  data: FinancialRatiosData,
  config: ExcelReportConfig
): Promise<Blob> {
  const generator = new ExcelGenerator(config);
  const worksheet = generator.workbook.addWorksheet('Ratios financiers');

  // En-tête entreprise
  generator.addCompanyHeader(worksheet);
  worksheet.addRow([]);

  // Ratios de liquidité
  let sectionRow = worksheet.addRow(['RATIOS DE LIQUIDITÉ']);
  sectionRow.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  let headerRow = worksheet.addRow(['Ratio', 'Valeur', 'Interprétation']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow(['Ratio de liquidité générale', data.liquidity_ratios.current_ratio, data.liquidity_ratios.current_ratio > 1 ? 'Bonne liquidité' : 'Risque']);
  worksheet.addRow(['Ratio de liquidité réduite', data.liquidity_ratios.quick_ratio, data.liquidity_ratios.quick_ratio > 0.8 ? 'Acceptable' : 'Risque']);
  worksheet.addRow(['Ratio de liquidité immédiate', data.liquidity_ratios.cash_ratio, data.liquidity_ratios.cash_ratio > 0.3 ? 'Acceptable' : 'Faible']);
  worksheet.addRow([]);

  // Ratios de rentabilité
  sectionRow = worksheet.addRow(['RATIOS DE RENTABILITÉ']);
  sectionRow.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  headerRow = worksheet.addRow(['Ratio', 'Valeur (%)', 'Interprétation']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow(['Marge brute', data.profitability_ratios.gross_margin, data.profitability_ratios.gross_margin > 20 ? 'Bonne marge' : 'Marge faible']);
  worksheet.addRow(['Marge d\'exploitation', data.profitability_ratios.operating_margin, data.profitability_ratios.operating_margin > 10 ? 'Profitable' : 'Attention']);
  worksheet.addRow(['Marge nette', data.profitability_ratios.net_margin, data.profitability_ratios.net_margin > 5 ? 'Rentable' : 'Faible']);
  worksheet.addRow(['ROA (Return on Assets)', data.profitability_ratios.return_on_assets, data.profitability_ratios.return_on_assets > 5 ? 'Bon' : 'Moyen']);
  worksheet.addRow(['ROE (Return on Equity)', data.profitability_ratios.return_on_equity, data.profitability_ratios.return_on_equity > 10 ? 'Excellent' : 'Moyen']);
  worksheet.addRow([]);

  // Ratios d'endettement
  sectionRow = worksheet.addRow(['RATIOS D\'ENDETTEMENT']);
  sectionRow.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  headerRow = worksheet.addRow(['Ratio', 'Valeur', 'Interprétation']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow(['Taux d\'endettement', data.leverage_ratios.debt_ratio, data.leverage_ratios.debt_ratio < 0.7 ? 'Acceptable' : 'Élevé']);
  worksheet.addRow(['Dettes / Capitaux propres', data.leverage_ratios.debt_to_equity, data.leverage_ratios.debt_to_equity < 2 ? 'Acceptable' : 'Élevé']);
  worksheet.addRow(['Couverture des intérêts', data.leverage_ratios.interest_coverage, data.leverage_ratios.interest_coverage > 3 ? 'Bon' : 'Risque']);
  worksheet.addRow([]);

  // Ratios d'efficacité
  sectionRow = worksheet.addRow(['RATIOS D\'EFFICACITÉ']);
  sectionRow.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  headerRow = worksheet.addRow(['Ratio', 'Valeur', 'Interprétation']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow(['Rotation des actifs', data.efficiency_ratios.asset_turnover, data.efficiency_ratios.asset_turnover > 1 ? 'Efficace' : 'À améliorer']);
  worksheet.addRow(['Rotation des créances', data.efficiency_ratios.receivables_turnover, data.efficiency_ratios.receivables_turnover > 6 ? 'Bon' : 'Lent']);
  worksheet.addRow(['Rotation des dettes', data.efficiency_ratios.payables_turnover, 'Variable']);
  worksheet.addRow(['Rotation des stocks', data.efficiency_ratios.inventory_turnover, data.efficiency_ratios.inventory_turnover > 4 ? 'Bon' : 'Lent']);

  // Format colonnes
  worksheet.getColumn(1).width = 35;
  worksheet.getColumn(2).width = 15;
  worksheet.getColumn(3).width = 20;
  worksheet.getColumn(2).numFmt = '#,##0.00';

  return generator.workbook.xlsx.writeBuffer().then(buffer => new Blob([buffer]));
}

/**
 * 5. Déclaration TVA (VAT Report)
 */
public static async generateVATReport(
  data: TaxDeclarationVAT,
  config: ExcelReportConfig
): Promise<Blob> {
  const generator = new ExcelGenerator(config);
  const worksheet = generator.workbook.addWorksheet('Déclaration TVA');

  // En-tête entreprise
  generator.addCompanyHeader(worksheet);
  worksheet.addRow([]);

  // Synthèse TVA
  let row = worksheet.addRow(['DÉCLARATION TVA - ' + data.declaration_type]);
  row.font = { bold: true, size: 14, color: { argb: 'FF2C3E50' } };
  worksheet.addRow([]);

  const headerRow = worksheet.addRow(['Élément', 'Montant']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow(['TVA collectée (44571)', data.vat_collected]);
  worksheet.addRow(['TVA déductible (44566)', data.vat_deductible]);

  const totalRow = worksheet.addRow(['TVA À PAYER / CRÉDIT', data.vat_to_pay]);
  generator.applyTotalStyle(totalRow);

  worksheet.addRow([]);

  // Bases de calcul
  row = worksheet.addRow(['BASES DE CALCUL']);
  row.font = { bold: true, size: 12 };
  const basesHeaderRow = worksheet.addRow(['Base', 'Montant HT']);
  generator.applyHeaderStyle(basesHeaderRow);

  worksheet.addRow(['Ventes', data.sales_amount_ht]);
  worksheet.addRow(['Achats', data.purchases_amount_ht]);
  worksheet.addRow([]);

  // Détails comptables
  row = worksheet.addRow(['DÉTAILS COMPTABLES']);
  row.font = { bold: true, size: 12 };
  const detailsHeaderRow = worksheet.addRow(['Compte', 'Solde']);
  generator.applyHeaderStyle(detailsHeaderRow);

  worksheet.addRow(['Compte 44571 (TVA collectée)', data.details.account_44571_balance]);
  worksheet.addRow(['Compte 44566 (TVA déductible)', data.details.account_44566_balance]);
  if (data.details.adjustments) {
    worksheet.addRow(['Ajustements', data.details.adjustments]);
  }

  // Format colonnes
  worksheet.getColumn(1).width = 35;
  worksheet.getColumn(2).width = 20;
  worksheet.getColumn(2).numFmt = '#,##0.00 €';

  // Mettre en évidence TVA à payer
  if (data.vat_to_pay > 0) {
    totalRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE0E0' }
    };
  } else {
    totalRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0FFE0' }
    };
  }

  return generator.workbook.xlsx.writeBuffer().then(buffer => new Blob([buffer]));
}

/**
 * 6. Analyse budgétaire (Budget Variance)
 */
public static async generateBudgetVariance(
  data: BudgetVarianceData,
  config: ExcelReportConfig
): Promise<Blob> {
  const generator = new ExcelGenerator(config);
  const worksheet = generator.workbook.addWorksheet('Analyse budgétaire');

  // En-tête entreprise
  generator.addCompanyHeader(worksheet);
  worksheet.addRow([]);

  // Synthèse globale
  let row = worksheet.addRow(['SYNTHÈSE GLOBALE']);
  row.font = { bold: true, size: 14, color: { argb: 'FF2C3E50' } };
  worksheet.addRow([]);

  const summaryHeaderRow = worksheet.addRow(['Élément', 'Montant']);
  generator.applyHeaderStyle(summaryHeaderRow);

  worksheet.addRow(['Revenus budgétés', data.summary.total_revenue_budget]);
  worksheet.addRow(['Revenus réalisés', data.summary.total_revenue_actual]);
  worksheet.addRow(['Écart revenus', data.summary.total_revenue_variance]);
  worksheet.addRow([]);
  worksheet.addRow(['Charges budgétées', data.summary.total_expense_budget]);
  worksheet.addRow(['Charges réalisées', data.summary.total_expense_actual]);
  worksheet.addRow(['Écart charges', data.summary.total_expense_variance]);
  worksheet.addRow([]);
  worksheet.addRow(['Résultat budgété', data.summary.net_income_budget]);
  worksheet.addRow(['Résultat réalisé', data.summary.net_income_actual]);

  const resultRow = worksheet.addRow(['ÉCART RÉSULTAT', data.summary.net_income_variance]);
  generator.applyTotalStyle(resultRow);
  worksheet.addRow([]);

  // Analyse des revenus
  row = worksheet.addRow(['ANALYSE DES REVENUS']);
  row.font = { bold: true, size: 12 };
  const revenueHeaderRow = worksheet.addRow(['Compte', 'Libellé', 'Budget', 'Réalisé', 'Écart', 'Écart %']);
  generator.applyHeaderStyle(revenueHeaderRow);

  data.revenue_analysis.forEach(item => {
    const itemRow = worksheet.addRow([
      item.account_number,
      item.account_name,
      item.budget,
      item.actual,
      item.variance,
      item.variance_percentage / 100
    ]);

    // Colorer les écarts négatifs
    if (item.variance < 0) {
      itemRow.getCell(5).font = { color: { argb: 'FFDC3545' } };
    }
  });

  worksheet.addRow([]);

  // Analyse des charges
  row = worksheet.addRow(['ANALYSE DES CHARGES']);
  row.font = { bold: true, size: 12 };
  const expenseHeaderRow = worksheet.addRow(['Compte', 'Libellé', 'Budget', 'Réalisé', 'Écart', 'Écart %']);
  generator.applyHeaderStyle(expenseHeaderRow);

  data.expense_analysis.forEach(item => {
    const itemRow = worksheet.addRow([
      item.account_number,
      item.account_name,
      item.budget,
      item.actual,
      item.variance,
      item.variance_percentage / 100
    ]);

    // Colorer les dépassements
    if (item.variance > 0) {
      itemRow.getCell(5).font = { color: { argb: 'FFDC3545' } };
    }
  });

  // Format colonnes
  worksheet.getColumn(1).width = 10;
  worksheet.getColumn(2).width = 30;
  [3, 4, 5].forEach(col => {
    worksheet.getColumn(col).width = 15;
    worksheet.getColumn(col).numFmt = '#,##0.00 €';
  });
  worksheet.getColumn(6).width = 12;
  worksheet.getColumn(6).numFmt = '0.0%';

  return generator.workbook.xlsx.writeBuffer().then(buffer => new Blob([buffer]));
}

/**
 * 7. Tableau de bord KPI (KPI Dashboard)
 */
public static async generateKPIDashboard(
  data: KPIDashboardData,
  config: ExcelReportConfig
): Promise<Blob> {
  const generator = new ExcelGenerator(config);
  const worksheet = generator.workbook.addWorksheet('Tableau de bord KPI');

  // En-tête entreprise
  generator.addCompanyHeader(worksheet);
  worksheet.addRow([]);

  // KPIs Financiers
  let row = worksheet.addRow(['INDICATEURS FINANCIERS']);
  row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  let headerRow = worksheet.addRow(['KPI', 'Valeur', 'Tendance', 'Objectif']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow([
    'Chiffre d\'affaires',
    data.financial_kpis.revenue.value,
    data.financial_kpis.revenue.trend / 100,
    data.financial_kpis.revenue.target || ''
  ]);
  worksheet.addRow([
    'Résultat net',
    data.financial_kpis.profit.value,
    data.financial_kpis.profit.trend / 100,
    data.financial_kpis.profit.target || ''
  ]);
  worksheet.addRow([
    'Trésorerie',
    data.financial_kpis.cash.value,
    data.financial_kpis.cash.trend / 100,
    data.financial_kpis.cash.target || ''
  ]);
  worksheet.addRow([
    'Marge nette (%)',
    data.financial_kpis.margin.value,
    data.financial_kpis.margin.trend / 100,
    data.financial_kpis.margin.target || ''
  ]);
  worksheet.addRow([]);

  // KPIs Opérationnels
  row = worksheet.addRow(['INDICATEURS OPÉRATIONNELS']);
  row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  headerRow = worksheet.addRow(['KPI', 'Valeur', 'Tendance', 'Objectif']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow([
    'Factures émises',
    data.operational_kpis.invoices_sent.value,
    data.operational_kpis.invoices_sent.trend / 100,
    data.operational_kpis.invoices_sent.target || ''
  ]);
  worksheet.addRow([
    'Factures payées',
    data.operational_kpis.invoices_paid.value,
    data.operational_kpis.invoices_paid.trend / 100,
    data.operational_kpis.invoices_paid.target || ''
  ]);
  worksheet.addRow([
    'Délai encaissement (jours)',
    data.operational_kpis.average_collection_days.value,
    data.operational_kpis.average_collection_days.trend / 100,
    data.operational_kpis.average_collection_days.target || ''
  ]);
  worksheet.addRow([
    'Délai paiement (jours)',
    data.operational_kpis.average_payment_days.value,
    data.operational_kpis.average_payment_days.trend / 100,
    data.operational_kpis.average_payment_days.target || ''
  ]);
  worksheet.addRow([]);

  // KPIs Clients
  row = worksheet.addRow(['INDICATEURS CLIENTS']);
  row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  headerRow = worksheet.addRow(['KPI', 'Valeur', 'Tendance', 'Objectif']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow([
    'Nombre total de clients',
    data.customer_kpis.total_customers.value,
    data.customer_kpis.total_customers.trend / 100,
    data.customer_kpis.total_customers.target || ''
  ]);
  worksheet.addRow([
    'Clients actifs',
    data.customer_kpis.active_customers.value,
    data.customer_kpis.active_customers.trend / 100,
    data.customer_kpis.active_customers.target || ''
  ]);
  worksheet.addRow([
    'Taux de rétention (%)',
    data.customer_kpis.customer_retention.value,
    data.customer_kpis.customer_retention.trend / 100,
    data.customer_kpis.customer_retention.target || ''
  ]);
  worksheet.addRow([
    'Valeur moyenne facture',
    data.customer_kpis.average_invoice_value.value,
    data.customer_kpis.average_invoice_value.trend / 100,
    data.customer_kpis.average_invoice_value.target || ''
  ]);

  // Format colonnes
  worksheet.getColumn(1).width = 30;
  worksheet.getColumn(2).width = 15;
  worksheet.getColumn(3).width = 12;
  worksheet.getColumn(4).width = 15;
  worksheet.getColumn(3).numFmt = '0.0%';

  // Colorer les tendances
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 5) {
      const trendCell = row.getCell(3);
      const trendValue = trendCell.value as number;
      if (typeof trendValue === 'number') {
        if (trendValue > 0) {
          trendCell.font = { color: { argb: 'FF22C55E' }, bold: true };
        } else if (trendValue < 0) {
          trendCell.font = { color: { argb: 'FFDC3545' }, bold: true };
        }
      }
    }
  });

  return generator.workbook.xlsx.writeBuffer().then(buffer => new Blob([buffer]));
}

/**
 * 8. Synthèse fiscale (Tax Summary)
 */
public static async generateTaxSummary(
  data: TaxSummaryData,
  config: ExcelReportConfig
): Promise<Blob> {
  const generator = new ExcelGenerator(config);
  const worksheet = generator.workbook.addWorksheet('Synthèse fiscale');

  // En-tête entreprise
  generator.addCompanyHeader(worksheet);
  worksheet.addRow([]);

  // Synthèse TVA
  let row = worksheet.addRow(['SYNTHÈSE TVA']);
  row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  let headerRow = worksheet.addRow(['Élément', 'Montant']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow(['TVA collectée totale', data.vat_summary.total_vat_collected]);
  worksheet.addRow(['TVA déductible totale', data.vat_summary.total_vat_deductible]);

  const vatTotalRow = worksheet.addRow(['Position nette TVA', data.vat_summary.net_vat_position]);
  generator.applyTotalStyle(vatTotalRow);
  worksheet.addRow([]);

  // Impôt sur les Sociétés
  row = worksheet.addRow(['IMPÔT SUR LES SOCIÉTÉS']);
  row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  headerRow = worksheet.addRow(['Élément', 'Montant']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow(['Résultat imposable', data.corporate_tax_summary.taxable_income]);
  worksheet.addRow(['Taux d\'imposition', `${data.corporate_tax_summary.tax_rate}%`]);
  worksheet.addRow(['Impôt sur les sociétés', data.corporate_tax_summary.corporate_tax]);
  worksheet.addRow(['Crédits d\'impôt', data.corporate_tax_summary.tax_credits]);

  const isTotalRow = worksheet.addRow(['IMPÔT NET À PAYER', data.corporate_tax_summary.net_tax_due]);
  generator.applyTotalStyle(isTotalRow);
  worksheet.addRow([]);

  // Cotisations sociales
  row = worksheet.addRow(['COTISATIONS SOCIALES']);
  row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
  headerRow = worksheet.addRow(['Type', 'Montant']);
  generator.applyHeaderStyle(headerRow);

  worksheet.addRow(['Cotisations patronales', data.social_contributions.employer_contributions]);
  worksheet.addRow(['Cotisations salariales', data.social_contributions.employee_contributions]);

  const socialTotalRow = worksheet.addRow(['TOTAL COTISATIONS', data.social_contributions.total_contributions]);
  generator.applyTotalStyle(socialTotalRow);
  worksheet.addRow([]);

  // Échéances fiscales
  if (data.tax_deadlines.length > 0) {
    row = worksheet.addRow(['ÉCHÉANCES FISCALES À VENIR']);
    row.font = { bold: true, size: 12, color: { argb: 'FF2C3E50' } };
    headerRow = worksheet.addRow(['Date', 'Type', 'Description', 'Montant estimé']);
    generator.applyHeaderStyle(headerRow);

    data.tax_deadlines.forEach(deadline => {
      worksheet.addRow([
        new Date(deadline.date).toLocaleDateString('fr-FR'),
        deadline.type,
        deadline.description,
        deadline.estimated_amount || ''
      ]);
    });
  }

  // Format colonnes
  worksheet.getColumn(1).width = 30;
  worksheet.getColumn(2).width = 20;
  worksheet.getColumn(3).width = 35;
  worksheet.getColumn(4).width = 20;
  worksheet.getColumn(2).numFmt = '#,##0.00 €';
  worksheet.getColumn(4).numFmt = '#,##0.00 €';

  return generator.workbook.xlsx.writeBuffer().then(buffer => new Blob([buffer]));
}
