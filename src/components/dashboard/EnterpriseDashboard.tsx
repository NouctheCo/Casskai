// Dashboard Enterprise Exceptionnel pour CassKai
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence as _AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ReferenceLine as _ReferenceLine
} from 'recharts';
import {
  TrendingUp, TrendingDown as _TrendingDown, DollarSign, Users, Target, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Zap as _Zap, Eye, RefreshCw, Download, Filter as _Filter,
  Calendar as _Calendar, BarChart3, PieChart as _PieChartIcon, Activity, Sparkles,
  Shield, Gauge as _Gauge, Clock, AlertCircle, CheckCircle2,
  Building, CreditCard, Banknote, Receipt, Package, UserCheck, Settings as _Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from '@/components/ui/tabs';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { enterpriseDashboardService } from '@/services/enterpriseDashboardService';
import type {
  EnterpriseDashboardData,
  DashboardMetric,
  DashboardChart,
  DashboardFilter,
  FinancialHealthScore,
  RealTimeUpdate
} from '@/types/enterprise-dashboard.types';
import { AIAssistantChat } from '../ai/AIAssistantChat';

// Composant KPI Card Enterprise
const EnterpriseKPICard: React.FC<{
  metric: DashboardMetric;
  isLoading?: boolean;
}> = ({ metric, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = React.createElement(
    // Mapping des icônes depuis les strings
    {
      DollarSign, Users, Target, AlertTriangle, TrendingUp, CreditCard,
      Banknote, Receipt, Package, UserCheck, Building, Activity
    }[metric.icon] || TrendingUp
  );

  const isPositiveTrend = metric.trend_percentage > 0;
  const trendColor = isPositiveTrend ? 'text-green-600' : 'text-red-600';
  const trendBgColor = isPositiveTrend ? 'bg-green-50' : 'bg-red-50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
        {/* Indicateur de couleur */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-600`} />

        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {metric.title}
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof metric.current_value === 'number' && metric.unit === 'currency'
                    ? new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(metric.current_value)
                    : typeof metric.current_value === 'number' && metric.unit === 'percentage'
                    ? `${metric.current_value.toFixed(1)}%`
                    : typeof metric.current_value === 'number'
                    ? metric.current_value.toLocaleString('fr-FR')
                    : metric.current_value
                  }
                </span>
                {metric.target_value && (
                  <span className="text-xs text-gray-500">
                    / {metric.target_value.toLocaleString('fr-FR')}
                  </span>
                )}
              </div>
            </div>

            <div className={`p-3 rounded-xl bg-gradient-to-br from-${metric.color}-500 to-${metric.color}-600 shadow-lg`}>
              {IconComponent}
            </div>
          </div>

          {/* Comparaisons et tendances */}
          <div className="space-y-3">
            {/* Tendance vs période précédente */}
            {metric.trend_percentage !== undefined && (
              <div className={`flex items-center space-x-2 p-2 rounded-lg ${trendBgColor}`}>
                {isPositiveTrend ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${trendColor}`}>
                  {Math.abs(metric.trend_percentage).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-600">vs période précédente</span>
              </div>
            )}

            {/* Comparaison budget */}
            {metric.vs_budget_percentage !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">vs Budget:</span>
                <span className={`font-medium ${
                  metric.vs_budget_percentage > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.vs_budget_percentage > 0 ? '+' : ''}{metric.vs_budget_percentage.toFixed(1)}%
                </span>
              </div>
            )}

            {/* Barre de progression vs objectif */}
            {metric.target_value && typeof metric.current_value === 'number' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Objectif</span>
                  <span className="font-medium">
                    {Math.round((metric.current_value / metric.target_value) * 100)}%
                  </span>
                </div>
                <Progress
                  value={Math.min((metric.current_value / metric.target_value) * 100, 100)}
                  className="h-2"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Composant Graphique Enterprise
const EnterpriseChart: React.FC<{
  chart: DashboardChart;
  isLoading?: boolean;
}> = ({ chart, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: chart.data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (chart.type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`gradient-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
              tickFormatter={(value) => new Intl.NumberFormat('fr-FR', {
                notation: 'compact',
                compactDisplay: 'short'
              }).format(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
              labelStyle={{ color: '#F9FAFB' }}
              formatter={(value: number, name: string) => [
                new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(value),
                name === 'current_year' ? 'Année actuelle' :
                name === 'previous_year' ? 'Année précédente' :
                name === 'budget' ? 'Budget' : name
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="current_year"
              stroke="#3B82F6"
              fill={`url(#gradient-${chart.id})`}
              strokeWidth={3}
              name="Année actuelle"
            />
            {chart.comparison_enabled && (
              <>
                <Area
                  type="monotone"
                  dataKey="previous_year"
                  stroke="#10B981"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Année précédente"
                />
                <Area
                  type="monotone"
                  dataKey="budget"
                  stroke="#F59E0B"
                  fill="transparent"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  name="Budget"
                />
              </>
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6B7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Legend />
            <Bar
              dataKey="current_year"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              name="Année actuelle"
            />
            {chart.comparison_enabled && (
              <Bar
                dataKey="previous_year"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                name="Année précédente"
              />
            )}
          </BarChart>
        );

      case 'pie': {
        const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'];
        return (
          <PieChart>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={60}
              paddingAngle={2}
              dataKey="current_year"
            >
              {chart.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(value),
                'Montant'
              ]}
            />
            <Legend />
          </PieChart>
        );
      }

      case 'combo':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6B7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Legend />
            <Bar dataKey="current_year" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="budget"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        );

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#6B7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: 'white'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="current_year"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="col-span-2 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {chart.title}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Période: {chart.period} • {chart.comparison_enabled ? 'Comparaisons activées' : 'Vue simple'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {chart.drill_down_available && (
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Métriques du graphique */}
          {chart.metrics ? (
            <div className="grid grid-cols-4 gap-4 mt-4 p-4 bg-gray-50/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Intl.NumberFormat('fr-FR', {
                    notation: 'compact',
                    compactDisplay: 'short'
                  }).format(chart.metrics.total || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Croissance</p>
                <p className={`text-lg font-bold ${
                  (chart.metrics.growth_rate || 0) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(chart.metrics.growth_rate || 0) > 0 ? '+' : ''}{(chart.metrics.growth_rate || 0).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">vs Budget</p>
                <p className={`text-lg font-bold ${
                  (chart.metrics.vs_budget || 0) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(chart.metrics.vs_budget || 0) > 0 ? '+' : ''}{(chart.metrics.vs_budget || 0).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">vs N-1</p>
                <p className={`text-lg font-bold ${
                  (chart.metrics.vs_previous_year || 0) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(chart.metrics.vs_previous_year || 0) > 0 ? '+' : ''}{(chart.metrics.vs_previous_year || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-gray-50/50 rounded-lg">
              <p className="text-center text-gray-500">Données des métriques en cours de chargement...</p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Composant Santé Financière
const FinancialHealthCard: React.FC<{
  healthScore: FinancialHealthScore;
  isLoading?: boolean;
}> = ({ healthScore, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <span>Santé Financière</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Score global basé sur 6 critères
              </p>
            </div>
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full ${getScoreColor(healthScore.overall_score)}`}>
                {getScoreIcon(healthScore.overall_score)}
                <span className="ml-2 font-bold text-2xl">
                  {healthScore.overall_score}/100
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Scores détaillés */}
          <div className="space-y-3">
            {[
              { label: 'Liquidité', score: healthScore.liquidity_score },
              { label: 'Rentabilité', score: healthScore.profitability_score },
              { label: 'Efficacité', score: healthScore.efficiency_score },
              { label: 'Croissance', score: healthScore.growth_score },
              { label: 'Risque', score: healthScore.risk_score },
              { label: 'Durabilité', score: healthScore.sustainability_score }
            ].map(({ label, score }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        score >= 80 ? 'bg-green-500' :
                        score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{score}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recommandations */}
          {healthScore.recommendations.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                Recommandations prioritaires
              </h4>
              {healthScore.recommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm font-medium text-blue-900">{rec.title}</p>
                  <p className="text-xs text-blue-700 mt-1">{rec.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                      {rec.priority}
                    </Badge>
                    <span className="text-xs text-blue-600">{rec.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alertes critiques */}
          {healthScore.critical_alerts.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-red-900 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                Alertes critiques
              </h4>
              {healthScore.critical_alerts.map((alert, index) => (
                <div key={index} className="p-2 bg-red-50 rounded-lg border-l-4 border-red-400">
                  <p className="text-sm text-red-800">{alert}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Composant principal du Dashboard Enterprise
export const EnterpriseDashboard: React.FC = () => {
  const { currentEnterprise } = useEnterprise();
  const [dashboardData, setDashboardData] = useState<EnterpriseDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DashboardFilter>({
    period: '30d',
    comparison: 'previous_period',
    show_forecasts: true,
    show_benchmarks: false,
    currency: 'EUR'
  });

  // Chargement des données
  const loadDashboardData = useCallback(async () => {
    if (!currentEnterprise?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await enterpriseDashboardService.getDashboardData(
        currentEnterprise.id,
        filter
      );

      if (error) {
        throw new Error(error.message || 'Erreur lors du chargement des données');
      }

      setDashboardData(data);
    } catch (err) {
      console.error('...', error);
      setError(err instanceof Error ? (error as Error).message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [currentEnterprise?.id, filter]);

  // Chargement initial et abonnement aux mises à jour temps réel
  useEffect(() => {
    loadDashboardData();

    if (currentEnterprise?.id) {
      // Abonnement aux mises à jour temps réel
      const unsubscribe = enterpriseDashboardService.subscribeToRealTimeUpdates(
        currentEnterprise.id,
        (update: RealTimeUpdate) => {
          console.warn('Real-time update received:', update);
          // Recharger les données ou mettre à jour spécifiquement
          if (update.type === 'data_refresh') {
            loadDashboardData();
          }
        }
      );

      // Auto-refresh toutes les 30 secondes
      const refreshInterval = setInterval(() => {
        loadDashboardData();
      }, 30000);

      return () => {
        unsubscribe();
        clearInterval(refreshInterval);
      };
    }
  }, [loadDashboardData, currentEnterprise?.id]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* En-tête du dashboard */}
      <motion.div
        className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard Enterprise
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentEnterprise?.name} - Vue d'ensemble complète et temps réel
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Temps réel
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Dernière MàJ: {dashboardData ? new Date(dashboardData.generated_at).toLocaleTimeString('fr-FR') : '--:--'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Select
            value={filter.period}
            onValueChange={(value) => setFilter(prev => ({ ...prev, period: value as DashboardFilter['period'] }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
              <SelectItem value="ytd">Année en cours</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.comparison}
            onValueChange={(value) => setFilter(prev => ({ ...prev, comparison: value as DashboardFilter['comparison'] }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune comparaison</SelectItem>
              <SelectItem value="previous_period">Période précédente</SelectItem>
              <SelectItem value="previous_year">Année précédente</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="all">Toutes</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </motion.div>

      {/* Résumé exécutif */}
      {dashboardData?.executive_summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <h3 className="text-sm font-medium opacity-90 mb-1">CA Année</h3>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR',
                      notation: 'compact'
                    }).format(dashboardData.executive_summary.revenue_ytd)}
                  </p>
                  <p className="text-sm opacity-75">
                    {dashboardData.executive_summary.revenue_growth > 0 ? '+' : ''}
                    {dashboardData.executive_summary.revenue_growth.toFixed(1)}% vs N-1
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium opacity-90 mb-1">Marge</h3>
                  <p className="text-2xl font-bold">
                    {dashboardData.executive_summary.profit_margin.toFixed(1)}%
                  </p>
                  <p className="text-sm opacity-75">Marge nette</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium opacity-90 mb-1">Trésorerie</h3>
                  <p className="text-2xl font-bold">
                    {dashboardData.executive_summary.cash_runway_days} jours
                  </p>
                  <p className="text-sm opacity-75">Autonomie</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium opacity-90 mb-1">Position</h3>
                  <p className="text-lg font-bold">
                    {dashboardData.executive_summary.market_position}
                  </p>
                  <p className="text-sm opacity-75">
                    Satisfaction: {dashboardData.executive_summary.customer_satisfaction.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Métriques clés */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, staggerChildren: 0.1 }}
      >
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <EnterpriseKPICard key={i} metric={{} as DashboardMetric} isLoading={true} />
          ))
        ) : (
          dashboardData?.key_metrics?.map((metric) => (
            <EnterpriseKPICard key={metric.id} metric={metric} />
          ))
        )}
      </motion.div>

      {/* Graphiques et Santé Financière */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Graphiques */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <EnterpriseChart key={i} chart={{} as DashboardChart} isLoading={true} />
            ))
          ) : (
            dashboardData?.charts?.map((chart) => (
              <EnterpriseChart key={chart.id} chart={chart} />
            ))
          )}
        </div>

        {/* Santé Financière */}
        <div className="space-y-6">
          <FinancialHealthCard
            healthScore={dashboardData?.financial_health || {} as FinancialHealthScore}
            isLoading={isLoading}
          />

          {/* Alertes */}
          {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span>Alertes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData.alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.type === 'critical' ? 'bg-red-50 border-red-400' :
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                        alert.type === 'info' ? 'bg-blue-50 border-blue-400' :
                        'bg-green-50 border-green-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                        </div>
                        {alert.action_required && (
                          <Button variant="ghost" size="sm" className="ml-2">
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Assistant IA */}
      <div className="mt-8">
        <AIAssistantChat
          companyId={currentEnterprise?.id || ''}
          contextType="dashboard"
        />
      </div>
    </div>
  );
};
