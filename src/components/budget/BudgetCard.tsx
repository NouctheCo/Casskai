// Carte individuelle de budget avec actions
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Copy, Download, Trash2, Play, Send, TrendingUp } from 'lucide-react';
import { BudgetStatusBadge } from './BudgetStatusBadge';
import type { Budget } from '@/types/budget.types';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDuplicate: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onActivate?: (budget: Budget) => void;
  onSubmitForReview?: (budget: Budget) => void;
  onViewForecast?: (budgetId: string, year: number) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onEdit,
  onDuplicate,
  onDelete,
  onActivate,
  onSubmitForReview,
  onViewForecast
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const margin = budget.total_revenue_budget > 0
    ? ((budget.net_profit_budget / budget.total_revenue_budget) * 100).toFixed(1)
    : '0';

  return (
    <Card className="hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Budget {budget.year}
            </h3>
            <BudgetStatusBadge status={budget.status} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Version {budget.version}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(budget)}
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(budget)}
              title="Dupliquer"
            >
              <Copy className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              title="Télécharger"
            >
              <Download className="w-4 h-4" />
            </Button>

            {budget.status === 'draft' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(budget)}
                title="Supprimer"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <div className="text-sm text-green-700 dark:text-green-300 font-medium">
              Revenus Budgétés
            </div>
            <div className="text-xl font-bold text-green-800 dark:text-green-200 mt-1">
              {formatCurrency(budget.total_revenue_budget)}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <div className="text-sm text-red-700 dark:text-red-300 font-medium">
              Charges Budgétées
            </div>
            <div className="text-xl font-bold text-red-800 dark:text-red-200 mt-1">
              {formatCurrency(budget.total_expense_budget)}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Bénéfice Prévu
            </div>
            <div className="text-xl font-bold text-blue-800 dark:text-blue-200 mt-1">
              {formatCurrency(budget.net_profit_budget)}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
            <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">
              Marge Prévue
            </div>
            <div className="text-xl font-bold text-purple-800 dark:text-purple-200 mt-1">
              {margin}%
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            Créé le {formatDate(budget.created_at)}
            {budget.updated_at !== budget.created_at && (
              <span> • Modifié le {formatDate(budget.updated_at)}</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {onViewForecast && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewForecast(budget.id, budget.year)}
                className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900/20"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Forecast
              </Button>
            )}

            {budget.status === 'draft' && onSubmitForReview && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSubmitForReview(budget)}
                className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-600 dark:hover:bg-orange-900/20"
              >
                <Send className="w-3 h-3 mr-1" />
                Soumettre pour révision
              </Button>
            )}

            {budget.status === 'approved' && onActivate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onActivate(budget)}
                className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
              >
                <Play className="w-3 h-3 mr-1" />
                Activer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
