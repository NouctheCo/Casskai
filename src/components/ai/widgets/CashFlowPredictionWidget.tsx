import React, { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import {

  TrendingUp,

  TrendingDown,

  BarChart3,

  Calendar,

  DollarSign,

  Target,

  AlertTriangle,

  CheckCircle,

  Info,

  Settings,

  RefreshCw

} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

import { Badge } from '../../ui/badge';

import { Button } from '../../ui/button';

import { Progress } from '../../ui/progress';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

import { cn, getCurrentCompanyCurrency } from '../../../lib/utils';

import { CashFlowPrediction } from '../../../types/ai.types';



interface CashFlowPredictionWidgetProps {

  predictions: CashFlowPrediction[];

  currentBalance: number;

  isLoading?: boolean;

  detailed?: boolean;

  onRefresh?: () => void;

  onConfigChange?: (config: any) => void;

  className?: string;

}



export const CashFlowPredictionWidget: React.FC<CashFlowPredictionWidgetProps> = ({

  predictions,

  currentBalance,

  isLoading = false,

  detailed = false,

  onRefresh,

  onConfigChange,

  className

}) => {

  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');



  const filteredPredictions = predictions.filter(pred => {

    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;

    const cutoffDate = new Date();

    cutoffDate.setDate(cutoffDate.getDate() + days);

    return new Date(pred.date) <= cutoffDate;

  });



  const getPredictionTrend = (): 'positive' | 'negative' | 'stable' => {

    if (filteredPredictions.length < 2) return 'stable';

    

    const first = filteredPredictions[0];

    const last = filteredPredictions[filteredPredictions.length - 1];

    const change = last.predictedValue - first.predictedValue;

    

    if (Math.abs(change) < currentBalance * 0.05) return 'stable';

    return change > 0 ? 'positive' : 'negative';

  };



  const getTrendIcon = (trend: string) => {

    switch (trend) {

      case 'positive':

        return <TrendingUp className="w-4 h-4 text-green-500" />;

      case 'negative':

        return <TrendingDown className="w-4 h-4 text-red-500" />;

      default:

        return <BarChart3 className="w-4 h-4 text-blue-500" />;

    }

  };



  const getConfidenceColor = (confidence: number): string => {

    if (confidence >= 0.8) return 'bg-green-500';

    if (confidence >= 0.6) return 'bg-yellow-500';

    return 'bg-red-500';

  };



  const getConfidenceLabel = (confidence: number): string => {

    if (confidence >= 0.8) return 'Élevée';

    if (confidence >= 0.6) return 'Moyenne';

    return 'Faible';

  };



  const formatCurrency = (amount: number): string => {

    return new Intl.NumberFormat('fr-FR', {

      style: 'currency',

      currency: getCurrentCompanyCurrency(),

      minimumFractionDigits: 0,

      maximumFractionDigits: 0

    }).format(amount);

  };



  const trend = getPredictionTrend();

  const avgConfidence = filteredPredictions.length > 0 

    ? filteredPredictions.reduce((sum, pred) => sum + pred.confidence, 0) / filteredPredictions.length

    : 0;



  if (isLoading) {

    return (

      <Card className={className}>

        <CardHeader>

          <CardTitle className="flex items-center space-x-2">

            <TrendingUp className="w-5 h-5" />

            <span>Prédictions de Trésorerie</span>

          </CardTitle>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="animate-pulse space-y-3">

            {[1, 2, 3].map(i => (

              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />

            ))}

          </div>

        </CardContent>

      </Card>

    );

  }



  if (predictions.length === 0) {

    return (

      <Card className={className}>

        <CardHeader>

          <CardTitle className="flex items-center space-x-2">

            <TrendingUp className="w-5 h-5" />

            <span>Prédictions de Trésorerie</span>

          </CardTitle>

        </CardHeader>

        <CardContent className="flex items-center justify-center py-12">

          <div className="text-center space-y-3">

            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto" />

            <p className="text-gray-500 dark:text-gray-400">Données insuffisantes pour les prédictions</p>

            {onRefresh && (

              <Button variant="outline" size="sm" onClick={onRefresh}>

                <RefreshCw className="w-4 h-4 mr-2" />

                Actualiser

              </Button>

            )}

          </div>

        </CardContent>

      </Card>

    );

  }



  return (

    <Card className={className}>

      <CardHeader>

        <div className="flex items-center justify-between">

          <CardTitle className="flex items-center space-x-2">

            <TrendingUp className="w-5 h-5" />

            <span>Prédictions de Trésorerie</span>

          </CardTitle>

          

          <div className="flex items-center space-x-2">

            {/* Sélecteur de période */}

            <Tabs value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>

              <TabsList className="h-8">

                <TabsTrigger value="7d" className="text-xs px-2">7j</TabsTrigger>

                <TabsTrigger value="30d" className="text-xs px-2">30j</TabsTrigger>

                <TabsTrigger value="90d" className="text-xs px-2">90j</TabsTrigger>

              </TabsList>

            </Tabs>



            {onRefresh && (

              <Button variant="ghost" size="sm" onClick={onRefresh}>

                <RefreshCw className="w-4 h-4" />

              </Button>

            )}

          </div>

        </div>



        {/* Métriques rapides */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">

          <div className="flex items-center space-x-2">

            {getTrendIcon(trend)}

            <div>

              <p className="text-xs text-gray-500 dark:text-gray-400">Tendance</p>

              <p className="text-sm font-medium capitalize">{

                trend === 'positive' ? 'Positive' :

                trend === 'negative' ? 'Négative' : 'Stable'

              }</p>

            </div>

          </div>



          <div className="flex items-center space-x-2">

            <Target className="w-4 h-4 text-blue-500" />

            <div>

              <p className="text-xs text-gray-500 dark:text-gray-400">Confiance</p>

              <p className="text-sm font-medium">{getConfidenceLabel(avgConfidence)}</p>

            </div>

          </div>



          <div className="flex items-center space-x-2">

            <DollarSign className="w-4 h-4 text-green-500" />

            <div>

              <p className="text-xs text-gray-500 dark:text-gray-400">Solde actuel</p>

              <p className="text-sm font-medium">{formatCurrency(currentBalance)}</p>

            </div>

          </div>



          <div className="flex items-center space-x-2">

            <Calendar className="w-4 h-4 text-purple-500" />

            <div>

              <p className="text-xs text-gray-500 dark:text-gray-400">Prédictions</p>

              <p className="text-sm font-medium">{filteredPredictions.length}</p>

            </div>

          </div>

        </div>

      </CardHeader>



      <CardContent className="space-y-6">

        {detailed && (

          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>

            <TabsList>

              <TabsTrigger value="chart">Graphique</TabsTrigger>

              <TabsTrigger value="table">Tableau</TabsTrigger>

            </TabsList>



            <TabsContent value="chart" className="space-y-4 mt-4">

              {/* Graphique simplifié avec barres */}

              <div className="space-y-3">

                {filteredPredictions.slice(0, 10).map((prediction, index) => {

                  const isPositive = prediction.predictedValue >= currentBalance;

                  const percentage = Math.abs(prediction.predictedValue - currentBalance) / currentBalance * 100;

                  const clampedPercentage = Math.min(percentage, 100);



                  return (

                    <motion.div

                      key={prediction.date.toISOString()}

                      initial={{ opacity: 0, x: -20 }}

                      animate={{ opacity: 1, x: 0 }}

                      transition={{ delay: index * 0.1 }}

                      className="space-y-2"

                    >

                      <div className="flex items-center justify-between text-sm">

                        <div className="flex items-center space-x-2">

                          <span className="font-mono text-xs">

                            {prediction.date.toLocaleDateString('fr-FR')}

                          </span>

                          <Badge 

                            variant="secondary" 

                            className={cn("text-xs", getConfidenceColor(prediction.confidence))}

                          >

                            {(prediction.confidence * 100).toFixed(0)}%

                          </Badge>

                        </div>

                        

                        <div className="flex items-center space-x-2">

                          <span className={cn(

                            "font-medium",

                            isPositive ? "text-green-600" : "text-red-600"

                          )}>

                            {formatCurrency(prediction.predictedValue)}

                          </span>

                          {isPositive ? 

                            <TrendingUp className="w-3 h-3 text-green-500" /> :

                            <TrendingDown className="w-3 h-3 text-red-500" />

                          }

                        </div>

                      </div>



                      <div className="relative">

                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">

                          <motion.div

                            className={cn(

                              "h-full rounded-full",

                              isPositive ? "bg-green-500" : "bg-red-500"

                            )}

                            initial={{ width: 0 }}

                            animate={{ width: `${clampedPercentage}%` }}

                            transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}

                          />

                        </div>

                        

                        {/* Intervalle de confiance */}

                        <div className="absolute top-0 h-2 pointer-events-none">

                          <div 

                            className="h-full bg-black bg-opacity-10 rounded-full"

                            style={{

                              width: `${clampedPercentage * prediction.confidence}%`,

                              marginLeft: `${clampedPercentage * (1 - prediction.confidence) / 2}%`

                            }}

                          />

                        </div>

                      </div>

                    </motion.div>

                  );

                })}

              </div>

            </TabsContent>



            <TabsContent value="table" className="space-y-4 mt-4">

              <div className="border rounded-lg overflow-hidden">

                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b">

                  <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">

                    <span>Date</span>

                    <span>Prédiction</span>

                    <span>Confiance</span>

                    <span>Facteurs</span>

                  </div>

                </div>

                

                <div className="max-h-64 overflow-y-auto">

                  <AnimatePresence>

                    {filteredPredictions.map((prediction, index) => (

                      <motion.div

                        key={prediction.date.toISOString()}

                        initial={{ opacity: 0 }}

                        animate={{ opacity: 1 }}

                        exit={{ opacity: 0 }}

                        transition={{ delay: index * 0.05 }}

                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900/30"

                      >

                        <div className="grid grid-cols-4 gap-4 items-center text-sm">

                          <span className="font-mono text-xs">

                            {prediction.date.toLocaleDateString('fr-FR')}

                          </span>

                          

                          <div className="flex items-center space-x-2">

                            <span className={cn(

                              "font-medium",

                              prediction.predictedValue >= currentBalance 

                                ? "text-green-600" : "text-red-600"

                            )}>

                              {formatCurrency(prediction.predictedValue)}

                            </span>

                          </div>

                          

                          <div className="flex items-center space-x-2">

                            <div className="flex-1 max-w-16">

                              <Progress 

                                value={prediction.confidence * 100} 

                                className="h-2"

                              />

                            </div>

                            <span className="text-xs font-mono">

                              {(prediction.confidence * 100).toFixed(0)}%

                            </span>

                          </div>

                          

                          <div className="flex items-center space-x-1">

                            {prediction.factors?.slice(0, 3).map((factor, idx) => (

                              <Badge 

                                key={idx}

                                variant="outline" 

                                className="text-xs px-1 py-0"

                              >

                                {factor.name}

                              </Badge>

                            ))}

                            {(prediction.factors?.length || 0) > 3 && (

                              <span className="text-xs text-gray-500 dark:text-gray-400">

                                +{(prediction.factors?.length || 0) - 3}

                              </span>

                            )}

                          </div>

                        </div>

                      </motion.div>

                    ))}

                  </AnimatePresence>

                </div>

              </div>

            </TabsContent>

          </Tabs>

        )}



        {!detailed && (

          <div className="space-y-3">

            {filteredPredictions.slice(0, 5).map((prediction, index) => (

              <motion.div

                key={prediction.date.toISOString()}

                initial={{ opacity: 0, y: 10 }}

                animate={{ opacity: 1, y: 0 }}

                transition={{ delay: index * 0.1 }}

                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"

              >

                <div className="flex items-center space-x-3">

                  <div className="text-center">

                    <p className="text-xs text-gray-500 dark:text-gray-400">

                      {prediction.date.toLocaleDateString('fr-FR', { 

                        day: 'numeric', 

                        month: 'short' 

                      })}

                    </p>

                  </div>

                  

                  <div>

                    <p className="text-sm font-medium">

                      {formatCurrency(prediction.predictedValue)}

                    </p>

                    <div className="flex items-center space-x-1">

                      <div className={cn(

                        "w-2 h-2 rounded-full",

                        getConfidenceColor(prediction.confidence)

                      )} />

                      <span className="text-xs text-gray-500 dark:text-gray-400">

                        {getConfidenceLabel(prediction.confidence)}

                      </span>

                    </div>

                  </div>

                </div>



                <div className="flex items-center space-x-2">

                  {prediction.predictedValue >= currentBalance ? 

                    <TrendingUp className="w-4 h-4 text-green-500" /> :

                    <TrendingDown className="w-4 h-4 text-red-500" />

                  }

                </div>

              </motion.div>

            ))}

          </div>

        )}



        {/* Informations sur le modèle */}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">

          <div className="flex items-center justify-between">

            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">

              <Info className="w-3 h-3" />

              <span>

                Modèle prédictif ML • Confiance moyenne: {(avgConfidence * 100).toFixed(0)}%

              </span>

            </div>

            

            {onConfigChange && (

              <Button variant="ghost" size="sm" onClick={() => onConfigChange({})}>

                <Settings className="w-3 h-3" />

              </Button>

            )}

          </div>

          

          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">

            <div className="flex items-start space-x-2">

              {avgConfidence >= 0.7 ? (

                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />

              ) : (

                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />

              )}

              <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-300">

                {avgConfidence >= 0.7 

                  ? "Les prédictions sont fiables. Le modèle dispose de suffisamment de données historiques."

                  : "Prédictions à interpréter avec prudence. Plus de données amélioreront la précision."

                }

              </p>

            </div>

          </div>

        </div>

      </CardContent>

    </Card>

  );

};
