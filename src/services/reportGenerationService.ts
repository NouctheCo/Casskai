// Service de génération de rapports financiers avec calculs avancés
import { supabase } from '@/lib/supabase';
import { reportExportService, TableData, ExportOptions } from './ReportExportService';
import { format, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/utils/logger';

export interface FinancialData {
  compte: string;
  libelle: string;
  debit: number;
  credit: number;
  solde: number;
  type?: 'actif' | 'passif' | 'charge' | 'produit';
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  companyId: string;
  includeClosedAccounts?: boolean;
  accountType?: string;
}

export class ReportGenerationService {
  private static instance: ReportGenerationService;

  static getInstance(): ReportGenerationService {
    if (!this.instance) {
      this.instance = new ReportGenerationService();
    }
    return this.instance;
  }

  // Génération du Bilan
  async generateBalanceSheet(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      // Récupérer les données directement du plan de comptes fiabilisé
      const { data: accounts, error } = await supabase
        .from('chart_of_accounts')
        .select('account_number, name, type, class, balance')
        .eq('company_id', companyId)
        .in('class', [1, 2, 3, 4, 5]);

      if (error) throw error;

      // Calculer les soldes par compte (simplifié car le solde est déjà dans le compte)
      const accountBalances = this.calculateAccountBalancesFromAccounts(accounts || []);

      // Séparer actif et passif
      const actifAccounts = accountBalances.filter(acc => acc.type === 'actif');
      const passifAccounts = accountBalances.filter(acc => acc.type === 'passif');

      // Créer les tables pour le bilan
      const actifTable: TableData = {
        title: 'ACTIF',
        headers: ['Compte', 'Libellé', 'Brut', 'Amortissements', 'Net'],
        rows: actifAccounts.map(acc => [
          acc.compte,
          acc.libelle,
          this.formatCurrency(acc.debit),
          this.formatCurrency(0), // À calculer selon les amortissements
          this.formatCurrency(acc.solde)
        ]),
        summary: {
          'Total Actif': this.formatCurrency(actifAccounts.reduce((sum, acc) => sum + acc.solde, 0))
        }
      };

      const passifTable: TableData = {
        title: 'PASSIF',
        headers: ['Compte', 'Libellé', 'Montant'],
        rows: passifAccounts.map(acc => [
          acc.compte,
          acc.libelle,
          this.formatCurrency(acc.solde)
        ]),
        summary: {
          'Total Passif': this.formatCurrency(passifAccounts.reduce((sum, acc) => sum + acc.solde, 0))
        }
      };

      const tables = [actifTable, passifTable];

      // Options d'export par défaut
      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'BILAN COMPTABLE',
        subtitle: `Période du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
        orientation: 'portrait',
        watermark: 'CassKai',
        ...exportOptions
      };

      // Générer selon le format demandé
      switch (defaultOptions.format) {
        case 'pdf':
          return await reportExportService.exportToPDF(tables, defaultOptions);
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv':
          return reportExportService.exportToCSV(actifTable, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      logger.error('Erreur génération bilan:', error);
      throw new Error('Impossible de générer le bilan');
    }
  }

  // Génération du Compte de Résultat
  async generateIncomeStatement(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      const { data: accounts, error } = await supabase
        .from('chart_of_accounts')
        .select('account_number, name, type, class, balance, debit, credit')
        .eq('company_id', companyId)
        .in('class', [6, 7]);

      if (error) throw error;

      const accountBalances = this.calculateAccountBalancesFromAccounts(accounts || []);

      const charges = accountBalances.filter(acc => acc.type === 'charge');
      const produits = accountBalances.filter(acc => acc.type === 'produit');

      const chargesTable: TableData = {
        title: 'CHARGES',
        headers: ['Compte', 'Libellé', 'Montant'],
        rows: charges.map(acc => [
          acc.compte,
          acc.libelle,
          this.formatCurrency(acc.debit)
        ]),
        summary: {
          'Total Charges': this.formatCurrency(charges.reduce((sum, acc) => sum + acc.debit, 0))
        }
      };

      const produitsTable: TableData = {
        title: 'PRODUITS',
        headers: ['Compte', 'Libellé', 'Montant'],
        rows: produits.map(acc => [
          acc.compte,
          acc.libelle,
          this.formatCurrency(acc.credit)
        ]),
        summary: {
          'Total Produits': this.formatCurrency(produits.reduce((sum, acc) => sum + acc.credit, 0))
        }
      };

      const totalCharges = charges.reduce((sum, acc) => sum + acc.debit, 0);
      const totalProduits = produits.reduce((sum, acc) => sum + acc.credit, 0);
      const resultat = totalProduits - totalCharges;

      const resultatTable: TableData = {
        title: 'RÉSULTAT',
        headers: ['Description', 'Montant'],
        rows: [
          ['Total Produits', this.formatCurrency(totalProduits)],
          ['Total Charges', this.formatCurrency(totalCharges)],
          ['Résultat Net', this.formatCurrency(resultat)]
        ]
      };

      const tables = [produitsTable, chargesTable, resultatTable];

      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'COMPTE DE RÉSULTAT',
        subtitle: `Période du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
        orientation: 'portrait',
        watermark: 'CassKai',
        ...exportOptions
      };

      switch (defaultOptions.format) {
        case 'pdf':
          return await reportExportService.exportToPDF(tables, defaultOptions);
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv':
          return reportExportService.exportToCSV(resultatTable, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      logger.error('Erreur génération compte de résultat:', error);
      throw new Error('Impossible de générer le compte de résultat');
    }
  }

  // Génération de la Balance Générale
  async generateTrialBalance(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      const { data: accounts, error } = await supabase
        .from('chart_of_accounts')
        .select('account_number, name, type, class, balance, debit, credit')
        .eq('company_id', companyId);

      if (error) throw error;

      const accountBalances = this.calculateAccountBalancesFromAccounts(accounts || []);

      const balanceTable: TableData = {
        title: 'BALANCE GÉNÉRALE',
        headers: ['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde Débiteur', 'Solde Créditeur'],
        rows: accountBalances.map(acc => [
          acc.compte,
          acc.libelle,
          this.formatCurrency(acc.debit),
          this.formatCurrency(acc.credit),
          acc.solde > 0 ? this.formatCurrency(acc.solde) : '',
          acc.solde < 0 ? this.formatCurrency(Math.abs(acc.solde)) : ''
        ]),
        summary: {
          'Total Débits': this.formatCurrency(accountBalances.reduce((sum, acc) => sum + acc.debit, 0)),
          'Total Crédits': this.formatCurrency(accountBalances.reduce((sum, acc) => sum + acc.credit, 0))
        }
      };

      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'BALANCE GÉNÉRALE',
        subtitle: `Période du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
        orientation: 'landscape',
        watermark: 'CassKai',
        ...exportOptions
      };

      switch (defaultOptions.format) {
        case 'pdf':
          return await reportExportService.exportToPDF(balanceTable, defaultOptions);
        case 'excel':
          return await reportExportService.exportToExcel(balanceTable, defaultOptions);
        case 'csv':
          return reportExportService.exportToCSV(balanceTable, defaultOptions);
        default:
          return await reportExportService.exportToPDF(balanceTable, defaultOptions);
      }
    } catch (error) {
      logger.error('Erreur génération balance:', error);
      throw new Error('Impossible de générer la balance');
    }
  }

  // Génération du Grand Livre
  async generateGeneralLedger(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      const { data: journalEntries, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('company_id', companyId)
        .gte('date', startDate || startOfYear(new Date()).toISOString().split('T')[0])
        .lte('date', endDate || endOfYear(new Date()).toISOString().split('T')[0])
        .order('account_number', { ascending: true })
        .order('date', { ascending: true });

      if (error) throw error;

      // Grouper par compte
      const groupedEntries = this.groupEntriesByAccount(journalEntries || []);

      const tables: TableData[] = [];

      Object.entries(groupedEntries).forEach(([accountNumber, entries]) => {
        const accountTable: TableData = {
          title: `Compte ${accountNumber} - ${entries[0]?.account_name || 'Compte'}`,
          headers: ['Date', 'Libellé', 'Pièce', 'Débit', 'Crédit', 'Solde'],
          rows: [],
          summary: {}
        };

        let runningBalance = 0;
        entries.forEach(entry => {
          runningBalance += entry.debit - entry.credit;
          accountTable.rows.push([
            format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr }),
            entry.description || entry.label,
            entry.reference || '',
            entry.debit ? this.formatCurrency(entry.debit) : '',
            entry.credit ? this.formatCurrency(entry.credit) : '',
            this.formatCurrency(runningBalance)
          ]);
        });

        accountTable.summary = {
          'Total Débits': this.formatCurrency(entries.reduce((sum, e) => sum + e.debit, 0)),
          'Total Crédits': this.formatCurrency(entries.reduce((sum, e) => sum + e.credit, 0)),
          'Solde Final': this.formatCurrency(runningBalance)
        };

        tables.push(accountTable);
      });

      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'GRAND LIVRE',
        subtitle: `Période du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
        orientation: 'landscape',
        watermark: 'CassKai',
        ...exportOptions
      };

      switch (defaultOptions.format) {
        case 'pdf':
          return await reportExportService.exportToPDF(tables, defaultOptions);
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv': {
          // Pour CSV, on combine tout en une seule table
          const combinedTable = this.combineTables(tables, 'Grand Livre Complet');
          return reportExportService.exportToCSV(combinedTable, defaultOptions);
        }
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      logger.error('Erreur génération grand livre:', error);
      throw new Error('Impossible de générer le grand livre');
    }
  }

  // Helpers privés
  private calculateAccountBalancesFromAccounts(accounts: any[]): FinancialData[] {
    return accounts.map(acc => ({
      compte: acc.account_number,
      libelle: acc.name,
      debit: acc.balance > 0 ? acc.balance : 0,
      credit: acc.balance < 0 ? -acc.balance : 0,
      solde: acc.balance || 0,
      type: acc.type // Utilisation directe du type fiable
    }));
  }

  private getAccountType(accountNumber: string): 'actif' | 'passif' | 'charge' | 'produit' {
    const firstDigit = accountNumber.charAt(0);

    switch (firstDigit) {
      case '1':
      case '2':
      case '3':
        return 'actif';
      case '4':
      case '5':
        return 'passif';
      case '6':
        return 'charge';
      case '7':
        return 'produit';
      default:
        return 'actif'; // Fallback, ne devrait pas être utilisé avec des données fiables
    }
  }

  private groupEntriesByAccount(entries: any[]): Record<string, any[]> {
    return entries.reduce((groups, entry) => {
      const accountNumber = entry.account_number;
      if (!groups[accountNumber]) {
        groups[accountNumber] = [];
      }
      groups[accountNumber].push(entry);
      return groups;
    }, {} as Record<string, any[]>);
  }

  private combineTables(tables: TableData[], title: string): TableData {
    const combinedRows: any[][] = [];

    tables.forEach(table => {
      combinedRows.push(['', '', '', '', '', '']); // Ligne vide
      combinedRows.push([table.title, '', '', '', '', '']); // Titre du compte
      combinedRows.push(...table.rows);
    });

    return {
      title,
      headers: ['Date', 'Libellé', 'Pièce', 'Débit', 'Crédit', 'Solde'],
      rows: combinedRows
    };
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Méthode publique pour télécharger directement un rapport
  async downloadReport(
    reportType: 'balance_sheet' | 'income_statement' | 'trial_balance' | 'general_ledger',
    filters: ReportFilters,
    exportOptions: ExportOptions,
    filename?: string
  ): Promise<void> {
    let url: string;
    let defaultFilename: string;

    const dateRange = `${format(new Date(filters.startDate || startOfYear(new Date())), 'yyyy-MM-dd')}_${format(new Date(filters.endDate || endOfYear(new Date())), 'yyyy-MM-dd')}`;

    switch (reportType) {
      case 'balance_sheet':
        url = await this.generateBalanceSheet(filters, exportOptions);
        defaultFilename = `bilan_${dateRange}`;
        break;
      case 'income_statement':
        url = await this.generateIncomeStatement(filters, exportOptions);
        defaultFilename = `compte_resultat_${dateRange}`;
        break;
      case 'trial_balance':
        url = await this.generateTrialBalance(filters, exportOptions);
        defaultFilename = `balance_${dateRange}`;
        break;
      case 'general_ledger':
        url = await this.generateGeneralLedger(filters, exportOptions);
        defaultFilename = `grand_livre_${dateRange}`;
        break;
      default:
        throw new Error('Type de rapport non supporté');
    }

    const extension = exportOptions.format === 'excel' ? 'xlsx' : exportOptions.format === 'csv' ? 'csv' : 'pdf';
    const finalFilename = filename || `${defaultFilename}.${extension}`;

    reportExportService.downloadFile(url, finalFilename);
  }
}

// Export singleton
export const reportGenerationService = ReportGenerationService.getInstance();