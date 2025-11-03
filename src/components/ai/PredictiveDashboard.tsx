import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Calendar,
  Target,
  Brain,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  CheckCircle,
  Clock
} from 'lucide-react';
import { openAIService } from '@/services/ai/OpenAIService';
import { AIInsight, CashFlowPrediction, SmartAlert, TaxOptimization } from '@/types/ai.types';

interface PredictiveDashboardProps {
  companyId: string;
  className?: string;
}

interface DashboardMetrics {
  financialHealth: number;
  cashFlowTrend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  predictedGrowth: number;
  aiConfidence: number;
}

export const PredictiveDashboard: React.FC<PredictiveDashboardProps> = ({
  companyId,
  className = ''
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<CashFlowPrediction[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [taxOptimizations, setTaxOptimizations] = useState<TaxOptimization[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAIData();
  }, [companyId]);

  const loadAIData = async () => {
    setIsLoading(true);

    try {
      const [insightsResult, predictionsResult, alertsResult, taxResult] = await Promise.all([
        openAIService.analyzeFinancialHealth(companyId),
        openAIService.predictCashFlow(companyId, 6),
        openAIService.generateSmartAlerts(companyId),
        openAIService.getTaxOptimizations(companyId)
      ]);

      if (insightsResult.success) {
        setInsights(insightsResult.data || []);
      }

      if (predictionsResult.success) {
        setPredictions(predictionsResult.data || []);
      }

      if (alertsResult.success) {
        setAlerts(alertsResult.data || []);
      }

      if (taxResult.success) {
        setTaxOptimizations(taxResult.data || []);
      }

      // Calculer les métriques globales
      calculateMetrics(insightsResult.data, predictionsResult.data, alertsResult.data);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error loading AI data:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (insights: AIInsight[] = [], predictions: CashFlowPrediction[] = [], alerts: SmartAlert[] = []) => {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'error');
    const riskLevel: 'low' | 'medium' | 'high' =
      criticalAlerts.length > 2 ? 'high' :
      criticalAlerts.length > 0 ? 'medium' : 'low';

    const positiveTrends = predictions.filter(p => p.trend === 'up').length;
    const negativeTrends = predictions.filter(p => p.trend === 'down').length;

    const cashFlowTrend: 'up' | 'down' | 'stable' =
      positiveTrends > negativeTrends ? 'up' :
      negativeTrends > positiveTrends ? 'down' : 'stable';

    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length || 0;

    const healthScore = Math.max(0, 100 - (criticalAlerts.length * 15) - (negativeTrends * 10));

    setMetrics({
      financialHealth: healthScore,
      cashFlowTrend,
      riskLevel,
      predictedGrowth: predictions.length > 0 ? predictions[predictions.length - 1]?.predictedValue || 0 : 0,
      aiConfidence: avgConfidence * 100
    });
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec métriques principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Tableau de Bord Prédictif IA</h2>
              <p className="text-blue-100">Analyse intelligente de votre entreprise</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{metrics?.aiConfidence.toFixed(0)}%</div>
            <div className="text-sm text-blue-100">Confiance IA</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Santé Financière</p>
                <p className="text-2xl font-bold">{metrics?.financialHealth}%</p>
              </div>
              <Activity className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Tendance Trésorerie</p>
                <div className="flex items-center gap-2">
                  {metrics?.cashFlowTrend === 'up' ? (
                    <TrendingUp className="w-6 h-6 text-green-300" />
                  ) : metrics?.cashFlowTrend === 'down' ? (
                    <TrendingDown className="w-6 h-6 text-red-300" />
                  ) : (
                    <div className="w-6 h-6 bg-yellow-300 rounded-full" />
                  )}
                  <span className="font-bold capitalize">{metrics?.cashFlowTrend}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Niveau de Risque</p>
                <p className="text-2xl font-bold capitalize">{metrics?.riskLevel}</p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${
                metrics?.riskLevel === 'high' ? 'text-red-300' :
                metrics?.riskLevel === 'medium' ? 'text-yellow-300' :
                'text-green-300'
              }`} />
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Alertes Actives</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-300" />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alertes Intelligentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border"
        >
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">Alertes Intelligentes</h3>
              <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {alerts.length}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p>Aucune alerte active</p>
                <p className="text-sm">Tout semble en ordre !</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'error' ? 'border-red-400 bg-red-50' :
                    alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{alert.title}</h4>
                      <p className="text-xs text-gray-600 mb-2">{alert.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleDateString('fr-FR')}
                        </span>
                        {alert.actions && alert.actions.length > 0 && (
                          <button className="text-xs bg-white px-2 py-1 rounded border hover:bg-gray-50">
                            {alert.actions[0].label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Prédictions Cash-Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border"
        >
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Prédictions Trésorerie</h3>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {predictions.slice(0, 6).map((prediction) => (
              <motion.div
                key={prediction.id}
                whileHover={{ scale: 1.02 }}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{prediction.month}</span>
                  <div className="flex items-center gap-1">
                    {prediction.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : prediction.trend === 'down' ? (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <div className="w-4 h-4 bg-gray-400 rounded-full" />
                    )}
                    <span className="text-xs text-gray-500">
                      {(prediction.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Revenus prévus</span>
                    <span className="font-medium">
                      {prediction.predictedIncome.toLocaleString()}€
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Dépenses prévues</span>
                    <span className="font-medium">
                      {prediction.predictedExpenses.toLocaleString()}€
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                    <span>Solde prévu</span>
                    <span className={prediction.predictedBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {prediction.predictedBalance.toLocaleString()}€
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recommandations & Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border"
        >
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Recommandations IA</h3>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {/* Insights */}
            {insights.slice(0, 3).map((insight) => (
              <motion.div
                key={insight.id}
                whileHover={{ scale: 1.02 }}
                className={`p-3 rounded-lg border ${
                  insight.priority === 'high' ? 'border-red-200 bg-red-50' :
                  insight.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                    insight.type === 'alert' ? 'bg-red-500' :
                    insight.type === 'recommendation' ? 'bg-blue-500' :
                    'bg-purple-500'
                  }`}>
                    {insight.type === 'alert' ? (
                      <AlertTriangle className="w-3 h-3 text-white" />
                    ) : insight.type === 'recommendation' ? (
                      <Target className="w-3 h-3 text-white" />
                    ) : (
                      <Brain className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-white px-2 py-0.5 rounded border">
                        {insight.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(insight.confidence * 100).toFixed(0)}% confiance
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Optimisations fiscales */}
            {taxOptimizations.slice(0, 2).map((tax) => (
              <motion.div
                key={tax.id}
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg border border-green-200 bg-green-50"
              >
                <div className="flex items-start gap-2">
                  <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{tax.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{tax.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-green-700">
                        Économie: {tax.potentialSavings.toLocaleString()}€
                      </span>
                      <span className="text-xs bg-white px-2 py-0.5 rounded border">
                        {tax.category}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {insights.length === 0 && taxOptimizations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Analyse en cours...</p>
                <p className="text-sm">Les recommandations arrivent bientôt</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <button
          onClick={loadAIData}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg"
        >
          <Brain className="w-5 h-5" />
          Actualiser l'analyse IA
        </button>
      </motion.div>
    </div>
  );
};