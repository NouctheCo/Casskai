/**
 * Utilitaire de génération PDF pour rapports comptables
 * Utilise jsPDF + jsPDF-AutoTable pour générer des PDFs professionnels
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  PDFReportConfig,
  BalanceSheetData,
  IncomeStatementData,
  TrialBalanceData,
  GeneralLedgerData,
  CashFlowData,
  AgedReceivablesData,
  AgedPayablesData,
  FinancialRatiosData,
  TaxDeclarationVAT,
  BudgetVarianceData,
  KPIDashboardData,
  TaxSummaryData
} from '../types';

/**
 * Classe de base pour la génération PDF
 */
export class PDFGenerator {
  private doc: jsPDF;
  private config: PDFReportConfig;
  private currentY: number;

  constructor(config: PDFReportConfig) {
    this.config = config;
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.currentY = config.margins?.top || 20;
  }

  /**
   * Ajouter l'en-tête du document
   */
  private addHeader(): void {
    const { company, title, subtitle } = this.config;

    // Logo (si disponible)
    if (company.logo_url) {
      // TODO: Charger et afficher le logo
      // this.doc.addImage(logo, 'PNG', 15, 10, 30, 15);
    }

    // Informations entreprise (à droite)
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(company.name, 200, 15, { align: 'right' });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    if (company.address) {
      this.doc.text(company.address, 200, 20, { align: 'right' });
    }
    if (company.city && company.postal_code) {
      this.doc.text(`${company.postal_code} ${company.city}`, 200, 25, { align: 'right' });
    }
    if (company.siret) {
      this.doc.text(`SIRET: ${company.siret}`, 200, 30, { align: 'right' });
    }
    if (company.vat_number) {
      this.doc.text(`TVA: ${company.vat_number}`, 200, 35, { align: 'right' });
    }

    // Titre du rapport (centré)
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 105, 50, { align: 'center' });

    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, 105, 58, { align: 'center' });
    }

    // Période
    const periodText = this.config.period.start
      ? `Période: ${this.formatDate(this.config.period.start)} au ${this.formatDate(this.config.period.end)}`
      : `Date: ${this.formatDate(this.config.period.end)}`;

    this.doc.setFontSize(10);
    this.doc.text(periodText, 105, subtitle ? 65 : 58, { align: 'center' });

    this.currentY = subtitle ? 75 : 68;
  }

  /**
   * Ajouter le pied de page
   */
  private addFooter(pageNumber: number, totalPages: number): void {
    const pageHeight = this.doc.internal.pageSize.height;

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);

    // Date de génération
    const generatedText = `Généré le ${this.formatDateTime(new Date().toISOString())}`;
    this.doc.text(generatedText, 15, pageHeight - 10);

    // Numéro de page
    if (this.config.pageNumbers !== false) {
      this.doc.text(`Page ${pageNumber} / ${totalPages}`, 200, pageHeight - 10, { align: 'right' });
    }

    // Footer custom
    if (this.config.footer) {
      this.doc.text(this.config.footer, 105, pageHeight - 10, { align: 'center' });
    }

    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * Formater un montant
   */
  protected formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Formater une date
   */
  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  /**
   * Formater une date avec heure
   */
  protected formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  /**
   * Ajouter un tableau
   */
  protected addTable(headers: string[], rows: any[][], options?: { highlightLastRow?: boolean; compact?: boolean } | number): void {
    // Support pour l'ancienne signature avec startY comme number
    const startY = typeof options === 'number' ? options : undefined;
    const tableOptions = typeof options === 'object' ? options : {};

    const config: any = {
      head: [headers],
      body: rows,
      startY: startY || this.currentY,
      theme: 'grid',
      styles: {
        fontSize: tableOptions.compact ? 8 : 9,
        cellPadding: tableOptions.compact ? 2 : 3
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        // Aligner à droite les colonnes de montants (dernières colonnes généralement)
      },
      didDrawPage: (data: any) => {
        this.currentY = data.cursor?.y || this.currentY;
      }
    };

    // Highlight last row if requested
    if (tableOptions.highlightLastRow && rows.length > 0) {
      config.didDrawCell = (data: any) => {
        if (data.row.index === rows.length - 1 && data.section === 'body') {
          this.doc.setFillColor(240, 240, 240);
          this.doc.setFont('helvetica', 'bold');
        }
      };
    }

    autoTable(this.doc, config);
  }

  /**
   * Ajouter une section avec titre
   */
  protected addSection(title: string, marginTop: number = 10): void {
    this.currentY += marginTop;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 15, this.currentY);

    // Ligne de séparation
    this.doc.setDrawColor(66, 139, 202);
    this.doc.setLineWidth(0.5);
    this.doc.line(15, this.currentY + 2, 195, this.currentY + 2);

    this.currentY += 8;
  }

  /**
   * Ajouter un titre principal
   */
  protected addTitle(title: string): void {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, 105, this.currentY, { align: 'center' });
    this.currentY += 10;
  }

  /**
   * Ajouter un sous-titre
   */
  protected addSubtitle(subtitle: string): void {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(subtitle, 105, this.currentY, { align: 'center' });
    this.currentY += 8;
  }

  /**
   * Ajouter les informations de l'entreprise
   */
  protected addCompanyInfo(): void {
    const { company } = this.config;

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(company.name, 200, this.currentY, { align: 'right' });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.currentY += 5;

    if (company.address) {
      this.doc.text(company.address, 200, this.currentY, { align: 'right' });
      this.currentY += 4;
    }
    if (company.city && company.postal_code) {
      this.doc.text(`${company.postal_code} ${company.city}`, 200, this.currentY, { align: 'right' });
      this.currentY += 4;
    }
    if (company.siret) {
      this.doc.text(`SIRET: ${company.siret}`, 200, this.currentY, { align: 'right' });
      this.currentY += 4;
    }

    this.currentY += 5;
  }

  /**
   * Ajouter un titre de section (alias pour addSection)
   */
  protected addSectionTitle(title: string, marginTop: number = 10): void {
    this.addSection(title, marginTop);
  }

  /**
   * Ajouter du texte simple
   */
  protected addText(text: string, leftMargin: number = 20, incrementY: boolean = true): void {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(text, leftMargin, this.currentY);
    if (incrementY) {
      this.currentY += 6;
    }
  }

  /**
   * Ajouter une nouvelle page
   */
  protected addPage(): void {
    this.doc.addPage();
    this.currentY = this.config.margins?.top || 20;
  }

  /**
   * Sauvegarder le PDF
   */
  public save(filename: string): void {
    this.doc.save(filename);
  }

  /**
   * Obtenir le PDF en tant que Blob
   */
  public getBlob(): Blob {
    return this.doc.output('blob');
  }

  /**
   * Obtenir le PDF en tant que base64
   */
  public getBase64(): string {
    return this.doc.output('dataurlstring');
  }

  /**
   * Générer un bilan comptable
   */
  public static generateBalanceSheet(
    data: BalanceSheetData,
    config: PDFReportConfig
  ): PDFGenerator {
    const pdf = new PDFGenerator(config);
    pdf.addHeader();

    // ACTIF
    pdf.addSection('ACTIF', 5);

    // Immobilisations
    if (data.assets.fixed_assets && data.assets.fixed_assets.length > 0) {
      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.assets.fixed_assets.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.balance || 0, data.currency)
        ])
      );
    }

    // Stocks
    if (data.assets.inventory && data.assets.inventory.length > 0) {
      pdf.currentY += 5;
      pdf.doc.setFontSize(10);
      pdf.doc.setFont('helvetica', 'bold');
      pdf.doc.text('Stocks', 15, pdf.currentY);
      pdf.currentY += 5;

      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.assets.inventory.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.balance || 0, data.currency)
        ])
      );
    }

    // Créances
    if (data.assets.receivables && data.assets.receivables.length > 0) {
      pdf.currentY += 5;
      pdf.doc.setFontSize(10);
      pdf.doc.setFont('helvetica', 'bold');
      pdf.doc.text('Créances', 15, pdf.currentY);
      pdf.currentY += 5;

      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.assets.receivables.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.balance || 0, data.currency)
        ])
      );
    }

    // Trésorerie
    if (data.assets.cash && data.assets.cash.length > 0) {
      pdf.currentY += 5;
      pdf.doc.setFontSize(10);
      pdf.doc.setFont('helvetica', 'bold');
      pdf.doc.text('Trésorerie', 15, pdf.currentY);
      pdf.currentY += 5;

      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.assets.cash.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.balance || 0, data.currency)
        ])
      );
    }

    // Total Actif
    pdf.currentY += 5;
    pdf.doc.setFontSize(11);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('TOTAL ACTIF', 15, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(data.assets.total, data.currency), 195, pdf.currentY, { align: 'right' });

    // PASSIF
    pdf.addSection('PASSIF', 15);

    // Dettes
    if (data.liabilities.payables && data.liabilities.payables.length > 0) {
      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.liabilities.payables.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.balance || 0, data.currency)
        ])
      );
    }

    // Emprunts
    if (data.liabilities.loans && data.liabilities.loans.length > 0) {
      pdf.currentY += 5;
      pdf.doc.setFontSize(10);
      pdf.doc.setFont('helvetica', 'bold');
      pdf.doc.text('Emprunts', 15, pdf.currentY);
      pdf.currentY += 5;

      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.liabilities.loans.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.balance || 0, data.currency)
        ])
      );
    }

    // Total Passif
    pdf.currentY += 5;
    pdf.doc.setFontSize(11);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('TOTAL DETTES', 15, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(data.liabilities.total, data.currency), 195, pdf.currentY, { align: 'right' });

    // CAPITAUX PROPRES
    pdf.addSection('CAPITAUX PROPRES', 10);

    if (data.equity.capital && data.equity.capital.length > 0) {
      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.equity.capital.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.balance || 0, data.currency)
        ])
      );
    }

    // Total Capitaux Propres
    pdf.currentY += 5;
    pdf.doc.setFontSize(11);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('TOTAL CAPITAUX PROPRES', 15, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(data.equity.total, data.currency), 195, pdf.currentY, { align: 'right' });

    // TOTAL GÉNÉRAL
    pdf.currentY += 10;
    pdf.doc.setFontSize(12);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.setFillColor(66, 139, 202);
    pdf.doc.setTextColor(255, 255, 255);
    pdf.doc.rect(15, pdf.currentY - 5, 180, 8, 'F');
    pdf.doc.text('TOTAL PASSIF + CAPITAUX PROPRES', 20, pdf.currentY);
    pdf.doc.text(
      pdf.formatCurrency(data.totals.total_liabilities_equity, data.currency),
      190,
      pdf.currentY,
      { align: 'right' }
    );

    pdf.doc.setTextColor(0, 0, 0);

    // Vérification équilibre
    if (!data.totals.balanced) {
      pdf.currentY += 10;
      pdf.doc.setFontSize(10);
      pdf.doc.setTextColor(255, 0, 0);
      pdf.doc.text('⚠️ ATTENTION: Le bilan n\'est pas équilibré!', 105, pdf.currentY, { align: 'center' });
      pdf.doc.setTextColor(0, 0, 0);
    }

    // Footer
    const totalPages = pdf.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.doc.setPage(i);
      pdf.addFooter(i, totalPages);
    }

    return pdf;
  }

  /**
   * Générer un compte de résultat
   */
  public static generateIncomeStatement(
    data: IncomeStatementData,
    config: PDFReportConfig
  ): PDFGenerator {
    const pdf = new PDFGenerator(config);
    pdf.addHeader();

    // PRODUITS
    pdf.addSection('PRODUITS', 5);

    // Ventes
    if (data.revenue.sales && data.revenue.sales.length > 0) {
      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.revenue.sales.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.amount || 0, data.currency)
        ])
      );
    }

    // Autres produits
    if (data.revenue.other_revenue && data.revenue.other_revenue.length > 0) {
      pdf.currentY += 5;
      pdf.doc.setFontSize(10);
      pdf.doc.setFont('helvetica', 'bold');
      pdf.doc.text('Autres produits', 15, pdf.currentY);
      pdf.currentY += 5;

      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.revenue.other_revenue.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.amount || 0, data.currency)
        ])
      );
    }

    // Total Produits
    pdf.currentY += 5;
    pdf.doc.setFontSize(11);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('TOTAL PRODUITS', 15, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(data.revenue.total, data.currency), 195, pdf.currentY, { align: 'right' });

    // CHARGES
    pdf.addSection('CHARGES', 15);

    // Achats
    if (data.expenses.purchases && data.expenses.purchases.length > 0) {
      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.expenses.purchases.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.amount || 0, data.currency)
        ])
      );
    }

    // Charges externes
    if (data.expenses.external_charges && data.expenses.external_charges.length > 0) {
      pdf.currentY += 5;
      pdf.doc.setFontSize(10);
      pdf.doc.setFont('helvetica', 'bold');
      pdf.doc.text('Charges externes', 15, pdf.currentY);
      pdf.currentY += 5;

      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.expenses.external_charges.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.amount || 0, data.currency)
        ])
      );
    }

    // Charges de personnel
    if (data.expenses.personnel && data.expenses.personnel.length > 0) {
      pdf.currentY += 5;
      pdf.doc.setFontSize(10);
      pdf.doc.setFont('helvetica', 'bold');
      pdf.doc.text('Charges de personnel', 15, pdf.currentY);
      pdf.currentY += 5;

      pdf.addTable(
        ['Compte', 'Libellé', 'Montant'],
        data.expenses.personnel.map(item => [
          item.account_number,
          item.account_name,
          pdf.formatCurrency(item.amount || 0, data.currency)
        ])
      );
    }

    // Total Charges
    pdf.currentY += 5;
    pdf.doc.setFontSize(11);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('TOTAL CHARGES', 15, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(data.expenses.total, data.currency), 195, pdf.currentY, { align: 'right' });

    // RÉSULTAT NET
    pdf.currentY += 10;
    pdf.doc.setFontSize(12);
    pdf.doc.setFont('helvetica', 'bold');

    const isProfit = data.summary.net_income >= 0;
    pdf.doc.setFillColor(isProfit ? 34 : 220, isProfit ? 197 : 53, isProfit ? 94 : 69);
    pdf.doc.setTextColor(255, 255, 255);
    pdf.doc.rect(15, pdf.currentY - 5, 180, 8, 'F');
    pdf.doc.text(isProfit ? 'RÉSULTAT NET (BÉNÉFICE)' : 'RÉSULTAT NET (PERTE)', 20, pdf.currentY);
    pdf.doc.text(
      pdf.formatCurrency(Math.abs(data.summary.net_income), data.currency),
      190,
      pdf.currentY,
      { align: 'right' }
    );

    pdf.doc.setTextColor(0, 0, 0);

    // Marge
    pdf.currentY += 10;
    pdf.doc.setFontSize(10);
    pdf.doc.setFont('helvetica', 'normal');
    pdf.doc.text(`Marge nette: ${data.summary.margin_percentage.toFixed(2)}%`, 15, pdf.currentY);

    // Footer
    const totalPages = pdf.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.doc.setPage(i);
      pdf.addFooter(i, totalPages);
    }

    return pdf;
  }

  /**
   * Générer une balance générale
   */
  public static generateTrialBalance(
    data: TrialBalanceData,
    config: PDFReportConfig
  ): PDFGenerator {
    const pdf = new PDFGenerator(config);
    pdf.addHeader();

    pdf.addSection('BALANCE GÉNÉRALE', 5);

    if (data.accounts && data.accounts.length > 0) {
      pdf.addTable(
        ['Compte', 'Libellé', 'Type', 'Débit', 'Crédit', 'Solde'],
        data.accounts.map(account => [
          account.account_number,
          account.account_name,
          account.account_type,
          pdf.formatCurrency(account.debit, data.currency),
          pdf.formatCurrency(account.credit, data.currency),
          pdf.formatCurrency(account.balance, data.currency)
        ])
      );
    } else {
      pdf.doc.setFontSize(10);
      pdf.doc.text('Aucun compte disponible', 105, pdf.currentY, { align: 'center' });
    }

    // Totaux
    pdf.currentY += 10;
    pdf.doc.setFontSize(11);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('TOTAUX', 15, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(data.totals.total_debit, data.currency), 140, pdf.currentY, { align: 'right' });
    pdf.doc.text(pdf.formatCurrency(data.totals.total_credit, data.currency), 170, pdf.currentY, { align: 'right' });

    // Vérification équilibre
    if (!data.totals.balanced) {
      pdf.currentY += 10;
      pdf.doc.setFontSize(10);
      pdf.doc.setTextColor(255, 0, 0);
      pdf.doc.text('⚠️ ATTENTION: La balance n\'est pas équilibrée!', 105, pdf.currentY, { align: 'center' });
      pdf.doc.setTextColor(0, 0, 0);
    }

    // Footer
    const totalPages = pdf.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.doc.setPage(i);
      pdf.addFooter(i, totalPages);
    }

    return pdf;
  }

  /**
   * Générer un grand livre
   */
  public static generateGeneralLedger(
    data: GeneralLedgerData,
    config: PDFReportConfig
  ): PDFGenerator {
    const pdf = new PDFGenerator(config);
    pdf.addHeader();

    const subtitle = data.account_filter
      ? `Filtre: ${data.account_filter}`
      : 'Tous les comptes';

    pdf.addSection(`GRAND LIVRE - ${subtitle}`, 5);

    if (data.entries && data.entries.length > 0) {
      pdf.addTable(
        ['Date', 'Compte', 'Libellé', 'Réf', 'Débit', 'Crédit', 'Solde'],
        data.entries.map(entry => [
          pdf.formatDate(entry.date),
          entry.account_number,
          entry.description.substring(0, 25), // Tronquer pour lisibilité
          entry.reference,
          entry.debit > 0 ? pdf.formatCurrency(entry.debit, data.currency) : '',
          entry.credit > 0 ? pdf.formatCurrency(entry.credit, data.currency) : '',
          pdf.formatCurrency(entry.balance, data.currency)
        ])
      );
    } else {
      pdf.doc.setFontSize(10);
      pdf.doc.text('Aucune écriture disponible pour cette période', 105, pdf.currentY, { align: 'center' });
    }

    // Totaux
    pdf.currentY += 10;
    pdf.doc.setFontSize(11);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text(`Nombre d'écritures: ${data.totals.entry_count}`, 15, pdf.currentY);
    pdf.doc.text(
      `Total Débit: ${pdf.formatCurrency(data.totals.total_debit, data.currency)}`,
      15,
      pdf.currentY + 6
    );
    pdf.doc.text(
      `Total Crédit: ${pdf.formatCurrency(data.totals.total_credit, data.currency)}`,
      15,
      pdf.currentY + 12
    );

    // Footer
    const totalPages = pdf.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.doc.setPage(i);
      pdf.addFooter(i, totalPages);
    }

    return pdf;
  }

  /**
   * Générer une déclaration de TVA (CA3/CA12)
   */
  public static generateVATDeclaration(
    data: any, // TaxDeclarationVAT type
    config: PDFReportConfig
  ): PDFGenerator {
    const pdf = new PDFGenerator(config);
    pdf.addHeader();

    // Type de déclaration
    pdf.addSection(`DÉCLARATION DE TVA - ${data.declaration_type}`, 5);

    // Informations période
    pdf.doc.setFontSize(10);
    pdf.doc.setFont('helvetica', 'normal');
    pdf.doc.text(
      `Période: ${pdf.formatDate(data.period_start)} au ${pdf.formatDate(data.period_end)}`,
      105,
      pdf.currentY,
      { align: 'center' }
    );
    pdf.currentY += 10;

    // SECTION 1: TVA COLLECTÉE
    pdf.addSection('TVA COLLECTÉE', 10);

    const vatRates = data.vat_rates_breakdown || {};
    const collectedRows: any[][] = [];

    if (vatRates.rate_20) {
      collectedRows.push([
        'Ligne 01-02',
        'Ventes et prestations à 20%',
        pdf.formatCurrency(vatRates.rate_20.base_ht, data.currency),
        '20,0%',
        pdf.formatCurrency(vatRates.rate_20.vat_amount, data.currency)
      ]);
    }

    if (vatRates.rate_10) {
      collectedRows.push([
        'Ligne 03-04',
        'Ventes et prestations à 10%',
        pdf.formatCurrency(vatRates.rate_10.base_ht, data.currency),
        '10,0%',
        pdf.formatCurrency(vatRates.rate_10.vat_amount, data.currency)
      ]);
    }

    if (vatRates.rate_55) {
      collectedRows.push([
        'Ligne 05-06',
        'Ventes et prestations à 5,5%',
        pdf.formatCurrency(vatRates.rate_55.base_ht, data.currency),
        '5,5%',
        pdf.formatCurrency(vatRates.rate_55.vat_amount, data.currency)
      ]);
    }

    pdf.addTable(
      ['Ligne', 'Description', 'Base HT', 'Taux', 'TVA'],
      collectedRows
    );

    // Opérations spéciales
    if (data.special_operations) {
      const ops = data.special_operations;
      if (ops.export_sales > 0 || ops.intra_eu_sales > 0) {
        pdf.currentY += 5;
        pdf.doc.setFontSize(10);
        pdf.doc.setFont('helvetica', 'bold');
        pdf.doc.text('Opérations exonérées:', 15, pdf.currentY);
        pdf.currentY += 5;

        const exemptRows: any[][] = [];
        if (ops.export_sales > 0) {
          exemptRows.push([
            'Ligne 08',
            'Exportations hors UE',
            pdf.formatCurrency(ops.export_sales, data.currency),
            '-',
            pdf.formatCurrency(0, data.currency)
          ]);
        }
        if (ops.intra_eu_sales > 0) {
          exemptRows.push([
            'Ligne 09',
            'Livraisons intracommunautaires',
            pdf.formatCurrency(ops.intra_eu_sales, data.currency),
            '-',
            pdf.formatCurrency(0, data.currency)
          ]);
        }

        pdf.addTable(
          ['Ligne', 'Description', 'Base HT', 'Taux', 'TVA'],
          exemptRows
        );
      }
    }

    // Total TVA collectée
    pdf.currentY += 8;
    pdf.doc.setFontSize(11);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.setFillColor(240, 240, 240);
    pdf.doc.rect(15, pdf.currentY - 5, 180, 8, 'F');
    pdf.doc.text('Ligne 15 - TOTAL TVA COLLECTÉE', 20, pdf.currentY);
    pdf.doc.text(
      pdf.formatCurrency(data.vat_collected, data.currency),
      190,
      pdf.currentY,
      { align: 'right' }
    );

    // SECTION 2: TVA DÉDUCTIBLE
    pdf.addSection('TVA DÉDUCTIBLE', 15);

    pdf.addTable(
      ['Ligne', 'Description', 'Montant'],
      [
        [
          'Ligne 16',
          'TVA déductible sur achats et charges',
          pdf.formatCurrency(data.vat_deductible, data.currency)
        ]
      ]
    );

    // Total TVA déductible
    pdf.currentY += 8;
    pdf.doc.setFontSize(11);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.setFillColor(240, 240, 240);
    pdf.doc.rect(15, pdf.currentY - 5, 180, 8, 'F');
    pdf.doc.text('TOTAL TVA DÉDUCTIBLE', 20, pdf.currentY);
    pdf.doc.text(
      pdf.formatCurrency(data.vat_deductible, data.currency),
      190,
      pdf.currentY,
      { align: 'right' }
    );

    // SECTION 3: TVA NETTE
    pdf.currentY += 15;
    pdf.doc.setFontSize(14);
    pdf.doc.setFont('helvetica', 'bold');

    const isCredit = data.vat_to_pay < 0;
    pdf.doc.setFillColor(isCredit ? 34 : 220, isCredit ? 197 : 53, isCredit ? 94 : 69);
    pdf.doc.setTextColor(255, 255, 255);
    pdf.doc.rect(15, pdf.currentY - 6, 180, 12, 'F');

    pdf.doc.text(
      isCredit ? 'Ligne 23 - CRÉDIT DE TVA' : 'Ligne 23 - TVA NETTE DUE',
      20,
      pdf.currentY
    );
    pdf.doc.text(
      pdf.formatCurrency(Math.abs(data.vat_to_pay), data.currency),
      190,
      pdf.currentY,
      { align: 'right' }
    );

    pdf.doc.setTextColor(0, 0, 0);

    // Statut et validation
    pdf.currentY += 15;
    pdf.doc.setFontSize(10);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('Statut:', 15, pdf.currentY);
    pdf.doc.setFont('helvetica', 'normal');

    const statusText = data.status || (isCredit ? 'CRÉDIT' : 'À PAYER');
    pdf.doc.text(statusText, 40, pdf.currentY);

    if (data.validation_message) {
      pdf.currentY += 8;
      pdf.doc.setFontSize(9);
      pdf.doc.setTextColor(data.is_valid ? 0 : 255, data.is_valid ? 128 : 0, 0);
      pdf.doc.text(data.validation_message, 15, pdf.currentY);
      pdf.doc.setTextColor(0, 0, 0);
    }

    // Informations complémentaires
    pdf.currentY += 15;
    pdf.doc.setFontSize(10);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('Informations complémentaires:', 15, pdf.currentY);
    pdf.currentY += 6;

    pdf.doc.setFont('helvetica', 'normal');
    pdf.doc.setFontSize(9);
    pdf.doc.text(`Montant total des ventes HT: ${pdf.formatCurrency(data.sales_amount_ht, data.currency)}`, 15, pdf.currentY);
    pdf.currentY += 5;
    pdf.doc.text(`Montant total des achats HT: ${pdf.formatCurrency(data.purchases_amount_ht, data.currency)}`, 15, pdf.currentY);

    // Avertissement
    pdf.currentY += 15;
    pdf.doc.setFontSize(8);
    pdf.doc.setTextColor(100, 100, 100);
    pdf.doc.text(
      'Cette déclaration est générée automatiquement à partir de vos écritures comptables.',
      105,
      pdf.currentY,
      { align: 'center' }
    );
    pdf.currentY += 4;
    pdf.doc.text(
      'Veuillez vérifier les montants avant soumission officielle à l\'administration fiscale.',
      105,
      pdf.currentY,
      { align: 'center' }
    );
    pdf.doc.setTextColor(0, 0, 0);

    // Footer
    const totalPages = pdf.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.doc.setPage(i);
      pdf.addFooter(i, totalPages);
    }

    return pdf;
  }

  /**
   * Générer la Liasse fiscale complète (Forms 2050-2053)
   */
  public static generateLiasseFiscale(
    data: any, // LiasseFiscaleData type
    config: PDFReportConfig
  ): PDFGenerator {
    const pdf = new PDFGenerator(config);
    pdf.addHeader();

    // Page de garde
    pdf.doc.setFontSize(18);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('LIASSE FISCALE', 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 10;

    pdf.doc.setFontSize(12);
    pdf.doc.setFont('helvetica', 'normal');
    pdf.doc.text(`Exercice clos le ${pdf.formatDate(data.fiscal_year_end)}`, 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 20;

    // Sommaire
    pdf.addSection('SOMMAIRE', 10);
    pdf.doc.setFontSize(10);
    pdf.doc.setFont('helvetica', 'normal');
    pdf.doc.text('• Formulaire 2050 - Bilan - Actif', 20, pdf.currentY);
    pdf.currentY += 6;
    pdf.doc.text('• Formulaire 2051 - Bilan - Passif', 20, pdf.currentY);
    pdf.currentY += 6;
    pdf.doc.text('• Formulaire 2052 - Compte de résultat - Charges', 20, pdf.currentY);
    pdf.currentY += 6;
    pdf.doc.text('• Formulaire 2053 - Compte de résultat - Produits', 20, pdf.currentY);

    // =====================================================
    // FORMULAIRE 2050 - BILAN ACTIF
    // =====================================================
    pdf.doc.addPage();
    pdf.currentY = 20;

    pdf.doc.setFontSize(16);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('FORMULAIRE 2050', 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 8;
    pdf.doc.setFontSize(14);
    pdf.doc.text('BILAN - ACTIF', 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 15;

    const form2050 = data.forms.form_2050;

    // Actif immobilisé
    pdf.addSection('ACTIF IMMOBILISÉ', 5);
    pdf.addTable(
      ['Poste', 'Montant'],
      [
        ['Immobilisations incorporelles', pdf.formatCurrency(form2050.actif_immobilise.immobilisations_incorporelles, form2050.currency)],
        ['Immobilisations corporelles', pdf.formatCurrency(form2050.actif_immobilise.immobilisations_corporelles, form2050.currency)],
        ['Immobilisations financières', pdf.formatCurrency(form2050.actif_immobilise.immobilisations_financieres, form2050.currency)],
        ['TOTAL ACTIF IMMOBILISÉ', pdf.formatCurrency(form2050.actif_immobilise.total, form2050.currency)]
      ]
    );

    // Actif circulant
    pdf.addSection('ACTIF CIRCULANT', 10);
    pdf.addTable(
      ['Poste', 'Montant'],
      [
        ['Stocks', pdf.formatCurrency(form2050.actif_circulant.stocks, form2050.currency)],
        ['Créances clients', pdf.formatCurrency(form2050.actif_circulant.creances_clients, form2050.currency)],
        ['Autres créances', pdf.formatCurrency(form2050.actif_circulant.autres_creances, form2050.currency)],
        ['Disponibilités', pdf.formatCurrency(form2050.actif_circulant.disponibilites, form2050.currency)],
        ['Charges constatées d\'avance', pdf.formatCurrency(form2050.actif_circulant.charges_constatees_avance, form2050.currency)],
        ['TOTAL ACTIF CIRCULANT', pdf.formatCurrency(form2050.actif_circulant.total, form2050.currency)]
      ]
    );

    // Total actif
    pdf.currentY += 10;
    pdf.doc.setFontSize(12);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.setFillColor(66, 139, 202);
    pdf.doc.setTextColor(255, 255, 255);
    pdf.doc.rect(15, pdf.currentY - 5, 180, 10, 'F');
    pdf.doc.text('TOTAL ACTIF', 20, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(form2050.total_actif, form2050.currency), 190, pdf.currentY, { align: 'right' });
    pdf.doc.setTextColor(0, 0, 0);

    // =====================================================
    // FORMULAIRE 2051 - BILAN PASSIF
    // =====================================================
    pdf.doc.addPage();
    pdf.currentY = 20;

    pdf.doc.setFontSize(16);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('FORMULAIRE 2051', 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 8;
    pdf.doc.setFontSize(14);
    pdf.doc.text('BILAN - PASSIF', 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 15;

    const form2051 = data.forms.form_2051;

    // Capitaux propres
    pdf.addSection('CAPITAUX PROPRES', 5);
    pdf.addTable(
      ['Poste', 'Montant'],
      [
        ['Capital', pdf.formatCurrency(form2051.capitaux_propres.capital, form2051.currency)],
        ['Réserves', pdf.formatCurrency(form2051.capitaux_propres.reserves, form2051.currency)],
        ['Résultat de l\'exercice', pdf.formatCurrency(form2051.capitaux_propres.resultat_exercice, form2051.currency)],
        ['TOTAL CAPITAUX PROPRES', pdf.formatCurrency(form2051.capitaux_propres.total, form2051.currency)]
      ]
    );

    // Provisions
    pdf.currentY += 10;
    pdf.doc.setFontSize(10);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('Provisions pour risques et charges:', 15, pdf.currentY);
    pdf.doc.setFont('helvetica', 'normal');
    pdf.doc.text(pdf.formatCurrency(form2051.provisions, form2051.currency), 195, pdf.currentY, { align: 'right' });

    // Dettes
    pdf.addSection('DETTES', 10);
    pdf.addTable(
      ['Poste', 'Montant'],
      [
        ['Dettes financières', pdf.formatCurrency(form2051.dettes.dettes_financieres, form2051.currency)],
        ['Dettes fournisseurs', pdf.formatCurrency(form2051.dettes.dettes_fournisseurs, form2051.currency)],
        ['Dettes fiscales et sociales', pdf.formatCurrency(form2051.dettes.dettes_fiscales_sociales, form2051.currency)],
        ['Autres dettes', pdf.formatCurrency(form2051.dettes.autres_dettes, form2051.currency)],
        ['Produits constatés d\'avance', pdf.formatCurrency(form2051.dettes.produits_constates_avance, form2051.currency)],
        ['TOTAL DETTES', pdf.formatCurrency(form2051.dettes.total, form2051.currency)]
      ]
    );

    // Total passif
    pdf.currentY += 10;
    pdf.doc.setFontSize(12);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.setFillColor(66, 139, 202);
    pdf.doc.setTextColor(255, 255, 255);
    pdf.doc.rect(15, pdf.currentY - 5, 180, 10, 'F');
    pdf.doc.text('TOTAL PASSIF', 20, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(form2051.total_passif, form2051.currency), 190, pdf.currentY, { align: 'right' });
    pdf.doc.setTextColor(0, 0, 0);

    // =====================================================
    // FORMULAIRE 2052 - COMPTE DE RÉSULTAT (CHARGES)
    // =====================================================
    pdf.doc.addPage();
    pdf.currentY = 20;

    pdf.doc.setFontSize(16);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('FORMULAIRE 2052', 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 8;
    pdf.doc.setFontSize(14);
    pdf.doc.text('COMPTE DE RÉSULTAT - CHARGES', 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 15;

    const form2052 = data.forms.form_2052;

    // Charges d'exploitation
    pdf.addSection('CHARGES D\'EXPLOITATION', 5);
    pdf.addTable(
      ['Poste', 'Montant'],
      [
        ['Achats', pdf.formatCurrency(form2052.charges_exploitation.achats, form2052.currency)],
        ['Charges externes', pdf.formatCurrency(form2052.charges_exploitation.charges_externes, form2052.currency)],
        ['Impôts et taxes', pdf.formatCurrency(form2052.charges_exploitation.impots_taxes, form2052.currency)],
        ['Charges de personnel', pdf.formatCurrency(form2052.charges_exploitation.charges_personnel, form2052.currency)],
        ['Dotations amortissements', pdf.formatCurrency(form2052.charges_exploitation.dotations_amortissements, form2052.currency)],
        ['TOTAL CHARGES D\'EXPLOITATION', pdf.formatCurrency(form2052.charges_exploitation.total, form2052.currency)]
      ]
    );

    // Autres charges
    pdf.currentY += 10;
    pdf.addTable(
      ['Poste', 'Montant'],
      [
        ['Charges financières', pdf.formatCurrency(form2052.charges_financieres, form2052.currency)],
        ['Charges exceptionnelles', pdf.formatCurrency(form2052.charges_exceptionnelles, form2052.currency)],
        ['Impôt sur les sociétés', pdf.formatCurrency(form2052.impot_societes, form2052.currency)]
      ]
    );

    // Total charges
    pdf.currentY += 10;
    pdf.doc.setFontSize(12);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.setFillColor(220, 53, 69);
    pdf.doc.setTextColor(255, 255, 255);
    pdf.doc.rect(15, pdf.currentY - 5, 180, 10, 'F');
    pdf.doc.text('TOTAL CHARGES', 20, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(form2052.total_charges, form2052.currency), 190, pdf.currentY, { align: 'right' });
    pdf.doc.setTextColor(0, 0, 0);

    // =====================================================
    // FORMULAIRE 2053 - COMPTE DE RÉSULTAT (PRODUITS)
    // =====================================================
    pdf.doc.addPage();
    pdf.currentY = 20;

    pdf.doc.setFontSize(16);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('FORMULAIRE 2053', 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 8;
    pdf.doc.setFontSize(14);
    pdf.doc.text('COMPTE DE RÉSULTAT - PRODUITS', 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 15;

    const form2053 = data.forms.form_2053;

    // Produits d'exploitation
    pdf.addSection('PRODUITS D\'EXPLOITATION', 5);
    pdf.addTable(
      ['Poste', 'Montant'],
      [
        ['Ventes', pdf.formatCurrency(form2053.produits_exploitation.ventes, form2053.currency)],
        ['Production stockée', pdf.formatCurrency(form2053.produits_exploitation.production_stockee, form2053.currency)],
        ['Production immobilisée', pdf.formatCurrency(form2053.produits_exploitation.production_immobilisee, form2053.currency)],
        ['Subventions d\'exploitation', pdf.formatCurrency(form2053.produits_exploitation.subventions, form2053.currency)],
        ['Autres produits', pdf.formatCurrency(form2053.produits_exploitation.autres_produits, form2053.currency)],
        ['Reprises sur provisions', pdf.formatCurrency(form2053.produits_exploitation.reprises_provisions, form2053.currency)],
        ['TOTAL PRODUITS D\'EXPLOITATION', pdf.formatCurrency(form2053.produits_exploitation.total, form2053.currency)]
      ]
    );

    // Autres produits
    pdf.currentY += 10;
    pdf.addTable(
      ['Poste', 'Montant'],
      [
        ['Produits financiers', pdf.formatCurrency(form2053.produits_financiers, form2053.currency)],
        ['Produits exceptionnels', pdf.formatCurrency(form2053.produits_exceptionnels, form2053.currency)]
      ]
    );

    // Total produits
    pdf.currentY += 10;
    pdf.doc.setFontSize(12);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.setFillColor(34, 197, 94);
    pdf.doc.setTextColor(255, 255, 255);
    pdf.doc.rect(15, pdf.currentY - 5, 180, 10, 'F');
    pdf.doc.text('TOTAL PRODUITS', 20, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(form2053.total_produits, form2053.currency), 190, pdf.currentY, { align: 'right' });
    pdf.doc.setTextColor(0, 0, 0);

    // =====================================================
    // PAGE DE SYNTHÈSE
    // =====================================================
    pdf.doc.addPage();
    pdf.currentY = 20;

    pdf.doc.setFontSize(16);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('SYNTHÈSE DE LA LIASSE FISCALE', 105, pdf.currentY, { align: 'center' });
    pdf.currentY += 20;

    // Résultat net
    const resultatNet = form2053.total_produits - form2052.total_charges;
    const isProfit = resultatNet >= 0;

    pdf.doc.setFontSize(14);
    pdf.doc.setFillColor(isProfit ? 34 : 220, isProfit ? 197 : 53, isProfit ? 94 : 69);
    pdf.doc.setTextColor(255, 255, 255);
    pdf.doc.rect(15, pdf.currentY - 5, 180, 12, 'F');
    pdf.doc.text(isProfit ? 'RÉSULTAT NET (BÉNÉFICE)' : 'RÉSULTAT NET (PERTE)', 20, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(Math.abs(resultatNet), form2053.currency), 190, pdf.currentY, { align: 'right' });
    pdf.doc.setTextColor(0, 0, 0);

    // Équilibre bilan
    pdf.currentY += 20;
    pdf.doc.setFontSize(11);
    pdf.doc.setFont('helvetica', 'bold');
    pdf.doc.text('Vérification équilibre bilan:', 15, pdf.currentY);
    pdf.currentY += 7;

    pdf.doc.setFont('helvetica', 'normal');
    pdf.doc.setFontSize(10);
    pdf.doc.text(`Total Actif:`, 20, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(form2050.total_actif, form2050.currency), 195, pdf.currentY, { align: 'right' });
    pdf.currentY += 6;
    pdf.doc.text(`Total Passif:`, 20, pdf.currentY);
    pdf.doc.text(pdf.formatCurrency(form2051.total_passif, form2051.currency), 195, pdf.currentY, { align: 'right' });

    const isBalanced = Math.abs(form2050.total_actif - form2051.total_passif) < 0.01;
    pdf.currentY += 8;
    pdf.doc.setFont('helvetica', 'bold');
    if (isBalanced) {
      pdf.doc.setTextColor(34, 197, 94);
      pdf.doc.text('✓ Bilan équilibré', 20, pdf.currentY);
    } else {
      pdf.doc.setTextColor(220, 53, 69);
      pdf.doc.text('✗ Bilan déséquilibré - Vérification nécessaire', 20, pdf.currentY);
    }
    pdf.doc.setTextColor(0, 0, 0);

    // Informations de génération
    pdf.currentY += 20;
    pdf.doc.setFontSize(8);
    pdf.doc.setTextColor(100, 100, 100);
    pdf.doc.text(
      'Cette liasse fiscale est générée automatiquement à partir de vos écritures comptables.',
      105,
      pdf.currentY,
      { align: 'center' }
    );
    pdf.currentY += 4;
    pdf.doc.text(
      'Veuillez vérifier tous les montants avant soumission officielle à l\'administration fiscale.',
      105,
      pdf.currentY,
      { align: 'center' }
    );
    pdf.doc.setTextColor(0, 0, 0);

    // Footer sur toutes les pages
    const totalPages = pdf.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.doc.setPage(i);
      pdf.addFooter(i, totalPages);
    }

    return pdf;
  }

  /**
   * 1. Flux de trésorerie (Cash Flow Statement)
   */
  public static generateCashFlowStatement(data: CashFlowData, config: PDFReportConfig): PDFGenerator {
    const pdf = new PDFGenerator(config);

    pdf.addSection('TABLEAU DE FLUX DE TRÉSORERIE', 5);

    // Section 1: Flux de trésorerie liés à l'activité
    pdf.addSection('FLUX DE TRÉSORERIE LIÉS À L\'ACTIVITÉ', 10);
    const operatingData = [
      ['Résultat net', pdf.formatCurrency(data.operating_activities.amount, data.currency)],
      ['Description', data.operating_activities.description || '-']
    ];
    pdf.addTable(['Élément', 'Montant'], operatingData);

    // Section 2: Flux de trésorerie liés aux investissements
    pdf.addSection('FLUX DE TRÉSORERIE LIÉS AUX INVESTISSEMENTS', 10);
    const investingData = [
      ['Investissements nets', pdf.formatCurrency(data.investing_activities.amount, data.currency)],
      ['Description', data.investing_activities.description || '-']
    ];
    pdf.addTable(['Élément', 'Montant'], investingData);

    // Section 3: Flux de trésorerie liés au financement
    pdf.addSection('FLUX DE TRÉSORERIE LIÉS AU FINANCEMENT', 10);
    const financingData = [
      ['Financement net', pdf.formatCurrency(data.financing_activities.amount, data.currency)],
      ['Description', data.financing_activities.description || '-']
    ];
    pdf.addTable(['Élément', 'Montant'], financingData);

    // Synthèse
    pdf.addSection('SYNTHÈSE DES FLUX DE TRÉSORERIE', 10);
    const summaryData = [
      ['Flux d\'exploitation', pdf.formatCurrency(data.summary.operating, data.currency)],
      ['Flux d\'investissement', pdf.formatCurrency(data.summary.investing, data.currency)],
      ['Flux de financement', pdf.formatCurrency(data.summary.financing, data.currency)],
      ['VARIATION DE TRÉSORERIE', pdf.formatCurrency(data.summary.net_cash_change, data.currency)]
    ];
    pdf.addTable(['Flux', 'Montant'], summaryData);

    // Footer
    const totalPages = pdf.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.doc.setPage(i);
      pdf.addFooter(i, totalPages);
    }

    return pdf;
  }

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

}}
