/**
 * Service de récupération et traitement des données comptables
 * Interface entre les écritures comptables et les rapports financiers
 */

export interface AccountingTransaction {
  id: string;
  company_id: string;
  transaction_date: string;
  reference: string;
  description: string;
  journal_code: string;
  entries: AccountingEntry[];
  total_debit: number;
  total_credit: number;
  validated: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountingEntry {
  id: string;
  transaction_id: string;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
  analytical_code?: string;
  third_party_code?: string;
}

export interface ChartOfAccounts {
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_class: '1' | '2' | '3' | '4' | '5' | '6' | '7';
  parent_code?: string;
  is_active: boolean;
  balance_type: 'debit' | 'credit';
}

export interface AccountBalance {
  account_code: string;
  account_name: string;
  opening_balance: number;
  period_debit: number;
  period_credit: number;
  closing_balance: number;
  balance_type: 'debit' | 'credit';
}

export class AccountingDataService {
  private static instance: AccountingDataService;

  static getInstance(): AccountingDataService {
    if (!AccountingDataService.instance) {
      AccountingDataService.instance = new AccountingDataService();
    }
    return AccountingDataService.instance;
  }

  /**
   * Récupère toutes les écritures comptables d'une période
   */
  async getTransactions(
    companyId: string,
    startDate: string,
    endDate: string,
    accountCodes?: string[]
  ): Promise<AccountingTransaction[]> {
    try {
      // TODO: Remplacer par l'appel réel à Supabase
      const query = `
        SELECT
          t.*,
          json_agg(e.*) as entries
        FROM accounting_transactions t
        LEFT JOIN accounting_entries e ON t.id = e.transaction_id
        WHERE t.company_id = $1
        AND t.transaction_date BETWEEN $2 AND $3
        AND t.validated = true
        ${accountCodes ? 'AND e.account_code = ANY($4)' : ''}
        GROUP BY t.id
        ORDER BY t.transaction_date, t.reference
      `;

      // Simulation de données pour le développement
      return this.generateMockTransactions(companyId, startDate, endDate);
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Calcule les soldes de tous les comptes pour une période
   */
  async getAccountBalances(
    companyId: string,
    startDate: string,
    endDate: string,
    accountCodes?: string[]
  ): Promise<Record<string, AccountBalance>> {
    const transactions = await this.getTransactions(companyId, startDate, endDate, accountCodes);
    const balances: Record<string, AccountBalance> = {};

    // Initialiser les soldes
    const chart = await this.getChartOfAccounts(companyId);
    for (const account of chart) {
      balances[account.account_code] = {
        account_code: account.account_code,
        account_name: account.account_name,
        opening_balance: 0, // TODO: Calculer le solde d'ouverture
        period_debit: 0,
        period_credit: 0,
        closing_balance: 0,
        balance_type: account.balance_type
      };
    }

    // Calculer les mouvements de la période
    for (const transaction of transactions) {
      for (const entry of transaction.entries) {
        if (balances[entry.account_code]) {
          balances[entry.account_code].period_debit += entry.debit_amount;
          balances[entry.account_code].period_credit += entry.credit_amount;
        }
      }
    }

    // Calculer les soldes de clôture
    for (const accountCode in balances) {
      const balance = balances[accountCode];
      const netMovement = balance.period_debit - balance.period_credit;

      if (balance.balance_type === 'debit') {
        balance.closing_balance = balance.opening_balance + netMovement;
      } else {
        balance.closing_balance = balance.opening_balance - netMovement;
      }
    }

    return balances;
  }

  /**
   * Récupère le plan comptable de l'entreprise
   */
  async getChartOfAccounts(companyId: string): Promise<ChartOfAccounts[]> {
    try {
      // TODO: Remplacer par l'appel réel à Supabase
      return this.getDefaultChartOfAccounts();
    } catch (error) {
      console.error('Erreur lors de la récupération du plan comptable:', error instanceof Error ? error.message : String(error));
      return this.getDefaultChartOfAccounts();
    }
  }

  /**
   * Calcule le besoin en fonds de roulement
   */
  async calculateWorkingCapital(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    current_assets: number;
    current_liabilities: number;
    working_capital: number;
    working_capital_ratio: number;
  }> {
    const balances = await this.getAccountBalances(companyId, startDate, endDate);

    const currentAssets = this.sumAccountsByPattern(balances, ['3', '41', '42', '43', '44', '5']);
    const currentLiabilities = this.sumAccountsByPattern(balances, ['40', '42', '43', '44', '45']);

    const workingCapital = currentAssets - currentLiabilities;
    const workingCapitalRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

    return {
      current_assets: currentAssets,
      current_liabilities: currentLiabilities,
      working_capital: workingCapital,
      working_capital_ratio: workingCapitalRatio
    };
  }

  /**
   * Analyse l'évolution des créances clients
   */
  async analyzeReceivables(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    total_receivables: number;
    aged_analysis: {
      current: number;
      days_1_30: number;
      days_31_60: number;
      days_61_90: number;
      over_90: number;
    };
    average_collection_period: number;
  }> {
    // TODO: Implémenter l'analyse détaillée des créances avec dates d'échéance
    const balances = await this.getAccountBalances(companyId, startDate, endDate);
    const totalReceivables = this.sumAccountsByPattern(balances, ['411', '413', '416']);

    // Simulation de l'analyse par âge (à remplacer par une vraie analyse)
    return {
      total_receivables: totalReceivables,
      aged_analysis: {
        current: totalReceivables * 0.6,
        days_1_30: totalReceivables * 0.25,
        days_31_60: totalReceivables * 0.1,
        days_61_90: totalReceivables * 0.04,
        over_90: totalReceivables * 0.01
      },
      average_collection_period: 35 // Jours moyens de recouvrement
    };
  }

  /**
   * Calcule les ratios de rentabilité
   */
  async calculateProfitabilityRatios(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    gross_margin: number;
    operating_margin: number;
    net_margin: number;
    return_on_assets: number;
    return_on_equity: number;
  }> {
    const balances = await this.getAccountBalances(companyId, startDate, endDate);

    const revenue = Math.abs(this.sumAccountsByPattern(balances, ['70', '71', '72']));
    const cogs = this.sumAccountsByPattern(balances, ['60', '601', '602']);
    const operatingExpenses = this.sumAccountsByPattern(balances, ['61', '62', '63', '64']);
    const netIncome = Math.abs(this.sumAccountsByPattern(balances, ['120']));

    const totalAssets = this.sumAccountsByPattern(balances, ['2', '3', '4', '5']);
    const totalEquity = Math.abs(this.sumAccountsByPattern(balances, ['1']));

    const grossProfit = revenue - Math.abs(cogs);
    const operatingIncome = grossProfit - Math.abs(operatingExpenses);

    return {
      gross_margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      operating_margin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
      net_margin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
      return_on_assets: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
      return_on_equity: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0
    };
  }

  /**
   * Génère les données pour la déclaration de TVA
   */
  async generateVATData(
    companyId: string,
    month: string,
    year: string
  ): Promise<{
    period: string;
    vat_collected: number;
    vat_deductible: number;
    vat_due: number;
    turnover_subject_to_vat: number;
  }> {
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    const balances = await this.getAccountBalances(companyId, startDate, endDate);

    const vatCollected = Math.abs(this.sumAccountsByPattern(balances, ['4457']));
    const vatDeductible = this.sumAccountsByPattern(balances, ['4456']);
    const vatDue = Math.max(0, vatCollected - vatDeductible);
    const turnover = Math.abs(this.sumAccountsByPattern(balances, ['70', '71']));

    return {
      period: `${month}/${year}`,
      vat_collected: vatCollected,
      vat_deductible: vatDeductible,
      vat_due: vatDue,
      turnover_subject_to_vat: turnover
    };
  }

  // Méthodes utilitaires privées
  private sumAccountsByPattern(balances: Record<string, AccountBalance>, patterns: string[]): number {
    let total = 0;

    for (const accountCode in balances) {
      const shouldInclude = patterns.some(pattern => {
        if (pattern.length === 1) {
          return accountCode.startsWith(pattern);
        }
        return accountCode.startsWith(pattern);
      });

      if (shouldInclude) {
        const balance = balances[accountCode];
        total += balance.closing_balance;
      }
    }

    return total;
  }

  private getDefaultChartOfAccounts(): ChartOfAccounts[] {
    return [
      // Classe 1 - Capitaux
      { account_code: '101', account_name: 'Capital', account_type: 'equity', account_class: '1', is_active: true, balance_type: 'credit' },
      { account_code: '110', account_name: 'Report à nouveau', account_type: 'equity', account_class: '1', is_active: true, balance_type: 'credit' },
      { account_code: '120', account_name: 'Résultat de l\'exercice', account_type: 'equity', account_class: '1', is_active: true, balance_type: 'credit' },
      { account_code: '164', account_name: 'Emprunts auprès des établissements de crédit', account_type: 'liability', account_class: '1', is_active: true, balance_type: 'credit' },

      // Classe 2 - Immobilisations
      { account_code: '205', account_name: 'Concessions et droits similaires', account_type: 'asset', account_class: '2', is_active: true, balance_type: 'debit' },
      { account_code: '213', account_name: 'Constructions', account_type: 'asset', account_class: '2', is_active: true, balance_type: 'debit' },
      { account_code: '2154', account_name: 'Matériel informatique', account_type: 'asset', account_class: '2', is_active: true, balance_type: 'debit' },
      { account_code: '2182', account_name: 'Matériel de transport', account_type: 'asset', account_class: '2', is_active: true, balance_type: 'debit' },

      // Classe 3 - Stocks
      { account_code: '315', account_name: 'Stocks de matières premières', account_type: 'asset', account_class: '3', is_active: true, balance_type: 'debit' },
      { account_code: '355', account_name: 'Stocks de produits finis', account_type: 'asset', account_class: '3', is_active: true, balance_type: 'debit' },
      { account_code: '370', account_name: 'Stocks de marchandises', account_type: 'asset', account_class: '3', is_active: true, balance_type: 'debit' },

      // Classe 4 - Tiers
      { account_code: '401', account_name: 'Fournisseurs', account_type: 'liability', account_class: '4', is_active: true, balance_type: 'credit' },
      { account_code: '411', account_name: 'Clients', account_type: 'asset', account_class: '4', is_active: true, balance_type: 'debit' },
      { account_code: '416', account_name: 'Clients douteux', account_type: 'asset', account_class: '4', is_active: true, balance_type: 'debit' },
      { account_code: '421', account_name: 'Personnel - rémunérations dues', account_type: 'liability', account_class: '4', is_active: true, balance_type: 'credit' },
      { account_code: '4457', account_name: 'TVA collectée', account_type: 'liability', account_class: '4', is_active: true, balance_type: 'credit' },
      { account_code: '4456', account_name: 'TVA déductible', account_type: 'asset', account_class: '4', is_active: true, balance_type: 'debit' },

      // Classe 5 - Financier
      { account_code: '512', account_name: 'Banques', account_type: 'asset', account_class: '5', is_active: true, balance_type: 'debit' },
      { account_code: '530', account_name: 'Caisse', account_type: 'asset', account_class: '5', is_active: true, balance_type: 'debit' },

      // Classe 6 - Charges
      { account_code: '601', account_name: 'Achats stockés - Matières premières', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '607', account_name: 'Achats de marchandises', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '613', account_name: 'Locations', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '623', account_name: 'Publicité, publications', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '641', account_name: 'Rémunérations du personnel', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '645', account_name: 'Charges de sécurité sociale', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },
      { account_code: '661', account_name: 'Charges d\'intérêts', account_type: 'expense', account_class: '6', is_active: true, balance_type: 'debit' },

      // Classe 7 - Produits
      { account_code: '701', account_name: 'Ventes de produits finis', account_type: 'revenue', account_class: '7', is_active: true, balance_type: 'credit' },
      { account_code: '707', account_name: 'Ventes de marchandises', account_type: 'revenue', account_class: '7', is_active: true, balance_type: 'credit' },
      { account_code: '706', account_name: 'Prestations de services', account_type: 'revenue', account_class: '7', is_active: true, balance_type: 'credit' },
      { account_code: '758', account_name: 'Produits divers de gestion courante', account_type: 'revenue', account_class: '7', is_active: true, balance_type: 'credit' },
      { account_code: '761', account_name: 'Produits financiers', account_type: 'revenue', account_class: '7', is_active: true, balance_type: 'credit' }
    ];
  }

  private generateMockTransactions(companyId: string, startDate: string, endDate: string): AccountingTransaction[] {
    // Générer des données de démonstration
    const transactions: AccountingTransaction[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < Math.min(daysDiff * 2, 100); i++) {
      const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      const transactionId = `TXN-${i.toString().padStart(4, '0')}`;

      // Vente avec TVA
      if (Math.random() > 0.5) {
        const amount = Math.round(Math.random() * 5000 + 100);
        const vatAmount = Math.round(amount * 0.2);

        transactions.push({
          id: transactionId,
          company_id: companyId,
          transaction_date: randomDate.toISOString().split('T')[0],
          reference: `VTE-${i}`,
          description: `Vente marchandises client ${i}`,
          journal_code: 'VTE',
          total_debit: amount + vatAmount,
          total_credit: amount + vatAmount,
          validated: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          entries: [
            {
              id: `${transactionId}-1`,
              transaction_id: transactionId,
              account_code: '411',
              account_name: 'Clients',
              debit_amount: amount + vatAmount,
              credit_amount: 0,
              description: 'Client'
            },
            {
              id: `${transactionId}-2`,
              transaction_id: transactionId,
              account_code: '707',
              account_name: 'Ventes de marchandises',
              debit_amount: 0,
              credit_amount: amount,
              description: 'Vente'
            },
            {
              id: `${transactionId}-3`,
              transaction_id: transactionId,
              account_code: '4457',
              account_name: 'TVA collectée',
              debit_amount: 0,
              credit_amount: vatAmount,
              description: 'TVA 20%'
            }
          ]
        });
      }
    }

    return transactions;
  }
}

export const accountingDataService = AccountingDataService.getInstance();
