import { describe, expect, it } from 'vitest';
import { OnboardingProgressService } from './OnboardingProgressService';
import { OnboardingData } from '@/types/onboarding.types';

const buildBaseData = (): OnboardingData => ({
  userId: 'user-1',
  companyProfile: {},
  selectedModules: [],
  preferences: {},
  featuresExploration: {},
  currentStepId: 'welcome',
  completedSteps: [],
  startedAt: new Date().toISOString(),
  lastSavedAt: new Date().toISOString(),
  progress: 0,
});

describe('OnboardingProgressService', () => {
  const service = new OnboardingProgressService();

  it('exposes the experience step and enforces prerequisites', () => {
    const baseData = buildBaseData();
    const steps = service.getStepsWithStatus(baseData);
    const experience = steps.find((step) => step.id === 'experience');

    // The 'experience' step is shown after login (in-app), so it should
    // not be present in the pre-auth onboarding steps collection.
    expect(experience).toBeUndefined();

    // Ensure the final 'complete' step is present and initially locked
    const completeStep = steps.find((step) => step.id === 'complete');
    expect(completeStep).toBeDefined();
    expect(completeStep?.locked).toBe(true);

    // Unlock 'complete' by completing required steps
    const unlocked = service.hasCompletedPrerequisites('complete', [
      'welcome',
      'preferences',
      'company',
      'modules',
    ]);
    expect(unlocked).toBe(true);
  });

  it('computes progress including the experience step', () => {
    const completed = service.calculateProgress(['welcome', 'preferences', 'company', 'modules']);
    expect(completed).toBeLessThan(100);

    const full = service.calculateProgress([
      'welcome',
      'preferences',
      'company',
      'modules',
      'experience',
      'complete',
    ]);
    expect(full).toBe(100);
  });
});
