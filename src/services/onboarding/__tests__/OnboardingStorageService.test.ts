// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OnboardingStorageService } from '../OnboardingStorageService';
import type { OnboardingData } from '../../../types/onboarding.types';

describe('OnboardingStorageService', () => {
  let service: OnboardingStorageService;
  
  const mockOnboardingData: OnboardingData = {
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
    completedSteps: ['welcome'],
    startedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
    isComplete: false
  };

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    service = new OnboardingStorageService();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
    
    // Clear mocks
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('cache operations', () => {
    it('should set and get cached data', () => {
      const userId = 'test-user';
      
      // Initially should return null
      expect(service.getCachedData(userId)).toBeNull();
      
      // Set data
      service.setCachedData(userId, mockOnboardingData);
      
      // Should return the data
      const retrieved = service.getCachedData(userId);
      expect(retrieved).toEqual(mockOnboardingData);
    });

    it('should clear cached data', () => {
      const userId = 'test-user';
      
      service.setCachedData(userId, mockOnboardingData);
      expect(service.getCachedData(userId)).toEqual(mockOnboardingData);
      
      service.clearCachedData(userId);
      expect(service.getCachedData(userId)).toBeNull();
    });
  });

  describe('localStorage operations', () => {
    it('should save to localStorage', () => {
      const userId = 'test-user';
      
      service.saveToLocalStorage(userId, mockOnboardingData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'onboarding_test-user',
        JSON.stringify(mockOnboardingData)
      );
    });

    it('should get from localStorage', () => {
      const userId = 'test-user';
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockOnboardingData));
      
      const result = service.getLocalStorageData(userId);
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('onboarding_test-user');
      expect(result).toEqual(mockOnboardingData);
    });

    it('should return null when localStorage is empty', () => {
      const userId = 'test-user';
      
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = service.getLocalStorageData(userId);
      
      expect(result).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const userId = 'test-user';
      
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw and return null
      const result = service.getLocalStorageData(userId);
      expect(result).toBeNull();
    });

    it('should clear localStorage data', () => {
      const userId = 'test-user';
      
      service.clearLocalStorageData(userId);
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('onboarding_test-user');
    });
  });

  describe('saveOnboardingData', () => {
    it('should save data to both cache and localStorage', async () => {
      const userId = 'test-user';
      
      const result = await service.saveOnboardingData(userId, mockOnboardingData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOnboardingData);
      
      // Check cache
      expect(service.getCachedData(userId)).toEqual(mockOnboardingData);
      
      // Check localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('getOnboardingData', () => {
    it('should return cached data first', async () => {
      const userId = 'test-user';
      
      // Set cached data
      service.setCachedData(userId, mockOnboardingData);
      
      const result = await service.getOnboardingData(userId);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOnboardingData);
      
      // localStorage should not be called
      expect(localStorageMock.getItem).not.toHaveBeenCalled();
    });

    it('should fallback to localStorage when cache is empty', async () => {
      const userId = 'test-user';
      
      // Mock localStorage return
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockOnboardingData));
      
      const result = await service.getOnboardingData(userId);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOnboardingData);
      
      // Should have tried localStorage
      expect(localStorageMock.getItem).toHaveBeenCalled();
      
      // Should have set cache
      expect(service.getCachedData(userId)).toEqual(mockOnboardingData);
    });

    it('should return null when no data exists', async () => {
      const userId = 'test-user';
      
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = await service.getOnboardingData(userId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('clearOnboardingData', () => {
    it('should clear both cache and localStorage', async () => {
      const userId = 'test-user';
      
      // Set some data first
      service.setCachedData(userId, mockOnboardingData);
      
      const result = await service.clearOnboardingData(userId);
      
      expect(result.success).toBe(true);
      
      // Check cache is cleared
      expect(service.getCachedData(userId)).toBeNull();
      
      // Check localStorage clear was called
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('onboarding_test-user');
    });
  });

  describe('getActiveSession', () => {
    it('should return session when data exists in cache', async () => {
      const userId = 'test-user';
      
      service.setCachedData(userId, mockOnboardingData);
      
      const result = await service.getActiveSession(userId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.userId).toBe(userId);
      expect(result.data!.sessionData).toEqual(mockOnboardingData);
      expect(result.data!.isActive).toBe(true);
    });

    it('should return session when data exists in localStorage', async () => {
      const userId = 'test-user';
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockOnboardingData));
      
      const result = await service.getActiveSession(userId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.userId).toBe(userId);
      expect(result.data!.sessionData).toEqual(mockOnboardingData);
      expect(result.data!.isActive).toBe(true);
    });

    it('should return null when no data exists', async () => {
      const userId = 'test-user';
      
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = await service.getActiveSession(userId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });
});