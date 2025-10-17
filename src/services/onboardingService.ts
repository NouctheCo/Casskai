// import { supabase } from '../lib/supabase'; // Commenté pour la compatibilité de build
import { MARKET_CONFIGS } from '../data/markets';
import {
  OnboardingStep,
  OnboardingData,
  CompanyProfile,
  OnboardingPreferences,
  OnboardingValidationError,
  StepValidationResult,
  OnboardingStepId
} from '../types/onboarding.types';
import { logger } from '@/utils/logger';

// Types spécifiques au service
export interface OnboardingResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: OnboardingValidationError[];
}

export interface OnboardingSession {
  id: string;
  userId: string;
  sessionData: OnboardingData;
  expiresAt: Date;
  isActive: boolean;
}

export interface OnboardingProgress {
  totalSteps: number;
  completedSteps: number;
  currentStepIndex: number;
  percentage: number;
}

export interface OnboardingMetrics {
  totalSessions: number;
  completedSessions: number;
  abandonmentRate: number;
  averageCompletionTime: number;
  stepsMetrics: Array<{
    stepId: string;
    completionRate: number;
    averageTime: number;
  }>;
}

class OnboardingService {
  private static instance: OnboardingService;
  private cache: Map<string, OnboardingData> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 heures

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
      // Vérifier s'il existe déjà une session active
      const existingSession = await this.getActiveSession(userId);
      if (existingSession.success && existingSession.data) {
        return {
          success: true,
          data: existingSession.data.sessionData
        };
      }

      const initialData: OnboardingData = {
        userId,
        selectedModules: [],
        companyProfile: {},
        preferences: {
          language: 'fr',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          dateFormat: 'DD/MM/YYYY',
          theme: 'system',
          notifications: {
            email: true,
            push: false,
            marketing: false
          }
        },
        featuresExploration: {},
        currentStepId: 'welcome',
        completedSteps: [],
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        progress: 0
      };

      // Simuler l'insertion en base
      await this.simulateDbOperation(200);
      
      // Créer la session
  const _session: OnboardingSession = {
        id: `session_${userId}_${Date.now()}`,
        userId,
        sessionData: initialData,
        expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT),
        isActive: true
      };

      // Mettre en cache
      this.cache.set(userId, initialData);

      return {
        success: true,
        data: initialData
      };
    } catch (error) {
      logger.error('Error initializing onboarding:', error);
      return {
        success: false,
        error: this.formatError(error, 'Initialisation de l\'onboarding')
      };
    }
  }

  /**
   * Récupère les données d'onboarding pour un utilisateur
   */
  async getOnboardingData(userId: string): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Vérifier d'abord le cache
      const cached = this.getCachedData(userId);
      if (cached) {
        return {
          success: true,
          data: cached
        };
      }

      // Simuler récupération depuis la base
      await this.simulateDbOperation(150);
      
      // Récupérer depuis le localStorage comme fallback
      const localData = this.getLocalStorageData(userId);
      if (localData) {
        this.cache.set(userId, localData);
        return {
          success: true,
          data: localData
        };
      }

      return {
        success: false,
        error: 'Aucune session d\'onboarding trouvée'
      };
    } catch (error) {
      logger.error('Error getting onboarding data:', error);
      return {
        success: false,
        error: this.formatError(error, 'Récupération des données d\'onboarding')
      };
    }
  }

  /**
   * Met à jour le profil de l'entreprise avec validation
   */
  async updateCompanyProfile(userId: string, companyProfile: Partial<CompanyProfile>): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Validation des données
      const validation = this.validateCompanyProfile(companyProfile);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Données invalides',
          errors: validation.errors
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
        const marketConfig = MARKET_CONFIGS.find(m => (m as any).countryCode === companyProfile.country);
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

      // Simuler sauvegarde en base
      await this.simulateDbOperation(100);
      
      // Mettre à jour le cache et localStorage
      this.cache.set(userId, updatedData);
      this.saveToLocalStorage(userId, updatedData);

      return {
        success: true,
        data: updatedData
      };
    } catch (error) {
      logger.error('Error updating company profile:', error);
      return {
        success: false,
        error: this.formatError(error, 'Mise à jour du profil entreprise')
      };
    }
  }

  /**
   * Met à jour les préférences d'onboarding avec validation
   */
  async updatePreferences(userId: string, preferences: Partial<OnboardingPreferences>): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Validation des préférences
      const validation = this.validatePreferences(preferences);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Préférences invalides',
          errors: validation.errors
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

      // Simuler sauvegarde en base
      await this.simulateDbOperation(100);
      
      // Mettre à jour le cache et localStorage
      this.cache.set(userId, updatedData);
      this.saveToLocalStorage(userId, updatedData);

      return {
        success: true,
        data: updatedData
      };
    } catch (error) {
      logger.error('Error updating preferences:', error);
      return {
        success: false,
        error: this.formatError(error, 'Mise à jour des préférences')
      };
    }
  }

  /**
   * Marque une étape comme terminée avec validation
   */
  async completeStep(userId: string, stepId: OnboardingStepId): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Validation de l'étape
      const stepValidation = await this.validateStep(userId, stepId);
      if (!stepValidation.isValid) {
        return {
          success: false,
          error: `Validation échouée pour l'étape ${stepId}`,
          errors: stepValidation.errors
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
      const completedSteps = [...currentData.completedSteps];
      
      // Ajouter l'étape si pas déjà complétée
      if (!completedSteps.includes(stepId)) {
        completedSteps.push(stepId);
      }

      const nextStep = this.getNextStep(stepId);
      const progress = this.calculateProgress(completedSteps);

      // Mettre à jour les données
      const updatedData: OnboardingData = {
        ...currentData,
        completedSteps,
        currentStepId: nextStep,
        progress,
        lastSavedAt: new Date().toISOString()
      };

      // Simuler sauvegarde en base
      await this.simulateDbOperation(150);
      
      // Mettre à jour le cache et localStorage
      this.cache.set(userId, updatedData);
      this.saveToLocalStorage(userId, updatedData);

      return {
        success: true,
        data: updatedData
      };
    } catch (error) {
      logger.error('Error completing step:', error);
      return {
        success: false,
        error: this.formatError(error, 'Complétion de l\'\u00e9tape')
      };
    }
  }

  /**
   * Finalise l'onboarding avec création de l'entreprise
   */
  async completeOnboarding(userId: string): Promise<OnboardingResponse<{ companyId: string; onboardingData: OnboardingData }>> {
    try {
      // Récupérer les données finales
      const dataResponse = await this.getOnboardingData(userId);
      if (!dataResponse.success || !dataResponse.data) {
        return {
          success: false,
          error: 'Session d\'onboarding introuvable'
        };
      }

      const onboardingData = dataResponse.data;

      // Validation finale de toutes les étapes requises
      const finalValidation = await this.validateFinalOnboarding(onboardingData);
      if (!finalValidation.isValid) {
        return {
          success: false,
          error: 'Validation finale échouée',
          errors: finalValidation.errors
        };
      }

      // Créer l'entreprise
      const companyCreationResult = await this.createCompanyFromOnboarding(userId, onboardingData);
      if (!companyCreationResult.success) {
        return {
          success: false,
          error: companyCreationResult.error || 'Erreur lors de la création de l\'entreprise'
        };
      }

      // Marquer l'onboarding comme terminé
      const completedData: OnboardingData = {
        ...onboardingData,
        completedAt: new Date().toISOString(),
        progress: 100,
        lastSavedAt: new Date().toISOString()
      };

      // Simuler sauvegarde finale
      await this.simulateDbOperation(300);
      
      // Nettoyer le cache
      this.cache.delete(userId);
      this.clearLocalStorageData(userId);

      return {
        success: true,
        data: {
          companyId: companyCreationResult.data!.companyId,
          onboardingData: completedData
        }
      };
    } catch (error) {
      logger.error('Error completing onboarding:', error);
      return {
        success: false,
        error: this.formatError(error, 'Finalisation de l\'onboarding')
      };
    }
  }

  /**
   * Obtient la prochaine étape dans le parcours
   */
  private getNextStep(currentStep: OnboardingStepId): OnboardingStepId {
    const steps: OnboardingStepId[] = ['welcome', 'company', 'preferences', 'features', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex < steps.length - 1 ? steps[currentIndex + 1] : 'complete';
  }

  /**
   * Calcule le pourcentage de progression
   */
  private calculateProgress(completedSteps: string[]): number {
    const totalSteps = this.getOnboardingSteps().filter(step => (step as any).required).length;
    const requiredCompletedSteps = completedSteps.filter(stepId => {
      const step = this.getOnboardingSteps().find(s => s.id === stepId);
      return (step as any)?.required || false;
    });
    return Math.round((requiredCompletedSteps.length / totalSteps) * 100);
  }

  /**
   * Obtient toutes les étapes d'onboarding
   */
  getOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        name: 'welcome',
        title: 'Bienvenue dans CassKai',
        description: 'Découvrez notre solution comptable intelligente',
        completed: false,
        current: false,
        locked: false,
        order: 0
      },
      {
        id: 'company',
        name: 'company',
        title: 'Profil de votre entreprise',
        description: 'Configurez les informations de base de votre entreprise',
        completed: false,
        current: false,
        locked: true,
        order: 1
      },
      {
        id: 'preferences',
        name: 'preferences',
        title: 'Préférences et paramètres',
        description: 'Définissez vos préférences de langue, devise et format',
        completed: false,
        current: false,
        locked: true,
        order: 2
      },
      {
        id: 'features',
        name: 'features',
        title: 'Découverte des fonctionnalités',
        description: 'Explorez les principales fonctionnalités de CassKai',
        completed: false,
        current: false,
        locked: true,
        order: 3
      },
      {
        id: 'complete',
        name: 'complete',
        title: 'Configuration terminée',
        description: 'Félicitations ! Votre configuration est complète',
        completed: false,
        current: false,
        locked: true,
        order: 4
      }
    ];
  }

  /**
   * Obtient les secteurs d'activité disponibles
   */
  getIndustries(): Array<{ value: string; label: string }> {
    return [
      { value: 'technology', label: 'Technologie et informatique' },
      { value: 'retail', label: 'Commerce de détail' },
      { value: 'manufacturing', label: 'Fabrication et industrie' },
      { value: 'healthcare', label: 'Santé et services médicaux' },
      { value: 'finance', label: 'Finance et assurance' },
      { value: 'education', label: 'Éducation et formation' },
      { value: 'consulting', label: 'Conseil et services professionnels' },
      { value: 'construction', label: 'Construction et BTP' },
      { value: 'food_service', label: 'Restauration et hôtellerie' },
      { value: 'real_estate', label: 'Immobilier' },
      { value: 'transportation', label: 'Transport et logistique' },
      { value: 'agriculture', label: 'Agriculture et agroalimentaire' },
      { value: 'energy', label: 'Énergie et environnement' },
      { value: 'media', label: 'Médias et communication' },
      { value: 'nonprofit', label: 'Association et ONG' },
      { value: 'other', label: 'Autre secteur' }
    ];
  }

  /**
   * Obtient les tranches d'effectifs disponibles
   */
  getEmployeeCounts(): Array<{ value: string; label: string; category: string }> {
    return [
      { value: '1', label: '1 personne (entrepreneur individuel)', category: 'micro' },
      { value: '2-5', label: '2-5 employés', category: 'micro' },
      { value: '6-10', label: '6-10 employés', category: 'small' },
      { value: '11-50', label: '11-50 employés', category: 'small' },
      { value: '51-250', label: '51-250 employés', category: 'medium' },
      { value: '251-500', label: '251-500 employés', category: 'medium' },
      { value: '500+', label: '500+ employés', category: 'large' }
    ];
  }

  /**
   * Obtient les langues disponibles
   */
  getLanguages(): Array<{ value: string; label: string; nativeName: string }> {
    return [
      { value: 'fr', label: 'Français', nativeName: 'Français' },
      { value: 'en', label: 'Anglais', nativeName: 'English' },
      { value: 'es', label: 'Espagnol', nativeName: 'Español' },
      { value: 'ar', label: 'Arabe', nativeName: 'العربية' },
      { value: 'pt', label: 'Portugais', nativeName: 'Português' }
    ];
  }

  /**
   * Obtient les fuseaux horaires disponibles par région
   */
  getTimezones(): Array<{ value: string; label: string; region: string; offset: string }> {
    return [
      // Europe
      { value: 'Europe/Paris', label: 'Paris, France', region: 'Europe', offset: 'UTC+1' },
      { value: 'Europe/London', label: 'Londres, Royaume-Uni', region: 'Europe', offset: 'UTC+0' },
      { value: 'Europe/Brussels', label: 'Bruxelles, Belgique', region: 'Europe', offset: 'UTC+1' },
      { value: 'Europe/Madrid', label: 'Madrid, Espagne', region: 'Europe', offset: 'UTC+1' },
      { value: 'Europe/Rome', label: 'Rome, Italie', region: 'Europe', offset: 'UTC+1' },
      
      // Afrique
      { value: 'Africa/Casablanca', label: 'Casablanca, Maroc', region: 'Afrique', offset: 'UTC+1' },
      { value: 'Africa/Abidjan', label: 'Abidjan, Côte d\'Ivoire', region: 'Afrique', offset: 'UTC+0' },
      { value: 'Africa/Dakar', label: 'Dakar, Sénégal', region: 'Afrique', offset: 'UTC+0' },
      { value: 'Africa/Porto-Novo', label: 'Porto-Novo, Bénin', region: 'Afrique', offset: 'UTC+1' },
      { value: 'Africa/Bamako', label: 'Bamako, Mali', region: 'Afrique', offset: 'UTC+0' },
      { value: 'Africa/Ouagadougou', label: 'Ouagadougou, Burkina Faso', region: 'Afrique', offset: 'UTC+0' },
      { value: 'Africa/Lome', label: 'Lomé, Togo', region: 'Afrique', offset: 'UTC+0' },
      { value: 'Africa/Tunis', label: 'Tunis, Tunisie', region: 'Afrique', offset: 'UTC+1' },
      { value: 'Africa/Algiers', label: 'Alger, Algérie', region: 'Afrique', offset: 'UTC+1' },
      
      // Amériques
      { value: 'America/Montreal', label: 'Montréal, Canada', region: 'Amériques', offset: 'UTC-5' },
      { value: 'America/New_York', label: 'New York, États-Unis', region: 'Amériques', offset: 'UTC-5' },
      { value: 'America/Los_Angeles', label: 'Los Angeles, États-Unis', region: 'Amériques', offset: 'UTC-8' }
    ];
  }

  /**
   * Obtient les configurations de marché disponibles
   */
  getMarketConfigs() {
    return MARKET_CONFIGS;
  }

  /**
   * Obtient les devises disponibles
   */
  getCurrencies(): Array<{ value: string; label: string; symbol: string; region: string }> {
    return [
      { value: 'EUR', label: 'Euro', symbol: '€', region: 'Europe' },
      { value: 'USD', label: 'Dollar américain', symbol: '$', region: 'Amériques' },
      { value: 'GBP', label: 'Livre sterling', symbol: '£', region: 'Europe' },
      { value: 'CAD', label: 'Dollar canadien', symbol: 'C$', region: 'Amériques' },
      { value: 'CHF', label: 'Franc suisse', symbol: 'CHF', region: 'Europe' },
      { value: 'XOF', label: 'Franc CFA (BCEAO)', symbol: 'CFA', region: 'Afrique de l\'Ouest' },
      { value: 'XAF', label: 'Franc CFA (BEAC)', symbol: 'FCFA', region: 'Afrique Centrale' },
      { value: 'MAD', label: 'Dirham marocain', symbol: 'DH', region: 'Afrique du Nord' },
      { value: 'TND', label: 'Dinar tunisien', symbol: 'DT', region: 'Afrique du Nord' },
      { value: 'DZD', label: 'Dinar algérien', symbol: 'DA', region: 'Afrique du Nord' }
    ];
  }

  /**
   * Obtient les formats de date disponibles
   */
  getDateFormats(): Array<{ value: string; label: string; example: string }> {
    const now = new Date('2024-03-15');
    return [
      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (européen)', example: '15/03/2024' },
      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (américain)', example: '03/15/2024' },
      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)', example: '2024-03-15' },
      { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (allemand)', example: '15.03.2024' },
      { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '15-03-2024' }
    ];
  }

  /**
   * Obtient les standards comptables disponibles
   */
  getAccountingStandards(): Array<{ value: string; label: string; description: string; regions: string[] }> {
    return [
      {
        value: 'PCG',
        label: 'Plan Comptable Général (France)',
        description: 'Standard comptable français',
        regions: ['France']
      },
      {
        value: 'SYSCOHADA',
        label: 'SYSCOHADA',
        description: 'Système comptable OHADA (Afrique de l\'Ouest et Centrale)',
        regions: ['Bénin', 'Burkina Faso', 'Côte d\'Ivoire', 'Mali', 'Niger', 'Sénégal', 'Togo', 'Cameroun', 'Tchad', 'Gabon', 'Guinée Équatoriale', 'RCA', 'Congo', 'RDC']
      },
      {
        value: 'IFRS',
        label: 'IFRS (International)',
        description: 'Normes comptables internationales',
        regions: ['International']
      },
      {
        value: 'GAAP_US',
        label: 'US GAAP',
        description: 'Principes comptables américains',
        regions: ['États-Unis']
      },
      {
        value: 'PCN_BE',
        label: 'Plan Comptable Belge',
        description: 'Standard comptable belge',
        regions: ['Belgique']
      }
    ];
  }

  // ========================================
  // Méthodes de validation
  // ========================================

  /**
   * Valide le profil de l'entreprise
   */
  private validateCompanyProfile(profile: Partial<CompanyProfile>): StepValidationResult {
    const errors: OnboardingValidationError[] = [];

    if (profile.name !== undefined) {
      if (!profile.name?.trim()) {
        errors.push({
          field: 'name',
          message: 'Le nom de l\'entreprise est requis',
          code: 'REQUIRED'
        });
      } else if (profile.name.length < 2) {
        errors.push({
          field: 'name',
          message: 'Le nom doit contenir au moins 2 caractères',
          code: 'MIN_LENGTH'
        });
      } else if (profile.name.length > 100) {
        errors.push({
          field: 'name',
          message: 'Le nom ne peut pas dépasser 100 caractères',
          code: 'MAX_LENGTH'
        });
      }
    }

    if (profile.country !== undefined && !profile.country?.trim()) {
      errors.push({
        field: 'country',
        message: 'Le pays est requis',
        code: 'REQUIRED'
      });
    }

    if (profile.currency !== undefined && !profile.currency?.trim()) {
      errors.push({
        field: 'currency',
        message: 'La devise est requise',
        code: 'REQUIRED'
      });
    }

    if (profile.vatNumber !== undefined && profile.vatNumber?.trim()) {
      // Validation basique du numéro de TVA
      const vatRegex = /^[A-Z]{2}[0-9A-Z]+$/;
      if (!vatRegex.test(profile.vatNumber.replace(/\s/g, ''))) {
        errors.push({
          field: 'vatNumber',
          message: 'Format de numéro de TVA invalide',
          code: 'INVALID_FORMAT'
        });
      }
    }

    if (profile.email !== undefined && profile.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        errors.push({
          field: 'email',
          message: 'Format d\'email invalide',
          code: 'INVALID_FORMAT'
        });
      }
    }

    if (profile.website !== undefined && profile.website?.trim()) {
      try {
        new URL(profile.website);
      } catch {
        errors.push({
          field: 'website',
          message: 'Format d\'URL invalide',
          code: 'INVALID_FORMAT'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide les préférences
   */
  private validatePreferences(preferences: Partial<OnboardingPreferences>): StepValidationResult {
    const errors: OnboardingValidationError[] = [];

    if (preferences.language !== undefined && !preferences.language?.trim()) {
      errors.push({
        field: 'language',
        message: 'La langue est requise',
        code: 'REQUIRED'
      });
    }

    if (preferences.currency !== undefined && !preferences.currency?.trim()) {
      errors.push({
        field: 'currency',
        message: 'La devise est requise',
        code: 'REQUIRED'
      });
    }

    if (preferences.timezone !== undefined && !preferences.timezone?.trim()) {
      errors.push({
        field: 'timezone',
        message: 'Le fuseau horaire est requis',
        code: 'REQUIRED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide une étape spécifique
   */
  private async validateStep(userId: string, stepId: OnboardingStepId): Promise<StepValidationResult> {
    const dataResponse = await this.getOnboardingData(userId);
    if (!dataResponse.success || !dataResponse.data) {
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Données non trouvées', code: 'NO_DATA' }]
      };
    }

    const data = dataResponse.data;

    switch (stepId) {
      case 'welcome':
        return { isValid: true, errors: [] };
      
      case 'company':
        return this.validateCompanyProfile(data.companyProfile);
      
      case 'preferences':
        return this.validatePreferences(data.preferences);
      
      case 'features':
        return { isValid: true, errors: [] };
      
      case 'complete':
        return this.validateFinalOnboarding(data);
      
      default:
        return {
          isValid: false,
          errors: [{ field: 'general', message: 'Étape inconnue', code: 'UNKNOWN_STEP' }]
        };
    }
  }

  /**
   * Validation finale avant complétion de l'onboarding
   */
  private async validateFinalOnboarding(data: OnboardingData): Promise<StepValidationResult> {
    const errors: OnboardingValidationError[] = [];

    // Vérifier que les étapes requises sont complétées
    const requiredSteps: OnboardingStepId[] = ['welcome', 'company', 'preferences'];
    for (const step of requiredSteps) {
      if (!data.completedSteps.includes(step)) {
        errors.push({
          field: 'general',
          message: `Étape requise non complétée: ${step}`,
          code: 'MISSING_REQUIRED_STEP'
        });
      }
    }

    // Validation du profil entreprise
    const companyValidation = this.validateCompanyProfile(data.companyProfile);
    errors.push(...companyValidation.errors);

    // Validation des préférences
    const preferencesValidation = this.validatePreferences(data.preferences);
    errors.push(...preferencesValidation.errors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ========================================
  // Méthodes utilitaires
  // ========================================

  /**
   * Formatage des erreurs
   */
  private formatError(error: unknown, context: string): string {
    if (error instanceof Error) {
      return `[${context}] ${error.message}`;
    }
    return `[${context}] Erreur inconnue: ${JSON.stringify(error)}`;
  }

  /**
   * Simulation d'opération base de données
   */
  private async simulateDbOperation(delay: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Gestion du cache
   */
  private getCachedData(userId: string): OnboardingData | null {
    return this.cache.get(userId) || null;
  }

  /**
   * Sauvegarde dans localStorage
   */
  private saveToLocalStorage(userId: string, data: OnboardingData): void {
    try {
      const key = `casskai_onboarding_${userId}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      logger.warn('Erreur lors de la sauvegarde localStorage:', error)
    }
  }

  /**
   * Chargement depuis localStorage
   */
  private getLocalStorageData(userId: string): OnboardingData | null {
    try {
      const key = `casskai_onboarding_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.warn('Erreur lors du chargement localStorage:', error);
      return null;
    }
  }

  /**
   * Nettoyage localStorage
   */
  private clearLocalStorageData(userId: string): void {
    try {
      const key = `casskai_onboarding_${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      logger.warn('Erreur lors du nettoyage localStorage:', error)
    }
  }

  /**
   * Récupération d'une session active
   */
  private async getActiveSession(userId: string): Promise<OnboardingResponse<OnboardingSession>> {
    // Simuler la récupération d'une session active
    await this.simulateDbOperation(50);
    
    const cachedData = this.getCachedData(userId);
    if (cachedData) {
      const session: OnboardingSession = {
        id: `session_${userId}`,
        userId,
        sessionData: cachedData,
        expiresAt: new Date(Date.now() + this.SESSION_TIMEOUT),
        isActive: true
      };
      return { success: true, data: session };
    }

    return { success: false, error: 'Aucune session active trouvée' };
  }

  /**
   * Création d'entreprise à partir des données d'onboarding
   */
  private async createCompanyFromOnboarding(
    userId: string, 
    onboardingData: OnboardingData
  ): Promise<OnboardingResponse<{ companyId: string }>> {
    try {
      // Simuler la création d'entreprise
      await this.simulateDbOperation(500);
      
      // Générer un ID d'entreprise
      const companyId = `company_${userId}_${Date.now()}`;
      
      // Simuler l'insertion en base de données
      const companyData = {
        id: companyId,
        name: onboardingData.companyProfile.name || 'Mon Entreprise',
        country: onboardingData.companyProfile.country || 'FR',
        currency: onboardingData.preferences.currency || 'EUR',
        language: onboardingData.preferences.language || 'fr',
        timezone: onboardingData.preferences.timezone || 'Europe/Paris',
        createdBy: userId,
        createdAt: new Date().toISOString()
      };

      logger.info('Entreprise créée:', companyData);
      
      return {
        success: true,
        data: { companyId }
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error, 'Création d\'entreprise')
      };
    }
  }

  /**
   * Obtient les métriques d'onboarding
   */
  async getOnboardingMetrics(): Promise<OnboardingResponse<OnboardingMetrics>> {
    try {
      await this.simulateDbOperation(200);
      
      // Simuler des métriques
      const metrics: OnboardingMetrics = {
        totalSessions: 1250,
        completedSessions: 980,
        abandonmentRate: 21.6,
        averageCompletionTime: 8.5, // en minutes
        stepsMetrics: [
          { stepId: 'welcome', completionRate: 95.2, averageTime: 1.2 },
          { stepId: 'company', completionRate: 89.7, averageTime: 3.8 },
          { stepId: 'preferences', completionRate: 85.4, averageTime: 2.1 },
          { stepId: 'features', completionRate: 78.3, averageTime: 4.2 },
          { stepId: 'complete', completionRate: 78.4, averageTime: 0.5 }
        ]
      };
      
      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error, 'Récupération des métriques')
      };
    }
  }

  /**
   * Obtient le progrès d'onboarding pour un utilisateur
   */
  async getOnboardingProgress(userId: string): Promise<OnboardingResponse<OnboardingProgress>> {
    try {
      const dataResponse = await this.getOnboardingData(userId);
      if (!dataResponse.success || !dataResponse.data) {
        return {
          success: false,
          error: 'Données d\'onboarding non trouvées'
        };
      }

      const data = dataResponse.data;
      const steps = this.getOnboardingSteps();
      const currentStepIndex = steps.findIndex(step => step.id === data.currentStepId);
      
      const progress: OnboardingProgress = {
        totalSteps: steps.length,
        completedSteps: data.completedSteps.length,
        currentStepIndex: Math.max(0, currentStepIndex),
        percentage: data.progress
      };
      
      return {
        success: true,
        data: progress
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error, 'Calcul du progrès')
      };
    }
  }

  /**
   * Nettoie le cache (utile pour les tests)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Réinitialise une session d'onboarding
   */
  async resetOnboarding(userId: string): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Nettoyer le cache et localStorage
      this.cache.delete(userId);
      this.clearLocalStorageData(userId);
      
      // Reinitialiser
      return await this.initializeOnboarding(userId);
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error, 'Réinitialisation de l\'onboarding')
      };
    }
  }
}

// Instance singleton
export const onboardingService = OnboardingService.getInstance();
export default onboardingService;