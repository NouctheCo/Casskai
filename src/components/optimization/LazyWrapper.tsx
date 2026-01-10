// Wrapper pour le lazy loading intelligent des composants lourds
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import { logger } from '@/lib/logger';
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  margin?: string;
  priority?: 'high' | 'normal' | 'low';
  preloadDelay?: number;
}
// Skeleton par défaut
const DefaultSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);
export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <DefaultSkeleton />,
  threshold: _threshold = 0.1,
  margin = '100px',
  priority = 'normal',
  preloadDelay = 0,
}) => {
  const [shouldRender, setShouldRender] = useState(priority === 'high');
  const [isPreloading, setIsPreloading] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(
    ref,
    ({ once: true, margin } as unknown) as Parameters<typeof useInView>[1]
  );
  useEffect(() => {
    if (isInView && !shouldRender) {
      if (preloadDelay > 0) {
        setIsPreloading(true);
        setTimeout(() => {
          setShouldRender(true);
          setIsPreloading(false);
        }, preloadDelay);
      } else {
        setShouldRender(true);
      }
    }
  }, [isInView, shouldRender, preloadDelay]);
  // Préchargement basé sur la priorité
  useEffect(() => {
    if (priority === 'high') {
      setShouldRender(true);
    } else if (priority === 'low') {
      // Précharger seulement après les éléments critiques
      const timer = setTimeout(() => {
        if (isInView) {
          setShouldRender(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [priority, isInView]);
  return (
    <div ref={ref}>
      {shouldRender ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        <div className="min-h-[200px] flex items-center justify-center">
          {isPreloading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-sm text-muted-foreground">Chargement...</span>
            </div>
          ) : (
            fallback
          )}
        </div>
      )}
    </div>
  );
};
// Hook pour la gestion intelligente du lazy loading
export const useLazyLoading = () => {
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const preloadModule = React.useCallback(async (moduleId: string, importFn: () => Promise<unknown>) => {
    if (loadedModules.has(moduleId)) return;
    setLoading(true);
    try {
      await importFn();
      setLoadedModules(prev => new Set([...prev, moduleId]));
    } catch (error) {
      logger.warn('LazyWrapper', `Failed to preload module ${moduleId}:`, error);
    } finally {
      setLoading(false);
    }
  }, [loadedModules]);
  const preloadModules = React.useCallback(async (modules: Array<{ id: string; import: () => Promise<unknown> }>) => {
    const promises = modules
      .filter(m => !loadedModules.has(m.id))
      .map(m => preloadModule(m.id, m.import));
    await Promise.allSettled(promises);
  }, [loadedModules, preloadModule]);
  return {
    preloadModule,
    preloadModules,
    loadedModules: Array.from(loadedModules),
    loading,
    isLoaded: (moduleId: string) => loadedModules.has(moduleId),
  };
};
// Composant pour les metrics de lazy loading
export const LazyLoadingMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalComponents: 0,
    loadedComponents: 0,
    failedComponents: 0,
    averageLoadTime: 0,
  });
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes('lazy-component')) {
          setMetrics(prev => ({
            ...prev,
            totalComponents: prev.totalComponents + 1,
            loadedComponents: prev.loadedComponents + 1,
            averageLoadTime: (prev.averageLoadTime + entry.duration) / 2,
          }));
        }
      });
    });
    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, []);
  // Allow tests to override via global flag to avoid mutating import.meta.env
  const isDev = (globalThis as unknown as { importMetaEnvDev?: boolean }).importMetaEnvDev ?? import.meta.env.DEV;
  if (isDev) {
    return (
      <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
        <div>Lazy Components: {metrics.loadedComponents}/{metrics.totalComponents}</div>
        <div>Avg Load: {metrics.averageLoadTime.toFixed(2)}ms</div>
        {metrics.failedComponents > 0 && (
          <div className="text-red-400">Failed: {metrics.failedComponents}</div>
        )}
      </div>
    );
  }
  return null;
};
// HOC pour wrapper automatiquement les composants avec lazy loading
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    priority?: 'high' | 'normal' | 'low';
    skeleton?: React.ComponentType;
    preloadDelay?: number;
  } = {}
) => {
  const LazyComponent = (props: P) => {
    const Skeleton = options.skeleton || DefaultSkeleton;
    return (
      <LazyWrapper
        priority={options.priority}
        fallback={<Skeleton />}
        preloadDelay={options.preloadDelay}
      >
    <Component {...props} />
      </LazyWrapper>
    );
  };
  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return LazyComponent;
};
export default LazyWrapper;