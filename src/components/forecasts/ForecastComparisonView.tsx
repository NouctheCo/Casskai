import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import { Button } from '../ui/button';

import { Badge } from '../ui/badge';

import { ForecastData, ForecastScenario } from '../../types/forecasts.types';

import { getCurrentCompanyCurrency } from '@/lib/utils';

import { 

  ArrowLeft,

  TrendingUp,

  TrendingDown,

  BarChart3,

  Target,

  AlertCircle

} from 'lucide-react';



interface ForecastComparisonViewProps {

  forecasts: ForecastData[];

  scenarios?: ForecastScenario[];

  onBack: () => void;

  className?: string;

}



const ForecastComparisonView: React.FC<ForecastComparisonViewProps> = ({

  forecasts,

  scenarios = [],

  onBack,

  className = ""

}) => {

  const formatCurrency = (amount: number) => {

    return new Intl.NumberFormat('fr-FR', {

      style: 'currency',

      currency: getCurrentCompanyCurrency(),

      minimumFractionDigits: 0,

      maximumFractionDigits: 0

    }).format(amount);

  };



  const formatPercentage = (value: number) => {

    return `${value.toFixed(1)}%`;

  };



  const getScenarioName = (scenarioId: string) => {

    const scenario = scenarios.find(s => s.id === scenarioId);

    return scenario?.name || 'Scénario inconnu';

  };



  const getScenarioType = (scenarioId: string) => {

    const scenario = scenarios.find(s => s.id === scenarioId);

    return scenario?.type || 'custom';

  };



  const getScenarioTypeColor = (type: string) => {

    switch (type) {

      case 'optimistic': return 'bg-green-100 text-green-800';

      case 'realistic': return 'bg-blue-100 text-blue-800';

      case 'pessimistic': return 'bg-red-100 text-red-800';

      default: return 'bg-gray-100 text-gray-800';

    }

  };



  const calculateVariance = (value1: number, value2: number) => {

    const variance = ((value1 - value2) / value2) * 100;

    return variance;

  };



  const getVarianceIcon = (variance: number) => {

    if (variance > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;

    if (variance < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;

    return <Target className="h-4 w-4 text-gray-500 dark:text-gray-300" />;

  };



  const getVarianceColor = (variance: number) => {

    if (variance > 5) return 'text-green-600';

    if (variance < -5) return 'text-red-600';

    return 'text-gray-600';

  };



  // Calculate summary statistics

  const calculateSummaryStats = () => {

    const totalRevenue = forecasts.reduce((sum, f) => sum + f.total_revenue, 0);

    const totalExpenses = forecasts.reduce((sum, f) => sum + f.total_expenses, 0);

    const avgRevenue = totalRevenue / forecasts.length;

    const avgExpenses = totalExpenses / forecasts.length;

    const avgMargin = forecasts.reduce((sum, f) => sum + f.gross_margin, 0) / forecasts.length;



    return {

      totalRevenue,

      totalExpenses,

      avgRevenue,

      avgExpenses,

      avgMargin

    };

  };



  const stats = calculateSummaryStats();



  if (forecasts.length < 2) {

    return (

      <div className={`space-y-6 ${className}`}>

        <div className="flex items-center justify-between">

          <Button

            variant="outline"

            onClick={onBack}

            className="flex items-center gap-2"

          >

            <ArrowLeft className="h-4 w-4" />

            Retour

          </Button>

        </div>

        

        <Card>

          <CardContent className="p-8 text-center">

            <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />

            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">

              Comparaison insuffisante

            </h3>

            <p className="text-gray-600 dark:text-gray-300">

              Veuillez sélectionner au moins 2 prévisions pour effectuer une comparaison.

            </p>

          </CardContent>

        </Card>

      </div>

    );

  }



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

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">

              Comparaison de Scénarios

            </h1>

            <p className="text-gray-600 dark:text-gray-300 mt-1">

              Analyse comparative de {forecasts.length} prévisions sélectionnées

            </p>

          </div>

        </div>

      </div>



      {/* Summary Statistics */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Card>

          <CardContent className="p-6 text-center">

            <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />

            <p className="text-sm text-gray-600 dark:text-gray-300">Revenus Moyens</p>

            <p className="text-2xl font-bold text-blue-600">

              {formatCurrency(stats.avgRevenue)}

            </p>

          </CardContent>

        </Card>

        

        <Card>

          <CardContent className="p-6 text-center">

            <TrendingDown className="h-8 w-8 text-red-500 mx-auto mb-2" />

            <p className="text-sm text-gray-600 dark:text-gray-300">Dépenses Moyennes</p>

            <p className="text-2xl font-bold text-red-600 dark:text-red-400">

              {formatCurrency(stats.avgExpenses)}

            </p>

          </CardContent>

        </Card>

        

        <Card>

          <CardContent className="p-6 text-center">

            <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />

            <p className="text-sm text-gray-600 dark:text-gray-300">Marge Brute Moyenne</p>

            <p className="text-2xl font-bold text-green-600">

              {formatPercentage(stats.avgMargin)}

            </p>

          </CardContent>

        </Card>

      </div>



      {/* Detailed Comparison Table */}

      <Card>

        <CardHeader>

          <CardTitle className="flex items-center gap-2">

            <BarChart3 className="h-5 w-5" />

            Comparaison Détaillée des Métriques

          </CardTitle>

        </CardHeader>

        <CardContent>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b border-gray-200 dark:border-gray-600">

                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Métrique</th>

                  {forecasts.map((forecast, _index) => (

                    <th key={forecast.id} className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">

                      <div className="space-y-1">

                        <div>{forecast.name}</div>

                        <Badge className={getScenarioTypeColor(getScenarioType(forecast.scenario_id))} size="sm">

                          {getScenarioName(forecast.scenario_id)}

                        </Badge>

                      </div>

                    </th>

                  ))}

                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Écart (%)</th>

                </tr>

              </thead>

              <tbody>

                {/* Revenue Row */}

                <tr className="border-b border-gray-100">

                  <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Revenus Totaux</td>

                  {forecasts.map((forecast) => (

                    <td key={`revenue-${forecast.id}`} className="text-center py-3 px-4">

                      <span className="font-semibold text-green-600">

                        {formatCurrency(forecast.total_revenue)}

                      </span>

                    </td>

                  ))}

                  <td className="text-center py-3 px-4">

                    {forecasts.length >= 2 && (

                      <div className="flex items-center justify-center gap-1">

                        {getVarianceIcon(calculateVariance(

                          Math.max(...forecasts.map(f => f.total_revenue)),

                          Math.min(...forecasts.map(f => f.total_revenue))

                        ))}

                        <span className={getVarianceColor(calculateVariance(

                          Math.max(...forecasts.map(f => f.total_revenue)),

                          Math.min(...forecasts.map(f => f.total_revenue))

                        ))}>

                          {formatPercentage(Math.abs(calculateVariance(

                            Math.max(...forecasts.map(f => f.total_revenue)),

                            Math.min(...forecasts.map(f => f.total_revenue))

                          )))}

                        </span>

                      </div>

                    )}

                  </td>

                </tr>



                {/* Expenses Row */}

                <tr className="border-b border-gray-100">

                  <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Dépenses Totales</td>

                  {forecasts.map((forecast) => (

                    <td key={`expenses-${forecast.id}`} className="text-center py-3 px-4">

                      <span className="font-semibold text-red-600 dark:text-red-400">

                        {formatCurrency(forecast.total_expenses)}

                      </span>

                    </td>

                  ))}

                  <td className="text-center py-3 px-4">

                    {forecasts.length >= 2 && (

                      <div className="flex items-center justify-center gap-1">

                        {getVarianceIcon(calculateVariance(

                          Math.max(...forecasts.map(f => f.total_expenses)),

                          Math.min(...forecasts.map(f => f.total_expenses))

                        ))}

                        <span className={getVarianceColor(calculateVariance(

                          Math.max(...forecasts.map(f => f.total_expenses)),

                          Math.min(...forecasts.map(f => f.total_expenses))

                        ))}>

                          {formatPercentage(Math.abs(calculateVariance(

                            Math.max(...forecasts.map(f => f.total_expenses)),

                            Math.min(...forecasts.map(f => f.total_expenses))

                          )))}

                        </span>

                      </div>

                    )}

                  </td>

                </tr>



                {/* Net Cash Flow Row */}

                <tr className="border-b border-gray-100">

                  <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Flux de Trésorerie Net</td>

                  {forecasts.map((forecast) => (

                    <td key={`cash-flow-${forecast.id}`} className="text-center py-3 px-4">

                      <span className="font-semibold text-blue-600">

                        {formatCurrency(forecast.net_cash_flow)}

                      </span>

                    </td>

                  ))}

                  <td className="text-center py-3 px-4">

                    {forecasts.length >= 2 && (

                      <div className="flex items-center justify-center gap-1">

                        {getVarianceIcon(calculateVariance(

                          Math.max(...forecasts.map(f => f.net_cash_flow)),

                          Math.min(...forecasts.map(f => f.net_cash_flow))

                        ))}

                        <span className={getVarianceColor(calculateVariance(

                          Math.max(...forecasts.map(f => f.net_cash_flow)),

                          Math.min(...forecasts.map(f => f.net_cash_flow))

                        ))}>

                          {formatPercentage(Math.abs(calculateVariance(

                            Math.max(...forecasts.map(f => f.net_cash_flow)),

                            Math.min(...forecasts.map(f => f.net_cash_flow))

                          )))}

                        </span>

                      </div>

                    )}

                  </td>

                </tr>



                {/* Gross Margin Row */}

                <tr className="border-b border-gray-100">

                  <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Marge Brute (%)</td>

                  {forecasts.map((forecast) => (

                    <td key={`gross-margin-${forecast.id}`} className="text-center py-3 px-4">

                      <span className="font-semibold text-purple-600">

                        {formatPercentage(forecast.gross_margin)}

                      </span>

                    </td>

                  ))}

                  <td className="text-center py-3 px-4">

                    {forecasts.length >= 2 && (

                      <span className="text-sm text-gray-600 dark:text-gray-300">

                        ±{formatPercentage(Math.abs(

                          Math.max(...forecasts.map(f => f.gross_margin)) - 

                          Math.min(...forecasts.map(f => f.gross_margin))

                        ))}

                      </span>

                    )}

                  </td>

                </tr>



                {/* Net Margin Row */}

                <tr className="border-b border-gray-100">

                  <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Marge Nette (%)</td>

                  {forecasts.map((forecast) => (

                    <td key={`net-margin-${forecast.id}`} className="text-center py-3 px-4">

                      <span className="font-semibold text-indigo-600">

                        {formatPercentage(forecast.net_margin)}

                      </span>

                    </td>

                  ))}

                  <td className="text-center py-3 px-4">

                    {forecasts.length >= 2 && (

                      <span className="text-sm text-gray-600 dark:text-gray-300">

                        ±{formatPercentage(Math.abs(

                          Math.max(...forecasts.map(f => f.net_margin)) - 

                          Math.min(...forecasts.map(f => f.net_margin))

                        ))}

                      </span>

                    )}

                  </td>

                </tr>



                {/* Break Even Point Row */}

                <tr>

                  <td className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Seuil de Rentabilité</td>

                  {forecasts.map((forecast) => (

                    <td key={`break-even-${forecast.id}`} className="text-center py-3 px-4">

                      <span className="font-semibold text-orange-600">

                        {formatCurrency(forecast.break_even_point)}

                      </span>

                    </td>

                  ))}

                  <td className="text-center py-3 px-4">

                    {forecasts.length >= 2 && (

                      <div className="flex items-center justify-center gap-1">

                        {getVarianceIcon(calculateVariance(

                          Math.max(...forecasts.map(f => f.break_even_point)),

                          Math.min(...forecasts.map(f => f.break_even_point))

                        ))}

                        <span className={getVarianceColor(calculateVariance(

                          Math.max(...forecasts.map(f => f.break_even_point)),

                          Math.min(...forecasts.map(f => f.break_even_point))

                        ))}>

                          {formatPercentage(Math.abs(calculateVariance(

                            Math.max(...forecasts.map(f => f.break_even_point)),

                            Math.min(...forecasts.map(f => f.break_even_point))

                          )))}

                        </span>

                      </div>

                    )}

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </CardContent>

      </Card>



      {/* Analysis Summary */}

      <Card>

        <CardHeader>

          <CardTitle>Résumé de l'Analyse</CardTitle>

        </CardHeader>

        <CardContent>

          <div className="space-y-4">

            <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">

              <h4 className="font-medium text-blue-900 mb-2 dark:text-blue-100">Scénario le Plus Optimiste</h4>

              <p className="text-sm text-blue-800">

                {(() => {

                  const maxRevenue = Math.max(...forecasts.map(f => f.total_revenue));

                  const bestForecast = forecasts.find(f => f.total_revenue === maxRevenue);

                  return `${bestForecast?.name} avec des revenus de ${formatCurrency(maxRevenue)}`;

                })()}

              </p>

            </div>

            

            <div className="p-4 bg-red-50 rounded-lg dark:bg-red-900/20">

              <h4 className="font-medium text-red-900 mb-2">Scénario le Plus Conservateur</h4>

              <p className="text-sm text-red-800">

                {(() => {

                  const minRevenue = Math.min(...forecasts.map(f => f.total_revenue));

                  const conservativeForecast = forecasts.find(f => f.total_revenue === minRevenue);

                  return `${conservativeForecast?.name} avec des revenus de ${formatCurrency(minRevenue)}`;

                })()}

              </p>

            </div>

            

            <div className="p-4 bg-green-50 rounded-lg dark:bg-green-900/20">

              <h4 className="font-medium text-green-900 mb-2">Meilleure Marge</h4>

              <p className="text-sm text-green-800">

                {(() => {

                  const maxMargin = Math.max(...forecasts.map(f => f.gross_margin));

                  const bestMarginForecast = forecasts.find(f => f.gross_margin === maxMargin);

                  return `${bestMarginForecast?.name} avec une marge brute de ${formatPercentage(maxMargin)}`;

                })()}

              </p>

            </div>

          </div>

        </CardContent>

      </Card>

    </div>

  );

};



export default ForecastComparisonView;
