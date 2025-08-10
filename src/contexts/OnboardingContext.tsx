import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ALL_MODULES } from '@/contexts/ModulesContext';

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
  fiscalYearStart: number;
  fiscalYearEnd: string;
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
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  const [companyData, setCompanyData] = useState<CompanyData>({
    // Informations de base
    name: '',
    country: 'FR', // Défaut France
    currency: 'EUR', // Auto-déterminé par le pays
    sector: '',
    accountingStandard: 'PCG', // Auto-déterminé par le pays (PCG pour France par défaut)
    
    // Informations détaillées
    siret: '',
    vatNumber: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    
    // Année fiscale
    fiscalYearStart: 1,
  fiscalYearEnd: '12',
    
    // Capital
    shareCapital: '',
    
    // Dirigeant
    ceoName: '',
    ceoTitle: 'Gérant',
  });

  // Initialize modules state once - start with empty selection for onboarding
  const [modules, setModules] = useState<ModulesState>(() => {
    const initial: ModulesState = {};
    ALL_MODULES.forEach((mod: { key: string; isGlobal?: boolean }) => {
      if (!mod.isGlobal) {
        // Start with false for onboarding, user will choose
        initial[mod.key] = false;
      }
    });
    return initial;
  });

  // Memoize navigation functions to prevent unnecessary re-renders
  const nextStep = useCallback(() => {
  // Allow navigating up to step 5 (CompleteStep) so finalization runs
  setCurrentStep(prev => Math.min(prev + 1, 5));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
  // Clamp between 1 and 5 (inclusive)
  setCurrentStep(Math.max(1, Math.min(step, 5)));
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    currentStep,
    companyData,
    setCompanyData,
    nextStep,
    prevStep,
    goToStep,
    modules,
    setModules,
  }), [
    currentStep,
    companyData,
    nextStep,
    prevStep,
    goToStep,
    modules,
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