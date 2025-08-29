# PerformanceOptimizer - Optimisation et Monitoring des Performances

## Vue d'ensemble

Le `PerformanceOptimizer` est un service avancé de monitoring et d'optimisation des performances pour CassKai. Il mesure les Web Vitals, détecte les problèmes de performance, génère des recommandations automatiques et applique des optimisations en temps réel.

## Architecture

```typescript
PerformanceOptimizer (Singleton)
├── Performance Monitoring
│   ├── Web Vitals (LCP, FID, CLS, TTFB, INP)
│   ├── Core Metrics (Load Time, Bundle Size, Memory)
│   └── Real-time Tracking
├── Analysis Engine
│   ├── Performance Scoring
│   ├── Recommendation System
│   └── Module Impact Analysis
├── Auto-optimizations
│   ├── Lazy Loading
│   ├── Service Worker Caching
│   ├── Resource Hints
│   └── Component Memoization
└── Continuous Monitoring
    ├── FPS Tracking
    ├── Memory Leak Detection
    └── Long Task Detection
```

## Web Vitals et Métriques Core

### Web Vitals Mesurés

```typescript
interface CoreWebVitals {
  lcp: number;  // Largest Contentful Paint (cible: <2.5s)
  fid: number;  // First Input Delay (cible: <100ms)
  cls: number;  // Cumulative Layout Shift (cible: <0.1)
  ttfb: number; // Time to First Byte (cible: <600ms)
  inp: number;  // Interaction to Next Paint (nouveau métrique)
}

interface PerformanceMetrics {
  loadTime: number;        // Temps de chargement total
  bundleSize: number;      // Taille du bundle (KB)
  memoryUsage: number;     // Utilisation mémoire (MB)
  renderTime: number;      // Temps de rendu initial
  interactionDelay: number; // Délai moyen d'interaction
}
```

### Utilisation de Base

```typescript
import { PerformanceOptimizer } from '@/services/performanceOptimizer';

const optimizer = PerformanceOptimizer.getInstance();

// Initialiser le monitoring
optimizer.initializeMonitoring();

// Analyser les performances des modules actifs
const modules = moduleManager.getActiveModules();
const report = optimizer.analyzeModulePerformance(modules);

console.log('Score de performance:', report.score); // 0-100
console.log('Métriques:', report.metrics);
console.log('Recommandations:', report.recommendations);
console.log('Core Web Vitals:', report.coreWebVitals);
```

## Système de Scoring et Recommandations

### Calcul du Score de Performance

```typescript
const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
  let score = 100;
  
  // Pénalités basées sur les seuils
  const penalties = [
    { condition: metrics.loadTime > 3000, penalty: 20 },    // 3s+
    { condition: metrics.loadTime > 1000, penalty: 10 },    // 1s+
    { condition: metrics.bundleSize > 1000, penalty: 15 },  // 1MB+
    { condition: metrics.bundleSize > 500, penalty: 8 },    // 500KB+
    { condition: metrics.memoryUsage > 100, penalty: 15 },  // 100MB+
    { condition: metrics.memoryUsage > 50, penalty: 8 },    // 50MB+
    { condition: metrics.renderTime > 100, penalty: 10 },   // 100ms+
    { condition: metrics.renderTime > 50, penalty: 5 },     // 50ms+
    { condition: metrics.interactionDelay > 100, penalty: 20 }, // 100ms+
    { condition: metrics.interactionDelay > 50, penalty: 10 }   // 50ms+
  ];

  penalties.forEach(({ condition, penalty }) => {
    if (condition) score -= penalty;
  });

  return Math.max(0, Math.min(100, score));
};
```

### Recommandations Automatiques

```typescript
const generateRecommendations = (metrics: PerformanceMetrics, modules: ModuleDefinition[]) => {
  const recommendations = [];

  // Recommandations critiques
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

  // Recommandations d'optimisation mémoire
  if (metrics.memoryUsage > 100) {
    recommendations.push({
      type: 'warning',
      category: 'memory',
      message: 'Utilisation mémoire élevée (>100MB)',
      impact: 'medium',
      fix: 'Optimiser la gestion mémoire et nettoyer les références inutiles'
    });
  }

  // Recommandations spécifiques aux modules
  if (modules.length > 10) {
    recommendations.push({
      type: 'info',
      category: 'loading',
      message: 'Nombreux modules actifs peuvent impacter les performances',
      impact: 'medium',
      fix: 'Considérer désactiver les modules non utilisés'
    });
  }

  return recommendations;
};
```

## Optimisations Automatiques

### Activation des Optimisations

```typescript
// Activer toutes les optimisations automatiques
optimizer.enableAutoOptimizations();

// Ou activer individuellement
optimizer.enableImageLazyLoading();
optimizer.enableComponentMemoization(); 
optimizer.enableServiceWorkerCaching();
optimizer.enableResourceHints();
```

### Image Lazy Loading

```typescript
const enableImageLazyLoading = () => {
  // Activer le lazy loading pour toutes les images existantes
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
  });

  // Observer pour les nouvelles images
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const images = node.querySelectorAll?.('img:not([loading])');
          images?.forEach(img => {
            img.setAttribute('loading', 'lazy');
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};
```

### Service Worker Caching

```typescript
const enableServiceWorkerCaching = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker enregistré pour le caching');
        
        // Écouter les mises à jour
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Nouvelle version du Service Worker disponible');
        });
      })
      .catch(error => {
        console.error('❌ Échec Service Worker:', error);
      });
  }
};
```

### Resource Hints

```typescript
const enableResourceHints = () => {
  const head = document.head;
  
  // Preload des ressources critiques
  const criticalResources = [
    { href: '/src/index.css', as: 'style' },
    { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    Object.assign(link, resource);
    head.appendChild(link);
  });

  // DNS prefetch pour les domaines externes
  const externalDomains = [
    '//fonts.googleapis.com',
    '//cdn.jsdelivr.net',
    '//api.stripe.com'
  ];

  externalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    head.appendChild(link);
  });

  // Preconnect pour les domaines critiques
  const criticalDomains = [
    'https://fonts.gstatic.com'
  ];

  criticalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    head.appendChild(link);
  });
};
```

## Monitoring Continu

### Surveillance FPS

```typescript
const monitorFPS = () => {
  let lastTime = performance.now();
  let frames = 0;
  let fpsHistory = [];

  const measureFPS = () => {
    frames++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frames * 1000) / (currentTime - lastTime));
      fpsHistory.push(fps);
      
      // Garder seulement les 60 dernières mesures (1 minute)
      if (fpsHistory.length > 60) {
        fpsHistory.shift();
      }

      // Alerte si FPS faible
      if (fps < 30) {
        console.warn(`⚠️ FPS faible détecté: ${fps}`);
        // Déclencher des optimisations d'urgence
        triggerEmergencyOptimizations();
      }

      // Calcul de la moyenne mobile
      const avgFPS = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
      if (avgFPS < 40) {
        console.warn(`⚠️ FPS moyen faible: ${avgFPS.toFixed(1)}`);
      }
      
      frames = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
  };

  requestAnimationFrame(measureFPS);
};
```

### Détection de Fuites Mémoire

```typescript
const monitorMemoryLeaks = () => {
  let memoryBaseline = null;
  let alertThreshold = 200; // 200MB
  let measurements = [];

  const checkMemory = () => {
    if ('memory' in performance) {
      const memoryInfo = performance.memory;
      const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
      const totalMB = memoryInfo.totalJSHeapSize / 1024 / 1024;
      const limitMB = memoryInfo.jsHeapSizeLimit / 1024 / 1024;

      measurements.push({
        timestamp: Date.now(),
        used: usedMB,
        total: totalMB,
        limit: limitMB
      });

      // Garder seulement les 20 dernières mesures (10 minutes)
      if (measurements.length > 20) {
        measurements.shift();
      }

      // Établir la baseline au démarrage
      if (!memoryBaseline && measurements.length >= 3) {
        memoryBaseline = usedMB;
      }

      // Détecter une croissance anormale
      if (memoryBaseline && usedMB > memoryBaseline * 2) {
        console.warn(`⚠️ Possible fuite mémoire détectée:
          Baseline: ${memoryBaseline.toFixed(1)}MB
          Actuel: ${usedMB.toFixed(1)}MB
          Croissance: ${((usedMB / memoryBaseline - 1) * 100).toFixed(1)}%`);
      }

      // Alerte seuil absolu
      if (usedMB > alertThreshold) {
        console.error(`🚨 Utilisation mémoire critique: ${usedMB.toFixed(1)}MB`);
        
        // Forcer la récupération de mémoire
        if (window.gc) {
          window.gc();
          console.log('🧹 Garbage collection forcée');
        }
      }

      return {
        used: usedMB,
        total: totalMB,
        limit: limitMB,
        growth: memoryBaseline ? (usedMB / memoryBaseline - 1) * 100 : 0
      };
    }

    return null;
  };

  // Vérifier toutes les 30 secondes
  setInterval(checkMemory, 30000);
  
  return checkMemory;
};
```

### Détection des Long Tasks

```typescript
const monitorLongTasks = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const duration = entry.duration;
        
        if (duration > 50) { // Long task > 50ms
          console.warn(`⚠️ Long task détectée: ${duration.toFixed(1)}ms`);
          
          // Analyser la source si possible
          if (entry.attribution && entry.attribution.length > 0) {
            const attribution = entry.attribution[0];
            console.warn(`  Source: ${attribution.name} (${attribution.containerType})`);
          }

          // Recommandations d'optimisation
          if (duration > 200) {
            console.warn(`  💡 Recommandation: Diviser cette tâche avec setTimeout ou requestIdleCallback`);
          }

          // Métriques pour analyse
          logLongTaskMetric({
            duration,
            timestamp: entry.startTime,
            name: entry.name,
            attribution: entry.attribution?.[0]?.name
          });
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
    return observer;
  }
  
  console.warn('⚠️ Long task detection non supporté par ce navigateur');
  return null;
};

const logLongTaskMetric = (taskInfo) => {
  // En production, envoyer vers un service de monitoring
  if (import.meta.env.PROD) {
    // analytics.track('long_task_detected', taskInfo);
  }
  
  // Stocker localement pour analyse
  const longTasks = JSON.parse(localStorage.getItem('longTasks') || '[]');
  longTasks.push(taskInfo);
  
  // Garder seulement les 100 dernières
  if (longTasks.length > 100) {
    longTasks.shift();
  }
  
  localStorage.setItem('longTasks', JSON.stringify(longTasks));
};
```

## Intégration avec l'Interface Utilisateur

### Composant Performance Dashboard

```typescript
import React, { useState, useEffect } from 'react';
import { PerformanceOptimizer } from '@/services/performanceOptimizer';

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [report, setReport] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizer = PerformanceOptimizer.getInstance();

  useEffect(() => {
    loadPerformanceData();
    
    // Mise à jour en temps réel
    const interval = setInterval(updateRealtimeMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      const moduleManager = await import('@/services/moduleManager');
      const modules = moduleManager.default.getInstance().getActiveModules();
      
      const performanceReport = optimizer.analyzeModulePerformance(modules);
      setReport(performanceReport);
      setMetrics(performanceReport.metrics);
      
      console.log('📊 Rapport de performance chargé:', performanceReport);
    } catch (error) {
      console.error('Erreur chargement performances:', error);
    }
  };

  const updateRealtimeMetrics = () => {
    const realtime = optimizer.getRealtimeMetrics();
    setRealtimeMetrics(realtime);
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    
    try {
      // Activer les optimisations automatiques
      optimizer.enableAutoOptimizations();
      
      // Attendre un peu pour voir l'effet
      setTimeout(() => {
        loadPerformanceData();
        setIsOptimizing(false);
      }, 3000);
      
    } catch (error) {
      console.error('Erreur optimisation:', error);
      setIsOptimizing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'orange';
    return 'red';
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  if (!report) {
    return <div>Chargement des métriques de performance...</div>;
  }

  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <h2>🚀 Tableau de Bord Performance</h2>
        <button 
          onClick={handleOptimize}
          disabled={isOptimizing}
          className="optimize-button"
        >
          {isOptimizing ? '⚙️ Optimisation...' : '🎯 Optimiser'}
        </button>
      </div>

      {/* Score global */}
      <div className="performance-score">
        <div className={`score-circle score-${getScoreColor(report.score)}`}>
          <span className="score-value">{report.score}</span>
          <span className="score-label">Score</span>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>⏱️ Temps de Chargement</h4>
          <div className="metric-value">
            {(metrics.loadTime / 1000).toFixed(2)}s
          </div>
          <div className="metric-target">Cible: &lt;3s</div>
        </div>

        <div className="metric-card">
          <h4>📦 Taille Bundle</h4>
          <div className="metric-value">
            {(metrics.bundleSize).toFixed(0)}KB
          </div>
          <div className="metric-target">Cible: &lt;500KB</div>
        </div>

        <div className="metric-card">
          <h4>🧠 Mémoire</h4>
          <div className="metric-value">
            {metrics.memoryUsage.toFixed(1)}MB
          </div>
          <div className="metric-target">Cible: &lt;100MB</div>
        </div>

        <div className="metric-card">
          <h4>⚡ Interaction</h4>
          <div className="metric-value">
            {metrics.interactionDelay.toFixed(0)}ms
          </div>
          <div className="metric-target">Cible: &lt;100ms</div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="web-vitals">
        <h3>📈 Core Web Vitals</h3>
        <div className="vitals-grid">
          <div className="vital-card">
            <h4>LCP</h4>
            <div className="vital-value">
              {(report.coreWebVitals.lcp / 1000).toFixed(2)}s
            </div>
            <div className="vital-status">
              {report.coreWebVitals.lcp < 2500 ? '✅' : '❌'}
            </div>
          </div>

          <div className="vital-card">
            <h4>FID</h4>
            <div className="vital-value">
              {report.coreWebVitals.fid.toFixed(0)}ms
            </div>
            <div className="vital-status">
              {report.coreWebVitals.fid < 100 ? '✅' : '❌'}
            </div>
          </div>

          <div className="vital-card">
            <h4>CLS</h4>
            <div className="vital-value">
              {report.coreWebVitals.cls.toFixed(3)}
            </div>
            <div className="vital-status">
              {report.coreWebVitals.cls < 0.1 ? '✅' : '❌'}
            </div>
          </div>
        </div>
      </div>

      {/* Métriques temps réel */}
      {realtimeMetrics && (
        <div className="realtime-metrics">
          <h3>⏱️ Temps Réel</h3>
          <div className="realtime-grid">
            <div className="realtime-card">
              <h4>FPS</h4>
              <div className="realtime-value">{realtimeMetrics.fps}</div>
            </div>
            <div className="realtime-card">
              <h4>Connexion</h4>
              <div className="realtime-value">{realtimeMetrics.connectionType}</div>
            </div>
            {realtimeMetrics.batteryLevel && (
              <div className="realtime-card">
                <h4>Batterie</h4>
                <div className="realtime-value">{realtimeMetrics.batteryLevel}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommandations */}
      <div className="recommendations">
        <h3>💡 Recommandations</h3>
        {report.recommendations.length === 0 ? (
          <div className="no-recommendations">
            ✅ Aucune recommandation - Performance optimale !
          </div>
        ) : (
          <div className="recommendations-list">
            {report.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation recommendation-${rec.type}`}>
                <div className="rec-header">
                  {getRecommendationIcon(rec.type)}
                  <span className="rec-category">{rec.category}</span>
                  <span className={`rec-impact impact-${rec.impact}`}>
                    {rec.impact} impact
                  </span>
                </div>
                <div className="rec-message">{rec.message}</div>
                {rec.fix && (
                  <div className="rec-fix">
                    <strong>Solution:</strong> {rec.fix}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;
```

## CSS pour le Dashboard

```css
.performance-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.optimize-button {
  padding: 10px 20px;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.optimize-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.performance-score {
  text-align: center;
  margin-bottom: 30px;
}

.score-circle {
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 8px solid;
  margin: 0 auto;
}

.score-circle.score-green { border-color: #4CAF50; }
.score-circle.score-orange { border-color: #FF9800; }
.score-circle.score-red { border-color: #f44336; }

.score-value {
  font-size: 2.5em;
  font-weight: bold;
}

.score-label {
  font-size: 0.9em;
  opacity: 0.7;
}

.metrics-grid, .vitals-grid, .realtime-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card, .vital-card, .realtime-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.metric-value, .vital-value, .realtime-value {
  font-size: 2em;
  font-weight: bold;
  color: #333;
  margin: 10px 0;
}

.metric-target {
  font-size: 0.9em;
  color: #666;
}

.vital-status {
  font-size: 1.5em;
  margin-top: 10px;
}

.recommendations {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.recommendation {
  border-left: 4px solid;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.recommendation-critical {
  border-color: #f44336;
  background: #ffebee;
}

.recommendation-warning {
  border-color: #FF9800;
  background: #fff8e1;
}

.recommendation-info {
  border-color: #2196F3;
  background: #e3f2fd;
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-weight: bold;
}

.rec-impact {
  font-size: 0.8em;
  padding: 2px 8px;
  border-radius: 12px;
  color: white;
}

.impact-high { background-color: #f44336; }
.impact-medium { background-color: #FF9800; }
.impact-low { background-color: #4CAF50; }

.rec-message {
  color: #333;
  margin-bottom: 8px;
}

.rec-fix {
  font-size: 0.9em;
  color: #666;
  font-style: italic;
}

.no-recommendations {
  text-align: center;
  color: #4CAF50;
  font-weight: bold;
  padding: 20px;
}
```

## Configuration et Intégration

### Intégration dans App.tsx

```typescript
import React, { useEffect } from 'react';
import { PerformanceOptimizer } from '@/services/performanceOptimizer';

function App() {
  useEffect(() => {
    // Initialiser le monitoring des performances
    const optimizer = PerformanceOptimizer.getInstance();
    optimizer.initializeMonitoring();
    
    // Activer les optimisations automatiques en production
    if (import.meta.env.PROD) {
      optimizer.enableAutoOptimizations();
      optimizer.startPerformanceMonitoring();
    }
    
    // Nettoyage au démontage
    return () => {
      optimizer.cleanup();
    };
  }, []);

  return (
    <div className="App">
      {/* Votre application */}
    </div>
  );
}

export default App;
```

### Service Worker (public/sw.js)

```javascript
// Service Worker pour le caching optimisé
const CACHE_NAME = 'casskai-v1.0.0';
const STATIC_RESOURCES = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_RESOURCES))
  );
});

// Stratégie de cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retourner la réponse
        if (response) {
          return response;
        }

        // Cloner la requête
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Vérifier si on a une réponse valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cloner la réponse
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      }
    )
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

## Bonnes Pratiques et Optimisations

### 1. Monitoring Proactif

```typescript
// Surveillance automatique avec seuils d'alerte
class PerformanceMonitor {
  private thresholds = {
    loadTime: 3000,      // 3s
    memoryUsage: 150,    // 150MB
    fps: 30,             // 30 FPS
    longTask: 100        // 100ms
  };

  async checkThresholds() {
    const metrics = optimizer.getRealtimeMetrics();
    const alerts = [];

    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'memory',
        value: metrics.memoryUsage,
        threshold: this.thresholds.memoryUsage
      });
    }

    if (metrics.fps < this.thresholds.fps) {
      alerts.push({
        type: 'fps',
        value: metrics.fps,
        threshold: this.thresholds.fps
      });
    }

    return alerts;
  }

  async triggerOptimizations(alerts) {
    for (const alert of alerts) {
      switch (alert.type) {
        case 'memory':
          // Nettoyer les caches, forcer GC
          this.cleanupMemory();
          break;
        case 'fps':
          // Réduire les animations, optimiser le rendu
          this.optimizeRendering();
          break;
      }
    }
  }

  private cleanupMemory() {
    // Nettoyer les caches obsolètes
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('old-')) {
            caches.delete(name);
          }
        });
      });
    }

    // Forcer le garbage collection si disponible
    if (window.gc) {
      window.gc();
    }
  }

  private optimizeRendering() {
    // Réduire la qualité des animations
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    
    // Suspendre les animations non critiques
    document.querySelectorAll('.non-critical-animation').forEach(el => {
      el.style.animationPlayState = 'paused';
    });
  }
}
```

### 2. Optimisation Adaptative

```typescript
// Adaptations basées sur les capacités du device
class AdaptiveOptimizer {
  private deviceCapabilities = {
    isLowEnd: false,
    connectionType: '4g',
    batteryLevel: 100,
    memoryLimit: Infinity
  };

  async assessDevice() {
    // Détecter les devices low-end
    if ('memory' in performance) {
      const memory = performance.memory;
      this.deviceCapabilities.isLowEnd = memory.jsHeapSizeLimit < 1000000000; // < 1GB
    }

    // Type de connexion
    if ('connection' in navigator) {
      this.deviceCapabilities.connectionType = navigator.connection.effectiveType;
    }

    // Niveau de batterie
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      this.deviceCapabilities.batteryLevel = battery.level * 100;
    }
  }

  applyAdaptiveOptimizations() {
    if (this.deviceCapabilities.isLowEnd) {
      // Réduire la qualité pour les devices low-end
      this.enableLowEndMode();
    }

    if (this.deviceCapabilities.connectionType === 'slow-2g') {
      // Optimisations pour connexions lentes
      this.enableOfflineMode();
    }

    if (this.deviceCapabilities.batteryLevel < 20) {
      // Mode économie d'énergie
      this.enablePowerSaveMode();
    }
  }

  private enableLowEndMode() {
    // Désactiver les animations coûteuses
    document.documentElement.classList.add('low-end-device');
    
    // Réduire la fréquence des mises à jour
    this.reduceUpdateFrequency();
    
    // Limiter le nombre d'éléments affichés
    this.enableVirtualScrolling();
  }

  private enablePowerSaveMode() {
    // Réduire la fréquence des timers
    // Suspendre les tâches non critiques
    // Diminuer la luminosité des éléments
  }
}
```

Le PerformanceOptimizer fournit une solution complète de monitoring et d'optimisation des performances, essentielle pour maintenir une expérience utilisateur fluide et réactive dans CassKai.