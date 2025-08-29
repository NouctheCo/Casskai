// Tests pour le composant LazyWrapper
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import { LazyWrapper, useLazyLoading, withLazyLoading } from './LazyWrapper';

// Mock framer-motion with a stable reference using vi.hoisted to avoid hoisting pitfalls
const hoisted = vi.hoisted(() => {
  return {
    // accept any args; test-only mock
  // @ts-ignore - test-only mock accepting variadic args
    mockUseInView: vi.fn((..._args) => false),
  } as { mockUseInView: ReturnType<typeof vi.fn> };
});

vi.mock('framer-motion', () => ({
  // @ts-ignore - test-only: forward variadic args to mock
  useInView: (...args) => (hoisted as any).mockUseInView(...args),
}));

// Mock performance observer
const mockPerformanceObserver = vi.fn();
mockPerformanceObserver.prototype.observe = vi.fn();
mockPerformanceObserver.prototype.disconnect = vi.fn();

Object.defineProperty(global, 'PerformanceObserver', {
  writable: true,
  configurable: true,
  value: mockPerformanceObserver,
});

// Test component
const TestComponent = () => <div data-testid="test-component">Test Content</div>;
const TestSkeleton = () => <div data-testid="test-skeleton">Loading...</div>;

describe('LazyWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  hoisted.mockUseInView.mockReturnValue(false);
  });

  it('should render children when priority is high', () => {
    render(
      <LazyWrapper priority="high">
        <TestComponent />
      </LazyWrapper>
    );
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  it('should render fallback when not in view', () => {
  hoisted.mockUseInView.mockReturnValue(false);
    
    render(
      <LazyWrapper 
        priority="normal"
        fallback={<TestSkeleton />}
      >
        <TestComponent />
      </LazyWrapper>
    );
    
    expect(screen.getByTestId('test-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
  });

  it('should render children when in view', async () => {
    // Start with not in view
  hoisted.mockUseInView.mockReturnValue(false);
    
    const { rerender } = render(
      <LazyWrapper priority="normal">
        <TestComponent />
      </LazyWrapper>
    );
    
    expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
    
    // Simulate coming into view
  hoisted.mockUseInView.mockReturnValue(true);
    rerender(
      <LazyWrapper priority="normal">
        <TestComponent />
      </LazyWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  it('should handle preload delay', async () => {
  hoisted.mockUseInView.mockReturnValue(true);
    
    render(
      <LazyWrapper 
        priority="normal"
        preloadDelay={100}
      >
        <TestComponent />
      </LazyWrapper>
    );
    
    // Should show preloading state initially
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
    
    // After delay, should show content
    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should use correct intersection observer options', () => {
  hoisted.mockUseInView.mockReturnValue(false);
    
    render(
      <LazyWrapper 
        threshold={0.5}
        margin="200px"
        priority="normal"
      >
        <TestComponent />
      </LazyWrapper>
    );
    
    // Check that useInView was called with correct options
  expect(hoisted.mockUseInView).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        once: true,
        margin: '200px',
      })
    );
  });
});

describe('useLazyLoading', () => {
  const mockImportFn = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should preload single module', async () => {
    const { result } = renderHook(() => useLazyLoading());
    
    await act(async () => {
      await result.current.preloadModule('test-module', mockImportFn);
    });
    
    expect(mockImportFn).toHaveBeenCalledTimes(1);
    expect(result.current.loadedModules).toContain('test-module');
    expect(result.current.isLoaded('test-module')).toBe(true);
  });

  it('should preload multiple modules', async () => {
    const { result } = renderHook(() => useLazyLoading());
    
    const modules = [
      { id: 'module1', import: vi.fn().mockResolvedValue({}) },
      { id: 'module2', import: vi.fn().mockResolvedValue({}) },
    ];
    
    await act(async () => {
      await result.current.preloadModules(modules);
    });
    
    expect(modules[0].import).toHaveBeenCalledTimes(1);
    expect(modules[1].import).toHaveBeenCalledTimes(1);
    expect(result.current.loadedModules).toEqual(['module1', 'module2']);
  });

  it('should not reload already loaded modules', async () => {
    const { result } = renderHook(() => useLazyLoading());
    
    // First load
    await act(async () => {
      await result.current.preloadModule('test-module', mockImportFn);
    });
    
    expect(mockImportFn).toHaveBeenCalledTimes(1);
    
    // Second load - should not call import again
    await act(async () => {
      await result.current.preloadModule('test-module', mockImportFn);
    });
    
    expect(mockImportFn).toHaveBeenCalledTimes(1);
  });

  it('should handle module load failures gracefully', async () => {
    const { result } = renderHook(() => useLazyLoading());
    const failingImport = vi.fn().mockRejectedValue(new Error('Load failed'));
    
    // Should not throw
    await act(async () => {
      await result.current.preloadModule('failing-module', failingImport);
    });
    
    expect(result.current.isLoaded('failing-module')).toBe(false);
  });

  it('should track loading state', async () => {
    const { result } = renderHook(() => useLazyLoading());
    const slowImport = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    expect(result.current.loading).toBe(false);
    
    let loadPromise: Promise<unknown> | undefined;
    await act(async () => {
      // Start preloading but don't await immediately
      loadPromise = result.current.preloadModule('slow-module', slowImport);
    });

    expect(result.current.loading).toBe(true);
    
    await loadPromise!;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

describe('withLazyLoading HOC', () => {
  it('should wrap component with lazy loading', () => {
    const LazyTestComponent = withLazyLoading(TestComponent, {
      priority: 'low',
      skeleton: TestSkeleton,
    });
    
  hoisted.mockUseInView.mockReturnValue(false);
    
    render(<LazyTestComponent />);
    
    expect(screen.getByTestId('test-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('test-component')).not.toBeInTheDocument();
  });

  it('should pass props through to wrapped component', async () => {
    const ComponentWithProps = ({ testProp }: { testProp: string }) => (
      <div data-testid="component-with-props">{testProp}</div>
    );
    
    const LazyComponent = withLazyLoading(ComponentWithProps, {
      priority: 'high',
    });
    
    render(<LazyComponent testProp="test value" />);
    
    expect(screen.getByText('test value')).toBeInTheDocument();
  });

  it('should set correct display name', () => {
    const LazyComponent = withLazyLoading(TestComponent);
    
    expect(LazyComponent.displayName).toBe('withLazyLoading(TestComponent)');
  });
});

describe('LazyLoadingMetrics', () => {
  it('should render metrics in development mode', async () => {
    // Spy on import.meta.env.DEV via getter override on module
    const module = await import('./LazyWrapper');
    // Temporarily monkey patch global to simulate DEV rendering if component checks that
    Object.defineProperty(globalThis, 'importMetaEnvDev', { value: true, configurable: true, writable: true });
    const { LazyLoadingMetrics } = module;

    render(<LazyLoadingMetrics />);

    expect(screen.getByText(/Lazy Components:/)).toBeInTheDocument();
    expect(screen.getByText(/Avg Load:/)).toBeInTheDocument();
    // cleanup
    // no-op
  });

  it('should not render in production mode', async () => {
    const module = await import('./LazyWrapper');
    Object.defineProperty(globalThis, 'importMetaEnvDev', { value: false, configurable: true, writable: true });
    const { LazyLoadingMetrics } = module;

    const { container } = render(<LazyLoadingMetrics />);
    expect(container.firstChild).toBeNull();
  });
});