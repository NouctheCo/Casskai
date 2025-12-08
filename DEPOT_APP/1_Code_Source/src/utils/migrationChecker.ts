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

    'journal_entry_lines',

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

    const status: MigrationStatus = {

      isConnected: false,

      hasRequiredTables: false,

      hasRequiredFunctions: false,

      hasDefaultData: false,

      missingTables: [],

      missingFunctions: [],

      missingData: [],

      overallStatus: 'error',

      message: '',

    };



    try {

      // 1. Test de connexion

      const connectionTest = await this.testConnection();

      status.isConnected = connectionTest.success;



      if (!status.isConnected) {

        status.message = `Erreur de connexion: ${connectionTest.error || 'inconnue'}`;

        return status;

      }



      // 2. Vérifications en parallèle

      const [tablesCheck, functionsCheck, dataCheck] = await Promise.all([

        this.checkRequiredTables(),

        this.checkRequiredFunctions(),

        this.checkRequiredData(),

      ]);



      status.hasRequiredTables = tablesCheck.allPresent;

      status.missingTables = tablesCheck.missing;

      status.hasRequiredFunctions = functionsCheck.allPresent;

      status.missingFunctions = functionsCheck.missing;

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

      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      console.error('❌ Erreur lors de la vérification des migrations:', errorMessage);

      status.message = `Erreur de vérification: ${errorMessage}`;

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

        return { success: false, error: error instanceof Error ? error.message : String(error) };

      }

      

      return { success: true };

    } catch (error) {

      return { success: false, error: error instanceof Error ? error.message : String(error) };

    }

  }



  /**

   * Vérifie la présence des tables requises

   */

  private async checkRequiredTables(): Promise<{ allPresent: boolean; missing: string[] }> {

    const checks = this.requiredTables.map(async (tableName) => {

      try {

        const { error } = await supabase.from(tableName).select('*', { head: true, count: 'exact' });

        if (error && error.code === 'PGRST116') {

          return tableName; // La table n'existe pas

        }

        if (error) {

          console.warn(`Avertissement pour la table ${tableName}: ${error.message}`);

        }

        return null; // La table existe

      } catch {

        return tableName;

      }

    });



    const missing = (await Promise.all(checks)).filter((t): t is string => t !== null);

    return {

      allPresent: missing.length === 0,

      missing,

    };

  }



  /**

   * Vérifie la présence des fonctions RPC requises

   */

  private async checkRequiredFunctions(): Promise<{ allPresent: boolean; missing: string[] }> {

    const checks = this.requiredFunctions.map(async (functionName) => {

      try {

        const testParams = this.getTestParamsForFunction(functionName);

        const { error } = await supabase.rpc(functionName, testParams);

        if (error && error.message?.includes(`function "${functionName}" does not exist`)) {

          return functionName;

        }

        return null;

      } catch (error) {

        if (error instanceof Error && error.message?.includes(`function "${functionName}" does not exist`)) {

          return functionName;

        }

        return null;

      }

    });



    const missing = (await Promise.all(checks)).filter((f): f is string => f !== null);

    return {

      allPresent: missing.length === 0,

      missing,

    };

  }



  /**

   * Vérifie la présence des données par défaut

   */

  private async checkRequiredData(): Promise<{ allPresent: boolean; missing: string[] }> {

    const checks = this.requiredData.map(async (dataCheck) => {

      try {

        const { count, error } = await supabase

          .from(dataCheck.table)

          .select('*', { count: 'exact', head: true });



        if (error) {

          return `${dataCheck.table} (erreur: ${error.message})`;

        }

        if ((count || 0) < dataCheck.minCount) {

          return `${dataCheck.table} (données insuffisantes: ${count}/${dataCheck.minCount})`;

        }

        return null;

      } catch {

        return `${dataCheck.table} (exception)`;

      }

    });



    const missing = (await Promise.all(checks)).filter((d): d is string => d !== null);

    return {

      allPresent: missing.length === 0,

      missing,

    };

  }



  /**

   * Obtient les paramètres de test pour une fonction RPC

   */

  private getTestParamsForFunction(functionName: string): Record<string, unknown> {

    const dummyUuid = '00000000-0000-0000-0000-000000000000';

    

    switch (functionName) {

      case 'get_dashboard_stats': case 'get_balance_sheet': case 'get_income_statement': case 'get_cash_flow_data': case 'validate_accounting_data': case 'recalculate_all_account_balances':

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

        

      default:

        return {};

    }

  }



  /**

   * Affiche un rapport détaillé dans la console

   */

  logDetailedReport(status: MigrationStatus): void {

    const {

      isConnected,

      hasRequiredTables,

      hasRequiredFunctions,

      hasDefaultData,

      missingTables,

      missingFunctions,

      missingData,

      overallStatus,

      message,

    } = status;



    const report = [

      '📋 === RAPPORT DE MIGRATION CASSKAI ===',

      `🔗 Connexion: ${isConnected ? '✅' : '❌'}`,

      `🗄️ Tables: ${hasRequiredTables ? '✅' : '❌'}`,

      `⚙️ Fonctions: ${hasRequiredFunctions ? '✅' : '❌'}`,

      `📊 Données: ${hasDefaultData ? '✅' : '❌'}`,

    ];



    if (missingTables.length > 0) {

      report.push(`❌ Tables manquantes: ${missingTables.join(', ')}`);

    }

    if (missingFunctions.length > 0) {

      report.push(`❌ Fonctions manquantes: ${missingFunctions.join(', ')}`);

    }

    if (missingData.length > 0) {

      report.push(`❌ Données manquantes: ${missingData.join(', ')}`);

    }



    report.push(`📊 Statut global: ${overallStatus.toUpperCase()}`);

    report.push(`💬 Message: ${message}`);

    report.push('=====================================');



    if (overallStatus === 'error') {

      console.error(report.join('\n'));

    } else {

      console.warn(report.join('\n'));

    }

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
