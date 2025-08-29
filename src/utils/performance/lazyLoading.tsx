import { lazy, Suspense, ComponentType } from 'react';
import { LoadingFallback } from '@/components/ui/LoadingFallback';

/**
 * Lazy loading wrapper with enhanced loading states and error handling
 */
export interface LazyComponentOptions {
  /**
   * Custom loading component
   */
  loading?: ComponentType;
  
  /**
   * Minimum loading time to prevent flash
   */
  minLoadingTime?: number;
  
  /**
   * Preload condition - preload when true
   */
  preload?: () => boolean;
  
  /**
   * Error fallback component
   */
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
}

/**
 * Enhanced lazy loading with performance optimizations
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): ComponentType<React.ComponentProps<T>> {
  const {
    loading: LoadingComponent = LoadingFallback,
    minLoadingTime = 200,
    preload,
    errorFallback: ErrorFallback,
  } = options;

  // Create lazy component with enhanced loading
  const LazyComponent = lazy(() => {
    const startTime = Date.now();
    
    return importFunction().then(module => {
      const loadTime = Date.now() - startTime;
      
      // Ensure minimum loading time to prevent flash
      if (loadTime < minLoadingTime) {
        return new Promise(resolve => {
          setTimeout(() => resolve(module), minLoadingTime - loadTime);
        });
      }
      
      return module;
    });
  });

  // Preload logic
  if (preload && preload()) {
    importFunction();
  }

  // Enhanced wrapper with error boundary
  const WrappedComponent: ComponentType<React.ComponentProps<T>> = (props) => {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  // Add preload method to component
  (WrappedComponent as any).preload = importFunction;

  return WrappedComponent;
}

/**
 * Preload components based on conditions
 */
export const preloadComponents = {
  /**
   * Preload on hover
   */
  onHover: (importFunction: () => Promise<any>) => ({
    onMouseEnter: () => importFunction(),
    onTouchStart: () => importFunction(),
  }),

  /**
   * Preload on idle
   */
  onIdle: (importFunction: () => Promise<any>) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFunction());
    } else {
      setTimeout(() => importFunction(), 1000);
    }
  },

  /**
   * Preload on route change
   */
  onRouteChange: (importFunction: () => Promise<any>, routes: string[]) => {
    const currentPath = window.location.pathname;
    if (routes.some(route => currentPath.includes(route))) {
      importFunction();
    }
  },

  /**
   * Preload based on user behavior
   */
  onUserBehavior: (importFunction: () => Promise<any>, conditions: {
    scrollPercentage?: number;
    timeOnPage?: number;
    clicksThreshold?: number;
  }) => {
    let clicks = 0;
    let startTime = Date.now();

    // Scroll-based preloading
    if (conditions.scrollPercentage) {
      const handleScroll = () => {
        const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrolled >= conditions.scrollPercentage!) {
          importFunction();
          window.removeEventListener('scroll', handleScroll);
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Time-based preloading
    if (conditions.timeOnPage) {
      setTimeout(() => importFunction(), conditions.timeOnPage);
    }

    // Interaction-based preloading
    if (conditions.clicksThreshold) {
      const handleClick = () => {
        clicks++;
        if (clicks >= conditions.clicksThreshold!) {
          importFunction();
          document.removeEventListener('click', handleClick);
        }
      };
      document.addEventListener('click', handleClick);
    }
  },
};

/**
 * Component splitting strategies for different scenarios
 */
export const componentStrategies = {
  /**
   * Route-based splitting
   */
  route: <T extends ComponentType<any>>(importFunction: () => Promise<{ default: T }>) =>
    createLazyComponent(importFunction, {
      minLoadingTime: 300,
      preload: () => false, // Don't preload routes by default
    }),

  /**
   * Feature-based splitting (heavy components)
   */
  feature: <T extends ComponentType<any>>(importFunction: () => Promise<{ default: T }>) =>
    createLazyComponent(importFunction, {
      minLoadingTime: 150,
      preload: () => navigator.connection?.effectiveType !== 'slow-2g',
    }),

  /**
   * Modal/Dialog splitting (conditional rendering)
   */
  modal: <T extends ComponentType<any>>(importFunction: () => Promise<{ default: T }>) =>
    createLazyComponent(importFunction, {
      minLoadingTime: 100,
      preload: () => window.innerWidth > 768, // Preload on desktop
    }),

  /**
   * Chart/Visualization splitting (heavy libraries)
   */
  visualization: <T extends ComponentType<any>>(importFunction: () => Promise<{ default: T }>) =>
    createLazyComponent(importFunction, {
      minLoadingTime: 500,
      preload: () => 'IntersectionObserver' in window && navigator.hardwareConcurrency > 2,
    }),
};

/**
 * Dynamic import with intelligent caching
 */
const importCache = new Map<string, Promise<any>>();

export function cachedImport<T = any>(
  importPath: string,
  importFunction: () => Promise<T>
): Promise<T> {
  if (importCache.has(importPath)) {
    return importCache.get(importPath)!;
  }

  const promise = importFunction();
  importCache.set(importPath, promise);

  return promise;
}

/**
 * Preload critical resources based on route
 */
export const routePreloading = {
  dashboard: () => [
    () => import('@/pages/DashboardPage'),
    () => import('@/components/ui/AnimatedChart'),
    () => import('@/components/widgets/WidgetLibrary'),
  ],

  invoicing: () => [
    () => import('@/pages/InvoicingPage'),
    () => import('@/components/invoicing/OptimizedInvoicesTab'),
    () => import('@/components/third-parties/ThirdPartyForm'),
  ],

  accounting: () => [
    () => import('@/pages/AccountingPage'),
    () => import('@/components/accounting/JournalEntriesTab'),
    () => import('@/components/accounting/ChartOfAccountsTab'),
  ],

  reports: () => [
    () => import('@/pages/ReportsPage'),
    () => import('@/components/ui/AnimatedChart'),
    () => import('@/components/ui/DataTable'),
  ],
};

/**
 * Progressive loading for data-heavy components
 */
export interface ProgressiveLoadingOptions<T> {
  /**
   * Initial data subset to load
   */
  initialLoad: () => Promise<T[]>;
  
  /**
   * Function to load more data
   */
  loadMore: (offset: number, limit: number) => Promise<T[]>;
  
  /**
   * Page size for progressive loading
   */
  pageSize?: number;
  
  /**
   * Threshold for triggering next load (percentage from bottom)
   */
  threshold?: number;
}

export function useProgressiveLoading<T>(
  options: ProgressiveLoadingOptions<T>
) {
  const { initialLoad, loadMore, pageSize = 20, threshold = 0.8 } = options;
  
  // Implementation would use React hooks here
  // This is a placeholder showing the pattern
  return {
    data: [] as T[],
    loading: false,
    hasMore: true,
    loadNext: () => {},
    isIntersecting: false,
  };
}

export default {
  createLazyComponent,
  preloadComponents,
  componentStrategies,
  cachedImport,
  routePreloading,
};