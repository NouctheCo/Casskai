// Composant de visualisation graphique des budgets
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart } from 'lucide-react';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import type { Budget } from '@/types/budget.types';

interface BudgetChartProps {
  budget: Budget;
}

export const BudgetChart: React.FC<BudgetChartProps> = ({ budget }) => {
  const revenueCategories = budget.budget_categories?.filter(c => c.category_type === 'revenue') || [];
  const expenseCategories = budget.budget_categories?.filter(c => c.category_type === 'expense') || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: getCurrentCompanyCurrency(),
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculatePercentage = (amount: number, total: number) => {
    return total > 0 ? ((amount / total) * 100).toFixed(1) : '0';
  };

  return (
    <div className="space-y-6">
      {/* Revenue Breakdown */}
      {revenueCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <span>Répartition des Revenus</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueCategories.map((category, index) => {
                const percentage = calculatePercentage(category.annual_amount, budget.total_revenue_budget);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {category.category}
                        {category.subcategory && (
                          <span className="text-gray-500 dark:text-gray-300 ml-1">• {category.subcategory}</span>
                        )}
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(category.annual_amount)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all dark:bg-green-900/20"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Breakdown */}
      {expenseCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-red-500" />
              <span>Répartition des Charges</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenseCategories.map((category, index) => {
                const percentage = calculatePercentage(category.annual_amount, budget.total_expense_budget);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {category.category}
                        {category.subcategory && (
                          <span className="text-gray-500 dark:text-gray-300 ml-1">• {category.subcategory}</span>
                        )}
                      </span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(category.annual_amount)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all dark:bg-red-900/20"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span>Répartition Mensuelle</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 dark:text-gray-300 py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p>Graphique de répartition mensuelle à venir</p>
            <p className="text-sm mt-2">Visualisation des flux mensuels prévus</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
