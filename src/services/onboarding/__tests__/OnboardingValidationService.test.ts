import { describe, it, expect } from 'vitest';
import { OnboardingValidationService } from '../OnboardingValidationService';
import type { CompanyProfile, OnboardingPreferences, OnboardingData } from '../../../types/onboarding.types';

describe('OnboardingValidationService', () => {
  let service: OnboardingValidationService;

  beforeEach(() => {
    service = new OnboardingValidationService();
  });

  describe('validateCompanyProfile', () => {
    it('should pass validation for valid company profile', () => {
      const profile: Partial<CompanyProfile> = {
        name: 'Test Company',
        industry: 'Technology',
        country: 'FR',
        employeeCount: 10,
        annualRevenue: 100000
      };

      const result = service.validateCompanyProfile(profile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required name', () => {
      const profile: Partial<CompanyProfile> = {
        name: '',
        country: 'FR'
      };

      const result = service.validateCompanyProfile(profile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should fail validation for name too short', () => {
      const profile: Partial<CompanyProfile> = {
        name: 'A',
        country: 'FR'
      };

      const result = service.validateCompanyProfile(profile);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('MIN_LENGTH');
    });

    it('should fail validation for name too long', () => {
      const profile: Partial<CompanyProfile> = {
        name: 'A'.repeat(101),
        country: 'FR'
      };

      const result = service.validateCompanyProfile(profile);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('MAX_LENGTH');
    });

    it('should fail validation for negative employee count', () => {
      const profile: Partial<CompanyProfile> = {
        name: 'Test Company',
        country: 'FR',
        employeeCount: -1
      };

      const result = service.validateCompanyProfile(profile);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('employeeCount');
      expect(result.errors[0].code).toBe('INVALID_VALUE');
    });

    it('should fail validation for negative annual revenue', () => {
      const profile: Partial<CompanyProfile> = {
        name: 'Test Company',
        country: 'FR',
        annualRevenue: -100
      };

      const result = service.validateCompanyProfile(profile);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('annualRevenue');
      expect(result.errors[0].code).toBe('INVALID_VALUE');
    });
  });

  describe('validatePreferences', () => {
    it('should pass validation for valid preferences', () => {
      const preferences: Partial<OnboardingPreferences> = {
        language: 'fr',
        currency: 'EUR',
        timezone: 'Europe/Paris',
        modules: ['accounting', 'invoicing']
      };

      const result = service.validatePreferences(preferences);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing language', () => {
      const preferences: Partial<OnboardingPreferences> = {
        language: '',
        currency: 'EUR',
        timezone: 'Europe/Paris'
      };

      const result = service.validatePreferences(preferences);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('language');
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should fail validation for empty modules array', () => {
      const preferences: Partial<OnboardingPreferences> = {
        language: 'fr',
        currency: 'EUR',
        timezone: 'Europe/Paris',
        modules: []
      };

      const result = service.validatePreferences(preferences);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('modules');
      expect(result.errors[0].code).toBe('REQUIRED');
    });
  });

  describe('validateStep', () => {
    it('should validate company step successfully', async () => {
      const data: OnboardingData = {
        userId: 'test-user',
        currentStep: 'company',
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
        completedSteps: [],
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isComplete: false
      };

      const result = await service.validateStep('test-user', 'company', data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when data is missing', async () => {
      const result = await service.validateStep('test-user', 'company');

      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('DATA_NOT_FOUND');
    });

    it('should validate final onboarding step', async () => {
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
        completedSteps: [],
        startedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        isComplete: false
      };

      const result = await service.validateStep('test-user', 'complete', data);

      expect(result.isValid).toBe(true);
    });
  });
});