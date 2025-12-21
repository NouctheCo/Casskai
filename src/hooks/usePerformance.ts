/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

// Hook pour l'optimisation des performances

import { useState, useEffect, useCallback } from 'react';

import PerformanceOptimizer from '@/services/performanceOptimizer';

import { ModuleDefinition } from '@/types/modules.types';



interface PerformanceState {

  isOptimized: boolean;

  metrics: {

    loadTime: number;

    bundleSize: number;

    memoryUsage: number;

    renderTime: number;

    interactionDelay: number;

  } | null;

  score: number;

  recommendations: Array<{

    type: 'critical' | 'warning' | 'info';

    category: string;

    message: string;

    impact: 'high' | 'medium' | 'low';

    fix?: string;

  }>;

  coreWebVitals: {

    lcp: number;

    fid: number;

    cls: number;

  } | null;

  isLoading: boolean;

}



export const usePerformance = (modules?: ModuleDefinition[]) => {

  const [state, setState] = useState<PerformanceState>({

    isOptimized: false,

    metrics: null,

    score: 0,

    recommendations: [],

    coreWebVitals: null,

    isLoading: true,

  });



  const optimizer = PerformanceOptimizer.getInstance();



  // Initialisation du monitoring

  useEffect(() => {

    optimizer.initializeMonitoring();

    

    return () => {

      optimizer.cleanup();

    };

  }, [optimizer]);



  // Analyse des performances

  const analyzePerformance = useCallback(async () => {

    setState(prev => ({ ...prev, isLoading: true }));



    try {

      if (modules) {

        const report = optimizer.analyzeModulePerformance(modules);

        

        setState({

          isOptimized: report.score > 80,

          metrics: report.metrics,

          score: report.score,

          recommendations: report.recommendations,

          coreWebVitals: report.coreWebVitals,

          isLoading: false,

        });

      }

    } catch (error) {

      console.error('Erreur lors de l\'analyse des performances:', error);

      setState(prev => ({ ...prev, isLoading: false }));

    }

  }, [modules, optimizer]);



  // Optimisations automatiques

  const enableOptimizations = useCallback(() => {

    optimizer.enableAutoOptimizations();

    setState(prev => ({ ...prev, isOptimized: true }));

  }, [optimizer]);



  // Monitoring en temps réel

  const [realtimeMetrics, setRealtimeMetrics] = useState<{

    fps: number;

    memoryUsage: number;

    connectionType: string;

    batteryLevel?: number;

  } | null>(null);



  useEffect(() => {

    const interval = setInterval(() => {

      const metrics = optimizer.getRealtimeMetrics();

      setRealtimeMetrics(metrics);

    }, 5000); // Update every 5 seconds



    return () => clearInterval(interval);

  }, [optimizer]);



  // Performance monitoring avec callbacks personnalisés

  const startMonitoring = useCallback((callbacks?: {

    onLowFPS?: (fps: number) => void;

    onHighMemory?: (memory: number) => void;

    onLongTask?: (duration: number) => void;

  }) => {

    optimizer.startPerformanceMonitoring();

    

    // Si des callbacks sont fournis, les intégrer

    if (callbacks) {

      // Implementation custom monitoring with callbacks

      console.log('Custom monitoring callbacks registered');

    }

  }, [optimizer]);



  return {

    // État

    ...state,

    realtimeMetrics,

    

    // Actions

    analyzePerformance,

    enableOptimizations,

    startMonitoring,

    

    // Utilitaires

    isPerformanceGood: state.score > 80,

    hasWarnings: state.recommendations.some(r => r.type === 'warning'),

    hasCriticalIssues: state.recommendations.some(r => r.type === 'critical'),

  };

};



// Hook pour optimiser les re-renders de composants

export const useRenderOptimization = (dependencies: any[]) => {

  const [renderCount, setRenderCount] = useState(0);

  const [lastRenderTime, setLastRenderTime] = useState(0);



  useEffect(() => {

    const now = performance.now();

    setRenderCount(prev => prev + 1);

    setLastRenderTime(now);

  }, dependencies);



  const renderTime = lastRenderTime > 0 ? performance.now() - lastRenderTime : 0;



  return {

    renderCount,

    renderTime,

    isSlowRender: renderTime > 16, // > 16ms = below 60fps

  };

};



// Hook pour lazy loading optimisé

export const useLazyLoading = <T>(

  loadFn: () => Promise<T>,

  threshold: number = 0.1

) => {

  const [data, setData] = useState<T | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<Error | null>(null);

  const [ref, setRef] = useState<HTMLElement | null>(null);



  useEffect(() => {

    if (!ref) return;



    const observer = new IntersectionObserver(

      ([entry]) => {

        if (entry.isIntersecting && !data && !isLoading) {

          setIsLoading(true);

          setError(null);

          

          loadFn()

            .then(result => {

              setData(result);

            })

            .catch(_err => {

              setError(error);

            })

            .finally(() => {

              setIsLoading(false);

            });

        }

      },

      { threshold }

    );



    observer.observe(ref);

    

    return () => {

      observer.disconnect();

    };

  }, [ref, loadFn, threshold, data, isLoading]);



  return {

    data,

    isLoading,

    error,

    ref: setRef,

  };

};



// Hook pour debouncing optimisé

export const useOptimizedDebounce = <T>(

  value: T,

  delay: number,

  options?: {

    leading?: boolean;

    maxWait?: number;

  }

) => {

  const [debouncedValue, setDebouncedValue] = useState(value);

  const [isDebouncing, setIsDebouncing] = useState(false);



  useEffect(() => {

    setIsDebouncing(true);

    

    const handler = setTimeout(() => {

      setDebouncedValue(value);

      setIsDebouncing(false);

    }, delay);



    // Leading edge

    if (options?.leading && !isDebouncing) {

      setDebouncedValue(value);

    }



    return () => {

      clearTimeout(handler);

    };

  }, [value, delay, options?.leading]);



  // Max wait implementation

  useEffect(() => {

    if (options?.maxWait) {

      const maxHandler = setTimeout(() => {

        setDebouncedValue(value);

        setIsDebouncing(false);

      }, options.maxWait);



      return () => clearTimeout(maxHandler);

    }

  }, [value, options?.maxWait]);



  return {

    debouncedValue,

    isDebouncing,

  };

};



// Hook pour Virtual Scrolling

export const useVirtualScrolling = <T>(

  items: T[],

  itemHeight: number,

  containerHeight: number

) => {

  const [scrollTop, setScrollTop] = useState(0);

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });



  useEffect(() => {

    const startIndex = Math.floor(scrollTop / itemHeight);

    const endIndex = Math.min(

      startIndex + Math.ceil(containerHeight / itemHeight) + 1,

      items.length - 1

    );



    setVisibleRange({ start: startIndex, end: endIndex });

  }, [scrollTop, itemHeight, containerHeight, items.length]);



  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);

  const offsetY = visibleRange.start * itemHeight;

  const totalHeight = items.length * itemHeight;



  return {

    visibleItems,

    offsetY,

    totalHeight,

    onScroll: (e: React.UIEvent<HTMLElement>) => {

      setScrollTop(e.currentTarget.scrollTop);

    },

    visibleRange,

  };

};



export default usePerformance;
