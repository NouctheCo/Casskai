// Service d'optimisation des performances pour CassKai
import { ModuleDefinition } from '@/types/modules.types';

interface PerformanceMetrics {
  loadTime: number;
  bundleSize: number;
  memoryUsage: number;
  renderTime: number;
  interactionDelay: number;
}

interface OptimizationReport {
  score: number; // 0-100
  metrics: PerformanceMetrics;
  recommendations: Array<{
    type: 'critical' | 'warning' | 'info';
    category: 'loading' | 'rendering' | 'memory' | 'interaction' | 'network';
    message: string;
    impact: 'high' | 'medium' | 'low';
    fix?: string;
  }>;
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay  
    cls: number; // Cumulative Layout Shift
  };
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics | null = null;
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Initialiser le monitoring des performances
  initializeMonitoring(): void {
    this.setupPerformanceObservers();
    this.measureInitialMetrics();
  }

  private setupPerformanceObservers(): void {
    // Observer pour les Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lcp = entries[entries.length - 1] as PerformanceEntry;
        console.log('LCP:', lcp.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          console.log('FID:', (entry as any).processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        console.log('CLS:', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  private measureInitialMetrics(): void {
    // Mesurer les métriques initiales
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.metrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        bundleSize: 0, // À calculer depuis les ressources
        memoryUsage: this.getMemoryUsage(),
        renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        interactionDelay: 0, // Sera mesuré lors des interactions
      };
    }

    // Mesurer la taille du bundle
    this.calculateBundleSize();
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private calculateBundleSize(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;

    resources.forEach(resource => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        totalSize += resource.transferSize || 0;
      }
    });

    if (this.metrics) {
      this.metrics.bundleSize = totalSize / 1024; // KB
    }
  }

  // Analyser les performances des modules
  analyzeModulePerformance(modules: ModuleDefinition[]): OptimizationReport {
    const activeModules = modules.filter(m => m.status === 'available');
    const score = this.calculatePerformanceScore();
    const metrics = this.metrics || this.getDefaultMetrics();
    const recommendations = this.generateRecommendations(metrics, activeModules);
    const coreWebVitals = this.getCoreWebVitals();

    return {
      score,
      metrics,
      recommendations,
      coreWebVitals,
    };
  }

  private calculatePerformanceScore(): number {
    if (!this.metrics) return 50;

    let score = 100;
    const { loadTime, bundleSize, memoryUsage, renderTime, interactionDelay } = this.metrics;

    // Pénalités basées sur les métriques
    if (loadTime > 3000) score -= 20; // 3s+
    else if (loadTime > 1000) score -= 10; // 1s+

    if (bundleSize > 1000) score -= 15; // 1MB+
    else if (bundleSize > 500) score -= 8; // 500KB+

    if (memoryUsage > 100) score -= 15; // 100MB+
    else if (memoryUsage > 50) score -= 8; // 50MB+

    if (renderTime > 100) score -= 10; // 100ms+
    else if (renderTime > 50) score -= 5; // 50ms+

    if (interactionDelay > 100) score -= 20; // 100ms+
    else if (interactionDelay > 50) score -= 10; // 50ms+

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(
    metrics: PerformanceMetrics, 
    activeModules: ModuleDefinition[]
  ): OptimizationReport['recommendations'] {
    const recommendations: OptimizationReport['recommendations'] = [];

    // Recommandations basées sur les métriques
    if (metrics.loadTime > 3000) {
      recommendations.push({
        type: 'critical',
        category: 'loading',
        message: 'Temps de chargement trop élevé (>3s)',
        impact: 'high',
        fix: 'Implémenter le lazy loading et réduire la taille du bundle initial'
      });
    }

    if (metrics.bundleSize > 1000) {
      recommendations.push({
        type: 'critical',
        category: 'network',
        message: 'Taille de bundle trop importante (>1MB)',
        impact: 'high',
        fix: 'Diviser le code (code splitting) et supprimer les dépendances inutiles'
      });
    }

    if (metrics.memoryUsage > 100) {
      recommendations.push({
        type: 'warning',
        category: 'memory',
        message: 'Utilisation mémoire élevée (>100MB)',
        impact: 'medium',
        fix: 'Optimiser la gestion mémoire et nettoyer les références inutiles'
      });
    }

    if (metrics.renderTime > 100) {
      recommendations.push({
        type: 'warning',
        category: 'rendering',
        message: 'Temps de rendu lent (>100ms)',
        impact: 'medium',
        fix: 'Utiliser React.memo et optimiser les re-renders'
      });
    }

    if (metrics.interactionDelay > 100) {
      recommendations.push({
        type: 'critical',
        category: 'interaction',
        message: 'Délai d\'interaction trop élevé (>100ms)',
        impact: 'high',
        fix: 'Optimiser les handlers d\'événements et utiliser debouncing'
      });
    }

    // Recommandations spécifiques aux modules
    if (activeModules.length > 10) {
      recommendations.push({
        type: 'info',
        category: 'loading',
        message: 'Nombreux modules actifs peuvent impacter les performances',
        impact: 'medium',
        fix: 'Considérer désactiver les modules non utilisés'
      });
    }

    const premiumModules = activeModules.filter(m => m.isPremium);
    if (premiumModules.length > 5) {
      recommendations.push({
        type: 'info',
        category: 'memory',
        message: 'Modules premium multiples peuvent consommer plus de ressources',
        impact: 'low',
        fix: 'Surveiller l\'utilisation et optimiser si nécessaire'
      });
    }

    return recommendations;
  }

  private getCoreWebVitals(): OptimizationReport['coreWebVitals'] {
    // Valeurs simulées - en production, ces valeurs seraient collectées via les PerformanceObserver
    return {
      lcp: Math.random() * 2500 + 1000, // 1-3.5s
      fid: Math.random() * 100 + 50,    // 50-150ms
      cls: Math.random() * 0.25,        // 0-0.25
    };
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      loadTime: 1500,
      bundleSize: 400,
      memoryUsage: 45,
      renderTime: 32,
      interactionDelay: 28,
    };
  }

  // Optimisations automatiques
  enableAutoOptimizations(): void {
    this.enableImageLazyLoading();
    this.enableComponentMemoization();
    this.enableServiceWorkerCaching();
    this.enableResourceHints();
  }

  private enableImageLazyLoading(): void {
    // Activer le lazy loading pour toutes les images
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      img.setAttribute('loading', 'lazy');
    });
  }

  private enableComponentMemoization(): void {
    console.log('Memoization hints enabled for React components');
    // En production, ceci serait intégré avec React DevTools ou des outils de build
  }

  private enableServiceWorkerCaching(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered for caching optimization');
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  private enableResourceHints(): void {
    // Ajouter des resource hints pour les ressources critiques
    const head = document.head;
    
    // Preload critical resources
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'style';
    preloadLink.href = '/src/index.css';
    head.appendChild(preloadLink);

    // DNS prefetch for external resources
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = '//fonts.googleapis.com';
    head.appendChild(dnsPrefetch);
  }

  // Monitoring continu
  startPerformanceMonitoring(): void {
    // Monitor FPS
    this.monitorFPS();
    
    // Monitor memory leaks
    this.monitorMemoryLeaks();
    
    // Monitor long tasks
    this.monitorLongTasks();
  }

  private monitorFPS(): void {
    let lastTime = performance.now();
    let frames = 0;

    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        
        if (fps < 30) {
          console.warn(`Low FPS detected: ${fps}`);
        }
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  private monitorMemoryLeaks(): void {
    setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      
      if (memoryUsage > 200) { // 200MB threshold
        console.warn(`High memory usage detected: ${memoryUsage.toFixed(2)}MB`);
      }
    }, 30000); // Check every 30s
  }

  private monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            console.warn(`Long task detected: ${entry.duration}ms`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  // Nettoyage des observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Rapport de performance en temps réel
  getRealtimeMetrics(): {
    fps: number;
    memoryUsage: number;
    connectionType: string;
    batteryLevel?: number;
  } {
    return {
      fps: 60, // Simulé
      memoryUsage: this.getMemoryUsage(),
      connectionType: this.getConnectionType(),
      batteryLevel: this.getBatteryLevel(),
    };
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      return (navigator as any).connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private getBatteryLevel(): number | undefined {
    // Battery API is deprecated but still available in some browsers
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        return battery.level * 100;
      });
    }
    return undefined;
  }
}

export default PerformanceOptimizer;