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
  // Identifiants et infos légales supplémentaires (utilisées dans OnboardingContextNew)
  siret?: string;
  siren?: string;
  taxNumber?: string;
  legalForm?: string;

  // Adresse plate (en plus de contact.address pour compatibilité)
  address?: string;
  city?: string;
  postalCode?: string;

  // Comptabilité avancée
  accountingMethod?: string;
  fiscalYearType?: string;
  fiscalYearStartMonth?: number;
  fiscalYearStartDay?: number;
  street?: string;
  // postalCode/city déjà présents plus haut pour compatibilité plate
  phone?: string;
  email?: string;
  website?: string;
  shareCapital?: string;
  ceoName?: string;
  ceoTitle?: string;
  sector?: string;
  industryType?: string;
  companySize?: string;
  registrationDate?: string;
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

  // Notifications détaillées (PHASE 1 - user_preferences)
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  notificationFrequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';

  // Structure existante pour compatibilité
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };

  // Paramètres métier (PHASE 1 - user_preferences)
  fiscalYearStart?: string;
  defaultPaymentTerms?: string;
  autoBackup?: boolean;

  // Préférences UI (PHASE 1 - user_preferences)
  compactView?: boolean;
  showTooltips?: boolean;
  autoSave?: boolean;
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

export type OnboardingStepId = 'language' | 'welcome' | 'company' | 'modules' | 'preferences' | 'features' | 'complete';

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
