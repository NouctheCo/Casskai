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

/**
 * Performance monitoring and optimization utilities
 */

import { useEffect, useRef } from 'react';

/**
 * Track component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;

    if (import.meta.env.DEV && renderTime > 16) {
      console.warn(
        `[Performance] ${componentName} rendered ${renderCount.current} times, last render took ${renderTime}ms`
      );
    }

    startTime.current = Date.now();
  });
};

/**
 * Debounce function for search inputs and resize handlers
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for scroll handlers
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Lazy load images with Intersection Observer
 */
export const useLazyImage = (src: string): [string | null, boolean] => {
  const imageSrcRef = useRef<string | null>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imageSrcRef.current = src;
      isLoadedRef.current = true;
    };
  }, [src]);

  return [imageSrcRef.current, isLoadedRef.current];
};

/**
 * Measure component mount time
 */
export const measureComponentMount = (componentName: string) => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const mountTime = endTime - startTime;

    // Ne logger que si trop lent
    if (import.meta.env.DEV && mountTime > 100) {
      console.warn(`[Mount Time] ${componentName}: ${mountTime.toFixed(2)}ms`);
    }

    // Send to analytics in production
    if (import.meta.env.PROD && window.plausible) {
      window.plausible('Component Mount', {
        props: {
          component: componentName,
          time: Math.round(mountTime),
        },
      });
    }
  };
};

/**
 * Detect slow renders and log them
 */
export const useSlowRenderDetector = (
  componentName: string,
  threshold = 16 // 16ms = 60fps threshold
) => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > threshold && import.meta.env.DEV) {
        console.warn(
          `[Slow Render] ${componentName} took ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
        );
      }
    };
  });
};

/**
 * Preload critical resources
 */
export const preloadResource = (href: string, as: string, type?: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
};

/**
 * Prefetch route components
 */
export const prefetchRoute = (routePath: string) => {
  // This will work with React Router lazy loading
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routePath;
  document.head.appendChild(link);
};

/**
 * Web Vitals tracking
 */
export const trackWebVitals = () => {
  if ('web-vitals' in window) {
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS((metric) => {
        if (window.plausible) {
          window.plausible('Web Vitals', {
            props: { metric: 'CLS', value: Math.round(metric.value * 1000) },
          });
        }
      });
      onINP((metric) => {
        if (window.plausible) {
          window.plausible('Web Vitals', {
            props: { metric: 'INP', value: Math.round(metric.value) },
          });
        }
      });
      onFCP((metric) => {
        if (window.plausible) {
          window.plausible('Web Vitals', {
            props: { metric: 'FCP', value: Math.round(metric.value) },
          });
        }
      });
      onLCP((metric) => {
        if (window.plausible) {
          window.plausible('Web Vitals', {
            props: { metric: 'LCP', value: Math.round(metric.value) },
          });
        }
      });
      onTTFB((metric) => {
        if (window.plausible) {
          window.plausible('Web Vitals', {
            props: { metric: 'TTFB', value: Math.round(metric.value) },
          });
        }
      });
    });
  }
};

/**
 * Optimized memo comparison for complex objects
 */
export const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
};
