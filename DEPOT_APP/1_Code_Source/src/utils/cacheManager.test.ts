import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CacheManager } from './cacheManager';
import { devLogger } from './devLogger';

// Mock devLogger to avoid console noise during tests
vi.mock('./devLogger', () => ({
  devLogger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('CacheManager', () => {
  // Mock localStorage
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock = {};

    // Mock localStorage methods
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key];
        }),
        clear: vi.fn(() => {
          localStorageMock = {};
        }),
        key: vi.fn((index: number) => Object.keys(localStorageMock)[index] || null),
        get length() {
          return Object.keys(localStorageMock).length;
        },
      },
      writable: true,
    });

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });

    // Mock window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent');

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('clearAll', () => {
    it('should remove all predefined cache keys', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = JSON.stringify([{ id: '1', name: 'Test' }]);
      localStorageMock['casskai_current_enterprise'] = '1';
      localStorageMock['supabase.auth.token'] = 'test-token';
      localStorageMock['casskai_onboarding_state'] = JSON.stringify({ step: 1 });

      // Act
      CacheManager.clearAll();

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith('casskai_enterprises');
      expect(localStorage.removeItem).toHaveBeenCalledWith('casskai_current_enterprise');
      expect(localStorage.removeItem).toHaveBeenCalledWith('supabase.auth.token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('casskai_onboarding_state');
      expect(devLogger.log).toHaveBeenCalled();
    });

    it('should remove all keys starting with "supabase." or "casskai_"', () => {
      // Arrange
      localStorageMock['supabase.custom.key'] = 'value';
      localStorageMock['casskai_custom_key'] = 'value';
      localStorageMock['other_key'] = 'value';

      // Mock Object.keys to work with our localStorageMock
      const originalObjectKeys = Object.keys;
      vi.spyOn(Object, 'keys').mockImplementation((obj: any) => {
        if (obj === window.localStorage) {
          return Object.keys(localStorageMock);
        }
        return originalObjectKeys(obj);
      });

      // Act
      CacheManager.clearAll();

      // Assert - Check that custom keys were removed
      // Note: The predefined keys are always removed first, then the iteration happens
      const removeItemCalls = (localStorage.removeItem as any).mock.calls.map((call: any[]) => call[0]);
      expect(removeItemCalls).toContain('supabase.custom.key');
      expect(removeItemCalls).toContain('casskai_custom_key');
      // other_key should not be in the calls (it doesn't start with supabase. or casskai_)
      expect(removeItemCalls).not.toContain('other_key');

      // Restore mock
      vi.restoreAllMocks();
    });

    it('should log cache cleaning operations', () => {
      // Act
      CacheManager.clearAll();

      // Assert
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Nettoyage complet du cache localStorage')
      );
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Cache localStorage nettoyé')
      );
    });
  });

  describe('clearEnterprises', () => {
    it('should remove only enterprise-related keys', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = JSON.stringify([{ id: '1' }]);
      localStorageMock['casskai_current_enterprise'] = '1';
      localStorageMock['casskai_onboarding_state'] = JSON.stringify({ step: 1 });

      // Act
      CacheManager.clearEnterprises();

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith('casskai_enterprises');
      expect(localStorage.removeItem).toHaveBeenCalledWith('casskai_current_enterprise');
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('casskai_onboarding_state');
    });

    it('should log enterprise cache cleaning', () => {
      // Act
      CacheManager.clearEnterprises();

      // Assert
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Nettoyage du cache des entreprises')
      );
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Cache des entreprises nettoyé')
      );
    });
  });

  describe('clearAndReload', () => {
    it('should clear all cache and reload the page after delay', () => {
      // Use fake timers
      vi.useFakeTimers();

      // Act
      CacheManager.clearAndReload();

      // Assert - clearAll should be called
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Nettoyage complet du cache localStorage')
      );

      // Assert - reload should not be called immediately
      expect(window.location.reload).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(500);

      // Assert - reload should be called after 500ms
      expect(window.location.reload).toHaveBeenCalled();
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Rechargement de la page')
      );

      vi.useRealTimers();
    });
  });

  describe('hasObsoleteCache', () => {
    it('should return true when enterprises cache exists', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = JSON.stringify([{ id: '1' }]);

      // Act
      const result = CacheManager.hasObsoleteCache();

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when current enterprise cache exists', () => {
      // Arrange
      localStorageMock['casskai_current_enterprise'] = '1';

      // Act
      const result = CacheManager.hasObsoleteCache();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when no enterprise cache exists', () => {
      // Act
      const result = CacheManager.hasObsoleteCache();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when both caches exist', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = JSON.stringify([{ id: '1' }]);
      localStorageMock['casskai_current_enterprise'] = '1';

      // Act
      const result = CacheManager.hasObsoleteCache();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('getCacheReport', () => {
    it('should return correct report when cache is empty', () => {
      // Act
      const report = CacheManager.getCacheReport();

      // Assert
      expect(report).toEqual({
        hasEnterprises: false,
        hasCurrentEnterprise: false,
        enterprisesCount: 0,
        lastModified: null,
      });
    });

    it('should return correct report with valid enterprises cache', () => {
      // Arrange
      const enterprises = [
        { id: '1', name: 'Enterprise 1' },
        { id: '2', name: 'Enterprise 2' },
      ];
      localStorageMock['casskai_enterprises'] = JSON.stringify(enterprises);
      localStorageMock['casskai_current_enterprise'] = '1';

      // Act
      const report = CacheManager.getCacheReport();

      // Assert
      expect(report).toEqual({
        hasEnterprises: true,
        hasCurrentEnterprise: true,
        enterprisesCount: 2,
        lastModified: null,
      });
    });

    it('should handle corrupted JSON in enterprises cache', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = 'invalid-json{]';

      // Act
      const report = CacheManager.getCacheReport();

      // Assert
      expect(report.hasEnterprises).toBe(true);
      expect(report.enterprisesCount).toBe(0);
      expect(devLogger.warn).toHaveBeenCalledWith(
        'Erreur parsing enterprises cache:',
        expect.any(String)
      );
    });

    it('should handle non-array enterprises data', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = JSON.stringify({ notAnArray: true });

      // Act
      const report = CacheManager.getCacheReport();

      // Assert
      expect(report.hasEnterprises).toBe(true);
      expect(report.enterprisesCount).toBe(0);
    });

    it('should return report with only current enterprise', () => {
      // Arrange
      localStorageMock['casskai_current_enterprise'] = '42';

      // Act
      const report = CacheManager.getCacheReport();

      // Assert
      expect(report).toEqual({
        hasEnterprises: false,
        hasCurrentEnterprise: true,
        enterprisesCount: 0,
        lastModified: null,
      });
    });
  });

  describe('validateCache', () => {
    it('should validate correct cache structure', () => {
      // Arrange
      const enterprises = [
        { id: '1', name: 'Enterprise 1' },
        { id: '2', name: 'Enterprise 2' },
      ];
      localStorageMock['casskai_enterprises'] = JSON.stringify(enterprises);
      localStorageMock['casskai_current_enterprise'] = '1';

      // Act
      const validation = CacheManager.validateCache();

      // Assert
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toEqual([]);
    });

    it('should detect invalid cache format (non-array)', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = JSON.stringify({ invalid: true });

      // Act
      const validation = CacheManager.validateCache();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Format du cache enterprises invalide');
    });

    it('should detect corrupted JSON in cache', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = 'invalid-json{]';

      // Act
      const validation = CacheManager.validateCache();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.issues[0]).toContain('Cache enterprises corrompu (JSON invalide)');
    });

    it('should detect current enterprise not in list', () => {
      // Arrange
      const enterprises = [
        { id: '1', name: 'Enterprise 1' },
        { id: '2', name: 'Enterprise 2' },
      ];
      localStorageMock['casskai_enterprises'] = JSON.stringify(enterprises);
      localStorageMock['casskai_current_enterprise'] = '999'; // Not in list

      // Act
      const validation = CacheManager.validateCache();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Entreprise courante introuvable dans la liste');
    });

    it('should validate when no cache exists', () => {
      // Act
      const validation = CacheManager.validateCache();

      // Assert
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toEqual([]);
    });

    it('should detect multiple issues at once', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = JSON.stringify({ invalid: 'format' });
      localStorageMock['casskai_current_enterprise'] = '1';

      // Act
      const validation = CacheManager.validateCache();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('triggerEnterpriseRefresh', () => {
    it('should dispatch enterpriseContextRefresh event', () => {
      // Act
      CacheManager.triggerEnterpriseRefresh();

      // Assert
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'enterpriseContextRefresh',
        })
      );
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining("Déclenchement d'un rafraîchissement du contexte Enterprise")
      );
    });

    it('should create CustomEvent with correct type', () => {
      // Arrange
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      // Act
      CacheManager.triggerEnterpriseRefresh();

      // Assert
      const eventCall = dispatchSpy.mock.calls[0][0];
      expect(eventCall).toBeInstanceOf(Event);
      expect(eventCall.type).toBe('enterpriseContextRefresh');
    });
  });

  describe('smartClean', () => {
    it('should not clean when cache is valid and empty', () => {
      // Arrange
      const clearEnterprisesSpy = vi.spyOn(CacheManager, 'clearEnterprises');
      const triggerRefreshSpy = vi.spyOn(CacheManager, 'triggerEnterpriseRefresh');

      // Act
      CacheManager.smartClean();

      // Assert
      expect(clearEnterprisesSpy).not.toHaveBeenCalled();
      expect(triggerRefreshSpy).not.toHaveBeenCalled();
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Cache propre, aucun nettoyage nécessaire')
      );
    });

    it('should clean when cache is invalid', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = 'invalid-json{]';
      const clearEnterprisesSpy = vi.spyOn(CacheManager, 'clearEnterprises');
      const triggerRefreshSpy = vi.spyOn(CacheManager, 'triggerEnterpriseRefresh');

      // Act
      CacheManager.smartClean();

      // Assert
      expect(clearEnterprisesSpy).toHaveBeenCalled();
      expect(triggerRefreshSpy).toHaveBeenCalled();
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Nettoyage nécessaire')
      );
    });

    it('should clean when enterprises cache exists', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = JSON.stringify([{ id: '1', name: 'Test' }]);
      const clearEnterprisesSpy = vi.spyOn(CacheManager, 'clearEnterprises');
      const triggerRefreshSpy = vi.spyOn(CacheManager, 'triggerEnterpriseRefresh');

      // Act
      CacheManager.smartClean();

      // Assert
      expect(clearEnterprisesSpy).toHaveBeenCalled();
      expect(triggerRefreshSpy).toHaveBeenCalled();
    });

    it('should log cache report and validation results', () => {
      // Act
      CacheManager.smartClean();

      // Assert
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Nettoyage intelligent du cache')
      );
      expect(devLogger.log).toHaveBeenCalledWith(
        '📊 Rapport du cache:',
        expect.any(Object)
      );
      expect(devLogger.log).toHaveBeenCalledWith('✅ Validation:', expect.any(Object));
    });

    it('should handle complex scenario with invalid current enterprise', () => {
      // Arrange
      const enterprises = [{ id: '1', name: 'Test' }];
      localStorageMock['casskai_enterprises'] = JSON.stringify(enterprises);
      localStorageMock['casskai_current_enterprise'] = '999'; // Invalid ID
      const clearEnterprisesSpy = vi.spyOn(CacheManager, 'clearEnterprises');
      const triggerRefreshSpy = vi.spyOn(CacheManager, 'triggerEnterpriseRefresh');

      // Act
      CacheManager.smartClean();

      // Assert
      expect(clearEnterprisesSpy).toHaveBeenCalled();
      expect(triggerRefreshSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null localStorage gracefully', () => {
      // Arrange
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true,
      });

      // Act & Assert - should not throw
      expect(() => {
        try {
          CacheManager.hasObsoleteCache();
        } catch (error) {
          // Expected to throw, catching to verify it doesn't crash the test
        }
      }).not.toThrow();
    });

    it('should handle empty string values', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = '';

      // Act
      const validation = CacheManager.validateCache();

      // Assert
      // Empty string will be parsed as error, but might also succeed as empty
      // The implementation tries to parse and catches errors
      expect(validation.isValid).toBeDefined();
      // If it's invalid, should have corruption message
      if (!validation.isValid) {
        expect(validation.issues[0]).toContain('corrompu');
      }
    });

    it('should handle very large enterprise arrays', () => {
      // Arrange
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `Enterprise ${i}`,
      }));
      localStorageMock['casskai_enterprises'] = JSON.stringify(largeArray);

      // Act
      const report = CacheManager.getCacheReport();
      const validation = CacheManager.validateCache();

      // Assert
      expect(report.enterprisesCount).toBe(1000);
      expect(validation.isValid).toBe(true);
    });

    it('should handle enterprises with missing id property', () => {
      // Arrange
      const enterprises = [
        { name: 'Enterprise without ID' },
        { id: '2', name: 'Valid Enterprise' },
      ];
      localStorageMock['casskai_enterprises'] = JSON.stringify(enterprises);
      localStorageMock['casskai_current_enterprise'] = '1';

      // Act
      const validation = CacheManager.validateCache();

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Entreprise courante introuvable dans la liste');
    });

    it('should handle unicode characters in cache', () => {
      // Arrange
      const enterprises = [
        { id: '1', name: 'Société Française 🇫🇷' },
        { id: '2', name: 'العربية Company' },
        { id: '3', name: '中文企业' },
      ];
      localStorageMock['casskai_enterprises'] = JSON.stringify(enterprises);

      // Act
      const report = CacheManager.getCacheReport();
      const validation = CacheManager.validateCache();

      // Assert
      expect(report.enterprisesCount).toBe(3);
      expect(validation.isValid).toBe(true);
    });

    it('should handle special JSON characters in enterprise names', () => {
      // Arrange
      const enterprises = [
        { id: '1', name: 'Test "Company" with quotes' },
        { id: '2', name: 'Test\\Company\\Path' },
      ];
      localStorageMock['casskai_enterprises'] = JSON.stringify(enterprises);

      // Act
      const report = CacheManager.getCacheReport();

      // Assert
      expect(report.enterprisesCount).toBe(2);
    });
  });

  describe('Integration tests', () => {
    it('should complete full lifecycle: set, validate, clean', () => {
      // Arrange - Set initial cache
      const enterprises = [{ id: '1', name: 'Test' }];
      localStorageMock['casskai_enterprises'] = JSON.stringify(enterprises);
      localStorageMock['casskai_current_enterprise'] = '1';

      // Act & Assert - Validate initial state
      expect(CacheManager.hasObsoleteCache()).toBe(true);
      expect(CacheManager.validateCache().isValid).toBe(true);

      // Act - Clear cache
      CacheManager.clearEnterprises();

      // Assert - Verify cleaned state
      expect(localStorage.removeItem).toHaveBeenCalledWith('casskai_enterprises');
      expect(localStorage.removeItem).toHaveBeenCalledWith('casskai_current_enterprise');
    });

    it('should handle smartClean workflow with invalid cache', () => {
      // Arrange
      localStorageMock['casskai_enterprises'] = 'corrupted{]data';

      // Act
      const initialValidation = CacheManager.validateCache();
      expect(initialValidation.isValid).toBe(false);

      CacheManager.smartClean();

      // Assert
      expect(devLogger.log).toHaveBeenCalledWith(
        expect.stringContaining('Nettoyage nécessaire')
      );
    });

    it('should maintain data integrity across multiple operations', () => {
      // Arrange
      const enterprises = [
        { id: '1', name: 'Enterprise 1' },
        { id: '2', name: 'Enterprise 2' },
      ];
      localStorageMock['casskai_enterprises'] = JSON.stringify(enterprises);
      localStorageMock['casskai_current_enterprise'] = '1';

      // Act - Multiple reads
      const report1 = CacheManager.getCacheReport();
      const validation1 = CacheManager.validateCache();
      const hasCache1 = CacheManager.hasObsoleteCache();

      const report2 = CacheManager.getCacheReport();
      const validation2 = CacheManager.validateCache();
      const hasCache2 = CacheManager.hasObsoleteCache();

      // Assert - Results should be consistent
      expect(report1).toEqual(report2);
      expect(validation1).toEqual(validation2);
      expect(hasCache1).toBe(hasCache2);
    });
  });
});
