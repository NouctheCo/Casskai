/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

// Service de génération de rapports financiers avec calculs avancés
import { supabase } from '@/lib/supabase';
import { reportExportService, TableData, ExportOptions } from './ReportExportService';
import { format, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AccountingStandardAdapter } from './accountingStandardAdapter';
import { financialRatiosService } from './financialRatiosService';
import { chartImageService } from './chartImageService';
import { aiAnalysisService, type FinancialKPIs as AIFinancialKPIs } from './aiAnalysisService';
import { aiReportAnalysisService, type CashFlowData, type ReceivablesData, type FinancialRatiosData, type BudgetVarianceData, type PayablesData, type InventoryData, type AIAnalysisResult } from './aiReportAnalysisService';

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

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

      // Récupérer les données comptables avec les lignes d'écritures
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          description,
          status,
          journal_entry_lines (
            account_number,
            account_name,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'posted')
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

      // Calculer les amortissements cumulés
      const depreciationMap = await this.calculateDepreciation(companyId, endDate || endOfYear(new Date()).toISOString().split('T')[0]);

      // Calculer les données N-1 (année précédente)
      const currentYear = new Date(endDate || new Date()).getFullYear();
      const previousYearStart = `${currentYear - 1}-01-01`;
      const previousYearEnd = `${currentYear - 1}-12-31`;

      const previousYearData = await this.calculatePeriodData(companyId, previousYearStart, previousYearEnd);

      // Séparer actif et passif
      const actifAccounts = accountBalances.filter(acc => acc.type === 'actif');
      const passifAccounts = accountBalances.filter(acc => acc.type === 'passif');

      // 📋 STRUCTURE RÉGLEMENTAIRE DU BILAN - Conformité PCG/SYSCOHADA

      // === ACTIF ===
      // Actif immobilisé (classe 2)
      const actifImmobilise = actifAccounts.filter(acc => acc.compte.startsWith('2'));
      // Actif circulant (classe 3, 4 sauf 44, 5)
      const actifCirculant = actifAccounts.filter(acc =>
        acc.compte.startsWith('3') ||
        (acc.compte.startsWith('4') && !acc.compte.startsWith('44')) ||
        acc.compte.startsWith('5')
      );

      // === PASSIF ===
      // Capitaux propres (classe 1 sauf 16, 17, 18)
      const capitauxPropres = passifAccounts.filter(acc =>
        acc.compte.startsWith('1') &&
        !acc.compte.startsWith('16') &&
        !acc.compte.startsWith('17') &&
        !acc.compte.startsWith('18')
      );
      // Provisions (comptes 15, 16)
      const provisions = passifAccounts.filter(acc =>
        acc.compte.startsWith('15') || acc.compte.startsWith('16')
      );
      // Dettes (comptes 17, 18, 4x passif)
      const dettes = passifAccounts.filter(acc =>
        acc.compte.startsWith('17') ||
        acc.compte.startsWith('18') ||
        (acc.compte.startsWith('4') && acc.type === 'passif')
      );

      // Helper pour trouver le compte correspondant dans N-1
      const findPreviousYearAccount = (accountNumber: string, previousAccounts: any[]) => {
        return previousAccounts.find(acc => acc.compte === accountNumber);
      };

      // Calculer les totaux avec amortissements pour chaque rubrique (avec N-1)
      const processActifSection = (accounts: any[], previousAccounts: any[]) => {
        let totalBrut = 0;
        let totalAmort = 0;
        let totalNet = 0;
        let totalNetN1 = 0;

        const rows = accounts.map(acc => {
          const depreciation = acc.compte.startsWith('2')
            ? this.getDepreciationForAsset(acc.compte, depreciationMap)
            : 0;

          const brutValue = acc.debit;
          const netValue = acc.solde - depreciation;

          // Trouver la valeur N-1
          const prevAcc = findPreviousYearAccount(acc.compte, previousAccounts);
          const prevDepreciation = prevAcc && acc.compte.startsWith('2')
            ? this.getDepreciationForAsset(acc.compte, previousYearData.depreciationMap)
            : 0;
          const netValueN1 = prevAcc ? (prevAcc.solde - prevDepreciation) : 0;

          totalBrut += brutValue;
          totalAmort += depreciation;
          totalNet += netValue;
          totalNetN1 += netValueN1;

          return [
            acc.compte,
            acc.libelle,
            this.formatCurrency(brutValue),
            this.formatCurrency(depreciation),
            this.formatCurrency(netValue),
            this.formatCurrency(netValueN1)
          ];
        });

        return { rows, totalBrut, totalAmort, totalNet, totalNetN1 };
      };

      const actifImmData = processActifSection(actifImmobilise, previousYearData.actifImmobilise);
      const actifCircData = processActifSection(actifCirculant, previousYearData.actifCirculant);

      // Calculer totaux généraux actif
      const totalActifBrut = actifImmData.totalBrut + actifCircData.totalBrut;
      const totalAmortissements = actifImmData.totalAmort + actifCircData.totalAmort;
      const totalActifNet = actifImmData.totalNet + actifCircData.totalNet;
      const totalActifNetN1 = actifImmData.totalNetN1 + actifCircData.totalNetN1;

      // Créer les tables pour l'actif avec rubriques et comparatif N-1
      const actifTable: TableData = {
        title: 'ACTIF',
        headers: ['Compte', 'Libellé', 'Brut N', 'Amort. N', 'Net N', 'Net N-1'],
        rows: [
          // Rubrique Actif Immobilisé
          ['', '═══ ACTIF IMMOBILISÉ ═══', '', '', '', ''],
          ...actifImmData.rows,
          ['', 'Sous-total Actif Immobilisé',
           this.formatCurrency(actifImmData.totalBrut),
           this.formatCurrency(actifImmData.totalAmort),
           this.formatCurrency(actifImmData.totalNet),
           this.formatCurrency(actifImmData.totalNetN1)],
          ['', '', '', '', '', ''], // Ligne vide
          // Rubrique Actif Circulant
          ['', '═══ ACTIF CIRCULANT ═══', '', '', '', ''],
          ...actifCircData.rows,
          ['', 'Sous-total Actif Circulant',
           this.formatCurrency(actifCircData.totalBrut),
           this.formatCurrency(actifCircData.totalAmort),
           this.formatCurrency(actifCircData.totalNet),
           this.formatCurrency(actifCircData.totalNetN1)]
        ],
        summary: {
          'TOTAL ACTIF N (Brut)': this.formatCurrency(totalActifBrut),
          'TOTAL ACTIF N (Amortissements)': this.formatCurrency(totalAmortissements),
          'TOTAL ACTIF N (Net)': this.formatCurrency(totalActifNet),
          'TOTAL ACTIF N-1 (Net)': this.formatCurrency(totalActifNetN1)
        }
      };

      // Créer les tables pour le passif avec rubriques et comparatif N-1
      const totalCapitauxPropres = capitauxPropres.reduce((sum, acc) => sum + acc.solde, 0);
      const totalProvisions = provisions.reduce((sum, acc) => sum + acc.solde, 0);
      const totalDettes = dettes.reduce((sum, acc) => sum + acc.solde, 0);
      const totalPassif = totalCapitauxPropres + totalProvisions + totalDettes;

      // Calculer totaux N-1 pour le passif
      const totalCapitauxPropresN1 = previousYearData.capitauxPropres.reduce((sum, acc) => sum + acc.solde, 0);
      const totalProvisionsN1 = previousYearData.provisions.reduce((sum, acc) => sum + acc.solde, 0);
      const totalDettesN1 = previousYearData.dettes.reduce((sum, acc) => sum + acc.solde, 0);
      const totalPassifN1 = totalCapitauxPropresN1 + totalProvisionsN1 + totalDettesN1;

      const passifTable: TableData = {
        title: 'PASSIF',
        headers: ['Compte', 'Libellé', 'Montant N', 'Montant N-1'],
        rows: [
          // Rubrique Capitaux Propres
          ['', '═══ CAPITAUX PROPRES ═══', '', ''],
          ...capitauxPropres.map(acc => {
            const prevAcc = findPreviousYearAccount(acc.compte, previousYearData.capitauxPropres);
            return [
              acc.compte,
              acc.libelle,
              this.formatCurrency(acc.solde),
              this.formatCurrency(prevAcc ? prevAcc.solde : 0)
            ];
          }),
          ['', 'Sous-total Capitaux Propres',
           this.formatCurrency(totalCapitauxPropres),
           this.formatCurrency(totalCapitauxPropresN1)],
          ['', '', '', ''], // Ligne vide
          // Rubrique Provisions
          ['', '═══ PROVISIONS POUR RISQUES ET CHARGES ═══', '', ''],
          ...provisions.map(acc => {
            const prevAcc = findPreviousYearAccount(acc.compte, previousYearData.provisions);
            return [
              acc.compte,
              acc.libelle,
              this.formatCurrency(acc.solde),
              this.formatCurrency(prevAcc ? prevAcc.solde : 0)
            ];
          }),
          ['', 'Sous-total Provisions',
           this.formatCurrency(totalProvisions),
           this.formatCurrency(totalProvisionsN1)],
          ['', '', '', ''], // Ligne vide
          // Rubrique Dettes
          ['', '═══ DETTES ═══', '', ''],
          ...dettes.map(acc => {
            const prevAcc = findPreviousYearAccount(acc.compte, previousYearData.dettes);
            return [
              acc.compte,
              acc.libelle,
              this.formatCurrency(acc.solde),
              this.formatCurrency(prevAcc ? prevAcc.solde : 0)
            ];
          }),
          ['', 'Sous-total Dettes',
           this.formatCurrency(totalDettes),
           this.formatCurrency(totalDettesN1)]
        ],
        summary: {
          'TOTAL PASSIF N': this.formatCurrency(totalPassif),
          'TOTAL PASSIF N-1': this.formatCurrency(totalPassifN1)
        }
      };

      const tables = [actifTable, passifTable];

      // Options d'export par défaut
      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'BILAN COMPTABLE',
        subtitle: `${standardName}\nPériode du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
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

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

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

      // Calculer les données N-1 pour le Compte de Résultat
      const currentYear = new Date(endDate || new Date()).getFullYear();
      const previousYearStart = `${currentYear - 1}-01-01`;
      const previousYearEnd = `${currentYear - 1}-12-31`;
      const previousYearDataCR = await this.calculatePeriodData(companyId, previousYearStart, previousYearEnd);

      // Helper pour trouver un compte dans les données de l'année précédente
      const findPreviousYearAccountCR = (accountNumber: string, accountType: 'charge' | 'produit') => {
        const previousAccounts = accountType === 'charge'
          ? [...previousYearDataCR.charges]
          : [...previousYearDataCR.produits];

        return previousAccounts.find(acc => acc.compte === accountNumber);
      };

      // 🔧 FILTRAGE ADAPTÉ AU STANDARD COMPTABLE
      // Convertir FinancialData en format compatible avec AccountingStandardAdapter
      const chargesData = accountBalances.filter(acc => acc.type === 'charge').map(acc => ({ account_number: acc.compte, ...acc }));
      const { exploitation: chargesExploitationData, hao: chargesHAOData } = AccountingStandardAdapter.splitExpenses(
        chargesData,
        standard
      );

      const produitsData = accountBalances.filter(acc => acc.type === 'produit').map(acc => ({ account_number: acc.compte, ...acc }));
      const { exploitation: produitsExploitationData, hao: produitsHAOData } = AccountingStandardAdapter.splitRevenues(
        produitsData,
        standard
      );

      // Retirer le account_number ajouté temporairement
      const chargesExploitation = chargesExploitationData as unknown as FinancialData[];
      const chargesHAO = chargesHAOData as unknown as FinancialData[];
      const produitsExploitation = produitsExploitationData as unknown as FinancialData[];
      const produitsHAO = produitsHAOData as unknown as FinancialData[];

      // Utiliser les anciennes variables pour compatibilité avec le reste du code
      const charges = chargesExploitation;
      const produits = produitsExploitation;

      // Calcul des totaux N et N-1
      let totalChargesN1 = 0;
      const chargesTable: TableData = {
        title: 'CHARGES',
        headers: ['Compte', 'Libellé', 'Montant N', 'Montant N-1'],
        rows: charges.map(acc => {
          const prevAcc = findPreviousYearAccountCR(acc.compte, 'charge');
          const montantN1 = prevAcc ? prevAcc.debit : 0;
          totalChargesN1 += montantN1;
          return [
            acc.compte,
            acc.libelle,
            this.formatCurrency(acc.debit),
            this.formatCurrency(montantN1)
          ];
        }),
        summary: {
          'Total Charges N': this.formatCurrency(charges.reduce((sum, acc) => sum + acc.debit, 0)),
          'Total Charges N-1': this.formatCurrency(totalChargesN1)
        }
      };

      let totalProduitsN1 = 0;
      const produitsTable: TableData = {
        title: 'PRODUITS',
        headers: ['Compte', 'Libellé', 'Montant N', 'Montant N-1'],
        rows: produits.map(acc => {
          const prevAcc = findPreviousYearAccountCR(acc.compte, 'produit');
          const montantN1 = prevAcc ? prevAcc.credit : 0;
          totalProduitsN1 += montantN1;
          return [
            acc.compte,
            acc.libelle,
            this.formatCurrency(acc.credit),
            this.formatCurrency(montantN1)
          ];
        }),
        summary: {
          'Total Produits N': this.formatCurrency(produits.reduce((sum, acc) => sum + acc.credit, 0)),
          'Total Produits N-1': this.formatCurrency(totalProduitsN1)
        }
      };

      const totalCharges = charges.reduce((sum, acc) => sum + acc.debit, 0);
      const totalProduits = produits.reduce((sum, acc) => sum + acc.credit, 0);
      const resultat = totalProduits - totalCharges;
      const resultatN1 = totalProduitsN1 - totalChargesN1;

      // 📊 CALCUL DES SOLDES INTERMÉDIAIRES DE GESTION (SIG)
      // Conformité: PCG Article 532-6 à 532-8 - Obligatoire en France
      const sig = await this.calculateSIG(
        companyId,
        startDate || startOfYear(new Date()).toISOString().split('T')[0],
        endDate || endOfYear(new Date()).toISOString().split('T')[0]
      );

      const sigTable: TableData = {
        title: 'SOLDES INTERMÉDIAIRES DE GESTION (SIG)',
        headers: ['Indicateur', 'Montant'],
        rows: [
          ['1. Marge commerciale', this.formatCurrency(sig.margeCommerciale)],
          ['2. Production de l\'exercice', this.formatCurrency(sig.productionExercice)],
          ['3. Valeur ajoutée', this.formatCurrency(sig.valeurAjoutee)],
          ['4. Excédent Brut d\'Exploitation (EBE)', this.formatCurrency(sig.ebe)],
          ['5. Résultat d\'exploitation', this.formatCurrency(sig.resultatExploitation)],
          ['6. Résultat courant avant impôts', this.formatCurrency(sig.resultatCourant)],
          ['7. Résultat exceptionnel', this.formatCurrency(sig.resultatExceptionnel)],
          ['8. Résultat net de l\'exercice', this.formatCurrency(sig.resultatNet)]
        ]
      };

      const resultatTable: TableData = {
        title: 'RÉSULTAT D\'EXPLOITATION',
        headers: ['Description', 'Année N', 'Année N-1', 'Variation'],
        rows: [
          ['Total Produits d\'exploitation', this.formatCurrency(totalProduits), this.formatCurrency(totalProduitsN1), this.formatCurrency(totalProduits - totalProduitsN1)],
          ['Total Charges d\'exploitation', this.formatCurrency(totalCharges), this.formatCurrency(totalChargesN1), this.formatCurrency(totalCharges - totalChargesN1)],
          ['Résultat d\'exploitation', this.formatCurrency(resultat), this.formatCurrency(resultatN1), this.formatCurrency(resultat - resultatN1)]
        ]
      };

      const tables: TableData[] = [produitsTable, chargesTable, sigTable, resultatTable];

      // 🎯 SECTION HAO POUR SYSCOHADA
      if (standard === 'SYSCOHADA' && (produitsHAO.length > 0 || chargesHAO.length > 0)) {
        const totalProduitsHAO = produitsHAO.reduce((sum, acc) => sum + acc.credit, 0);
        const totalChargesHAO = chargesHAO.reduce((sum, acc) => sum + acc.debit, 0);
        const resultatHAO = totalProduitsHAO - totalChargesHAO;

        // Calculer les totaux HAO N-1
        let totalProduitsHAON1 = 0;
        let totalChargesHAON1 = 0;

        if (produitsHAO.length > 0) {
          tables.push({
            title: 'PRODUITS HAO (Hors Activités Ordinaires)',
            headers: ['Compte', 'Libellé', 'Montant N', 'Montant N-1'],
            rows: produitsHAO.map(acc => {
              const prevAcc = findPreviousYearAccountCR(acc.compte, 'produit');
              const montantN1 = prevAcc ? prevAcc.credit : 0;
              totalProduitsHAON1 += montantN1;
              return [
                acc.compte,
                acc.libelle,
                this.formatCurrency(acc.credit),
                this.formatCurrency(montantN1)
              ];
            }),
            summary: {
              'Total Produits HAO N': this.formatCurrency(totalProduitsHAO),
              'Total Produits HAO N-1': this.formatCurrency(totalProduitsHAON1)
            }
          });
        }

        if (chargesHAO.length > 0) {
          tables.push({
            title: 'CHARGES HAO (Hors Activités Ordinaires)',
            headers: ['Compte', 'Libellé', 'Montant N', 'Montant N-1'],
            rows: chargesHAO.map(acc => {
              const prevAcc = findPreviousYearAccountCR(acc.compte, 'charge');
              const montantN1 = prevAcc ? prevAcc.debit : 0;
              totalChargesHAON1 += montantN1;
              return [
                acc.compte,
                acc.libelle,
                this.formatCurrency(acc.debit),
                this.formatCurrency(montantN1)
              ];
            }),
            summary: {
              'Total Charges HAO N': this.formatCurrency(totalChargesHAO),
              'Total Charges HAO N-1': this.formatCurrency(totalChargesHAON1)
            }
          });
        }

        // Résultat final incluant HAO avec comparaison N vs N-1
        const resultatNet = resultat + resultatHAO;
        const resultatHAON1 = totalProduitsHAON1 - totalChargesHAON1;
        const resultatNetN1 = resultatN1 + resultatHAON1;

        tables.push({
          title: 'RÉSULTAT NET GLOBAL (AO + HAO)',
          headers: ['Description', 'Année N', 'Année N-1', 'Variation'],
          rows: [
            ['Résultat Activités Ordinaires', this.formatCurrency(resultat), this.formatCurrency(resultatN1), this.formatCurrency(resultat - resultatN1)],
            ['Résultat HAO', this.formatCurrency(resultatHAO), this.formatCurrency(resultatHAON1), this.formatCurrency(resultatHAO - resultatHAON1)],
            ['Résultat Net de l\'exercice', this.formatCurrency(resultatNet), this.formatCurrency(resultatNetN1), this.formatCurrency(resultatNet - resultatNetN1)]
          ]
        });
      }

      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'COMPTE DE RÉSULTAT',
        subtitle: `${standardName}\nPériode du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
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

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

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
        subtitle: `${standardName}\nPériode du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
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

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

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
        subtitle: `${standardName}\nPériode du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
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

  // Génération du Tableau de Flux de Trésorerie
  async generateCashFlow(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      if (!companyId) {
        throw new Error('L\'identifiant de l\'entreprise est requis');
      }

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

      // 1. Récupérer le résultat net (produits et charges)
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          journal_entry_lines (
            account_number,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .gte('entry_date', startDate || startOfYear(new Date()).toISOString().split('T')[0])
        .lte('entry_date', endDate || endOfYear(new Date()).toISOString().split('T')[0]);

      if (error) throw error;

      const journalEntries: JournalEntry[] = [];
      entries?.forEach(entry => {
        entry.journal_entry_lines?.forEach((line: any) => {
          journalEntries.push({
            account_number: line.account_number,
            account_name: line.account_name || '',
            debit: line.debit_amount || 0,
            credit: line.credit_amount || 0,
            entry_date: entry.entry_date
          });
        });
      });

      // 🔧 FILTRAGE ADAPTÉ AU STANDARD COMPTABLE
      const revenueEntries = journalEntries.filter(e => AccountingStandardAdapter.isRevenue(e.account_number, standard));
      const expenseEntries = journalEntries.filter(e => AccountingStandardAdapter.isExpense(e.account_number, standard));

      const revenues = revenueEntries.reduce((sum, e) => sum + e.credit - e.debit, 0);
      const expenses = expenseEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);
      const netIncome = revenues - expenses;

      // Amortissements (compte 68)
      const depreciation = journalEntries.filter(e => e.account_number.startsWith('68')).reduce((sum, e) => sum + e.debit, 0);

      // Variation BFR (approximation: variation comptes clients - fournisseurs)
      const receivablesChange = journalEntries.filter(e => e.account_number.startsWith('41')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const payablesChange = journalEntries.filter(e => e.account_number.startsWith('40')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const inventoryChange = journalEntries.filter(e => e.account_number.startsWith('3')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const workingCapitalChange = -(receivablesChange - payablesChange + inventoryChange);

      // Flux d'exploitation
      const operatingCashFlow = netIncome + depreciation + workingCapitalChange;

      // Investissements (classe 2)
      const capitalExpenditures = journalEntries.filter(e => e.account_number.startsWith('2')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const assetSales = journalEntries.filter(e => e.account_number.startsWith('775')).reduce((sum, e) => sum + e.credit, 0);
      const investingCashFlow = -capitalExpenditures + assetSales;

      // Financement (emprunts classe 16, dividendes 457)
      const loanProceeds = journalEntries.filter(e => e.account_number.startsWith('16')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const dividendsPaid = journalEntries.filter(e => e.account_number.startsWith('457')).reduce((sum, e) => sum + e.debit, 0);
      const financingCashFlow = loanProceeds - dividendsPaid;

      // Variation nette de trésorerie
      const netCashChange = operatingCashFlow + investingCashFlow + financingCashFlow;

      // Solde de trésorerie (classe 5)
      const cashBalances = journalEntries.filter(e => e.account_number.startsWith('5'));
      const closingCash = cashBalances.reduce((sum, e) => sum + e.debit - e.credit, 0);
      const openingCash = closingCash - netCashChange;

      // Analyse IA du flux de trésorerie
      let aiAnalysis: AIAnalysisResult | null = null;
      try {
        const cashFlowData: CashFlowData = {
          operatingCashFlow,
          investingCashFlow,
          financingCashFlow,
          netCashFlow: netCashChange,
          cashBalance: closingCash,
          cashFlowToDebt: loanProceeds > 0 ? operatingCashFlow / loanProceeds : 0,
          freeCashFlow: operatingCashFlow + investingCashFlow
        };

        aiAnalysis = await aiReportAnalysisService.analyzeCashFlow(
          cashFlowData,
          format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr }),
          format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })
        );
      } catch (error) {
        console.error('Erreur lors de l\'analyse IA du flux de trésorerie:', error);
      }

      const executiveSummaryTable: TableData | null = aiAnalysis ? {
        title: 'RÉSUMÉ EXÉCUTIF - Analyse IA',
        subtitle: 'Synthèse intelligente du flux de trésorerie',
        headers: ['Section', 'Analyse'],
        rows: [
          ['Vue d\'ensemble', aiAnalysis.executiveSummary],
          ['Santé financière', aiAnalysis.financialHealth],
          ['Points forts', aiAnalysis.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')],
          ['Points d\'attention', aiAnalysis.concernPoints.map((c, i) => `${i + 1}. ${c}`).join('\n')],
          ['Recommandations', aiAnalysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')],
          ['Niveau de risque', `${aiAnalysis.riskLevel} - Evaluation globale basée sur les flux de trésorerie`]
        ],
        summary: [],
        footer: [`Analyse générée par IA le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`]
      } : null;

      const table: TableData = {
        title: 'TABLEAU DE FLUX DE TRÉSORERIE',
        headers: ['Libellé', 'Montant'],
        rows: [
          ['FLUX DE TRÉSORERIE LIÉS À L\'ACTIVITÉ', ''],
          ['Résultat net de l\'exercice', this.formatCurrency(netIncome)],
          ['+ Amortissements et provisions', this.formatCurrency(depreciation)],
          ['- Variation du BFR', this.formatCurrency(workingCapitalChange)],
          ['= Flux net de trésorerie d\'exploitation', this.formatCurrency(operatingCashFlow)],
          ['', ''],
          ['FLUX DE TRÉSORERIE LIÉS AUX INVESTISSEMENTS', ''],
          ['Acquisitions d\'immobilisations', this.formatCurrency(-capitalExpenditures)],
          ['Cessions d\'immobilisations', this.formatCurrency(assetSales)],
          ['= Flux net de trésorerie d\'investissement', this.formatCurrency(investingCashFlow)],
          ['', ''],
          ['FLUX DE TRÉSORERIE LIÉS AU FINANCEMENT', ''],
          ['Émissions d\'emprunts', this.formatCurrency(loanProceeds)],
          ['Dividendes versés', this.formatCurrency(-dividendsPaid)],
          ['= Flux net de trésorerie de financement', this.formatCurrency(financingCashFlow)],
          ['', ''],
          ['VARIATION DE TRÉSORERIE', this.formatCurrency(netCashChange)],
          ['Trésorerie d\'ouverture', this.formatCurrency(openingCash)],
          ['Trésorerie de clôture', this.formatCurrency(closingCash)]
        ],
        summary: {
          'Variation nette': this.formatCurrency(netCashChange)
        }
      };

      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'TABLEAU DE FLUX DE TRÉSORERIE',
        subtitle: `${standardName}\nPériode du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
        watermark: 'CassKai',
        ...exportOptions
      };

      const tables: TableData[] = executiveSummaryTable ? [executiveSummaryTable, table] : [table];

      switch (defaultOptions.format) {
        case 'pdf':
          return await reportExportService.exportToPDF(tables, defaultOptions);
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv':
          return reportExportService.exportToCSV(table, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      console.error('Erreur génération flux de trésorerie:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le tableau de flux de trésorerie');
    }
  }

  // Génération de l'Analyse des Créances Clients
  async generateAgedReceivables(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { companyId, endDate } = filters;
      const asOfDate = endDate || new Date().toISOString().split('T')[0];

      if (!companyId) {
        throw new Error('L\'identifiant de l\'entreprise est requis');
      }

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

      // Récupérer les soldes clients (compte 411)
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          reference,
          journal_entry_lines (
            account_number,
            account_name,
            auxiliary_account,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .lte('entry_date', asOfDate);

      if (error) throw error;

      // Grouper par client
      const customerBalances: Record<string, { name: string; entries: any[] }> = {};

      entries?.forEach(entry => {
        entry.journal_entry_lines?.forEach((line: any) => {
          if (line.account_number.startsWith('411')) {
            const customerId = line.auxiliary_account || line.account_number;
            if (!customerBalances[customerId]) {
              customerBalances[customerId] = {
                name: line.account_name || customerId,
                entries: []
              };
            }
            customerBalances[customerId].entries.push({
              date: entry.entry_date,
              reference: entry.reference,
              debit: line.debit_amount || 0,
              credit: line.credit_amount || 0
            });
          }
        });
      });

      // Calculer l'ancienneté des créances
      const today = new Date(asOfDate);
      const rows: string[][] = [];
      let totalCurrent = 0;
      let total30 = 0;
      let total60 = 0;
      let total90 = 0;
      let totalOver90 = 0;

      Object.entries(customerBalances).forEach(([_customerId, data]) => {
        let balance = 0;
        let current = 0;
        let days30 = 0;
        let days60 = 0;
        let days90 = 0;
        let over90 = 0;

        data.entries.forEach(entry => {
          const amount = entry.debit - entry.credit;
          if (amount > 0) {
            const daysSince = Math.floor((today.getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24));

            if (daysSince <= 30) current += amount;
            else if (daysSince <= 60) days30 += amount;
            else if (daysSince <= 90) days60 += amount;
            else if (daysSince <= 120) days90 += amount;
            else over90 += amount;
          }
          balance += amount;
        });

        if (balance > 0) {
          rows.push([
            data.name,
            this.formatCurrency(balance),
            this.formatCurrency(current),
            this.formatCurrency(days30),
            this.formatCurrency(days60),
            this.formatCurrency(days90),
            this.formatCurrency(over90)
          ]);

          totalCurrent += current;
          total30 += days30;
          total60 += days60;
          total90 += days90;
          totalOver90 += over90;
        }
      });

      const totalOutstanding = totalCurrent + total30 + total60 + total90 + totalOver90;

      rows.push([
        'TOTAL',
        this.formatCurrency(totalOutstanding),
        this.formatCurrency(totalCurrent),
        this.formatCurrency(total30),
        this.formatCurrency(total60),
        this.formatCurrency(total90),
        this.formatCurrency(totalOver90)
      ]);

      // Analyse IA des créances clients
      let aiAnalysis: AIAnalysisResult | null = null;
      try {
        const overdueTotal = total30 + total60 + total90 + totalOver90;
        const dso = totalOutstanding > 0 ? (totalOutstanding / ((entries?.length || 1) / 365)) : 0;
        const collectionRate = totalOutstanding > 0 ? ((totalCurrent / totalOutstanding) * 100) : 0;
        const averageOverdue = overdueTotal > 0 ? (overdueTotal / Object.keys(customerBalances).length) : 0;

        const receivablesData: ReceivablesData = {
          totalReceivables: totalOutstanding,
          current: totalCurrent,
          overdue30: total30,
          overdue60: total60,
          overdue90: total90 + totalOver90,
          dso: dso,
          collectionRate: collectionRate,
          averageOverdueAmount: averageOverdue
        };

        aiAnalysis = await aiReportAnalysisService.analyzeReceivables(
          receivablesData,
          format(startOfYear(new Date(asOfDate)), 'dd/MM/yyyy', { locale: fr }),
          format(new Date(asOfDate), 'dd/MM/yyyy', { locale: fr })
        );
      } catch (error) {
        console.error('Erreur lors de l\'analyse IA des créances clients:', error);
      }

      const executiveSummaryTable: TableData | null = aiAnalysis ? {
        title: 'RÉSUMÉ EXÉCUTIF - Analyse IA',
        subtitle: 'Synthèse intelligente des créances clients',
        headers: ['Section', 'Analyse'],
        rows: [
          ['Vue d\'ensemble', aiAnalysis.executiveSummary],
          ['Santé financière', aiAnalysis.financialHealth],
          ['Points forts', aiAnalysis.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')],
          ['Points d\'attention', aiAnalysis.concernPoints.map((c, i) => `${i + 1}. ${c}`).join('\n')],
          ['Recommandations', aiAnalysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')],
          ['Niveau de risque', `${aiAnalysis.riskLevel} - Evaluation du risque de recouvrement`]
        ],
        summary: [],
        footer: [`Analyse générée par IA le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`]
      } : null;

      const table: TableData = {
        title: 'ANALYSE DES CRÉANCES CLIENTS',
        headers: ['Client', 'Total', 'Courant', '31-60j', '61-90j', '91-120j', '>120j'],
        rows,
        summary: {
          'Total créances': this.formatCurrency(totalOutstanding),
          'Créances > 90j (à risque)': this.formatCurrency(total90 + totalOver90),
          'Taux de risque': `${((total90 + totalOver90) / totalOutstanding * 100).toFixed(1)}%`
        }
      };

      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'ANALYSE DES CRÉANCES CLIENTS',
        subtitle: `${standardName}\nAu ${format(new Date(asOfDate), 'dd/MM/yyyy', { locale: fr })}`,
        orientation: 'landscape',
        watermark: 'CassKai',
        ...exportOptions
      };

      const tables: TableData[] = executiveSummaryTable ? [executiveSummaryTable, table] : [table];

      switch (defaultOptions.format) {
        case 'pdf':
          return await reportExportService.exportToPDF(tables, defaultOptions);
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv':
          return reportExportService.exportToCSV(table, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      console.error('Erreur génération créances clients:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer l\'analyse des créances clients');
    }
  }

  // Génération de l'Analyse par Ratios Financiers
  async generateFinancialRatios(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      if (!companyId) {
        throw new Error('L\'identifiant de l\'entreprise est requis');
      }

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

      // Récupérer toutes les écritures comptables
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          journal_entry_lines (
            account_number,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .gte('entry_date', startDate || startOfYear(new Date()).toISOString().split('T')[0])
        .lte('entry_date', endDate || endOfYear(new Date()).toISOString().split('T')[0]);

      if (error) throw error;

      const journalEntries: JournalEntry[] = [];
      entries?.forEach(entry => {
        entry.journal_entry_lines?.forEach((line: any) => {
          journalEntries.push({
            account_number: line.account_number,
            account_name: line.account_name || '',
            debit: line.debit_amount || 0,
            credit: line.credit_amount || 0,
            entry_date: entry.entry_date
          });
        });
      });

      // Calculer les agrégats
      const revenues = journalEntries.filter(e => e.account_number.startsWith('7')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const expenses = journalEntries.filter(e => e.account_number.startsWith('6')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const netIncome = revenues - expenses;

      const currentAssets = journalEntries.filter(e => ['3', '4', '5'].includes(e.account_number[0])).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const fixedAssets = journalEntries.filter(e => e.account_number.startsWith('2')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const totalAssets = currentAssets + fixedAssets;

      const currentLiabilities = journalEntries.filter(e => e.account_number.startsWith('4')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const longTermDebt = journalEntries.filter(e => ['16', '17'].includes(e.account_number.substring(0, 2))).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const equity = journalEntries.filter(e => e.account_number.startsWith('1')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const totalLiabilities = currentLiabilities + longTermDebt;

      const inventory = journalEntries.filter(e => e.account_number.startsWith('3')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const receivables = journalEntries.filter(e => e.account_number.startsWith('41')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const payables = journalEntries.filter(e => e.account_number.startsWith('40')).reduce((sum, e) => sum + e.credit - e.debit, 0);

      // Calcul des ratios
      const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
      const quickRatio = currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0;
      const cashRatio = currentLiabilities > 0 ? (journalEntries.filter(e => e.account_number.startsWith('5')).reduce((sum, e) => sum + e.debit - e.credit, 0) / currentLiabilities) : 0;
      const grossMargin = revenues > 0 ? ((revenues - expenses) / revenues) * 100 : 0;
      const netMargin = revenues > 0 ? (netIncome / revenues) * 100 : 0;
      const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
      const roe = equity > 0 ? (netIncome / equity) * 100 : 0;
      const debtToEquity = equity > 0 ? totalLiabilities / equity : 0;
      const debtToAssets = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
      const interestExpense = journalEntries.filter(e => e.account_number.startsWith('66')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const interestCoverage = interestExpense > 0 ? netIncome / interestExpense : 0;
      const inventoryDays = expenses > 0 ? (inventory / (expenses / 365)) : 0;
      const dso = revenues > 0 ? (receivables / (revenues / 365)) : 0;
      const dpo = expenses > 0 ? (payables / (expenses / 365)) : 0;
      const assetTurnover = totalAssets > 0 ? revenues / totalAssets : 0;
      const inventoryTurnover = inventory > 0 ? expenses / inventory : 0;
      const receivablesTurnover = receivables > 0 ? revenues / receivables : 0;

      // Analyse IA des ratios financiers
      let aiAnalysis: AIAnalysisResult | null = null;
      try {
        const financialRatiosData: FinancialRatiosData = {
          liquidityRatios: {
            currentRatio: currentRatio,
            quickRatio: quickRatio,
            cashRatio: cashRatio
          },
          profitabilityRatios: {
            grossMargin: grossMargin,
            netMargin: netMargin,
            roa: roa,
            roe: roe
          },
          leverageRatios: {
            debtToEquity: debtToEquity,
            debtToAssets: debtToAssets / 100,
            interestCoverage: interestCoverage
          },
          efficiencyRatios: {
            assetTurnover: assetTurnover,
            inventoryTurnover: inventoryTurnover,
            receivablesTurnover: receivablesTurnover
          }
        };

        aiAnalysis = await aiReportAnalysisService.analyzeFinancialRatios(
          financialRatiosData,
          format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr }),
          format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })
        );
      } catch (error) {
        console.error('Erreur lors de l\'analyse IA des ratios financiers:', error);
      }

      const executiveSummaryTable: TableData | null = aiAnalysis ? {
        title: 'RÉSUMÉ EXÉCUTIF - Analyse IA',
        subtitle: 'Synthèse intelligente des ratios financiers',
        headers: ['Section', 'Analyse'],
        rows: [
          ['Vue d\'ensemble', aiAnalysis.executiveSummary],
          ['Santé financière', aiAnalysis.financialHealth],
          ['Points forts', aiAnalysis.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')],
          ['Points d\'attention', aiAnalysis.concernPoints.map((c, i) => `${i + 1}. ${c}`).join('\n')],
          ['Recommandations', aiAnalysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')],
          ['Niveau de risque', `${aiAnalysis.riskLevel} - Evaluation de la solidité financière`]
        ],
        summary: [],
        footer: [`Analyse générée par IA le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`]
      } : null;

      const table: TableData = {
        title: 'ANALYSE PAR RATIOS FINANCIERS',
        headers: ['Ratio', 'Valeur', 'Interprétation'],
        rows: [
          ['RATIOS DE LIQUIDITÉ', '', ''],
          ['Ratio de liquidité générale', currentRatio.toFixed(2), currentRatio > 1.5 ? '✓ Bon' : currentRatio > 1 ? '~ Acceptable' : '✗ Faible'],
          ['Ratio de liquidité réduite', quickRatio.toFixed(2), quickRatio > 1 ? '✓ Bon' : '✗ Faible'],
          ['', '', ''],
          ['RATIOS DE RENTABILITÉ', '', ''],
          ['Marge brute (%)', `${grossMargin.toFixed(1)}%`, grossMargin > 30 ? '✓ Excellent' : grossMargin > 20 ? '~ Bon' : '✗ Faible'],
          ['Marge nette (%)', `${netMargin.toFixed(1)}%`, netMargin > 10 ? '✓ Excellent' : netMargin > 5 ? '~ Bon' : '✗ Faible'],
          ['Rentabilité des actifs (ROA) (%)', `${roa.toFixed(1)}%`, roa > 5 ? '✓ Bon' : '~ Moyen'],
          ['Rentabilité des capitaux propres (ROE) (%)', `${roe.toFixed(1)}%`, roe > 15 ? '✓ Excellent' : roe > 10 ? '~ Bon' : '✗ Faible'],
          ['', '', ''],
          ['RATIOS D\'ACTIVITÉ', '', ''],
          ['Rotation des stocks (jours)', inventoryDays.toFixed(0), inventoryDays < 60 ? '✓ Rapide' : '~ Normale'],
          ['Délai de recouvrement clients (DSO)', `${dso.toFixed(0)} jours`, dso < 45 ? '✓ Bon' : dso < 60 ? '~ Acceptable' : '✗ Long'],
          ['Délai de paiement fournisseurs (DPO)', `${dpo.toFixed(0)} jours`, dpo > 45 ? '✓ Bon' : '~ Court'],
          ['', '', ''],
          ['RATIOS D\'ENDETTEMENT', '', ''],
          ['Ratio d\'endettement', debtToEquity.toFixed(2), debtToEquity < 1 ? '✓ Faible' : debtToEquity < 2 ? '~ Modéré' : '✗ Élevé'],
          ['Dette / Actifs (%)', `${debtToAssets.toFixed(1)}%`, debtToAssets < 50 ? '✓ Sain' : '✗ Risqué']
        ],
        summary: {
          'Score de liquidité': currentRatio > 1.5 ? 'EXCELLENT' : currentRatio > 1 ? 'BON' : 'À SURVEILLER',
          'Score de rentabilité': netMargin > 10 ? 'EXCELLENT' : netMargin > 5 ? 'BON' : 'À AMÉLIORER',
          'Score de solvabilité': debtToEquity < 1 ? 'EXCELLENT' : debtToEquity < 2 ? 'BON' : 'RISQUÉ'
        }
      };

      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'ANALYSE PAR RATIOS FINANCIERS',
        subtitle: `${standardName}\nPériode du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
        watermark: 'CassKai',
        ...exportOptions
      };

      const tables: TableData[] = executiveSummaryTable ? [executiveSummaryTable, table] : [table];

      switch (defaultOptions.format) {
        case 'pdf':
          return await reportExportService.exportToPDF(tables, defaultOptions);
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv':
          return reportExportService.exportToCSV(table, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      console.error('Erreur génération ratios financiers:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer l\'analyse par ratios financiers');
    }
  }

  // Génération de la Déclaration TVA
  async generateVATReport(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      if (!companyId) {
        throw new Error('L\'identifiant de l\'entreprise est requis');
      }

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

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
        .gte('entry_date', startDate || startOfYear(new Date()).toISOString().split('T')[0])
        .lte('entry_date', endDate || endOfYear(new Date()).toISOString().split('T')[0]);

      if (error) throw error;

      const journalEntries: JournalEntry[] = [];
      entries?.forEach(entry => {
        entry.journal_entry_lines?.forEach((line: any) => {
          journalEntries.push({
            account_number: line.account_number,
            account_name: line.account_name || '',
            debit: line.debit_amount || 0,
            credit: line.credit_amount || 0,
            entry_date: entry.entry_date
          });
        });
      });

      // TVA collectée (compte 4457)
      const vatCollectedStandard = journalEntries.filter(e => e.account_number.startsWith('44571')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const vatCollectedReduced = journalEntries.filter(e => e.account_number.startsWith('44572')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const totalVATCollected = vatCollectedStandard + vatCollectedReduced;

      // TVA déductible (compte 4456)
      const vatDeductibleGoods = journalEntries.filter(e => e.account_number.startsWith('44566')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const vatDeductibleAssets = journalEntries.filter(e => e.account_number.startsWith('44562')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const totalVATDeductible = vatDeductibleGoods + vatDeductibleAssets;

      // TVA nette due
      const netVATDue = totalVATCollected - totalVATDeductible;

      // Bases HT (approximation)
      const baseStandard = vatCollectedStandard / 0.20;
      const baseReduced = vatCollectedReduced / 0.055;

      const table: TableData = {
        title: 'DÉCLARATION DE TVA CA3',
        headers: ['Ligne', 'Libellé', 'Base HT', 'TVA'],
        rows: [
          ['', 'TVA COLLECTÉE', '', ''],
          ['01', 'Ventes et prestations taux normal (20%)', this.formatCurrency(baseStandard), this.formatCurrency(vatCollectedStandard)],
          ['02', 'Ventes et prestations taux réduit (5,5%)', this.formatCurrency(baseReduced), this.formatCurrency(vatCollectedReduced)],
          ['', 'Total TVA collectée', '', this.formatCurrency(totalVATCollected)],
          ['', '', '', ''],
          ['', 'TVA DÉDUCTIBLE', '', ''],
          ['19', 'TVA sur achats de biens et services', '', this.formatCurrency(vatDeductibleGoods)],
          ['20', 'TVA sur immobilisations', '', this.formatCurrency(vatDeductibleAssets)],
          ['', 'Total TVA déductible', '', this.formatCurrency(totalVATDeductible)],
          ['', '', '', ''],
          ['', 'TVA NETTE DUE', '', this.formatCurrency(netVATDue)]
        ],
        summary: {
          'TVA collectée': this.formatCurrency(totalVATCollected),
          'TVA déductible': this.formatCurrency(totalVATDeductible),
          'TVA à décaisser': this.formatCurrency(netVATDue)
        }
      };

      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'DÉCLARATION DE TVA CA3',
        subtitle: `${standardName}\nPériode du ${format(new Date(startDate || startOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDate || endOfYear(new Date())), 'dd/MM/yyyy', { locale: fr })}`,
        watermark: 'CassKai - Document Fiscal',
        ...exportOptions
      };

      switch (defaultOptions.format) {
        case 'pdf':
          return await reportExportService.exportToPDF([table], defaultOptions);
        case 'excel':
          return await reportExportService.exportToExcel([table], defaultOptions);
        case 'csv':
          return reportExportService.exportToCSV(table, defaultOptions);
        default:
          return await reportExportService.exportToPDF([table], defaultOptions);
      }
    } catch (error) {
      console.error('Erreur génération déclaration TVA:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer la déclaration TVA');
    }
  }

  /**
   * Générer Analyse des Dettes Fournisseurs (aged_payables)
   * Analyse de l'ancienneté des dettes fournisseurs avec buckets d'échéances
   */
  async generateAgedPayables(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { companyId, endDate } = filters;
      const asOfDate = endDate || new Date().toISOString().split('T')[0];

      if (!companyId) {
        throw new Error('L\'identifiant de l\'entreprise est requis');
      }

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

      // Récupérer toutes les écritures pour les comptes fournisseurs (401)
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          reference,
          journal_entry_lines (
            account_number,
            account_name,
            auxiliary_account,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .lte('entry_date', asOfDate);

      if (error) {
        console.error('Erreur Supabase aged payables:', error);
        throw error;
      }

      // Aplatir les lignes d'écriture
      interface JournalEntryLine {
        account_number: string;
        account_name: string;
        auxiliary_account: string | null;
        debit_amount: number;
        credit_amount: number;
        date: string;
        reference: string;
      }

      const journalEntries: JournalEntryLine[] = [];
      if (entries && entries.length > 0) {
        entries.forEach(entry => {
          if (Array.isArray(entry.journal_entry_lines)) {
            entry.journal_entry_lines.forEach((line: { account_number: string; account_name: string; auxiliary_account: string | null; debit_amount: number; credit_amount: number }) => {
              journalEntries.push({
                account_number: line.account_number,
                account_name: line.account_name,
                auxiliary_account: line.auxiliary_account,
                debit_amount: line.debit_amount || 0,
                credit_amount: line.credit_amount || 0,
                date: entry.entry_date,
                reference: entry.reference || ''
              });
            });
          }
        });
      }

      // Filtrer uniquement les comptes fournisseurs (401)
      const supplierEntries = journalEntries.filter(e => e.account_number.startsWith('401'));

      // Grouper par fournisseur (auxiliary_account ou account_number)
      interface SupplierData {
        name: string;
        entries: JournalEntryLine[];
      }

      const supplierBalances: Record<string, SupplierData> = {};

      supplierEntries.forEach(entry => {
        const supplierId = entry.auxiliary_account || entry.account_number;

        if (!supplierBalances[supplierId]) {
          supplierBalances[supplierId] = {
            name: entry.account_name || supplierId,
            entries: []
          };
        }

        supplierBalances[supplierId].entries.push(entry);
      });

      // Calculer l'ancienneté pour chaque fournisseur
      const today = new Date(asOfDate);
      const agingData: {
        supplier: string;
        total: number;
        current: number;
        days30: number;
        days60: number;
        days90: number;
        days120: number;
        over120: number;
        paymentTerms: string;
        nextPayment: string;
      }[] = [];

      let totalOutstanding = 0;
      let currentTotal = 0;
      let days30Total = 0;
      let days60Total = 0;
      let days90Total = 0;
      let _days120Total = 0;
      let over120Total = 0;

      Object.entries(supplierBalances).forEach(([_supplierId, data]) => {
        let current = 0;
        let days30 = 0;
        let days60 = 0;
        let days90 = 0;
        const days120 = 0;
        let over120 = 0;

        data.entries.forEach(entry => {
          // Pour les fournisseurs, le solde dû est crédit - débit
          const amount = entry.credit_amount - entry.debit_amount;

          if (amount > 0) {
            const daysSince = Math.floor((today.getTime() - new Date(entry.date).getTime()) / (1000 * 60 * 60 * 24));

            if (daysSince <= 30) {
              current += amount;
            } else if (daysSince <= 60) {
              days30 += amount;
            } else if (daysSince <= 90) {
              days60 += amount;
            } else if (daysSince <= 120) {
              days90 += amount;
            } else {
              over120 += amount;
            }
          }
        });

        const total = current + days30 + days60 + days90 + days120 + over120;

        if (total > 0) {
          agingData.push({
            supplier: data.name,
            total,
            current,
            days30,
            days60,
            days90,
            days120,
            over120,
            paymentTerms: '30 jours', // Par défaut, devrait venir des tiers
            nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });

          totalOutstanding += total;
          currentTotal += current;
          days30Total += days30;
          days60Total += days60;
          days90Total += days90;
          _days120Total += days120;
          over120Total += over120;
        }
      });

      // Trier par montant total décroissant
      agingData.sort((a, b) => b.total - a.total);

      // Récupérer les dépenses totales pour calculer le DPO
      const expenses = journalEntries
        .filter(e => e.account_number.startsWith('6'))
        .reduce((sum, e) => sum + e.debit_amount - e.credit_amount, 0);

      // Analyse IA des dettes fournisseurs
      let aiAnalysis: AIAnalysisResult | null = null;
      try {
        const overdueTotal = days30Total + days60Total + days90Total + over120Total;
        const payablesData: PayablesData = {
          totalPayables: totalOutstanding,
          current: currentTotal,
          overdue30: days30Total,
          overdue60: days60Total,
          overdue90: days90Total + over120Total,
          dpo: totalOutstanding > 0 && expenses > 0 ? (totalOutstanding / expenses) * 365 : 0,
          paymentRate: totalOutstanding > 0 ? ((totalOutstanding - overdueTotal) / totalOutstanding) * 100 : 100,
          averageOverdueAmount: overdueTotal / Math.max(1, agingData.filter(p => p.days30 + p.days60 + p.days90 + p.over120 > 0).length)
        };

        aiAnalysis = await aiReportAnalysisService.analyzePayables(
          payablesData,
          format(new Date(asOfDate), 'dd/MM/yyyy', { locale: fr }),
          format(new Date(asOfDate), 'dd/MM/yyyy', { locale: fr })
        );
      } catch (error) {
        console.error('Erreur lors de l\'analyse IA des dettes fournisseurs:', error);
      }

      const executiveSummaryTable: TableData | null = aiAnalysis ? {
        title: 'RÉSUMÉ EXÉCUTIF - Analyse IA',
        subtitle: 'Synthèse intelligente des dettes fournisseurs',
        headers: ['Section', 'Analyse'],
        rows: [
          ['Vue d\'ensemble', aiAnalysis.executiveSummary],
          ['Santé financière', aiAnalysis.financialHealth],
          ['Points forts', aiAnalysis.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')],
          ['Points d\'attention', aiAnalysis.concernPoints.map((c, i) => `${i + 1}. ${c}`).join('\n')],
          ['Recommandations', aiAnalysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')],
          ['Niveau de risque', `${aiAnalysis.riskLevel} - Evaluation basée sur les délais de paiement`]
        ],
        summary: [],
        footer: [`Analyse générée par IA le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`]
      } : null;

      // Préparer le tableau pour export
      const table: TableData = agingData.length > 0 ? {
        title: 'Analyse des Dettes Fournisseurs',
        subtitle: `${standardName}\nAu ${new Date(asOfDate).toLocaleDateString('fr-FR')}`,
        headers: [
          'Fournisseur',
          'Total dû',
          'Courant (0-30j)',
          '31-60j',
          '61-90j',
          '91-120j',
          '>120j',
          'Conditions',
          'Prochaine échéance'
        ],
        rows: agingData.map(row => [
          row.supplier,
          this.formatCurrency(row.total),
          this.formatCurrency(row.current),
          this.formatCurrency(row.days30),
          this.formatCurrency(row.days60),
          this.formatCurrency(row.days90),
          this.formatCurrency(row.over120),
          row.paymentTerms,
          new Date(row.nextPayment).toLocaleDateString('fr-FR')
        ]),
        summary: [
          ['TOTAUX', this.formatCurrency(totalOutstanding), this.formatCurrency(currentTotal), this.formatCurrency(days30Total), this.formatCurrency(days60Total), this.formatCurrency(days90Total), this.formatCurrency(over120Total), '', '']
        ],
        footer: [
          `Nombre de fournisseurs: ${agingData.length}`,
          `Total des dettes: ${this.formatCurrency(totalOutstanding)}`,
          `Dettes à échéance immédiate (>90j): ${this.formatCurrency(days90Total + over120Total)} (${((days90Total + over120Total) / totalOutstanding * 100).toFixed(1)}%)`
        ]
      } : {
        title: 'Analyse des Dettes Fournisseurs',
        subtitle: `${standardName}\nAu ${new Date(asOfDate).toLocaleDateString('fr-FR')}`,
        headers: ['Information'],
        rows: [['Aucune donnée disponible pour cette période']],
        footer: ['Aucune dette fournisseur enregistrée pour la période sélectionnée']
      };

      // Options d'export avec orientation paysage
      const defaultOptions: ExportOptions = {
        format: exportOptions?.format || 'pdf',
        title: 'ANALYSE DES DETTES FOURNISSEURS',
        subtitle: `${standardName}\nAu ${format(new Date(asOfDate), 'dd/MM/yyyy', { locale: fr })}`,
        orientation: 'landscape',
        fileName: `aged_payables_${asOfDate}`,
        includeCharts: exportOptions?.includeCharts ?? false
      };

      // Exporter selon le format
      const tables: TableData[] = executiveSummaryTable ? [executiveSummaryTable, table] : [table];
      switch (defaultOptions.format) {
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv':
          return await reportExportService.exportToCSV(tables, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      console.error('Erreur génération analyse dettes fournisseurs:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer l\'analyse des dettes fournisseurs');
    }
  }

  /**
   * Générer Analyse des Écarts Budgétaires (budget_variance)
   * Comparaison Budget vs Réalisé avec analyse des écarts
   */
  async generateBudgetVariance(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { companyId, startDate, endDate } = filters;
      const periodStart = startDate || startOfYear(new Date()).toISOString().split('T')[0];
      const periodEnd = endDate || endOfYear(new Date()).toISOString().split('T')[0];

      if (!companyId) {
        throw new Error('L\'identifiant de l\'entreprise est requis');
      }

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

      // Récupérer les écritures comptables pour le réalisé
      const { data: entries, error: entriesError } = await supabase
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
        .gte('entry_date', periodStart)
        .lte('entry_date', periodEnd);

      if (entriesError) {
        console.error('Erreur Supabase écarts budgétaires:', entriesError);
        throw entriesError;
      }

      // Aplatir les lignes d'écriture
      interface JournalEntryLine {
        account_number: string;
        account_name: string;
        debit: number;
        credit: number;
      }

      const journalEntries: JournalEntryLine[] = [];
      if (entries && entries.length > 0) {
        entries.forEach(entry => {
          if (Array.isArray(entry.journal_entry_lines)) {
            entry.journal_entry_lines.forEach((line: { account_number: string; account_name: string; debit_amount: number; credit_amount: number }) => {
              journalEntries.push({
                account_number: line.account_number,
                account_name: line.account_name,
                debit: line.debit_amount || 0,
                credit: line.credit_amount || 0
              });
            });
          }
        });
      }

      // Calculer le réalisé
      const revenues = journalEntries
        .filter(e => e.account_number.startsWith('7'))
        .reduce((sum, e) => sum + e.credit - e.debit, 0);

      const expenses = journalEntries
        .filter(e => e.account_number.startsWith('6'))
        .reduce((sum, e) => sum + e.debit - e.credit, 0);

      const netIncome = revenues - expenses;

      // Récupérer les budgets (vérifier si la table existe)
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('company_id', companyId)
        .gte('period_start', periodStart)
        .lte('period_end', periodEnd)
        .limit(1)
        .single();

      // Si la table n'existe pas ou pas de budget, utiliser des valeurs estimées
      let budgetedRevenue = revenues * 1.1; // Estimation: +10% du réalisé
      let budgetedExpenses = expenses * 0.95; // Estimation: -5% du réalisé
      let budgetedProfit = budgetedRevenue - budgetedExpenses;

      if (!budgetsError && budgets) {
        // Si des budgets existent, les utiliser
        budgetedRevenue = budgets.revenue_budget || budgetedRevenue;
        budgetedExpenses = budgets.expense_budget || budgetedExpenses;
        budgetedProfit = budgets.profit_budget || budgetedProfit;
      }

      // Calculer les écarts
      const revenueVariance = revenues - budgetedRevenue;
      const revenueVariancePct = budgetedRevenue > 0 ? (revenueVariance / budgetedRevenue) * 100 : 0;
      const revenueFavorable = revenueVariance >= 0;

      const expenseVariance = expenses - budgetedExpenses;
      const expenseVariancePct = budgetedExpenses > 0 ? (expenseVariance / budgetedExpenses) * 100 : 0;
      const expenseFavorable = expenseVariance <= 0; // Pour les dépenses, moins c'est mieux

      const profitVariance = netIncome - budgetedProfit;
      const profitVariancePct = budgetedProfit > 0 ? (profitVariance / budgetedProfit) * 100 : 0;
      const profitFavorable = profitVariance >= 0;

      // Analyse par catégorie de charges (comptes 60 à 68)
      const expenseCategories = [
        { code: '60', name: 'Achats' },
        { code: '61', name: 'Services extérieurs' },
        { code: '62', name: 'Autres services extérieurs' },
        { code: '63', name: 'Impôts et taxes' },
        { code: '64', name: 'Charges de personnel' },
        { code: '65', name: 'Charges financières' },
        { code: '66', name: 'Charges exceptionnelles' },
        { code: '68', name: 'Dotations amortissements' }
      ];

      const categoryData: {
        category: string;
        budgeted: number;
        actual: number;
        variance: number;
        variancePct: number;
        favorable: boolean;
      }[] = [];

      expenseCategories.forEach(cat => {
        const actual = journalEntries
          .filter(e => e.account_number.startsWith(cat.code))
          .reduce((sum, e) => sum + e.debit - e.credit, 0);

        // Budget estimé proportionnellement
        const budgeted = actual * 1.05; // Estimation: +5%

        const variance = actual - budgeted;
        const variancePct = budgeted > 0 ? (variance / budgeted) * 100 : 0;
        const favorable = variance <= 0;

        if (actual > 0 || budgeted > 0) {
          categoryData.push({
            category: cat.name,
            budgeted,
            actual,
            variance,
            variancePct,
            favorable
          });
        }
      });

      // Analyse IA des écarts budgétaires
      let aiAnalysis: AIAnalysisResult | null = null;
      try {
        const totalBudget = budgetedRevenue + budgetedExpenses;
        const totalActual = revenues + expenses;
        const totalVariance = totalActual - totalBudget;
        const variancePercentage = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

        const majorVariances = categoryData
          .filter(cat => Math.abs(cat.variancePct) > 10)
          .slice(0, 5)
          .map(cat => ({
            category: cat.category,
            budget: cat.budgeted,
            actual: cat.actual,
            variance: cat.variance,
            variancePercent: cat.variancePct
          }));

        const budgetVarianceData: BudgetVarianceData = {
          totalBudget: totalBudget,
          totalActual: totalActual,
          totalVariance: totalVariance,
          variancePercentage: variancePercentage,
          majorVariances: majorVariances
        };

        aiAnalysis = await aiReportAnalysisService.analyzeBudgetVariance(
          budgetVarianceData,
          format(new Date(periodStart), 'dd/MM/yyyy', { locale: fr }),
          format(new Date(periodEnd), 'dd/MM/yyyy', { locale: fr })
        );
      } catch (error) {
        console.error('Erreur lors de l\'analyse IA des écarts budgétaires:', error);
      }

      const executiveSummaryTable: TableData | null = aiAnalysis ? {
        title: 'RÉSUMÉ EXÉCUTIF - Analyse IA',
        subtitle: 'Synthèse intelligente des écarts budgétaires',
        headers: ['Section', 'Analyse'],
        rows: [
          ['Vue d\'ensemble', aiAnalysis.executiveSummary],
          ['Santé financière', aiAnalysis.financialHealth],
          ['Points forts', aiAnalysis.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')],
          ['Points d\'attention', aiAnalysis.concernPoints.map((c, i) => `${i + 1}. ${c}`).join('\n')],
          ['Recommandations', aiAnalysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')],
          ['Niveau de risque', `${aiAnalysis.riskLevel} - Evaluation du respect budgétaire`]
        ],
        summary: [],
        footer: [`Analyse générée par IA le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`]
      } : null;

      // Préparer les tableaux pour export
      const summaryTable: TableData = journalEntries.length > 0 ? {
        title: 'Analyse des Écarts Budgétaires',
        subtitle: `${standardName}\nPériode: ${new Date(periodStart).toLocaleDateString('fr-FR')} - ${new Date(periodEnd).toLocaleDateString('fr-FR')}`,
        headers: ['Rubrique', 'Budget', 'Réalisé', 'Écart', 'Écart %', 'Statut'],
        rows: [
          [
            'Produits (CA)',
            this.formatCurrency(budgetedRevenue),
            this.formatCurrency(revenues),
            this.formatCurrency(revenueVariance),
            `${revenueVariancePct.toFixed(1)}%`,
            revenueFavorable ? '✓ Favorable' : '✗ Défavorable'
          ],
          [
            'Charges',
            this.formatCurrency(budgetedExpenses),
            this.formatCurrency(expenses),
            this.formatCurrency(expenseVariance),
            `${expenseVariancePct.toFixed(1)}%`,
            expenseFavorable ? '✓ Favorable' : '✗ Défavorable'
          ],
          [
            'Résultat Net',
            this.formatCurrency(budgetedProfit),
            this.formatCurrency(netIncome),
            this.formatCurrency(profitVariance),
            `${profitVariancePct.toFixed(1)}%`,
            profitFavorable ? '✓ Favorable' : '✗ Défavorable'
          ]
        ],
        summary: [],
        footer: [
          `Performance globale: ${profitFavorable ? 'Objectif atteint' : 'En dessous de l\'objectif'}`,
          `Écart sur résultat: ${this.formatCurrency(Math.abs(profitVariance))} (${Math.abs(profitVariancePct).toFixed(1)}%)`
        ]
      } : {
        title: 'Analyse des Écarts Budgétaires',
        subtitle: `${standardName}\nPériode: ${new Date(periodStart).toLocaleDateString('fr-FR')} - ${new Date(periodEnd).toLocaleDateString('fr-FR')}`,
        headers: ['Information'],
        rows: [['Aucune donnée disponible pour cette période']],
        footer: ['Aucune écriture comptable enregistrée pour la période sélectionnée']
      };

      const detailTable: TableData = categoryData.length > 0 ? {
        title: 'Détail des Écarts par Catégorie de Charges',
        subtitle: '',
        headers: ['Catégorie', 'Budget', 'Réalisé', 'Écart', 'Écart %', 'Statut'],
        rows: categoryData.map(cat => [
          cat.category,
          this.formatCurrency(cat.budgeted),
          this.formatCurrency(cat.actual),
          this.formatCurrency(cat.variance),
          `${cat.variancePct.toFixed(1)}%`,
          cat.favorable ? '✓ Maîtrisé' : '✗ Dépassement'
        ]),
        summary: [],
        footer: []
      } : {
        title: 'Détail des Écarts par Catégorie de Charges',
        subtitle: '',
        headers: ['Information'],
        rows: [['Aucune donnée disponible']],
        footer: []
      };

      // Options d'export
      const defaultOptions: ExportOptions = {
        format: exportOptions?.format || 'pdf',
        title: 'ANALYSE DES ÉCARTS BUDGÉTAIRES',
        subtitle: `${standardName}\nPériode du ${format(new Date(periodStart), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(periodEnd), 'dd/MM/yyyy', { locale: fr })}`,
        orientation: 'portrait',
        fileName: `budget_variance_${periodStart}_${periodEnd}`,
        includeCharts: exportOptions?.includeCharts ?? false
      };

      // Exporter selon le format
      const tables: TableData[] = executiveSummaryTable
        ? [executiveSummaryTable, summaryTable, detailTable]
        : [summaryTable, detailTable];
      switch (defaultOptions.format) {
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv':
          return await reportExportService.exportToCSV(tables, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      console.error('Erreur génération écarts budgétaires:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer l\'analyse des écarts budgétaires');
    }
  }

  /**
   * Générer Tableau de Bord KPI (kpi_dashboard)
   * Vue d'ensemble des indicateurs clés de performance
   */
  async generateKPIDashboard(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { companyId, startDate, endDate } = filters;
      const periodStart = startDate || startOfYear(new Date()).toISOString().split('T')[0];
      const periodEnd = endDate || endOfYear(new Date()).toISOString().split('T')[0];

      if (!companyId) {
        throw new Error('L\'identifiant de l\'entreprise est requis');
      }

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

      // Récupérer toutes les écritures comptables
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
        .gte('entry_date', periodStart)
        .lte('entry_date', periodEnd);

      if (error) {
        console.error('Erreur Supabase KPI dashboard:', error);
        throw error;
      }

      // Aplatir les lignes d'écriture
      interface JournalEntryLine {
        account_number: string;
        debit: number;
        credit: number;
      }

      const journalEntries: JournalEntryLine[] = [];
      if (entries && entries.length > 0) {
        entries.forEach(entry => {
          if (Array.isArray(entry.journal_entry_lines)) {
            entry.journal_entry_lines.forEach((line: { account_number: string; debit_amount: number; credit_amount: number }) => {
              journalEntries.push({
                account_number: line.account_number,
                debit: line.debit_amount || 0,
                credit: line.credit_amount || 0
              });
            });
          }
        });
      }

      // Calculer les KPI financiers
      const revenues = journalEntries.filter(e => e.account_number.startsWith('7')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const expenses = journalEntries.filter(e => e.account_number.startsWith('6')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const netIncome = revenues - expenses;

      // Actifs et Passifs
      const currentAssets = journalEntries.filter(e => ['3', '4', '5'].some(c => e.account_number.startsWith(c))).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const fixedAssets = journalEntries.filter(e => e.account_number.startsWith('2')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const totalAssets = currentAssets + fixedAssets;

      const currentLiabilities = journalEntries.filter(e => e.account_number.startsWith('4') && !e.account_number.startsWith('41')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const longTermDebt = journalEntries.filter(e => e.account_number.startsWith('16')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const equity = journalEntries.filter(e => e.account_number.startsWith('1') && !e.account_number.startsWith('16')).reduce((sum, e) => sum + e.credit - e.debit, 0);

      const inventory = journalEntries.filter(e => e.account_number.startsWith('3')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const receivables = journalEntries.filter(e => e.account_number.startsWith('41')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const payables = journalEntries.filter(e => e.account_number.startsWith('401')).reduce((sum, e) => sum + e.credit - e.debit, 0);

      // KPI Financiers
      const profitMargin = revenues > 0 ? (netIncome / revenues) * 100 : 0;
      const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
      const debtToEquity = equity > 0 ? (currentLiabilities + longTermDebt) / equity : 0;
      const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0;
      const roe = equity > 0 ? (netIncome / equity) * 100 : 0;

      // KPI Opérationnels
      const inventoryTurnover = inventory > 0 ? expenses / inventory : 0;
      const dso = receivables > 0 && revenues > 0 ? (receivables / revenues) * 365 : 0;
      const dpo = payables > 0 && expenses > 0 ? (payables / expenses) * 365 : 0;
      const cashConversionCycle = dso - dpo;

      // Croissance (estimation YoY à +8%)
      const revenueGrowth = 8.0;
      const _profitGrowth = profitMargin > 0 ? 10.0 : -5.0;

      // Interprétations (sans caractères Unicode spéciaux)
      const getStatus = (value: number, good: number, avg: number): string => {
        if (value >= good) return 'Excellent';
        if (value >= avg) return 'Bon';
        return 'A ameliorer';
      };

      // Préparer les tableaux
      const financialKPITable: TableData = journalEntries.length > 0 ? {
        title: 'Tableau de Bord KPI - Indicateurs Clés',
        subtitle: `${standardName}\nPériode: ${new Date(periodStart).toLocaleDateString('fr-FR')} - ${new Date(periodEnd).toLocaleDateString('fr-FR')}`,
        headers: ['Indicateur', 'Valeur', 'Objectif', 'Statut'],
        rows: [
          ['Chiffre d\'affaires', this.formatCurrency(revenues), '', ''],
          ['Resultat net', this.formatCurrency(netIncome), '', profitMargin > 0 ? 'Positif' : 'Negatif'],
          ['Marge nette (%)', `${profitMargin.toFixed(1)}%`, '>= 10%', getStatus(profitMargin, 10, 5)],
          ['Croissance CA (%)', `${revenueGrowth.toFixed(1)}%`, '>= 5%', getStatus(revenueGrowth, 5, 2)],
          ['ROA (%)', `${roa.toFixed(1)}%`, '>= 8%', getStatus(roa, 8, 4)],
          ['ROE (%)', `${roe.toFixed(1)}%`, '>= 15%', getStatus(roe, 15, 8)]
        ],
        summary: [],
        footer: []
      } : {
        title: 'Tableau de Bord KPI - Indicateurs Clés',
        subtitle: `${standardName}\nPériode: ${new Date(periodStart).toLocaleDateString('fr-FR')} - ${new Date(periodEnd).toLocaleDateString('fr-FR')}`,
        headers: ['Information'],
        rows: [['Aucune donnée disponible pour cette période']],
        footer: ['Aucune écriture comptable enregistrée pour la période sélectionnée']
      };

      const liquidityKPITable: TableData = journalEntries.length > 0 ? {
        title: 'Indicateurs de Liquidité et Solvabilité',
        subtitle: '',
        headers: ['Indicateur', 'Valeur', 'Objectif', 'Statut'],
        rows: [
          ['Ratio de liquidite generale', currentRatio.toFixed(2), '>= 1.5', getStatus(currentRatio, 1.5, 1.0)],
          ['Ratio d\'endettement', debtToEquity.toFixed(2), '<= 1.0', debtToEquity <= 1.0 ? 'Bon' : 'Eleve'],
          ['Fonds de roulement', this.formatCurrency(currentAssets - currentLiabilities), '> 0', currentAssets > currentLiabilities ? 'Positif' : 'Negatif'],
          ['Tresorerie nette', this.formatCurrency(currentAssets - currentLiabilities - inventory), '', '']
        ],
        summary: [],
        footer: []
      } : {
        title: 'Indicateurs de Liquidité et Solvabilité',
        subtitle: '',
        headers: ['Information'],
        rows: [['Aucune donnée disponible']],
        footer: []
      };

      const operationalKPITable: TableData = journalEntries.length > 0 ? {
        title: 'Indicateurs Opérationnels',
        subtitle: '',
        headers: ['Indicateur', 'Valeur', 'Objectif', 'Statut'],
        rows: [
          ['Rotation des stocks (fois/an)', inventoryTurnover.toFixed(1), '>= 6', getStatus(inventoryTurnover, 6, 4)],
          ['Delai clients (DSO jours)', dso.toFixed(0), '<= 45', dso <= 45 ? 'Bon' : 'Long'],
          ['Delai fournisseurs (DPO jours)', dpo.toFixed(0), '>= 30', dpo >= 30 ? 'Bon' : 'Court'],
          ['Cycle de conversion (jours)', cashConversionCycle.toFixed(0), '<= 30', cashConversionCycle <= 30 ? 'Bon' : 'A surveiller']
        ],
        summary: [],
        footer: []
      } : {
        title: 'Indicateurs Opérationnels',
        subtitle: '',
        headers: ['Information'],
        rows: [['Aucune donnée disponible']],
        footer: []
      };

      const alertsTable: TableData = {
        title: 'Alertes et Recommandations',
        subtitle: '',
        headers: ['Type', 'Message', 'Priorité'],
        rows: [],
        summary: [],
        footer: []
      };

      // Générer les alertes
      if (profitMargin < 5) {
        alertsTable.rows.push(['⚠ Rentabilité', 'Marge nette faible - Analyser les coûts', 'Haute']);
      }
      if (currentRatio < 1.0) {
        alertsTable.rows.push(['⚠ Liquidité', 'Ratio de liquidité critique - Risque de trésorerie', 'Critique']);
      }
      if (dso > 60) {
        alertsTable.rows.push(['⚠ Créances', 'Délai clients élevé - Améliorer le recouvrement', 'Moyenne']);
      }
      if (debtToEquity > 2.0) {
        alertsTable.rows.push(['⚠ Endettement', 'Ratio d\'endettement élevé - Surveiller la dette', 'Haute']);
      }

      if (alertsTable.rows.length === 0) {
        alertsTable.rows.push(['✓ OK', 'Tous les indicateurs sont dans les objectifs', 'Aucune']);
      }

      // Générer l'analyse IA des KPI
      let aiAnalysis = null;
      if (journalEntries.length > 0) {
        try {
          const kpisForAI: AIFinancialKPIs = {
            revenues,
            expenses,
            netIncome,
            profitMargin,
            currentRatio,
            debtToEquity,
            roa,
            roe,
            revenueGrowth,
            inventoryTurnover,
            dso,
            dpo,
            cashConversionCycle,
            currentAssets,
            currentLiabilities
          };

          aiAnalysis = await aiAnalysisService.analyzeFinancialKPIs(
            kpisForAI,
            format(new Date(periodStart), 'dd/MM/yyyy', { locale: fr }),
            format(new Date(periodEnd), 'dd/MM/yyyy', { locale: fr })
          );
        } catch (error) {
          console.error('Erreur lors de l\'analyse IA:', error);
        }
      }

      // Créer le tableau de résumé exécutif si l'analyse IA est disponible
      const executiveSummaryTable: TableData | null = aiAnalysis ? {
        title: 'RÉSUMÉ EXÉCUTIF - Analyse IA',
        subtitle: 'Synthèse intelligente de la situation financière',
        headers: ['Section', 'Analyse'],
        rows: [
          ['Vue d\'ensemble', aiAnalysis.executiveSummary],
          ['Santé financière', aiAnalysis.financialHealth],
          ['Points forts', aiAnalysis.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')],
          ['Points d\'attention', aiAnalysis.concernPoints.map((c, i) => `${i + 1}. ${c}`).join('\n')],
          ['Recommandations', aiAnalysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')],
          ['Niveau de risque', `${aiAnalysis.riskLevel} - Evaluation globale basée sur les indicateurs clés`]
        ],
        summary: [],
        footer: [`Analyse générée par IA le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`]
      } : null;

      // Générer les graphiques pour le PDF
      const charts: string[] = [];

      if (journalEntries.length > 0) {
        try {
          // Graphique 1: Évolution des KPI (Barres)
          const kpiChart = await chartImageService.generateBarChart({
            labels: ['Marge nette', 'Croissance CA', 'ROA', 'ROE'],
            datasets: [{
              label: 'Valeur (%)',
              data: [profitMargin, revenueGrowth, roa, roe],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
              borderColor: ['#2563eb', '#059669', '#d97706', '#7c3aed'],
              borderWidth: 1
            }]
          });
          charts.push(kpiChart);

          // Graphique 2: Liquidité et Solvabilité (Barres)
          const liquidityChart = await chartImageService.generateBarChart({
            labels: ['Ratio liquidite', 'Ratio endettement', 'Fonds de roulement (K€)'],
            datasets: [{
              label: 'Valeur',
              data: [currentRatio, debtToEquity, (currentAssets - currentLiabilities) / 1000],
              backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
              borderColor: ['#059669', '#dc2626', '#2563eb'],
              borderWidth: 1
            }]
          });
          charts.push(liquidityChart);

          // Graphique 3: Indicateurs Opérationnels (Barres)
          const operationalChart = await chartImageService.generateBarChart({
            labels: ['Rotation stocks', 'Delai clients', 'Delai fournisseurs', 'Cycle conversion'],
            datasets: [{
              label: 'Valeur (jours/fois)',
              data: [inventoryTurnover, dso, dpo, cashConversionCycle],
              backgroundColor: ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6'],
              borderColor: ['#7c3aed', '#d97706', '#059669', '#2563eb'],
              borderWidth: 1
            }]
          });
          charts.push(operationalChart);
        } catch (error) {
          console.error('Erreur lors de la génération des graphiques:', error);
        }
      }

      // Options d'export
      const defaultOptions: ExportOptions = {
        format: exportOptions?.format || 'pdf',
        title: 'TABLEAU DE BORD KPI',
        subtitle: `${standardName}\nPeriode du ${format(new Date(periodStart), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(periodEnd), 'dd/MM/yyyy', { locale: fr })}`,
        orientation: 'portrait',
        fileName: `kpi_dashboard_${periodStart}_${periodEnd}`,
        includeCharts: exportOptions?.includeCharts ?? true,
        charts: charts.length > 0 ? charts : undefined
      };

      // Exporter selon le format
      // Inclure le résumé exécutif IA en première position si disponible
      const tables: TableData[] = executiveSummaryTable
        ? [executiveSummaryTable, financialKPITable, liquidityKPITable, operationalKPITable, alertsTable]
        : [financialKPITable, liquidityKPITable, operationalKPITable, alertsTable];
      switch (defaultOptions.format) {
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv':
          return await reportExportService.exportToCSV(tables, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      console.error('Erreur génération tableau de bord KPI:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le tableau de bord KPI');
    }
  }

  /**
   * Générer Synthèse Fiscale (tax_summary)
   * Calendrier des obligations fiscales et récapitulatif
   */
  async generateTaxSummary(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { companyId, startDate, endDate } = filters;
      const periodStart = startDate || startOfYear(new Date()).toISOString().split('T')[0];
      const periodEnd = endDate || endOfYear(new Date()).toISOString().split('T')[0];

      if (!companyId) {
        throw new Error('L\'identifiant de l\'entreprise est requis');
      }

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

      // Récupérer les écritures comptables pour calculer les impôts
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
        .gte('entry_date', periodStart)
        .lte('entry_date', periodEnd);

      if (error) {
        console.error('Erreur Supabase tax summary:', error);
        throw error;
      }

      // Aplatir les lignes d'écriture
      interface JournalEntryLine {
        account_number: string;
        debit: number;
        credit: number;
      }

      const journalEntries: JournalEntryLine[] = [];
      if (entries && entries.length > 0) {
        entries.forEach(entry => {
          if (Array.isArray(entry.journal_entry_lines)) {
            entry.journal_entry_lines.forEach((line: { account_number: string; debit_amount: number; credit_amount: number }) => {
              journalEntries.push({
                account_number: line.account_number,
                debit: line.debit_amount || 0,
                credit: line.credit_amount || 0
              });
            });
          }
        });
      }

      // Calculer les bases fiscales
      const revenues = journalEntries.filter(e => e.account_number.startsWith('7')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const expenses = journalEntries.filter(e => e.account_number.startsWith('6')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const netIncome = revenues - expenses;

      // TVA
      const vatCollected = journalEntries.filter(e => e.account_number.startsWith('4457')).reduce((sum, e) => sum + e.credit - e.debit, 0);
      const vatDeductible = journalEntries.filter(e => e.account_number.startsWith('4456')).reduce((sum, e) => sum + e.debit - e.credit, 0);
      const vatDue = vatCollected - vatDeductible;

      // Impôts et taxes (compte 63)
      const taxesPaid = journalEntries.filter(e => e.account_number.startsWith('63')).reduce((sum, e) => sum + e.debit - e.credit, 0);

      // Impôt sur les sociétés (IS) - estimation 25% du bénéfice
      const corporateTaxBase = Math.max(0, netIncome);
      const corporateTax = corporateTaxBase * 0.25;

      // Cotisations sociales (compte 64)
      const socialContributions = journalEntries.filter(e => e.account_number.startsWith('64')).reduce((sum, e) => sum + e.debit - e.credit, 0);

      // CFE/CVAE (contribution économique territoriale)
      const cet = journalEntries.filter(e => e.account_number.startsWith('6311')).reduce((sum, e) => sum + e.debit - e.credit, 0);

      // Préparer le tableau de synthèse fiscale
      const summaryTable: TableData = journalEntries.length > 0 ? {
        title: 'Synthèse Fiscale',
        subtitle: `${standardName}\nPériode: ${new Date(periodStart).toLocaleDateString('fr-FR')} - ${new Date(periodEnd).toLocaleDateString('fr-FR')}`,
        headers: ['Rubrique', 'Base imposable', 'Montant dû', 'Statut'],
        rows: [
          ['TVA nette', this.formatCurrency(vatCollected), this.formatCurrency(vatDue), vatDue > 0 ? '⚠ À payer' : '✓ Crédit'],
          ['Impôt sur les sociétés (IS)', this.formatCurrency(corporateTaxBase), this.formatCurrency(corporateTax), corporateTax > 0 ? '⚠ À provisionner' : '✓ Aucun'],
          ['Cotisations sociales', '-', this.formatCurrency(socialContributions), socialContributions > 0 ? '✓ Payé' : ''],
          ['CET (CFE/CVAE)', '-', this.formatCurrency(cet), cet > 0 ? '✓ Payé' : '⚠ À vérifier'],
          ['Autres taxes', '-', this.formatCurrency(taxesPaid), taxesPaid > 0 ? '✓ Payé' : '']
        ],
        summary: [
          ['TOTAL CHARGE FISCALE', '', this.formatCurrency(vatDue + corporateTax + socialContributions + cet + taxesPaid), '']
        ],
        footer: [
          `Taux d'imposition effectif: ${corporateTaxBase > 0 ? ((corporateTax / corporateTaxBase) * 100).toFixed(1) : '0.0'}%`,
          `Pression fiscale totale: ${revenues > 0 ? (((vatDue + corporateTax + socialContributions + cet + taxesPaid) / revenues) * 100).toFixed(1) : '0.0'}%`
        ]
      } : {
        title: 'Synthèse Fiscale',
        subtitle: `${standardName}\nPériode: ${new Date(periodStart).toLocaleDateString('fr-FR')} - ${new Date(periodEnd).toLocaleDateString('fr-FR')}`,
        headers: ['Information'],
        rows: [['Aucune donnée disponible pour cette période']],
        footer: ['Aucune écriture comptable enregistrée pour la période sélectionnée']
      };

      // Calendrier des obligations fiscales pour l'année en cours
      const currentYear = new Date(periodEnd).getFullYear();
      const obligationsTable: TableData = {
        title: 'Calendrier des Obligations Fiscales',
        subtitle: `Année ${currentYear}`,
        headers: ['Échéance', 'Obligation', 'Fréquence', 'Statut'],
        rows: [
          ['15/01', 'Acompte IS (Q4)', 'Trimestriel', '✓'],
          ['31/01', 'DAS2 - Honoraires', 'Annuel', '✓'],
          ['31/03', 'Liasse fiscale (2065)', 'Annuel', '⚠ À venir'],
          ['15/04', 'Acompte IS (Q1)', 'Trimestriel', '⚠ À venir'],
          ['30/04', 'DADS-U / DSN', 'Annuel', '⚠ À venir'],
          ['15/05', 'Solde IS N-1', 'Annuel', '⚠ À venir'],
          ['15/07', 'Acompte IS (Q2)', 'Trimestriel', '⚠ À venir'],
          ['15/10', 'Acompte IS (Q3)', 'Trimestriel', '⚠ À venir'],
          ['15/12', 'CFE', 'Annuel', '⚠ À venir'],
          ['31/12', 'Clôture exercice', 'Annuel', '⚠ À venir']
        ],
        summary: [],
        footer: [
          'Note: Les dates peuvent varier selon le régime fiscal de l\'entreprise',
          'TVA: Déclaration mensuelle (CA3) ou trimestrielle selon le régime'
        ]
      };

      // Tableau des déclarations TVA (mensuel)
      const vatTable: TableData = {
        title: 'Récapitulatif TVA',
        subtitle: '',
        headers: ['Période', 'TVA collectée', 'TVA déductible', 'TVA nette', 'Date limite'],
        rows: [],
        summary: [],
        footer: []
      };

      // Générer les lignes pour chaque mois de l'année
      for (let month = 1; month <= 12; month++) {
        const monthDate = new Date(currentYear, month - 1, 1);
        const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const deadline = new Date(currentYear, month, 19); // 19 du mois suivant

        // Calcul simplifié par mois (devrait être basé sur les écritures mensuelles)
        const monthlyVatCollected = vatCollected / 12;
        const monthlyVatDeductible = vatDeductible / 12;
        const monthlyVatDue = monthlyVatCollected - monthlyVatDeductible;

        const isPast = deadline < new Date();
        const status = isPast ? '✓' : '⚠';

        vatTable.rows.push([
          monthName,
          this.formatCurrency(monthlyVatCollected),
          this.formatCurrency(monthlyVatDeductible),
          this.formatCurrency(monthlyVatDue),
          `${status} ${deadline.toLocaleDateString('fr-FR')}`
        ]);
      }

      vatTable.summary = [
        ['TOTAL ANNUEL', this.formatCurrency(vatCollected), this.formatCurrency(vatDeductible), this.formatCurrency(vatDue), '']
      ];

      // Options d'export
      const defaultOptions: ExportOptions = {
        format: exportOptions?.format || 'pdf',
        title: 'SYNTHÈSE FISCALE',
        subtitle: `${standardName}\nPériode du ${format(new Date(periodStart), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(periodEnd), 'dd/MM/yyyy', { locale: fr })}`,
        orientation: 'portrait',
        fileName: `tax_summary_${periodStart}_${periodEnd}`,
        includeCharts: exportOptions?.includeCharts ?? false
      };

      // Exporter selon le format
      const tables: TableData[] = [summaryTable, obligationsTable, vatTable];
      switch (defaultOptions.format) {
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv':
          return await reportExportService.exportToCSV(tables, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      console.error('Erreur génération synthèse fiscale:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer la synthèse fiscale');
    }
  }

  /**
   * Générer Valorisation des Stocks (inventory_valuation)
   * Analyse de la valorisation et rotation des stocks
   */
  async generateInventoryValuation(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { companyId, endDate } = filters;
      const asOfDate = endDate || new Date().toISOString().split('T')[0];

      if (!companyId) {
        throw new Error('L\'identifiant de l\'entreprise est requis');
      }

      // 🌍 DÉTECTION DU STANDARD COMPTABLE
      const standard = await AccountingStandardAdapter.getCompanyStandard(companyId);
      const standardName = AccountingStandardAdapter.getStandardName(standard);

      // Récupérer les écritures de stocks (compte 3)
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_date,
          journal_entry_lines (
            account_number,
            account_name,
            auxiliary_account,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .lte('entry_date', asOfDate);

      if (error) {
        console.error('Erreur Supabase inventory valuation:', error);
        throw error;
      }

      // Aplatir les lignes d'écriture
      interface JournalEntryLine {
        account_number: string;
        account_name: string;
        auxiliary_account: string | null;
        debit: number;
        credit: number;
        date: string;
      }

      const journalEntries: JournalEntryLine[] = [];
      if (entries && entries.length > 0) {
        entries.forEach(entry => {
          if (Array.isArray(entry.journal_entry_lines)) {
            entry.journal_entry_lines.forEach((line: { account_number: string; account_name: string; auxiliary_account: string | null; debit_amount: number; credit_amount: number }) => {
              journalEntries.push({
                account_number: line.account_number,
                account_name: line.account_name,
                auxiliary_account: line.auxiliary_account,
                debit: line.debit_amount || 0,
                credit: line.credit_amount || 0,
                date: entry.entry_date
              });
            });
          }
        });
      }

      // Filtrer les comptes de stocks (classe 3)
      const inventoryEntries = journalEntries.filter(e => e.account_number.startsWith('3'));

      // Grouper par catégorie de stock
      const inventoryCategories = [
        { code: '31', name: 'Matières premières' },
        { code: '32', name: 'Autres approvisionnements' },
        { code: '33', name: 'En-cours de production' },
        { code: '34', name: 'Produits intermédiaires' },
        { code: '35', name: 'Produits finis' },
        { code: '36', name: 'Produits en cours' },
        { code: '37', name: 'Marchandises' }
      ];

      const inventoryData: {
        category: string;
        value: number;
        percentage: number;
        turnoverRate: number;
        coverage: number;
        status: string;
      }[] = [];

      let totalInventoryValue = 0;

      // Calculer les valeurs par catégorie
      inventoryCategories.forEach(cat => {
        const categoryEntries = inventoryEntries.filter(e => e.account_number.startsWith(cat.code));
        const value = categoryEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);

        if (value > 0) {
          totalInventoryValue += value;
        }
      });

      // Calculer les achats annuels (compte 60)
      const purchases = journalEntries
        .filter(e => e.account_number.startsWith('60'))
        .reduce((sum, e) => sum + e.debit - e.credit, 0);

      // Calculer les pourcentages et ratios
      inventoryCategories.forEach(cat => {
        const categoryEntries = inventoryEntries.filter(e => e.account_number.startsWith(cat.code));
        const value = categoryEntries.reduce((sum, e) => sum + e.debit - e.credit, 0);

        if (value > 0) {
          const percentage = totalInventoryValue > 0 ? (value / totalInventoryValue) * 100 : 0;

          // Rotation des stocks = Achats / Stock moyen
          const turnoverRate = value > 0 ? purchases / value : 0;

          // Couverture en jours = (Stock / Achats) * 365
          const coverage = purchases > 0 ? (value / purchases) * 365 : 0;

          // Statut selon la couverture
          let status = '';
          if (coverage < 30) status = '✓ Normal';
          else if (coverage < 90) status = '~ À surveiller';
          else status = '⚠ Surstockage';

          inventoryData.push({
            category: cat.name,
            value,
            percentage,
            turnoverRate,
            coverage,
            status
          });
        }
      });

      // Trier par valeur décroissante
      inventoryData.sort((a, b) => b.value - a.value);

      // Calculer les indicateurs globaux
      const avgTurnoverRate = inventoryData.length > 0
        ? inventoryData.reduce((sum, item) => sum + item.turnoverRate, 0) / inventoryData.length
        : 0;

      const avgCoverage = inventoryData.length > 0
        ? inventoryData.reduce((sum, item) => sum + item.coverage, 0) / inventoryData.length
        : 0;

      // Récupérer les revenus pour le calcul du ratio stock/ventes
      const revenues = journalEntries
        .filter(e => e.account_number.startsWith('7'))
        .reduce((sum, e) => sum + e.credit - e.debit, 0);

      // Analyse IA de la valorisation des stocks
      let aiAnalysis: AIAnalysisResult | null = null;
      try {
        // Calculer le stock obsolète (plus de 365 jours de couverture)
        const obsoleteInventory = inventoryData
          .filter(item => item.coverage > 365)
          .reduce((sum, item) => sum + item.value, 0);

        const inventoryAnalysisData: InventoryData = {
          totalInventory: totalInventoryValue,
          rawMaterials: inventoryData.find(i => i.category === 'Matières premières')?.value || 0,
          workInProgress: inventoryData.find(i => i.category === 'En-cours de production')?.value || inventoryData.find(i => i.category === 'Produits en cours')?.value || 0,
          finishedGoods: inventoryData.find(i => i.category === 'Produits finis')?.value || inventoryData.find(i => i.category === 'Marchandises')?.value || 0,
          inventoryTurnover: avgTurnoverRate,
          daysInventoryOutstanding: avgCoverage,
          obsoleteInventory: obsoleteInventory,
          inventoryToSales: totalInventoryValue > 0 && revenues > 0 ? totalInventoryValue / revenues : 0
        };

        aiAnalysis = await aiReportAnalysisService.analyzeInventory(
          inventoryAnalysisData,
          format(new Date(asOfDate), 'dd/MM/yyyy', { locale: fr }),
          format(new Date(asOfDate), 'dd/MM/yyyy', { locale: fr })
        );
      } catch (error) {
        console.error('Erreur lors de l\'analyse IA de la valorisation des stocks:', error);
      }

      const executiveSummaryTable: TableData | null = aiAnalysis ? {
        title: 'RÉSUMÉ EXÉCUTIF - Analyse IA',
        subtitle: 'Synthèse intelligente de la valorisation des stocks',
        headers: ['Section', 'Analyse'],
        rows: [
          ['Vue d\'ensemble', aiAnalysis.executiveSummary],
          ['Santé financière', aiAnalysis.financialHealth],
          ['Points forts', aiAnalysis.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join('\n')],
          ['Points d\'attention', aiAnalysis.concernPoints.map((c, i) => `${i + 1}. ${c}`).join('\n')],
          ['Recommandations', aiAnalysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')],
          ['Niveau de risque', `${aiAnalysis.riskLevel} - Evaluation basée sur la rotation et l'obsolescence`]
        ],
        summary: [],
        footer: [`Analyse générée par IA le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`]
      } : null;

      // Préparer le tableau de valorisation
      const valuationTable: TableData = inventoryData.length > 0 ? {
        title: 'Valorisation des Stocks',
        subtitle: `${standardName}\nAu ${new Date(asOfDate).toLocaleDateString('fr-FR')}`,
        headers: ['Catégorie', 'Valeur', '% Total', 'Rotation (x/an)', 'Couverture (j)', 'Statut'],
        rows: inventoryData.map(item => [
          item.category,
          this.formatCurrency(item.value),
          `${item.percentage.toFixed(1)}%`,
          item.turnoverRate.toFixed(1),
          item.coverage.toFixed(0),
          item.status
        ]),
        summary: [
          ['TOTAL STOCKS', this.formatCurrency(totalInventoryValue), '100.0%', avgTurnoverRate.toFixed(1), avgCoverage.toFixed(0), '']
        ],
        footer: [
          `Nombre de catégories: ${inventoryData.length}`,
          `Rotation moyenne: ${avgTurnoverRate.toFixed(1)} fois/an`,
          `Couverture moyenne: ${avgCoverage.toFixed(0)} jours`
        ]
      } : {
        title: 'Valorisation des Stocks',
        subtitle: `${standardName}\nAu ${new Date(asOfDate).toLocaleDateString('fr-FR')}`,
        headers: ['Information'],
        rows: [['Aucune donnée disponible pour cette période']],
        footer: ['Aucun mouvement de stock enregistré pour la période sélectionnée']
      };

      // Tableau des alertes stocks
      const alertsTable: TableData = {
        title: 'Alertes et Recommandations',
        subtitle: '',
        headers: ['Type', 'Message', 'Impact', 'Action'],
        rows: [],
        summary: [],
        footer: []
      };

      // Générer les alertes
      inventoryData.forEach(item => {
        if (item.coverage > 90) {
          alertsTable.rows.push([
            '⚠ Surstockage',
            `${item.category}: ${item.coverage.toFixed(0)} jours de couverture`,
            'Immobilisation trésorerie',
            'Réduire les commandes'
          ]);
        }
        if (item.turnoverRate < 2) {
          alertsTable.rows.push([
            '⚠ Rotation lente',
            `${item.category}: ${item.turnoverRate.toFixed(1)} rotations/an`,
            'Stock dormant',
            'Analyser la demande'
          ]);
        }
      });

      // Alerte stock obsolète (> 180 jours)
      if (avgCoverage > 180) {
        alertsTable.rows.push([
          '⚠ Stock obsolète',
          'Couverture moyenne > 6 mois',
          'Risque de dépréciation',
          'Audit des stocks anciens'
        ]);
      }

      if (alertsTable.rows.length === 0) {
        alertsTable.rows.push([
          '✓ OK',
          'Gestion des stocks optimale',
          'Aucun',
          'Maintenir les pratiques'
        ]);
      }

      // Tableau des mouvements récents (TOP 10)
      const recentMovements: TableData = {
        title: 'Analyse de la Rotation',
        subtitle: 'Indicateurs clés de performance',
        headers: ['Indicateur', 'Valeur', 'Objectif', 'Statut'],
        rows: [
          [
            'Rotation globale des stocks',
            `${avgTurnoverRate.toFixed(1)} fois/an`,
            '≥ 6 fois/an',
            avgTurnoverRate >= 6 ? '✓ Bon' : avgTurnoverRate >= 4 ? '~ Moyen' : '✗ Lent'
          ],
          [
            'Couverture moyenne',
            `${avgCoverage.toFixed(0)} jours`,
            '≤ 60 jours',
            avgCoverage <= 60 ? '✓ Bon' : avgCoverage <= 90 ? '~ Acceptable' : '✗ Élevé'
          ],
          [
            'Valeur totale des stocks',
            this.formatCurrency(totalInventoryValue),
            '',
            ''
          ],
          [
            'Ratio stock/achats annuels',
            `${purchases > 0 ? ((totalInventoryValue / purchases) * 100).toFixed(1) : '0.0'}%`,
            '≤ 25%',
            purchases > 0 && (totalInventoryValue / purchases) <= 0.25 ? '✓ Bon' : '~ À surveiller'
          ]
        ],
        summary: [],
        footer: [
          'Objectif: Minimiser les stocks dormants tout en évitant les ruptures',
          'Indicateur clé: Rotation ≥ 6 fois/an et Couverture ≤ 60 jours'
        ]
      };

      // Options d'export avec orientation paysage
      const defaultOptions: ExportOptions = {
        format: exportOptions?.format || 'pdf',
        title: 'VALORISATION DES STOCKS',
        subtitle: `${standardName}\nAu ${format(new Date(asOfDate), 'dd/MM/yyyy', { locale: fr })}`,
        orientation: 'landscape',
        fileName: `inventory_valuation_${asOfDate}`,
        includeCharts: exportOptions?.includeCharts ?? false
      };

      // Exporter selon le format
      const tables: TableData[] = executiveSummaryTable
        ? [executiveSummaryTable, valuationTable, recentMovements, alertsTable]
        : [valuationTable, recentMovements, alertsTable];
      switch (defaultOptions.format) {
        case 'excel':
          return await reportExportService.exportToExcel(tables, defaultOptions);
        case 'csv':
          return await reportExportService.exportToCSV(tables, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      console.error('Erreur génération valorisation stocks:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer la valorisation des stocks');
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

  /**
   * Calculer les amortissements cumulés pour les immobilisations
   * Les comptes 28x contiennent les amortissements des comptes 2x
   * Ex: 281 = amortissements des immobilisations incorporelles (20)
   *     2182 = amortissements du matériel de transport (218)
   */
  private async calculateDepreciation(
    companyId: string,
    endDate: string
  ): Promise<Map<string, number>> {
    const depreciationMap = new Map<string, number>();

    try {
      // Récupérer toutes les écritures sur comptes 28x (amortissements)
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          journal_entry_lines (
            account_number,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'posted')
        .lte('entry_date', endDate);

      if (error) {
        console.error('Error fetching depreciation data:', error);
        return depreciationMap;
      }

      if (!entries) return depreciationMap;

      // Agréger les amortissements par compte
      entries.forEach((entry: any) => {
        entry.journal_entry_lines?.forEach((line: any) => {
          const accountNumber = line.account_number;

          // On ne traite que les comptes 28x (amortissements)
          if (accountNumber && accountNumber.startsWith('28')) {
            const currentValue = depreciationMap.get(accountNumber) || 0;
            // Les amortissements sont au crédit (augmentent le compte 28x)
            const depreciation = (line.credit_amount || 0) - (line.debit_amount || 0);
            depreciationMap.set(accountNumber, currentValue + depreciation);
          }
        });
      });

      return depreciationMap;
    } catch (error) {
      console.error('Error calculating depreciation:', error);
      return depreciationMap;
    }
  }

  /**
   * Trouver le montant d'amortissement correspondant à un compte d'immobilisation
   * Ex: Compte 218 (matériel transport) → chercher 2818
   *     Compte 2154 (matériel industriel) → chercher 28154
   */
  private getDepreciationForAsset(
    assetAccount: string,
    depreciationMap: Map<string, number>
  ): number {
    // Construction du numéro de compte d'amortissement
    // Règle: 28 + reste du numéro du compte d'actif (sans le 2 initial)
    const depreciationAccount = '28' + assetAccount.substring(1);

    // Chercher d'abord le compte exact
    let depreciation = depreciationMap.get(depreciationAccount) || 0;

    // Si pas trouvé, chercher les comptes commençant par ce préfixe
    // (pour gérer les sous-comptes)
    if (depreciation === 0) {
      depreciationMap.forEach((value, key) => {
        if (key.startsWith(depreciationAccount)) {
          depreciation += value;
        }
      });
    }

    return depreciation;
  }

  /**
   * Calcule les Soldes Intermédiaires de Gestion (SIG)
   * Conformité: PCG Article 532-6 à 532-8
   * 8 soldes obligatoires en comptabilité française
   */
  private async calculateSIG(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    margeCommerciale: number;
    productionExercice: number;
    valeurAjoutee: number;
    ebe: number;
    resultatExploitation: number;
    resultatCourant: number;
    resultatExceptionnel: number;
    resultatNet: number;
  }> {
    try {
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          journal_entry_lines (
            account_number,
            debit_amount,
            credit_amount
          )
        `)
        .eq('company_id', companyId)
        .eq('status', 'posted')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (error) throw error;

      // Agréger les montants par catégorie de comptes
      let ventesMarhandises = 0;      // Compte 707
      let achatsMarchandises = 0;     // Compte 607
      let production = 0;              // Comptes 70x (sauf 707)
      let consommationsExterne = 0;   // Comptes 60-62 (sauf 607)
      let impotsTaxes = 0;             // Compte 63
      let chargesPersonnel = 0;        // Compte 64
      let subventionsExploitation = 0; // Compte 74
      let autresProduits = 0;          // Comptes 75, 781, 791
      let autresCharges = 0;           // Comptes 65, 681, 691
      let dotationsAmortissements = 0; // Comptes 681
      let prodFinanciers = 0;          // Compte 76
      let chargesFinancieres = 0;      // Compte 66
      let prodExceptionnels = 0;       // Compte 77
      let chargesExceptionnelles = 0;  // Compte 67
      let participationSalaries = 0;   // Compte 691
      let impotsSocietes = 0;          // Compte 695

      entries?.forEach((entry: any) => {
        entry.journal_entry_lines?.forEach((line: any) => {
          const account = line.account_number;
          const debit = line.debit_amount || 0;
          const credit = line.credit_amount || 0;

          // Ventes de marchandises (707)
          if (account.startsWith('707')) {
            ventesMarhandises += credit - debit;
          }
          // Achats de marchandises (607)
          else if (account.startsWith('607')) {
            achatsMarchandises += debit - credit;
          }
          // Production (70x sauf 707)
          else if (account.startsWith('70') && !account.startsWith('707')) {
            production += credit - debit;
          }
          // Consommations externes (60-62 sauf 607)
          else if ((account.startsWith('60') || account.startsWith('61') || account.startsWith('62'))
                   && !account.startsWith('607')) {
            consommationsExterne += debit - credit;
          }
          // Impôts et taxes (63)
          else if (account.startsWith('63')) {
            impotsTaxes += debit - credit;
          }
          // Charges de personnel (64)
          else if (account.startsWith('64')) {
            chargesPersonnel += debit - credit;
          }
          // Subventions d'exploitation (74)
          else if (account.startsWith('74')) {
            subventionsExploitation += credit - debit;
          }
          // Autres produits (75, 781, 791)
          else if (account.startsWith('75') || account.startsWith('781') || account.startsWith('791')) {
            autresProduits += credit - debit;
          }
          // Autres charges (65, 681, 691)
          else if (account.startsWith('65')) {
            autresCharges += debit - credit;
          }
          // Dotations amortissements (681)
          else if (account.startsWith('681')) {
            dotationsAmortissements += debit - credit;
          }
          // Produits financiers (76, 786, 796)
          else if (account.startsWith('76') || account.startsWith('786') || account.startsWith('796')) {
            prodFinanciers += credit - debit;
          }
          // Charges financières (66, 686)
          else if (account.startsWith('66') || account.startsWith('686')) {
            chargesFinancieres += debit - credit;
          }
          // Produits exceptionnels (77, 787, 797)
          else if (account.startsWith('77') || account.startsWith('787') || account.startsWith('797')) {
            prodExceptionnels += credit - debit;
          }
          // Charges exceptionnelles (67, 687)
          else if (account.startsWith('67') || account.startsWith('687')) {
            chargesExceptionnelles += debit - credit;
          }
          // Participation des salariés (691)
          else if (account.startsWith('691')) {
            participationSalaries += debit - credit;
          }
          // Impôts sur les sociétés (695)
          else if (account.startsWith('695')) {
            impotsSocietes += debit - credit;
          }
        });
      });

      // Calcul des 8 SIG en cascade
      const margeCommerciale = ventesMarhandises - achatsMarchandises;
      const productionExercice = production;
      const valeurAjoutee = margeCommerciale + productionExercice - consommationsExterne;
      const ebe = valeurAjoutee + subventionsExploitation - impotsTaxes - chargesPersonnel;
      const resultatExploitation = ebe + autresProduits - autresCharges - dotationsAmortissements;
      const resultatCourant = resultatExploitation + prodFinanciers - chargesFinancieres;
      const resultatExceptionnel = prodExceptionnels - chargesExceptionnelles;
      const resultatNet = resultatCourant + resultatExceptionnel - participationSalaries - impotsSocietes;

      return {
        margeCommerciale,
        productionExercice,
        valeurAjoutee,
        ebe,
        resultatExploitation,
        resultatCourant,
        resultatExceptionnel,
        resultatNet
      };
    } catch (error) {
      console.error('Error calculating SIG:', error);
      return {
        margeCommerciale: 0,
        productionExercice: 0,
        valeurAjoutee: 0,
        ebe: 0,
        resultatExploitation: 0,
        resultatCourant: 0,
        resultatExceptionnel: 0,
        resultatNet: 0
      };
    }
  }

  /**
   * Calcule les données comptables pour une période donnée (utilisé pour N-1)
   * Retourne les balances de comptes agrégés
   */
  private async calculatePeriodData(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    actifImmobilise: any[];
    actifCirculant: any[];
    capitauxPropres: any[];
    provisions: any[];
    dettes: any[];
    charges: any[];
    produits: any[];
    depreciationMap: Map<string, number>;
  }> {
    try {
      const { data: entries } = await supabase
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
        .eq('status', 'posted')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

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

      const accountBalances = this.calculateAccountBalances(journalEntries);
      const depreciationMap = await this.calculateDepreciation(companyId, endDate);

      const actifAccounts = accountBalances.filter(acc => acc.type === 'actif');
      const passifAccounts = accountBalances.filter(acc => acc.type === 'passif');

      const actifImmobilise = actifAccounts.filter(acc => acc.compte.startsWith('2'));
      const actifCirculant = actifAccounts.filter(acc =>
        acc.compte.startsWith('3') ||
        (acc.compte.startsWith('4') && !acc.compte.startsWith('44')) ||
        acc.compte.startsWith('5')
      );

      const capitauxPropres = passifAccounts.filter(acc =>
        acc.compte.startsWith('1') &&
        !acc.compte.startsWith('16') &&
        !acc.compte.startsWith('17') &&
        !acc.compte.startsWith('18')
      );
      const provisions = passifAccounts.filter(acc =>
        acc.compte.startsWith('15') || acc.compte.startsWith('16')
      );
      const dettes = passifAccounts.filter(acc =>
        acc.compte.startsWith('17') ||
        acc.compte.startsWith('18') ||
        (acc.compte.startsWith('4') && acc.type === 'passif')
      );

      const charges = accountBalances.filter(acc => acc.type === 'charge');
      const produits = accountBalances.filter(acc => acc.type === 'produit');

      return {
        actifImmobilise,
        actifCirculant,
        capitauxPropres,
        provisions,
        dettes,
        charges,
        produits,
        depreciationMap
      };
    } catch (error) {
      console.error('Error calculating period data:', error);
      return {
        actifImmobilise: [],
        actifCirculant: [],
        capitauxPropres: [],
        provisions: [],
        dettes: [],
        charges: [],
        produits: [],
        depreciationMap: new Map()
      };
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Génération du Rapport d'Analyse de Gestion (Ratios Financiers)
   * Calcule et présente 15+ ratios financiers avec interprétations
   */
  async generateManagementAnalysis(filters: ReportFilters, exportOptions?: ExportOptions): Promise<string> {
    try {
      const { startDate, endDate, companyId } = filters;

      if (!companyId) {
        throw new Error('Company ID is required');
      }

      const startDateStr = startDate || startOfYear(new Date()).toISOString().split('T')[0];
      const endDateStr = endDate || endOfYear(new Date()).toISOString().split('T')[0];

      // Calculer tous les ratios financiers
      const ratios = await financialRatiosService.calculateRatios(companyId, startDateStr, endDateStr);

      // Table 1: Ratios de Liquidité
      const liquidityTable: TableData = {
        title: 'RATIOS DE LIQUIDITÉ',
        headers: ['Indicateur', 'Valeur', 'Statut', 'Benchmark'],
        rows: [
          [
            'Ratio de liquidité générale',
            financialRatiosService.formatRatio(ratios.currentRatio, 'ratio'),
            this.getStatusBadge(financialRatiosService.evaluateRatio('currentRatio', ratios.currentRatio).status),
            '≥ 2.0 (excellent)'
          ],
          [
            'Ratio de liquidité réduite',
            financialRatiosService.formatRatio(ratios.quickRatio, 'ratio'),
            this.getStatusBadge(ratios.quickRatio >= 1 ? 'good' : 'warning'),
            '≥ 1.0 (bon)'
          ],
          [
            'Ratio de liquidité immédiate',
            financialRatiosService.formatRatio(ratios.cashRatio, 'ratio'),
            this.getStatusBadge(ratios.cashRatio >= 0.5 ? 'good' : 'warning'),
            '≥ 0.5 (acceptable)'
          ]
        ]
      };

      // Table 2: Ratios de Rentabilité
      const profitabilityTable: TableData = {
        title: 'RATIOS DE RENTABILITÉ',
        headers: ['Indicateur', 'Valeur', 'Statut', 'Benchmark'],
        rows: [
          [
            'Return on Equity (ROE)',
            financialRatiosService.formatRatio(ratios.roe, 'percentage'),
            this.getStatusBadge(financialRatiosService.evaluateRatio('roe', ratios.roe).status),
            '≥ 15% (excellent)'
          ],
          [
            'Return on Assets (ROA)',
            financialRatiosService.formatRatio(ratios.roa, 'percentage'),
            this.getStatusBadge(ratios.roa >= 10 ? 'excellent' : ratios.roa >= 5 ? 'good' : 'warning'),
            '≥ 10% (excellent)'
          ],
          [
            'Marge nette',
            financialRatiosService.formatRatio(ratios.netProfitMargin, 'percentage'),
            this.getStatusBadge(financialRatiosService.evaluateRatio('netProfitMargin', ratios.netProfitMargin).status),
            '≥ 10% (excellent)'
          ],
          [
            'Marge brute',
            financialRatiosService.formatRatio(ratios.grossProfitMargin, 'percentage'),
            this.getStatusBadge(ratios.grossProfitMargin >= 30 ? 'excellent' : ratios.grossProfitMargin >= 20 ? 'good' : 'warning'),
            '≥ 30% (excellent)'
          ],
          [
            'Marge d\'exploitation',
            financialRatiosService.formatRatio(ratios.operatingMargin, 'percentage'),
            this.getStatusBadge(ratios.operatingMargin >= 15 ? 'excellent' : ratios.operatingMargin >= 10 ? 'good' : 'warning'),
            '≥ 15% (excellent)'
          ],
          [
            'Marge EBITDA (EBE)',
            financialRatiosService.formatRatio(ratios.ebitdaMargin, 'percentage'),
            this.getStatusBadge(ratios.ebitdaMargin >= 20 ? 'excellent' : ratios.ebitdaMargin >= 15 ? 'good' : 'warning'),
            '≥ 20% (excellent)'
          ]
        ]
      };

      // Table 3: Ratios de Structure Financière
      const structureTable: TableData = {
        title: 'RATIOS DE STRUCTURE FINANCIÈRE',
        headers: ['Indicateur', 'Valeur', 'Statut', 'Benchmark'],
        rows: [
          [
            'Ratio d\'endettement',
            financialRatiosService.formatRatio(ratios.debtRatio, 'percentage'),
            this.getStatusBadge(financialRatiosService.evaluateRatio('debtRatio', ratios.debtRatio).status),
            '≤ 50% (excellent)'
          ],
          [
            'Ratio d\'autonomie financière',
            financialRatiosService.formatRatio(ratios.equityRatio, 'percentage'),
            this.getStatusBadge(ratios.equityRatio >= 50 ? 'excellent' : ratios.equityRatio >= 30 ? 'good' : 'warning'),
            '≥ 50% (excellent)'
          ],
          [
            'Dettes / Capitaux propres',
            financialRatiosService.formatRatio(ratios.debtToEquityRatio, 'ratio'),
            this.getStatusBadge(ratios.debtToEquityRatio <= 1 ? 'excellent' : ratios.debtToEquityRatio <= 2 ? 'good' : 'warning'),
            '≤ 1.0 (excellent)'
          ],
          [
            'Couverture des intérêts',
            financialRatiosService.formatRatio(ratios.interestCoverageRatio, 'ratio'),
            this.getStatusBadge(ratios.interestCoverageRatio >= 5 ? 'excellent' : ratios.interestCoverageRatio >= 3 ? 'good' : 'warning'),
            '≥ 5.0 (excellent)'
          ]
        ]
      };

      // Table 4: Ratios d'Activité
      const activityTable: TableData = {
        title: 'RATIOS D\'ACTIVITÉ',
        headers: ['Indicateur', 'Valeur', 'Statut', 'Benchmark'],
        rows: [
          [
            'Rotation de l\'actif',
            financialRatiosService.formatRatio(ratios.assetTurnover, 'ratio'),
            this.getStatusBadge(financialRatiosService.evaluateRatio('assetTurnover', ratios.assetTurnover).status),
            '≥ 2.0 (excellent)'
          ],
          [
            'Fonds de roulement',
            financialRatiosService.formatRatio(ratios.workingCapital, 'currency'),
            this.getStatusBadge(ratios.workingCapital > 0 ? 'good' : 'critical'),
            '> 0 (positif)'
          ],
          [
            'BFR / CA',
            financialRatiosService.formatRatio(ratios.workingCapitalRatio, 'percentage'),
            this.getStatusBadge(ratios.workingCapitalRatio >= 0 ? 'good' : 'warning'),
            '≥ 0% (acceptable)'
          ]
        ]
      };

      // Table 5: Données de Base
      const summaryTable: TableData = {
        title: 'DONNÉES FINANCIÈRES DE BASE',
        headers: ['Description', 'Montant'],
        rows: [
          ['Chiffre d\'affaires', this.formatCurrency(ratios.totalRevenue)],
          ['Charges totales', this.formatCurrency(ratios.totalExpenses)],
          ['Résultat net', this.formatCurrency(ratios.netIncome)],
          ['Total Actif', this.formatCurrency(ratios.totalAssets)],
          ['Dettes totales', this.formatCurrency(ratios.totalLiabilities)],
          ['Capitaux propres', this.formatCurrency(ratios.equity)],
          ['Actif circulant', this.formatCurrency(ratios.currentAssets)],
          ['Dettes court terme', this.formatCurrency(ratios.currentLiabilities)]
        ]
      };

      const tables: TableData[] = [
        summaryTable,
        liquidityTable,
        profitabilityTable,
        structureTable,
        activityTable
      ];

      // Options d'export par défaut
      const defaultOptions: ExportOptions = {
        format: 'pdf',
        title: 'RAPPORT D\'ANALYSE DE GESTION',
        subtitle: `Ratios Financiers - Période du ${format(new Date(startDateStr), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(endDateStr), 'dd/MM/yyyy', { locale: fr })}`,
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
          return reportExportService.exportToCSV(summaryTable, defaultOptions);
        default:
          return await reportExportService.exportToPDF(tables, defaultOptions);
      }
    } catch (error) {
      console.error('Erreur génération analyse de gestion:', error instanceof Error ? error.message : String(error));
      throw new Error('Impossible de générer le rapport d\'analyse de gestion');
    }
  }

  /**
   * Helper pour afficher un badge de statut
   */
  private getStatusBadge(status: 'excellent' | 'good' | 'warning' | 'critical'): string {
    const badges: Record<string, string> = {
      excellent: '🟢 Excellent',
      good: '🟡 Bon',
      warning: '🟠 Attention',
      critical: '🔴 Critique'
    };
    return badges[status] || '⚪ N/A';
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

  // Méthode pour récupérer les rapports récents
  async getRecentReports(_companyId: string): Promise<any[]> {
    // TODO: Implémenter la récupération depuis la base de données
    return [];
  }

  // Méthode pour générer un rapport générique
  async generateReport(reportType: string, filters: ReportFilters): Promise<string> {
    // TODO: Router vers la bonne méthode selon le type
    switch (reportType) {
      case 'balance_sheet':
        return this.generateBalanceSheet(filters);
      case 'income_statement':
        return this.generateIncomeStatement(filters);
      case 'trial_balance':
        return this.generateTrialBalance(filters);
      case 'general_ledger':
        return this.generateGeneralLedger(filters);
      default:
        throw new Error('Type de rapport non supporté');
    }
  }
}

// Export singleton
export const reportGenerationService = ReportGenerationService.getInstance();
