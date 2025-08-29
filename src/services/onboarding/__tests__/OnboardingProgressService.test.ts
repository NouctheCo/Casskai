import { describe, it, expect, beforeEach } from 'vitest';
import { OnboardingProgressService } from '../OnboardingProgressService';
import type { OnboardingData } from '../../../types/onboarding.types';

describe('OnboardingProgressService', () => {
  let service: OnboardingProgressService;

  beforeEach(() => {
    service = new OnboardingProgressService();
  });

  describe('getNextStep', () => {
    it('should return company step after welcome', () => {
      const nextStep = service.getNextStep('welcome');
      expect(nextStep).toBe('company');
    });

    it('should return preferences step after company', () => {
      const nextStep = service.getNextStep('company');
      expect(nextStep).toBe('preferences');
    });

    it('should return complete step after preferences', () => {
      const nextStep = service.getNextStep('preferences');
      expect(nextStep).toBe('complete');
    });

    it('should return complete step for unknown step', () => {
      const nextStep = service.getNextStep('unknown' as any);
      expect(nextStep).toBe('complete');
    });
  });

  describe('getPreviousStep', () => {
    it('should return null for welcome step', () => {
      const previousStep = service.getPreviousStep('welcome');
      expect(previousStep).toBe(null);
    });

    it('should return welcome step before company', () => {
      const previousStep = service.getPreviousStep('company');
      expect(previousStep).toBe('welcome');
    });

    it('should return company step before preferences', () => {
      const previousStep = service.getPreviousStep('preferences');
      expect(previousStep).toBe('company');
    });
  });

  describe('calculateProgress', () => {
    it('should return 0% for no completed steps', () => {
      const progress = service.calculateProgress([]);
      expect(progress).toBe(0);
    });

    it('should return 0% for null completed steps', () => {
      const progress = service.calculateProgress(null as any);
      expect(progress).toBe(0);
    });

    it('should return 25% for one completed step', () => {
      const progress = service.calculateProgress(['welcome']);
      expect(progress).toBe(25);
    });

    it('should return 50% for two completed steps', () => {
      const progress = service.calculateProgress(['welcome', 'company']);
      expect(progress).toBe(50);
    });

    it('should return 100% for all completed steps', () => {
      const progress = service.calculateProgress(['welcome', 'company', 'preferences', 'complete']);
      expect(progress).toBe(100);
    });
  });

  describe('isStepCompleted', () => {
    it('should return true if step is in completed steps', () => {
      const isCompleted = service.isStepCompleted('welcome', ['welcome', 'company']);
      expect(isCompleted).toBe(true);
    });

    it('should return false if step is not in completed steps', () => {
      const isCompleted = service.isStepCompleted('preferences', ['welcome', 'company']);
      expect(isCompleted).toBe(false);
    });
  });

  describe('isOnboardingComplete', () => {
    it('should return true when all required steps are completed', () => {
      const data: OnboardingData = {
        userId: 'test-user',
        currentStep: 'complete',
        companyProfile: {
          name: 'Test Company',
          industry: 'Technology',
          country: 'FR',
          employeeCount: 10,
          annualRevenue: 100000
        },
        preferences: {
          language: 'fr',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          modules: ['accounting']
        },
        completedSteps: ['welcome', 'company', 'preferences', 'complete'],
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isComplete: false
      };

      const isComplete = service.isOnboardingComplete(data);
      expect(isComplete).toBe(true);
    });

    it('should return false when some steps are missing', () => {
      const data: OnboardingData = {
        userId: 'test-user',
        currentStep: 'preferences',
        companyProfile: {
          name: 'Test Company',
          industry: 'Technology',
          country: 'FR',
          employeeCount: 10,
          annualRevenue: 100000
        },
        preferences: {
          language: 'fr',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          modules: ['accounting']
        },
        completedSteps: ['welcome', 'company'],
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isComplete: false
      };

      const isComplete = service.isOnboardingComplete(data);
      expect(isComplete).toBe(false);
    });

    it('should return false when completedSteps is undefined', () => {
      const data: OnboardingData = {
        userId: 'test-user',
        currentStep: 'preferences',
        companyProfile: {
          name: 'Test Company',
          industry: 'Technology',
          country: 'FR',
          employeeCount: 10,
          annualRevenue: 100000
        },
        preferences: {
          language: 'fr',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          modules: ['accounting']
        },
        completedSteps: undefined as any,
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isComplete: false
      };

      const isComplete = service.isOnboardingComplete(data);
      expect(isComplete).toBe(false);
    });
  });

  describe('getOnboardingProgress', () => {
    it('should return correct progress information', async () => {
      const data: OnboardingData = {
        userId: 'test-user',
        currentStep: 'preferences',
        companyProfile: {
          name: 'Test Company',
          industry: 'Technology',
          country: 'FR',
          employeeCount: 10,
          annualRevenue: 100000
        },
        preferences: {
          language: 'fr',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          modules: ['accounting']
        },
        completedSteps: ['welcome', 'company'],
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isComplete: false
      };

      const result = await service.getOnboardingProgress('test-user', data);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.totalSteps).toBe(4);
      expect(result.data!.completedSteps).toBe(2);
      expect(result.data!.percentage).toBe(50);
    });
  });

  describe('getOnboardingMetrics', () => {
    it('should return simulated metrics', async () => {
      const result = await service.getOnboardingMetrics();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.totalSessions).toBeGreaterThan(0);
      expect(result.data!.completedSessions).toBeGreaterThan(0);
      expect(result.data!.stepsMetrics).toHaveLength(4);
    });
  });

  describe('getStepsWithStatus', () => {
    it('should return steps with correct status', () => {
      const data: OnboardingData = {
        userId: 'test-user',
        currentStep: 'preferences',
        companyProfile: {
          name: 'Test Company',
          industry: 'Technology',
          country: 'FR',
          employeeCount: 10,
          annualRevenue: 100000
        },
        preferences: {
          language: 'fr',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          modules: ['accounting']
        },
        completedSteps: ['welcome', 'company'],
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isComplete: false
      };

      const stepsWithStatus = service.getStepsWithStatus(data);

      expect(stepsWithStatus).toHaveLength(4);
      expect(stepsWithStatus[0].isCompleted).toBe(true); // welcome
      expect(stepsWithStatus[1].isCompleted).toBe(true); // company
      expect(stepsWithStatus[2].isCompleted).toBe(false); // preferences
      expect(stepsWithStatus[2].isCurrent).toBe(true); // preferences is current
    });
  });

  describe('getEstimatedRemainingTime', () => {
    it('should calculate remaining time correctly', () => {
      const data: OnboardingData = {
        userId: 'test-user',
        currentStep: 'preferences',
        companyProfile: {
          name: 'Test Company',
          industry: 'Technology',
          country: 'FR',
          employeeCount: 10,
          annualRevenue: 100000
        },
        preferences: {
          language: 'fr',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          modules: ['accounting']
        },
        completedSteps: ['welcome', 'company'],
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isComplete: false
      };

      const remainingTime = service.getEstimatedRemainingTime(data);
      
      // Should be preferences (3min) + complete (2min) = 5min
      expect(remainingTime).toBe(5);
    });

    it('should return 0 when all steps are completed', () => {
      const data: OnboardingData = {
        userId: 'test-user',
        currentStep: 'complete',
        companyProfile: {
          name: 'Test Company',
          industry: 'Technology',
          country: 'FR',
          employeeCount: 10,
          annualRevenue: 100000
        },
        preferences: {
          language: 'fr',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          modules: ['accounting']
        },
        completedSteps: ['welcome', 'company', 'preferences', 'complete'],
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isComplete: true
      };

      const remainingTime = service.getEstimatedRemainingTime(data);
      expect(remainingTime).toBe(0);
    });
  });
});