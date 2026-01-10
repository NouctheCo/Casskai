import React, { Suspense, lazy, ComponentType, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
interface LazyComponentLoaderProps<T = Record<string, unknown>> {
  loader: () => Promise<{ default: ComponentType<T> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  delay?: number;
  preload?: boolean;
  retryOnError?: boolean;
  componentProps?: T;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}
// Enhanced loading skeleton
const LoadingSkeleton = ({ delay = 200 }: { delay?: number }) => {
  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  if (!showLoading) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center p-8"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-blue-500" />
        </motion.div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Chargement du composant...
        </p>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-blue-500 rounded-full dark:bg-blue-900/20"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { 
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onRetry?: () => void;
    retryOnError?: boolean;
  },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, retryCount: 0 };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('LazyComponentLoader', 'LazyComponentLoader Error:', error, errorInfo);
  }
  handleRetry = () => {
    if (this.state.retryCount < 3) {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        retryCount: this.state.retryCount + 1 
      });
      this.props.onRetry?.();
    }
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
        >
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 text-center mb-4 max-w-md">
            {this.state.error?.message || 'Le composant n\'a pas pu être chargé.'}
          </p>
          {this.props.retryOnError && this.state.retryCount < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="gap-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Loader2 className="h-4 w-4" />
              </motion.div>
              Réessayer ({3 - this.state.retryCount} restants)
            </Button>
          )}
          {this.state.retryCount >= 3 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300 mt-2">
              Nombre maximum de tentatives atteint
            </p>
          )}
        </motion.div>
      );
    }
    return this.props.children;
  }
}
// Hook for intelligent preloading
export function useLazyPreload<T>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  shouldPreload: boolean = false
) {
  const [isPreloaded, setIsPreloaded] = useState(false);
  useEffect(() => {
    if (shouldPreload && !isPreloaded) {
      loader().then(() => {
        setIsPreloaded(true);
        logger.debug('LazyComponentLoader', 'Component preloaded successfully');
      }).catch((error) => {
        logger.warn('LazyComponentLoader', 'Failed to preload component:', error);
      });
    }
  }, [shouldPreload, isPreloaded, loader]);
  return isPreloaded;
}
// Main lazy component loader
export function LazyComponentLoader<T = Record<string, unknown>>({
  loader,
  fallback,
  errorFallback,
  delay = 200,
  preload = false,
  retryOnError = true,
  componentProps,
}: LazyComponentLoaderProps<T>) {
  const [LazyComponent, setLazyComponent] = useState<ComponentType<T> | null>(null);
  const [key, setKey] = useState(0);
  // Preload if needed
  useLazyPreload(loader, preload);
  // Create lazy component
  useEffect(() => {
    const LazyComp = lazy(loader);
    setLazyComponent(LazyComp as ComponentType<T>);
  }, [loader, key]);
  const handleRetry = () => {
    setKey(prev => prev + 1);
  };
  if (!LazyComponent) {
    return fallback || <LoadingSkeleton delay={delay} />;
  }
  return (
    <LazyErrorBoundary
      fallback={errorFallback}
      onRetry={handleRetry}
      retryOnError={retryOnError}
    >
      <Suspense fallback={fallback || <LoadingSkeleton delay={delay} />}>
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            <LazyComponent {...(componentProps as T)} />
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </LazyErrorBoundary>
  );
}
// HOC for creating lazy components with default settings
export function createLazyComponent<T = Record<string, unknown>>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  options?: Partial<LazyComponentLoaderProps<T>>
) {
  return function LazyWrapper(props: T) {
    return (
      <LazyComponentLoader
        loader={loader}
        componentProps={props}
        {...options}
      />
    );
  };
}
// Hook for intersection observer based lazy loading
export function useIntersectionLazyLoad(
  threshold: number = 0.1,
  rootMargin: string = '50px'
) {
  const [isVisible, setIsVisible] = useState(false);
  const [element, setElement] = useState<Element | null>(null);
  useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [element, threshold, rootMargin]);
  return [setElement, isVisible] as const;
}
// Lazy section component that loads when in viewport
export function LazySectionLoader<T = Record<string, unknown>>({
  loader,
  fallback,
  height = 200,
  className = '',
  componentProps,
  ...loaderProps
}: LazyComponentLoaderProps<T> & {
  height?: number;
  className?: string;
}) {
  const [setRef, isVisible] = useIntersectionLazyLoad();
  return (
    <div
      ref={setRef}
      className={`min-h-[${height}px] ${className}`}
      style={{ minHeight: height }}
    >
      {isVisible ? (
        <LazyComponentLoader
          loader={loader}
          fallback={fallback}
          componentProps={componentProps}
          {...loaderProps}
        />
      ) : (
        <div 
          className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse"
          style={{ height }}
        >
          <div className="text-gray-400 dark:text-gray-300 text-sm">
            Scroll pour charger...
          </div>
        </div>
      )}
    </div>
  );
}
// Performance monitoring hook
export function useComponentPerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      if (loadTime > 100) {
        logger.warn('LazyComponentLoader', `${componentName} took ${loadTime.toFixed(2)}ms to mount`);
      }
      // Optional: Send to analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'component_performance', {
          component_name: componentName,
          load_time: Math.round(loadTime),
        });
      }
    };
  }, [componentName]);
}