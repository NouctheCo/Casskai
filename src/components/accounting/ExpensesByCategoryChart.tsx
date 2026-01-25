/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { dashboardStatsService } from '@/services/dashboardStatsService';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
interface ExpenseByCategory {
  name: string;
  value: number;
  color: string;
}
interface ExpensesByCategoryChartProps {
  companyId: string;
}
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
];
const ExpensesByCategoryChart: React.FC<ExpensesByCategoryChartProps> = ({ companyId }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<ExpenseByCategory[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadExpensesByCategory = async () => {
      try {
        setLoading(true);
        const expenseData = await dashboardStatsService.getExpensesByCategory(companyId);
        setData(expenseData);
      } catch (error) {
        logger.error('ExpensesByCategoryChart', 'Error loading expenses by category:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    if (companyId) {
      loadExpensesByCategory();
    }
  }, [companyId]);
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('accounting.expensesByCategory.title', 'Charges par catégorie')}
          </h3>
        </div>
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('accounting.expensesByCategory.title', 'Charges par catégorie')}
          </h3>
        </div>
        <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
          {t('accounting.expensesByCategory.noData', 'Aucune donnée de charges disponible')}
        </div>
      </div>
    );
  }
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-white dark:bg-gray-700 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{payload[0].name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: getCurrentCompanyCurrency(),
                minimumFractionDigits: 0
              }).format(value).replace(/\s/g, '\u00A0')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {percentage}%
          </p>
        </div>
      );
    }
    return null;
  };
  const renderCustomLabel = (entry: any) => {
    const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
    return `${percentage}%`;
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('accounting.expensesByCategory.title', 'Charges par catégorie')}
        </h3>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string, _entry: any) => {
                const item = data.find(d => d.name === value);
                const percentage = total > 0 ? ((item!.value / total) * 100).toFixed(0) : '0';
                return `${value} (${percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Summary statistics */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              {t('accounting.expensesByCategory.totalCategories', 'Total catégories')}:
            </span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">{data.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              {t('accounting.expensesByCategory.totalAmount', 'Total charges')}:
            </span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: getCurrentCompanyCurrency(),
                minimumFractionDigits: 0
              }).format(total).replace(/\s/g, '\u00A0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ExpensesByCategoryChart;
