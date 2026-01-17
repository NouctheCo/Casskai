/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Graphique Budget vs Réel
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { startOfYear, endOfYear } from 'date-fns';
import { logger } from '@/lib/logger';
interface BudgetVsActualData {
  category: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
}
interface BudgetVsActualChartProps {
  companyId: string;
}
const BudgetVsActualChart: React.FC<BudgetVsActualChartProps> = ({ companyId }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<BudgetVsActualData[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadBudgetVsActual = async () => {
      try {
        setLoading(true);
        const startDate = startOfYear(new Date()).toISOString().split('T')[0];
        const endDate = endOfYear(new Date()).toISOString().split('T')[0];
        // 1. Récupérer les catégories budgétaires avec leur budget annuel
        const { data: budgetCategories, error: budgetError } = await supabase
          .from('budget_categories')
          .select(`
            id,
            category,
            annual_amount,
            account_codes,
            budgets!inner (
              company_id
            )
          `)
          .eq('budgets.company_id', companyId)
          .eq('approval_status', 'approved');
        if (budgetError) {
          logger.error('BudgetVsActualChart', 'Error fetching budget categories:', budgetError);
          setData([]);
          return;
        }
        if (!budgetCategories || budgetCategories.length === 0) {
          setData([]);
          return;
        }
        // 2. Pour chaque catégorie, calculer le réel depuis les écritures
        const budgetVsActualData: BudgetVsActualData[] = await Promise.all(
          budgetCategories.map(async (category: any) => {
            const accountCodes = category.account_codes || [];
            let actualAmount = 0;
            if (accountCodes.length > 0) {
              // Récupérer les écritures pour les comptes de cette catégorie
              const { data: lines, error: linesError } = await supabase
                .from('journal_entry_lines')
                .select(`
                  debit_amount,
                  credit_amount,
                  chart_of_accounts!inner (
                    account_number
                  ),
                  journal_entries!inner (
                    company_id,
                    entry_date,
                    status
                  )
                `)
                .eq('journal_entries.company_id', companyId)
                .in('journal_entries.status', ['posted', 'validated', 'imported'])
                .gte('journal_entries.entry_date', startDate)
                .lte('journal_entries.entry_date', endDate);
              if (!linesError && lines) {
                lines.forEach((line: any) => {
                  const accountNumber = line.chart_of_accounts?.account_number || '';
                  // Vérifier si le compte correspond à un des codes de la catégorie
                  const matchesCategory = accountCodes.some((code: string) =>
                    accountNumber.startsWith(code)
                  );
                  if (matchesCategory) {
                    const debit = line.debit_amount || 0;
                    const credit = line.credit_amount || 0;
                    // Pour les charges (classe 6), on compte debit - credit
                    actualAmount += (debit - credit);
                  }
                });
              }
            }
            const budgetAmount = category.annual_amount || 0;
            const variance = actualAmount - budgetAmount;
            const variancePercent = budgetAmount > 0
              ? ((variance / budgetAmount) * 100)
              : 0;
            return {
              category: category.category,
              budget: budgetAmount,
              actual: Math.abs(actualAmount), // Valeur absolue pour l'affichage
              variance,
              variancePercent
            };
          })
        );
        // Trier par montant budgété décroissant
        budgetVsActualData.sort((a, b) => b.budget - a.budget);
        setData(budgetVsActualData);
      } catch (error) {
        logger.error('BudgetVsActualChart', 'Error loading budget vs actual:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    if (companyId) {
      loadBudgetVsActual();
    }
  }, [companyId]);
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('accounting.budgetVsActual.title', 'Budget vs Réel')}
          </h3>
        </div>
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('accounting.budgetVsActual.title', 'Budget vs Réel')}
          </h3>
        </div>
        <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
          {t('accounting.budgetVsActual.noData', 'Aucune catégorie budgétaire disponible')}
        </div>
      </div>
    );
  }
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value).replace(/\s/g, '\u00A0');
  };
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-700 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{data.category}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-blue-600 dark:text-blue-400">Budget:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(data.budget)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-green-600 dark:text-green-400">Réel:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(data.actual)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-200 dark:border-gray-600">
              <span className={data.variance >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                Écart:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(Math.abs(data.variance))} ({Math.abs(data.variancePercent).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  const totalBudget = data.reduce((sum, item) => sum + item.budget, 0);
  const totalActual = data.reduce((sum, item) => sum + item.actual, 0);
  const totalVariance = totalActual - totalBudget;
  const totalVariancePercent = totalBudget > 0 ? ((totalVariance / totalBudget) * 100) : 0;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('accounting.budgetVsActual.title', 'Budget vs Réel')}
        </h3>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#6b7280' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value: string) => {
                if (value === 'budget') return t('accounting.budgetVsActual.budget', 'Budget');
                if (value === 'actual') return t('accounting.budgetVsActual.actual', 'Réel');
                return value;
              }}
            />
            <Bar dataKey="budget" fill="#3b82f6" name="budget" />
            <Bar dataKey="actual" fill="#10b981" name="actual" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Summary statistics */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              {t('accounting.budgetVsActual.totalBudget', 'Budget total')}:
            </span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {formatCurrency(totalBudget)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              {t('accounting.budgetVsActual.totalActual', 'Réel total')}:
            </span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {formatCurrency(totalActual)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              {t('accounting.budgetVsActual.totalVariance', 'Écart total')}:
            </span>
            <span className={`ml-2 font-semibold ${
              totalVariance >= 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {formatCurrency(Math.abs(totalVariance))} ({Math.abs(totalVariancePercent).toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BudgetVsActualChart;