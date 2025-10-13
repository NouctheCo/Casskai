/**
 * Extensions du PDFGenerator pour les 8 rapports manquants
 * À intégrer dans pdfGenerator.ts à la fin de la classe (avant le dernier })
 */

import type {
  CashFlowData,
  AgedReceivablesData,
  AgedPayablesData,
  FinancialRatiosData,
  BudgetVarianceData,
  KPIDashboardData,
  TaxSummaryData,
  TaxDeclarationVAT,
  PDFReportConfig
} from '../types';

// Note: Ces méthodes doivent être copiées dans la classe PDFGenerator

/**
 * 1. Flux de trésorerie (Cash Flow Statement)
 */
public static generateCashFlowStatement(data: CashFlowData, config: PDFReportConfig): PDFGenerator {
  const pdf = new PDFGenerator(config);

  pdf.addTitle('TABLEAU DE FLUX DE TRÉSORERIE');
  pdf.addSubtitle(`Période: ${new Date(data.period_start).toLocaleDateString('fr-FR')} - ${new Date(data.period_end).toLocaleDateString('fr-FR')}`);
  pdf.addCompanyInfo();

  // Section 1: Flux de trésorerie liés à l'activité
  pdf.addSectionTitle('FLUX DE TRÉSORERIE LIÉS À L\'ACTIVITÉ');
  const operatingData = [
    ['Résultat net', pdf.formatCurrency(data.operating_activities.amount, data.currency)],
    ['Description', data.operating_activities.description || '-']
  ];
  pdf.addTable(['Élément', 'Montant'], operatingData);

  // Section 2: Flux de trésorerie liés aux investissements
  pdf.addSectionTitle('FLUX DE TRÉSORERIE LIÉS AUX INVESTISSEMENTS');
  const investingData = [
    ['Investissements nets', pdf.formatCurrency(data.investing_activities.amount, data.currency)],
    ['Description', data.investing_activities.description || '-']
  ];
  pdf.addTable(['Élément', 'Montant'], investingData);

  // Section 3: Flux de trésorerie liés au financement
  pdf.addSectionTitle('FLUX DE TRÉSORERIE LIÉS AU FINANCEMENT');
  const financingData = [
    ['Financement net', pdf.formatCurrency(data.financing_activities.amount, data.currency)],
    ['Description', data.financing_activities.description || '-']
  ];
  pdf.addTable(['Élément', 'Montant'], financingData);

  // Synthèse
  pdf.addSectionTitle('SYNTHÈSE DES FLUX DE TRÉSORERIE');
  const summaryData = [
    ['Flux d\'exploitation', pdf.formatCurrency(data.summary.operating, data.currency)],
    ['Flux d\'investissement', pdf.formatCurrency(data.summary.investing, data.currency)],
    ['Flux de financement', pdf.formatCurrency(data.summary.financing, data.currency)],
    ['VARIATION DE TRÉSORERIE', pdf.formatCurrency(data.summary.net_cash_change, data.currency)]
  ];
  pdf.addTable(['Flux', 'Montant'], summaryData, { highlightLastRow: true });

  return pdf;
}

/**
 * 2. Clients échéancier (Aged Receivables)
 */
public static generateAgedReceivables(data: AgedReceivablesData, config: PDFReportConfig): PDFGenerator {
  const pdf = new PDFGenerator(config);

  pdf.addTitle('CLIENTS ÉCHÉANCIER');
  pdf.addSubtitle(`Date: ${new Date(data.report_date).toLocaleDateString('fr-FR')}`);
  pdf.addCompanyInfo();

  // Synthèse par ancienneté
  pdf.addSectionTitle('SYNTHÈSE PAR ANCIENNETÉ');
  const summaryData = [
    ['0-30 jours (à échoir)', pdf.formatCurrency(data.totals.total_current, data.currency)],
    ['31-60 jours', pdf.formatCurrency(data.totals.total_30, data.currency)],
    ['61-90 jours', pdf.formatCurrency(data.totals.total_60, data.currency)],
    ['Plus de 90 jours', pdf.formatCurrency(data.totals.total_90_plus, data.currency)],
    ['TOTAL CRÉANCES', pdf.formatCurrency(data.totals.total_receivables, data.currency)]
  ];
  pdf.addTable(['Ancienneté', 'Montant'], summaryData, { highlightLastRow: true });

  // Détail par client
  pdf.addSectionTitle('DÉTAIL PAR CLIENT');

  if (data.customers.length === 0) {
    pdf.addText('Aucune créance client en cours.');
  } else {
    data.customers.forEach((customer, index) => {
      if (index > 0 && pdf.currentY > 250) {
        pdf.addPage();
      }

      pdf.doc.setFont('helvetica', 'bold');
      pdf.doc.setFontSize(11);
      pdf.doc.text(customer.customer_name, 20, pdf.currentY);
      pdf.doc.setFont('helvetica', 'normal');
      pdf.doc.setFontSize(10);
      pdf.doc.text(pdf.formatCurrency(customer.total_amount, data.currency), 195, pdf.currentY, { align: 'right' });
      pdf.currentY += 6;

      const customerDetails = [
        ['À échoir', pdf.formatCurrency(customer.current, data.currency)],
        ['31-60j', pdf.formatCurrency(customer.days_30, data.currency)],
        ['61-90j', pdf.formatCurrency(customer.days_60, data.currency)],
        ['90+j', pdf.formatCurrency(customer.days_90_plus, data.currency)]
      ];

      pdf.addTable(['Ancienneté', 'Montant'], customerDetails, { compact: true });
      pdf.currentY += 4;
    });
  }

  return pdf;
}

/**
 * 3. Fournisseurs échéancier (Aged Payables)
 */
public static generateAgedPayables(data: AgedPayablesData, config: PDFReportConfig): PDFGenerator {
  const pdf = new PDFGenerator(config);

  pdf.addTitle('FOURNISSEURS ÉCHÉANCIER');
  pdf.addSubtitle(`Date: ${new Date(data.report_date).toLocaleDateString('fr-FR')}`);
  pdf.addCompanyInfo();

  // Synthèse par ancienneté
  pdf.addSectionTitle('SYNTHÈSE PAR ANCIENNETÉ');
  const summaryData = [
    ['0-30 jours (à payer)', pdf.formatCurrency(data.totals.total_current, data.currency)],
    ['31-60 jours', pdf.formatCurrency(data.totals.total_30, data.currency)],
    ['61-90 jours', pdf.formatCurrency(data.totals.total_60, data.currency)],
    ['Plus de 90 jours', pdf.formatCurrency(data.totals.total_90_plus, data.currency)],
    ['TOTAL DETTES', pdf.formatCurrency(data.totals.total_payables, data.currency)]
  ];
  pdf.addTable(['Ancienneté', 'Montant'], summaryData, { highlightLastRow: true });

  // Détail par fournisseur
  pdf.addSectionTitle('DÉTAIL PAR FOURNISSEUR');

  if (data.suppliers.length === 0) {
    pdf.addText('Aucune dette fournisseur en cours.');
  } else {
    data.suppliers.forEach((supplier, index) => {
      if (index > 0 && pdf.currentY > 250) {
        pdf.addPage();
      }

      pdf.doc.setFont('helvetica', 'bold');
      pdf.doc.setFontSize(11);
      pdf.doc.text(supplier.supplier_name, 20, pdf.currentY);
      pdf.doc.setFont('helvetica', 'normal');
      pdf.doc.setFontSize(10);
      pdf.doc.text(pdf.formatCurrency(supplier.total_amount, data.currency), 195, pdf.currentY, { align: 'right' });
      pdf.currentY += 6;

      const supplierDetails = [
        ['À payer', pdf.formatCurrency(supplier.current, data.currency)],
        ['31-60j', pdf.formatCurrency(supplier.days_30, data.currency)],
        ['61-90j', pdf.formatCurrency(supplier.days_60, data.currency)],
        ['90+j', pdf.formatCurrency(supplier.days_90_plus, data.currency)]
      ];

      pdf.addTable(['Ancienneté', 'Montant'], supplierDetails, { compact: true });
      pdf.currentY += 4;
    });
  }

  return pdf;
}

/**
 * 4. Ratios financiers (Financial Ratios)
 */
public static generateFinancialRatios(data: FinancialRatiosData, config: PDFReportConfig): PDFGenerator {
  const pdf = new PDFGenerator(config);

  pdf.addTitle('RATIOS FINANCIERS');
  pdf.addSubtitle(`Période: ${new Date(data.period_start).toLocaleDateString('fr-FR')} - ${new Date(data.period_end).toLocaleDateString('fr-FR')}`);
  pdf.addCompanyInfo();

  // Ratios de liquidité
  pdf.addSectionTitle('RATIOS DE LIQUIDITÉ');
  const liquidityData = [
    ['Ratio de liquidité générale (Current Ratio)', data.liquidity_ratios.current_ratio.toFixed(2)],
    ['Ratio de liquidité réduite (Quick Ratio)', data.liquidity_ratios.quick_ratio.toFixed(2)],
    ['Ratio de liquidité immédiate (Cash Ratio)', data.liquidity_ratios.cash_ratio.toFixed(2)]
  ];
  pdf.addTable(['Ratio', 'Valeur'], liquidityData);

  pdf.addText('• Ratio > 1 : Bonne liquidité', 14, true);
  pdf.addText('• Ratio < 1 : Risque de liquidité', 14, true);

  // Ratios de rentabilité
  pdf.addSectionTitle('RATIOS DE RENTABILITÉ');
  const profitabilityData = [
    ['Marge brute (%)', `${data.profitability_ratios.gross_margin.toFixed(2)}%`],
    ['Marge d\'exploitation (%)', `${data.profitability_ratios.operating_margin.toFixed(2)}%`],
    ['Marge nette (%)', `${data.profitability_ratios.net_margin.toFixed(2)}%`],
    ['Rentabilité des actifs - ROA (%)', `${data.profitability_ratios.return_on_assets.toFixed(2)}%`],
    ['Rentabilité des capitaux propres - ROE (%)', `${data.profitability_ratios.return_on_equity.toFixed(2)}%`]
  ];
  pdf.addTable(['Ratio', 'Valeur'], profitabilityData);

  // Ratios d'endettement
  pdf.addSectionTitle('RATIOS D\'ENDETTEMENT');
  const leverageData = [
    ['Taux d\'endettement', data.leverage_ratios.debt_ratio.toFixed(2)],
    ['Dettes / Capitaux propres', data.leverage_ratios.debt_to_equity.toFixed(2)],
    ['Couverture des intérêts', data.leverage_ratios.interest_coverage.toFixed(2)]
  ];
  pdf.addTable(['Ratio', 'Valeur'], leverageData);

  // Ratios d'efficacité
  if (pdf.currentY > 200) pdf.addPage();
  pdf.addSectionTitle('RATIOS D\'EFFICACITÉ');
  const efficiencyData = [
    ['Rotation des actifs', data.efficiency_ratios.asset_turnover.toFixed(2)],
    ['Rotation des créances clients', data.efficiency_ratios.receivables_turnover.toFixed(2)],
    ['Rotation des dettes fournisseurs', data.efficiency_ratios.payables_turnover.toFixed(2)],
    ['Rotation des stocks', data.efficiency_ratios.inventory_turnover.toFixed(2)]
  ];
  pdf.addTable(['Ratio', 'Valeur'], efficiencyData);

  // Note d'interprétation
  pdf.currentY += 10;
  pdf.doc.setFontSize(9);
  pdf.doc.setTextColor(100, 100, 100);
  pdf.doc.text('Note: Ces ratios doivent être comparés aux moyennes sectorielles et aux exercices précédents.', 20, pdf.currentY);
  pdf.doc.setTextColor(0, 0, 0);

  return pdf;
}

/**
 * 5. Déclaration TVA (VAT Report)
 */
public static generateVATReport(data: TaxDeclarationVAT, config: PDFReportConfig): PDFGenerator {
  const pdf = new PDFGenerator(config);

  pdf.addTitle('DÉCLARATION DE TVA');
  pdf.addSubtitle(`Type: ${data.declaration_type} - Période: ${new Date(data.period_start).toLocaleDateString('fr-FR')} - ${new Date(data.period_end).toLocaleDateString('fr-FR')}`);
  pdf.addCompanyInfo();

  // Synthèse TVA
  pdf.addSectionTitle('SYNTHÈSE TVA');
  const summaryData = [
    ['TVA collectée (44571)', pdf.formatCurrency(data.vat_collected, 'EUR')],
    ['TVA déductible (44566)', pdf.formatCurrency(data.vat_deductible, 'EUR')],
    ['TVA À PAYER / CRÉDIT', pdf.formatCurrency(data.vat_to_pay, 'EUR')]
  ];
  pdf.addTable(['Élément', 'Montant'], summaryData, { highlightLastRow: true });

  // Bases de calcul
  pdf.addSectionTitle('BASES DE CALCUL');
  const basesData = [
    ['Ventes HT', pdf.formatCurrency(data.sales_amount_ht, 'EUR')],
    ['Achats HT', pdf.formatCurrency(data.purchases_amount_ht, 'EUR')]
  ];
  pdf.addTable(['Base', 'Montant HT'], basesData);

  // Détails comptables
  pdf.addSectionTitle('DÉTAILS COMPTABLES');
  const detailsData = [
    ['Solde compte 44571 (TVA collectée)', pdf.formatCurrency(data.details.account_44571_balance, 'EUR')],
    ['Solde compte 44566 (TVA déductible)', pdf.formatCurrency(data.details.account_44566_balance, 'EUR')]
  ];
  if (data.details.adjustments) {
    detailsData.push(['Ajustements', pdf.formatCurrency(data.details.adjustments, 'EUR')]);
  }
  pdf.addTable(['Compte', 'Solde'], detailsData);

  // Instructions
  pdf.currentY += 10;
  pdf.doc.setFontSize(9);
  pdf.doc.setTextColor(100, 100, 100);
  if (data.vat_to_pay > 0) {
    pdf.doc.text(`⚠️ TVA à payer: ${pdf.formatCurrency(data.vat_to_pay, 'EUR')}`, 20, pdf.currentY);
    pdf.currentY += 5;
    pdf.doc.text('Échéance de paiement: consulter le calendrier fiscal.', 20, pdf.currentY);
  } else {
    pdf.doc.text(`✓ Crédit de TVA: ${pdf.formatCurrency(Math.abs(data.vat_to_pay), 'EUR')}`, 20, pdf.currentY);
    pdf.currentY += 5;
    pdf.doc.text('Ce crédit peut être reporté ou remboursé selon les règles fiscales.', 20, pdf.currentY);
  }
  pdf.doc.setTextColor(0, 0, 0);

  return pdf;
}

/**
 * 6. Analyse budgétaire (Budget Variance)
 */
public static generateBudgetVariance(data: BudgetVarianceData, config: PDFReportConfig): PDFGenerator {
  const pdf = new PDFGenerator(config);

  pdf.addTitle('ANALYSE BUDGÉTAIRE');
  pdf.addSubtitle(`Période: ${new Date(data.period_start).toLocaleDateString('fr-FR')} - ${new Date(data.period_end).toLocaleDateString('fr-FR')}`);
  pdf.addCompanyInfo();

  // Synthèse globale
  pdf.addSectionTitle('SYNTHÈSE GLOBALE');
  const summaryData = [
    ['Revenus budgétés', pdf.formatCurrency(data.summary.total_revenue_budget, data.currency)],
    ['Revenus réalisés', pdf.formatCurrency(data.summary.total_revenue_actual, data.currency)],
    ['Écart revenus', pdf.formatCurrency(data.summary.total_revenue_variance, data.currency)],
    ['', ''],
    ['Charges budgétées', pdf.formatCurrency(data.summary.total_expense_budget, data.currency)],
    ['Charges réalisées', pdf.formatCurrency(data.summary.total_expense_actual, data.currency)],
    ['Écart charges', pdf.formatCurrency(data.summary.total_expense_variance, data.currency)],
    ['', ''],
    ['Résultat budgété', pdf.formatCurrency(data.summary.net_income_budget, data.currency)],
    ['Résultat réalisé', pdf.formatCurrency(data.summary.net_income_actual, data.currency)],
    ['ÉCART RÉSULTAT', pdf.formatCurrency(data.summary.net_income_variance, data.currency)]
  ];
  pdf.addTable(['Élément', 'Montant'], summaryData, { highlightLastRow: true });

  // Analyse des revenus
  if (pdf.currentY > 200) pdf.addPage();
  pdf.addSectionTitle('ANALYSE DES REVENUS');
  const revenueHeaders = ['Compte', 'Libellé', 'Budget', 'Réalisé', 'Écart', 'Écart %'];
  const revenueData = data.revenue_analysis.map(item => [
    item.account_number,
    item.account_name,
    pdf.formatCurrency(item.budget, data.currency),
    pdf.formatCurrency(item.actual, data.currency),
    pdf.formatCurrency(item.variance, data.currency),
    `${item.variance_percentage.toFixed(1)}%`
  ]);
  pdf.addTable(revenueHeaders, revenueData);

  // Analyse des charges
  if (pdf.currentY > 200) pdf.addPage();
  pdf.addSectionTitle('ANALYSE DES CHARGES');
  const expenseHeaders = ['Compte', 'Libellé', 'Budget', 'Réalisé', 'Écart', 'Écart %'];
  const expenseData = data.expense_analysis.map(item => [
    item.account_number,
    item.account_name,
    pdf.formatCurrency(item.budget, data.currency),
    pdf.formatCurrency(item.actual, data.currency),
    pdf.formatCurrency(item.variance, data.currency),
    `${item.variance_percentage.toFixed(1)}%`
  ]);
  pdf.addTable(expenseHeaders, expenseData);

  return pdf;
}

/**
 * 7. Tableau de bord KPI (KPI Dashboard)
 */
public static generateKPIDashboard(data: KPIDashboardData, config: PDFReportConfig): PDFGenerator {
  const pdf = new PDFGenerator(config);

  pdf.addTitle('TABLEAU DE BORD KPI');
  pdf.addSubtitle(`Période: ${new Date(data.period_start).toLocaleDateString('fr-FR')} - ${new Date(data.period_end).toLocaleDateString('fr-FR')}`);
  pdf.addCompanyInfo();

  // KPIs Financiers
  pdf.addSectionTitle('INDICATEURS FINANCIERS');
  const financialData = [
    ['Chiffre d\'affaires', pdf.formatCurrency(data.financial_kpis.revenue.value, data.currency), `${data.financial_kpis.revenue.trend > 0 ? '+' : ''}${data.financial_kpis.revenue.trend.toFixed(1)}%`],
    ['Résultat net', pdf.formatCurrency(data.financial_kpis.profit.value, data.currency), `${data.financial_kpis.profit.trend > 0 ? '+' : ''}${data.financial_kpis.profit.trend.toFixed(1)}%`],
    ['Trésorerie', pdf.formatCurrency(data.financial_kpis.cash.value, data.currency), `${data.financial_kpis.cash.trend > 0 ? '+' : ''}${data.financial_kpis.cash.trend.toFixed(1)}%`],
    ['Marge nette (%)', `${data.financial_kpis.margin.value.toFixed(1)}%`, `${data.financial_kpis.margin.trend > 0 ? '+' : ''}${data.financial_kpis.margin.trend.toFixed(1)}%`]
  ];
  pdf.addTable(['KPI', 'Valeur', 'Tendance'], financialData);

  // KPIs Opérationnels
  pdf.addSectionTitle('INDICATEURS OPÉRATIONNELS');
  const operationalData = [
    ['Factures émises', data.operational_kpis.invoices_sent.value.toString(), `${data.operational_kpis.invoices_sent.trend > 0 ? '+' : ''}${data.operational_kpis.invoices_sent.trend.toFixed(1)}%`],
    ['Factures payées', data.operational_kpis.invoices_paid.value.toString(), `${data.operational_kpis.invoices_paid.trend > 0 ? '+' : ''}${data.operational_kpis.invoices_paid.trend.toFixed(1)}%`],
    ['Délai moyen d\'encaissement (jours)', data.operational_kpis.average_collection_days.value.toString(), `${data.operational_kpis.average_collection_days.trend > 0 ? '+' : ''}${data.operational_kpis.average_collection_days.trend.toFixed(1)}%`],
    ['Délai moyen de paiement (jours)', data.operational_kpis.average_payment_days.value.toString(), `${data.operational_kpis.average_payment_days.trend > 0 ? '+' : ''}${data.operational_kpis.average_payment_days.trend.toFixed(1)}%`]
  ];
  pdf.addTable(['KPI', 'Valeur', 'Tendance'], operationalData);

  // KPIs Clients
  pdf.addSectionTitle('INDICATEURS CLIENTS');
  const customerData = [
    ['Nombre total de clients', data.customer_kpis.total_customers.value.toString(), `${data.customer_kpis.total_customers.trend > 0 ? '+' : ''}${data.customer_kpis.total_customers.trend.toFixed(1)}%`],
    ['Clients actifs', data.customer_kpis.active_customers.value.toString(), `${data.customer_kpis.active_customers.trend > 0 ? '+' : ''}${data.customer_kpis.active_customers.trend.toFixed(1)}%`],
    ['Taux de rétention (%)', `${data.customer_kpis.customer_retention.value.toFixed(1)}%`, `${data.customer_kpis.customer_retention.trend > 0 ? '+' : ''}${data.customer_kpis.customer_retention.trend.toFixed(1)}%`],
    ['Valeur moyenne facture', pdf.formatCurrency(data.customer_kpis.average_invoice_value.value, data.currency), `${data.customer_kpis.average_invoice_value.trend > 0 ? '+' : ''}${data.customer_kpis.average_invoice_value.trend.toFixed(1)}%`]
  ];
  pdf.addTable(['KPI', 'Valeur', 'Tendance'], customerData);

  // Légende
  pdf.currentY += 10;
  pdf.doc.setFontSize(9);
  pdf.doc.setTextColor(100, 100, 100);
  pdf.doc.text('📈 Tendance positive (+) • 📉 Tendance négative (-)', 20, pdf.currentY);
  pdf.doc.setTextColor(0, 0, 0);

  return pdf;
}

/**
 * 8. Synthèse fiscale (Tax Summary)
 */
public static generateTaxSummary(data: TaxSummaryData, config: PDFReportConfig): PDFGenerator {
  const pdf = new PDFGenerator(config);

  pdf.addTitle('SYNTHÈSE FISCALE');
  pdf.addSubtitle(`Année fiscale: ${data.fiscal_year}`);
  pdf.addCompanyInfo();

  // Synthèse TVA
  pdf.addSectionTitle('SYNTHÈSE TVA');
  const vatData = [
    ['TVA collectée totale', pdf.formatCurrency(data.vat_summary.total_vat_collected, data.currency)],
    ['TVA déductible totale', pdf.formatCurrency(data.vat_summary.total_vat_deductible, data.currency)],
    ['Position nette TVA', pdf.formatCurrency(data.vat_summary.net_vat_position, data.currency)]
  ];
  pdf.addTable(['Élément', 'Montant'], vatData, { highlightLastRow: true });

  // Synthèse Impôt sur les Sociétés
  pdf.addSectionTitle('IMPÔT SUR LES SOCIÉTÉS');
  const isData = [
    ['Résultat imposable', pdf.formatCurrency(data.corporate_tax_summary.taxable_income, data.currency)],
    ['Taux d\'imposition', `${data.corporate_tax_summary.tax_rate}%`],
    ['Impôt sur les sociétés', pdf.formatCurrency(data.corporate_tax_summary.corporate_tax, data.currency)],
    ['Crédits d\'impôt', pdf.formatCurrency(data.corporate_tax_summary.tax_credits, data.currency)],
    ['IMPÔT NET À PAYER', pdf.formatCurrency(data.corporate_tax_summary.net_tax_due, data.currency)]
  ];
  pdf.addTable(['Élément', 'Montant'], isData, { highlightLastRow: true });

  // Cotisations sociales
  pdf.addSectionTitle('COTISATIONS SOCIALES');
  const socialData = [
    ['Cotisations patronales', pdf.formatCurrency(data.social_contributions.employer_contributions, data.currency)],
    ['Cotisations salariales', pdf.formatCurrency(data.social_contributions.employee_contributions, data.currency)],
    ['TOTAL COTISATIONS', pdf.formatCurrency(data.social_contributions.total_contributions, data.currency)]
  ];
  pdf.addTable(['Type', 'Montant'], socialData, { highlightLastRow: true });

  // Échéances fiscales
  if (pdf.currentY > 200) pdf.addPage();
  pdf.addSectionTitle('ÉCHÉANCES FISCALES À VENIR');

  if (data.tax_deadlines.length === 0) {
    pdf.addText('Aucune échéance fiscale prévue.');
  } else {
    const deadlineHeaders = ['Date', 'Type', 'Description', 'Montant estimé'];
    const deadlineData = data.tax_deadlines.map(deadline => [
      new Date(deadline.date).toLocaleDateString('fr-FR'),
      deadline.type,
      deadline.description,
      deadline.estimated_amount ? pdf.formatCurrency(deadline.estimated_amount, data.currency) : '-'
    ]);
    pdf.addTable(deadlineHeaders, deadlineData);
  }

  // Avertissement
  pdf.currentY += 10;
  pdf.doc.setFontSize(9);
  pdf.doc.setTextColor(220, 53, 69);
  pdf.doc.text('⚠️ IMPORTANT:', 20, pdf.currentY);
  pdf.doc.setTextColor(100, 100, 100);
  pdf.currentY += 5;
  pdf.doc.text('Cette synthèse est fournie à titre informatif. Veuillez consulter votre expert-comptable', 20, pdf.currentY);
  pdf.currentY += 4;
  pdf.doc.text('ou conseiller fiscal avant toute déclaration officielle.', 20, pdf.currentY);
  pdf.doc.setTextColor(0, 0, 0);

  return pdf;
}
