/**
 * CassKai - Lazy Loading Utilities
 *
 * Phase 2 (P1) - Optimisation Performance
 *
 * Fonctionnalités:
 * - Lazy loading avec retry logic
 * - Preloading intelligent
 * - Loading states customisables
 * - Error boundaries
 * - Timeout handling
 * - Bundle splitting automatique
 */

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { logger } from './logger';
import { Loader2 } from 'lucide-react';

export interface LazyLoadOptions {
  /** Nombre de tentatives en cas d'erreur */
  retryCount?: number;
  /** Délai entre les tentatives (ms) */
  retryDelay?: number;
  /** Timeout pour le chargement (ms) */
  timeout?: number;
  /** Preload automatique au hover */
  preloadOnHover?: boolean;
  /** Composant de fallback personnalisé */
  fallback?: React.ReactNode;
  /** Callback en cas d'erreur */
  onError?: (error: Error) => void;
}

/**
 * Lazy load avec retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const {
    retryCount = 3,
    retryDelay = 1000,
    timeout = 10000,
    onError,
  } = options;

  let retries = 0;

  const load = async (): Promise<{ default: T }> => {
    try {
      // Wrapper avec timeout
      const loadPromise = importFunc();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Module loading timeout')), timeout);
      });

      const module = await Promise.race([loadPromise, timeoutPromise]);

      logger.debug('LazyLoader', 'Module loaded successfully');
      return module;
    } catch (error) {
      retries++;

      if (retries <= retryCount) {
        logger.warn('LazyLoader', `Module loading failed, retrying (${retries}/${retryCount})...`);

        // Attendre avant de réessayer
        await new Promise((resolve) => setTimeout(resolve, retryDelay * retries));

        return load();
      }

      logger.error('LazyLoader', 'Module loading failed after retries:', error);

      if (onError) {
        onError(error instanceof Error ? error : new Error('Module loading failed'));
      }

      throw error;
    }
  };

  return React.lazy(load);
}

/**
 * Composant de fallback par défaut
 */
export function DefaultFallback({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {message || 'Chargement...'}
      </p>
    </div>
  );
}

/**
 * Error boundary pour les composants lazy
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('LazyErrorBoundary', 'Component error:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="text-red-500 text-center">
              <svg
                className="w-12 h-12 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Une erreur est survenue lors du chargement du composant.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Recharger la page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper complet pour lazy loading avec Suspense + Error Boundary
 */
export function LazyLoad({
  component: Component,
  fallback,
  errorFallback,
}: {
  component: LazyExoticComponent<ComponentType<any>>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}) {
  return (
    <LazyErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback || <DefaultFallback />}>
        <Component />
      </Suspense>
    </LazyErrorBoundary>
  );
}

/**
 * Preload un module lazy
 */
export function preloadModule<T extends ComponentType<any>>(
  component: LazyExoticComponent<T>
) {
  const preloadable = component as any;

  if (preloadable._payload && preloadable._payload._status === -1) {
    // Module pas encore chargé, déclencher le chargement
    preloadable._init(preloadable._payload);
  }
}

/**
 * HOC pour ajouter le preload au hover
 */
export function withPreload<P extends object>(
  Component: LazyExoticComponent<React.ComponentType<P>>
) {
  return (props: P) => {
    const handleMouseEnter = () => {
      preloadModule(Component);
    };

    return (
      <div onMouseEnter={handleMouseEnter}>
        <Component {...(props as any)} />
      </div>
    );
  };
}

/**
 * Hook pour preloader des modules
 */
export function usePreload(modules: LazyExoticComponent<any>[]) {
  React.useEffect(() => {
    // Preload après un court délai pour ne pas impacter le chargement initial
    const timer = setTimeout(() => {
      modules.forEach(preloadModule);
    }, 2000);

    return () => clearTimeout(timer);
  }, [modules]);
}

/**
 * Preload basé sur Intersection Observer (preload quand visible)
 */
export function useLazyPreload(
  ref: React.RefObject<HTMLElement>,
  modules: LazyExoticComponent<any>[]
) {
  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            modules.forEach(preloadModule);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, modules]);
}

/**
 * Utility pour créer des routes lazy avec preload
 */
export function createLazyRoute<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: LazyLoadOptions
) {
  const LazyComponent = lazyWithRetry(importFunc, options);

  return {
    Component: LazyComponent,
    preload: () => preloadModule(LazyComponent),
  };
}

/**
 * Exemples d'utilisation optimisée
 */

// Route avec lazy loading et retry
export const DashboardRoute = createLazyRoute(
  () => import('@/pages/DashboardPage'),
  { retryCount: 3, timeout: 10000 }
);

// Route avec preload au hover
export const AccountingRoute = createLazyRoute(
  () => import('@/pages/AccountingPage'),
  { preloadOnHover: true }
);

// Route avec fallback personnalisé
export const InvoicingRoute = createLazyRoute(
  () => import('@/pages/InvoicingPage'),
  {
    fallback: <DefaultFallback message="Chargement de la facturation..." />,
  }
);

/**
 * Bundle size helpers
 */
export function logBundleInfo() {
  if (process.env.NODE_ENV === 'development') {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const scripts = resources.filter((r) => r.initiatorType === 'script');
    const totalSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0);

    logger.debug('BundleInfo', 'Scripts loaded:', {
      count: scripts.length,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      largest: scripts
        .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
        .slice(0, 5)
        .map((r) => ({
          name: r.name.split('/').pop(),
          size: `${((r.transferSize || 0) / 1024).toFixed(2)} KB`,
        })),
    });
  }
}
