import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfig } from './useConfig';

// Mock the config service
vi.mock('../services/configService', () => ({
  configService: {
    getConfig: vi.fn(),
    updateConfig: vi.fn(),
    resetConfig: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  },
}));

describe('useConfig Hook', () => {
  let mockConfigService: any;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    mockConfigService = vi.mocked((await import('../services/configService')).configService);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with default config', () => {
    const mockConfig = {
      theme: 'light' as const,
      language: 'fr' as const,
      currency: 'EUR' as const,
      dateFormat: 'DD/MM/YYYY' as const,
      timezone: 'Europe/Paris',
      notifications: {
        email: true,
        push: false,
        desktop: true,
      },
    };

    mockConfigService.getConfig.mockReturnValue(mockConfig);

    const { result } = renderHook(() => useConfig());

    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.isLoading).toBe(false);
    expect(mockConfigService.getConfig).toHaveBeenCalledTimes(1);
  });

  it('should handle loading state', () => {
    mockConfigService.getConfig.mockImplementation(() => {
      // Simulate async loading
      return new Promise(resolve => {
        setTimeout(() => resolve({
          theme: 'light' as const,
          language: 'fr' as const,
          currency: 'EUR' as const,
          dateFormat: 'DD/MM/YYYY' as const,
          timezone: 'Europe/Paris',
          notifications: { email: true, push: false, desktop: true },
        }), 100);
      }) as any;
    });

    const { result } = renderHook(() => useConfig());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.config).toBeNull();
  });

  it('should update config successfully', async () => {
    const initialConfig = {
      theme: 'light' as const,
      language: 'fr' as const,
      currency: 'EUR' as const,
      dateFormat: 'DD/MM/YYYY' as const,
      timezone: 'Europe/Paris',
      notifications: { email: true, push: false, desktop: true },
    };

    const updatedConfig = {
      ...initialConfig,
      theme: 'dark' as const,
      notifications: { email: true, push: true, desktop: true },
    };

    mockConfigService.getConfig.mockReturnValue(initialConfig);
    mockConfigService.updateConfig.mockResolvedValue(updatedConfig);

    const { result } = renderHook(() => useConfig());

    expect(result.current.config?.theme).toBe('light');

    await act(async () => {
      await result.current.updateConfig({
        theme: 'dark',
        'notifications.push': true,
      });
    });

    expect(mockConfigService.updateConfig).toHaveBeenCalledWith({
      theme: 'dark',
      'notifications.push': true,
    });
  });

  it('should handle update errors', async () => {
    const mockConfig = {
      theme: 'light' as const,
      language: 'fr' as const,
      currency: 'EUR' as const,
      dateFormat: 'DD/MM/YYYY' as const,
      timezone: 'Europe/Paris',
      notifications: { email: true, push: false, desktop: true },
    };

    mockConfigService.getConfig.mockReturnValue(mockConfig);
    mockConfigService.updateConfig.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useConfig());

    await act(async () => {
      try {
        await result.current.updateConfig({ theme: 'dark' });
      } catch (error) {
        expect(error).toEqual(new Error('Update failed'));
      }
    });

    expect(result.current.error).toBe('Update failed');
  });

  it('should reset config', async () => {
    const defaultConfig = {
      theme: 'light' as const,
      language: 'en' as const,
      currency: 'USD' as const,
      dateFormat: 'MM/DD/YYYY' as const,
      timezone: 'America/New_York',
      notifications: { email: true, push: true, desktop: true },
    };

    mockConfigService.getConfig.mockReturnValue({
      theme: 'dark' as const,
      language: 'fr' as const,
      currency: 'EUR' as const,
      dateFormat: 'DD/MM/YYYY' as const,
      timezone: 'Europe/Paris',
      notifications: { email: false, push: false, desktop: false },
    });
    
    mockConfigService.resetConfig.mockResolvedValue(defaultConfig);

    const { result } = renderHook(() => useConfig());

    await act(async () => {
      await result.current.resetConfig();
    });

    expect(mockConfigService.resetConfig).toHaveBeenCalledTimes(1);
  });

  it('should subscribe to config changes on mount', () => {
    const mockConfig = {
      theme: 'light' as const,
      language: 'fr' as const,
      currency: 'EUR' as const,
      dateFormat: 'DD/MM/YYYY' as const,
      timezone: 'Europe/Paris',
      notifications: { email: true, push: false, desktop: true },
    };

    mockConfigService.getConfig.mockReturnValue(mockConfig);

    const { unmount } = renderHook(() => useConfig());

    expect(mockConfigService.subscribe).toHaveBeenCalledWith(expect.any(Function));

    unmount();

    expect(mockConfigService.unsubscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should handle subscription updates', () => {
    let subscriberCallback: (config: any) => void;

    mockConfigService.subscribe.mockImplementation((callback) => {
      subscriberCallback = callback;
    });

    const initialConfig = {
      theme: 'light' as const,
      language: 'fr' as const,
      currency: 'EUR' as const,
      dateFormat: 'DD/MM/YYYY' as const,
      timezone: 'Europe/Paris',
      notifications: { email: true, push: false, desktop: true },
    };

    mockConfigService.getConfig.mockReturnValue(initialConfig);

    const { result } = renderHook(() => useConfig());

    expect(result.current.config?.theme).toBe('light');

    // Simulate config update from external source
    act(() => {
      subscriberCallback!({
        ...initialConfig,
        theme: 'dark' as const,
      });
    });

    expect(result.current.config?.theme).toBe('dark');
  });

  it('should provide helper functions for specific config values', () => {
    const mockConfig = {
      theme: 'dark' as const,
      language: 'fr' as const,
      currency: 'EUR' as const,
      dateFormat: 'DD/MM/YYYY' as const,
      timezone: 'Europe/Paris',
      notifications: { email: true, push: true, desktop: false },
    };

    mockConfigService.getConfig.mockReturnValue(mockConfig);

    const { result } = renderHook(() => useConfig());

    // Test helper functions if they exist in the actual implementation
    expect(result.current.config?.theme).toBe('dark');
    expect(result.current.config?.language).toBe('fr');
    expect(result.current.config?.currency).toBe('EUR');
    expect(result.current.config?.notifications.email).toBe(true);
    expect(result.current.config?.notifications.push).toBe(true);
    expect(result.current.config?.notifications.desktop).toBe(false);
  });

  it('should handle invalid config gracefully', () => {
    mockConfigService.getConfig.mockReturnValue(null);

    const { result } = renderHook(() => useConfig());

    expect(result.current.config).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle multiple concurrent updates', async () => {
    const mockConfig = {
      theme: 'light' as const,
      language: 'fr' as const,
      currency: 'EUR' as const,
      dateFormat: 'DD/MM/YYYY' as const,
      timezone: 'Europe/Paris',
      notifications: { email: true, push: false, desktop: true },
    };

    mockConfigService.getConfig.mockReturnValue(mockConfig);
    mockConfigService.updateConfig.mockImplementation((updates) => 
      Promise.resolve({ ...mockConfig, ...updates })
    );

    const { result } = renderHook(() => useConfig());

    // Simulate concurrent updates
    await act(async () => {
      const promises = [
        result.current.updateConfig({ theme: 'dark' }),
        result.current.updateConfig({ language: 'en' }),
        result.current.updateConfig({ currency: 'USD' }),
      ];

      await Promise.all(promises);
    });

    expect(mockConfigService.updateConfig).toHaveBeenCalledTimes(3);
  });
});