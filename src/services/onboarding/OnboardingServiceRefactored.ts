import { MARKET_CONFIGS } from '../../data/markets';
import {
  OnboardingStep,
  OnboardingData,
  CompanyProfile,
  OnboardingPreferences,
  OnboardingStepId
} from '../../types/onboarding.types';
import { OnboardingValidationService } from './OnboardingValidationService';
import { OnboardingStorageService } from './OnboardingStorageService';
import { OnboardingProgressService, OnboardingResponse, OnboardingProgress, OnboardingMetrics } from './OnboardingProgressService';

class OnboardingService {
  private static instance: OnboardingService;
  
  private validationService: OnboardingValidationService;
  private storageService: OnboardingStorageService;
  private progressService: OnboardingProgressService;

  private constructor() {
    this.validationService = new OnboardingValidationService();
    this.storageService = new OnboardingStorageService();
    this.progressService = new OnboardingProgressService();
  }

  static getInstance(): OnboardingService {
    if (!OnboardingService.instance) {
      OnboardingService.instance = new OnboardingService();
    }
    return OnboardingService.instance;
  }

  /**
   * Initialise une nouvelle session d'onboarding
   */
  async initializeOnboarding(userId: string): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Vérifier s'il existe déjà des données
      const existingResponse = await this.storageService.getOnboardingData(userId);
      if (existingResponse.success && existingResponse.data) {
        return {
          success: true,
          data: existingResponse.data
        };
      }

      // Créer de nouvelles données d'onboarding
      const initialData: OnboardingData = {
        userId,
        currentStepId: 'welcome',
        companyProfile: {
          name: '',
          country: ''
        },
        preferences: {
          language: 'fr',
          currency: 'EUR',
          timezone: 'Europe/Paris'
        },
        selectedModules: [],
        featuresExploration: {} as any,
        progress: 0,
        completedSteps: [],
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString()
      };

      // Sauvegarder les données initiales
      const saveResponse = await this.storageService.saveOnboardingData(userId, initialData);
      if (!saveResponse.success) {
        return saveResponse;
      }

      return {
        success: true,
        data: initialData
      };
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      return {
        success: false,
        error: this.formatError(error, 'Initialisation de l\'onboarding')
      };
    }
  }

  /**
   * Récupère les données d'onboarding
   */
  async getOnboardingData(userId: string): Promise<OnboardingResponse<OnboardingData>> {
    const response = await this.storageService.getOnboardingData(userId);
    if (!response.success || !response.data) {
      return {
        success: false,
        error: 'Aucune session d\'onboarding trouvée'
      };
    }
    return response;
  }

  /**
   * Met à jour le profil de l'entreprise avec validation
   */
  async updateCompanyProfile(userId: string, companyProfile: Partial<CompanyProfile>): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Validation des données
      const validation = this.validationService.validateCompanyProfile(companyProfile);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        };
      }

      // Récupérer les données actuelles
      const currentDataResponse = await this.getOnboardingData(userId);
      if (!currentDataResponse.success || !currentDataResponse.data) {
        return {
          success: false,
          error: 'Session d\'onboarding introuvable'
        };
      }

      const currentData = currentDataResponse.data;
      
      // Mise à jour des préférences basées sur le marché sélectionné
      let updatedPreferences = { ...currentData.preferences };
      if (companyProfile.country) {
        const marketConfig = MARKET_CONFIGS.find((m: any) => m.country === companyProfile.country || m.code === companyProfile.country);
        if (marketConfig) {
          updatedPreferences = {
            ...updatedPreferences,
            currency: marketConfig.defaultCurrency,
            timezone: marketConfig.localization.timezone,
            language: marketConfig.localization.language.split('-')[0]
          };
        }
      }

      // Mettre à jour les données
      const updatedData: OnboardingData = {
        ...currentData,
        companyProfile: { ...currentData.companyProfile, ...companyProfile },
        preferences: updatedPreferences,
        lastSavedAt: new Date().toISOString()
      };

      // Sauvegarder
      const saveResponse = await this.storageService.saveOnboardingData(userId, updatedData);
      if (!saveResponse.success) {
        return saveResponse;
      }

      return {
        success: true,
        data: updatedData
      };
    } catch (error) {
      console.error('Error updating company profile:', error);
      return {
        success: false,
        error: this.formatError(error, 'Mise à jour du profil entreprise')
      };
    }
  }

  /**
   * Met à jour les préférences avec validation
   */
  async updatePreferences(userId: string, preferences: Partial<OnboardingPreferences>): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Validation des données
      const validation = this.validationService.validatePreferences(preferences);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        };
      }

      // Récupérer les données actuelles
      const currentDataResponse = await this.getOnboardingData(userId);
      if (!currentDataResponse.success || !currentDataResponse.data) {
        return {
          success: false,
          error: 'Session d\'onboarding introuvable'
        };
      }

      const currentData = currentDataResponse.data;

      // Mettre à jour les données
      const updatedData: OnboardingData = {
        ...currentData,
        preferences: { ...currentData.preferences, ...preferences },
        lastSavedAt: new Date().toISOString()
      };

      // Sauvegarder
      const saveResponse = await this.storageService.saveOnboardingData(userId, updatedData);
      if (!saveResponse.success) {
        return saveResponse;
      }

      return {
        success: true,
        data: updatedData
      };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return {
        success: false,
        error: this.formatError(error, 'Mise à jour des préférences')
      };
    }
  }

  /**
   * Marque une étape comme complétée
   */
  async completeStep(userId: string, stepId: OnboardingStepId): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Récupérer les données actuelles
      const currentDataResponse = await this.getOnboardingData(userId);
      if (!currentDataResponse.success || !currentDataResponse.data) {
        return {
          success: false,
          error: 'Session d\'onboarding introuvable'
        };
      }

      const currentData = currentDataResponse.data;

      // Valider l'étape
      const validation = await this.validationService.validateStep(userId, stepId, currentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        };
      }

      // Mettre à jour les étapes complétées
      const completedSteps = currentData.completedSteps || [];
      if (!completedSteps.includes(stepId)) {
        completedSteps.push(stepId);
      }

      // Déterminer l'étape suivante
      const nextStep = this.progressService.getNextStep(stepId);

      const updatedData: OnboardingData = {
        ...currentData,
        currentStepId: nextStep,
        completedSteps,
        lastSavedAt: new Date().toISOString()
      };

      // Sauvegarder
      const saveResponse = await this.storageService.saveOnboardingData(userId, updatedData);
      if (!saveResponse.success) {
        return saveResponse;
      }

      return {
        success: true,
        data: updatedData
      };
    } catch (error) {
      console.error('Error completing step:', error);
      return {
        success: false,
        error: this.formatError(error, 'Finalisation de l\'étape')
      };
    }
  }

  /**
   * Finalise l'onboarding et crée l'entreprise
   */
  async completeOnboarding(userId: string): Promise<OnboardingResponse<{ companyId: string; onboardingData: OnboardingData }>> {
    try {
      const currentDataResponse = await this.getOnboardingData(userId);
      if (!currentDataResponse.success || !currentDataResponse.data) {
        return {
          success: false,
          error: 'Session d\'onboarding introuvable'
        };
      }

      const currentData = currentDataResponse.data;

      // Validation finale
      const validation = await this.validationService.validateStep(userId, 'complete', currentData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        };
      }

      // Créer l'entreprise
      const companyId = await this.createCompanyFromOnboarding(currentData);

      // Marquer comme complété
      const completedData: OnboardingData = {
        ...currentData,
        completedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString()
      };

      await this.storageService.saveOnboardingData(userId, completedData);

      return {
        success: true,
        data: {
          companyId,
          onboardingData: completedData
        }
      };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return {
        success: false,
        error: this.formatError(error, 'Finalisation de l\'onboarding')
      };
    }
  }

  /**
   * Obtient les métriques d'onboarding
   */
  async getOnboardingMetrics(): Promise<OnboardingResponse<OnboardingMetrics>> {
    return this.progressService.getOnboardingMetrics();
  }

  /**
   * Obtient la progression d'onboarding
   */
  async getOnboardingProgress(userId: string): Promise<OnboardingResponse<OnboardingProgress>> {
    const dataResponse = await this.getOnboardingData(userId);
    if (!dataResponse.success || !dataResponse.data) {
      return {
        success: false,
        error: 'Session d\'onboarding introuvable'
      };
    }

    return this.progressService.getOnboardingProgress(userId, dataResponse.data);
  }

  /**
   * Remet à zéro l'onboarding
   */
  async resetOnboarding(userId: string): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Supprimer les données existantes
      await this.storageService.clearOnboardingData(userId);
      
      // Réinitialiser l'onboarding
      return this.initializeOnboarding(userId);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      return {
        success: false,
        error: this.formatError(error, 'Remise à zéro de l\'onboarding')
      };
    }
  }

  private async createCompanyFromOnboarding(data: OnboardingData): Promise<string> {
    // Simuler la création d'une entreprise
    await new Promise(resolve => setTimeout(resolve, 200));
    return `company_${data.userId}_${Date.now()}`;
  }

  private formatError(error: unknown, context: string): string {
    if (error instanceof Error) {
      return `${context}: ${error.message}`;
    }
    return `${context}: Erreur inconnue`;
  }
}

// Export du singleton
export default OnboardingService.getInstance();