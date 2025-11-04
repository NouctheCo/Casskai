// Composant pour afficher la liste des budgets
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, AlertCircle } from 'lucide-react';
import { BudgetCard } from './BudgetCard';
import type { Budget } from '@/types/budget.types';

interface BudgetListProps {
  budgets: Budget[];
  onEdit: (budget: Budget) => void;
  onDuplicate: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onActivate: (budget: Budget) => void;
  onSubmitForReview: (budget: Budget) => void;
  onViewForecast: (budgetId: string, year: number) => void;
  onCreateBudget: () => void;
}

export const BudgetList: React.FC<BudgetListProps> = ({
  budgets,
  onEdit,
  onDuplicate,
  onDelete,
  onActivate,
  onSubmitForReview,
  onViewForecast,
  onCreateBudget
}) => {
  if (budgets.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Aucun budget trouvé
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Commencez par créer votre premier budget pour gérer vos finances.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onCreateBudget} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Créer un budget
          </Button>
          <Button variant="outline" className="flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            Importer un budget
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          onEdit={() => onEdit(budget)}
          onDuplicate={() => onDuplicate(budget)}
          onDelete={() => onDelete(budget)}
          onActivate={() => onActivate(budget)}
          onSubmitForReview={() => onSubmitForReview(budget)}
          onViewForecast={() => onViewForecast(budget.id, budget.year)}
        />
      ))}
    </div>
  );
};
