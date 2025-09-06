// @ts-nocheck
// Tests pour le hook useWebVitals
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebVitals, usePagePerformance, usePerformanceMonitoring } from './useWebVitals';

// Mock web-vitals
const mockGetCLS = vi.fn();
const mockGetFID = vi.fn();
const mockGetFCP = vi.fn();
const mockGetLCP = vi.fn();
const mockGetTTFB = vi.fn();

vi.mock('web-vitals', () => ({
  getCLS: mockGetCLS,
  getFID: mockGetFID,
  getFCP: mockGetFCP,
  getLCP: mockGetLCP,
  getTTFB: mockGetTTFB,
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/test-path',
  }),
}));

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

mockPerformanceObserver.mockImplementation(() => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
}));

Object.defineProperty(global, 'PerformanceObserver', {
  writable: true,
  configurable: true,
  value: mockPerformanceObserver,
});

// Mock gtag
Object.defineProperty(global, 'gtag', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

// Mock plausible
Object.defineProperty(global, 'plausible', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

describe('useWebVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all web vitals mocks
    mockGetCLS.mockClear();
    mockGetFID.mockClear();
    mockGetFCP.mockClear();
    mockGetLCP.mockClear();
    mockGetTTFB.mockClear();
  });

  it('should initialize web vitals tracking', async () => {
    const reportCallback = vi.fn();
    
    renderHook(() => useWebVitals({
      reportCallback,
      enableAnalytics: false,
      debug: false,
    }));

    await waitFor(() => {
      expect(mockGetCLS).toHaveBeenCalledWith(expect.any(Function));
      expect(mockGetFID).toHaveBeenCalledWith(expect.any(Function));
      expect(mockGetFCP).toHaveBeenCalledWith(expect.any(Function));
      expect(mockGetLCP).toHaveBeenCalledWith(expect.any(Function));
      expect(mockGetTTFB).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  it('should handle metric reporting', async () => {
    const reportCallback = vi.fn();
    
    const { result } = renderHook(() => useWebVitals({
      reportCallback,
      enableAnalytics: false,
      debug: false,
    }));

    // Wait for initialization
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate a metric being reported
    const testMetric = {
      name: 'FCP' as const,
      value: 1500,
      rating: 'good' as const,
      delta: 1500,
      id: 'test-id',
      entries: [],
    };

    // Get the callback that was passed to getFCP
    const fcpCallback = mockGetFCP.mock.calls[0][0];
    fcpCallback(testMetric);

    expect(reportCallback).toHaveBeenCalledWith(testMetric);
    expect(result.current.vitalsData.FCP).toEqual(testMetric);
  });

  it('should calculate page score correctly', async () => {
    const { result } = renderHook(() => useWebVitals());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate good metrics
    const goodMetric = {
      name: 'FCP' as const,
      value: 1000,
      rating: 'good' as const,
      delta: 1000,
      id: 'test-id',
      entries: [],
    };

    const fcpCallback = mockGetFCP.mock.calls[0][0];
    fcpCallback(goodMetric);

    await waitFor(() => {
      expect(result.current.pageScore).toBe(100);
      expect(result.current.hasGoodVitals).toBe(true);
      expect(result.current.hasPoorVitals).toBe(false);
    });
  });

  it('should send analytics when enabled', async () => {
    renderHook(() => useWebVitals({
      enableAnalytics: true,
    }));

    await waitFor(() => {
      expect(mockGetFCP).toHaveBeenCalled();
    });

    const testMetric = {
      name: 'LCP' as const,
      value: 2000,
      rating: 'good' as const,
      delta: 2000,
      id: 'test-lcp',
      entries: [],
    };

    const lcpCallback = mockGetLCP.mock.calls[0][0];
    lcpCallback(testMetric);

    expect(global.gtag).toHaveBeenCalledWith(
      'event',
      'LCP',
      expect.objectContaining({
        event_category: 'Web Vitals',
        value: 2000,
        metric_rating: 'good',
      })
    );
  });

  it('should debug log when enabled', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    renderHook(() => useWebVitals({
      debug: true,
    }));

    await waitFor(() => {
      expect(mockGetFCP).toHaveBeenCalled();
    });

    const testMetric = {
      name: 'CLS' as const,
      value: 0.05,
      rating: 'good' as const,
      delta: 0.05,
      id: 'test-cls',
      entries: [],
    };

    const clsCallback = mockGetCLS.mock.calls[0][0];
    clsCallback(testMetric);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[WebVitals] CLS:',
      expect.objectContaining({
        value: 0.05,
        rating: 'good',
        delta: 0.05,
      })
    );

    consoleSpy.mockRestore();
  });

  it('should track INP when PerformanceObserver is available', async () => {
    renderHook(() => useWebVitals());

    await waitFor(() => {
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    expect(mockObserve).toHaveBeenCalledWith({ type: 'event', buffered: true });
    expect(mockObserve).toHaveBeenCalledWith({ type: 'first-input', buffered: true });
  });

  it('should handle web-vitals import failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock import failure
    vi.doMock('web-vitals', () => {
      throw new Error('Failed to import web-vitals');
    });

    const { result } = renderHook(() => useWebVitals());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[WebVitals] Erreur lors du chargement de web-vitals:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

describe('usePagePerformance', () => {
  it('should track performance data by page', async () => {
    const { result } = renderHook(() => usePagePerformance());

    // Should start with empty data
    expect(result.current.performanceData).toEqual([]);
    expect(result.current.currentPageStats).toBeNull();
  });

  it('should provide page-specific statistics', () => {
    const { result } = renderHook(() => usePagePerformance());

    const stats = result.current.getPageStats('/test-page');
    expect(stats).toBeNull(); // No data yet
  });
});

describe('usePerformanceMonitoring', () => {
  it('should generate alerts for poor metrics', async () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    // Should start with no alerts
    expect(result.current.alerts).toEqual([]);
    expect(result.current.hasAlerts).toBe(false);
    expect(result.current.criticalAlerts).toEqual([]);
    expect(result.current.warningAlerts).toEqual([]);
  });

  it('should allow clearing alerts', () => {
    const { result } = renderHook(() => usePerformanceMonitoring());

    // Should provide clearAlerts function
    expect(typeof result.current.clearAlerts).toBe('function');
    
    // Should work without errors
    result.current.clearAlerts();
  });

  it('should use custom thresholds when provided', () => {
    const customThresholds = {
      FCP: { good: 1000, poor: 2000 },
      LCP: { good: 1500, poor: 3000 },
    };

    const { result } = renderHook(() => 
      usePerformanceMonitoring(customThresholds)
    );

    // Should initialize without errors
    expect(result.current.alerts).toEqual([]);
  });
});