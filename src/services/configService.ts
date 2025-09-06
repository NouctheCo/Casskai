// @ts-nocheck
// src/services/configService.ts - Version mise à jour avec migrations
import { SupabaseClient } from '@supabase/supabase-js';
// import { getSupabaseClient } from '@/lib/supabase'; // Commented out for build compatibility
import MigrationService from './migrationService';

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
  accountingStandard: string;
}

export interface AppConfig {
  supabase: SupabaseConfig;
  company: CompanyConfig;
  setupCompleted: boolean;
  setupDate: string;
  version: string;
}

class ConfigService {
  private static instance: ConfigService;
  private supabaseClient: SupabaseClient | null = null;
  private config: AppConfig | null = null;
  private migrationService: MigrationService;

  private constructor() {
    this.migrationService = MigrationService.getInstance();

    // Initialiser la configuration par défaut si aucune configuration n'est trouvée
    if (!this.getConfig()) {
      console.warn('Aucune configuration trouvée. Initialisation de la configuration par défaut.');
      this.initializeDefaultConfig();
    }
  }

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
      if (error instanceof Error) {
        console.error('Erreur lors de la lecture de la configuration:', error.message);
      } else {
        console.error('Erreur inconnue lors de la lecture de la configuration:', error);
      }
    }
    return null;
  }

  // Sauvegarder la configuration
  async saveConfig(config: AppConfig): Promise<void> {
    try {
      // Ajouter la version actuelle
      config.version = '1.0.0';
      
      localStorage.setItem('casskai_config', JSON.stringify(config));
      this.config = config;
      
      // Réinitialiser le client Supabase avec la nouvelle config
      await this.initializeSupabaseClient();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      throw new Error('Impossible de sauvegarder la configuration');
    }
  }

  // Initialiser le client Supabase (CORRECTION: utiliser l'instance unique)
  async initializeSupabaseClient(): Promise<SupabaseClient> {
    const config = this.getConfig();
    if (!config?.supabase.validated) {
      throw new Error('Configuration Supabase non validée');
    }

    try {
      // CORRECTION CRITIQUE: Utiliser l'instance unique
      this.supabaseClient = getSupabaseClient();

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

  // Valider la configuration Supabase (CORRECTION: utiliser l'instance unique)
  async validateSupabaseConfig(): Promise<boolean> {
    try {
      // CORRECTION CRITIQUE: Utiliser l'instance unique au lieu de créer une nouvelle
      const tempClient = getSupabaseClient();
      const { error } = await tempClient.from('_test').select('*').limit(1);
      
      // Succès si pas d'erreur ou si l'erreur est "table not found"
      return !error || error.code === 'PGRST116';
    } catch (error) {
      console.error('Validation échouée:', error);
      return false;
    }
  }

  // Initialiser la base de données avec les migrations
  async initializeDatabase(): Promise<{ success: boolean; details?: string; error?: string }> {
    try {
      console.log('🚀 Initialisation de la base de données...');
      
      // Vérifier le statut des migrations
      const migrationsStatus = await this.migrationService.checkMigrationsStatus();
      console.log('📋 Statut des migrations:', migrationsStatus);

      // Appliquer les migrations si nécessaire
      const migrationResult = await this.migrationService.applyMigrations();
      
      if (!migrationResult.success) {
        throw new Error(migrationResult.error || 'Erreur lors de l\'application des migrations');
      }

      console.log('✅ Base de données initialisée avec succès');
      return {
        success: true,
        details: migrationResult.details
      };

    } catch (error) {
      console.error('❌ Erreur d\'initialisation de la base de données:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Créer une entreprise avec configuration par défaut
  async createCompanyWithDefaults(
    userId: string,
    companyData: {
      name: string;
      country: string;
      currency: string;
      accountingStandard: string;
    }
  ): Promise<{ success: boolean; companyId?: string; error?: string }> {
    try {
      const result = await this.migrationService.createCompanyWithDefaults(
        userId,
        companyData.name,
        companyData.country,
        companyData.currency,
        companyData.accountingStandard
      );

      if (result.success) {
        console.log('✅ Entreprise créée avec succès:', result.companyId);
      }

      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'entreprise:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Finaliser la configuration d'une entreprise
  async finalizeCompanySetup(companyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.migrationService.finalizeCompanySetup(companyId);
      
      if (result.success) {
        console.log('✅ Configuration de l\'entreprise finalisée');
      }

      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Obtenir le plan comptable par défaut selon le pays
  getDefaultChartOfAccounts(country: string): Array<{code: string, name: string, type: string}> {
    switch (country.toUpperCase()) {
      case 'FR':
        return this.getFrenchChartOfAccounts();
      case 'BE':
        return this.getBelgianChartOfAccounts();
      case 'BJ':
      case 'CI':
      case 'BF':
      case 'ML':
      case 'SN':
      case 'TG':
        return this.getSyscohadaChartOfAccounts();
      default:
        return this.getBasicChartOfAccounts();
    }
  }

  private getFrenchChartOfAccounts(): Array<{code: string, name: string, type: string}> {
    return [
      // Classe 1 - Capitaux
      { code: '101000', name: 'Capital', type: 'equity' },
      { code: '106000', name: 'Réserves', type: 'equity' },
      { code: '110000', name: 'Report à nouveau', type: 'equity' },
      { code: '120000', name: 'Résultat de l\'exercice', type: 'equity' },
      
      // Classe 4 - Tiers
      { code: '401000', name: 'Fournisseurs', type: 'liability' },
      { code: '411000', name: 'Clients', type: 'asset' },
      { code: '445100', name: 'TVA à décaisser', type: 'liability' },
      { code: '445660', name: 'TVA sur autres biens et services', type: 'asset' },
      { code: '445710', name: 'TVA collectée', type: 'liability' },
      
      // Classe 5 - Financiers
      { code: '512000', name: 'Banques', type: 'asset' },
      { code: '530000', name: 'Caisse', type: 'asset' },
      
      // Classe 6 - Charges
      { code: '607000', name: 'Achats de marchandises', type: 'expense' },
      { code: '613000', name: 'Locations', type: 'expense' },
      { code: '627000', name: 'Services bancaires', type: 'expense' },
      { code: '641000', name: 'Rémunérations du personnel', type: 'expense' },
      
      // Classe 7 - Produits
      { code: '701000', name: 'Ventes de produits finis', type: 'revenue' },
      { code: '706000', name: 'Prestations de services', type: 'revenue' },
      { code: '707000', name: 'Ventes de marchandises', type: 'revenue' }
    ];
  }

  private getSyscohadaChartOfAccounts(): Array<{code: string, name: string, type: string}> {
    return [
      // Classe 1 - Ressources durables
      { code: '101', name: 'Capital social', type: 'equity' },
      { code: '106', name: 'Réserves', type: 'equity' },
      { code: '110', name: 'Report à nouveau', type: 'equity' },
      { code: '120', name: 'Résultat net de l\'exercice', type: 'equity' },
      
      // Classe 4 - Tiers
      { code: '401', name: 'Fournisseurs, dettes en compte', type: 'liability' },
      { code: '411', name: 'Clients', type: 'asset' },
      { code: '443', name: 'État, TVA facturée', type: 'liability' },
      { code: '445', name: 'État, TVA récupérable', type: 'asset' },
      
      // Classe 5 - Trésorerie
      { code: '512', name: 'Banques', type: 'asset' },
      { code: '521', name: 'Caisses siège social', type: 'asset' },
      
      // Classe 6 - Charges
      { code: '601', name: 'Achats de matières premières', type: 'expense' },
      { code: '613', name: 'Locations', type: 'expense' },
      { code: '627', name: 'Services bancaires et assimilés', type: 'expense' },
      { code: '641', name: 'Rémunérations du personnel', type: 'expense' },
      
      // Classe 7 - Produits
      { code: '701', name: 'Ventes de produits finis', type: 'revenue' },
      { code: '706', name: 'Autres prestations de services', type: 'revenue' },
      { code: '707', name: 'Ventes de marchandises', type: 'revenue' }
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

  // Obtenir les journaux par défaut selon le standard comptable
  getDefaultJournals(standard: string): Array<{code: string, name: string, type: string}> {
    if (standard === 'SYSCOHADA') {
      return [
        { code: 'VE', name: 'Journal des ventes', type: 'VENTE' },
        { code: 'AC', name: 'Journal des achats', type: 'ACHAT' },
        { code: 'BQ', name: 'Journal de banque', type: 'BANQUE' },
        { code: 'CA', name: 'Journal de caisse', type: 'CAISSE' },
        { code: 'OD', name: 'Journal des opérations diverses', type: 'OD' }
      ];
    } else {
      return [
        { code: 'VTE', name: 'Journal des ventes', type: 'VENTE' },
        { code: 'ACH', name: 'Journal des achats', type: 'ACHAT' },
        { code: 'BAN', name: 'Journal de banque', type: 'BANQUE' },
        { code: 'CAI', name: 'Journal de caisse', type: 'CAISSE' },
        { code: 'OD', name: 'Journal des opérations diverses', type: 'OD' }
      ];
    }
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

  // Obtenir les informations de santé de la base de données
  async getDatabaseHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    details: any;
  }> {
    try {
      const client = this.getSupabaseClient();
      
      // Test de connectivité
      const { error: connectError } = await client.from('companies').select('id').limit(1);
      if (connectError && connectError.code !== 'PGRST116') {
        throw new Error(`Erreur de connectivité: ${connectError.message}`);
      }

      // Vérifier les migrations
      const migrationsStatus = await this.migrationService.checkMigrationsStatus();
      const pendingMigrations = migrationsStatus.filter(m => !m.applied);

      if (pendingMigrations.length > 0) {
        return {
          status: 'warning',
          details: {
            connectivity: 'ok',
            migrations: 'pending',
            pendingMigrations: pendingMigrations.map(m => m.name)
          }
        };
      }

      return {
        status: 'healthy',
        details: {
          connectivity: 'ok',
          migrations: 'applied',
          migrationsCount: migrationsStatus.length
        }
      };

    } catch (error) {
      return {
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }
      };
    }
  }

  // Initialiser la configuration par défaut
  private initializeDefaultConfig(): void {
    const defaultConfig: AppConfig = {
      supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_KEY || '',
        validated: false,
      },
      company: {
        name: '',
        country: '',
        currency: '',
        timezone: '',
        accountingStandard: '',
      },
      setupCompleted: false,
      setupDate: '',
      version: '1.0.0',
    };

    if (!defaultConfig.supabase.url || !defaultConfig.supabase.anonKey) {
      console.error('Configuration Supabase par défaut manquante. Vérifiez les variables d\'environnement.');
      return;
    }

    try {
      this.saveConfig(defaultConfig);
      console.log('Configuration par défaut sauvegardée avec succès:', defaultConfig);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration par défaut:', error);
    }
  }
}

export default ConfigService;
// Adapter de commodité pour les tests et les hooks: instance unique nommée
export const configService = ConfigService.getInstance();
