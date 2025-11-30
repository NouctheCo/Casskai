import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ForecastData, ForecastReport, ForecastScenario, ForecastPeriod } from '../../types/forecasts.types';
import ForecastChartView from './ForecastChartView';
import { forecastsService } from '../../services/forecastsService';
import { 
  FileDown, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  DollarSign,
  Calendar,
  BarChart3,
  ArrowLeft
} from 'lucide-react';

interface ForecastReportViewProps {
  forecast: ForecastData;
  scenario?: ForecastScenario;
  period?: ForecastPeriod;
  onBack: () => void;
  className?: string;
}

const ForecastReportView: React.FC<ForecastReportViewProps> = ({
  forecast,
  scenario,
  period,
  onBack,
  className = ""
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleExportPDF = async () => {
    try {
      const reportConfig: Partial<ForecastReport> = {
        name: `Rapport_${forecast.name}`,
        forecast_id: forecast.id,
        type: 'detailed',
        format: 'pdf',
        content: {
          include_charts: true,
          include_assumptions: true,
          include_risks: true,
          include_recommendations: true
        }
      };

      await forecastsService.generatePDFReport(forecast as any);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error instanceof Error ? error.message : String(error));
    }
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

  const getScenarioTypeColor = (type: string) => {
    switch (type) {
      case 'optimistic': return 'bg-green-100 text-green-800';
      case 'realistic': return 'bg-blue-100 text-blue-800';
      case 'pessimistic': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{forecast.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getStatusColor(forecast.status)}>
                {forecast.status}
              </Badge>
              {scenario && (
                <Badge className={getScenarioTypeColor(scenario.type)}>
                  {scenario.name}
                </Badge>
              )}
              {period && (
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {period.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={handleExportPDF}
          className="flex items-center gap-2"
        >
          <FileDown className="h-4 w-4" />
          Exporter PDF
        </Button>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus Totaux</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(forecast.total_revenue)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dépenses Totales</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(forecast.total_expenses)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Flux de Trésorerie</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(forecast.net_cash_flow)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Seuil de Rentabilité</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(forecast.break_even_point)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <ForecastChartView forecast={forecast} />

      {/* Margins and Ratios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Marges et Ratios Financiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Marge Brute</span>
                <span className="text-sm font-bold">{formatPercentage(forecast.gross_margin)}</span>
              </div>
              <Progress value={forecast.gross_margin} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Marge Nette</span>
                <span className="text-sm font-bold">{formatPercentage(forecast.net_margin)}</span>
              </div>
              <Progress value={forecast.net_margin} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue and Expense Items Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-700 dark:text-green-400">Lignes de Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecast.revenue_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{item.category}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          item.confidence_level === 'high' ? 'text-green-600' :
                          item.confidence_level === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}
                      >
                        Confiance: {item.confidence_level}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      +{item.growth_rate}% croissance
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-700">Lignes de Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecast.expense_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg dark:bg-red-900/20">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{item.category}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          item.confidence_level === 'high' ? 'text-green-600' :
                          item.confidence_level === 'medium' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}
                      >
                        Confiance: {item.confidence_level}
                      </Badge>
                      {item.is_recurring && (
                        <Badge variant="secondary" className="text-xs">
                          Récurrent
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      +{item.growth_rate}% croissance
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assumptions, Risks, and Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Key Assumptions */}
        {forecast.key_assumptions && forecast.key_assumptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Target className="h-5 w-5" />
                Hypothèses Clés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {forecast.key_assumptions.map((assumption, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{assumption}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Risk Factors */}
        {forecast.risk_factors && forecast.risk_factors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Facteurs de Risque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {forecast.risk_factors.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Opportunities */}
        {forecast.opportunities && forecast.opportunities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <TrendingUp className="h-5 w-5" />
                Opportunités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {forecast.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{opportunity}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Informations sur la Prévision</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Créée le:</p>
              <p className="font-medium">{new Date(forecast.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Dernière mise à jour:</p>
              <p className="font-medium">{new Date(forecast.updated_at).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Créée par:</p>
              <p className="font-medium">{forecast.created_by}</p>
            </div>
            {forecast.approved_by && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">Approuvée par:</p>
                <p className="font-medium">{forecast.approved_by}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForecastReportView;
