// src/utils/migration.ts - Version corrigée

import React from 'react';
import ConfigService from '../services/configService';
import { AppConfig } from '../types/config';
import { APP_VERSION } from './constants';
import { supabase } from '../lib/supabase';

export class ConfigMigration {
  private configService = ConfigService.getInstance();

  /**
   * Migrer depuis l'ancienne configuration hardcodée vers la nouvelle configuration dynamique
   */
  async migrateFromHardcodedConfig(): Promise<boolean> {
    try {
      console.log('🔄 Début de la migration de configuration...');

      // Vérifier si une configuration existe déjà
      if (this.configService.isConfigured()) {
        console.log('✅ Configuration dynamique déjà présente, migration non nécessaire');
        return true;
      }

      // Récupérer les variables d'environnement existantes
      const existingConfig = this.extractEnvConfig();
      if (!existingConfig) {
        console.log('ℹ️  Aucune configuration existante trouvée, configuration manuelle requise');
        return false;
      }

      // Créer la nouvelle configuration
      const newConfig = await this.createNewConfig(existingConfig);
      
      // Valider la configuration
      const isValid = await this.configService.validateSupabaseConfig(
        newConfig.supabase.url,
        newConfig.supabase.anonKey
      );

      if (!isValid) {
        console.error('❌ Configuration Supabase invalide');
        return false;
      }

      // Sauvegarder la nouvelle configuration
      await this.configService.saveConfig(newConfig);
      
      console.log('✅ Migration terminée avec succès!');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      return false;
    }
  }

  /**
   * Extraire la configuration depuis les variables d'environnement
   */
  private extractEnvConfig(): { url: string; anonKey: string } | null {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return null;
    }

    return { url, anonKey };
  }

  /**
   * Créer la nouvelle configuration
   */
  private async createNewConfig(envConfig: { url: string; anonKey: string }): Promise<AppConfig> {
    const config: AppConfig = {
      supabase: {
        url: envConfig.url,
        anonKey: envConfig.anonKey,
        validated: true
      },
      company: {
        id: 'default-id',
        accountingStandard: 'SYSCOHADA',
        name: 'Default Company',
        country: 'Default Country',
        currency: 'USD',
        timezone: 'UTC',
        fiscalYearStart: '2025-01-01'
      },
      setupCompleted: false, // L'utilisateur devra compléter le setup
      setupDate: new Date().toISOString(),
      version: APP_VERSION
    };

    return config;
  }

  // ✅ CORRECTION: Fonction supprimée car inutilisée
  // private detectCountryFromUrl(url: string): string | null { ... }

  /**
   * Nettoyer l'ancienne configuration
   */
  async cleanupOldConfig(): Promise<void> {
    // Supprimer les anciennes clés de localStorage si elles existent
    const oldKeys = [
      'supabase_session',
      'supabase_auth_token',
      'app_settings'
    ];

    oldKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Suppression de l'ancienne clé: ${key}`);
      }
    });
  }

  /**
   * Vérifier la compatibilité de la base de données
   */
  async checkDatabaseCompatibility(): Promise<{
    isCompatible: boolean;
    missingTables: string[];
    suggestedActions: string[];
  }> {
    try {
      // ✅ CORRECTION: Vérification du client
      if (!supabase) {
        return {
          isCompatible: false,
          missingTables: [],
          suggestedActions: ['Vérifier la connexion à la base de données']
        };
      }

      const missingTables: string[] = [];
      const suggestedActions: string[] = [];

      // Tables requises
      const requiredTables = [
        'companies',
        'user_profiles',
        'accounts',
        'journal_entries',
        'journal_lines'
      ];

      // Vérifier chaque table
      for (const table of requiredTables) {
        try {
          const { error } = await supabase.from(table).select('*').limit(1);
          if (error && error.code === 'PGRST116') {
            missingTables.push(table);
          }
        } catch (error) {
          missingTables.push(table);
        }
      }

      // Générer les actions suggérées
      if (missingTables.length > 0) {
        suggestedActions.push('Exécuter les migrations de base de données');
        suggestedActions.push('Initialiser le schéma de base');
        if (missingTables.includes('companies')) {
          suggestedActions.push('Créer la première entreprise');
        }
      }

      return {
        isCompatible: missingTables.length === 0,
        missingTables,
        suggestedActions
      };

    } catch (error) {
      return {
        isCompatible: false,
        missingTables: [],
        suggestedActions: ['Vérifier la connexion à la base de données']
      };
    }
  }

  /**
   * Exporter la configuration pour backup
   */
  async exportConfigForBackup(): Promise<string> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error('Aucune configuration à exporter');
    }

    const backupData = {
      exported_at: new Date().toISOString(),
      app_version: APP_VERSION,
      config: {
        ...config,
        supabase: {
          ...config.supabase,
          anonKey: '***MASKED***' // Masquer la clé pour la sécurité
        }
      }
    };

    return JSON.stringify(backupData, null, 2);
  }

  /**
   * Guide de migration pour l'utilisateur
   */
  getMigrationGuide(): string[] {
    return [
      '1. Sauvegardez votre base de données actuelle',
      '2. Vérifiez que vos credentials Supabase sont corrects',
      '3. Lancez la migration automatique ou manuelle',
      '4. Complétez la configuration de votre entreprise',
      '5. Testez les fonctionnalités principales',
      '6. Supprimez les anciens fichiers de configuration'
    ];
  }
}

// Instance singleton
export const configMigration = new ConfigMigration();

// Hook pour utiliser la migration dans React
export const useMigration = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runMigration = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await configMigration.migrateFromHardcodedConfig();
      if (!success) {
        setError('Migration échouée');
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de migration');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    runMigration,
    isLoading,
    error
  };
};