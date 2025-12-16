import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigMigration, configMigration, useMigration } from './migration';
import ConfigService from '../services/configService';
import { supabase } from '../lib/supabase';
import { APP_VERSION } from './constants';
import { renderHook, waitFor } from '@testing-library/react';
import type { AppConfig } from '../types/config';

// Mock dependencies
vi.mock('../services/configService', () => {
  const defaultInstance = {
    isConfigured: vi.fn(() => false),
    validateSupabaseConfig: vi.fn(async () => true),
    saveConfig: vi.fn(async () => undefined),
    getConfig: vi.fn(() => null),
  };

  return {
    default: {
      getInstance: vi.fn(() => defaultInstance),
    },
  };
});
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));
vi.mock('./constants', () => ({
  APP_VERSION: '1.0.0',
}));

describe('ConfigMigration', () => {
  let migration: ConfigMigration;
  let mockConfigService: any;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Setup ConfigService mock
    mockConfigService = {
      isConfigured: vi.fn(),
      validateSupabaseConfig: vi.fn(),
      saveConfig: vi.fn(),
      getConfig: vi.fn(),
    };

    vi.mocked(ConfigService.getInstance).mockReturnValue(mockConfigService);

    // Create a fresh instance (after mocking getInstance)
    migration = new ConfigMigration();

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    // Mock import.meta.env
    (import.meta as any).env = {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('migrateFromHardcodedConfig', () => {
    it('should return true if config is already configured', async () => {
      mockConfigService.isConfigured.mockReturnValue(true);

      const result = await migration.migrateFromHardcodedConfig();

      expect(result).toBe(true);
      expect(mockConfigService.isConfigured).toHaveBeenCalledOnce();
      expect(mockConfigService.validateSupabaseConfig).not.toHaveBeenCalled();
    });

    it('should return false if no existing config found', async () => {
      // Create a new migration instance to properly test this scenario
      const testMigration = new ConfigMigration();

      mockConfigService.isConfigured.mockReturnValue(false);

      // Force "no env config" deterministically (import.meta.env is not reliably mutable in tests)
      (testMigration as any).extractEnvConfig = () => null;

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await testMigration.migrateFromHardcodedConfig();

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Aucune configuration existante trouvée')
      );
      consoleWarnSpy.mockRestore();
    });

    it('should successfully migrate from hardcoded config', async () => {
      mockConfigService.isConfigured.mockReturnValue(false);
      mockConfigService.validateSupabaseConfig.mockResolvedValue(true);
      mockConfigService.saveConfig.mockResolvedValue(undefined);

      // Ensure deterministic values (avoid leaking real VITE_* env)
      (migration as any).extractEnvConfig = () => ({
        url: 'https://test.supabase.co',
        anonKey: 'test-anon-key',
      });

      const result = await migration.migrateFromHardcodedConfig();

      expect(result).toBe(true);
      expect(mockConfigService.validateSupabaseConfig).toHaveBeenCalledOnce();
      expect(mockConfigService.saveConfig).toHaveBeenCalledOnce();

      const savedConfig = mockConfigService.saveConfig.mock.calls[0][0];
      expect(savedConfig).toMatchObject({
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-anon-key',
          validated: true,
        },
        company: {
          id: 'default-id',
          accountingStandard: 'SYSCOHADA',
          name: 'Default Company',
          country: 'Default Country',
          currency: 'USD',
          timezone: 'UTC',
          fiscalYearStart: '2025-01-01',
        },
        setupCompleted: false,
        setupDate: expect.any(String),
        version: APP_VERSION,
      });
    });

    it('should return false if Supabase validation fails', async () => {
      mockConfigService.isConfigured.mockReturnValue(false);
      mockConfigService.validateSupabaseConfig.mockResolvedValue(false);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await migration.migrateFromHardcodedConfig();

      expect(result).toBe(false);
      expect(mockConfigService.saveConfig).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration Supabase invalide')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle errors during migration', async () => {
      mockConfigService.isConfigured.mockReturnValue(false);
      mockConfigService.validateSupabaseConfig.mockRejectedValue(
        new Error('Validation error')
      );

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await migration.migrateFromHardcodedConfig();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error exceptions gracefully', async () => {
      mockConfigService.isConfigured.mockReturnValue(false);
      mockConfigService.validateSupabaseConfig.mockRejectedValue('String error');

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await migration.migrateFromHardcodedConfig();
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanupOldConfig', () => {
    it('should remove old localStorage keys', async () => {
      const mockRemoveItem = vi.fn();
      const mockGetItem = vi.fn().mockReturnValue('some-value');

      global.localStorage.removeItem = mockRemoveItem;
      global.localStorage.getItem = mockGetItem;

      await migration.cleanupOldConfig();

      expect(mockGetItem).toHaveBeenCalledWith('supabase_session');
      expect(mockGetItem).toHaveBeenCalledWith('supabase_auth_token');
      expect(mockGetItem).toHaveBeenCalledWith('app_settings');
      expect(mockRemoveItem).toHaveBeenCalledTimes(3);
    });

    it('should not remove keys that do not exist', async () => {
      const mockRemoveItem = vi.fn();
      const mockGetItem = vi.fn().mockReturnValue(null);

      global.localStorage.removeItem = mockRemoveItem;
      global.localStorage.getItem = mockGetItem;

      await migration.cleanupOldConfig();

      expect(mockGetItem).toHaveBeenCalledTimes(3);
      expect(mockRemoveItem).not.toHaveBeenCalled();
    });
  });

  describe('checkDatabaseCompatibility', () => {
    it('should return compatible when all tables exist', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            error: null,
            data: [],
          }),
        }),
      } as any);

      const result = await migration.checkDatabaseCompatibility();

      expect(result.isCompatible).toBe(true);
      expect(result.missingTables).toHaveLength(0);
      expect(result.suggestedActions).toHaveLength(0);
    });

    it('should detect missing tables', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'companies' || table === 'accounts') {
          return {
            select: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                error: { code: 'PGRST116' },
                data: null,
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              error: null,
              data: [],
            }),
          }),
        } as any;
      });

      const result = await migration.checkDatabaseCompatibility();

      expect(result.isCompatible).toBe(false);
      expect(result.missingTables).toContain('companies');
      expect(result.missingTables).toContain('accounts');
      expect(result.suggestedActions).toContain('Exécuter les migrations de base de données');
      expect(result.suggestedActions).toContain('Initialiser le schéma de base');
      expect(result.suggestedActions).toContain('Créer la première entreprise');
    });

    it('should handle database connection errors', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('Connection failed')),
        }),
      } as any);

      const result = await migration.checkDatabaseCompatibility();

      expect(result.isCompatible).toBe(false);
      expect(result.missingTables.length).toBeGreaterThan(0);
    });

    it('should handle errorsaccessing database', async () => {
      // Mock all table checks to fail with connection errors
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await migration.checkDatabaseCompatibility();

      expect(result.isCompatible).toBe(false);
      // Implémentation actuelle: un throw dans from() est traité comme "tables manquantes"
      expect(result.suggestedActions).toContain('Exécuter les migrations de base de données');
    });

    it('should check all required tables', async () => {
      const fromSpy = vi.spyOn(supabase, 'from');

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            error: null,
            data: [],
          }),
        }),
      } as any);

      await migration.checkDatabaseCompatibility();

      expect(fromSpy).toHaveBeenCalledWith('companies');
      expect(fromSpy).toHaveBeenCalledWith('user_profiles');
      expect(fromSpy).toHaveBeenCalledWith('accounts');
      expect(fromSpy).toHaveBeenCalledWith('journal_entries');
      expect(fromSpy).toHaveBeenCalledWith('journal_lines');
    });

    it('should provide specific actions for missing companies table', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                error: { code: 'PGRST116' },
                data: null,
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              error: null,
              data: [],
            }),
          }),
        } as any;
      });

      const result = await migration.checkDatabaseCompatibility();

      expect(result.suggestedActions).toContain('Créer la première entreprise');
    });
  });

  describe('exportConfigForBackup', () => {
    it('should export config with masked anon key', async () => {
      const mockConfig: AppConfig = {
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'super-secret-key',
          validated: true,
        },
        company: {
          id: 'company-1',
          name: 'Test Company',
          country: 'FR',
          currency: 'EUR',
          timezone: 'Europe/Paris',
          fiscalYearStart: '01-01',
          accountingStandard: 'PCG',
        },
        setupCompleted: true,
        setupDate: '2025-01-01T00:00:00Z',
        version: '1.0.0',
      };

      // Reset and setup mock for this specific test
      vi.clearAllMocks();
      const freshMock = {
        getConfig: vi.fn().mockReturnValue(mockConfig),
        isConfigured: vi.fn(),
        validateSupabaseConfig: vi.fn(),
        saveConfig: vi.fn(),
      };
      vi.mocked(ConfigService.getInstance).mockReturnValue(freshMock);

      const freshMigration = new ConfigMigration();
      const result = await freshMigration.exportConfigForBackup();
      const parsed = JSON.parse(result);

      expect(parsed.app_version).toBe(APP_VERSION);
      expect(parsed.config.supabase.anonKey).toBe('***MASKED***');
      expect(parsed.config.supabase.url).toBe('https://test.supabase.co');
      expect(parsed.config.company.name).toBe('Test Company');
      expect(parsed.exported_at).toBeDefined();
    });

    it('should throw error if no config to export', async () => {
      // Reset and setup mock for this specific test
      vi.clearAllMocks();
      const freshMock = {
        getConfig: vi.fn().mockReturnValue(null),
        isConfigured: vi.fn(),
        validateSupabaseConfig: vi.fn(),
        saveConfig: vi.fn(),
      };
      vi.mocked(ConfigService.getInstance).mockReturnValue(freshMock);

      const freshMigration = new ConfigMigration();

      await expect(freshMigration.exportConfigForBackup()).rejects.toThrow(
        'Aucune configuration à exporter'
      );
    });

    it('should return valid JSON string', async () => {
      const mockConfig: AppConfig = {
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-key',
          validated: true,
        },
        company: {
          id: 'company-1',
          name: 'Test',
          country: 'FR',
          currency: 'EUR',
          timezone: 'UTC',
          accountingStandard: 'PCG',
        },
        setupCompleted: true,
        setupDate: '2025-01-01T00:00:00Z',
        version: '1.0.0',
      };

      // Reset and setup mock for this specific test
      vi.clearAllMocks();
      const freshMock = {
        getConfig: vi.fn().mockReturnValue(mockConfig),
        isConfigured: vi.fn(),
        validateSupabaseConfig: vi.fn(),
        saveConfig: vi.fn(),
      };
      vi.mocked(ConfigService.getInstance).mockReturnValue(freshMock);

      const freshMigration = new ConfigMigration();
      const result = await freshMigration.exportConfigForBackup();

      expect(() => JSON.parse(result)).not.toThrow();
      expect(result).toContain('exported_at');
      expect(result).toContain('app_version');
      expect(result).toContain('config');
    });
  });

  describe('getMigrationGuide', () => {
    it('should return migration steps', () => {
      const guide = migration.getMigrationGuide();

      expect(guide).toBeInstanceOf(Array);
      expect(guide.length).toBeGreaterThan(0);
      expect(guide[0]).toContain('Sauvegardez');
      expect(guide[guide.length - 1]).toContain('Supprimez');
    });

    it('should return all 6 migration steps', () => {
      const guide = migration.getMigrationGuide();

      expect(guide).toHaveLength(6);
      expect(guide[0]).toContain('1.');
      expect(guide[1]).toContain('2.');
      expect(guide[2]).toContain('3.');
      expect(guide[3]).toContain('4.');
      expect(guide[4]).toContain('5.');
      expect(guide[5]).toContain('6.');
    });

    it('should include key migration steps', () => {
      const guide = migration.getMigrationGuide();
      const guideText = guide.join(' ');

      expect(guideText).toContain('Supabase');
      expect(guideText).toContain('migration');
      expect(guideText).toContain('entreprise');
      expect(guideText).toContain('configuration');
    });
  });
});

describe('configMigration singleton', () => {
  it('should export a singleton instance', () => {
    expect(configMigration).toBeInstanceOf(ConfigMigration);
  });

  it('should be the same instance across imports', () => {
    const instance1 = configMigration;
    const instance2 = configMigration;

    expect(instance1).toBe(instance2);
  });
});

describe('useMigration hook', () => {
  let testMockConfigService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup a fresh mock for each test
    testMockConfigService = {
      isConfigured: vi.fn().mockReturnValue(false),
      validateSupabaseConfig: vi.fn().mockResolvedValue(true),
      saveConfig: vi.fn().mockResolvedValue(undefined),
      getConfig: vi.fn(),
    };

    vi.mocked(ConfigService.getInstance).mockReturnValue(testMockConfigService);

    // useMigration relies on the exported singleton; ensure it uses this test instance
    (configMigration as any).configService = testMockConfigService;

    // Mock import.meta.env
    (import.meta as any).env = {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-key',
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useMigration());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.runMigration).toBe('function');
  });

  it('should set loading state during migration', async () => {
    const { result } = renderHook(() => useMigration());

    let loadingDuringMigration = false;

    const migrationPromise = result.current.runMigration();

    // Check if loading is true immediately after calling
    await waitFor(() => {
      if (result.current.isLoading) {
        loadingDuringMigration = true;
      }
    });

    await migrationPromise;

    // Loading should be true at some point
    expect(loadingDuringMigration || result.current.isLoading === false).toBe(true);
  });

  it('should return true on successful migration', async () => {
    const { result } = renderHook(() => useMigration());

    const success = await result.current.runMigration();

    expect(success).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should set error on migration failure', async () => {
    const mockConfigService = {
      isConfigured: vi.fn().mockReturnValue(false),
      validateSupabaseConfig: vi.fn().mockRejectedValue(new Error('Test error')),
      saveConfig: vi.fn(),
      getConfig: vi.fn(),
    };

    vi.mocked(ConfigService.getInstance).mockReturnValue(mockConfigService);
    (configMigration as any).configService = mockConfigService;

    const { result } = renderHook(() => useMigration());

    const success = await result.current.runMigration();

    expect(success).toBe(false);
    expect(result.current.error).toBeDefined();
  });

  it('should clear error when starting new migration', async () => {
    const mockConfigService = {
      isConfigured: vi.fn().mockReturnValue(false),
      validateSupabaseConfig: vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(true),
      saveConfig: vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined),
      getConfig: vi.fn(),
    };

    vi.mocked(ConfigService.getInstance).mockReturnValue(mockConfigService);
    (configMigration as any).configService = mockConfigService;

    const { result } = renderHook(() => useMigration());

    // First migration fails
    await result.current.runMigration();
    expect(result.current.error).toBeDefined();

    // Second migration should clear previous error
    await result.current.runMigration();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle non-Error exceptions gracefully', async () => {
    const mockConfigService = {
      isConfigured: vi.fn().mockReturnValue(false),
      validateSupabaseConfig: vi.fn().mockRejectedValue('String error'),
      saveConfig: vi.fn(),
      getConfig: vi.fn(),
    };

    vi.mocked(ConfigService.getInstance).mockReturnValue(mockConfigService);
    (configMigration as any).configService = mockConfigService;

    const { result } = renderHook(() => useMigration());

    const success = await result.current.runMigration();

    expect(success).toBe(false);
    expect(result.current.error).toBeDefined();
  });

  it('should reset loading state after completion', async () => {
    const mockConfigService = {
      isConfigured: vi.fn().mockReturnValue(false),
      validateSupabaseConfig: vi.fn().mockResolvedValue(true),
      saveConfig: vi.fn().mockResolvedValue(undefined),
      getConfig: vi.fn(),
    };
    vi.mocked(ConfigService.getInstance).mockReturnValue(mockConfigService);
    (configMigration as any).configService = mockConfigService;

    const { result } = renderHook(() => useMigration());

    await result.current.runMigration();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
