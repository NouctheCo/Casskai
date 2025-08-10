import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfig } from './useConfig';

// Hoisted instance used by the default export mock
const hoisted = vi.hoisted(() => ({
  instance: {
    getConfig: vi.fn(),
    saveConfig: vi.fn(),
    validateSupabaseConfig: vi.fn(),
    initializeDatabase: vi.fn(),
    resetConfig: vi.fn(),
    exportConfig: vi.fn(),
    getSupabaseClient: vi.fn(),
  },
}));

// Mock the default-exported ConfigService singleton
vi.mock('../services/configService', () => ({
  default: class {
    static getInstance() {
      return hoisted.instance as any;
    }
  },
}));

describe('useConfig Hook', () => {
  let mockConfigService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset methods with fresh spies
    hoisted.instance.getConfig = vi.fn();
    hoisted.instance.saveConfig = vi.fn();
    hoisted.instance.validateSupabaseConfig = vi.fn();
    hoisted.instance.initializeDatabase = vi.fn();
    hoisted.instance.resetConfig = vi.fn();
    hoisted.instance.exportConfig = vi.fn();
    hoisted.instance.getSupabaseClient = vi.fn();
    mockConfigService = hoisted.instance;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  const sampleConfig = {
    supabase: { url: 'https://abc.supabase.co', anonKey: 'x'.repeat(120), validated: true },
    company: { id: 'Acme', name: 'Acme', country: 'FR', currency: 'EUR', timezone: 'Europe/Paris', accountingStandard: 'PCG' },
    setupCompleted: true,
    setupDate: '2024-01-01',
    version: '1.0.0',
  } as const;

  it('initializes by loading config and sets status', () => {
    mockConfigService.getConfig.mockReturnValue(sampleConfig);

    const { result } = renderHook(() => useConfig());

    expect(result.current.config).not.toBeNull();
    expect(result.current.status === 'configured' || result.current.status === 'configuring').toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(mockConfigService.getConfig).toHaveBeenCalledTimes(1);
  });

  it('saveConfig validates and persists via service', async () => {
    mockConfigService.saveConfig.mockResolvedValue(undefined);

    const { result } = renderHook(() => useConfig());

    await act(async () => {
      await result.current.saveConfig({ ...sampleConfig });
    });

    expect(mockConfigService.saveConfig).toHaveBeenCalledWith({ ...sampleConfig });
  });

  it('validateSupabaseConfig returns boolean and sets error on failure', async () => {
    mockConfigService.validateSupabaseConfig.mockResolvedValue(false);

    const { result } = renderHook(() => useConfig());

    let ok = true;
    await act(async () => {
      ok = await result.current.validateSupabaseConfig('https://x.supabase.co', 'k');
    });

    expect(ok).toBe(false);
    expect(result.current.error).not.toBeNull();
  });

  it('initializeDatabase delegates to service', async () => {
    mockConfigService.initializeDatabase.mockResolvedValue(undefined);
    const { result } = renderHook(() => useConfig());

    await act(async () => {
      await result.current.initializeDatabase();
    });

    expect(mockConfigService.initializeDatabase).toHaveBeenCalledTimes(1);
  });

  it('resetConfig clears state and calls service', () => {
    mockConfigService.getConfig.mockReturnValue(sampleConfig);
    const { result } = renderHook(() => useConfig());

    act(() => {
      result.current.resetConfig();
    });

    expect(mockConfigService.resetConfig).toHaveBeenCalledTimes(1);
    expect(result.current.config).toBeNull();
    expect(result.current.status).toBe('not_configured');
  });

  it('exportConfig proxies to service', () => {
    mockConfigService.exportConfig.mockReturnValue('{"ok":true}');
    const { result } = renderHook(() => useConfig());

    const exported = result.current.exportConfig();
    expect(exported).toBe('{"ok":true}');
    expect(mockConfigService.exportConfig).toHaveBeenCalledTimes(1);
  });

  it('validateConfig reports errors and warnings', () => {
    const { result } = renderHook(() => useConfig());

    const invalid = result.current.validateConfig({
      supabase: { url: 'bad', anonKey: 'short', validated: false } as any,
      company: { name: 'A', country: '', currency: '' } as any,
    });

    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  it('getSupabaseConfig and getCompanyConfig return values from state', () => {
    mockConfigService.getConfig.mockReturnValue(sampleConfig);
    const { result } = renderHook(() => useConfig());

    expect(result.current.getSupabaseConfig()).not.toBeNull();
    expect(result.current.getCompanyConfig()).not.toBeNull();
  });
});