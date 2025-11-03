// Composant de visualisation du Forecast Budgétaire pour CassKai
// Affiche Réel YTD + Prorata + Budget restant = Atterrissage EOY

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { budgetForecastService, BudgetForecastData } from '@/services/budgetForecastService';

interface BudgetForecastViewProps {
  companyId: string;
  budgetId: string;
  budgetYear: number;
}

export const BudgetForecastView: React.FC<BudgetForecastViewProps> = ({
  companyId,
  budgetId,
  budgetYear
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<BudgetForecastData | null>(null);
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<'prorata' | 'run_rate'>('prorata');
  const [viewMode, setViewMode] = useState<'totals' | 'categories' | 'monthly'>('totals');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadForecast();
  }, [companyId, budgetId, asOfDate, mode]);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const { data, error } = await budgetForecastService.getForecast(
        companyId,
        budgetId,
        asOfDate,
        mode
      );

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le forecast',
          variant: 'destructive'
        });
        console.error('Forecast error:', error);
      } else {
        setForecastData(data);
      }
    } catch (error) {
      console.error('Error loading forecast:', err);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (forecastData) {
      budgetForecastService.exportToCSV(forecastData, `forecast_${budgetYear}`);
      toast({
        title: 'Export réussi',
        description: 'Le forecast a été exporté en CSV'
      });
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Calcul du forecast en cours...</p>
        </div>
      </div>
    );
  }

  if (!forecastData) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-16 h-16 text-orange-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Données de forecast indisponibles
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
            Vérifiez que le budget est correctement configuré et que des écritures comptables existent
          </p>
          <Button onClick={loadForecast}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { kpi, totals_by_type, by_category, by_month, unmapped_entries } = forecastData;

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Forecast & Atterrissage {budgetYear}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Réel YTD + Prorata + Budget restant = Projection fin d'année
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <input
              type="date"
              value={asOfDate.toISOString().split('T')[0]}
              onChange={(e) => setAsOfDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger className="w-40 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 dark:border-gray-600">
              <SelectItem value="prorata">Prorata</SelectItem>
              <SelectItem value="run_rate">Run-Rate</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={loadForecast}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Alertes écritures non mappées */}
      {unmapped_entries.length > 0 && (
        <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-900 dark:text-orange-200">
                  {unmapped_entries.length} compte(s) sans mapping budgétaire
                </h4>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Montant total: {formatCurrency(unmapped_entries.reduce((sum, e) => sum + e.total_amount, 0))}
                </p>
                <Button variant="link" className="text-orange-700 dark:text-orange-300 p-0 h-auto mt-2">
                  Configurer les mappings →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <TrendingUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Réel YTD</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {formatCurrency(kpi.total_actual_ytd)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <DollarSign className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Budget Annuel</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {formatCurrency(kpi.total_budget_annual)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Forecast EOY</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {formatCurrency(kpi.total_forecast_eoy)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${kpi.variance_vs_budget >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                {kpi.variance_vs_budget >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Écart vs Budget</p>
                <p className={`text-xl font-bold mt-1 ${kpi.variance_vs_budget >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {formatCurrency(kpi.variance_vs_budget)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatPercentage(kpi.variance_percentage)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <Info className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absorption</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {kpi.absorption_rate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sélecteur de vue */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'totals', label: 'Totaux' },
          { id: 'categories', label: 'Par Catégorie' },
          { id: 'monthly', label: 'Mois par Mois' }
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setViewMode(id as any)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              viewMode === id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Vue Totaux */}
      {viewMode === 'totals' && (
        <div className="space-y-4">
          {[
            { key: 'revenue', label: 'Revenus', color: 'green' },
            { key: 'expense', label: 'Charges', color: 'red' },
            { key: 'capex', label: 'Investissements', color: 'blue' },
            { key: 'net', label: 'Résultat Net', color: 'purple' }
          ].map(({ key, label, color }) => {
            const data = totals_by_type[key as keyof typeof totals_by_type];
            return (
              <Card key={key} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className={`bg-${color}-50 dark:bg-${color}-900/30 border border-${color}-200 dark:border-${color}-800 p-4 rounded-lg`}>
                      <div className={`text-sm text-${color}-700 dark:text-${color}-300 font-medium mb-1`}>Réel YTD</div>
                      <div className={`text-2xl font-bold text-${color}-800 dark:text-${color}-200`}>
                        {formatCurrency(data.actual_ytd)}
                      </div>
                    </div>
                    <div className={`bg-${color}-50 dark:bg-${color}-900/30 border border-${color}-200 dark:border-${color}-800 p-4 rounded-lg`}>
                      <div className={`text-sm text-${color}-700 dark:text-${color}-300 font-medium mb-1`}>Budget Annuel</div>
                      <div className={`text-2xl font-bold text-${color}-800 dark:text-${color}-200`}>
                        {formatCurrency(data.budget_annual)}
                      </div>
                    </div>
                    <div className={`bg-${color}-50 dark:bg-${color}-900/30 border border-${color}-200 dark:border-${color}-800 p-4 rounded-lg`}>
                      <div className={`text-sm text-${color}-700 dark:text-${color}-300 font-medium mb-1`}>Forecast EOY</div>
                      <div className={`text-2xl font-bold text-${color}-800 dark:text-${color}-200`}>
                        {formatCurrency(data.forecast_eoy)}
                      </div>
                    </div>
                    <div className={`bg-${color}-50 dark:bg-${color}-900/30 border border-${color}-200 dark:border-${color}-800 p-4 rounded-lg`}>
                      <div className={`text-sm text-${color}-700 dark:text-${color}-300 font-medium mb-1`}>Écart</div>
                      <div className={`text-2xl font-bold text-${color}-800 dark:text-${color}-200`}>
                        {formatCurrency(data.variance)}
                      </div>
                    </div>
                    <div className={`bg-${color}-50 dark:bg-${color}-900/30 border border-${color}-200 dark:border-${color}-800 p-4 rounded-lg`}>
                      <div className={`text-sm text-${color}-700 dark:text-${color}-300 font-medium mb-1`}>Écart %</div>
                      <div className={`text-2xl font-bold text-${color}-800 dark:text-${color}-200`}>
                        {formatPercentage(data.variance_percentage)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Vue Par Catégorie */}
      {viewMode === 'categories' && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Réel YTD
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Budget Annuel
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Forecast EOY
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Écart
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Écart %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                  {by_category.map((cat) => (
                    <tr key={cat.category_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-3 ${
                            cat.category_type === 'revenue' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            cat.category_type === 'expense' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {cat.category_type === 'revenue' ? 'R' : cat.category_type === 'expense' ? 'C' : 'I'}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{cat.category_name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{cat.category_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(cat.actual_ytd)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
                        {formatCurrency(cat.budget_annual)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(cat.forecast_eoy)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${
                        cat.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(cat.variance)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right ${
                        cat.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatPercentage(cat.variance_percentage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vue Mois par Mois */}
      {viewMode === 'monthly' && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mois
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Réel
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Forecast
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Écart
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                  {by_month.map((month) => (
                    <tr key={month.month} className={`${month.is_current ? 'bg-blue-50 dark:bg-blue-900/10' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/30`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {month.month_name}
                          {month.is_current && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              En cours
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-gray-100">
                        {month.is_past || month.is_current ? formatCurrency(month.actual) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 dark:text-gray-400">
                        {formatCurrency(month.budget)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(month.forecast)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right ${
                        month.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(month.variance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          month.is_past ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                          month.is_current ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                          {month.is_past ? 'Réalisé' : month.is_current ? 'Prorata' : 'Budget'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
