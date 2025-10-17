import {
  OnboardingData,
  OnboardingStep,
  OnboardingStepId,
} from '../../types/onboarding.types';
import { logger } from '@/utils/logger';

export interface OnboardingResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
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

type ProgressStep = {
  id: OnboardingStepId;
  name: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  locked: boolean;
  order: number;
  isRequired: boolean;
  estimatedTime: number;
};

// Étapes requises AVANT la connexion
// L'étape 'experience' est maintenant après la connexion, dans l'application
const REQUIRED_STEPS: OnboardingStepId[] = [
  'welcome',
  'preferences',
  'company',
  'modules',
  'complete',
];

export class OnboardingProgressService {
  // Étapes de l'onboarding AVANT connexion
  // L'étape 'experience' est désormais dans l'application après connexion
  private readonly steps: ProgressStep[] = [
    {
      id: 'welcome',
      name: 'welcome',
      title: 'Bienvenue',
      description: 'Introduction a CassKai',
      completed: false,
      current: false,
      locked: false,
      isRequired: true,
      order: 1,
      estimatedTime: 2,
    },
    {
      id: 'preferences',
      name: 'preferences',
      title: 'Preferences',
      description: 'Configuration de votre environnement',
      completed: false,
      current: false,
      locked: true,
      isRequired: true,
      order: 2,
      estimatedTime: 3,
    },
    {
      id: 'company',
      name: 'company',
      title: 'Profil entreprise',
      description: 'Informations sur votre entreprise',
      completed: false,
      current: false,
      locked: true,
      isRequired: true,
      order: 3,
      estimatedTime: 5,
    },
    {
      id: 'modules',
      name: 'modules',
      title: 'Selection des modules',
      description: 'Choisissez les fonctionnalites a activer',
      completed: false,
      current: false,
      locked: true,
      isRequired: true,
      order: 4,
      estimatedTime: 4,
    },
    {
      id: 'complete',
      name: 'complete',
      title: 'Finalisation',
      description: 'Finaliser la configuration',
      completed: false,
      current: false,
      locked: true,
      isRequired: true,
      order: 5,
      estimatedTime: 2,
    },
  ];

  // Prérequis pour chaque étape de l'onboarding
  // L'étape 'experience' n'est plus dans l'onboarding initial
  private readonly prerequisites: Partial<Record<OnboardingStepId, OnboardingStepId[]>> = {
    preferences: ['welcome'],
    company: ['welcome', 'preferences'],
    modules: ['welcome', 'preferences', 'company'],
    complete: ['welcome', 'preferences', 'company', 'modules'],
  };

  getStepsWithStatus(data: OnboardingData): Array<
    OnboardingStep & { isCompleted: boolean; isCurrent: boolean }
  > {
    const completedSteps = data.completedSteps || [];
    const currentStepIndex = this.getCurrentStepIndex(completedSteps);

    return this.steps.map((step, index) => ({
      ...step,
      locked: !this.hasCompletedPrerequisites(step.id, completedSteps),
      isCompleted: completedSteps.includes(step.id),
      isCurrent: index === currentStepIndex,
    }));
  }

  getNextStep(currentStep: OnboardingStepId): OnboardingStepId {
    const ordered = [...this.steps].sort((a, b) => a.order - b.order);
    const currentIndex = ordered.findIndex((step) => step.id === currentStep);
    if (currentIndex === -1 || currentIndex >= ordered.length - 1) {
      return 'complete';
    }
    return ordered[currentIndex + 1].id;
  }

  getPreviousStep(currentStep: OnboardingStepId): OnboardingStepId | null {
    const ordered = [...this.steps].sort((a, b) => a.order - b.order);
    const currentIndex = ordered.findIndex((step) => step.id === currentStep);
    if (currentIndex <= 0) {
      return null;
    }
    return ordered[currentIndex - 1].id;
  }

  calculateProgress(completedSteps: string[]): number {
    if (!completedSteps || !completedSteps.length) {
      return 0;
    }

    const total = this.getTotalRequiredSteps();
    const completed = REQUIRED_STEPS.filter((stepId) => completedSteps.includes(stepId)).length;
    return Math.min(100, Math.round((completed / total) * 100));
  }

  getTotalRequiredSteps(): number {
    return REQUIRED_STEPS.length;
  }

  getAllStepIds(): OnboardingStepId[] {
    return this.steps.map((step) => step.id);
  }

  hasCompletedPrerequisites(stepId: OnboardingStepId, completedSteps: string[]): boolean {
    const deps = this.prerequisites[stepId];
    if (!deps || !deps.length) {
      return true;
    }
    return deps.every((dependency) => completedSteps.includes(dependency));
  }

  async getOnboardingProgress(
    _userId: string,
    data: OnboardingData
  ): Promise<OnboardingResponse<OnboardingProgress>> {
    try {
      const completedSteps = data.completedSteps || [];
      const currentStepIndex = this.getCurrentStepIndex(completedSteps);
      return {
        success: true,
        data: {
          totalSteps: this.getTotalRequiredSteps(),
          completedSteps: completedSteps.length,
          currentStepIndex,
          percentage: this.calculateProgress(completedSteps),
        },
      };
    } catch (error) {
      logger.error('getOnboardingProgress error:', error);
      return {
        success: false,
        error: 'Erreur lors du calcul de la progression',
      };
    }
  }

  async getOnboardingMetrics(): Promise<OnboardingResponse<OnboardingMetrics>> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const metrics: OnboardingMetrics = {
        totalSessions: 1324,
        completedSessions: 1152,
        abandonmentRate: 100 - Math.round((1152 / 1324) * 100),
        averageCompletionTime: 9.2,
        stepsMetrics: this.steps.map((step) => ({
          stepId: step.id,
          completionRate: 70 + Math.random() * 30,
          averageTime: step.estimatedTime * (0.8 + Math.random() * 0.4),
        })),
      };

      return { success: true, data: metrics };
    } catch (error) {
      logger.error('getOnboardingMetrics error:', error);
      return {
        success: false,
        error: 'Erreur lors de la recuperation des metriques',
      };
    }
  }

  getEstimatedRemainingTime(data: OnboardingData): number {
    const completedSteps = data.completedSteps || [];
    return this.steps
      .filter((step) => step.isRequired && !completedSteps.includes(step.id))
      .reduce((total, step) => total + step.estimatedTime, 0);
  }

  private getCurrentStepIndex(completedSteps: string[]): number {
    if (!completedSteps.length) {
      return 0;
    }

    const ordered = [...this.steps].sort((a, b) => a.order - b.order);
    let maxIndex = -1;

    completedSteps.forEach((stepId) => {
      const index = ordered.findIndex((step) => step.id === stepId);
      if (index > maxIndex) {
        maxIndex = index;
      }
    });

    return Math.min(maxIndex + 1, ordered.length - 1);
  }
}
