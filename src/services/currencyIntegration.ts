// src/services/currencyIntegration.ts

import ConfigService from './configService';
import CurrencyService from './currencyService';
import { SUPPORTED_CURRENCIES } from '../utils/constants';

export class CurrencyIntegration {
  private static instance: CurrencyIntegration;
  private configService = ConfigService.getInstance();
  private currencyService = CurrencyService.getInstance();

  private constructor() {}

  static getInstance(): CurrencyIntegration {
    if (!CurrencyIntegration.instance) {
      CurrencyIntegration.instance = new CurrencyIntegration();
    }
    return CurrencyIntegration.instance;
  }

  /**
   * Initialiser le système de devises lors de la configuration
   */
  async initializeCurrencySystem(): Promise<void> {
    try {
      console.log('🏦 Initialisation du système de devises...');

      // 1. Créer les tables de devises
      await this.createCurrencyTables();

      // 2. Insérer les devises supportées
      await this.insertSupportedCurrencies();

      // 3. Insérer les taux de change fixes
      await this.insertFixedExchangeRates();

      // 4. Mettre à jour les tables existantes
      await this.updateExistingTables();

      console.log('✅ Système de devises initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation devises:', error);
      throw error;
    }
  }

  /**
   * Créer les tables de devises
   */
  private async createCurrencyTables(): Promise<void> {
    const client = this.configService.getSupabaseClient();

    const sqlQueries = [
      // Table des devises
      `CREATE TABLE IF NOT EXISTS currencies (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        symbol TEXT NOT NULL,
        decimal_places INTEGER NOT NULL DEFAULT 2,
        countries TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,

      // Table des taux de change
      `CREATE TABLE IF NOT EXISTS exchange_rates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_currency TEXT NOT NULL,
        to_currency TEXT NOT NULL,
        rate DECIMAL(15,8) NOT NULL,
        date DATE NOT NULL,
        source TEXT NOT NULL,
        is_fixed BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT rate_positive CHECK (rate > 0),
        CONSTRAINT different_currencies CHECK (from_currency != to_currency),
        UNIQUE(from_currency, to_currency, date, source)
      );`,

      // Index
      `CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies 
       ON exchange_rates(from_currency, to_currency);`,

      `CREATE INDEX IF NOT EXISTS idx_exchange_rates_date 
       ON exchange_rates(date DESC);`,

      // Table des conversions
      `CREATE TABLE IF NOT EXISTS currency_conversions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_currency TEXT NOT NULL,
        to_currency TEXT NOT NULL,
        original_amount DECIMAL(15,2) NOT NULL,
        converted_amount DECIMAL(15,2) NOT NULL,
        exchange_rate DECIMAL(15,8) NOT NULL,
        conversion_date DATE NOT NULL,
        company_id UUID,
        reference_type TEXT,
        reference_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    ];

    for (const query of sqlQueries) {
      try {
        const { error } = await client.rpc('execute_sql', { sql: query });
        if (error && !error.message.includes('already exists')) {
          throw error;
        }
      } catch (error) {
        console.warn('SQL Query failed (may be normal):', query.substring(0, 50) + '...');
        // Continuer même si certaines requêtes échouent (tables peuvent déjà exister)
      }
    }
  }

  /**
   * Insérer les devises supportées
   */
  private async insertSupportedCurrencies(): Promise<void> {
    const client = this.configService.getSupabaseClient();

    for (const currency of SUPPORTED_CURRENCIES) {
      try {
        const { error } = await client
          .from('currencies')
          .upsert([{
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
            decimal_places: currency.decimal_places,
            countries: currency.countries,
            is_active: true,
            updated_at: new Date().toISOString()
          }], { 
            onConflict: 'code',
            ignoreDuplicates: false 
          });

        if (error) {
          console.warn(`Erreur insertion devise ${currency.code}:`, error);
        }
      } catch (error) {
        console.warn(`Erreur devise ${currency.code}:`, error);
      }
    }
  }

  /**
   * Insérer les taux de change fixes
   */
  private async insertFixedExchangeRates(): Promise<void> {
    const client = this.configService.getSupabaseClient();

    const fixedRates = [
      {
        from_currency: 'XOF',
        to_currency: 'EUR',
        rate: 0.001524,
        source: 'BCEAO_FIXED'
      },
      {
        from_currency: 'EUR',
        to_currency: 'XOF',
        rate: 655.957,
        source: 'BCEAO_FIXED'
      }
    ];

    for (const rate of fixedRates) {
      try {
        const { error } = await client
          .from('exchange_rates')
          .upsert([{
            ...rate,
            date: new Date().toISOString().split('T')[0],
            is_fixed: true,
            created_at: new Date().toISOString()
          }], {
            onConflict: 'from_currency,to_currency,date,source',
            ignoreDuplicates: false
          });

        if (error) {
          console.warn(`Erreur taux ${rate.from_currency}/${rate.to_currency}:`, error);
        }
      } catch (error) {
        console.warn(`Erreur taux fixe:`, error);
      }
    }
  }

  /**
   * Mettre à jour les tables existantes pour supporter les devises
   */
  private async updateExistingTables(): Promise<void> {
    const client = this.configService.getSupabaseClient();

    const updateQueries = [
      // Ajouter devise aux companies
      `ALTER TABLE companies 
       ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';`,

      // Ajouter devise aux accounts
      `ALTER TABLE accounts 
       ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';`,

      // Ajouter devise aux transactions
      `ALTER TABLE transactions 
       ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';`,

      // Ajouter colonnes devise aux journal_lines
      `ALTER TABLE journal_lines 
       ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
       ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15,8),
       ADD COLUMN IF NOT EXISTS base_currency_debit DECIMAL(15,2) DEFAULT 0,
       ADD COLUMN IF NOT EXISTS base_currency_credit DECIMAL(15,2) DEFAULT 0;`
    ];

    for (const query of updateQueries) {
      try {
        const { error } = await client.rpc('execute_sql', { sql: query });
        if (error && !error.message.includes('already exists')) {
          console.warn('Erreur mise à jour table:', error);
        }
      } catch (error) {
        console.warn('Erreur ALTER TABLE:', error);
      }
    }
  }

  /**
   * Migrer les données existantes vers le nouveau système
   */
  async migrateCurrencyData(): Promise<void> {
    const client = this.configService.getSupabaseClient();
    const config = this.configService.getConfig();
    
    if (!config?.company?.currency) {
      console.log('Aucune devise configurée, migration ignorée');
      return;
    }

    const companyCurrency = config.company.currency;

    try {
      // Mettre à jour la devise de l'entreprise
      const { error: companyError } = await client
        .from('companies')
        .update({ currency: companyCurrency })
        .eq('id', config.company.id);

      if (companyError) {
        console.warn('Erreur mise à jour devise entreprise:', companyError);
      }

      // Mettre à jour les comptes existants
      const { error: accountsError } = await client
        .from('accounts')
        .update({ currency: companyCurrency })
        .eq('company_id', config.company.id)
        .is('currency', null);

      if (accountsError) {
        console.warn('Erreur mise à jour devise comptes:', accountsError);
      }

      // Mettre à jour les transactions existantes
      const { error: transactionsError } = await client
        .from('transactions')
        .update({ currency: companyCurrency })
        .eq('company_id', config.company.id)
        .is('currency', null);

      if (transactionsError) {
        console.warn('Erreur mise à jour devise transactions:', transactionsError);
      }

      console.log('✅ Migration des devises terminée');
    } catch (error) {
      console.error('❌ Erreur migration devises:', error);
      throw error;
    }
  }

  /**
   * Vérifier l'intégrité du système de devises
   */
  async validateCurrencySystem(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const client = this.configService.getSupabaseClient();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Vérifier que les tables existent
      const tables = ['currencies', 'exchange_rates', 'currency_conversions'];
      for (const table of tables) {
        try {
          await client.from(table).select('*').limit(1);
        } catch (error) {
          errors.push(`Table ${table} manquante ou inaccessible`);
        }
      }

      // Vérifier les devises supportées
      const { data: currencies } = await client
        .from('currencies')
        .select('code')
        .eq('is_active', true);

      const supportedCodes = SUPPORTED_CURRENCIES.map(c => c.code);
      const existingCodes = currencies?.map(c => c.code) || [];
      
      for (const code of supportedCodes) {
        if (!existingCodes.includes(code)) {
          warnings.push(`Devise ${code} manquante en base`);
        }
      }

      // Vérifier les taux de change
