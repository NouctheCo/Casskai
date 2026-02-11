/**
 * CassKai - Performance Monitoring Service
 *
 * Phase 2 (P1) - Optimisation Performance
 *
 * Fonctionnalités:
 * - Web Vitals monitoring (LCP, FID, CLS, FCP, TTFB)
 * - Performance marks et measures
 * - Resource timing analysis
 * - Long tasks detection
 * - Memory usage tracking
 * - Bundle size monitoring
 * - Reporting vers backend (optionnel)
 */

import React from 'react';
import { logger } from './logger';

export interface WebVitalsMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: string;
}

export interface PerformanceReport {
  metrics: WebVitalsMetric[];
  marks: PerformanceMark[];
  resources: ResourceTiming[];
  longTasks: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private marks: Map<string, PerformanceMark> = new Map();
  private reportingEnabled = true;
  private reportingEndpoint?: string;

  private constructor() {
    this.setupWebVitals();
    this.setupLongTasksObserver();
    this.setupResourceObserver();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Setup Web Vitals monitoring
   */
  private setupWebVitals() {
    if (typeof window === 'undefined') return;

    // LCP - Largest Contentful Paint
    this.observeLCP();

    // FID - First Input Delay
    this.observeFID();

    // CLS - Cumulative Layout Shift
    this.observeCLS();

    // FCP - First Contentful Paint
    this.observeFCP();

    // TTFB - Time to First Byte
    this.observeTTFB();

    // INP - Interaction to Next Paint (new metric)
    this.observeINP();
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   */
  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        this.recordMetric('LCP', lcp);
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_error) {
      logger.error('PerformanceMonitor', 'LCP observation error:', _error);
    }
  }

  /**
   * Observe First Input Delay (FID)
   */
  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.recordMetric('FID', fid);
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (_error) {
      logger.error('PerformanceMonitor', 'FID observation error:', _error);
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   */
  private observeCLS() {
    try {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('CLS', clsValue);
          }
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (_error) {
      logger.error('PerformanceMonitor', 'CLS observation error:', _error);
    }
  }

  /**
   * Observe First Contentful Paint (FCP)
   */
  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('FCP', entry.startTime);
        });
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (_error) {
      logger.error('PerformanceMonitor', 'FCP observation error:', _error);
    }
  }

  /**
   * Observe Time to First Byte (TTFB)
   */
  private observeTTFB() {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        this.recordMetric('TTFB', ttfb);
      }
    } catch (_error) {
      logger.error('PerformanceMonitor', 'TTFB observation error:', _error);
    }
  }

  /**
   * Observe Interaction to Next Paint (INP)
   */
  private observeINP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const inp = entry.processingEnd - entry.startTime;
          this.recordMetric('INP', inp);
        });
      });

      observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch {
      // INP might not be supported in all browsers yet
      logger.debug('PerformanceMonitor', 'INP not supported in this browser');
    }
  }

  /**
   * Record a Web Vitals metric
   */
  private recordMetric(name: WebVitalsMetric['name'], value: number) {
    const rating = this.getRating(name, value);

    const metric: WebVitalsMetric = {
      name,
      value,
      rating,
    };

    this.metrics.set(name, metric);

    logger.debug('PerformanceMonitor', `${name}:`, {
      value: Math.round(value),
      rating,
    });

    // Report if needed
    if (this.reportingEnabled && rating === 'poor') {
      this.reportMetric(metric);
    }
  }

  /**
   * Get rating for a metric based on Web Vitals thresholds
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Setup Long Tasks Observer
   */
  private setupLongTasksObserver() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.duration > 50) {
            logger.warn('PerformanceMonitor', 'Long task detected:', {
              name: entry.name,
              duration: Math.round(entry.duration),
            });
          }
        });
      });

      observer.observe({ type: 'longtask', buffered: true });
    } catch {
      logger.debug('PerformanceMonitor', 'Long tasks not supported in this browser');
    }
  }

  /**
   * Setup Resource Observer
   */
  private setupResourceObserver() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.transferSize > 1000000) {
            // Resources > 1MB
            logger.warn('PerformanceMonitor', 'Large resource detected:', {
              name: entry.name,
              size: `${(entry.transferSize / 1024 / 1024).toFixed(2)} MB`,
              duration: Math.round(entry.duration),
            });
          }
        });
      });

      observer.observe({ type: 'resource', buffered: true });
    } catch (_error) {
      logger.error('PerformanceMonitor', 'Resource observation error:', _error);
    }
  }

  /**
   * Create a performance mark
   */
  mark(name: string, metadata?: Record<string, any>) {
    const startTime = performance.now();

    performance.mark(name);

    this.marks.set(name, {
      name,
      startTime,
      metadata,
    });

    logger.debug('PerformanceMonitor', `Mark: ${name}`, { startTime: Math.round(startTime) });
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string) {
    try {
      const end = endMark || `${startMark}-end`;
      performance.mark(end);

      performance.measure(name, startMark, end);

      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        const mark = this.marks.get(startMark);
        if (mark) {
          mark.duration = measure.duration;
        }

        logger.debug('PerformanceMonitor', `Measure: ${name}`, {
          duration: Math.round(measure.duration),
        });

        return measure.duration;
      }
    } catch (_error) {
      logger.error('PerformanceMonitor', 'Measure error:', _error);
    }

    return 0;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return undefined;
  }

  /**
   * Get all resource timings
   */
  getResourceTimings(): ResourceTiming[] {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    return resources.map((resource) => ({
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize || 0,
      type: resource.initiatorType,
    }));
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    return {
      metrics: Array.from(this.metrics.values()),
      marks: Array.from(this.marks.values()),
      resources: this.getResourceTimings(),
      longTasks: 0, // Would need to track this separately
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now(),
    };
  }

  /**
   * Report metric to backend (optional)
   */
  private reportMetric(metric: WebVitalsMetric) {
    if (!this.reportingEndpoint) return;

    try {
      // Use sendBeacon for reliable reporting
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          metric,
          url: window.location.href,
          timestamp: Date.now(),
        });

        navigator.sendBeacon(this.reportingEndpoint, data);
      }
    } catch (_error) {
      logger.error('PerformanceMonitor', 'Failed to report metric:', _error);
    }
  }

  /**
   * Configure reporting
   */
  configureReporting(endpoint?: string, enabled = true) {
    this.reportingEndpoint = endpoint;
    this.reportingEnabled = enabled;
  }

  /**
   * Get all metrics
   */
  getMetrics(): WebVitalsMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metric by name
   */
  getMetric(name: string): WebVitalsMetric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Clear all metrics and marks
   */
  clear() {
    this.metrics.clear();
    this.marks.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  return performanceMonitor;
}

/**
 * HOC to track component render time
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Component';

    React.useEffect(() => {
      performanceMonitor.mark(`${name}-mount`);

      return () => {
        performanceMonitor.measure(`${name}-mounted`, `${name}-mount`);
      };
    }, []);

    return <Component {...props} />;
  };
}
