// Service de génération de rapports financiers avec calculs avancés
import { supabase } from '@/lib/supabase';
import { reportExportService, TableData, ExportOptions } from './ReportExportService';
import { format, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';

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

export interface JournalEntry {
  account_number: string;
  account_name?: string;
  label?: string;
  debit: number;
  credit: number;
  entry_date: string;
  description?: string;
  reference?: string;
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

      // Récupérer les données comptables avec les lignes d'écritures
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          description,
          journal_entry_lines (
            account_number,
            account_name,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .gte('entry_date', startDate || startOfYear(new Date()).toISOString().split('T')[0])
        .lte('entry_date', endDate || endOfYear(new Date()).toISOString().split('T')[0]);

      if (error) throw error;

      // Aplatir les journal_entry_lines en JournalEntry individuels
      const journalEntries: JournalEntry[] = [];
      entries?.forEach(entry => {
        entry.journal_entry_lines?.forEach((line: any) => {
          journalEntries.push({
            account_number: line.account_number,
            account_name: line.account_name,
            debit: line.debit_amount || 0,
            credit: line.credit_amount || 0,
            entry_date: entry.entry_date,
            description: entry.description,
            label: line.account_name
          });
        });
      });

      // Calculer les soldes par compte
      const accountBalances = this.calculateAccountBalances(journalEntries || []);

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
      console.error('Erreur génération bilan:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le bilan');
    }
  }

  // Génération du Compte de Résultat
  async generateIncomeStatement(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          description,
          journal_entry_lines (
            account_number,
            account_name,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .gte('entry_date', startDate || startOfYear(new Date()).toISOString().split('T')[0])
        .lte('entry_date', endDate || endOfYear(new Date()).toISOString().split('T')[0]);

      if (error) throw error;

      // Aplatir les journal_entry_lines en JournalEntry individuels
      const journalEntries: JournalEntry[] = [];
      entries?.forEach(entry => {
        entry.journal_entry_lines?.forEach((line: any) => {
          journalEntries.push({
            account_number: line.account_number,
            account_name: line.account_name,
            debit: line.debit_amount || 0,
            credit: line.credit_amount || 0,
            entry_date: entry.entry_date,
            description: entry.description,
            label: line.account_name
          });
        });
      });

      const accountBalances = this.calculateAccountBalances(journalEntries || []);

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
      console.error('Erreur génération compte de résultat:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le compte de résultat');
    }
  }

  // Génération de la Balance Générale
  async generateTrialBalance(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          description,
          journal_entry_lines (
            account_number,
            account_name,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .gte('entry_date', startDate || startOfYear(new Date()).toISOString().split('T')[0])
        .lte('entry_date', endDate || endOfYear(new Date()).toISOString().split('T')[0]);

      if (error) throw error;

      // Aplatir les journal_entry_lines en JournalEntry individuels
      const journalEntries: JournalEntry[] = [];
      entries?.forEach(entry => {
        entry.journal_entry_lines?.forEach((line: any) => {
          journalEntries.push({
            account_number: line.account_number,
            account_name: line.account_name,
            debit: line.debit_amount || 0,
            credit: line.credit_amount || 0,
            entry_date: entry.entry_date,
            description: entry.description,
            label: line.account_name
          });
        });
      });

      const accountBalances = this.calculateAccountBalances(journalEntries || []);

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
      console.error('Erreur génération balance:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer la balance');
    }
  }

  // Génération du Grand Livre
  async generateGeneralLedger(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          description,
          journal_entry_lines (
            account_number,
            account_name,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .gte('entry_date', startDate || startOfYear(new Date()).toISOString().split('T')[0])
        .lte('entry_date', endDate || endOfYear(new Date()).toISOString().split('T')[0]);

      if (error) throw error;

      // Aplatir les journal_entry_lines en JournalEntry individuels
      const journalEntries: JournalEntry[] = [];
      entries?.forEach(entry => {
        entry.journal_entry_lines?.forEach((line: any) => {
          journalEntries.push({
            account_number: line.account_number,
            account_name: line.account_name,
            debit: line.debit_amount || 0,
            credit: line.credit_amount || 0,
            entry_date: entry.entry_date,
            description: entry.description,
            label: line.account_name
          });
        });
      });

      // Trier par compte et date
      journalEntries.sort((a, b) => {
        const accountCompare = a.account_number.localeCompare(b.account_number);
        if (accountCompare !== 0) return accountCompare;
        return new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime();
      });

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
            format(new Date(entry.entry_date), 'dd/MM/yyyy', { locale: fr }),
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
      console.error('Erreur génération grand livre:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le grand livre');
    }
  }

  // Helpers privés
  private calculateAccountBalances(journalEntries: ReadonlyArray<JournalEntry>): FinancialData[] {
    const balances: Record<string, FinancialData> = {};

    journalEntries.forEach(entry => {
      const accountNumber = entry.account_number;

      if (!balances[accountNumber]) {
        balances[accountNumber] = {
          compte: accountNumber,
          libelle: entry.account_name || entry.label,
          debit: 0,
          credit: 0,
          solde: 0,
          type: this.getAccountType(accountNumber)
        };
      }

      balances[accountNumber].debit += entry.debit || 0;
      balances[accountNumber].credit += entry.credit || 0;
    });

    // Calculer les soldes
    Object.values(balances).forEach(balance => {
      balance.solde = balance.debit - balance.credit;
    });

    return Object.values(balances).sort((a, b) => a.compte.localeCompare(b.compte));
  }

  private getAccountType(accountNumber: string): 'actif' | 'passif' | 'charge' | 'produit' {
    const firstDigit = accountNumber.charAt(0);

    switch (firstDigit) {
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        return accountNumber.charAt(0) <= '3' ? 'actif' : 'passif';
      case '6':
        return 'charge';
      case '7':
        return 'produit';
      default:
        return 'actif';
    }
  }

  private groupEntriesByAccount(entries: ReadonlyArray<JournalEntry>): Record<string, JournalEntry[]> {
    return entries.reduce((groups, entry) => {
      const accountNumber = entry.account_number;
      if (!groups[accountNumber]) {
        groups[accountNumber] = [];
      }
      groups[accountNumber].push(entry);
      return groups;
    }, {} as Record<string, JournalEntry[]>);
  }

  private combineTables(tables: TableData[], title: string): TableData {
    const combinedRows: (string | number)[][] = [];

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
