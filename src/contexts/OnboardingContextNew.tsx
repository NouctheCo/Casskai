/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

/* eslint-disable */
import React, { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { devLogger } from '@/utils/devLogger';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import {
  OnboardingContextType,
  OnboardingState,
  OnboardingStepId,
  CompanyProfile,
  OnboardingPreferences,
  OnboardingData,
  StepValidationResult
} from '../types/onboarding.types';
import { OnboardingProgressService } from '../services/onboarding/OnboardingProgressService';
import { OnboardingStorageService } from '../services/onboarding/OnboardingStorageService';

export const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialState: OnboardingState = {
  isLoading: false,
  isInitialized: false,
  isCompleted: false,
  currentStep: null,
  steps: [],
  data: null,
  errors: [],
  progress: 0
};

const initialData: OnboardingData = {
  userId: '',
  companyProfile: {},
  selectedModules: [],
  preferences: {},
  featuresExploration: {},
  currentStepId: 'language',
  completedSteps: [],
  startedAt: new Date().toISOString(),
  lastSavedAt: new Date().toISOString(),
  progress: 0
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>(initialState);
  const progressService = useMemo(() => new OnboardingProgressService(), []);
  const storageService = useMemo(() => new OnboardingStorageService(), []);
  const { create: createCompany } = useSupabase('companies');
  const { create: createUserCompany } = useSupabase('user_companies');

  // Initialize onboarding
  useEffect(() => {
    if (user?.id && !state.isInitialized) {
      initializeOnboarding();
    }
  }, [user?.id, state.isInitialized]);

  const initializeOnboarding = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await storageService.getOnboardingData(user.id);
      const savedData = response.success ? response.data : null;
      const data = savedData ? { ...savedData, userId: user.id } : { ...initialData, userId: user.id };

      if (!savedData) {
        await storageService.saveOnboardingData(user.id, data);
      }

      // Initialize steps
      const steps = progressService.getStepsWithStatus(data);

      setState({
        isLoading: false,
        isInitialized: true,
        isCompleted: data.completedAt !== undefined,
        currentStep: steps.find(s => s.id === data.currentStepId) || null,
        steps,
        data,
        errors: [],
        progress: data.progress
      });
    } catch (error) {
      devLogger.error('Failed to initialize onboarding:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        errors: [{ field: 'initialization', message: 'Failed to load onboarding data', code: 'INIT_ERROR' }]
      }));
    }
  }, [user?.id, progressService, storageService]);

  // Navigation methods
  const goToStep = useCallback((stepId: OnboardingStepId) => {
    setState(prev => {
      const step = prev.steps.find(s => s.id === stepId);
      if (!step || !prev.data) return prev;

      const updatedData = {
        ...prev.data,
        currentStepId: stepId,
        lastSavedAt: new Date().toISOString()
      };

      if (user?.id) {
        void storageService.saveOnboardingData(user.id, updatedData);
      }

      return {
        ...prev,
        currentStep: step,
        data: updatedData
      };
    });
  }, [storageService, user?.id]);

  const goToNextStep = useCallback(() => {
    if (!state.currentStep || !state.data) return;

    const nextStepId = progressService.getNextStep(state.currentStep.id as OnboardingStepId);
    if (nextStepId) {
      goToStep(nextStepId);
    }
  }, [state.currentStep, state.data, progressService, goToStep]);

  const goToPreviousStep = useCallback(() => {
    if (!state.currentStep || !state.data) return;

    const prevStepId = progressService.getPreviousStep(state.currentStep.id as OnboardingStepId);
    if (prevStepId) {
      goToStep(prevStepId);
    }
  }, [state.currentStep, state.data, progressService, goToStep]);

  // Data update methods
  const updateCompanyProfile = useCallback((profile: Partial<CompanyProfile>) => {
    setState(prev => {
      if (!prev.data) return prev;

      const updatedData = {
        ...prev.data,
        companyProfile: { ...prev.data.companyProfile, ...profile },
        lastSavedAt: new Date().toISOString()
      };

      if (user?.id) {
        void storageService.saveOnboardingData(user.id, updatedData);
      }

      return {
        ...prev,
        data: updatedData
      };
    });
  }, [storageService, user?.id]);

  const updateSelectedModules = useCallback((modules: string[]) => {
    setState(prev => {
      if (!prev.data) return prev;

      const updatedData = {
        ...prev.data,
        selectedModules: modules,
        lastSavedAt: new Date().toISOString()
      };

      if (user?.id) {
        void storageService.saveOnboardingData(user.id, updatedData);
      }

      return {
        ...prev,
        data: updatedData
      };
    });
  }, [storageService, user?.id]);

  const updatePreferences = useCallback((preferences: Partial<OnboardingPreferences>) => {
    setState(prev => {
      if (!prev.data) return prev;

      const updatedData = {
        ...prev.data,
        preferences: { ...prev.data.preferences, ...preferences },
        lastSavedAt: new Date().toISOString()
      };

      if (user?.id) {
        void storageService.saveOnboardingData(user.id, updatedData);
      }

      return {
        ...prev,
        data: updatedData
      };
    });
  }, [storageService, user?.id]);

  const updateFeatureExploration = useCallback((featureId: string, data: Record<string, unknown>) => {
    setState(prev => {
      if (!prev.data) return prev;

      const updatedData = {
        ...prev.data,
        featuresExploration: {
          ...prev.data.featuresExploration,
          [featureId]: { ...prev.data.featuresExploration[featureId], ...data }
        },
        lastSavedAt: new Date().toISOString()
      };

      if (user?.id) {
        void storageService.saveOnboardingData(user.id, updatedData);
      }

      return {
        ...prev,
        data: updatedData
      };
    });
  }, [storageService, user?.id]);

  // Validation methods
  const validateCurrentStep = useCallback(async (): Promise<StepValidationResult> => {
    if (!state.currentStep) {
      return { isValid: false, errors: [{ field: 'step', message: 'No current step', code: 'NO_STEP' }] };
    }

    // Basic validation - can be extended based on step requirements
    const stepId = state.currentStep.id as OnboardingStepId;
    const data = state.data;

    if (!data) {
      return { isValid: false, errors: [{ field: 'data', message: 'No onboarding data', code: 'NO_DATA' }] };
    }

    // Validate based on step
    switch (stepId) {
      case 'company':
        if (!data.companyProfile.name || !data.companyProfile.country) {
          return {
            isValid: false,
            errors: [{ field: 'company', message: 'Company name and country are required', code: 'COMPANY_REQUIRED' }]
          };
        }
        break;
      case 'modules':
        if (!data.selectedModules || data.selectedModules.length === 0) {
          return {
            isValid: false,
            errors: [{ field: 'modules', message: 'At least one module must be selected', code: 'MODULES_REQUIRED' }]
          };
        }
        break;
    }

    return { isValid: true, errors: [] };
  }, [state.currentStep, state.data]);

  // Completion methods
  const completeCurrentStep = useCallback(async () => {
    if (!state.currentStep || !state.data) return;

    const stepId = state.currentStep.id as OnboardingStepId;
    const updatedData = {
      ...state.data,
      completedSteps: [...state.data.completedSteps.filter(s => s !== stepId), stepId],
      progress: progressService.calculateProgress([...state.data.completedSteps.filter(s => s !== stepId), stepId]),
      lastSavedAt: new Date().toISOString()
    };

    if (user?.id) {
      await storageService.saveOnboardingData(user.id, updatedData);
    }

    setState(prev => ({
      ...prev,
      data: updatedData,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, completed: true } : s)
    }));
  }, [state.currentStep, state.data, progressService, storageService, user?.id]);

  // ============================================
  // FONCTIONS HELPER ENTERPRISE - PHASE 2
  // ============================================

  // Configuration métier intelligente pour les modules
  const getModuleCategory = (moduleId: string): string => {
    const categoryMap: Record<string, string> = {
      'dashboard': 'CORE',
      'settings': 'ADMINISTRATION',
      'users': 'ADMINISTRATION',
      'security': 'ADMINISTRATION',
      'accounting': 'FINANCE',
      'banking': 'FINANCE',
      'invoicing': 'FINANCE',
      'purchases': 'FINANCE',
      'reports': 'ANALYTICS',
      'inventory': 'OPERATIONS',
      'crm': 'SALES',
      'projects': 'PROJECT_MANAGEMENT'
    };
    return categoryMap[moduleId] || 'BUSINESS';
  };

  const getModuleLicenseType = (moduleId: string): string => {
    const baseModules = ['dashboard', 'settings', 'users', 'security'];
    if (baseModules.includes(moduleId)) return 'core';

    const proModules = ['reports', 'projects', 'crm'];
    if (proModules.includes(moduleId)) return 'professional';

    return 'standard';
  };

  const getModuleUserLimit = (moduleId: string): number | null => {
    const limits: Record<string, number | null> = {
      'dashboard': null, // Illimité pour tous
      'settings': null,
      'users': null,
      'security': null,
      'accounting': 50,
      'banking': 20,
      'invoicing': 100,
      'reports': 25,
      'crm': 500,
      'projects': 50,
      'inventory': 25
    };
    return limits[moduleId] ?? 10; // Défaut 10 utilisateurs
  };

  const getModuleStorageQuota = (moduleId: string): number => {
    const quotas: Record<string, number> = {
      'dashboard': 1,
      'settings': 0.5,
      'users': 0.5,
      'security': 2,
      'accounting': 20,
      'banking': 10,
      'invoicing': 15,
      'reports': 5,
      'crm': 30,
      'projects': 25,
      'inventory': 20
    };
    return quotas[moduleId] || 10; // Défaut 10 GB
  };

  const getModuleDependencies = (moduleId: string): string[] => {
    const dependencies: Record<string, string[]> = {
      'reports': ['accounting', 'banking'],
      'invoicing': ['accounting'],
      'projects': ['users'],
      'crm': ['users', 'invoicing']
    };
    return dependencies[moduleId] || [];
  };

  const getModuleFeatureSet = (moduleId: string): string[] => {
    const features: Record<string, string[]> = {
      'dashboard': ['widgets', 'analytics', 'real_time_updates'],
      'accounting': ['journal_entries', 'reconciliation', 'financial_statements'],
      'banking': ['bank_sync', 'transaction_import', 'reconciliation'],
      'invoicing': ['invoice_creation', 'payment_tracking', 'templates'],
      'crm': ['contact_management', 'pipeline', 'email_integration'],
      'reports': ['custom_reports', 'scheduled_reports', 'data_export'],
      'inventory': ['stock_tracking', 'inventory_valuation', 'low_stock_alerts'],
      'projects': ['task_management', 'time_tracking', 'project_reports']
    };
    return features[moduleId] || ['basic_functionality'];
  };

  const getModuleComplianceRules = (moduleId: string): Record<string, any> => {
    const complianceRules: Record<string, Record<string, any>> = {
      'accounting': {
        gdpr_compliant: true,
        data_retention_years: 10,
        audit_trail_required: true,
        financial_regulation: 'EU_GAAP'
      },
      'banking': {
        pci_dss_required: true,
        encryption_level: 'AES-256',
        transaction_monitoring: true
      },
      'crm': {
        gdpr_compliant: true,
        data_subject_rights: true,
        consent_management: true
      }
    };
    return complianceRules[moduleId] || { basic_compliance: true };
  };

  // Protection contre les appels multiples de finalisation
  const finalizationInProgress = useRef(false);

  // Finalization
  const finalizeOnboarding = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!state.data || !user?.id) return { success: false, error: 'No onboarding data or user' };
    
    // Protection contre les appels multiples
    if (finalizationInProgress.current) {
      devLogger.warn('Finalisation déjà en cours, appel ignoré');
      return { success: false, error: 'Finalisation déjà en cours' };
    }
    
    finalizationInProgress.current = true;
    
    try {
      // Vérifier que la session est toujours valide
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
      }

      const activeSessionResponse = await storageService.getActiveSession(user.id);
      const activeSession = activeSessionResponse.success ? activeSessionResponse.data : null;
      const sessionToken = activeSession?.sessionToken || (
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `session_${Date.now()}`
      );
      const sessionStartedAt = activeSession?.sessionData?.startedAt
        || state.data.startedAt
        || new Date().toISOString();

      devLogger.debug('🔍 Préparation création entreprise:', state.data.companyProfile.name?.trim());

      const { data: existingCompany, error: existingCompanyError } = await supabase
        .from('companies')
        .select('id, status, owner_id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingCompanyError) {
        devLogger.error('❌ Impossible de vérifier les entreprises existantes:', existingCompanyError);
        throw new Error('Impossible de vérifier les entreprises existantes');
      }

      const companyAlreadyExists = !!existingCompany?.id;
      const existingCompanyId = existingCompany?.id ?? null;
      if (companyAlreadyExists && !existingCompanyId) {
        throw new Error('Entreprise existante détectée sans identifiant valide.');
      }

      const companyId = existingCompanyId
        ?? (
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `company_${Date.now()}`
        );

      if (companyAlreadyExists) {
        devLogger.info('ℹ️ Entreprise déjà existante détectée, réutilisation de l’ID:', companyId);
      }

    // ============================================
      // SAUVEGARDE COMPLÈTE COMPANIES - 8 NOUVELLES COLONNES
      // ============================================

    // SOLUTION NATIVE: Utiliser Supabase directement (triggers corrigés)
    devLogger.debug('🔧 [OnboardingContextNew] Creating company via Supabase native client');
    const companyData = {
          id: companyId,
          name: state.data.companyProfile.name,
          country: state.data.companyProfile.country,
          default_currency: state.data.companyProfile.currency || (
            state.data.companyProfile.country === 'FR' ? 'EUR' :
            ['SN', 'CI', 'ML', 'BF'].includes(state.data.companyProfile.country || '') ? 'XOF' :
            state.data.companyProfile.country === 'MA' ? 'MAD' :
            state.data.companyProfile.country === 'TN' ? 'TND' :
            state.data.companyProfile.country === 'CM' ? 'XAF' :
            'EUR'
          ),

          // ========== ADRESSE COMPLÈTE ==========
          address: state.data.companyProfile.address || null,
          city: state.data.companyProfile.city || null,
          postal_code: state.data.companyProfile.postalCode || null,

          // ========== IDENTIFIANTS FISCAUX ==========
          siret: state.data.companyProfile.siret || null,
          siren: state.data.companyProfile.siren || null,
          vat_number: state.data.companyProfile.vatNumber || null,
          tax_number: state.data.companyProfile.taxNumber || null,
          legal_form: state.data.companyProfile.legalForm || null,

          // ========== NOUVELLES COLONNES PHASE 1 ==========
          // CompanyStep - 8 colonnes auparavant perdues !
          timezone: state.data.companyProfile.timezone || 'Europe/Paris',
          share_capital: state.data.companyProfile.shareCapital ? parseFloat(state.data.companyProfile.shareCapital) : null,
          ceo_name: state.data.companyProfile.ceoName || null,
          sector: state.data.companyProfile.sector || null,
          // Si ceoTitle est renseigné, on l'envoie. Sinon on envoie null (pas de chaîne vide)
          ceo_title: state.data.companyProfile.ceoTitle?.trim() || null,
          industry_type: state.data.companyProfile.industryType || null,
          company_size: state.data.companyProfile.companySize || null,
          registration_date: state.data.companyProfile.registrationDate ? new Date(state.data.companyProfile.registrationDate).toISOString().split('T')[0] : null,

          // ========== COMPTABILITÉ ==========
          accounting_standard: state.data.companyProfile.accountingStandard || null,
          accounting_method: state.data.companyProfile.accountingMethod || 'accrual',
          fiscal_year_type: state.data.companyProfile.fiscalYearType || 'calendar',
          fiscal_year_start_month: state.data.companyProfile.fiscalYearStartMonth || state.data.companyProfile.fiscalYearStart || 1,
          fiscal_year_start_day: state.data.companyProfile.fiscalYearStartDay || 1,

          // Colonnes optionnelles communes et sûres
          ...(state.data.companyProfile?.contact?.phone && {
            phone: state.data.companyProfile.contact.phone
          }),
          ...(state.data.companyProfile.phone && {
            phone: state.data.companyProfile.phone
          }),
          ...(state.data.companyProfile.email && {
            email: state.data.companyProfile.email
          }),
          ...(state.data.companyProfile.website && {
            website: state.data.companyProfile.website
          }),

          // Propriétaire
          owner_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active'
        };

    devLogger.debug('📤 [OnboardingContextNew] Company data to insert via Supabase:', companyData);

    if (!companyAlreadyExists) {
      try {
        const { data: result, error: rpcError } = await supabase.rpc('create_company_with_user', {
          p_company_id: companyId,
          p_user_id: user.id,
          p_company_data: companyData
        });

        if (rpcError) {
          devLogger.error('❌ [OnboardingContextNew] RPC error:', rpcError);
          throw new Error(`Failed to create company: ${rpcError.message}`);
        }

        if (!result || result.success !== true) {
          const errorMsg = result?.error || 'Unknown error from database function';
          devLogger.error('❌ [OnboardingContextNew] Function returned error:', errorMsg);
          throw new Error(`Failed to create company: ${errorMsg}`);
        }

        const rpcCompanyId = typeof result.company_id === 'string' ? result.company_id : null;
        if (!rpcCompanyId) {
          throw new Error('La fonction create_company_with_user n’a pas renvoyé d’identifiant d’entreprise.');
        }

        if (rpcCompanyId !== companyId) {
          throw new Error('Incohérence entre l’ID demandé et celui retourné par la base.');
        }

        devLogger.info('✅ Company and user_companies created successfully:', companyId);
      } catch (err: any) {
        devLogger.error('❌ [OnboardingContextNew] Company creation failed:', err);
        throw new Error(`Failed to create company: ${err.message}`);
      }
    } else {
      devLogger.info('⏭️ Création d’entreprise ignorée (déjà existante).');
    }

    const company = companyData;


      // Create company modules
      const selectedModules = state.data.selectedModules || [];
      const baseModules = ['dashboard', 'settings', 'users', 'security'];
      const enabledModules = Array.from(new Set([...baseModules, ...selectedModules]));

      if (!companyAlreadyExists && enabledModules.length > 0) {
        const moduleNames = {
          'dashboard': 'Tableau de Bord',
          'settings': 'Paramètres',
          'accounting': 'Comptabilité',
          'invoicing': 'Facturation',
          'banking': 'Banque',
          'inventory': 'Stock & Inventaire',
          'crm': 'CRM',
          'reports': 'Rapports'
        };

        const modulesToInsert = enabledModules.map(moduleId => ({
          company_id: company.id,
          module_key: moduleId,
          module_name: moduleNames[moduleId as keyof typeof moduleNames] || moduleId,
          is_enabled: true,

          // ============================================
          // NOUVELLES COLONNES ENTERPRISE PHASE 2
          // ============================================

          // Priorité et configuration
          module_priority: baseModules.includes(moduleId) ? 1 : 0, // Modules core = priorité 1
          custom_settings: {
            enabled_by_user: selectedModules.includes(moduleId),
            enabled_date: new Date().toISOString(),
            module_category: getModuleCategory(moduleId),
            user_selection: true
          },

          // Contrôle d'accès et licences
          access_level: baseModules.includes(moduleId) ? 'administrator' : 'standard',
          license_type: getModuleLicenseType(moduleId),
          user_limit: getModuleUserLimit(moduleId),
          storage_quota_gb: getModuleStorageQuota(moduleId),

          // Configuration business
          auto_activation: baseModules.includes(moduleId),
          dependency_rules: getModuleDependencies(moduleId),
          feature_set: getModuleFeatureSet(moduleId),
          integration_config: {},

          // Gestion et monitoring
          maintenance_mode: false,
          health_status: 'active',
          performance_metrics: {
            initialization_time: 0,
            last_health_check: new Date().toISOString(),
            resource_usage: 0
          },

          // Audit et conformité
          compliance_rules: getModuleComplianceRules(moduleId),
          audit_settings: {
            log_user_actions: true,
            data_retention_days: 365,
            compliance_level: 'standard'
          },

          // Métadonnées
          module_version: '1.0.0',
          last_config_update: new Date().toISOString()
        }));

        await supabase
          .from('company_modules')
          .insert(modulesToInsert);
      } else if (companyAlreadyExists) {
        devLogger.info('ℹ️ Modules déjà configurés pour cette entreprise, saut de l’insertion.');
      }

      // Journaux créés automatiquement par le trigger SQL create_journals_for_new_company
      devLogger.info('ℹ️ Journaux créés automatiquement par trigger SQL');

      // ============================================
      // SAUVEGARDE USER_PREFERENCES - NOUVELLES DONNÉES PHASE 1
      // ============================================

      // Sauvegarder les préférences utilisateur (auparavant ENTIÈREMENT perdues !)
      if (!companyAlreadyExists && state.data.preferences && Object.keys(state.data.preferences).length > 0) {
        devLogger.debug('💾 Sauvegarde préférences utilisateur:', state.data.preferences);

        try {
          await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              company_id: companyId,

              // Notifications (PreferencesStep)
              email_notifications: state.data.preferences.emailNotifications ?? true,
              push_notifications: state.data.preferences.pushNotifications ?? true,
              sms_notifications: state.data.preferences.smsNotifications ?? false,
              notification_frequency: state.data.preferences.notificationFrequency || 'immediate',

              // Langue et formats (PreferencesStep)
              language: state.data.preferences.language || 'fr',
              currency: state.data.preferences.currency || 'EUR',
              date_format: state.data.preferences.dateFormat || 'DD/MM/YYYY',
              number_format: state.data.preferences.numberFormat || 'FR',
              timezone: state.data.preferences.timezone || 'Europe/Paris',

              // Paramètres métier (PreferencesStep)
              fiscal_year_start: state.data.preferences.fiscalYearStart || '01/01',
              default_payment_terms: parseInt(state.data.preferences.defaultPaymentTerms || '30'),
              auto_backup: state.data.preferences.autoBackup ?? true,

              // Préférences UI
              theme: state.data.preferences.theme || 'light',
              compact_view: state.data.preferences.compactView ?? false,
              show_tooltips: state.data.preferences.showTooltips ?? true,
              auto_save: state.data.preferences.autoSave ?? true
            });

          devLogger.info('✅ Préférences utilisateur sauvegardées avec succès');
        } catch (prefError) {
          devLogger.error('❌ Erreur sauvegarde préférences:', prefError);
          // Ne pas faire échouer tout l'onboarding pour les préférences
        }
      } else if (companyAlreadyExists) {
        devLogger.info('ℹ️ Préférences utilisateur déjà enregistrées, saut de l’insertion.');
      }

      // ============================================
      // SAUVEGARDE COMPANY_FEATURES - NOUVELLES DONNÉES PHASE 2
      // ============================================

      // Sauvegarder les features explorées et activées (auparavant ENTIÈREMENT perdues !)
      if (!companyAlreadyExists && state.data.featuresExploration && Object.keys(state.data.featuresExploration).length > 0) {
        devLogger.debug('💾 Sauvegarde features exploration:', state.data.featuresExploration);

        try {
          const featuresToInsert = Object.entries(state.data.featuresExploration).map(([featureId, featureData]) => ({
            company_id: companyId,
            feature_name: featureId,
            feature_category: 'general', // À affiner selon vos besoins
            is_enabled: (featureData as any).completed || (featureData as any).viewed || false,
            configuration: {
              explored: (featureData as any).viewed || false,
              time_spent: (featureData as any).timeSpent || 0,
              expanded: (featureData as any).expanded || false,
              completed: (featureData as any).completed || false,
              exploration_data: featureData
            },
            usage_limit: null,
            current_usage: 0,
            license_tier: 'free', // Par défaut
            enabled_at: (featureData as any).completed ? new Date().toISOString() : null
          }));

          if (featuresToInsert.length > 0) {
            await supabase
              .from('company_features')
              .insert(featuresToInsert);

            devLogger.info(`✅ ${featuresToInsert.length} features sauvegardées avec succès`);
          }
        } catch (featuresError) {
          devLogger.error('❌ Erreur sauvegarde features:', featuresError);
          // Ne pas faire échouer tout l'onboarding pour les features
        }
      } else if (companyAlreadyExists) {
        devLogger.info('ℹ️ Features déjà enregistrées pour cette entreprise, saut de l’insertion.');
      }

      const { data: userCompanyLink, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id, role, is_active, is_default')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .maybeSingle();

      if (userCompanyError) {
        devLogger.error('❌ Impossible de vérifier user_companies:', userCompanyError);
        throw new Error('Impossible de vérifier le lien utilisateur-entreprise');
      }

      if (!userCompanyLink) {
        const { error: insertUserCompanyError } = await supabase
          .from('user_companies')
          .insert({
            user_id: user.id,
            company_id: companyId,
            role: 'owner',
            is_active: true,
            is_default: true
          });

        if (insertUserCompanyError) {
          devLogger.error('❌ Impossible de créer user_companies:', insertUserCompanyError);
          throw new Error('Impossible de créer le lien utilisateur-entreprise');
        }

        devLogger.info('🔗 Relation user_companies créée pour garantir les accès.');
      } else if (userCompanyLink.role !== 'owner' || !userCompanyLink.is_active || !userCompanyLink.is_default) {
        const { error: updateUserCompanyError } = await supabase
          .from('user_companies')
          .update({
            role: 'owner',
            is_active: true,
            is_default: true
          })
          .eq('id', userCompanyLink.id);

        if (updateUserCompanyError) {
          devLogger.error('❌ Impossible de corriger user_companies:', updateUserCompanyError);
          throw new Error('Impossible de corriger le lien utilisateur-entreprise');
        }

        devLogger.info('🔗 Relation user_companies mise à jour pour rester cohérente.');
      }

      // ============================================
      // MARQUER L'ONBOARDING COMME TERMINÉ DANS LA BDD
      // ============================================
      const completionTimestamp = new Date().toISOString();

      // Mettre à jour onboarding_completed_at dans la table companies
      const { error: updateCompanyError } = await supabase
        .from('companies')
        .update({ onboarding_completed_at: completionTimestamp })
        .eq('id', companyId);

      if (updateCompanyError) {
        devLogger.error('❌ Erreur mise à jour onboarding_completed_at:', updateCompanyError);
        // Ne pas bloquer pour cette erreur, continuer
      } else {
        devLogger.info('✅ onboarding_completed_at mis à jour dans companies');
      }

      // ============================================
      // SAUVEGARDER LES PRÉFÉRENCES UTILISATEUR (PHASE 1)
      // ============================================
      // Persister la langue choisie lors de l'onboarding
      try {
        const userPreferences = {
          language: state.data.preferences?.language || 'fr',
          currency: state.data.preferences?.currency || 'EUR',
          timezone: state.data.preferences?.timezone || 'Europe/Paris',
          dateFormat: state.data.preferences?.dateFormat || 'DD/MM/YYYY',
          theme: state.data.preferences?.theme || 'system',
          notifications: state.data.preferences?.notifications || {
            email: true,
            push: false,
            marketing: false
          }
        };

        // Mettre à jour user_metadata avec les préférences
        const { error: updateAuthError } = await supabase.auth.updateUser({
          data: {
            preferences: userPreferences,
            onboarding_completed_at: completionTimestamp
          }
        });

        if (updateAuthError) {
          devLogger.warn('⚠️ Erreur mise à jour user_metadata:', updateAuthError);
          // Non bloquant - continuer
        } else {
          devLogger.info('✅ Préférences utilisateur sauvegardées (langue:', userPreferences.language, ')');
        }
      } catch (preferencesError) {
        devLogger.warn('⚠️ Erreur sauvegarde préférences:', preferencesError);
        // Non bloquant
      }

      const completedSteps = Array.from(new Set([...(state.data.completedSteps || []), 'complete']));
      const completedData = {
        ...state.data,
        completedSteps,
        completedAt: completionTimestamp,
        progress: 100
      } as OnboardingData;

      const totalTimeSpentMs = Math.max(0, Date.now() - new Date(sessionStartedAt).getTime());
      const totalSteps = Math.max(completedSteps.length, 6);
      const sessionInitialData = activeSession?.sessionData
        ? undefined
        : {
            startedAt: sessionStartedAt,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`
          };

      const sessionUpsertPayload: Record<string, unknown> = {
        session_token: sessionToken,
        user_id: user.id,
        company_id: companyId,
        session_data: completedData,
        current_step: 'complete',
        completed_steps: completedSteps.length,
        total_steps: totalSteps,
        progress: 100,
        final_status: 'completed',
        started_at: sessionStartedAt,
        completed_at: completionTimestamp,
        last_saved_at: completionTimestamp,
        updated_at: completionTimestamp,
        is_active: false,
        final_data: {
          companyId,
          completedAt: completionTimestamp,
          totalTimeSpent: totalTimeSpentMs
        }
      };

      if (activeSession?.id) {
        sessionUpsertPayload.id = activeSession.id;
      }

      if (sessionInitialData) {
        sessionUpsertPayload.initial_data = sessionInitialData;
      }

      // ✅ ENABLED: Mise à jour de la session onboarding
      const { error: sessionUpsertError } = await supabase
        .from('onboarding_sessions')
        .upsert(sessionUpsertPayload, { onConflict: 'session_token' });

      if (sessionUpsertError) {
        devLogger.error('❌ Erreur mise à jour session onboarding:', sessionUpsertError);
        // Ne pas bloquer l'onboarding pour cette erreur
      } else {
        devLogger.info('✅ Session onboarding marquée comme complétée');
      }

      try {
        const steps = [
          { name: 'welcome', order: 1, data: {} },
          { name: 'company', order: 2, data: completedData.companyProfile },
          { name: 'modules', order: 3, data: { selectedModules: completedData.selectedModules } },
          { name: 'preferences', order: 4, data: completedData.preferences },
          { name: 'features', order: 5, data: completedData.featuresExploration },
          { name: 'complete', order: 6, data: { companyId } }
        ];

        const averageStepDurationSeconds = Math.max(1, Math.floor(totalTimeSpentMs / Math.max(steps.length, 1) / 1000));

        const historyEntries = steps.map(step => ({
          company_id: companyId,
          user_id: user.id,
          session_id: sessionToken,
          step_name: step.name,
          step_order: step.order,
          step_data: step.data || {},
          completion_status: 'completed',
          completion_time: completionTimestamp,
          validation_errors: [],
          retry_count: 0,
          time_spent_seconds: averageStepDurationSeconds,
          user_agent: navigator.userAgent,
          screen_resolution: `${screen.width}x${screen.height}`,
          device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
        }));

        await supabase
          .from('onboarding_history')
          .insert(historyEntries);
      } catch (historyError) {
        devLogger.error('❌ Erreur sauvegarde historique:', historyError);
      }

      await storageService.clearOnboardingData(user.id, { finalStatus: 'completed' });

      // ============================================
      // MISE À JOUR ÉTAT LOCAL - ONBOARDING TERMINÉ
      // ============================================
      // Réutiliser completedData déjà défini plus haut (ligne 771)
      // et completionTimestamp déjà défini plus haut (ligne 769)

      // Marquer l'onboarding comme terminé dans l'état local
      setState(prev => ({
        ...prev,
        isCompleted: true,
        data: completedData
      }));

      // ============================================
      // NETTOYAGE COMPLET DU CACHE ONBOARDING
      // ============================================
      // Marquer dans localStorage pour éviter les reprises d'onboarding
      localStorage.setItem('onboarding_just_completed', 'true');
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
      localStorage.setItem(`onboarding_completed_at_${user.id}`, completionTimestamp);

      // Nettoyer TOUS les anciens flags de bannières
      localStorage.removeItem(`tour-banner-dismissed-${user.id}`);
      localStorage.removeItem('onboarding_current_step');
      localStorage.removeItem('onboarding_company_data');
      localStorage.removeItem('onboarding_modules');

      devLogger.info('✅ Onboarding terminé avec succès - État local mis à jour');

      return { success: true };
    } catch (error) {
      devLogger.error('Failed to finalize onboarding - Detailed error:', error);
      devLogger.error('Error type:', typeof error);
      devLogger.error('Error constructor:', error?.constructor?.name);
      devLogger.error('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'not object');
      
      // Gestion spécifique des erreurs
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as { code: string; message: string; details?: string; hint?: string };
        devLogger.error('Supabase error details:', {
          code: supabaseError.code,
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint
        });
        
        if (supabaseError.code === '42501') {
          return { success: false, error: 'Erreur de permissions. Veuillez vous reconnecter et réessayer.' };
        }
        
        if (supabaseError.code === 'PGRST301' || supabaseError.message?.includes('JWT')) {
          return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
        }
        
        if (supabaseError.code === '23502') {
          return { success: false, error: `Champ requis manquant: ${supabaseError.message}` };
        }
        
        if (supabaseError.code === '23505') {
          return { success: false, error: 'Cette entreprise existe déjà. Veuillez choisir un nom différent.' };
        }
        
        return { success: false, error: `Erreur base de données (${supabaseError.code}): ${supabaseError.message}` };
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      devLogger.error('Generic error message:', errorMessage);
      return { success: false, error: `Erreur lors de la finalisation: ${errorMessage}` };
    } finally {
      finalizationInProgress.current = false;
    }
  }, [state.data, user?.id, storageService]);

  const contextValue: OnboardingContextType = {
    state,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    canGoToStep: (stepId) => {
      // Simple logic: can go to any step for now
      return state.steps.some(s => s.id === stepId);
    },
    updateCompanyProfile,
    updateSelectedModules,
    updatePreferences,
    updateFeatureExploration,
    validateCurrentStep,
    validateStep: (stepId) => {
      // Basic validation logic
      const data = state.data;
      if (!data) return Promise.resolve({ isValid: false, errors: [] });

      switch (stepId) {
        case 'company':
          return Promise.resolve({
            isValid: !!(data.companyProfile.name && data.companyProfile.country),
            errors: []
          });
        case 'modules':
          return Promise.resolve({
            isValid: !!(data.selectedModules && data.selectedModules.length > 0),
            errors: []
          });
        default:
          return Promise.resolve({ isValid: true, errors: [] });
      }
    },
    completeCurrentStep,
    completeStep: async (stepId) => {
      const updatedData = state.data ? {
        ...state.data,
        completedSteps: [...state.data.completedSteps.filter(s => s !== stepId), stepId]
      } : null;

      if (updatedData && user?.id) {
        await storageService.saveOnboardingData(user.id, updatedData);
        setState(prev => ({ ...prev, data: updatedData }));
      }
    },
    resetStep: (stepId) => {
      setState(prev => ({
        ...prev,
        data: prev.data ? {
          ...prev.data,
          completedSteps: prev.data.completedSteps.filter(s => s !== stepId)
        } : null
      }));
    },
    saveProgress: async () => {
      if (state.data && user?.id) {
        await storageService.saveOnboardingData(user.id, state.data);
      }
    },
    loadProgress: initializeOnboarding,
    clearProgress: () => {
      if (user?.id) {
        void storageService.clearOnboardingData(user.id);
      }
      setState(initialState);
    },
    finalizeOnboarding,
    skipOnboarding: async () => {
      // Implementation for skipping onboarding
      return Promise.resolve();
    },
    getStepByIndex: (index) => state.steps[index] || null,
    getStepById: (stepId) => state.steps.find(s => s.id === stepId) || null,
    getCurrentStepIndex: () => state.steps.findIndex(s => s.id === state.currentStep?.id),
    getTotalSteps: () => state.steps.length,
    getCompletedStepsCount: () => state.data?.completedSteps.length || 0,
    clearErrors: () => setState(prev => ({ ...prev, errors: [] })),
    addError: (error) => setState(prev => ({ ...prev, errors: [...prev.errors, error] })),
    removeError: (field) => setState(prev => ({
      ...prev,
      errors: prev.errors.filter(e => e.field !== field)
    }))
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};
