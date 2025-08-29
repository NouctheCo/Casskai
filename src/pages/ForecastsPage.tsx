import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { useToast } from '../components/ui/use-toast';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { forecastsService } from '../services/forecastsService';
import {
  ForecastData,
  ForecastScenario,
  ForecastPeriod,
  ForecastDashboardData,
  ForecastFormData
} from '../types/forecasts.types';
import ForecastReportView from '../components/forecasts/ForecastReportView';
import ForecastComparisonView from '../components/forecasts/ForecastComparisonView';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Calendar, 
  Target,
  Plus,
  FileDown,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Activity,
  Sparkles
} from 'lucide-react';

const ForecastsPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentEnterprise } = useEnterprise();
  
  // State management
  const [dashboardData, setDashboardData] = useState<ForecastDashboardData | null>(null);
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [scenarios, setScenarios] = useState<ForecastScenario[]>([]);
  const [periods, setPeriods] = useState<ForecastPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedForecast, setSelectedForecast] = useState<ForecastData | null>(null);
  const [selectedForecasts, setSelectedForecasts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'comparison'>('list');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (currentEnterprise?.id) {
      loadDashboardData();
      loadForecasts();
      loadScenarios();
      loadPeriods();
    }
  }, [currentEnterprise]);

  const loadDashboardData = async () => {
    try {
      const response = await forecastsService.getDashboardData(currentEnterprise!.id);
      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadForecasts = async () => {
    try {
      const response = await forecastsService.getForecasts(currentEnterprise!.id);
      if (response.data) {
        setForecasts(response.data);
      }
    } catch (error) {
      console.error('Error loading forecasts:', error);
    }
  };

  const loadScenarios = async () => {
    try {
      const response = await forecastsService.getScenarios();
      if (response.data) {
        setScenarios(response.data);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    }
  };

  const loadPeriods = async () => {
    try {
      const response = await forecastsService.getPeriods(currentEnterprise!.id);
      if (response.data) {
        setPeriods(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading periods:', error);
      setLoading(false);
    }
  };

  const handleExportForecasts = () => {
    forecastsService.exportForecastsToCSV(forecasts, 'previsions_financieres');
    toast({
      title: 'Export réussi',
      description: 'Les prévisions ont été exportées en CSV'
    });
  };

  const getScenarioName = (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    return scenario?.name || 'Scénario inconnu';
  };

  const getPeriodName = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    return period?.name || 'Période inconnue';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleForecastSelect = (forecast: ForecastData) => {
    setSelectedForecast(forecast);
    setViewMode('detail');
  };

  const handleForecastCheckboxChange = (forecastId: string, checked: boolean) => {
    if (checked) {
      setSelectedForecasts(prev => [...prev, forecastId]);
    } else {
      setSelectedForecasts(prev => prev.filter(id => id !== forecastId));
    }
  };

  const handleCompareSelected = () => {
    if (selectedForecasts.length >= 2) {
      setViewMode('comparison');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedForecast(null);
    setSelectedForecasts([]);
  };

  const getSelectedForecastsData = () => {
    return forecasts.filter(f => selectedForecasts.includes(f.id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des prévisions financières...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header with filters */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
        variants={itemVariants}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Prévisions Financières
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-400">
              {currentEnterprise ? `${currentEnterprise.name} - ` : ''}
              Gérez et analysez vos prévisions budgétaires et projections financières
            </p>
            <Badge variant="secondary" className="text-xs">
              En temps réel
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleExportForecasts}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exporter
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
            onClick={() => setActiveTab('new-forecast')}
          >
            <Plus className="h-4 w-4" />
            Nouvelle Prévision
          </Button>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="forecasts">Prévisions</TabsTrigger>
            <TabsTrigger value="scenarios">Scénarios</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="new-forecast">Nouvelle Prévision</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {dashboardData && (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Prévisions</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.summary.total_forecasts}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                          <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Scénarios Actifs</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.summary.active_scenarios}
                          </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                          <Target className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Précision Moyenne</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.summary.avg_accuracy}%
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                          <Activity className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Prochaine Révision</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {new Date(dashboardData.summary.next_review_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                          <Calendar className="h-6 w-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Metrics Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tendances Clés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Revenus</p>
                          <p className="text-lg font-semibold">
                            {dashboardData.key_metrics.revenue_trend > 0 ? '+' : ''}
                            {dashboardData.key_metrics.revenue_trend}%
                          </p>
                        </div>
                        {dashboardData.key_metrics.revenue_trend > 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Dépenses</p>
                          <p className="text-lg font-semibold">
                            {dashboardData.key_metrics.expense_trend > 0 ? '+' : ''}
                            {dashboardData.key_metrics.expense_trend}%
                          </p>
                        </div>
                        {dashboardData.key_metrics.expense_trend > 0 ? (
                          <TrendingUp className="h-5 w-5 text-red-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-green-500" />
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Flux de Trésorerie</p>
                          <p className="text-lg font-semibold">
                            {dashboardData.key_metrics.cash_flow_trend > 0 ? '+' : ''}
                            {dashboardData.key_metrics.cash_flow_trend}%
                          </p>
                        </div>
                        {dashboardData.key_metrics.cash_flow_trend > 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Rentabilité</p>
                          <p className="text-lg font-semibold">
                            {dashboardData.key_metrics.profitability_trend > 0 ? '+' : ''}
                            {dashboardData.key_metrics.profitability_trend}%
                          </p>
                        </div>
                        {dashboardData.key_metrics.profitability_trend > 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Forecasts and Upcoming Reviews */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Prévisions Récentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.recent_forecasts.map((forecast) => (
                          <div key={forecast.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{forecast.name}</p>
                              <p className="text-sm text-gray-600">
                                {getScenarioName(forecast.scenario_id)} • {getPeriodName(forecast.period_id)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(forecast.total_revenue)}</p>
                              <Badge className={getStatusColor(forecast.status)}>
                                {forecast.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Révisions Programmées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.upcoming_reviews.map((review, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{review.forecast_name}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(review.review_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <Badge className={review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>
                              {review.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Forecasts Tab */}
          <TabsContent value="forecasts" className="space-y-6">
            {viewMode === 'list' && (
              <>
                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold">Gestion des Prévisions</h2>
                    {selectedForecasts.length > 0 && (
                      <Badge variant="secondary">
                        {selectedForecasts.length} sélectionnée{selectedForecasts.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedForecasts.length >= 2 && (
                      <Button
                        onClick={handleCompareSelected}
                        className="flex items-center gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Comparer ({selectedForecasts.length})
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {forecasts.map((forecast) => (
                    <Card key={forecast.id} className="relative">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedForecasts.includes(forecast.id)}
                              onCheckedChange={(checked) => 
                                handleForecastCheckboxChange(forecast.id, checked as boolean)
                              }
                            />
                            <div>
                              <CardTitle 
                                className="text-lg cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => handleForecastSelect(forecast)}
                              >
                                {forecast.name}
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-1">
                                {getScenarioName(forecast.scenario_id)} • {getPeriodName(forecast.period_id)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(forecast.status)}>
                              {forecast.status}
                            </Badge>
                            <div className="flex gap-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleForecastSelect(forecast)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600">Revenus Totaux</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(forecast.total_revenue)}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <p className="text-sm text-gray-600">Dépenses Totales</p>
                            <p className="text-xl font-bold text-red-600">
                              {formatCurrency(forecast.total_expenses)}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600">Flux de Trésorerie Net</p>
                            <p className="text-xl font-bold text-blue-600">
                              {formatCurrency(forecast.net_cash_flow)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Marge Brute</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={forecast.gross_margin} className="flex-1" />
                              <span className="text-sm font-medium">{forecast.gross_margin.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Marge Nette</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={forecast.net_margin} className="flex-1" />
                              <span className="text-sm font-medium">{forecast.net_margin.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Seuil de Rentabilité</p>
                            <p className="text-sm font-medium mt-1">
                              {formatCurrency(forecast.break_even_point)}
                            </p>
                          </div>
                        </div>

                        {forecast.key_assumptions && forecast.key_assumptions.length > 0 && (
                          <div className="mt-6">
                            <p className="text-sm font-medium text-gray-700 mb-2">Hypothèses Clés:</p>
                            <div className="flex flex-wrap gap-2">
                              {forecast.key_assumptions.slice(0, 3).map((assumption, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {assumption}
                                </Badge>
                              ))}
                              {forecast.key_assumptions.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{forecast.key_assumptions.length - 3} autres
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
            
            {viewMode === 'detail' && selectedForecast && (
              <ForecastReportView
                forecast={selectedForecast}
                scenario={scenarios.find(s => s.id === selectedForecast.scenario_id)}
                period={periods.find(p => p.id === selectedForecast.period_id)}
                onBack={handleBackToList}
              />
            )}
            
            {viewMode === 'comparison' && selectedForecasts.length >= 2 && (
              <ForecastComparisonView
                forecasts={getSelectedForecastsData()}
                scenarios={scenarios}
                onBack={handleBackToList}
              />
            )}
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.map((scenario) => (
                <Card key={scenario.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    <Badge 
                      className={
                        scenario.type === 'optimistic' ? 'bg-green-100 text-green-800' :
                        scenario.type === 'realistic' ? 'bg-blue-100 text-blue-800' :
                        scenario.type === 'pessimistic' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {scenario.type}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Taux de croissance:</span>
                        <span className="text-sm font-medium">{scenario.growth_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Conditions de marché:</span>
                        <Badge 
                          variant="outline"
                          className={
                            scenario.market_conditions === 'favorable' ? 'text-green-600' :
                            scenario.market_conditions === 'stable' ? 'text-blue-600' :
                            'text-red-600'
                          }
                        >
                          {scenario.market_conditions}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Dernière mise à jour:</span>
                        <span className="text-sm text-gray-500">
                          {new Date(scenario.updated_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyses Avancées</CardTitle>
                <p className="text-sm text-gray-600">
                  Explorez vos données de prévision avec des outils d'analyse avancés
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analyse What-If</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Testez différents scénarios et variables pour évaluer l'impact sur vos prévisions
                    </p>
                    <Button variant="outline">
                      Lancer l'analyse
                    </Button>
                  </div>
                  
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Comparaison de Scénarios</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Comparez les performances de différents scénarios côte à côte
                    </p>
                    <Button variant="outline">
                      Comparer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Forecast Tab */}
          <TabsContent value="new-forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Créer une Nouvelle Prévision</CardTitle>
                <p className="text-sm text-gray-600">
                  Définissez les paramètres de votre nouvelle prévision financière
                </p>
              </CardHeader>
              <CardContent>
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Formulaire de Création</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Le formulaire de création de prévision sera disponible dans la prochaine version
                  </p>
                  <Button disabled>
                    Créer une Prévision
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default ForecastsPage;