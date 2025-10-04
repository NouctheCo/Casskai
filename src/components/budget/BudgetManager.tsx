// Gestionnaire de budgets principal pour CassKai - Version modernisée
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import { BudgetStats } from './BudgetStats';
import { BudgetFilters } from './BudgetFilters';
import { BudgetList } from './BudgetList';
import { useBudgetManager } from '@/hooks/useBudgetManager';
import type { Budget } from '@/types/budget.types';

interface BudgetManagerProps {
  companyId: string;
  onCreateBudget?: () => void;
  onEditBudget?: (budgetId: string) => void;
  onViewForecast?: (budgetId: string, year: number) => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  companyId,
  onCreateBudget,
  onEditBudget,
  onViewForecast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  const {
    budgets,
    loading,
    filter,
    setFilter,
    loadBudgets,
    handleStatusChange,
    handleDuplicate,
    handleDelete
  } = useBudgetManager(companyId);

  const handleDeleteClick = (budget: Budget) => {
    setBudgetToDelete(budget);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return;

    await handleDelete(budgetToDelete.id);
    setShowDeleteDialog(false);
    setBudgetToDelete(null);
  };

  const handleEdit = (budget: Budget) => {
    if (onEditBudget) {
      onEditBudget(budget.id);
    }
  };

  const handleCreateNewBudget = () => {
    if (onCreateBudget) {
      onCreateBudget();
    } else {
      setShowCreateModal(true);
    }
  };

  const handleResetFilters = () => {
    setFilter({});
    setSearchTerm('');
  };

  // Filtrage local complet avec recherche ET filtres
  const filteredBudgets = budgets.filter(budget => {
    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!budget.year.toString().includes(searchLower)) {
        return false;
      }
    }

    // Filtre par année
    if (filter.years && filter.years.length > 0) {
      if (!filter.years.includes(budget.year)) {
        return false;
      }
    }

    // Filtre par statut
    if (filter.status && filter.status.length > 0) {
      if (!filter.status.includes(budget.status)) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestion des Budgets
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Créez et gérez vos budgets annuels avec suivi en temps réel
          </p>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={loadBudgets}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>

          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </Button>

          <Button onClick={handleCreateNewBudget}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Budget
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {budgets.length > 0 && <BudgetStats budgets={budgets} />}

      {/* Filters */}
      <BudgetFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filter={filter}
        setFilter={setFilter}
        onResetFilters={handleResetFilters}
        loading={loading}
      />

      {/* Budget List */}
      <BudgetList
        budgets={filteredBudgets}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteClick}
        onActivate={(budget) => handleStatusChange(budget.id, 'active')}
        onSubmitForReview={(budget) => handleStatusChange(budget.id, 'under_review')}
        onViewForecast={onViewForecast || (() => {})}
        onCreateBudget={handleCreateNewBudget}
      />

      {/* Create Budget Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Créer un nouveau budget</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Choisissez comment créer votre budget
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-4 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
              onClick={() => {
                setShowCreateModal(false);
                handleCreateNewBudget();
              }}
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Partir de zéro</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Créer un budget vierge</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-4 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Utiliser un modèle</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Basé sur des templates sectoriels</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-4 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Dupliquer budget existant</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Reprendre un budget précédent</div>
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
              <span>Confirmer la suppression</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Êtes-vous sûr de vouloir supprimer le budget {budgetToDelete?.year} ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
