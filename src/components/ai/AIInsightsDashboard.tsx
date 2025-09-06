import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  // TrendingDown,
  AlertTriangle,
  // Lightbulb,
  Target,
  DollarSign,
  Shield,
  // Zap,
  MessageCircle,
  RefreshCw,
  Settings,
  Eye
  // BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
// import { Badge } from '../ui/badge';
// import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
// import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../lib/utils';
import { aiAnalyticsService } from '../../services/aiAnalyticsService';
import { aiAssistantService } from '../../services/aiAssistantService';
import { aiVisualizationService } from '../../services/aiVisualizationService';
import {
  Transaction,
  AnomalyDetection,
  FinancialHealthScore,
  SmartAlert,
  CashFlowPrediction,
  // CategoryPrediction,
  TaxOptimization
} from '../../types/ai-types';
import { AnomalyDetectionWidget } from './widgets/AnomalyDetectionWidget';
import { HealthScoreWidget } from './widgets/HealthScoreWidget';
import { CashFlowPredictionWidget } from './widgets/CashFlowPredictionWidget';
import { AIAssistantChat } from './widgets/AIAssistantChat';
import { SmartAlertsWidget } from './widgets/SmartAlertsWidget';
import { TaxOptimizationWidget } from './widgets/TaxOptimizationWidget';

interface AIInsightsDashboardProps {
  transactions: Transaction[];
  currentBalance: number;
  onTransactionUpdate?: (transactions: Transaction[]) => void;
  className?: string;
}

export const AIInsightsDashboard: React.FC<AIInsightsDashboardProps> = ({
  transactions,
  currentBalance,
  onTransactionUpdate: _onTransactionUpdate,
  className
}) => {
  // États pour les analyses IA
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [cashFlowPredictions, setCashFlowPredictions] = useState<CashFlowPrediction[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [taxOptimizations, setTaxOptimizations] = useState<TaxOptimization[]>([]);
  
  // États UI
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [aiConfig, setAiConfig] = useState({
    anomalyDetection: true,
    healthScoring: true,
    cashFlowPrediction: true,
    taxOptimization: true,
    smartAlerts: true
  });

  // Initialisation des services IA
  useEffect(() => {
    initializeAI();
  }, []);

  // Analyse automatique des transactions
  useEffect(() => {
    if (transactions.length > 0) {
      runAnalysis();
    }
  }, [transactions, aiConfig]);

  const initializeAI = async () => {
    try {
      setIsLoading(true);
      
      // Initialisation des services
      await aiAnalyticsService.initialize();
      await aiAssistantService.initialize();
      aiVisualizationService.initialize();
      
      console.warn('AI services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!aiAnalyticsService.initialized) return;
    
    try {
      setIsLoading(true);
      const results = await Promise.allSettled([
        // Détection d'anomalies
        aiConfig.anomalyDetection ? aiAnalyticsService.detectAnomalies(transactions) : Promise.resolve({ success: true, data: [] }),
        
        // Score de santé financière
        aiConfig.healthScoring ? aiAnalyticsService.calculateHealthScore(transactions, [currentBalance]) : Promise.resolve({ success: true, data: null }),
        
        // Prédiction de trésorerie
        aiConfig.cashFlowPrediction ? aiAnalyticsService.predictCashFlow(
          transactions.map(t => ({ date: new Date(t.date), value: t.amount }))
        ) : Promise.resolve({ success: true, data: [] }),
        
        // Optimisations fiscales
        aiConfig.taxOptimization ? aiAssistantService.generateTaxOptimizations(transactions) : Promise.resolve({ success: true, data: [] })
      ]);

      // Traitement des résultats
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          switch (index) {
            case 0:
              setAnomalies(result.value.data || []);
              break;
            case 1:
              setHealthScore(result.value.data);
              break;
            case 2:
              setCashFlowPredictions(result.value.data || []);
              break;
            case 3:
              setTaxOptimizations(result.value.data || []);
              break;
          }
        }
      });

      // Génération d'alertes intelligentes
      generateSmartAlerts();
      
      setLastAnalysis(new Date());

    } catch (error) {
      console.error('Error running AI analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSmartAlerts = () => {
    const alerts: SmartAlert[] = [];
    
    // Alertes basées sur les anomalies
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'anomaly',
        severity: 'critical',
        title: 'Anomalies critiques détectées',
        message: `${criticalAnomalies.length} transactions suspectes identifiées`,
        data: { anomalies: criticalAnomalies },
        timestamp: new Date(),
        isRead: false
      });
    }

    // Alertes de santé financière
    if (healthScore && healthScore.overall < 40) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'risk',
        severity: 'warning',
        title: 'Santé financière préoccupante',
        message: `Score global de ${healthScore.overall}/100. Actions recommandées.`,
        data: { healthScore },
        timestamp: new Date(),
        isRead: false
      });
    }

    // Alertes d'opportunités fiscales
    const highValueOptimizations = taxOptimizations.filter(opt => opt.potentialSavings > 1000);
    if (highValueOptimizations.length > 0) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'opportunity',
        severity: 'info',
        title: 'Opportunités d\'optimisation fiscale',
        message: `Économies potentielles de ${highValueOptimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0).toLocaleString('fr-FR')}€`,
        data: { optimizations: highValueOptimizations },
        timestamp: new Date(),
        isRead: false
      });
    }

    setSmartAlerts(alerts);
  };

  const handleRefreshAnalysis = () => {
    runAnalysis();
  };

  const _handleConfigUpdate = (newConfig: typeof aiConfig) => {
    setAiConfig(newConfig);
  };

  if (isLoading && !lastAnalysis) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-12 h-12 text-blue-500 mx-auto" />
            </motion.div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Initialisation de l'IA financière</p>
              <p className="text-sm text-gray-500">Analyse des données en cours...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec statistiques rapides */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Intelligence Artificielle Financière</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Dernière analyse: {lastAnalysis?.toLocaleTimeString('fr-FR') || 'En cours...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshAnalysis}
                disabled={isLoading}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                Actualiser
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* KPIs rapides de l'IA */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div 
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <Shield className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Score santé</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {healthScore?.overall || 0}/100
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Anomalies</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {anomalies.length}
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prédictions</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {cashFlowPredictions.length}j
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <DollarSign className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Économies pot.</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {taxOptimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0).toLocaleString('fr-FR')}€
                </p>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes intelligentes */}
      {smartAlerts.length > 0 && (
        <SmartAlertsWidget 
          alerts={smartAlerts}
          onAlertAction={(alertId, action) => {
            console.warn('Alert action:', alertId, action);
          }}
          onDismissAlert={(alertId) => {
            setSmartAlerts(alerts => alerts.filter(a => a.id !== alertId));
          }}
        />
      )}

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Anomalies</span>
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Prédictions</span>
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Optimisation</span>
          </TabsTrigger>
          <TabsTrigger value="assistant" className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Assistant</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HealthScoreWidget 
                  healthScore={healthScore}
                  isLoading={isLoading}
                  onRefresh={() => runAnalysis()}
                />
                
                <CashFlowPredictionWidget 
                  predictions={cashFlowPredictions}
                  currentBalance={currentBalance}
                  isLoading={isLoading}
                />
              </div>
            </TabsContent>

            <TabsContent value="anomalies" className="space-y-6 mt-6">
              <AnomalyDetectionWidget 
                anomalies={anomalies}
                onAnomalyAction={(anomalyId, action) => {
                  console.warn('Anomaly action:', anomalyId, action);
                }}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="predictions" className="space-y-6 mt-6">
              <div className="space-y-6">
                <CashFlowPredictionWidget 
                  predictions={cashFlowPredictions}
                  currentBalance={currentBalance}
                  isLoading={isLoading}
                  detailed={true}
                />
                
                {/* Ici on pourrait ajouter d'autres prédictions */}
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6 mt-6">
              <TaxOptimizationWidget 
                optimizations={taxOptimizations}
                onOptimizationAction={(optimizationId, action) => {
                  console.warn('Optimization action:', optimizationId, action);
                }}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="assistant" className="space-y-6 mt-6">
              <AIAssistantChat 
                transactions={transactions}
                currentBalance={currentBalance}
                onQueryProcessed={(query, response) => {
                  console.warn('AI query processed:', query, response);
                }}
              />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};