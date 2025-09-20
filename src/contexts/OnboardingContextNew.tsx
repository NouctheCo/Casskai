import React, { createContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
      // Load existing data
      const response = await storageService.getOnboardingData(user.id);
      const savedData = response.success ? response.data : null;
      const data = savedData || { ...initialData, userId: user.id };

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
      console.error('Failed to initialize onboarding:', error);
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

      // Save asynchronously without blocking
      if (user?.id) {
        storageService.saveOnboardingData(user.id, updatedData);
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

      // Save asynchronously without blocking
      if (user?.id) {
        storageService.saveOnboardingData(user.id, updatedData);
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

      // Save asynchronously without blocking
      if (user?.id) {
        storageService.saveOnboardingData(user.id, updatedData);
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

      // Save asynchronously without blocking
      if (user?.id) {
        storageService.saveOnboardingData(user.id, updatedData);
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

      // Save asynchronously without blocking
      if (user?.id) {
        storageService.saveOnboardingData(user.id, updatedData);
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

    // Save asynchronously
    if (user?.id) {
      await storageService.saveOnboardingData(user.id, updatedData);
    }

    setState(prev => ({
      ...prev,
      data: updatedData,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, completed: true } : s)
    }));
  }, [state.currentStep, state.data, progressService, storageService, user?.id]);

  // Protection contre les appels multiples de finalisation
  const finalizationInProgress = useRef(false);
  
  // Finalization
  const finalizeOnboarding = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!state.data || !user?.id) return { success: false, error: 'No onboarding data or user' };
    
    // Protection contre les appels multiples
    if (finalizationInProgress.current) {
      console.warn('Finalisation déjà en cours, appel ignoré');
      return { success: false, error: 'Finalisation déjà en cours' };
    }
    
    finalizationInProgress.current = true;
    
    try {
      // Vérifier que la session est toujours valide
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
      }

      // Vérification plus robuste des entreprises existantes
      const { data: existingCompanies, error: checkError } = await supabase
        .from('companies')
        .select('id, name, created_at')
        .eq('owner_id', user.id)
        .eq('name', state.data.companyProfile.name?.trim())
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes

      if (checkError) {
        console.warn('Impossible de vérifier les entreprises existantes:', checkError);
      } else if (existingCompanies && existingCompanies.length > 0) {
        console.warn('Entreprise récente trouvée:', existingCompanies);
        return { success: false, error: 'Une entreprise avec ce nom a été créée récemment. Veuillez recharger la page.' };
      }

      // Create company in database
      // Générer un id côté client pour éviter l'utilisation de .single() avec SELECT
      const companyId = crypto.randomUUID();

    const { error } = await supabase
        .from('companies')
        .insert({
          id: companyId,
          owner_id: user.id,
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
      // default_locale et timezone existent dans les deux scripts
      default_locale: 'fr-FR',
      timezone: 'Europe/Paris',
          // Champs désormais unifiés (alignés prod):
          registration_number: state.data.companyProfile?.generalInfo?.siret || '',
          tax_number: state.data.companyProfile?.generalInfo?.vatNumber || '',
          address: state.data.companyProfile?.contact?.address?.street || '',
          city: state.data.companyProfile?.contact?.address?.city || '',
          postal_code: state.data.companyProfile?.contact?.address?.postalCode || '',
          phone: state.data.companyProfile?.contact?.phone || '',
          email: state.data.companyProfile.email,
          website: state.data.companyProfile.website,
          sector: state.data.companyProfile.sector,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Create user-company relationship
    await supabase
        .from('user_companies')
        .insert({
          user_id: user.id,
      company_id: companyId,
          role: 'admin',
      is_active: true,
      is_default: true
        });

      // Create company modules
      if (state.data.selectedModules.length > 0) {
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

        const modulesToInsert = state.data.selectedModules.map(moduleId => ({
          company_id: companyId,
          module_key: moduleId,
          module_name: moduleNames[moduleId as keyof typeof moduleNames] || moduleId,
          is_enabled: true
        }));

        await supabase
          .from('company_modules')
          .insert(modulesToInsert);
      }

      // Mark onboarding as completed
      const completedData = {
        ...state.data,
        completedAt: new Date().toISOString(),
        progress: 100
      };

      await storageService.saveOnboardingData(user.id, completedData);

      setState(prev => ({
        ...prev,
        isCompleted: true,
        data: completedData
      }));

      return { success: true };
    } catch (error) {
      console.error('Failed to finalize onboarding - Detailed error:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error keys:', error && typeof error === 'object' ? Object.keys(error) : 'not object');
      
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
      console.error('Generic error message:', errorMessage);
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
        storageService.clearOnboardingData(user.id);
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
