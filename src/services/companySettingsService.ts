import React from 'react';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { 
  CompanySettings, 
  CompanyRow, 
  CompanyUpdate,
  mapRowToSettings, 
  mapSettingsToUpdate,
  DEFAULT_COMPANY_SETTINGS 
} from '@/types/company-settings.types';

/**
 * Service dédié à la gestion des paramètres d'entreprise
 * Fournit une interface simple pour CRUD sur les settings
 */
export class CompanySettingsService {
  
  /**
   * Récupère les paramètres d'une entreprise
   */
  static async getCompanySettings(companyId: string): Promise<CompanySettings> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      if (!data) {
        throw new Error('Entreprise non trouvée');
      }

      return mapRowToSettings(data as CompanyRow);
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Met à jour les paramètres d'une entreprise (mise à jour partielle)
   */
  static async updateCompanySettings(
    companyId: string, 
    settings: Partial<CompanySettings>
  ): Promise<CompanySettings> {
    try {
      // Conversion des settings en format DB
      const updateData = mapSettingsToUpdate(settings);
      
      // Ajout de la date de mise à jour
      updateData.updated_at = new Date().toISOString();
      
      // Si on marque les settings comme complétés
      if (settings.metadata?.settingsCompletedAt) {
        updateData.settings_completed_at = settings.metadata.settingsCompletedAt.toISOString();
      }

      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      if (!data) {
        throw new Error('Échec de la mise à jour des paramètres');
      }

      return mapRowToSettings(data as CompanyRow);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Met à jour une section spécifique des paramètres
   */
  static async updateSettingsSection(
    companyId: string,
    section: keyof CompanySettings,
    sectionData: any
  ): Promise<CompanySettings> {
    const partialSettings: Partial<CompanySettings> = {
      [section]: sectionData
    };

    return this.updateCompanySettings(companyId, partialSettings);
  }

  /**
   * Met à jour les informations générales
   */
  static async updateGeneralInfo(
    companyId: string,
    generalInfo: CompanySettings['generalInfo']
  ): Promise<CompanySettings> {
    return this.updateSettingsSection(companyId, 'generalInfo', generalInfo);
  }

  /**
   * Met à jour les informations de contact
   */
  static async updateContactInfo(
    companyId: string,
    contact: CompanySettings['contact']
  ): Promise<CompanySettings> {
    return this.updateSettingsSection(companyId, 'contact', contact);
  }

  /**
   * Met à jour les paramètres comptables
   */
  static async updateAccountingSettings(
    companyId: string,
    accounting: CompanySettings['accounting']
  ): Promise<CompanySettings> {
    return this.updateSettingsSection(companyId, 'accounting', accounting);
  }

  /**
   * Met à jour les paramètres métier
   */
  static async updateBusinessSettings(
    companyId: string,
    business: CompanySettings['business']
  ): Promise<CompanySettings> {
    return this.updateSettingsSection(companyId, 'business', business);
  }

  /**
   * Met à jour la personnalisation/branding
   */
  static async updateBrandingSettings(
    companyId: string,
    branding: CompanySettings['branding']
  ): Promise<CompanySettings> {
    return this.updateSettingsSection(companyId, 'branding', branding);
  }

  /**
   * Met à jour les paramètres de documents
   */
  static async updateDocumentSettings(
    companyId: string,
    documents: CompanySettings['documents']
  ): Promise<CompanySettings> {
    return this.updateSettingsSection(companyId, 'documents', documents);
  }

  /**
   * Met à jour les informations du dirigeant
   */
  static async updateCeoInfo(
    companyId: string,
    ceo: CompanySettings['ceo']
  ): Promise<CompanySettings> {
    return this.updateSettingsSection(companyId, 'ceo', ceo);
  }

  /**
   * Marque les paramètres comme complétés
   */
  static async markSettingsCompleted(companyId: string): Promise<CompanySettings> {
    return this.updateCompanySettings(companyId, {
      metadata: {
        settingsCompletedAt: new Date()
      }
    });
  }

  /**
   * Vérifie si les paramètres essentiels sont complétés
   */
  static validateEssentialSettings(settings: CompanySettings): {
    isValid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];
    
    // Vérifications essentielles
    if (!settings.generalInfo.name?.trim()) {
      missingFields.push('Nom de l\'entreprise');
    }
    
    if (!settings.contact.email?.trim()) {
      missingFields.push('Email principal');
    }
    
    if (!settings.business.currency) {
      missingFields.push('Devise par défaut');
    }
    
    if (!settings.business.language) {
      missingFields.push('Langue de l\'interface');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Initialise les paramètres par défaut pour une nouvelle entreprise
   */
  static async initializeDefaultSettings(
    companyId: string,
    initialData?: Partial<CompanySettings>
  ): Promise<CompanySettings> {
    const defaultSettings = {
      ...DEFAULT_COMPANY_SETTINGS,
      ...initialData
    };

    return this.updateCompanySettings(companyId, defaultSettings);
  }

  /**
   * Obtient les statistiques des paramètres (pourcentage de completion)
   */
  static getSettingsCompletionStats(settings: CompanySettings): {
    totalFields: number;
    completedFields: number;
    completionPercentage: number;
    sections: Record<string, { completed: number; total: number; }>;
  } {
    const stats = {
      totalFields: 0,
      completedFields: 0,
      completionPercentage: 0,
      sections: {} as Record<string, { completed: number; total: number; }>
    };

    // Fonction helper pour compter les champs complétés dans un objet
    const countFields = (obj: any, prefix: string = ''): { total: number; completed: number } => {
      let total = 0;
      let completed = 0;

      Object.entries(obj).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            const nested = countFields(value, `${prefix}${key}.`);
            total += nested.total;
            completed += nested.completed;
          } else {
            total++;
            if (value !== null && value !== undefined && value !== '') {
              completed++;
            }
          }
        } else {
          total++;
        }
      });

      return { total, completed };
    };

    // Analyser chaque section
    const sections = [
      { name: 'generalInfo', data: settings.generalInfo },
      { name: 'contact', data: settings.contact },
      { name: 'accounting', data: settings.accounting },
      { name: 'business', data: settings.business },
      { name: 'branding', data: settings.branding },
      { name: 'documents', data: settings.documents },
      { name: 'ceo', data: settings.ceo || {} }
    ];

    sections.forEach(section => {
      const sectionStats = countFields(section.data);
      stats.sections[section.name] = sectionStats;
      stats.totalFields += sectionStats.total;
      stats.completedFields += sectionStats.completed;
    });

    stats.completionPercentage = Math.round((stats.completedFields / stats.totalFields) * 100);

    return stats;
  }

  /**
   * Exporte les paramètres d'entreprise au format JSON
   */
  static async exportSettings(companyId: string): Promise<string> {
    const settings = await this.getCompanySettings(companyId);
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Importe les paramètres d'entreprise depuis JSON
   */
  static async importSettings(
    companyId: string, 
    jsonData: string
  ): Promise<CompanySettings> {
    try {
      const settings = JSON.parse(jsonData) as Partial<CompanySettings>;
      return await this.updateCompanySettings(companyId, settings);
    } catch (error) {
      console.error('Erreur lors de l\'import des paramètres:', error instanceof Error ? error.message : String(error));
      throw new Error('Format JSON invalide');
    }
  }
}

// Hook React pour utiliser le service
export const useCompanySettings = (companyId: string) => {
  const [settings, setSettings] = React.useState<CompanySettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Charger les paramètres
  const loadSettings = React.useCallback(async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await CompanySettingsService.getCompanySettings(companyId);
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Sauvegarder les paramètres
  const updateSettings = React.useCallback(async (updates: Partial<CompanySettings>) => {
    if (!companyId) return;
    
    try {
      setError(null);
      const updated = await CompanySettingsService.updateCompanySettings(companyId, updates);
      setSettings(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
      throw err;
    }
  }, [companyId]);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    reload: loadSettings
  };
};

// Réexport pour faciliter l'utilisation
export default CompanySettingsService;