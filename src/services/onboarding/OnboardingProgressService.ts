// @ts-nocheck
import {
  OnboardingData,
  OnboardingStepId,
  OnboardingStep
} from '../../types/onboarding.types';
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

type ProgressStep = OnboardingStep & { isRequired: boolean; estimatedTime: number };

export class OnboardingProgressService {
  private readonly steps: ProgressStep[] = [
    {
      id: 'welcome',
      title: 'Bienvenue',
      description: 'Introduction à CassKai',
      isRequired: true,
      order: 1,
      estimatedTime: 2
    },
    {
      id: 'company',
      title: 'Profil Entreprise',
      description: 'Informations sur votre entreprise',
      isRequired: true,
      order: 2,
      estimatedTime: 5
    },
    {
      id: 'preferences',
      title: 'Préférences',
      description: 'Configuration de votre environnement',
      isRequired: true,
      order: 3,
      estimatedTime: 3
    },
    {
      id: 'complete',
      title: 'Finalisation',
      description: 'Finaliser la configuration',
      isRequired: true,
      order: 4,
      estimatedTime: 2
    }
  ];

  /**
   * Obtient l'étape suivante dans le processus
   */
  getNextStep(currentStep: OnboardingStepId): OnboardingStepId {
    const currentIndex = this.steps.findIndex(s => s.id === currentStep);
    if (currentIndex === -1 || currentIndex >= this.steps.length - 1) {
      return 'complete';
    }
    
  const nextStep = this.steps[currentIndex + 1];
  return (nextStep ? (nextStep.id as OnboardingStepId) : 'complete');
  }

  /**
   * Obtient l'étape précédente dans le processus
   */
  getPreviousStep(currentStep: OnboardingStepId): OnboardingStepId | null {
    const currentIndex = this.steps.findIndex(s => s.id === currentStep);
    if (currentIndex <= 0) {
      return null;
    }
    
  const previousStep = this.steps[currentIndex - 1];
  return previousStep ? (previousStep.id as OnboardingStepId) : null;
  }

  /**
   * Calcule le pourcentage de progression
   */
  calculateProgress(completedSteps: string[]): number {
    if (!completedSteps || completedSteps.length === 0) {
      return 0;
    }
    
  const totalSteps = this.steps.filter(s => s.isRequired).length;
    const completed = completedSteps.filter(stepId => 
      this.steps.some(s => s.id === stepId && s.isRequired)
    ).length;
    
    return Math.round((completed / totalSteps) * 100);
  }

  /**
   * Obtient la progression détaillée pour un utilisateur
   */
  async getOnboardingProgress(_userId: string, data: OnboardingData): Promise<OnboardingResponse<OnboardingProgress>> {
    try {
      const completedSteps = data.completedSteps || [];
      const currentStepIndex = this.getCurrentStepIndex(completedSteps);
      
      const progress: OnboardingProgress = {
  totalSteps: this.steps.filter(s => s.isRequired).length,
        completedSteps: completedSteps.length,
        currentStepIndex,
        percentage: this.calculateProgress(completedSteps)
      };

      return {
        success: true,
        data: progress
      };
  } catch (_error) {
    return {
        success: false,
        error: 'Erreur lors du calcul de la progression'
      };
    }
  }

  /**
   * Obtient l'index de l'étape courante
   */
  private getCurrentStepIndex(completedSteps: string[]): number {
    if (!completedSteps || completedSteps.length === 0) {
      return 0;
    }

    // Trouve la dernière étape complétée
    let maxIndex = -1;
    for (const stepId of completedSteps) {
      const stepIndex = this.steps.findIndex(s => s.id === stepId);
      if (stepIndex > maxIndex) {
        maxIndex = stepIndex;
      }
    }

    // L'étape courante est la suivante après la dernière complétée
    return Math.min(maxIndex + 1, this.steps.length - 1);
  }

  /**
   * Vérifie si une étape est complétée
   */
  isStepCompleted(stepId: OnboardingStepId, completedSteps: string[]): boolean {
    return completedSteps.includes(stepId);
  }

  /**
   * Vérifie si l'onboarding est complètement terminé
   */
  isOnboardingComplete(data: OnboardingData): boolean {
    if (!data.completedSteps) {
      return false;
    }

  const requiredSteps = this.steps.filter(s => s.isRequired);
  const completed = data.completedSteps ?? [];
  return requiredSteps.every(step => completed.includes(step.id));
  }

  /**
   * Obtient les métriques d'onboarding (simulées)
   */
  async getOnboardingMetrics(): Promise<OnboardingResponse<OnboardingMetrics>> {
    try {
      // Simuler récupération des métriques
      await new Promise(resolve => setTimeout(resolve, 100));

      const metrics: OnboardingMetrics = {
        totalSessions: 1247,
        completedSessions: 1053,
        abandonmentRate: 15.5,
        averageCompletionTime: 8.5, // minutes
        stepsMetrics: this.steps.map(step => ({
          stepId: step.id,
          completionRate: Math.random() * 30 + 70, // 70-100%
          averageTime: step.estimatedTime * (0.8 + Math.random() * 0.4) // ±20% de variation
        }))
      };

      return {
        success: true,
        data: metrics
      };
  } catch (_error) {
    return {
        success: false,
        error: 'Erreur lors de la récupération des métriques'
      };
    }
  }

  /**
   * Obtient tous les steps avec leur statut
   */
  getStepsWithStatus(data: OnboardingData): Array<OnboardingStep & { isCompleted: boolean; isCurrent: boolean }> {
    const completedSteps = data.completedSteps || [];
    const currentStepIndex = this.getCurrentStepIndex(completedSteps);

    return this.steps.map((step, index) => ({
      ...step,
  isCompleted: this.isStepCompleted(step.id as OnboardingStepId, completedSteps),
      isCurrent: index === currentStepIndex
    }));
  }

  /**
   * Calcule le temps estimé restant
   */
  getEstimatedRemainingTime(data: OnboardingData): number {
    const completedSteps = data.completedSteps || [];
    const remainingSteps = this.steps.filter(step => 
      step.isRequired && !completedSteps.includes(step.id)
    );

  return remainingSteps.reduce((total, step) => total + step.estimatedTime, 0);
  }
}