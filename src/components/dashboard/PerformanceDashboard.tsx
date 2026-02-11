/**
 * CassKai - Performance Monitoring Dashboard
 *
 * Phase 2 (P1) - Optimisation Performance
 *
 * Fonctionnalités:
 * - Web Vitals en temps réel (LCP, FID, CLS, FCP, TTFB, INP)
 * - Graphiques d'évolution des métriques
 * - Stats de cache (taille, hits, misses)
 * - Resource timing (scripts, images, fonts)
 * - Memory usage
 * - Performance marks/measures
 * - Export rapport JSON
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  performanceMonitor,
  WebVitalsMetric,
  PerformanceReport,
} from '@/lib/performance-monitor';
import { cacheManager } from '@/lib/cache-strategies';
import { getImageLoadingStats } from '@/lib/image-optimizer';
import {
  Activity,
  Zap,
  Image as ImageIcon,
  Database,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Badge de rating Web Vitals
 */
function RatingBadge({ rating }: { rating: 'good' | 'needs-improvement' | 'poor' }) {
  const variants = {
    good: { icon: CheckCircle2, color: 'bg-green-500', text: 'Bon' },
    'needs-improvement': { icon: AlertTriangle, color: 'bg-yellow-500', text: 'À améliorer' },
    poor: { icon: XCircle, color: 'bg-red-500', text: 'Mauvais' },
  };

  const { icon: Icon, color, text } = variants[rating];

  return (
    <Badge className={cn('gap-1', color, 'text-white')}>
      <Icon className="w-3 h-3" />
      {text}
    </Badge>
  );
}

/**
 * Trend indicator
 */
function TrendIndicator({ value, threshold }: { value: number; threshold: number }) {
  if (value < threshold * 0.8) {
    return <TrendingUp className="w-4 h-4 text-green-500" />;
  }
  if (value > threshold * 1.2) {
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  }
  return <Minus className="w-4 h-4 text-yellow-500" />;
}

/**
 * Metric Card
 */
function MetricCard({
  metric,
  threshold,
}: {
  metric: WebVitalsMetric;
  threshold: { good: number; poor: number };
}) {
  const progress = Math.min((metric.value / threshold.poor) * 100, 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{metric.name}</CardTitle>
          <RatingBadge rating={metric.rating} />
        </div>
        <CardDescription className="flex items-center gap-2">
          <TrendIndicator value={metric.value} threshold={threshold.good} />
          {Math.round(metric.value)} ms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0</span>
          <span>{threshold.good}ms (bon)</span>
          <span>{threshold.poor}ms (max)</span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Performance Dashboard Component
 */
export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<WebVitalsMetric[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [imageStats, setImageStats] = useState<any>(null);
  const [memoryUsage, setMemoryUsage] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [report, setReport] = useState<PerformanceReport | null>(null);

  /**
   * Charger les métriques
   */
  const loadMetrics = useCallback(async () => {
    setIsRefreshing(true);

    try {
      // Web Vitals
      const vitals = performanceMonitor.getMetrics();
      setMetrics(vitals);

      // Cache stats
      const cache = await cacheManager.getCacheStats();
      setCacheStats(cache);

      // Image stats
      const images = getImageLoadingStats();
      setImageStats(images);

      // Memory usage
      const memory = performanceMonitor.getMemoryUsage();
      setMemoryUsage(memory);

      // Rapport complet
      const fullReport = performanceMonitor.generateReport();
      setReport(fullReport);
    } catch (error) {
      logger.error('PerformanceDashboard', 'Failed to load performance metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();

    // Auto-refresh toutes les 10 secondes
    const interval = setInterval(loadMetrics, 10000);

    return () => clearInterval(interval);
  }, [loadMetrics]);

  /**
   * Export rapport JSON
   */
  const exportReport = useCallback(() => {
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  /**
   * Seuils Web Vitals
   */
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  /**
   * Données pour graphique d'évolution
   */
  const chartData = metrics.map((m) => ({
    name: m.name,
    value: Math.round(m.value),
    threshold: thresholds[m.name as keyof typeof thresholds]?.good || 0,
  }));

  /**
   * Score Lighthouse estimé
   */
  const lighthouseScore = useCallback(() => {
    if (metrics.length === 0) return 0;

    let score = 100;

    metrics.forEach((metric) => {
      const threshold = thresholds[metric.name as keyof typeof thresholds];
      if (!threshold) return;

      if (metric.rating === 'poor') {
        score -= 20;
      } else if (metric.rating === 'needs-improvement') {
        score -= 10;
      }
    });

    return Math.max(0, score);
  }, [metrics]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Performance Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoring Web Vitals et optimisations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadMetrics} disabled={isRefreshing} variant="outline">
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Lighthouse Score */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Score Lighthouse Estimé
          </CardTitle>
          <CardDescription className="text-white/80">
            Basé sur les Web Vitals actuelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold">{lighthouseScore()}</div>
          <Progress value={lighthouseScore()} className="h-3 mt-4 bg-white/20" />
          <p className="text-sm mt-2 text-white/80">
            {lighthouseScore() >= 90 && 'Excellent ! Performance optimale.'}
            {lighthouseScore() >= 70 && lighthouseScore() < 90 && 'Bon, mais peut être amélioré.'}
            {lighthouseScore() < 70 && 'À améliorer - consultez les métriques ci-dessous.'}
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals">
            <Activity className="w-4 h-4 mr-2" />
            Web Vitals
          </TabsTrigger>
          <TabsTrigger value="cache">
            <Database className="w-4 h-4 mr-2" />
            Cache
          </TabsTrigger>
          <TabsTrigger value="images">
            <ImageIcon className="w-4 h-4 mr-2" />
            Images
          </TabsTrigger>
          <TabsTrigger value="memory">
            <Clock className="w-4 h-4 mr-2" />
            Mémoire
          </TabsTrigger>
        </TabsList>

        {/* Web Vitals Tab */}
        <TabsContent value="vitals" className="space-y-6">
          {metrics.length === 0 ? (
            <Alert>
              <AlertDescription>
                Chargement des métriques... Rafraîchissez la page pour capturer les Web Vitals.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric) => (
                  <MetricCard
                    key={metric.name}
                    metric={metric}
                    threshold={thresholds[metric.name as keyof typeof thresholds]}
                  />
                ))}
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des métriques</CardTitle>
                  <CardDescription>Comparaison avec les seuils recommandés</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                        name="Valeur actuelle"
                      />
                      <Area
                        type="monotone"
                        dataKey="threshold"
                        stroke="#16A34A"
                        fill="#16A34A"
                        fillOpacity={0.1}
                        name="Seuil bon"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-4">
          {cacheStats ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Vue d'ensemble du cache</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total entrées</p>
                      <p className="text-3xl font-bold">{cacheStats.totalEntries}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Taille totale</p>
                      <p className="text-3xl font-bold">
                        {(cacheStats.totalSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cacheStats.caches.map((cache: any) => (
                  <Card key={cache.name}>
                    <CardHeader>
                      <CardTitle className="text-base">{cache.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Entrées</span>
                          <span className="font-semibold">{cache.entries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Taille</span>
                          <span className="font-semibold">
                            {(cache.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Alert>
              <AlertDescription>Chargement des statistiques de cache...</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          {imageStats ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Images chargées</p>
                      <p className="text-3xl font-bold">{imageStats.count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Taille totale</p>
                      <p className="text-3xl font-bold">{imageStats.totalSizeMB} MB</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Durée moyenne</p>
                      <p className="text-3xl font-bold">{imageStats.avgDuration} ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5 plus grosses images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {imageStats.largestImages.map((img: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm truncate flex-1">{img.name}</span>
                        <Badge variant="outline">{img.size}</Badge>
                        <Badge variant="outline" className="ml-2">
                          {img.duration}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertDescription>Aucune image chargée pour le moment.</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="space-y-4">
          {memoryUsage ? (
            <Card>
              <CardHeader>
                <CardTitle>Utilisation mémoire JavaScript</CardTitle>
                <CardDescription>Heap JavaScript (Chrome/Edge uniquement)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Heap utilisé</span>
                      <span className="font-semibold">
                        {(memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Progress
                      value={(memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Heap total</span>
                      <span className="font-semibold">
                        {(memoryUsage.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Progress
                      value={(memoryUsage.totalJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between">
                      <span className="text-sm">Limite heap</span>
                      <span className="font-semibold">
                        {(memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertDescription>
                Les informations mémoire ne sont disponibles que dans Chrome/Edge.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
