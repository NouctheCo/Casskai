// Composant de statistiques pour les budgets
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target, Percent } from 'lucide-react';
import type { Budget } from '@/types/budget.types';

interface BudgetStatsProps {
  budgets: Budget[];
}

export const BudgetStats: React.FC<BudgetStatsProps> = ({ budgets }) => {
  const stats = React.useMemo(() => {
    const totalBudgets = budgets.length;
    const activeBudgets = budgets.filter(b => b.status === 'active').length;
    const totalRevenue = budgets.reduce((sum, b) => sum + b.total_revenue_budget, 0);
    const totalExpenses = budgets.reduce((sum, b) => sum + b.total_expense_budget, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalBudgets,
      activeBudgets,
      totalRevenue,
      totalExpenses,
      totalProfit,
      avgMargin
    };
  }, [budgets]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const statsData = [
    {
      label: 'Budgets actifs',
      value: stats.activeBudgets,
      total: stats.totalBudgets,
      icon: Target,
      color: 'blue',
      format: (v: number) => `${v} / ${stats.totalBudgets}`
    },
    {
      label: 'Revenus totaux',
      value: stats.totalRevenue,
      icon: TrendingUp,
      color: 'green',
      format: formatCurrency
    },
    {
      label: 'Charges totales',
      value: stats.totalExpenses,
      icon: TrendingDown,
      color: 'red',
      format: formatCurrency
    },
    {
      label: 'Bénéfice prévu',
      value: stats.totalProfit,
      icon: DollarSign,
      color: stats.totalProfit >= 0 ? 'green' : 'red',
      format: formatCurrency
    },
    {
      label: 'Marge moyenne',
      value: stats.avgMargin,
      icon: Percent,
      color: stats.avgMargin >= 10 ? 'green' : stats.avgMargin >= 5 ? 'orange' : 'red',
      format: (v: number) => `${v.toFixed(1)}%`
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
      green: 'text-green-500 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
      red: 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
      orange: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
      purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        const colorClasses = getColorClasses(stat.color);

        return (
          <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${colorClasses}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 mt-1">
                    {stat.format(stat.value)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
