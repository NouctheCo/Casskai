// src/services/migrationService.ts
import { supabase } from '../lib/supabase';

export interface MigrationResult {
  success: boolean;
  error?: string;
  migrationsApplied: number;
  details?: string;
}

export interface MigrationInfo {
  version: string;
  name: string;
  applied: boolean;
  appliedAt?: string;
}

class MigrationService {
  private static instance: MigrationService;

  private constructor() {}

  static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  /**
   * Vérifie si les migrations sont nécessaires
   */
  async checkMigrationsStatus(): Promise<MigrationInfo[]> {
    try {
      // Vérifier si la table companies existe
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'companies');

      if (tablesError) {
        console.error('Erreur lors de la vérification des tables:', tablesError);
        return [
          { version: '001', name: 'initial_schema', applied: false },
          { version: '002', name: 'default_data', applied: false },
          { version: '003', name: 'functions_and_triggers', applied: false },
        ];
      }

      const companiesTableExists = tablesData && tablesData.length > 0;

      // Vérifier si la fonction get_dashboard_stats existe
      const { data: functionsData, error: functionsError } = await supabase
        .rpc('get_dashboard_stats', { p_company_id: '00000000-0000-0000-0000-000000000000' })
        .then(() => ({ data: true, error: null }))
        .catch((error: any) => ({ data: false, error }));

      const functionsExist = !functionsError;

      // Vérifier si les devises par défaut existent
      const { data: currenciesData, error: currenciesError } = await supabase
        .from('currencies')
        .select('code')
        .limit(1);

      const defaultDataExists = !currenciesError && currenciesData && currenciesData.length > 0;

      return [
        { 
          version: '001', 
          name: 'initial_schema', 
          applied: companiesTableExists,
          appliedAt: companiesTableExists ? new Date().toISOString() : undefined
        },
        { 
          version: '002', 
          name: 'default_data', 
          applied: defaultDataExists,
          appliedAt: defaultDataExists ? new Date().toISOString() : undefined
        },
        { 
          version: '003', 
          name: 'functions_and_triggers', 
          applied: functionsExist,
          appliedAt: functionsExist ? new Date().toISOString() : undefined
        },
      ];
    } catch (error) {
      console.error('Erreur lors de la vérification des migrations:', error);
      return [
        { version: '001', name: 'initial_schema', applied: false },
        { version: '002', name: 'default_data', applied: false },
        { version: '003', name: 'functions_and_triggers', applied: false },
      ];
    }
  }

  /**
   * Applique les migrations manquantes
   */
  async applyMigrations(): Promise<MigrationResult> {
    try {
      console.log('🚀 Début de l\'application des migrations...');
      
      const migrationsStatus = await this.checkMigrationsStatus();
      const pendingMigrations = migrationsStatus.filter(m => !m.applied);
      
      if (pendingMigrations.length === 0) {
        return {
          success: true,
          migrationsApplied: 0,
          details: 'Toutes les migrations sont déjà appliquées'
        };
      }

      let appliedCount = 0;

      // Appliquer les migrations dans l'ordre
      for (const migration of pendingMigrations) {
        console.log(`📋 Application de la migration ${migration.version}: ${migration.name}`);
        
        try {
          switch (migration.version) {
            case '001':
              await this.applyInitialSchemaMigration();
              break;
            case '002':
              await this.applyDefaultDataMigration();
              break;
            case '003':
              await this.applyFunctionsAndTriggersMigration();
              break;
            default:
              console.warn(`Migration inconnue: ${migration.version}`);
              continue;
          }
          
          appliedCount++;
          console.log(`✅ Migration ${migration.version} appliquée avec succès`);
          
        } catch (migrationError) {
          console.error(`❌ Erreur lors de l'application de la migration ${migration.version}:`, migrationError);
          if (migrationError instanceof Error) {
            throw new Error(`Migration ${migration.version} échouée: ${migrationError.message}`);
          } else {
            throw new Error(`Migration ${migration.version} échouée: ${JSON.stringify(migrationError)}`);
          }
        }
      }

      return {
        success: true,
        migrationsApplied: appliedCount,
        details: `${appliedCount} migration(s) appliquée(s) avec succès`
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'application des migrations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        migrationsApplied: 0
      };
    }
  }

  /**
   * Applique la migration du schéma initial
   */
  private async applyInitialSchemaMigration(): Promise<void> {
    // Note: Les migrations SQL doivent être appliquées via le CLI Supabase
    // Cette fonction vérifie si les tables principales existent
    const requiredTables = [
      'companies', 'user_companies', 'roles', 'permissions', 'role_permissions',
      'accounts', 'journals', 'journal_entries', 'journal_entry_items',
      'bank_accounts', 'bank_transactions', 'third_parties', 'currencies', 'exchange_rates'
    ];

    for (const tableName of requiredTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = table not found
        throw new Error(`Table ${tableName} non accessible: ${error.message}`);
      }
    }
  }

  /**
   * Applique la migration des données par défaut
   */
  private async applyDefaultDataMigration(): Promise<void> {
    // Vérifier et insérer les devises par défaut
    const { data: existingCurrencies } = await supabase
      .from('currencies')
      .select('code');

    if (!existingCurrencies || existingCurrencies.length === 0) {
      // Insérer les devises par défaut
      const defaultCurrencies = [
        { code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2 },
        { code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2 },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimal_places: 2 },
        { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'CFA', decimal_places: 0 },
        { code: 'XAF', name: 'CFA Franc BEAC', symbol: 'FCFA', decimal_places: 0 },
        { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', decimal_places: 2 },
      ];

      const { error: currencyError } = await supabase
        .from('currencies')
        .insert(defaultCurrencies);

      if (currencyError) {
        throw new Error(`Erreur lors de l'insertion des devises: ${currencyError.message}`);
      }
    }

    // Vérifier et insérer les permissions par défaut
    const { data: existingPermissions } = await supabase
      .from('permissions')
      .select('name');

    if (!existingPermissions || existingPermissions.length === 0) {
      const defaultPermissions = [
        { name: 'view_dashboard', description: 'Voir le tableau de bord', module: 'dashboard' },
        { name: 'manage_dashboard', description: 'Gérer le tableau de bord', module: 'dashboard' },
        { name: 'view_accounting', description: 'Voir la comptabilité', module: 'accounting' },
        { name: 'manage_accounting', description: 'Gérer la comptabilité', module: 'accounting' },
        { name: 'create_journal_entries', description: 'Créer des écritures', module: 'accounting' },
        { name: 'validate_journal_entries', description: 'Valider des écritures', module: 'accounting' },
        { name: 'manage_chart_of_accounts', description: 'Gérer le plan comptable', module: 'accounting' },
        { name: 'view_banking', description: 'Voir les comptes bancaires', module: 'banking' },
        { name: 'manage_banking', description: 'Gérer les comptes bancaires', module: 'banking' },
        { name: 'view_reports', description: 'Voir les rapports', module: 'reports' },
        { name: 'export_reports', description: 'Exporter les rapports', module: 'reports' },
        { name: 'view_forecasting', description: 'Voir les prévisions', module: 'forecasting' },
        { name: 'manage_forecasting', description: 'Gérer les prévisions', module: 'forecasting' },
        { name: 'view_third_parties', description: 'Voir les tiers', module: 'third_parties' },
        { name: 'manage_third_parties', description: 'Gérer les tiers', module: 'third_parties' },
        { name: 'manage_company_settings', description: 'Gérer les paramètres entreprise', module: 'settings' },
        { name: 'manage_company_users', description: 'Gérer les utilisateurs', module: 'settings' },
        { name: 'manage_company_roles', description: 'Gérer les rôles', module: 'settings' },
      ];

      const { error: permissionError } = await supabase
        .from('permissions')
        .insert(defaultPermissions);

      if (permissionError) {
        throw new Error(`Erreur lors de l'insertion des permissions: ${permissionError.message}`);
      }
    }

    // Vérifier et insérer les rôles par défaut
    const { data: existingRoles } = await supabase
      .from('roles')
      .select('name')
      .is('company_id', null);

    if (!existingRoles || existingRoles.length === 0) {
      const defaultRoles = [
        { name: 'super_admin', description: 'Super administrateur système', is_system_role: true },
        { name: 'admin', description: 'Administrateur d\'entreprise', is_system_role: true },
        { name: 'accountant', description: 'Comptable', is_system_role: true },
        { name: 'user', description: 'Utilisateur standard', is_system_role: true },
        { name: 'viewer', description: 'Consultation uniquement', is_system_role: true },
      ];

      const { error: roleError } = await supabase
        .from('roles')
        .insert(defaultRoles);

      if (roleError) {
        throw new Error(`Erreur lors de l'insertion des rôles: ${roleError.message}`);
      }
    }
  }

  /**
   * Applique la migration des fonctions et triggers
   */
  private async applyFunctionsAndTriggersMigration(): Promise<void> {
    // Vérifier que les fonctions RPC principales existent
    try {
      // Test de la fonction get_dashboard_stats
      await supabase.rpc('get_dashboard_stats', { 
        p_company_id: '00000000-0000-0000-0000-000000000000' 
      });
    } catch (error) {
      if (error instanceof Error && error.message?.includes('function get_dashboard_stats')) {
        throw new Error('Fonction get_dashboard_stats non trouvée. Appliquez la migration 003 via Supabase CLI.');
      }
    }

    // Vérifier que la vue account_balances existe
    const { error: viewError } = await supabase
      .from('account_balances')
      .select('*')
      .limit(1);

    if (viewError && viewError.code !== 'PGRST116') {
      throw new Error(`Vue account_balances non accessible: ${viewError.message}`);
    }
  }

  /**
   * Crée une entreprise avec le plan comptable par défaut
   */
  /**
   * Crée une entreprise avec le plan comptable par défaut
   */
  async createCompanyWithDefaults(
    userId: string,
    companyName: string,
    country: string = 'FR',
    currency: string = 'EUR',
    accountingStandard: string = 'PCG'
  ): Promise<{ success: boolean; companyId?: string; error?: string }> {
    try {
      // Utiliser la fonction RPC pour créer l'entreprise avec les données par défaut
      const { data, error } = await supabase.rpc('create_company_with_defaults', {
        p_user_id: userId,
        p_company_name: companyName,
        p_country: country,
        p_currency: currency,
        p_accounting_standard: accountingStandard
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        companyId: data
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'entreprise:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error)
      };
    }
  }

  /**
   * Finalise la configuration d'une entreprise
   */
  async finalizeCompanySetup(companyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('finalize_company_setup', {
        p_company_id: companyId
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error)
      };
    }
  }

  /**
   * Valide les données comptables d'une entreprise
   */
  async validateAccountingData(companyId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('validate_accounting_data', {
        p_company_id: companyId
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error)
      };
    }
  }

  /**
   * Recalcule tous les soldes des comptes
   */
  async recalculateAccountBalances(companyId: string): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('recalculate_all_account_balances', {
        p_company_id: companyId
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        updatedCount: data
      };
    } catch (error) {
      console.error('Erreur lors du recalcul:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : JSON.stringify(error)
      };
    }
  }
}

export default MigrationService;
