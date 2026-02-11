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
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
interface ChartOfAccountsConfig {
  country: string;
  standard: 'PCG' | 'SYSCOHADA' | 'IFRS' | 'US_GAAP';
  currency: string;
  fiscalYearEnd: string;
}
interface SampleDataConfig {
  includeTransactions: boolean;
  includeCustomers: boolean;
  includeSuppliers: boolean;
  includeProducts: boolean;
  transactionCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}
export class SampleDataService {
  private companyId: string;
  constructor(companyId: string) {
    this.companyId = companyId;
  }
  // Plans comptables par pays/standard
  private getChartOfAccounts(config: ChartOfAccountsConfig) {
    const baseAccounts = {
      PCG: [
        // Classe 1 - Comptes de capitaux
        { code: '101000', name: 'Capital social', type: 'equity', level: 1 },
        { code: '106000', name: 'Réserves', type: 'equity', level: 1 },
        { code: '110000', name: 'Report à nouveau', type: 'equity', level: 1 },
        { code: '120000', name: 'Résultat de l\'exercice', type: 'equity', level: 1 },
        { code: '164000', name: 'Emprunts auprès des établissements de crédit', type: 'liability', level: 1 },
        // Classe 2 - Comptes d'immobilisations
        { code: '213000', name: 'Constructions', type: 'asset', level: 1 },
        { code: '218000', name: 'Autres immobilisations corporelles', type: 'asset', level: 1 },
        { code: '283000', name: 'Amortissements des constructions', type: 'asset', level: 1 },
        // Classe 3 - Comptes de stocks
        { code: '310000', name: 'Matières premières', type: 'asset', level: 1 },
        { code: '370000', name: 'Stocks de marchandises', type: 'asset', level: 1 },
        // Classe 4 - Comptes de tiers
        { code: '411000', name: 'Clients', type: 'asset', level: 1 },
        { code: '401000', name: 'Fournisseurs', type: 'liability', level: 1 },
        { code: '421000', name: 'Personnel - rémunérations dues', type: 'liability', level: 1 },
        { code: '445700', name: 'TVA collectée', type: 'liability', level: 1 },
        { code: '445660', name: 'TVA déductible sur autres biens et services', type: 'asset', level: 1 },
        // Classe 5 - Comptes financiers
        { code: '512000', name: 'Banque', type: 'asset', level: 1 },
        { code: '530000', name: 'Caisse', type: 'asset', level: 1 },
        // Classe 6 - Comptes de charges
        { code: '601000', name: 'Achats de matières premières', type: 'expense', level: 1 },
        { code: '607000', name: 'Achats de marchandises', type: 'expense', level: 1 },
        { code: '613000', name: 'Locations', type: 'expense', level: 1 },
        { code: '641000', name: 'Rémunérations du personnel', type: 'expense', level: 1 },
        { code: '645000', name: 'Charges de sécurité sociale', type: 'expense', level: 1 },
        // Classe 7 - Comptes de produits
        { code: '701000', name: 'Ventes de produits finis', type: 'revenue', level: 1 },
        { code: '707000', name: 'Ventes de marchandises', type: 'revenue', level: 1 },
        { code: '758000', name: 'Produits divers de gestion courante', type: 'revenue', level: 1 }
      ],
      SYSCOHADA: [
        // Classe 1 - Ressources durables
        { code: '10', name: 'Capital et réserves', type: 'equity', level: 1 },
        { code: '101', name: 'Capital social', type: 'equity', level: 2 },
        { code: '106', name: 'Réserves', type: 'equity', level: 2 },
        { code: '16', name: 'Emprunts et dettes assimilées', type: 'liability', level: 1 },
        // Classe 2 - Actif immobilisé
        { code: '21', name: 'Immobilisations corporelles', type: 'asset', level: 1 },
        { code: '213', name: 'Bâtiments, installations techniques', type: 'asset', level: 2 },
        { code: '24', name: 'Matériel', type: 'asset', level: 1 },
        { code: '28', name: 'Amortissements des immobilisations', type: 'asset', level: 1 },
        // Classe 3 - Stocks
        { code: '31', name: 'Matières premières et fournitures', type: 'asset', level: 1 },
        { code: '37', name: 'Stocks de marchandises', type: 'asset', level: 1 },
        // Classe 4 - Créances et dettes
        { code: '41', name: 'Clients et comptes rattachés', type: 'asset', level: 1 },
        { code: '411', name: 'Clients', type: 'asset', level: 2 },
        { code: '40', name: 'Fournisseurs et comptes rattachés', type: 'liability', level: 1 },
        { code: '401', name: 'Fournisseurs', type: 'liability', level: 2 },
        { code: '421', name: 'Personnel', type: 'liability', level: 2 },
        { code: '4441', name: 'État - TVA facturée', type: 'liability', level: 2 },
        { code: '4454', name: 'État - TVA récupérable', type: 'asset', level: 2 },
        // Classe 5 - Trésorerie
        { code: '52', name: 'Banques', type: 'asset', level: 1 },
        { code: '521', name: 'Banques locales', type: 'asset', level: 2 },
        { code: '53', name: 'Caisses', type: 'asset', level: 1 },
        // Classe 6 - Charges
        { code: '60', name: 'Achats et variations de stocks', type: 'expense', level: 1 },
        { code: '601', name: 'Achats de matières premières', type: 'expense', level: 2 },
        { code: '607', name: 'Achats de marchandises', type: 'expense', level: 2 },
        { code: '61', name: 'Transports', type: 'expense', level: 1 },
        { code: '62', name: 'Services extérieurs A', type: 'expense', level: 1 },
        { code: '66', name: 'Charges de personnel', type: 'expense', level: 1 },
        { code: '661', name: 'Rémunérations directes versées au personnel', type: 'expense', level: 2 },
        // Classe 7 - Produits
        { code: '70', name: 'Ventes', type: 'revenue', level: 1 },
        { code: '701', name: 'Ventes de marchandises', type: 'revenue', level: 2 },
        { code: '702', name: 'Ventes de produits finis', type: 'revenue', level: 2 }
      ]
    };
    return baseAccounts[config.standard as keyof typeof baseAccounts] || baseAccounts.PCG;
  }
  // Données d'exemple pour clients
  private getSampleCustomers(config: ChartOfAccountsConfig) {
    const countryPrefixes = {
      'FR': '+33',
      'SN': '+221',
      'CI': '+225',
      'ML': '+223',
      'MA': '+212',
      'TN': '+216'
    };
    return [
      {
        name: 'SARL TECHNO SOLUTIONS',
        email: 'contact@technosolutions.com',
        phone: `${countryPrefixes[config.country as keyof typeof countryPrefixes] || '+33'} 1 23 45 67 89`,
        address: 'Zone industrielle, Lot 15',
        city: config.country === 'FR' ? 'Lyon' : 'Dakar',
        postal_code: config.country === 'FR' ? '69000' : '10000',
        country: config.country,
        tax_number: config.country === 'FR' ? 'FR12345678901' : 'SN123456789',
        customer_type: 'B2B',
        payment_terms: 30,
        currency: config.currency,
        credit_limit: 50000
      },
      {
        name: 'Martin Dubois',
        email: 'martin.dubois@email.com',
        phone: `${countryPrefixes[config.country as keyof typeof countryPrefixes] || '+33'} 6 12 34 56 78`,
        address: '123 Rue de la République',
        city: config.country === 'FR' ? 'Paris' : 'Abidjan',
        postal_code: config.country === 'FR' ? '75001' : '01234',
        country: config.country,
        customer_type: 'B2C',
        payment_terms: 0,
        currency: config.currency,
        credit_limit: 5000
      },
      {
        name: 'GROUPE COMMERCIAL AFRIQUE',
        email: 'info@gca-group.com',
        phone: `${countryPrefixes[config.country as keyof typeof countryPrefixes] || '+33'} 3 45 67 89 01`,
        address: 'Avenue de l\'Indépendance, Immeuble le Phoenix',
        city: config.country === 'FR' ? 'Marseille' : 'Bamako',
        postal_code: config.country === 'FR' ? '13000' : '99999',
        country: config.country,
        tax_number: config.country === 'FR' ? 'FR98765432109' : 'ML987654321',
        customer_type: 'B2B',
        payment_terms: 60,
        currency: config.currency,
        credit_limit: 100000
      }
    ];
  }
  // Données d'exemple pour fournisseurs
  private getSampleSuppliers(config: ChartOfAccountsConfig) {
    return [
      {
        name: 'FOURNISSEUR GLOBAL SARL',
        email: 'commandes@fournisseurglobal.com',
        phone: '+33 4 56 78 90 12',
        address: 'Zone Industrielle Nord',
        city: 'Rennes',
        postal_code: '35000',
        country: 'FR',
        tax_number: 'FR11223344556',
        supplier_type: 'materials',
        payment_terms: 30,
        currency: config.currency
      },
      {
        name: 'IMPORT EXPORT MAGHREB',
        email: 'contact@iemagreb.ma',
        phone: '+212 5 22 33 44 55',
        address: 'Boulevard Hassan II',
        city: 'Casablanca',
        postal_code: '20000',
        country: 'MA',
        tax_number: 'MA123456789',
        supplier_type: 'goods',
        payment_terms: 45,
        currency: config.currency
      }
    ];
  }
  // Données d'exemple pour produits/services
  private getSampleProducts(config: ChartOfAccountsConfig) {
    return [
      {
        name: 'Service Consulting Informatique',
        description: 'Prestation de conseil en informatique et transformation digitale',
        sku: 'SERV-CONSULT-001',
        category: 'Services',
        unit_price: config.currency === 'EUR' ? 500 : (config.currency === 'XOF' ? 250000 : 800),
        currency: config.currency,
        tax_rate: config.country === 'FR' ? 20 : (config.standard === 'SYSCOHADA' ? 18 : 20),
        is_service: true,
        is_active: true
      },
      {
        name: 'Ordinateur Portable Professionnel',
        description: 'PC portable haute performance pour usage professionnel',
        sku: 'PROD-PC-001',
        category: 'Matériel Informatique',
        unit_price: config.currency === 'EUR' ? 1200 : (config.currency === 'XOF' ? 600000 : 1800),
        currency: config.currency,
        tax_rate: config.country === 'FR' ? 20 : (config.standard === 'SYSCOHADA' ? 18 : 20),
        is_service: false,
        stock_quantity: 25,
        is_active: true
      },
      {
        name: 'Formation Logiciel Comptable',
        description: 'Formation à l\'utilisation des logiciels comptables CassKai',
        sku: 'FORM-COMPTA-001',
        category: 'Formation',
        unit_price: config.currency === 'EUR' ? 800 : (config.currency === 'XOF' ? 400000 : 1200),
        currency: config.currency,
        tax_rate: config.country === 'FR' ? 20 : (config.standard === 'SYSCOHADA' ? 18 : 20),
        is_service: true,
        is_active: true
      }
    ];
  }
  // Génération des écritures comptables d'exemple
  private generateSampleTransactions(config: ChartOfAccountsConfig, sampleConfig: SampleDataConfig) {
    const transactions = [];
    const startDate = new Date(sampleConfig.dateRange.start);
    const endDate = new Date(sampleConfig.dateRange.end);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    // Transaction types avec leurs écritures
    const transactionTypes = [
      {
        type: 'sale_invoice',
        description: 'Facture de vente',
        entries: [
          { account: '411000', debit: true, amount: 1200 },
          { account: '707000', debit: false, amount: 1000 },
          { account: '445700', debit: false, amount: 200 } // TVA
        ]
      },
      {
        type: 'purchase_invoice',
        description: 'Facture d\'achat',
        entries: [
          { account: '601000', debit: true, amount: 800 },
          { account: '445660', debit: true, amount: 160 }, // TVA déductible
          { account: '401000', debit: false, amount: 960 }
        ]
      },
      {
        type: 'bank_payment',
        description: 'Paiement client par virement',
        entries: [
          { account: '512000', debit: true, amount: 1200 },
          { account: '411000', debit: false, amount: 1200 }
        ]
      },
      {
        type: 'salary_payment',
        description: 'Paiement salaires',
        entries: [
          { account: '641000', debit: true, amount: 3000 },
          { account: '645000', debit: true, amount: 900 }, // Charges sociales
          { account: '421000', debit: false, amount: 2400 }, // Net à payer
          { account: '431000', debit: false, amount: 1500 } // Organismes sociaux
        ]
      }
    ];
    for (let i = 0; i < sampleConfig.transactionCount; i++) {
      const randomDays = Math.floor(Math.random() * daysDiff);
      const transactionDate = new Date(startDate.getTime() + (randomDays * 24 * 60 * 60 * 1000));
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      // Ajuster les montants selon la devise
      const currencyMultiplier = config.currency === 'XOF' ? 650 :
                                 config.currency === 'MAD' ? 10 :
                                 config.currency === 'TND' ? 3 : 1;
      transactions.push({
        date: transactionDate.toISOString().split('T')[0],
        reference: `${transactionType.type.toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
        description: `${transactionType.description} #${i + 1}`,
        entries: transactionType.entries.map(entry => ({
          account_code: entry.account,
          debit_amount: entry.debit ? entry.amount * currencyMultiplier : 0,
          credit_amount: !entry.debit ? entry.amount * currencyMultiplier : 0,
          description: `${transactionType.description} - ${entry.account}`
        }))
      });
    }
    return transactions;
  }
  async generateSampleData(chartConfig: ChartOfAccountsConfig, sampleConfig: SampleDataConfig) {
    try {
      const results = {
        accounts: 0,
        customers: 0,
        suppliers: 0,
        products: 0,
        transactions: 0
      };
      // 1. Créer le plan comptable
      const accounts = this.getChartOfAccounts(chartConfig);
      const accountsToInsert = accounts.map((account: any) => ({
        company_id: this.companyId,
        account_number: account.code,
        account_name: account.name,
        account_type: account.type,
        account_class: Number(account.code?.charAt(0)) || null,
        level: account.level,
        is_active: true,
        is_detail_account: true,
        description: `Compte ${account.name} (${account.code}) importé automatiquement`,
        balance_debit: 0,
        balance_credit: 0,
        current_balance: 0,
        imported_from_fec: false
      }));
      const { error: accountsError } = await supabase
        .from('chart_of_accounts')
        .insert(accountsToInsert);
      if (!accountsError) results.accounts = accountsToInsert.length;
      // 2. Créer les clients d'exemple
      if (sampleConfig.includeCustomers) {
        const customers = this.getSampleCustomers(chartConfig);
        const customersToInsert = customers.map(customer => ({
          company_id: this.companyId,
          ...customer
        }));
        const { error: customersError } = await supabase
          .from('customers')
          .insert(customersToInsert);
        if (!customersError) results.customers = customersToInsert.length;
      }
      // 3. Créer les fournisseurs d'exemple
      if (sampleConfig.includeSuppliers) {
        const suppliers = this.getSampleSuppliers(chartConfig);
        const suppliersToInsert = suppliers.map(supplier => ({
          company_id: this.companyId,
          ...supplier
        }));
        const { error: suppliersError } = await supabase
          .from('suppliers')
          .insert(suppliersToInsert);
        if (!suppliersError) results.suppliers = suppliersToInsert.length;
      }
      // 4. Créer les produits/services d'exemple
      if (sampleConfig.includeProducts) {
        const products = this.getSampleProducts(chartConfig);
        const productsToInsert = products.map(product => ({
          company_id: this.companyId,
          ...product
        }));
        const { error: productsError } = await supabase
          .from('products')
          .insert(productsToInsert);
        if (!productsError) results.products = productsToInsert.length;
      }
      // 5. Créer les transactions d'exemple
      if (sampleConfig.includeTransactions) {
        const transactions = this.generateSampleTransactions(chartConfig, sampleConfig);
        for (const transaction of transactions) {
          // Créer l'écriture comptable
          const { data: journalEntry, error: _journalError } = await supabase
            .from('journal_entries')
            .insert({
              company_id: this.companyId,
              entry_date: transaction.date,
              reference: transaction.reference,
              description: transaction.description,
              total_amount: transaction.entries.reduce((sum, entry) => sum + entry.debit_amount, 0)
            })
            .select('id')
            .single();
          if (journalEntry) {
            // Créer les lignes d'écriture
            const entryLines = transaction.entries.map(entry => ({
              company_id: this.companyId,
              journal_entry_id: journalEntry.id,
              account_code: entry.account_code,
              debit_amount: entry.debit_amount,
              credit_amount: entry.credit_amount,
              description: entry.description
            }));
            await supabase
              .from('journal_entry_lines')
              .insert(entryLines);
            results.transactions++;
          }
        }
      }
      return { success: true, results };
    } catch (error: unknown) {
      logger.error('SampleData', 'Erreur génération données d\'exemple:', error);
      return { success: false, error: (error instanceof Error ? error.message : 'Une erreur est survenue') };
    }
  }
  // Fonction de suppression des données d'exemple (RAZ)
  async resetSampleData() {
    try {
      const tablesToReset = [
        'journal_entry_lines',
        'journal_entries',
        'invoice_lines',
        'invoices',
        'products',
        'suppliers',
        'customers',
        'chart_of_accounts'
      ];
      for (const table of tablesToReset) {
        await supabase
          .from(table)
          .delete()
          .eq('company_id', this.companyId);
      }
      return { success: true };
    } catch (error: unknown) {
      logger.error('SampleData', 'Erreur suppression données d\'exemple:', error);
      return { success: false, error: (error instanceof Error ? error.message : 'Une erreur est survenue') };
    }
  }
}