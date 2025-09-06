// @ts-nocheck
import { useEffect, useCallback, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation } from 'react-router-dom';

// Types pour les Core Web Vitals
declare const gtag: ((event: string, name: string, params: Record<string, unknown>) => void) | undefined;
declare const plausible: ((event: string, options?: { props?: Record<string, unknown> }) => void) | undefined;
interface WebVitalMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  entries: PerformanceEntry[];
}

interface WebVitalsData {
  FCP?: WebVitalMetric;  // First Contentful Paint
  LCP?: WebVitalMetric;  // Largest Contentful Paint
  FID?: WebVitalMetric;  // First Input Delay
  CLS?: WebVitalMetric;  // Cumulative Layout Shift
  TTFB?: WebVitalMetric; // Time to First Byte
  INP?: WebVitalMetric;  // Interaction to Next Paint
}

interface PagePerformanceData {
  url: string;
  timestamp: number;
  metrics: WebVitalsData;
  deviceInfo: {
    userAgent: string;
    viewport: string;
    connection?: string;
    deviceMemory?: number;
  };
}

// Seuils pour les Core Web Vitals (en millisecondes)
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

// Fonction pour déterminer le rating d'une métrique
const getRating = (name: WebVitalMetric['name'], value: number): 'good' | 'needs-improvement' | 'poor' => {
  const thresholds = THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
};

// Hook principal pour le tracking des Web Vitals
export const useWebVitals = (options?: {
  reportCallback?: (metric: WebVitalMetric) => void;
  enableAnalytics?: boolean;
  debug?: boolean;
}) => {
  // Note: do not call useLocation conditionally in this hook
  const [vitalsData, setVitalsData] = useState<WebVitalsData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [pageScore, setPageScore] = useState<number>(0);

  // Envoyer les métriques vers les analytics (déclaré avant handleMetric pour éviter TDZ)
  const sendToAnalytics = useCallback((metric: WebVitalMetric) => {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_rating: metric.rating,
        custom_map: {
          metric_id: metric.id,
          metric_delta: metric.delta,
        },
      });
    }

    // Plausible Analytics
    if (typeof plausible !== 'undefined') {
      plausible('Web Vital', {
        props: {
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
        }
      });
    }
  }, []);

  // Tracker INP manuellement (déclaré avant l'utilisation dans useEffect)
  const trackINP = useCallback((callback: (metric: WebVitalMetric) => void) => {
    let maxInteractionTime = 0;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      
      entries.forEach((entry) => {
        if (entry.processingStart && entry.processingEnd) {
          const interactionTime = entry.processingEnd - entry.processingStart;
          maxInteractionTime = Math.max(maxInteractionTime, interactionTime);
          // no-op
        }
      });

      // Rapporter INP après un délai
      setTimeout(() => {
        if (maxInteractionTime > 0) {
          callback({
            name: 'INP',
            value: maxInteractionTime,
            rating: getRating('INP', maxInteractionTime),
            delta: maxInteractionTime,
            id: `inp-${Date.now()}`,
            entries: [],
          });
        }
      }, 1000);
    });

    try {
      observer.observe({ type: 'event', buffered: true });
      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('[WebVitals] INP tracking non supporté:', e);
    }
  }, []);

  // Callback pour traiter les métriques
  const handleMetric = useCallback((metric: WebVitalMetric) => {
    if (options?.debug) {
      console.log(`[WebVitals] ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      });
    }

    // Mettre à jour l'état
    flushSync(() => {
      setVitalsData(prev => ({
        ...prev,
        [metric.name]: metric,
      }));
    });

    // Callback personnalisé
    if (options?.reportCallback) {
      options.reportCallback(metric);
    }

    // Envoi vers les analytics si activé
    if (options?.enableAnalytics) {
      sendToAnalytics(metric);
    }
  }, [options, sendToAnalytics]);

  // Initialisation du tracking des Web Vitals
  useEffect(() => {
    let isActive = true;
    
  const initWebVitals = async () => {
      try {
        // Import dynamique de web-vitals
        const webVitals: any = await import('web-vitals');
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals as any;

        if (!isActive) return;

        // Initialiser chaque métrique
        getCLS(handleMetric);
        getFID(handleMetric);
        getFCP(handleMetric);
        getLCP(handleMetric);
        getTTFB(handleMetric);

        // INP (Interaction to Next Paint) - métrique expérimentale
        if ('PerformanceObserver' in window) {
          trackINP(handleMetric);
        }

  // Mark as ready once listeners are registered
  setIsLoading(false);
      } catch (error) {
        console.warn('[WebVitals] Erreur lors du chargement de web-vitals:', error);
        setIsLoading(false);
      }
    };

  void initWebVitals();

    return () => {
      isActive = false;
    };
  }, [handleMetric, trackINP]);

  // Calculer le score global de la page
  useEffect(() => {
    const metrics = Object.values(vitalsData).filter(Boolean);
    if (metrics.length === 0) return;

    const scores = metrics.map(metric => {
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return 0;
      }
    });

  const averageScore = scores.reduce((a: number, b) => a + b, 0) / scores.length;
    setPageScore(Math.round(averageScore));
  }, [vitalsData]);

  // (sendToAnalytics et trackINP sont définis plus haut)

  return {
    vitalsData,
    isLoading,
    pageScore,
    hasGoodVitals: pageScore >= 80,
    needsImprovement: pageScore >= 50 && pageScore < 80,
    hasPoorVitals: pageScore < 50,
  };
};

// Hook pour les statistiques de performance par page
export const usePagePerformance = () => {
  const location = useLocation();
  const [performanceData, setPerformanceData] = useState<PagePerformanceData[]>([]);

  void useWebVitals({
    reportCallback: (metric) => {
      // Sauvegarder les données de performance par page
      const pageData: PagePerformanceData = {
        url: location.pathname,
        timestamp: Date.now(),
        metrics: { [metric.name]: metric },
        deviceInfo: {
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          connection: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType,
          deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
        },
      };

      setPerformanceData(prev => {
        const existingIndex = prev.findIndex(p => 
          p.url === pageData.url && 
          Date.now() - p.timestamp < 30000 // Merger les données de la même page dans les 30 secondes
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex].metrics = { ...updated[existingIndex].metrics, ...pageData.metrics };
          return updated;
        } else {
          return [...prev, pageData].slice(-50); // Garder seulement les 50 dernières mesures
        }
      });
    },
    enableAnalytics: true,
    debug: process.env.NODE_ENV === 'development',
  });

  // Obtenir les statistiques pour une page spécifique
  const getPageStats = useCallback((url: string) => {
    const pageData = performanceData.filter(p => p.url === url);
    if (pageData.length === 0) return null;

    const metrics = pageData.reduce((acc, page) => {
      Object.entries(page.metrics).forEach(([key, metric]) => {
        if (!acc[key]) acc[key] = [];
        acc[key].push(metric.value);
      });
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(metrics).reduce((acc, [key, values]) => {
      acc[key] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
      return acc;
    }, {} as Record<string, { avg: number; min: number; max: number; count: number }>);
  }, [performanceData]);

  return {
    performanceData,
    currentPageStats: getPageStats(location.pathname),
    getPageStats,
  };
};

// Hook pour monitorer les régressions de performance
export const usePerformanceMonitoring = (alertThresholds?: Partial<typeof THRESHOLDS>) => {
  const [alerts, setAlerts] = useState<Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'critical';
    timestamp: number;
  }>>([]);

  const thresholds = { ...THRESHOLDS, ...alertThresholds };

  void useWebVitals({
    reportCallback: (metric) => {
      const threshold = thresholds[metric.name];
      const severity = metric.value > threshold.poor ? 'critical' : metric.value > threshold.good ? 'warning' : undefined;

      if (severity !== undefined) {
        setAlerts(prev => [...prev, {
          metric: metric.name,
          value: metric.value,
          threshold: severity === 'critical' ? threshold.poor : threshold.good,
          severity,
          timestamp: Date.now(),
        }].slice(-10)); // Garder seulement les 10 dernières alertes
      }
    },
  });

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    criticalAlerts: alerts.filter(a => a.severity === 'critical'),
    warningAlerts: alerts.filter(a => a.severity === 'warning'),
    clearAlerts,
  };
};

// Utilitaire pour générer un rapport de performance
export const generatePerformanceReport = (vitalsData: WebVitalsData) => {
  const report = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    score: 0,
    metrics: {} as Record<string, { value: number; rating: string; recommendation?: string }>,
    recommendations: [] as string[],
  };

  const ratings: Record<string, number> = { good: 100, 'needs-improvement': 50, poor: 0 };
  const scores: number[] = [];

  Object.entries(vitalsData).forEach(([name, metric]) => {
    if (!metric) return;

    scores.push(ratings[metric.rating] || 0);
    report.metrics[name] = {
      value: metric.value,
      rating: metric.rating,
    };

    // Recommandations spécifiques
    if (metric.rating !== 'good') {
      switch (metric.name) {
        case 'FCP':
          report.recommendations.push('Optimisez le chargement des ressources critiques et réduisez le temps de réponse serveur');
          break;
        case 'LCP':
          report.recommendations.push('Optimisez les images, préchargez les ressources critiques et utilisez un CDN');
          break;
        case 'FID':
          report.recommendations.push('Réduisez le JavaScript bloquant et optimisez les interactions');
          break;
        case 'CLS':
          report.recommendations.push('Définissez les tailles des images et évitez les insertions de contenu dynamique');
          break;
        case 'TTFB':
          report.recommendations.push('Améliorez les performances serveur et utilisez un CDN');
          break;
      }
    }
  });

  report.score = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return report;
};

export default useWebVitals;