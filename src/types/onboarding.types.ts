export interface OnboardingStep {
  id: string;
  name: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  locked: boolean;
  order: number;
}

export interface CompanyProfile {
  // Propriétés directes pour compatibilité
  name?: string;
  legalName?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  registrationNumber?: string;
  vatNumber?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  shareCapital?: string;
  ceoName?: string;
  sector?: string;
  fiscalYearStart?: number;
  fiscalYearEnd?: number;
  accountingStandard?: string;
  
  // Structure imbriquée pour les données d'entreprise
  generalInfo?: {
    name?: string;
    legalName?: string;
    siret?: string;
    vatNumber?: string;
    shareCapital?: string;
    ceoName?: string;
  };
  
  contact?: {
    address?: {
      street?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
    phone?: string;
    email?: string;
    website?: string;
  };
  
  business?: {
    sector?: string;
    currency?: string;
    timezone?: string;
  };
  
  accounting?: {
    fiscalYearStart?: number;
    fiscalYearEnd?: number;
    accountingStandard?: string;
  };
}

export interface OnboardingPreferences {
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
}

export interface FeatureExploration {
  [featureId: string]: {
    viewed: boolean;
    expanded: boolean;
    completed: boolean;
    timeSpent: number;
  };
}

export interface OnboardingData {
  userId: string;
  companyProfile: Partial<CompanyProfile>;
  selectedModules: string[];
  preferences: Partial<OnboardingPreferences>;
  featuresExploration: FeatureExploration;
  currentStepId: string;
  completedSteps: string[];
  startedAt: string;
  lastSavedAt: string;
  completedAt?: string;
  progress: number;
}

export interface OnboardingValidationError {
  field: string;
  message: string;
  code: string;
}

export interface OnboardingState {
  isLoading: boolean;
  isInitialized: boolean;
  isCompleted: boolean;
  currentStep: OnboardingStep | null;
  steps: OnboardingStep[];
  data: OnboardingData | null;
  errors: OnboardingValidationError[];
  progress: number;
}

export type OnboardingStepId = 'welcome' | 'company' | 'modules' | 'preferences' | 'features' | 'complete';

export interface StepValidationResult {
  isValid: boolean;
  errors: OnboardingValidationError[];
}

export interface OnboardingContextType {
  // État
  state: OnboardingState;
  
  // Actions de navigation
  goToStep: (stepId: OnboardingStepId) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  canGoToStep: (stepId: OnboardingStepId) => boolean;
  
  // Actions de données
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  updateSelectedModules: (modules: string[]) => void;
  updatePreferences: (preferences: Partial<OnboardingPreferences>) => void;
  updateFeatureExploration: (featureId: string, data: Partial<FeatureExploration[string]>) => void;
  
  // Actions de validation
  validateCurrentStep: () => Promise<StepValidationResult>;
  validateStep: (stepId: OnboardingStepId) => Promise<StepValidationResult>;
  
  // Actions de progression
  completeCurrentStep: () => Promise<void>;
  completeStep: (stepId: OnboardingStepId) => Promise<void>;
  resetStep: (stepId: OnboardingStepId) => void;
  
  // Actions de sauvegarde
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  clearProgress: () => void;
  
  // Actions de finalisation
  finalizeOnboarding: () => Promise<{ success: boolean; error?: string }>;
  skipOnboarding: () => Promise<void>;
  
  // Utilitaires
  getStepByIndex: (index: number) => OnboardingStep | null;
  getStepById: (stepId: OnboardingStepId) => OnboardingStep | null;
  getCurrentStepIndex: () => number;
  getTotalSteps: () => number;
  getCompletedStepsCount: () => number;
  
  // Gestion des erreurs
  clearErrors: () => void;
  addError: (error: OnboardingValidationError) => void;
  removeError: (field: string) => void;
}