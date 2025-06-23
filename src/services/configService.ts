// src/services/configService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  validated: boolean;
}

export interface CompanyConfig {
  name: string;
  country: string;
  currency: string;
  timezone: string;
}

export interface AppConfig {
  supabase: SupabaseConfig;
  company: CompanyConfig;
  setupCompleted: boolean;
  setupDate: string;
}

class ConfigService {
  private static instance: ConfigService;
  private supabaseClient: SupabaseClient | null = null;
  private config: AppConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // Vérifier si l'application est configurée
  isConfigured(): boolean {
    return this.getConfig()?.setupCompleted || false;
  }

  // Récupérer la configuration stockée
  getConfig(): AppConfig | null {
    if (this.config) return this.config;

    try {
      const stored = localStorage.getItem('casskai_config');
      if (stored) {
        this.config = JSON.parse(stored);
        return this.config;
      }
    } catch (error) {
      console.error('Erreur lors de la lecture de la configuration:', error);
    }
    return null;
  }

  // Sauvegarder la configuration
  async saveConfig(config: AppConfig): Promise<void> {
    try {
      localStorage.setItem('casskai_config', JSON.stringify(config));
      this.config = config;
      
      // Réinitialiser le client Supabase avec la nouvelle config
      await this.initializeSupabaseClient();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      throw new Error('Impossible de sauvegarder la configuration');
    }
  }

  // Initialiser le client Supabase
  async initializeSupabaseClient(): Promise<SupabaseClient> {
    const config = this.getConfig();
    if (!config?.supabase.validated) {
      throw new Error('Configuration Supabase non validée');
    }

    try {
      this.supabaseClient = createClient(
        config.supabase.url,
        config.supabase.anonKey
      );

      // Test de connexion
      const { error } = await this.supabaseClient.from('_test').select('*').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (normal)
        throw new Error(`Erreur de connexion Supabase: ${error.message}`);
      }

      return this.supabaseClient;
    } catch (error) {
      console.error('Erreur d\'initialisation Supabase:', error);
      throw error;
    }
  }

  // Obtenir le client Supabase
  getSupabaseClient(): SupabaseClient {
    if (!this.supabaseClient) {
      throw new Error('Client Supabase non initialisé. Appelez initializeSupabaseClient() d\'abord.');
    }
    return this.supabaseClient;
  }

  // Valider la configuration Supabase
  async validateSupabaseConfig(url: string, anonKey: string): Promise<boolean> {
    try {
      const tempClient = createClient(url, anonKey);
      const { error } = await tempClient.from('_test').select('*').limit(1);
      
      // Succès si pas d'erreur ou si l'erreur est "table not found"
      return !error || error.code === 'PGRST116';
    } catch (error) {
      console.error('Validation échouée:', error);
      return false;
    }
  }

  // Initialiser la base de données avec les tables nécessaires
  async initializeDatabase(): Promise<void> {
    const client = this.getSupabaseClient();
    const config = this.getConfig();
    
    if (!config) {
      throw new Error('Configuration manquante');
    }

    try {
      // Créer les tables principales si elles n'existent pas
      const sqlQueries = this.generateDatabaseSchema(config);
      
      for (const query of sqlQueries) {
        const { error } = await client.rpc('execute_sql', { sql: query });
        if (error && !error.message.includes('already exists')) {
          console.error('Erreur SQL:', error);
          throw error;
        }
      }

      // Insérer les données de configuration initiales
      await this.insertInitialData(config);
      
    } catch (error) {
      console.error('Erreur d\'initialisation de la base de données:', error);
      throw new Error('Impossible d\'initialiser la base de données');
    }
  }

  // Générer le schéma de base de données selon le pays
  private generateDatabaseSchema(config: AppConfig): string[] {
    const baseSchema = [
      // Table des entreprises
      `CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        currency TEXT NOT NULL,
        timezone TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,

      // Table des utilisateurs (étend auth.users)
      `CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id),
        email TEXT NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        company_id UUID REFERENCES companies(id),
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,

      // Table des comptes comptables
      `CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id),
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL, -- asset, liability, equity, revenue, expense
        parent_id UUID REFERENCES accounts(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(company_id, code)
      );`,

      // Table des écritures comptables
      `CREATE TABLE IF NOT EXISTS journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id),
        entry_number TEXT NOT NULL,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        reference TEXT,
        created_by UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(company_id, entry_number)
      );`,

      // Table des lignes d'écriture
      `CREATE TABLE IF NOT EXISTS journal_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
        account_id UUID NOT NULL REFERENCES accounts(id),
        debit DECIMAL(15,2) DEFAULT 0,
        credit DECIMAL(15,2) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    ];

    // Ajouter des tables spécifiques selon le pays
    if (config.company.country === 'BJ' || config.company.country === 'CI') {
      // Plan comptable SYSCOHADA
      baseSchema.push(`
        CREATE TABLE IF NOT EXISTS syscohada_accounts (
          code TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          level INTEGER NOT NULL
        );
      `);
    }

    return baseSchema;
  }

  // Insérer les données initiales
  private async insertInitialData(config: AppConfig): Promise<void> {
    const client = this.getSupabaseClient();

    // Insérer l'entreprise
    const { data: company, error: companyError } = await client
      .from('companies')
      .insert([{
        name: config.company.name,
        country: config.company.country,
        currency: config.company.currency,
        timezone: config.company.timezone
      }])
      .select()
      .single();

    if (companyError) {
      throw companyError;
    }

    // Insérer le plan comptable selon le pays
    await this.insertChartOfAccounts(config.company.country, company.id);
  }

  // Insérer le plan comptable selon le pays
  private async insertChartOfAccounts(country: string, companyId: string): Promise<void> {
    const client = this.getSupabaseClient();
    let accounts: Array<{code: string, name: string, type: string}> = [];

    switch (country) {
      case 'FR':
        accounts = this.getFrenchChartOfAccounts();
        break;
      case 'BJ':
      case 'CI':
        accounts = this.getSYSCOHADAChartOfAccounts();
        break;
      case 'BE':
        accounts = this.getBelgianChartOfAccounts();
        break;
      default:
        accounts = this.getBasicChartOfAccounts();
    }

    const accountsWithCompany = accounts.map(account => ({
      ...account,
      company_id: companyId
    }));

    const { error } = await client
      .from('accounts')
      .insert(accountsWithCompany);

    if (error) {
      throw error;
    }
  }

  // Plans comptables par pays
  private getFrenchChartOfAccounts(): Array<{code: string, name: string, type: string}> {
    return [
      { code: '101000', name: 'Capital souscrit non appelé', type: 'equity' },
      { code: '104000', name: 'Primes liées au capital social', type: 'equity' },
      { code: '106000', name: 'Réserves', type: 'equity' },
      { code: '120000', name: 'Résultat de l\'exercice', type: 'equity' },
      { code: '401000', name: 'Fournisseurs', type: 'liability' },
      { code: '411000', name: 'Clients', type: 'asset' },
      { code: '445660', name: 'TVA déductible', type: 'asset' },
      { code: '445710', name: 'TVA collectée', type: 'liability' },
      { code: '512000', name: 'Banques', type: 'asset' },
      { code: '530000', name: 'Caisse', type: 'asset' },
      { code: '606000', name: 'Achats non stockés de matières et fournitures', type: 'expense' },
      { code: '707000', name: 'Ventes de marchandises', type: 'revenue' }
    ];
  }

  private getSYSCOHADAChartOfAccounts(): Array<{code: string, name: string, type: string}> {
    return [
      { code: '101', name: 'Capital social', type: 'equity' },
      { code: '106', name: 'Réserves', type: 'equity' },
      { code: '121', name: 'Résultat de l\'exercice', type: 'equity' },
      { code: '401', name: 'Fournisseurs, dettes en compte', type: 'liability' },
      { code: '411', name: 'Clients', type: 'asset' },
      { code: '443', name: 'État, TVA facturée', type: 'liability' },
      { code: '445', name: 'État, TVA récupérable', type: 'asset' },
      { code: '521', name: 'Banques locales', type: 'asset' },
      { code: '571', name: 'Caisse', type: 'asset' },
      { code: '601', name: 'Achats de marchandises', type: 'expense' },
      { code: '701', name: 'Ventes de marchandises', type: 'revenue' }
    ];
  }

  private getBelgianChartOfAccounts(): Array<{code: string, name: string, type: string}> {
    return [
      { code: '100', name: 'Capital', type: 'equity' },
      { code: '130', name: 'Réserves', type: 'equity' },
      { code: '140', name: 'Bénéfice reporté', type: 'equity' },
      { code: '400', name: 'Fournisseurs', type: 'liability' },
      { code: '411', name: 'Clients', type: 'asset' },
      { code: '451', name: 'TVA à récupérer', type: 'asset' },
      { code: '452', name: 'TVA à payer', type: 'liability' },
      { code: '550', name: 'Banques', type: 'asset' },
      { code: '570', name: 'Caisse', type: 'asset' },
      { code: '600', name: 'Achats', type: 'expense' },
      { code: '700', name: 'Chiffre d\'affaires', type: 'revenue' }
    ];
  }

  private getBasicChartOfAccounts(): Array<{code: string, name: string, type: string}> {
    return [
      { code: '1000', name: 'Assets', type: 'asset' },
      { code: '2000', name: 'Liabilities', type: 'liability' },
      { code: '3000', name: 'Equity', type: 'equity' },
      { code: '4000', name: 'Revenue', type: 'revenue' },
      { code: '5000', name: 'Expenses', type: 'expense' }
    ];
  }

  // Réinitialiser la configuration (pour les tests ou changement)
  resetConfig(): void {
    localStorage.removeItem('casskai_config');
    this.config = null;
    this.supabaseClient = null;
  }

  // Exporter la configuration (pour backup)
  exportConfig(): string {
    const config = this.getConfig();
    if (!config) {
      throw new Error('Aucune configuration à exporter');
    }
    
    // Ne pas inclure les clés sensibles dans l'export
    const exportConfig = {
      ...config,
      supabase: {
        ...config.supabase,
        anonKey: '***MASKED***'
      }
    };
    
    return JSON.stringify(exportConfig, null, 2);
  }
}

export default ConfigService;
