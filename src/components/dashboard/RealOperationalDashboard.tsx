/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { realDashboardKpiService, type RealKPIData } from '@/services/realDashboardKpiService';
import { aiDashboardAnalysisService, type AIAnalysisResult } from '@/services/ai/dashboardService';
import { useKpiRefresh } from '@/hooks/useKpiRefresh';
import { formatCurrency, getCurrentCompanyCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { kpiCacheService } from '@/services/kpiCacheService';
import { offlineDataService } from '@/services/offlineDataService';
import RealtimeDashboardIndicator from '@/components/dashboard/RealtimeDashboardIndicator';
import ThresholdAlert from '@/components/dashboard/ThresholdAlert';
import { RealtimeStatusIndicator } from '@/components/dashboard/RealtimeStatusIndicator';
import { WifiOff } from 'lucide-react';
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Helper to get currency symbol based on company settings
const getCurrencySymbol = () => {
  const currency = getCurrentCompanyCurrency();
  const symbols: Record<string, string> = {
    'EUR': '€',
    'XOF': 'FCFA',
    'XAF': 'FCFA',
    'USD': '$',
    'GBP': '£',
    'CHF': 'CHF',
    'CAD': 'CA$',
    'MAD': 'MAD',
    'TND': 'TND'
  };
  return symbols[currency] || currency;
};

/**
 * Formate les valeurs de l'axe Y de manière compacte et lisible
 * Ex: 1 500 000 → "1,5M", 300 000 → "300k", 1 500 → "1 500"
 */
const formatYAxisTick = (value: number): string => {
  if (value === 0) return '0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    return `${sign}${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const thousands = abs / 1_000;
    return `${sign}${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
  }
  return `${sign}${Math.round(abs).toLocaleString('fr-FR')}`;
};

/**
 * Tooltip personnalisé pour les graphiques du dashboard
 */
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-3">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-sm" style={{ color: entry.color || entry.stroke }}>
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

// Helper to format units correctly
const formatUnit = (unit: string) => {
  switch (unit) {
    case 'currency':
      return getCurrencySymbol();
    case 'percentage':
      return '%';
    case 'days':
      return 'jours';
    case 'number':
      return '';
    default:
      return unit;
  }
};

export const RealOperationalDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<RealKPIData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  const [averageLatency, setAverageLatency] = useState<number | undefined>();
  // Ref pour éviter les rechargements multiples de timers
  const reloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 🎯 OPTIMISATION: Détecter quand l'utilisateur revient sur la page
  usePageVisibility({
    onVisible: () => {
      // Seulement recharger si les données ont une certaine ancienneté
      if (lastUpdate) {
        const ageMs = Date.now() - lastUpdate.getTime();
        const maxAge = 10 * 60 * 1000; // 10 minutes = rechargement recommandé
        if (ageMs > maxAge) {
          handleRefresh();
        }
      }
    },
    reloadDelay: 300,
  });
  // 🎯 OPTIMISATION: Hook pour synchronisation temps réel des KPIs
  const handleCacheInvalidated = useCallback(async () => {
    // Le cache a été invalidé, recharger les KPIs en arrière-plan
    if (currentCompany?.id) {
      try {
        const data = await realDashboardKpiService.calculateRealKPIs(currentCompany.id);
        setKpiData(data);
        setLastUpdate(new Date());
        // Recharger aussi l'analyse IA avec les nouvelles données
        await loadAIAnalysis(data);
      } catch (_error) {
        // swallow errors silently in UI; handled by services
      }
    }
  }, [currentCompany?.id]);
  useKpiRefresh(currentCompany?.id, {
    onCacheInvalidated: handleCacheInvalidated,
    onError: (event) => {
      logger.error('RealOperationalDashboard', '[RealOperationalDashboard] Erreur KPI:', event.message);
    },
    subscribeToRealtime: true,
  });
  const loadDashboardData = useCallback(async () => {
    if (!currentCompany?.id) {
      return;
    }
    setLoading(true);
    try {
      // Charger les KPIs réels
      const data = await realDashboardKpiService.calculateRealKPIs(currentCompany.id);
      setKpiData(data);
      setLastUpdate(new Date());
      // Charger l'analyse IA en parallèle
      loadAIAnalysis(data);
    } catch (_error) {
      // Fallback : tenter le cache Dexie si l'appel réseau échoue
      try {
        const cached = await kpiCacheService.getCacheWithDexieFallback(currentCompany.id);
        if (cached?.data) {
          setKpiData(cached.data as RealKPIData);
          setLastUpdate(new Date());
        }
      } catch {
        // Silencieux
      }
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);
  const loadAIAnalysis = async (data: RealKPIData) => {
    if (!currentCompany) return;
    setAiLoading(true);
    try {
      const analysis = await aiDashboardAnalysisService.analyzeKPIs(
        data,
        currentCompany.name,
        currentCompany.industry_type || currentCompany.sector || 'general',
        currentCompany.id
      );
      setAiAnalysis(analysis);
    } catch (error) {
      logger.error('RealOperationalDashboard', 'Error loading AI analysis:', error);
    } finally {
      setAiLoading(false);
    }
  };
  // 🎯 OPTIMISATION: Initialisation unique au changement de compagnie
  useEffect(() => {
    // Cleanup des timers précédents
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }
    // Charger les données pour la compagnie actuelle
    // Note: Ne pas utiliser hasInitializedRef car cela empêche le rechargement
    // quand l'utilisateur arrive pour la première fois ou change de compagnie
    if (currentCompany?.id) {
      loadDashboardData();
    } else {
      // no company available; skip initial load
    }
    return () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
      }
    };
     
  }, [currentCompany?.id]);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const startTime = performance.now();

    try {
      // Invalider le cache avant de recharger
      if (currentCompany?.id) {
        kpiCacheService.invalidateCache(currentCompany.id);
      }
      await loadDashboardData();

      // Mesurer latence
      const latency = Math.round(performance.now() - startTime);
      setAverageLatency(latency);

      // Incrémenter compteur
      setRefreshCount(prev => prev + 1);
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboardData, currentCompany?.id]);

  const handleToggleRealtime = useCallback((enabled: boolean) => {
    setIsRealtimeEnabled(enabled);
    logger.info('RealOperationalDashboard', `Temps réel ${enabled ? 'activé' : 'désactivé'}`);
  }, []);
  if (loading || !kpiData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  const metrics = realDashboardKpiService.generateMetrics(kpiData, t);
  const charts = realDashboardKpiService.generateCharts(kpiData, t);
  const expenseTotal = charts[2]?.data?.reduce((sum, item) => sum + ((item as { value: number }).value || 0), 0) || 0;
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.operational.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.operational.subtitle')}</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {t('common.refresh')}
        </Button>
      </div>

      {/* 🎯 Indicateur Temps Réel (Nouveau composant amélioré) */}
      <RealtimeStatusIndicator
        lastUpdate={lastUpdate}
        isRefreshing={refreshing}
        refreshCount={refreshCount}
        onRefresh={handleRefresh}
        isRealtimeEnabled={isRealtimeEnabled}
        onToggleRealtime={handleToggleRealtime}
        isConnected={true}
        averageLatency={averageLatency}
        compact={false}
      />

      {/* Indicateur mode offline */}
      {!navigator.onLine && lastUpdate && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700 dark:text-orange-300 text-sm">
            {t('dashboard.offlineData', {
              defaultValue: 'Donnees hors ligne',
            })}
            {' — '}
            {t('dashboard.lastSynced', {
              defaultValue: 'Derniere mise a jour',
            })}
            {': '}
            {lastUpdate.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      {/* 🚨 Alertes visuelles sur seuils critiques */}
      <ThresholdAlert kpiData={kpiData} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
                {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {metric.unit === 'currency'
                    ? formatCurrency(Number(metric.value ?? 0))
                    : (
                      <>
                        {Number(metric.value ?? 0).toLocaleString('fr-FR', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: metric.unit === 'percentage' ? 1 : 0,
                        })}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {formatUnit(metric.unit || '')}
                        </span>
                      </>
                    )
                  }
                </div>
                {metric.change !== undefined && metric.period && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge
                      variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
                      {metric.change.toFixed(1)}%
                    </Badge>
                    <span className="text-muted-foreground">{metric.period}</span>
                  </div>
                )}
                {metric.importance === 'high' && (
                  <div
                    className={`absolute top-0 right-0 w-2 h-full ${
                      metric.trend === 'up'
                        ? 'bg-green-500'
                        : metric.trend === 'down'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        {charts[0] && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {charts[0].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts[0].data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatYAxisTick}
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    width={65}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={charts[0].color}
                    strokeWidth={2}
                    dot={{ fill: charts[0].color, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {/* Top Clients Chart */}
        {charts[1] && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {charts[1].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={charts[1].data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="label"
                    angle={-35}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={formatYAxisTick}
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    width={65}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="value" fill={charts[1].color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {/* Expense Breakdown Chart */}
        {charts[2] && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {charts[2].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={charts[2].data}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    innerRadius={40}
                    paddingAngle={2}
                    label={(entry) => {
                      const total = expenseTotal;
                      const percent = total > 0 ? (entry.value / total) * 100 : 0;
                      return `${percent.toFixed(0)}%`;
                    }}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {charts[2].data.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0];
                      const percent = expenseTotal > 0 ? ((data.value / expenseTotal) * 100).toFixed(1) : '0';
                      return (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{data.name}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{formatCurrency(data.value)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{percent}% du total</p>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-gray-700 dark:text-gray-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
      {/* AI Analysis Section */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {t('dashboard.aiAnalysis.title')}
              {aiDashboardAnalysisService.isConfigured() && (
                <Badge variant="default" className="ml-2">
                  {t('dashboard.aiAnalysis.powered')}
                </Badge>
              )}
            </CardTitle>
            {!aiDashboardAnalysisService.isConfigured() && (
              <Badge variant="secondary">{t('dashboard.aiAnalysis.fallback')}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {aiLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-6">
              {/* Executive Summary */}
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-base">
                  {aiAnalysis.executive_summary}
                </AlertDescription>
              </Alert>
              {/* Key Insights */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t('dashboard.aiAnalysis.keyInsights')}
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.key_insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Strategic Recommendations */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {t('dashboard.aiAnalysis.recommendations')}
                </h3>
                <ul className="space-y-2">
                  {aiAnalysis.strategic_recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Risk Factors */}
              {aiAnalysis.risk_factors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-4 h-4" />
                    {t('dashboard.aiAnalysis.risks')}
                  </h3>
                  <ul className="space-y-2">
                    {aiAnalysis.risk_factors.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Action Items */}
              <div>
                <h3 className="font-semibold mb-3">{t('dashboard.aiAnalysis.actions')}</h3>
                <div className="space-y-3">
                  {aiAnalysis.action_items.map((item, index) => (
                    <Card key={index} className={`
                      ${item.priority === 'high' ? 'border-red-200 bg-red-50/50' : ''}
                      ${item.priority === 'medium' ? 'border-orange-200 bg-orange-50/50' : ''}
                      ${item.priority === 'low' ? 'border-blue-200 bg-blue-50/50' : ''}
                    `}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Badge
                            variant={
                              item.priority === 'high'
                                ? 'destructive'
                                : item.priority === 'medium'
                                ? 'default'
                                : 'secondary'
                            }
                            className="mt-0.5"
                          >
                            {item.priority === 'high' && t('dashboard.aiAnalysis.priority.high')}
                            {item.priority === 'medium' && t('dashboard.aiAnalysis.priority.medium')}
                            {item.priority === 'low' && t('dashboard.aiAnalysis.priority.low')}
                          </Badge>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{item.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('dashboard.aiAnalysis.expectedImpact')}: {item.expected_impact}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t('dashboard.aiAnalysis.noData')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};