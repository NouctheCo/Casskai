/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
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
import { realDashboardKpiService } from '@/services/realDashboardKpiService';
import { aiDashboardAnalysisService } from '@/services/aiDashboardAnalysisService';
import type { RealKPIData } from '@/services/realDashboardKpiService';
import type { AIAnalysisResult } from '@/services/aiDashboardAnalysisService';
import { formatCurrency } from '@/lib/utils';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const RealOperationalDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpiData, setKpiData] = useState<RealKPIData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (currentCompany?.id) {
      loadDashboardData();
    }
  }, [currentCompany?.id]);

  const loadDashboardData = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      // Charger les KPIs réels
      const data = await realDashboardKpiService.calculateRealKPIs(currentCompany.id);
      setKpiData(data);

      // Charger l'analyse IA en parallèle
      loadAIAnalysis(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIAnalysis = async (data: RealKPIData) => {
    if (!currentCompany) return;

    setAiLoading(true);
    try {
      const analysis = await aiDashboardAnalysisService.analyzeKPIs(
        data,
        currentCompany.name,
        currentCompany.industry_type || currentCompany.sector || 'general'
      );
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Error loading AI analysis:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading || !kpiData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const metrics = realDashboardKpiService.generateMetrics(kpiData);
  const charts = realDashboardKpiService.generateCharts(kpiData);

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
                  {(metric.value ?? 0).toLocaleString('fr-FR', {
                    minimumFractionDigits: metric.unit === 'currency' ? 2 : 0,
                    maximumFractionDigits: metric.unit === 'currency' ? 2 : 0,
                  })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
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
                <LineChart data={charts[0].data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(value, 'EUR')
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={charts[0].color}
                    strokeWidth={2}
                    dot={{ fill: charts[0].color, r: 4 }}
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
                <BarChart data={charts[1].data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(value, 'EUR')
                    }
                  />
                  <Bar dataKey="value" fill={charts[1].color} />
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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts[2].data}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.label} (${((entry.value / kpiData.total_purchases) * 100).toFixed(0)}%)`}
                  >
                    {charts[2].data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(value, 'EUR')
                    }
                  />
                  <Legend />
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
