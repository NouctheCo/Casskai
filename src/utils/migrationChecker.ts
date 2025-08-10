// src/utils/migrationChecker.ts
import { supabase } from '../lib/supabase';

export interface MigrationStatus {
  isConnected: boolean;
  hasRequiredTables: boolean;
  hasRequiredFunctions: boolean;
  hasDefaultData: boolean;
  missingTables: string[];
  missingFunctions: string[];
  missingData: string[];
  overallStatus: 'success' | 'warning' | 'error';
  message: string;
}

export class MigrationChecker {
  private requiredTables = [
    'companies',
    'user_companies', 
    'roles',
    'permissions',
    'role_permissions',
    'accounts',
    'journals',
    'journal_entries',
    'journal_entry_items',
    'bank_accounts',
    'bank_transactions',
    'third_parties',
    'currencies',
    'exchange_rates',
    'audit_logs'
  ];

  private requiredFunctions = [
    'get_dashboard_stats',
    'get_balance_sheet',
    'get_income_statement',
    'get_cash_flow_data',
    'validate_journal_entry_balance',
    'create_company_with_defaults',
    'validate_accounting_data',
    'recalculate_all_account_balances'
  ];

  private requiredData = [
    { table: 'currencies', minCount: 5 },
    { table: 'permissions', minCount: 10 },
    { table: 'roles', minCount: 3 }
  ];

  /**
   * Vérifie le statut complet des migrations
   */
  async checkMigrationStatus(): Promise<MigrationStatus> {
    console.log('🔍 Vérification du statut des migrations...');

    const status: MigrationStatus = {
      isConnected: false,
      hasRequiredTables: false,
      hasRequiredFunctions: false,
      hasDefaultData: false,
      missingTables: [],
      missingFunctions: [],
      missingData: [],
      overallStatus: 'error',
      message: ''
    };

    try {
      // 1. Test de connexion
      console.log('📡 Test de connexion à Supabase...');
      const connectionTest = await this.testConnection();
      status.isConnected = connectionTest.success;
      
      if (!status.isConnected) {
        status.message = `Erreur de connexion: ${connectionTest.error}`;
        return status;
      }

      // 2. Vérification des tables
      console.log('🗄️ Vérification des tables...');
      const tablesCheck = await this.checkRequiredTables();
      status.hasRequiredTables = tablesCheck.allPresent;
      status.missingTables = tablesCheck.missing;

      // 3. Vérification des fonctions
      console.log('⚙️ Vérification des fonctions...');
      const functionsCheck = await this.checkRequiredFunctions();
      status.hasRequiredFunctions = functionsCheck.allPresent;
      status.missingFunctions = functionsCheck.missing;

      // 4. Vérification des données par défaut
      console.log('📊 Vérification des données par défaut...');
      const dataCheck = await this.checkRequiredData();
      status.hasDefaultData = dataCheck.allPresent;
      status.missingData = dataCheck.missing;

      // 5. Déterminer le statut global
      if (status.hasRequiredTables && status.hasRequiredFunctions && status.hasDefaultData) {
        status.overallStatus = 'success';
        status.message = '✅ Toutes les migrations sont appliquées avec succès';
      } else if (status.hasRequiredTables) {
        status.overallStatus = 'warning';
        status.message = '⚠️ Migrations partiellement appliquées';
      } else {
        status.overallStatus = 'error';
        status.message = '❌ Migrations manquantes - Veuillez appliquer les migrations';
      }

      return status;

    } catch (error) {
      console.error('❌ Erreur lors de la vérification des migrations:', error);
      status.message = `Erreur de vérification: ${error.message}`;
      return status;
    }
  }

  /**
   * Test de connexion de base
   */
  private async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('_health_check').select('*').limit(1);
      
      // Si l'erreur est "table doesn't exist", c'est OK - la connexion fonctionne
      if (error && error.code === 'PGRST116') {
        return { success: true };
      }
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifie la présence des tables requises
   */
  private async checkRequiredTables(): Promise<{ allPresent: boolean; missing: string[] }> {
    const missing: string[] = [];

    for (const tableName of this.requiredTables) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1);
        
        if (error && error.code === 'PGRST116') {
          // Table n'existe pas
          missing.push(tableName);
        } else if (error && !error.code) {
          // Autre erreur (permissions, etc.) - on considère que la table existe
          console.warn(`Table ${tableName}: ${error.message}`);
        }
      } catch (error) {
        missing.push(tableName);
      }
    }

    return {
      allPresent: missing.length === 0,
      missing
    };
  }

  /**
   * Vérifie la présence des fonctions RPC requises
   */
  private async checkRequiredFunctions(): Promise<{ allPresent: boolean; missing: string[] }> {
    const missing: string[] = [];

    for (const functionName of this.requiredFunctions) {
      try {
        // Test avec des paramètres valides mais inoffensifs
        const testParams = this.getTestParamsForFunction(functionName);
        const { error } = await supabase.rpc(functionName, testParams);
        
        if (error && error.message?.includes(`function ${functionName}`)) {
          missing.push(functionName);
        }
      } catch (error) {
        if (error.message?.includes(`function ${functionName}`)) {
          missing.push(functionName);
        }
      }
    }

    return {
      allPresent: missing.length === 0,
      missing
    };
  }

  /**
   * Vérifie la présence des données par défaut
   */
  private async checkRequiredData(): Promise<{ allPresent: boolean; missing: string[] }> {
    const missing: string[] = [];

    for (const dataCheck of this.requiredData) {
      try {
        const { count, error } = await supabase
          .from(dataCheck.table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          missing.push(`${dataCheck.table} (error: ${error.message})`);
        } else if ((count || 0) < dataCheck.minCount) {
          missing.push(`${dataCheck.table} (${count}/${dataCheck.minCount})`);
        }
      } catch (error) {
        missing.push(`${dataCheck.table} (exception)`);
      }
    }

    return {
      allPresent: missing.length === 0,
      missing
    };
  }

  /**
   * Obtient les paramètres de test pour une fonction RPC
   */
  private getTestParamsForFunction(functionName: string): Record<string, any> {
    const dummyUuid = '00000000-0000-0000-0000-000000000000';
    
    switch (functionName) {
      case 'get_dashboard_stats':
        return { p_company_id: dummyUuid };
      case 'get_balance_sheet':
        return { p_company_id: dummyUuid };
      case 'get_income_statement':
        return { p_company_id: dummyUuid };
      case 'get_cash_flow_data':
        return { p_company_id: dummyUuid };
      case 'validate_journal_entry_balance':
        return { p_journal_entry_id: dummyUuid };
      case 'create_company_with_defaults':
        return { 
          p_user_id: dummyUuid, 
          p_company_name: 'test',
          p_country: 'FR',
          p_currency: 'EUR',
          p_accounting_standard: 'PCG'
        };
      case 'validate_accounting_data':
        return { p_company_id: dummyUuid };
      case 'recalculate_all_account_balances':
        return { p_company_id: dummyUuid };
      default:
        return {};
    }
  }

  /**
   * Affiche un rapport détaillé dans la console
   */
  logDetailedReport(status: MigrationStatus): void {
    console.log('📋 === RAPPORT DE MIGRATION CASSKAI ===');
    console.log(`🔗 Connexion: ${status.isConnected ? '✅' : '❌'}`);
    console.log(`🗄️ Tables: ${status.hasRequiredTables ? '✅' : '❌'}`);
    console.log(`⚙️ Fonctions: ${status.hasRequiredFunctions ? '✅' : '❌'}`);
    console.log(`📊 Données: ${status.hasDefaultData ? '✅' : '❌'}`);
    
    if (status.missingTables.length > 0) {
      console.log('❌ Tables manquantes:', status.missingTables);
    }
    
    if (status.missingFunctions.length > 0) {
      console.log('❌ Fonctions manquantes:', status.missingFunctions);
    }
    
    if (status.missingData.length > 0) {
      console.log('❌ Données manquantes:', status.missingData);
    }
    
    console.log(`📊 Statut global: ${status.overallStatus.toUpperCase()}`);
    console.log(`💬 Message: ${status.message}`);
    console.log('=====================================');
  }

  /**
   * Vérifie et affiche le statut des migrations
   */
  async checkAndReport(): Promise<MigrationStatus> {
    const status = await this.checkMigrationStatus();
    this.logDetailedReport(status);
    return status;
  }

  /**
   * Vérifie seulement si l'environnement est prêt (version légère)
   */
  async isEnvironmentReady(): Promise<boolean> {
    try {
      const { isConnected } = await this.checkMigrationStatus();
      return isConnected;
    } catch {
      return false;
    }
  }
}

// Instance singleton
export const migrationChecker = new MigrationChecker();

// Export des fonctions utilitaires
export const checkMigrations = () => migrationChecker.checkAndReport();
export const isSupabaseReady = () => migrationChecker.isEnvironmentReady();
