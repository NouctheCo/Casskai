import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { ALL_MODULES } from '@/contexts/ModulesContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// LocalStorage keys
const ONBOARDING_STEP_KEY = 'onboarding_current_step';
const ONBOARDING_COMPANY_DATA_KEY = 'onboarding_company_data';
const ONBOARDING_MODULES_KEY = 'onboarding_modules';

// Types
interface CompanyData {
  name: string;
  country: string;
  currency: string;
  sector: string;
  accountingStandard: string;
  siret: string;
  vatNumber: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  fiscalYearStartMonth: number;
  fiscalYearEndMonth: number;
  shareCapital: string;
  ceoName: string;
  ceoTitle: string;
}

interface ModulesState {
  [key: string]: boolean;
}

interface OnboardingContextType {
  currentStep: number;
  companyData: CompanyData;
  setCompanyData: React.Dispatch<React.SetStateAction<CompanyData>>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  modules: ModulesState;
  setModules: React.Dispatch<React.SetStateAction<ModulesState>>;
  clearOnboardingData: () => void;
  completeOnboarding: (companyData: CompanyData, modules: ModulesState) => Promise<{ success: boolean; trialCreated?: boolean; error?: string }>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const defaultCompanyData: CompanyData = {
  name: '',
  country: 'FR',
  currency: 'EUR',
  sector: '',
  accountingStandard: 'PCG',
  siret: '',
  vatNumber: '',
  address: '',
  city: '',
  postalCode: '',
  phone: '',
  email: '',
  website: '',
  fiscalYearStartMonth: 1,
  fiscalYearEndMonth: 12,
  shareCapital: '',
  ceoName: '',
  ceoTitle: 'Gérant',
};

const getInitialModules = (): ModulesState => {
  try {
    return ALL_MODULES.reduce((acc, mod) => {
      if (!mod.isGlobal) {
        acc[mod.key] = false;
      }
      return acc;
    }, {} as ModulesState);
  } catch (error) {
    console.error('Error initializing modules in onboarding context:', error);
    // Fallback avec modules de base
    return {
      accounting: false,
      invoicing: false,
      banking: false,
      reports: false,
    };
  }
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Load initial state from localStorage or use defaults
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
    return savedStep ? JSON.parse(savedStep) : 1;
  });

  const [companyData, setCompanyData] = useState<CompanyData>(() => {
    const savedData = localStorage.getItem(ONBOARDING_COMPANY_DATA_KEY);
    return savedData ? JSON.parse(savedData) : defaultCompanyData;
  });

  const [modules, setModules] = useState<ModulesState>(() => {
    try {
      const savedModules = localStorage.getItem(ONBOARDING_MODULES_KEY);
      return savedModules ? JSON.parse(savedModules) : getInitialModules();
    } catch (error) {
      console.error('Error loading modules from localStorage:', error);
      return getInitialModules();
    }
  });

  // Persist state to localStorage on change with error handling
  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_STEP_KEY, JSON.stringify(currentStep));
    } catch (error) {
      console.error('Error saving onboarding step to localStorage:', error);
    }
  }, [currentStep]);

  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_COMPANY_DATA_KEY, JSON.stringify(companyData));
    } catch (error) {
      console.error('Error saving company data to localStorage:', error);
    }
  }, [companyData]);

  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_MODULES_KEY, JSON.stringify(modules));
    } catch (error) {
      console.error('Error saving modules to localStorage:', error);
    }
  }, [modules]);

  // Navigation functions
  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const newStep = Math.min(prev + 1, 5);
      return newStep;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const newStep = Math.max(prev - 1, 1);
      return newStep;
    });
  }, []);

  const goToStep = useCallback((step: number) => {
    const newStep = Math.max(1, Math.min(step, 5));
    setCurrentStep(newStep);
  }, []);

  // Cleanup function
  const clearOnboardingData = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_STEP_KEY);
      localStorage.removeItem(ONBOARDING_COMPANY_DATA_KEY);
      localStorage.removeItem(ONBOARDING_MODULES_KEY);
      // Reset state to defaults
      setCurrentStep(1);
      setCompanyData(defaultCompanyData);
      setModules(getInitialModules());
      console.warn('🧹 Onboarding data cleared successfully');
    } catch (error) {
      console.error('Error clearing onboarding data:', error);
    }
  }, []);

  // Complete onboarding function
  const completeOnboarding = useCallback(async (companyData: CompanyData, modules: ModulesState) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      // Prepare the modules payload with both key and name
      const enabledModules = Object.keys(modules)
        .filter(key => modules[key])
        .map(key => {
          const moduleInfo = ALL_MODULES.find(m => m.key === key);
          return { key: key, name: moduleInfo?.name || key };
        });

      const { data: newCompany, error } = await supabase.rpc('complete_onboarding', {
        p_user_id: user.id,
        p_company_name: companyData.name,
        p_company_data: companyData,
        p_modules: enabledModules
      });

      if (error) {
        console.error('Error calling complete_onboarding function:', error);
        throw new Error(`Failed to complete onboarding: ${error.message}`);
      }

      // 4. Store company ID in localStorage for immediate use
      localStorage.setItem('casskai_current_company_id', newCompany.id);

      // Set a flag for AuthContext to read on reload, preventing flicker
      localStorage.setItem('onboarding_just_completed', 'true');

      console.log('✅ Onboarding completed successfully for company:', newCompany.name);
      
      return { 
        success: true, 
        trialCreated: true // Assuming trial is created by default
      };

    } catch (error) {
      console.error('Error completing onboarding:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }, [user]);

  const contextValue = useMemo(() => ({
    currentStep,
    companyData,
    setCompanyData,
    nextStep,
    prevStep,
    goToStep,
    modules,
    setModules,
    clearOnboardingData,
    completeOnboarding,
  }), [
    currentStep,
    companyData,
    modules,
    nextStep,
    prevStep,
    goToStep,
    clearOnboardingData,
    completeOnboarding,
  ]);

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export { OnboardingContext };