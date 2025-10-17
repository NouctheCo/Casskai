/* eslint-disable */
import React, { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { logger } from '@/utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
  currentStepId: 'welcome',
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
      // Load existing data - DISABLED OnboardingStorageService due to missing onboarding_sessions table
      // const response = await storageService.getOnboardingData(user.id);
      // const savedData = response.success ? response.data : null;
      const data = { ...initialData, userId: user.id };

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
      logger.error('Failed to initialize onboarding:', error);
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

      // Save asynchronously without blocking - DISABLED due to missing onboarding_sessions table
      // if (user?.id) {
      //   storageService.saveOnboardingData(user.id, updatedData);
      // }

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

      // Save asynchronously without blocking - DISABLED due to missing onboarding_sessions table
      // if (user?.id) {
      //   storageService.saveOnboardingData(user.id, updatedData);
      // }

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

      // Save asynchronously without blocking - DISABLED due to missing onboarding_sessions table
      // if (user?.id) {
      //   storageService.saveOnboardingData(user.id, updatedData);
      // }

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

      // Save asynchronously without blocking - DISABLED due to missing onboarding_sessions table
      // if (user?.id) {
      //   storageService.saveOnboardingData(user.id, updatedData);
      // }

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

      // Save asynchronously without blocking - DISABLED due to missing onboarding_sessions table
      // if (user?.id) {
      //   storageService.saveOnboardingData(user.id, updatedData);
      // }

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

    // Save asynchronously - DISABLED due to missing onboarding_sessions table
    // if (user?.id) {
    //   await storageService.saveOnboardingData(user.id, updatedData);
    // }

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
      logger.warn('Finalisation déjà en cours, appel ignoré');
      return { success: false, error: 'Finalisation déjà en cours' };
    }
    
    finalizationInProgress.current = true;
    
    try {
      // Vérifier que la session est toujours valide
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
      }

      // DISABLED OnboardingStorageService due to missing onboarding_sessions table
      // const activeSessionResponse = await storageService.getActiveSession(user.id);
      // const activeSession = activeSessionResponse.success ? activeSessionResponse.data : null;
      const activeSession = null;
      const sessionToken = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `session_${Date.now()}`;
      const sessionStartedAt = state.data.startedAt || new Date().toISOString();

      // Vérification légère - laissons le système de gouvernance des données gérer les doublons
      // Cette vérification était trop restrictive et bloquait l'onboarding légitime
      logger.info('🔍 Préparation création entreprise:', state.data.companyProfile.name?.trim());

      // Create company in database using RPC function
      logger.info('🔧 [OnboardingContextNew] Creating company via RPC function');
    const companyData = {
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

          // ========== NOUVELLES COLONNES PHASE 1 ==========
          // CompanyStep - 8 colonnes auparavant perdues !
          timezone: state.data.companyProfile.timezone || 'Europe/Paris',
          share_capital: state.data.companyProfile.shareCapital ? parseFloat(state.data.companyProfile.shareCapital) : null,
          ceo_name: state.data.companyProfile.ceoName || null,
          sector: state.data.companyProfile.sector || null,
          ceo_title: state.data.companyProfile.ceoTitle || 'CEO',
          industry_type: state.data.companyProfile.industryType || null,
          company_size: state.data.companyProfile.companySize || null,
          registration_date: state.data.companyProfile.registrationDate ? new Date(state.data.companyProfile.registrationDate).toISOString().split('T')[0] : null,

          // Colonnes optionnelles communes et sûres
          ...(state.data.companyProfile?.contact?.phone && {
            phone: state.data.companyProfile.contact.phone
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

    logger.info('📤 [OnboardingContextNew] Company data to insert via Supabase:', companyData);
    
      const getExistingCompany = async (): Promise<Record<string, any> | null> => {
        try {
          const { data: link, error: linkError } = await supabase
            .from('user_companies')
            .select('company_id, is_active, is_default, role, updated_at, created_at')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (linkError && linkError.code !== 'PGRST116') {
            logger.error('❌ [OnboardingContextNew] Failed to lookup existing company link:', linkError);
            return null;
          }

          if (!link?.company_id) {
            return null;
          }

          const { data: companyRecord, error: companyFetchError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', link.company_id)
            .maybeSingle();

          if (companyFetchError && companyFetchError.code !== 'PGRST116') {
            logger.error('❌ [OnboardingContextNew] Failed to fetch existing company record:', companyFetchError);
            return null;
          }

          if (!companyRecord) {
            return null;
          }

          return companyRecord as Record<string, any>;
        } catch (lookupError) {
          logger.error('❌ [OnboardingContextNew] Exception while checking existing company:', lookupError);
          return null;
        }
      };

      const createCompanyViaRpc = async (): Promise<Record<string, any>> => {
        const { data: companyResult, error: companyError } = await supabase.rpc('create_company_with_defaults', { p_payload: companyData });

        if (companyError) {
          logger.error('❌ [OnboardingContextNew] Company creation error:', companyError);
          throw new Error(`Impossible de créer l'entreprise. Erreur: ${companyError.message}`);
        }

        if (!companyResult) {
          throw new Error('Failed to create company - no data returned');
        }

        const rpcPayload = companyResult as Record<string, any>;

        if (rpcPayload.success === false) {
          const rpcMessage = rpcPayload.message || 'RPC returned an error while creating the company';
          logger.error('❌ [OnboardingContextNew] Company creation RPC reported failure:', rpcPayload);
          throw new Error(rpcMessage);
        }

        const rawCompanyData = ((rpcPayload.data && rpcPayload.data.company) || {}) as Record<string, any>;
        const companyIdFromPayload = rawCompanyData.id ?? rpcPayload.company_id ?? rpcPayload.id;

        if (!companyIdFromPayload) {
          logger.error('❌ [OnboardingContextNew] Invalid RPC payload:', rpcPayload);
          throw new Error('Failed to create company - no company identifier returned by Supabase');
        }

        return {
          ...rawCompanyData,
          id: companyIdFromPayload,
          name: rawCompanyData.name ?? companyData.name,
          country: rawCompanyData.country ?? companyData.country,
          default_currency: rawCompanyData.default_currency ?? companyData.default_currency,
          currency: rawCompanyData.currency ?? companyData.default_currency,
          owner_id: rawCompanyData.owner_id ?? user.id
        };
      };

      const buildCompanyUpdatePayload = (): Record<string, unknown> => {
        const payload: Record<string, unknown> = {
          name: companyData.name,
          country: companyData.country,
          default_currency: companyData.default_currency,
          timezone: companyData.timezone,
          share_capital: companyData.share_capital,
          ceo_name: companyData.ceo_name,
          sector: companyData.sector,
          ceo_title: companyData.ceo_title,
          industry_type: companyData.industry_type,
          company_size: companyData.company_size,
          registration_date: companyData.registration_date,
          email: companyData.email,
          phone: companyData.phone,
          website: companyData.website,
          updated_at: new Date().toISOString()
        };

        Object.keys(payload).forEach((key) => {
          if (payload[key] === undefined) {
            delete payload[key];
          }
        });

        return payload;
      };

      let company = null as Record<string, any> | null;
      let companyCreatedDuringRun = false;

      try {
        company = await createCompanyViaRpc();
        companyCreatedDuringRun = true;
      } catch (creationError) {
        const errorMessage = creationError instanceof Error ? creationError.message : String(creationError);
        if (errorMessage.includes('journals_company_id_code_key') || errorMessage.toLowerCase().includes('duplicate key')) {
          logger.warn('⚠️ [OnboardingContextNew] Duplicate journal constraint triggered, attempting to reuse existing company');
          company = await getExistingCompany();

          if (!company) {
            throw creationError;
          }
        } else {
          throw creationError;
        }
      }

      if (!company) {
        throw new Error('No company available after creation attempt');
      }

      company.default_currency = company.default_currency ?? companyData.default_currency;
      company.country = company.country ?? companyData.country;
      company.name = company.name ?? companyData.name;
      company.owner_id = company.owner_id ?? user.id;

      if (!companyCreatedDuringRun) {
        const updatePayload = buildCompanyUpdatePayload();
        if (Object.keys(updatePayload).length > 0) {
          try {
            await supabase
              .from('companies')
              .update(updatePayload)
              .eq('id', company.id);
            logger.info('🛠️ [OnboardingContextNew] Existing company updated with onboarding data');
          } catch (updateError) {
            logger.error('❌ [OnboardingContextNew] Failed to update existing company during onboarding:', updateError);
          }
        }

        try {
          await supabase
            .from('user_companies')
            .upsert({
              user_id: user.id,
              company_id: company.id,
              role: 'owner',
              is_default: true,
              is_active: true,
              status: 'active',
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,company_id' });
        } catch (linkUpsertError) {
          logger.error('❌ [OnboardingContextNew] Failed to ensure user-company link during onboarding:', linkUpsertError);
        }
      }

      logger.info('✅ [OnboardingContextNew] Company ready for onboarding finalisation:', {
        companyId: company.id,
        createdThisRun: companyCreatedDuringRun
      });

      // Create company modules
      const selectedModules = state.data.selectedModules || [];
      const baseModules = ['dashboard', 'settings', 'users', 'security'];
      const enabledModules = Array.from(new Set([...baseModules, ...selectedModules]));

      if (enabledModules.length > 0) {
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
          .upsert(modulesToInsert, { onConflict: 'company_id,module_key' });
      }

      // ============================================
      // SAUVEGARDE USER_PREFERENCES - NOUVELLES DONNÉES PHASE 1
      // ============================================

      // Sauvegarder les préférences utilisateur (auparavant ENTIÈREMENT perdues !)
      if (state.data.preferences && Object.keys(state.data.preferences).length > 0) {
        logger.info('💾 Sauvegarde préférences utilisateur:', state.data.preferences);

        try {
          await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              company_id: company.id,

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
            }, { onConflict: 'user_id,company_id' });

          logger.info('✅ Préférences utilisateur sauvegardées avec succès')
        } catch (prefError) {
          logger.error('❌ Erreur sauvegarde préférences:', prefError);
          // Ne pas faire échouer tout l'onboarding pour les préférences
        }
      }

      // ============================================
      // SAUVEGARDE COMPANY_FEATURES - NOUVELLES DONNÉES PHASE 2
      // ============================================

      // Sauvegarder les features explorées et activées (auparavant ENTIÈREMENT perdues !)
      if (state.data.featuresExploration && Object.keys(state.data.featuresExploration).length > 0) {
        logger.info('💾 Sauvegarde features exploration:', state.data.featuresExploration);

        try {
          const featuresToInsert = Object.entries(state.data.featuresExploration).map(([featureId, featureData]) => ({
            company_id: company.id,
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
              .upsert(featuresToInsert, { onConflict: 'company_id,feature_name' });

            logger.info(`✅ ${featuresToInsert.length} features sauvegardées avec succès`)
          }
        } catch (featuresError) {
          logger.error('❌ Erreur sauvegarde features:', featuresError);
          // Ne pas faire échouer tout l'onboarding pour les features
        }
      }

      const completionTimestamp = new Date().toISOString();
      const completedSteps = Array.from(new Set([...(state.data.completedSteps || []), 'complete']));
      const completedData = {
        ...state.data,
        companyProfile: {
          ...state.data.companyProfile,
          name: company.name ?? state.data.companyProfile?.name,
          country: company.country ?? state.data.companyProfile?.country,
          currency: company.default_currency ?? company.currency ?? (state.data.companyProfile as any)?.currency
        },
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
        company_id: company.id,
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
          companyId: company.id,
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

      // DISABLED onboarding_sessions due to missing table in production
      // const { error: sessionUpsertError } = await supabase
      //   .from('onboarding_sessions')
      //   .upsert(sessionUpsertPayload, { onConflict: 'session_token' });

      // if (sessionUpsertError) {
      //   logger.error('❌ Erreur mise à jour session onboarding:', sessionUpsertError);
      // }

      try {
        const steps = [
          { name: 'welcome', order: 1, data: {} },
          { name: 'preferences', order: 2, data: completedData.preferences },
          { name: 'company', order: 3, data: completedData.companyProfile },
          { name: 'modules', order: 4, data: { selectedModules: completedData.selectedModules } },
          { name: 'complete', order: 5, data: { companyId: company.id } }
        ];

        const averageStepDurationSeconds = Math.max(1, Math.floor(totalTimeSpentMs / Math.max(steps.length, 1) / 1000));

        const historyEntries = steps.map(step => ({
          company_id: company.id,
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
        logger.error('❌ Erreur sauvegarde historique:', historyError)
      }

      // DISABLED OnboardingStorageService due to missing onboarding_sessions table
      // await storageService.clearOnboardingData(user.id, { finalStatus: 'completed' });

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

      // Marquer dans localStorage pour éviter les reprises d'onboarding
      localStorage.setItem('onboarding_just_completed', 'true');
      localStorage.removeItem('onboarding_current_step');
      localStorage.removeItem('onboarding_company_data');
      localStorage.removeItem('onboarding_modules');

      logger.info('✅ Onboarding terminé avec succès - État local mis à jour');

      return { success: true };
    } catch (error) {
      logger.error('Failed to finalize onboarding - Detailed error:', error);
      logger.error('Error type:', typeof error);
      logger.error('Error constructor:', error?.constructor?.name);
      logger.error('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'not object');
      
      // Gestion spécifique des erreurs
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as { code: string; message: string; details?: string; hint?: string };
        console.error('Supabase error details:', {
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
      logger.error('Generic error message:', errorMessage);
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
        // DISABLED OnboardingStorageService due to missing onboarding_sessions table
        // await storageService.saveOnboardingData(user.id, updatedData);
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
        // DISABLED OnboardingStorageService due to missing onboarding_sessions table
        // await storageService.saveOnboardingData(user.id, state.data);
      }
    },
    loadProgress: initializeOnboarding,
    clearProgress: () => {
      if (user?.id) {
        // DISABLED OnboardingStorageService due to missing onboarding_sessions table
        // storageService.clearOnboardingData(user.id);
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


